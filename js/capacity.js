// 容量与手稿箱模块 —— 纯数据层，无业务模块依赖
// 从 shop.js 拆分，解决 shop.js ↔ visitors.js 循环依赖
import { state, saveState } from './state.js';
import { spendCoins, addHistory } from './storage.js';

// ========== 统一书籍记录工厂 ==========
// 所有模块必须通过此函数创建书籍初始状态，禁止直接写入 state.books

const CANONICAL_BOOK_FIELDS = {
  unlockedChapters: [1],
  copyCount: 0,
  masteryLevel: 0,
  copiedWords: 0,
  status: 'unlocked',
  starred: false,
  damaged: false,
  repairWords: 0,
  readChapters: [],
  reCopyUnlocked: false
};

/**
 * 创建一本新书的初始状态（不写入 state，纯工厂函数）
 * @param {object} [overrides] - 覆盖字段，如 { masteryLevel: 1, status: 'completed' }
 * @returns {object} 规范格式的书籍状态对象
 */
export function createBookRecord(overrides = {}) {
  return { ...CANONICAL_BOOK_FIELDS, ...overrides };
}

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
  const mBox = state.manuscriptBox || [];
  return Object.entries(state.books || {}).filter(([id, b]) => {
    if (!b || b.status === 'locked') return false;
    // 手稿箱中且 status 为 unlocked（未誊抄）→ 不占书架位
    // 手稿箱中且 status 为 completed（待上架）→ 占书架位
    if (mBox.includes(id) && b.status === 'unlocked') return false;
    return true;
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
  if (price <= 0) return false;
  if (!spendCoins(price)) return false;
  state.library.manuscriptSlots = (state.library.manuscriptSlots || 5) + 1;
  addHistory('purchase', `📦 扩充手稿箱至 ${state.library.manuscriptSlots} 格`, `花费${price}智慧之光`);
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
