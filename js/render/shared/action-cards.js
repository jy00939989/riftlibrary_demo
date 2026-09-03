// Break action cards overlay — shared bottom-sheet component
import { t } from '../../i18n/terms.js';

export function showActionCards(cards, callback) {
  if (!cards || cards.length === 0) { if (callback) callback(null); return; }

  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/50 z-[140] flex items-end justify-center pb-8 p-4';
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.2s';
      setTimeout(() => { overlay.remove(); if (callback) callback(null); }, 200);
    }
  });

  const container = document.createElement('div');
  container.className = 'flex gap-3 max-w-lg w-full animate-fade-in-up';

  cards.forEach(card => {
    const btn = document.createElement('button');
    btn.className = 'flex-1 parchment-bg rounded-xl p-4 border-2 border-magic-gold/20 hover:border-magic-gold hover:shadow-lg transition-all text-center cursor-pointer focus:outline-none';
    btn.innerHTML = `
      <div class="text-3xl mb-2">${card.emoji}</div>
      <div class="text-sm font-bold text-ink mb-1">${card.name}</div>
      <div class="text-xs text-ink-light">${card.desc}</div>
    `;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.2s';
      setTimeout(() => {
        overlay.remove();
        if (callback) callback(card);
      }, 200);
    });
    container.appendChild(btn);
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'w-full flex flex-col items-center';
  wrapper.innerHTML = `
    <p class="text-white/80 text-sm mb-3 font-bold">${t('takeABreakChooseAction')}</p>
  `;
  wrapper.appendChild(container);

  overlay.appendChild(wrapper);
  document.body.appendChild(overlay);
}
