// 书籍商店业务逻辑
import { state, saveState } from '../../state.js';
import { spendCoins, addHistory } from '../../storage.js';
import { SHARED_POOL } from '../../../data/book_pool.js';
import { getAuraShopDiscount } from '../../visitors.js';
import { SIGNBOARDS } from '../../../data/signboards.js';
import { isManuscriptBoxFull, addToManuscriptBox, createBookRecord } from '../../capacity.js';
import { hasSignboard, getSignboardBuffSum } from './signboards.js';
import { bumpEventTask } from '../event-tasks.js';
import { track } from '../../backend/analytics.js';
import { isBookLockedByDlc } from './dlc-packs.js';
import { isVolumeConsumed } from '../../../data/volume_groups.js';
import { isEventWindowActive } from '../../../data/event_calendar.js';
import {
  getRefreshWeight,
  getGuaranteedVolumeEntries,
  weightedPick
} from '../economy.js';

function getNow() {
  return window.__dev?.getNow?.() || Date.now();
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 书池条目是否在自身活动窗口外（窗口外视为不可刷出/不可购买） */
function isOutsideEventWindow(entry) {
  return !!entry.eventId && !isEventWindowActive(entry.eventId);
}

/**
 * 万圣节特供常驻直购位（2026-10-27 图南拍板：哥特之书不用等刷新，窗口内随时可买）。
 * 窗口外空数组；已购得/已消耗的单卷自动消失。
 * @returns {Array<{bookId:string, soldAt:null}>} 可复用 renderBookSection 的槽位
 */
export function getEventDirectSlots() {
  if (!isEventWindowActive('gothic_night', new Date(getNow()))) return [];
  return SHARED_POOL
    .filter(e => e.eventId === 'gothic_night')
    .filter(e => !(state.books[e.bookId] && state.books[e.bookId].status !== 'locked'))
    .filter(e => !isVolumeConsumed(e.bookId, state.books))
    .map(e => ({ bookId: e.bookId, soldAt: null, price: e.price }));
}

export function getAvailableBooks() {
  return SHARED_POOL.filter(b => {
    const bs = state.books[b.bookId];
    if (bs && bs.status !== 'locked') return false;
    // 已合成典藏版的卷组，其单卷不再作为商品出现
    if (isVolumeConsumed(b.bookId, state.books)) return false;
    if (isBookLockedByDlc(b.bookId)) return false;
    // 活动书：仅在其活动窗口内可刷出（2026-10-22 哥特之夜，plan §六 D9）
    return !isOutsideEventWindow(b);
  });
}

const shopState = {
  fixed: [],
  rotating: [],
  lastRefresh: 0
};

export function getShopState() {
  return shopState;
}

export function ensureShopState() {
  const now = getNow();

  // 活动书窗口过期清理：槽位里的活动书在活动结束后不可再购买，
  // 标记 soldAt 让下方补货路径用窗口内候选替换（2026-10-22 哥特之夜）
  [...shopState.fixed, ...shopState.rotating].forEach(slot => {
    if (!slot.bookId || slot.soldAt) return;
    const entry = SHARED_POOL.find(b => b.bookId === slot.bookId);
    if (entry && isOutsideEventWindow(entry)) {
      slot.soldAt = now - 25 * 3600 * 1000;
    }
  });

  const expired = !shopState.lastRefresh || (now - shopState.lastRefresh) >= 24 * 3600 * 1000;

  if (expired) {
    const available = getAvailableBooks();
    const guaranteed = getGuaranteedVolumeEntries(SHARED_POOL, state.books)
      .filter(e => !isBookLockedByDlc(e.bookId) && !isOutsideEventWindow(e));

    const guaranteedIds = new Set(guaranteed.map(e => e.bookId));
    const candidates = available.filter(b => !guaranteedIds.has(b.bookId));

    const starterBooks = SHARED_POOL.filter(b => b.starter);
    const ownedIds = Object.keys(state.books).filter(id => state.books[id]?.status !== 'locked');
    const starterSlots = starterBooks
      .filter(b => !ownedIds.includes(b.bookId))
      .map(b => ({
        bookId: b.bookId,
        price: b.starterPrice || 200,
        soldAt: null
      }));

    const fixedSlots = [...starterSlots];
    if (guaranteed.length > 0 && !fixedSlots.some(s => s.bookId === guaranteed[0].bookId)) {
      fixedSlots.push({
        bookId: guaranteed[0].bookId,
        price: guaranteed[0].price,
        soldAt: null
      });
    }

    const fixedIds = new Set(fixedSlots.map(s => s.bookId));
    while (fixedSlots.length < 5) {
      const remaining = candidates.filter(b => !fixedIds.has(b.bookId));
      const weights = remaining.map(b => getRefreshWeight(b, state.books));
      const picked = weightedPick(remaining, weights);
      if (!picked) break;
      fixedSlots.push({
        bookId: picked.entry.bookId,
        price: picked.entry.price || rand(500, 800),
        soldAt: null
      });
      fixedIds.add(picked.entry.bookId);
    }

    shopState.fixed = fixedSlots;

    const usedIds = new Set(shopState.fixed.map(s => s.bookId));
    shopState.rotating = [];
    while (shopState.rotating.length < 3) {
      const remaining = candidates.filter(b => !usedIds.has(b.bookId));
      const weights = remaining.map(b => getRefreshWeight(b, state.books));
      const picked = weightedPick(remaining, weights);
      if (!picked) break;
      const originalPrice = picked.entry.price || rand(500, 800);
      const discount = rand(30, 70) / 100;
      shopState.rotating.push({
        bookId: picked.entry.bookId,
        originalPrice,
        discount,
        price: Math.floor(originalPrice * discount),
        soldAt: null
      });
      usedIds.add(picked.entry.bookId);
    }

    shopState.lastRefresh = now;
  }

  shopState.fixed.forEach(slot => {
    if (slot.soldAt && (now - slot.soldAt) >= 24 * 3600 * 1000) {
      const available = getAvailableBooks();
      const usedIds = [...shopState.fixed, ...shopState.rotating]
        .filter(s => s.bookId && !s.soldAt)
        .map(s => s.bookId);
      const candidates = available.filter(b => !usedIds.includes(b.bookId));
      const weights = candidates.map(b => getRefreshWeight(b, state.books));
      const picked = weightedPick(candidates, weights);
      if (picked) {
        Object.assign(slot, { bookId: picked.entry.bookId, price: picked.entry.price || rand(500, 800), soldAt: null });
      }
    }
  });

  shopState.rotating.forEach(slot => {
    if (slot.soldAt && (now - slot.soldAt) >= 24 * 3600 * 1000) {
      const available = getAvailableBooks();
      const usedIds = [...shopState.fixed, ...shopState.rotating]
        .filter(s => s.bookId && !s.soldAt)
        .map(s => s.bookId);
      const candidates = available.filter(b => !usedIds.includes(b.bookId));
      const weights = candidates.map(b => getRefreshWeight(b, state.books));
      const picked = weightedPick(candidates, weights);
      if (picked) {
        const originalPrice = picked.entry.price || rand(500, 800);
        const discount = rand(30, 70) / 100;
        Object.assign(slot, {
          bookId: picked.entry.bookId,
          originalPrice,
          discount,
          price: Math.floor(originalPrice * discount),
          soldAt: null
        });
      } else {
        slot.bookId = null;
      }
    }
  });
}

export function getBookActualPrice(bookId, basePrice) {
  const auraDiscount = getAuraShopDiscount();
  const signboardDiscount = getSignboardBuffSum('shop_discount');
  let peizhouDiscount = 0;
  const rec = getActivePeizhouRec();
  if (rec && rec.bookId === bookId) {
    peizhouDiscount = rec.discount;
  }
  const actualPrice = Math.round(basePrice * (1 - auraDiscount) * (1 - signboardDiscount) * (1 - peizhouDiscount));
  return { actualPrice, auraDiscount, signboardDiscount, peizhouDiscount };
}

export function purchaseBook(bookId, price, { useVoucher = true } = {}) {
  const { actualPrice, auraDiscount, signboardDiscount, peizhouDiscount } = getBookActualPrice(bookId, price);

  if (state.books[bookId] && state.books[bookId].status !== 'locked') {
    return { ok: false, reason: 'already_owned' };
  }
  // 已随典藏版合成消耗的单卷不可再购买（其状态是 locked，需单独拦截）
  if (isVolumeConsumed(bookId, state.books)) {
    return { ok: false, reason: 'already_owned' };
  }
  // 2026-10-27 万圣节书籍兑换券：默认自动抵扣；弹窗里玩家可改选「花币购买」留住券（useVoucher=false）
  const voucherUsed = useVoucher && (state.bookVoucher || 0) > 0;
  if (!voucherUsed && state.coins < actualPrice) {
    return { ok: false, reason: 'insufficient_coins', actualPrice };
  }
  if (isManuscriptBoxFull()) {
    return { ok: false, reason: 'manuscript_box_full' };
  }
  // 兜底：活动书窗口外禁止成交（应对刷新前的陈旧槽位/打开中的购买弹窗）
  const poolEntry = SHARED_POOL.find(b => b.bookId === bookId);
  if (poolEntry && isOutsideEventWindow(poolEntry)) {
    return { ok: false, reason: 'event_ended' };
  }

  // 成交：用券则免币销券，否则扣币
  if (voucherUsed) {
    state.bookVoucher -= 1;
  } else {
    spendCoins(actualPrice);
  }

  state.books[bookId] = createBookRecord();
  addToManuscriptBox(bookId);
  bumpEventTask('open_gothic', bookId); // 万圣巡馆任务①：开卷（内部限定哥特书 id，非活动书安全空操作）

  const title = poolEntry ? poolEntry.title : bookId;
  const parts = [];
  if (voucherUsed) parts.push('🎃兑换券抵扣');
  if (auraDiscount > 0) parts.push('裴舟光环9折');
  if (signboardDiscount > 0) parts.push('馆长推荐98折');
  if (peizhouDiscount > 0) parts.push('裴舟荐书7折');
  const discountNote = parts.length > 0 ? ` (${parts.join('+')})` : '';
  addHistory('purchase', `购买《${title}》${discountNote}`, voucherUsed ? '使用万圣节书籍兑换券 · 免费获得' : `花费${actualPrice}智慧之光`);

  if (peizhouDiscount > 0) {
    state.peizhouRec = null;
  }

  const now = getNow();
  shopState.fixed.forEach(slot => {
    if (slot.bookId === bookId && !slot.soldAt) slot.soldAt = now;
  });
  shopState.rotating.forEach(slot => {
    if (slot.bookId === bookId && !slot.soldAt) slot.soldAt = now;
  });

  saveState();
  track('purchase_book', { book_id: bookId, price: actualPrice });
  track('book_unlock', { book_id: bookId, title });
  return { ok: true };
}

export function getActivePeizhouRec() {
  const rec = state.peizhouRec;
  if (!rec) return null;
  if (Date.now() > rec.expiresAt) {
    state.peizhouRec = null;
    saveState();
    return null;
  }
  return rec;
}
