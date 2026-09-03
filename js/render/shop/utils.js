// Shop rendering utilities — shared helpers used by multiple shop sub-modules
import { BOOKS } from '../../data/books.js';
import { actions, updateStatusBar, getBookTitle } from '../common.js';
import { t, getLocale } from '../../i18n/terms.js';

export function formatDiscount(discount) {
  const value = getLocale() === 'en'
    ? Math.round((1 - discount) * 100)
    : Math.round(discount * 10);
  return t('discountLabel').replace('{value}', value);
}

export function updateStatusAndRefresh() {
  updateStatusBar();
  if (actions.renderShopPage) {
    actions.renderShopPage();
  }
}

export function renderShopBookCover(poolEntry, sizeClass = 'w-16 h-24') {
  const bookDef = BOOKS[poolEntry.bookId];
  const cover = bookDef?.cover;
  const title = getBookTitle(poolEntry);
  if (cover) {
    return `
      <img src="${cover}" alt="${title}" class="${sizeClass} object-cover mx-auto rounded shadow-sm mb-2" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div class="hidden flex-col items-center justify-center ${sizeClass} mx-auto mb-2"><span class="text-3xl">${poolEntry.emoji}</span></div>
    `;
  }
  return `<div class="text-3xl mb-2">${poolEntry.emoji}</div>`;
}
