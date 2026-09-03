// Focus session command handlers — app-layer glue between UI and core session logic
import { state } from '../state.js';
import { ensureAudioContext, playSfx, pauseMusic, startBgm, isMusicOn } from '../audio.js';
import { playAmbient, isAmbientEnabled } from '../ambient.js';
import { startFocus, togglePauseFocus, completeFocus, abandonFocus } from './focus-session.js';
import { runFocusOrchestration } from './focus-orchestrator.js';
import { checkAchievements, showAchievementBatch } from '../achievements.js';
import { triggerQuestCheck } from './quest-trigger.js';
import { track } from '../backend/index.js';
import { showMomoIntro } from '../render/shared/momo-intro.js';

export function handleStartFocus() {
  ensureAudioContext();

  if (isMusicOn()) {
    startBgm(state.musicManualTrack || null);
  }
  if (isAmbientEnabled()) {
    playAmbient(state.ambientSounds?.current);
  }

  if (!state.currentSession.bookId) {
    alert('请先选择一本要誊抄的书 📖');
    return;
  }

  const bs = state.books[state.currentSession.bookId];
  const isFirstCopy = bs && bs.copiedWords === 0;
  const isFirstFocusEver = state.focus.totalMinutes === 0;

  function doStart() {
    const result = startFocus(state.currentSession.bookId, state.currentSession.mode, state.currentSession.targetMinutes);
    if (!result.ok) {
      alert('请先选择一本要誊抄的书 📖');
      return;
    }
    if (isFirstCopy) {
      const achResults = checkAchievements('copy_start');
      showAchievementBatch(achResults);
    }
    triggerQuestCheck('focus_start');
  }

  if (isFirstFocusEver) {
    showMomoIntro(() => doStart());
  } else {
    doStart();
  }
}

export function handleTogglePause() {
  togglePauseFocus();
}

export function handleCompleteFocus(isAuto = false) {
  const sess = state.currentSession;
  if (!sess.active) return;

  const earlyMinutes = Math.round(sess.elapsedSeconds / 60);
  if (earlyMinutes < 1 && !isAuto) {
    alert('专注时间太短，至少需要1分钟 ⌛');
    return;
  }

  playSfx('focus_complete');
  pauseMusic();

  if (!isAuto && sess.intervalId) {
    clearInterval(sess.intervalId);
    sess.intervalId = null;
  }

  const result = completeFocus(isAuto);
  runFocusOrchestration(result, isAuto);
}

export function handleAbandonFocus() {
  const sess = state.currentSession;
  const minutes = sess.active ? Math.round(sess.elapsedSeconds / 60) : 0;
  if (confirm('确定要放弃本次专注吗？已完成时间将计入50%。')) {
    track('focus_abandon', {
      book_id: sess.bookId || null,
      mode: sess.mode,
      minutes,
      target_minutes: sess.targetMinutes
    });
    abandonFocus();
  }
}
