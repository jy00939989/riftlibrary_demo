// 保养预约核心动作（锁定待修，servicing-room-plan v3 定稿）
// 状态字段：bs.servicing = 'locked'（在馆锁定）| 'pending'（在借预约，还回自动转 locked）| undefined
// 职责边界：本模块只管打标/取消/回架/计数；
//   还回兑现与损毁取消在 visitors.js collectReturn 内联（同事务），失窃清除在内联 disasters.js——避免循环依赖。
import { state, saveState } from '../state.js';
import { BOOKS } from '../../data/books.js';
import { addHistory } from '../storage.js';
import { getServicingSlots } from '../capacity.js';

// ========== 查询 ==========

export function getBookServicing(bookId) {
  return state.books[bookId]?.servicing || null;
}

/** 已占用格数：locked + pending 各占 1（damaged 不占格，v1 拍板：容量只闸主动行为） */
export function getServicingUsed() {
  let used = 0;
  for (const bs of Object.values(state.books || {})) {
    if (bs && bs.servicing) used += 1;
  }
  return used;
}

export function isServicingFull() {
  return getServicingUsed() >= getServicingSlots();
}

/** 是否「已保养待回架」：locked 且磨损已清零（wear=0 的 locked 只可能来自保养结算，§五.4） */
export function isAwaitingShelfReturn(bookId) {
  const bs = state.books[bookId];
  return !!bs && bs.servicing === 'locked' && (bs.wearCount || 0) <= 0;
}

/** 全部待回架书 id（保养台条带用） */
export function getAwaitingShelfReturnBooks() {
  return Object.entries(state.books || {})
    .filter(([id, bs]) => isAwaitingShelfReturn(id) && BOOKS[id])
    .map(([id, bs]) => ({
      bookId: id,
      title: BOOKS[id].volumeTitle || BOOKS[id].title,
      emoji: BOOKS[id].emoji
    }));
}

/**
 * 可否打预约（UI 判断是否显示开关）。
 * 返回 { ok, reason }：damaged / indestructible / dusty / not_completed
 */
export function canMarkServicing(bookId) {
  const bs = state.books[bookId];
  const book = BOOKS[bookId];
  if (!bs || !book || bs.status !== 'completed') return { ok: false, reason: 'not_completed' };
  if (bs.damaged) return { ok: false, reason: 'damaged' };
  if (book.indestructible) return { ok: false, reason: 'indestructible' };
  if (bs.dustyAt) return { ok: false, reason: 'dusty' };
  return { ok: true };
}

// ========== 动作 ==========

/**
 * 打预约。lent=true（书在借）→ 'pending'，还回时 collectReturn 兑现转 'locked'；
 * lent=false（书在馆）→ 立即 'locked'。
 * 容量满拒绝（reason: 'full'）。
 */
export function markServicing(bookId, { lent = false } = {}) {
  const chk = canMarkServicing(bookId);
  if (!chk.ok) return { ok: false, reason: chk.reason };
  if (isServicingFull()) return { ok: false, reason: 'full' };
  const bs = state.books[bookId];
  const book = BOOKS[bookId];
  const title = book.volumeTitle || book.title;
  bs.servicing = lent ? 'pending' : 'locked';
  if (lent) {
    addHistory('maintenance', `📅 《${title}》已打保养预约`, '还回后自动锁定，访客不会再借走它');
  } else {
    addHistory('maintenance', `🔒 《${title}》已锁定待保养`, '访客不会再借走它 · 保养完成后手动回架');
  }
  saveState();
  return { ok: true, servicing: bs.servicing };
}

/** 取消预约/锁定：书立即回可借池，磨损保留 */
export function cancelServicing(bookId) {
  const bs = state.books[bookId];
  if (!bs || !bs.servicing) return false;
  const book = BOOKS[bookId];
  const title = book ? (book.volumeTitle || book.title) : bookId;
  delete bs.servicing;
  addHistory('maintenance', `🔓 《${title}》已解除保养预约`, '书立即恢复可借，磨损保留');
  saveState();
  return true;
}

/** 回架（决策 ③：手动确认）：仅 locked 可回架，清标记回可借池 */
export function returnToShelf(bookId) {
  const bs = state.books[bookId];
  if (!bs || bs.servicing !== 'locked') return false;
  const book = BOOKS[bookId];
  const title = book ? (book.volumeTitle || book.title) : bookId;
  delete bs.servicing;
  addHistory('maintenance', `📚 《${title}》已回架`, '保养完成 · 书况崭新，重新进入借书循环');
  saveState();
  return true;
}
