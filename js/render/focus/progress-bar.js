// Book copy progress bar with repair sub-bar
import { state } from '../../state.js';
import { BOOKS } from '../../../data/books.js';
import { el, animateNumber, getBookTitle } from '../common.js';
import { getEffectiveCopiedWords, getRepairProgress } from '../../core/book-utils.js';
import { t } from '../../i18n/terms.js';

export function renderBookProgress(sess, book) {
  const bookState = state.books[sess.bookId];
  const totalWords = book.totalWords || 1;
  const effectiveWords = getEffectiveCopiedWords(bookState, totalWords);
  const pct = Math.min(100, Math.round((effectiveWords / totalWords) * 100));
  const repair = getRepairProgress(bookState);

  const div = el('div', 'mt-4 pt-4 border-t border-wood/20');
  div.id = 'book-progress-bar';

  div.innerHTML = `
    <div class="flex items-center justify-between mb-1.5">
      <span class="text-xs font-bold text-ink">📖 ${t('copyProgressLabel').replace('{title}', '《' + getBookTitle(book) + '》')}</span>
      <span class="text-xs text-ink-light">
        <span id="book-progress-words-current" data-value="${effectiveWords}">${effectiveWords.toLocaleString()}</span>
        /
        <span id="book-progress-words-total">${totalWords.toLocaleString()}</span>
        ${t('wordsUnit')}
      </span>
    </div>
    <div class="h-2.5 bg-wood/20 rounded-full overflow-hidden">
      <div id="book-progress-fill" class="h-full bg-gradient-to-r from-amber-600 to-magic-gold rounded-full transition-all duration-500" style="width:${pct}%"></div>
    </div>
    <div id="book-progress-pct" class="text-right text-xs text-ink-light mt-0.5" data-value="${pct}">${pct}%</div>
    <div id="book-progress-repair" style="${repair ? '' : 'display:none'}">
      <div class="flex items-center justify-between mb-1 mt-3">
        <span class="text-xs font-bold text-amber-700">${t('repairProgress')}</span>
        <span class="text-xs text-amber-600"><span id="book-progress-repair-done">${repair ? (repair.done || 0).toLocaleString() : '0'}</span> / ${repair ? repair.total.toLocaleString() : '0'} ${t('wordsUnit')}</span>
      </div>
      <div class="h-2 bg-wood/20 rounded-full overflow-hidden mb-3">
        <div id="book-progress-repair-fill" class="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500" style="width:${repair ? repair.pct : 0}%"></div>
      </div>
      <div id="book-progress-repair-boost" class="text-right text-xs text-amber-600 mb-1">${repair ? t('repairSpeedBoost').replace('{pct}', repair.pct).replace('{n}', 5) : ''}</div>
    </div>
  `;

  return div;
}

export function updateBookProgressDOM(sess) {
  const book = sess.bookId ? BOOKS[sess.bookId] : null;
  if (!book) return;

  const bookState = state.books[sess.bookId];
  const totalWords = book.totalWords || 1;
  const effectiveWords = getEffectiveCopiedWords(bookState, totalWords);
  const pct = Math.min(100, Math.round((effectiveWords / totalWords) * 100));
  const repair = getRepairProgress(bookState);

  const fill = document.getElementById('book-progress-fill');
  if (fill) fill.style.width = `${pct}%`;

  const pctEl = document.getElementById('book-progress-pct');
  if (pctEl) {
    const prevPct = parseInt(pctEl.dataset.value || '0', 10);
    if (prevPct !== pct) {
      animateNumber(pctEl, prevPct, pct, 400, (n) => `${Math.round(n)}%`);
      pctEl.dataset.value = String(pct);
    }
  }

  const wordsCurrentEl = document.getElementById('book-progress-words-current');
  const wordsTotalEl = document.getElementById('book-progress-words-total');
  if (wordsCurrentEl) {
    const prevWords = parseInt(wordsCurrentEl.dataset.value || '0', 10);
    if (prevWords !== effectiveWords) {
      animateNumber(wordsCurrentEl, prevWords, effectiveWords, 400);
      wordsCurrentEl.dataset.value = String(effectiveWords);
    }
  }
  if (wordsTotalEl) wordsTotalEl.textContent = totalWords.toLocaleString();

  const repairSection = document.getElementById('book-progress-repair');
  if (repair) {
    if (repairSection) {
      const repairDoneEl = document.getElementById('book-progress-repair-done');
      const repairFill = document.getElementById('book-progress-repair-fill');
      const repairBoost = document.getElementById('book-progress-repair-boost');
      if (repairDoneEl) repairDoneEl.textContent = (repair.done || 0).toLocaleString();
      if (repairFill) repairFill.style.width = `${repair.pct}%`;
      if (repairBoost) repairBoost.textContent = t('repairSpeedBoost').replace('{pct}', repair.pct).replace('{n}', 5);
      repairSection.style.display = '';
    }
  } else if (repairSection) {
    repairSection.style.display = 'none';
  }

  const wordsEl = document.getElementById('focus-book-words');
  if (wordsEl) {
    const prevWords = parseInt(wordsEl.dataset.value || '0', 10);
    const current = parseInt(wordsEl.textContent.replace(/,/g, '') || '0', 10);
    const from = Number.isFinite(prevWords) ? prevWords : current;
    if (from !== effectiveWords) {
      animateNumber(wordsEl, from, effectiveWords, 400);
      wordsEl.dataset.value = String(effectiveWords);
    }
  }
}
