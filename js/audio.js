// 音频管理模块 —— BGM 氛围联动 + 交叉淡入淡出 + SFX 音效
import { state } from './state.js';

const TRACKS = {
  ruined: [
    'audio/图书馆 demo 荒废图书馆 2.mp3',
    'audio/图书馆 demo 荒废图书馆 2 (1).mp3'
  ],
  cozy: [
    'audio/图书馆 demo2 城镇风格.mp3',
    'audio/图书馆 demo2 城镇风格 (1).mp3'
  ],
  stellar: [
    'audio/图书馆 demo 星辰图书馆.mp3',
    'audio/图书馆 demo 星辰图书馆 (1).mp3'
  ]
};

let currentAudio = null;
let currentTier = null;
let musicEnabled = true;
let fadeTimer = null;

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function updateToggleIcon() {
  const btn = document.getElementById('music-toggle');
  if (btn) btn.textContent = musicEnabled ? '🔈' : '🔇';
}

export function isMusicOn() { return musicEnabled; }

export function initAudio() {
  musicEnabled = localStorage.getItem('library_music') !== 'off';
  updateToggleIcon();
}

function tierForAtmo(v) {
  if (v > 300) return 'stellar';
  if (v > 80) return 'cozy';
  return 'ruined';
}

function playCurrentTier() {
  if (!musicEnabled) return;
  const tier = tierForAtmo(state.library.atmosphere);
  if (tier === currentTier) return;
  currentTier = tier;

  const src = encodeURI(pick(TRACKS[tier]));
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
}

// 外部调用：氛围变化时更新曲目
export function refreshBGM() {
  if (!musicEnabled) return;
  playCurrentTier();
}

export function toggleMusic() {
  musicEnabled = !musicEnabled;
  localStorage.setItem('library_music', musicEnabled ? 'on' : 'off');
  updateToggleIcon();

  if (musicEnabled) {
    currentTier = null;
    playCurrentTier();
  } else {
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    currentTier = null;
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
    playCurrentTier();
  }
}

// 用户首次交互后调用，解除浏览器自动播放限制
export function onFirstInteraction() {
  initSfx();
  if (musicEnabled) {
    // 尝试播放当前 tier 的音乐
    playCurrentTier();
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
