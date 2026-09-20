#!/usr/bin/env node
// 熟练度两次抄写（2026-09-20 图南重新拍板，推翻 9-15「一次成典藏」）测试
// 覆盖：masteryLevel 只取 1/2（2026-09-20 图南拍板）——首通=1 在架（誊抄完成并上架）/重抄 1 次=2 典藏（轶事/书评/典藏封面/金光/增益）/
//       noMastery 书（分卷/典藏）不参与/unlockReCopy 核心层闸/迁移 v14 撤销 v12 追溯 + v15 旧值重映射（2→1, 5→2）
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

// ═══ 1. 两次抄写：首通上架档 → 重抄成典藏 ═══
console.log('\n=== 1. 两次抄写 ===');
freshBooks();
const r1 = completeBook('book_001');
assert(r1 && r1.isFirstCompletion && r1.masteryLevel === 1, '首次完成 → 1 在架（非典藏）');
assert(state.books.book_001.masteryLevel === 1 && state.books.book_001.copyCount === 1, '落库 1 · copyCount 1');
// 重抄承载典藏解锁：第二次完成 → 2
const r2 = completeBook('book_001');
assert(r2 && !r2.isFirstCompletion && r2.masteryLevel === 2 && state.books.book_001.copyCount === 2, '重抄 1 次完成 → 2 典藏');

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
console.log('\n=== 4. 迁移 v14 撤销追溯 ===');
freshBooks();
state.books.book_001.status = 'completed';
state.books.book_001.copyCount = 1;
state.books.book_001.masteryLevel = 2; // 老档首通停留档
state.books.book_002 = { ...state.books.book_001, copyCount: 2, masteryLevel: 5 }; // 真典藏（重抄过）
state.books.book_030_vol1.status = 'completed';
state.books.book_030_vol1.masteryLevel = 2; // noMastery 书的残留值不动
state._schemaVersion = 11;
runMigrations();
assert(state._schemaVersion === 15, 'schemaVersion 11 → 15');
assert(state.books.book_001.masteryLevel === 1, '全链迁移后首通书=1 在架（v12升满→v14回落→v15重映射）');
assert(state.books.book_002 && state.books.book_002.masteryLevel === 2, '真典藏（copyCount≥2）=2 典藏');
assert(state.books.book_030_vol1.masteryLevel === 2, 'noMastery 书字段不被迁移触碰');
runMigrations();
assert(state.books.book_001.masteryLevel === 1 && state.books.book_002.masteryLevel === 2, '重复迁移幂等');

// ── 日记模板档位回归（2026-09-20）：档位按 copyCount 分（旧 tierMap 按 mastery 分 → 首通误报「第三遍」，图南 8080 实测逮获）──
const { generateDiaryEntry } = await import('../js/diary.js');
const s1 = Array.from({ length: 40 }, () => generateDiaryEntry('book_complete', { title: '传习录', copyCount: 1, mastery: 1 }));
assert(s1.every(s => !s.includes('第三遍') && !s.includes('第四遍') && !s.includes('第五遍')), '首通日记不再出现「第三/四/五遍」文案');
const s3 = Array.from({ length: 40 }, () => generateDiaryEntry('book_complete', { title: '传习录', copyCount: 3, mastery: 2 })); // 第三次誊抄必已典藏
assert(s3.every(s => s.includes('第三遍')), '第三次誊抄日记稳定命中第三遍档');

console.log(`\n${pass} 通过, ${fail} 失败`);
process.exit(fail > 0 ? 1 : 0);
