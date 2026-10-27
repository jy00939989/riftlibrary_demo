#!/usr/bin/env node
// 访客三赠书体系回归（2026-10-24）
// 覆盖：常层首送 / 偶层挂点 / 终局同刻 / 已拥有→30灵感 / 手稿箱满自带一格 / 红灯占位不发 /
//       29 本赠书书目唯一性；已建书目存在性强校验，二三批登记不报错
// 随机策略：全程 0.1——损毁(3%)不触发、常层40%触发、偶层30%触发、终局100%、legacy事件无副作用
// 用法：node scripts/test-visitor-gift-books.mjs

// ── Node 环境浏览器桩 ──
globalThis.window = { __dev: {} };
const elStub = () => ({
  style: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  addEventListener() {}, appendChild() {}, remove() {},
  // querySelector 递归返回桩：日记装帧升级弹窗等 fire-and-forget UI 在 Node 下不再炸（2026-10-25）
  querySelector: () => elStub(), querySelectorAll: () => [], innerHTML: '', textContent: ''
});
globalThis.document = {
  getElementById: elStub, querySelector: elStub, querySelectorAll: () => [],
  addEventListener() {}, body: elStub(), documentElement: elStub(), createElement: elStub
};
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.Audio = class Audio { constructor() {} play() { return Promise.resolve(); } pause() {} addEventListener() {} };

const { collectReturn, VISITOR_GIFT_BOOKS, getNarrativeState } = await import('../js/visitors.js');
const { state } = await import('../js/state.js');
const { runMigrations } = await import('../js/state/migrations.js');
const { BOOKS } = await import('../data/books.js');
const { VISITOR_NARRATIVES } = await import('../data/visitor-events.js');

runMigrations();
const realRandom = Math.random;
Math.random = () => 0.1;

let passed = 0, failed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; failures.push(`${name}: ${e.message}`); }
}
function assertEq(actual, expected, label = '') {
  if (actual !== expected) throw new Error(`${label} 期望 ${expected}，实际 ${actual}`);
}
function assertTrue(v, label = '') { if (!v) throw new Error(`${label} 应为真`); }

function resetSave() {
  state.visitors = [];
  state.books = {};
  state.manuscriptBox = [];
  state.library.manuscriptSlots = 5;
  state.visitorNarratives = {};
  state.visitorFavors = {};
  state.inspiration = 0;
  state.history = [];
  state.borrowRecords = [];
  state.signboards = [];
  state.diary = [];
  state.diaryFirsts = {};
  state.restorationBox = [];
  state.pendingGifts = [];
  state.bookDedications = {};
}

function mkVisitor(charId) {
  state.visitors = [{
    id: 'v_t1', charId, name: charId, emoji: '', title: '',
    status: 'due', bookIds: ['book_003'], bookId: 'book_003', bookTitle: '老人与海',
    borrowTime: 1, dueTime: 1, favorability: 0
  }];
  state.books['book_003'] = { status: 'completed', copiedWords: 25000, wearCount: 0, borrowTimes: 1 };
}

// ── 1. 常层首送：第一本与首次常层事件同刻 ──
test('常层首送：程远首次常层事件送达《手册》(book_054)', () => {
  resetSave();
  mkVisitor('chengyuan');
  const res = collectReturn('v_t1');
  const gift = (res.narrative.gifts || []).find(g => g.bookId === 'book_054');
  assertTrue(gift, 'gifts 应含 book_054');
  assertEq(gift.mode, 'box', '默认入手稿箱');
  assertEq(state.books['book_054']?.status, 'unlocked', '书应已解锁');
  assertTrue(state.manuscriptBox.includes('book_054'), '应在手稿箱');
  assertTrue(getNarrativeState('chengyuan').commonGiftGiven, 'flag 应置位');
});

test('常层首送只发一次：第二次常层不再送', () => {
  resetSave();
  mkVisitor('chengyuan');
  collectReturn('v_t1');
  mkVisitor('chengyuan');
  const res = collectReturn('v_t1');
  assertTrue(!(res.narrative.gifts || []).some(g => g.bookId === 'book_054'), '第二次不应再送 book_054');
});

// ── 2. 偶层挂点：谷雨 gy_o03 → 昆虫记（二批已建成，端到端真验）──
test('偶层挂点：谷雨轮到 gy_o03 时送出《昆虫记》(book_067)', () => {
  resetSave();
  mkVisitor('guyu');
  state.visitorFavors['guyu'] = 200;
  const ns = getNarrativeState('guyu');
  ns.occasionalCompleted = ['gy_o01', 'gy_o02'];
  const res = collectReturn('v_t1');
  assertEq(res.narrative.occasional?.id, 'gy_o03', '应触发挂点事件');
  const gift = (res.narrative.gifts || []).find(g => g.bookId === 'book_067');
  assertTrue(gift, '挂点事件应送出昆虫记');
  assertEq(state.books['book_067']?.status, 'unlocked', '昆虫记应已解锁');
});

// ── 3. 终局同刻：postRare 100%（沈明远《传习录》book_022 已建，可端到端验证）──
test('终局同刻：稀层已触发后 postRare 100% 送终局书（沈明远《传习录》book_022）', () => {
  resetSave();
  mkVisitor('shenmingyuan');
  state.visitorFavors['shenmingyuan'] = 300;
  const ns = getNarrativeState('shenmingyuan');
  ns.rareTriggered = true;
  const res = collectReturn('v_t1');
  assertTrue(res.narrative.postRare, '终局应触发');
  const gift = (res.narrative.gifts || []).find(g => g.bookId === 'book_022');
  assertTrue(gift, 'gifts 应含 book_022');
  assertTrue(getNarrativeState('shenmingyuan').endingGiftGiven, 'ending flag 应置位');
});

// ── 4. 已拥有 → 题赠页（沈明远旧池撞车路径，2026-10-24 图南拍板：不补偿数值，扉页留名）──
test('已拥有：沈明远首常层撞已购的《沉思集》→ 题赠页', () => {
  resetSave();
  mkVisitor('shenmingyuan');
  state.books['book_021'] = { status: 'completed', copiedWords: 60000, wearCount: 0 };
  const res = collectReturn('v_t1');
  const gift = (res.narrative.gifts || []).find(g => g.bookId === 'book_021');
  assertTrue(gift, '赠书时刻仍应记录');
  assertEq(gift.mode, 'dedication', '模式应为题赠页');
  const ded = state.bookDedications['book_021'];
  assertTrue(ded, '扉页应有题赠记录');
  assertEq(ded.charId, 'shenmingyuan');
});

// ── 5. 手稿箱满：访客暂为保管 → 腾格后随还书送达（不免费扩容）──
test('手稿箱满：赠书进入待送队列，不扩容；腾格后下次还书送达', () => {
  resetSave();
  mkVisitor('guyu');
  state.library.manuscriptSlots = 5;
  state.manuscriptBox = ['a', 'b', 'c', 'd', 'e'];
  const res = collectReturn('v_t1');
  assertEq(state.library.manuscriptSlots, 5, '不得免费扩容');
  assertTrue(!state.manuscriptBox.includes('book_066'), '箱满不应入箱');
  const queued = (res.narrative.gifts || []).find(g => g.bookId === 'book_066');
  assertEq(queued?.mode, 'queued', '弹窗应提示由访客保管');
  assertEq(state.pendingGifts.length, 1, '应有一笔待送');
  assertEq(state.pendingGifts[0].bookId, 'book_066');

  // 腾出一格 + 任意访客还书 → 送达
  // （先把程远的常层赠书 flag 预置为已送，避免他的 book_054 又占掉刚腾出的格子）
  state.manuscriptBox = ['a', 'b', 'c', 'd'];
  getNarrativeState('chengyuan').commonGiftGiven = true;
  mkVisitor('chengyuan');
  collectReturn('v_t1');
  assertTrue(state.manuscriptBox.includes('book_066'), '腾格后应送达入箱');
  assertEq(state.pendingGifts.length, 0, '待送队列应清空');
});

test('待送期间已拥有：送达时改题赠页', () => {
  resetSave();
  mkVisitor('guyu');
  state.library.manuscriptSlots = 5;
  state.manuscriptBox = ['a', 'b', 'c', 'd', 'e'];
  collectReturn('v_t1');
  assertEq(state.pendingGifts.length, 1);
  // 排队期间玩家用别的方式拥有了该书（仅沈明远旧池场景，这里直接构造）
  state.books['book_066'] = { status: 'completed', copiedWords: 30000, wearCount: 0 };
  state.manuscriptBox = ['a', 'b', 'c', 'd'];
  getNarrativeState('chengyuan').commonGiftGiven = true;
  mkVisitor('chengyuan');
  collectReturn('v_t1');
  assertTrue(state.bookDedications['book_066'], '应登记题赠页');
  assertEq(state.bookDedications['book_066'].charId, 'guyu');
  assertEq(state.pendingGifts.length, 0, '队列应结清');
});

// ── 6. 王小磊终局占位：《红灯》未写，不发书不烧 flag ──
test('红灯占位：王小磊 postRare 不发 book_080，ending flag 不置位', () => {
  resetSave();
  mkVisitor('wangxiaolei');
  state.visitorFavors['wangxiaolei'] = 300;
  const ns = getNarrativeState('wangxiaolei');
  ns.rareTriggered = true;
  const res = collectReturn('v_t1');
  assertTrue(!(res.narrative.gifts || []).some(g => g.bookId === 'book_080'), '不应发 book_080');
  assertTrue(!getNarrativeState('wangxiaolei').endingGiftGiven, 'flag 应留待 book_080 建成后');
});

// ── 7. 书目完整性：29 本唯一；已建强校验，未建登记 ──
test('书目完整性：29 本全书目唯一；一批已建强校验，三批全部建成，零待建', () => {
  const all = [];
  for (const [charId, g] of Object.entries(VISITOR_GIFT_BOOKS)) {
    if (g.common) all.push([charId, 'common', g.common]);
    if (g.ending) all.push([charId, 'ending', g.ending]);
  }
  for (const [charId, nar] of Object.entries(VISITOR_NARRATIVES)) {
    for (const o of nar.occasional || []) {
      if (o.giftBookId) all.push([charId, o.id, o.giftBookId]);
    }
  }
  assertEq(all.length, 29, `非空赠书应为 29 本（实际 ${all.length}）；第 30 本《红灯》book_080 占位未建`);
  assertEq(VISITOR_GIFT_BOOKS.wangxiaolei.ending, null, '红灯占位必须为 null');
  const ids = all.map(x => x[2]);
  assertEq(new Set(ids).size, ids.length, '29 本书号必须唯一（unlockBook 撞车会无事发生）');
  const BUILT = new Set(['book_021', 'book_010', 'book_022',
    'book_054', 'book_057', 'book_060', 'book_063', 'book_066', 'book_069', 'book_072', 'book_075', 'book_078',
    'book_055', 'book_058', 'book_061', 'book_064', 'book_067', 'book_070', 'book_073', 'book_076', 'book_079',
    'book_056', 'book_059', 'book_062', 'book_065', 'book_068', 'book_071', 'book_074', 'book_077']);
  const pending = [];
  for (const [charId, tier, id] of all) {
    if (BUILT.has(id)) {
      if (!BOOKS[id]) throw new Error(`${charId} ${tier} → ${id} 应在书目内（一批已建）`);
    } else {
      pending.push(id);
    }
  }
  assertEq(pending.length, 0, `待建书目应为 17（实际 ${pending.length}）：${pending.join(' ')}`);
});

Math.random = realRandom;
console.log(`\nvisitor-gift-books：${passed} 通过, ${failed} 失败`);
if (failures.length) { console.log(failures.join('\n')); process.exit(1); }
