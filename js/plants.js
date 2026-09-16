// 植物逻辑模块 —— 浇水/施肥/成长/收获/凋谢/铲除/种子兑换/盆位扩容（纯逻辑，不碰DOM）
// 温室花盆扩容（cafe-corner-plan §2.6 Phase 0）：state.plants 数组最多 4 盆，
// 单株数据结构不变；所有单株函数 potIndex 参数化（默认 0 = 原单株语义）。
import { state, saveState } from './state.js';
import { spendCoins, addCoins, addAtmosphere, addHistory, addInspiration } from './storage.js';
import { markTaskDone } from './dailytasks.js';
import { PLANT_TYPES, SEED_EXCHANGE } from '../data/plants.js';
import { isBookCapacityFull, isManuscriptBoxFull, addToManuscriptBox, getManuscriptSlots, getManuscriptBoxCount } from './capacity.js';
import { createBookRecord } from './core/book-utils.js';
import { hasSignboard } from './shop.js';
import { SIGNBOARDS } from '../data/signboards.js';
import { EMPTY_PLANT } from './state/migrations.js';
import { getAuraPlantGrowth } from './visitors.js';
import { addDiaryEntry } from './diary.js';
import { t } from './i18n/terms.js';

// 盆位上限（§2.6：浇水交互密度手感上限，超出需一键浇水——开放项）
export const MAX_POTS = 4;
// 新盆解锁价：800×1.8ⁿ（n=现有盆数-1），无阶段门槛（植物是休闲系统）
const POT_BASE_PRICE = 800;
const POT_PRICE_GROWTH = 1.8;

function getNow() {
  return window.__dev?.getNow?.() || Date.now();
}

function getPot(potIndex = 0) {
  return (state.plants || [])[potIndex] || null;
}

/** 全部活盆下标（种有植物且 level>0），访客事件/行动卡/浇水机会用 */
export function getActivePotIndices() {
  return (state.plants || [])
    .map((p, i) => (p && p.activeType && p.level > 0 ? i : -1))
    .filter(i => i >= 0);
}

/** 第一个空盆下标，没有则 -1 */
export function getFirstEmptyPotIndex() {
  const idx = (state.plants || []).findIndex(p => !p || !p.activeType || p.level === 0);
  return idx >= 0 ? idx : -1;
}

// ========== 盆位扩容 ==========

export function getPotCount() {
  return (state.plants || []).length;
}

export function getNextPotPrice() {
  return Math.round(POT_BASE_PRICE * Math.pow(POT_PRICE_GROWTH, getPotCount() - 1));
}

export function canUnlockPot() {
  return getPotCount() < MAX_POTS && state.coins >= getNextPotPrice();
}

export function unlockPot() {
  if (!canUnlockPot()) return false;
  const price = getNextPotPrice();
  spendCoins(price);
  state.plants.push({ ...EMPTY_PLANT });
  addHistory('plant', '🪴 温室扩了一盆新花', `花费${price}智慧之光（${getPotCount()}/${MAX_POTS} 盆）`);
  saveState();
  return true;
}

// ========== 单株查询 ==========

export function getPlantDef(type) {
  return PLANT_TYPES[type] || null;
}

export function getActivePlantDef(potIndex = 0) {
  const pot = getPot(potIndex);
  return pot && pot.activeType ? PLANT_TYPES[pot.activeType] : null;
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

// 是否有可用浇水次数（2026-09-15 起全局池：state.water，可分配给任意一盆）
export function getWaterCount() {
  return state.water || 0;
}

export function canWater(potIndex = 0) {
  const plant = getPot(potIndex);
  if (!plant) return false;
  const def = getActivePlantDef(potIndex);
  if (!def) return false;
  if (plant.level === 0) return false;
  if (plant.level >= 5 && plant.growthProgress >= def.growthPerLevel) return false;
  if (plant.harvested) return false;
  return (state.water || 0) > 0;
}

// 浇水：消耗一次全局浇水次数，增加成长值
export function waterPlant(potIndex = 0) {
  const plant = getPot(potIndex);
  const def = getActivePlantDef(potIndex);
  if (!plant || !def || !canWater(potIndex)) return { ok: false, justMatured: false };

  const wasHarvestable = canHarvest(potIndex);
  state.water = (state.water || 0) - 1;

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
  plant.growthProgress += actualGrowth;
  plant.lastCareTime = getNow();

  // 检查是否升到下一级（或可收获）
  checkLevelUp(def, plant);

  // 今日馆务
  const taskResult = markTaskDone('water', state);
  if (taskResult) {
    addHistory('task', `📜 今日馆务：${taskResult.name}`, taskResult.reward);
  }

  const justMatured = !wasHarvestable && canHarvest(potIndex);
  if (crit) {
    addHistory('plant', '💥 浇水暴击！', `禁止烟火庇佑，成长 +${actualGrowth}`);
  }
  saveState();
  return { ok: true, justMatured, actualGrowth };
}

// 是否可施肥
export function canFertilize(potIndex = 0) {
  const plant = getPot(potIndex);
  if (!plant) return false;
  const def = getActivePlantDef(potIndex);
  if (!def) return false;
  if (plant.level === 0) return false;
  if (plant.level >= 5 && plant.growthProgress >= def.growthPerLevel) return false;
  if (plant.harvested) return false;
  const targetLevel = plant.level + 1;
  const cost = def.fertilizeCosts[targetLevel] || 0;
  return state.coins >= cost;
}

// 施肥：花费智慧之光，增加成长值
export function fertilizePlant(potIndex = 0) {
  const plant = getPot(potIndex);
  const def = getActivePlantDef(potIndex);
  if (!plant || !def || !canFertilize(potIndex)) return { ok: false, justMatured: false };

  const wasHarvestable = canHarvest(potIndex);
  const targetLevel = plant.level + 1;
  const cost = def.fertilizeCosts[targetLevel] || 0;
  if (!spendCoins(cost)) return { ok: false, justMatured: false };

  const actualGrowth = applyGrowth(def.fertilizeGrowth);
  plant.growthProgress += actualGrowth;
  plant.lastCareTime = getNow();

  checkLevelUp(def, plant);

  const justMatured = !wasHarvestable && canHarvest(potIndex);
  saveState();
  return { ok: true, justMatured, actualGrowth };
}

// 检查自动升级 / 可收获状态
function checkLevelUp(def, plant) {
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
export function canHarvest(potIndex = 0) {
  const plant = getPot(potIndex);
  if (!plant) return false;
  const def = getActivePlantDef(potIndex);
  if (!def) return false;
  if (plant.level < 5) return false;
  if (plant.growthProgress < def.growthPerLevel) return false;
  if (plant.harvested) return false;
  return true;
}

// 收获：获得氛围+智慧之光，概率得种子，植物凋谢
export function harvestPlant(potIndex = 0) {
  const plant = getPot(potIndex);
  const def = getActivePlantDef(potIndex);
  if (!plant || !def || !canHarvest(potIndex)) return false;

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
  resetPlantToEmpty(plant);

  saveState();
  return { seedDropped, seedType: def.seedType, def };
}

// 铲除指定盆位植物
export function abandonPlant(potIndex = 0) {
  const plant = getPot(potIndex);
  const def = getActivePlantDef(potIndex);
  if (!plant || !def) return { ok: false, reason: 'no_plant' };

  resetPlantToEmpty(plant);
  addHistory('plant', `铲除 ${def.emoji} ${t(def.nameKey)}`, '盆栽已清空，可以重新种植');
  saveState();
  return { ok: true, def };
}

function resetPlantToEmpty(plant) {
  Object.keys(EMPTY_PLANT).forEach(key => {
    plant[key] = EMPTY_PLANT[key];
  });
}

// 检测72小时自然凋谢（逐盆；返回凋谢的植物 def 数组——调用方据此弹窗/通报）
export function checkWither() {
  const now = getNow();
  const withered = [];
  (state.plants || []).forEach(plant => {
    if (!plant.activeType || plant.level === 0) return;
    const lastCare = plant.lastCareTime || plant.plantedAt;
    const hoursSinceCare = (now - lastCare) / (1000 * 60 * 60);
    if (hoursSinceCare >= 72) {
      const def = PLANT_TYPES[plant.activeType];
      addHistory('plant', `${def ? def.emoji + ' ' + t(def.nameKey) : '植物'}凋谢了`, '72小时未照料，植物枯萎');
      resetPlantToEmpty(plant);
      withered.push(def || { id: plant.activeType, emoji: '🥀', nameKey: null });
    }
  });
  if (withered.length) {
    // 玩家反馈「植物忽然不见了」：凋谢路径补齐日记 + 持久通报位（温室页红卡，dismiss 清零）
    const names = withered.map(d => (d.nameKey ? t(d.nameKey) : t('unknown'))).join('、');
    addDiaryEntry('special_event', { detail: t('diaryPlantWither').replace('{names}', names) });
    state.plantLossAlert = { kind: 'wither', plantTypes: withered.map(d => d.id), time: now };
    saveState();
  }
  return withered;
}

// 购买植物种到指定盆位（默认第一个空盆）
export function plantSeed(plantType, potIndex = null) {
  const def = PLANT_TYPES[plantType];
  if (!def) return false;
  const idx = potIndex === null ? getFirstEmptyPotIndex() : potIndex;
  const plant = getPot(idx);
  if (!plant || plant.activeType) return false;
  const cost = def.fertilizeCosts[1] || 50;
  if (!spendCoins(cost)) return false;

  plant.activeType = plantType;
  plant.level = 1;
  plant.growthProgress = 0;
  plant.lastCareTime = getNow();
  plant.plantedAt = getNow();
  plant.harvested = false;

  addHistory('plant', `种下 ${def.emoji} ${t(def.nameKey)}`, `花费${cost}智慧之光`);
  saveState();
  return true;
}

// 添加浇水机会（由专注完成触发；2026-09-15 起全局池——不管有没有种植物都累积 +1，
// 可之后分配给任意一盆；旧版「逐盆发放」由迁移 v11 收编为全局）
export function addWaterOpportunity() {
  state.water = (state.water || 0) + 1;
  saveState();
  return true;
}

// ========== 种子兑换（数组版） ==========

export function getSeedExchangeItem(seedType, index) {
  const list = SEED_EXCHANGE[seedType];
  if (!list || index < 0 || index >= list.length) return null;
  return list[index];
}

// book 类奖励的目标书：单书 rewardBookId / 卷书 rewardBookIds 均支持
function rewardBookIdsOf(item) {
  if (Array.isArray(item.rewardBookIds)) return item.rewardBookIds;
  return item.rewardBookId ? [item.rewardBookId] : [];
}

function isOneTimeExchanged(item) {
  if (item.repeatable !== false) return false;
  if (item.type === 'book') {
    // 多卷书：全部已拥有才算换过（异常半拥有态允许补齐）
    const ids = rewardBookIdsOf(item);
    if (ids.length === 0) return false;
    return ids.every(id => {
      const bs = state.books[id];
      return bs && bs.status !== 'locked';
    });
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
    // 按未拥有的奖励书数量要求手稿箱空位
    const needed = rewardBookIdsOf(item).filter(id => {
      const bs = state.books[id];
      return !bs || bs.status === 'locked';
    }).length || 1;
    if (getManuscriptSlots() - getManuscriptBoxCount() < needed) return false;
  }
  return true;
}

export function exchangeSeed(seedType, index) {
  const item = getSeedExchangeItem(seedType, index);
  if (!item || !canExchangeSeed(seedType, index)) return false;

  if (!spendSeed(seedType, item.required)) return false;

  switch (item.type) {
    case 'book': {
      // 逐卷发放：已拥有的跳过（半拥有异常态补齐），全卷进手稿箱
      for (const bid of rewardBookIdsOf(item)) {
        const bs = state.books[bid];
        if (bs && bs.status !== 'locked') continue;
        state.books[bid] = createBookRecord();
        addToManuscriptBox(bid);
      }
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
