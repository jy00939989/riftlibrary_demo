#!/usr/bin/env node
// 保养预约（锁定待修，servicing-room-plan v3）回归测试
// 覆盖：容量公式/价目/封顶 · 升级冲抵防双付 · 打标(在馆locked/在借pending)/容量满拒绝 ·
//   还回兑现(pending→locked / 行内勾选原子落锁) · 还回损毁取消(R6) · 灾难免疫(P0 三过滤器) ·
//   借阅池排除 · 保养结算保持锁定 → 待回架 → 回架 · pending 死锁(intended) · 取消回池 · 扩容扣款 · 迁移
// 确定性手法：Math.random 队列（默认 0.9999=不命中）；真实 book id + 手工书房态
// 用法：node scripts/test-servicing.mjs

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

const { state, saveState } = await import('../js/state.js');
const { runMigrations } = await import('../js/state/migrations.js');
const { BOOKS } = await import('../data/books.js');
const cap = await import('../js/capacity.js');
const svc = await import('../js/core/servicing.js');
const dis = await import('../js/core/disasters.js');
const { getCompletedBooks, collectReturn, tickVisitorBrowsing } = await import('../js/visitors.js');
const { getMaintainableBooks, startMaintenanceSession, applyMaintenanceProgress } = await import('../js/core/maintenance.js');
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
const A = 'book_011'; // 道德经 3468 字
const B = 'book_001';
const C = 'book_002';
const ALL = [A, B, C];

function freshLibrary() {
  state.books = {};
  state.visitors = [];
  state.signboards = [];
  state.restorationBox = [];
  state.library = { atmosphere: 0, borrowLevel: 0, stage: 0, shelves: [[null, null, null, null, null]] };
  state.restorationUnlocked = true;
  state.restorationLevel = 0;
  state.servicingSlotsPurchased = 0;
  state.coins = 100000;
  delete state.lastRatTime; delete state.lastMoldTime; delete state.lastFireTime;
  delete state.lastWormTime; delete state.lastInkTime; delete state.lastDustTime; delete state.lastTheftTime;
  setSetting('disastersEnabled', true);
}
function completeOne(id, words = 3468) {
  state.books[id] = { status: 'completed', copiedWords: words, readChapters: [] };
  return state.books[id];
}
function dueVisitor(bookIds) {
  const now = Date.now();
  state.visitors = [{
    id: 'v1', charId: 'xiaoying', emoji: '🦊', name: '小萤', status: 'due',
    bookIds: [...bookIds], favorability: 0, borrowTime: now - DAY, dueTime: now - 1000
  }];
}

// 真实借出管线：browsing 访客走 tickVisitorBrowsing 全链（attemptBorrow 借出侧磨损自增在此触发）
// 调用前保证只有目标书在可借池；seq(0,0,0)=[借书判定过, 选书idx=0, 时长浮动]
function lendViaPipeline() {
  state.visitors = [{
    id: 'v1', charId: 'shenmingyuan', emoji: '🧑‍🏫', name: '沈教授', status: 'browsing',
    bookIds: [], bookId: null, bookTitle: null, favorability: 0,
    arriveTime: Date.now(), borrowTime: null, dueTime: null, eventTriggered: false
  }];
  seq(0, 0, 0);
  tickVisitorBrowsing(Date.now());
  return state.visitors[0];
}

// ═══ 1. 容量公式 / 价目 / 封顶 ═══
console.log('\n=== 1. 容量公式 ===');
freshLibrary();
ok(cap.getServicingSlots() === 2, '基础 2 格（Lv0）');
state.restorationLevel = 3;
ok(cap.getServicingSlots() === 5, '升级送格：Lv3 → 5 格');
state.servicingSlotsPurchased = 10;
ok(cap.getServicingSlots() === 6, '封顶 6 格');
state.servicingSlotsPurchased = 0; state.restorationLevel = 0;
ok(cap.getServicingSlotPrice() === 30, '第 3 格 30');
state.servicingSlotsPurchased = 1;
ok(cap.getServicingSlotPrice() === 80, '第 4 格 80');
state.servicingSlotsPurchased = 2;
ok(cap.getServicingSlotPrice() === 200, '第 5 格 200');
state.servicingSlotsPurchased = 3;
ok(cap.getServicingSlotPrice() === 500, '第 6 格 500');
state.servicingSlotsPurchased = 4;
ok(cap.getServicingSlotPrice() === 0, '满 6 不再出售');

// ═══ 2. 升级冲抵（防双付）═══
console.log('\n=== 2. 升级冲抵 ===');
freshLibrary();
state.servicingSlotsPurchased = 4;
ok(cap.getServicingSlots() === 6, 'Lv0 买满 4 格 → 总格 6');
const coinsBefore = state.coins;
ok(cap.upgradeRestorationLevel() === true, '修复室升级成功');
ok(state.restorationLevel === 1, '升到 Lv1');
ok(state.servicingSlotsPurchased === 3, '已购格被冲抵 4→3');
ok(cap.getServicingSlots() === 6, '总格全程保持 6（不缩水）');
ok(state.coins === coinsBefore - 400, '升级扣款 400');

// ═══ 3. 打标：在馆 locked / 在借 pending / 容量满拒绝 ═══
console.log('\n=== 3. 打标 ===');
freshLibrary();
const bsA = completeOne(A); bsA.wearCount = 5;
let r = svc.markServicing(A);
ok(r.ok && bsA.servicing === 'locked', '在馆打标 → 立即 locked');
ok(svc.getServicingUsed() === 1, 'locked 占 1 格');
r = svc.markServicing(A); // toggle 语义：重复打标走 canMark（servicing 已存在不拦）→ 这里直接验证取消
ok(svc.cancelServicing(A) === true && bsA.servicing === undefined, '取消 → 立即回池');
// 在借 → pending
dueVisitor([A]);
r = svc.markServicing(A, { lent: true });
ok(r.ok && bsA.servicing === 'pending', '在借打标 → pending');
ok(svc.getServicingUsed() === 1, 'pending 占 1 格（预订即占）');
svc.cancelServicing(A);
// 容量满拒绝
state.books[B] = { status: 'completed', copiedWords: 1000, readChapters: [], wearCount: 5 };
state.books[C] = { status: 'completed', copiedWords: 1000, readChapters: [], wearCount: 5 };
svc.markServicing(A); svc.markServicing(B);
r = svc.markServicing(C);
ok(!r.ok && r.reason === 'full', '2 格占满后第 3 本拒绝（full）');
// damaged / 典藏不可打标
state.books[C].damaged = true;
r = svc.markServicing(C);
ok(!r.ok && r.reason === 'damaged', 'damaged 不可打标');
svc.cancelServicing(A); svc.cancelServicing(B);

// ═══ 4. 还回兑现：pending→locked / 行内勾选原子落锁 ═══
console.log('\n=== 4. 还回兑现 ===');
freshLibrary(); completeOne(A).wearCount = 5; completeOne(B).wearCount = 5;
// 4a. 既有 pending：还回自动转 locked
dueVisitor([A]);
svc.markServicing(A, { lent: true });
seq(0.9999); // 损毁 roll 不命中 + 事件 0.6 不命中
let ret = collectReturn('v1');
ok(ret && ret.books[0].servicing === 'locked', 'pending 还回 → locked（兑现）');
ok(state.books[A].servicing === 'locked', '状态落库 locked');
ok(state.visitors.length === 0, '访客已离馆');
// 4b. 行内勾选：收取时原子落锁
dueVisitor([B]);
seq(0.9999);
ret = collectReturn('v1', [B]);
ok(ret && ret.books[0].servicing === 'locked', '勾选书收取 → 原子落锁');
ok(state.books[B].servicing === 'locked', '勾选状态落库');
// 4c. 未勾选不锁
completeOne(C).wearCount = 5;
dueVisitor([C]);
seq(0.9999);
ret = collectReturn('v1');
ok(ret && !state.books[C].servicing, '未勾选 → 不收锁');

// ═══ 5. 还回损毁 → 预约取消（R6 写死：绝不写 'locked'）═══
console.log('\n=== 5. 还回损毁取消 ===');
freshLibrary(); completeOne(A).wearCount = 9;
dueVisitor([A]);
svc.markServicing(A, { lent: true }); // pending
seq(0, 0.9999); // [0]损毁命中 [1]事件不命中
ret = collectReturn('v1');
ok(ret && ret.books[0].damaged === true, '损毁命中');
ok(state.books[A].servicing === undefined, 'pending 被清除（非 locked）');
ok(ret.books[0].servicing === 'cancelled', '返回 cancelled 标记供弹窗告知');
ok(svc.getServicingUsed() === 0, '格位释放');
// 勾选落锁 + 损毁命中 → 同样清
freshLibrary(); completeOne(A).wearCount = 9;
dueVisitor([A]);
seq(0, 0.9999);
ret = collectReturn('v1', [A]);
ok(ret.books[0].servicing !== 'locked' && state.books[A].servicing === undefined, '勾选书损毁 → 不落锁（无预订可取消）');

// ═══ 6. 灾难免疫（P0：三过滤器补 !bs.servicing）═══
console.log('\n=== 6. 灾难免疫 ===');
freshLibrary();
const bs6 = completeOne(A); bs6.wearCount = 5; bs6.servicing = 'locked';
seq(0, 0, 0, 0, 0, 0); // rat/mold/fire/worm/dust/theft 全开
const r6 = dis.tryTriggerBookDisasters(null);
ok(r6.length === 0, '锁定书：六灾全开也零事件');
ok(!bs6.damaged && !bs6.dustyAt && !bs6.stolenAt, '锁定书无任何灾难状态');
// pending 同样免疫
bs6.servicing = 'pending';
seq(0, 0, 0, 0, 0, 0);
ok(dis.tryTriggerBookDisasters(null).length === 0, 'pending 书同样免疫');
ok(!bs6.damaged && !bs6.stolenAt, 'pending 书无灾难状态');
// 对照组：无标记书照常被偷（theft 队列：rat[0]mold[1]fire[2]worm[3]dust[4]全败，theft[5]命中）
delete bs6.servicing;
seq(0.9999, 0.9999, 0.9999, 0.9999, 0.9999, 0, 0.5);
const r6b = dis.tryTriggerBookDisasters(null);
ok(r6b.some(x => x.kind === 'theft') && bs6.stolenAt, '无标记书失窃正常触发（对照组）');

// ═══ 7. 借阅池排除 ═══
console.log('\n=== 7. 借阅池排除 ===');
freshLibrary();
completeOne(A).wearCount = 5; completeOne(B).wearCount = 5;
ok(getCompletedBooks().length === 2, '两本均在池');
state.books[A].servicing = 'locked';
ok(getCompletedBooks().some(b => b.id === B) && !getCompletedBooks().some(b => b.id === A), 'locked 不在池、未锁照常在池');
state.books[A].servicing = 'pending';
ok(!getCompletedBooks().some(b => b.id === A), 'pending 不在池');

// ═══ 8. 保养结算保持锁定 → 待回架 → 回架 ═══
console.log('\n=== 8. 保养闭环 ===');
freshLibrary();
state.restorationLevel = 1; // 保养批次上限 Lv1→2，才能组建两本批
const bs8 = completeOne(A); bs8.wearCount = 7; bs8.servicing = 'locked';
const bs8b = completeOne(B); bs8b.wearCount = 3;
// 排序：locked 优先（即便 wear 较低）
const list8 = getMaintainableBooks();
ok(list8.length === 2 && list8[0].bookId === A && list8[1].bookId === B, 'locked 置顶（查询层排序）');
// 入批 → 结算
seq(0.9999);
const sess = startMaintenanceSession([A, B]);
ok(sess.ok, 'locked 书正常入批（勿加额外判断）');
const settle = applyMaintenanceProgress(99999999);
ok(settle.completed === true, '批次结算');
ok(state.books[A].wearCount === 0 && state.books[A].servicing === 'locked', '结算后保持锁定（决策 ③ 手动回架）');
ok(!getMaintainableBooks().some(b => b.bookId === A), '待回架书退出可保养列表');
ok(svc.getAwaitingShelfReturnBooks().some(b => b.bookId === A), '进入待回架条带');
ok(svc.returnToShelf(A) === true && state.books[A].servicing === undefined, '回架 → 解锁');
ok(svc.getAwaitingShelfReturnBooks().length === 0, '待回架条带清空');
ok(svc.returnToShelf(A) === false, '非 locked 不可回架');

// 保养保护期（2026-10-30 图南拍板修订：10→5 次，保护=完全无损：借出不掉磨损+还书跳过损毁 roll）
ok(state.books[A].damageShield === 5, '保养结算赠 damageShield=5');
ok(state.books[B].damageShield === 5, '批次内每本都获赠');
// 收窄可借池到只剩 A（B/C 若在池调离 completed），保证真管线借出的必是 A
if (state.books[B]) state.books[B].status = 'copying';
if (state.books[C]) state.books[C].status = 'copying';
// 借出侧：保护期内磨损自增跳过（完全不掉完好度）
state.books[A].wearCount = 7;
let v = lendViaPipeline();
ok((v.bookIds || []).includes(A), '真管线借出 A');
ok(state.books[A].wearCount === 7, '保护期内借出不掉完好度（磨损自增跳过）');
ok(state.books[A].damageShield === 5, '借出侧不消耗保护（消耗在还书侧）');
// 第 1 次还书：强制损毁队列也命中不了
dueVisitor([A]);
seq(0, 0.9999); // [0]若 roll 必中
ret = collectReturn('v1');
ok(ret.books[0].damaged === false && state.books[A].damaged !== true, '保护期内损毁 roll 跳过');
ok(state.books[A].damageShield === 4, '消耗 1 次保护（5→4）');
ok(state.books[A].wearCount === 7, '保护周期内完好度全程不动');
// 最后 1 次保护：仍全程无损
state.books[A].damageShield = 1;
v = lendViaPipeline();
ok(state.books[A].wearCount === 7, '最后 1 次保护：借出仍不掉磨损');
dueVisitor([A]);
seq(0, 0.9999);
ret = collectReturn('v1');
ok(ret.books[0].damaged === false, '最后 1 次保护仍生效（消耗后归 0）');
ok((state.books[A].damageShield || 0) === 0, '保护归 0');
// 保护耗尽：借出侧磨损恢复自增 + 损毁 roll 恢复命中
state.books[A].wearCount = 3;
v = lendViaPipeline();
ok(state.books[A].wearCount === 4, '保护耗尽后借出侧磨损恢复 +1');
dueVisitor([A]);
seq(0, 0.9999);
ret = collectReturn('v1');
ok(ret.books[0].damaged === true, '保护耗尽后损毁 roll 恢复命中');
state.books[A].damaged = false; delete state.books[A].repairWords;

// ═══ 9. pending 死锁（intended：懒收占格）═══
console.log('\n=== 9. pending 占格 ===');
freshLibrary(); completeOne(A).wearCount = 5;
dueVisitor([A]);
svc.markServicing(A, { lent: true });
ok(svc.getServicingUsed() === 1, '收取前 pending 占 1 格');
ok(svc.isServicingFull() === false, '2 格未满');
// 玩家不点收取：pending 持续占格（唯一释放途径=收取/损毁/失窃）
ok(svc.getServicingUsed() === 1, '不收就一直占着（intended）');

// ═══ 10. 扩容扣款 ═══
console.log('\n=== 10. 扩容 ===');
freshLibrary();
const c10 = state.coins;
ok(cap.expandServicingSlots() === true, '扩容第 3 格成功');
ok(state.coins === c10 - 30, '扣款 30');
ok(cap.getServicingSlots() === 3, '总格 3');
state.servicingSlotsPurchased = 4;
ok(cap.expandServicingSlots() === false, '满 6 拒绝扩容');

// ═══ 11. 迁移 ═══
console.log('\n=== 11. 迁移 ===');
freshLibrary();
delete state.servicingSlotsPurchased;
state._schemaVersion = 16;
runMigrations();
ok(state._schemaVersion === 17, 'schemaVersion 升到 17');
ok(state.servicingSlotsPurchased === 0, '旧档补默认值 0');
saveState();
ok(JSON.parse(store.get('riftlib_state_v2')).servicingSlotsPurchased === 0, '落库可序列化');

console.log(`\nservicing：${pass} 通过, ${fail} 失败`);
process.exit(fail > 0 ? 1 : 0);
