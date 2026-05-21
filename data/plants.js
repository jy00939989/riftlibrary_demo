// 植物类型定义 —— 馆内装潢/植物盆栽系统
// 纯数据模块，不依赖任何其他模块

export const PLANT_TYPES = {
  bird_of_paradise: {
    id: 'bird_of_paradise',
    name: '鹤望兰',
    emoji: '🌿',
    description: '一盆高挑的花叶植物，叶片如鹤翅般优雅伸展，花苞中蕴藏着异世界的生机。',
    // 每级需要的成长点数（0→100，满了自动升级或可收获）
    growthPerLevel: 100,
    // 施肥花费（按目标等级）
    fertilizeCosts: {
      1: 50,   // Lv0→Lv1 买盆栽
      2: 50,   // Lv1→Lv2
      3: 80,   // Lv2→Lv3
      4: 120,  // Lv3→Lv4
      5: 180   // Lv4→Lv5
    },
    // 浇水收益（每次专注完成给一次浇水机会）
    waterGrowth: 25,
    // 施肥收益（每次施肥给成长值）
    fertilizeGrowth: 50,
    // Lv5 收获奖励
    harvestAtmosphere: 25,
    harvestCoins: 30,
    // 种子掉落
    seedType: 'bird_of_paradise',
    seedDropRate: 0.6,  // 60% 概率掉落
    // 各等级名称
    levelNames: ['', '幼苗', '小株', '茂叶', '含苞', '绽放']
  },

  magic_rose: {
    id: 'magic_rose',
    name: '魔法玫瑰',
    emoji: '🌹',
    description: '花瓣在月光下会微微发光的奇异玫瑰，据说是某位旅法师从异位面带回的种子。',
    growthPerLevel: 100,
    fertilizeCosts: {
      1: 50,
      2: 50,
      3: 80,
      4: 120,
      5: 180
    },
    waterGrowth: 25,
    fertilizeGrowth: 50,
    harvestAtmosphere: 25,
    harvestCoins: 30,
    seedType: 'magic_rose',
    seedDropRate: 0.6,
    levelNames: ['', '幼苗', '小株', '茂叶', '含苞', '绽放']
  }
};

// 种子兑换表 —— 集齐 N 颗种子换书
export const SEED_EXCHANGE = {
  bird_of_paradise: {
    required: 5,
    rewardBookId: 'book_023',
    rewardTitle: '绿野仙踪'
  },
  magic_rose: {
    required: 5,
    rewardBookId: 'book_024',
    rewardTitle: '爱丽丝梦游奇境'
  }
};
