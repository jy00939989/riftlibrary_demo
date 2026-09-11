#!/usr/bin/env node
// 日界统一重构（A1）行为基线 + 验收测试（无浏览器环境，mock localStorage/DOM/Date）
// 用法：
//   BASELINE=1 node scripts/test-day-boundary.mjs   # 重构前：只跑存量行为基线（S1-S4）
//   node scripts/test-day-boundary.mjs              # 重构后：全量（S1-S6）
//
// 基线锁定对象（验收标准 1：零行为漂移）：
//   S1 streak —— 连续**专注日**语义：同一天幂等、隔天 +1、断天平地归零、7 天奖励
//   S2 每日任务 —— 跨日重置、任务奖励不重复、全勤奖
//   S3 墨墨点评日限 —— 同日去重轮换、跨日清零、池耗尽自重置
//   S4 日记每日回顾 —— 每自然日最多一篇、只回顾昨日、无昨日记录则不产出
// 重构后新增（验收标准 2/3/4）：
//   S5 day-boundary 原语 —— 同日 null、单次触发、离线冻结不补发、订阅者隔离
//   S6 onNewDay 集成 —— 存量系统由事件驱动且 streak 不被日界触碰（零漂移关键断言）

// ── 环境 mock（必须在动态 import 之前装好）──
const store = new Map();
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
  clear: () => store.clear(),
  key: i => [...store.keys()][i] ?? null,
  get length() { return store.size; },
};
globalThis.document = {
  body: { style: {} },
  documentElement: { style: {} },
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
};
globalThis.window = globalThis;
globalThis.Audio = class {
  constructor(src) { this.src = src; this.volume = 1; this.loop = false; this.currentTime = 0; this.paused = true; }
  play() { return new Promise(() => {}); }
  pause() {}
  addEventListener() {}
  removeEventListener() {}
  setAttribute() {}
};

// ── 固定时钟：所有业务代码的 Date/Date.now 都被钉在 seed 上（本地时间正午，避开 UTC/本地日界差）──
const RealDate = Date;
function setMockDate(iso) {
  const fixed = new RealDate(iso);
  globalThis.Date = class extends RealDate {
    constructor(...args) { super(...(args.length ? args : [fixed.getTime()])); }
    static now() { return fixed.getTime(); }
  };
}
const dstr = iso => new RealDate(iso).toDateString();
// D1..D5 连续五个本地日
const D1 = '2026-09-08T12:00:00', D2 = '2026-09-09T12:00:00',
      D3 = '2026-09-10T12:00:00', D4 = '2026-09-11T12:00:00',
      D5 = '2026-09-12T12:00:00';

const { state } = await import('../js/state.js');
const storage = await import('../js/storage.js');
const dailytasks = await import('../js/dailytasks.js');
const achievements = await import('../js/achievements.js');
const diary = await import('../js/diary.js');

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { console.log(`  ✅ ${msg}`); pass++; }
  else { console.log(`  ❌ ${msg}`); fail++; }
}
function resetFocus() {
  state.focus.streak = 0;
  state.focus.lastFocusDate = null;
  state.focus.todayMinutes = 0;
  state.focus.todayDate = dstr(D1);
}
function resetDailyTasks(date) {
  state.dailyTasks = { date: date || '', focusDone: false, returnDone: false, waterDone: false, allClaimed: false };
}
function resetMomo() {
  state.momoCommentUsedToday = { date: '', comments: [] };
}
function resetDiary() {
  state.diaryLogs = [];
  state.diaryLastSummaryDate = '';
  state.history = [];
}

// ═══ S1. 基线：streak（连续专注日语义，重构后必须原样保留）═══
console.log('\n=== S1. streak 基线 ===');
resetFocus();
setMockDate(D1);
storage.updateStreak();
assert(state.focus.streak === 1, 'D1 首次专注 → streak=1');
storage.updateStreak();
assert(state.focus.streak === 1, 'D1 再次专注 → streak 仍=1（同日幂等）');
setMockDate(D2);
storage.updateStreak();
assert(state.focus.streak === 2, 'D2 专注 → streak=2（连续）');
setMockDate(D4); // 跳过 D3
storage.updateStreak();
assert(state.focus.streak === 1, 'D4 专注（D3 断档）→ 归零重计=1');

// 7 天奖励：streak=6，昨日有专注，今日专注 → 7，+50 币
resetFocus();
state.focus.streak = 6;
state.focus.lastFocusDate = dstr(D4);
state.coins = 0;
setMockDate(D5);
storage.updateStreak();
assert(state.focus.streak === 7, '6→D5 连续 → streak=7');
assert(state.coins === 50, 'streak=7 触发 +50 智慧之光');

// ═══ S2. 基线：每日任务 ═══
console.log('\n=== S2. 每日任务基线 ===');
setMockDate(D1);
resetDailyTasks('2000-01-01'); // 陈旧日期 → 触发重置
dailytasks.ensureDailyTasks();
// 注意：不断言 date 具体格式——重构前是 UTC 的 YYYY-MM-DD，重构后统一为本地 toDateString（A1 有意统一），
// 此处只锁「重置发生」这一行为，格式收敛由 S6 断言
assert(state.dailyTasks.date !== '2000-01-01', '跨日 ensureDailyTasks 重置 date（格式前后不同，见上注）');
assert(state.dailyTasks.focusDone === false && state.dailyTasks.allClaimed === false, '重置后任务旗标全 false');

state.coins = 0; state.library.atmosphere = 0;
const r1 = dailytasks.markTaskDone('focus', state);
assert(r1 && state.dailyTasks.focusDone && state.coins === 30, 'focus 任务 +30 币');
assert(dailytasks.markTaskDone('focus', state) === null, 'focus 任务不可重复领');
dailytasks.markTaskDone('return', state);
assert(state.dailyTasks.returnDone && state.library.atmosphere === 1, 'return 任务 +1 氛围');
dailytasks.markTaskDone('water', state);
assert(state.dailyTasks.waterDone && state.coins === 40, 'water 任务 +10 币');
state.library.atmosphere = 0;
const bonus = dailytasks.claimAllDoneBonus(state);
assert(bonus && state.dailyTasks.allClaimed && state.coins === 60 && state.library.atmosphere === 3, '全勤奖 +20币/+3氛围');
assert(state.inspiration === 3, '全勤奖 +3 灵感');
assert(dailytasks.claimAllDoneBonus(state) === null, '全勤奖不可重复领');

// ═══ S3. 基线：墨墨点评日限 ═══
console.log('\n=== S3. 墨墨点评日限基线 ===');
setMockDate(D1);
resetMomo();
const p1 = achievements.pickMomoComment('restoration');
const p2 = achievements.pickMomoComment('restoration');
assert(p1 && p2 && p1 !== p2, '同日两次点评不重复（池内去重）');
assert(state.momoCommentUsedToday.comments.length === 2, '已用点评记 2 条');
setMockDate(D2);
achievements.pickMomoComment('restoration');
assert(state.momoCommentUsedToday.date === dstr(D2) && state.momoCommentUsedToday.comments.length === 1,
  '跨日点评 → 日限清零重新累计');
setMockDate(D2);
resetMomo();
const picks = new Set();
for (let i = 0; i < 4; i++) picks.add(achievements.pickMomoComment('restoration'));
assert(picks.size === 4, '池耗尽前 4 次点评全不同');
achievements.pickMomoComment('restoration');
assert(state.momoCommentUsedToday.comments.length === 1, '池耗尽当日自重置并记 1 条');

// ═══ S4. 基线：日记每日回顾 ═══
console.log('\n=== S4. 日记每日回顾基线 ===');
setMockDate(D2);
resetDiary();
state.history = [{ type: 'focus', title: '专注25分钟', detail: '共 1,234 字', time: new RealDate(D1).toISOString() }];
diary.tryGenerateDailySummary();
assert(state.diaryLogs.length === 1 && state.diaryLogs[0].type === 'daily', '有昨日记录 → 生成 1 篇 daily 回顾');
assert(state.diaryLastSummaryDate === dstr(D2), '回顾日期戳=今日');
diary.tryGenerateDailySummary();
assert(state.diaryLogs.length === 1, '同日不重复生成');

resetDiary();
state.history = [{ type: 'focus', title: '专注25分钟', detail: '共 1,234 字', time: new RealDate('2020-01-01T12:00:00').toISOString() }];
diary.tryGenerateDailySummary();
assert(state.diaryLogs.length === 0, '无昨日记录 → 不产出（日期戳也不写）');

// ═══ S5. day-boundary 原语（新建模块）═══
const IS_BASELINE = !!process.env.BASELINE;
if (IS_BASELINE) {
  console.log('\n=== S5/S6 跳过（BASELINE=1 重构前模式）===');
} else {
  const dayBoundary = await import('../js/core/day-boundary.js');
  const { checkDayRollover, onNewDay, getTodayKey, getPrevDayKey } = dayBoundary;
  const T1 = new RealDate(D1).getTime(), T2 = new RealDate(D2).getTime(),
        T5 = new RealDate(D5).getTime();

  console.log('\n=== S5. day-boundary 原语 ===');
  setMockDate(D1);
  let ctx = { lastSeenDay: getTodayKey() };
  assert(checkDayRollover(ctx, T1) === null, '同日检测 → null 不触发');
  let fires = [];
  const off = onNewDay(p => fires.push(p));
  ctx = { lastSeenDay: dstr(D1) };
  const payload = checkDayRollover(ctx, T2);
  assert(payload && payload.prevDay === dstr(D1) && payload.today === dstr(D2), '跨日 → payload {prevDay, today} 正确');
  assert(ctx.lastSeenDay === dstr(D2), 'lastSeenDay 落库今日');
  assert(fires.length === 1, '订阅者恰好收到 1 次事件（失败信号 A：双触发检测）');
  assert(checkDayRollover(ctx, T2) === null && fires.length === 1, '同日再检测不重复触发');

  // 离线 3 天（D2→D5）只触发一次，不补发
  fires = [];
  const frozen = checkDayRollover({ lastSeenDay: dstr(D2) }, T5);
  assert(frozen && frozen.prevDay === dstr(D2) && frozen.today === dstr(D5), '离线 3 天 → 单次事件 prevDay=最后活跃日（冻结语义，失败信号 C）');
  off();
  fires = [];
  checkDayRollover({ lastSeenDay: dstr(D1) }, T2);
  assert(fires.length === 0, '退订后不再收到事件');

  // 订阅者抛错隔离
  let survived = false;
  const offA = onNewDay(() => { throw new Error('boom'); });
  const offB = onNewDay(() => { survived = true; });
  checkDayRollover({ lastSeenDay: dstr(D1) }, T2);
  assert(survived, '抛错订阅者不影响其他订阅者');
  offA(); offB();

  assert(getPrevDayKey(T2) === dstr(D1), 'getPrevDayKey = 日历昨日（非固定 -24h）');

  // ═══ S6. onNewDay 集成（存量系统事件驱动 + 零漂移断言）═══
  console.log('\n=== S6. onNewDay 集成 ===');
  // 每日任务：由日界事件重置
  setMockDate(D2);
  resetDailyTasks(dstr(D1));
  state.lastSeenDay = dstr(D1); // 每个用例前重设日界锚点（前序用例已推进它）
  checkDayRollover(state, T2);
  assert(state.dailyTasks.date === dstr(D2) && state.dailyTasks.focusDone === false,
    'onNewDay 驱动每日任务重置');

  // 墨墨日限：由日界事件清零
  resetMomo();
  state.momoCommentUsedToday = { date: dstr(D1), comments: ['a', 'b'] };
  state.lastSeenDay = dstr(D1);
  checkDayRollover(state, T2);
  assert(state.momoCommentUsedToday.date === dstr(D2) && state.momoCommentUsedToday.comments.length === 0,
    'onNewDay 驱动墨墨日限清零');

  // 日记回顾：跨日自动为昨日生成
  resetDiary();
  state.diaryLastSummaryDate = dstr(D1);
  state.history = [{ type: 'focus', title: '专注25分钟', detail: '共 1,234 字', time: new RealDate(D1).toISOString() }];
  state.lastSeenDay = dstr(D1);
  checkDayRollover(state, T2);
  assert(state.diaryLogs.length === 1 && state.diaryLogs[0].type === 'daily',
    'onNewDay 自动回顾昨日（开着过 0 点路径）');

  // 零漂移关键断言：日界事件不触碰 streak（streak 属「连续专注日」语义）
  resetFocus();
  state.focus.streak = 3;
  state.focus.lastFocusDate = dstr(D1);
  state.lastSeenDay = dstr(D1);
  checkDayRollover(state, T2);
  assert(state.focus.streak === 3 && state.focus.lastFocusDate === dstr(D1),
    'onNewDay 不改 streak/lastFocusDate（专注日语义由 updateStreak 独占）');
  storage.updateStreak();
  assert(state.focus.streak === 4, '次日专注 → streak=4（语义与基线一致）');
}

console.log(`\n${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
