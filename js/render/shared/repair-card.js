// 修复完成弹窗（共享组件）
import { t } from '../../i18n/terms.js';

export function showRepairCompleteCard(bookTitle, callback) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4';
  const card = document.createElement('div');
  card.className = 'parchment-bg rounded-2xl p-6 max-w-sm w-full text-center magic-glow animate-scale-in';

  card.innerHTML = `
    <div class="text-5xl mb-3">🩹</div>
    <div class="text-xs text-magic-gold font-bold mb-2">${t('repairCompleteTitle')}</div>
    <h3 class="font-display text-xl font-bold mb-2">《${bookTitle}》</h3>
    <div class="grid grid-cols-3 gap-2 mb-3">
      <div class="bg-white/60 rounded-lg p-3">
        <div class="text-lg font-bold text-magic-gold">+30</div>
        <div class="text-xs text-ink-light">${t('repairCompleteRewardCoinsLabel')}</div>
      </div>
      <div class="bg-white/60 rounded-lg p-3">
        <div class="text-lg font-bold text-purple-500">+1✨</div>
        <div class="text-xs text-ink-light">${t('repairCompleteRewardInspirationLabel')}</div>
      </div>
      <div class="bg-white/60 rounded-lg p-3">
        <div class="text-lg font-bold text-green-600">+1</div>
        <div class="text-xs text-ink-light">${t('repairCompleteRewardAtmosphereLabel')}</div>
      </div>
    </div>
    <p class="text-sm text-ink-light mb-3 leading-relaxed">${t('repairCompleteFlavour')}</p>
    <div class="bg-magic-gold/10 border border-magic-gold/20 rounded-lg p-3 mb-4 text-left">
      <p class="text-xs text-ink-light leading-relaxed">${t('repairCompleteMomoTip')}</p>
    </div>
    <button class="px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">${t('continueText')}</button>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const btn = card.querySelector('button');
  btn.addEventListener('click', () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => {
      overlay.remove();
      if (callback) callback();
    }, 300);
  });
}
