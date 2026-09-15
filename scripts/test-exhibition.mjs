#!/usr/bin/env node
// 展览厅（exhibition-hall-plan v2）存储层 + 活动日历测试
// 覆盖：大厅建造门槛/升级曲线与设施帽/容量=等级槽位约束/房间收集轨三条件/
//       修复三轨与金币扣款/留声阁直通不占槽/全馆开放一次性/活动日历判定与双 hook 乘区/
//       活动日墨墨日记幂等/迁移 v10 纯加法与幂等
// 用法：node scripts/test-exhibition.mjs

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
};
globalThis.window = globalThis;
globalThis.Audio = class {
  play() { return new Promise(() => {}); }
  pause() {}
  addEventListener() {}
};

const { state } = await import('../js/state.js');
const { runMigrations } = await import('../js/state/migrations.js');
const exh = await import('../js/core/exhibition.js');
const cal = await import('../data/event_calendar.js');

const RealDate = Date;
const T0 = new RealDate('2026-09-10T12:00:00').getTime(); // 非活动日（9/15 才是阿加莎诞辰）
const at = (m, d) => new RealDate(`2026-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T08:00:00`).getTime();

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { console.log(`  ✅ ${msg}`); pass++; }
  else { console.log(`  ❌ ${msg}`); fail++; }
}

function freshExh(opts = {}) {
  state.library.stage = opts.stage ?? 3;
  state.library.atmosphere = opts.atmosphere ?? 500;
  state.coins = opts.coins ?? 10000;
  state.exhibition = {
    built: false, level: 0,
    rooms: { archive: 'ruined', signboards: 'ruined', achievements: 'ruined', collection: 'ruined', musicroom: 'ruined' },
    grandOpeningShown: false, lastEventId: null, lastEventDay: null
  };
  state.signboards = opts.signboards ?? [];
  state.achievements = opts.achievements ?? [];
  state.visitorMemory = { items: opts.mementos ?? [] };
  state.musicRoom = { unlocked: opts.musicRoom ?? false, tracks: [] };
  window.__dev = { getNow: () => T0 };
}

// ═══ 1. 大厅建造门槛（plan §三：2 阶 + 800）═══
console.log('\n=== 1. 大厅建造门槛 ===');
freshExh({ stage: 1, coins: 99999 });
assert(!exh.canBuildExhibitionHall() && !exh.buildExhibitionHall(), '1 阶不可建造');
freshExh({ stage: 2, coins: 799 });
assert(!exh.canBuildExhibitionHall() && !exh.buildExhibitionHall(), '金币不足 800 不可建造');
freshExh({ stage: 2, coins: 5000 });
assert(exh.canBuildExhibitionHall(), '2 阶 + 800 可建造');
assert(exh.buildExhibitionHall() && state.exhibition.level === 1 && state.exhibition.built, '建造成功 Lv1');
assert(state.coins === 4200, '扣款 800');
assert(state.exhibition.rooms.archive === 'open', '档案室随馆而生（建成即开放）');
assert(!exh.buildExhibitionHall(), '已建不可重复建造');

// ═══ 2. 升级曲线与设施帽（1000×1.6ⁿ，cap=min(5,stage+1)）═══
console.log('\n=== 2. 升级曲线与金币单轨（2026-09-15 起不设阶段帽）===');
freshExh({ stage: 2, coins: 99999 }); // 2 阶刚够建造，扩容不再看阶段
exh.buildExhibitionHall();
assert(exh.getHallLevelCap() === 5, '帽恒为 Lv5（金币单轨）');
assert(exh.getHallUpgradePrice() === 1000, 'Lv1→2 = 1000');
exh.upgradeHall();
assert(exh.getHallUpgradePrice() === 1600, 'Lv2→3 = 1600');
exh.upgradeHall();
assert(exh.getHallUpgradePrice() === 2560, 'Lv3→4 = 2560');
exh.upgradeHall();
assert(exh.getHallUpgradePrice() === 4096, 'Lv4→5 = 4096');
exh.upgradeHall();
assert(state.exhibition.level === 5 && !exh.canUpgradeHall(), '升满 Lv5（5 槽全开放）不可再升');
freshExh({ stage: 1, coins: 99999 });
assert(!exh.canBuildExhibitionHall(), '1 阶不可建造（重申：阶段只卡建造门槛）');

// ═══ 3. 容量轨（大厅等级 = 房间容量）═══
console.log('\n=== 3. 容量轨 ===');
freshExh({ stage: 5, coins: 99999, signboards: ['sb1'] });
exh.buildExhibitionHall();
assert(exh.getOpenRoomCount() === 1, 'Lv1：仅档案室开放（1/5）');
let snap = exh.getRepairSnapshot('signboards');
assert(snap.slotFree === false && !exh.canRepairRoom('signboards'), '容量 1 已满：纪念牌墙不可修（slot ❌）');
exh.upgradeHall();
snap = exh.getRepairSnapshot('signboards');
assert(snap.slotFree === true, '升到 Lv2 腾出槽位');

// ═══ 4. 收集轨三条件 ═══
console.log('\n=== 4. 收集轨三条件 ===');
freshExh({ stage: 5, coins: 99999 }); // 无纪念牌/成就/纪念品
exh.buildExhibitionHall(); exh.upgradeHall(); exh.upgradeHall(); exh.upgradeHall(); exh.upgradeHall();
assert(!exh.getRepairSnapshot('signboards').collectionMet, '纪念牌 0/1 ❌');
assert(!exh.getRepairSnapshot('achievements').collectionMet, '成就 0/10 ❌');
assert(!exh.getRepairSnapshot('collection').collectionMet, '纪念品 0/5 ❌');
state.signboards = ['sb1'];
state.achievements = new Array(10).fill('a');
state.visitorMemory = { items: new Array(5).fill({}) };
assert(exh.getRepairSnapshot('signboards').collectionMet, '纪念牌 1/1 ✓');
assert(exh.getRepairSnapshot('achievements').collectionMet, '成就 10/10 ✓');
assert(exh.getRepairSnapshot('collection').collectionMet, '纪念品 5/5 ✓');

// ═══ 5. 修复三轨与金币 ═══
console.log('\n=== 5. 修复三轨与金币 ===');
state.coins = 99999;
const r1 = exh.repairRoom('signboards');
assert(r1.ok && state.exhibition.rooms.signboards === 'open', '修复纪念牌墙成功');
assert(state.coins === 99499, '扣款 500');
const r2 = exh.repairRoom('collection');
assert(r2.ok && state.coins === 98699, '修复收藏品展柜扣款 800');
assert(!exh.repairRoom('signboards').ok, '已开放不可重复修复');
assert(!exh.repairRoom('archive').ok, '档案室（已建成开放）不可走修复');
assert(!exh.repairRoom('musicroom').ok, '留声阁不走修复（直通/商店建造）');

// ═══ 6. 留声阁直通（不占修复容量）═══
console.log('\n=== 6. 留声阁直通 ===');
freshExh({ stage: 2, coins: 99999, musicRoom: true });
exh.buildExhibitionHall();
assert(exh.getRoomStatus('musicroom') === 'open', '已建留声阁 → 入口懒同步点亮');
assert(exh.getOpenRoomCount() === 2, '直通不占修复槽（档案室+留声阁=2）');
freshExh({ stage: 5, coins: 99999, musicRoom: false });
exh.buildExhibitionHall();
assert(exh.getRoomStatus('musicroom') === 'ruined', '未建留声阁保持破败 → UI 引导去商店');
state.musicRoom.unlocked = true;
assert(exh.getRoomStatus('musicroom') === 'open', '商店建造后下一次读取即点亮');

// ═══ 7. 全馆开放庆典（一次性）═══
console.log('\n=== 7. 全馆开放庆典 ===');
freshExh({ stage: 5, coins: 99999, musicRoom: true, signboards: ['sb1'], achievements: new Array(10).fill('a'), mementos: new Array(5).fill({}) });
exh.buildExhibitionHall();
exh.upgradeHall(); exh.upgradeHall(); exh.upgradeHall(); exh.upgradeHall(); // Lv5，五槽
exh.repairRoom('signboards');
exh.repairRoom('achievements');
assert(!state.exhibition.grandOpeningShown, '四室未齐不触发');
const rLast = exh.repairRoom('collection');
assert(rLast.grandOpening === true && state.exhibition.grandOpeningShown, '第五室修复 → 全馆开放一次性触发');
assert(exh.checkGrandOpening() === false, '已置位不重复触发');
// 兜底检出路径：四室已修、留声阁最后才建 → syncMusicRoomEntrance 点亮后 checkGrandOpening 发放
freshExh({ stage: 5, coins: 99999, musicRoom: false, signboards: ['sb1'], achievements: new Array(10).fill('a'), mementos: new Array(5).fill({}) });
exh.buildExhibitionHall();
exh.upgradeHall(); exh.upgradeHall(); exh.upgradeHall(); exh.upgradeHall();
exh.repairRoom('signboards'); exh.repairRoom('achievements'); exh.repairRoom('collection');
assert(!state.exhibition.grandOpeningShown, '四室在修、留声阁未建：不触发');
state.musicRoom.unlocked = true;
assert(exh.checkGrandOpening() === true && state.exhibition.grandOpeningShown, '留声阁后点亮凑齐五室 → 兜底检出发放');

// ═══ 8. 活动日历判定与双 hook 乘区 ═══
console.log('\n=== 8. 活动日历与乘区 ===');
assert(cal.isEventDay(new RealDate(at(1, 3))), '1/3 托尔金诞辰命中');
assert(cal.isEventDay(new RealDate(at(9, 15))), '9/15 阿加莎诞辰命中');
assert(cal.isEventDay(new RealDate(at(4, 23))), '4/23 世界读书日命中');
assert(!cal.isEventDay(new RealDate(at(6, 10))), '平日无活动');
assert(cal.getEventEffectMults(new RealDate(at(1, 3))).borrowFavorMult === 1.5, '作家诞辰借书好感 ×1.5');
assert(cal.getEventEffectMults(new RealDate(at(4, 23))).focusCoinsMult === 1.2, '4/23 合并峰值 focusCoins ×1.2');
assert(cal.getEventEffectMults(new RealDate(at(4, 2))).focusCoinsMult === 1.1, '儿童图书日 focusCoins ×1.1');
assert(cal.getEventEffectMults(new RealDate(at(6, 10))).borrowFavorMult === 1
  && cal.getEventEffectMults(new RealDate(at(6, 10))).focusCoinsMult === 1, '平日乘区 1/1');
assert(cal.getMonthBanner(new RealDate(at(4, 10)))?.id === 'book_suzhou_month', '4 月整月书香苏州横幅（展示层）');
assert(cal.getMonthBanner(new RealDate(at(5, 10))) === null, '非 4 月无整月横幅');
assert(exh.getEventBorrowFavorMult(at(9, 15)) === 1.5 && exh.getEventBorrowFavorMult(T0) === 1, 'hook 读取按 now 注入');
assert(exh.getEventFocusCoinsMult(at(4, 23)) === 1.2, 'focus hook 4/23 = 1.2');

// ═══ 9. 活动日墨墨日记（幂等 + 跨年可再触发）═══
console.log('\n=== 9. 活动日墨墨日记 ===');
freshExh();
state.diaryLogs = [];
const ev1 = exh.checkEventDayDiary(at(9, 15));
assert(ev1 && ev1.id === 'agatha_birthday', '活动日首次写日记');
assert(state.exhibition.lastEventId === 'agatha_birthday', '落戳记录');
const logsAfterFirst = state.diaryLogs.length;
assert(exh.checkEventDayDiary(at(9, 15)) === null && state.diaryLogs.length === logsAfterFirst, '同日重复调用不双写');
assert(exh.checkEventDayDiary(T0) === null, '非活动日不写');
const evNextYear = exh.checkEventDayDiary(new RealDate('2027-09-15T08:00:00').getTime());
assert(evNextYear && evNextYear.id === 'agatha_birthday', '次年同日可再触发（按日落戳）');

// ═══ 10. 迁移 v10（纯加法 + 幂等 + 半残归一）═══
console.log('\n=== 10. 迁移 v10 ===');
state._schemaVersion = 9;
delete state.exhibition;
runMigrations();
assert(state._schemaVersion === 12, 'schemaVersion 9 → 12');
assert(state.exhibition && state.exhibition.built === false && state.exhibition.level === 0, 'exhibition 默认态');
assert(Object.keys(state.exhibition.rooms).length === 5 && state.exhibition.rooms.musicroom === 'ruined', '五房间全破败');
runMigrations();
assert(state.exhibition.level === 0 && state.exhibition.rooms.archive === 'ruined', '重复迁移幂等');
state._schemaVersion = 9;
state.exhibition = { built: true, level: 3, rooms: { archive: 'open', musicroom: 'open' }, grandOpeningShown: true };
runMigrations();
assert(state.exhibition.level === 3 && state.exhibition.rooms.archive === 'open'
  && state.exhibition.rooms.signboards === 'ruined' && state.exhibition.grandOpeningShown === true
  && state.exhibition.lastEventId === null, '半残档归一：已有保留、缺项补默认');

console.log(`\n${pass} 通过, ${fail} 失败`);
process.exit(fail > 0 ? 1 : 0);
