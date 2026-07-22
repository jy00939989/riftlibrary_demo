// 音频管理模块 —— BGM 氛围联动 + 交叉淡入淡出 + SFX 音效 + 音乐选择器
import { state, saveState } from './state.js';
import { initAmbient, setAmbientEnabled, isAmbientEnabled } from './ambient.js';

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
let musicEnabled = true;
let fadeTimer = null;

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

function updateToggleIcon() {
  const btn = document.getElementById('music-toggle');
  if (btn) btn.textContent = musicEnabled ? '🔈' : '🔇';
}

export function isMusicOn() { return musicEnabled; }

export function initAudio() {
  musicEnabled = localStorage.getItem('library_music') !== 'off';
  updateToggleIcon();
  initAmbient();
}

/**
 * 播放指定曲目
 * @param {string} trackId - TRACK_DEFS 中的 id，不传则自动根据氛围选择
 */
export function playTrack(trackId) {
  if (!musicEnabled) return;

  const def = trackId ? TRACK_DEFS.find(t => t.id === trackId) : null;
  const actualDef = def || pick(getAvailableTracks());

  if (!actualDef) return;
  if (actualDef.id === currentTrackId && currentAudio && !currentAudio.paused) return;

  currentTrackId = actualDef.id;
  const src = encodeURI(actualDef.file);
  const next = new Audio(src);
  next.loop = true;
  next.volume = 0;

  if (currentAudio) {
    const old = currentAudio;
    let step = 0;
    clearInterval(fadeTimer);
    fadeTimer = setInterval(() => {
      step++;
      old.volume = Math.max(0, 0.7 - step * 0.07);
      next.volume = Math.min(0.7, step * 0.07);
      if (step >= 10) {
        clearInterval(fadeTimer);
        old.pause();
        old.src = '';
      }
    }, 120);
  } else {
    next.volume = 0.7;
  }

  next.play().catch(() => {});
  currentAudio = next;
  updateNowPlayingUI();
}

function pickDefaultTrack() {
  const available = getAvailableTracks();
  return available.length > 0 ? pick(available).id : null;
}

export function refreshBGM() {
  if (!musicEnabled) return;
  const manualId = state.musicManualTrack;
  if (manualId) {
    playTrack(manualId);
  } else {
    playTrack(null);
  }
}

/** 用户手动选择曲目，此后不再随氛围自动切换 */
export function selectTrack(trackId) {
  state.musicManualTrack = trackId;
  saveState();
  playTrack(trackId);
}

/** 切换回自动模式（随氛围自动选曲） */
export function setAutoMode() {
  state.musicManualTrack = null;
  saveState();
  playTrack(null);
}

export function isManualMode() {
  return !!state.musicManualTrack;
}

export function toggleMusic() {
  musicEnabled = !musicEnabled;
  localStorage.setItem('library_music', musicEnabled ? 'on' : 'off');
  updateToggleIcon();

  if (musicEnabled) {
    const manualId = state.musicManualTrack;
    playTrack(manualId || null);
  } else {
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    currentTrackId = null;
  }
}

export function pauseMusic() {
  if (!musicEnabled || !currentAudio) return;
  currentAudio.pause();
}

export function resumeMusic() {
  if (!musicEnabled) return;
  if (currentAudio) {
    currentAudio.play().catch(() => {});
  } else {
    const manualId = state.musicManualTrack;
    playTrack(manualId || null);
  }
}

// 用户首次交互后调用，解除浏览器自动播放限制
export function onFirstInteraction() {
  initSfx();
  if (musicEnabled) {
    const manualId = state.musicManualTrack;
    playTrack(manualId || null);
  }
}

// ========== "正在播放" 小指示器 ==========

function updateNowPlayingUI() {
  const el = document.getElementById('now-playing');
  if (!el) return;
  const def = TRACK_DEFS.find(t => t.id === currentTrackId);
  if (def && musicEnabled) {
    el.innerHTML = `${def.emoji} ${def.name}`;
    el.style.display = '';
    el.title = '点击切换音乐';
    el.style.cursor = 'pointer';
    el.onclick = () => { window._openMusicSelector?.(); };
  } else if (!musicEnabled) {
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
let sfxEnabled = true;
let sfxInitialized = false;

/** 预加载所有音效（首次用户交互后调用） */
export function initSfx() {
  if (sfxInitialized) return;
  sfxInitialized = true;
  sfxEnabled = localStorage.getItem('library_sfx') !== 'off';

  Object.entries(SFX_FILES).forEach(([name, src]) => {
    try {
      const audio = new Audio(encodeURI(src));
      audio.preload = 'auto';
      audio.volume = name === 'button_click' ? 0.15 : 0.25;
      sfxCache[name] = audio;
    } catch (e) {
      // 音效加载失败不阻塞
    }
  });
}

/** 播放指定音效 */
export function playSfx(name) {
  if (!sfxEnabled || !sfxInitialized) return;
  const audio = sfxCache[name];
  if (!audio) return;
  try {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (e) {
    // 播放失败静默
  }
}

/** 开关音效 */
export function toggleSfx() {
  sfxEnabled = !sfxEnabled;
  localStorage.setItem('library_sfx', sfxEnabled ? 'on' : 'off');
  return sfxEnabled;
}

export function isSfxOn() { return sfxEnabled; }
