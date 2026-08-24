// 植物台风灾难概率模拟
// 运行：node scripts/plant-typhoon-sim.mjs

import { PLANT_TYPES } from '../data/plants.js';

const PLANT_DEF = PLANT_TYPES.bird_of_paradise; // 以天堂鸟为例（成长最快）
// const PLANT_DEF = PLANT_TYPES.magic_rose;     // 魔法玫瑰
// const PLANT_DEF = PLANT_TYPES.starlight_fern; // 星光蕨

const MINUTES_PER_DAY = 24 * 60;

function simulateOne(setup) {
  const {
    focusPerDay,
    waterPerFocus,
    useFertilize,
    startWaterStock,
    typhoonProb,
    typhoonCooldownMin,
    newPlantGracePeriodMin,
    playSessionHoursPerDay
  } = setup;

  const focusIntervalMin = MINUTES_PER_DAY / focusPerDay;
  const playMinutesPerDay = playSessionHoursPerDay * 60;

  let plant = {
    activeType: PLANT_DEF.id,
    level: 1,
    growthProgress: 0,
    waterAvailable: startWaterStock || 0,
    lastCareTime: 0,
    plantedAt: 0,
    harvested: false
  };

  let lastTyphoonTime = -typhoonCooldownMin;
  let minutesPassed = 0;
  let typhoons = 0;
  let waters = 0;
  let fertilizes = 0;
  let nextFocusAt = focusIntervalMin;

  while (true) {
    // 判断是否在当前游戏时段内（玩家每天只玩 playSessionHoursPerDay 小时）
    const minuteOfDay = minutesPassed % MINUTES_PER_DAY;
    const isPlaying = minuteOfDay < playMinutesPerDay;

    // 台风检查：只在游戏时段、过了冷却期、过了新植物保护期后判定
    if (isPlaying &&
        minutesPassed - lastTyphoonTime >= typhoonCooldownMin &&
        minutesPassed >= newPlantGracePeriodMin) {
      if (Math.random() < typhoonProb) {
        typhoons++;
        lastTyphoonTime = minutesPassed;
        return {
          survived: false,
          minutesPassed,
          typhoons,
          waters,
          fertilizes,
          reason: 'typhoon'
        };
      }
    }

    // 专注完成，获得浇水机会
    if (isPlaying && minutesPassed >= nextFocusAt) {
      plant.waterAvailable += waterPerFocus;
      nextFocusAt += focusIntervalMin;
    }

    // 使用浇水机会
    while (plant.waterAvailable > 0) {
      if (plant.level >= 5 && plant.growthProgress >= PLANT_DEF.growthPerLevel) {
        return {
          survived: true,
          minutesPassed,
          typhoons,
          waters,
          fertilizes,
          reason: 'matured'
        };
      }

      plant.waterAvailable--;
      plant.growthProgress += PLANT_DEF.waterGrowth;
      plant.lastCareTime = minutesPassed;
      waters++;

      while (plant.growthProgress >= PLANT_DEF.growthPerLevel && plant.level < 5) {
        plant.growthProgress -= PLANT_DEF.growthPerLevel;
        plant.level++;
      }
      if (plant.level >= 5 && plant.growthProgress > PLANT_DEF.growthPerLevel) {
        plant.growthProgress = PLANT_DEF.growthPerLevel;
      }
    }

    // 施肥
    if (isPlaying && useFertilize &&
        minutesPassed >= nextFocusAt - focusIntervalMin &&
        minutesPassed < nextFocusAt) {
      const targetLevel = plant.level + 1;
      const cost = PLANT_DEF.fertilizeCosts[targetLevel];
      if (cost) {
        plant.growthProgress += PLANT_DEF.fertilizeGrowth;
        plant.lastCareTime = minutesPassed;
        fertilizes++;
        while (plant.growthProgress >= PLANT_DEF.growthPerLevel && plant.level < 5) {
          plant.growthProgress -= PLANT_DEF.growthPerLevel;
          plant.level++;
        }
        if (plant.level >= 5 && plant.growthProgress > PLANT_DEF.growthPerLevel) {
          plant.growthProgress = PLANT_DEF.growthPerLevel;
        }
      }
    }

    minutesPassed++;

    if (minutesPassed > MINUTES_PER_DAY * 365) {
      return {
        survived: true,
        minutesPassed,
        typhoons,
        waters,
        fertilizes,
        reason: 'timeout'
      };
    }
  }
}

function runScenario(name, setup, trials = 10000) {
  let survived = 0;
  let died = 0;
  let totalMinutes = 0;
  let totalWaters = 0;
  let totalFertilizes = 0;
  let totalTyphoons = 0;

  for (let i = 0; i < trials; i++) {
    const result = simulateOne(setup);
    if (result.survived) survived++;
    else died++;
    totalMinutes += result.minutesPassed;
    totalWaters += result.waters;
    totalFertilizes += result.fertilizes;
    totalTyphoons += result.typhoons;
  }

  const daysAvg = (totalMinutes / trials / MINUTES_PER_DAY).toFixed(1);
  const watersAvg = (totalWaters / trials).toFixed(1);
  const fertilizesAvg = (totalFertilizes / trials).toFixed(1);
  const typhoonsAvg = (totalTyphoons / trials).toFixed(3);
  const deathRate = (died / trials * 100).toFixed(2);

  console.log(`${name}`);
  console.log(`  死亡率: ${deathRate}%`);
  console.log(`  平均成熟天数: ${daysAvg} 天`);
  console.log(`  平均浇水次数: ${watersAvg}`);
  console.log(`  平均施肥次数: ${fertilizesAvg}`);
  console.log(`  平均每株遭遇台风: ${typhoonsAvg}`);
  console.log('');
}

console.log('=== 植物台风灾难概率模拟 ===');
console.log(`植物: ${PLANT_DEF.id}`);
console.log(`每级成长: ${PLANT_DEF.growthPerLevel}, 浇水成长: ${PLANT_DEF.waterGrowth}, 施肥成长: ${PLANT_DEF.fertilizeGrowth}`);
console.log(`可收获需总成长: ${PLANT_DEF.growthPerLevel * 5}`);
console.log('');

console.log('--- 当前参数：概率 0.0005/分钟，7 天冷却，48 小时新植物保护期，每天玩 2 小时 ---');
runScenario('轻度玩家：每天 1 次专注', {
  focusPerDay: 1, waterPerFocus: 1, useFertilize: false, startWaterStock: 0,
  typhoonProb: 0.0005, typhoonCooldownMin: 7 * 24 * 60, newPlantGracePeriodMin: 48 * 60, playSessionHoursPerDay: 2
});
runScenario('普通玩家：每天 3 次专注', {
  focusPerDay: 3, waterPerFocus: 1, useFertilize: false, startWaterStock: 0,
  typhoonProb: 0.0005, typhoonCooldownMin: 7 * 24 * 60, newPlantGracePeriodMin: 48 * 60, playSessionHoursPerDay: 2
});
runScenario('重度玩家：每天 6 次专注', {
  focusPerDay: 6, waterPerFocus: 1, useFertilize: false, startWaterStock: 0,
  typhoonProb: 0.0005, typhoonCooldownMin: 7 * 24 * 60, newPlantGracePeriodMin: 48 * 60, playSessionHoursPerDay: 2
});

console.log('--- 更现实的在线时长：每天玩 2 小时 ---');
runScenario('轻度玩家：每天 1 次专注 / 玩 2 小时', {
  focusPerDay: 1, waterPerFocus: 1, useFertilize: false, startWaterStock: 0,
  typhoonProb: 0.003, typhoonCooldownMin: 7 * 24 * 60, newPlantGracePeriodMin: 0, playSessionHoursPerDay: 2
});
runScenario('普通玩家：每天 3 次专注 / 玩 2 小时', {
  focusPerDay: 3, waterPerFocus: 1, useFertilize: false, startWaterStock: 0,
  typhoonProb: 0.003, typhoonCooldownMin: 7 * 24 * 60, newPlantGracePeriodMin: 0, playSessionHoursPerDay: 2
});

console.log('--- 方案 A：新植物 48 小时保护期 ---');
runScenario('普通玩家：每天 3 次专注 / 48h 保护期', {
  focusPerDay: 3, waterPerFocus: 1, useFertilize: false, startWaterStock: 0,
  typhoonProb: 0.003, typhoonCooldownMin: 7 * 24 * 60, newPlantGracePeriodMin: 48 * 60, playSessionHoursPerDay: 2
});

console.log('--- 方案 B：台风概率降至 0.0005 ---');
runScenario('普通玩家：每天 3 次专注 / 概率 0.0005', {
  focusPerDay: 3, waterPerFocus: 1, useFertilize: false, startWaterStock: 0,
  typhoonProb: 0.0005, typhoonCooldownMin: 7 * 24 * 60, newPlantGracePeriodMin: 0, playSessionHoursPerDay: 2
});

console.log('--- 方案 C：48h 保护期 + 概率 0.0005 ---');
runScenario('普通玩家：每天 3 次专注 / 48h 保护期 + 概率 0.0005', {
  focusPerDay: 3, waterPerFocus: 1, useFertilize: false, startWaterStock: 0,
  typhoonProb: 0.0005, typhoonCooldownMin: 7 * 24 * 60, newPlantGracePeriodMin: 48 * 60, playSessionHoursPerDay: 2
});

console.log('注：');
console.log('1. 假设玩家一获得浇水机会就立即使用。');
console.log('2. 不考虑谷雨抢救（50% 概率），若考虑则死亡率约为上述数值的一半。');
console.log('3. 当前代码中台风检查在游戏标签页打开时每分钟执行一次。');
