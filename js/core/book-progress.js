// 书籍进度核心逻辑 —— 状态拥有者
// 负责：应用字数、解锁章节、完成书籍、上架

import { state, saveState } from '../state.js';
import { BOOKS } from '../../data/books.js';
import { getEffectiveCopiedWords } from './book-utils.js';
import { isNoMasteryBook } from './book-eligibility.js';
import { addAtmosphere, addCoins, addHistory, addInspiration } from '../storage.js';
import { placeOnShelf, removeFromManuscriptBox, isBookCapacityFull } from '../capacity.js';
import { addDiaryEntry } from '../diary.js';
import { checkTaskCompletion } from '../quests.js';

/**
 * 将字数应用到指定书籍，更新 copiedWords 并解锁章节。
 * @returns {object} { newlyUnlockedChapters: Array, didComplete: boolean }
 */
export function applyWords(bookId, wordsGained) {
  const bookState = state.books[bookId];
  const book = BOOKS[bookId];
  if (!bookState || !book) return { newlyUnlockedChapters: [], didComplete: false };

  const totalWords = book.totalWords || 1;
  const prevCopyCount = bookState.copyCount || 0;
  const startEffectiveWords = getEffectiveCopiedWords(bookState, totalWords);
  const projectedEffective = startEffectiveWords + wordsGained;
  const didComplete = projectedEffective >= totalWords;

  // 封顶到本次完成边界：一次专注只能完成一个周期
  if (didComplete) {
    bookState.copiedWords = (prevCopyCount + 1) * totalWords;
  } else {
    bookState.copiedWords = prevCopyCount * totalWords + projectedEffective;
  }

  // 检查章节解锁
  const newlyUnlockedChapters = [];
  if (book.chapters) {
    book.chapters.forEach((ch, idx) => {
      if (!bookState.unlockedChapters.includes(idx + 1) && bookState.copiedWords >= ch.unlockAt) {
        bookState.unlockedChapters.push(idx + 1);
        newlyUnlockedChapters.push({ bookId, chapterIdx: idx, chapter: ch });
      }
    });
  }

  newlyUnlockedChapters.forEach(u => checkTaskCompletion('chapter_unlocked', u));

  return { newlyUnlockedChapters, didComplete, prevCopyCount };
}

/**
 * 完成一本书籍的一个周期：更新 copyCount/masteryLevel/status，发放奖励，上架。
 * @returns {object} { isFirstCompletion, copyCount, masteryLevel, completedBook }
 */
export function completeBook(bookId) {
  const bookState = state.books[bookId];
  const book = BOOKS[bookId];
  if (!bookState || !book) return null;

  const prevCopyCount = bookState.copyCount || 0;
  const isFirstCompletion = prevCopyCount === 0;

  bookState.copyCount = prevCopyCount + 1;
  if (!isNoMasteryBook(bookId)) {
    // 普通书：首次完成即 master（重抄保持 master）
    bookState.masteryLevel = 5;
  }

  if (isFirstCompletion) {
    bookState.status = 'completed';
  }

  if (bookState.reCopyUnlocked) {
    bookState.reCopyUnlocked = false;
  }

  // 发放单次完成奖励：单卷奖励减半
  const isVolume = book.isVolume === true;
  const atmoReward = (book.totalWords < 30000 ? 3 : book.totalWords < 100000 ? 6 : 10) * (isVolume ? 0.5 : 1);
  const coinReward = 50 * (isVolume ? 0.5 : 1);
  const mult = isFirstCompletion ? 1 : 0.5;
  addAtmosphere(Math.floor(atmoReward * mult));
  addCoins(Math.floor(coinReward));

  addHistory('achievement',
    `完成《${book.title}》誊抄！`,
    `第${bookState.copyCount}次誊抄 · 熟练度 Lv${bookState.masteryLevel || Math.min(5, bookState.copyCount)}`);
  addDiaryEntry('book_complete', { title: book.title, copyCount: bookState.copyCount, mastery: bookState.masteryLevel || Math.min(5, bookState.copyCount) });

  checkTaskCompletion('book_completed', { bookId });

  if (isFirstCompletion) {
    if (isBookCapacityFull()) {
      addHistory('action', '📦 书架已满，等待扩容', `《${book.title}》誊抄完成，暂存手稿箱——请前往商店扩充书架`);
    } else {
      removeFromManuscriptBox(bookId);
      placeOnShelf(bookId);
      addHistory('action', '📚 上架', `《${book.title}》已从手稿箱移入书架`);
    }
  }

  saveState();

  return {
    isFirstCompletion,
    copyCount: bookState.copyCount,
    masteryLevel: bookState.masteryLevel,
    completedBook: book
  };
}

/**
 * 修复书籍进度：损坏的书正在修复中，增加 repairProgress。
 * @returns {object|null} { repairCompleted, repairBookTitle } 或 null（书未损坏）
 */
export function applyRepairProgress(bookId, wordsGained) {
  const bookState = state.books[bookId];
  const book = BOOKS[bookId];
  if (!bookState || !bookState.damaged || !bookState.repairWords) return null;

  bookState.repairProgress = (bookState.repairProgress || 0) + wordsGained;
  if (bookState.repairProgress >= bookState.repairWords) {
    const repairBookTitle = book.title || '';
    bookState.damaged = false;
    bookState.repairProgress = 0;
    bookState.repairWords = 0;

    if (book.totalWords > 0 && bookState.copiedWords > 0 && (bookState.copiedWords % book.totalWords) === 0) {
      bookState.status = 'completed';
    }

    addCoins(30);
    addInspiration(1);
    addAtmosphere(1);
    addHistory('repair', `🩹 《${repairBookTitle}》修复完成！`, `+30智慧之光 · +1✨灵感 · +1氛围`);
    addDiaryEntry('special_event', { detail: `🩹 墨墨检查了《${repairBookTitle}》——损毁的页面已经补好了，墨迹新鲜，羊皮纸平整。你比上一任守护者用心。` });

    saveState();
    return { repairCompleted: true, repairBookTitle };
  }

  return { repairCompleted: false };
}
