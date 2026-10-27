// 古籍保养会话生命周期（book-maintenance-plan v2）
// 批次一体结算 + 挂起续作；只读消费 wearCount，不动损毁/修复公式
import { state, saveState } from '../state.js';
import { BOOKS } from '../../data/books.js';
import { addHistory } from '../storage.js';
import { addDiaryEntry } from '../diary.js';
import { markTaskDone } from '../dailytasks.js';
import { isBookLentOut, getAuraSpeedBonus } from '../visitors.js';
import { getMaintenanceWords, getMaintenanceRate } from '../../data/maintenance.js';
import { getBookCondition } from '../../data/borrow-levels.js';
import { startTimer, stopTimer } from '../timer.js';
import { calculateWordsGained } from './focus-rewards.js';
import { getFocusSpeedMultiplier } from '../shop.js';
import { getCurationFocusSpeed } from '../curation.js';
import { getRestorationRepairSpeedBonus, getMaintenanceBatchCap } from '../capacity.js';
import { getChapterInfo } from './book-utils.js';

function getNow() {
  return window.__dev && window.__dev.getNow ? window.__dev.getNow() : Date.now();
}

// ========== 查询 ==========

/** 可保养书列表（未损毁 / 非崭新 / 非典藏 / 未在借）。
 *  servicing-room-plan v3：locked 书置顶（「这几本躺着等你」的体感）——只动查询排序，不动结算公式。
 *  注意：startMaintenanceSession 只挡转录锁 status==='locked'，servicing 锁定书可正常入批，勿加额外判断。 */
export function getMaintainableBooks() {
  const out = [];
  for (const [bookId, bs] of Object.entries(state.books || {})) {
    const book = BOOKS[bookId];
    if (!book || !bs || bs.status === 'locked') continue;
    if (book.indestructible || bs.damaged) continue;
    const wear = bs.wearCount || 0;
    if (wear <= 0) continue;
    if (isBookLentOut(bookId)) continue;
    out.push({
      bookId,
      title: book.volumeTitle || book.title,
      emoji: book.emoji,
      wearCount: wear,
      condition: getBookCondition(wear),
      rate: getMaintenanceRate(wear),
      words: getMaintenanceWords(bs),
      servicing: bs.servicing || null
    });
  }
  return out.sort((a, b) => {
    if (!!a.servicing !== !!b.servicing) return a.servicing ? -1 : 1;
    return b.wearCount - a.wearCount;
  });
}

export function getMaintenanceSessionTotal(ms = state.maintenanceSession) {
  if (!ms) return 0;
  return ms.bookIds.reduce((s, id) => s + (ms.perBook[id] || 0), 0);
}

// ========== 批次生命周期 ==========

function isMaintainableNow(bookId) {
  const bs = state.books[bookId];
  const book = BOOKS[bookId];
  return !!(book && bs && bs.status !== 'locked' && !bs.damaged && !book.indestructible && !isBookLentOut(bookId));
}

/**
 * 脏数据兜底（评审钉子#3 + plan §五）：剔除已无法保养的书，退其工时（目标从批次移除，pool 不动）。
 * 挂起期间书被借出/损毁/重抄完成/copyCount 变化，都在这里被兜住。
 */
function sanitizeSession(ms) {
  const removed = [];
  ms.bookIds = ms.bookIds.filter(id => {
    const ok = isMaintainableNow(id);
    if (!ok) { removed.push(id); delete ms.perBook[id]; }
    return ok;
  });
  for (const id of removed) {
    const title = BOOKS[id] ? (BOOKS[id].volumeTitle || BOOKS[id].title) : id;
    addHistory('maintenance', `🧴 《${title}》已离开保养批次`, '借出中或已损毁，工时自动退回');
  }
  if (ms.bookIds.length === 0) state.maintenanceSession = null;
  return state.maintenanceSession;
}

/** 组建批次（在保养台勾选后调用） */
export function startMaintenanceSession(bookIds) {
  if (state.maintenanceSession) return { ok: false, reason: 'session_exists' };
  if (!Array.isArray(bookIds) || bookIds.length === 0) return { ok: false, reason: 'empty' };
  if (bookIds.length > getMaintenanceBatchCap()) return { ok: false, reason: 'over_cap' };
  const perBook = {};
  for (const id of bookIds) {
    const bs = state.books[id];
    if (!BOOKS[id] || !bs || bs.status === 'locked') return { ok: false, reason: 'invalid_book', bookId: id };
    if ((bs.wearCount || 0) <= 0 || bs.damaged || BOOKS[id].indestructible || isBookLentOut(id)) {
      return { ok: false, reason: 'not_maintainable', bookId: id };
    }
    perBook[id] = getMaintenanceWords(bs);
  }
  state.maintenanceSession = {
    bookIds: [...bookIds],
    perBook,
    progressPool: 0,
    startedAt: getNow(),
    pausedAt: null
  };
  saveState();
  return { ok: true, total: getMaintenanceSessionTotal(state.maintenanceSession) };
}

/** 取消批次（未开始或挂起中均可；无退款概念——工时未投入） */
export function cancelMaintenanceSession() {
  if (!state.maintenanceSession) return false;
  state.maintenanceSession = null;
  saveState();
  addHistory('maintenance', '🧴 保养批次已取消', '所选书籍的磨损维持原状');
  return true;
}

/** 开始/续作保养专注会话（批次须已组建） */
export function startMaintenanceFocus(mode = 'pomodoro', targetMinutes = 25) {
  let ms = state.maintenanceSession;
  if (!ms) return { ok: false, reason: 'no_session' };
  if (state.currentSession.active) return { ok: false, reason: 'busy' };
  ms = sanitizeSession(ms);
  if (!ms) return { ok: false, reason: 'batch_invalid' };

  state.currentSession = {
    mode,
    activity: 'maintenance',
    bookId: ms.bookIds[0],
    targetMinutes,
    elapsedSeconds: 0,
    fractionalSeconds: 0,
    paused: false,
    intervalId: null,
    quoteIndex: 0,
    lastQuoteMinute: 0,
    startTime: 0,
    lastTickTime: 0,
    speedMultiplier: 1,
    teaBoost: state.pendingTeaBoost || false,
    candleInspiration: state.pendingCandleInspiration || false
  };
  state.pendingTeaBoost = false;
  state.pendingCandleInspiration = false;
  startTimer();
  saveState();
  return { ok: true };
}

/** 结算：逐本磨损清零 + 历史/日记；奖励走每日任务钩子（plan v2 决策 4：保养零直接奖励） */
function settleMaintenanceSession() {
  const ms = state.maintenanceSession;
  if (!ms) return { completed: true, books: [] };
  sanitizeSession(ms);
  const cur = state.maintenanceSession;
  if (!cur) return { completed: true, books: [] };
  if (cur.progressPool < getMaintenanceSessionTotal(cur)) {
    saveState();
    return { completed: false, pool: cur.progressPool, total: getMaintenanceSessionTotal(cur) };
  }
  const titles = [];
  for (const id of cur.bookIds) {
    const bs = state.books[id];
    const book = BOOKS[id];
    if (!bs || !book) continue;
    bs.wearCount = 0;
    // 2026-10-26 图南拍板：保养完成赠 10 次借还保护期——期间还书损毁 roll 消耗 1 次并跳过
    bs.damageShield = 10;
    titles.push(book.volumeTitle || book.title);
    addHistory('maintenance', `🧴 《${book.volumeTitle || book.title}》保养完成`, '磨损清零 · 书况焕然一新');
  }
  if (titles.length > 0) {
    addDiaryEntry('special_event', {
      detail: `你给 ${titles.length} 本书做了保养：${titles.map(x => '《' + x + '》').join('、')}。墨墨检查了每一本的装订，满意地眯起眼睛。`
    });
    const task = markTaskDone('maintain');
    if (task) addHistory('event', `📜 每日任务「${task.name}」完成`, task.reward);
  }
  state.maintenanceSession = null;
  saveState();
  return { completed: true, books: titles };
}

/** completeFocus 路由：words 进批次池；满则整批结算 */
export function applyMaintenanceProgress(wordsGained) {
  let ms = state.maintenanceSession;
  if (!ms) return null;
  ms.progressPool = (ms.progressPool || 0) + Math.max(0, wordsGained || 0);
  // 先剔除再比较：挂起期间被借出/损毁的书会让目标收缩，剔除后可能当场达标（脏数据兜底）
  ms = sanitizeSession(ms);
  if (!ms) { saveState(); return { completed: true, books: [] }; }
  if (ms.progressPool >= getMaintenanceSessionTotal(ms)) {
    return settleMaintenanceSession();
  }
  saveState();
  return { completed: false, pool: ms.progressPool, total: getMaintenanceSessionTotal(ms) };
}

/** 会话内当前投入（含未入账的实时估算），供渲染与 tick 自动完成判定 */
export function getMaintenanceLiveProgress(sess = state.currentSession) {
  const ms = state.maintenanceSession;
  if (!ms) return null;
  const total = getMaintenanceSessionTotal(ms);
  if (total <= 0) return null;
  let live = 0;
  if (sess && sess.active && sess.activity === 'maintenance') {
    const minutes = (sess.elapsedSeconds || 0) / 60;
    if (minutes > 0) {
      live = calculateWordsGained({
        minutes,
        teaBoost: !!sess.teaBoost,
        focusSpeedMultiplier: getFocusSpeedMultiplier(),
        auraSpeed: getAuraSpeedBonus(sess.bookId ? BOOKS[sess.bookId]?.category : null),
        curationSpeed: getCurationFocusSpeed(),
        repairSpeedBonus: getRestorationRepairSpeedBonus(),
        getChapterInfo,
        book: sess.bookId ? BOOKS[sess.bookId] : null,
        bookState: sess.bookId ? state.books[sess.bookId] : null
      });
    }
  }
  const done = Math.min(total, (ms.progressPool || 0) + Math.max(0, live));
  return { done, total, pct: Math.min(100, Math.round((done / total) * 100)) };
}

/**
 * 中途退出 = 挂起（plan v2：批次一体，不存在"完成单本就溜"的中间态）。
 * 已投入工时全额入池保留，可随时续作；恰好补齐则当场结算。
 */
export function suspendMaintenanceFocus() {
  const sess = state.currentSession;
  if (!sess.active || sess.activity !== 'maintenance') return { ok: false, reason: 'not_maintenance' };
  const minutes = Math.round((sess.elapsedSeconds || 0) / 60);
  let credited = 0;
  if (minutes >= 1) {
    credited = calculateWordsGained({
      minutes,
      teaBoost: !!sess.teaBoost,
      focusSpeedMultiplier: getFocusSpeedMultiplier(),
      auraSpeed: getAuraSpeedBonus(sess.bookId ? BOOKS[sess.bookId]?.category : null),
      curationSpeed: getCurationFocusSpeed(),
      repairSpeedBonus: getRestorationRepairSpeedBonus(),
      getChapterInfo,
      book: sess.bookId ? BOOKS[sess.bookId] : null,
      bookState: sess.bookId ? state.books[sess.bookId] : null
    });
  }
  stopTimer();
  sess.active = false;
  sess.paused = false;
  sess.elapsedSeconds = 0;

  const ms = state.maintenanceSession;
  if (!ms) { saveState(); return { ok: true, credited, batchGone: true }; }
  ms.progressPool = (ms.progressPool || 0) + credited;
  ms.pausedAt = getNow();
  saveState();
  addHistory('maintenance', '🧴 保养批次已挂起',
    `进度保留 ${Math.min(ms.progressPool, getMaintenanceSessionTotal(ms)).toLocaleString()}/${getMaintenanceSessionTotal(ms).toLocaleString()}，可随时续作`);
  if (ms.progressPool >= getMaintenanceSessionTotal(ms)) settleMaintenanceSession();
  return { ok: true, credited };
}

/** 预计修复时长（分钟）：损坏通报弹窗用（plan v2：弹窗显示修复大概要多少时间） */
export function estimateRepairMinutes(bookState) {
  const repairWords = bookState?.repairWords || 0;
  if (repairWords <= 0) return 0;
  return Math.ceil(repairWords / (100 * (1 + getRestorationRepairSpeedBonus())));
}
