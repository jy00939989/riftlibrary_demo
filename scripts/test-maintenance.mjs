#!/usr/bin/env node
// 古籍保养机制回归（book-maintenance-plan v2，2026-10-24）
// 覆盖：工时阶梯 / copiedWords 防御 / 入批拦截 / 批次上限 / 一体结算零直接奖励 /
//       挂起续作 / 脏数据兜底 / completeFocus 活动轴路由 / 修复室速度加成绕 damaged 门槛 /
//       修缮日任（保养+修复双计数、每日一次）/ 4 选 3 全勤
// 用法：node scripts/test-maintenance.mjs

// ── Node 环境浏览器桩 ──
globalThis.window = { __dev: {} };
const elStub = () => ({
  style: {}, classList: { add() {}, remove() {}, toggle() {} },
  addEventListener() {}, appendChild() {}, remove() {},
  querySelector: () => null, querySelectorAll: () => [], innerHTML: '', textContent: ''
});
globalThis.document = {
  getElementById: elStub, querySelector: elStub, querySelectorAll: () => [],
  addEventListener() {}, body: elStub(), documentElement: elStub(), createElement: elStub
};
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.Audio = class Audio { constructor() {} play() { return Promise.resolve(); } pause() {} addEventListener() {} };

const { state } = await import('../js/state.js');
const { runMigrations } = await import('../js/state/migrations.js');
const { getMaintenanceWords, getMaintenanceRate } = await import('../data/maintenance.js');
const {
  getMaintainableBooks, startMaintenanceSession, cancelMaintenanceSession,
  applyMaintenanceProgress, suspendMaintenanceFocus, getMaintenanceSessionTotal,
  estimateRepairMinutes
} = await import('../js/core/maintenance.js');
const { getMaintenanceBatchCap } = await import('../js/capacity.js');
const { completeFocus } = await import('../js/core/focus-session.js');
const { applyRepairProgress } = await import('../js/core/book-progress.js');
const { ensureDailyTasks, markTaskDone, claimAllDoneBonus } = await import('../js/dailytasks.js');
const { calculateWordsGained } = await import('../js/core/focus-rewards.js');
const { getAuraSpeedBonus } = await import('../js/visitors.js');
const { getCurationFocusSpeed } = await import('../js/curation.js');
const { getFocusSpeedMultiplier } = await import('../js/shop.js');
const { getChapterInfo } = await import('../js/core/book-utils.js');
const { getTodayKey } = await import('../js/core/day-boundary.js');
const { BOOKS } = await import('../data/books.js');

runMigrations();

let passed = 0, failed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; failures.push(`${name}: ${e.message}`); }
}
function assertEq(actual, expected, label = '') {
  if (actual !== expected) throw new Error(`${label} 期望 ${expected}，实际 ${actual}`);
}
function assertTrue(v, label = '') { if (!v) throw new Error(`${label} 应为真`); }

function resetSave() {
  state.books = {};
  state.visitors = [];
  state.maintenanceSession = null;
  state.currentSession = {
    active: false, mode: 'pomodoro', activity: null, bookId: null, targetMinutes: 25,
    elapsedSeconds: 0, fractionalSeconds: 0, paused: false, intervalId: null,
    quoteIndex: 0, lastQuoteMinute: 0, startTime: 0, lastTickTime: 0, speedMultiplier: 1
  };
  state.dailyTasks = { date: getTodayKey(), focusDone: false, returnDone: false, waterDone: false, maintainDone: false, allClaimed: false };
  state.restorationUnlocked = true;
  state.restorationLevel = 1;
  state.library.atmosphere = 0;
  state.inspiration = 0;
  state.focus.totalWords = 0;
  state.focus.totalMinutes = 0;
  state.history = [];
  state.diary = [];
}

function mkBook(id, { wear = 5, copied = 25000, damaged = false, completed = true } = {}) {
  state.books[id] = {
    status: completed ? 'completed' : 'copying',
    copiedWords: copied, copyCount: completed ? 1 : 0,
    wearCount: wear, damaged, repairWords: 0, repairProgress: 0,
    borrowTimes: 1, unlockedChapters: [1], readChapters: []
  };
}

// ── 1. 工时阶梯与防御 ──
test('工时阶梯：良好1.5% / 微旧3% / 破旧5% / 濒危8%', () => {
  assertEq(getMaintenanceWords({ copiedWords: 10000, wearCount: 2 }), 150, '良好');
  assertEq(getMaintenanceWords({ copiedWords: 10000, wearCount: 7 }), 300, '微旧');
  assertEq(getMaintenanceWords({ copiedWords: 10000, wearCount: 12 }), 500, '破旧');
  assertEq(getMaintenanceWords({ copiedWords: 10000, wearCount: 20 }), 800, '濒危');
  assertEq(getMaintenanceWords({ copiedWords: 10000, wearCount: 0 }), 0, '崭新不可保养');
});
test('copiedWords=0 防御：工时 ≥1（评审 P2 不变量钉死）', () => {
  assertTrue(getMaintenanceWords({ copiedWords: 0, wearCount: 5 }) >= 1, '不得为 0');
});

// ── 2. 入批拦截 ──
test('可保养列表排除崭新/损毁/典藏/在借', () => {
  resetSave();
  mkBook('book_003', { wear: 5 });
  mkBook('book_001', { wear: 0 });              // 崭新
  mkBook('book_047', { wear: 9 });              // 典藏 indestructible
  const damagedId = Object.keys(BOOKS).find(id => !BOOKS[id].indestructible && id !== 'book_003' && id !== 'book_001' && id !== 'book_047');
  mkBook(damagedId, { wear: 3, damaged: true });
  const list = getMaintainableBooks().map(b => b.bookId);
  assertTrue(list.includes('book_003'), '微旧书应在列');
  assertTrue(!list.includes('book_001'), '崭新应排除');
  assertTrue(!list.includes('book_047'), '典藏应排除');
  assertTrue(!list.includes(damagedId), '损毁应排除');
});
test('startMaintenanceSession 拒绝崭新', () => {
  resetSave();
  mkBook('book_001', { wear: 0 });
  const res = startMaintenanceSession(['book_001']);
  assertEq(res.ok, false, '应拒绝');
  assertEq(res.reason, 'not_maintainable');
});

// ── 3. 批次上限随等级（Lv1→2，Lv3+→4 封顶）──
test('批次上限：Lv1=2，Lv3=4（封顶）', () => {
  resetSave();
  assertEq(getMaintenanceBatchCap(), 2, 'Lv1→2');
  state.restorationLevel = 3;
  assertEq(getMaintenanceBatchCap(), 4, 'Lv3→4');
  state.restorationLevel = 5;
  assertEq(getMaintenanceBatchCap(), 4, 'Lv5 封顶 4（设计意图）');
  state.restorationLevel = 1;
});
test('超上限拒绝', () => {
  resetSave();
  mkBook('book_003', { wear: 2 });
  mkBook('book_001', { wear: 2 });
  mkBook('book_011', { wear: 2 });
  const res = startMaintenanceSession(['book_003', 'book_001', 'book_011']);
  assertEq(res.ok, false);
  assertEq(res.reason, 'over_cap');
});

// ── 4. 一体结算：磨损清零 + 零直接奖励 + 日任钩子 ──
test('completeFocus 保养路由：磨损清零、誊抄不推进、氛围仅日任 +2', () => {
  resetSave();
  ensureDailyTasks();
  mkBook('book_003', { wear: 5 });  // 工时 = 25000×3% = 750
  const startRes = startMaintenanceSession(['book_003']);
  assertEq(startRes.ok, true);
  assertEq(startRes.total, 750);

  state.currentSession = {
    active: true, mode: 'pomodoro', activity: 'maintenance', bookId: 'book_003',
    targetMinutes: 25, elapsedSeconds: 600, fractionalSeconds: 0, paused: false,
    intervalId: null, quoteIndex: 0, lastQuoteMinute: 0, startTime: 0, lastTickTime: 0,
    speedMultiplier: 1, teaBoost: false, candleInspiration: false
  };
  const beforeWords = state.books['book_003'].copiedWords;
  const res = completeFocus(false);
  assertTrue(res.maintenanceResult?.completed, '批次应结算');
  assertEq(res.bookProgressResult, null, 'maintenance 不推进誊抄（applyWords 未调用）');
  assertEq(state.books['book_003'].copiedWords, beforeWords, 'copiedWords 不变');
  assertEq(state.books['book_003'].wearCount, 0, '磨损清零');
  assertEq(state.maintenanceSession, null, '会话对象清除');
  // 速度加成绕 damaged 门槛：有无 +10% 修复室加成，产出比应 ≈1.1（不受章节冲刺等其它乘区影响）
  const baseArgs = {
    minutes: 10, teaBoost: false, focusSpeedMultiplier: getFocusSpeedMultiplier(),
    auraSpeed: getAuraSpeedBonus(BOOKS['book_003'].category), curationSpeed: getCurationFocusSpeed(),
    getChapterInfo, book: BOOKS['book_003'], bookState: state.books['book_003']
  };
  const withBonus = calculateWordsGained({ ...baseArgs, repairSpeedBonus: 0.10 });
  const withoutBonus = calculateWordsGained({ ...baseArgs, repairSpeedBonus: 0 });
  assertTrue(withoutBonus > 0 && withBonus / withoutBonus > 1.05, '保养应吃修复室速度加成（绕 damaged 门槛）');
  assertTrue(res.wordsGained >= Math.min(withBonus, withoutBonus), 'completeFocus 产出不低于无加成基线');
  assertEq(state.dailyTasks.maintainDone, true, '修缮日任计数');
  assertEq(state.library.atmosphere, 2, '氛围仅来自日任 +2，保养本身零直接奖励');
});

// ── 5. 挂起续作：进度无损 ──
test('挂起→续作→完成，进度保留', () => {
  resetSave();
  mkBook('book_003', { wear: 5 });   // 750
  mkBook('book_011', { wear: 2 });   // 25000×1.5% = 375 → 总 1125
  startMaintenanceSession(['book_003', 'book_011']);
  let r = applyMaintenanceProgress(500);
  assertEq(r.completed, false);
  // 模拟进行中会话挂起（5 分钟 = 550，含 Lv1 加成 500×1.1）
  state.currentSession = {
    active: true, mode: 'pomodoro', activity: 'maintenance', bookId: 'book_003',
    targetMinutes: 25, elapsedSeconds: 300, fractionalSeconds: 0, paused: false,
    intervalId: null, quoteIndex: 0, lastQuoteMinute: 0, startTime: 0, lastTickTime: 0,
    speedMultiplier: 1, teaBoost: false, candleInspiration: false
  };
  const expectedCredit = calculateWordsGained({
    minutes: 5, teaBoost: false, focusSpeedMultiplier: getFocusSpeedMultiplier(),
    auraSpeed: getAuraSpeedBonus(BOOKS['book_003'].category), curationSpeed: getCurationFocusSpeed(),
    repairSpeedBonus: 0.10, getChapterInfo, book: BOOKS['book_003'], bookState: state.books['book_003']
  });
  const s = suspendMaintenanceFocus();
  assertEq(s.ok, true);
  assertEq(state.maintenanceSession.progressPool, 500 + expectedCredit, '500 池 + 挂起入账（全额保留）');
  assertTrue(state.currentSession.active === false, '会话已停');
  // 续作：补足差额即整批结算
  const remain = getMaintenanceSessionTotal(state.maintenanceSession) - state.maintenanceSession.progressPool;
  r = applyMaintenanceProgress(remain);
  assertEq(r.completed, true, '应整批结算');
  assertEq(state.books['book_003'].wearCount, 0);
  assertEq(state.books['book_011'].wearCount, 0);
});

// ── 6. 脏数据兜底：挂起期间书被借出 → 剔除退工时 ──
test('结算前书被借出：自动剔除，剩余书正常结算', () => {
  resetSave();
  mkBook('book_003', { wear: 5 });   // 750
  mkBook('book_011', { wear: 2 });   // 375
  startMaintenanceSession(['book_003', 'book_011']);
  state.visitors = [{ id: 'v1', charId: 'chengyuan', status: 'borrowed', bookIds: ['book_011'], bookId: 'book_011' }];
  const r = applyMaintenanceProgress(750);
  assertEq(r.completed, true, '剩余书达新目标即结算');
  assertEq(state.books['book_003'].wearCount, 0, '在场书磨损清零');
  assertEq(state.books['book_011'].wearCount, 2, '借出书不动');
});

// ── 7. 旧会话兼容（无 activity 字段）──
test('旧会话懒推导：损毁书 = repair 活动，不推进誊抄', () => {
  resetSave();
  mkBook('book_003', { wear: 3, damaged: true });
  state.books['book_003'].repairWords = 100;
  state.currentSession = {
    active: true, mode: 'pomodoro', bookId: 'book_003', targetMinutes: 25,
    elapsedSeconds: 120, fractionalSeconds: 0, paused: false, intervalId: null,
    quoteIndex: 0, lastQuoteMinute: 0, startTime: 0, lastTickTime: 0,
    speedMultiplier: 1, teaBoost: false, candleInspiration: false
  };
  const res = completeFocus(false);
  assertEq(res.bookProgressResult, null, 'repairOnly 不推进誊抄');
  assertTrue(res.repairResult?.repairCompleted, '修复应完成');
});

// ── 8. 修缮日任：修复也计数，每日一次 ──
test('修复完成计数修缮日任；每日只发一次 +2 氛围', () => {
  resetSave();
  ensureDailyTasks();
  mkBook('book_003', { wear: 3, damaged: true });
  state.books['book_003'].repairWords = 50;
  applyRepairProgress('book_003', 100);
  assertEq(state.dailyTasks.maintainDone, true, '修复计数');
  const atmo1 = state.library.atmosphere; // +1 修复 +2 日任
  assertEq(atmo1, 3, '1+2');
  // 第二次（保养路径）不再发氛围
  mkBook('book_011', { wear: 5 });
  startMaintenanceSession(['book_011']);
  applyMaintenanceProgress(99999);
  assertEq(state.library.atmosphere, atmo1, '日任每日一次，不重复发');
});

// ── 9. 4 选 3 全勤 ──
test('4 选 3：任意 3 项即全勤（含与不含修缮各一例）', () => {
  resetSave();
  ensureDailyTasks();
  state.dailyTasks.focusDone = true;
  state.dailyTasks.returnDone = true;
  state.dailyTasks.waterDone = false;
  state.dailyTasks.maintainDone = false;
  assertEq(claimAllDoneBonus(state), null, '只有 2 项不可领');
  markTaskDone('maintain');
  const bonus = claimAllDoneBonus(state);
  assertTrue(bonus, '3 项（含修缮）应可领');
  state.dailyTasks.allClaimed = false;
  state.dailyTasks.maintainDone = false;
  markTaskDone('water');
  assertTrue(claimAllDoneBonus(state), '3 项（不含修缮）也应可领');
});

// ── 10. 取消批次 / 修复时长估算 ──
test('取消批次清空会话；estimateRepairMinutes 口径', () => {
  resetSave();
  mkBook('book_003', { wear: 5 });
  startMaintenanceSession(['book_003']);
  assertTrue(cancelMaintenanceSession(), '取消应成功');
  assertEq(state.maintenanceSession, null);
  assertEq(estimateRepairMinutes({ repairWords: 1100 }), 10, 'Lv1 加成 10% → 1100/110=10 分钟');
  assertEq(estimateRepairMinutes({ repairWords: 0 }), 0, '无修复量返回 0');
});

console.log(`\nmaintenance：${passed} 通过, ${failed} 失败`);
if (failures.length) { console.log(failures.join('\n')); process.exit(1); }
