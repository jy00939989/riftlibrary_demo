#!/usr/bin/env node
// 温室培育线（2026-09-21 图南四决策）测试
// 覆盖：迁移 v16 默认值/喷壶泼溅（Lv2 两盆全额、Lv3 全部均分 2 份）/
//       储水设施（长专注档位 + 离线蓄水封顶 + 升级锚点重置）/改良品种（种子解锁、掉率、多年生回落）/
//       绿手指（阈值等级 + 成长加成）
// 用法：node scripts/test-greenhouse-upgrades.mjs

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
const { runMigrations, EMPTY_PLANT } = await import('../js/state/migrations.js');
const plants = await import('../js/plants.js');
const { PLANT_TYPES, WATERING_CANS, WATER_TANKS, GREEN_THUMB } = await import('../data/plants.js');

const RealDate = Date;
const T0 = new RealDate('2026-09-21T12:00:00').getTime();
const HOUR = 3600 * 1000;
window.__dev = { getNow: () => T0 };

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { console.log(`  ✅ ${msg}`); pass++; }
  else { console.log(`  ❌ ${msg}`); fail++; }
}
const realRandom = Math.random;

// 种一株指定类型/等级的植物到指定盆位（绕过金币直接落状态）
function plantDirect(potIndex, type, level = 1, growthProgress = 0) {
  while (state.plants.length <= potIndex) {
    state.plants.push({ ...EMPTY_PLANT });
  }
  state.plants[potIndex] = {
    activeType: type, level, growthProgress,
    lastCareTime: T0, plantedAt: T0, harvested: false
  };
}

console.log('\n[1] 迁移 v16 默认值（幂等）');
state._schemaVersion = 15;
runMigrations();
assert(state._schemaVersion === 16, 'schema 升到 v16');
assert(state.wateringCanLevel === 1 && state.waterTankLevel === 1, '喷壶/水箱默认 Lv1');
assert(state.improvedPlants && typeof state.improvedPlants === 'object' && !Object.keys(state.improvedPlants).length, '改良品种表默认空');
assert(state.plantHarvests === 0, '绿手指计数默认 0');
assert(typeof state.waterOfflineAt === 'number', '离线蓄水锚点已播种');
const snapshot = JSON.stringify([state.wateringCanLevel, state.waterTankLevel, state.improvedPlants, state.plantHarvests]);
runMigrations();
assert(JSON.stringify([state.wateringCanLevel, state.waterTankLevel, state.improvedPlants, state.plantHarvests]) === snapshot, '重复迁移幂等');

console.log('\n[2] 喷壶升级（金币门槛 + 升档）');
Math.random = () => 0.99; // 禁暴击（no_smoking 未持有，双保险）
state.coins = 1000;
state.wateringCanLevel = 1;
assert(plants.canUpgradeCan() === true, 'Lv1→Lv2 可升级（800 ≤ 1000）');
assert(plants.upgradeCan() === true, '升级成功');
assert(state.wateringCanLevel === 2 && state.coins === 200, '扣 800 升 Lv2');
assert(plants.canUpgradeCan() === false, '金币不足拒绝升级 Lv3');
assert(state.wateringCanLevel === 2, '拒绝后等级不变');

console.log('\n[3] 喷壶 Lv2：1 水浇 2 盆（点击盆 + 最缺水盆，各全额）');
state.water = 1;
plantDirect(0, 'bird_of_paradise', 2, 60); // 进度 60/80 = 75%
plantDirect(1, 'bird_of_paradise', 1, 0);  // 最缺水
plantDirect(2, 'bird_of_paradise', 1, 40); // 50%
let r = plants.waterPlant(0);
assert(r.ok && r.watered.length === 2, '一瓢浇 2 盆');
assert(r.watered[0].potIndex === 0, '点击盆必在目标内');
assert(r.watered.some(w => w.potIndex === 1), '捎带最缺水的盆 1');
assert(!r.watered.some(w => w.potIndex === 2), '盆 2（较不缺水）未被捎带');
// 盆 0：60+25=85 ≥ 80 触发升级 → Lv3 进度 5；盆 1：0+25=25
assert(state.plants[0].level === 3 && state.plants[0].growthProgress === 5, '盆 0 全额 +25 并触发升级（85-80=5）');
assert(state.plants[1].level === 1 && state.plants[1].growthProgress === 25, '盆 1 全额 +25');
assert(state.water === 0, '全局池只扣 1');

console.log('\n[4] 喷壶 Lv3：1 水浇全部活盆，总 2 份均分');
state.coins = 99999;
state.wateringCanLevel = 3;
state.water = 1;
plantDirect(0, 'bird_of_paradise', 1, 0);
plantDirect(1, 'bird_of_paradise', 1, 0);
plantDirect(2, 'bird_of_paradise', 1, 0);
plantDirect(3, 'bird_of_paradise', 1, 0);
r = plants.waterPlant(0);
assert(r.ok && r.watered.length === 4, '一瓢浇全部 4 盆');
const perPot = Math.round(25 * 2 / 4);
assert(state.plants.every(p => p.growthProgress === perPot), `每盆均分 2 份（+${perPot}）`);
assert(state.water === 0, '全局池只扣 1');
// 3 盆时各 2/3 份
state.water = 1;
state.plants[3] = { ...EMPTY_PLANT };
r = plants.waterPlant(0);
assert(r.watered.length === 3 && state.plants.slice(0, 3).every(p => p.growthProgress === perPot + Math.round(25 * 2 / 3)), '3 盆时各得 2/3 份');

console.log('\n[5] 储水设施：专注档位（番茄钟产水不变，长专注多得）');
state.waterTankLevel = 1;
state.water = 0;
assert(plants.addWaterOpportunity(20) === 1 && state.water === 1, 'Lv1：20min +1');
state.waterTankLevel = 2;
assert(plants.addWaterOpportunity(30) === 1 && state.water === 2, 'Lv2：30min 仍 +1（番茄钟不变）');
assert(plants.addWaterOpportunity(45) === 2 && state.water === 4, 'Lv2：45min +2');
state.waterTankLevel = 3;
assert(plants.addWaterOpportunity(44) === 1, 'Lv3：44min +1');
assert(plants.addWaterOpportunity(90) === 3 && state.water === 8, 'Lv3：90min +3');

console.log('\n[6] 储水设施：离线蓄水（封顶 + 锚点）');
state.waterTankLevel = 1;
state.waterOfflineAt = T0;
assert(plants.grantOfflineWater(T0 + 24 * HOUR) === 0, 'Lv1 陶罐无离线蓄水');
state.waterTankLevel = 2;
state.water = 0;
state.waterOfflineAt = T0;
assert(plants.grantOfflineWater(T0 + 13 * HOUR) === 2 && state.water === 2, '13h → +2（每 6h 一份）');
state.waterOfflineAt = T0;
state.water = 0;
assert(plants.grantOfflineWater(T0 + 30 * HOUR) === 4 && state.water === 4, '30h 封顶 +4');
assert(plants.grantOfflineWater(T0 + 31 * HOUR) === 0, '锚点已推进，1h 后不足周期不发放');
// 升级重置锚点（不追溯）
state.waterTankLevel = 2;
state.waterOfflineAt = T0 - 100 * HOUR;
state.coins = 99999;
plants.upgradeTank();
assert(state.waterTankLevel === 3 && state.waterOfflineAt === T0, '升级蓄水池：等级提升且锚点重置为当下');

console.log('\n[7] 改良品种：种子解锁（sink）');
state.seeds.bird_of_paradise = 1;
assert(plants.canUnlockImproved('bird_of_paradise') === false, '种子不足（1<2）拒绝解锁');
assert(plants.unlockImproved('bird_of_paradise') === false, '解锁失败不扣种子');
state.seeds.bird_of_paradise = 2;
assert(plants.canUnlockImproved('bird_of_paradise') === true, '2 颗种子可解锁鹤望兰');
assert(plants.unlockImproved('bird_of_paradise') === true && state.seeds.bird_of_paradise === 0, '解锁消耗 2 颗种子');
assert(plants.isImproved('bird_of_paradise') === true, '解锁标记生效');
assert(plants.getEffectiveSeedDropRate('bird_of_paradise') === 0.9, '掉率 0.6→0.9');
assert(plants.getEffectiveSeedDropRate('magic_rose') === 0.6, '未改良品种掉率不变');
assert(plants.canUnlockImproved('bird_of_paradise') === false, '已改良不可重复解锁');

console.log('\n[8] 多年生收获：回落 Lv3 保留植株 + 计数');
state.coins = 99999;
plantDirect(0, 'bird_of_paradise', 5, PLANT_TYPES.bird_of_paradise.growthPerLevel);
state.plantHarvests = 0;
Math.random = () => 0.5; // < 0.9 必掉
state.seeds.bird_of_paradise = 0;
r = plants.harvestPlant(0);
assert(r && r.perennial === true && r.seedDropped === true, '改良种收获：掉种子 + 多年生标记');
assert(state.plants[0].activeType === 'bird_of_paradise' && state.plants[0].level === 3 && state.plants[0].growthProgress === 0, '回落 Lv3 清空进度、植株保留');
assert(state.plants[0].harvested === false, '多年生不设 harvested 标记');
assert(state.plantHarvests === 1, '绿手指计数 +1');
assert(state.seeds.bird_of_paradise === 1, '种子入袋');
// 未改良品种收获仍清盆（旧行为保持）
plantDirect(1, 'magic_rose', 5, PLANT_TYPES.magic_rose.growthPerLevel);
Math.random = () => 0.99; // > 0.6 不掉
r = plants.harvestPlant(1);
assert(r && r.perennial === false && state.plants[1].activeType === null && state.plants[1].level === 0, '普通品种收获后清盆');

console.log('\n[9] 绿手指：阈值等级 + 成长加成');
state.plantHarvests = 0;
assert(plants.getGreenThumbLevel() === 0, '0 收获 Lv0');
state.plantHarvests = 3;
assert(plants.getGreenThumbLevel() === 1, '3 收获 Lv1（早期甜头不变）');
state.plantHarvests = 19;
assert(plants.getGreenThumbLevel() === 1, '19 收获仍 Lv1（阶梯已放大）');
state.plantHarvests = 20;
assert(plants.getGreenThumbLevel() === 2, '20 收获 Lv2');
assert(plants.getGreenThumbProgress().next === 50, '下一档 50 次');
state.plantHarvests = 200;
assert(plants.getGreenThumbLevel() === 5 && plants.getGreenThumbProgress().next === null, '200 收获满级');
// Lv2 加成：浇水 25 × 1.1 = 27.5 → 28（注意先把计数设为 20=Lv2，避免其他档位干扰）
state.plantHarvests = 20;
state.wateringCanLevel = 1;
state.water = 1;
plantDirect(0, 'bird_of_paradise', 1, 0);
r = plants.waterPlant(0);
assert(r.actualGrowth === Math.round(25 * (1 + GREEN_THUMB.bonusPerLevel * 2)), `绿手指 Lv2 浇水加成生效（+${r.actualGrowth}）`);

console.log(`\n========== 结果: ${pass} 通过, ${fail} 失败 ==========`);
Math.random = realRandom;
process.exit(fail > 0 ? 1 : 0);
