// 古籍保养 —— 数值表与纯函数（真源；book-maintenance-plan v2 §三）
// 磨损区间与书况分级复用 data/borrow-levels.js 的单一真源
import { getBookCondition } from './borrow-levels.js';

// 保养率：每本工时 = 已抄字数 × 率（与修复同账本，修复为 15%）
// 阶梯意图：越拖越贵——濒危保养(8%)已接近修复(15%)的一半，预防的价值由数字自己说话
export const MAINTENANCE_RATES = {
  good: 0.015,     // 良好 wear 1-4
  worn: 0.03,      // 微旧 5-9
  fragile: 0.05,   // 破旧 10-14
  critical: 0.08   // 濒危 15+
};

export function getMaintenanceRate(wearCount = 0) {
  return MAINTENANCE_RATES[getBookCondition(wearCount)] || 0;
}

/**
 * 每本保养工时。
 * max(copiedWords, 1) 是显式防御：「磨损书必有 copiedWords>0」当前是隐式不变量
 * （借出前提是 completed)，一旦未来松动，0 成本保养洞会被这行直接堵死（评审 P2）。
 * @returns {number} 0 = 不可保养（崭新/非法入参）
 */
export function getMaintenanceWords({ copiedWords = 0, wearCount = 0 } = {}) {
  const rate = getMaintenanceRate(wearCount);
  if (rate <= 0) return 0;
  return Math.ceil(Math.max(copiedWords || 0, 1) * rate);
}
