#!/usr/bin/env node
/**
 * simulate-atmosphere-economy.mjs — 氛围系统重设计 Phase 0 收支测算
 *
 * 用途：标定 atmosphere-system-redesign-plan.md §三 的全部 [PLACEHOLDER]：
 *   - 还书周转率（核心未知量，扫描 0.5/1/1.5/2/3 次/日）
 *   - 首通周期（旧模型 ~33 天撞 500 顶，新模型目标 4-5 倍）
 *   - 借阅区氛围成本后置曲线是否解锁前期死锁
 *   - 自由池峰值 vs 软顶 3000
 *   - 磨损→重抄→灵感链的灵感净流量
 *
 * 用法：
 *   node scripts/simulate-atmosphere-economy.mjs            # 全扫描
 *   node scripts/simulate-atmosphere-economy.mjs --turnover 1.5 --verbose
 *
 * 注意：周转率是猜的（评审 3.2 亦注明），上线前用真实存档/埋点数据标定。
 */

import { BORROW_LEVEL_TABLE } from '../data/borrow-levels.js';

// ==============================
// 参数区（全部 [PLACEHOLDER]，CLI 可覆盖）
// ==============================
const P = {
  // ── 玩家行为 ──
  turnover: null,            // 还书次数/日（扫描参数；null=全扫描）
  completionsPerDay: 0.4,    // 书籍完成本数/日（均 8000 字、中速玩家）
  playDays: 365,             // 模拟天数上限

  // ── 供给侧（氛围/日）──
  dailyFixedAtmo: 8,         // 日常任务 4 + 行动卡 4（实测 dailytasks/actioncards）
  plantAtmoPerDay: 4,        // 植物收获 10-15/次，约 3 日一收
  eventAtmoPerDay: 3,        // 访客事件偶发（visitors.js 多处 2+r.atmosphere 均值）
  completionAtmo: 6,         // 书籍完成 3/6/10 均（重抄 ×0.5 后新档以首抄为主）
  oneTimeBookPool: 500,      // 68 本一次性氛围总量（收窄后口径，评审 3.1）

  // ── 供给侧（金币/日）──
  completionCoins: 120,      // 完成一本书的智慧之光（估，含事件/委托）
  eventCoinsPerDay: 15,

  // ── 需求侧：设施升级（coins 公式取自 economy.js，atmo 为 plan §三 [PLACEHOLDER]）──
  borrowAtmoCost:  { 3: 0, 4: 40, 5: 150, 6: 350, 7: 800 },   // 仿真标定 v3.4（原 D14 值经测算超支 ~85% 年流水）
  focusAtmoCost:   { 3: 40, 4: 100, 5: 250, 6: 500 },   // 仿真标定 v3.4
  restoreAtmoCost: { 2: 30, 3: 80, 4: 200, 5: 400 },   // 仿真标定 v3.4
  oneTimeAtmoBonus: lv => 50 * lv,   // 等级×40~60 取中 [PLACEHOLDER]

  // ── 需求侧：升阶仪式（atmo + 修缮材料）──
  // 标定记录（Phase 0 仿真迭代）：
  //   v3 初值（继承旧 500 水位阈值 30/80/160/300）→ 首通 33 天：一次性加成总额 2450+ 三周内顶穿，证伪
  //   v3.1 过激修正 → 365 天 0%：peak 高水位门槛 × 重度消费经济 = 结构性冲突（见下）
  //   v3.3（当前）：**门槛改「累计获得氛围」（totalEarned）**——高水位门槛强迫囤积，
  //     与「设施要花氛围」互斥（玩家不可能一边花 5600 一边持有 2000）；累计制奖励活跃，
  //     阶段保留仍靠 stage 字段只进不退。⚠ 此修正建议需图南确认后回写决策 1
  ceremonyAtmo: [40, 100, 250, 500],         // 1→2 … 4→5 仿真标定 v3.4（从余额扣，不足自动动用自由池）
  ceremonyThreshold: [500, 1300, 2400, 3600], // = 累计获得门槛 totalEarned 仿真标定 v3.4
  ceremonyMaterials: [5, 12, 25, 45],      // 每阶所需修缮材料 [PLACEHOLDER]
  materialsPerLevelDay: 0.5,               // 设施每级每日产出修缮材料 [PLACEHOLDER]

  // ── 自由池 ──
  freePoolSoftCap: 3000,     // 主闸（D12）
  exchangeRate: 50,          // 50:1 兑灵感
  exchangeDailyCap: 200,     // 每日兑换上限（池/日）
  // v3.4 仿真发现：藏书厅 500 顶 < 大额支出（仪式 700/借阅区 Lv7 1500）→ 纯库存支付结构性卡死。
  // 定案：spendAtmosphere 先扣库存、不足自动扣自由池——库存=流动资金，自由池=储蓄账户（与 D9 火灾罚金同构）
  spendDrawsFreePool: true,

  // ── 借还/磨损/灵感链 ──
  damageBase: 0.03,          // getDamageChance 基准
  damagePerLevel: 0.004,     // 每级 -0.4%
  damageFloorRatio: 1 / 6,   // 下限 = 基准 × 1/6（评审：下限随基准走）
  wearStepChance: 0.6,       // 乘性系数：×(1 + 0.6 × steps/15)（D13）
  wearRecopyAt: 8,           // 磨损 ≥8 步时玩家选择重抄
  inspirationPerDay: 2,      // 灵感来源（任务等，不含兑换）
  recopyInspirationCost: 1,  // 重抄 1 灵感（book-progress.js:171 实测）
};

// ==============================
// 工具
// ==============================
const coinsBorrow = lv => Math.min(5700, Math.round(500 * Math.pow(1.5, lv)));
const coinsFocus  = lv => Math.min(5000, Math.round(400 * Math.pow(1.45, lv)));

function damageChance(borrowLv, wearSteps) {
  const base = Math.max(P.damageBase * P.damageFloorRatio, P.damageBase - (borrowLv - 1) * P.damagePerLevel);
  return base * (1 + P.wearStepChance * Math.min(wearSteps, 15) / 15);
}

function fmt(n) { return n.toLocaleString('zh-CN'); }

// ==============================
// 玩家旅程仿真
// ==============================
function simulate(turnover, verbose = false) {
  const s = {
    day: 0,
    atmo: 0, peak: 0, totalEarned: 0, freePool: 0, stage: 1,
    coins: 100,
    borrowLv: 1, focusLv: 1, restoreLv: 1,
    materials: 0,
    inspiration: 5,
    wearSteps: 0, recopies: 0, damages: 0, repairs: 0,
    oneTimePool: P.oneTimeBookPool,
    stageDays: [], freePoolPeak: 0, deadlockDays: 0,
  };

  const logs = [];
  const log = d => logs.push(`  [${d}] ${logs.pop ? '' : ''}`);

  while (s.day < P.playDays && s.stage < 5) {
    s.day++;

    // ── 日供给 ──
    const bl = BORROW_LEVEL_TABLE[s.borrowLv];
    let atmoIn = turnover * bl.returnAtmo + P.dailyFixedAtmo + P.plantAtmoPerDay + P.eventAtmoPerDay;
    if (s.oneTimePool > 0) { const take = Math.min(s.oneTimePool, P.completionsPerDay * P.completionAtmo); atmoIn += take; s.oneTimePool -= take; }
    let coinsIn = turnover * bl.returnCoins + P.completionsPerDay * P.completionCoins + P.eventCoinsPerDay;
    s.inspiration += P.inspirationPerDay;
    s.materials += (s.borrowLv + s.focusLv + s.restoreLv) * P.materialsPerLevelDay;

    // 入库（500 封顶，溢出自由池，软顶停增）
    const room = Math.max(0, 500 - s.atmo);
    s.atmo += Math.min(atmoIn, room);
    const overflow = atmoIn - Math.min(atmoIn, room);
    s.freePool = Math.min(P.freePoolSoftCap, s.freePool + overflow);
    s.peak = Math.max(s.peak, s.atmo);
    s.totalEarned += atmoIn;   // 累计获得（含一次性加成）：阶段门槛用它
    s.freePoolPeak = Math.max(s.freePoolPeak, s.freePool);
    s.coins += coinsIn;

    // ── 借还/磨损链 ──
    const pDmg = damageChance(s.borrowLv, s.wearSteps);
    for (let i = 0; i < Math.round(turnover); i++) {
      if (Math.random() < pDmg) { s.damages++; s.repairs++; }   // 修复走专注，不耗灵感
      s.wearSteps = Math.min(15, s.wearSteps + 1);
    }
    if (s.wearSteps >= P.wearRecopyAt && s.inspiration >= P.recopyInspirationCost) {
      s.inspiration -= P.recopyInspirationCost; s.wearSteps = 0; s.recopies++;
    }

    // ── 决策（贪心：产能杠杆 > 仪式 > 缮写室 > 修复室）──
    // 统一支付函数：先扣库存，不足扣自由池（v3.4 定案）
    const canPay = cost => s.atmo + (P.spendDrawsFreePool ? s.freePool : 0) >= cost;
    const pay = cost => {
      let c = Math.min(cost, s.atmo);
      s.atmo -= c;
      if (P.spendDrawsFreePool && cost > c) s.freePool -= (cost - c);
    };
    let acted = true;
    while (acted) {
      acted = false;
      // 仪式优先（阶段推进是主线）：累计获得达门槛 + 付得起 + 材料够
      const ci = s.stage - 1;
      if (ci < 4 && s.totalEarned >= P.ceremonyThreshold[ci] && canPay(P.ceremonyAtmo[ci]) && s.materials >= P.ceremonyMaterials[ci]) {
        pay(P.ceremonyAtmo[ci]); s.materials -= P.ceremonyMaterials[ci];
        s.stage++; s.stageDays[s.stage] = s.day; acted = true; continue;
      }
      // 借阅区（Lv<7）
      if (s.borrowLv < 7) {
        const nl = s.borrowLv + 1, atmoCost = P.borrowAtmoCost[nl] || 0;
        if (s.coins >= coinsBorrow(s.borrowLv) && canPay(atmoCost)) {
          s.coins -= coinsBorrow(s.borrowLv); pay(atmoCost);
          s.atmo += P.oneTimeAtmoBonus(nl); s.peak = Math.max(s.peak, s.atmo);
          s.borrowLv = nl; acted = true; continue;
        }
        if (nl >= 3 && atmoCost > 0 && !canPay(atmoCost) && s.totalEarned < P.ceremonyThreshold[Math.min(ci, 3)]) s.deadlockDays++;
      }
      // 缮写室
      if (s.focusLv < 6) {
        const nl = s.focusLv + 1, atmoCost = P.focusAtmoCost[nl] || 0;
        if (s.coins >= coinsFocus(s.focusLv) && canPay(atmoCost)) {
          s.coins -= coinsFocus(s.focusLv); pay(atmoCost);
          s.atmo += P.oneTimeAtmoBonus(nl); s.peak = Math.max(s.peak, s.atmo);
          s.focusLv = nl; acted = true; continue;
        }
      }
      // 修复室
      if (s.restoreLv < 5) {
        const nl = s.restoreLv + 1, atmoCost = P.restoreAtmoCost[nl] || 0;
        if (s.coins >= coinsFocus(s.restoreLv) && canPay(atmoCost)) {
          s.coins -= coinsFocus(s.restoreLv); pay(atmoCost);
          s.atmo += P.oneTimeAtmoBonus(nl); s.peak = Math.max(s.peak, s.atmo);
          s.restoreLv = nl; acted = true; continue;
        }
      }
    }

    // 兑灵感（每天把日上限用掉是理性行为，测灵感净流量）
    const ex = Math.min(P.exchangeDailyCap, s.freePool);
    s.freePool -= ex; s.inspiration += ex / P.exchangeRate;
  }

  return {
    turnover, ...s,
    done: s.stage >= 5,
    totalAtmoIncome: null,
  };
}

// ==============================
// 主流程
// ==============================
const args = process.argv.slice(2);
const tIdx = args.indexOf('--turnover');
const verbose = args.includes('--verbose');
const turnovers = tIdx >= 0 ? [Number(args[tIdx + 1])] : [0.5, 1, 1.5, 2, 3];

console.log('═'.repeat(72));
console.log('氛围系统重设计 · Phase 0 收支测算（v3 参数）');
console.log('═'.repeat(72));
console.log(`供给侧假设：固定 ${P.dailyFixedAtmo}/日 + 植物 ${P.plantAtmoPerDay}/日 + 事件 ${P.eventAtmoPerDay}/日 + 完成 ${P.completionsPerDay}本/日×${P.completionAtmo}`);
console.log(`需求侧：借阅区氛围 [0/40/150/350/800]，仪式 [40/100/250/500]，累计门槛 [500/1300/2400/3600]，软顶 ${P.freePoolSoftCap}`);
console.log('');

const rows = [];
for (const t of turnovers) {
  // 蒙特卡洛平均（磨损/损毁有随机性）
  const N = 20;
  const runs = Array.from({ length: N }, () => simulate(t));
  const avg = k => runs.reduce((s, r) => s + (r[k] || 0), 0) / N;
  const doneRate = runs.filter(r => r.done).length / N;
  const medDays = runs.map(r => r.day).sort((a, b) => a - b)[Math.floor(N / 2)];
  rows.push({
    turnover: t,
    首通天数: medDays,
    达成率: (doneRate * 100).toFixed(0) + '%',
    阶段2: Math.round(avg(2) || runs.map(r => r.stageDays[2] || 0).reduce((a, b) => a + b, 0) / N),
    阶段3: Math.round(runs.map(r => r.stageDays[3] || 0).reduce((a, b) => a + b, 0) / N),
    阶段4: Math.round(runs.map(r => r.stageDays[4] || 0).reduce((a, b) => a + b, 0) / N),
    阶段5: Math.round(runs.map(r => r.stageDays[5] || 0).reduce((a, b) => a + b, 0) / N),
    自由池峰值: Math.round(avg('freePoolPeak')),
    磨损重抄: Math.round(avg('recopies')),
    损毁次数: Math.round(avg('damages')),
  });
  if (verbose) {
    const r = runs[0];
    console.log(`\n── 周转率 ${t} 样本 ──`);
    console.log(`  终态：阶段 ${r.stage}，借阅区 Lv${r.borrowLv}/缮写室 Lv${r.focusLv}/修复室 Lv${r.restoreLv}，${r.day} 天`);
    console.log(`  磨损链：损毁 ${r.damages} 次，重抄 ${r.recopies} 次（耗灵感 ${r.recopies}），灵感结余 ${r.inspiration.toFixed(1)}`);
  }
}

console.log('');
console.log('周转率 | 首通中位天数 | 365天达成率 | 阶段2 | 阶段3 | 阶段4 | 阶段5 | 自由池峰值 | 重抄次数 | 损毁次数');
console.log('-'.repeat(100));
for (const r of rows) {
  console.log(
    String(r.turnover).padEnd(6), '|',
    String(r.首通天数).padEnd(12), '|',
    String(r.达成率).padEnd(11), '|',
    String(r.阶段2 || '-').padEnd(5), '|',
    String(r.阶段3 || '-').padEnd(5), '|',
    String(r.阶段4 || '-').padEnd(5), '|',
    String(r.阶段5 || '-').padEnd(5), '|',
    String(fmt(r.自由池峰值)).padEnd(10), '|',
    String(r.磨损重抄).padEnd(8), '|',
    r.损毁次数
  );
}
console.log('');
console.log('判读：');
console.log(`  · 旧模型首通 ~33 天撞 500 顶；4-5 倍目标 = 130-165 天`);
console.log(`  · 自由池峰值应 ≤ 软顶 ${P.freePoolSoftCap}（超出说明软顶被顶穿，需上调或加折损）`);
console.log('  · 365 天达成率 <100% 的场景 = 该周转率下经济过紧，需降仪式成本或提来源');
console.log('  · 重抄次数 × 1 灵感 vs 灵感来源：灵感净出 > 净入说明磨损链会抽干灵感');
