// Shop / library transaction handlers
import { state, saveState } from '../state.js';
import { spendCoins, addHistory, addAtmosphere } from '../storage.js';
import { upgradeBorrowLevel, checkAutoUnlockPacks } from '../shop.js';
import { checkAchievements, showAchievementBatch } from '../achievements.js';
import { playSfx } from '../audio.js';
import { triggerQuestCheck } from './quest-trigger.js';
import { renderBookshelfPage, renderShopPage, renderVisitorsPage, updateStatusBar } from '../render/index.js';
import { showBorrowAreaUpgrade } from '../render/tutorial-ui.js';
import { showMomoBorrowReadyCard } from '../render/shared/visitor-cards.js';
import { track } from '../backend/index.js';

export function handleBuyShelf() {
  const n = state.library.shelves.length;
  const price = Math.min(4800, 300 * Math.pow(2, n - 1));
  if (spendCoins(price)) {
    state.library.shelves.push([null, null, null, null, null]);
    addAtmosphere(5);
    addHistory('purchase', '购买新书架', `花费${price}智慧之光 · +5氛围`);
    playSfx('buy_success');
    saveState();
    track('purchase_shelf', { shelf_count: state.library.shelves.length, price });
    const achResults = checkAchievements('purchase_shelf');
    showAchievementBatch(achResults);
    renderBookshelfPage();
    updateStatusBar();
  } else {
    alert('智慧之光不足，需要继续专注赚取 💰');
  }
}

export function handleUpgradeBorrowLevel() {
  if (!upgradeBorrowLevel()) {
    alert('智慧之光不足');
    return;
  }
  updateStatusBar();
  playSfx('buy_success');
  renderShopPage();
  renderVisitorsPage();
  showBorrowAreaUpgrade(state.library.borrowLevel);
  triggerQuestCheck('borrow_upgrade');

  if (!state.tutorialFlags.firstBorrowUpgradeDone) {
    state.tutorialFlags.firstBorrowUpgradeDone = true;
    saveState();
    setTimeout(() => showMomoBorrowReadyCard(), 1500);
  }
}
