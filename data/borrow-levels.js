// 借阅区等级配置表 —— 单一真源
// 被 visitors.js / economy.js / visitor-lookup.js 共用

export const BORROW_LEVEL_TABLE = [
  null, // 索引0占位(Lv0)
  { cap:2, returnCoins:30, favorBonus:0,  returnAtmo:1, spawnBonus:0.05 },  // Lv1 陋室
  { cap:3, returnCoins:35, favorBonus:10, returnAtmo:2, spawnBonus:0.08 },  // Lv2 整洁
  { cap:6, returnCoins:40, favorBonus:20, returnAtmo:3, spawnBonus:0.12 },  // Lv3 开放
  { cap:7, returnCoins:45, favorBonus:30, returnAtmo:4, spawnBonus:0.16 },  // Lv4 舒适
  { cap:8, returnCoins:50, favorBonus:40, returnAtmo:5, spawnBonus:0.20 },  // Lv5 精致
  { cap:9, returnCoins:55, favorBonus:50, returnAtmo:6, spawnBonus:0.25 },  // Lv6 优雅
  { cap:10,returnCoins:60, favorBonus:60, returnAtmo:7, spawnBonus:0.30 }   // Lv7 圣所
];

// ── 单书借阅磨损（Phase 3 借还链，纯函数可 node 直测）──
// 每被借出一次 wearCount +1（典藏版除外），还书损毁率乘性放大 ×(1+0.6×wear/15)，封顶 ×1.6；重抄清零（book-progress.js）
export const WEAR_DAMAGE_STEP = 0.6;
export const WEAR_DAMAGE_CAP = 1.6;

export function getWearMultiplier(wearCount = 0) {
  return Math.min(WEAR_DAMAGE_CAP, 1 + WEAR_DAMAGE_STEP * Math.max(0, wearCount) / 15);
}

// 书况分级（书况 UI 五档）：崭新/良好/磨损/破旧/濒危
export function getBookCondition(wearCount = 0) {
  const w = Math.max(0, wearCount || 0);
  if (w <= 0) return 'pristine';
  if (w <= 4) return 'good';
  if (w <= 9) return 'worn';
  if (w <= 14) return 'fragile';
  return 'critical';
}
