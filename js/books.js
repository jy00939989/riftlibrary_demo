// 书籍系统模块
import { state, saveState } from './state.js';
import { BOOKS } from '../data/books.js';
import { addCoins, addAtmosphere, addHistory } from './storage.js';
import { renderBookshelfPage } from './render/index.js';
import { unlockBook } from './capacity.js';

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

  if (!unlockBook(randomId)) {
    addCoins(50);
    addHistory('unlock', '手稿箱已满，暂无法解锁新书', '获得50智慧之光补偿');
    return null;
  }

  addHistory('unlock', `解锁新书《${book.title}》`, `${book.author} · ${book.category}`);
  saveState();
  return book;
}

import { getBookProgress as _getBookProgress, getUnlockedChapters as _getUnlockedChapters, canBorrowBook as _canBorrowBook } from './core/book-utils.js';
import { state } from './state.js';
import { BOOKS } from '../data/books.js';

export function getBookProgress(bookId) { return _getBookProgress(bookId, state.books, BOOKS); }
export function getUnlockedChapters(bookId) { return _getUnlockedChapters(bookId, state.books); }
export function canBorrowBook(bookId) { return _canBorrowBook(bookId, state.books); }
