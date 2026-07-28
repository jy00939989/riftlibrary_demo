// 环境音（白噪音）模块 —— 数据定义、购买、播放控制
import { state, saveState } from './state.js';
import { spendCoins } from './storage.js';
import { t } from './i18n/terms.js';

export const AMBIENT_DEFS = [
  { id: 'victorian_study', name: t('ambientName_victorian_study'), emoji: '🕯️', price: 500, file: 'audio/ambient/victorian_study.mp3' }
];

let currentAudio = null;
let currentId = null;
let enabled = true;

/** 初始化环境音状态 */
export function initAmbient() {
  if (!state.ambientSounds) {
    state.ambientSounds = { unlocked: [], current: null, volume: 0.5, enabled: true };
  }
  enabled = state.ambientSounds.enabled !== false;
  if (state.ambientSounds.current) {
    playAmbient(state.ambientSounds.current, true);
  }
}

/** 获取所有环境音定义（含解锁状态） */
export function getAmbientDefs() {
  const unlocked = getUnlockedAmbientIds();
  return AMBIENT_DEFS.map(def => ({
    ...def,
    unlocked: unlocked.includes(def.id)
  }));
}

/** 获取已解锁环境音 ID 列表 */
export function getUnlockedAmbientIds() {
  return (state.ambientSounds?.unlocked) || [];
}

/** 购买环境音 */
export function buyAmbient(id) {
  const def = AMBIENT_DEFS.find(d => d.id === id);
  if (!def) return { ok: false, reason: 'not_found' };
  const unlocked = getUnlockedAmbientIds();
  if (unlocked.includes(id)) return { ok: false, reason: 'already_owned' };
  if (!spendCoins(def.price)) return { ok: false, reason: 'no_coins' };

  if (!state.ambientSounds) {
    state.ambientSounds = { unlocked: [], current: null, volume: 0.5, enabled: true };
  }
  state.ambientSounds.unlocked.push(id);
  saveState();
  return { ok: true, def };
}

/** 选择并播放指定环境音，传 null 则停止 */
export function selectAmbient(id) {
  if (!state.ambientSounds) {
    state.ambientSounds = { unlocked: [], current: null, volume: 0.5, enabled: true };
  }
  if (id && !getUnlockedAmbientIds().includes(id)) return false;
  state.ambientSounds.current = id || null;
  saveState();
  playAmbient(id);
  return true;
}

/** 播放/停止环境音 */
export function playAmbient(id, immediate = false) {
  if (!enabled) return;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (!id) {
    currentId = null;
    return;
  }
  const def = AMBIENT_DEFS.find(d => d.id === id);
  if (!def) return;

  const audio = new Audio(encodeURI(def.file));
  audio.loop = true;
  audio.volume = immediate ? getAmbientVolume() : 0;
  audio.onerror = () => {
    // 环境音加载失败：静默处理，避免阻塞 UI
    currentAudio = null;
    currentId = null;
  };
  audio.play().catch(() => {});
  currentAudio = audio;
  currentId = id;

  if (!immediate) {
    // 淡入
    let step = 0;
    const target = getAmbientVolume();
    const timer = setInterval(() => {
      step++;
      if (!currentAudio || currentAudio !== audio) {
        clearInterval(timer);
        return;
      }
      currentAudio.volume = Math.min(target, step * 0.05);
      if (currentAudio.volume >= target) clearInterval(timer);
    }, 100);
  }
}

/** 停止环境音 */
export function stopAmbient() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  currentId = null;
}

/** 开关环境音 */
export function setAmbientEnabled(value) {
  enabled = !!value;
  if (!state.ambientSounds) {
    state.ambientSounds = { unlocked: [], current: null, volume: 0.5, enabled };
  }
  state.ambientSounds.enabled = enabled;
  saveState();
  if (enabled) {
    playAmbient(state.ambientSounds.current);
  } else {
    stopAmbient();
  }
}

export function isAmbientEnabled() {
  return enabled;
}

/** 设置音量 0-1 */
export function setAmbientVolume(value) {
  const v = Math.max(0, Math.min(1, value));
  if (!state.ambientSounds) {
    state.ambientSounds = { unlocked: [], current: null, volume: v, enabled: true };
  }
  state.ambientSounds.volume = v;
  saveState();
  if (currentAudio) currentAudio.volume = v;
}

export function getAmbientVolume() {
  return state.ambientSounds?.volume ?? 0.5;
}

/** 获取当前播放的环境音 ID */
export function getCurrentAmbientId() {
  return currentId || state.ambientSounds?.current || null;
}
