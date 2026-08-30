// 借阅区等级配置表 —— 单一真源
// 被 visitors.js / economy.js / visitor-lookup.js 共用

export const BORROW_LEVEL_TABLE = [
  null, // 索引0占位(Lv0)
  { cap:2, returnCoins:30, favorBonus:0,  returnAtmo:1, spawnBonus:0.05 },  // Lv1 陋室
  { cap:3, returnCoins:35, favorBonus:10, returnAtmo:1, spawnBonus:0.08 },  // Lv2 整洁
  { cap:6, returnCoins:40, favorBonus:20, returnAtmo:3, spawnBonus:0.12 },  // Lv3 开放
  { cap:7, returnCoins:45, favorBonus:30, returnAtmo:3, spawnBonus:0.16 },  // Lv4 舒适
  { cap:8, returnCoins:50, favorBonus:40, returnAtmo:5, spawnBonus:0.20 },  // Lv5 精致
  { cap:9, returnCoins:55, favorBonus:50, returnAtmo:5, spawnBonus:0.25 },  // Lv6 优雅
  { cap:10,returnCoins:60, favorBonus:60, returnAtmo:5, spawnBonus:0.30 }   // Lv7 圣所
];
