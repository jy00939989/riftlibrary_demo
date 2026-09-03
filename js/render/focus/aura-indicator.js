// Active visitor aura indicator for the focus page
import { el } from '../common.js';
import { getActiveAuras } from '../../visitors.js';
import { t } from '../../i18n/terms.js';

export function renderAuraIndicator() {
  const auras = getActiveAuras();
  if (auras.length === 0) return null;

  const wrapper = el('div', 'mt-4 p-3 rounded-xl border border-magic-gold/20');
  wrapper.style.background = 'linear-gradient(135deg, rgba(201,162,39,0.06) 0%, rgba(201,162,39,0.02) 100%)';

  const lines = auras.map(a => {
    const timerHtml = a.duration
      ? `<span class="text-xs text-magic-blue ml-1">${t('durationMinutes').replace('{n}', Math.ceil(a.duration / 60000))}</span>`
      : '';
    return `
      <div class="flex items-center gap-2 text-xs text-ink-light">
        <span class="text-magic-gold text-sm">✨</span>
        <span class="font-bold text-ink">${a.name}</span>
        <span>${a.desc}</span>
        ${timerHtml}
      </div>
    `;
  }).join('');

  wrapper.innerHTML = `
    <div class="text-xs text-magic-gold font-bold mb-1.5">${t('activeAurasCount').replace('{n}', auras.length)}</div>
    <div class="space-y-1">${lines}</div>
  `;

  return wrapper;
}
