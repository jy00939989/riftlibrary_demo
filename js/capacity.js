// 容量与手稿箱模块 —— 纯数据层，无业务模块依赖
// 从 shop.js 拆分，解决 shop.js ↔ visitors.js 循环依赖
import { state, saveState } from './state.js';
import { spendCoins, addHistory } from './storage.js';
import { createBookRecord } from './core/book-utils.js';

// 为了向后兼容，继续导出 createBookRecord
export { createBookRecord } from './core/book-utils.js';

/**
 * 解锁一本书并放入手稿箱（一步完成：创建记录 + 写入 state + 入箱）
 * @param {string} bookId
 * @param {object} [overrides] - 覆盖字段
 * @returns {boolean} 是否成功
 */
export function unlockBook(bookId, overrides = {}) {
  if (state.books[bookId] && state.books[bookId].status !== 'locked') return false;
  if (isManuscriptBoxFull()) return false;
  state.books[bookId] = createBookRecord(overrides);
  addToManuscriptBox(bookId);
  return true;
}

// ========== 书架容量 ==========

const SHELF_CAPACITY = 5;

/** 确保 shelves 是新格式 [[null,...], ...]，兼容旧数据 */
export function normalizeShelves() {
  if (!state.library.shelves || state.library.shelves.length === 0) {
    state.library.shelves = [[null, null, null, null, null]];
  }
  // 旧格式 [1, 2]（数字数组）→ 新格式
  if (typeof state.library.shelves[0] === 'number') {
    state.library.shelves = state.library.shelves.map(() => Array(SHELF_CAPACITY).fill(null));
  }
  // 确保每个架子都是 5 元素数组
  state.library.shelves = state.library.shelves.map(shelf =>
    Array.isArray(shelf) && shelf.length === SHELF_CAPACITY ? shelf : Array(SHELF_CAPACITY).fill(null)
  );
}

/** 查找书架第一个空位，写入 bookId。找不到返回 false */
export function placeOnShelf(bookId) {
  normalizeShelves();
  for (const shelf of state.library.shelves) {
    for (let i = 0; i < shelf.length; i++) {
      if (shelf[i] === null) {
        shelf[i] = bookId;
        saveState();
        return true;
      }
    }
  }
  return false;
}

/** 书架是否有空位 */
export function hasShelfSpace() {
  normalizeShelves();
  return state.library.shelves.some(shelf => shelf.some(slot => slot === null));
}

export function getBookCapacity() {
  normalizeShelves();
  return state.library.shelves.length * SHELF_CAPACITY;
}

export function getOwnedBookCount() {
  normalizeShelves();
  const mBox = state.manuscriptBox || [];
  // 收集所有已在书架上的书
  const shelfBookIds = new Set();
  state.library.shelves.forEach(shelf => {
    shelf.forEach(slot => { if (slot) shelfBookIds.add(slot); });
  });

  return Object.entries(state.books || {}).filter(([id, b]) => {
    if (!b || b.status === 'locked') return false;
    // 已在书架上 → 占位
    if (shelfBookIds.has(id)) return true;
    // 手稿箱中且已完成（待上架）→ 占位
    if (mBox.includes(id) && b.status === 'completed') return true;
    // 其他状态（unlocked/copying 仍在誊抄中）→ 不占书架位
    return false;
  }).length;
}

export function isBookCapacityFull() {
  return getOwnedBookCount() >= getBookCapacity();
}

// ========== 手稿箱 ==========

export function getManuscriptSlots() {
  return state.library.manuscriptSlots || 5;
}

export function getManuscriptBoxCount() {
  return (state.manuscriptBox || []).length;
}

export function isManuscriptBoxFull() {
  return getManuscriptBoxCount() >= getManuscriptSlots();
}

export function getManuscriptSlotPrice() {
  const current = getManuscriptSlots();
  // 前5格免费，第6格10，第7格25，之后陡峭
  if (current < 5) return 0;
  if (current === 5) return 10;
  if (current === 6) return 25;
  // 第8格起：80 × 2.5^(n-8)，封顶5000
  const n = current + 1; // 下一格编号
  return Math.min(5000, Math.round(80 * Math.pow(2.5, n - 8)));
}

export function expandManuscriptSlots() {
  const price = getManuscriptSlotPrice();
  if (price > 0 && !spendCoins(price)) return false;
  state.library.manuscriptSlots = (state.library.manuscriptSlots || 5) + 1;
  addHistory('purchase', `📦 扩充手稿箱至 ${state.library.manuscriptSlots} 格`, price > 0 ? `花费${price}智慧之光` : '免费扩容');
  saveState();
  return true;
}

export function addToManuscriptBox(bookId) {
  if (!state.manuscriptBox) state.manuscriptBox = [];
  if (isManuscriptBoxFull()) return false;
  if (state.manuscriptBox.includes(bookId)) return true; // 已在箱中
  state.manuscriptBox.push(bookId);
  saveState();
  return true;
}

export function removeFromManuscriptBox(bookId) {
  if (!state.manuscriptBox) return false;
  const idx = state.manuscriptBox.indexOf(bookId);
  if (idx === -1) return false;
  state.manuscriptBox.splice(idx, 1);
  saveState();
  return true;
}

export function isInManuscriptBox(bookId) {
  return state.manuscriptBox ? state.manuscriptBox.includes(bookId) : false;
}

// ========== 修缮箱（古籍修复室）==========

import { isVolumeBookId } from '../data/volume_groups.js';

const DEFAULT_RESTORATION_SLOTS = 3;
const MAX_RESTORATION_SLOTS = 20;

export function getRestorationBoxSlots() {
  return Math.min(MAX_RESTORATION_SLOTS, state.restorationBoxSlots || DEFAULT_RESTORATION_SLOTS);
}

export function getRestorationBoxCount() {
  return (state.restorationBox || []).length;
}

export function isRestorationBoxFull() {
  return getRestorationBoxCount() >= getRestorationBoxSlots();
}

export function canStoreInRestorationBox(bookId) {
  if (!isVolumeBookId(bookId)) return false;
  const bs = state.books[bookId];
  if (!bs || bs.status === 'locked') return false;
  if (isRestorationBoxFull()) return false;
  if ((state.restorationBox || []).includes(bookId)) return false;
  return true;
}

export function storeInRestorationBox(bookId) {
  if (!canStoreInRestorationBox(bookId)) return false;
  if (!state.restorationBox) state.restorationBox = [];
  state.restorationBox.push(bookId);
  saveState();
  return true;
}

export function removeFromRestorationBox(bookId) {
  if (!state.restorationBox) return false;
  const idx = state.restorationBox.indexOf(bookId);
  if (idx === -1) return false;
  state.restorationBox.splice(idx, 1);
  saveState();
  return true;
}

export function isInRestorationBox(bookId) {
  return state.restorationBox ? state.restorationBox.includes(bookId) : false;
}

/** 修缮箱扩容价格 */
export function getRestorationSlotPrice() {
  const current = getRestorationBoxSlots();
  if (current >= MAX_RESTORATION_SLOTS) return 0;
  if (current <= 3) return 0;
  if (current === 4) return 50;
  if (current === 5) return 100;
  if (current === 6) return 200;
  if (current === 7) return 400;
  if (current === 8) return 800;
  return Math.min(5000, Math.round(800 * Math.pow(1.5, current - 8)));
}

export function expandRestorationBoxSlots() {
  const current = getRestorationBoxSlots();
  if (current >= MAX_RESTORATION_SLOTS) return false;
  const price = getRestorationSlotPrice();
  if (price > 0 && !spendCoins(price)) return false;
  state.restorationBoxSlots = current + 1;
  if (price > 0) {
    addHistory('purchase', `📦 扩充修缮箱至 ${state.restorationBoxSlots} 格`, `花费${price}智慧之光`);
  }
  saveState();
  return true;
}

// ========== 古籍修复室等级 ==========

const MAX_RESTORATION_LEVEL = 5;
const RESTORATION_UNLOCK_PRICE = 300; // 解锁 Lv0（开放修复室）的价格

export function isRestorationUnlocked() {
  return !!state.restorationUnlocked;
}

export function getRestorationUnlockPrice() {
  return RESTORATION_UNLOCK_PRICE;
}

export function unlockRestorationRoom() {
  if (state.restorationUnlocked) return false;
  if (!spendCoins(RESTORATION_UNLOCK_PRICE)) return false;
  state.restorationUnlocked = true;
  state.restorationLevel = 0;
  addHistory('purchase', `📜 解锁古籍修复室`, `花费${RESTORATION_UNLOCK_PRICE}智慧之光`);
  saveState();
  return true;
}

export function getRestorationLevel() {
  if (!state.restorationUnlocked) return 0;
  return Math.min(MAX_RESTORATION_LEVEL, state.restorationLevel || 0);
}

/** 修复室升级价格：400 × 1.45^n，封顶 5000 */
export function getRestorationUpgradePrice() {
  const level = getRestorationLevel();
  if (level >= MAX_RESTORATION_LEVEL) return 0;
  return Math.min(5000, Math.round(400 * Math.pow(1.45, level)));
}

export function upgradeRestorationLevel() {
  if (!state.restorationUnlocked) return false;
  const level = getRestorationLevel();
  if (level >= MAX_RESTORATION_LEVEL) return false;
  const price = getRestorationUpgradePrice();
  if (price > 0 && !spendCoins(price)) return false;
  state.restorationLevel = level + 1;
  addHistory('purchase', `📜 古籍修复室升至 Lv.${state.restorationLevel}`, `花费${price}智慧之光 · 修复速度 +5%`);
  saveState();
  return true;
}

/**
 * 修复时的额外速度加成（不含基础的 5%）。
 * Lv0: 0%，Lv1: 5%，... Lv5: 25%
 */
export function getRestorationRepairSpeedBonus() {
  if (!state.restorationUnlocked) return 0;
  return (getRestorationLevel() || 0) * 0.05;
}
