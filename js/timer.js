// 计时器模块 —— 只负责计时，完成逻辑交给 app.js
import { state, saveState } from './state.js';
import { addHistory, updateStreak } from './storage.js';
import { getFocusSpeedMultiplier } from './shop.js';
import { getAuraSpeedBonus } from './visitors.js';
import { getCurationFocusSpeed } from './curation.js';
import { getChapterInfo, getEffectiveCopiedWords } from './core/book-utils.js';
import { renderFocusPage, updateTimerDisplay, formatTime } from './render/index.js';
import { BOOKS } from '../data/books.js';

let timerInterval = null;

// 由 app.js 注入完成回调
let onComplete = null;
export function setCompleteCallback(fn) { onComplete = fn; }

// 是否为墨墨魔法加速中
let momoAccelerating = false;

export function isMomoAccelerating() { return momoAccelerating; }

export function startTimer() {
  const sess = state.currentSession;
  if (sess.active) return;

  sess.active = true;
  sess.elapsedSeconds = 0;
  sess.paused = false;
  sess.quoteIndex = 0;
  sess.startTime = Date.now();
  sess.teaBoost = false;
  sess.candleInspiration = false;

  // 行动卡 buff：热茶加速
  if (state.pendingTeaBoost) {
    sess.teaBoost = true;
    state.pendingTeaBoost = false;
  }
  // 行动卡 buff：烛台灵感
  if (state.pendingCandleInspiration) {
    sess.candleInspiration = true;
    state.pendingCandleInspiration = false;
  }

  // 首次专注：墨墨的魔法加速（10倍速）
  momoAccelerating = state.focus.totalMinutes === 0;

  // 缓存本次专注的书籍信息，用于正计时自动完成判断
  const bookId = sess.bookId;
  if (bookId && BOOKS[bookId]) {
    sess.bookCategory = BOOKS[bookId].category;
    const bookState = state.books[bookId];
    if (bookState) {
      const chInfo = getChapterInfo(BOOKS[bookId], bookState);
      sess.chapter90Sprint = chInfo && chInfo.progressPct >= 90;
    }
  }

  const interval = momoAccelerating ? 100 : 1000;
  timerInterval = setInterval(() => tick(), interval);
  sess.intervalId = timerInterval;
  saveState();
  renderFocusPage();
}

export function togglePauseTimer() {
  state.currentSession.paused = !state.currentSession.paused;
  saveState();
  renderFocusPage();
}

function tick() {
  const sess = state.currentSession;
  if (sess.paused || !sess.active) return;

  sess.elapsedSeconds += 1;

  // 倒计时/番茄钟模式：检测是否到时间
  if ((sess.mode === 'countdown' || sess.mode === 'pomodoro') && sess.targetMinutes > 0) {
    if (sess.elapsedSeconds >= sess.targetMinutes * 60) {
      stopTimer();
      if (onComplete) {
        try { onComplete(true); } catch (e) {
          renderFocusPage();
        }
      }
      return;
    }
  }

  // 正计时/番茄钟/倒计时：书籍达到当前周期 100% 时自动完成
  if (sess.bookId) {
    const book = BOOKS[sess.bookId];
    const bookState = state.books[sess.bookId];
    if (book && bookState) {
      const minutes = Math.round(sess.elapsedSeconds / 60);
      const auraSpeed = getAuraSpeedBonus(sess.bookCategory);
      const curationSpeed = getCurationFocusSpeed();
      const focusMultiplier = getFocusSpeedMultiplier();
      let wordsGained;
      if (sess.teaBoost) {
        const boostMin = Math.min(5, minutes);
        const normalMin = minutes - boostMin;
        wordsGained = Math.round((boostMin * 110 + normalMin * 100) * focusMultiplier * (1 + auraSpeed + curationSpeed));
      } else {
        wordsGained = Math.round(minutes * 100 * focusMultiplier * (1 + auraSpeed + curationSpeed));
      }
      if (sess.chapter90Sprint) wordsGained = Math.round(wordsGained * 1.20);

      const effectiveWords = getEffectiveCopiedWords(bookState, book.totalWords);
      const wordsNeeded = book.totalWords - effectiveWords;
      if (wordsNeeded > 0 && wordsGained >= wordsNeeded) {
        stopTimer();
        if (onComplete) {
          try { onComplete(true); } catch (e) {
            renderFocusPage();
          }
        }
        return;
      }
    }
  }

  // 每分钟触发誊抄预览刷新
  if (sess.elapsedSeconds % 60 === 0) {
    sess.quoteIndex += 1;
    renderFocusPage();
  }

  // 每秒更新计时器数字：倒计时/番茄钟显示剩余时间
  const isCountUp = sess.mode === 'stopwatch' || sess.targetMinutes === 0;
  const displaySeconds = isCountUp ? sess.elapsedSeconds : sess.targetMinutes * 60 - sess.elapsedSeconds;
  const timeStr = formatTime(Math.max(0, displaySeconds));
  const sessionEstimate = Math.round(sess.elapsedSeconds * 2 * getFocusSpeedMultiplier());
  const totalWords = state.focus.totalWords + sessionEstimate;
  const book = sess.bookId ? BOOKS[sess.bookId] : null;
  const bookState = sess.bookId ? state.books[sess.bookId] : null;
  const effectiveWords = book && bookState ? getEffectiveCopiedWords(bookState, book.totalWords) : 0;
  const bookWords = book ? effectiveWords + sessionEstimate : 0;
  updateTimerDisplay(timeStr, totalWords, bookWords);
}

function stopTimer() {
  momoAccelerating = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

export function abandonTimer() {
  const sess = state.currentSession;
  const minutes = Math.round(sess.elapsedSeconds / 60);
  const halfMinutes = Math.round(minutes * 0.5);

  stopTimer();

  if (minutes > 1) {
    state.focus.totalMinutes += halfMinutes;
    state.focus.totalWords += Math.round(halfMinutes * 100 * getFocusSpeedMultiplier());
    updateStreak();
    addHistory('focus', `中断专注 (计入50%)`, `${halfMinutes} 分钟`);
  }

  sess.active = false;
  sess.paused = false;
  sess.elapsedSeconds = 0;
  saveState();
  renderFocusPage();
}

export function cleanupTimer() {
  stopTimer();
}
