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
import { applyMaintenanceProgress } from './maintenance.js';
import { BOOKS } from '../../data/books.js';
import { track } from '../backend/analytics.js';

export function startFocus(bookId, mode, targetMinutes) {
  const bs = state.books[bookId];
  if (!bs || bs.status === 'locked') return { ok: false, reason: 'book_not_available' };

  if (bs.status === 'unlocked' || bs.status === 'completed') {
    bs.status = 'copying';
  }

  state.currentSession = {
    mode,
    bookId,
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
  track('focus_start', { book_id: bookId, mode, target_minutes: targetMinutes });
  return { ok: true };
}

// ========== 专注预配置 setter（Phase A：消除渲染层直接 state mutation） ==========

const DEFAULT_TARGET_MINUTES = {
  pomodoro: 25,
  countdown: 25,
  stopwatch: 0
};

export function setFocusMode(mode) {
  if (state.currentSession.active) return false;
  if (!['pomodoro', 'countdown', 'stopwatch'].includes(mode)) return false;

  state.currentSession.mode = mode;
  if (mode !== 'stopwatch' && state.currentSession.targetMinutes === 0) {
    state.currentSession.targetMinutes = DEFAULT_TARGET_MINUTES[mode];
  }
  saveState();
  return true;
}

export function setFocusTargetMinutes(minutes) {
  if (state.currentSession.active) return false;
  const v = Math.max(1, Math.min(180, parseInt(minutes, 10) || 1));
  state.currentSession.targetMinutes = v;
  saveState();
  return v;
}

export function setFocusBook(bookId) {
  if (state.currentSession.active) return false;
  const bs = state.books[bookId];
  if (!bs || bs.status === 'locked') return false;

  state.currentSession.bookId = bookId;
  saveState();
  return true;
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
  // 活动类型轴（book-maintenance-plan v2）：maintenance 吃修复室加成但绕开 damaged 门槛
  const repairSpeedBonus = ((bookIsDamaged || sess.activity === 'maintenance') && isRestorationUnlocked())
    ? getRestorationRepairSpeedBonus() : 0;

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

  // 植物浇水机会（番茄钟 / 倒计时 / 正计时 均触发；储水设施按档位给长专注额外 +1）
  // waterGained 随结算结果透传给结算弹窗展示（2026-10-26 图南：去掉下章预告、改显浇水数）
  let waterGained = 0;
  if (minutes >= 20) {
    waterGained = addWaterOpportunity(minutes);
  }

  // 书籍进度（活动类型轴：copy / repair / maintenance；旧会话无 activity 字段时懒推导）
  let bookProgressResult = null;
  let repairResult = null;
  let maintenanceResult = null;
  if (sess.bookId) {
    const bs = state.books[sess.bookId];
    // 已上架的书（copyCount≥1）损坏修复 = 纯修复会话：不再推进誊抄进度。
    // effectiveWords = copiedWords % totalWords 回卷为 0，修复字数累计过 totalWords 会触发
    // 伪「重抄完成」→ copyCount+1 → 误升典藏（2026-09-30 玩家报告，探针实证）
    const repairOnly = bs && bs.damaged && (bs.copyCount || 0) >= 1;
    const activity = sess.activity || (repairOnly ? 'repair' : 'copy');

    if (activity === 'copy') {
      const applied = applyWords(sess.bookId, wordsGained);
      bookProgressResult = {
        bookId: sess.bookId,
        ...applied
      };

      if (applied.didComplete) {
        bookProgressResult.completion = completeBook(sess.bookId);
      }
      repairResult = applyRepairProgress(sess.bookId, wordsGained);
    } else if (activity === 'repair') {
      repairResult = applyRepairProgress(sess.bookId, wordsGained);
    } else if (activity === 'maintenance') {
      // 保养批次：誊抄与修复都不碰，words 全进批次进度池
      maintenanceResult = applyMaintenanceProgress(wordsGained);
    }
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
    waterGained,
    bookId: sess.bookId,
    prevTotalWords,
    currentTotalWords: state.focus.totalWords,
    bookProgressResult,
    repairResult,
    maintenanceResult
  };
}
