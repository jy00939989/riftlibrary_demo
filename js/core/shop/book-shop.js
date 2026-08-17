// 书籍商店业务逻辑
import { state, saveState } from '../../state.js';
import { spendCoins, addHistory } from '../../storage.js';
import { SHARED_POOL } from '../../../data/book_pool.js';
import { getAuraShopDiscount } from '../../visitors.js';
import { SIGNBOARDS } from '../../../data/signboards.js';
import { isManuscriptBoxFull, addToManuscriptBox, createBookRecord } from '../../capacity.js';
import { hasSignboard } from './signboards.js';
import { track } from '../../backend/analytics.js';
import { isBookLockedByDlc } from './dlc-packs.js';
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

export function getAvailableBooks() {
  return SHARED_POOL.filter(b => {
    const bs = state.books[b.bookId];
    return (!bs || bs.status === 'locked') && !isBookLockedByDlc(b.bookId);
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
  const expired = !shopState.lastRefresh || (now - shopState.lastRefresh) >= 24 * 3600 * 1000;

  if (expired) {
    const available = getAvailableBooks();
    const guaranteed = getGuaranteedVolumeEntries(SHARED_POOL, state.books)
      .filter(e => !isBookLockedByDlc(e.bookId));

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
  const signboardDiscount = hasSignboard('curator_pick') ? (SIGNBOARDS.curator_pick?.buff?.value || 0) : 0;
  let peizhouDiscount = 0;
  const rec = getActivePeizhouRec();
  if (rec && rec.bookId === bookId) {
    peizhouDiscount = rec.discount;
  }
  const actualPrice = Math.round(basePrice * (1 - auraDiscount) * (1 - signboardDiscount) * (1 - peizhouDiscount));
  return { actualPrice, auraDiscount, signboardDiscount, peizhouDiscount };
}

export function purchaseBook(bookId, price) {
  const { actualPrice, auraDiscount, signboardDiscount, peizhouDiscount } = getBookActualPrice(bookId, price);

  if (state.books[bookId] && state.books[bookId].status !== 'locked') {
    return { ok: false, reason: 'already_owned' };
  }
  if (state.coins < actualPrice) {
    return { ok: false, reason: 'insufficient_coins', actualPrice };
  }
  if (isManuscriptBoxFull()) {
    return { ok: false, reason: 'manuscript_box_full' };
  }

  spendCoins(actualPrice);

  state.books[bookId] = createBookRecord();
  addToManuscriptBox(bookId);

  const poolEntry = SHARED_POOL.find(b => b.bookId === bookId);
  const title = poolEntry ? poolEntry.title : bookId;
  const parts = [];
  if (auraDiscount > 0) parts.push('裴舟光环9折');
  if (signboardDiscount > 0) parts.push('馆长推荐98折');
  if (peizhouDiscount > 0) parts.push('裴舟荐书7折');
  const discountNote = parts.length > 0 ? ` (${parts.join('+')})` : '';
  addHistory('purchase', `购买《${title}》${discountNote}`, `花费${actualPrice}智慧之光`);

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
