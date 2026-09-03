// Focus completion settlement modal
import { BOOKS } from '../../../data/books.js';
import { el, getBookTitle, getBookQuotes, getChapterTitle, getChapterPreview } from '../common.js';
import { getMomoReview } from '../../../data/momo-reviews.js';
import { t } from '../../i18n/terms.js';

export function showCompletionCard({ minutes, words, coins, book, streak, totalWords, nextMilestone, chapterInfo, nextPreview }, callback) {
  const momoReview = getMomoReview(book);
  let quoteText = '';
  let quoteSource = '';
  if (book && getBookQuotes(book)) {
    const quoteKeys = Object.keys(getBookQuotes(book));
    const key = quoteKeys[Math.floor(Math.random() * quoteKeys.length)];
    quoteText = getBookQuotes(book)[key];
    quoteSource = t('bookSource').replace('{title}', getBookTitle(book));
  }
  if (!quoteText) {
    const generalQuotes = [
      t('completionQuote1'),
      t('completionQuote2'),
      t('completionQuote3')
    ];
    quoteText = generalQuotes[Math.floor(Math.random() * generalQuotes.length)];
  }

  // Next milestone progress
  let milestoneHtml = '';
  if (nextMilestone && totalWords) {
    const pct = Math.min(99, Math.round(totalWords / nextMilestone * 100));
    milestoneHtml = `
      <div class="bg-white/60 rounded-lg p-2 mb-1">
        <div class="text-xs text-ink-light mb-1">${t('nextMilestoneLabel').replace('{n}', nextMilestone.toLocaleString())}</div>
        <div class="h-1.5 bg-wood/20 rounded-full overflow-hidden">
          <div class="h-full bg-magic-gold rounded-full" style="width:${pct}%"></div>
        </div>
        <div class="text-xs text-ink-light mt-0.5">${t('progressPct').replace('{n}', pct)}</div>
      </div>
    `;
  }

  // Chapter progress for this book
  const currentChapter = chapterInfo && book && book.chapters[chapterInfo.current - 1] ? book.chapters[chapterInfo.current - 1] : null;
  const nextChapter = chapterInfo && book && book.chapters[chapterInfo.current] ? book.chapters[chapterInfo.current] : null;
  const localizedChapterTitle = currentChapter ? getChapterTitle(currentChapter) : (chapterInfo ? chapterInfo.title : '');
  const localizedHighlight = currentChapter
    ? (currentChapter.highlight || getChapterPreview(currentChapter))
    : (chapterInfo ? chapterInfo.highlight : '');
  const localizedNextPreview = nextChapter ? getChapterPreview(nextChapter) : nextPreview;

  let chapterHtml = '';
  if (chapterInfo && book) {
    chapterHtml = `
      <div class="bg-white/60 rounded-lg p-3 mb-3 text-left">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs font-bold text-ink">📖 ${localizedChapterTitle}</span>
          <span class="text-xs text-ink-light">${t('chapterProgress').replace('{current}', chapterInfo.current).replace('{total}', chapterInfo.total)}</span>
        </div>
        <div class="h-2 bg-wood/20 rounded-full overflow-hidden mb-1">
          <div class="h-full bg-gradient-to-r from-amber-500 to-magic-gold rounded-full transition-all duration-700" style="width:${chapterInfo.progressPct}%"></div>
        </div>
        <div class="flex justify-between text-xs text-ink-light">
          <span>${t('copiedPct').replace('{n}', chapterInfo.progressPct)}</span>
          <span>${t('remainingMinutes').replace('{n}', chapterInfo.remainingMinutes)}</span>
        </div>
      </div>
    `;
  }

  // Echoed sentence
  let echoHtml = '';
  if (localizedHighlight) {
    echoHtml = `
      <div class="bg-amber-50/80 border-l-4 border-magic-gold rounded-r-lg p-3 mb-3 text-left">
        <div class="text-xs text-magic-gold font-bold mb-1">${t('justCopiedSentence')}</div>
        <p class="text-sm text-ink italic leading-relaxed">「${localizedHighlight}」</p>
      </div>
    `;
  }

  // Next chapter preview
  let nextPreviewHtml = '';
  if (localizedNextPreview) {
    nextPreviewHtml = `
      <div class="bg-stone-50/80 border-l-4 border-stone-300 rounded-r-lg p-3 mb-3 text-left">
        <div class="text-xs text-ink-light font-bold mb-1">${t('nextChapterQuotePreview')}</div>
        <p class="text-sm text-ink-light leading-relaxed">${localizedNextPreview}</p>
      </div>
    `;
  }

  // Momo review
  let momoHtml = '';
  if (momoReview) {
    momoHtml = `
      <div class="bg-magic-gold/5 border border-magic-gold/20 rounded-lg p-3 mb-3">
        <div class="flex items-start gap-2">
          <span class="text-xl flex-shrink-0">🦉</span>
          <div class="text-left">
            <span class="text-xs text-magic-gold font-bold">${t('momosBookReview')}</span>
            <p class="text-xs text-ink-light leading-relaxed mt-0.5">${momoReview}</p>
          </div>
        </div>
      </div>
    `;
  }

  const overlay = el('div', 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4');
  const card = el('div', 'parchment-bg rounded-2xl p-5 max-w-md w-full text-center magic-glow animate-scale-in');

  card.innerHTML = `
    <div class="flex items-start gap-4 mb-3 text-left">
      <div class="text-4xl flex-shrink-0">✨</div>
      <div class="flex-1 min-w-0">
        <h3 class="font-display text-lg font-bold leading-tight">${t('focusCompleted')}</h3>
        <div class="flex gap-3 mt-1 text-xs text-ink-light">
          ${streak !== undefined ? `<span>🔥 ${t('streakDays').replace('{n}', streak)}</span>` : ''}
          ${totalWords !== undefined ? `<span>📝 ${t('totalWordsLabel').replace('{n}', totalWords.toLocaleString())}</span>` : ''}
        </div>
      </div>
    </div>
    <div class="grid grid-cols-3 gap-2 mb-3">
      <div class="bg-white/60 rounded-lg p-2">
        <div class="text-base font-bold text-magic-blue">${minutes}</div>
        <div class="text-[10px] text-ink-light">${t('unitMinutes')}</div>
      </div>
      <div class="bg-white/60 rounded-lg p-2">
        <div class="text-base font-bold text-magic-blue">${words.toLocaleString()}</div>
        <div class="text-[10px] text-ink-light">${t('copiedWordsLabel')}</div>
      </div>
      <div class="bg-white/60 rounded-lg p-2">
        <div class="text-base font-bold text-magic-gold">+${coins}</div>
        <div class="text-[10px] text-ink-light">${t('coins')}</div>
      </div>
    </div>
    ${milestoneHtml}
    ${chapterHtml}
    ${echoHtml}
    ${nextPreviewHtml}
    ${momoHtml}
    <div class="bg-white/60 rounded-lg p-2.5 mb-2 text-left">
      <label class="text-[10px] text-ink-light block mb-0.5" for="focus-session-label">${t('focusSessionLabelPrompt')}</label>
      <input type="text" id="focus-session-label"
        class="w-full px-2.5 py-1.5 bg-white border border-wood rounded-lg text-sm text-ink focus:outline-none focus:border-magic-gold"
        placeholder="${t('focusSessionLabelPlaceholder')}" maxlength="40" autocomplete="off">
    </div>
    <div class="italic text-ink-light mb-2 text-xs">「${quoteText}」${quoteSource}</div>
    <button class="px-6 py-2.5 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all text-sm">${t('continueText')}</button>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  card.style.maxHeight = '85vh';
  card.style.overflowY = 'auto';

  const btn = card.querySelector('button');
  const labelInput = card.querySelector('#focus-session-label');
  const finish = () => {
    const label = labelInput ? labelInput.value.trim().slice(0, 40) : '';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => {
      overlay.remove();
      if (callback) callback(label);
    }, 300);
  };
  btn.addEventListener('click', finish);
  if (labelInput) {
    labelInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finish();
    });
  }
}
