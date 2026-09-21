// Shop page entry point — orchestrates all shop sections and countdown lifecycle
// 2026-09-21：馆内装潢区退役（图南决策）——植物购买迁入温室独立页，标志牌收编展览厅
import { el } from '../common.js';
import { ensureShopState, getShopState } from '../../shop.js';
import { t } from '../../i18n/terms.js';
import { renderDlcPacksSection } from '../dlc-packs.js';
import { renderLibraryUpgrades } from './library-upgrades.js';
import { renderBookSection } from './book-section.js';
import { cleanupTimer, startCountdownTimer } from './countdown.js';

export function renderShopPage() {
  cleanupTimer();
  ensureShopState();
  const shopState = getShopState();

  const container = document.getElementById('page-shop');
  if (!container) return;
  container.innerHTML = '';

  const wrapper = el('div', 'space-y-6');

  // ========== DLC Packs ==========
  renderDlcPacksSection(wrapper);

  // ========== Library Upgrades ==========
  wrapper.appendChild(renderLibraryUpgrades());

  // ========== New Books ==========
  wrapper.appendChild(renderBookSection(`📚 ${t('newBooksInStock')}`, shopState.fixed, false));
  wrapper.appendChild(renderBookSection(`🔥 ${t('limitedTimeOffer')}`, shopState.rotating, true));

  container.appendChild(wrapper);

  // Start countdown timer (updates text only, does not rebuild DOM)
  startCountdownTimer();
}

window.renderShopPage = renderShopPage;
