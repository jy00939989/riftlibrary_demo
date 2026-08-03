// 音频管理模块 —— BGM 氛围联动 + 交叉淡入淡出 + SFX 音效 + 音乐选择器
import { state, saveState } from './state.js';
import { initAmbient, setAmbientEnabled, isAmbientEnabled, playAmbient, stopAmbient } from './ambient.js';
import { getSettings, setSettings, setSetting, initSettings } from './settings.js';

// 曲目配置（所有 MP3 均已在 audio/ 目录下）
const TRACK_DEFS = [
  { id: 'theme',   name: '图书馆主题曲', emoji: '🎵', tier: 'always', file: 'audio/library-music-demo1.mp3' },
  { id: 'ruin_a',  name: '荒废图书馆',   emoji: '🕯️', tier: 'ruined',  file: 'audio/图书馆 demo 荒废图书馆 2.mp3' },
  { id: 'ruin_b',  name: '荒废·长夜变奏', emoji: '🌙', tier: 'ruined',  file: 'audio/图书馆 demo 荒废图书馆 2 (1).mp3' },
  { id: 'cozy_a',  name: '城镇漫步',     emoji: '🏘️', tier: 'cozy',    file: 'audio/图书馆 demo2 城镇风格.mp3' },
  { id: 'cozy_b',  name: '城镇·午后变奏', emoji: '☀️', tier: 'cozy',    file: 'audio/图书馆 demo2 城镇风格 (1).mp3' },
  { id: 'star_a',  name: '星辰图书馆',   emoji: '🌟', tier: 'stellar', file: 'audio/图书馆 demo 星辰图书馆.mp3' },
  { id: 'star_b',  name: '星辰·圣堂咏叹', emoji: '✨', tier: 'stellar', file: 'audio/图书馆 demo 星辰图书馆 (1).mp3' }
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

let currentAudio = null;
let currentTrackId = null;
let fadeTimer = null;
let fadingAudio = null; // 正在淡出中的旧音频，切换/关闭时必须强制清理

// ========== 工具 ==========

function tierForAtmo(v) {
  if (v > 300) return 'stellar';
  if (v > 80) return 'cozy';
  return 'ruined';
}

/** 获取所有已解锁的曲目 */
export function getAvailableTracks() {
  const atmo = state.library?.atmosphere || 0;
  const currentTier = tierForAtmo(atmo);
  return TRACK_DEFS.filter(t => {
    if (t.tier === 'always') return true;
    return t.tier === currentTier ||  // 当前所在档位
           (t.tier === 'ruined') ||
           (t.tier === 'cozy' && (currentTier === 'stellar'));
  });
}

/** 获取曲目定义 */
export function getTrackDef(trackId) {
  return TRACK_DEFS.find(t => t.id === trackId) || null;
}

/** 获取所有曲目定义（含锁定状态） */
export function getAllTrackDefs() {
  const atmo = state.library?.atmosphere || 0;
  const currentTier = tierForAtmo(atmo);
  return TRACK_DEFS.map(t => ({
    ...t,
    unlocked: t.tier === 'always' || t.tier === currentTier ||
              (t.tier === 'ruined') ||
              (t.tier === 'cozy' && currentTier === 'stellar')
  }));
}

/** 获取当前播放的曲目 ID */
export function getCurrentTrackId() {
  return currentTrackId;
}

// ========== BGM 播放 ==========

export function updateToggleIcon() {
  const settings = getSettings();
  const anyOn = settings.musicEnabled || settings.sfxEnabled || settings.ambientEnabled;
  const btn = document.getElementById('music-toggle');
  if (btn) btn.textContent = anyOn ? '🔈' : '🔇';
}

export function isMusicOn() { return getSettings().musicEnabled; }

export function getMusicVolume() { return getSettings().musicVolume; }

export function setMusicVolume(value) {
  const v = Math.max(0, Math.min(1, value));
  setSetting('musicVolume', v);
  if (currentAudio) currentAudio.volume = v;
  return v;
}

export function initAudio() {
  updateToggleIcon();
  initAmbient();
  // 若设置里音乐为关，确保没有残留播放（比如用户在加载完成前点击了页面）
  if (!isMusicOn()) {
    clearInterval(fadeTimer);
    fadeTimer = null;
    if (fadingAudio) {
      try { fadingAudio.pause(); fadingAudio.src = ''; } catch (e) {}
      fadingAudio = null;
    }
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      currentAudio = null;
      currentTrackId = null;
    }
  }
  updateNowPlayingUI();
}

// 强制清理一个正在淡出但已被新切换取代的旧音频对象，避免 AudioContext 泄漏（P2-1）
function forceCleanFading() {
  if (fadingAudio && fadingAudio !== currentAudio) {
    try { fadingAudio.pause(); fadingAudio.src = ''; } catch (e) {}
    fadingAudio = null;
  }
}

/**
 * 统一 BGM 入口（P2-4 收口）。
 * @param {string|null} trackId - 指定曲目 id；null/undefined 表示自动按氛围选曲。
 * 行为约定：
 *  - 音乐关闭时直接返回；
 *  - 已在同一曲目且正在播放/暂停时，不打断（暂停恢复交给 resumeMusic；解决 P0-1 无谓重播）；
 *  - 切歌时执行交叉淡入，淡入期间每步读取实时音量（解决 P1-2 拖动被覆盖）；
 *  - 进入时强制清理上一轮残留的淡出音频（解决 P2-1 泄漏）。
 */
export function startBgm(trackId) {
  if (!isMusicOn()) return;
  forceCleanFading();

  const available = getAvailableTracks();
  const def = trackId ? TRACK_DEFS.find(t => t.id === trackId) : null;
  const actualDef = def || pick(available);
  if (!actualDef) return;

  // 同一曲目且已有音频句柄：正在播则不打断；已暂停则恢复播放
  if (actualDef.id === currentTrackId && currentAudio) {
    if (currentAudio.paused) currentAudio.play().catch(() => {});
    return;
  }

  currentTrackId = actualDef.id;
  const src = encodeURI(actualDef.file);
  const next = new Audio(src);
  next.loop = true;
  next.volume = currentAudio ? 0 : getMusicVolume();
  next.onerror = () => {
    // BGM 加载失败：重置状态，避免卡在当前曲目
    currentAudio = null;
    currentTrackId = null;
  };

  if (currentAudio) {
    const old = currentAudio;
    fadingAudio = old;
    let step = 0;
    clearInterval(fadeTimer);
    fadeTimer = setInterval(() => {
      step++;
      const v = getMusicVolume();   // P1-2：实时音量，不被拖动覆盖
      old.volume = Math.max(0, v - step * (v / 10));
      next.volume = Math.min(v, step * (v / 10));
      if (step >= 10) {
        clearInterval(fadeTimer);
        try { old.pause(); old.src = ''; } catch (e) {}
        if (fadingAudio === old) fadingAudio = null;
      }
    }, 120);
  }

  next.play().catch(() => {
    // 播放被浏览器策略阻止（如未交互）
    if (currentAudio === next) {
      currentAudio = null;
      currentTrackId = null;
    }
  });
  currentAudio = next;
  updateNowPlayingUI();
}

/**
 * 氛围/模式变动后调用：仅在必要时重新选曲，不打断正在播放的曲子（P0-1 + P2-2）。
 * - 手动模式：当前已是该曲则不打断；
 * - 自动模式：当前曲仍有效则不打断（暂停则恢复），仅当当前曲掉出可选集时才重选。
 */
export function refreshBGM() {
  if (!isMusicOn()) return;
  const manualId = state.musicManualTrack;
  if (manualId) {
    if (currentTrackId !== manualId || !currentAudio) startBgm(manualId);
    return;
  }
  const cur = currentTrackId;
  const stillValid = cur && getAvailableTracks().some(t => t.id === cur);
  if (stillValid) {
    if (currentAudio && currentAudio.paused) resumeMusic();
    return;
  }
  startBgm(null);
}

/** 用户手动选择曲目，此后不再随氛围自动切换 */
export function selectTrack(trackId) {
  state.musicManualTrack = trackId;
  saveState();
  startBgm(trackId);
}

/** 切换回自动模式（随氛围自动选曲） */
export function setAutoMode() {
  state.musicManualTrack = null;
  saveState();
  startBgm(null);
}

export function isManualMode() {
  return !!state.musicManualTrack;
}

export function toggleMusic() {
  // 小喇叭 = 一键静音 / 一键开启所有音频（BGM + 音效 + 环境音）
  const settings = getSettings();
  const currentlyAnyOn = settings.musicEnabled || settings.sfxEnabled || settings.ambientEnabled;
  const nowOn = !currentlyAnyOn;

  setSettings({
    musicEnabled: nowOn,
    sfxEnabled: nowOn,
    ambientEnabled: nowOn
  });

  updateToggleIcon();
  updateNowPlayingUI();

  if (nowOn) {
    // 恢复 BGM
    if (currentAudio && currentAudio.paused) resumeMusic();
    else startBgm(state.musicManualTrack || null);
    // 恢复环境音
    const ambientId = state.ambientSounds?.current;
    if (ambientId) playAmbient(ambientId);
  } else {
    // 停止 BGM
    clearInterval(fadeTimer);
    fadeTimer = null;
    if (fadingAudio) {
      try { fadingAudio.pause(); fadingAudio.src = ''; } catch (e) {}
      fadingAudio = null;
    }
    if (currentAudio) { currentAudio.pause(); currentAudio.src = ''; currentAudio = null; }
    currentTrackId = null;
    // 停止环境音
    stopAmbient();
  }
}

export function pauseMusic() {
  if (!isMusicOn() || !currentAudio) return;
  currentAudio.pause();
}

export function resumeMusic() {
  if (!isMusicOn()) return;
  if (currentAudio) {
    currentAudio.play().catch(() => {});
  } else {
    startBgm(state.musicManualTrack || null);
  }
}

// 用户首次交互后调用，解除浏览器自动播放限制
// playBgm: 是否顺带恢复 BGM；开始专注等场景应由用户手动控制音乐，传 false
export function onFirstInteraction(playBgm = true) {
  // 防御：若 app.js 因异常未执行 initSettings，确保设置已加载，避免使用默认设置误播 BGM
  initSettings();
  initSfx();
  if (playBgm && isMusicOn()) {
    startBgm(state.musicManualTrack || null);
  }
  // 注：环境音为"付费购买 + 点击播放"，此处不再自动恢复，避免与"需点击才播放"的设计冲突。
}

// ========== "正在播放" 小指示器 ==========

function updateNowPlayingUI() {
  const el = document.getElementById('now-playing');
  if (!el) return;
  const def = TRACK_DEFS.find(t => t.id === currentTrackId);
  if (def && isMusicOn()) {
    el.innerHTML = `${def.emoji} ${def.name}`;
    el.style.display = '';
    el.title = '点击切换音乐';
    el.style.cursor = 'pointer';
    el.onclick = () => { window._openMusicSelector?.(); };
  } else if (!isMusicOn()) {
    el.innerHTML = '🔇 音乐已关闭';
    el.style.display = '';
    el.style.cursor = '';
    el.onclick = null;
  } else {
    el.style.display = 'none';
  }
}

// ========== SFX 音效模块 ==========

const SFX_FILES = {
  button_click:   'audio/effect/button_click.wav',
  focus_complete: 'audio/effect/focus_complete.wav',
  achievement_unlock: 'audio/effect/achievement_unlock.wav',
  buy_success:    'audio/effect/buy_success.wav',
  visitor_arrive: 'audio/effect/visitor_arrive.wav',
  book_return:    'audio/effect/book_return.wav'
};

const sfxCache = {};
let sfxInitialized = false;

function getBaseSfxVolume(name) {
  return name === 'button_click' ? 0.3 : 0.5;
}

/** 预加载所有音效（首次用户交互后调用） */
export function initSfx() {
  if (sfxInitialized) return;
  sfxInitialized = true;

  Object.entries(SFX_FILES).forEach(([name, src]) => {
    try {
      const audio = new Audio(encodeURI(src));
      audio.preload = 'auto';
      sfxCache[name] = audio;
    } catch (e) {
      // 音效加载失败不阻塞
    }
  });
}

/** 设置音效总音量 0-1 */
export function setSfxVolume(value) {
  const v = Math.max(0, Math.min(1, value));
  setSetting('sfxVolume', v);
  return v;
}

/** 获取音效总音量 0-1 */
export function getSfxVolume() {
  return getSettings().sfxVolume ?? 0.5;
}

/** 播放指定音效 */
export function playSfx(name) {
  if (!sfxInitialized) return;
  const settings = getSettings();
  if (!settings.sfxEnabled) return;
  const audio = sfxCache[name];
  if (!audio) return;
  try {
    audio.currentTime = 0;
    audio.volume = getBaseSfxVolume(name) * (settings.sfxVolume ?? 0.5);
    audio.play().catch(() => {});
  } catch (e) {
    // 播放失败静默
  }
}

/** 开关音效 */
export function toggleSfx() {
  const settings = getSettings();
  const next = !settings.sfxEnabled;
  setSetting('sfxEnabled', next);
  return next;
}

export function isSfxOn() { return getSettings().sfxEnabled !== false; }
