// Ambient sounds / BGM shop section
import { el, actions, updateStatusBar } from '../common.js';
import { playSfx } from '../../audio.js';
import { getAmbientDefs, buyAmbient } from '../../ambient.js';
import { getDlcPack, isDlcPackUnlocked } from '../../shop.js';
import { t } from '../../i18n/terms.js';

export function renderAmbientShop() {
  const section = el('div', 'parchment-bg rounded-2xl p-6 magic-glow');
  section.innerHTML = `<h2 class="font-display text-xl font-bold mb-4">🎧 ${t('ambientSounds')}</h2>
    <p class="text-xs text-ink-light mb-4">${t('ambientDescription')}</p>`;

  const grid = el('div', 'grid grid-cols-1 md:grid-cols-2 gap-3');
  const ambients = getAmbientDefs();

  ambients.forEach(a => {
    const packLocked = a.dlcPackId && !isDlcPackUnlocked(a.dlcPackId);
    const pack = packLocked ? getDlcPack(a.dlcPackId) : null;
    const card = el('div', `bg-white rounded-xl p-4 border-2 ${a.unlocked ? 'border-wood/20' : 'border-wood/10 opacity-80'} flex items-center gap-3`);
    card.innerHTML = `
      <span class="text-3xl flex-shrink-0">${a.emoji}</span>
      <div class="flex-1 min-w-0">
        <div class="font-bold text-sm text-ink">${a.name}</div>
        <div class="text-xs text-ink-light truncate">${a.unlocked ? t('ambientOwnedHint') : (packLocked ? t('ambientLockedByPackHint').replace('{pack}', pack?.title || '') : t('ambientLockedHint'))}</div>
      </div>
      ${a.unlocked
        ? `<span class="text-xs text-magic-gold font-bold">${t('ambientOwnedLabel')}</span>`
        : packLocked
          ? `<span class="text-xs text-ink-light/60 font-bold">🔒 ${t('locked')}</span>`
          : `<button class="buy-ambient-btn px-3 py-1.5 bg-magic-gold text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all" data-id="${a.id}">
              💰${a.price.toLocaleString()}
             </button>`}
    `;

    const buyBtn = card.querySelector('.buy-ambient-btn');
    if (buyBtn) {
      buyBtn.addEventListener('click', () => {
        const result = buyAmbient(buyBtn.dataset.id);
        if (result.ok) {
          playSfx('buy_success');
          updateStatusBar();
          if (actions.renderShopPage) {
            actions.renderShopPage();
          }
        } else if (result.reason === 'no_coins') {
          window.showToast(`${t('insufficientCoins')} 💰`, 'error');
        } else if (result.reason === 'dlc_locked') {
          window.showToast(t('ambientLockedByPackHint').replace('{pack}', pack?.title || ''), 'error');
        }
      });
    }

    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}
