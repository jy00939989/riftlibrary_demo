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
