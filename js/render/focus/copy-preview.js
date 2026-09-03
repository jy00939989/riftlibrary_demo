// Idle copy preview card shown on the focus page
import { state } from '../../state.js';
import { BOOKS, COPY_TEMPLATES } from '../../../data/books.js';
import { h, getBookTitle, getBookQuotes } from '../common.js';
import { getRepairProgress } from '../../core/book-utils.js';
import { t } from '../../i18n/terms.js';

export function renderCopyPreview(book) {
  const bs = state.books[book.id];
  const isDamaged = bs && bs.damaged;

  if (isDamaged) {
    const repair = getRepairProgress(bs);
    const remainStr = repair ? t('repairRemaining').replace('{words}', repair.remaining.toLocaleString()) : '';
    return h(`
      <div class="mt-4 rounded-xl p-4 border-2 border-amber-300 animate-fade-in" style="background:linear-gradient(135deg, rgba(251,243,219,0.9), rgba(245,225,180,0.7))">
        <div class="flex items-start gap-3">
          <span class="text-2xl">🔧</span>
          <div class="flex-1">
            <div class="text-sm font-bold text-amber-800 mb-1">${t('repairingTitle')}</div>
            <div class="text-xs text-amber-700 leading-relaxed mb-2">
              ${t('repairFlavourText')}
            </div>
            ${remainStr ? `<div class="text-xs text-amber-600 font-bold">${remainStr} · ${t('repairSpeedBoost').replace('{pct}', repair.pct).replace('{n}', 5)}</div>` : ''}
          </div>
        </div>
      </div>
    `);
  }

  const template = COPY_TEMPLATES[state.currentSession.quoteIndex % COPY_TEMPLATES.length];
  const quotes = getBookQuotes(book);
  const quoteKeys = Object.keys(quotes);
  const quote = quoteKeys.length > 0
    ? quotes[quoteKeys[Math.floor(Math.random() * quoteKeys.length)]]
    : '每一页抄写都是对知识的致敬。';

  return h(`
    <div class="mt-4 parchment-bg rounded-xl p-4 border-2 border-magic-gold/30 animate-fade-in">
      <div class="flex items-start gap-3">
        <span class="text-2xl">✨</span>
        <div class="flex-1">
          <div class="text-sm text-ink-light mb-1">${template.opening}</div>
          <blockquote class="text-ink italic border-l-4 border-magic-gold pl-3 py-1 my-2">
            「${quote}」
          </blockquote>
          <div class="text-xs text-ink-light">${t('bookSource').replace('{title}', getBookTitle(book))}</div>
          <div class="text-xs text-magic-blue mt-1">${template.closing}</div>
        </div>
      </div>
    </div>
  `);
}
