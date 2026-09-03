// 图书馆核心状态管理 —— 馆名、书架、自动上架
import { state, saveState } from '../state.js';
import { placeOnShelf, removeFromManuscriptBox } from '../capacity.js';

/**
 * 设置图书馆名称并锁定。
 * @param {string} name
 * @param {object} options
 * @returns {object} { ok: boolean, reason?: string }
 */
export function setLibraryName(name, options = {}) {
  const maxLength = options.maxLength || 12;
  const trimmed = name ? name.trim() : '';
  const finalName = trimmed || state.library.name;

  if (finalName.length > maxLength) {
    return { ok: false, reason: 'name_too_long' };
  }

  state.library.name = finalName;
  state.library.nameLocked = true;
  saveState();
  return { ok: true, name: finalName };
}

/**
 * 交换书架上两个槽位的书籍。
 * @returns {boolean} 是否成功交换
 */
export function swapShelfSlots(fromShelf, fromSlot, toShelf, toSlot) {
  const shelves = state.library.shelves;
  if (!shelves || !shelves[fromShelf] || !shelves[toShelf]) return false;
  if (fromShelf === toShelf && fromSlot === toSlot) return false;

  const tmp = shelves[fromShelf][fromSlot];
  shelves[fromShelf][fromSlot] = shelves[toShelf][toSlot];
  shelves[toShelf][toSlot] = tmp;
  saveState();
  return true;
}

/**
 * 自动将手稿箱中已完成的书籍上架到书架空位。
 * @returns {object} { changed: boolean, shelved: string[] }
 */
export function autoShelveCompletedManuscripts() {
  const mBox = state.manuscriptBox || [];
  if (mBox.length === 0) return { changed: false, shelved: [] };

  const shelved = [];
  let changed = false;

  for (let i = mBox.length - 1; i >= 0; i--) {
    const bookId = mBox[i];
    const bs = state.books[bookId];
    if (bs && bs.status === 'completed') {
      if (placeOnShelf(bookId)) {
        removeFromManuscriptBox(bookId);
        shelved.push(bookId);
        changed = true;
      } else {
        break; // 书架没空位了
      }
    }
  }

  if (changed) saveState();
  return { changed, shelved };
}
