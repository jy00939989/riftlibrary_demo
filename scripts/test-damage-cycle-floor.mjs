#!/usr/bin/env node
// 损坏扣字「周期地板」回归（2026-10-16 菜根谭事件）
// 漏洞：损坏/还书损毁/墨水打翻从 copiedWords 直接扣字，挖穿已完成周期（copyCount × totalWords）的底——
//       完整已完成的在架书被扣到 totalWords 以下 → 状态降 'copying'（书架显示「誊抄中」）；
//       修复只清 damaged 标不回补字数 → 玩家补回损失字数时被记成下一周期进度 →
//       只写损失量就触发 didComplete → copyCount+1 → 墨墨日记伪「第N次誊抄」→ 误升典藏；
//       completeBook 非首通不回写 status → 书卡「誊抄中 0%」/手稿箱不自动上架，直到载入迁移兜底。
// 修复：applyCycleSafeWordLoss 地板（三处掉字点统一）；completeBook 无条件回写 status='completed'。
// 用法：node scripts/test-damage-cycle-floor.mjs

// ── Node 环境浏览器桩（completeFocus/completeBook 链会触碰 DOM/Audio，桩住即可）──
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

const { state } = await import('../js/state.js');
const { applyCycleSafeWordLoss } = await import('../js/core/book-utils.js');
const { completeFocus } = await import('../js/core/focus-session.js');
const { completeBook } = await import('../js/core/book-progress.js');

let passed = 0, failed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; failures.push(`${name}: ${e.message}`); }
}
function assertEq(actual, expected, label = '') {
  if (actual !== expected) throw new Error(`${label} 期望 ${expected}，实际 ${actual}`);
}

state.focus = { totalWords: 0, totalMinutes: 0, streak: 1 };
state.library = {};
state.exhibition = { rooms: {} };
state.plants = [];
state.visitors = [];
state.guideQuests = { allCompleted: true };
state.diaryLogs = [];

// ── 地板纯函数 ──

test('F1 完整已完成书（copyCount=1, copiedWords=T）：一字不蚀', () => {
  const bs = { copyCount: 1, copiedWords: 10000 };
  const actual = applyCycleSafeWordLoss(bs, 10000, 1500);
  assertEq(actual, 0, '实际损失');
  assertEq(bs.copiedWords, 10000, 'copiedWords');
});

test('F2 重抄中（T+20%）：损失全部吃当前周期进度', () => {
  const bs = { copyCount: 1, copiedWords: 12000 };
  const actual = applyCycleSafeWordLoss(bs, 10000, 1800);
  assertEq(actual, 1800, '实际损失');
  assertEq(bs.copiedWords, 10200, 'copiedWords');
});

test('F3 重抄初期（T+10%）：损失大于当前进度时到地板为止', () => {
  const bs = { copyCount: 1, copiedWords: 11000 };
  const actual = applyCycleSafeWordLoss(bs, 10000, 1800);
  assertEq(actual, 1000, '实际损失');
  assertEq(bs.copiedWords, 10000, 'copiedWords');
});

test('F4 首抄中（copyCount=0）：无地板，行为同旧', () => {
  const bs = { copyCount: 0, copiedWords: 5000 };
  const actual = applyCycleSafeWordLoss(bs, 10000, 2000);
  assertEq(actual, 2000, '实际损失');
  assertEq(bs.copiedWords, 3000, 'copiedWords');
});

// ── completeBook 状态回写 ──
// book_026 实数据 totalWords = 2388（与 test-repair-session 同源）

test('B1 非首通完成也回写 status=completed（不再卡「誊抄中 0%」）', () => {
  // 模拟正当重抄完成后的状态：copyCount 已 +1 由 completeBook 内部做，这里给前置态
  state.books['book_026'] = {
    copyCount: 1, copiedWords: 4776, status: 'copying', masteryLevel: 1,
    unlockedChapters: [1], damaged: false, repairWords: 0, repairProgress: 0
  };
  let r = null;
  try { r = completeBook('book_026'); }
  catch (e) { if (!/Audio is not defined/.test(e.message)) throw e; r = { ok: true }; }
  if (!r) throw new Error('completeBook 返回 null');
  assertEq(state.books['book_026'].status, 'completed', 'status');
  assertEq(state.books['book_026'].copyCount, 2, 'copyCount');
  state.diaryLogs = []; // 清掉本条 book_complete 日记，不干扰 F5 计数
});

// ── 图南完整经历回放（地板后世界）──

function freshTunanBook() {
  // 地板规则下灾厄后的书：字没少（copyCount 周期完整），只挂 damaged 标 + 修复工时
  state.books['book_026'] = {
    copyCount: 1, copiedWords: 2388, status: 'completed', masteryLevel: 1,
    damaged: true, repairWords: 358, repairProgress: 0,
    unlockedChapters: [1]
  };
  state.diaryLogs = [];
}

function runSession(minutes) {
  state.currentSession = {
    active: true, bookId: 'book_026', elapsedSeconds: minutes * 60,
    paused: false, teaBoost: false, mode: 'stopwatch', targetMinutes: 0, speedMultiplier: 1
  };
  try { return completeFocus(false); } catch (e) {
    if (!/Audio is not defined/.test(e.message)) throw e;
    return { ok: true };
  }
}

test('F5 菜根谭回放：损坏的书字不蚀底，修复后短专注不再触发伪「重抄完成」', () => {
  freshTunanBook();
  // 修复会话（10 分钟 ≈ 1020 字 ≫ 358 字修复量）
  const r1 = runSession(10);
  const bs = state.books['book_026'];
  assertEq(bs.damaged, false, '修复后 damaged');
  assertEq(bs.copiedWords, 2388, '修复蚀底检查：copiedWords 一字未少');
  assertEq(bs.status, 'completed', 'status 保持 completed（不再降 copying）');
  if (r1 && r1.bookProgressResult && r1.bookProgressResult.completion) {
    throw new Error('修复会话竟触发了誊抄完成');
  }
  // 修复后玩家又开了两次短专注（自然行为：2040 字 < 2388 总字数），不应凭空完成第二周期
  runSession(10);
  runSession(10);
  assertEq(state.books['book_026'].copyCount, 1, 'copyCount 未被顶高');
  assertEq(state.books['book_026'].masteryLevel, 1, 'masteryLevel 未被顶高');
  const bad = (state.diaryLogs || []).filter(e => e.type === 'book_complete');
  if (bad.length > 0) throw new Error(`墨墨日志出现 ${bad.length} 条伪 book_complete`);
});

test('F6 正向对照：真写满一个周期的字数，正常完成第二抄且状态回写 completed', () => {
  freshTunanBook();
  state.books['book_026'].damaged = false; // 已修复
  state.books['book_026'].repairWords = 0;
  // 24 分钟 ≈ 2400 字 ≥ 2388，正当完成第二抄
  const r = runSession(24);
  const bs = state.books['book_026'];
  assertEq(bs.copyCount, 2, 'copyCount');
  assertEq(bs.status, 'completed', '完成后 status 立即 completed（不靠刷新迁移兜底）');
  assertEq(bs.copiedWords, 4776, 'copiedWords = 2 周期');
  if (!r || !r.bookProgressResult || !r.bookProgressResult.completion) {
    throw new Error('正当完成未触发 completion');
  }
});

console.log(`\ndamage-cycle-floor：${passed} 通过, ${failed} 失败`);
if (failed > 0) {
  failures.forEach(f => console.error('  ✗ ' + f));
  process.exit(1);
}
