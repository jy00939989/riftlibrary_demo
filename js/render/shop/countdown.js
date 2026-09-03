// Shop countdown timer — restocking countdown lifecycle
import { actions } from '../common.js';
import { t } from '../../i18n/terms.js';

let countdownInterval = null;

export function formatCountdown(soldAt) {
  const now = Date.now();
  const remaining = 24 * 3600 * 1000 - (now - soldAt);
  if (remaining <= 0) return '';
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return t('countdownRestocking').replace('{time}', `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
}

// Update countdown text only; avoid rebuilding the whole shop DOM every second
export function updateCountdowns() {
  const els = document.querySelectorAll('.shop-countdown');
  if (els.length === 0) {
    cleanupTimer();
    return;
  }
  let anyExpired = false;
  els.forEach(el => {
    const soldAt = parseInt(el.dataset.soldat, 10);
    if (!soldAt) return;
    const remaining = 24 * 3600 * 1000 - (Date.now() - soldAt);
    if (remaining <= 0) {
      anyExpired = true;
    } else {
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      el.textContent = `⏰ ${t('countdownRestocking').replace('{time}', `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)}`;
    }
  });
  // Trigger a full refresh when a countdown hits zero (restock logic lives in ensureShopState)
  if (anyExpired) {
    cleanupTimer();
    if (actions.renderShopPage) {
      actions.renderShopPage();
    }
  }
}

export function cleanupTimer() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

export function startCountdownTimer() {
  cleanupTimer();
  const els = document.querySelectorAll('.shop-countdown');
  if (els.length > 0) {
    countdownInterval = setInterval(updateCountdowns, 1000);
  }
}
