#!/usr/bin/env node
// 哥特之夜 2026 回归测试（gothic-night-assets-2026.md v4.2）
// 覆盖：节日窗口判定 · 登录兑换券（幂等/窗口外不发）· 兑换券抵扣购书 ·
//   四任务链（窗口门控/进度/集齐发放徽章/幂等）· 魔法南瓜窗口回收 · 限定作物数据纪律
// 时间注入：window.__dev.getNow（事件判定统一走该口径）
// 用法：node scripts/test-gothic-event.mjs

// ── 环境 mock ──
const store = new Map();
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
  clear: () => store.clear(),
};
globalThis.window = { __dev: { getNow: () => Date.now() } };
globalThis.document = {
  body: { style: {}, appendChild() {} }, documentElement: { style: {} },
  getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  addEventListener() {}, createElement: () => ({ style: {}, classList: { add() {}, remove() {} }, addEventListener() {}, appendChild() {}, remove() {}, querySelector: () => null, querySelectorAll: () => [] }),
};
globalThis.Audio = class { play() { return Promise.resolve(); } pause() {} addEventListener() {} };

const { state } = await import('../js/state.js');
const { isFestivalActive, FESTIVALS } = await import('../data/festival.js');
const { isEventWindowActive } = await import('../data/event_calendar.js');
const { checkFestivalGifts } = await import('../js/core/festival.js');
const et = await import('../js/core/event-tasks.js');
const plants = await import('../js/plants.js');
const { PLANT_TYPES, SEED_EXCHANGE } = await import('../data/plants.js');
const { CAFE_RECIPES } = await import('../data/cafe.js');
const fs = await import('fs');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) pass++;
  else { fail++; console.error('  ✗', label); }
}

// 时间：万圣窗口内 / 窗口外
const IN_WINDOW = new Date(2026, 9, 30, 12).getTime();   // 2026-10-30
const OUT_WINDOW = new Date(2026, 10, 15, 12).getTime();  // 2026-11-15（窗口 10-27~11-13 之后）
window.__dev.getNow = () => IN_WINDOW;

function fresh() {
  state.eventClaims = {};
  state.eventTasks = {};
  state.bookVoucher = 0;
  state.signboards = [];
  state.plants = [];
  state.coins = 0;
}

// ═══ 1. 窗口判定 ═══
console.log('\n=== 1. 窗口判定 ===');
ok(FESTIVALS.gothicNight2026, 'gothicNight2026 节日条目存在');
ok(isFestivalActive('gothicNight2026', IN_WINDOW), '窗口内 isFestivalActive=true');
ok(!isFestivalActive('gothicNight2026', OUT_WINDOW), '窗口外 isFestivalActive=false');
ok(isEventWindowActive('gothic_night', new Date(IN_WINDOW)), 'EVENT_WINDOWS.gothic_night 窗口内');
ok(!isEventWindowActive('gothic_night', new Date(OUT_WINDOW)), 'EVENT_WINDOWS.gothic_night 窗口外');

// ═══ 2. 登录兑换券 ═══
console.log('\n=== 2. 登录兑换券 ===');
fresh();
let granted = checkFestivalGifts(IN_WINDOW);
// 注：10-30 同时命中十月礼物（10-17~10-31），只断言哥特节在发放列表且券入账
ok(granted.some(f => f.key === 'gothicNight2026') && state.bookVoucher === 1, '窗口内首次登录发券 ×1');
granted = checkFestivalGifts(IN_WINDOW);
ok(granted.length === 0 && state.bookVoucher === 1, '幂等：重复登录不重复发');
fresh();
state.eventClaims = { gothicNight2026: IN_WINDOW }; // 窗口内已领过
ok(checkFestivalGifts(OUT_WINDOW).length === 0, '窗口外不再发');

// ═══ 2.5 兑换券抵扣双路径（弹窗确认：用券免费 / 花币留券）═══
console.log('\n=== 2.5 抵扣双路径 ===');
const { purchaseBook } = await import('../js/core/shop/book-shop.js');
fresh();
state.bookVoucher = 1;
state.coins = 1000;
window.__dev.getNow = () => IN_WINDOW;
let r = purchaseBook('book_048', 200, { useVoucher: false });
ok(r.ok && state.bookVoucher === 1 && state.coins === 800, '花币购买：扣币 200、券保留');
r = purchaseBook('book_047_vol1', 350);
ok(r.ok && state.bookVoucher === 0 && state.coins === 800, '默认路径：免币销券');
fresh();
state.bookVoucher = 0; state.coins = 100;
r = purchaseBook('book_047_vol2', 350);
ok(!r.ok && r.reason === 'insufficient_coins', '无券且币不足：拒绝');

// ═══ 3. 任务链（领取制：完成 → 面板手动领，v4.3 图南拍板）═══
console.log('\n=== 3. 四任务链 ===');
fresh();
// 窗口外空操作
window.__dev.getNow = () => OUT_WINDOW;
et.bumpEventTask('focus3'); et.bumpEventTask('harvest_pumpkin');
ok(et.getEventTasks().every(t => t.count === 0 && !t.done), '窗口外 bump 全部空操作');
ok(et.claimEventTask('focus3').reason === 'event_ended', '窗口外领取拒绝');

window.__dev.getNow = () => IN_WINDOW;
et.bumpEventTask('focus3');
ok((state.history || []).some(h => h.title && h.title.includes('万圣巡馆')), '任务进度写历史（指引反馈）');
et.bumpEventTask('open_gothic', 'book_048');
et.bumpEventTask('serve_halloween', 'gothic_moon_drink');
et.bumpEventTask('focus3'); et.bumpEventTask('focus3');
et.bumpEventTask('serve_halloween', 'pumpkin_tart');
et.bumpEventTask('harvest_pumpkin');
// 完成但不自动发奖
const before = et.getEventTasks();
ok(before.every(t => t.done && t.claimable && !t.rewarded), '四任务完成 → 全部可领但未领');
ok(!state.signboards.includes(et.GOTHIC_PLAQUE_ID), '完成不自动挂徽章（领取制）');
// 逐项领取
state.musicRoom = { unlocked: false, tracks: [] };
state.seeds = {}; state.inventory = {};
ok(et.claimEventTask('open_gothic').ok && state.musicRoom.tracks.includes('gothic_moon'), '领①：猩红月夜入留声阁');
ok(et.claimEventTask('focus3').ok && state.seeds.magic_pumpkin === 3, '领②：魔法南瓜种子 ×3');
ok(et.claimEventTask('harvest_pumpkin').ok && state.inventory.pumpkin_candy === 3, '领③：南瓜糖 ×3');
ok(et.claimEventTask('serve_halloween').ok && state.signboards.includes(et.GOTHIC_PLAQUE_ID), '领④：2026 纪念牌挂上');
ok(et.claimEventTask('focus3').reason === 'already_claimed', '重复领取拒绝');
ok(et.getEventTasks().every(t => t.rewarded && !t.claimable), '全部已领状态正确');
// 计数冻结：完成后继续 bump 不涨
et.bumpEventTask('focus3');
ok(et.getEventTasks().find(t => t.id === 'focus3').count === 3, '已完成后计数冻结在 3/3');
// 任务明细
ok(before.find(t => t.id === 'open_gothic').set.length === 1, '开卷 set 记录书 id');
ok(before.find(t => t.id === 'serve_halloween').set.length === 2, '待客 set 两份食谱');
ok(before.find(t => t.id === 'focus3').reward.label.includes('种子'), '执灯奖励=魔法南瓜种子（图南指定）');
ok(before.find(t => t.id === 'open_gothic').reward.type === 'track', '开卷奖励=无人声BGM（图南指定）');
// 非定义键拒绝
fresh();
et.bumpEventTask('open_gothic', 'book_999');
ok(et.getEventTasks().find(t => t.id === 'open_gothic').set.length === 0, '非哥特书 id 不计入开卷');

// ═══ 3.5 南瓜糖使用（种瓜奖励道具：+3 浇水机会）═══
console.log('\n=== 3.5 南瓜糖 ===');
const { useItem } = await import('../js/core/redeem.js');
state.inventory = { pumpkin_candy: 1 };
state.water = 0;
const useRes = useItem('pumpkin_candy');
ok(useRes.ok && state.water === 3 && (state.inventory.pumpkin_candy || 0) === 0, '吃糖：浇水机会 0→3，糖消耗');

// ═══ 3.6 音轨售卖纪律（猩红血夜=任务专属不上架；海妖吟唱/死神邀舞窗口内可购）═══
console.log('\n=== 3.6 音轨售卖纪律 ===');
const { purchaseTrack } = await import('../js/audio.js');
window.__dev.getNow = () => IN_WINDOW;
state.coins = 9999;
state.musicRoom = { unlocked: false, tracks: [] };
let pt = purchaseTrack('gothic_moon');
ok(!pt.ok && pt.reason === 'gift_only' && state.coins === 9999, '猩红血夜：gift_only 拒绝售卖');
pt = purchaseTrack('siren_song');
ok(pt.ok && state.musicRoom.tracks.includes('siren_song'), '海妖吟唱：窗口内可购');
state.musicRoom = { unlocked: false, tracks: [] };
window.__dev.getNow = () => OUT_WINDOW;
pt = purchaseTrack('death_waltz');
ok(!pt.ok && pt.reason === 'event_ended', '死神邀舞：窗口外禁售');

// ═══ 4. 魔法南瓜数据纪律 ═══
console.log('\n=== 4. 魔法南瓜 ===');
const mp = PLANT_TYPES.magic_pumpkin;
ok(!!mp, 'magic_pumpkin 定义存在');
ok(mp.seedDropRate === 0.6, '收获 60% 掉 1 种子（2026-10-28 图南拍板：与常规品种同口径，软回流）');
ok(mp.noImprove === true, '不可嫁接（noImprove）');
ok(mp.festivalKey === 'gothicNight2026', '种子窗口门控 festivalKey');
ok(mp.levelNames[5] === '魔法南瓜', '满级名=魔法南瓜');
ok(!fs.existsSync || Object.values(mp.art).every(p => fs.existsSync(p)), 'art 5 张立绘全部落盘');
ok(!Object.keys(SEED_EXCHANGE || {}).includes('magic_pumpkin'), '不进种子兑换表');
ok(!plants.canUnlockImproved('magic_pumpkin'), 'canUnlockImproved 拒绝魔法南瓜');
ok(CAFE_RECIPES.some(r => r.id === 'gothic_moon_drink' && r.festivalKey === 'gothicNight2026'), '猩红月夜特饮配方+门控');
ok(CAFE_RECIPES.some(r => r.id === 'pumpkin_tart' && r.festivalKey === 'gothicNight2026'), '南瓜灯挞配方+门控');
ok(CAFE_RECIPES.find(r => r.id === 'gothic_moon_drink').material.seedType === 'magic_pumpkin', '饮品材料=魔法南瓜种子');

// ═══ 5. 窗口回收 ═══
console.log('\n=== 5. 窗口回收 ===');
window.__dev.getNow = () => IN_WINDOW;
state.plants = [{ activeType: 'magic_pumpkin', level: 3 }, { activeType: 'magic_rose', level: 2 }];
ok(et.recoverEventPlants() === 0, '窗口内不回收');
ok(state.plants[0].activeType === 'magic_pumpkin', '窗口内植株原样');
window.__dev.getNow = () => OUT_WINDOW;
ok(et.recoverEventPlants() === 1, '窗口外回收 1 株魔法南瓜');
ok(state.plants[0].activeType === null && state.plants[0].level === 0, '魔法南瓜盆位清空');
ok(state.plants[1].activeType === 'magic_rose', '常驻植物不受影响');
ok(et.recoverEventPlants() === 0, '回收幂等');

// ═══ 6. 万圣节特供常驻直购（2026-10-27 图南拍板：不用等刷新）═══
console.log('\n=== 6. 万圣节特供直购位 ===');
const { getEventDirectSlots } = await import('../js/core/shop/book-shop.js');
window.__dev.getNow = () => IN_WINDOW;
state.books = {};
let slots = getEventDirectSlots();
ok(slots.length === 3, '窗口内 3 个直购位（红字两卷+酒桶）');
ok(slots.every(s => s.price > 0 && s.bookId.startsWith('book_04')), '直购位带书池定价');
state.books['book_048'] = { status: 'completed' };
ok(getEventDirectSlots().length === 2, '购得的书从直购栏消失');
window.__dev.getNow = () => OUT_WINDOW;
ok(getEventDirectSlots().length === 0, '窗口外直购栏隐藏');

// ═══ 7. 开幕大图弹窗幂等标记（图南：大图怼脸，每人一次，与礼物 claim 独立）═══
console.log('\n=== 7. 开幕弹窗标记 ===');
const { markEventSplash } = await import('../js/core/festival.js');
fresh();
window.__dev.getNow = () => IN_WINDOW;
ok(markEventSplash('gothicNight2026') === true, '首次进入窗口 → 应弹');
ok(markEventSplash('gothicNight2026') === false, '第二次 → 不弹（幂等）');
window.__dev.getNow = () => OUT_WINDOW;
ok(markEventSplash('someFutureFest') === false, '未定义节日安全 false');

// ═══ 8. 万圣笔（图南拍板：窗口内自动免费、已得终身、不上架）═══
console.log('\n=== 8. 万圣笔 ===');
// 场景 A：全新玩家，窗口内首次启动 → 礼与笔同得
fresh();
state.unlockedPenStyles = [];
window.__dev.getNow = () => IN_WINDOW;
checkFestivalGifts(IN_WINDOW);
ok((state.unlockedPenStyles || []).includes('gothic_night'), '窗口内登录 → 解锁万圣笔');
// 场景 B：幂等——重复启动不重复 push、不报错
checkFestivalGifts(IN_WINDOW);
ok(state.unlockedPenStyles.filter(s => s === 'gothic_night').length === 1, '重复启动不重复解锁（幂等）');
// 场景 C：存量玩家（礼在笔机制上线前已领，eventClaims 有标记）窗口内启动 → 照样补到笔
state.eventClaims = { gothicNight2026: IN_WINDOW };
state.unlockedPenStyles = [];
const voucherBefore = state.bookVoucher || 0;
checkFestivalGifts(IN_WINDOW);
ok(state.unlockedPenStyles.includes('gothic_night'), '存量已领礼玩家 → 窗口内启动补解锁笔（独立幂等键）');
ok((state.bookVoucher || 0) === voucherBefore, '补笔不重复发礼');
// 场景 D：已得终身——窗口外启动不收回笔
window.__dev.getNow = () => OUT_WINDOW;
checkFestivalGifts(OUT_WINDOW);
ok(state.unlockedPenStyles.includes('gothic_night'), '窗口外笔保留（终身）');
// 场景 E：窗口外全新玩家不发放
state.unlockedPenStyles = [];
state.eventClaims = {};
checkFestivalGifts(OUT_WINDOW);
ok(!(state.unlockedPenStyles || []).includes('gothic_night'), '窗口外不发放');

console.log(`\ngothic-event：${pass} 通过, ${fail} 失败`);
process.exit(fail > 0 ? 1 : 0);
