// @pure — testable in Node without DOM
// 书籍/章节纯工具函数

// CANONICAL_BOOK_FIELDS — 书籍记录工厂默认值
const CANONICAL_BOOK_FIELDS = {
  unlockedChapters: [1],
  copyCount: 0,
  masteryLevel: 0,
  copiedWords: 0,
  status: 'unlocked',
  starred: false,
  damaged: false,
  repairWords: 0,
  repairProgress: 0,
  wearCount: 0,
  borrowTimes: 0,
  readChapters: [],
  reCopyUnlocked: false
};

export function createBookRecord(overrides = {}) {
  return { ...CANONICAL_BOOK_FIELDS, ...overrides };
}

export function getEffectiveCopiedWords(bookState, totalWords) {
  if (!bookState || !totalWords) return 0;
  const copyCount = bookState.copyCount || 0;
  const copiedWords = bookState.copiedWords || 0;
  if (copyCount === 0) return copiedWords;
  return copiedWords % totalWords;
}

export function getWordsToNextCompletion(bookState, totalWords) {
  if (!bookState || !totalWords) return totalWords;
  const effective = getEffectiveCopiedWords(bookState, totalWords);
  return totalWords - effective;
}

/**
 * 估算当前书还需多少【现实】分钟抄完。
 * 公式对齐 timer.js tick 的实际结算：wordsGained = round(elapsedSec/60) × 100 × focusMultiplier × (1+aura+curation)，冲刺 ×1.2。
 * （首 5 分钟茶饮 110/分钟略快于估算，方向保守，忽略不计。）
 * @param {object} p
 * @param {number} p.totalWords        书总字数
 * @param {number} p.effectiveWords    本周期已完成有效字数
 * @param {number} [p.elapsedSeconds=0] 进行中会话的游戏内秒数（非进行中传 0）
 * @param {number} [p.focusMultiplier=1] 专注倍率
 * @param {number} [p.auraSpeed=0]     光环加速
 * @param {number} [p.curationSpeed=0] 策展加速
 * @param {boolean} [p.sprint=false]   90% 章节冲刺 ×1.2
 * @param {number} [p.speedMultiplier=1] 会话倍率（墨墨首会 10×，只影响进行中会话的现实分钟）
 * @returns {number|null} 剩余现实分钟（向上取整）；已完成返回 0；倍率非正返回 null
 */
export function estimateRemainingMinutes({ totalWords, effectiveWords, elapsedSeconds = 0, focusMultiplier = 1, auraSpeed = 0, curationSpeed = 0, sprint = false, speedMultiplier = 1 }) {
  const wordsNeeded = (totalWords || 0) - (effectiveWords || 0);
  if (wordsNeeded <= 0) return 0;
  const fm = focusMultiplier == null ? 1 : focusMultiplier;
  const rate = 100 * fm * (1 + (auraSpeed || 0) + (curationSpeed || 0)) * (sprint ? 1.2 : 1);
  if (!(rate > 0)) return null;
  const totalMin = Math.ceil(wordsNeeded / rate);
  const doneMin = Math.round((elapsedSeconds || 0) / 60);
  const remainGameMin = Math.max(0, totalMin - doneMin);
  const speed = (speedMultiplier > 0 ? speedMultiplier : 1);
  return Math.ceil(remainGameMin / speed);
}

export function getChapterInfo(book, bookState) {
  if (!book || !book.chapters || book.chapters.length === 0) return null;

  const totalWords = book.totalWords || 1;
  const effectiveWords = getEffectiveCopiedWords(bookState, totalWords);

  let currentChapter = null;
  let chapterIndex = -1;
  for (let i = book.chapters.length - 1; i >= 0; i--) {
    if (effectiveWords >= book.chapters[i].unlockAt) {
      currentChapter = book.chapters[i];
      chapterIndex = i;
      break;
    }
  }

  if (!currentChapter) return null;

  const chapterStart = currentChapter.unlockAt;
  const progressInChapter = Math.min(currentChapter.words, effectiveWords - chapterStart);
  const remainingWords = Math.max(0, currentChapter.words - progressInChapter);
  const progressPct = Math.min(100, Math.round((progressInChapter / currentChapter.words) * 100));
  const remainingMinutes = Math.ceil(remainingWords / 100);

  return {
    current: chapterIndex + 1,
    total: book.chapters.length,
    title: currentChapter.title,
    progressPct,
    remainingWords,
    remainingMinutes,
    highlight: currentChapter.highlight || currentChapter.preview
  };
}

export function getNextChapterPreview(book, bookState) {
  if (!book || !book.chapters) return null;
  const totalWords = book.totalWords || 1;
  const effectiveWords = getEffectiveCopiedWords(bookState, totalWords);

  let chapterIndex = -1;
  for (let i = book.chapters.length - 1; i >= 0; i--) {
    if (effectiveWords >= book.chapters[i].unlockAt) {
      chapterIndex = i;
      break;
    }
  }

  const nextChapter = book.chapters[chapterIndex + 1];
  return nextChapter ? (nextChapter.preview || null) : null;
}

export function getBookProgress(bookId, booksData, allBookDefs) {
  const book = allBookDefs[bookId];
  const bookState = booksData[bookId];
  if (!book || !bookState) return 0;
  const effective = getEffectiveCopiedWords(bookState, book.totalWords);
  return Math.round((effective / book.totalWords) * 100);
}

export function getUnlockedChapters(bookId, booksData) {
  const bookState = booksData[bookId];
  return bookState ? bookState.unlockedChapters : [];
}

export function canBorrowBook(bookId, booksData) {
  const bookState = booksData[bookId];
  return bookState && bookState.status === 'completed';
}

/**
 * 获取书籍修复进度信息
 * @returns {object|null} { remaining, total, pct } 或 null（书未损坏）
 */
export function getRepairProgress(bookState) {
  if (!bookState || !bookState.damaged || !bookState.repairWords) return null;
  const total = bookState.repairWords || 1;
  const done = bookState.repairProgress || 0;
  const remaining = Math.max(0, total - done);
  const pct = Math.min(100, Math.round((done / total) * 100));
  return { remaining, total, done, pct };
}
