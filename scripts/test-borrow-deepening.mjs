#!/usr/bin/env node
// 借阅深化（borrow-demand-deepening-plan v3.1）测试
// 覆盖：借书槽表/多本借阅与整单到期/整单结算 ×0.6 数学/寄读浮动上限与日结/
//       吐槽护栏/赞叹闭环/多 plan 同档迁移共存（A5）
// 用法：node scripts/test-borrow-deepening.mjs

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
  play() { return new Promise(() => {}); }
  pause() {}
  addEventListener() {}
};

const { state } = await import('../js/state.js');
const { runMigrations } = await import('../js/state/migrations.js');
const visitors = await import('../js/visitors.js');
const offsite = await import('../js/core/offsite.js');
const { getBorrowSlots } = await import('../data/borrow-levels.js');
const { getTodayKey, checkDayRollover } = await import('../js/core/day-boundary.js');
const { createBookRecord } = await import('../js/core/book-utils.js');
const bookProgress = await import('../js/core/book-progress.js');
const { BOOKS } = await import('../data/books.js');

const RealDate = Date;
const T0 = new RealDate('2026-09-10T12:00:00').getTime();
const HOUR = 3600000;

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { console.log(`  ✅ ${msg}`); pass++; }
  else { console.log(`  ❌ ${msg}`); fail++; }
}
const realRandom = Math.random;
const roll = v => { Math.random = () => v; };
const restoreRoll = () => { Math.random = realRandom; };

// 选 5 本科学/小说类书（避开沈明远偏好，保证候选池=全部）
const poolIds = Object.values(BOOKS)
  .filter(b => !['哲学', '历史', '诗歌'].includes(b.category) && !b.isVolume && !b.indestructible)
  .slice(0, 8)
  .map(b => b.id);
assert(poolIds.length === 8, '测试池 8 本书就绪');

function resetLibrary(borrowLevel = 5) {
  state.library.stage = 5;
  state.library.atmosphere = 3000;
  state.library.borrowLevel = borrowLevel;
  state.library.shelves = [new Array(5).fill(null), new Array(5).fill(null), new Array(5).fill(null)];
  state.library.lastOffsiteDate = null;
  state.coins = 0;
  state.inspiration = 0;
  state.library.atmosphere = 3000;
  state.seeds = {};
  state.plants = [{ activeType: null, level: 0, growthProgress: 0, waterAvailable: 0, lastCareTime: 0, plantedAt: 0, harvested: false }];
  state.cafe = { unlocked: false, level: 0, stock: {}, totalServed: 0, lastServeDay: null, lastFeeDay: null, dormant: false };
  state.visitors = [];
  state.borrowRecords = [];
  state.complaintDaily = { date: '', count: 0 };
  state.signboards = [];
  poolIds.forEach(id => {
    state.books[id] = createBookRecord({ status: 'completed', copiedWords: BOOKS[id].totalWords, copyCount: 1 });
  });
}
function mkVisitor(id) {
  return { id, charId: 'shenmingyuan', emoji: '📚', name: '访客' + id, status: 'browsing', favorability: 0 };
}
function expectedDue(bookId, now) {
  const words = BOOKS[bookId].totalWords || 28000;
  const base = Math.max(3, Math.min(120, Math.round(words / 2500)));
  const hours = Math.max(3, Math.min(120, Math.round(base * 0.7))); // variance=0.7（roll 0）
  return now + hours * HOUR;
}

// ═══ 1. 借书槽表 ═══
console.log('\n=== 1. 借书槽表 ===');
const slotsTable = [0, 1, 1, 2, 2, 3, 3, 3];
slotsTable.forEach((expect, lv) => {
  const got = getBorrowSlots(lv);
  assert(got === (expect || 1), `Lv${lv} → ${expect || 1} 本`);
});

// ═══ 2. 多本借阅（Lv5 抽 3 本，无重复，整单到期取最大）═══
console.log('\n=== 2. 多本借阅 ===');
resetLibrary(5);
state.visitors = [mkVisitor('b1')];
roll(0); // 借书判定过、抽本取首、variance=0.7、不吐槽（书新）
visitors.tickVisitorBrowsing(T0);
restoreRoll();
const v1 = state.visitors[0];
assert(v1.status === 'borrowed', '借书成功');
assert(v1.bookIds.length === 3, 'Lv5 借 3 本');
assert(new Set(v1.bookIds).size === 3, '无重复抽取');
assert(v1.bookIds.every(id => poolIds.includes(id)), '全部来自候选池');
const expDue = Math.max(...v1.bookIds.map(id => expectedDue(id, T0)));
assert(v1.dueTime === expDue, '整单 dueTime = 各自时长最大值（一起到期）');
assert(v1.bookId === v1.bookIds[0], '兼容字段 bookId = 首本');
v1.bookIds.forEach(id => {
  assert(state.books[id].wearCount === 1 && state.books[id].borrowTimes === 1, `《${id}》磨损+1 借次+1`);
});

// 第二访客借阅单与第一单无交集
state.visitors.push(mkVisitor('b2'));
roll(0);
visitors.tickVisitorBrowsing(T0 + HOUR);
restoreRoll();
const v2 = state.visitors.find(v => v.id === 'b2');
assert(v2.bookIds.length === 3, '剩余 5 本 → 第二单 3 本');
assert(v2.bookIds.every(id => !v1.bookIds.includes(id)), '两单无交集（候选池排除在途）');

// Lv1 单本回归
resetLibrary(1);
state.visitors = [mkVisitor('b3')];
roll(0);
visitors.tickVisitorBrowsing(T0);
restoreRoll();
assert(state.visitors[0].bookIds.length === 1, 'Lv1 仍单本（零漂移）');

// ═══ 3. 整单结算 ×0.6 数学（§3.2；图南 2026-09-18：额外书 0.25→0.6）═══
console.log('\n=== 3. 整单结算 ===');
resetLibrary(5); // returnCoins 50 · returnAtmo 5
state.visitors = [mkVisitor('c1')];
roll(0);
visitors.tickVisitorBrowsing(T0);
restoreRoll();
const vc = state.visitors[0];
vc.status = 'due';
vc.borrowTime = T0;
vc.dueTime = T0 + 12 * HOUR; // 时长加成 floor(12/6)*3 = 6
const atmoBefore = state.library.atmosphere;
const coinsBefore = state.coins;
roll(0.999); // 不损毁、不触发角色事件
const ret = visitors.collectReturn(vc.id);
restoreRoll();
assert(ret && ret.books.length === 3, '整单 3 本结算');
assert(ret.books[0].coins === 50 && ret.books[0].atmosphere === 5, '首本全收益 50💰+5✨');
assert(ret.books[1].coins === Math.round(50 * 0.6) && ret.books[1].atmosphere === 0, '额外书 ×0.6 币零氛围');
assert(ret.coins === 50 + 2 * Math.round(50 * 0.6) + 6, '整单币 = 首本 + 2×额外 + 时长加成 6');
assert(ret.atmosphere === 5, '整单氛围仅首本');
assert(state.library.atmosphere === atmoBefore + 5, '氛围仅 +5（额外书零氛围）');
assert(ret.extraCoins === 6, '时长加成整单一次');
assert(state.borrowRecords.length === 1 && state.borrowRecords[0].bookIds.length === 3, '借阅历史整单一条书名列全');
assert(state.visitors.length === 0, '访客移除');
assert(ret.favor > 0, '好感钩子整单一次');

// ═══ 4. 寄读日结（§4：浮动上限/磨损/零氛围/防重）═══
console.log('\n=== 4. 寄读日结 ===');
assert(offsite.getOffsiteCap(1) === 3 && offsite.getOffsiteCap(24) === 3
  && offsite.getOffsiteCap(40) === 5 && offsite.getOffsiteCap(64) === 8
  && offsite.getOffsiteCap(200) === 12, '浮动上限 min(12,max(3,⌊n/8⌋))');
resetLibrary(5);
roll(0); // 全部寄读（25% 判定 0 < 0.25）+ 全部 +1 灵感（0 < 0.1）
const today = getTodayKey(T0);
const served = offsite.settleOffsite(today);
restoreRoll();
assert(served === Math.min(12, Math.max(3, Math.floor(5 / 8))), `5 本藏书 → 上限 3，实寄 ${served} 本`);
assert(state.library.lastOffsiteDate === today, 'lastOffsiteDate 落戳防重');
const circulatedIds = poolIds.filter(id => state.books[id].borrowTimes >= 1);
assert(circulatedIds.length === served, '寄读书 wearCount+1/borrowTimes+1');
assert(state.inspiration === served, '10% 灵感（roll 0 全中）');
const atmoBeforeOff = state.library.atmosphere;
offsite.settleOffsite(today);
assert(state.library.atmosphere === atmoBeforeOff && state.coins > 0, '同日再结防重；金币已入账');
// 排除项：损毁书/修缮箱书不在寄读候选
resetLibrary(5);
state.books[poolIds[0]].damaged = true;
state.restorationBox = [poolIds[1]];
roll(0);
offsite.settleOffsite(getTodayKey(T0));
restoreRoll();
assert(state.books[poolIds[0]].borrowTimes === 0 && state.books[poolIds[1]].borrowTimes === 0,
  '损毁/修缮箱书排除寄读');

// ═══ 5. 吐槽护栏（§5）═══
console.log('\n=== 5. 吐槽护栏 ===');
resetLibrary(1); // 单本槽：8 本书够 4 人各借 1 本
poolIds.forEach(id => { state.books[id].borrowTimes = 7; }); // 全部老旧
state.visitors = [mkVisitor('k1'), mkVisitor('k2'), mkVisitor('k3'), mkVisitor('k4')];
roll(0); // 借书判定过 + 吐槽 30% 过
visitors.tickVisitorBrowsing(T0);
restoreRoll();
const complained = state.visitors.filter(v => v.complainedRecently);
assert(complained.length === 3, '全馆日限 3 次：第 4 位被拦');
assert(state.complaintDaily.count === 3, '日限计数 = 3');
assert(complained.every(v => v.favorability === 3), '吐槽好感 -1（浏览+1 借书+3 吐槽-1 = 3）');

// 跨日重置：日期键一变，计数清零，新访客可吐槽
state.complaintDaily = { date: 'old-day', count: 3 };
state.visitors = [mkVisitor('k5')]; // k1-k4 在途（4 本），候选池剩 4 本
roll(0);
visitors.tickVisitorBrowsing(T0 + HOUR);
restoreRoll();
assert(state.complaintDaily.count === 1 && state.visitors[0].complainedRecently,
  '跨日日限重置，新访客吐槽成功');

// 同访客 24h 护栏：complainedAt 未过期不重复吐槽
state.visitors.push({ ...mkVisitor('k6'), complainedAt: Date.now() });
roll(0);
visitors.tickVisitorBrowsing(T0 + 2 * HOUR);
restoreRoll();
const k6 = state.visitors.find(v => v.id === 'k6');
assert(k6 && !k6.complainedRecently && state.complaintDaily.count === 1,
  '同访客 24h 内不重复吐槽（计数不增）');

// ═══ 6. 赞叹闭环（§5.2：净 +4）═══
console.log('\n=== 6. 赞叹闭环 ===');
resetLibrary(5);
const complainer = mkVisitor('p1');
complainer.complainedRecently = true;
complainer.favorability = 10;
state.visitors = [complainer];
const newBookId = poolIds[4];
state.books[newBookId] = createBookRecord({ status: 'copying', copiedWords: BOOKS[newBookId].totalWords, copyCount: 0, borrowTimes: 0 });
const r6 = bookProgress.completeBook(newBookId);
assert(r6 && r6.isFirstCompletion, '新书首次完成');
assert(state.visitors[0].favorability === 15, '带标记访客赞叹 +5');
assert(state.visitors[0].complainedRecently === false, '标记清除（闭环净 +4）');
// 被外借过的书（borrowTimes≥1）不触发赞叹
resetLibrary(5);
const nonPraiser = mkVisitor('p2');
nonPraiser.complainedRecently = true;
state.visitors = [nonPraiser];
state.books[poolIds[3]].borrowTimes = 3;
state.books[poolIds[3]] = createBookRecord({ status: 'copying', copiedWords: BOOKS[poolIds[3]].totalWords, copyCount: 0, borrowTimes: 3 });
bookProgress.completeBook(poolIds[3]);
assert(state.visitors[0].favorability === 0 && state.visitors[0].complainedRecently === true,
  '借过的书完成不赞叹（borrowTimes≥1）');

// ═══ 7. 多 plan 同档迁移共存（A5）═══
console.log('\n=== 7. 迁移共存（A5）===');
state._schemaVersion = 8;
delete state.complaintDaily;
state.library.lastOffsiteDate = undefined;
state.visitors = [{ id: 'old1', charId: 'peizhou', emoji: '📚', name: '老访客', status: 'borrowed', bookId: poolIds[0], bookIds: undefined, favorability: 0 }];
runMigrations();
assert(state._schemaVersion === 14, 'schemaVersion 升到 14');
assert(state.visitors[0].bookIds && state.visitors[0].bookIds.length === 1
  && state.visitors[0].bookIds[0] === poolIds[0], '在途单本访客迁移 bookIds 数组');
assert(state.library.lastOffsiteDate === null, 'lastOffsiteDate 默认 null');
assert(state.complaintDaily && state.complaintDaily.count === 0, 'complaintDaily 默认态');
assert(state.cafe && Array.isArray(state.plants), 'cafe/plants 同档完好（v8/v7 无顺序依赖）');

console.log(`\n${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
