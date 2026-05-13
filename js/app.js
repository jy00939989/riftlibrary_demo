// 应用入口 —— 初始化 + 页面切换 + 全局操作
import { state, initState, saveState } from './state.js';
import { addCoins, spendCoins, addHistory, updateStreak, addAtmosphere, updateBodyBackground } from './storage.js';
import {
  renderFocusPage, renderBookshelfPage, renderLibraryPage,
  renderVisitorsPage, renderArchivePage, renderShopPage,
  showUnlockAnimation, showBookCompleteAnimation, showCompletionCard, setActions
} from './render/index.js';
import { startTimer, togglePauseTimer, abandonTimer, setCompleteCallback } from './timer.js';
import { BOOKS } from '../data/books.js';
import { installDevPanel } from './dev.js';
import { spawnVisitor, tickVisitorBrowsing, checkDueVisitors, collectReturn, buySalesBook } from './visitors.js';
import { upgradeBorrowLevel, getFocusSpeedMultiplier } from './shop.js';
import { checkAchievements, checkAllOnInit } from './achievements.js';
import { showAchievementToast } from './render/achievements.js';
import { addWaterOpportunity, checkWither } from './plants.js';

function getNow() {
  return window.__dev && window.__dev.getNow ? window.__dev.getNow() : Date.now();
}

// ========== 里程碑配置 ==========

const MILESTONES = [
  { words: 50000 },
  { words: 100000 },
  { words: 200000 },
  { words: 350000 },
  { words: 500000 },
  { words: 800000 },
  { words: 1200000 }
];

// ========== 全局操作 ==========

function handleStartFocus() {
  if (!state.currentSession.bookId) {
    alert('请先选择一本要誊抄的书 📖');
    return;
  }
  // 检测是否为首次誊抄该书
  const bs = state.books[state.currentSession.bookId];
  const isFirstCopy = bs && bs.copiedWords === 0;
  startTimer();
  if (isFirstCopy) {
    const achResults = checkAchievements('copy_start');
    showAchievementBatch(achResults);
  }
}

function handleTogglePause() {
  togglePauseTimer();
}

function handleCompleteFocus(isAuto = false) {
  const sess = state.currentSession;
  if (!sess.active) return;

  const minutes = Math.round(sess.elapsedSeconds / 60);
  if (minutes < 1) {
    if (!isAuto) alert('专注时间太短，至少需要1分钟 ⌛');
    return;
  }

  if (!isAuto && sess.intervalId) {
    clearInterval(sess.intervalId);
  }
  const wordsGained = Math.round(minutes * 100 * getFocusSpeedMultiplier());

  // 更新统计
  const prevTotalWords = state.focus.totalWords;
  state.focus.totalMinutes += minutes;
  state.focus.totalWords += wordsGained;
  updateStreak();

  // 植物浇水机会：番茄钟25分钟模式完成给一次浇水
  if (sess.mode === 'pomodoro' && minutes >= 20) {
    addWaterOpportunity();
  }

  // 更新书籍
  let unlockedChapter = null;
  let bookCompleted = false;
  let bookTitle = '';
  let bookEmoji = '';
  let copyCount = 0;

  if (sess.bookId && state.books[sess.bookId]) {
    const bookState = state.books[sess.bookId];
    const book = BOOKS[sess.bookId];
    bookState.copiedWords += wordsGained;

    // 检查章节解锁
    book.chapters.forEach((ch, idx) => {
      if (!bookState.unlockedChapters.includes(idx + 1) && bookState.copiedWords >= ch.unlockAt) {
        bookState.unlockedChapters.push(idx + 1);
        if (!unlockedChapter) unlockedChapter = ch;
      }
    });

    // 检查书籍完成
    if (bookState.copiedWords >= book.totalWords && bookState.status !== 'completed') {
      bookState.status = 'completed';
      bookState.copyCount += 1;
      bookState.masteryLevel = Math.min(5, bookState.masteryLevel + 1);
      addAtmosphere(book.totalWords < 30000 ? 3 : book.totalWords < 100000 ? 6 : 10);
      addCoins(50);
      addHistory('achievement', `完成《${book.title}》誊抄！`, `第${bookState.copyCount}次誊抄`);
      bookCompleted = true;
      bookTitle = book.title;
      bookEmoji = book.emoji;
      copyCount = bookState.copyCount;
    }
  }

  const coinsEarned = Math.round(minutes * 0.8);
  addCoins(coinsEarned);
  addHistory('focus', `专注 ${minutes} 分钟`, `誊抄 ${wordsGained.toLocaleString()} 字 · +${coinsEarned}智慧之光`);

  sess.active = false;
  sess.elapsedSeconds = 0;
  sess.paused = false;
  saveState();

  // 成就检测
  const achResults = [];
  achResults.push(...checkAchievements('focus_complete'));
  achResults.push(...checkAchievements('focus'));
  if (bookCompleted) achResults.push(...checkAchievements('book_complete'));
  achResults.push(...checkAchievements('book'));
  achResults.push(...checkAchievements('library'));
  showAchievementBatch(achResults);

  // 检查里程碑
  const newMilestones = checkMilestones(prevTotalWords, state.focus.totalWords);

  // 弹窗链：书籍完成 > 章节解锁 > 里程碑 > 结算卡片
  handlePostFocusEffects({
    minutes, wordsGained, coinsEarned,
    unlockedChapter,
    bookCompleted, bookTitle, bookEmoji, copyCount,
    newMilestones
  });
}

// ========== 专注完成后弹窗链 ==========

function handlePostFocusEffects(effects) {
  const {
    minutes, wordsGained, coinsEarned,
    unlockedChapter,
    bookCompleted, bookTitle, bookEmoji, copyCount,
    newMilestones
  } = effects;

  // 构建回调链（从后往前串联）
  let next = () => {
    // 最后一步：结算卡片
    const book = state.currentSession.bookId ? BOOKS[state.currentSession.bookId] : null;
    showCompletionCard({ minutes, words: wordsGained, coins: coinsEarned, book }, () => {
      renderFocusPage();
      updateStatusBar();
    });
  };

  // 里程碑弹窗（倒序插入，让它们在结算卡片之前弹出）
  if (newMilestones && newMilestones.length > 0) {
    const milestoneNext = next;
    next = () => showMilestoneReward(newMilestones, milestoneNext);
  }

  // 章节解锁动画
  if (unlockedChapter) {
    const prevNext = next;
    const ch = unlockedChapter;
    const book = BOOKS[state.currentSession.bookId];
    next = () => {
      showUnlockAnimation(book.title, ch.title, prevNext);
    };
  }

  // 书籍完成动画（最先弹出）
  if (bookCompleted) {
    const prevNext = next;
    next = () => {
      showBookCompleteAnimation(bookTitle, bookEmoji, copyCount, prevNext);
    };
    // 完成时吸引访客
    spawnVisitor();
  }

  next();
}

// ========== 里程碑 ==========

function checkMilestones(prevWords, newWords) {
  if (!state.focus.claimedMilestones) {
    state.focus.claimedMilestones = [];
  }
  const triggered = [];
  MILESTONES.forEach((ms, idx) => {
    if (state.focus.claimedMilestones.includes(idx)) return;
    if (newWords >= ms.words && prevWords < ms.words) {
      state.focus.claimedMilestones.push(idx);
      triggered.push({ idx, words: ms.words });
    }
  });
  if (triggered.length > 0) saveState();
  return triggered;
}

function showMilestoneReward(milestones, callback) {
  // 逐个弹出，一次专注可能触发多个里程碑
  const queue = [...milestones];

  function showNext() {
    if (queue.length === 0) {
      callback();
      return;
    }
    const ms = queue.shift();

    // 从共享池随机抽一本书作为奖励（当前用已有书 + 阿九推销池的简单实现）
    // TODO: 后续连接到 data/book_pool.js 共享池
    addCoins(100);
    addAtmosphere(3);
    addHistory('milestone', `🎯 累计誊抄突破 ${ms.words.toLocaleString()} 字！`, '获得100智慧之光 +3氛围');

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4';
    overlay.innerHTML = `
      <div class="parchment-bg rounded-2xl p-6 max-w-sm w-full text-center magic-glow animate-scale-in">
        <div class="text-4xl mb-3">🎯</div>
        <div class="text-magic-gold text-sm mb-2">里程碑达成</div>
        <h3 class="font-display text-xl font-bold mb-2">累计誊抄 ${ms.words.toLocaleString()} 字</h3>
        <p class="text-ink-light mb-4">获得 <span class="text-magic-blue font-bold">100智慧之光 +3氛围</span></p>
        <button class="px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">太棒了 →</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const btn = overlay.querySelector('button');
    btn.addEventListener('click', () => {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s';
      setTimeout(() => {
        overlay.remove();
        saveState();
        showNext();
      }, 300);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        showNext();
      }
    });
  }

  showNext();
}

function handleAbandonFocus() {
  if (confirm('确定要放弃本次专注吗？已完成时间将计入50%。')) {
    abandonTimer();
  }
}

function handleBuyShelf() {
  const n = state.library.shelves.length;
  const price = Math.min(4800, 300 * Math.pow(2, n - 1));
  if (spendCoins(price)) {
    state.library.shelves.push(state.library.shelves.length + 1);
    addHistory('purchase', '购买新书架', `花费${price}智慧之光`);
    saveState();
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
    const hour = new Date(getNow()).getHours();
    const achResults = [];
    achResults.push(...checkAchievements('visitor_return', { hour }));
    achResults.push(...checkAchievements('visitor'));
    showAchievementBatch(achResults);
    updateStatusBar();
    saveState();
  }
  return result;
}

function handleBuySalesBook(bookMeta) {
  const bookId = buySalesBook(bookMeta);
  if (bookId) {
    updateStatusBar();
    saveState();
    renderBookshelfPage();
  } else {
    alert('智慧之光不足 💰');
  }
}

// ========== 成就通知 ==========

function showAchievementBatch(results) {
  // 去重
  const seen = new Set();
  const unique = results.filter(a => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
  // 逐个弹 toast，每个间隔 0.5s
  unique.forEach((ach, i) => {
    setTimeout(() => showAchievementToast(ach), i * 500);
  });
}

// ========== 注入到 render ==========

function handleUpgradeBorrowLevel() {
  if (!upgradeBorrowLevel()) {
    alert('智慧之光不足');
    return;
  }
  updateStatusBar();
  renderShopPage();
  renderVisitorsPage();
}

setActions({
  startFocus: handleStartFocus,
  togglePause: handleTogglePause,
  completeFocus: handleCompleteFocus,
  abandonFocus: handleAbandonFocus,
  buyShelf: handleBuyShelf,
  collectReturn: handleCollectReturn,
  buySalesBook: handleBuySalesBook,
  upgradeBorrowLevel: handleUpgradeBorrowLevel
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

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('bg-magic-gold', 'text-white', 'shadow-lg');
    btn.classList.add('bg-parchment-dark', 'text-ink');
  });
  const activeBtn = document.getElementById('tab-' + tabName);
  if (activeBtn) {
    activeBtn.classList.remove('bg-parchment-dark', 'text-ink');
    activeBtn.classList.add('bg-magic-gold', 'text-white', 'shadow-lg');
  }

  document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
  const page = document.getElementById('page-' + tabName);
  if (page) page.classList.remove('hidden');

  renderCurrentTab();
};

// ========== 状态栏 ==========

function updateStatusBar() {
  const coinsEl = document.getElementById('status-coins');
  const atmosEl = document.getElementById('status-atmosphere');
  const nameEl = document.getElementById('nav-library-name');
  if (coinsEl) coinsEl.textContent = state.coins.toLocaleString();
  if (atmosEl) atmosEl.textContent = `${state.library.atmosphere}/500`;
  if (nameEl) nameEl.textContent = state.library.name;
}

export { updateStatusBar };

// ========== 新手引导 ==========

function showIntro() {
  const steps = [
    {
      emoji: '🏚️',
      title: '欢迎来到异世界图书馆',
      text: '你推开沉重的橡木门，灰尘在从破洞屋顶洒下的光柱中飞舞。曾经辉煌的大厅如今只剩断壁残垣，书架倒塌如墓碑，破损的书籍散落一地。但空气中残留着某种古老魔法的气息——这里曾经有人守护，而那个人，现在是你。'
    },
    {
      emoji: '📖',
      title: '选择一本书，开始誊抄',
      text: '在「我的书架」中选择一本书，点击「开始誊抄此书」。你的每一笔誊抄，都是对图书馆的修复。专注的时间越长，誊抄的字数越多。'
    },
    {
      emoji: '⏱️',
      title: '专注计时，积攒智慧之光',
      text: '启动专注模式后，计时器开始运转。完成的专注时间会转化为智慧之光——这座图书馆的通用货币。用它在商店购买新书、升级设施。'
    },
    {
      emoji: '👥',
      title: '迎接访客，重建社区',
      text: '随着图书馆逐渐复苏，访客会慕名而来。他们借阅书籍、触发事件、留下礼物。每一位访客的互动，都是图书馆复兴的见证。'
    }
  ];

  let currentStep = 0;

  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4';
  overlay.id = 'intro-overlay';

  function renderStep() {
    const step = steps[currentStep];
    const isLast = currentStep === steps.length - 1;

    overlay.innerHTML = `
      <div class="parchment-bg rounded-2xl p-8 max-w-md w-full magic-glow animate-scale-in text-center relative">
        <button class="absolute top-3 right-3 text-ink-light hover:text-ink text-lg leading-none" id="intro-skip" title="跳过引导">✕</button>
        <div class="text-5xl mb-4">${step.emoji}</div>
        <h2 class="font-display text-xl font-bold mb-4">${step.title}</h2>
        <p class="text-ink-light leading-relaxed mb-6 text-sm">${step.text}</p>
        <div class="flex items-center justify-between">
          <div class="flex gap-1">
            ${steps.map((_, i) => `<span class="w-2 h-2 rounded-full ${i === currentStep ? 'bg-magic-gold' : 'bg-wood/30'}"></span>`).join('')}
          </div>
          <button class="intro-next-btn px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">
            ${isLast ? '✨ 开始冒险' : '继续 →'}
          </button>
        </div>
      </div>
    `;

    const nextBtn = overlay.querySelector('.intro-next-btn');
    nextBtn.addEventListener('click', () => {
      if (isLast) {
        dismissIntro();
      } else {
        currentStep++;
        renderStep();
      }
    });

    const skipBtn = overlay.querySelector('#intro-skip');
    skipBtn.addEventListener('click', dismissIntro);
  }

  function dismissIntro() {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => {
      overlay.remove();
      state.introCompleted = true;
      saveState();
    }, 300);
  }

  renderStep();
  // 点击遮罩背景也可关闭
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) dismissIntro();
  });
  document.body.appendChild(overlay);
}

// ========== 启动 ==========

function init() {
  initState();

  // 注入回调
  setCompleteCallback(handleCompleteFocus);

  // 默认选择第一本已开启过抄写的书
  if (!state.currentSession.bookId) {
    const firstBook = Object.keys(state.books).find(id => {
      const bs = state.books[id];
      return bs && bs.status !== 'locked' && bs.copiedWords > 0;
    });
    if (firstBook) state.currentSession.bookId = firstBook;
  }

  // 设置标签按钮
  ['focus', 'bookshelf', 'library', 'visitors', 'archive', 'shop'].forEach(tab => {
    const btn = document.getElementById('tab-' + tab);
    if (btn) btn.addEventListener('click', () => window.switchTab(tab));
  });

  renderCurrentTab();
  updateStatusBar();
  updateBodyBackground();
  checkWither(); // 72小时离线凋谢检测

  // 新手引导
  if (!state.introCompleted) {
    showIntro();
  }

  // 启动后全量检测一次成就（氛围、累计天数等）并弹通知
  setTimeout(() => {
    const initAchievements = checkAllOnInit();
    showAchievementBatch(initAchievements);
  }, state.introCompleted ? 500 : 5000); // 有引导时等引导结束

  console.log('📚 异世界图书馆已就绪');
  console.log(`   ${state.library.name} · 氛围 ${state.library.atmosphere}/500 · 连续专注 ${state.focus.streak} 天`);

  // 注入 BOOKS 引用给 dev 面板
  window.__dev._books = BOOKS;
  installDevPanel();

  // 访客系统循环（每 60 秒推进一次）
  function tickVisitors() {
    const now = getNow();
    tickVisitorBrowsing(now);
    const due = checkDueVisitors(now);
    if (currentTab === 'visitors') {
      renderVisitorsPage();
    }
    if (due && due.length > 0 && currentTab !== 'visitors') {
      const btn = document.getElementById('tab-visitors');
      if (btn && !btn.textContent.includes('🔔')) {
        btn.textContent = '🔔 访客中心';
      }
    }
  }
  setInterval(tickVisitors, 60000);

  // 初始没有访客时预先刷新一位
  if (state.visitors.length === 0) {
    spawnVisitor();
  }
}

init();
