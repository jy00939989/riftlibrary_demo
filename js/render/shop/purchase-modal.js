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
    <div class="flex justify-center gap-3">
      <button class="cancel-btn px-6 py-2.5 bg-wood/20 text-ink-light rounded-lg font-bold hover:bg-wood/30 transition-all">${t('cancel')}</button>
      <button class="confirm-btn px-6 py-2.5 bg-magic-gold text-white rounded-lg font-bold hover:shadow-lg transition-all ${state.coins < price ? 'opacity-50 cursor-not-allowed' : ''}">${t('confirmPurchase')}</button>
    </div>
    ${state.coins < price ? `<p class="text-xs text-red-500 text-center mt-2">${t('insufficientCoins')} 💰</p>` : ''}
  `;

  overlay.appendChild(content);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();

  content.querySelector('.cancel-btn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const confirmBtn = content.querySelector('.confirm-btn');
  confirmBtn.addEventListener('click', () => {
    const result = purchaseBook(poolEntry.bookId, price);
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
        default:
          window.showToast(t('purchaseFailed'), 'error');
      }
    }
  });
}
