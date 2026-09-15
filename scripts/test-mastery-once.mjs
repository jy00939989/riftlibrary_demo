#!/usr/bin/env node
// 熟练度一次成典藏（2026-09-15 图南拍板）测试
// 覆盖：首通即 Lv5（取消两档）/重抄不再承载解锁/noMastery 书（分卷/典藏）不参与/
//       unlockReCopy 核心层闸（UI 置灰之外的防御）/迁移 v12 老档追溯升满
// 用法：node scripts/test-mastery-once.mjs

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
const { completeBook, unlockReCopy } = await import('../js/core/book-progress.js');
const { canBookBeRecopied, isNoMasteryBook } = await import('../js/core/book-eligibility.js');

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { console.log(`  ✅ ${msg}`); pass++; }
  else { console.log(`  ❌ ${msg}`); fail++; }
}

function freshBooks() {
  // 普通书（book_001 默认 unlocked）+ 分卷书（book_030_vol1 默认 locked）
  state.books = {
    book_001: { unlockedChapters: [1], copyCount: 0, masteryLevel: 0, copiedWords: 0, status: 'unlocked', starred: false, damaged: false, repairWords: 0, repairProgress: 0, readChapters: [], reCopyUnlocked: false },
    book_030_vol1: { unlockedChapters: [1], copyCount: 0, masteryLevel: 0, copiedWords: 0, status: 'unlocked', starred: false, damaged: false, repairWords: 0, repairProgress: 0, readChapters: [], reCopyUnlocked: false }
  };
  state.inspiration = 10;
  state.manuscriptBox = [];
  state.library.shelves = [[null, null, null, null, null]];
  state.library.manuscriptSlots = 5;
  state.history = [];
  state.diaryLogs = [];
}

// ═══ 1. 首通即满熟练（一次成典藏）═══
console.log('\n=== 1. 一次成典藏 ===');
freshBooks();
const r1 = completeBook('book_001');
assert(r1 && r1.isFirstCompletion && r1.masteryLevel === 5, '首次完成 → 熟练度直接 Lv5');
assert(state.books.book_001.masteryLevel === 5 && state.books.book_001.copyCount === 1, '落库 Lv5 · copyCount 1');
// 重抄仍在：第二次完成不降级、不重复承载解锁
const r2 = completeBook('book_001');
assert(r2 && !r2.isFirstCompletion && r2.masteryLevel === 5 && state.books.book_001.copyCount === 2, '重抄完成 copyCount 2 · 保持 Lv5');

// ═══ 2. noMastery 书不参与 ═══
console.log('\n=== 2. 分卷/典藏不参与 ===');
assert(isNoMasteryBook('book_030_vol1'), '分卷单卷判定 noMastery');
const rv = completeBook('book_030_vol1');
assert(rv && !rv.masteryLevel && !state.books.book_030_vol1.masteryLevel, '分卷书完成不写熟练度');
assert(canBookBeRecopied('book_001', state.books.book_001) === true, '普通完成书可重抄');
assert(canBookBeRecopied('book_030_vol1', state.books.book_030_vol1) === false, '分卷书不可重抄');

// ═══ 3. unlockReCopy 核心层闸 ═══
console.log('\n=== 3. unlockReCopy 防御 ===');
assert(unlockReCopy('book_030_vol1').ok === false, '分卷书 unlockReCopy 被拒');
assert(state.inspiration === 10 && state.books.book_030_vol1.reCopyUnlocked === false, '拒绝时不扣灵感不置位');
const u = unlockReCopy('book_001');
assert(u.ok && state.books.book_001.reCopyUnlocked === true && state.inspiration === 9, '普通书正常解锁（-1 灵感）');

// ═══ 4. 迁移 v12：老档追溯升满 ═══
console.log('\n=== 4. 迁移 v12 ===');
freshBooks();
state.books.book_001.status = 'completed';
state.books.book_001.copyCount = 1;
state.books.book_001.masteryLevel = 2; // 老档首通停留档
state.books.book_030_vol1.status = 'completed';
state.books.book_030_vol1.masteryLevel = 2; // noMastery 书的残留值不动
state._schemaVersion = 11;
runMigrations();
assert(state._schemaVersion === 12, 'schemaVersion 11 → 12');
assert(state.books.book_001.masteryLevel === 5, '老档普通书 Lv2 追溯升满 Lv5');
assert(state.books.book_030_vol1.masteryLevel === 2, 'noMastery 书不追溯');
runMigrations();
assert(state.books.book_001.masteryLevel === 5, '重复迁移幂等');

console.log(`\n${pass} 通过, ${fail} 失败`);
process.exit(fail > 0 ? 1 : 0);
