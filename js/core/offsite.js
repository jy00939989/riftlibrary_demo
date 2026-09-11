// 馆外流通寄读（borrow-demand-deepening-plan §4）
// 活跃游戏日结算（A1/A8）：挂统一 onNewDay，离线日冻结不补结；零氛围产出（EXP 纪律）。
// 隐性对价（评审 P1-D）：寄读 wearCount+1，放大该书后续馆内借阅损毁率。
import { state, saveState } from '../state.js';
import { addCoins, addInspiration, addHistory } from '../storage.js';
import { onNewDay } from './day-boundary.js';
import { SHARED_POOL } from '../../data/book_pool.js';

export const OFFSITE_PROBABILITY = 0.25;
export const OFFSITE_INSPIRATION_CHANCE = 0.10;

/** 日上限随藏书浮动（v2 评审 P1-C）：min(12, max(3, ⌊藏书数/8⌋)) */
export function getOffsiteCap(ownedCount) {
  return Math.min(12, Math.max(3, Math.floor(ownedCount / 8)));
}

/** 收益 6-10💰 按书价浮动取整（对照馆内主链 ~1/3 定位，§4.2） */
export function getOffsiteCoinReward(bookId) {
  const entry = SHARED_POOL.find(p => p.bookId === bookId);
  const price = entry?.price || 500;
  return 6 + Math.min(4, Math.floor(price / 300));
}

/** 可寄读书：已完成 ∧ 未损毁 ∧ 不在修缮箱 ∧ 未被馆内借走 */
export function getOffsiteEligibleBooks() {
  const borrowedIds = new Set();
  (state.visitors || []).forEach(v => {
    if (v.status === 'borrowed' || v.status === 'due') {
      const ids = (v.bookIds && v.bookIds.length) ? v.bookIds : [v.bookId];
      ids.forEach(id => { if (id) borrowedIds.add(id); });
    }
  });
  return Object.entries(state.books || {})
    .filter(([id, bs]) => bs && bs.status === 'completed' && !bs.damaged
      && !(state.restorationBox || []).includes(id)
      && !borrowedIds.has(id))
    .map(([id]) => id);
}

/**
 * 活跃日寄读结算（v3.1 A1）：由 onNewDay 驱动，也可直接调用（测试/调试）。
 * 每本 25% 概率寄出：+币（按书价浮动）、10% +1 灵感、wearCount+1、borrowTimes+1；
 * 当日 history 合并一条汇总；lastOffsiteDate 防重（同日再调返回 0）。
 */
export function settleOffsite(today) {
  const lib = state.library;
  if (!lib) return 0;
  if (lib.lastOffsiteDate === today) return 0; // 防重（多触发点同档只结一次）
  lib.lastOffsiteDate = today;

  const ownedCount = Object.values(state.books || {}).filter(b => b && b.status !== 'locked').length;
  const cap = getOffsiteCap(ownedCount);
  const eligible = getOffsiteEligibleBooks();

  let circulated = 0;
  let coinsTotal = 0;
  let inspirationGained = 0;
  for (const bookId of eligible) {
    if (circulated >= cap) break;
    if (Math.random() >= OFFSITE_PROBABILITY) continue;
    const bs = state.books[bookId];
    const coins = getOffsiteCoinReward(bookId);
    addCoins(coins);
    if (Math.random() < OFFSITE_INSPIRATION_CHANCE) {
      addInspiration(1);
      inspirationGained += 1;
    }
    bs.wearCount = (bs.wearCount || 0) + 1;
    bs.borrowTimes = (bs.borrowTimes || 0) + 1;
    circulated += 1;
    coinsTotal += coins;
  }

  if (circulated > 0) {
    addHistory('visitor', `📮 今日寄读 ${circulated} 本`,
      `+${coinsTotal}智慧之光${inspirationGained > 0 ? ` · +${inspirationGained}灵感` : ''} · 书籍略有磨损（寄读隐性对价）`);
    saveState();
  }
  return circulated;
}

onNewDay(({ today }) => settleOffsite(today));
