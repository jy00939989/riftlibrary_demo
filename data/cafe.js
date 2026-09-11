// 咖啡角单一真源（cafe-corner-plan v3.1 §2.3 食谱表 / §2.5 增益表 / §2.4 营业规则）
// 纯数据模块，不依赖任何其他模块

/** 建造：2 阶 + 1500💰（§2.2） */
export const CAFE_BUILD_STAGE = 2;
export const CAFE_BUILD_PRICE = 1500;

/** 等级：上限 5（§2.5），设施门槛另取 min(5, getFacilityLevelCap) */
export const CAFE_MAX_LEVEL = 5;
/** 升级费 400×1.6ⁿ（n=当前等级，升满 ~5,800，评审 D3） */
export const CAFE_UPGRADE_BASE = 400;
export const CAFE_UPGRADE_GROWTH = 1.6;

/** 维持费：每个活跃游戏日 20×等级（v3 联合评审 D10；离线日不补扣 A7） */
export const CAFE_FEE_PER_LEVEL = 20;

/** 进店判定：每个 browsing tick 独立 25%（v3 D9：在 borrowChance 之前，解耦防 P0-1 反噬） */
export const CAFE_SERVE_PROBABILITY = 0.25;
/** 在店时长：~3 分钟（浏览均时 2.5 分钟，D14 座位=并发保险丝） */
export const CAFE_STAY_MS = 3 * 60 * 1000;

/** 增益（§2.5）：进店访客借书概率 +5%/级（pendingBorrowBuff 契约，架构评审 A3） */
export const CAFE_BORROW_BUFF_PER_LEVEL = 0.05;
/** 好感乘区：×(1+0.1×(Lv-1))（§2.4.3） */
export const CAFE_FAVOR_MULT_STEP = 0.1;

/**
 * 食谱表（§2.3 v2 修订）：效率对齐兑换率 92-98%，剩余 = 好感+借书增益服务费。
 * 种子效率对照（data/plants.js SEED_EXCHANGE）：鹤望兰 80/3≈26.7 · 玫瑰 100/3≈33.3 · 星光蕨 120/3=40
 */
export const CAFE_RECIPES = [
  {
    id: 'vanilla_tea',
    emoji: '🍵',
    nameKey: 'cafeRecipeVanillaTea',
    material: { seedType: 'bird_of_paradise', count: 2 },
    price: 50,
    favor: 4,
    unlockLevel: 1
  },
  {
    id: 'rose_dew',
    emoji: '🌹',
    nameKey: 'cafeRecipeRoseDew',
    material: { seedType: 'magic_rose', count: 2 },
    price: 65,
    favor: 6,
    unlockLevel: 1
  },
  {
    id: 'starlight_special',
    emoji: '✨',
    nameKey: 'cafeRecipeStarlightSpecial',
    material: { seedType: 'starlight_fern', count: 3 },
    price: 110,
    favor: 10,
    unlockLevel: 2
  }
];

export function getCafeRecipe(id) {
  return CAFE_RECIPES.find(r => r.id === id) || null;
}

/** 某等级可用的食谱（§2.5 食谱随级解锁） */
export function getRecipesForLevel(level) {
  return CAFE_RECIPES.filter(r => r.unlockLevel <= level);
}
