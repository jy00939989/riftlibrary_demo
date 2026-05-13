// 书籍系统模块
import { state, saveState } from './state.js';
import { BOOKS } from '../data/books.js';
import { addCoins, addAtmosphere, addHistory } from './storage.js';
import { renderBookshelfPage } from './render/index.js';

export function tryUnlockNewBook() {
  // 获取所有未解锁的书籍
  const allBookIds = Object.keys(BOOKS);
  const unlockedIds = Object.keys(state.books).filter(id => state.books[id].status !== 'locked');
  const lockedIds = allBookIds.filter(id => !unlockedIds.includes(id));

  if (lockedIds.length === 0) {
    // 全部已解锁
    addCoins(50);
    addHistory('achievement', '全部书籍已解锁！', '获得 50 代币奖励');
    return null;
  }

  // 简单随机选择
  const randomId = lockedIds[Math.floor(Math.random() * lockedIds.length)];
  const book = BOOKS[randomId];

  state.books[randomId] = {
    unlockedChapters: [1],  // 第一章默认解锁
    copyCount: 0,
    masteryLevel: 1,
    copiedWords: 0,
    status: 'unlocked'
  };

  addHistory('unlock', `解锁新书《${book.title}》`, `${book.author} · ${book.category}`);
  saveState();
  return book;
}

export function getBookProgress(bookId) {
  const book = BOOKS[bookId];
  const bookState = state.books[bookId];
  if (!book || !bookState) return 0;
  return Math.round((bookState.copiedWords / book.totalWords) * 100);
}

export function getUnlockedChapters(bookId) {
  const bookState = state.books[bookId];
  return bookState ? bookState.unlockedChapters : [];
}

export function canBorrowBook(bookId) {
  const bookState = state.books[bookId];
  return bookState && bookState.status === 'completed';
}
