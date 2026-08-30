// 应用入口 —— 初始化 + 页面切换 + 全局操作

// 生产环境关闭控制台调试输出（仅 localhost/127.0.0.1 保留）
if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  console.log = () => {};
  console.warn = () => {};
}

import { state, initState, saveState, ensureAllBooksInManuscriptBox, DEFAULT_BOOKS } from './state.js';
import { runLegacyMigration, remove, STORAGE_KEYS, load, save } from './persistence.js';
import { initSettings, getSettings } from './settings.js';
import { t, getLocale, setLocale } from './i18n/terms.js';
import { addCoins, spendCoins, addHistory, updateStreak, addAtmosphere, updateBodyBackground, getAtmosphereLevel, onStageCross, addInspiration } from './storage.js';
import { renderFocusPage, renderBookshelfPage, renderLibraryPage,
  renderVisitorsPage, renderArchivePage, renderShopPage, setActions,
  updateStatusBar, initBagEntry
} from './render/index.js';
import { startTimer, togglePauseTimer, abandonTimer, setCompleteCallback } from './timer.js';
import { runFocusOrchestration } from './core/focus-orchestrator.js';
import { triggerQuestCheck } from './core/quest-trigger.js';
import { isNoMasteryBook } from './core/book-eligibility.js';
import { BOOKS } from '../data/books.js';
import { spawnVisitor, tickVisitorBrowsing, checkDueVisitors, collectReturn, getAuraCoinsMultiplier, getAuraSpawnBonus, getBorrowSpawnBonus, getStageWitnesses, tryTriggerGuyuPlantCare, tryTriggerTyphoonDisaster } from './visitors.js';
import { upgradeBorrowLevel, checkAutoUnlockPacks } from './shop.js';
import { checkAchievements, checkAllOnInit, getAchievementBonuses } from './achievements.js';
import { addWaterOpportunity, checkWither } from './plants.js';
import { addDiaryEntry, tryGenerateDailySummary } from './diary.js';
import { tickPlaneVisitors, checkTaskCompletion } from './quests.js';
import { initAudio, toggleMusic, ensureAudioContext, initSfx, playSfx, pauseMusic, startBgm, isMusicOn } from './audio.js';
import { playAmbient, isAmbientEnabled } from './ambient.js';
import { showIntro } from './intro.js';
import { initAuth, initAccountEntry, track } from './backend/index.js';
import { checkAndShowTutorial } from './tutorial.js';
import { TIER_GOALS, isTierComplete, countTierGoalsComplete } from '../data/tiergoals.js';
import { showTierCompletePopup } from './render/animations.js';
import { dispatchTutorialUI, showBorrowAreaUpgrade } from './render/tutorial-ui.js';
import { showCertificate } from './render/certificate.js';
import { ensureDailyTasks, markTaskDone, claimAllDoneBonus } from './dailytasks.js';
import { ensureGuideQuests, getQuestProgress } from './guidequests.js';
import { renderGuideQuestWidget } from './render/index.js';
import { showMomoBorrowReadyCard, showWitnessToast } from './render/shared/visitor-cards.js';
import { showAchievementBatch } from './render/achievements.js';
import { initMusicSelector } from './render/music-selector.js';
import { renderMomoSuggestion, resetMomoSuggestion } from './render/momo-suggestion.js';

function getNow() {
  return window.__dev && window.__dev.getNow ? window.__dev.getNow() : Date.now();
}

import { startFocus, togglePauseFocus, completeFocus as coreCompleteFocus, abandonFocus } from './core/focus-session.js';

// ========== 里程碑配置 ==========

// MILESTONES 与 getNextMilestone/checkMilestones 已迁移到 js/core/focus-rewards.js


// ========== 全局操作 ==========

function handleStartFocus() {
  // 首次用户交互时初始化音频上下文（只初始化音效，不播 BGM）
  ensureAudioContext();

  // 开始专注时，若音乐/环境音开关开启，自动播放当前选中的
  if (isMusicOn()) {
    startBgm(state.musicManualTrack || null);
  }
  if (isAmbientEnabled()) {
    playAmbient(state.ambientSounds?.current);
  }

  if (!state.currentSession.bookId) {
    alert('请先选择一本要誊抄的书 📖');
    return;
  }

  const bs = state.books[state.currentSession.bookId];
  const isFirstCopy = bs && bs.copiedWords === 0;
  const isFirstFocusEver = state.focus.totalMinutes === 0;

  function doStart() {
    const result = startFocus(state.currentSession.bookId, state.currentSession.mode, state.currentSession.targetMinutes);
    if (!result.ok) {
      alert('请先选择一本要誊抄的书 📖');
      return;
    }
    if (isFirstCopy) {
      const achResults = checkAchievements('copy_start');
      showAchievementBatch(achResults);
    }
    triggerQuestCheck('focus_start');
  }

  // 首次专注：墨墨出场
  if (isFirstFocusEver) {
    showMomoIntro(() => doStart());
  } else {
    doStart();
  }
}

function showMomoIntro(callback) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/70 z-[150] flex items-center justify-center p-4';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-2xl p-8 max-w-sm w-full text-center magic-glow animate-scale-in">
      <div class="text-6xl mb-4">📚</div>
      <div class="text-xs text-magic-gold mb-2 font-bold tracking-wider">？？？</div>
      <p class="text-ink leading-relaxed mb-2 text-sm">好不容易有个人来了……</p>
      <p class="text-ink leading-relaxed mb-4 text-sm">不能让他没耐心跑了！让我用魔法给他加加速——</p>
      <p class="text-xs text-ink-light mb-6">✨ 书架深处传来一声低语，空气中泛起金色的微光 ✨</p>
      <button class="px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">✨ 开始誊抄</button>
    </div>
  `;

  overlay.querySelector('button').addEventListener('click', () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => {
      overlay.remove();
      callback();
    }, 300);
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.querySelector('button').click();
    }
  });

  document.body.appendChild(overlay);
}

function handleTogglePause() {
  togglePauseFocus();
}

function handleCompleteFocus(isAuto = false) {
  const sess = state.currentSession;
  if (!sess.active) return;

  const earlyMinutes = Math.round(sess.elapsedSeconds / 60);
  if (earlyMinutes < 1 && !isAuto) {
    alert('专注时间太短，至少需要1分钟 ⌛');
    return;
  }

  playSfx('focus_complete');
  pauseMusic();

  // 手动完成时清除 interval；自动完成时 timer.js 已经 stopTimer 了
  if (!isAuto && sess.intervalId) {
    clearInterval(sess.intervalId);
    sess.intervalId = null;
  }

  const result = coreCompleteFocus(isAuto);
  runFocusOrchestration(result, isAuto);
}

function handleAbandonFocus() {
  const sess = state.currentSession;
  const minutes = sess.active ? Math.round(sess.elapsedSeconds / 60) : 0;
  if (confirm('确定要放弃本次专注吗？已完成时间将计入50%。')) {
    track('focus_abandon', {
      book_id: sess.bookId || null,
      mode: sess.mode,
      minutes,
      target_minutes: sess.targetMinutes
    });
    abandonFocus();
  }
}

function handleBuyShelf() {
  const n = state.library.shelves.length;
  const price = Math.min(4800, 300 * Math.pow(2, n - 1));
  if (spendCoins(price)) {
    state.library.shelves.push([null, null, null, null, null]);
    addAtmosphere(5);
    addHistory('purchase', '购买新书架', `花费${price}智慧之光 · +5氛围`);
    playSfx('buy_success');
    saveState();
    track('purchase_shelf', { shelf_count: state.library.shelves.length, price });
    const achResults = checkAchievements('purchase_shelf');
    showAchievementBatch(achResults);
    renderBookshelfPage();
    updateStatusBar();
  } else {
    alert('智慧之光不足，需要继续专注赚取 💰');
  }
}

function handleCollectReturn(visitorId) {
  const result = collectReturn(visitorId);
  if (result) {
    playSfx('book_return');
    const hour = new Date(getNow()).getHours();
    track('visitor_return', { visitor_id: visitorId, hour });
    const achResults = [];
    achResults.push(...checkAchievements('visitor_return', { hour }));
    achResults.push(...checkAchievements('visitor'));
    showAchievementBatch(achResults);
    updateStatusBar();
    updateVisitorBadge();
    // 今日馆务：收取还书
    const taskResult = markTaskDone('return', state);
    if (taskResult) {
      addHistory('task', `📜 今日馆务：${taskResult.name}`, taskResult.reward);
    }
    saveState();
  }
  return result;
}

function handleUpgradeBorrowLevel() {
  if (!upgradeBorrowLevel()) {
    alert('智慧之光不足');
    return;
  }
  updateStatusBar();
  playSfx('buy_success');
  renderShopPage();
  renderVisitorsPage();
  showBorrowAreaUpgrade(state.library.borrowLevel);
  triggerQuestCheck('borrow_upgrade');

  // 首次借阅区升级后墨墨提示可正式借书
  if (!state.tutorialFlags.firstBorrowUpgradeDone) {
    state.tutorialFlags.firstBorrowUpgradeDone = true;
    saveState();
    setTimeout(() => showMomoBorrowReadyCard(), 1500);
  }
}

setActions({
  startFocus: handleStartFocus,
  togglePause: handleTogglePause,
  completeFocus: handleCompleteFocus,
  abandonFocus: handleAbandonFocus,
  buyShelf: handleBuyShelf,
  collectReturn: handleCollectReturn,
  upgradeBorrowLevel: handleUpgradeBorrowLevel,
  renderShopPage
});

// ========== 页面切换 ==========

let currentTab = 'focus';

function renderCurrentTab() {
  switch (currentTab) {
    case 'focus': renderFocusPage(); break;
    case 'bookshelf': renderBookshelfPage(); break;
    case 'library': renderLibraryPage(); break;
    case 'visitors': renderVisitorsPage(); break;
    case 'archive': renderArchivePage(); break;
    case 'shop': renderShopPage(); break;
  }
}

window.switchTab = function(tabName) {
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

  // 引导任务：首次进入大书库 / 商店
  if (tabName === 'bookshelf') {
    triggerQuestCheck('tab_bookshelf');
  } else if (tabName === 'shop') {
    triggerQuestCheck('tab_shop');
  }

  // 首次打开商店/馆长办公室时触发教学
  if (tabName === 'shop' || tabName === 'library') {
    const event = tabName === 'shop' ? 'shop_open' : 'library_open';
    const trigger = checkAndShowTutorial(event);
    if (trigger) {
      setTimeout(() => dispatchTutorialUI(trigger), 400);
    }
  }
};

// updateStatusBar 已移至 render/common.js，由 import 引入

// showIntro() 已提取至 js/intro.js

// ========== 崩溃恢复面板 ==========

function showCrashRecovery(message, file, line) {
  // 防止递归：一个面板已显示就不再创建
  if (document.getElementById('crash-recovery')) return;

  const overlay = document.createElement('div');
  overlay.id = 'crash-recovery';
  overlay.className = 'fixed inset-0 z-[300] flex items-center justify-center p-4';
  overlay.style.background = 'radial-gradient(ellipse at center, #3d2b1f 0%, #1a1410 100%)';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-2xl p-6 max-w-sm w-full text-center magic-glow">
      <div class="text-5xl mb-3">🦉</div>
      <p class="text-sm text-magic-gold font-bold mb-2">墨墨发现了一些不对劲…</p>
      <p class="text-xs text-ink-light leading-relaxed mb-4">
        图书馆的魔法暂时有些波动。<br>别担心，你的抄写记录都还在。
      </p>
      <details class="text-left mb-4">
        <summary class="text-xs text-ink-light/50 cursor-pointer">错误详情</summary>
        <pre class="text-xs text-red-500 mt-2 p-2 bg-red-50 rounded overflow-x-auto max-h-32">${message}${file ? '\n文件: ' + file + ':' + line : ''}</pre>
      </details>
      <div class="space-y-2">
        <button id="crash-reload" class="w-full px-4 py-2.5 bg-magic-gold text-white rounded-lg font-bold hover:shadow-lg transition-all text-sm">
          🔄 刷新页面
        </button>
        <button id="crash-reset" class="w-full px-4 py-2.5 bg-red-100 text-red-700 rounded-lg font-bold hover:bg-red-200 transition-all text-sm">
          ⚠️ 重置存档重新开始
        </button>
        <button id="crash-export" class="w-full px-4 py-2.5 bg-wood/15 text-ink rounded-lg font-bold hover:bg-wood/25 transition-all text-sm">
          📥 先导出存档备份
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#crash-reload').addEventListener('click', () => location.reload());
  overlay.querySelector('#crash-reset').addEventListener('click', () => {
    if (confirm('确定要清除所有存档数据重新开始吗？此操作不可恢复。')) {
      remove(STORAGE_KEYS.STATE);
      remove(STORAGE_KEYS.STATE_BACKUP);
      remove(STORAGE_KEYS.SETTINGS);
      remove(STORAGE_KEYS.ACHIEVEMENTS);
      remove(STORAGE_KEYS.META);
      location.reload();
    }
  });
  overlay.querySelector('#crash-export').addEventListener('click', () => {
    const payload = load(STORAGE_KEYS.STATE);
    if (!payload || !payload.library) {
      alert('存档数据不可用');
      return;
    }
    const blob = new Blob([JSON.stringify({ version: 1, state: payload }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `归墟图书馆_崩溃备份_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function hideLoadingScreen() {
  const el = document.getElementById('loading-screen');
  if (!el) return;
  const bar = document.getElementById('loading-bar');
  if (bar) bar.style.width = '100%';
  const text = document.getElementById('loading-text');
  if (text) text.textContent = '馆门已开，欢迎回来。';
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.4s';
    setTimeout(() => el.remove(), 400);
  }, 300);
}

// ========== 静态元素本地化 ==========

function localizeStaticElements() {
  // 页面标题
  document.title = t('gameTitle');

  // 加载提示
  const loadingText = document.getElementById('loading-text');
  if (loadingText) loadingText.textContent = t('loadingText');

  // 顶部馆名与副标题
  const navName = document.getElementById('nav-library-name');
  if (navName) navName.textContent = t('libraryName');
  const navSubtitle = document.getElementById('nav-library-subtitle');
  if (navSubtitle) navSubtitle.textContent = t('librarySubtitle');

  // 状态栏资源标签
  const atmoLabel = document.getElementById('atmosphere-label');
  if (atmoLabel) atmoLabel.textContent = t('atmosphere') + ' ';

  // 顶部标签按钮
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

// ========== 启动 ==========

function init() {
  // 加载进度：初始化
  const loadingBar = document.getElementById('loading-bar');
  const loadingText = document.getElementById('loading-text');
  const updateLoading = (pct, text) => {
    if (loadingBar) loadingBar.style.width = pct + '%';
    if (loadingText) loadingText.textContent = text;
  };
  updateLoading(10, '正在唤醒图书馆...');

  // 全局错误兜底：防止单点 JS 异常 → 全站白屏
  window.addEventListener('error', (e) => {
    const msg = e.error?.message || e.message || '未知错误';
    const file = e.filename || '';
    const line = e.lineno || '';
    // 非外部资源加载错误（JS 运行时错误）→ 显示恢复面板
    if (e.error || (file && line)) {
      showCrashRecovery(msg, file, line);
    }
  });
  window.addEventListener('unhandledrejection', (e) => {
    if (e.reason?.message) {
      showCrashRecovery(e.reason.message, '', '');
    }
  });

  updateLoading(20, '正在整理书架...');

  // 存储层迁移：必须在任何模块 load 之前执行
  runLegacyMigration();
  // 设置必须最先加载，否则首次用户交互的音频恢复会读到默认设置（音乐默认开），
  // 导致“设置里音乐已关但 BGM 仍在播放”的竞态 bug。
  initSettings();

  updateLoading(30, '正在唤醒音频...');

  // 首次用户交互激活音频上下文（只初始化音效，不自动播 BGM/环境音）
  const activateAudio = () => {
    ensureAudioContext();
    document.removeEventListener('click', activateAudio);
  };
  document.addEventListener('click', activateAudio);

  initState();
  ensureAllBooksInManuscriptBox();
  checkAutoUnlockPacks();

  // 后端认证初始化：失败也不阻塞本地游戏
  initAuth().catch(err => console.warn('[app] backend auth init failed', err));

  // 注入回调
  setCompleteCallback(handleCompleteFocus);

  // 默认选择第一本已开启过抄写、且可以立即誊抄的书
  if (!state.currentSession.bookId) {
    const firstBook = Object.keys(state.books).find(id => {
      const bs = state.books[id];
      if (!bs || bs.status === 'locked') return false;
      // 已完成的书必须已经解锁重抄，才默认选中
      if (bs.status === 'completed' && !bs.reCopyUnlocked) return false;
      // 不参与精通系统的 completed 书不再默认选中
      if (bs.status === 'completed' && isNoMasteryBook(id) && !bs.reCopyUnlocked) return false;
      return bs.copiedWords > 0 || bs.status === 'copying' || bs.status === 'unlocked';
    });
    if (firstBook) state.currentSession.bookId = firstBook;
  }

  // 首次专注默认1分钟快速体验
  if (state.focus.totalMinutes === 0) {
    state.currentSession.mode = 'countdown';
    state.currentSession.targetMinutes = 1;
  }

  // 设置标签按钮
  ['focus', 'bookshelf', 'library', 'visitors', 'archive', 'shop'].forEach(tab => {
    const btn = document.getElementById('tab-' + tab);
    if (btn) btn.addEventListener('click', () => window.switchTab(tab));
  });

  // 本地化静态元素
  localizeStaticElements();

  // 音乐开关
  const musicBtn = document.getElementById('music-toggle');
  if (musicBtn) musicBtn.addEventListener('click', toggleMusic);

  // 语言切换：兼容旧版 select 与新版的 ⚙️ 更多菜单按钮
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

  // 资源卡片：点击金币区展开/收起完整资源（小屏方案 B）
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

  // ⚙️ 更多菜单：收纳语言切换与存档管理
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

  // 暴露给 bag.js 等模块使用
  window.showToast = showToast;

  initAudio();
  initMusicSelector();
  initSfx();

  renderCurrentTab();
  renderMomoSuggestion();
  updateStatusBar();
  updateBodyBackground();
  checkWither(); // 72小时离线凋谢检测

  updateLoading(70, '正在点亮烛台...');

  try {
    // 氛围阶段突破 → 访客见证 + 馆长目标阶段完成弹窗
    onStageCross((crossedStages) => {
      const stageNames = ['', '废墟', '破败', '陈旧', '温暖', '星辰'];
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

      // 馆长目标：阶段突破时检测对应 tier 是否已完成
      const completedTier = TIER_GOALS[stage - 2]; // stage 2 → tier1, stage 3 → tier2 ...
      if (completedTier && !(state.tierPopupsShown || []).includes(completedTier.id)) {
        const goalsComplete = countTierGoalsComplete(completedTier, state);
        const allDone = isTierComplete(completedTier, state);
        // 弹出阶段完成弹窗
        showTierCompletePopup(completedTier, { goalsComplete, goalsTotal: completedTier.goals.length, allDone });
        // 发放奖励
        if (completedTier.rewardCoins > 0) addCoins(completedTier.rewardCoins);
        if (completedTier.rewardAtmo > 0) addAtmosphere(completedTier.rewardAtmo);
        addHistory('milestone', `🏛️ 馆长目标达成：${completedTier.emoji} ${completedTier.name}`,
          `+${completedTier.rewardCoins}智慧之光 · +${completedTier.rewardAtmo}氛围`);
        // 记录已弹出
        if (!state.tierPopupsShown) state.tierPopupsShown = [];
        state.tierPopupsShown.push(completedTier.id);
        saveState();
      }
    });
  });

  tryGenerateDailySummary(); // 每日回顾：昨天有活动则生成一篇墨墨日志

  // 引导任务初始化
  ensureGuideQuests();
  renderGuideQuestWidget();

  // 新手开场引导
  if (!state.introCompleted) {
    showIntro(() => {
      triggerQuestCheck('intro_complete');
    });
  }

  // 启动后全量检测一次成就（氛围、累计天数等）并弹通知
  setTimeout(() => {
    const initAchievements = checkAllOnInit();
    showAchievementBatch(initAchievements);
    // 隐藏加载屏：等引导启动后再淡出，避免闪烁
    hideLoadingScreen();
  }, state.introCompleted ? 500 : 5000); // 有引导时等引导结束

  // 初始化完成

  // 访客系统循环（每 60 秒推进一次）
  function tickVisitors() {
    const now = getNow();
    tickVisitorBrowsing(now);
    tickPlaneVisitors(now);
    const due = checkDueVisitors(now);

    // 植物相关 tick：谷雨照料 + 台风灾难
    tryTriggerGuyuPlantCare();
    const disaster = tryTriggerTyphoonDisaster();
    if (disaster) {
      // 灾难触发后刷新相关页面
      if (currentTab === 'library') {
        renderLibraryPage();
      }
      if (typeof window.renderShopPage === 'function') window.renderShopPage();
      if (typeof window.renderDecorationPage === 'function') window.renderDecorationPage();
    }

    if (currentTab === 'visitors') {
      renderVisitorsPage();
    }
    updateVisitorBadge();
    saveState();
  }
  setInterval(tickVisitors, 60000);

  // 初始没有访客时预先刷新一位（已触发过破败事件后才正常刷）
  if (state.visitors.length === 0 && state.tutorialFlags.firstVisitorEventDone) {
    spawnVisitor();
  }
  } finally {
    // 无论初始化是否出错，都要隐藏加载屏
    updateLoading(100, '馆门已开，欢迎回来。');
    hideLoadingScreen();
  }
}

// 访客到期徽章（模块级，供 handleCollectReturn 和 tickVisitors 共享）
function updateVisitorBadge() {
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

// ========== 全局 Toast ==========

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  const bgClass = type === 'error' ? 'bg-red-800' : 'bg-ink/80';
  toast.className = `fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 ${bgClass} text-white rounded-full text-sm z-[200] animate-fade-in-up`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

init();
