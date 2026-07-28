// 位面任务引擎 —— 独立访客队列 + 任务生命周期 + Stage 推进
// 与 visitors.js 平行运行，互不干扰

import { state, saveState } from './state.js';
import { PLANES } from '../data/planes.js';
import { PASTORAL_TASKS } from '../data/quests/pastoral_tasks.js';
import { BOOKS } from '../data/books.js';
import { addCoins, addAtmosphere, addHistory } from './storage.js';
import { t } from './i18n/terms.js';

const ALL_TASKS = { pastoral: PASTORAL_TASKS };

function getNow() {
  return window.__dev && window.__dev.getNow ? window.__dev.getNow() : Date.now();
}

// ========== 位面解锁 ==========

export function unlockPlane(planeId) {
  const pq = state.quests[planeId];
  if (!pq || pq.unlocked) return false;
  pq.unlocked = true;
  pq.portalPurchasedAt = getNow();
  pq.stage = 1;
  saveState();
  return true;
}

// ========== 独立访客队列 ——— 每 60s tick，和 visitors.js 共用定时器 ==========

export function tickPlaneVisitors(now) {
  Object.keys(state.quests).forEach(planeId => {
    const pq = state.quests[planeId];
    if (!pq || !pq.unlocked) return;
    const plane = PLANES[planeId];
    if (!plane) return;

    plane.characters.forEach(char => {
      const cd = pq.characters[char.id];
      if (!cd) return;
      // 仅已解锁角色参与
      if (planeId === 'pastoral' && char.unlockStage > pq.stage) return;

      // 检查是否有新任务可分配
      if (cd.activeTasks.length === 0 && cd.pendingComplete.length === 0) {
        const nextTask = findNextAvailableTask(planeId, char.id, cd);
        if (nextTask) {
          // 首次见面
          if (!cd.met) {
            cd.met = true;
            addHistory('plane', t('planeFirstVisit').replace('{name}', char.name), t('planeFirstVisitorDetail').replace('{plane}', t('planeName_pastoral')));
          }
          // 兜底：如果任务条件已满足（旧档中已解锁/完成），直接标记为可提交
          if (isTaskConditionMet(nextTask)) {
            cd.pendingComplete.push(nextTask.id);
            addHistory('plane', t('taskCompletedHistory').replace('{summary}', nextTask.summary), t('taskConditionMetDetail'));
          } else {
            cd.activeTasks.push(nextTask.id);
          }
        }
      }

      // 有可提交任务时不再给新任务（等玩家回信）
      if (cd.pendingComplete.length > 0) return;
    });
  });
  saveState();
}

export function findNextAvailableTask(planeId, charId, charData) {
  const tasks = ALL_TASKS[planeId] || [];
  const candidates = tasks.filter(t =>
    t.characterId === charId &&
    t.stage === charData.stage &&
    !charData.completedTasks.includes(t.id) &&
    !charData.activeTasks.includes(t.id) &&
    t.prereqTasks.every(pid => charData.completedTasks.includes(pid))
  );
  candidates.sort((a, b) => a.order - b.order);
  return candidates[0] || null;
}

// 检查任务条件是否已满足（旧档兜底：玩家接任务前已解锁/读完/完成对应内容）
export function isTaskConditionMet(taskDef) {
  const cond = taskDef.condition;
  if (!cond) return false;
  const bs = state.books[cond.bookId];
  if (!bs) return false;

  switch (taskDef.type) {
    case 'copy_chapter':
      return bs.unlockedChapters && bs.unlockedChapters.includes(cond.chapterIdx + 1);
    case 'copy_book':
      return bs.status === 'completed';
    case 'read_chapter':
      return bs.readChapters && bs.readChapters.includes(cond.chapterIdx);
    case 'collect_seed':
      return (state.seeds && state.seeds[cond.seedType] || 0) >= (cond.count || 1);
    default:
      return false;
  }
}

// ========== 任务完成检测 ——— app.js 专注完成 / 阅读章节后调用 ==========

export function checkTaskCompletion(trigger, payload) {
  let changed = false;

  Object.keys(state.quests).forEach(planeId => {
    const pq = state.quests[planeId];
    if (!pq || !pq.unlocked) return;

    Object.keys(pq.characters).forEach(charId => {
      const cd = pq.characters[charId];
      if (!cd) return;

      cd.activeTasks.forEach(taskId => {
        const taskDef = findTaskById(planeId, taskId);
        if (!taskDef) return;

        let matched = false;
        const cond = taskDef.condition;

        switch (taskDef.type) {
          case 'copy_chapter':
            if (trigger === 'chapter_unlocked' &&
                payload.bookId === cond.bookId &&
                payload.chapterIdx === cond.chapterIdx)
              matched = true;
            break;
          case 'copy_book':
            if (trigger === 'book_completed' &&
                payload.bookId === cond.bookId)
              matched = true;
            break;
          case 'read_chapter':
            if (trigger === 'chapter_read' &&
                payload.bookId === cond.bookId &&
                payload.chapterIdx === cond.chapterIdx)
              matched = true;
            break;
          case 'collect_seed':
            if (trigger === 'seed_collected' &&
                payload.seedType === cond.seedType &&
                payload.count >= cond.count)
              matched = true;
            break;
        }

        if (matched) {
          cd.activeTasks = cd.activeTasks.filter(id => id !== taskId);
          cd.pendingComplete.push(taskId);
          addHistory('plane', t('taskCompletedHistory').replace('{summary}', taskDef.summary), t('taskReadyToSubmit'));
          changed = true;
        }
      });
    });
  });

  if (changed) saveState();
  return changed;
}

export function findTaskById(planeId, taskId) {
  const tasks = ALL_TASKS[planeId] || [];
  return tasks.find(t => t.id === taskId) || null;
}

// ========== 回信提交 ——— 玩家在位面页面点击"回信提交" ==========

export function submitTask(planeId, charId, taskId) {
  const pq = state.quests[planeId];
  if (!pq) return null;
  const cd = pq.characters[charId];
  if (!cd) return null;
  if (!cd.pendingComplete.includes(taskId)) return null;

  const taskDef = findTaskById(planeId, taskId);
  if (!taskDef) return null;

  // 发放奖励
  if (taskDef.reward.coins) addCoins(taskDef.reward.coins);
  if (taskDef.reward.atmo) addAtmosphere(taskDef.reward.atmo);
  if (taskDef.reward.memento && !pq.mementos.includes(taskDef.reward.memento)) {
    pq.mementos.push(taskDef.reward.memento);
  }
  if (taskDef.reward.letter && !pq.letters.includes(taskDef.reward.letter)) {
    pq.letters.push(taskDef.reward.letter);
  }

  // 状态迁移
  cd.pendingComplete = cd.pendingComplete.filter(id => id !== taskId);
  cd.completedTasks.push(taskId);

  // 检查角色阶段完成
  checkCharacterStageComplete(planeId, charId, cd);

  // 立即分配下一个可用任务（不等待下个 tick）
  if (cd.activeTasks.length === 0 && cd.pendingComplete.length === 0) {
    const nextTask = findNextAvailableTask(planeId, charId, cd);
    if (nextTask) {
      if (isTaskConditionMet(nextTask)) {
        cd.pendingComplete.push(nextTask.id);
        addHistory('plane', t('taskCompletedHistory').replace('{summary}', nextTask.summary), t('taskConditionMetDetail'));
      } else {
        cd.activeTasks.push(nextTask.id);
      }
    }
  }

  saveState();
  return {
    taskDef,
    reward: taskDef.reward,
    characterStage: cd.stage
  };
}

function checkCharacterStageComplete(planeId, charId, charData) {
  const tasks = ALL_TASKS[planeId] || [];
  const stageTasks = tasks.filter(t =>
    t.characterId === charId && t.stage === charData.stage
  );
  const allDone = stageTasks.every(t => charData.completedTasks.includes(t.id));

  if (allDone && stageTasks.length > 0) {
    charData.stage += 1;
    // 清除当前阶段残留
    charData.activeTasks = [];
    charData.pendingComplete = [];
    // 检查位面 stage 推进
    checkPlaneStageAdvance(planeId);
  }
}

// ========== Stage 推进 + 防重入 ==========

function checkPlaneStageAdvance(planeId) {
  const pq = state.quests[planeId];
  if (!pq) return;
  const plane = PLANES[planeId];
  if (!plane) return;

  const currentPlaneStage = pq.stage;
  if (pq.stagesCompleted.includes(currentPlaneStage)) return; // 防重入

  // 检查：该位面所有已解锁角色是否都完成了当前 stage？
  const activeChars = plane.characters.filter(c => c.unlockStage <= currentPlaneStage);
  const allAdvanced = activeChars.every(c => {
    const cd = pq.characters[c.id];
    return cd && cd.stage > currentPlaneStage;
  });

  if (allAdvanced && activeChars.length > 0) {
    pq.stagesCompleted.push(currentPlaneStage);
    pq.stage += 1;

    // 生成故事日志
    const stageLabels = ['', t('planeStageName1'), t('planeStageName2'), t('planeStageName3'), t('planeStageName4'), t('planeStageName5')];
    const label = stageLabels[currentPlaneStage] || `Stage ${currentPlaneStage}`;
    const pastoralPlaneName = t('planeName_pastoral');
    pq.storyLog.push({
      id: `${planeId}_stage_${currentPlaneStage}`,
      stage: currentPlaneStage,
      ts: getNow(),
      title: label,
      narrative: t('planeStageNarrative').replace('{plane}', pastoralPlaneName)
    });

    addHistory('plane', t('planeAdvancedHistory').replace('{label}', label), t('planeStageDetail').replace('{plane}', pastoralPlaneName).replace('{stage}', pq.stage));

    // 位面完成？
    if (pq.stage > 5) {
      registerFamiliarVisitors(planeId, plane);
    }
  }
}

// ========== 注册熟客 ——— 位面完成后，角色进入 visitors.js 加权池 ==========

function registerFamiliarVisitors(planeId, plane) {
  plane.characters.forEach(char => {
    if (!state.familiarVisitors[char.id]) {
      state.familiarVisitors[char.id] = {
        unlockSource: planeId,
        weight: 0.15,
        bookPreference: 'pastoral',
        totalVisits: 0
      };
    }
  });
}

// ========== 查询 ——— 供渲染层使用 ==========

export function getPlaneQuestState(planeId) {
  return state.quests[planeId] || null;
}

export function getCharacterTasks(planeId, charId) {
  const pq = state.quests[planeId];
  if (!pq) return { active: [], pending: [], completed: [] };
  const cd = pq.characters[charId];
  if (!cd) return { active: [], pending: [], completed: [] };
  const tasks = ALL_TASKS[planeId] || [];

  const findDef = (id) => tasks.find(t => t.id === id) || null;

  return {
    active: cd.activeTasks.map(findDef).filter(Boolean),
    pending: cd.pendingComplete.map(findDef).filter(Boolean),
    completed: cd.completedTasks.map(findDef).filter(Boolean)
  };
}

export function getPlaneCharacters(planeId) {
  const plane = PLANES[planeId];
  if (!plane) return [];
  const pq = state.quests[planeId];
  return plane.characters.map(c => ({
    ...c,
    questState: pq ? pq.characters[c.id] : null,
    unlocked: pq ? (c.unlockStage <= pq.stage) : false
  }));
}

export function getTaskById(planeId, taskId) {
  return findTaskById(planeId, taskId);
}

export function getAllTasks(planeId) {
  return ALL_TASKS[planeId] || [];
}

// 查询当前某本书是否有位面 copy_chapter 活跃任务（供缮写室指示器使用）
export function getActiveChapterTaskForBook(bookId) {
  if (!bookId) return null;
  for (const planeId of Object.keys(state.quests)) {
    const pq = state.quests[planeId];
    if (!pq || !pq.unlocked) continue;
    const tasks = ALL_TASKS[planeId] || [];
    for (const charId of Object.keys(pq.characters)) {
      const cd = pq.characters[charId];
      if (!cd) continue;
      for (const taskId of cd.activeTasks) {
        const taskDef = tasks.find(t => t.id === taskId);
        if (taskDef && taskDef.type === 'copy_chapter' && taskDef.condition.bookId === bookId) {
          const plane = PLANES[planeId];
          const charDef = plane ? plane.characters.find(c => c.id === charId) : null;
          return {
            taskId: taskDef.id,
            characterName: charDef ? charDef.name : charId,
            characterEmoji: charDef ? charDef.emoji : '',
            bookTitle: bookId,
            chapterIdx: taskDef.condition.chapterIdx,
            summary: taskDef.summary
          };
        }
      }
    }
  }
  return null;
}
