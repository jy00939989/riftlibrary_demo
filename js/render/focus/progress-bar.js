// Book copy progress bar with repair sub-bar
import { state } from '../../state.js';
import { BOOKS } from '../../../data/books.js';
import { el, animateNumber, getBookTitle } from '../common.js';
import { getEffectiveCopiedWords, getRepairProgress, estimateRemainingMinutes } from '../../core/book-utils.js';
import { getFocusSpeedMultiplier } from '../../core/shop/library-upgrades.js';
import { getAuraSpeedBonus } from '../../visitors.js';
import { getCurationFocusSpeed } from '../../curation.js';
import { t } from '../../i18n/terms.js';

// 誊抄剩余分钟估算：公式对齐 timer.js tick 实际结算（100 字/分钟 × 各倍率，冲刺 ×1.2，墨墨首会 10×）
function computeRemainingMinutes(sess, book, bookState) {
  const totalWords = book.totalWords || 0;
  const effectiveWords = getEffectiveCopiedWords(bookState, totalWords);
  return estimateRemainingMinutes({
    totalWords,
    effectiveWords,
    elapsedSeconds: sess.active ? (sess.elapsedSeconds || 0) : 0,
    focusMultiplier: getFocusSpeedMultiplier(),
    auraSpeed: getAuraSpeedBonus(book.category),
    curationSpeed: getCurationFocusSpeed(),
    sprint: !!(sess.active && sess.chapter90Sprint),
    speedMultiplier: sess.active ? (sess.speedMultiplier || 1) : 1,
  });
}

export function renderBookProgress(sess, book) {
  const bookState = state.books[sess.bookId];
  const totalWords = book.totalWords || 1;
  const effectiveWords = getEffectiveCopiedWords(bookState, totalWords);
  const pct = Math.min(100, Math.round((effectiveWords / totalWords) * 100));
  const repair = getRepairProgress(bookState);
  const remaining = computeRemainingMinutes(sess, book, bookState);

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
    <div id="book-progress-remain" class="text-right text-xs text-magic-gold mt-0.5" style="${remaining > 0 ? '' : 'display:none'}">${remaining > 0 ? t('copyRemainEstimate').replace('{min}', remaining) : ''}</div>
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
  const remaining = computeRemainingMinutes(sess, book, bookState);

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

  const remainEl = document.getElementById('book-progress-remain');
  if (remainEl) {
    if (remaining > 0) {
      remainEl.textContent = t('copyRemainEstimate').replace('{min}', remaining);
      remainEl.style.display = '';
    } else {
      remainEl.style.display = 'none';
    }
  }

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
