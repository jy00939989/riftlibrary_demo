// 音乐选择器 —— 点击顶栏 🎼 按钮打开/关闭
import { getAllTrackDefs, getCurrentTrackId, selectTrack, setAutoMode, isManualMode } from '../audio.js';

let panelEl = null;

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
  const tracks = getAllTrackDefs();
  const currentId = getCurrentTrackId();
  const manual = isManualMode();

  panelEl = document.createElement('div');
  panelEl.id = 'music-selector-panel';
  panelEl.style.cssText = 'position:fixed;inset:0;z-index:900;background:rgba(20,16,10,0.92);display:flex;align-items:center;justify-content:center;';
  panelEl.innerHTML = `
    <div class="parchment-bg rounded-2xl p-6 max-w-sm w-full mx-4 magic-glow" style="max-height:80vh;overflow-y:auto;">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-display text-lg font-bold text-ink">🎼 选择音乐</h3>
        <button class="ms-close-btn text-ink-light/50 hover:text-ink text-xl leading-none">&times;</button>
      </div>

      <div class="flex gap-2 mb-4">
        <button id="ms-auto-btn" class="flex-1 px-3 py-2 rounded-lg border-2 text-xs font-bold transition-all ${manual ? 'border-wood/30 bg-white/50 text-ink-light' : 'border-magic-gold bg-magic-gold/10 text-magic-gold'}">
          🎲 随氛围自动
        </button>
      </div>

      <div class="space-y-2">
        ${tracks.map(t => {
          const isCurrent = t.id === currentId;
          const lockedClass = t.unlocked
            ? (isCurrent ? 'border-magic-gold bg-magic-gold/10 ring-1 ring-magic-gold' : 'border-wood/20 bg-white/50 hover:border-magic-gold/40')
            : 'border-wood/10 bg-stone-100/50 opacity-40';
          const statusIcon = isCurrent ? '🎧' : t.unlocked ? '' : '🔒';
          const onClick = t.unlocked ? `onclick="window._msPick('${t.id}')"` : '';
          return `
            <button class="ms-track-btn w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${lockedClass}" ${onClick}>
              <span class="text-2xl flex-shrink-0">${t.emoji}</span>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-bold text-ink">${t.name} ${statusIcon}</div>
                <div class="text-[10px] text-ink-light">${t.unlocked ? (isCurrent ? '正在播放' : '点击播放') : '氛围达到下一阶段解锁'}</div>
              </div>
              ${isCurrent ? '<span class="text-magic-gold text-xs font-bold flex-shrink-0">▶ 播放中</span>' : ''}
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;

  panelEl.addEventListener('click', (e) => {
    if (e.target === panelEl) close();
  });
  panelEl.querySelector('.ms-close-btn').addEventListener('click', close);
  panelEl.querySelector('#ms-auto-btn').addEventListener('click', () => {
    setAutoMode();
    close();
  });

  document.body.appendChild(panelEl);

  // 全局回调
  window._msPick = (trackId) => {
    selectTrack(trackId);
    close();
  };
}

function close() {
  if (panelEl) { panelEl.remove(); panelEl = null; }
  window._msPick = null;
}
