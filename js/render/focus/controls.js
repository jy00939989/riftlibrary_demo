// Focus control buttons — start / pause / complete / abandon
import { el, actions } from '../common.js';
import { t } from '../../i18n/terms.js';

export function renderControls(sess) {
  const div = el('div', 'flex flex-wrap justify-center gap-2 sm:gap-4');

  if (!sess.active) {
    const startBtn = el('button',
      'px-8 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all animate-glow text-lg');
    startBtn.textContent = t('startFocus');
    startBtn.addEventListener('click', () => {
      if (actions.startFocus) actions.startFocus();
    });
    div.appendChild(startBtn);
  } else {
    const pauseBtn = el('button',
      `focus-pause-btn px-5 py-2 ${sess.paused ? 'bg-magic-gold' : 'bg-wood'} text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all`);
    pauseBtn.innerHTML = sess.paused ? t('resume') : t('pause');
    pauseBtn.addEventListener('click', () => {
      if (actions.togglePause) actions.togglePause();
    });

    const doneBtn = el('button',
      'px-5 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all');
    doneBtn.textContent = t('complete');
    doneBtn.addEventListener('click', () => {
      if (actions.completeFocus) actions.completeFocus();
    });

    const abandonBtn = el('button',
      'px-5 py-2 bg-red-700/60 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-all');
    abandonBtn.textContent = '✋ ' + t('abandon');
    abandonBtn.addEventListener('click', () => {
      if (confirm(t('confirmAbandonFocus').replace('{pct}', 50))) {
        if (actions.abandonFocus) actions.abandonFocus();
      }
    });

    div.appendChild(pauseBtn);
    div.appendChild(doneBtn);
    div.appendChild(abandonBtn);
  }

  return div;
}
