// 图书馆升级业务逻辑：借阅区 + 缮写室
import { state, saveState } from '../../state.js';
import { spendCoins, addHistory, addAtmosphere } from '../../storage.js';
import { getAuraFocusUpgradeDiscount } from '../../visitors.js';
import { getAchievementBonuses } from '../../achievements.js';
import { getBorrowLevelPrice as _getBorrowLevelPrice, getFocusLevelPrice as _getFocusLevelPrice, getFocusSpeedMultiplier as _getFocusSpeedMultiplier } from '../economy.js';
import { SIGNBOARDS } from '../../../data/signboards.js';
import { MUSIC_ROOM_UNLOCK_PRICE } from '../../../data/music.js';
import { FACILITY_EXP_PER_LEVEL, getFacilityLevelCap } from '../../../data/atmosphere.js';
import { hasSignboard, getSignboardBuffSum } from './signboards.js';
import { isNoMasteryBook } from '../book-eligibility.js';
import { track } from '../../backend/analytics.js';

// 精通书籍提供的全局专注倍率加成
const MASTERY_SPEED_BONUS_PER_BOOK = 0.001; // 每本 +0.1%
const MASTERY_SPEED_BONUS_CAP = 0.20;       // 上限 +20%

// 连击（连续专注日）速率加成封顶：30 天（2026-09-11 图南拍板——streak 线性无限撞旧 180% 顶，
// 封顶后整体上限提到 200%，满 build 玩家恰好可达，streak 之后只剩每 7 天 50 币奖励）
const STREAK_BONUS_CAP_DAYS = 30;

export function getBorrowLevelPrice() {
  return _getBorrowLevelPrice(state.library.borrowLevel || 0);
}

export function upgradeBorrowLevel() {
  const lv = state.library.borrowLevel || 0;
  if (lv >= 7) return false;
  if (lv + 1 > getFacilityLevelCap(state.library.atmosphere, state.library.stage)) return false; // D22 阶段门槛
  const price = getBorrowLevelPrice();
  if (!spendCoins(price)) return false;

  state.library.borrowLevel = lv + 1;
  const exp = state.library.borrowLevel * FACILITY_EXP_PER_LEVEL; // D19 等级×20
  addAtmosphere(exp);
  addHistory('purchase', `借阅区升至 Lv.${state.library.borrowLevel}`, `花费${price}智慧之光 · +${exp}氛围`);
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
  const streakBonus = Math.min(STREAK_BONUS_CAP_DAYS, state.focus.streak || 0) * b.streakMultiplier;
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
  const lv = state.library.focusLevel || 0;
  if (lv >= 6) return false;
  if (lv + 1 > getFacilityLevelCap(state.library.atmosphere, state.library.stage)) return false; // D22 阶段门槛
  const price = getFocusLevelPrice();
  if (!spendCoins(price)) return false;

  state.library.focusLevel = lv + 1;
  const exp = state.library.focusLevel * FACILITY_EXP_PER_LEVEL; // D19 等级×20
  addAtmosphere(exp);
  addHistory('purchase', `缮写室升至 Lv.${state.library.focusLevel}`, `花费${price}智慧之光 · +${exp}氛围`);
  saveState();
  track('purchase_focus_level', { level: state.library.focusLevel, price });
  return true;
}

export function isMusicRoomUnlocked() {
  return !!state.musicRoom?.unlocked;
}

export function unlockMusicRoom() {
  if (isMusicRoomUnlocked()) return false;
  if (!spendCoins(MUSIC_ROOM_UNLOCK_PRICE)) return false;

  if (!state.musicRoom) state.musicRoom = { unlocked: false, tracks: [] };
  state.musicRoom.unlocked = true;
  addAtmosphere(15);
  addHistory('purchase', '留声阁开门迎客', `花费${MUSIC_ROOM_UNLOCK_PRICE}智慧之光 · +15氛围`);
  saveState();
  track('purchase_music_room', { price: MUSIC_ROOM_UNLOCK_PRICE });
  return true;
}
