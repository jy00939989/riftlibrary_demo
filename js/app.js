// 应用入口 —— 初始化 + 页面切换 + 全局操作

// 生产环境关闭控制台调试输出（仅 localhost/127.0.0.1 保留）
if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  console.log = () => {};
  console.warn = () => {};
}

import { state, initState, saveState, ensureAllBooksInManuscriptBox } from './state.js';
import { runLegacyMigration, remove, STORAGE_KEYS, load, save } from './persistence.js';
import { initSettings, getSettings } from './settings.js';
import { t, getLocale, setLocale } from './i18n/terms.js';
import { addCoins, spendCoins, addHistory, updateStreak, addAtmosphere, updateBodyBackground, getAtmosphereLevel, onStageCross, addInspiration } from './storage.js';
import { canDrawActionCards, drawActionCards, applyAction } from './actioncards.js';
import { renderFocusPage, renderBookshelfPage, renderLibraryPage,
  renderVisitorsPage, renderArchivePage, renderShopPage,
  showUnlockAnimation, showBookCompleteAnimation, showBookShelvingAnimation, showCompletionCard, showActionCards, setActions,
  updateStatusBar, getBookTitle, getChapterTitle
} from './render/index.js';
import { startTimer, togglePauseTimer, abandonTimer, setCompleteCallback } from './timer.js';
import { BOOKS } from '../data/books.js';
import { spawnVisitor, tickVisitorBrowsing, checkDueVisitors, collectReturn, removeVisitor, getVisitorDef, getAuraSpeedBonus, getAuraCoinsMultiplier, getAuraSpawnBonus, getBorrowSpawnBonus, getStageWitnesses } from './visitors.js';
import { removeFromManuscriptBox, isBookCapacityFull, placeOnShelf, getRestorationRepairSpeedBonus, isRestorationUnlocked } from './capacity.js';
import { upgradeBorrowLevel, getFocusSpeedMultiplier, hasSignboard } from './shop.js';
import { getCurationFocusSpeed, getCurationCoinsBonus } from './curation.js';
import { checkAchievements, checkAllOnInit, getAchievementBonuses } from './achievements.js';
import { showAchievementToast } from './render/achievements.js';
import { addWaterOpportunity, checkWither } from './plants.js';
import { addDiaryEntry, tryGenerateDailySummary } from './diary.js';
import { tickPlaneVisitors, checkTaskCompletion } from './quests.js';
import { initAudio, toggleMusic, onFirstInteraction, initSfx, playSfx, pauseMusic } from './audio.js';
import { showIntro } from './intro.js';
import { checkAndShowTutorial } from './tutorial.js';
import { TIER_GOALS, isTierComplete, countTierGoalsComplete } from '../data/tiergoals.js';
import { showTierCompletePopup } from './render/animations.js';
import { dispatchTutorialUI, showBorrowAreaUpgrade } from './render/tutorial-ui.js';
import { showCertificate } from './render/certificate.js';
import { ensureDailyTasks, markTaskDone, claimAllDoneBonus } from './dailytasks.js';
import { ensureGuideQuests, checkGuideQuest, tryCompleteAllDone, getQuestProgress } from './guidequests.js';
import { renderGuideQuestWidget, showQuestCompleteToast } from './render/index.js';
import { initMusicSelector } from './render/music-selector.js';
import { renderMomoSuggestion, resetMomoSuggestion } from './render/momo-suggestion.js';

function getNow() {
  return window.__dev && window.__dev.getNow ? window.__dev.getNow() : Date.now();
}

// 章节进度辅助（纯函数已移至 js/core/book-utils.js）
import { getChapterInfo, getNextChapterPreview, getEffectiveCopiedWords, getRepairProgress } from './core/book-utils.js';
export { getChapterInfo, getNextChapterPreview };

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
  // 首次用户交互时初始化音频（修复：之前 initSfx 在专注完成后才调用，导致首次专注音效静默）
  // 开始专注不自动播放 BGM，由用户通过音乐开关/选择器手动控制
  onFirstInteraction(false);

  if (!state.currentSession.bookId) {
    alert('请先选择一本要誊抄的书 📖');
    return;
  }
  const bs = state.books[state.currentSession.bookId];
  const isFirstCopy = bs && bs.copiedWords === 0;
  const isFirstFocusEver = state.focus.totalMinutes === 0;

  // 首次誊抄此书：状态从 unlocked → copying
  if (bs && (bs.status === 'unlocked' || bs.status === 'completed')) {
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
  if (minutes < 1 && !isAuto) {
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
  const bookCategory = sess.bookId ? BOOKS[sess.bookId]?.category : null;
  const auraSpeed = getAuraSpeedBonus(bookCategory);
  // 热茶 buff：前5分钟速度 +10%
  const curationSpeed = getCurationFocusSpeed();

  // 修复加成：损坏的书正在修复中，Lv0 仅解锁修复功能，Lv1 起每级 +5%
  const bookIsDamaged = sess.bookId && state.books[sess.bookId] && state.books[sess.bookId].damaged;
  const repairSpeedBonus = (bookIsDamaged && isRestorationUnlocked()) ? getRestorationRepairSpeedBonus() : 0;

  let wordsGained;
  if (sess.teaBoost) {
    const boostMin = Math.min(5, minutes);
    const normalMin = minutes - boostMin;
    wordsGained = Math.round((boostMin * 110 + normalMin * 100) * getFocusSpeedMultiplier() * (1 + auraSpeed + curationSpeed + repairSpeedBonus));
  } else {
    wordsGained = Math.round(minutes * 100 * getFocusSpeedMultiplier() * (1 + auraSpeed + curationSpeed + repairSpeedBonus));
  }

  // 章节收尾冲刺：专注开始时章节进度 ≥90% → +20% 速度
  if (sess.bookId && state.books[sess.bookId]) {
    const chInfo = getChapterInfo(BOOKS[sess.bookId], state.books[sess.bookId]);
    if (chInfo && chInfo.progressPct >= 90) {
      wordsGained = Math.round(wordsGained * 1.20);
    }
  }

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
  let completedBook = null;
  let bookMastery = 0;

  if (sess.bookId && state.books[sess.bookId]) {
    const bookState = state.books[sess.bookId];
    const book = BOOKS[sess.bookId];
    const totalWords = book.totalWords || 1;
    const prevCopyCount = bookState.copyCount || 0;

    // 当前周期内的有效进度：重抄时也显示为 0-100%，而不是 200%/300%
    const startEffectiveWords = getEffectiveCopiedWords(bookState, totalWords);
    const projectedEffective = startEffectiveWords + wordsGained;
    const didComplete = projectedEffective >= totalWords;

    // 封顶到本次完成边界：一次专注只能完成一个周期，禁止连跳多级
    if (didComplete) {
      bookState.copiedWords = (prevCopyCount + 1) * totalWords;
    } else {
      bookState.copiedWords = prevCopyCount * totalWords + projectedEffective;
    }

    // 检查章节解锁
    const newlyUnlocked = [];
    if (book.chapters) book.chapters.forEach((ch, idx) => {
      if (!bookState.unlockedChapters.includes(idx + 1) && bookState.copiedWords >= ch.unlockAt) {
        bookState.unlockedChapters.push(idx + 1);
        newlyUnlocked.push({ bookId: sess.bookId, chapterIdx: idx });
        if (!unlockedChapter) unlockedChapter = ch;
      }
    });
    newlyUnlocked.forEach(u => checkTaskCompletion('chapter_unlocked', u));

    if (didComplete) {
      const isFirstCompletion = prevCopyCount === 0;

      bookState.copyCount = prevCopyCount + 1;
      if (!book.noMastery) {
        bookState.masteryLevel = Math.min(5, bookState.copyCount);
        bookMastery = bookState.masteryLevel;
      }

      if (isFirstCompletion) {
        bookState.status = 'completed';
      }

      // 灵感重抄完成 → 重置标记
      if (bookState.reCopyUnlocked) {
        bookState.reCopyUnlocked = false;
      }

      // 发放单次完成奖励：单卷奖励减半（典藏版合成后才是完整一本）
      const isVolume = book.isVolume === true;
      const atmoReward = (book.totalWords < 30000 ? 3 : book.totalWords < 100000 ? 6 : 10) * (isVolume ? 0.5 : 1);
      const coinReward = 50 * (isVolume ? 0.5 : 1);
      addAtmosphere(Math.floor(atmoReward));
      addCoins(Math.floor(coinReward));

      addHistory('achievement',
        `完成《${book.title}》誊抄！`,
        `第${bookState.copyCount}次誊抄 · 熟练度 Lv${bookState.masteryLevel || Math.min(5, bookState.copyCount)}`);
      addDiaryEntry('book_complete', { title: book.title, copyCount: bookState.copyCount, mastery: bookState.masteryLevel || Math.min(5, bookState.copyCount) });

      // 每次完成（含重抄）都弹出卡面
      bookCompleted = true;
      bookTitle = book.title;
      bookEmoji = book.emoji;
      completedBook = book;
      copyCount = bookState.copyCount;
      checkTaskCompletion('book_completed', { bookId: sess.bookId });

      if (isFirstCompletion) {
        // 手稿箱 → 书架：誊抄完成首次上架
        if (isBookCapacityFull()) {
          addHistory('action', '📦 书架已满，等待扩容', `《${book.title}》誊抄完成，暂存手稿箱——请前往商店扩充书架`);
        } else {
          removeFromManuscriptBox(sess.bookId);
          placeOnShelf(sess.bookId);
          addHistory('action', '📚 上架', `《${book.title}》已从手稿箱移入书架`);
        }
      }
    }
  }

  const auraCoinsMult = getAuraCoinsMultiplier();
  const curationCoins = getCurationCoinsBonus();
  const achieveBonuses = getAchievementBonuses();
  const coinsEarned = Math.round(minutes * 0.8 * (1 + auraCoinsMult + curationCoins) * (1 + achieveBonuses.coinsBoost));
  addCoins(coinsEarned);

  // 修复进度追踪：损坏的书正在被修复
  let repairCompleted = false;
  let repairBookTitle = '';
  if (bookIsDamaged && sess.bookId) {
    const bookState = state.books[sess.bookId];
    bookState.repairProgress = (bookState.repairProgress || 0) + wordsGained;
    if (bookState.repairProgress >= bookState.repairWords && bookState.repairWords > 0) {
      repairCompleted = true;
      repairBookTitle = BOOKS[sess.bookId]?.title || '';
      bookState.damaged = false;
      bookState.repairProgress = 0;
      bookState.repairWords = 0;
      // 修复完成：若进度已回到整周期，恢复 completed 状态，避免书架进度条显示不满
      const book = BOOKS[sess.bookId];
      if (book && book.totalWords > 0 && bookState.copiedWords > 0 && (bookState.copiedWords % book.totalWords) === 0) {
        bookState.status = 'completed';
      }
      addCoins(30);
      addInspiration(1);
      addAtmosphere(1);
      addHistory('repair', `🩹 《${repairBookTitle}》修复完成！`, `+30智慧之光 · +1✨灵感 · +1氛围`);
      addDiaryEntry('special_event', { detail: `🩹 墨墨检查了《${repairBookTitle}》——损毁的页面已经补好了，墨迹新鲜，羊皮纸平整。你比上一任守护者用心。` });
    }
  }

  // 灵感：不再随每次专注 +1，仅通过烛台/沙漏/成就获得
  if (sess.candleInspiration) {
    addInspiration(1);
    addHistory('action', '🕯️ 烛台微微闪动', '+1 灵感（烛台加成）');
  }
  // 时光沙漏标志牌：专注≥60分钟后概率额外灵感
  if (hasSignboard('hourglass') && minutes >= 60) {
    const roll = Math.random();
    if (roll < 0.05) {
      addInspiration(2);
      addHistory('action', '⏳ 时光沙漏闪耀！', '额外 +2 灵感（5%）');
    } else if (roll < 0.30) {
      addInspiration(1);
      addHistory('action', '⏳ 时光沙漏微微发光', '额外 +1 灵感（25%）');
    }
  }
  // 连续专注灵感：坚持三天以上，专注中偶有灵光闪现
  if (!repairCompleted && (state.focus.streak || 0) >= 3) {
    const inspChance = (state.focus.streak || 0) >= 7 ? 0.25 : 0.15;
    if (Math.random() < inspChance) {
      addInspiration(1);
      addHistory('action', '✨ 灵感闪现', '+1 灵感（连续专注的馈赠）');
    }
  }
  addHistory('focus', `专注 ${minutes} 分钟`, `誊抄 ${wordsGained.toLocaleString()} 字 · +${coinsEarned}智慧之光`);

  // 立即标记 inactive 防止排队 tick 重入
  sess.active = false;

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

  // P1-03 四层反馈：章节进度 + 句子回显 + 引文预告 + 墨墨书评
  const currentBook = sess.bookId ? BOOKS[sess.bookId] : null;
  const currentBookState = sess.bookId ? state.books[sess.bookId] : null;
  const chapterInfo = getChapterInfo(currentBook, currentBookState);
  const nextPreview = getNextChapterPreview(currentBook, currentBookState);

  // 结算卡弹窗链 + 访客 + 引导任务，包在 try-catch 防止弹窗异常导致静默失败
  try {
    handlePostFocusEffects({
      minutes, wordsGained, coinsEarned,
      unlockedChapter,
      bookCompleted, bookTitle, bookEmoji, copyCount, completedBook, bookMastery,
      isFirstBookComplete,
      newMilestones,
      chapterInfo, nextPreview,
      repairCompleted, repairBookTitle
    });

    // 专注完成后访客到来
    if (!bookCompleted) {
      const firstVisitorDue = !state.tutorialFlags.firstVisitorEventDone
        && state.focus.totalMinutes >= 20;
      if (firstVisitorDue) {
        const visitor = spawnVisitor();
        if (visitor) {
          playSfx('visitor_arrive');
          showFirstVisitorEvent(visitor);
        }
      } else if (state.tutorialFlags.firstVisitorEventDone) {
        // 访客到来：基础20% + 氛围(最高15%) + 夏蝉光环(15%) + 借阅区等级(Lv1+5%~Lv7+30%)
        const welcomeBonus = hasSignboard('welcome') ? 0.03 : 0;
        const perRollChance = 0.20 + (state.library.atmosphere / 1000) * 0.15 + getAuraSpawnBonus() + getBorrowSpawnBonus() + welcomeBonus;
        // 长专注多轮抽卡：每12分钟多一次机会
        const rolls = Math.max(1, Math.ceil(minutes / 12));
        for (let r = 0; r < rolls; r++) {
          if (Math.random() < perRollChance) {
            const visitor = spawnVisitor();
            if (visitor) {
              playSfx('visitor_arrive');
              const vAchResults = checkAchievements('visitor_arrive');
              showAchievementBatch(vAchResults);
              showVisitorArrivalCard(visitor);
              triggerQuestCheck('visitor_arrive');
              break; // 本轮已触达，不再连抽
            }
          }
        }
      }
    }

    // 引导任务检测
    triggerQuestCheck('focus_complete');
    if (bookCompleted) {
      triggerQuestCheck('book_complete');
    }
  } catch (e) {
    // 弹窗链失败时至少重建页面，避免界面卡死
    renderFocusPage();
    updateStatusBar();
  }

  sess.elapsedSeconds = 0;
  sess.paused = false;
  sess.teaBoost = false;
  sess.candleInspiration = false;
  saveState();
}

// ========== 专注完成后弹窗链 ==========

function handlePostFocusEffects(effects) {
  const {
    minutes, wordsGained, coinsEarned,
    unlockedChapter,
    bookCompleted, bookTitle, bookEmoji, copyCount, completedBook, bookMastery,
    isFirstBookComplete,
    newMilestones,
    chapterInfo, nextPreview,
    repairCompleted, repairBookTitle
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
      nextMilestone: nextMs,
      chapterInfo,
      nextPreview
    }, () => {
      renderFocusPage();
      updateStatusBar();
      // 结算后检查教程触发
      checkAndShowPostFocusTutorials();
      // 休息行动卡：≥15分钟专注 + 每日限3次
      setTimeout(() => tryShowActionCards(minutes), 600);
    });
  };

  // 里程碑弹窗（倒序插入，让它们在结算卡片之前弹出）
  if (newMilestones && newMilestones.length > 0) {
    const milestoneNext = next;
    next = () => showMilestoneReward(newMilestones, milestoneNext);
  }

  // 章节解锁动画：修复书籍时不弹出
  if (unlockedChapter && !repairCompleted) {
    const prevNext = next;
    const ch = unlockedChapter;
    const book = BOOKS[state.currentSession.bookId];
    next = () => {
      showUnlockAnimation(getBookTitle(book), getChapterTitle(ch), prevNext);
    };
  }

  // 书籍完成动画/证书 → 上架动画：修复书籍时不弹出
  if (bookCompleted && !repairCompleted) {
    const prevNext = next;
    if (isFirstBookComplete && completedBook) {
      next = () => {
        showCertificate(completedBook, () => {
          showBookShelvingAnimation(completedBook, prevNext);
        });
      };
    } else if (copyCount === 1) {
      next = () => {
        showBookCompleteAnimation(getBookTitle(completedBook), bookEmoji, copyCount, () => {
          showBookShelvingAnimation(completedBook, prevNext);
        }, completedBook, bookMastery);
      };
    } else {
      next = () => {
        showBookCompleteAnimation(bookTitle, bookEmoji, copyCount, prevNext, completedBook, bookMastery);
      };
    }
    // 完成时吸引访客
    const bv = spawnVisitor();
    if (bv) triggerQuestCheck('visitor_arrive');
  }

  // 修复完成弹窗（最外层，先弹），必须手动点击按钮关闭
  if (repairCompleted) {
    const repairNext = next;
    next = () => showRepairCompleteCard(repairBookTitle, repairNext);
  }

  next();
}

// ========== 休息行动卡触发 ==========

function tryShowActionCards(minutes) {
  if (minutes < 15) return;
  if (!canDrawActionCards()) return;
  const cards = drawActionCards();
  if (cards.length === 0) return;

  showActionCards(cards, (picked) => {
    if (picked) {
      applyAction(picked.id);
    }
    renderFocusPage();
    updateStatusBar();
  });
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
  const stageDescs = {
    2: '天花板的破洞不再漏风了——至少最大的那几个已经被魔法封住。歪倒的书架自己站直了几排，虽然还是空的，但木头里重新有了温度。墨墨说这是百年来第一次有人在乎这个地方。',
    3: '墙壁上的裂纹在变浅，像愈合的伤口。长窗的彩色玻璃不知何时恢复了半透明的光泽，阳光穿过时在地板上投下淡淡的色斑。空气里羊皮纸和旧木头的气味越来越浓。',
    4: '壁炉里的火自己燃起来了——不是普通的火焰，带着星星点点的金色碎屑。扶手椅上的绒布恢复了柔软的触感，坐下去会发出一声舒服的叹息。墨墨开始在横梁上挂小灯。',
    5: '穹顶裂开了——不是坏事，裂缝里透进来的是星光。不是窗外的星光，是图书馆自己生成的。书架之间飘着极淡的金色雾气，书脊上的烫金会在黑暗中微微发光。墨墨蹲在你的肩头，很久没有说话。'
  };
  const detail = stageDescs[stage] || `图书馆的氛围进入了「${stageName}」阶段。`;
  addDiaryEntry('special_event', { detail });

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

function showRepairCompleteCard(bookTitle, callback) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4';
  const card = document.createElement('div');
  card.className = 'parchment-bg rounded-2xl p-6 max-w-sm w-full text-center magic-glow animate-scale-in';

  card.innerHTML = `
    <div class="text-5xl mb-3">🩹</div>
    <div class="text-xs text-magic-gold font-bold mb-2">${t('repairCompleteTitle')}</div>
    <h3 class="font-display text-xl font-bold mb-2">《${bookTitle}》</h3>
    <div class="grid grid-cols-3 gap-2 mb-3">
      <div class="bg-white/60 rounded-lg p-3">
        <div class="text-lg font-bold text-magic-gold">+30</div>
        <div class="text-xs text-ink-light">${t('repairCompleteRewardCoinsLabel')}</div>
      </div>
      <div class="bg-white/60 rounded-lg p-3">
        <div class="text-lg font-bold text-purple-500">+1✨</div>
        <div class="text-xs text-ink-light">${t('repairCompleteRewardInspirationLabel')}</div>
      </div>
      <div class="bg-white/60 rounded-lg p-3">
        <div class="text-lg font-bold text-green-600">+1</div>
        <div class="text-xs text-ink-light">${t('repairCompleteRewardAtmosphereLabel')}</div>
      </div>
    </div>
    <p class="text-sm text-ink-light mb-3 leading-relaxed">${t('repairCompleteFlavour')}</p>
    <div class="bg-magic-gold/10 border border-magic-gold/20 rounded-lg p-3 mb-4 text-left">
      <p class="text-xs text-ink-light leading-relaxed">${t('repairCompleteMomoTip')}</p>
    </div>
    <button class="px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">${t('continueText')}</button>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const btn = card.querySelector('button');
  btn.addEventListener('click', () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => {
      overlay.remove();
      if (callback) callback();
    }, 300);
  });
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
    state.library.shelves.push([null, null, null, null, null]);
    addAtmosphere(5);
    addHistory('purchase', '购买新书架', `花费${price}智慧之光 · +5氛围`);
    playSfx('buy_success');
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
    playSfx('book_return');
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

// ========== 成就通知 ==========

function showAchievementBatch(results) {
  // 去重
  const seen = new Set();
  const unique = results.filter(a => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
  if (unique.length > 0) {
    playSfx('achievement_unlock');
  }
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
  const def = getVisitorDef(visitor.charId);
  const auraHtml = def?.aura
    ? `<div class="mt-2 pt-2 border-t border-magic-gold/20"><p class="text-xs text-magic-gold font-bold">✨ ${def.aura.name}</p><p class="text-xs text-ink-light">${def.aura.desc}</p></div>`
    : '';

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
          ${auraHtml}
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

// ========== 氛围阶段突破 · 访客见证 ==========

function showWitnessToast(witnesses, stage) {
  const stageNames = ['', '废墟', '破败', '陈旧', '温暖', '星辰'];
  const stageName = stageNames[stage] || `阶段${stage}`;

  const itemsHtml = witnesses.map(w => `
    <div class="flex items-start gap-2 mb-2 last:mb-0">
      <div class="text-2xl flex-shrink-0">${w.visitor.emoji}</div>
      <div>
        <p class="text-xs text-magic-gold font-bold">${w.visitor.name}</p>
        <p class="text-xs text-ink-light leading-relaxed">「${w.text}」</p>
      </div>
    </div>
  `).join('');

  const overlay = document.createElement('div');
  overlay.className = 'fixed bottom-6 right-6 z-[130] animate-slide-in-right';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-xl p-5 shadow-2xl border-2 border-magic-gold/30 max-w-xs">
      <div class="flex items-center gap-2 mb-3 pb-2 border-b border-magic-gold/20">
        <span class="text-lg">✨</span>
        <span class="text-xs text-magic-gold font-bold">氛围突破 · ${stageName}</span>
      </div>
      ${itemsHtml}
      <p class="text-xs text-ink-light/40 mt-3 text-center">点击关闭 · 8秒后自动消失</p>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => overlay.remove(), 300);
  };
  overlay.addEventListener('click', close);
  setTimeout(close, 8000);
}

// ========== 注入到 render ==========

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

  // 首次用户交互激活音频（兜底：任何按钮点击都激活）
  const activateAudio = () => {
    onFirstInteraction();
    document.removeEventListener('click', activateAudio);
  };
  document.addEventListener('click', activateAudio);

  initState();
  ensureAllBooksInManuscriptBox();

  // 旧存档迁移：从 copiedWords 修正 copyCount 和 masteryLevel
  // 以及扩充字数后，旧"completed"需要回退为 copying
  updateLoading(40, '正在校对古籍...');
  let migratedBooks = 0;
  Object.keys(state.books).forEach(bookId => {
    const book = BOOKS[bookId];
    const bs = state.books[bookId];
    if (!book || !bs || !book.totalWords || bs.copiedWords <= 0) return;
    const actualCopies = Math.floor(bs.copiedWords / book.totalWords);
    if (actualCopies > (bs.copyCount || 0)) {
      bs.copyCount = actualCopies;
      if (!book.noMastery) {
        bs.masteryLevel = Math.min(5, actualCopies);
      }
      if (bs.masteryLevel >= 5) {
        bs.status = 'completed';
      }
      migratedBooks++;
    }
    // 扩充字数迁移：旧存档标记为 completed 但字数不足新版总字数 → 回退
    if (bs.status === 'completed' && bs.copiedWords < book.totalWords) {
      bs.status = bs.copiedWords > 0 ? 'copying' : 'unlocked';
      migratedBooks++;
    }
    // 修正：copying 但一字未抄 → unlocked
    if (bs.status === 'copying' && bs.copiedWords <= 0) {
      bs.status = 'unlocked';
      migratedBooks++;
    }
    // 修正：copying 但字数已达总字数 → completed
    if (bs.status === 'copying' && bs.copiedWords >= book.totalWords) {
      bs.status = 'completed';
      bs.copyCount = Math.max(bs.copyCount || 1, Math.floor(bs.copiedWords / book.totalWords));
      if (!book.noMastery) {
        bs.masteryLevel = Math.min(5, bs.copyCount);
      }
      migratedBooks++;
    }
    // 确保章节解锁与 copiedWords 同步
    if (book.chapters && bs.unlockedChapters) {
      book.chapters.forEach((ch, idx) => {
        if (bs.copiedWords >= ch.unlockAt && !bs.unlockedChapters.includes(idx + 1)) {
          bs.unlockedChapters.push(idx + 1);
        }
      });
    }

    // 修正旧版 masteryLevel：旧公式为 copyCount + 1，新公式直接等于 copyCount
    if (!book.noMastery && bs.copyCount > 0 && bs.masteryLevel > bs.copyCount) {
      bs.masteryLevel = Math.min(5, bs.copyCount);
      migratedBooks++;
    }
  });
  if (migratedBooks > 0) {
    saveState();
  }

  // 注入回调
  setCompleteCallback(handleCompleteFocus);

  // 默认选择第一本已开启过抄写、且可以立即誊抄的书
  if (!state.currentSession.bookId) {
    const firstBook = Object.keys(state.books).find(id => {
      const bs = state.books[id];
      if (!bs || bs.status === 'locked') return false;
      // 已完成的书必须已经解锁重抄，才默认选中
      if (bs.status === 'completed' && !bs.reCopyUnlocked) return false;
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

init();
