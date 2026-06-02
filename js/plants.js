// 植物逻辑模块 —— 浇水/施肥/成长/收获/凋谢/种子兑换（纯逻辑，不碰DOM）
import { state, saveState } from './state.js';
import { spendCoins, addCoins, addAtmosphere, addHistory } from './storage.js';
import { markTaskDone } from './dailytasks.js';
import { PLANT_TYPES, SEED_EXCHANGE } from '../data/plants.js';
import { isBookCapacityFull, hasSignboard } from './shop.js';
import { SIGNBOARDS } from '../data/signboards.js';

function getNow() {
  return window.__dev?.getNow?.() || Date.now();
}

export function getPlantDef(type) {
  return PLANT_TYPES[type] || null;
}

export function getActivePlantDef() {
  return state.plant.activeType ? PLANT_TYPES[state.plant.activeType] : null;
}

// 是否有可用浇水次数
export function canWater() {
  const def = getActivePlantDef();
  if (!def) return false;
  if (state.plant.level === 0) return false;
  if (state.plant.level >= 5 && state.plant.growthProgress >= def.growthPerLevel) return false; // 可收获
  if (state.plant.harvested) return false;
  return state.plant.waterAvailable > 0;
}

// 浇水：消耗一次机会，增加成长值
export function waterPlant() {
  const def = getActivePlantDef();
  if (!def || !canWater()) return false;

  state.plant.waterAvailable -= 1;

  // 禁止烟火标志牌：浇水有几率暴击（×2 成长）
  let waterGrowth = def.waterGrowth;
  if (hasSignboard('no_smoking')) {
    const critRate = SIGNBOARDS.no_smoking?.buff?.value || 0;
    if (Math.random() < critRate) {
      waterGrowth *= 2;
      addHistory('plant', '💥 浇水暴击！', `禁止烟火庇佑，成长 +${waterGrowth}`);
    }
  }

  state.plant.growthProgress += waterGrowth;
  state.plant.lastCareTime = getNow();

  // 检查是否升到下一级（或可收获）
  checkLevelUp(def);

  // 今日馆务
  const taskResult = markTaskDone('water', state);
  if (taskResult) {
    addHistory('task', `📜 今日馆务：${taskResult.name}`, taskResult.reward);
  }

  saveState();
  return true;
}

// 是否可施肥
export function canFertilize() {
  const def = getActivePlantDef();
  if (!def) return false;
  if (state.plant.level === 0) return false;
  if (state.plant.level >= 5 && state.plant.growthProgress >= def.growthPerLevel) return false; // 可收获
  if (state.plant.harvested) return false;
  const targetLevel = state.plant.level + 1;
  const cost = def.fertilizeCosts[targetLevel] || 0;
  return state.coins >= cost;
}

// 施肥：花费智慧之光，增加成长值
export function fertilizePlant() {
  const def = getActivePlantDef();
  if (!def || !canFertilize()) return false;

  const targetLevel = state.plant.level + 1;
  const cost = def.fertilizeCosts[targetLevel] || 0;
  if (!spendCoins(cost)) return false;

  state.plant.growthProgress += def.fertilizeGrowth;
  state.plant.lastCareTime = getNow();

  checkLevelUp(def);
  saveState();
  return true;
}

// 检查自动升级 / 可收获状态
function checkLevelUp(def) {
  const plant = state.plant;
  if (plant.level >= 5 && plant.growthProgress >= def.growthPerLevel) {
    // 满级满进度，等待主动收获
    return;
  }
  while (plant.growthProgress >= def.growthPerLevel && plant.level < 5) {
    plant.growthProgress -= def.growthPerLevel;
    plant.level += 1;
    const levelName = def.levelNames[plant.level] || '';
    addHistory('plant', `植物成长至 Lv.${plant.level} · ${levelName}`, `${def.emoji} ${def.name}`);
  }
  // 如果升到5级且进度满
  if (plant.level >= 5 && plant.growthProgress >= def.growthPerLevel) {
    plant.growthProgress = def.growthPerLevel; // 卡在满进度，等待收获
  }
}

// 是否可收获
export function canHarvest() {
  const def = getActivePlantDef();
  if (!def) return false;
  if (state.plant.level < 5) return false;
  if (state.plant.growthProgress < def.growthPerLevel) return false;
  if (state.plant.harvested) return false;
  return true;
}

// 收获：获得氛围+智慧之光，概率得种子，植物凋谢
export function harvestPlant() {
  const def = getActivePlantDef();
  if (!def || !canHarvest()) return false;

  // 奖励
  addAtmosphere(def.harvestAtmosphere);
  addCoins(def.harvestCoins);

  // 种子掉落判定
  let seedDropped = false;
  if (Math.random() < def.seedDropRate) {
    state.seeds[def.seedType] = (state.seeds[def.seedType] || 0) + 1;
    seedDropped = true;
  }

  const seedName = seedDropped ? ` + 获得 ${def.name}种子 ×1` : '';
  addHistory('plant', `收获 ${def.emoji} ${def.name}`, `+${def.harvestAtmosphere}氛围 +${def.harvestCoins}智慧之光${seedName}`);

  // 凋谢 → 空盆
  state.plant.activeType = null;
  state.plant.level = 0;
  state.plant.growthProgress = 0;
  state.plant.waterAvailable = 0;
  state.plant.harvested = false;
  state.plant.plantedAt = 0;

  saveState();
  return { seedDropped, seedType: def.seedType, def };
}

// 检测72小时自然凋谢
export function checkWither() {
  if (!state.plant.activeType) return false;
  if (state.plant.level === 0) return false;

  const now = getNow();
  const lastCare = state.plant.lastCareTime || state.plant.plantedAt;
  const hoursSinceCare = (now - lastCare) / (1000 * 60 * 60);

  if (hoursSinceCare >= 72) {
    const def = getActivePlantDef();
    addHistory('plant', `${def ? def.emoji + ' ' + def.name : '植物'}凋谢了`, '72小时未照料，植物枯萎');
    state.plant.activeType = null;
    state.plant.level = 0;
    state.plant.growthProgress = 0;
    state.plant.waterAvailable = 0;
    state.plant.harvested = false;
    state.plant.plantedAt = 0;
    saveState();
    return true;
  }
  return false;
}

// 购买盆栽开始种植
export function plantSeed(plantType) {
  const def = PLANT_TYPES[plantType];
  if (!def) return false;
  if (state.plant.activeType) return false; // 已有一盆
  const cost = def.fertilizeCosts[1] || 50;
  if (!spendCoins(cost)) return false;

  state.plant.activeType = plantType;
  state.plant.level = 1;
  state.plant.growthProgress = 0;
  state.plant.waterAvailable = 0;
  state.plant.lastCareTime = getNow();
  state.plant.plantedAt = getNow();
  state.plant.harvested = false;

  addHistory('plant', `种下 ${def.emoji} ${def.name}`, `花费${cost}智慧之光`);
  saveState();
  return true;
}

// 种子兑换检查
export function canExchangeSeed(seedType) {
  const config = SEED_EXCHANGE[seedType];
  if (!config) return false;
  if (state.seeds[seedType] < config.required) return false;
  if (state.books[config.rewardBookId] && state.books[config.rewardBookId].status !== 'locked') return false;
  return true;
}

// 种子兑换书籍
export function exchangeSeed(seedType) {
  if (!canExchangeSeed(seedType)) return false;
  if (isBookCapacityFull()) return false;

  const config = SEED_EXCHANGE[seedType];
  state.seeds[seedType] -= config.required;

  state.books[config.rewardBookId] = {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'unlocked',
    starred: false,
    damaged: false,
    repairWords: 0
  };

  addHistory('plant', `种子兑换《${config.rewardTitle}》`, `消耗${config.required}颗种子`);
  saveState();
  return true;
}

// 添加浇水机会（由专注完成触发）
export function addWaterOpportunity() {
  if (state.plant.activeType && state.plant.level > 0 && !state.plant.harvested) {
    state.plant.waterAvailable += 1;
    saveState();
  }
}
