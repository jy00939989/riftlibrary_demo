// 书架策展 · 连携计算引擎
// 只依赖 state（纯数据层）和 BOOKS/CURATION_PAIRS（数据配置），无业务模块依赖
import { state } from './state.js';
import { BOOKS } from '../data/books.js';
import { CURATION_PAIRS } from '../data/curation_pairs.js';

const CHAIN_BONUS = { 3: 0.01, 4: 0.015, 5: 0.02 };

/**
 * 扫描单排书架，找出连续同 attribute 的段落
 * @param {string[]} row - 一排 5 个 bookId|null
 * @param {number} shelfIdx
 * @param {string} attr - 'category' | 'era'
 * @returns {Array} chains
 */
function scanRow(row, shelfIdx, attr) {
  const chains = [];
  let start = -1;
  for (let i = 0; i <= row.length; i++) {
    const currentId = i < row.length ? row[i] : null;
    const currentVal = currentId && BOOKS[currentId] ? BOOKS[currentId][attr] : null;

    if (start === -1) {
      if (currentVal) { start = i; }
      continue;
    }

    const startVal = BOOKS[row[start]]?.[attr];

    if (currentVal === startVal) {
      continue;
    }

    const length = i - start;
    if (length >= 3) {
      chains.push({
        type: attr,
        value: startVal,
        length,
        shelfIdx,
        startSlot: start,
        endSlot: i - 1,
        bonus: CHAIN_BONUS[length] || CHAIN_BONUS[5]
      });
    }
    start = currentVal ? i : -1;
  }
  return chains;
}

/**
 * 扫描单排书架，找出同排内的作者配对
 */
function scanPairs(row, shelfIdx) {
  const bookSet = new Set(row.filter(Boolean));
  const found = [];
  for (const pair of CURATION_PAIRS) {
    if (pair.books.every(bid => bookSet.has(bid))) {
      found.push({
        pairId: pair.id,
        books: pair.books,
        shelfIdx,
        name: pair.name,
        momoComment: pair.momoComment,
        bonus: pair.reward.coinsBonus || 0.03
      });
    }
  }
  return found;
}

/**
 * 全量计算策展效果。传入 shelves 是为了支持纯函数模式；
 * 不传参数则读取 state.library.shelves。
 * @param {string[][]} [shelves]
 * @returns {{ chains, pairs, totalBonuses }}
 */
export function calcCurationEffects(shelves) {
  const rows = shelves || state.library.shelves;
  if (!rows || !Array.isArray(rows)) {
    return { chains: [], pairs: [], totalBonuses: { focusSpeed: 0, borrowRate: 0, coinsBonus: 0 } };
  }

  const allChains = [];
  const allPairs = [];

  rows.forEach((row, shelfIdx) => {
    if (!Array.isArray(row)) return;
    allChains.push(...scanRow(row, shelfIdx, 'category'));
    allChains.push(...scanRow(row, shelfIdx, 'era'));
    allPairs.push(...scanPairs(row, shelfIdx));
  });

  return {
    chains: allChains,
    pairs: allPairs,
    totalBonuses: {
      focusSpeed: allChains.filter(c => c.type === 'category').reduce((s, c) => s + c.bonus, 0),
      borrowRate: allChains.filter(c => c.type === 'era').reduce((s, c) => s + c.bonus, 0),
      coinsBonus: allPairs.reduce((s, p) => s + p.bonus, 0)
    }
  };
}

/** 策展缮写速度加成 */
export function getCurationFocusSpeed() {
  return calcCurationEffects().totalBonuses.focusSpeed;
}

/** 策展借阅率加成 */
export function getCurationBorrowBonus() {
  return calcCurationEffects().totalBonuses.borrowRate;
}

/** 策展智慧之光加成 */
export function getCurationCoinsBonus() {
  return calcCurationEffects().totalBonuses.coinsBonus;
}
