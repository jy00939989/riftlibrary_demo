// Navigation routing, static localization, and visitor badge
import { state } from '../state.js';
import { t, getLocale } from '../i18n/terms.js';
import { playSfx } from '../audio.js';
import { triggerQuestCheck } from '../core/quest-trigger.js';
import { checkAndShowTutorial } from '../tutorial.js';
import { dispatchTutorialUI } from './tutorial-ui.js';
import { resetMomoSuggestion } from './momo-suggestion.js';
import {
  renderFocusPage, renderBookshelfPage, renderLibraryPage,
  renderVisitorsPage, renderArchivePage, renderShopPage
} from './index.js';

let currentTab = 'focus';

export function getCurrentTab() {
  return currentTab;
}

export function renderCurrentTab() {
  switch (currentTab) {
    case 'focus': renderFocusPage(); break;
    case 'bookshelf': renderBookshelfPage(); break;
    case 'library': renderLibraryPage(); break;
    case 'visitors': renderVisitorsPage(); break;
    case 'archive': renderArchivePage(); break;
    case 'shop': renderShopPage(); break;
  }
}

export function switchTab(tabName) {
  currentTab = tabName;
  playSfx('button_click');

  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById('tab-' + tabName);
  if (activeBtn) activeBtn.classList.add('active');

  document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
  const page = document.getElementById('page-' + tabName);
  if (page) page.classList.remove('hidden');

  renderCurrentTab();
  resetMomoSuggestion();

  if (tabName === 'bookshelf') {
    triggerQuestCheck('tab_bookshelf');
  } else if (tabName === 'shop') {
    triggerQuestCheck('tab_shop');
  }

  if (tabName === 'shop' || tabName === 'library') {
    const event = tabName === 'shop' ? 'shop_open' : 'library_open';
    const trigger = checkAndShowTutorial(event);
    if (trigger) {
      setTimeout(() => dispatchTutorialUI(trigger), 400);
    }
  }
}

export function localizeStaticElements() {
  document.title = t('gameTitle');

  const loadingText = document.getElementById('loading-text');
  if (loadingText) loadingText.textContent = t('loadingText');

  const navName = document.getElementById('nav-library-name');
  if (navName) navName.textContent = t('libraryName');
  const navSubtitle = document.getElementById('nav-library-subtitle');
  if (navSubtitle) navSubtitle.textContent = t('librarySubtitle');

  const atmoLabel = document.getElementById('atmosphere-label');
  if (atmoLabel) atmoLabel.textContent = t('atmosphere') + ' ';

  const tabMap = {
    'tab-focus': 'tabScriptorium',
    'tab-bookshelf': 'tabGrandLibrary',
    'tab-library': 'tabCuratorOffice',
    'tab-visitors': 'tabReaderSalon',
    'tab-archive': 'tabArchive',
    'tab-shop': 'tabPlaneShop'
  };
  Object.entries(tabMap).forEach(([id, key]) => {
    const btn = document.getElementById(id);
    if (btn) {
      const label = btn.querySelector('.tab-label');
      if (label) label.textContent = t(key);
    }
  });
}

export function updateVisitorBadge() {
  const btn = document.getElementById('tab-visitors');
  if (!btn) return;
  const oldBadge = btn.querySelector('.visitor-badge');
  if (oldBadge) oldBadge.remove();

  const dueCount = state.visitors.filter(v => v.status === 'due').length;
  if (dueCount > 0 && currentTab !== 'visitors') {
    const badge = document.createElement('span');
    badge.className = 'visitor-badge absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-scale-in';
    badge.textContent = dueCount > 9 ? '9+' : dueCount;
    btn.style.position = 'relative';
    btn.appendChild(badge);
  }
}
