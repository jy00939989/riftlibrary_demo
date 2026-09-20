#!/usr/bin/env node
// 书籍灾难批次二（2026-09-20「清了剩余」）回归测试
// 覆盖五件新事件：蛀虫（冷门/叠级/借阅通风）/ 墨水打翻（放弃链/只削字数/冷却）/
//   积灰（挡借阅/掸灰/风净）/ 窃书（失窃/寻回带损）/ 台风波及（阶段免疫/窗棂/谷雨）+ 总闸与免疫
// 确定性手法：Math.random 队列（默认 0.9999=全不命中，按需注入小值）；单本 completed 书房态
// 用法：node scripts/test-disasters-batch2.mjs

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
const { BOOKS } = await import('../data/books.js');
const dis = await import('../js/core/disasters.js');
const { getCompletedBooks } = await import('../js/visitors.js');
const { getSettings, setSetting } = await import('../js/settings.js');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('  ✗', label); }
}

// ── 确定性随机：队列注入，默认 0.9999（一切概率判定不命中）──
const randQueue = [];
Math.random = () => (randQueue.length ? randQueue.shift() : 0.9999);
function seq(...vals) { randQueue.length = 0; randQueue.push(...vals); }

const DAY = 86400000;
const BOOK_ID = 'book_011'; // 道德经 3468 字

function freshLibrary() {
  state.books = {};
  state.visitors = [];
  state.signboards = [];
  state.restorationBox = [];
  state.library = { atmosphere: 0, borrowLevel: 0, shelves: [[null, null, null, null, null]] };
  delete state.lastRatTime; delete state.lastMoldTime; delete state.lastFireTime;
  delete state.lastWormTime; delete state.lastInkTime; delete state.lastDustTime; delete state.lastTheftTime;
  setSetting('disastersEnabled', true);
}
function completeOne(words = 3468) {
  state.books[BOOK_ID] = { status: 'completed', copiedWords: words, readChapters: [] };
  return state.books[BOOK_ID];
}

// ── 1. 总闸：设置关闭时全静默 ──
freshLibrary(); completeOne();
setSetting('disastersEnabled', false);
ok(dis.tryTriggerBookDisasters(null).length === 0, '总闸关闭：tick 零事件');
state.currentSession = { bookId: BOOK_ID };
ok(dis.maybeTriggerInkSpill() === null, '总闸关闭：墨水也不触发');
ok(dis.tryTriggerTyphoonBookDamage({ savedByGuyu: false }) === null, '总闸关闭：台风书籍不波及');
setSetting('disastersEnabled', true);

// ── 2. 免疫：修缮箱中的书不受灾 ──
freshLibrary(); const bs2 = completeOne();
state.restorationBox.push(BOOK_ID);
seq(0, 0, 0, 0, 0); // 五个概率判定全开也选不中
ok(dis.tryTriggerBookDisasters(null).length === 0, '修缮箱免疫：全命中队列也零事件');
ok(!bs2.damaged && !bs2.dustyAt && !bs2.stolenAt, '修缮箱书无灾难状态');
state.restorationBox = [];

// ── 3. 蛀虫：冷门命中 → 等级叠加 → 借阅通风语义 ──
freshLibrary(); const bs3 = completeOne();
// 队列：rat/mold/fire/worm? 顺序 rat→mold→fire→worm→dust→theft
// [0]rat败 [1]mold败 [2]fire败 [3]worm中 [4][5]损失率
seq(0.9999, 0.9999, 0.9999, 0, 0.5, 0.5);
const r3 = dis.tryTriggerBookDisasters(null);
ok(r3.some(r => r.kind === 'worm'), '蛀虫命中冷门书');
ok(bs3.wormLevel === 1, '蛀虫 1 级');
ok(bs3.damaged === true, '蛀虫打受损标（需修复）');
const expectLoss3 = Math.round(3468 * (0.01 + (0.5 * 0.02)));
ok(bs3.copiedWords === 3468 - expectLoss3, `蛀虫损失≈2%（实际 ${3468 - bs3.copiedWords}）`);
// 修复后 wormLevel 归零由 book-progress 负责（本测试不引专注链）；此处验证借阅通风的**契约**：
// lastBorrowedAt=now 后 pickColdBooks 不再选中
bs3.damaged = false; bs3.repairWords = 0; bs3.copiedWords = 3468;
bs3.lastBorrowedAt = Date.now(); bs3.wormLevel = 2; // 模拟刚被借阅
seq(0.9999, 0.9999, 0.9999, 0, 0.5, 0.5); // worm 判定给中，但无冷门书
ok(dis.tryTriggerBookDisasters(null).length === 0, '刚借阅的书不再中蛀虫（通风契约）');

// ── 4. 墨水打翻：只削字数、无受损标、有冷却 ──
freshLibrary(); const bs4 = completeOne();
bs4.status = 'copying'; bs4.copiedWords = 1000;
state.currentSession = { bookId: BOOK_ID };
seq(0.01); // 命中 0.06 概率
const ink = dis.maybeTriggerInkSpill();
ok(ink && ink.kind === 'ink', '墨水打翻命中');
ok(bs4.damaged !== true, '墨水不打破损标');
const inkLoss = 1000 - bs4.copiedWords;
ok(inkLoss >= 30 && inkLoss <= 50, `墨水损失 3-5%（实际 ${inkLoss}）`);
seq(0.01);
ok(dis.maybeTriggerInkSpill() === null, '墨水冷却期内不重复');
state.currentSession = { bookId: null };
ok(dis.maybeTriggerInkSpill() === null, '无当前书不触发墨水');

// ── 5. 积灰：挡住借阅 → 掸灰恢复 → 到期风净 ──
freshLibrary(); const bs5 = completeOne();
// rat[0]mold[1]fire[2]worm[3] 全败，dust[4]中，选书[5]
seq(0.9999, 0.9999, 0.9999, 0.9999, 0, 0);
const r5 = dis.tryTriggerBookDisasters(null);
ok(r5.some(r => r.kind === 'dust'), '积灰命中');
ok(!!bs5.dustyAt, '积灰落状态');
ok(getCompletedBooks().length === 0, '积灰书退出借阅池');
ok(dis.cleanBookDust(BOOK_ID) === true, '掸灰成功');
ok(!bs5.dustyAt && getCompletedBooks().length === 1, '掸灰后恢复可借');
// 到期风净：重新积灰再放到 4 天前（先清 8 小时冷却，属设计内行为）
delete state.lastDustTime;
seq(0.9999, 0.9999, 0.9999, 0.9999, 0, 0);
dis.tryTriggerBookDisasters(null);
ok(!!bs5.dustyAt, '再次积灰');
bs5.dustyAt = Date.now() - 4 * DAY;
dis.tryTriggerBookDisasters(null); // sweep 清扫（全败队列）
ok(!bs5.dustyAt, '到期风吹自净');

// ── 6. 窃书：失窃退池 → 到期寻回带 15% 损失 ──
freshLibrary(); const bs6 = completeOne();
// rat[0]mold[1]fire[2]worm[3]dust[4] 全败，theft[5]中
seq(0.9999, 0.9999, 0.9999, 0.9999, 0.9999, 0);
const r6 = dis.tryTriggerBookDisasters(null);
ok(r6.some(r => r.kind === 'theft'), '窃书命中');
ok(!!bs6.stolenAt && bs6.stolenReturnAt > Date.now(), '失窃状态+寻回期限');
ok(getCompletedBooks().length === 0, '失窃书退出借阅池');
bs6.stolenReturnAt = Date.now() - 1000; // 到期
dis.tryTriggerBookDisasters(null);
ok(!bs6.stolenAt && !bs6.stolenReturnAt, '寻回后失窃状态清除');
ok(bs6.damaged === true, '寻回带损（15%→受损标）');
const backLoss = Math.round(3468 * 0.15);
ok(bs6.copiedWords === 3468 - backLoss, `寻回损失 15%（实际 ${backLoss}）`);

// ── 7. 台风波及：低阶馆舍受灾 → 阶段免疫 → 密封窗棂 → 谷雨减半 ──
freshLibrary(); const bs7 = completeOne();
state.library.atmosphere = 0; // 1 阶
seq(0, 0.9999, 0.5, 0.5); // hitChance 中；无窗棂；损失率
const tb = dis.tryTriggerTyphoonBookDamage({ savedByGuyu: false });
ok(tb && tb.kind === 'typhoon_books', '低阶馆舍台风波及');
ok(bs7.damaged === true, '台风水浸打破损标');
const tbLoss = 3468 - bs7.copiedWords;
ok(tbLoss >= Math.round(3468 * 0.10) && tbLoss <= Math.round(3468 * 0.20), `台风损失 10-20%（实际 ${tbLoss}）`);
// 阶段免疫
freshLibrary(); const bs7b = completeOne();
state.library.atmosphere = 5600; // 5 阶
seq(0);
ok(dis.tryTriggerTyphoonBookDamage({ savedByGuyu: false }) === null, '5 阶建筑稳固免疫');
ok(!bs7b.damaged, '免疫书无损');
// 密封窗棂
freshLibrary(); const bs7c = completeOne();
state.library.atmosphere = 0;
state.signboards.push('sealed_window');
seq(0, 0.5); // hitChance 中；窗棂 80% 挡下（0.5<0.8）
ok(dis.tryTriggerTyphoonBookDamage({ savedByGuyu: false }) === null, '密封窗棂挡下');
// 谷雨抢救：损失减半
freshLibrary(); const bs7d = completeOne();
seq(0, 0.5, 0.5); // hitChance 中；无窗棂；损失率
const tb2 = dis.tryTriggerTyphoonBookDamage({ savedByGuyu: true });
ok(tb2 && tb2.saveBy === 'guyu', '谷雨抢救标记');
const guyuLoss = 3468 - bs7d.copiedWords;
ok(guyuLoss >= Math.round(3468 * 0.05) && guyuLoss <= Math.round(3468 * 0.10), `谷雨减半损失（实际 ${guyuLoss}）`);

// ── 8. 新标志牌入库 ──
const { SIGNBOARDS } = await import('../data/signboards.js');
ok(!!SIGNBOARDS.camphor_bookmark && SIGNBOARDS.camphor_bookmark.buff.target === 'worm', '樟木书签入库');
ok(!!SIGNBOARDS.sealed_window && SIGNBOARDS.sealed_window.buff.target === 'typhoon_books', '密封窗棂入库');

console.log(`\ndisasters-batch2：${pass} 通过，${fail} 失败`);
process.exit(fail ? 1 : 0);
