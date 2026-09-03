// Book selector for the focus page
import { state } from '../../state.js';
import { BOOKS } from '../../../data/books.js';
import { el, actions, getBookTitle } from '../common.js';
import { getEffectiveCopiedWords, getRepairProgress } from '../../core/book-utils.js';
import { isNoMasteryBook } from '../../core/book-eligibility.js';
import { setFocusBook } from '../../core/focus-session.js';
import { t } from '../../i18n/terms.js';

export function renderBookSelector(sess) {
  const div = el('div', 'mb-8');
  div.appendChild(el('h2', 'font-display text-lg font-bold mb-3', { text: t('selectBookToTranscribe') }));
  const flex = el('div', 'flex gap-3 overflow-x-auto pb-2');

  const eligibleBooks = Object.values(BOOKS).filter(book => {
    const bs = state.books[book.id];
    if (!bs || bs.status === 'locked') return false;
    // Books not in mastery system disappear after completion
    if (isNoMasteryBook(book.id) && bs.status === 'completed') return false;
    // Mastered books only show if re-copy is unlocked
    if ((bs.masteryLevel >= 5 || bs.copyCount >= 5) && !bs.reCopyUnlocked) return false;
    // Completed books need inspiration to unlock re-copy
    if (bs.status === 'completed' && !bs.reCopyUnlocked) return false;
    return (bs.status === 'unlocked' || bs.status === 'copying' || bs.copiedWords > 0);
  });

  if (eligibleBooks.length === 0) {
    const tip = el('p', 'text-ink-light text-sm py-4');
    tip.textContent = t('goToShelfSelectBook');
    div.appendChild(tip);
    return div;
  }

  eligibleBooks.forEach(book => {
    const bs = state.books[book.id];
    const active = sess.bookId === book.id;
    const repair = getRepairProgress(bs);
    const isDamaged = bs && bs.damaged;
    const btn = el('button', `book-select flex-shrink-0 w-24 p-2 border-2 rounded-lg text-center transition-all ${
      active ? 'border-magic-gold bg-magic-gold/10' : isDamaged ? 'border-amber-400 bg-amber-50' : 'border-wood/30 bg-white/50'
    }`);
    const effectiveWords = getEffectiveCopiedWords(bs, book.totalWords);
    const progress = book.totalWords > 0 ? Math.round((effectiveWords / book.totalWords) * 100) : 0;
    const repairHtml = repair ? `<div class="text-[10px] text-amber-600 font-bold mt-0.5">${t('repairing').replace('{pct}', repair.pct)}</div>` : '';
    btn.innerHTML = `<div class="text-3xl mb-1">${book.emoji}</div><div class="font-bold text-xs">${getBookTitle(book)}</div><div class="text-xs text-ink-light">${progress}%</div>${repairHtml}`;
    btn.addEventListener('click', () => {
      if (!state.currentSession.active) {
        setFocusBook(book.id);
        if (actions.renderFocusPage) actions.renderFocusPage();
      }
    });
    flex.appendChild(btn);
  });

  div.appendChild(flex);
  return div;
}
