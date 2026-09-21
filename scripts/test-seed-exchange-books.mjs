#!/usr/bin/env node
// 秘密花园种子兑换修复（2026-09-16）回归测试
// 锁死三件套：① 卷书奖励 rewardBookIds 一次发全卷（逐卷入箱、已拥有跳过）
//             ② 商店池不再含 book_034 两卷（种子兑换限定，同绿野仙踪/爱丽丝纪律）
//             ③ 迁移 v13 修复 soft-lock：旧档误发典藏版 → 回锁 + 补发两卷
//               （2026-09-21 加闸：copyCount/copiedWords/status 证明已合成的典藏版不回锁；
//                 回锁时直发版移出手稿箱腾格；测试每次重跑迁移须先置 _schemaVersion=12）
// 用法：node scripts/test-seed-exchange-books.mjs

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
function makeEl() {
  return {
    className: '', id: '', innerHTML: '', textContent: '', dataset: {}, style: {},
    querySelector: () => ({ addEventListener() {} }),
    querySelectorAll: () => [],
    addEventListener() {}, appendChild() {}, remove() {}
  };
}
globalThis.document = {
  body: { style: {}, appendChild() {} },
  documentElement: { style: {} },
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: makeEl,
};
globalThis.window = globalThis;
globalThis.Audio = class {
  play() { return new Promise(() => {}); }
  pause() {}
  addEventListener() {}
};

const { state } = await import('../js/state.js');
const { runMigrations } = await import('../js/state/migrations.js');
const plants = await import('../js/plants.js');
const { SHARED_POOL } = await import('../data/book_pool.js');

let pass = 0, fail = 0;
function assert(cond, name) {
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.log(`  FAIL ${name}`); }
}

// ── S1：商店池不再含秘密花园两卷 ──
const poolIds = SHARED_POOL.map(b => b.bookId);
assert(!poolIds.includes('book_034_vol1') && !poolIds.includes('book_034_vol2'),
  'S1a 商店池无秘密花园卷一/卷二');
assert(poolIds.includes('book_023') === false && poolIds.includes('book_024') === false,
  'S1b 绿野仙踪/爱丽丝也不在池中（同纪律对照）');

// ── S2：星光蕨兑换一次发全卷 ──
state.seeds['starlight_fern'] = 5;
state.manuscriptBox = [];
assert(plants.canExchangeSeed('starlight_fern', 0), 'S2a 5 颗星光蕨可兑换');
assert(plants.exchangeSeed('starlight_fern', 0), 'S2b 兑换成交');
const v1 = state.books['book_034_vol1'];
const v2 = state.books['book_034_vol2'];
assert(v1 && v1.status !== 'locked' && v2 && v2.status !== 'locked', 'S2c 两卷同时入档且非锁定');
assert(state.manuscriptBox.includes('book_034_vol1') && state.manuscriptBox.includes('book_034_vol2'),
  'S2d 两卷都进手稿箱');
assert(plants.canExchangeSeed('starlight_fern', 0) === false, 'S2e 全卷已拥有后不可重复兑换');
// 典藏版不应被直发（0 章不可抄，合成路径专属）
assert(!state.books['book_034'] || state.books['book_034'].status === 'locked',
  'S2f 兑换不发典藏版（合成路径专属）');

// ── S3：迁移 v13 修复 soft-lock（旧档误发典藏版 → 回锁+补卷）──
const s2 = await import('../js/state.js'); // 同 state 引用
// 受害者签名 = 旧直发：典藏版是 createBookRecord() 默认（全 0 / unlocked），两卷从未拥有
state.books['book_034'] = { status: 'unlocked', copiedWords: 0, copyCount: 0, masteryLevel: 0, damaged: false, repairWords: 0, repairProgress: 0 };
delete state.books['book_034_vol1'];
delete state.books['book_034_vol2'];
state._schemaVersion = 12;
runMigrations();
const col = state.books['book_034'];
assert(col.status === 'locked' && col.copiedWords === 0, 'S3a 典藏版回锁且进度清零');
assert(!(state.manuscriptBox || []).includes('book_034'), 'S3a2 回锁的典藏版移出手稿箱腾格');
assert(state.books['book_034_vol1'] && state.books['book_034_vol1'].status !== 'locked'
    && state.books['book_034_vol2'] && state.books['book_034_vol2'].status !== 'locked',
  'S3b 两卷补发到手');
// 幂等：版本归零重跑整条迁移链，不重复发卷
const boxCount = (state.manuscriptBox || []).filter(id => id === 'book_034_vol1').length;
state._schemaVersion = 12;
runMigrations();
const boxCount2 = (state.manuscriptBox || []).filter(id => id === 'book_034_vol1').length;
assert(boxCount === boxCount2, 'S3c 重复迁移幂等（卷一不重复入箱）');
// 正常合成路径（volumes.js 真实签名：典藏版 completed + copyCount>=1，两卷 locked 且不在箱）不被误伤
state.books['book_034'] = { status: 'completed', copiedWords: 500, copyCount: 1, masteryLevel: 2, damaged: false, repairWords: 0, repairProgress: 0 };
state.books['book_034_vol1'] = { status: 'locked', copiedWords: 0, copyCount: 0, masteryLevel: 0, damaged: false, repairWords: 0, repairProgress: 0 };
state.books['book_034_vol2'] = { status: 'locked', copiedWords: 0, copyCount: 0, masteryLevel: 0, damaged: false, repairWords: 0, repairProgress: 0 };
state.manuscriptBox = (state.manuscriptBox || []).filter(id => id !== 'book_034_vol1' && id !== 'book_034_vol2');
state._schemaVersion = 12;
runMigrations();
assert(state.books['book_034'].status === 'completed' && state.books['book_034'].copiedWords === 500,
  'S3d 正常合成路径的典藏版不受影响');
assert(state.books['book_034_vol1'].status === 'locked' && state.books['book_034_vol2'].status === 'locked',
  'S3e 正常合成路径的两卷保持 locked 不重复补发');

console.log(`\n秘密花园兑换修复回归：${pass} 过 ${fail} 挂`);
process.exit(fail ? 1 : 0);
