// @pure — testable in Node without DOM
// 经济系统纯函数：定价 / 概率 / 容量级

// ── 借阅区等级配置表 ──
const BORROW_LEVEL_TABLE = [
  null,
  { cap:2, returnCoins:30, favorBonus:0,  returnAtmo:1, spawnBonus:0.05 },
  { cap:3, returnCoins:35, favorBonus:10, returnAtmo:1, spawnBonus:0.08 },
  { cap:6, returnCoins:40, favorBonus:20, returnAtmo:3, spawnBonus:0.12 },
  { cap:7, returnCoins:45, favorBonus:30, returnAtmo:3, spawnBonus:0.16 },
  { cap:8, returnCoins:50, favorBonus:40, returnAtmo:5, spawnBonus:0.20 },
  { cap:9, returnCoins:55, favorBonus:50, returnAtmo:5, spawnBonus:0.25 },
  { cap:10,returnCoins:60, favorBonus:60, returnAtmo:8, spawnBonus:0.30 }
];

// ── 氛围阶段 ──
export function getAtmosphereLevel(atmosphere) {
  if (atmosphere <= 30) return { level: 1, name: '废墟' };
  if (atmosphere <= 80) return { level: 2, name: '破败' };
  if (atmosphere <= 160) return { level: 3, name: '陈旧' };
  if (atmosphere <= 300) return { level: 4, name: '温暖' };
  return { level: 5, name: '星辰' };
}

// ── 借阅区 ──
export function getBorrowLevelConfig(borrowLevel) {
  return BORROW_LEVEL_TABLE[borrowLevel] || { cap:1, returnCoins:30, favorBonus:0, returnAtmo:0, spawnBonus:0 };
}

export function getVisitorCap(borrowLevel, auraCapBonus) {
  const cfg = getBorrowLevelConfig(borrowLevel);
  return (cfg.cap || 1) + (auraCapBonus || 0);
}

export function getBorrowSpawnBonus(borrowLevel) {
  return getBorrowLevelConfig(borrowLevel).spawnBonus || 0;
}

export function getBorrowLevelPrice(borrowLevel) {
  return Math.min(5700, Math.round(500 * Math.pow(1.5, borrowLevel)));
}

// ── 缮写室 ──
export function getFocusLevelPrice(focusLevel, auraDiscount) {
  const base = Math.min(5000, Math.round(400 * Math.pow(1.45, focusLevel)));
  return Math.round(base * (1 - (auraDiscount || 0)));
}

export function getFocusSpeedMultiplier(focusLevel, signboardSpeedBonus, achieveSpeedFlat, streakBonus) {
  return Math.min(1.80, 1 + (focusLevel || 0) * 0.05 + (signboardSpeedBonus || 0) + (achieveSpeedFlat || 0) + (streakBonus || 0));
}

// ── 手稿箱 ──
export function getManuscriptSlotPrice(currentSlots) {
  if (currentSlots < 5) return 0;
  if (currentSlots === 5) return 10;
  if (currentSlots === 6) return 25;
  const n = currentSlots + 1;
  return Math.min(5000, Math.round(80 * Math.pow(2.5, n - 8)));
}

// ── 书架容量 ──
const SHELF_CAPACITY = 5;

export function getBookCapacity(shelves) {
  return (shelves || []).length * SHELF_CAPACITY;
}

export function getOwnedBookCount(booksData, shelves, manuscriptBox) {
  const allShelfIds = new Set();
  (shelves || []).forEach(shelf => {
    if (Array.isArray(shelf)) shelf.forEach(id => { if (id) allShelfIds.add(id); });
  });
  const mBox = manuscriptBox || [];
  return Object.entries(booksData || {}).filter(([id, b]) => {
    if (!b || b.status === 'locked') return false;
    // 已在书架上 → 占位
    if (allShelfIds.has(id)) return true;
    // 手稿箱中且已完成（待上架）→ 占位
    if (mBox.includes(id) && b.status === 'completed') return true;
    // 其他状态（unlocked/copying 仍在誊抄中）→ 不占书架位
    return false;
  }).length;
}

export function isBookCapacityFull(booksData, shelves, manuscriptBox) {
  return getOwnedBookCount(booksData, shelves, manuscriptBox) >= getBookCapacity(shelves);
}

export function getManuscriptSlots(library) {
  return (library && library.manuscriptSlots) || 5;
}

export function getManuscriptBoxCount(manuscriptBox) {
  return (manuscriptBox || []).length;
}

export function isManuscriptBoxFull(manuscriptBox, library) {
  return getManuscriptBoxCount(manuscriptBox) >= getManuscriptSlots(library);
}

// ── 位面 ──
export function getPlanePortalPrice(planeId) {
  const PLANES = { pastoral: { unlock: { shopUpgrade: 'plane_portal_pastoral' } } };
  const plane = PLANES[planeId];
  if (!plane || !plane.unlock) return 0;
  return 800 * 2 + 400;
}

// ── 商店书籍 ──
export function getAvailableBooks(booksData, sharedPool) {
  return sharedPool.filter(b => {
    const bs = booksData[b.bookId];
    return !bs || bs.status === 'locked';
  });
}

export function hasSignboard(signboards, id) {
  return (signboards || []).includes(id);
}
