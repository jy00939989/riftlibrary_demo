// 植物逻辑模块 —— 浇水/施肥/成长/收获/凋谢/铲除/种子兑换（纯逻辑，不碰DOM）
import { state, saveState } from './state.js';
import { spendCoins, addCoins, addAtmosphere, addHistory, addInspiration } from './storage.js';
import { markTaskDone } from './dailytasks.js';
import { PLANT_TYPES, SEED_EXCHANGE } from '../data/plants.js';
import { isBookCapacityFull, isManuscriptBoxFull, addToManuscriptBox } from './capacity.js';
import { createBookRecord } from './core/book-utils.js';
import { hasSignboard } from './shop.js';
import { SIGNBOARDS } from '../data/signboards.js';
import { EMPTY_PLANT } from './state/migrations.js';
import { getAuraPlantGrowth } from './visitors.js';
import { t } from './i18n/terms.js';

function getNow() {
  return window.__dev?.getNow?.() || Date.now();
}

export function getPlantDef(type) {
  return PLANT_TYPES[type] || null;
}

export function getActivePlantDef() {
  return state.plant.activeType ? PLANT_TYPES[state.plant.activeType] : null;
}

// ========== 种子计数 helper ==========

export function addSeed(seedType, n = 1) {
  if (!seedType || n <= 0) return;
  state.seeds[seedType] = (state.seeds[seedType] || 0) + n;
  saveState();
}

export function spendSeed(seedType, n = 1) {
  if (!seedType || n <= 0) return false;
  if ((state.seeds[seedType] || 0) < n) return false;
  state.seeds[seedType] -= n;
  saveState();
  return true;
}

// ========== 成长计算（含谷雨光环） ==========

function getPlantGrowthMultiplier() {
  const aura = getAuraPlantGrowth();
  return 1 + aura;
}

function applyGrowth(baseGrowth) {
  const mult = getPlantGrowthMultiplier();
  return Math.round(baseGrowth * mult);
}

// 是否有可用浇水次数
export function canWater() {
  const def = getActivePlantDef();
  if (!def) return false;
  if (state.plant.level === 0) return false;
  if (state.plant.level >= 5 && state.plant.growthProgress >= def.growthPerLevel) return false;
  if (state.plant.harvested) return false;
  return state.plant.waterAvailable > 0;
}

// 浇水：消耗一次机会，增加成长值
export function waterPlant() {
  const def = getActivePlantDef();
  if (!def || !canWater()) return { ok: false, justMatured: false };

  const wasHarvestable = canHarvest();
  state.plant.waterAvailable -= 1;

  // 禁止烟火标志牌：浇水有几率暴击（×2 成长）
  let waterGrowth = def.waterGrowth;
  let crit = false;
  if (hasSignboard('no_smoking')) {
    const critRate = SIGNBOARDS.no_smoking?.buff?.value || 0;
    if (Math.random() < critRate) {
      waterGrowth *= 2;
      crit = true;
    }
  }

  const actualGrowth = applyGrowth(waterGrowth);
  state.plant.growthProgress += actualGrowth;
  state.plant.lastCareTime = getNow();

  // 检查是否升到下一级（或可收获）
  checkLevelUp(def);

  // 今日馆务
  const taskResult = markTaskDone('water', state);
  if (taskResult) {
    addHistory('task', `📜 今日馆务：${taskResult.name}`, taskResult.reward);
  }

  const justMatured = !wasHarvestable && canHarvest();
  if (crit) {
    addHistory('plant', '💥 浇水暴击！', `禁止烟火庇佑，成长 +${actualGrowth}`);
  }
  saveState();
  return { ok: true, justMatured, actualGrowth };
}

// 是否可施肥
export function canFertilize() {
  const def = getActivePlantDef();
  if (!def) return false;
  if (state.plant.level === 0) return false;
  if (state.plant.level >= 5 && state.plant.growthProgress >= def.growthPerLevel) return false;
  if (state.plant.harvested) return false;
  const targetLevel = state.plant.level + 1;
  const cost = def.fertilizeCosts[targetLevel] || 0;
  return state.coins >= cost;
}

// 施肥：花费智慧之光，增加成长值
export function fertilizePlant() {
  const def = getActivePlantDef();
  if (!def || !canFertilize()) return { ok: false, justMatured: false };

  const wasHarvestable = canHarvest();
  const targetLevel = state.plant.level + 1;
  const cost = def.fertilizeCosts[targetLevel] || 0;
  if (!spendCoins(cost)) return { ok: false, justMatured: false };

  const actualGrowth = applyGrowth(def.fertilizeGrowth);
  state.plant.growthProgress += actualGrowth;
  state.plant.lastCareTime = getNow();

  checkLevelUp(def);

  const justMatured = !wasHarvestable && canHarvest();
  saveState();
  return { ok: true, justMatured, actualGrowth };
}

// 检查自动升级 / 可收获状态
function checkLevelUp(def) {
  const plant = state.plant;
  if (plant.level >= 5 && plant.growthProgress >= def.growthPerLevel) {
    return;
  }
  while (plant.growthProgress >= def.growthPerLevel && plant.level < 5) {
    plant.growthProgress -= def.growthPerLevel;
    plant.level += 1;
    const levelName = def.levelNames[plant.level] || '';
    addHistory('plant', `植物成长至 Lv.${plant.level} · ${levelName}`, `${def.emoji} ${t(def.nameKey)}`);
  }
  if (plant.level >= 5 && plant.growthProgress >= def.growthPerLevel) {
    plant.growthProgress = def.growthPerLevel;
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

  addAtmosphere(def.harvestAtmosphere);
  addCoins(def.harvestCoins);

  let seedDropped = false;
  if (Math.random() < def.seedDropRate) {
    addSeed(def.seedType, 1);
    seedDropped = true;
  }

  const seedName = seedDropped ? ` + 获得 ${t(def.nameKey)}种子 ×1` : '';
  addHistory('plant', `收获 ${def.emoji} ${t(def.nameKey)}`, `+${def.harvestAtmosphere}氛围 +${def.harvestCoins}智慧之光${seedName}`);

  // 凋谢 → 空盆
  resetPlantToEmpty();

  saveState();
  return { seedDropped, seedType: def.seedType, def };
}

// 铲除当前植物
export function abandonPlant() {
  const def = getActivePlantDef();
  if (!def) return { ok: false, reason: 'no_plant' };

  resetPlantToEmpty();
  addHistory('plant', `铲除 ${def.emoji} ${t(def.nameKey)}`, '盆栽已清空，可以重新种植');
  saveState();
  return { ok: true, def };
}

function resetPlantToEmpty() {
  Object.keys(EMPTY_PLANT).forEach(key => {
    state.plant[key] = EMPTY_PLANT[key];
  });
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
    addHistory('plant', `${def ? def.emoji + ' ' + t(def.nameKey) : '植物'}凋谢了`, '72小时未照料，植物枯萎');
    resetPlantToEmpty();
    saveState();
    return true;
  }
  return false;
}

// 购买盆栽开始种植
export function plantSeed(plantType) {
  const def = PLANT_TYPES[plantType];
  if (!def) return false;
  if (state.plant.activeType) return false;
  const cost = def.fertilizeCosts[1] || 50;
  if (!spendCoins(cost)) return false;

  state.plant.activeType = plantType;
  state.plant.level = 1;
  state.plant.growthProgress = 0;
  state.plant.waterAvailable = 0;
  state.plant.lastCareTime = getNow();
  state.plant.plantedAt = getNow();
  state.plant.harvested = false;

  addHistory('plant', `种下 ${def.emoji} ${t(def.nameKey)}`, `花费${cost}智慧之光`);
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

// ========== 种子兑换（数组版） ==========

export function getSeedExchangeItem(seedType, index) {
  const list = SEED_EXCHANGE[seedType];
  if (!list || index < 0 || index >= list.length) return null;
  return list[index];
}

function isOneTimeExchanged(item) {
  if (item.repeatable !== false) return false;
  if (item.type === 'book') {
    const bs = state.books[item.rewardBookId];
    return bs && bs.status !== 'locked';
  }
  if (item.type === 'seed') {
    // 一次性 seed 兑换：只要目标种子已解锁/有库存即视为已换过
    return (state.seeds[item.seedType] || 0) > 0;
  }
  return false;
}

export function canExchangeSeed(seedType, index) {
  const item = getSeedExchangeItem(seedType, index);
  if (!item) return false;
  if ((state.seeds[seedType] || 0) < item.required) return false;
  if (isOneTimeExchanged(item)) return false;
  if (item.type === 'book') {
    if (isManuscriptBoxFull()) return false;
  }
  return true;
}

export function exchangeSeed(seedType, index) {
  const item = getSeedExchangeItem(seedType, index);
  if (!item || !canExchangeSeed(seedType, index)) return false;

  if (!spendSeed(seedType, item.required)) return false;

  switch (item.type) {
    case 'book': {
      state.books[item.rewardBookId] = createBookRecord();
      addToManuscriptBox(item.rewardBookId);
      addHistory('plant', `种子兑换《${t(item.rewardTitleKey)}》`, `消耗${item.required}颗种子`);
      break;
    }
    case 'coins': {
      addCoins(item.value);
      addHistory('plant', '种子兑换智慧之光', `消耗${item.required}颗种子 · +${item.value}智慧之光`);
      break;
    }
    case 'atmosphere': {
      addAtmosphere(item.value);
      addHistory('plant', '种子兑换氛围', `消耗${item.required}颗种子 · +${item.value}氛围`);
      break;
    }
    case 'inspiration': {
      addInspiration(item.value);
      addHistory('plant', '种子兑换灵感', `消耗${item.required}颗种子 · +${item.value}灵感`);
      break;
    }
    case 'seed': {
      addSeed(item.seedType, item.count);
      addHistory('plant', '种子兑换种子', `消耗${item.required}颗种子 · 获得 ${t(item.rewardTitleKey)} ×${item.count}`);
      break;
    }
    default: {
      console.warn('未实现的种子兑换奖励类型', item.type);
      return false;
    }
  }

  saveState();
  return true;
}

// 返回该种子的所有可兑换项及当前进度（UI 用）
export function getSeedExchanges(seedType) {
  const list = SEED_EXCHANGE[seedType];
  if (!list) return [];
  const count = state.seeds[seedType] || 0;
  return list.map((item, index) => ({
    ...item,
    index,
    current: count,
    canExchange: canExchangeSeed(seedType, index),
    exchanged: isOneTimeExchanged(item)
  }));
}

// 兼容旧版：无 index 时返回第一个可兑换项
export function getFirstExchangeableSeedIndex(seedType) {
  const list = SEED_EXCHANGE[seedType];
  if (!list) return -1;
  for (let i = 0; i < list.length; i++) {
    if (canExchangeSeed(seedType, i)) return i;
  }
  return -1;
}

//  disaster / care 等由 visitors.js 调用，保持 plants.js 作为状态 owner
export { EMPTY_PLANT };
