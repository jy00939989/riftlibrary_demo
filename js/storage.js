// 存储工具
import { state, saveState } from './state.js';
import { refreshBGM } from './audio.js';
import { track } from './backend/analytics.js';

export function addHistory(type, title, detail = '') {
  state.history.unshift({
    type,
    title,
    detail,
    time: new Date().toISOString()
  });
  // 保留最近 50 条
  if (state.history.length > 50) state.history.length = 50;
  saveState();
}

export function addCoins(amount) {
  state.coins += amount;
  saveState();
}

export function spendCoins(amount) {
  if (state.coins >= amount) {
    state.coins -= amount;
    saveState();
    return true;
  }
  return false;
}

export function addInspiration(amount) {
  state.inspiration = (state.inspiration || 0) + amount;
  saveState();
}

export function spendInspiration(amount) {
  if ((state.inspiration || 0) < amount) return false;
  state.inspiration -= amount;
  saveState();
  return true;
}

let _onStageCross = null;
export function onStageCross(cb) { _onStageCross = cb; }

export function addAtmosphere(points) {
  const prevLevel = getAtmosphereLevel().level;
  state.library.atmosphere = state.library.atmosphere + points;
  const newLevel = getAtmosphereLevel().level;
  updateBodyBackground();
  refreshBGM();
  saveState();

  track('atmosphere_upgrade', { points, prev_level: prevLevel, new_level: newLevel });

  if (newLevel > prevLevel) {
    const crossed = [];
    for (let s = prevLevel + 1; s <= newLevel; s++) crossed.push(s);
    if (_onStageCross) _onStageCross(crossed);
    return { prevLevel, newLevel, crossed };
  }
  return { prevLevel, newLevel, crossed: [] };
}

// 根据氛围阶段动态切换 body 背景图（阶段等级单源在 data/atmosphere.js；D24 起跟存储阶段字段走）
export function updateBodyBackground() {
  const bgNum = resolveStageLevel(state.library.atmosphere, state.library.stage);

  const bgUrl = `visual/background/library_bg_0${bgNum}_${['','abandoned','ruined','cozy','gorgeous','magnificent'][bgNum]}.jpg`;
  document.body.style.backgroundImage = `linear-gradient(rgba(44,36,25,0.88), rgba(44,36,25,0.88)), url('${bgUrl}')`;
}

import { getAtmosphereLevel as _getAtmosphereLevel } from './core/economy.js';
import { resolveStageLevel, checkStageUpRequirements, getStageThreshold, MAX_STAGE_LEVEL } from '../data/atmosphere.js';

// 绑定当前存档氛围值的阶段信息（纯函数版见 getAtmosphereLevelPure）
export function getAtmosphereLevel() {
  return _getAtmosphereLevel(state.library.atmosphere, state.library.stage);
}

export { _getAtmosphereLevel as getAtmosphereLevelPure };

// ── 升阶仪式（D24：阶段落库，氛围到阈值+设施条件齐后手动举行仪式升阶）──

/** 当前图书馆阶段（存储字段优先，老档回退阈值推导） */
export function getLibraryStage() {
  return resolveStageLevel(state.library.atmosphere, state.library.stage);
}

/** 升阶条件核对用的设施快照 */
export function getStageUpSnapshot() {
  return {
    focus: state.library.focusLevel || 0,
    borrow: state.library.borrowLevel || 0,
    restorationLevel: state.restorationLevel || 0,
    restorationUnlocked: !!state.restorationUnlocked,
    musicRoomUnlocked: !!(state.musicRoom && state.musicRoom.unlocked),
  };
}

/** 是否可举行升阶仪式：未满级 + 氛围达下一阶阈值 + 设施需求齐备 */
export function canHoldStageCeremony() {
  const stage = getLibraryStage();
  if (stage >= MAX_STAGE_LEVEL) return false;
  const threshold = getStageThreshold(stage + 1);
  if ((state.library.atmosphere || 0) < threshold) return false;
  return checkStageUpRequirements(stage + 1, getStageUpSnapshot()).length === 0;
}

/** 举行升阶仪式：阶段 +1，沿 onStageCross 链路触发升阶庆典（见证人 toast / 馆长目标奖励） */
export function holdStageCeremony() {
  if (!canHoldStageCeremony()) return null;
  const prevLevel = getLibraryStage();
  state.library.stage = prevLevel + 1;
  updateBodyBackground();
  refreshBGM();
  saveState();

  track('stage_ceremony', { prev_level: prevLevel, new_level: state.library.stage });

  if (_onStageCross) _onStageCross([state.library.stage]);
  return { prevLevel, newLevel: state.library.stage };
}

export function updateStreak() {
  const today = new Date().toDateString();
  if (state.focus.lastFocusDate === today) return;

  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (state.focus.lastFocusDate === yesterday) {
    state.focus.streak += 1;
  } else if (state.focus.lastFocusDate !== today) {
    state.focus.streak = 1;
  }
  state.focus.lastFocusDate = today;
  state.focus.todayDate = today;

  if (state.focus.streak === 7) {
    addCoins(50);
    addHistory('achievement', '连续专注7天！', '获得50智慧之光奖励');
  }
  saveState();
}

/**
 * 记录一次完成的专注会话，用于后续统计与可视化。
 * @param {object} session - { minutes, words, coins, label, bookId, bookTitle, mode }
 */
export function addFocusSession(session) {
  if (!state.focus.sessions) state.focus.sessions = [];
  const now = Date.now();
  state.focus.sessions.unshift({
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    timestamp: now,
    minutes: session.minutes || 0,
    words: session.words || 0,
    coins: session.coins || 0,
    label: (session.label || '').trim().slice(0, 40),
    bookId: session.bookId || null,
    bookTitle: session.bookTitle || '',
    mode: session.mode || 'pomodoro'
  });
  // 保留最近 365 条，约等于一整年的专注记录，支撑跨年热力图与月度环比
  if (state.focus.sessions.length > 365) state.focus.sessions.length = 365;
  saveState();
}
