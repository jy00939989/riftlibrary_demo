// 新手引导任务链 —— 10 步线性任务，逐级解锁核心玩法
import { state, saveState } from './state.js';
import { addCoins, addAtmosphere, getAtmosphereLevel } from './storage.js';

import { t } from './i18n/terms.js';

const QUESTS = [
  {
    id: 'q01',
    title: t('gqTitle_q01'),
    phase: 1,
    desc: t('gqDesc_q01'),
    trigger: 'intro_complete',
    rewardCoins: 10,
    rewardAtmo: 0
  },
  {
    id: 'q02',
    title: t('gqTitle_q02'),
    phase: 1,
    desc: t('gqDesc_q02'),
    trigger: 'focus_start',
    rewardCoins: 20,
    rewardAtmo: 0
  },
  {
    id: 'q03',
    title: t('gqTitle_q03'),
    phase: 1,
    desc: t('gqDesc_q03'),
    trigger: 'focus_complete',
    rewardCoins: 30,
    rewardAtmo: 5
  },
  {
    id: 'q04',
    title: t('gqTitle_q04'),
    phase: 1,
    desc: t('gqDesc_q04'),
    trigger: 'tab_bookshelf',
    rewardCoins: 10,
    rewardAtmo: 0
  },
  {
    id: 'q05',
    title: t('gqTitle_q05'),
    phase: 2,
    desc: t('gqDesc_q05'),
    trigger: 'tab_shop',
    rewardCoins: 20,
    rewardAtmo: 0
  },
  {
    id: 'q06',
    title: t('gqTitle_q06'),
    phase: 2,
    desc: t('gqDesc_q06'),
    trigger: 'borrow_upgrade',
    rewardCoins: 40,
    rewardAtmo: 0
  },
  {
    id: 'q07',
    title: t('gqTitle_q07'),
    phase: 2,
    desc: t('gqDesc_q07'),
    trigger: 'book_complete',
    rewardCoins: 40,
    rewardAtmo: 10
  },
  {
    id: 'q08',
    title: t('gqTitle_q08'),
    phase: 2,
    desc: t('gqDesc_q08'),
    trigger: 'visitor_arrive',
    rewardCoins: 30,
    rewardAtmo: 5
  },
  {
    id: 'q09',
    title: t('gqTitle_q09'),
    phase: 3,
    desc: t('gqDesc_q09'),
    trigger: 'focus_60min',
    rewardCoins: 0,
    rewardAtmo: 10
  },
  {
    id: 'q10',
    title: t('gqTitle_q10'),
    phase: 3,
    desc: t('gqDesc_q10'),
    trigger: 'all_done',
    rewardCoins: 50,
    rewardAtmo: 15
  }
];

function getTotalCoinsReward() {
  return QUESTS.reduce((sum, q) => sum + q.rewardCoins, 0);
}
function getTotalAtmoReward() {
  return QUESTS.reduce((sum, q) => sum + q.rewardAtmo, 0);
}

// 初始化/补全引导任务状态
export function ensureGuideQuests() {
  if (!state.guideQuests) {
    state.guideQuests = { completed: [], allCompleted: false };
    saveState();
  }
  // 扫描并补全已满足条件的旧任务（老玩家登录）
  if (!state.guideQuests.allCompleted) {
    retroCheck();
    // retroCheck 可能补全了 q09，但 q10 不走事件触发——直接内联补刀
    // （不能用 tryCompleteAllDone，它会调 getCurrentQuest → ensureGuideQuests 死循环）
    if (!state.guideQuests.allCompleted
        && state.guideQuests.completed.length >= QUESTS.length - 1) {
      const lastQuest = QUESTS[QUESTS.length - 1];
      if (lastQuest && lastQuest.id === 'q10'
          && !state.guideQuests.completed.includes('q10')) {
        state.guideQuests.completed.push('q10');
        if (lastQuest.rewardCoins > 0) addCoins(lastQuest.rewardCoins);
        if (lastQuest.rewardAtmo > 0) addAtmosphere(lastQuest.rewardAtmo);
        state.guideQuests.allCompleted = true;
        saveState();
      }
    }
  }
}

// 根据当前状态回溯已完成的任务
function retroCheck() {
  let changed = false;
  const hasIntro = state.introCompleted;
  const hasFocusStart = state.focus.totalMinutes > 0;
  const hasFocusComplete = state.focus.totalMinutes > 0; // 专注开始即完成过
  // 注意：focus_complete 需要更准确的判断，但我们用 streaks 或 history 来推测
  const hasBookComplete = Object.values(state.books).some(b => b.status === 'completed' || b.copyCount > 0);
  const hasVisitor = state.visitors.length > 0 || state.history.some(h => h.type === 'visitor_arrive' || h.type === 'visitor_borrow');
  const hasBorrowLv1 = state.library.borrowLevel >= 1;
  const hasFocus60min = state.focus.totalMinutes >= 60;

  const checks = {
    'q01': hasIntro,
    'q02': hasFocusStart,
    'q03': hasFocusComplete,
    // q04 (tab_bookshelf) and q05 (tab_shop) can't be reliably retro-checked, skip
    'q06': hasBorrowLv1,
    'q07': hasBookComplete,
    'q08': hasVisitor,
    'q09': hasFocus60min
  };

  Object.entries(checks).forEach(([id, ok]) => {
    if (ok && !state.guideQuests.completed.includes(id)) {
      state.guideQuests.completed.push(id);
      changed = true;
    }
  });

  if (changed) {
    // 检查是否全部完成
    if (state.guideQuests.completed.length >= QUESTS.length) {
      state.guideQuests.allCompleted = true;
    }
    saveState();
  }
}

// 获取当前任务（第一个未完成的）
export function getCurrentQuest() {
  ensureGuideQuests();
  if (state.guideQuests.allCompleted) return null;
  for (const q of QUESTS) {
    if (!state.guideQuests.completed.includes(q.id)) {
      return q;
    }
  }
  // 全部完成
  state.guideQuests.allCompleted = true;
  saveState();
  return null;
}

// 获取进度
export function getQuestProgress() {
  ensureGuideQuests();
  return {
    completed: state.guideQuests.completed.length,
    total: QUESTS.length,
    allCompleted: state.guideQuests.allCompleted
  };
}

// 通过事件触发任务完成检测
// 返回 { completed: quest|null, current: quest|null } 如果刚完成了一个任务
export function checkGuideQuest(event) {
  ensureGuideQuests();
  if (state.guideQuests.allCompleted) return null;

  const current = getCurrentQuest();
  if (!current) return null;

  // 映射事件到 trigger
  let matched = false;

  if (current.trigger === event) {
    matched = true;
  }

  // 特殊处理：q09 的 focus_60min 触发
  if (current.trigger === 'focus_60min' && event === 'focus_complete') {
    if (state.focus.totalMinutes >= 60) {
      matched = true;
    }
  }

  // 特殊处理：q03 需要区分 focus_start 和 focus_complete
  // 如果当前任务是 focus_complete, 但事件是 focus_start, 不匹配
  // 这是正常的，由调用方传入正确的事件名

  if (!matched) return null;

  // 完成任务
  state.guideQuests.completed.push(current.id);

  // 发放奖励
  if (current.rewardCoins > 0) {
    addCoins(current.rewardCoins);
  }
  if (current.rewardAtmo > 0) {
    addAtmosphere(current.rewardAtmo);
  }

  // 检查是否全部完成
  if (state.guideQuests.completed.length >= QUESTS.length) {
    state.guideQuests.allCompleted = true;
  }

  saveState();

  const nextQuest = getCurrentQuest();
  return { completed: current, current: nextQuest, progress: getQuestProgress() };
}

// 全部任务完成（用于 q10 的 all_done 触发）
export function tryCompleteAllDone() {
  // 不调 ensureGuideQuests() —— 所有调用方已确保初始化
  // （ensureGuideQuests 自身 / triggerQuestCheck → checkGuideQuest 内部已调）
  if (!state.guideQuests || state.guideQuests.allCompleted) return null;
  const completed = state.guideQuests.completed.length;
  if (completed >= QUESTS.length - 1) {
    // q10 是最后一个，前面 9 个都完成了
    const current = getCurrentQuest();
    if (current && current.id === 'q10') {
      return checkGuideQuest('all_done');
    }
  }
  return null;
}

// 获取所有任务定义（用于 debug 或 UI）
export function getAllQuests() {
  return QUESTS;
}

export { QUESTS };
