// 书籍补充包（DLC Pack）业务逻辑

import { state, saveState } from '../../state.js';
import { spendInspiration, addHistory } from '../../storage.js';
import { DLC_PACKS, REDEEM_CODES } from '../../../data/dlc_packs.js';
import { track } from '../../backend/analytics.js';

// 首包特惠：玩家第一次用灵感解锁任意 pack 时所需灵感
export const FIRST_PACK_INSPIRATION_COST = 60;
// 后续 pack 默认原价（可在 data/dlc_packs.js 中按 pack 覆盖）
export const DEFAULT_PACK_INSPIRATION_COST = 120;

const PACK_MAP = new Map(DLC_PACKS.map(p => [p.id, p]));

function normalizeCode(code) {
  return (code || '').trim().toUpperCase();
}

/**
 * 获取所有 pack 定义
 */
export function getDlcPacks() {
  return DLC_PACKS.filter(p => p.visible !== false).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

/**
 * 获取指定 pack
 */
export function getDlcPack(packId) {
  return PACK_MAP.get(packId) || null;
}

/**
 * 判断 pack 是否已解锁
 */
export function isDlcPackUnlocked(packId) {
  return (state.dlcPacks?.unlocked || []).includes(packId);
}

/**
 * 判断某本书是否被未解锁的 pack 锁定
 */
export function isBookLockedByDlc(bookId) {
  const pack = DLC_PACKS.find(p => p.bookIds.includes(bookId));
  if (!pack) return false;
  return !isDlcPackUnlocked(pack.id);
}

/**
 * 计算指定 pack 的当前灵感解锁成本
 * - 若玩家尚未解锁任何 pack，享受首包特惠
 * - 否则使用 pack.inspirationCost，未配置则取默认值 120
 */
export function getPackInspirationCost(packId) {
  const pack = getDlcPack(packId);
  if (!pack) return null;
  const hasAnyPack = (state.dlcPacks?.unlocked || []).length > 0;
  if (!hasAnyPack) return FIRST_PACK_INSPIRATION_COST;
  return pack.inspirationCost ?? DEFAULT_PACK_INSPIRATION_COST;
}

/**
 * 获取指定 pack 的解锁信息（UI 用）
 */
export function getDlcPackUnlockInfo(packId) {
  const pack = getDlcPack(packId);
  if (!pack) return null;
  const cost = getPackInspirationCost(packId);
  const isFirstPack = (state.dlcPacks?.unlocked || []).length === 0;
  return {
    pack,
    unlocked: isDlcPackUnlocked(packId),
    inspirationCost: cost,
    isFirstPackDiscount: isFirstPack && cost < (pack.inspirationCost ?? DEFAULT_PACK_INSPIRATION_COST),
    canAfford: (state.inspiration || 0) >= cost
  };
}

/**
 * 标记 pack 为已解锁（内部公共函数，不发送 track）
 */
export function unlockDlcPack(packId) {
  if (!state.dlcPacks) state.dlcPacks = { unlocked: [], redeemedCodes: [] };
  if (!state.dlcPacks.unlocked.includes(packId)) {
    state.dlcPacks.unlocked.push(packId);
  }
}

/**
 * 购买/解锁 pack（花费灵感）
 */
export function purchaseDlcPack(packId) {
  const pack = getDlcPack(packId);
  if (!pack) return { ok: false, reason: 'pack_not_found' };
  if (isDlcPackUnlocked(packId)) return { ok: false, reason: 'already_unlocked' };

  const cost = getPackInspirationCost(packId);

  if ((state.inspiration || 0) < cost) {
    return { ok: false, reason: 'insufficient_inspiration', inspirationCost: cost };
  }

  if (cost > 0) {
    spendInspiration(cost);
  }

  unlockDlcPack(packId);
  const priceText = cost > 0 ? `花费${cost}灵感` : '免费解锁';
  addHistory('purchase', `📦 解锁补充包「${pack.title}」`, priceText);
  saveState();
  track('unlock_dlc_pack', { pack_id: packId, reason: 'purchase', inspiration_cost: cost });

  return { ok: true, pack, inspirationCost: cost };
}

/**
 * 使用兑换码解锁 pack
 */
export function redeemDlcCode(code) {
  const normalized = normalizeCode(code);
  if (!normalized) return { ok: false, error: 'empty_code' };

  const redeemed = state.dlcPacks?.redeemedCodes || [];
  if (redeemed.includes(normalized)) {
    return { ok: false, error: 'already_redeemed' };
  }

  const packIds = REDEEM_CODES[normalized];
  if (!packIds || packIds.length === 0) {
    return { ok: false, error: 'invalid_code' };
  }

  const unlockedPacks = [];
  packIds.forEach(packId => {
    if (!isDlcPackUnlocked(packId)) {
      unlockDlcPack(packId);
      unlockedPacks.push(packId);
    }
  });

  if (!state.dlcPacks) state.dlcPacks = { unlocked: [], redeemedCodes: [] };
  state.dlcPacks.redeemedCodes.push(normalized);
  saveState();
  track('redeem_dlc_code', { code: normalized, unlocked_packs: unlockedPacks });

  return { ok: true, unlockedPacks };
}

/**
 * 旧存档兼容：若玩家已拥有 pack 内全部书籍，自动解锁该 pack
 * @returns {string[]} 本次自动解锁的 pack ids
 */
export function checkAutoUnlockPacks() {
  const newlyUnlocked = [];
  DLC_PACKS.forEach(pack => {
    if (isDlcPackUnlocked(pack.id)) return;
    const allOwned = pack.bookIds.every(bookId => {
      const bs = state.books[bookId];
      return bs && bs.status !== 'locked';
    });
    if (allOwned) {
      unlockDlcPack(pack.id);
      newlyUnlocked.push(pack.id);
    }
  });
  if (newlyUnlocked.length > 0) {
    saveState();
  }
  return newlyUnlocked;
}
