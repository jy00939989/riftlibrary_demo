// Plane quest chapter indicator for the focus page
import { state } from '../../state.js';
import { BOOKS } from '../../../data/books.js';
import { el, getChapterTitle } from '../common.js';
import { getActiveChapterTaskForBook } from '../../quests.js';
import { t } from '../../i18n/terms.js';

function getPlanePageLink() {
  return `<a href="#" class="underline font-bold text-magic-blue" onclick="window.switchTab('archive')">${t('planePage')}</a>`;
}

function buildChapterUnlockedMessage(chapterNum, chapter) {
  return t('chapterUnlockedPrompt')
    .replace('{n}', chapterNum)
    .replace('{title}', getChapterTitle(chapter))
    .replace('{link}', getPlanePageLink());
}

function buildCopyingChapterMessage(questInfo, chapterNum, chapter, wordsNeeded) {
  const character = `<b>${questInfo.characterEmoji} ${questInfo.characterName}</b>`;
  return t('copyingChapterFor')
    .replace('{character}', character)
    .replace('{n}', chapterNum)
    .replace('{title}', getChapterTitle(chapter))
    .replace('{words}', wordsNeeded.toLocaleString());
}

export function renderQuestChapterIndicator(sess, book) {
  const questInfo = getActiveChapterTaskForBook(sess.bookId);
  if (!questInfo) return null;

  const bs = state.books[sess.bookId];
  const copiedWords = bs?.copiedWords || 0;
  const chapter = book.chapters[questInfo.chapterIdx];
  if (!chapter) return null;

  const chapterNum = questInfo.chapterIdx + 1;
  const alreadyUnlocked = bs?.unlockedChapters?.includes(chapterNum);
  const wordsNeeded = Math.max(0, (chapter.unlockAt || 0) - copiedWords);

  const div = el('div', 'mt-3 mb-1');
  div.id = 'quest-chapter-indicator';

  if (alreadyUnlocked) {
    div.innerHTML = `
      <div class="flex items-center gap-2 text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        <span>✅</span>
        <span class="text-green-800">${buildChapterUnlockedMessage(chapterNum, chapter)}</span>
      </div>
    `;
  } else {
    div.innerHTML = `
      <div class="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        <span>✉️</span>
        <span class="text-amber-900">${buildCopyingChapterMessage(questInfo, chapterNum, chapter, wordsNeeded)}</span>
      </div>
    `;
  }

  return div;
}

export function updateQuestChapterIndicatorDOM(sess) {
  const div = document.getElementById('quest-chapter-indicator');
  if (!div) return;
  const book = sess.bookId ? BOOKS[sess.bookId] : null;
  if (!book) return;
  const questInfo = getActiveChapterTaskForBook(sess.bookId);
  if (!questInfo) { div.innerHTML = ''; return; }

  const bs = state.books[sess.bookId];
  const copiedWords = bs?.copiedWords || 0;
  const chapter = book.chapters[questInfo.chapterIdx];
  if (!chapter) return;

  const chapterNum = questInfo.chapterIdx + 1;
  const alreadyUnlocked = bs?.unlockedChapters?.includes(chapterNum);
  const wordsNeeded = Math.max(0, (chapter.unlockAt || 0) - copiedWords);

  if (alreadyUnlocked) {
    div.innerHTML = `
      <div class="flex items-center gap-2 text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        <span>✅</span>
        <span class="text-green-800">${buildChapterUnlockedMessage(chapterNum, chapter)}</span>
      </div>
    `;
  } else {
    div.innerHTML = `
      <div class="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        <span>✉️</span>
        <span class="text-amber-900">${buildCopyingChapterMessage(questInfo, chapterNum, chapter, wordsNeeded)}</span>
      </div>
    `;
  }
}
