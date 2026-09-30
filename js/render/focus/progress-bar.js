// Book copy progress bar with repair sub-bar
import { state } from '../../state.js';
import { BOOKS } from '../../../data/books.js';
import { el, animateNumber, getBookTitle } from '../common.js';
import { getEffectiveCopiedWords, getRepairProgress, estimateRemainingMinutes, getChapterInfo, shouldHideCopyBarInRepair } from '../../core/book-utils.js';
import { getFocusSpeedMultiplier } from '../../core/shop/library-upgrades.js';
import { getAuraSpeedBonus } from '../../visitors.js';
import { getCurationFocusSpeed } from '../../curation.js';
import { isRestorationUnlocked, getRestorationRepairSpeedBonus } from '../../capacity.js';
import { calculateWordsGained } from '../../core/focus-rewards.js';
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

/**
 * 会话内实时修复进度（图南 2026-09-30：修复条要每秒平滑推进，不要一分钟跳一次）。
 * state 里 repairProgress 只在结算时入账；此处把本会话已产生、未入账的字数
 * 按结算同公式（calculateWordsGained，分钟取小数）估算叠加。
 * @returns {{done:number,total:number,pct:number}|null} 无修复中的书返回 null
 */
export function getLiveRepairProgress(sess) {
  if (!sess || !sess.active || !sess.bookId) return null;
  const bookState = state.books[sess.bookId];
  const book = BOOKS[sess.bookId];
  const repair = getRepairProgress(bookState);
  if (!repair) return null;
  const liveWords = calculateWordsGained({
    minutes: sess.elapsedSeconds / 60,
    teaBoost: !!sess.teaBoost,
    focusSpeedMultiplier: getFocusSpeedMultiplier(),
    auraSpeed: getAuraSpeedBonus(book && book.category),
    curationSpeed: getCurationFocusSpeed(),
    repairSpeedBonus: isRestorationUnlocked() ? getRestorationRepairSpeedBonus() : 0,
    getChapterInfo, book, bookState,
  });
  const done = Math.min(repair.total, repair.done + Math.max(0, liveWords));
  const pct = Math.min(100, Math.round((done / repair.total) * 100));
  return { done, total: repair.total, pct };
}

/** 每秒实况刷新修复条（timer tick 调用；DOM 缺失时静默跳过） */
export function updateRepairBarLive(sess) {
  if (typeof document === 'undefined') return;
  const live = getLiveRepairProgress(sess);
  const fill = document.getElementById('book-progress-repair-fill');
  if (!fill) return;
  if (!live) {
    fill.style.width = '0%';
    return;
  }
  fill.style.width = `${live.pct}%`;
  const doneEl = document.getElementById('book-progress-repair-done');
  if (doneEl) doneEl.textContent = live.done.toLocaleString();
  const boostEl = document.getElementById('book-progress-repair-boost');
  if (boostEl) boostEl.textContent = t('repairSpeedBoost').replace('{pct}', live.pct).replace('{n}', 5);
}

export function renderBookProgress(sess, book) {
  const bookState = state.books[sess.bookId];
  const totalWords = book.totalWords || 1;
  const effectiveWords = getEffectiveCopiedWords(bookState, totalWords);
  const pct = Math.min(100, Math.round((effectiveWords / totalWords) * 100));
  const repair = getRepairProgress(bookState);
  const shownRepair = getLiveRepairProgress(sess) || repair; // 会话中显示实时值，避免分钟级重建回跳
  const remaining = computeRemainingMinutes(sess, book, bookState);

  const div = el('div', 'mt-4 pt-4 border-t border-wood/20');
  div.id = 'book-progress-bar';

  // 已上架的书（copyCount≥1）损坏后修复：誊抄条只剩 0% 噪音（effectiveWords 回卷），只显示修复条
  const hideCopy = shouldHideCopyBarInRepair(bookState, repair);

  div.innerHTML = `
    <div id="book-progress-copy" style="${hideCopy ? 'display:none' : ''}">
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
    </div>
    <div id="book-progress-repair" style="${repair ? '' : 'display:none'}">
      <div class="flex items-center justify-between mb-1 mt-3">
        <span class="text-xs font-bold text-amber-700">${t('repairProgress')}</span>
        <span class="text-xs text-amber-600"><span id="book-progress-repair-done">${shownRepair ? (shownRepair.done || 0).toLocaleString() : '0'}</span> / ${shownRepair ? shownRepair.total.toLocaleString() : '0'} ${t('wordsUnit')}</span>
      </div>
      <div class="h-2 bg-wood/20 rounded-full overflow-hidden mb-3">
        <div id="book-progress-repair-fill" class="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500" style="width:${shownRepair ? shownRepair.pct : 0}%"></div>
      </div>
      <div id="book-progress-repair-boost" class="text-right text-xs text-amber-600 mb-1">${shownRepair ? t('repairSpeedBoost').replace('{pct}', shownRepair.pct).replace('{n}', 5) : ''}</div>
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

  const copySection = document.getElementById('book-progress-copy');
  if (copySection) {
    copySection.style.display = shouldHideCopyBarInRepair(bookState, repair) ? 'none' : '';
  }

  const repairSection = document.getElementById('book-progress-repair');
  if (repair) {
    if (repairSection) {
      const shown = getLiveRepairProgress(sess) || repair; // 实时值优先，与每秒刷新同源
      const repairDoneEl = document.getElementById('book-progress-repair-done');
      const repairFill = document.getElementById('book-progress-repair-fill');
      const repairBoost = document.getElementById('book-progress-repair-boost');
      if (repairDoneEl) repairDoneEl.textContent = (shown.done || 0).toLocaleString();
      if (repairFill) repairFill.style.width = `${shown.pct}%`;
      if (repairBoost) repairBoost.textContent = t('repairSpeedBoost').replace('{pct}', shown.pct).replace('{n}', 5);
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
