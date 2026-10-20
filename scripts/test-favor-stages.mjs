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
const { state } = await import('../js/state.js');
const { runMigrations } = await import('../js/state/migrations.js');

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

// ── 好感追溯回填（铁证版，2026-10-17 图南拍板）──
// 叙事事件是历史好感的铁证：偶层完成过 ≥120 / 稀层触发过 ≥280 / 终局后触发过 ≥560，取最大者，只抬不压。

function freshNarratives() {
  state.visitorFavors = { peizhou: 0, shenmingyuan: 0, xiachan: 5, jiangyoushu: 400 };
  state.visitorNarratives = {
    peizhou: { occasionalCompleted: ['ev1'], rareTriggered: true, postRareTriggered: false },
    shenmingyuan: { occasionalCompleted: [], rareTriggered: false, postRareTriggered: true },
    xiachan: { occasionalCompleted: ['ev1', 'ev2'], rareTriggered: false, postRareTriggered: false },
    jiangyoushu: { occasionalCompleted: ['ev1'], rareTriggered: false, postRareTriggered: false }
  };
}

test('M1 回填三档铁证', () => {
  freshNarratives();
  runMigrations();
  assertEq(state.visitorFavors.peizhou, 280, '稀层触发过 → 280（压过偶层的 120）');
  assertEq(state.visitorFavors.shenmingyuan, 560, '终局后触发过 → 560');
  assertEq(state.visitorFavors.xiachan, 120, '仅偶层完成过 → 120（从 5 抬升）');
});

test('M2 只抬不压：当前值高于证明值保持不动', () => {
  freshNarratives();
  runMigrations();
  assertEq(state.visitorFavors.jiangyoushu, 400, '当前 400 > 偶层证明 120 → 不压');
});

test('M3 幂等：重复迁移结果一致', () => {
  freshNarratives();
  runMigrations();
  const snapshot = JSON.stringify(state.visitorFavors);
  runMigrations();
  assertEq(JSON.stringify(state.visitorFavors), snapshot, '二次迁移不漂移');
});

test('M4 无叙事记录的角色不动', () => {
  freshNarratives();
  delete state.visitorNarratives.peizhou;
  state.visitorFavors.peizhou = 33;
  runMigrations();
  assertEq(state.visitorFavors.peizhou, 33, '无铁证不抬');
});

// ── 常层铁证阶梯（2026-10-20 图南拍板）：每条常层 ×12，封顶 100 ──
// 背景：5-27 起拒建键 bug 使偶层以上事件全档从未触发，旧阶梯无凭可捞；
// 常层事件（还书 40% 触发）是唯一幸存历史记录：每条 ≈ 2.5 次还书 × 5 好感 ≈ 12。

function freshCommonNarratives() {
  state.visitorFavors = { guyu: 48, jiangyoushu: 0, xierugui: 0, wangxiaolei: 0, peizhou: 0, shenmingyuan: 0 };
  state.visitorNarratives = {
    jiangyoushu: { commonTriggered: ['a1','a2','a3','a4','a5'] },
    xierugui: { commonTriggered: ['x1'] },
    wangxiaolei: { commonTriggered: Array.from({length: 9}, (_, i) => `w${i}`) },
    peizhou: { commonTriggered: ['p1','p2'], occasionalCompleted: ['e1'] },
    shenmingyuan: { commonTriggered: ['s1','s2','s3','s4'] }
  };
}

test('M5 常层铁证：条数 ×12，封顶 100', () => {
  freshCommonNarratives();
  runMigrations();
  assertEq(state.visitorFavors.jiangyoushu, 60, '5 条常层 → 60');
  assertEq(state.visitorFavors.xierugui, 12, '1 条常层 → 12');
  assertEq(state.visitorFavors.wangxiaolei, 100, '9 条 ×12=108 → 封顶 100');
});

test('M6 常层与现值/高阶铁证取最大', () => {
  freshCommonNarratives();
  runMigrations();
  assertEq(state.visitorFavors.guyu, 48, '便签现值 48 > 常层证明 24 → 不压');
  assertEq(state.visitorFavors.peizhou, 120, '偶层铁证 120 压过常层 24');
  assertEq(state.visitorFavors.shenmingyuan, 48, '4 条常层 → 48');
});

test('M7 常层回填幂等', () => {
  freshCommonNarratives();
  runMigrations();
  const snapshot = JSON.stringify(state.visitorFavors);
  runMigrations();
  assertEq(JSON.stringify(state.visitorFavors), snapshot, '二次迁移不漂移');
});

console.log(`\nfavor-stages：${passed} 通过, ${failed} 失败`);
if (failed > 0) {
  failures.forEach(f => console.error('  ✗ ' + f));
  process.exit(1);
}
