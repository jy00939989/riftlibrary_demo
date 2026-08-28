// 图书馆升级业务逻辑：借阅区 + 缮写室
import { state, saveState } from '../../state.js';
import { spendCoins, addHistory, addAtmosphere } from '../../storage.js';
import { getAuraFocusUpgradeDiscount } from '../../visitors.js';
import { getAchievementBonuses } from '../../achievements.js';
import { getBorrowLevelPrice as _getBorrowLevelPrice, getFocusLevelPrice as _getFocusLevelPrice, getFocusSpeedMultiplier as _getFocusSpeedMultiplier } from '../economy.js';
import { SIGNBOARDS } from '../../../data/signboards.js';
import { hasSignboard, getSignboardBuffSum } from './signboards.js';
import { isNoMasteryBook } from '../book-eligibility.js';
import { track } from '../../backend/analytics.js';

// 精通书籍提供的全局专注倍率加成
const MASTERY_SPEED_BONUS_PER_BOOK = 0.001; // 每本 +0.1%
const MASTERY_SPEED_BONUS_CAP = 0.20;       // 上限 +20%

export function getBorrowLevelPrice() {
  return _getBorrowLevelPrice(state.library.borrowLevel || 0);
}

export function upgradeBorrowLevel() {
  const price = getBorrowLevelPrice();
  if (state.library.borrowLevel >= 7) return false;
  if (!spendCoins(price)) return false;

  state.library.borrowLevel += 1;
  addAtmosphere(15);
  addHistory('purchase', `借阅区升至 Lv.${state.library.borrowLevel}`, `花费${price}智慧之光 · +15氛围`);
  saveState();
  track('purchase_borrow_level', { level: state.library.borrowLevel, price });
  return true;
}

function getSignboardSpeedBonus() {
  return getSignboardBuffSum('focus_speed');
}

/** 统计已精通普通书数量，返回全局专注倍率加成 */
export function getMasteredBookSpeedBonus() {
  let count = 0;
  Object.entries(state.books || {}).forEach(([bookId, bs]) => {
    if (!bs || isNoMasteryBook(bookId)) return;
    if ((bs.masteryLevel || 0) >= 5) count++;
  });
  return Math.min(MASTERY_SPEED_BONUS_CAP, count * MASTERY_SPEED_BONUS_PER_BOOK);
}

export function getFocusSpeedMultiplier() {
  const b = getAchievementBonuses();
  const streakBonus = (state.focus.streak || 0) * b.streakMultiplier;
  const signboardBonus = getSignboardSpeedBonus();
  const masteryBonus = getMasteredBookSpeedBonus();
  return _getFocusSpeedMultiplier(
    state.library.focusLevel || 0,
    signboardBonus + masteryBonus,
    b.speedFlat,
    streakBonus
  );
}

export function getFocusLevelPrice() {
  return _getFocusLevelPrice(state.library.focusLevel || 0, getAuraFocusUpgradeDiscount());
}

export function upgradeFocusLevel() {
  const price = getFocusLevelPrice();
  if (state.library.focusLevel >= 6) return false;
  if (!spendCoins(price)) return false;

  state.library.focusLevel += 1;
  addAtmosphere(15);
  addHistory('purchase', `缮写室升至 Lv.${state.library.focusLevel}`, `花费${price}智慧之光 · +15氛围`);
  saveState();
  track('purchase_focus_level', { level: state.library.focusLevel, price });
  return true;
}
