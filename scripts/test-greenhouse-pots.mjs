#!/usr/bin/env node
// 温室花盆扩容（cafe-corner-plan §2.6 Phase 0）存储层测试
// 覆盖：迁移 v7（单株→数组）/ 解锁价格曲线与上限 / 逐株操作隔离 / 全局循环（浇水机会·凋谢）
// 用法：node scripts/test-greenhouse-pots.mjs

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
const plants = await import('../js/plants.js');
const { PLANT_TYPES } = await import('../data/plants.js');

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { console.log(`  ✅ ${msg}`); pass++; }
  else { console.log(`  ❌ ${msg}`); fail++; }
}
function freshSeeds() {
  Object.values(PLANT_TYPES).forEach(d => { state.seeds[d.seedType] = 0; });
}

// 稳定收获判定：强制不掉种子（seedDropRate 全部 > 0.99 不至于，直接钉死随机数）
const realRandom = Math.random;
const noSeed = () => { Math.random = () => 0.99; };
const restoreRandom = () => { Math.random = realRandom; };

// ═══ 1. 迁移 v7：老档单株 → plants[0] ═══
console.log('\n=== 1. 迁移 v7（单株 → 数组）===');
// 模拟老档：version 6、无 plants、有单株（一株成长中的星光蕨）
state._schemaVersion = 6;
delete state.plants;
state.plant = {
  activeType: 'starlight_fern', level: 3, growthProgress: 20,
  waterAvailable: 1, lastCareTime: 12345, plantedAt: 12000, harvested: false
};
runMigrations();
assert(state._schemaVersion === 15, 'schemaVersion 升到最新（v7-v15 同档）');
assert(Array.isArray(state.plants) && state.plants.length === 1, 'plants 数组建立，1 盆');
assert(state.plants[0].activeType === 'starlight_fern' && state.plants[0].level === 3
  && state.plants[0].growthProgress === 20,
  '原单株字段完整保留（盆位 0）');
assert(state.plants[0].waterAvailable === undefined, 'per-pot waterAvailable 已由 v11 收编删除');
assert(state.water === 1, '旧浇水次数并入全局池（1 次）');
assert(state.plant === undefined, '旧 state.plant 字段已删除');
runMigrations(); // 幂等
assert(state.plants.length === 1 && state.plants[0].level === 3 && state.water === 1, '重复迁移幂等');

// 缺字段归一：半残老档
state._schemaVersion = 6;
delete state.plants;
state.plant = { activeType: 'magic_rose' }; // 缺 level 等字段
runMigrations();
assert(state.plants[0].level === 0 && state.plants[0].harvested === false
  && state.plants[0].waterAvailable === undefined, '半残单株字段归一补全、无旧浇水字段');

// ═══ 2. 解锁价格曲线与上限 ═══
console.log('\n=== 2. 盆位解锁（800×1.8ⁿ，上限 4）===');
state.plants = [{ ...plants.EMPTY_PLANT }];
state.coins = 10000;
assert(plants.getPotCount() === 1, '初始 1 盆');
assert(plants.getNextPotPrice() === 800, '第 2 盆 = 800');
assert(plants.canUnlockPot(), '金币充足可解锁');
assert(plants.unlockPot() === true && plants.getPotCount() === 2, '解锁第 2 盆成功');
assert(plants.getNextPotPrice() === Math.round(800 * 1.8), `第 3 盆 = ${Math.round(800 * 1.8)}`);
plants.unlockPot();
assert(plants.getNextPotPrice() === Math.round(800 * 1.8 * 1.8), `第 4 盆 = ${Math.round(800 * 1.8 * 1.8)}`);
plants.unlockPot();
assert(plants.getPotCount() === 4 && !plants.canUnlockPot(), '达到 MAX_POTS=4，不可再解锁');
assert(plants.unlockPot() === false, '上限后 unlockPot 拒绝');
assert(state.coins === 10000 - 800 - Math.round(800 * 1.8) - Math.round(800 * 1.8 * 1.8),
  '解锁总价按曲线扣款（800+1440+2592=4832）');

state.plants = [{ ...plants.EMPTY_PLANT }];
state.coins = 500;
assert(!plants.canUnlockPot() && plants.unlockPot() === false, '金币不足拒绝解锁');

// ═══ 3. 逐株操作隔离 ═══
console.log('\n=== 3. 逐株操作隔离 ===');
state.plants = [{ ...plants.EMPTY_PLANT }, { ...plants.EMPTY_PLANT }];
state.coins = 5000;
freshSeeds();
const types = Object.keys(PLANT_TYPES);
const [typeA, typeB] = types;
assert(plants.plantSeed(typeA, 0) === true, '盆 0 种下 A');
assert(plants.plantSeed(typeB, 1) === true, '盆 1 种下 B');
assert(state.plants[0].activeType === typeA && state.plants[1].activeType === typeB, '两盆各自独立');
assert(plants.plantSeed(types[2] || typeA, 0) === false, '已占盆位拒绝再种');

// 浇水全局池：不管有没有种植物都累积，可分配给任意一盆
state.water = 0;
plants.addWaterOpportunity();
assert(state.water === 1, '浇水机会全局 +1（不再逐盆发放）');
const defB = PLANT_TYPES[typeB];
const growthB0 = state.plants[1].growthProgress;
const r = plants.waterPlant(1);
assert(r.ok && state.plants[1].growthProgress > growthB0, '浇水盆 1 成长增加');
assert(state.plants[0].growthProgress === 0, '盆 0 不受影响');
assert(state.water === 0, '全局池扣减（不再各扣各的）');
// 空盆/无植物也累积
state.plants[1].activeType = null;
state.plants[1].level = 0;
plants.addWaterOpportunity();
assert(state.water === 1, '没有种植物也累积浇水次数');
state.plants[1].activeType = typeB; // 恢复盆 1（后续收获/铲除分盆断言依赖）
state.plants[1].level = 1;

// 收获盆 0：盆 1 完好
state.plants[0].level = 5;
state.plants[0].growthProgress = PLANT_TYPES[typeA].growthPerLevel;
noSeed();
const coinsBefore = state.coins;
assert(plants.canHarvest(0) && !plants.canHarvest(1), '可收获判定分盆正确');
const hr = plants.harvestPlant(0);
restoreRandom();
assert(hr && state.plants[0].activeType === null && state.plants[0].level === 0, '收获后盆 0 归零空盆');
assert(state.plants[1].activeType === typeB && state.plants[1].level === 1, '盆 1 完好');
assert(state.coins > coinsBefore, '收获得币');

// 铲除盆 1
assert(plants.abandonPlant(1).ok && state.plants[1].activeType === null, '铲除盆 1');

// 默认盆位语义（零漂移）：不传 potIndex = 盆 0
plants.plantSeed(typeA, 0);
plants.addWaterOpportunity();
const w0 = plants.waterPlant(); // 默认盆 0
assert(w0.ok && state.plants[0].growthProgress > 0, '默认 potIndex=0 兼容旧调用');

// plantSeed 默认落第一个空盆
assert(plants.plantSeed(typeB) === true && state.plants[1].activeType === typeB,
  'plantSeed 不传盆位 → 第一个空盆');

// ═══ 4. 全局循环：凋谢逐盆判定 ═══
console.log('\n=== 4. 凋谢逐盆判定 ===');
const now = Date.now();
state.plants = [
  { ...plants.EMPTY_PLANT, activeType: typeA, level: 2, lastCareTime: now, plantedAt: now },
  { ...plants.EMPTY_PLANT, activeType: typeB, level: 2, lastCareTime: now - 100 * 3600 * 1000, plantedAt: now - 100 * 3600 * 1000 },
];
assert(plants.checkWither().length === 1, '有盆凋谢返回凋谢数组（1 盆）');
assert(state.plants[0].activeType === typeA, '按时照料的盆无恙');
assert(state.plants[1].activeType === null, '72h 未照料盆凋谢清空');

console.log(`\n${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
