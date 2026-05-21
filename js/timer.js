// 计时器模块 —— 只负责计时，完成逻辑交给 app.js
import { state, saveState } from './state.js';
import { addHistory, updateStreak } from './storage.js';
import { getFocusSpeedMultiplier } from './shop.js';
import { renderFocusPage, updateTimerDisplay, formatTime } from './render/index.js';

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

  // 首次专注：墨墨的魔法加速（10倍速）
  momoAccelerating = state.focus.totalMinutes === 0;
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
      if (onComplete) onComplete(false); // false = 自动完成（非手动）
      return;
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
  const bookWords = sess.bookId && state.books[sess.bookId]
    ? state.books[sess.bookId].copiedWords + sessionEstimate
    : 0;
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
