// Focus page (scriptorium) entry point
import { state } from '../../state.js';
import { BOOKS } from '../../../data/books.js';
import { el, actions } from '../common.js';
import { stopWriting, pauseWriting, resumeWriting, isWriting } from '../writing.js';
import { getFocusSpeedMultiplier, getMasteredBookSpeedBonus } from '../../core/shop/library-upgrades.js';
import { t, getFocusRoomLevelName } from '../../i18n/terms.js';
import { renderDailyTasks } from './daily-tasks.js';
import { renderModeSelector } from './mode-selector.js';
import { renderBookSelector } from './book-selector.js';
import { renderTimerOrAnimation } from './timer-display.js';
import { renderControls } from './controls.js';
import { renderQuestChapterIndicator, updateQuestChapterIndicatorDOM } from './quest-indicator.js';
import { renderBookProgress, updateBookProgressDOM } from './progress-bar.js';
import { renderAuraIndicator } from './aura-indicator.js';
import { renderCopyPreview } from './copy-preview.js';

const FOCUS_IMG_NAMES = [
  'focusroom_lv0_final_0.jpg',
  'focusroom_lv1_no_text_0.jpg',
  'focusroom_lv2_final_0.jpg',
  'focusroom_lv3_final_1.jpg',
  'focusroom_lv4_final_0.jpg',
  'focusroom_lv5_final_1.jpg',
  'focusroom_lv6_sanctuary_16x9_1.jpg'
];

export function renderFocusPage() {
  const container = document.getElementById('page-focus');
  if (!container) return;
  const sess = state.currentSession;
  const book = sess.bookId ? BOOKS[sess.bookId] : null;

  // Active + animation running -> only update controls and background, don't rebuild
  if (sess.active && book && isWriting()) {
    updateActiveControlsDOM(sess);
    updateFocusBackground();
    return;
  }

  // Full rebuild
  stopWriting();
  container.innerHTML = '';

  updateFocusBackground();

  // Scriptorium banner
  const flv = state.library.focusLevel || 0;
  const totalMultiplier = getFocusSpeedMultiplier();
  const masteryBonus = getMasteredBookSpeedBonus();
  const banner = el('div', 'mb-6 rounded-xl overflow-hidden border-2 border-wood/30 shadow-lg');
  banner.innerHTML = `
    <img src="visual/focusroom/${FOCUS_IMG_NAMES[flv]}" alt="${t('tabScriptorium')} · ${getFocusRoomLevelName(flv)}" class="w-full h-48 object-cover">
    <div class="bg-ink/70 text-white text-center py-2 text-sm">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather-icon"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line></svg> ${t('tabScriptorium')} · ${getFocusRoomLevelName(flv)} · 专注倍率 ${Math.round(totalMultiplier * 100)}%${masteryBonus > 0 ? ` <span class="text-magic-gold">(精通 +${(masteryBonus * 100).toFixed(1)}%)</span>` : ''}
    </div>
  `;
  container.appendChild(banner);

  // Daily tasks
  container.appendChild(renderDailyTasks());

  const card = el('div', 'parchment-bg rounded-2xl p-6 md:p-8 magic-glow relative overflow-hidden');
  card.appendChild(el('div', 'grain-texture absolute inset-0 pointer-events-none'));

  // Mode selector (visible during active session but disabled)
  card.appendChild(renderModeSelector(sess));
  // Book selector (hidden during active session to save animation space)
  if (!sess.active) card.appendChild(renderBookSelector(sess));

  // Timer display / writing animation
  card.appendChild(renderTimerOrAnimation(sess, book));

  // Control buttons
  card.appendChild(renderControls(sess));

  // Quest chapter indicator
  if (sess.bookId && book) {
    const indicator = renderQuestChapterIndicator(sess, book);
    if (indicator) card.appendChild(indicator);
  }

  // Book copy progress bar
  if (sess.bookId && book) {
    card.appendChild(renderBookProgress(sess, book));
  }

  container.appendChild(card);

  // Active aura indicator
  const auraSection = renderAuraIndicator();
  if (auraSection) container.appendChild(auraSection);

  // Idle copy preview
  if (!sess.active && sess.bookId && book) {
    container.appendChild(renderCopyPreview(book));
  }
}

function updateActiveControlsDOM(sess) {
  const pauseBtn = document.querySelector('.focus-pause-btn');
  if (pauseBtn) {
    pauseBtn.innerHTML = sess.paused ? t('resume') : t('pause');
  }
  if (sess.paused) pauseWriting(); else resumeWriting();
  if (sess.bookId) {
    updateBookProgressDOM(sess);
    updateQuestChapterIndicatorDOM(sess);
  }
}

function updateFocusBackground() {
  const container = document.getElementById('page-focus');
  if (!container) return;
  const flv = state.library.focusLevel || 0;
  container.style.backgroundImage = `linear-gradient(rgba(44,36,25,0.92), rgba(44,36,25,0.92)), url('visual/focusroom/${FOCUS_IMG_NAMES[flv]}')`;
  container.style.backgroundSize = 'cover';
  container.style.backgroundPosition = 'center';
  container.style.backgroundAttachment = 'fixed';
}

window.renderFocusPage = renderFocusPage;
