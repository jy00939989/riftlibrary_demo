#!/usr/bin/env node
// 墨墨日志页码计数器回归测试（无浏览器环境，mock localStorage/DOM/Audio）
// 锁死 2026-09-16 「日志页码卡死在 31」修复（7f8bafd）：
//   旧代码页码 = diaryLogs.length + 1，日志只保留 30 条、length 封顶后页码永锁 31。
//   修复后：单调递增计数器 state.diaryLogCounter，旧档满 30 条者从 31 起步续增。
// 用法：node scripts/test-diary-page-counter.mjs

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
  removeEventListener: () => {},
  createElement: () => ({ style: {}, classList: { add() {}, toggle() {} }, addEventListener() {}, appendChild() {}, remove() {} }),
};
globalThis.window = globalThis;
globalThis.Audio = class {
  constructor(src) { this.src = src; this.volume = 1; this.paused = true; }
  play() { return Promise.resolve(); }
  pause() { this.paused = true; }
  addEventListener() {}
  removeEventListener() {}
  setAttribute() {}
};

const { state } = await import('../js/state.js');
const diary = await import('../js/diary.js');

// 预领全部装帧等级奖励（30 条触发 Lv2 升级弹窗会走 import+setTimeout，测试里跳过该分支）
state.diaryLevelRewardsClaimed = [2, 3, 4];

let pass = 0, fail = 0;
function assert(cond, name) {
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.log(`  FAIL ${name}`); }
}

function pageOf(entry) {
  const m = entry.text.match(/第(\d+)页/);
  return m ? parseInt(m[1], 10) : null;
}
function addOne() {
  diary.addDiaryEntry('focus_complete', { minutes: 25 });
  return pageOf(state.diaryLogs[0]);
}

// ── S1：新档页码 1,2,3 单调递增 ──
assert(addOne() === 1, 'S1a 首篇页码 = 1');
assert(addOne() === 2, 'S1b 次篇页码 = 2');
assert(addOne() === 3, 'S1c 第三篇页码 = 3');

// ── S2：写满 30 条后页码继续 31/32/33，不再卡死（核心回归）──
for (let i = state.diaryLogs.length; i < 30; i++) addOne();
assert(state.diaryLogs.length === 30, 'S2a 日志条数封顶 30');
assert(addOne() === 31, 'S2b 第 31 篇页码 = 31');
assert(addOne() === 32, 'S2c 第 32 篇页码 = 32');
assert(addOne() === 33, 'S2d 第 33 篇页码 = 33');
assert(state.diaryLogs.length === 30, 'S2e 超出 30 条后仍只保留 30 条');

// ── S3：旧档迁移——满 30 条且无计数器，从 31 起步续增（不重用 31）──
state.diaryLogs = Array.from({ length: 30 }, () => ({ type: 'daily', text: '旧档占位', time: 0 }));
delete state.diaryLogCounter;
assert(addOne() === 32, 'S3a 满档旧档下一篇 = 32（跳过已展示过的 31）');
assert(addOne() === 33, 'S3b 续增 = 33');

// ── S4：旧档迁移——未满 30 条按条数续增 ──
state.diaryLogs = Array.from({ length: 25 }, () => ({ type: 'daily', text: '旧档占位', time: 0 }));
delete state.diaryLogCounter;
assert(addOne() === 26, 'S4a 25 条旧档下一篇 = 26');

// ── S5：计数器随存档落库（刷新后不回退重用页码）──
// 注意持久化层有 riftlib_ 前缀（persistence.js fullKey）
const saved = JSON.parse(store.get('riftlib_state_v2') || '{}');
assert(saved.diaryLogCounter === state.diaryLogCounter && saved.diaryLogCounter > 0,
  `S5a 计数器已持久化（riftlib_state_v2.diaryLogCounter=${saved.diaryLogCounter}）`);

console.log(`\n日志页码计数器回归：${pass} 过 ${fail} 挂`);
process.exit(fail ? 1 : 0);
