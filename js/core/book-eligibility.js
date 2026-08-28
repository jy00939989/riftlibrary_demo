// 书籍可玩性规则判断 —— 运行时规则层
// 不拥有状态，只根据 BOOKS / VOLUME_GROUPS / state 做判断

import { BOOKS } from '../../data/books.js';
import { isVolumeBookId, getVolumeGroupByCollectedId } from '../../data/volume_groups.js';

/**
 * 判断一本书是否不参与精通/重抄系统
 * - 数据显式标记 noMastery
 * - 分卷单卷（完成使命后合成典藏版）
 * - 典藏版（合成后即为终点产物）
 */
export function isNoMasteryBook(bookId) {
  if (!bookId) return false;
  const book = BOOKS[bookId];
  if (!book) return false;
  if (book.noMastery === true) return true;
  if (isVolumeBookId(bookId)) return true;
  if (getVolumeGroupByCollectedId(bookId)) return true;
  return false;
}

/**
 * 判断一本书当前是否可以重抄
 * - noMastery 书不可重抄
 * - 已完成的书可以重抄（已解锁 reCopyUnlocked 时直接可抄）
 */
export function canBookBeRecopied(bookId, bookState) {
  if (!bookId || !bookState) return false;
  if (isNoMasteryBook(bookId)) return false;
  return bookState.status === 'completed';
}

/**
 * 判断一本书是否可以作为笔类道具的目标
 * - 未锁定
 * - 未完成 或 已完成但允许重抄（即不是 noMastery）
 */
export function isBookEligibleForBrush(bookId, bookState) {
  const book = BOOKS[bookId];
  if (!bookState || !book) return false;
  if (bookState.status === 'locked') return false;
  if (bookState.status === 'completed') {
    return !isNoMasteryBook(bookId);
  }
  return true;
}
