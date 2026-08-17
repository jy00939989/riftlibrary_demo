// 标志牌业务逻辑
import { state, saveState } from '../../state.js';
import { spendCoins, addHistory } from '../../storage.js';
import { SIGNBOARDS } from '../../../data/signboards.js';

export function hasSignboard(id) {
  return (state.signboards || []).includes(id);
}

export function purchaseSignboard(signboardId) {
  const def = SIGNBOARDS[signboardId];
  if (!def) return false;
  if (hasSignboard(signboardId)) return false;
  if (!spendCoins(def.price)) return false;

  state.signboards.push(signboardId);
  addHistory('purchase', `购置标志牌「${def.name}」`, `花费${def.price}智慧之光`);
  saveState();
  return true;
}
