// 存储工具
import { state, saveState } from './state.js';

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

export function addAtmosphere(points) {
  state.library.atmosphere = Math.min(100, state.library.atmosphere + points);
  saveState();
}

export function getAtmosphereLevel() {
  const v = state.library.atmosphere;
  if (v <= 20) return { level: 1, name: '废墟', next: 20 - v };
  if (v <= 40) return { level: 2, name: '破败', next: 40 - v };
  if (v <= 60) return { level: 3, name: '陈旧', next: 60 - v };
  if (v <= 80) return { level: 4, name: '温暖', next: 80 - v };
  return { level: 5, name: '繁荣', next: 0 };
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
    addHistory('achievement', '连续专注7天！', '获得50代币奖励');
  }
  saveState();
}
