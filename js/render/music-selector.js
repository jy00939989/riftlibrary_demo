// 音乐选择器 —— 点击顶栏 🎼 按钮打开/关闭
import {
  getAllTrackDefs, getCurrentTrackId, selectTrack, setAutoMode, isManualMode,
  getMusicVolume, setMusicVolume, getSfxVolume, setSfxVolume,
  toggleMusic, isMusicOn
} from '../audio.js';
import { getAmbientDefs, getCurrentAmbientId, selectAmbient, isAmbientEnabled, setAmbientEnabled, getAmbientVolume, setAmbientVolume } from '../ambient.js';
import { t } from '../i18n/terms.js';

let panelEl = null;
let globalEscHandler = null;

function getTrackDisplayName(track) {
  const key = 'musicTrack_' + track.id;
  const localized = t(key);
  return localized === key ? track.name : localized;
}

export function initMusicSelector() {
  const btn = document.getElementById('music-selector-btn');
  if (btn) {
    btn.addEventListener('click', toggle);
  }
  // 暴露到全局供"正在播放"指示器点击
  window._openMusicSelector = toggle;
}

function toggle() {
  if (panelEl) { close(); return; }
  open();
}

function open() {
  // 防御：如果已有面板，先安全清除，避免堆叠多个 overlay
  if (panelEl) close();

  const tracks = getAllTrackDefs();
  const currentId = getCurrentTrackId();
  const manual = isManualMode();
  const ambients = getAmbientDefs();
  const currentAmbientId = getCurrentAmbientId();
  const ambientOn = isAmbientEnabled();
  const musicOn = isMusicOn();
  const musicVol = Math.round(getMusicVolume() * 100);
  const ambientVol = Math.round(getAmbientVolume() * 100);
  const sfxVol = Math.round(getSfxVolume() * 100);

  panelEl = document.createElement('div');
  panelEl.id = 'music-selector-panel';
  panelEl.style.cssText = 'position:fixed;inset:0;z-index:900;background:rgba(20,16,10,0.92);display:flex;align-items:center;justify-content:center;';
  panelEl.innerHTML = `
    <div class="parchment-bg rounded-2xl p-6 max-w-sm w-full mx-4 magic-glow" style="max-height:80vh;overflow-y:auto;">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-display text-lg font-bold text-ink">🎼 ${t('musicAndAmbient')}</h3>
        <button class="ms-close-btn text-ink-light/50 hover:text-ink text-xl leading-none" type="button">&times;</button>
      </div>

      <!-- 背景音乐 -->
      <div class="mb-1">
        <div class="flex items-center justify-between mb-2">
          <div class="text-xs font-bold text-ink-light tracking-wider">🎵 ${t('backgroundMusic')}</div>
          <button id="ms-music-toggle" class="text-[10px] px-2 py-1 rounded-full border transition-all ${musicOn ? 'border-magic-gold bg-magic-gold/10 text-magic-gold' : 'border-wood/30 bg-white/50 text-ink-light'}">
            ${musicOn ? t('enabled') : t('disabled')}
          </button>
        </div>
        <div class="flex gap-2 mb-3">
          <button id="ms-auto-btn" class="flex-1 px-3 py-2 rounded-lg border-2 text-xs font-bold transition-all ${manual ? 'border-wood/30 bg-white/50 text-ink-light' : 'border-magic-gold bg-magic-gold/10 text-magic-gold'}">
            🎲 ${t('musicAutoMode')}
          </button>
        </div>
      </div>
      <div class="space-y-2 mb-5">
        ${tracks.map(track => {
          const isCurrent = track.id === currentId;
          const lockedClass = track.unlocked
            ? (isCurrent ? 'border-magic-gold bg-magic-gold/10 ring-1 ring-magic-gold' : 'border-wood/20 bg-white/50 hover:border-magic-gold/40')
            : 'border-wood/10 bg-stone-100/50 opacity-40';
          const statusIcon = isCurrent ? '🎧' : track.unlocked ? '' : '🔒';
          const onClick = track.unlocked ? `onclick="window._msPick('${track.id}')"` : '';
          return `
            <button class="ms-track-btn w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${lockedClass}" ${onClick}>
              <span class="text-2xl flex-shrink-0">${track.emoji}</span>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-bold text-ink">${getTrackDisplayName(track)} ${statusIcon}</div>
                <div class="text-[10px] text-ink-light">${track.unlocked ? (isCurrent ? t('nowPlaying') : t('clickToPlay')) : t('unlockAtNextStage')}</div>
              </div>
              ${isCurrent ? `<span class="text-magic-gold text-xs font-bold flex-shrink-0">▶ ${t('playing')}</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>

      <!-- 环境音 -->
      <div class="mb-1">
        <div class="flex items-center justify-between mb-2">
          <div class="text-xs font-bold text-ink-light tracking-wider">🎧 ${t('ambientSounds')}</div>
          <button id="ms-ambient-toggle" class="text-[10px] px-2 py-1 rounded-full border transition-all ${ambientOn ? 'border-magic-gold bg-magic-gold/10 text-magic-gold' : 'border-wood/30 bg-white/50 text-ink-light'}">
            ${ambientOn ? t('enabled') : t('disabled')}
          </button>
        </div>
      </div>
      <div class="space-y-2">
        ${ambients.map(a => {
          const isCurrent = a.id === currentAmbientId;
          const lockedClass = a.unlocked
            ? (isCurrent ? 'border-magic-gold bg-magic-gold/10 ring-1 ring-magic-gold' : 'border-wood/20 bg-white/50 hover:border-magic-gold/40')
            : 'border-wood/10 bg-stone-100/50 opacity-40';
          const statusIcon = isCurrent ? '🎧' : a.unlocked ? '' : '🔒';
          const subText = a.unlocked
            ? (isCurrent ? t('nowPlaying') : t('clickToPlay'))
            : t('unlockForCoins').replace('{price}', a.price.toLocaleString());
          const onClick = a.unlocked ? `onclick="window._msPickAmbient('${a.id}')"` : '';
          return `
            <button class="ms-ambient-btn w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${lockedClass}" ${onClick}>
              <span class="text-2xl flex-shrink-0">${a.emoji}</span>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-bold text-ink">${a.name} ${statusIcon}</div>
                <div class="text-[10px] text-ink-light">${subText}</div>
              </div>
              ${isCurrent ? `<span class="text-magic-gold text-xs font-bold flex-shrink-0">▶ ${t('playing')}</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>

      <!-- 音量控制 -->
      <div class="mt-5 pt-4 border-t border-wood/20 space-y-4">
        <div>
          <div class="flex items-center justify-between mb-2">
            <div class="text-xs font-bold text-ink-light tracking-wider">🎵 ${t('musicVolume')}</div>
            <div class="text-xs text-ink-light" id="ms-music-volume-value">${musicVol}%</div>
          </div>
          <input id="ms-music-volume" type="range" min="0" max="100" value="${musicVol}"
            class="w-full h-2 bg-wood/20 rounded-lg appearance-none cursor-pointer accent-magic-gold">
        </div>
        <div>
          <div class="flex items-center justify-between mb-2">
            <div class="text-xs font-bold text-ink-light tracking-wider">🎧 ${t('ambientVolume')}</div>
            <div class="text-xs text-ink-light" id="ms-ambient-volume-value">${ambientVol}%</div>
          </div>
          <input id="ms-ambient-volume" type="range" min="0" max="100" value="${ambientVol}"
            class="w-full h-2 bg-wood/20 rounded-lg appearance-none cursor-pointer accent-magic-gold">
        </div>
        <div>
          <div class="flex items-center justify-between mb-2">
            <div class="text-xs font-bold text-ink-light tracking-wider">🔊 ${t('sfxVolume')}</div>
            <div class="text-xs text-ink-light" id="ms-sfx-volume-value">${sfxVol}%</div>
          </div>
          <input id="ms-sfx-volume" type="range" min="0" max="100" value="${sfxVol}"
            class="w-full h-2 bg-wood/20 rounded-lg appearance-none cursor-pointer accent-magic-gold">
        </div>
      </div>
    </div>
  `;

  panelEl.addEventListener('click', (e) => {
    if (e.target === panelEl) close();
  });
  panelEl.querySelector('.ms-close-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    close();
  });
  panelEl.querySelector('#ms-auto-btn').addEventListener('click', () => {
    setAutoMode();
    close();
  });

  const musicToggle = panelEl.querySelector('#ms-music-toggle');
  if (musicToggle) {
    musicToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      try {
        toggleMusic();
      } catch (err) {
        if (typeof console !== 'undefined') console.error('toggleMusic failed:', err);
      }
      open();
    });
  }

  const ambientToggle = panelEl.querySelector('#ms-ambient-toggle');
  if (ambientToggle) {
    ambientToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      try {
        setAmbientEnabled(!isAmbientEnabled());
      } catch (err) {
        if (typeof console !== 'undefined') console.error('setAmbientEnabled failed:', err);
      }
      open();
    });
  }

  // 音量滑块
  const musicVolInput = panelEl.querySelector('#ms-music-volume');
  if (musicVolInput) {
    musicVolInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      setMusicVolume(val / 100);
      const label = panelEl.querySelector('#ms-music-volume-value');
      if (label) label.textContent = val + '%';
    });
  }
  const ambientVolInput = panelEl.querySelector('#ms-ambient-volume');
  if (ambientVolInput) {
    ambientVolInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      setAmbientVolume(val / 100);
      const label = panelEl.querySelector('#ms-ambient-volume-value');
      if (label) label.textContent = val + '%';
    });
  }
  const sfxVolInput = panelEl.querySelector('#ms-sfx-volume');
  if (sfxVolInput) {
    sfxVolInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      setSfxVolume(val / 100);
      const label = panelEl.querySelector('#ms-sfx-volume-value');
      if (label) label.textContent = val + '%';
    });
  }

  document.body.appendChild(panelEl);

  // ESC 键关闭面板（使用模块级 handler，确保 close() 能正确解绑）
  if (globalEscHandler) {
    document.removeEventListener('keydown', globalEscHandler);
  }
  globalEscHandler = (e) => {
    if (e.key === 'Escape') close();
  };
  document.addEventListener('keydown', globalEscHandler);

  // 全局回调
  window._msPick = (trackId) => {
    try {
      selectTrack(trackId);
    } catch (err) {
      // eslint-disable-next-line no-console
      if (typeof console !== 'undefined') console.error('selectTrack failed:', err);
    }
    close();
  };
  window._msPickAmbient = (ambientId) => {
    try {
      selectAmbient(ambientId);
    } catch (err) {
      // eslint-disable-next-line no-console
      if (typeof console !== 'undefined') console.error('selectAmbient failed:', err);
    }
    open();
  };
}

function close() {
  // 强制清理：即使 panelEl 引用丢失，也按 id 查找并移除
  const orphan = document.getElementById('music-selector-panel');
  if (orphan && orphan !== panelEl) {
    try { orphan.remove(); } catch (e) {}
  }
  if (panelEl) {
    try { panelEl.remove(); } catch (e) {}
    panelEl = null;
  }
  if (globalEscHandler) {
    document.removeEventListener('keydown', globalEscHandler);
    globalEscHandler = null;
  }
  window._msPick = null;
  window._msPickAmbient = null;
}

// 兜底：全局强制关闭函数，供控制台或异常恢复使用
window._closeMusicSelector = close;
