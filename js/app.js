// 应用入口 —— 初始化 + 页面切换 + 全局操作
import { state, initState, saveState } from './state.js';
import { addCoins, spendCoins, addHistory, updateStreak, addAtmosphere } from './storage.js';
import {
  renderFocusPage, renderBookshelfPage, renderLibraryPage,
  renderVisitorsPage, renderArchivePage, renderShopPage,
  showUnlockAnimation, showBookCompleteAnimation, showCompletionCard, setActions
} from './render/index.js';
import { startTimer, togglePauseTimer, abandonTimer, setCompleteCallback } from './timer.js';
import { BOOKS } from '../data/books.js';
import { installDevPanel } from './dev.js';
import { spawnVisitor, tickVisitorBrowsing, checkDueVisitors, collectReturn, buySalesBook } from './visitors.js';

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
  startTimer();
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
  const wordsGained = minutes * 100;

  // 更新统计
  const prevTotalWords = state.focus.totalWords;
  state.focus.totalMinutes += minutes;
  state.focus.totalWords += wordsGained;
  updateStreak();

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
      addAtmosphere(5);
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
  addHistory('focus', `专注 ${minutes} 分钟`, `誊抄 ${wordsGained.toLocaleString()} 字 · +${coinsEarned}代币`);

  sess.active = false;
  sess.elapsedSeconds = 0;
  sess.paused = false;
  saveState();

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
    addAtmosphere(5);
    addHistory('milestone', `🎯 累计誊抄突破 ${ms.words.toLocaleString()} 字！`, '获得100代币 +5氛围');

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4';
    overlay.innerHTML = `
      <div class="parchment-bg rounded-2xl p-6 max-w-sm w-full text-center magic-glow animate-scale-in">
        <div class="text-4xl mb-3">🎯</div>
        <div class="text-magic-gold text-sm mb-2">里程碑达成</div>
        <h3 class="font-display text-xl font-bold mb-2">累计誊抄 ${ms.words.toLocaleString()} 字</h3>
        <p class="text-ink-light mb-4">获得 <span class="text-magic-blue font-bold">100代币 +5氛围</span></p>
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
    addHistory('purchase', '购买新书架', `花费${price}代币`);
    saveState();
    renderBookshelfPage();
    updateStatusBar();
  } else {
    alert('代币不足，需要继续专注赚取 💰');
  }
}

function handleCollectReturn(visitorId) {
  const result = collectReturn(visitorId);
  if (result) {
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
    alert('代币不足 💰');
  }
}

// ========== 注入到 render ==========

setActions({
  startFocus: handleStartFocus,
  togglePause: handleTogglePause,
  completeFocus: handleCompleteFocus,
  abandonFocus: handleAbandonFocus,
  buyShelf: handleBuyShelf,
  collectReturn: handleCollectReturn,
  buySalesBook: handleBuySalesBook
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
  if (coinsEl) coinsEl.textContent = state.coins.toLocaleString();
  if (atmosEl) atmosEl.textContent = `${state.library.atmosphere}/100`;
}

export { updateStatusBar };

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

  console.log('📚 异世界图书馆已就绪');
  console.log(`   ${state.library.name} · 氛围 ${state.library.atmosphere}/100 · 连续专注 ${state.focus.streak} 天`);

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
