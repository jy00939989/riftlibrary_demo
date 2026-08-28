// 专注完成后副作用编排器
// 职责：接收 completeFocus() 的结果，按顺序触发奖励、任务、成就、弹窗链、访客、引导任务。
// 设计：显式回流（ADR-001），orchestrator 改完 state 后显式调用 renderXxx()。

import { state, saveState } from '../state.js';
import { addCoins, addHistory, addInspiration, addAtmosphere, getAtmosphereLevel } from '../storage.js';
import { markTaskDone } from '../dailytasks.js';
import { checkAchievements, getAchievementBonuses } from '../achievements.js';
import { getAuraCoinsMultiplier, getAuraSpawnBonus, getBorrowSpawnBonus, spawnVisitor } from '../visitors.js';
import { getCurationCoinsBonus } from '../curation.js';
import { addDiaryEntry } from '../diary.js';
import { hasSignboard, getSignboardBuffSum } from '../shop.js';
import { canDrawActionCards, drawActionCards, applyAction } from '../actioncards.js';
import { checkAndShowTutorial } from '../tutorial.js';
import { dispatchTutorialUI } from '../render/tutorial-ui.js';
import { showAchievementBatch } from '../render/achievements.js';
import { BOOKS } from '../../data/books.js';
import { triggerQuestCheck } from './quest-trigger.js';
import {
  renderFocusPage, showCompletionCard, showActionCards,
  showUnlockAnimation, showBookCompleteAnimation, showBookShelvingAnimation,
  updateStatusBar
} from '../render/index.js';
import { showCertificate } from '../render/certificate.js';
import { getBookTitle, getChapterTitle } from '../render/common.js';
import { getChapterInfo, getNextChapterPreview } from './book-utils.js';
import { calculateMilestoneTriggers, getNextMilestone } from './focus-rewards.js';
import { showMilestoneReward } from '../render/shared/milestone-card.js';
import { showRepairCompleteCard } from '../render/shared/repair-card.js';
import { showFirstVisitorEvent, showVisitorArrivalCard } from '../render/shared/visitor-cards.js';
import { playSfx } from '../audio.js';
import { track } from '../backend/analytics.js';

function getNow() {
  return window.__dev && window.__dev.getNow ? window.__dev.getNow() : Date.now();
}

export function runFocusOrchestration(result, isAuto) {
  if (!result || !result.ok) return;

  const {
    minutes, wordsGained, prevTotalWords, bookId,
    bookProgressResult, repairResult
  } = result;

  const sess = state.currentSession;

  // ── 金币加成计算（aura + curation + achievement）
  const auraCoinsMult = getAuraCoinsMultiplier();
  const curationCoins = getCurationCoinsBonus();
  const achieveBonuses = getAchievementBonuses();
  const coinsEarned = Math.round(minutes * 0.8 * (1 + auraCoinsMult + curationCoins) * (1 + achieveBonuses.coinsBoost));
  addCoins(coinsEarned);

  // ── 灵感：烛台加成
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
  // 连续专注灵感：坚持三天以上
  const repairCompleted = repairResult && repairResult.repairCompleted;
  if (!repairCompleted && (state.focus.streak || 0) >= 3) {
    const inspChance = (state.focus.streak || 0) >= 7 ? 0.25 : 0.15;
    if (Math.random() < inspChance) {
      addInspiration(1);
      addHistory('action', '✨ 灵感闪现', '+1 灵感（连续专注的馈赠）');
    }
  }

  addHistory('focus', `专注 ${minutes} 分钟`, `誊抄 ${wordsGained.toLocaleString()} 字 · +${coinsEarned}智慧之光`);
  saveState();

  // ── 今日馆务：专注 ≥25 分钟
  if (minutes >= 25) {
    const taskResult = markTaskDone('focus', state);
    if (taskResult) {
      addHistory('task', `📜 今日馆务：${taskResult.name}`, taskResult.reward);
    }
  }

  // ── 成就检测
  const achResults = [];
  achResults.push(...checkAchievements('focus_complete'));
  achResults.push(...checkAchievements('focus'));
  const bookCompleted = !!(bookProgressResult && bookProgressResult.completion);
  if (bookCompleted) achResults.push(...checkAchievements('book_complete'));
  achResults.push(...checkAchievements('book'));
  achResults.push(...checkAchievements('library'));
  showAchievementBatch(achResults);

  // ── 里程碑
  if (!state.focus.claimedMilestones) state.focus.claimedMilestones = [];
  const newMilestones = calculateMilestoneTriggers(prevTotalWords, state.focus.totalWords, state.focus.claimedMilestones);
  newMilestones.forEach(m => state.focus.claimedMilestones.push(m.idx));
  if (newMilestones.length > 0) saveState();

  // ── 弹窗链数据准备
  let unlockedChapter = null;
  if (bookProgressResult && bookProgressResult.newlyUnlockedChapters && bookProgressResult.newlyUnlockedChapters.length > 0) {
    unlockedChapter = bookProgressResult.newlyUnlockedChapters[0].chapter;
  }

  let completedBook = null;
  let copyCount = 0;
  let bookMastery = 0;
  if (bookProgressResult && bookProgressResult.completion) {
    const completion = bookProgressResult.completion;
    completedBook = completion.completedBook;
    copyCount = completion.copyCount;
    bookMastery = completion.masteryLevel;
  }

  const isFirstBookComplete = bookCompleted && !state.tutorialFlags.firstBookComplete;
  const currentBook = bookId ? state.books[bookId] : null;
  const chapterInfo = currentBook ? getChapterInfo(BOOKS[bookId], currentBook) : null;
  const nextPreview = currentBook ? getNextChapterPreview(BOOKS[bookId], currentBook) : null;

  // ── 结算卡弹窗链 + 访客 + 引导任务
  try {
    handlePostFocusEffects({
      minutes, wordsGained, coinsEarned,
      unlockedChapter,
      bookCompleted, completedBook, copyCount, bookMastery,
      isFirstBookComplete,
      newMilestones,
      chapterInfo, nextPreview,
      repairCompleted,
      repairBookTitle: repairResult ? repairResult.repairBookTitle : ''
    });

    // ── 专注完成后访客到来
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
        const welcomeBonus = getSignboardBuffSum('spawn_chance');
        const perRollChance = 0.20 + (state.library.atmosphere / 1000) * 0.15 + getAuraSpawnBonus() + getBorrowSpawnBonus() + welcomeBonus;
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
              break;
            }
          }
        }
      }
    }

    // ── 引导任务检测
    triggerQuestCheck('focus_complete');
    if (bookCompleted) {
      triggerQuestCheck('book_complete');
    }

    // ── 后端埋点
    track('focus_complete', {
      minutes,
      words_gained: wordsGained,
      coins_earned: coinsEarned,
      book_id: bookId || null
    });
    if (bookCompleted && completedBook) {
      track('book_complete', {
        book_id: completedBook.id || bookId,
        title: getBookTitle(completedBook),
        copy_count: copyCount
      });
    }
  } catch (e) {
    renderFocusPage();
    updateStatusBar();
  }

  // ── 清理 session buff
  sess.elapsedSeconds = 0;
  sess.paused = false;
  sess.teaBoost = false;
  sess.candleInspiration = false;
  saveState();
}

function handlePostFocusEffects(effects) {
  const {
    minutes, wordsGained, coinsEarned,
    unlockedChapter,
    bookCompleted, completedBook, copyCount, bookMastery,
    isFirstBookComplete,
    newMilestones,
    chapterInfo, nextPreview,
    repairCompleted, repairBookTitle
  } = effects;

  // 构建回调链（从后往前串联）
  let next = () => {
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
      checkAndShowPostFocusTutorials();
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
        showBookCompleteAnimation(getBookTitle(completedBook), completedBook.emoji, copyCount, () => {
          showBookShelvingAnimation(completedBook, prevNext);
        }, completedBook, bookMastery);
      };
    } else {
      next = () => {
        showBookCompleteAnimation(getBookTitle(completedBook), completedBook.emoji, copyCount, prevNext, completedBook, bookMastery);
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

function checkAndShowPostFocusTutorials() {
  const currStage = getAtmosphereLevel().level;
  const maxSeen = state.tutorialFlags.maxAtmoStageSeen || 1;

  if (currStage > maxSeen) {
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
