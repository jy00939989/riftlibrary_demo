// 今日馆务 —— 每日任务逻辑
import { state, saveState } from './state.js';
import { addCoins, addAtmosphere, addInspiration } from './storage.js';
import { getTodayKey, onNewDay } from './core/day-boundary.js';

function resetDailyTasks(today) {
  state.dailyTasks = { date: today, focusDone: false, returnDone: false, waterDone: false, maintainDone: false, allClaimed: false };
  saveState();
}

// A1 日界统一：新的一天由 day-boundary 事件驱动重置（替代散点 UTC 比较）
onNewDay(({ today }) => resetDailyTasks(today));

// 检查并重置每日任务（惰性兜底保留：渲染/任务入口仍调用，同日零开销）
export function ensureDailyTasks() {
  const today = getTodayKey();
  if (state.dailyTasks.date !== today) resetDailyTasks(today);
}

// 任务完成触发
export function markTaskDone(task, stateCtx) {
  ensureDailyTasks();
  const dt = (stateCtx && stateCtx.dailyTasks) || state.dailyTasks;

  if (task === 'focus' && !dt.focusDone) {
    dt.focusDone = true;
    addCoins(30);
    saveState();
    return { name: '专注25分钟', reward: '💰 +30' };
  }
  if (task === 'return' && !dt.returnDone) {
    dt.returnDone = true;
    addAtmosphere(1);
    saveState();
    return { name: '收取一本还书', reward: '✨ +1氛围' };
  }
  if (task === 'water' && !dt.waterDone) {
    dt.waterDone = true;
    addCoins(10);
    saveState();
    return { name: '给植物浇水', reward: '💰 +10' };
  }
  // 古籍保养 v2 决策 4：修缮日任（保养或修复任一计数，每日一次 +2 氛围）
  if (task === 'maintain' && !dt.maintainDone) {
    dt.maintainDone = true;
    addAtmosphere(2);
    saveState();
    return { name: '修缮一本古籍', reward: '✨ +2氛围' };
  }
  return null;
}

// 全勤奖励（2026-10-24 v2：4 选 3 —— 新增修缮任务后，完成任意 3 项即全勤）
export function claimAllDoneBonus(stateCtx) {
  ensureDailyTasks();
  const dt = stateCtx ? stateCtx.dailyTasks : state.dailyTasks;
  const doneCount = [dt.focusDone, dt.returnDone, dt.waterDone, dt.maintainDone].filter(Boolean).length;
  if (doneCount >= 3 && !dt.allClaimed) {
    dt.allClaimed = true;
    addCoins(20);
    addAtmosphere(3);
    addInspiration(3);
    saveState();
    return { coins: 20, atmo: 3, inspiration: 3 };
  }
  return null;
}

// 获取当日字符串（= day-boundary 单一真源，导出兼容旧调用方）
export { getTodayKey as todayKey };
