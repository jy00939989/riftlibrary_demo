#!/usr/bin/env node
// 好感阶段可视化回归（2026-10-17 图南「好感显示要做一下」）
// 覆盖：getFavorStage 档位边界（0/119/120/279/280/559/560/600/越界钳制）/
//       档内百分比 / 距下一档 / isMax / FAVOR_STAGES 与 FAVOR_THRESHOLDS 对齐
// 用法：node scripts/test-favor-stages.mjs

// ── Node 环境浏览器桩（visitors.js 链会触碰 DOM/Audio，桩住即可）──
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

const { getFavorStage, FAVOR_STAGES, FAVOR_THRESHOLDS, FAVOR_CAP } = await import('../js/visitors.js');

let passed = 0, failed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; failures.push(`${name}: ${e.message}`); }
}
function assertEq(actual, expected, label = '') {
  if (actual !== expected) throw new Error(`${label} 期望 ${expected}，实际 ${actual}`);
}

test('S0 档位表与叙事阈值对齐（ADR-FAVOR-001）', () => {
  assertEq(FAVOR_STAGES.length, 4, '四档');
  assertEq(FAVOR_STAGES[0].floor, 0, '档0 floor');
  assertEq(FAVOR_STAGES[0].next, FAVOR_THRESHOLDS.OCCASIONAL, '档0 next=120');
  assertEq(FAVOR_STAGES[1].next, FAVOR_THRESHOLDS.RARE, '档1 next=280');
  assertEq(FAVOR_STAGES[2].next, FAVOR_THRESHOLDS.POST_RARE, '档2 next=560');
  assertEq(FAVOR_STAGES[3].next, FAVOR_CAP, '档3 next=600');
});

test('S1 边界值落档', () => {
  assertEq(getFavorStage(0).idx, 0, '0→档0');
  assertEq(getFavorStage(119).idx, 0, '119→档0');
  assertEq(getFavorStage(120).idx, 1, '120→档1（偶层解锁）');
  assertEq(getFavorStage(279).idx, 1, '279→档1');
  assertEq(getFavorStage(280).idx, 2, '280→档2（稀层解锁）');
  assertEq(getFavorStage(559).idx, 2, '559→档2');
  assertEq(getFavorStage(560).idx, 3, '560→档3（终局后）');
  assertEq(getFavorStage(600).idx, 3, '600→档3');
});

test('S2 档内百分比', () => {
  assertEq(getFavorStage(0).pct, 0, '档0 起点 0%');
  assertEq(getFavorStage(60).pct, 50, '档0 中点 50%');
  assertEq(getFavorStage(120).pct, 0, '新档起点归零');
  assertEq(getFavorStage(200).pct, 50, '档1 中点 50%（(200-120)/160）');
  assertEq(getFavorStage(420).pct, 50, '档2 中点 50%（(420-280)/280）');
  assertEq(getFavorStage(580).pct, 50, '档3 中点 50%（(580-560)/40）');
  assertEq(getFavorStage(600).pct, 100, '满值 100%');
});

test('S3 距下一档与满值标记', () => {
  assertEq(getFavorStage(0).toNext, 120, '0→120 差 120');
  assertEq(getFavorStage(119).toNext, 1, '119 差 1');
  assertEq(getFavorStage(280).toNext, 280, '280→560 差 280');
  assertEq(getFavorStage(600).isMax, true, '600 满值');
  assertEq(getFavorStage(600).toNext, 0, '满值无下一档');
  assertEq(getFavorStage(599).isMax, false, '599 未满');
});

test('S4 越界钳制', () => {
  assertEq(getFavorStage(99999).favor, 600, '超上限钳到 600');
  assertEq(getFavorStage(99999).isMax, true, '钳后满值');
  assertEq(getFavorStage(-50).favor, 0, '负数钳到 0');
  assertEq(getFavorStage(undefined).favor, 0, 'undefined 视为 0');
  assertEq(getFavorStage(NaN).favor, 0, 'NaN 视为 0');
});

console.log(`\nfavor-stages：${passed} 通过, ${failed} 失败`);
if (failed > 0) {
  failures.forEach(f => console.error('  ✗ ' + f));
  process.exit(1);
}
