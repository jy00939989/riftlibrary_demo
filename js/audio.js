// 音频管理模块 —— BGM 氛围联动 + 交叉淡入淡出
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
      old.volume = Math.max(0, 0.5 - step * 0.05);
      next.volume = Math.min(0.5, step * 0.05);
      if (step >= 10) {
        clearInterval(fadeTimer);
        old.pause();
        old.src = '';
      }
    }, 120);
  } else {
    next.volume = 0.5;
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

// 用户首次交互后调用，解除浏览器自动播放限制
export function onFirstInteraction() {
  if (musicEnabled) {
    // 尝试播放当前 tier 的音乐
    playCurrentTier();
  }
}
