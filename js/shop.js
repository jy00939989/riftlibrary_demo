// 商店业务逻辑统一入口 —— 薄 shim，向后兼容
export {
  getAvailableBooks, ensureShopState, getShopState, purchaseBook,
  getBookActualPrice, getActivePeizhouRec
} from './core/shop/book-shop.js';

export {
  getDlcPacks, getDlcPack, isDlcPackUnlocked, isBookLockedByDlc,
  getDlcPackUnlockInfo, purchaseDlcPack, redeemDlcCode,
  unlockDlcPack, checkAutoUnlockPacks
} from './core/shop/dlc-packs.js';

export {
  upgradeBorrowLevel, getBorrowLevelPrice,
  upgradeFocusLevel, getFocusLevelPrice, getFocusSpeedMultiplier
} from './core/shop/library-upgrades.js';

export { getPlanePortalPrice, purchasePlanePortal } from './core/shop/plane-portals.js';

export { purchaseSignboard, hasSignboard } from './core/shop/signboards.js';
