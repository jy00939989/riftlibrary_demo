// 缮写设置面板 —— 点击顶栏 ✍️ 按钮打开/关闭（2026-10-30 从音乐面板拆出，图南：皮肤/速度不该混在声音里）
// 内容：抄写速度三档（即时生效，动画每 tick 实时读设置）+ 缮写底版皮肤（data/writing-skins.js 单一真源）
import { t } from '../i18n/terms.js';
import { getSettings, setSetting } from '../settings.js';
import {
  DEFAULT_WRITING_SPEED, DEFAULT_WRITING_SKIN,
  WRITING_SKINS, getWritingSkinDef, isWritingSkinUnlocked, getWritingSkinLockKey
} from '../../data/writing-skins.js';
import { isFestivalActive } from '../../data/festival.js';
import { state, saveState } from '../state.js';
import { spendCoins } from '../storage.js';

let panelEl = null;
let globalEscHandler = null;

export function initWritingSettings() {
  const btn = document.getElementById('writing-settings-btn');
  if (btn) btn.addEventListener('click', toggle);
}

function toggle() {
  if (panelEl) { close(); return; }
  open();
}

function close() {
  if (!panelEl) return;
  panelEl.remove();
  panelEl = null;
  if (globalEscHandler) {
    document.removeEventListener('keydown', globalEscHandler);
    globalEscHandler = null;
  }
}

function open() {
  if (panelEl) close();

  const writingSpeed = getSettings().writingSpeed || DEFAULT_WRITING_SPEED;
  const chosenSkin = getSettings().writingSkin || DEFAULT_WRITING_SKIN;
  const gothicAuto = isFestivalActive('gothicNight2026');
  // 底版皮肤行：已解锁=可点选；锁定=🔒+条件；直购=💰按钮
  const speedBtn = (key) =>
    `<button data-wspeed="${key}" class="text-[10px] px-2 py-1 rounded-full border transition-all ${writingSpeed === key ? 'border-magic-gold bg-magic-gold/10 text-magic-gold' : 'border-wood/30 bg-white/50 text-ink-light'}">${t('writingSpeed' + key[0].toUpperCase() + key.slice(1))}</button>`;
  const skinRow = (def) => {
    const unlocked = isWritingSkinUnlocked(def, state);
    const active = chosenSkin === def.id;
    const autoTag = (def.id === 'gothic' && gothicAuto) ? ` <span class="text-magic-gold">·${t('writingSkinAuto')}</span>` : '';
    if (unlocked) {
      return `<button data-wskin="${def.id}" class="text-[10px] px-2 py-1 rounded-full border transition-all ${active ? 'border-magic-gold bg-magic-gold/10 text-magic-gold' : 'border-wood/30 bg-white/50 text-ink-light'}">${t(def.nameKey)}${autoTag}</button>`;
    }
    const lockKey = getWritingSkinLockKey(def);
    if (def.unlock.type === 'purchase') {
      return `<button data-wskin-buy="${def.id}" class="text-[10px] px-2 py-1 rounded-full border border-wood/30 bg-white/50 text-ink-light hover:border-magic-gold" ${state.coins < def.unlock.price ? 'disabled' : ''}>🔒${t(def.nameKey)} 💰${def.unlock.price}</button>`;
    }
    return `<span class="text-[10px] px-2 py-1 rounded-full border border-wood/20 bg-white/30 text-ink-light/50">🔒${t(def.nameKey)} · ${t(lockKey)}</span>`;
  };
  const writingSkinRows = WRITING_SKINS.map(skinRow).join(' ');

  panelEl = document.createElement('div');
  panelEl.id = 'writing-settings-panel';
  panelEl.style.cssText = 'position:fixed;inset:0;z-index:900;background:rgba(20,16,10,0.92);display:flex;align-items:center;justify-content:center;';
  panelEl.innerHTML = `
    <div class="parchment-bg rounded-2xl p-6 max-w-sm w-full mx-4 magic-glow">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-display text-lg font-bold text-ink">${t('writingSettingsTitle')}</h3>
        <button class="ws-close-btn text-ink-light/50 hover:text-ink text-xl leading-none" type="button">&times;</button>
      </div>

      <!-- 抄写速度档（即时生效） -->
      <div class="pt-2 px-1">
        <div class="text-xs font-bold text-ink-light tracking-wider">✍️ ${t('writingSpeedTitle')}</div>
        <div class="text-[10px] text-ink-light/70 mt-0.5">${t('writingSpeedDesc')}</div>
        <div class="flex gap-2 mt-1.5">${speedBtn('calm')}${speedBtn('normal')}${speedBtn('swift')}</div>
      </div>

      <!-- 缮写底版皮肤 -->
      <div class="mt-3 pt-3 border-t border-wood/20 px-1">
        <div class="text-xs font-bold text-ink-light tracking-wider">📖 ${t('writingSkinTitle')}</div>
        <div class="text-[10px] text-ink-light/70 mt-0.5">${t('writingSkinDesc')}</div>
        <div class="flex flex-wrap gap-2 mt-1.5">${writingSkinRows}</div>
      </div>
    </div>
  `;

  panelEl.addEventListener('click', (e) => {
    if (e.target === panelEl) close();
  });
  panelEl.querySelector('.ws-close-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    close();
  });

  // 抄写速度档：即时生效（动画每 tick 实时读设置）
  panelEl.querySelectorAll('[data-wspeed]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setSetting('writingSpeed', btn.dataset.wspeed);
      open();
    });
  });
  // 底版皮肤：选已解锁的
  panelEl.querySelectorAll('[data-wskin]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setSetting('writingSkin', btn.dataset.wskin);
      open();
    });
  });
  // 直购皮肤（油画风 800 智慧之光）：扣款 → 入账所有权 → 自动选中
  panelEl.querySelectorAll('[data-wskin-buy]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const def = getWritingSkinDef(btn.dataset.wskinBuy);
      if (!def || def.unlock.type !== 'purchase') return;
      if (!spendCoins(def.unlock.price)) return;
      state.writingSkinsOwned = { ...(state.writingSkinsOwned || {}), [def.id]: true };
      saveState();
      setSetting('writingSkin', def.id);
      open();
    });
  });

  document.body.appendChild(panelEl);

  if (globalEscHandler) document.removeEventListener('keydown', globalEscHandler);
  globalEscHandler = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', globalEscHandler);
}
