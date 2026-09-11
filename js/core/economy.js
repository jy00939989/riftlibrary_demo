// @pure — testable in Node without DOM
// 经济系统纯函数：定价 / 概率 / 容量级

import { VOLUME_GROUPS, VOLUME_REFRESH, VOLUME_GUARANTEE, isVolumeConsumed, isVolumeGroupCollected } from '../../data/volume_groups.js';
import { getStageThreshold, ATMOSPHERE_STAGES, resolveStageLevel } from '../../data/atmosphere.js';

// ── 氛围阶段（阈值单源在 data/atmosphere.js，D17；阶段字段解析见 D24）──
// stageField 为可选存储字段 state.library.stage：阶段落库后等级以它为准，
// 氛围超阈值但等待升阶仪式时 levelInfo.next 钳为 0（UI 据此切换仪式/等待文案）。
export function getAtmosphereLevel(atmosphere, stageField) {
  const level = resolveStageLevel(atmosphere, stageField);
  const nextThreshold = getStageThreshold(level + 1);
  return {
    level,
    name: ATMOSPHERE_STAGES[level - 1].name,
    next: nextThreshold === null ? 0 : Math.max(0, nextThreshold - atmosphere),
  };
}

// ── 借阅区升级价格 ──
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
export function getPlanePortalPrice(planeId, planePortals = {}) {
  const PLANES = { pastoral: { unlock: { shopUpgrade: 'plane_portal_pastoral' } } };
  const plane = PLANES[planeId];
  if (!plane || !plane.unlock) return 0;
  if (planePortals[plane.unlock.shopUpgrade]) return 0;
  return 800 * 2 + 400;
}

// ── 商店书籍 ──
export function getAvailableBooks(booksData, sharedPool) {
  return sharedPool.filter(b => {
    const bs = booksData[b.bookId];
    if (bs && bs.status !== 'locked') return false;
    // 已合成典藏版的卷组，其单卷不再作为商品出现（locked 语义冲突见 volume_groups.js）
    if (isVolumeConsumed(b.bookId, booksData)) return false;
    return true;
  });
}

/**
 * 计算某条 pool 条目的刷新权重。
 * - 普通书：baseWeight
 * - 单卷：已拥有（无论是否损坏）→ 0；已随典藏版合成消耗 → 0；属于"已部分拥有"的组 → 动态偏置
 */
export function getRefreshWeight(entry, booksData) {
  if (entry.type !== 'volume') return entry.baseWeight ?? 1.0;

  const volState = booksData[entry.bookId];
  // 已拥有（无论是否损坏）→ 不刷；损坏卷走修复室路径，不应再作为新商品出售
  if (volState && volState.status !== 'locked') return 0;
  // 已合成典藏版 → 单卷永久退出商店
  if (isVolumeConsumed(entry.bookId, booksData)) return 0;

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
    // 已合成典藏版的卷组不再参与保底
    if (isVolumeGroupCollected(group, booksData)) return;
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
