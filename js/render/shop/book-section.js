// Book grid sections for the shop (new books + limited-time offer)
import { state } from '../../state.js';
import { SHARED_POOL } from '../../../data/book_pool.js';
import { el, getBookTitle } from '../common.js';
import { getManuscriptSlots, getManuscriptBoxCount } from '../../capacity.js';
import { getActivePeizhouRec, getBookActualPrice } from '../../shop.js';
import { getVisitorName } from '../../i18n/terms.js';
import { t } from '../../i18n/terms.js';
import { formatCountdown } from './countdown.js';
import { showPurchaseModal } from './purchase-modal.js';
import { renderShopBookCover, formatDiscount } from './utils.js';

export function renderBookSection(title, slots, isRotating) {
  const section = el('div', 'parchment-bg rounded-2xl p-6 magic-glow');
  section.innerHTML = `<h2 class="font-display text-xl font-bold mb-4">${title}</h2>`;

  const grid = el('div', 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3');

  slots.forEach(slot => {
    if (!slot || !slot.bookId) {
      // Empty slot
      const empty = el('div', 'bg-wood/5 rounded-xl p-4 border-2 border-dashed border-wood/20 flex items-center justify-center min-h-[180px]');
      empty.innerHTML = `<span class="text-wood/30 text-sm text-center">${t('newBooksRestocking')}</span>`;
      grid.appendChild(empty);
      return;
    }

    const poolEntry = SHARED_POOL.find(b => b.bookId === slot.bookId);
    if (!poolEntry) return;

    const owned = state.books[slot.bookId] && state.books[slot.bookId].status !== 'locked';
    const mBoxFull = getManuscriptBoxCount() >= getManuscriptSlots();

    grid.appendChild(renderBookCard(slot, poolEntry, owned, isRotating, mBoxFull));
  });

  section.appendChild(grid);
  return section;
}

export function renderBookCard(slot, poolEntry, owned, isRotating, mBoxFull) {
  const disabled = owned || (mBoxFull && !owned);
  let disabledReason = '';
  if (owned) disabledReason = `✅ ${t('owned')}`;
  else if (mBoxFull) disabledReason = `📦 ${t('manuscriptBoxFull')}`;

  const displayTitle = getBookTitle(poolEntry);
  const volumeBadge = poolEntry.type === 'volume'
    ? `<div class="absolute top-2 right-2 text-[10px] bg-magic-blue/10 text-magic-blue px-1.5 py-0.5 rounded font-bold">${poolEntry.subtitle || ''}</div>`
    : '';

  const card = el('div', `book-card rounded-xl p-4 border-2 transition-all relative ${
    disabled ? 'bg-gray-100 border-gray-200 opacity-50' : 'bg-white border-wood/20 hover:border-magic-gold/50 hover:shadow-lg cursor-pointer'
  }`);

  if (disabled) {
    card.innerHTML = `
      ${volumeBadge}
      <div class="text-center">
        ${renderShopBookCover(poolEntry)}
        <div class="font-bold text-sm mb-1">${displayTitle}</div>
        <div class="text-xs text-ink-light mb-2">${poolEntry.author} · ${poolEntry.category}</div>
        <div class="text-xs text-magic-gold font-bold">${disabledReason}</div>
      </div>
    `;
    return card;
  }

  const discountText = isRotating ? formatDiscount(slot.discount) : '';
  const priceDisplay = isRotating
    ? `<div class="text-sm"><span class="text-gray-400 line-through text-xs">💰${slot.originalPrice}</span> <span class="text-magic-gold font-bold">💰${slot.price}</span></div>
       <div class="text-xs text-red-500 font-bold">${discountText}</div>`
    : `<div class="text-sm text-magic-gold font-bold">💰${slot.price}</div>`;

  const soldText = slot.soldAt ? formatCountdown(slot.soldAt) : '';

  if (soldText) {
    card.innerHTML = `
      ${volumeBadge}
      <div class="text-center">
        ${renderShopBookCover(poolEntry)}
        <div class="font-bold text-sm mb-1">${displayTitle}</div>
        <div class="text-xs text-ink-light mb-2">${poolEntry.author}</div>
        <div class="text-xs text-magic-blue shop-countdown" data-soldat="${slot.soldAt}">⏰ ${soldText}</div>
      </div>
    `;
    return card;
  }

  const peizhouRec = getActivePeizhouRec();
  const isPeizhouPick = peizhouRec && peizhouRec.bookId === slot.bookId;
  const { actualPrice } = getBookActualPrice(slot.bookId, slot.price);
  const peizhouName = getVisitorName('peizhou');
  const peizhouBadge = isPeizhouPick
    ? `<div class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full inline-block mb-1 font-bold">${t('recommendedBy').replace('{name}', peizhouName).replace('{value}', formatDiscount(0.7).replace(/[^0-9]/g, ''))}</div>`
    : '';
  const peizhouPriceLine = isPeizhouPick
    ? `<div class="text-xs text-amber-600 mt-1">${t('recommendedPrice')
        .replace('{original}', slot.price.toLocaleString())
        .replace('{name}', peizhouName)
        .replace('{price}', actualPrice.toLocaleString())}</div>`
    : '';

  card.innerHTML = `
    ${volumeBadge}
    <div class="text-center">
      ${poolEntry.starter ? `<div class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full inline-block mb-1 font-bold">${t('starterRecommended')}</div>` : ''}
      ${peizhouBadge}
      ${renderShopBookCover(poolEntry)}
      <div class="font-bold text-sm mb-1">${displayTitle}</div>
      <div class="text-xs text-ink-light mb-1">${poolEntry.author}</div>
      <div class="text-xs text-ink-light mb-2">${poolEntry.category} · ${poolEntry.totalWords.toLocaleString()}${t('wordsUnit')}</div>
      ${priceDisplay}
      ${peizhouPriceLine}
    </div>
  `;

  if (!disabled) {
    card.addEventListener('click', () => {
      showPurchaseModal(poolEntry, actualPrice, isRotating ? slot.originalPrice : null, isRotating ? slot.discount : null);
    });
  }

  return card;
}
