#!/usr/bin/env node
/**
 * simulate-atmosphere-economy.mjs — 氛围 EXP 模型收支测算（v4）
 *
 * v3 删除：双池/封顶/溢出/自由池/仪式付费/spendAtmosphere/累计门槛/兑灵感/修缮材料
 * v4 模型：氛围=经验值（只增不减，阶段=纯阈值自动升级）；智慧之光=金币（唯一支出货币）；
 *          设施=金币购买的经验资产（一次性+每日涓流 EXP）；阶段对设施等级设门槛。
 *
 * 现实锚点（2026-09-08 图南提供）：上线十几天已有多个玩家氛围到顶 500 溢出
 *   → 硬核玩家日入 ~38 氛围。三档画像按比例反推。
 *
 * 用法：node scripts/simulate-atmosphere-economy.mjs [--profile hardcore|core|casual] [--trickle 2] [--verbose]
 */

import { BORROW_LEVEL_TABLE } from '../data/borrow-levels.js';

// ==============================
// 三档玩家画像（现实锚定：hardcore 13 天 ≈ 500 氛围）
// ==============================
const PROFILES = {
  hardcore: { label: '硬核（13天/500 实测定标）', turnover: 2.5, completionsPerDay: 1.5, completionAtmo: 5, inspirationPerDay: 7, share: 0.1 },
  core:     { label: '核心（≈硬核×0.6）',          turnover: 1.5, completionsPerDay: 0.8, completionAtmo: 5, inspirationPerDay: 4.5, share: 0.3 },
  casual:   { label: '休闲（≈硬核×0.3）',          turnover: 0.8, completionsPerDay: 0.3, completionAtmo: 5, inspirationPerDay: 2.5, share: 0.6 },
};

// ==============================
// 参数区
// ==============================
const P = {
  dailyFixedAtmo: 8,        // 任务 4 + 行动卡 4
  plantAtmoPerDay: 4,
  eventAtmoPerDay: 3,
  dailyFixedCoins: 15,
  completionCoins: 150,     // 完成一本书的智慧之光（估）
  oneTimeBookPool: 500,     // 全藏书一次性氛围（v3 评审口径）

  // 设施：金币成本（economy.js 公式）+ EXP 产出
  coinsBorrow: lv => Math.min(5700, Math.round(500 * Math.pow(1.5, lv))),
  coinsFocus:  lv => Math.min(5000, Math.round(400 * Math.pow(1.45, lv))),
  facilityExpOneTime: lv => 20 * lv,   // D19：等级×20（占比 35%→~16%，评审 P1-C）
  facilityExpDaily: 0,                 // 每级每日 +EXP（--trickle 覆盖）[标定中]

  // 设施等级受图书馆阶段门槛（RPG 装备等级要求）
  stageFacilityGate: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 7 },  // D22 新手补 1:2；D18 5 阶解锁 Lv6-7
  linearReturnAtmo: true,               // D18：returnAtmo = 借阅区等级（1-7 真实产能台阶）
  maxLv: { borrow: 7, focus: 6, restore: 5 },

  // 阶段阈值（EXP 总量）——待标定输出
  stageThresholds: [400, 900, 2800, 5600],  // v4.3 定版：11/10/48/90 天形状，等真实数据回测微调

  // 灾难/磨损链
  fireFineCoins: 200,       // 火灾罚金币（EXP 模型不掉经验）
  fireProb: 0.00004, fireCooldownDays: 12,
  damageBase: 0.03, damagePerLevel: 0.004, damageFloorRatio: 1 / 6,
  wearStepChance: 0.6, wearRecopyAt: 8,
  inspirationPerDay: 2, recopyInspirationCost: 1,

  playDays: 365,
};

// ==============================
// 仿真
// ==============================
function simulate(profileName, trickle) {
  const prof = PROFILES[profileName];
  const T = P.stageThresholds;
  let s = {
    day: 0, exp: 0, stage: 1, coins: 100,
    borrowLv: 1, focusLv: 1, restoreLv: 1,
    pool: P.oneTimeBookPool, inspiration: 5,
    wear: 0, recopies: 0, fires: 0, lastFire: 0,
    stageDays: [], coinsSpent: 0, coinsEarned: 0,
  };

  while (s.day < P.playDays && s.stage < 5) {
    s.day++;
    const bl = { ...BORROW_LEVEL_TABLE[s.borrowLv], returnAtmo: P.linearReturnAtmo ? s.borrowLv : BORROW_LEVEL_TABLE[s.borrowLv].returnAtmo };

    // ── EXP 收入（只增不减）──
    let expIn = prof.turnover * bl.returnAtmo + P.dailyFixedAtmo + P.plantAtmoPerDay + P.eventAtmoPerDay;
    if (s.pool > 0) { const t = Math.min(s.pool, prof.completionsPerDay * prof.completionAtmo); expIn += t; s.pool -= t; }
    expIn += (s.borrowLv + s.focusLv + s.restoreLv) * trickle;
    s.exp += expIn;

    // ── 金币收入 ──
    const coinsIn = prof.turnover * bl.returnCoins + prof.completionsPerDay * P.completionCoins + P.dailyFixedCoins;
    s.coins += coinsIn; s.coinsEarned += coinsIn;

    // ── 自动升阶 ──
    while (s.stage < 5 && s.exp >= T[s.stage - 1]) { s.stage++; s.stageDays[s.stage] = s.day; }

    // ── 灾难/磨损链 ──
    const fireDaily = 1 - Math.pow(1 - P.fireProb, 1440); // 分钟概率转日概率（v4.1 修）
    if (s.day - s.lastFire > P.fireCooldownDays && Math.random() < fireDaily) {
      s.fires++; s.lastFire = s.day; s.coins = Math.max(0, s.coins - P.fireFineCoins);
    }
    const pDmg = Math.max(P.damageBase * P.damageFloorRatio, P.damageBase - (s.borrowLv - 1) * P.damagePerLevel) * (1 + P.wearStepChance * Math.min(s.wear, 15) / 15);
    for (let i = 0; i < Math.round(prof.turnover); i++) s.wear = Math.min(15, s.wear + 1);
    s.inspiration += prof.inspirationPerDay;
    if (s.wear >= P.wearRecopyAt && s.inspiration >= P.recopyInspirationCost) { s.inspiration -= 1; s.wear = 0; s.recopies++; }

    // ── 购买（金币）：产能杠杆优先；受阶段门槛 ──
    const gate = P.stageFacilityGate[s.stage] || 1;
    let acted = true;
    while (acted) {
      acted = false;
      if (s.borrowLv < Math.min(P.maxLv.borrow, gate)) {
        const c = P.coinsBorrow(s.borrowLv);
        if (s.coins >= c) { s.coins -= c; s.coinsSpent += c; s.exp += P.facilityExpOneTime(s.borrowLv + 1); s.borrowLv++; acted = true; continue; }
      }
      if (s.focusLv < Math.min(P.maxLv.focus, gate)) {
        const c = P.coinsFocus(s.focusLv);
        if (s.coins >= c) { s.coins -= c; s.coinsSpent += c; s.exp += P.facilityExpOneTime(s.focusLv + 1); s.focusLv++; acted = true; continue; }
      }
      if (s.restoreLv < Math.min(P.maxLv.restore, gate)) {
        const c = P.coinsFocus(s.restoreLv);
        if (s.coins >= c) { s.coins -= c; s.coinsSpent += c; s.exp += P.facilityExpOneTime(s.restoreLv + 1); s.restoreLv++; acted = true; continue; }
      }
    }
  }
  return { profile: profileName, ...s };
}

// ==============================
// 主流程
// ==============================
const args = process.argv.slice(2);
const pIdx = args.indexOf('--profile');
const profile = pIdx >= 0 ? args[pIdx + 1] : null;
const tIdx = args.indexOf('--trickle');
const trickle = tIdx >= 0 ? Number(args[tIdx + 1]) : P.facilityExpDaily;
const verbose = args.includes('--verbose');

const targets = profile ? [profile] : Object.keys(PROFILES);

console.log('═'.repeat(74));
console.log(`氛围 EXP 模型 · 收支测算（v4，设施每日涓流 ${trickle}/级）`);
console.log(`阶段阈值候选：2阶 ${P.stageThresholds[0]} / 3阶 ${P.stageThresholds[1]} / 4阶 ${P.stageThresholds[2]} / 5阶 ${P.stageThresholds[3]}`);
console.log('═'.repeat(74));
console.log('');
console.log('画像   | 首通天数 | 阶段2 | 阶段3 | 阶段4 | 阶段5 | 达标EXP | 金币消耗 | 金币结余 | 火灾 | 重抄 | 灵感结余');
console.log('-'.repeat(105));

for (const pn of targets) {
  const runs = Array.from({ length: 20 }, () => simulate(pn, trickle)).sort((a, b) => a.day - b.day);
  const med = runs[10];
  const avg = k => runs.reduce((s, r) => s + (r[k] || 0), 0) / runs.length;
  console.log(
    pn.padEnd(6), '|',
    String(med.stage >= 5 ? med.stageDays[5] : '未达').padEnd(8), '|',
    String(med.stageDays[2] || '-').padEnd(5), '|',
    String(med.stageDays[3] || '-').padEnd(5), '|',
    String(med.stageDays[4] || '-').padEnd(5), '|',
    String(med.stageDays[5] || '-').padEnd(5), '|',
    String(Math.round(avg('exp'))).padEnd(8), '|',
    String(Math.round(avg('coinsSpent'))).padEnd(8), '|',
    String(Math.round(avg('coins'))).padEnd(8), '|',
    String(Math.round(avg('fires'))).padEnd(4), '|',
    String(Math.round(avg('recopies'))).padEnd(4), '|',
    avg('inspiration').toFixed(0)
  );
  if (verbose && pn === targets[0]) {
    console.log(`  样本终态：借阅区Lv${med.borrowLv} 缮写室Lv${med.focusLv} 修复室Lv${med.restoreLv}（阶段门槛内）`);
  }
}
console.log('');
console.log('判读：');
console.log('  · 硬核首通目标 120-180 天（老数据 13 天到顶 = 原节奏 10 倍加速过快）');
console.log('  · 休闲 365 天应到 4 阶左右（5 阶是长线目标，允许次年达成）');
console.log('  · 金币结余 > 总消耗 2 倍 = 金币通胀，需要更多金币消费口');
console.log('  · 门槛表调法：--profile hardcore 跑到达标天数后反推阈值');
