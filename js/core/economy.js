// @pure — testable in Node without DOM
// 经济系统纯函数：定价 / 概率 / 容量级

import { VOLUME_GROUPS, VOLUME_REFRESH, VOLUME_GUARANTEE } from '../../data/volume_groups.js';

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

/**
 * 计算某条 pool 条目的刷新权重。
 * - 普通书：baseWeight
 * - 单卷：已拥有（无论是否损坏）→ 0；属于"已部分拥有"的组 → 动态偏置
 */
export function getRefreshWeight(entry, booksData) {
  if (entry.type !== 'volume') return entry.baseWeight ?? 1.0;

  const volState = booksData[entry.bookId];
  // 已拥有（无论是否损坏）→ 不刷；损坏卷走修复室路径，不应再作为新商品出售
  if (volState && volState.status !== 'locked') return 0;

  // 该组已拥有部分卷（但组未集齐）→ 动态轻偏置
  const group = VOLUME_GROUPS[entry.volumeGroupId];
  if (!group) return entry.baseWeight ?? 1.0;

  const owned = group.volumeIds.filter(id => {
    const bs = booksData[id];
    return bs && bs.status !== 'locked';
  }).length;

  if (owned > 0 && owned < group.volumeCount) {
    const ratio = owned / group.volumeCount;
    const bias = VOLUME_REFRESH.minBias + ratio * (VOLUME_REFRESH.maxBias - VOLUME_REFRESH.minBias);
    return (entry.baseWeight ?? 1.0) * bias;
  }

  return entry.baseWeight ?? 1.0;
}

/**
 * 临门一脚保底：返回 gap === 1 的缺失单卷条目，每轮最多 1 条。
 */
export function getGuaranteedVolumeEntries(sharedPool, booksData) {
  if (!VOLUME_GUARANTEE.enabled) return [];

  const candidates = [];
  Object.values(VOLUME_GROUPS).forEach(group => {
    const ownedIds = group.volumeIds.filter(id => {
      const bs = booksData[id];
      return bs && bs.status !== 'locked';
    });
    const missingIds = group.volumeIds.filter(id => !ownedIds.includes(id));
    if (missingIds.length === VOLUME_GUARANTEE.triggerGap) {
      missingIds.forEach(id => {
        const entry = sharedPool.find(p => p.bookId === id && p.type === 'volume');
        if (entry) candidates.push({ group, entry });
      });
    }
  });

  if (candidates.length === 0) return [];
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  return [picked.entry];
}

/** 按权重加权随机抽取一个条目，返回 { entry, index } 或 null */
export function weightedPick(pool, weights) {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return { entry: pool[i], index: i };
  }
  return { entry: pool[pool.length - 1], index: pool.length - 1 };
}

export function hasSignboard(signboards, id) {
  return (signboards || []).includes(id);
}
