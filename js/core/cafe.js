// 咖啡角业务逻辑（cafe-corner-plan v3.1）
// 建造/升级/制作/自动营业/维持费/休眠/时间跳跃补算
// 耦合契约（架构评审 A3）：本模块只写 visitor.pendingBorrowBuff 与 visitor.status/ cafe 字段；
// Borrow（visitors.js attemptBorrow）只读 pendingBorrowBuff，互不直写对方内部计算。
import { state, saveState } from '../state.js';
import { spendCoins, addCoins, addHistory } from '../storage.js';
import { getTodayKey } from './day-boundary.js';
import { spendSeed } from '../plants.js';
import { PLANT_TYPES } from '../../data/plants.js';
import {
  CAFE_BUILD_STAGE, CAFE_BUILD_PRICE, CAFE_MAX_LEVEL,
  CAFE_UPGRADE_BASE, CAFE_UPGRADE_GROWTH, CAFE_FEE_PER_LEVEL,
  CAFE_SERVE_PROBABILITY, CAFE_STAY_MS,
  CAFE_BORROW_BUFF_PER_LEVEL, CAFE_FAVOR_MULT_STEP,
  getCafeRecipe, getRecipesForLevel
} from '../../data/cafe.js';
import { getFacilityLevelCap } from '../../data/atmosphere.js';
import { isFestivalActive } from '../../data/festival.js';
import { getLibraryStage } from '../storage.js';
import { t } from '../i18n/terms.js';

function getNow() {
  return window.__dev?.getNow?.() || Date.now();
}

// ========== 建造与升级（§2.2） ==========

export function isCafeBuilt() {
  return !!(state.cafe && state.cafe.unlocked && state.cafe.level > 0);
}

export function canBuildCafe() {
  if (isCafeBuilt()) return false;
  if (getLibraryStage() < CAFE_BUILD_STAGE) return false;
  return state.coins >= CAFE_BUILD_PRICE;
}

export function buildCafe() {
  if (!canBuildCafe()) return false;
  spendCoins(CAFE_BUILD_PRICE);
  state.cafe.unlocked = true;
  state.cafe.level = 1;
  addHistory('cafe', '☕ 咖啡角开张了', `花费${CAFE_BUILD_PRICE}智慧之光 · 香草茶/玫瑰露可制作`);
  saveState();
  return true;
}

/** 等级上限 = min(5, 设施帽 stage+1)（§2.2 复用 getFacilityLevelCap） */
export function getCafeLevelCap() {
  return Math.min(CAFE_MAX_LEVEL, getFacilityLevelCap(state.library.atmosphere || 0, state.library.stage));
}

/** 升级费 400×1.6^level（Lv1→2 640 … 升满 ~5,800） */
export function getCafeUpgradePrice() {
  return Math.round(CAFE_UPGRADE_BASE * Math.pow(CAFE_UPGRADE_GROWTH, state.cafe.level));
}

export function canUpgradeCafe() {
  if (!isCafeBuilt()) return false;
  if (state.cafe.level >= getCafeLevelCap()) return false;
  return state.coins >= getCafeUpgradePrice();
}

export function upgradeCafe() {
  if (!canUpgradeCafe()) return false;
  spendCoins(getCafeUpgradePrice());
  state.cafe.level += 1;
  const unlocked = getRecipesForLevel(state.cafe.level)
    .filter(r => r.unlockLevel === state.cafe.level)
    .filter(r => !r.festivalKey || isFestivalActive(r.festivalKey));
  const extra = unlocked.length > 0 ? ` · 新食谱：${unlocked.map(r => r.emoji).join(' ')}` : '';
  addHistory('cafe', `☕ 咖啡角升级到 Lv.${state.cafe.level}`, `借书概率增益 +${state.cafe.level * 5}% · 好感 ×${(1 + CAFE_FAVOR_MULT_STEP * (state.cafe.level - 1)).toFixed(1)}${extra}`);
  saveState();
  return true;
}

// ========== 制作与库存（§2.3） ==========

export function getCafeStock(recipeId) {
  return (state.cafe && state.cafe.stock[recipeId]) || 0;
}

export function getCafeStockTotal() {
  if (!state.cafe) return 0;
  return Object.values(state.cafe.stock).reduce((sum, n) => sum + (n || 0), 0);
}

export function canCraftRecipe(recipeId) {
  const recipe = getCafeRecipe(recipeId);
  if (!recipe || !isCafeBuilt()) return false;
  if (state.cafe.level < recipe.unlockLevel) return false;
  return (state.seeds[recipe.material.seedType] || 0) >= recipe.material.count;
}

export function craftRecipe(recipeId) {
  if (!canCraftRecipe(recipeId)) return false;
  const recipe = getCafeRecipe(recipeId);
  spendSeed(recipe.material.seedType, recipe.material.count);
  state.cafe.stock[recipeId] = (state.cafe.stock[recipeId] || 0) + 1;
  const seedDef = PLANT_TYPES[recipe.material.seedType];
  addHistory('cafe', `☕ 制作了${recipe.emoji} ${t(recipe.nameKey)}`, `消耗 ${seedDef ? seedDef.emoji : ''}${recipe.material.count} 颗种子`);
  saveState();
  return true;
}

// ========== 营业（§2.4） ==========

export function getCafeDailyFee() {
  return CAFE_FEE_PER_LEVEL * (state.cafe ? state.cafe.level : 0);
}

export function isCafeDormant() {
  return !!(state.cafe && state.cafe.dormant);
}

/** 库存加权随机取用（§2.4.2 D6：件数多者优先消耗） */
export function pickWeightedStock() {
  const entries = Object.entries(state.cafe.stock).filter(([, n]) => n > 0);
  const total = entries.reduce((sum, [, n]) => sum + n, 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const [id, n] of entries) {
    r -= n;
    if (r <= 0) return id;
  }
  return entries[entries.length - 1][0];
}

/**
 * 单次招待结算（§2.4.3/§2.4.4）：玩家得售价、访客好感×等级乘区、
 * 进店 buff 写入 pendingBorrowBuff（A3 契约：只写这个字段）。
 * 产出不加氛围（EXP 纪律 §2.4.5）。
 */
function serveVisitor(visitor, now) {
  const recipeId = pickWeightedStock();
  if (!recipeId) return false;
  const recipe = getCafeRecipe(recipeId);
  const level = state.cafe.level;

  state.cafe.stock[recipeId] -= 1;
  addCoins(recipe.price);
  const favorGain = Math.round(recipe.favor * (1 + CAFE_FAVOR_MULT_STEP * (level - 1)));
  visitor.favorability = (visitor.favorability || 0) + favorGain;
  visitor.pendingBorrowBuff = CAFE_BORROW_BUFF_PER_LEVEL * level;
  visitor.status = 'cafe';
  visitor.cafeEnterTime = now;
  state.cafe.totalServed += 1;
  state.cafe.lastServeDay = getTodayKey(now);

  addHistory('cafe', `☕ ${visitor.emoji} ${visitor.name} 进店点了${recipe.emoji} ${t(recipe.nameKey)}`,
    `+${recipe.price}智慧之光 · 好感+${favorGain} · 借书概率增益生效`);
  return true;
}

/**
 * 咖啡角 tick（挂在 tickVisitorBrowsing 入口、borrowChance 判定之前——v3 D9）。
 * 顺序：在店返回 → 休眠判定/唤醒 → 当日维持费（lastFeeDay 防重，不足则休眠）→ 进店判定。
 * 维持费口径：活跃游戏日（有营业 tick）才收；离线冻结不补扣（A6/A7/A8）。
 */
export function cafeTick(now = getNow()) {
  const cafe = state.cafe;
  if (!cafe || !cafe.unlocked || cafe.level === 0) return;

  // 在店访客到点返回浏览
  state.visitors.forEach(v => {
    if (v.status === 'cafe' && now - (v.cafeEnterTime || 0) >= CAFE_STAY_MS) {
      v.status = 'browsing';
    }
  });

  const fee = getCafeDailyFee();

  // 休眠唤醒：金币回升至当日维持费以上自动恢复
  if (cafe.dormant) {
    if (state.coins >= fee) {
      cafe.dormant = false;
      addHistory('cafe', '☕ 咖啡角恢复营业', '金币已够支付当日维持费');
    } else {
      return;
    }
  }

  // 当日维持费：首次营业 tick 扣除（lastFeeDay 防重复）
  const today = getTodayKey(now);
  if (cafe.lastFeeDay !== today) {
    if (state.coins >= fee) {
      spendCoins(fee);
      cafe.lastFeeDay = today;
      addHistory('cafe', '☕ 支付咖啡角维持费', `-${fee}智慧之光（20×Lv${cafe.level}）`);
    } else {
      cafe.dormant = true;
      // 增益不生效：清掉未消费的进店 buff
      state.visitors.forEach(v => { v.pendingBorrowBuff = 0; });
      addHistory('cafe', '☕ 咖啡角进入休眠', '金币不足以支付维持费，暂停营业；金币回升自动唤醒');
      saveState();
      return;
    }
  }

  // 进店判定：每个 browsing 访客独立 25%；在店数 < 同时接待上限（=等级，D14 并发语义）
  const cap = cafe.level;
  let inStore = state.visitors.filter(v => v.status === 'cafe').length;
  for (const visitor of state.visitors) {
    if (inStore >= cap) break;
    if (getCafeStockTotal() <= 0) break;
    if (visitor.status !== 'browsing') continue;
    if (Math.random() >= CAFE_SERVE_PROBABILITY) continue;
    if (serveVisitor(visitor, now)) inStore += 1;
  }
}

/**
 * 时间跳跃补算（§2.4.6 D8）：补算次数 = min(floor(hours/6), 座位数, 库存可用数, 2×座位数)。
 * 消耗真实库存、有封顶；休眠中不补算；维持费不随跳跃补扣（活跃日 tick 口径，lastFeeDay 防重）。
 */
export function cafeOnTimeSkip(hours, now = getNow()) {
  const cafe = state.cafe;
  if (!cafe || !cafe.unlocked || cafe.level === 0 || cafe.dormant) return 0;
  const seats = cafe.level;
  const budget = Math.min(Math.floor(hours / 6), seats, getCafeStockTotal(), 2 * seats);
  if (budget <= 0) return 0;

  let served = 0;
  let revenue = 0;
  for (let i = 0; i < budget; i++) {
    const recipeId = pickWeightedStock();
    if (!recipeId) break;
    const recipe = getCafeRecipe(recipeId);
    cafe.stock[recipeId] -= 1;
    addCoins(recipe.price);
    revenue += recipe.price;
    cafe.totalServed += 1;
    served += 1;
  }
  if (served > 0) {
    cafe.lastServeDay = getTodayKey(now);
    addHistory('cafe', `☕ 时间跳跃期间咖啡角招待了 ${served} 位访客`, `+${revenue}智慧之光（补算封顶 ${2 * seats} 次）`);
    saveState();
  }
  return served;
}
