// 植物类型定义 —— 馆内装潢/植物盆栽系统
// 纯数据模块，不依赖任何其他模块

export const PLANT_TYPES = {
  bird_of_paradise: {
    id: 'bird_of_paradise',
    nameKey: 'plant.birdOfParadise.name',
    descKey: 'plant.birdOfParadise.description',
    emoji: '🌿',
    art: {
      0: 'visual/plants/plant_16_empty_pot.png',
      1: 'visual/plants/plant_01_r1A.png',
      2: 'visual/plants/plant_02_r1B.png',
      3: 'visual/plants/plant_03_r1C.png',
      4: 'visual/plants/plant_04_r1D.png',
      5: 'visual/plants/plant_05_r1E.png'
    },
    description: '一盆高挑的花叶植物，叶片如鹤翅般优雅伸展，花苞中蕴藏着异世界的生机。',
    growthPerLevel: 80,
    fertilizeCosts: {
      1: 50,
      2: 50,
      3: 80,
      4: 120,
      5: 180
    },
    waterGrowth: 25,
    fertilizeGrowth: 50,
    harvestAtmosphere: 2,
    harvestCoins: 35,
    seedType: 'bird_of_paradise',
    seedDropRate: 0.6,
    levelNames: ['', '幼苗', '小株', '茂叶', '含苞', '绽放']
  },

  magic_rose: {
    id: 'magic_rose',
    nameKey: 'plant.magicRose.name',
    descKey: 'plant.magicRose.description',
    emoji: '🌹',
    art: {
      0: 'visual/plants/plant_16_empty_pot.png',
      1: 'visual/plants/plant_06_r2A.png',
      2: 'visual/plants/plant_07_r2B.png',
      3: 'visual/plants/plant_08_r2C.png',
      4: 'visual/plants/plant_09_r2D.png',
      5: 'visual/plants/plant_10_r2E.png'
    },
    description: '花瓣在月光下会微微发光的奇异玫瑰，据说是某位旅法师从异位面带回的种子。',
    growthPerLevel: 100,
    fertilizeCosts: {
      1: 50,
      2: 50,
      3: 80,
      4: 120,
      5: 180
    },
    waterGrowth: 20,
    fertilizeGrowth: 40,
    harvestAtmosphere: 10,
    harvestCoins: 30,
    seedType: 'magic_rose',
    seedDropRate: 0.6,
    levelNames: ['', '幼苗', '小株', '茂叶', '含苞', '绽放']
  },

  starlight_fern: {
    id: 'starlight_fern',
    nameKey: 'plant.starlightFern.name',
    descKey: 'plant.starlightFern.description',
    emoji: '🌿',
    art: {
      0: 'visual/plants/plant_16_empty_pot.png',
      1: 'visual/plants/plant_11_r3A.png',
      2: 'visual/plants/plant_12_r3B.png',
      3: 'visual/plants/plant_13_r3C.png',
      4: 'visual/plants/plant_14_r3D.png',
      5: 'visual/plants/plant_15_r3E.png'
    },
    description: '叶片在暗处会泛起银色微光的蕨类植物，孢子成熟时会像坠落星河一样流淌。',
    growthPerLevel: 120,
    fertilizeCosts: {
      1: 80,
      2: 80,
      3: 120,
      4: 180,
      5: 260
    },
    waterGrowth: 15,
    fertilizeGrowth: 30,
    harvestAtmosphere: 15,
    harvestCoins: 15,
    seedType: 'starlight_fern',
    seedDropRate: 0.6,
    levelNames: ['', '孢子', '嫩芽', '舒展', '流光', '星瀑']
  }
};

// ========== 嫁接改良五档（2026-09-21 晚图南改版：原一次性 60→90%+多年生 梯度太大） ==========
// 每档消耗同类种子，全品种统一阶梯；多年生 = 收获时按概率回落 restartLevel 重长（否则照常凋谢）。
// 2026-09-22 图南拍板再削：旧 ③30%/④60%/⑤100% + 固定回落 Lv3 太狠（满档≈永生速刷），
// 降为 ③25%/④40%/⑤55%、回落统一 Lv2——满档期望株产 ≈2.2 次收获，有惊喜但不再永生。
export const IMPROVE_TIERS = [
  { seedCost: 2, seedDropRate: 0.70 },
  { seedCost: 3, seedDropRate: 0.80 },
  { seedCost: 4, perennialChance: 0.25, restartLevel: 2 },
  { seedCost: 5, perennialChance: 0.40, restartLevel: 2 },
  { seedCost: 6, perennialChance: 0.55, restartLevel: 2 }
];

// ========== 温室培育设施（2026-09-21 图南四决策：解决「浇水绑死专注时长→扩盆无意义」） ==========
//
// 浇水工具（喷壶）：1 次浇水按档位泼溅多盆。
//   Lv2「各全额」与 Lv3「总 2 份均分」在 2 盆时数学一致；Lv3 的价值是 3-4 盆零操作均匀浇水。
//   注：泼溅不放大单份成长——总成长恒 ≤2 份，扩盆赚的是操作与均匀，放量由储水/改良/绿手指给。
export const WATERING_CANS = [
  {
    level: 1, id: 'watering_can', nameKey: 'canWatering', emoji: '💧', price: 0,
    splash: 1, perPotShare: 1,
    descKey: 'canWateringDesc'
  },
  {
    level: 2, id: 'long_spout_can', nameKey: 'canLongSpout', emoji: '🚿', price: 800,
    splash: 2, perPotShare: 1,
    descKey: 'canLongSpoutDesc'
  },
  {
    level: 3, id: 'sprinkler_can', nameKey: 'canSprinkler', emoji: '🌧️', price: 2000,
    splash: Infinity, perPotShare: null, // null = 总 2 份均分（见 totalShares）
    totalShares: 2,
    descKey: 'canSprinklerDesc'
  }
];

// 储水设施：专注产出档位 + 离线蓄水（等级 ≥2 才有离线）。
//   专注加成只奖长专注（≥45/≥90 分钟），番茄钟玩家产水不变——控放量 + 合硬核 ethos。
export const WATER_TANKS = [
  {
    level: 1, id: 'clay_jar', nameKey: 'tankClayJar', emoji: '🏺', price: 0,
    focusBonus: [], // [额外+1 水的分钟门槛]
    offline: null,
    descKey: 'tankClayJarDesc'
  },
  {
    level: 2, id: 'copper_tank', nameKey: 'tankCopper', emoji: '⚱️', price: 600,
    focusBonus: [45],
    offline: { hoursPer: 6, cap: 4 },
    descKey: 'tankCopperDesc'
  },
  {
    level: 3, id: 'arcane_reservoir', nameKey: 'tankArcane', emoji: '🔮', price: 1800,
    focusBonus: [45, 90],
    offline: { hoursPer: 3, cap: 8 },
    descKey: 'tankArcaneDesc'
  }
];

// 绿手指：累计收获次数升档，每级浇水/施肥成长 +5%（乘法叠在谷雨光环上）
// 2026-09-21 图南修订：温室扩建+装备加成后收获会滚雪球，阈值阶梯式放大（Lv1 的 3 次保留作早期甜头）
export const GREEN_THUMB = {
  bonusPerLevel: 0.05,
  thresholds: [3, 20, 50, 100, 200] // 达到阈值 → Lv1..Lv5
};

// 种子兑换表 —— 每种子的可兑换奖励列表
// type: book | coins | atmosphere | inspiration | seed
// repeatable: 是否可重复兑换（book/seed 默认 false，其他默认 true）
export const SEED_EXCHANGE = {
  bird_of_paradise: [
    { type: 'book', required: 5, rewardBookId: 'book_023', rewardTitleKey: 'seedExchange.birdOfParadise.book', repeatable: false },
    { type: 'coins', required: 3, value: 80, repeatable: true },
    { type: 'atmosphere', required: 2, value: 5, repeatable: true },
    { type: 'inspiration', required: 4, value: 1, repeatable: true },
    { type: 'seed', required: 3, seedType: 'magic_rose', count: 1, rewardTitleKey: 'seedExchange.birdOfParadise.seed', repeatable: false }
  ],
  magic_rose: [
    { type: 'book', required: 5, rewardBookId: 'book_024', rewardTitleKey: 'seedExchange.magicRose.book', repeatable: false },
    { type: 'coins', required: 3, value: 100, repeatable: true },
    { type: 'atmosphere', required: 2, value: 8, repeatable: true },
    { type: 'seed', required: 4, seedType: 'starlight_fern', count: 1, rewardTitleKey: 'seedExchange.magicRose.seed', repeatable: false }
  ],
  starlight_fern: [
    // 秘密花园是种子兑换限定（与绿野仙踪/爱丽丝同纪律，不进商店池）；
    // 卷书一次性发全卷，两卷誊抄完在修复室合成典藏版（正常合成路径）
    { type: 'book', required: 5, rewardBookIds: ['book_034_vol1', 'book_034_vol2'], rewardTitleKey: 'seedExchange.starlightFern.book', repeatable: false },
    { type: 'coins', required: 3, value: 120, repeatable: true },
    { type: 'atmosphere', required: 2, value: 12, repeatable: true },
    { type: 'inspiration', required: 5, value: 2, repeatable: true }
  ]
};
