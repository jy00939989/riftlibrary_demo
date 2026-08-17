// 位面传送门业务逻辑
import { state, saveState } from '../../state.js';
import { spendCoins, addHistory, addAtmosphere } from '../../storage.js';
import { PLANES, canUnlockPlane } from '../../../data/planes.js';
import { unlockPlane } from '../../quests.js';
import { getPlanePortalPrice as _getPlanePortalPrice } from '../economy.js';

function getNow() {
  return window.__dev?.getNow?.() || Date.now();
}

export function getPlanePortalPrice(planeId) {
  return _getPlanePortalPrice(planeId, state.library.planePortals || {});
}

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
