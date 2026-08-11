// 专注会话生命周期 —— 状态拥有者
// 负责：开始、暂停、完成、放弃；不操作弹窗、不渲染 DOM

import { state, saveState } from '../state.js';
import { startTimer, togglePauseTimer, abandonTimer } from '../timer.js';
import { updateStreak, addHistory } from '../storage.js';
import { addWaterOpportunity } from '../plants.js';
import { getAuraSpeedBonus } from '../visitors.js';
import { getCurationFocusSpeed } from '../curation.js';
import { isRestorationUnlocked, getRestorationRepairSpeedBonus } from '../capacity.js';
import { getFocusSpeedMultiplier } from '../shop.js';
import { getChapterInfo } from './book-utils.js';
import { calculateWordsGained, calculateCoinsEarned } from './focus-rewards.js';
import { applyWords, completeBook, applyRepairProgress } from './book-progress.js';
import { BOOKS } from '../../data/books.js';

export function startFocus(bookId, mode, targetMinutes) {
  const bs = state.books[bookId];
  if (!bs || bs.status === 'locked') return { ok: false, reason: 'book_not_available' };

  if (bs.status === 'unlocked' || bs.status === 'completed') {
    bs.status = 'copying';
  }

  state.currentSession = {
    active: true,
    mode,
    bookId,
    targetMinutes,
    elapsedSeconds: 0,
    paused: false,
    intervalId: null,
    quoteIndex: 0,
    teaBoost: state.pendingTeaBoost || false,
    candleInspiration: state.pendingCandleInspiration || false
  };

  state.pendingTeaBoost = false;
  state.pendingCandleInspiration = false;

  startTimer();
  saveState();
  return { ok: true };
}

export function togglePauseFocus() {
  togglePauseTimer();
}

export function abandonFocus() {
  abandonTimer();
}

/**
 * 完成一次专注。
 * @returns {object|null} 结果对象，供 orchestrator / app.js 消费；返回 null 表示 session 不活跃。
 */
export function completeFocus(isAuto = false) {
  const sess = state.currentSession;
  if (!sess.active) return null;

  const minutes = Math.round(sess.elapsedSeconds / 60);
  if (minutes < 1 && !isAuto) {
    return { ok: false, reason: 'too_short' };
  }

  const bookCategory = sess.bookId ? BOOKS[sess.bookId]?.category : null;
  const auraSpeed = getAuraSpeedBonus(bookCategory);
  const curationSpeed = getCurationFocusSpeed();
  const bookIsDamaged = sess.bookId && state.books[sess.bookId] && state.books[sess.bookId].damaged;
  const repairSpeedBonus = (bookIsDamaged && isRestorationUnlocked()) ? getRestorationRepairSpeedBonus() : 0;

  const wordsGained = calculateWordsGained({
    minutes,
    teaBoost: sess.teaBoost,
    focusSpeedMultiplier: getFocusSpeedMultiplier(),
    auraSpeed,
    curationSpeed,
    repairSpeedBonus,
    getChapterInfo,
    book: sess.bookId ? BOOKS[sess.bookId] : null,
    bookState: sess.bookId ? state.books[sess.bookId] : null
  });

  // 更新统计
  const prevTotalWords = state.focus.totalWords;
  state.focus.totalMinutes += minutes;
  state.focus.totalWords += wordsGained;
  updateStreak();

  // 植物浇水机会
  if (sess.mode === 'pomodoro' && minutes >= 20) {
    addWaterOpportunity();
  }

  // 书籍进度
  let bookProgressResult = null;
  let repairResult = null;
  if (sess.bookId) {
    const applied = applyWords(sess.bookId, wordsGained);
    bookProgressResult = {
      bookId: sess.bookId,
      ...applied
    };

    if (applied.didComplete) {
      bookProgressResult.completion = completeBook(sess.bookId);
    }

    repairResult = applyRepairProgress(sess.bookId, wordsGained);
  }

  // 金币计算保留给调用方（app.js / focus-orchestrator），因为需要 aura/curation/achievement 加成
  // 重置会话
  sess.active = false;
  sess.elapsedSeconds = 0;
  sess.paused = false;
  sess.teaBoost = false;
  sess.candleInspiration = false;

  saveState();

  return {
    ok: true,
    minutes,
    wordsGained,
    bookId: sess.bookId,
    prevTotalWords,
    currentTotalWords: state.focus.totalWords,
    bookProgressResult,
    repairResult
  };
}
