// Focus mode selector (Pomodoro / Countdown / Stopwatch)
import { state } from '../../state.js';
import { el, actions } from '../common.js';
import { setFocusMode, setFocusTargetMinutes } from '../../core/focus-session.js';
import { t } from '../../i18n/terms.js';

export function renderModeSelector(sess) {
  const modes = [
    { id: 'pomodoro', name: t('focusModePomodoro'), icon: '🍅', target: 25 },
    { id: 'countdown', name: t('focusModeCountdown'), icon: '⏲️', target: 45 },
    { id: 'stopwatch', name: t('focusModeStopwatch'), icon: '⏱️', target: 0 }
  ];

  const div = el('div', 'mb-6');
  div.appendChild(el('h2', 'font-display text-lg font-bold mb-3', { text: t('selectFocusMode') }));
  const grid = el('div', 'grid grid-cols-3 gap-3');

  modes.forEach(m => {
    const active = sess.mode === m.id;
    const desc = m.id === 'stopwatch' ? t('noLimit') : t('durationMinutes').replace('{n}', sess.mode === m.id ? sess.targetMinutes : m.target);
    const btn = el('button', `mode-btn p-3 border-2 rounded-lg text-center transition-all ${
      active ? 'border-magic-gold bg-magic-gold/20 ring-2 ring-magic-gold' : 'border-wood bg-wood/10 hover:bg-wood/20'
    }${sess.active ? ' opacity-50 cursor-not-allowed' : ''}`);
    btn.innerHTML = `<div class="text-2xl mb-1">${m.icon}</div><div class="font-bold text-sm">${m.name}</div><div class="text-xs text-ink-light">${desc}</div>`;
    btn.addEventListener('click', () => {
      if (!state.currentSession.active) {
        setFocusMode(m.id);
        if (actions.renderFocusPage) actions.renderFocusPage();
      }
    });
    grid.appendChild(btn);
  });

  div.appendChild(grid);

  // Countdown / Pomodoro: custom minutes input
  if (!sess.active && sess.mode !== 'stopwatch') {
    const row = el('div', 'flex items-center gap-2 mt-3 justify-center');
    row.innerHTML = `
      <label class="text-sm text-ink-light">${t('setTime')}</label>
      <input type="number" id="custom-target-minutes"
        class="w-16 px-2 py-1 text-center border border-wood rounded bg-white text-ink font-bold text-sm"
        value="${sess.targetMinutes}" min="1" max="180" step="5">
      <span class="text-sm text-ink-light">${t('minutesSuffix')}</span>
    `;
    row.querySelector('input').addEventListener('input', (e) => {
      const v = Math.max(1, Math.min(180, parseInt(e.target.value) || 1));
      setFocusTargetMinutes(v);
      e.target.value = v;
    });
    row.querySelector('input').addEventListener('change', (e) => {
      const v = Math.max(1, Math.min(180, parseInt(e.target.value) || 1));
      setFocusTargetMinutes(v);
      e.target.value = v;
    });
    div.appendChild(row);
  }

  return div;
}
