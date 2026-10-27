// Shop page entry point — orchestrates all shop sections and countdown lifecycle
// 2026-09-21：馆内装潢区退役（图南决策）——植物购买迁入温室独立页，标志牌收编展览厅
import { el } from '../common.js';
import { state } from '../../state.js';
import { ensureShopState, getShopState, getEventDirectSlots } from '../../shop.js';
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

  // 万圣节书籍兑换券提示条（2026-10-27：持有即显，买任意书自动抵扣销券）
  if ((state.bookVoucher || 0) > 0) {
    const voucherStrip = el('div', 'rounded-xl border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 flex items-center justify-between shadow');
    voucherStrip.innerHTML = `
      <span class="text-sm font-bold text-orange-800">${t('bookVoucherLabel').replace('{n}', state.bookVoucher)}</span>
      <span class="text-xs text-orange-600">${t('bookVoucherHint')}</span>`;
    wrapper.appendChild(voucherStrip);
  }

  // ========== DLC Packs ==========
  renderDlcPacksSection(wrapper);

  // ========== Library Upgrades ==========
  wrapper.appendChild(renderLibraryUpgrades());

  // ========== New Books ==========
  // 2026-10-27 万圣节特供置顶：哥特之书窗口内常驻直购（图南：不用等刷新）
  const gothicSlots = getEventDirectSlots();
  if (gothicSlots.length) {
    wrapper.appendChild(renderBookSection(`🎃 ${t('eventGothicSpecial')}`, gothicSlots, false));
  }
  wrapper.appendChild(renderBookSection(`📚 ${t('newBooksInStock')}`, shopState.fixed, false));
  wrapper.appendChild(renderBookSection(`🔥 ${t('limitedTimeOffer')}`, shopState.rotating, true));

  container.appendChild(wrapper);

  // Start countdown timer (updates text only, does not rebuild DOM)
  startCountdownTimer();
}

window.renderShopPage = renderShopPage;
