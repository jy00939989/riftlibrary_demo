// 渲染工具函数 + 状态栏更新（共享，避免循环引用）
import { state } from '../state.js';
import { BOOKS } from '../../data/books.js';
import { t, getLocale } from '../i18n/terms.js';

// 由 app.js 在初始化时注入
export let actions = {};
export function setActions(a) { actions = a; }

// 全局状态栏更新（所有模块统一入口，避免多处重复DOM操作）
export function updateStatusBar() {
  const coinsEl = document.getElementById('status-coins');
  const atmosEl = document.getElementById('status-atmosphere');
  const inspEl = document.getElementById('status-inspiration');
  const nameEl = document.getElementById('nav-library-name');
  if (coinsEl) coinsEl.textContent = state.coins.toLocaleString();
  if (atmosEl) atmosEl.textContent = `${state.library.atmosphere}/500`;
  if (inspEl) inspEl.textContent = (state.inspiration || 0).toString();
  if (nameEl) nameEl.textContent = state.library.name;

  // 同步小屏资源展开卡片（方案 B）
  const coinsCardEl = document.getElementById('status-coins-card');
  const atmosCardEl = document.getElementById('status-atmosphere-card');
  const inspCardEl = document.getElementById('status-inspiration-card');
  if (coinsCardEl) coinsCardEl.textContent = state.coins.toLocaleString();
  if (atmosCardEl) atmosCardEl.textContent = `${state.library.atmosphere}/500`;
  if (inspCardEl) inspCardEl.textContent = (state.inspiration || 0).toString();
}

export function el(tag, classes = '', attrs = {}, children = []) {
  const e = document.createElement(tag);
  if (classes) e.className = classes;
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v;
    else e.setAttribute(k, v);
  }
  for (const child of children) {
    if (typeof child === 'string') e.appendChild(document.createTextNode(child));
    else if (child) e.appendChild(child);
  }
  return e;
}

export function h(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.firstElementChild;
}

export function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function updateTimerDisplay(timeStr, totalWords, bookWords) {
  const display = document.querySelector('#page-focus .text-6xl');
  if (display) display.textContent = timeStr;
  const wordEl = document.querySelector('#page-focus .text-sm.text-ink-light.mt-1');
  if (wordEl && totalWords !== undefined) {
    wordEl.textContent = t('bookWordCount')
      .replace('{book}', (bookWords || 0).toLocaleString())
      .replace('{total}', totalWords.toLocaleString());
  }
  const miniTimer = document.getElementById('focus-mini-timer');
  if (miniTimer) miniTimer.textContent = timeStr;
  const activeWords = document.getElementById('focus-active-words');
  if (activeWords && totalWords !== undefined) activeWords.textContent = totalWords.toLocaleString();
  const bookWordEl = document.getElementById('focus-book-words');
  if (bookWordEl && bookWords !== undefined) bookWordEl.textContent = bookWords.toLocaleString();
}

// ========== 本地化书籍字段访问（优先英文） ==========

export function getBookTitle(book) {
  if (getLocale() === 'en') {
    return book.volumeTitle || book.titleEn || book.title;
  }
  return book.volumeTitle || book.title;
}

export function getBookDescription(book) {
  return getLocale() === 'en' && book.descriptionEn ? book.descriptionEn : book.description;
}

export function getBookCertMessage(book) {
  return getLocale() === 'en' && book.certMessageEn ? book.certMessageEn : book.certMessage;
}

export function getBookAuthorBio(book) {
  return getLocale() === 'en' && book.authorBioEn ? book.authorBioEn : book.authorBio;
}

export function getBookAnecdotes(book) {
  return getLocale() === 'en' && book.anecdotesEn ? book.anecdotesEn : book.anecdotes;
}

export function getBookReviews(book) {
  return getLocale() === 'en' && book.reviewsEn ? book.reviewsEn : book.reviews;
}

export function getChapterTitle(chapter) {
  return getLocale() === 'en' && chapter.titleEn ? chapter.titleEn : chapter.title;
}

export function getChapterPreview(chapter) {
  return getLocale() === 'en' && chapter.previewEn ? chapter.previewEn : chapter.preview;
}

export function getChapterContent(chapter) {
  return getLocale() === 'en' && chapter.contentEn ? chapter.contentEn : chapter.content;
}

export function getBookQuotes(book) {
  return getLocale() === 'en' && book.quotesEn ? book.quotesEn : book.quotes;
}
