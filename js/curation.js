// 书架策展 · 连携计算引擎 — re-export wrapper
// 纯计算逻辑已移至 js/core/curation.js
import { state } from './state.js';
import { calcCurationEffects } from './core/curation.js';
export { calcCurationEffects } from './core/curation.js';

export function getCurationFocusSpeed() {
  return calcCurationEffects(state.library.shelves).totalBonuses.focusSpeed;
}

export function getCurationBorrowBonus() {
  return calcCurationEffects(state.library.shelves).totalBonuses.borrowRate;
}

export function getCurationCoinsBonus() {
  return calcCurationEffects(state.library.shelves).totalBonuses.coinsBonus;
}
