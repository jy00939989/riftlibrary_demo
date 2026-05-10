// 商店业务逻辑 —— 状态管理 + 刷新判定 + 购买操作（不碰 DOM）
import { state, saveState } from './state.js';
import { spendCoins, addHistory } from './storage.js';
import { SHARED_POOL } from '../data/book_pool.js';

function getNow() {
  return window.__dev?.getNow?.() || Date.now();
}

// 模块级状态，不持久化（技术债）
const shopState = {
  fixed: [],
  rotating: [],
  lastRefresh: 0
};

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getAvailableBooks() {
  return SHARED_POOL.filter(b => {
    const bs = state.books[b.bookId];
    return !bs || bs.status === 'locked';
  });
}

export function getShopState() {
  return shopState;
}

export function ensureShopState() {
  const now = getNow();
  const expired = !shopState.lastRefresh || (now - shopState.lastRefresh) >= 24 * 3600 * 1000;

  if (expired) {
    const available = getAvailableBooks();
    const shuffled = shuffle(available);

    // 固定区5本
    shopState.fixed = shuffled.slice(0, 5).map(b => ({
      bookId: b.bookId,
      price: rand(500, 800),
      soldAt: null
    }));

    // 特价区3本（从 shuffle 里取，与固定区不重复）
    shopState.rotating = shuffled.slice(5, 8).map(b => {
      const originalPrice = rand(500, 800);
      const discount = rand(30, 70) / 100;
      return {
        bookId: b.bookId,
        originalPrice,
        discount,
        price: Math.floor(originalPrice * discount),
        soldAt: null
      };
    });

    shopState.lastRefresh = now;
  }

  // 单本补货检查（全刷新后的补货窗口）
  shopState.fixed.forEach(slot => {
    if (slot.soldAt && (now - slot.soldAt) >= 24 * 3600 * 1000) {
      const available = getAvailableBooks();
      const usedIds = [...shopState.fixed, ...shopState.rotating]
        .filter(s => s.bookId && !s.soldAt)
        .map(s => s.bookId);
      const newBook = available.find(b => !usedIds.includes(b.bookId));
      if (newBook) {
        Object.assign(slot, { bookId: newBook.bookId, price: rand(500, 800), soldAt: null });
      }
    }
  });

  // 轮换区单本补货同理
  shopState.rotating.forEach(slot => {
    if (slot.soldAt && (now - slot.soldAt) >= 24 * 3600 * 1000) {
      const available = getAvailableBooks();
      const usedIds = [...shopState.fixed, ...shopState.rotating]
        .filter(s => s.bookId && !s.soldAt)
        .map(s => s.bookId);
      const newBook = available.find(b => !usedIds.includes(b.bookId));
      if (newBook) {
        const originalPrice = rand(500, 800);
        const discount = rand(30, 70) / 100;
        Object.assign(slot, {
          bookId: newBook.bookId,
          originalPrice,
          discount,
          price: Math.floor(originalPrice * discount),
          soldAt: null
        });
      } else {
        slot.bookId = null; // 池空，占位
      }
    }
  });
}

export function purchaseBook(bookId, price) {
  if (state.coins < price) return false;
  if (state.books[bookId] && state.books[bookId].status !== 'locked') return false;

  spendCoins(price);

  state.books[bookId] = {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'unlocked',
    starred: false,
    damaged: false,
    repairWords: 0
  };

  const poolEntry = SHARED_POOL.find(b => b.bookId === bookId);
  const title = poolEntry ? poolEntry.title : bookId;
  addHistory('purchase', `购买《${title}》`, `花费${price}代币`);

  // 标记已售出
  const now = getNow();
  shopState.fixed.forEach(slot => {
    if (slot.bookId === bookId && !slot.soldAt) slot.soldAt = now;
  });
  shopState.rotating.forEach(slot => {
    if (slot.bookId === bookId && !slot.soldAt) slot.soldAt = now;
  });

  saveState();
  return true;
}

// 借阅区价格：500 × 1.5^(n-1)，封顶 5700
export function getBorrowLevelPrice() {
  const n = state.library.borrowLevel || 0; // n = 当前等级，升级到 n+1
  return Math.min(5700, Math.round(500 * Math.pow(1.5, n)));
}

export function upgradeBorrowLevel() {
  const price = getBorrowLevelPrice();
  if (state.library.borrowLevel >= 7) return false;
  if (!spendCoins(price)) return false;

  state.library.borrowLevel += 1;
  addHistory('purchase', `借阅区升至 Lv.${state.library.borrowLevel}`, `花费${price}代币`);
  saveState();
  return true;
}
