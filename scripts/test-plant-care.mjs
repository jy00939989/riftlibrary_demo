#!/usr/bin/env node
// 植物照料改版（2026-09-15 图南决策）测试
// 覆盖：浇水全局池（无植物也累积/分配任意盆/全局扣减）/迁移 v11 旧字段收编（含模块默认 0 场景）/
//       凋谢通报（清盆+plantLossAlert+日记）/台风通报（刮走+谷雨抢救降级）
// 用法：node scripts/test-plant-care.mjs

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
    className: '', id: '', innerHTML: '', textContent: '', dataset: {},
    style: {},
    querySelector: () => ({ addEventListener() {} }),
    querySelectorAll: () => [],
    addEventListener() {},
    appendChild() {},
    remove() {}
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
const visitors = await import('../js/visitors.js');
const { PLANT_TYPES } = await import('../data/plants.js');

const RealDate = Date;
const T0 = new RealDate('2026-09-10T12:00:00').getTime();
const HOUR = 3600 * 1000;
window.__dev = { getNow: () => T0 };

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { console.log(`  ✅ ${msg}`); pass++; }
  else { console.log(`  ❌ ${msg}`); fail++; }
}
const realRandom = Math.random;
const rollZero = () => { Math.random = () => 0; };
const rollHigh = () => { Math.random = () => 0.99; };
const restoreRoll = () => { Math.random = realRandom; };

function emptyPot() {
  return { activeType: null, level: 0, growthProgress: 0, lastCareTime: 0, plantedAt: 0, harvested: false };
}
function livePot(type, level = 3, plantedAt = T0 - 49 * HOUR) {
  return { activeType: type, level, growthProgress: 10, lastCareTime: plantedAt, plantedAt, harvested: false };
}
const typeA = Object.keys(PLANT_TYPES)[0];
const typeB = Object.keys(PLANT_TYPES)[1] || typeA;

function fresh(opts = {}) {
  state.plants = opts.plants ?? [emptyPot()];
  state.water = opts.water ?? 0;
  state.plantLossAlert = null;
  state.lastTyphoonTime = opts.lastTyphoonTime ?? 0;
  state.visitors = opts.visitors ?? [];
  state.diaryLogs = [];
  state.coins = 99999;
  window.__dev = { getNow: () => opts.now ?? T0 };
}

// ═══ 1. 浇水全局池 ═══
console.log('\n=== 1. 浇水全局池 ===');
fresh();
assert(!plants.canWater(0), '空盆不可浇');
plants.addWaterOpportunity();
assert(state.water === 1, '无植物也累积 +1');
state.plants = [livePot(typeA), livePot(typeB)];
assert(plants.canWater(1) && plants.canWater(0), '全局池可浇任意一盆');
const g0 = state.plants[1].growthProgress;
const r = plants.waterPlant(1);
assert(r.ok && state.plants[1].growthProgress > g0 && state.water === 0, '浇水扣全局池、目标盆成长');
assert(state.plants[0].growthProgress === 10, '另一盆不受影响');
assert(!plants.canWater(0), '池空后不可浇');
// 收获后/满级后不可浇（原有植物态检查保留）
state.water = 5;
state.plants[1].level = 5;
state.plants[1].growthProgress = PLANT_TYPES[typeB].growthPerLevel;
assert(!plants.canWater(1), '可收获满级盆不可再浇');
state.water = 5;
state.plants[1].harvested = true;
assert(!plants.canWater(1), '已收获标记盆不可浇');

// ═══ 2. 迁移 v11：旧 per-pot 收编（模块默认 0 场景——typeof 门控会漏的真 bug）═══
console.log('\n=== 2. 迁移 v11 ===');
state._schemaVersion = 10;
state.plants = [{ ...livePot(typeA), waterAvailable: 2 }, { ...emptyPot(), waterAvailable: 1 }];
state.water = 0; // 模块默认值：老档载入后就是这个状态
delete state.plantLossAlert;
runMigrations();
assert(state._schemaVersion === 16, 'schemaVersion 10 → 13');
assert(state.water === 3, '旧 per-pot 浇水次数并入全局池（2+1）');
assert(state.plants.every(p => p.waterAvailable === undefined), '旧字段删除');
assert(state.plantLossAlert === null, '通报位补默认');
runMigrations();
assert(state.water === 3, '重复迁移幂等');
// 无旧字段的新档不受影响
state._schemaVersion = 10;
state.plants = [livePot(typeA)];
state.water = 7;
runMigrations();
assert(state.water === 7 && state.plants[0].activeType === typeA, '新档字段原样保留');

// ═══ 3. 凋谢：清盆 + 通报 + 日记 ═══
console.log('\n=== 3. 凋谢通报 ===');
fresh({ plants: [livePot(typeA, 3, T0 - 80 * HOUR), livePot(typeB)], now: T0 });
state.plants[0].lastCareTime = T0 - 80 * HOUR;
const withered = plants.checkWither();
assert(withered.length === 1 && withered[0].id === typeA, '超 72h 盆凋谢返回 def');
assert(state.plants[0].activeType === null && state.plants[0].level === 0, '凋谢盆清空');
assert(state.plants[1].activeType === typeB, '未超期盆保留');
assert(state.plantLossAlert && state.plantLossAlert.kind === 'wither'
  && state.plantLossAlert.plantTypes[0] === typeA, '通报位写入（kind=wither）');
assert(state.diaryLogs.length === 1, '墨墨日记记一笔');
// 未超期不触发
fresh({ plants: [livePot(typeA, 3, T0 - 10 * HOUR)] });
assert(plants.checkWither().length === 0 && !state.plantLossAlert, '未超 72h 不凋谢');
// 临界：恰好 72h 凋谢
fresh({ plants: [livePot(typeA, 3, T0 - 72 * HOUR)] });
state.plants[0].lastCareTime = T0 - 72 * HOUR;
assert(plants.checkWither().length === 1, '恰好 72h 凋谢（>= 语义）');

// ═══ 4. 台风：刮走通报 + 谷雨抢救降级 ═══
console.log('\n=== 4. 台风通报 ===');
fresh({ plants: [livePot(typeA, 3)] }); //  plantedAt = T0-49h，过保护期
rollZero();
const ty = visitors.tryTriggerTyphoonDisaster();
restoreRoll();
assert(ty && ty.lost === true, '无谷雨：植物被刮走');
assert(state.plants[0].activeType === null, '盆清空');
assert(state.plantLossAlert && state.plantLossAlert.kind === 'typhoon'
  && state.plantLossAlert.savedByGuyu === false && state.plantLossAlert.plantType === typeA,
  '通报位写入（刮走）');
assert(state.diaryLogs.length === 1, '墨墨日记记一笔（刮走）');
// 冷却期内不再触发
rollZero();
assert(visitors.tryTriggerTyphoonDisaster() === null, '7 天冷却内不重复触发');
restoreRoll();
// 新植物保护期
fresh({ plants: [livePot(typeA, 3, T0 - 10 * HOUR)] });
rollZero();
assert(visitors.tryTriggerTyphoonDisaster() === null, '48h 保护期内免疫');
restoreRoll();
// 谷雨在场 + roll 0：50% 抢救成功 → 降 1 级
fresh({ plants: [livePot(typeA, 3)], visitors: [{ id: 'v1', charId: 'guyu', status: 'browsing' }] });
rollZero();
const ty2 = visitors.tryTriggerTyphoonDisaster();
restoreRoll();
assert(ty2 && ty2.savedByGuyu === true && ty2.downgraded === true, '谷雨抢救成功降级');
assert(state.plants[0].activeType === typeA && state.plants[0].level === 2, '降 1 级存活');
assert(state.plantLossAlert.savedByGuyu === true && state.plantLossAlert.downgraded === true,
  '通报位写入（抢救降级）');
assert(state.diaryLogs.length === 1, '墨墨日记记一笔（抢救）');

console.log(`\n${pass} 通过, ${fail} 失败`);
process.exit(fail > 0 ? 1 : 0);
