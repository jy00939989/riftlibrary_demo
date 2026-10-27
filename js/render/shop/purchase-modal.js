// Book purchase confirmation modal
import { state } from '../../state.js';
import { BOOKS } from '../../../data/books.js';
import { el, actions, updateStatusBar, getBookTitle } from '../common.js';
import { playSfx } from '../../audio.js';
import { purchaseBook } from '../../shop.js';
import { getManuscriptSlots, getManuscriptBoxCount } from '../../capacity.js';
import { checkAchievements } from '../../achievements.js';
import { showAchievementToast } from '../achievements.js';
import { t } from '../../i18n/terms.js';
import { renderShopBookCover, formatDiscount } from './utils.js';

export function showPurchaseModal(poolEntry, price, originalPrice, discount) {
  const overlay = el('div', 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4');

  const desc = poolEntry.description || '';
  const shortDesc = desc.length > 60 ? desc.slice(0, 60) + '…' : desc;

  const discountText = discount ? formatDiscount(discount) : '';
  const priceLine = discount
    ? `<span class="text-gray-400 line-through mr-2">💰${originalPrice}</span><span class="text-magic-gold font-bold text-lg">💰${price}</span> <span class="text-xs text-red-500">${discountText}</span>`
    : `<span class="text-magic-gold font-bold text-lg">💰${price}</span>`;

  const displayTitle = getBookTitle(poolEntry);
  const volumeSubtitle = poolEntry.type === 'volume'
    ? `<p class="text-xs text-magic-blue font-bold mb-1">${poolEntry.subtitle || ''}</p>`
    : '';
  const bookDef = BOOKS[poolEntry.bookId];
  const chapterCount = bookDef?.chapters?.length || poolEntry.chapterCount || 0;
  // 2026-10-27 兑换券结算确认（图南拍板）：持券时双按钮，玩家自选用券免费 or 花币留券
  const hasVoucher = (state.bookVoucher || 0) > 0;

  const content = el('div', 'parchment-bg rounded-2xl p-6 max-w-sm w-full magic-glow animate-scale-in');
  content.innerHTML = `
    <div class="text-center mb-4">
      ${renderShopBookCover(poolEntry, 'w-20 h-30')}
      ${volumeSubtitle}
      <h3 class="font-display text-xl font-bold mb-1">${displayTitle}</h3>
      <p class="text-sm text-ink-light">${poolEntry.author} · ${poolEntry.category}</p>
      <p class="text-xs text-ink-light mt-1">${poolEntry.totalWords.toLocaleString()}${t('wordsUnit')} · ${t('chapterCount').replace('{n}', chapterCount)}</p>
    </div>
    <div class="bg-white/60 rounded-lg p-3 mb-4">
      <p class="text-sm text-ink-light">${shortDesc}</p>
    </div>
    <div class="text-center mb-4">${priceLine}</div>
    ${hasVoucher ? `
      <div class="bg-orange-50 border border-orange-200 rounded-lg p-2.5 mb-3 text-center">
        <span class="text-xs font-bold text-orange-700">🎃 ${t('bookVoucherLabel').replace('{n}', state.bookVoucher)}</span>
        <span class="text-xs text-orange-600 block mt-0.5">${t('voucherChooseHow')}</span>
      </div>
      <div class="flex justify-center gap-2">
        <button class="cancel-btn px-4 py-2.5 bg-wood/20 text-ink-light rounded-lg font-bold hover:bg-wood/30 transition-all">${t('cancel')}</button>
        <button class="pay-btn px-4 py-2.5 bg-magic-blue text-white rounded-lg font-bold hover:shadow-lg transition-all ${state.coins < price ? 'opacity-50 cursor-not-allowed' : ''}">💰 ${t('voucherPayCoins')}</button>
        <button class="voucher-btn px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-bold hover:shadow-lg transition-all">🎃 ${t('voucherUseFree')}</button>
      </div>
      ${state.coins < price ? `<p class="text-xs text-red-500 text-center mt-2">${t('insufficientCoins')} 💰</p>` : ''}
    ` : `
      <div class="flex justify-center gap-3">
        <button class="cancel-btn px-6 py-2.5 bg-wood/20 text-ink-light rounded-lg font-bold hover:bg-wood/30 transition-all">${t('cancel')}</button>
        <button class="confirm-btn px-6 py-2.5 bg-magic-gold text-white rounded-lg font-bold hover:shadow-lg transition-all ${state.coins < price ? 'opacity-50 cursor-not-allowed' : ''}">${t('confirmPurchase')}</button>
      </div>
      ${state.coins < price ? `<p class="text-xs text-red-500 text-center mt-2">${t('insufficientCoins')} 💰</p>` : ''}
    `}
  `;

  overlay.appendChild(content);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();

  content.querySelector('.cancel-btn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const doPurchase = (useVoucher) => {
    const result = purchaseBook(poolEntry.bookId, price, { useVoucher });
    if (result.ok) {
      updateStatusBar();
      playSfx('buy_success');
      overlay.remove();
      if (actions.renderShopPage) {
        actions.renderShopPage();
      }
      const bookAch = checkAchievements('purchase_book');
      bookAch.forEach(a => showAchievementToast(a));
    } else {
      switch (result.reason) {
        case 'insufficient_coins':
          window.showToast(`${t('insufficientCoinsExclamation')} ${t('purchaseNeedsCoins').replace('{actual}', result.actualPrice).replace('{price}', price)}`, 'error');
          break;
        case 'already_owned':
          window.showToast(t('youAlreadyOwnThisBook'), 'error');
          break;
        case 'manuscript_box_full': {
          const mSlots = getManuscriptSlots();
          const mCount = getManuscriptBoxCount();
          window.showToast(`${t('manuscriptBoxFull')}（${mCount}/${mSlots}${t('slots')}）！${t('expandManuscriptBoxFirst')}`, 'error');
          break;
        }
        case 'event_ended':
          window.showToast(t('purchaseEventEnded'), 'error');
          break;
        default:
          window.showToast(t('purchaseFailed'), 'error');
      }
    }
  };

  // 绑定：普通单按钮 or 持券双按钮
  const confirmBtn = content.querySelector('.confirm-btn');
  if (confirmBtn) confirmBtn.addEventListener('click', () => doPurchase(true));
  const voucherBtn = content.querySelector('.voucher-btn');
  if (voucherBtn) voucherBtn.addEventListener('click', () => doPurchase(true));
  const payBtn = content.querySelector('.pay-btn');
  if (payBtn) payBtn.addEventListener('click', () => doPurchase(false));
}
