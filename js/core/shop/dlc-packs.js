// 书籍补充包（DLC Pack）业务逻辑

import { state, saveState } from '../../state.js';
import { spendCoins, addHistory } from '../../storage.js';
import { DLC_PACKS, REDEEM_CODES } from '../../../data/dlc_packs.js';
import { track } from '../../backend/analytics.js';

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
 * 获取指定 pack 的解锁信息（UI 用）
 */
export function getDlcPackUnlockInfo(packId) {
  const pack = getDlcPack(packId);
  if (!pack) return null;
  return {
    pack,
    unlocked: isDlcPackUnlocked(packId),
    price: pack.price,
    canAfford: (state.coins || 0) >= pack.price
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
 * 购买/解锁 pack（花费智慧之光）
 */
export function purchaseDlcPack(packId) {
  const pack = getDlcPack(packId);
  if (!pack) return { ok: false, reason: 'pack_not_found' };
  if (isDlcPackUnlocked(packId)) return { ok: false, reason: 'already_unlocked' };

  if ((state.coins || 0) < pack.price) {
    return { ok: false, reason: 'insufficient_coins', price: pack.price };
  }

  if (pack.price > 0) {
    spendCoins(pack.price);
  }

  unlockDlcPack(packId);
  addHistory('purchase', `📦 解锁补充包「${pack.title}」`, pack.price > 0 ? `花费${pack.price}智慧之光` : '免费解锁');
  saveState();
  track('unlock_dlc_pack', { pack_id: packId, reason: 'purchase', price: pack.price });

  return { ok: true, pack };
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
