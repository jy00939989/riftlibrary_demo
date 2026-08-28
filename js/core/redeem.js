// 道具分发与使用核心逻辑
// 负责：兑换码奖励应用、背包道具使用、目标选择器辅助

import { state, saveState } from '../state.js';
import { addCoins, addInspiration, addHistory } from '../storage.js';
import { addSeed } from '../plants.js';
import { hasSignboard, getSignboardBuffSum } from './shop/signboards.js';
import { applyWords, applyRepairProgress, completeBook } from './book-progress.js';
import { VISITOR_DEFS } from '../visitors.js';
import { track } from '../backend/analytics.js';
import { ITEMS, getItemDef, isItemUsable, itemRequiresTarget } from '../../data/items.js';
import { SIGNBOARDS } from '../../data/signboards.js';
import { BOOKS } from '../../data/books.js';
import { isBookEligibleForBrush as _isBookEligibleForBrush } from './book-eligibility.js';
import { updateStatusBar } from '../render/common.js';
import { showCertificate } from '../render/certificate.js';

const MAX_FAVOR = 600;

/**
 * 应用兑换码奖励到本地 state
 * @param {object} rewards
 * @param {string} [codeType]
 */
export function applyRedeemRewards(rewards, codeType) {
  rewards = rewards || {};

  // 货币
  if (rewards.coins) addCoins(rewards.coins);
  if (rewards.inspiration) addInspiration(rewards.inspiration);

  // 种子
  if (rewards.seeds) {
    Object.entries(rewards.seeds).forEach(([seedType, count]) => {
      addSeed(seedType, count);
    });
  }

  // 消耗型道具
  if (rewards.items) {
    if (!state.inventory) state.inventory = {};
    Object.entries(rewards.items).forEach(([itemId, count]) => {
      state.inventory[itemId] = (state.inventory[itemId] || 0) + count;
    });
  }

  // 纪念标志牌
  if (rewards.signboards) {
    rewards.signboards.forEach(signboardId => {
      if (!hasSignboard(signboardId)) {
        state.signboards.push(signboardId);
      }
    });
  }

  // 审计 + 埋点
  addHistory('redeem', '兑换礼包', `获得 ${formatRewardSummary(rewards)}`);
  track('redeem_code_success', { code_type: codeType || 'unknown' });

  saveState();
  updateStatusBar();

  return true;
}

/** 把奖励对象格式化为简短中文摘要 */
export function formatRewardSummary(rewards) {
  const parts = [];
  if (rewards.coins) parts.push(`${rewards.coins}智慧之光`);
  if (rewards.inspiration) parts.push(`${rewards.inspiration}灵感`);
  if (rewards.seeds) {
    Object.entries(rewards.seeds).forEach(([type, count]) => parts.push(`${count}${type}种子`));
  }
  if (rewards.items) {
    Object.entries(rewards.items).forEach(([id, count]) => {
      const def = getItemDef(id);
      parts.push(`${count}${def ? def.name : id}`);
    });
  }
  if (rewards.signboards) {
    rewards.signboards.forEach(id => {
      const def = SIGNBOARDS[id];
      parts.push(def ? `「${def.name}」` : id);
    });
  }
  return parts.join(' · ') || '空';
}

/* ---------- 背包道具操作 ---------- */

export function getInventoryCount(itemId) {
  return (state.inventory && state.inventory[itemId]) || 0;
}

export function hasItem(itemId, count = 1) {
  return getInventoryCount(itemId) >= count;
}

export function addItem(itemId, count = 1) {
  if (!state.inventory) state.inventory = {};
  state.inventory[itemId] = (state.inventory[itemId] || 0) + count;
  saveState();
}

export function spendItem(itemId, count = 1) {
  if (!hasItem(itemId, count)) return false;
  state.inventory[itemId] -= count;
  if (state.inventory[itemId] <= 0) delete state.inventory[itemId];
  saveState();
  return true;
}

/**
 * 使用道具
 * @param {string} itemId
 * @param {string} [target] 目标 ID（书籍/角色）
 * @returns {object} { ok: boolean, message?: string, result?: object }
 */
export function useItem(itemId, target) {
  const def = getItemDef(itemId);
  if (!def) return { ok: false, message: '道具不存在' };
  if (!hasItem(itemId, 1)) return { ok: false, message: '道具数量不足' };

  const category = def.category;

  if (category === 'brush') {
    return useBrush(itemId, target);
  }
  if (category === 'repair') {
    return useRepairScroll(target);
  }
  if (category === 'favor') {
    return useFavorNote(itemId, target);
  }

  return { ok: false, message: '该道具无法直接使用' };
}

function getBookTitle(bookId) {
  return BOOKS[bookId]?.title || bookId;
}

function useBrush(itemId, bookId) {
  const def = getItemDef(itemId);
  const words = def.effect?.value || 0;
  if (!bookId) return { ok: false, message: '请先选择一本书' };

  const bookState = state.books[bookId];
  if (!bookState) return { ok: false, message: '书籍不存在' };

  const result = applyWords(bookId, words);
  if (!result) return { ok: false, message: '无法应用字数' };

  // 若笔类道具直接完成本书，触发完整完成流程（奖励、上架、证书）
  let completed = null;
  if (result.didComplete) {
    completed = completeBook(bookId);
    const book = BOOKS[bookId];
    if (book) {
      setTimeout(() => showCertificate(book), 300);
    }
  }

  spendItem(itemId, 1);

  let msg = `《${getBookTitle(bookId)}》誊抄进度 +${words.toLocaleString()} 字`;
  if (result.didComplete) {
    msg += '，书籍完成！';
  }

  updateStatusBar();
  return { ok: true, message: msg, result: { ...result, completed } };
}

function useRepairScroll(bookId) {
  if (!bookId) return { ok: false, message: '请先选择一本损坏的书' };

  const bookState = state.books[bookId];
  if (!bookState || !bookState.damaged) {
    return { ok: false, message: '该书未损坏' };
  }

  const repairAmount = bookState.repairWords || 0;
  const result = applyRepairProgress(bookId, repairAmount);
  if (!result) return { ok: false, message: '无法修复该书' };

  spendItem('repair_scroll', 1);

  updateStatusBar();
  return {
    ok: true,
    message: result.repairCompleted
      ? `《${result.repairBookTitle}》已修复完成`
      : '修复进度已推进',
    result
  };
}

function useFavorNote(itemId, charId) {
  const def = getItemDef(itemId);
  const amount = def.effect?.value || 0;

  if (itemId === 'favor_note_random') {
    const allIds = Object.keys(VISITOR_DEFS);
    if (allIds.length === 0) return { ok: false, message: '没有可赠送的角色' };
    charId = allIds[Math.floor(Math.random() * allIds.length)];
  }

  if (!charId || !VISITOR_DEFS[charId]) {
    return { ok: false, message: '请先选择一名角色' };
  }

  if (!state.visitorFavors) state.visitorFavors = {};
  const current = state.visitorFavors[charId] || 0;
  state.visitorFavors[charId] = Math.min(MAX_FAVOR, current + amount);

  spendItem(itemId, 1);
  saveState();
  updateStatusBar();

  const charName = VISITOR_DEFS[charId].name || charId;
  return {
    ok: true,
    message: `「${charName}」好感度 +${amount}（当前 ${state.visitorFavors[charId]}）`,
    result: { charId, charName, gained: amount }
  };
}

/* ---------- 选择器辅助 ---------- */

/** 判断某本书是否可作为笔类道具目标 */
export function isBookEligibleForBrush(bookId) {
  return _isBookEligibleForBrush(bookId, state.books[bookId]);
}

/** 获取可作为笔类目标的书籍列表 */
export function getEligibleBooksForBrush() {
  return Object.keys(BOOKS).filter(id => isBookEligibleForBrush(id));
}

/** 获取损坏的书籍列表 */
export function getDamagedBooks() {
  return Object.entries(state.books || {})
    .filter(([id, bs]) => bs && bs.damaged)
    .map(([id]) => id);
}

/** 获取已解锁角色列表 */
export function getUnlockedVisitors() {
  return Object.keys(VISITOR_DEFS);
}

/** 获取道具需要的目标类型 */
export function getItemTargetType(itemId) {
  return itemRequiresTarget(itemId);
}

/** 判断道具是否可直接使用（无需选择目标） */
export function isItemDirectUse(itemId) {
  return itemRequiresTarget(itemId) === null && isItemUsable(itemId);
}

/* ---------- buff 聚合辅助 ---------- */

export { getSignboardBuffSum } from './shop/signboards.js';
