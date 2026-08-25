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
    { type: 'book', required: 5, rewardBookId: 'book_034', rewardTitleKey: 'seedExchange.starlightFern.book', repeatable: false },
    { type: 'coins', required: 3, value: 120, repeatable: true },
    { type: 'atmosphere', required: 2, value: 12, repeatable: true },
    { type: 'inspiration', required: 5, value: 2, repeatable: true }
  ]
};
