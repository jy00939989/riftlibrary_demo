// 应用入口 —— 初始化 + 页面切换 + 全局操作

// 生产环境关闭控制台调试输出（仅 localhost/127.0.0.1 保留）
if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  console.log = () => {};
  console.warn = () => {};
}

import { state, initState, saveState, ensureAllBooksInManuscriptBox } from './state.js';
import { runLegacyMigration, remove, STORAGE_KEYS, load } from './persistence.js';
import { initSettings, getSettings } from './settings.js';
import { getLocale, setLocale } from './i18n/terms.js';
import { addCoins, addHistory, updateStreak, addAtmosphere, updateBodyBackground, onStageCross } from './storage.js';
import { renderFocusPage, renderBookshelfPage, renderLibraryPage,
  renderVisitorsPage, renderArchivePage, renderShopPage, setActions,
  updateStatusBar, initBagEntry, renderGuideQuestWidget
} from './render/index.js';
import { setCompleteCallback, syncTimer } from './timer.js';
import { isNoMasteryBook } from './core/book-eligibility.js';
import { spawnVisitor, tickVisitorBrowsing, checkDueVisitors, getStageWitnesses, tryTriggerGuyuPlantCare, tryTriggerTyphoonDisaster } from './visitors.js';
import { tryTriggerBookDisasters } from './core/disasters.js';
import { checkAutoUnlockPacks } from './shop.js';
import { checkAchievements, checkAllOnInit } from './achievements.js';
import { addWaterOpportunity, checkWither } from './plants.js';
import { addDiaryEntry, tryGenerateDailySummary } from './diary.js';
import { ensureGuideQuests } from './guidequests.js';
import { tickPlaneVisitors } from './quests.js';
import { initAudio, toggleMusic, ensureAudioContext, initSfx, playSfx, startBgm, isMusicOn } from './audio.js';
import { showIntro } from './intro.js';
import { initAuth, initAccountEntry, track } from './backend/index.js';
import { TIER_GOALS, isTierComplete, countTierGoalsComplete } from '../data/tiergoals.js';
import { showTierCompletePopup } from './render/animations.js';
import { playVideoOverlay } from './render/shared/video-overlay.js';
import { showWitnessToast } from './render/shared/visitor-cards.js';
import { showAchievementBatch } from './render/achievements.js';
import { initMusicSelector } from './render/music-selector.js';
import { renderMomoSuggestion, resetMomoSuggestion } from './render/momo-suggestion.js';
import { handleStartFocus, handleTogglePause, handleCompleteFocus, handleAbandonFocus } from './core/focus-actions.js';
import { checkDayRollover } from './core/day-boundary.js';
import './core/offsite.js'; // 寄读日结：onNewDay 订阅副作用注册（borrow-demand-deepening §4）
import { handleBuyShelf, handleUpgradeBorrowLevel } from './core/shop-actions.js';
import { handleCollectReturn } from './core/visitor-actions.js';
import { triggerQuestCheck } from './core/quest-trigger.js';
import { switchTab, getCurrentTab, localizeStaticElements, updateVisitorBadge } from './render/navigation.js';
import { showCrashRecovery } from './render/shared/crash-recovery.js';
import { hideLoadingScreen, updateLoadingScreen } from './render/shared/loading-screen.js';
import { showToast } from './render/shared/toast.js';

function getNow() {
  return window.__dev && window.__dev.getNow ? window.__dev.getNow() : Date.now();
}

setActions({
  startFocus: handleStartFocus,
  togglePause: handleTogglePause,
  completeFocus: handleCompleteFocus,
  abandonFocus: handleAbandonFocus,
  buyShelf: handleBuyShelf,
  collectReturn: handleCollectReturn,
  upgradeBorrowLevel: handleUpgradeBorrowLevel,
  renderShopPage,
  renderFocusPage
});

// 暴露全局函数
window.switchTab = switchTab;

// ========== 启动 ==========

function init() {
  updateLoadingScreen(10, '正在唤醒图书馆...');

  // 全局错误兜底
  window.addEventListener('error', (e) => {
    const msg = e.error?.message || e.message || '未知错误';
    const file = e.filename || '';
    const line = e.lineno || '';
    if (e.error || (file && line)) {
      showCrashRecovery(msg, file, line);
    }
  });
  window.addEventListener('unhandledrejection', (e) => {
    if (e.reason?.message) {
      showCrashRecovery(e.reason.message, '', '');
    }
  });

  updateLoadingScreen(20, '正在整理书架...');

  runLegacyMigration();
  initSettings();

  updateLoadingScreen(30, '正在唤醒音频...');

  const activateAudio = () => {
    ensureAudioContext();
    document.removeEventListener('click', activateAudio);
  };
  document.addEventListener('click', activateAudio);

  initState();
  ensureAllBooksInManuscriptBox();
  checkAutoUnlockPacks();

  // 日界触发点①：初始化链（含登录回档）。迁移已播种 lastSeenDay，
  // 跨日登录在此恰好触发一次 onNewDay；同日/新档为 null 不触发。
  checkDayRollover(state);

  initAuth().catch(err => console.warn('[app] backend auth init failed', err));

  setCompleteCallback(handleCompleteFocus);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      syncTimer();
    }
  });

  if (!state.currentSession.bookId) {
    const firstBook = Object.keys(state.books).find(id => {
      const bs = state.books[id];
      if (!bs || bs.status === 'locked') return false;
      if (bs.status === 'completed' && !bs.reCopyUnlocked) return false;
      if (bs.status === 'completed' && isNoMasteryBook(id) && !bs.reCopyUnlocked) return false;
      return bs.copiedWords > 0 || bs.status === 'copying' || bs.status === 'unlocked';
    });
    if (firstBook) state.currentSession.bookId = firstBook;
  }

  if (state.focus.totalMinutes === 0) {
    state.currentSession.mode = 'countdown';
    state.currentSession.targetMinutes = 1;
  }

  ['focus', 'bookshelf', 'library', 'visitors', 'archive', 'musicroom', 'shop'].forEach(tab => {
    const btn = document.getElementById('tab-' + tab);
    if (btn) btn.addEventListener('click', () => switchTab(tab));
  });

  localizeStaticElements();

  const musicBtn = document.getElementById('music-toggle');
  if (musicBtn) musicBtn.addEventListener('click', toggleMusic);

  const applyLocale = (locale) => {
    setLocale(locale);
    window.location.reload();
  };
  const syncLocaleUI = (locale) => {
    document.documentElement.lang = locale === 'en' ? 'en' : 'zh-CN';
    const langSelector = document.getElementById('lang-selector');
    if (langSelector) langSelector.value = locale;
    document.querySelectorAll('.nav-more-lang-btn').forEach(btn => {
      const active = btn.dataset.locale === locale;
      btn.classList.toggle('bg-wood/20', active);
      btn.classList.toggle('font-bold', active);
    });
  };
  syncLocaleUI(getLocale());

  const langSelector = document.getElementById('lang-selector');
  if (langSelector) {
    langSelector.addEventListener('change', (e) => applyLocale(e.target.value));
  }
  document.querySelectorAll('.nav-more-lang-btn').forEach(btn => {
    btn.addEventListener('click', () => applyLocale(btn.dataset.locale));
  });

  const resourceBtn = document.getElementById('status-resource-btn');
  const resourceCard = document.getElementById('status-resource-card');
  if (resourceBtn && resourceCard) {
    resourceBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      resourceCard.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
      if (!resourceCard.contains(e.target) && !resourceBtn.contains(e.target)) {
        resourceCard.classList.add('hidden');
      }
    });
  }

  const moreBtn = document.getElementById('nav-more-btn');
  const moreMenu = document.getElementById('nav-more-menu');
  if (moreBtn && moreMenu) {
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      moreMenu.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
      if (!moreMenu.contains(e.target) && !moreBtn.contains(e.target)) {
        moreMenu.classList.add('hidden');
      }
    });
  }

  initAccountEntry();
  initBagEntry();

  window.showToast = showToast;

  initAudio();
  initMusicSelector();
  initSfx();

  renderFocusPage();
  renderMomoSuggestion();
  updateStatusBar();
  updateBodyBackground();
  checkWither();

  updateLoadingScreen(70, '正在点亮烛台...');

  try {
    onStageCross((crossedStages) => {
      const stageNames = ['', '废墟', '破败', '陈旧', '温暖', '星辰'];
      // 首个阶段跨越（含 2=首次阈值）播氛围过渡动画 atmo_0_1，再走原庆典链
      if (crossedStages.includes(2)) {
        playVideoOverlay('atmo_0_1', {
          onDone: () => celebrateStageCross(crossedStages, stageNames),
          onFail: () => celebrateStageCross(crossedStages, stageNames)
        });
      } else {
        celebrateStageCross(crossedStages, stageNames);
      }
    });
    function celebrateStageCross(crossedStages, stageNames) {
      crossedStages.forEach(stage => {
        const witnesses = getStageWitnesses(stage);
        if (witnesses.length > 0) {
          showWitnessToast(witnesses, stage);
          witnesses.forEach(w => {
            addDiaryEntry('special_event', {
              detail: `氛围升至「${stageNames[stage]}」时，${w.visitor.emoji} ${w.visitor.name}轻声说：「${w.text}」`
            });
          });
        }

        const completedTier = TIER_GOALS[stage - 2];
        if (completedTier && !(state.tierPopupsShown || []).includes(completedTier.id)) {
          const goalsComplete = countTierGoalsComplete(completedTier, state);
          const allDone = isTierComplete(completedTier, state);
          showTierCompletePopup(completedTier, { goalsComplete, goalsTotal: completedTier.goals.length, allDone });
          if (completedTier.rewardCoins > 0) addCoins(completedTier.rewardCoins);
          if (completedTier.rewardAtmo > 0) addAtmosphere(completedTier.rewardAtmo);
          addHistory('milestone', `🏛️ 馆长目标达成：${completedTier.emoji} ${completedTier.name}`,
            `+${completedTier.rewardCoins}智慧之光 · +${completedTier.rewardAtmo}氛围`);
          if (!state.tierPopupsShown) state.tierPopupsShown = [];
          state.tierPopupsShown.push(completedTier.id);
          saveState();
        }
      });
    }
  } catch (err) {
    console.warn('[app] onStageCross callback error', err);
  }

  tryGenerateDailySummary();

  ensureGuideQuests();
  renderGuideQuestWidget();

  if (!state.introCompleted) {
    showIntro(() => {
      triggerQuestCheck('intro_complete');
    });
  }

  setTimeout(() => {
    const initAchievements = checkAllOnInit();
    showAchievementBatch(initAchievements);
    hideLoadingScreen();
  }, state.introCompleted ? 500 : 5000);

  function tickVisitors() {
    // 日界触发点②：app 持续开着过 0 点也能触发（60s 周期内检测本地跨日）
    checkDayRollover(state, getNow());

    const now = getNow();
    tickVisitorBrowsing(now);
    tickPlaneVisitors(now);
    const due = checkDueVisitors(now);

    tryTriggerGuyuPlantCare();
    const disaster = tryTriggerTyphoonDisaster();
    if (disaster) {
      if (switchTab && typeof renderLibraryPage === 'function') renderLibraryPage();
      if (typeof window.renderShopPage === 'function') window.renderShopPage();
      if (typeof window.renderDecorationPage === 'function') window.renderDecorationPage();
    }

    // 书籍灾难事件（鼠患/霉斑/火灾，可在设置关闭）
    const bookDisasters = tryTriggerBookDisasters();
    if (bookDisasters.length) {
      if (typeof renderLibraryPage === 'function') renderLibraryPage();
      if (typeof renderBookshelfPage === 'function') renderBookshelfPage();
    }

    if (getCurrentTab() === 'visitors') {
      renderVisitorsPage();
    }
    updateVisitorBadge();
    saveState();
  }
  setInterval(tickVisitors, 60000);

  if (state.visitors.length === 0 && state.tutorialFlags.firstVisitorEventDone) {
    spawnVisitor();
  }

  updateLoadingScreen(100, '馆门已开，欢迎回来。');
  hideLoadingScreen();
}

init();
