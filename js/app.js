// 应用入口 —— 初始化 + 页面切换 + 全局操作
import { state, initState, saveState } from './state.js';
import { addCoins, spendCoins, addHistory, updateStreak, addAtmosphere, updateBodyBackground, getAtmosphereLevel } from './storage.js';
import {
  renderFocusPage, renderBookshelfPage, renderLibraryPage,
  renderVisitorsPage, renderArchivePage, renderShopPage,
  showUnlockAnimation, showBookCompleteAnimation, showBookShelvingAnimation, showCompletionCard, setActions,
  updateStatusBar
} from './render/index.js';
import { startTimer, togglePauseTimer, abandonTimer, setCompleteCallback } from './timer.js';
import { BOOKS } from '../data/books.js';
import { installDevPanel } from './dev.js';
import { spawnVisitor, tickVisitorBrowsing, checkDueVisitors, collectReturn, buySalesBook, removeVisitor, getVisitorDef } from './visitors.js';
import { upgradeBorrowLevel, getFocusSpeedMultiplier } from './shop.js';
import { checkAchievements, checkAllOnInit } from './achievements.js';
import { showAchievementToast } from './render/achievements.js';
import { addWaterOpportunity, checkWither } from './plants.js';
import { addDiaryEntry, tryGenerateDailySummary } from './diary.js';
import { tickPlaneVisitors, checkTaskCompletion } from './quests.js';
import { initAudio, toggleMusic, onFirstInteraction } from './audio.js';
import { showIntro } from './intro.js';
import { checkAndShowTutorial } from './tutorial.js';
import { dispatchTutorialUI, showBorrowAreaUpgrade } from './render/tutorial-ui.js';
import { showCertificate } from './render/certificate.js';
import { ensureDailyTasks, markTaskDone, claimAllDoneBonus } from './dailytasks.js';
import { ensureGuideQuests, checkGuideQuest, tryCompleteAllDone, getQuestProgress } from './guidequests.js';
import { renderGuideQuestWidget, showQuestCompleteToast } from './render/index.js';

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

// ========== 引导任务检测辅助 ==========

function triggerQuestCheck(event) {
  const result = checkGuideQuest(event);
  if (result && result.completed) {
    showQuestCompleteToast(result.completed);
  }
  renderGuideQuestWidget();
  // 如果刚完成了第9个任务，检查第10个
  if (result && result.completed && result.completed.id === 'q09') {
    const finalResult = tryCompleteAllDone();
    if (finalResult && finalResult.completed) {
      showQuestCompleteToast(finalResult.completed);
      renderGuideQuestWidget();
    }
  }
}

// ========== 全局操作 ==========

function handleStartFocus() {
  if (!state.currentSession.bookId) {
    alert('请先选择一本要誊抄的书 📖');
    return;
  }
  const bs = state.books[state.currentSession.bookId];
  const isFirstCopy = bs && bs.copiedWords === 0;
  const isFirstFocusEver = state.focus.totalMinutes === 0;

  // 首次誊抄此书：状态从 unlocked → copying
  if (bs && bs.status === 'unlocked') {
    bs.status = 'copying';
    saveState();
  }

  function doStart() {
    startTimer();
    if (isFirstCopy) {
      const achResults = checkAchievements('copy_start');
      showAchievementBatch(achResults);
    }
  }

  // 首次专注：墨墨出场
  if (isFirstFocusEver) {
    showMomoIntro(() => {
      doStart();
      triggerQuestCheck('focus_start');
    });
  } else {
    doStart();
    triggerQuestCheck('focus_start');
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
  onFirstInteraction(); // 首次专注完成后激活BGM

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
  let completedBook = null;

  if (sess.bookId && state.books[sess.bookId]) {
    const bookState = state.books[sess.bookId];
    const book = BOOKS[sess.bookId];
    bookState.copiedWords += wordsGained;

    // 检查章节解锁
    const newlyUnlocked = [];
    book.chapters.forEach((ch, idx) => {
      if (!bookState.unlockedChapters.includes(idx + 1) && bookState.copiedWords >= ch.unlockAt) {
        bookState.unlockedChapters.push(idx + 1);
        newlyUnlocked.push({ bookId: sess.bookId, chapterIdx: idx });
        if (!unlockedChapter) unlockedChapter = ch;
      }
    });
    newlyUnlocked.forEach(u => checkTaskCompletion('chapter_unlocked', u));

    // 检查书籍完成
    if (bookState.copiedWords >= book.totalWords && bookState.status !== 'completed') {
      bookState.status = 'completed';
      bookState.copyCount += 1;
      bookState.masteryLevel = Math.min(5, bookState.masteryLevel + 1);
      addAtmosphere(book.totalWords < 30000 ? 3 : book.totalWords < 100000 ? 6 : 10);
      addCoins(50);
      addHistory('achievement', `完成《${book.title}》誊抄！`, `第${bookState.copyCount}次誊抄`);
      addDiaryEntry('book_complete', { title: book.title });
      bookCompleted = true;
      bookTitle = book.title;
      bookEmoji = book.emoji;
      copyCount = bookState.copyCount;
      completedBook = book;
      checkTaskCompletion('book_completed', { bookId: sess.bookId });
    }
  }

  const coinsEarned = Math.round(minutes * 0.8);
  addCoins(coinsEarned);
  addHistory('focus', `专注 ${minutes} 分钟`, `誊抄 ${wordsGained.toLocaleString()} 字 · +${coinsEarned}智慧之光`);

  sess.active = false;
  sess.elapsedSeconds = 0;
  sess.paused = false;
  saveState();

  // 今日馆务：专注 ≥25 分钟
  if (minutes >= 25) {
    const taskResult = markTaskDone('focus', state);
    if (taskResult) {
      addHistory('task', `📜 今日馆务：${taskResult.name}`, taskResult.reward);
    }
  }

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
  const isFirstBookComplete = bookCompleted && !state.tutorialFlags.firstBookComplete;
  handlePostFocusEffects({
    minutes, wordsGained, coinsEarned,
    unlockedChapter,
    bookCompleted, bookTitle, bookEmoji, copyCount, completedBook,
    isFirstBookComplete,
    newMilestones
  });

  // 专注完成后访客到来
  if (!bookCompleted) {
    // 首个访客：累积专注 ≥20 分钟后必然触发破败叙事事件
    const firstVisitorDue = !state.tutorialFlags.firstVisitorEventDone
      && state.focus.totalMinutes >= 20;
    if (firstVisitorDue) {
      const visitor = spawnVisitor();
      if (visitor) {
        showFirstVisitorEvent(visitor);
      }
    } else if (state.tutorialFlags.firstVisitorEventDone) {
      // 后续访客：概率触发（~35%，受氛围加成）
      const spawnChance = 0.30 + (state.library.atmosphere / 500) * 0.20;
      if (Math.random() < spawnChance) {
        const visitor = spawnVisitor();
        if (visitor) {
          const vAchResults = checkAchievements('visitor_arrive');
          showAchievementBatch(vAchResults);
          showVisitorArrivalCard(visitor);
          triggerQuestCheck('visitor_arrive');
        }
      }
    }
  }

  // 引导任务检测
  triggerQuestCheck('focus_complete');
  if (bookCompleted) {
    triggerQuestCheck('book_complete');
  }
}

// ========== 专注完成后弹窗链 ==========

function handlePostFocusEffects(effects) {
  const {
    minutes, wordsGained, coinsEarned,
    unlockedChapter,
    bookCompleted, bookTitle, bookEmoji, copyCount, completedBook,
    isFirstBookComplete,
    newMilestones
  } = effects;

  // 构建回调链（从后往前串联）
  let next = () => {
    // 最后一步：结算卡片（含留存钩子数据）
    const book = state.currentSession.bookId ? BOOKS[state.currentSession.bookId] : null;
    const nextMs = getNextMilestone(state.focus.totalWords);
    showCompletionCard({
      minutes, words: wordsGained, coins: coinsEarned, book,
      streak: state.focus.streak,
      totalWords: state.focus.totalWords,
      nextMilestone: nextMs
    }, () => {
      renderFocusPage();
      updateStatusBar();
      // 结算后检查教程触发
      checkAndShowPostFocusTutorials();
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

  // 书籍完成动画/证书 → 上架动画（最先弹出）
  if (bookCompleted) {
    const prevNext = next;
    if (isFirstBookComplete && completedBook) {
      next = () => {
        showCertificate(completedBook, () => {
          showBookShelvingAnimation(completedBook, prevNext);
        });
      };
    } else {
      next = () => {
        showBookCompleteAnimation(bookTitle, bookEmoji, copyCount, () => {
          showBookShelvingAnimation(completedBook, prevNext);
        });
      };
    }
    // 完成时吸引访客
    const bv = spawnVisitor();
    if (bv) triggerQuestCheck('visitor_arrive');
  }

  next();
}

// 结算后检查教程触发（氛围阶段跨越 + 首次专注完成）
function checkAndShowPostFocusTutorials() {
  const currStage = getAtmosphereLevel().level;
  const maxSeen = state.tutorialFlags.maxAtmoStageSeen || 1;

  if (currStage > maxSeen) {
    // 一次可能跨多个阶段，逐个弹出
    let stageQueue = [];
    for (let s = maxSeen + 1; s <= currStage; s++) {
      stageQueue.push(s);
    }
    showAtmoStageChain(stageQueue, () => {
      checkAndShowFocusCompleteTutorial();
    });
  } else {
    checkAndShowFocusCompleteTutorial();
  }
}

function showAtmoStageChain(queue, callback) {
  if (queue.length === 0) { callback(); return; }
  const stage = queue.shift();
  const stageNames = ['', '废墟', '破败', '陈旧', '温暖', '星辰'];
  const stageName = stageNames[stage] || `阶段${stage}`;

  addHistory('atmosphere', `✨ 图书馆氛围升至「${stageName}」`, `阶段 ${stage}/5`);
  addDiaryEntry('special_event', { detail: `图书馆的氛围进入了「${stageName}」阶段——每个角落都充盈着灵光。` });

  const trigger = checkAndShowTutorial(`atmosphere_stage_${stage}`);
  if (trigger) {
    dispatchTutorialUI(trigger, () => showAtmoStageChain(queue, callback));
  } else {
    showAtmoStageChain(queue, callback);
  }
}

function checkAndShowFocusCompleteTutorial() {
  const trigger = checkAndShowTutorial('focus_complete');
  if (trigger) {
    dispatchTutorialUI(trigger);
  }
}

// ========== 里程碑 ==========

function getNextMilestone(totalWords) {
  for (const ms of MILESTONES) {
    if (totalWords < ms.words) return ms.words;
  }
  return null;
}

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
    addDiaryEntry('milestone', { words: ms.words.toLocaleString() });

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
    addAtmosphere(5);
    addHistory('purchase', '购买新书架', `花费${price}智慧之光 · +5氛围`);
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

function handleBuySalesBook(bookMeta) {
  const bookId = buySalesBook(bookMeta);
  if (bookId) {
    updateStatusBar();
    saveState();
    renderBookshelfPage();
    const bookAch = checkAchievements('purchase_book');
    showAchievementBatch(bookAch);
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

// ========== 首个访客破败叙事事件 ==========

function showFirstVisitorEvent(visitor) {
  const def = getVisitorDef(visitor.charId);
  const line = def ? def.firstImpression : '这地方……好破旧啊。';

  // 步骤1：访客入场动画 + 破败台词
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-ink/60';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-2xl p-8 shadow-2xl border-2 border-magic-gold/30 max-w-md mx-4 text-center animate-fade-in-up">
      <div class="text-5xl mb-3 animate-bounce-in">${visitor.emoji}</div>
      <p class="text-xs text-magic-gold font-bold mb-2">第一位访客</p>
      <p class="text-ink font-bold text-lg mb-4">${visitor.name}</p>
      <p class="text-ink-light text-sm leading-relaxed mb-6">「${line}」</p>
      <p class="text-xs text-ink-light/50">${visitor.name} 环顾了一圈，轻轻叹了口气<br>然后转身离开了</p>
    </div>
  `;
  document.body.appendChild(overlay);

  // 访客离开
  removeVisitor(visitor.id);
  state.tutorialFlags.firstVisitorEventDone = true;
  saveState();

  // 5秒后切换到墨墨的反馈
  setTimeout(() => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.5s';
    setTimeout(() => overlay.remove(), 500);

    // 步骤2：墨墨转述 + 建议升级借阅区
    setTimeout(() => showMomoShabbyLibraryCard(), 300);
  }, 5000);
}

function showMomoShabbyLibraryCard() {
  const overlay = document.createElement('div');
  overlay.className = 'fixed bottom-6 right-6 z-[200] animate-slide-in-right';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-xl p-5 shadow-2xl border-2 border-magic-gold/30 max-w-xs">
      <div class="flex items-start gap-3">
        <div class="text-3xl">🦉</div>
        <div>
          <p class="text-xs text-magic-gold font-bold mb-1">墨墨</p>
          <p class="text-ink text-sm leading-relaxed mb-3">刚才那位读者走的时候摇了摇头……说图书馆太破了，连像样的桌椅都没有。馆长，要不要去<b class="text-magic-gold">位面商店</b>升级一下借阅区？</p>
          <button class="momo-upgrade-btn px-4 py-1.5 bg-magic-gold text-white rounded-lg text-xs font-bold hover:shadow-lg transition-all">去看看 →</button>
        </div>
        <button class="momo-close-btn text-ink-light/50 hover:text-ink ml-1 text-sm leading-none">&times;</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => overlay.remove(), 300);
  };
  overlay.querySelector('.momo-close-btn').addEventListener('click', close);
  overlay.querySelector('.momo-upgrade-btn').addEventListener('click', () => {
    close();
    window.switchTab('shop');
  });
  // 15秒后自动消失
  setTimeout(close, 15000);
}

// ========== 借阅区首次升级后的墨墨提示 ==========

function showMomoBorrowReadyCard() {
  const overlay = document.createElement('div');
  overlay.className = 'fixed bottom-6 right-6 z-[200] animate-slide-in-right';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-xl p-5 shadow-2xl border-2 border-magic-gold/30 max-w-xs">
      <div class="flex items-start gap-3">
        <div class="text-3xl">🦉</div>
        <div>
          <p class="text-xs text-magic-gold font-bold mb-1">墨墨</p>
          <p class="text-ink text-sm leading-relaxed mb-2">借阅区升级完成！现在访客可以<b class="text-magic-gold">正式办理借书手续</b>了。多抄几本书上架，大家就有书可借啦。</p>
          <p class="text-xs text-ink-light/50">去缮写室誊抄你的第一本书吧</p>
        </div>
        <button class="momo-borrow-close-btn text-ink-light/50 hover:text-ink ml-1 text-sm leading-none">&times;</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => overlay.remove(), 300);
  };
  overlay.querySelector('.momo-borrow-close-btn').addEventListener('click', close);
  setTimeout(close, 12000);
}

// ========== 访客到来卡片 ==========

function showVisitorArrivalCard(visitor) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed bottom-6 right-6 z-[120] animate-slide-in-right';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-xl p-5 shadow-2xl border-2 border-magic-gold/30 max-w-xs">
      <div class="flex items-start gap-3">
        <div class="text-4xl">${visitor.emoji}</div>
        <div>
          <p class="text-xs text-magic-gold font-bold mb-1">访客到来</p>
          <p class="text-ink font-bold">${visitor.name}</p>
          <p class="text-ink-light text-xs">${visitor.title}</p>
        </div>
        <button class="text-ink-light/50 hover:text-ink ml-2 text-sm leading-none">&times;</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => overlay.remove(), 300);
  };
  overlay.querySelector('button').addEventListener('click', close);
  // 8秒后自动消失
  setTimeout(close, 8000);

  // 首次访客到来时触发教学（卡片消失后弹出）
  const trigger = checkAndShowTutorial('visitor_arrive');
  if (trigger) {
    setTimeout(() => {
      dispatchTutorialUI(trigger);
    }, 9000); // 等访客卡片自动消失后
  }
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

  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById('tab-' + tabName);
  if (activeBtn) activeBtn.classList.add('active');

  document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
  const page = document.getElementById('page-' + tabName);
  if (page) page.classList.remove('hidden');

  renderCurrentTab();

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

  // 音乐开关
  const musicBtn = document.getElementById('music-toggle');
  if (musicBtn) musicBtn.addEventListener('click', toggleMusic);
  initAudio();
  // 回头客自动播放BGM，新用户等首次专注完成后触发
  if (state.focus.totalMinutes > 0) {
    onFirstInteraction();
  }

  renderCurrentTab();
  updateStatusBar();
  updateBodyBackground();
  checkWither(); // 72小时离线凋谢检测
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
    tickPlaneVisitors(now);
    const due = checkDueVisitors(now);
    if (currentTab === 'visitors') {
      renderVisitorsPage();
    }
    updateVisitorBadge();
  }
  setInterval(tickVisitors, 60000);

  // 初始没有访客时预先刷新一位（已触发过破败事件后才正常刷）
  if (state.visitors.length === 0 && state.tutorialFlags.firstVisitorEventDone) {
    spawnVisitor();
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

init();
