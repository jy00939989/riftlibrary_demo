// @pure — testable in Node without DOM
// 书架策展 · 连携计算引擎
import { BOOKS } from '../../data/books.js';
import { CURATION_PAIRS } from '../../data/curation_pairs.js';

const CHAIN_BONUS = { 3: 0.01, 4: 0.015, 5: 0.02 };

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

// ── 纯函数（核心）──
// shelves 参数为必传（与旧版不同），调用方负责传入
export function calcCurationEffects(shelves) {
  if (!shelves || !Array.isArray(shelves)) {
    return { chains: [], pairs: [], totalBonuses: { focusSpeed: 0, borrowRate: 0, coinsBonus: 0 } };
  }

  const allChains = [];
  const allPairs = [];

  shelves.forEach((row, shelfIdx) => {
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
