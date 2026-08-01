// 商店业务逻辑 —— 状态管理 + 刷新判定 + 购买操作（不碰 DOM）
import { state, saveState } from './state.js';
import { spendCoins, addHistory, addAtmosphere } from './storage.js';
import { SHARED_POOL } from '../data/book_pool.js';
import { SIGNBOARDS } from '../data/signboards.js';
import { PLANES, canUnlockPlane } from '../data/planes.js';
import { unlockPlane } from './quests.js';
import { getAuraShopDiscount, getAuraFocusUpgradeDiscount } from './visitors.js';
import { isManuscriptBoxFull, addToManuscriptBox, createBookRecord } from './capacity.js';
import { getAchievementBonuses } from './achievements.js';
import { getRefreshWeight, getGuaranteedVolumeEntries, weightedPick } from './core/economy.js';

export function hasSignboard(id) {
  return state.signboards.includes(id);
}

function getSignboardSpeedBonus() {
  return hasSignboard('keep_quiet') ? (SIGNBOARDS.keep_quiet?.buff?.value || 0) : 0;
}

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
    // 1. 当前可用商品
    const available = getAvailableBooks();

    // 2. 保底卷：gap === 1 时每轮最多 1 条
    const guaranteed = getGuaranteedVolumeEntries(SHARED_POOL, state.books);

    // 3. 排除保底卷后的候选池（避免保底卷被权重抽中重复出现）
    const guaranteedIds = new Set(guaranteed.map(e => e.bookId));
    const candidates = available.filter(b => !guaranteedIds.has(b.bookId));

    // 4. 新手短书固定位
    const starterBooks = SHARED_POOL.filter(b => b.starter);
    const ownedIds = Object.keys(state.books).filter(id => state.books[id]?.status !== 'locked');
    const starterSlots = starterBooks
      .filter(b => !ownedIds.includes(b.bookId))
      .map(b => ({
        bookId: b.bookId,
        price: b.starterPrice || 200,
        soldAt: null
      }));

    // 5. 固定区：starter + 保底卷 + 权重随机填充至 5 本
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

    // 6. 特价区：从剩余候选中权重抽取 3 本
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

  // 单本补货检查（全刷新后的补货窗口）
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

  // 轮换区单本补货同理
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
        slot.bookId = null; // 池空，占位
      }
    }
  });
}

// 计算买书最终价格（含裴舟光环、馆长推荐标志牌、裴舟荐书折扣）
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

  // 如果买了裴舟推荐的书，清除推荐
  if (peizhouDiscount > 0) {
    state.peizhouRec = null;
  }

  // 标记已售出
  const now = getNow();
  shopState.fixed.forEach(slot => {
    if (slot.bookId === bookId && !slot.soldAt) slot.soldAt = now;
  });
  shopState.rotating.forEach(slot => {
    if (slot.bookId === bookId && !slot.soldAt) slot.soldAt = now;
  });

  saveState();
  return { ok: true };
}

/** 获取当前有效的裴舟荐书（自动过期） */
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
  addAtmosphere(15);
  addHistory('purchase', `借阅区升至 Lv.${state.library.borrowLevel}`, `花费${price}智慧之光 · +15氛围`);
  saveState();
  return true;
}

// 缮写室速率倍率：毎级 +5% + 标志牌 + 连击 + 成就加成
export function getFocusSpeedMultiplier() {
  const b = getAchievementBonuses();
  const streakBonus = (state.focus.streak || 0) * b.streakMultiplier;
  return Math.min(1.80, 1 + (state.library.focusLevel || 0) * b.focusLevelBonus + getSignboardSpeedBonus() + b.speedFlat + streakBonus);
}

// 缮写室价格：400 × 1.45^(n-1)，封顶 5000
export function getFocusLevelPrice() {
  const n = state.library.focusLevel || 0;
  const base = Math.min(5000, Math.round(400 * Math.pow(1.45, n)));
  return Math.round(base * (1 - getAuraFocusUpgradeDiscount()));
}

export function upgradeFocusLevel() {
  const price = getFocusLevelPrice();
  if (state.library.focusLevel >= 6) return false;
  if (!spendCoins(price)) return false;

  state.library.focusLevel += 1;
  addAtmosphere(15);
  addHistory('purchase', `缮写室升至 Lv.${state.library.focusLevel}`, `花费${price}智慧之光 · +15氛围`);
  saveState();
  return true;
}

// 位面传送门价格
export function getPlanePortalPrice(planeId) {
  const plane = PLANES[planeId];
  if (!plane || !plane.unlock) return 0;
  if (state.library.planePortals && state.library.planePortals[plane.unlock.shopUpgrade]) return 0;
  const bookPrice = 800;
  return bookPrice * 2 + 400;
}

// 位面传送门购买
export function purchasePlanePortal(planeId) {
  const plane = PLANES[planeId];
  if (!plane || !plane.unlock) return false;

  const portalKey = plane.unlock.shopUpgrade;
  if (state.library.planePortals && state.library.planePortals[portalKey]) return false;

  if (!canUnlockPlane(planeId, state)) return false;

  const price = getPlanePortalPrice(planeId);
  if (!spendCoins(price)) return false;

  if (!state.library.planePortals) state.library.planePortals = {};
  state.library.planePortals[portalKey] = { purchased: true, purchasedAt: getNow() };

  addAtmosphere(10);
  addHistory('purchase', `🌌 开启位面传送门：${plane.name}`, `花费${price}智慧之光 · +10氛围`);

  unlockPlane(planeId);
  saveState();
  return true;
}

// 标志牌购买
export function purchaseSignboard(signboardId) {
  const def = SIGNBOARDS[signboardId];
  if (!def) return false;
  if (state.signboards.includes(signboardId)) return false;
  if (!spendCoins(def.price)) return false;

  state.signboards.push(signboardId);
  addHistory('purchase', `购置标志牌「${def.name}」`, `花费${def.price}智慧之光`);
  saveState();
  return true;
}

