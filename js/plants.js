// 植物逻辑模块 —— 浇水/施肥/成长/收获/凋谢/铲除/种子兑换/盆位扩容（纯逻辑，不碰DOM）
// 温室花盆扩容（cafe-corner-plan §2.6 Phase 0）：state.plants 数组最多 4 盆，
// 单株数据结构不变；所有单株函数 potIndex 参数化（默认 0 = 原单株语义）。
// 温室培育线（2026-09-21 图南四决策）：喷壶泼溅/储水设施/改良品种/绿手指，
// 解决「浇水次数绑死专注时长 → 盆位扩容无意义」。
import { state, saveState } from './state.js';
import { spendCoins, addCoins, addAtmosphere, addHistory, addInspiration } from './storage.js';
import { markTaskDone } from './dailytasks.js';
import { PLANT_TYPES, SEED_EXCHANGE, WATERING_CANS, WATER_TANKS, GREEN_THUMB, IMPROVE_TIERS } from '../data/plants.js';
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

// ========== 培育设施：喷壶 / 水箱 / 绿手指（2026-09-21） ==========

function getCanDef() {
  return WATERING_CANS[(state.wateringCanLevel || 1) - 1] || WATERING_CANS[0];
}

function getTankDef() {
  return WATER_TANKS[(state.waterTankLevel || 1) - 1] || WATER_TANKS[0];
}

export function getWateringCanLevel() {
  return getCanDef().level;
}

export function getWaterTankLevel() {
  return getTankDef().level;
}

export function getNextCanUpgrade() {
  return WATERING_CANS[state.wateringCanLevel || 1] || null; // 数组下标 = 当前等级 → 下一档
}

export function getNextTankUpgrade() {
  return WATER_TANKS[state.waterTankLevel || 1] || null;
}

export function canUpgradeCan() {
  const next = getNextCanUpgrade();
  return !!next && state.coins >= next.price;
}

export function canUpgradeTank() {
  const next = getNextTankUpgrade();
  return !!next && state.coins >= next.price;
}

export function upgradeCan() {
  const next = getNextCanUpgrade();
  if (!next || !spendCoins(next.price)) return false;
  state.wateringCanLevel = next.level;
  addHistory('plant', `🚿 浇水工具升级：${t(next.nameKey)}`, `花费${next.price}智慧之光 · ${t(next.descKey)}`);
  saveState();
  return true;
}

export function upgradeTank() {
  const next = getNextTankUpgrade();
  if (!next || !spendCoins(next.price)) return false;
  state.waterTankLevel = next.level;
  // 离线蓄水的计时锚点从购买时刻起算，避免追溯发放
  state.waterOfflineAt = getNow();
  addHistory('plant', `🏺 储水设施升级：${t(next.nameKey)}`, `花费${next.price}智慧之光 · ${t(next.descKey)}`);
  saveState();
  return true;
}

// 绿手指等级：按累计收获次数（state.plantHarvests）查 thresholds
export function getGreenThumbLevel() {
  const n = state.plantHarvests || 0;
  let lv = 0;
  for (const th of GREEN_THUMB.thresholds) {
    if (n >= th) lv++;
  }
  return lv;
}

export function getGreenThumbProgress() {
  const n = state.plantHarvests || 0;
  const ths = GREEN_THUMB.thresholds;
  const lv = getGreenThumbLevel();
  if (lv >= ths.length) return { current: n, next: null, remaining: 0 };
  return { current: n, next: ths[lv], remaining: ths[lv] - n };
}

// ========== 改良品种（嫁接，五档渐进；2026-09-21 晚图南改版） ==========
// ①掉率70% ②80% ③多年生30% ④多年生60% ⑤多年生100%；每档耗同类种子（成本在 IMPROVE_TIERS）。
// 存档兼容：v16 当天的布尔真值按满档（≈旧 90%+必多年生）计。

export function getImproveTier(type) {
  const v = state.improvedPlants?.[type];
  if (typeof v === 'number') return Math.max(0, Math.min(v, IMPROVE_TIERS.length));
  return v ? IMPROVE_TIERS.length : 0;
}

export function getNextImproveTier(type) {
  const tier = getImproveTier(type);
  return tier >= IMPROVE_TIERS.length ? null : IMPROVE_TIERS[tier];
}

export function getEffectiveSeedDropRate(type) {
  const def = PLANT_TYPES[type];
  if (!def) return 0;
  let rate = def.seedDropRate;
  const tier = getImproveTier(type);
  for (let i = 0; i < tier; i++) {
    if (IMPROVE_TIERS[i].seedDropRate !== undefined) rate = IMPROVE_TIERS[i].seedDropRate;
  }
  return rate;
}

// 多年生概率（0 = 未解锁多年生；roll 中则收获后回落 restartLevel 重长，否则照常凋谢）
export function getPerennialChance(type) {
  const tier = getImproveTier(type);
  let chance = 0;
  for (let i = 0; i < tier; i++) {
    if (IMPROVE_TIERS[i].perennialChance !== undefined) chance = IMPROVE_TIERS[i].perennialChance;
  }
  return chance;
}

export function getPerennialRestartLevel(type) {
  const tier = getImproveTier(type);
  let lv = 3;
  for (let i = 0; i < tier; i++) {
    if (IMPROVE_TIERS[i].restartLevel !== undefined) lv = IMPROVE_TIERS[i].restartLevel;
  }
  return lv;
}

export function canUnlockImproved(type) {
  const next = getNextImproveTier(type);
  if (!next) return false;
  return (state.seeds[type] || 0) >= next.seedCost;
}

// 消耗同类种子升一档改良
export function unlockImproved(type) {
  const next = getNextImproveTier(type);
  if (!next || !canUnlockImproved(type)) return false;
  if (!spendSeed(type, next.seedCost)) return false;
  const newTier = getImproveTier(type) + 1;
  state.improvedPlants[type] = newTier;
  const def = PLANT_TYPES[type];
  const effect = next.seedDropRate !== undefined
    ? `掉率 ${Math.round(getEffectiveSeedDropRate(type) * 100)}%`
    : `多年生概率 ${Math.round(next.perennialChance * 100)}%`;
  addHistory('plant', `🧬 嫁接改良 ${def.emoji} ${t(def.nameKey)} · ${newTier}/5 档`,
    `消耗${next.seedCost}颗种子 · ${effect}`);
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

// ========== 成长计算（含谷雨光环 + 绿手指） ==========

function getPlantGrowthMultiplier() {
  const aura = getAuraPlantGrowth();
  const thumb = 1 + GREEN_THUMB.bonusPerLevel * getGreenThumbLevel();
  return (1 + aura) * thumb;
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

// 单盆缺水度：进度百分比越低越缺水（泼溅选盆依据）
function neediness(potIndex) {
  const p = getPot(potIndex);
  const d = getActivePlantDef(potIndex);
  if (!p || !d) return Infinity;
  return p.growthProgress / d.growthPerLevel;
}

// 本次浇水波及的目标盆（含点击盆；点击盆优先，其余按缺水度排序补足）
export function getSplashTargets(potIndex = 0) {
  const can = getCanDef();
  const candidates = getActivePotIndices().filter(i => canWater(i));
  if (!candidates.includes(potIndex)) return [];
  if (can.splash === Infinity) return candidates;
  const rest = candidates
    .filter(i => i !== potIndex)
    .sort((a, b) => neediness(a) - neediness(b));
  return [potIndex, ...rest].slice(0, can.splash);
}

// 每盆成长份额（Lv1/Lv2 各全额；Lv3 总 2 份均分）
function getPerPotShare(targetCount) {
  const can = getCanDef();
  if (can.perPotShare != null) return can.perPotShare;
  return targetCount > 0 ? can.totalShares / targetCount : 0;
}

// 浇水：消耗一次全局浇水次数，按喷壶档位泼溅多盆（2026-09-21 温室培育线）
export function waterPlant(potIndex = 0) {
  const def = getActivePlantDef(potIndex);
  if (!def || !canWater(potIndex)) return { ok: false, justMatured: false, watered: [] };

  const targets = getSplashTargets(potIndex);
  const share = getPerPotShare(targets.length);

  state.water = (state.water || 0) - 1;

  const watered = [];
  let anyCrit = false;
  let anyJustMatured = false;
  targets.forEach(idx => {
    const p = getPot(idx);
    const pDef = getActivePlantDef(idx);
    if (!p || !pDef) return;
    const wasHarvestable = canHarvest(idx);

    // 禁止烟火标志牌：浇水有几率暴击（×2 成长，逐盆独立判定）
    let growth = pDef.waterGrowth * share;
    let crit = false;
    if (hasSignboard('no_smoking')) {
      const critRate = SIGNBOARDS.no_smoking?.buff?.value || 0;
      if (Math.random() < critRate) {
        growth *= 2;
        crit = true;
        anyCrit = true;
      }
    }

    const actualGrowth = applyGrowth(growth);
    p.growthProgress += actualGrowth;
    p.lastCareTime = getNow();
    checkLevelUp(pDef, p);

    const justMatured = !wasHarvestable && canHarvest(idx);
    if (justMatured) anyJustMatured = true;
    watered.push({ potIndex: idx, actualGrowth, crit, justMatured });
  });

  // 今日馆务（一次点击算一次）
  const taskResult = markTaskDone('water', state);
  if (taskResult) {
    addHistory('task', `📜 今日馆务：${taskResult.name}`, taskResult.reward);
  }

  if (watered.length > 1) {
    addHistory('plant', `💧 一瓢浇了 ${watered.length} 盆`, watered.map(w => `+${w.actualGrowth}`).join(' / '));
  }
  if (anyCrit) {
    addHistory('plant', '💥 浇水暴击！', '禁止烟火庇佑，部分盆栽成长 ×2');
  }
  saveState();
  return { ok: true, justMatured: anyJustMatured, actualGrowth: watered[0]?.actualGrowth || 0, watered };
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

// 收获：获得氛围+智慧之光，概率得种子（改良品种掉率提升），植物凋谢或多年生回落
export function harvestPlant(potIndex = 0) {
  const plant = getPot(potIndex);
  const def = getActivePlantDef(potIndex);
  if (!plant || !def || !canHarvest(potIndex)) return false;

  addAtmosphere(def.harvestAtmosphere);
  addCoins(def.harvestCoins);

  const dropRate = getEffectiveSeedDropRate(plant.activeType);
  let seedDropped = false;
  if (Math.random() < dropRate) {
    addSeed(def.seedType, 1);
    seedDropped = true;
  }

  // 绿手指：累计收获次数（唯一事实源，等级由阈值推导）
  state.plantHarvests = (state.plantHarvests || 0) + 1;

  const seedName = seedDropped ? ` + 获得 ${t(def.nameKey)}种子 ×1` : '';
  addHistory('plant', `收获 ${def.emoji} ${t(def.nameKey)}`, `+${def.harvestAtmosphere}氛围 +${def.harvestCoins}智慧之光${seedName}`);

  // 多年生（五档改良 ③④⑤ 解锁）：按概率回落 restartLevel 重长，未中则照常凋谢
  const perChance = getPerennialChance(plant.activeType);
  const perennial = perChance > 0 && Math.random() < perChance;

  if (perennial) {
    const restartLv = getPerennialRestartLevel(plant.activeType);
    plant.level = restartLv;
    plant.growthProgress = 0;
    plant.harvested = false;
    plant.lastCareTime = getNow();
    addHistory('plant', `🧬 ${t(def.nameKey)}多年生萌发`, `回落 Lv${restartLv}，继续生长，无需重新种植`);
  } else {
    // 凋谢 → 空盆
    resetPlantToEmpty(plant);
  }

  saveState();
  return { seedDropped, seedType: def.seedType, def, perennial };
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
// 可之后分配给任意一盆；旧版「逐盆发放」由迁移 v11 收编为全局）。
// 2026-09-21 储水设施：长专注（≥45/≥90 分钟）按档位额外 +1——番茄钟产水不变，深专注多得水。
export function addWaterOpportunity(minutes = 20) {
  const tank = getTankDef();
  let gained = 1; // ≥20min 才触发（调用方门控）
  for (const threshold of tank.focusBonus) {
    if (minutes >= threshold) gained += 1;
  }
  state.water = (state.water || 0) + gained;
  saveState();
  return gained;
}

// 离线蓄水（水箱 ≥2 才有）：按距上次在线时长每 hoursPer 小时 +1，封顶 cap。
// 在初始化链调用（app.js）；返回发放数量，0 表示无发放。
export function grantOfflineWater(now = getNow()) {
  const tank = getTankDef();
  if (!tank.offline) return 0;
  const last = state.waterOfflineAt || now;
  const hours = (now - last) / (1000 * 60 * 60);
  if (hours < tank.offline.hoursPer) return 0;
  const n = Math.min(tank.offline.cap, Math.floor(hours / tank.offline.hoursPer));
  state.water = (state.water || 0) + n;
  state.waterOfflineAt = now;
  addHistory('plant', '💧 储水设施蓄水', `离线 ${Math.floor(hours)} 小时，浇水次数 +${n}`);
  saveState();
  return n;
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
