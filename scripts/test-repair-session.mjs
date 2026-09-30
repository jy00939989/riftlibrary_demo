#!/usr/bin/env node
// 修复会话伪典藏漏洞回归（2026-09-30 玩家报告 + 探针实证）
// 漏洞：已上架的书（copyCount≥1）损坏后，修复专注的字数走 applyWords——
//       effectiveWords = copiedWords % totalWords 回卷为 0，累计过 totalWords 触发伪「重抄完成」
//       → copyCount+1 → masteryLevel 2 典藏，以及笔类道具对损坏书加字数同样可触发。
// 修复：completeFocus 纯修复会话跳过 applyWords/completeBook；timer tick 跳过誊抄自动完成判定；
//       isBookEligibleForBrush 排除损坏书。
// 用法：node scripts/test-repair-session.mjs

// ── Node 环境浏览器桩（completeFocus 链会触碰 DOM/Audio，桩住即可）──
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
const { completeFocus } = await import('../js/core/focus-session.js');
const { isBookEligibleForBrush } = await import('../js/core/book-eligibility.js');

let passed = 0, failed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; failures.push(`${name}: ${e.message}`); }
}
function assertEq(actual, expected, label = '') {
  if (actual !== expected) throw new Error(`${label} 期望 ${expected}，实际 ${actual}`);
}

function freshShelvedDamaged() {
  state.books['book_026'] = {
    copyCount: 1, copiedWords: 2388, status: 'completed', masteryLevel: 1,
    damaged: true, repairWords: 1500, repairProgress: 0,
    unlockedChapters: [1]
  };
}
state.focus = { totalWords: 0, totalMinutes: 0, streak: 1 };
state.library = {};
state.exhibition = { rooms: {} };
state.plants = [];
state.visitors = [];
state.guideQuests = { allCompleted: true };

function runSession(minutes) {
  state.currentSession = {
    active: true, bookId: 'book_026', elapsedSeconds: minutes * 60,
    paused: false, teaBoost: false, mode: 'stopwatch', targetMinutes: 0, speedMultiplier: 1
  };
  try { return completeFocus(false); } catch (e) {
    // 链尾音效在 Node 无 Audio 会抛（浏览器无碍），进度逻辑已执行完
    if (!/Audio is not defined/.test(e.message)) throw e;
    return { ok: true };
  }
}

test('R1 已上架书修复：誊抄进度零推进（复制的字数不累积）', () => {
  freshShelvedDamaged();
  runSession(20);
  const bs = state.books['book_026'];
  assertEq(bs.copyCount, 1, 'copyCount');
  assertEq(bs.masteryLevel, 1, 'masteryLevel');
  assertEq(bs.copiedWords, 2388, 'copiedWords');
});

test('R2 已上架书修复：修复进度照常在走', () => {
  freshShelvedDamaged();
  runSession(20);
  const bs = state.books['book_026'];
  if (!(bs.repairProgress > 0 || bs.damaged === false)) throw new Error('修复无推进');
});

test('R3 修复满后书恢复未损坏，后续誊抄才算真重抄', () => {
  freshShelvedDamaged();
  runSession(20); // 修满（2040 ≥ 1500）
  assertEq(state.books['book_026'].damaged, false, '修满后 damaged');
  runSession(20); // 未损坏的已上架书 = 正常重抄推进
  assertEq(state.books['book_026'].copyCount, 1, '一次推进不越级');
  if (!(state.books['book_026'].copiedWords > 2388)) throw new Error('重抄无推进');
});

test('R4 笔类道具目标：损坏书一律不可选（防同款伪完成）', () => {
  freshShelvedDamaged();
  assertEq(isBookEligibleForBrush('book_026', state.books['book_026']), false, '损坏的已上架书');
  state.books['book_026'].copyCount = 0; // 首次抄写中的损坏书同样排除
  assertEq(isBookEligibleForBrush('book_026', state.books['book_026']), false, '损坏的未上架书');
  state.books['book_026'].damaged = false;
  state.books['book_026'].status = 'completed';
  state.books['book_026'].copyCount = 1;
  assertEq(isBookEligibleForBrush('book_026', state.books['book_026']), true, '未损坏的已上架书可刷');
});

console.log(`\nrepair-session：${passed} 通过, ${failed} 失败`);
if (failed > 0) {
  failures.forEach(f => console.error('  ✗ ' + f));
  process.exit(1);
}
