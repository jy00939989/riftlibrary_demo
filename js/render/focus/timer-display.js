// Timer display / writing animation area for the focus page
import { state } from '../../state.js';
import { BOOKS } from '../../../data/books.js';
import { el, formatTime, getBookTitle } from '../common.js';
import { startWriting, isWriting } from '../writing.js';
import { isMomoAccelerating } from '../../timer.js';
import { t } from '../../i18n/terms.js';

export function renderTimerOrAnimation(sess, book) {
  const wrapper = el('div', 'text-center mb-8');
  wrapper.id = 'focus-display-area';

  if (sess.active && book) {
    const bookWords = book ? state.books[book.id]?.copiedWords || 0 : 0;
    wrapper.innerHTML = `
      <div id="writing-anim-container" class="writing-anim-wrapper mx-auto"></div>
      <div class="writing-status-bar" id="writing-status-bar">${t('writingStatus').replace('{n}', 1)}</div>
      ${isMomoAccelerating() ? `<div class="text-xs text-magic-gold mt-1 animate-pulse">${t('momoMagicAccelerating')}</div>` : ''}
      <div class="text-xs text-ink-light mt-1">
        ${t('thisBook')} <span id="focus-book-words">${bookWords.toLocaleString()}</span> ${t('wordsUnit')}
        · ${t('totalWordsLabel').replace('{n}', `<span id="focus-active-words">${state.focus.totalWords.toLocaleString()}</span>`)}
        · <span id="focus-mini-timer">${formatTime(0)}</span>
      </div>
    `;
    // Delay start so animation engine can measure container after DOM mount
    setTimeout(() => {
      const animContainer = document.getElementById('writing-anim-container');
      if (animContainer) startWriting(animContainer, book, { copiedWords: state.books[book.id]?.copiedWords || 0 });
    }, 50);
  } else {
    wrapper.innerHTML = `
      <div class="text-6xl md:text-7xl font-display font-bold text-ink mb-2">00:00</div>
      ${sess.bookId && book ? `<div class="text-magic-blue font-medium">${t('copyBookLabel').replace('{title}', '《' + getBookTitle(book) + '》')}</div>` : ''}
      <div class="text-sm text-ink-light mt-1">${t('bookWordCount').replace('{book}', book ? (state.books[book.id]?.copiedWords || 0).toLocaleString() : 0).replace('{total}', state.focus.totalWords.toLocaleString())}</div>
    `;
  }

  return wrapper;
}
