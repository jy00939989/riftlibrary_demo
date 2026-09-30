#!/usr/bin/env node
// 誊抄剩余分钟估算（estimateRemainingMinutes）纯函数回归
// 用法：node scripts/test-copy-remaining.mjs
//
// 公式锚点：timer.js tick 实际结算
//   wordsGained = round(elapsedSec/60) × 100 × focusMultiplier × (1+aura+curation)（冲刺 ×1.2）
//   自动完成条件：wordsGained >= totalWords - effectiveWords
//   会话倍率 speedMultiplier（墨墨首会 10×）让游戏内秒按倍率累积 → 现实分钟 = 游戏分钟 / speed
// 估算口径：totalMin = ceil(wordsNeeded / rate)；doneMin = round(elapsedSec/60)；
//           remainGameMin = max(0, totalMin - doneMin)；remainWallMin = ceil(remainGameMin / speed)
// 已知保守项：首 5 分钟茶饮 110/分钟快于估算（方向：预估略长，玩家早抄完不投诉）

import { estimateRemainingMinutes, getEffectiveCopiedWords, getWordsToNextCompletion, getRepairProgress, shouldHideCopyBarInRepair } from '../js/core/book-utils.js';

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failed++;
    failures.push(`${name}: ${e.message}`);
  }
}

function assertEq(actual, expected, label = '') {
  if (actual !== expected) {
    throw new Error(`${label} 期望 ${expected}，实得 ${actual}`);
  }
}

// ── S1 基础口径（无倍率，100 字/分钟）──
test('S1.1 万字新书 idle = 100 分钟', () => {
  assertEq(estimateRemainingMinutes({ totalWords: 10000, effectiveWords: 0 }), 100);
});
test('S1.2 部分完成按剩余字数', () => {
  assertEq(estimateRemainingMinutes({ totalWords: 10000, effectiveWords: 2500 }), 75);
});
test('S1.3 非整百向上取整（10500 字 = 105 分钟）', () => {
  assertEq(estimateRemainingMinutes({ totalWords: 10500, effectiveWords: 0 }), 105);
});
test('S1.4 已完成返回 0（含 wordsNeeded<=0 钳制）', () => {
  assertEq(estimateRemainingMinutes({ totalWords: 10000, effectiveWords: 10000 }), 0);
  assertEq(estimateRemainingMinutes({ totalWords: 10000, effectiveWords: 12000 }), 0);
});
test('S1.5 缺参容错：totalWords 缺省视为 0 → 0', () => {
  assertEq(estimateRemainingMinutes({}), 0);
});

// ── S2 倍率叠加 ──
test('S2.1 专注倍率 2× 减半', () => {
  assertEq(estimateRemainingMinutes({ totalWords: 10000, effectiveWords: 0, focusMultiplier: 2 }), 50);
});
test('S2.2 光环 +25%（rate 125 → 80 分钟）', () => {
  assertEq(estimateRemainingMinutes({ totalWords: 10000, effectiveWords: 0, auraSpeed: 0.25 }), 80);
});
test('S2.3 光环+策展叠乘区（rate 135 → ceil(74.07)=75）', () => {
  assertEq(estimateRemainingMinutes({ totalWords: 10000, effectiveWords: 0, auraSpeed: 0.25, curationSpeed: 0.1 }), 75);
});
test('S2.4 90% 冲刺 ×1.2（6000 字 rate 120 → 50）', () => {
  assertEq(estimateRemainingMinutes({ totalWords: 6000, effectiveWords: 0, sprint: true }), 50);
});
test('S2.5 rate 非正返回 null（不显示而非显示 0/∞）', () => {
  assertEq(estimateRemainingMinutes({ totalWords: 10000, effectiveWords: 0, focusMultiplier: 0 }), null);
});

// ── S3 进行中会话（elapsedSeconds 为游戏内秒，tick 用 Math.round(minutes)）──
test('S3.1 进行 10 分钟 → 剩 90', () => {
  assertEq(estimateRemainingMinutes({ totalWords: 10000, effectiveWords: 0, elapsedSeconds: 600 }), 90);
});
test('S3.2 doneMin 用 round 不用 floor（89 秒 = round(1.48)=1 分钟）', () => {
  assertEq(estimateRemainingMinutes({ totalWords: 10000, effectiveWords: 0, elapsedSeconds: 89 }), 99);
});
test('S3.3 接近完成钳零（elapsed 超 totalMin 不返负）', () => {
  assertEq(estimateRemainingMinutes({ totalWords: 10000, effectiveWords: 0, elapsedSeconds: 6050 }), 0);
});
test('S3.4 差一分钟边界（elapsed 5950s → round(99.17)=99 → 剩 1）', () => {
  assertEq(estimateRemainingMinutes({ totalWords: 10000, effectiveWords: 0, elapsedSeconds: 5950 }), 1);
});
test('S3.5 已完成书进行中会话仍返 0', () => {
  assertEq(estimateRemainingMinutes({ totalWords: 10000, effectiveWords: 9000, elapsedSeconds: 600 }), 0);
});

// ── S4 墨墨首会 10×（speedMultiplier 只压现实分钟）──
test('S4.1 10× 加速：100 游戏分钟 → 10 现实分钟', () => {
  assertEq(estimateRemainingMinutes({ totalWords: 10000, effectiveWords: 0, elapsedSeconds: 0, speedMultiplier: 10 }), 10);
});
test('S4.2 10× 加速进行一半（50 游戏分钟 → 5 现实分钟）', () => {
  assertEq(estimateRemainingMinutes({ totalWords: 10000, effectiveWords: 0, elapsedSeconds: 3000, speedMultiplier: 10 }), 5);
});
test('S4.3 speedMultiplier 异常 0 回退 1（不除零）', () => {
  assertEq(estimateRemainingMinutes({ totalWords: 10000, effectiveWords: 0, speedMultiplier: 0 }), 100);
});

// ── S5 与 tick 自动完成时刻对齐（仿真对齐锁死）──
test('S5.1 冲刺书：tick 于 round(elapsed/60)=84 完成，估算在 83.5 分钟时归 0', () => {
  // rate=120, wordsNeeded=10000 → totalMin=ceil(83.33)=84
  // elapsed 5010s = 83.5min → round=84 → remain = max(0, 84-84) = 0 ✓ 与 tick 同步归零
  assertEq(estimateRemainingMinutes({ totalWords: 10000, effectiveWords: 0, elapsedSeconds: 5010, sprint: true }), 0);
});
test('S5.2 冲刺书未到时显示余量（80 分钟 → 剩 4）', () => {
  // tick: 80×120=9600 < 10000 未完成；估算 84-80=4 ✓
  assertEq(estimateRemainingMinutes({ totalWords: 10000, effectiveWords: 0, elapsedSeconds: 4800, sprint: true }), 4);
});

// ── S6 与既有纯函数口径一致 ──
test('S6.1 getWordsToNextCompletion 与估算分子一致', () => {
  const bs = { copyCount: 1, copiedWords: 12500 }; // 已完成一轮，第二轮 2500/10000
  assertEq(getEffectiveCopiedWords(bs, 10000), 2500);
  assertEq(getWordsToNextCompletion(bs, 10000), 7500);
  assertEq(estimateRemainingMinutes({ totalWords: 10000, effectiveWords: getEffectiveCopiedWords(bs, 10000) }), 75);
});

// ── S7 修复中誊抄条隐藏（2026-09-30 图南拍板：已上架的书修复只剩修复条）──
test('S7.1 已上架书修复中隐藏誊抄条（copyCount≥1 + repair）', () => {
  const shelved = { copyCount: 1, copiedWords: 10000, damaged: true, repairWords: 500, repairProgress: 100 };
  assertEq(shouldHideCopyBarInRepair(shelved, getRepairProgress(shelved)), true);
});
test('S7.2 首次抄写中的书（copyCount=0）损坏：两条并存不隐藏', () => {
  const firstCopy = { copyCount: 0, copiedWords: 3000, damaged: true, repairWords: 500, repairProgress: 100 };
  assertEq(shouldHideCopyBarInRepair(firstCopy, getRepairProgress(firstCopy)), false);
});
test('S7.3 典藏重抄中无损坏：不隐藏', () => {
  const recopy = { copyCount: 1, copiedWords: 12500, damaged: false };
  assertEq(shouldHideCopyBarInRepair(recopy, getRepairProgress(recopy)), false);
});
test('S7.4 已上架书誊抄条回卷为 0% 的噪音根源（effectiveWords=0）', () => {
  const shelved = { copyCount: 1, copiedWords: 10000 };
  assertEq(getEffectiveCopiedWords(shelved, 10000), 0); // 根因：% totalWords 回卷
});

// ── S8 修复条每秒实况推进（2026-09-30 图南拍板：不要一分钟跳一次）──
// getLiveRepairProgress 在 render 层（结算才入账的 repairProgress + 会话内估算叠加）
import { state } from '../js/state.js';
import { getLiveRepairProgress } from '../js/render/focus/progress-bar.js';

test('S8.1 会话内实时修复进度平滑递增且封顶', () => {
  state.books['__t_repair'] = { copyCount: 1, copiedWords: 5000, damaged: true, repairWords: 1000, repairProgress: 400 };
  const sess = { active: true, bookId: '__t_repair', elapsedSeconds: 0, teaBoost: false };
  const t0 = getLiveRepairProgress(sess);
  sess.elapsedSeconds = 30;
  const t30 = getLiveRepairProgress(sess);
  sess.elapsedSeconds = 60;
  const t60 = getLiveRepairProgress(sess);
  assertEq(t0.done, 400);               // 起点 = state 已入账
  if (!(t30.done > t0.done && t60.done > t30.done)) throw new Error('未平滑递增');
  if (!(t60.done <= 1000 && t60.pct <= 100)) throw new Error('未封顶');
  delete state.books['__t_repair'];
});
test('S8.2 非修复中的书返回 null', () => {
  state.books['__t_ok'] = { copyCount: 0, copiedWords: 100 };
  const sess = { active: true, bookId: '__t_ok', elapsedSeconds: 60 };
  assertEq(getLiveRepairProgress(sess), null);
  delete state.books['__t_ok'];
});
test('S8.3 未激活会话返回 null', () => {
  state.books['__t_rep2'] = { copyCount: 1, damaged: true, repairWords: 100, repairProgress: 0 };
  const sess = { active: false, bookId: '__t_rep2', elapsedSeconds: 60 };
  assertEq(getLiveRepairProgress(sess), null);
  delete state.books['__t_rep2'];
});

console.log(`\n${passed} 通过, ${failed} 失败`);
if (failed > 0) {
  failures.forEach(f => console.error('  ✗ ' + f));
  process.exit(1);
}
