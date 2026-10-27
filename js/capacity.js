// 容量与手稿箱模块 —— 纯数据层，无业务模块依赖
// 从 shop.js 拆分，解决 shop.js ↔ visitors.js 循环依赖
import { state, saveState } from './state.js';
import { spendCoins, addHistory, addAtmosphere } from './storage.js';
import { createBookRecord } from './core/book-utils.js';
import { FACILITY_EXP_PER_LEVEL, getFacilityLevelCap } from '../data/atmosphere.js';

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

// ========== 卷册匣（原修缮箱；古籍修复室）==========

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

/** 卷册匣扩容价格 */
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
    addHistory('purchase', `📦 扩充卷册匣至 ${state.restorationBoxSlots} 格`, `花费${price}智慧之光`);
  }
  saveState();
  return true;
}

// ========== 古籍修复室等级 ==========

const MAX_RESTORATION_LEVEL = 5;

export function isRestorationUnlocked() {
  return !!state.restorationUnlocked;
}

/** Lv0 免费开放（2026-09-21 图南拍板，撤销 300 币解锁）：金币消耗全部移到升级，
 *  杜绝「书坏了 → 损坏书不能外借 → 金币收入砍断 → 攒不出解锁费」的软锁。
 *  两个入口：首次修复受损书籍时自动点亮（disasters.js / visitors.js 受灾路径调用）；
 *  玩家也可在修复室页主动免费修缮。幂等。 */
export function grantRestorationRoom() {
  if (state.restorationUnlocked) return false;
  state.restorationUnlocked = true;
  state.restorationLevel = 0;
  addHistory('event', `📜 古籍修复室的灯亮了`, `受损的书籍有了归处——修复室免费开放`);
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
  if (level + 1 > getFacilityLevelCap(state.library.atmosphere, state.library.stage)) return false; // D22 阶段门槛
  const price = getRestorationUpgradePrice();
  if (price > 0 && !spendCoins(price)) return false;
  state.restorationLevel = level + 1;
  // 保养预约冲抵（servicing-room-plan v3 图南拍板）：等级多送的格冲抵已购格，防"先买后升"双付。
  // 早买=提前支取：总格全程不缩水（如 Lv0 买满 4 格升到 Lv4 → purchased 归 0，总格仍 6）。
  state.servicingSlotsPurchased = Math.max(0, (state.servicingSlotsPurchased || 0) - 1);
  const exp = state.restorationLevel * FACILITY_EXP_PER_LEVEL; // D19 等级×20
  addAtmosphere(exp);
  addHistory('purchase', `📜 古籍修复室升至 Lv.${state.restorationLevel}`, `花费${price}智慧之光 · 修复速度 +10% · 保养预约 ${getServicingSlots()} 格 · +${exp}氛围`);
  saveState();
  return true;
}

/**
 * 修复时的额外速度加成。
 * Lv0: 0%，Lv1: 10%，... Lv5: 50%（2026-09-21 由 5%/级 拉大为 10%/级，给升级更实的体感）
 */
export function getRestorationRepairSpeedBonus() {
  if (!state.restorationUnlocked) return 0;
  return (getRestorationLevel() || 0) * 0.10;
}

/**
 * 保养批次上限（book-maintenance-plan v2 决策 3）：Lv0→1 / Lv1→2 / Lv2→3 / Lv3+→4。
 * Lv4/Lv5 封顶 4 是设计意图（plan v2 评审钉子#2）：等级收益集中在修复速度，批次只开到 4。
 */
export function getMaintenanceBatchCap() {
  const lv = getRestorationLevel() || 0;
  if (lv <= 0) return 1;
  if (lv === 1) return 2;
  if (lv === 2) return 3;
  return 4;
}

// ========== 保养预约格位（锁定待修，servicing-room-plan v3）==========
// 与卷册匣（restorationBox，卷组收纳）正交；占用数在 core/servicing.js 维护。

const BASE_SERVICING_SLOTS = 2;
const MAX_SERVICING_SLOTS = 6;

/** 总格数 = min(6, 2 + 修复室等级 + 已购格数)；升级送格不改升级价（v1 拍板），升级时冲抵已购格（v3 拍板防双付） */
export function getServicingSlots() {
  const lv = getRestorationLevel();
  const purchased = state.servicingSlotsPurchased || 0;
  return Math.min(MAX_SERVICING_SLOTS, BASE_SERVICING_SLOTS + lv + purchased);
}

/** 扩容价目：按当前总格数的下一格取值（3→30 / 4→80 / 5→200 / 6→500）；满 6 返回 0 */
export function getServicingSlotPrice() {
  const current = getServicingSlots();
  if (current >= MAX_SERVICING_SLOTS) return 0;
  if (current <= 2) return 30;
  if (current === 3) return 80;
  if (current === 4) return 200;
  return 500;
}

export function expandServicingSlots() {
  const price = getServicingSlotPrice();
  if (price === 0) return false;
  if (!spendCoins(price)) return false;
  state.servicingSlotsPurchased = (state.servicingSlotsPurchased || 0) + 1;
  addHistory('purchase', `📅 扩充保养预约至 ${getServicingSlots()} 格`, `花费${price}智慧之光`);
  saveState();
  return true;
}
