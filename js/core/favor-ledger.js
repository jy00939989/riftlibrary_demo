// 好感账本 —— 写路径单一真源（2026-10-28）
// visitors.js（逛/借/还）与 core/cafe.js（咖啡角招待）共用本模块入账，
// 避免 visitors ↔ cafe 互相导入形成循环依赖。
// 三车道节奏（图南 2026-10-28 拍板，目标 4~6 周/人满好感）：
//   免费流水（逛/借/还）→ 每日 cap 15（失控引擎本尊，唯一需要刹的车）
//   咖啡角 → 材料闸门限流，豁免 cap；满好感溢出心意 ×3 转小费
//   心意便签/叙事事件/铁证回填 → 消耗品/一次性，豁免 cap（redeem.js 自理）
// 读路径（阈值/档位/spawn 权重）仍在 visitors.js；本模块只管写。
// cap 按持久账本 state.visitorFavors 计数——session 实例 visitor.favorability
// 每次进场归零（visitors.js spawn），绝不能作 cap 依据。

import { state } from '../state.js';
import { getTodayKey } from './day-boundary.js';

export const FAVOR_CAP = 600;
// 每日动作好感 cap：轻度玩家一天 1~2 轮自然入账 9~17，触顶轻微；重度玩家十几轮被压到 15/天
export const DAILY_ACTION_FAVOR_CAP = 15;
// 咖啡角满好感溢出心意 → 小费汇率（1 心意 = 3 智慧之光；添头不回本，防满级后咖啡角变印钞机）
export const FAVOR_OVERFLOW_TO_COINS = 3;

export function addVisitorFavor(charId, amount) {
  // 2026-10-19 热修：缺失键直接创建（旧守卫 !== undefined 会把新档的日常好感全部静默丢弃，
  // 唯一例外是 redeem.js 的便签路径会自己建键——这正是「只有谷雨显示」的根因）。
  if (!state.visitorFavors) state.visitorFavors = {};
  state.visitorFavors[charId] = Math.min(FAVOR_CAP, (state.visitorFavors[charId] || 0) + amount);
}

/** 今日动作好感额度余量（state.visitorFavorDaily 懒初始化，按本地日界重置，无需迁移） */
function getActionFavorRemain(charId) {
  if (!state.visitorFavorDaily || typeof state.visitorFavorDaily !== 'object') {
    state.visitorFavorDaily = {};
  }
  let rec = state.visitorFavorDaily[charId];
  if (!rec || rec.date !== getTodayKey()) {
    rec = { date: getTodayKey(), spent: 0 };
    state.visitorFavorDaily[charId] = rec;
  }
  return Math.max(0, DAILY_ACTION_FAVOR_CAP - rec.spent);
}

/**
 * 日常动作好感入账（仅限逛/借/还三动作；咖啡角请用 gainCafeFavor）
 * 超出每日 cap 部分静默丢弃（免费流水无成本，不值得弹提示惩罚玩家）
 * @returns {number} 实际入账值（cap 截断后）
 */
export function gainActionFavor(visitor, amount) {
  const grant = Math.min(amount, getActionFavorRemain(visitor.charId));
  if (grant > 0) {
    state.visitorFavorDaily[visitor.charId].spent += grant;
    addVisitorFavor(visitor.charId, grant);
    visitor.favorability = (visitor.favorability || 0) + grant; // session +N 角标
  }
  return grant;
}

/**
 * 咖啡角好感入账（材料闸门限流，豁免每日 cap）
 * 满好感时溢出心意 ×FAVOR_OVERFLOW_TO_COINS 转小费智慧之光（调用方结算）
 * @returns {{grant: number, tip: number}} 实际入账与溢出小费
 */
export function gainCafeFavor(visitor, amount) {
  const space = Math.max(0, FAVOR_CAP - (state.visitorFavors?.[visitor.charId] || 0));
  const grant = Math.min(amount, space);
  if (grant > 0) {
    addVisitorFavor(visitor.charId, grant);
    visitor.favorability = (visitor.favorability || 0) + grant;
  }
  return { grant, tip: (amount - grant) * FAVOR_OVERFLOW_TO_COINS };
}
