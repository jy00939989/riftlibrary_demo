// 标志牌业务逻辑
import { state, saveState } from '../../state.js';
import { spendCoins, addHistory } from '../../storage.js';
import { SIGNBOARDS } from '../../../data/signboards.js';

export function hasSignboard(id) {
  return (state.signboards || []).includes(id);
}

/** 通用标志牌 buff 聚合：累加所有已拥有标志牌中指定 type 的 value */
export function getSignboardBuffSum(type) {
  const boards = state.signboards || [];
  let sum = 0;
  for (const id of boards) {
    const def = SIGNBOARDS[id];
    if (!def || !def.buff) continue;
    if (def.buff.type === type) {
      sum += Number(def.buff.value) || 0;
    }
  }
  return sum;
}

/** 获取所有已拥有标志牌定义 */
export function getOwnedSignboards() {
  return (state.signboards || [])
    .map(id => SIGNBOARDS[id])
    .filter(Boolean);
}

export function purchaseSignboard(signboardId) {
  const def = SIGNBOARDS[signboardId];
  if (!def) return false;
  if (hasSignboard(signboardId)) return false;
  // 限量纪念牌（price === 0 且带专属 image）只能通过兑换码获得，不可商店购买
  if (def.price === 0 && def.image) return false;
  if (!spendCoins(def.price)) return false;

  state.signboards.push(signboardId);
  addHistory('purchase', `购置标志牌「${def.name}」`, `花费${def.price}智慧之光`);
  saveState();
  return true;
}
