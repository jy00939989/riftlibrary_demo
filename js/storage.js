// 存储工具
import { state, saveState } from './state.js';
import { refreshBGM } from './audio.js';

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
  state.library.atmosphere = Math.min(500, state.library.atmosphere + points);
  const newLevel = getAtmosphereLevel().level;
  updateBodyBackground();
  refreshBGM();
  saveState();

  if (newLevel > prevLevel) {
    const crossed = [];
    for (let s = prevLevel + 1; s <= newLevel; s++) crossed.push(s);
    if (_onStageCross) _onStageCross(crossed);
    return { prevLevel, newLevel, crossed };
  }
  return { prevLevel, newLevel, crossed: [] };
}

// 根据氛围阶段动态切换 body 背景图
export function updateBodyBackground() {
  const v = state.library.atmosphere;
  let bgNum = 1;
  if (v > 300) bgNum = 5;
  else if (v > 160) bgNum = 4;
  else if (v > 80) bgNum = 3;
  else if (v > 30) bgNum = 2;

  const bgUrl = `visual/background/library_bg_0${bgNum}_${['','abandoned','ruined','cozy','gorgeous','magnificent'][bgNum]}.jpg`;
  document.body.style.backgroundImage = `linear-gradient(rgba(44,36,25,0.88), rgba(44,36,25,0.88)), url('${bgUrl}')`;
}

export function getAtmosphereLevel() {
  const v = state.library.atmosphere;
  if (v <= 30) return { level: 1, name: '废墟', next: 30 - v };
  if (v <= 80) return { level: 2, name: '破败', next: 80 - v };
  if (v <= 160) return { level: 3, name: '陈旧', next: 160 - v };
  if (v <= 300) return { level: 4, name: '温暖', next: 300 - v };
  return { level: 5, name: '星辰', next: 0 };
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
