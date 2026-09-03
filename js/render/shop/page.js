// Shop page entry point — orchestrates all shop sections and countdown lifecycle
import { el } from '../common.js';
import { ensureShopState, getShopState } from '../../shop.js';
import { t } from '../../i18n/terms.js';
import { renderDlcPacksSection } from '../dlc-packs.js';
import { renderLibraryUpgrades } from './library-upgrades.js';
import { renderBookSection } from './book-section.js';
import { renderAmbientShop } from './ambient-shop.js';
import { renderDecorationShop } from './decorations.js';
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

  // ========== Ambient Sounds ==========
  wrapper.appendChild(renderAmbientShop());

  // ========== Decorations ==========
  wrapper.appendChild(renderDecorationShop());

  container.appendChild(wrapper);

  // Start countdown timer (updates text only, does not rebuild DOM)
  startCountdownTimer();
}

window.renderShopPage = renderShopPage;
