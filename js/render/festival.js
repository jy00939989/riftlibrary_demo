// 双节活动弹窗 —— 登录自动礼的仪式感入口（2026 中秋·国庆）
import { el } from './common.js';
import { t } from '../i18n/terms.js';
import { formatRewardSummary } from '../core/redeem.js';
import { SIGNBOARDS } from '../../data/signboards.js';

/** 节日礼弹窗：🌕 标题 + 礼物清单 + 收下按钮（点击任意处关闭） */
export function showFestivalGiftPopup(fest) {
  if (!fest || typeof document === 'undefined') return;
  const existing = document.getElementById('festival-gift-popup');
  if (existing) existing.remove();

  const overlay = el('div', 'fixed inset-0 z-[240] flex items-center justify-center p-4');
  overlay.id = 'festival-gift-popup';
  overlay.style.background = 'rgba(20, 12, 4, 0.72)';
  overlay.style.transition = 'opacity 0.3s';

  const plaqueName = fest.giftRewards?.signboards?.length
    ? SIGNBOARDS[fest.giftRewards.signboards[0]]?.name
    : null;

  const card = el('div', 'parchment-bg rounded-2xl p-6 max-w-sm w-full text-center border-2 border-amber-300/60 shadow-2xl animate-scale-in');
  card.innerHTML = `
    <div class="text-6xl mb-2">${fest.emoji}</div>
    <h3 class="font-display text-xl font-bold text-amber-900 mb-1">${t(fest.titleKey)}</h3>
    <p class="text-sm text-ink-light leading-relaxed mb-4">${t(fest.descKey)}</p>
    <div class="bg-white/60 rounded-xl p-3 mb-4 text-left">
      <div class="text-xs text-ink-light mb-1">${t('festivalGiftLabel')}</div>
      <div class="text-sm font-bold text-ink">${formatRewardSummary(fest.giftRewards)}</div>
      ${plaqueName ? `<div class="text-xs text-magic-gold font-bold mt-1">🪧 ${plaqueName} ×1</div>` : ''}
    </div>
    <button class="festival-gift-close px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">${t('festivalGiftBtn')}</button>
  `;
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const close = () => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 300);
  };
  card.querySelector('.festival-gift-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}
