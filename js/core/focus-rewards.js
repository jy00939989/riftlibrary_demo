// @pure — testable in Node without DOM
// 专注奖励计算：字数、金币、里程碑触发

export const MILESTONES = [
  { words: 50000 },
  { words: 100000 },
  { words: 200000 },
  { words: 350000 },
  { words: 500000 },
  { words: 800000 },
  { words: 1200000 }
];

/**
 * 计算一次专注获得的字数。
 * @param {object} params
 * @param {number} params.minutes - 专注分钟数
 * @param {string|null} params.bookId - 当前书籍 ID
 * @param {boolean} params.teaBoost - 是否启用热茶加速
 * @param {number} params.focusSpeedMultiplier - 缮写室速率倍率
 * @param {number} params.auraSpeed - 光环速度加成
 * @param {number} params.curationSpeed - 策展速度加成
 * @param {number} params.repairSpeedBonus - 修复速度加成
 * @param {Function} params.getChapterInfo - (book, bookState) => { progressPct }
 * @param {object|null} params.book - 书籍定义
 * @param {object|null} params.bookState - 书籍状态
 */
export function calculateWordsGained({
  minutes,
  teaBoost,
  focusSpeedMultiplier,
  auraSpeed,
  curationSpeed,
  repairSpeedBonus,
  getChapterInfo,
  book,
  bookState
}) {
  let wordsGained;
  if (teaBoost) {
    const boostMin = Math.min(5, minutes);
    const normalMin = minutes - boostMin;
    wordsGained = Math.round((boostMin * 110 + normalMin * 100) * focusSpeedMultiplier * (1 + auraSpeed + curationSpeed + repairSpeedBonus));
  } else {
    wordsGained = Math.round(minutes * 100 * focusSpeedMultiplier * (1 + auraSpeed + curationSpeed + repairSpeedBonus));
  }

  // 章节收尾冲刺：专注开始时章节进度 ≥90% → +20% 速度
  if (book && bookState && getChapterInfo) {
    const chInfo = getChapterInfo(book, bookState);
    if (chInfo && chInfo.progressPct >= 90) {
      wordsGained = Math.round(wordsGained * 1.20);
    }
  }

  return wordsGained;
}

/**
 * 计算一次专注获得的金币。
 */
export function calculateCoinsEarned({
  minutes,
  auraCoinsMult,
  curationCoins,
  coinsBoost
}) {
  return Math.round(minutes * 0.8 * (1 + auraCoinsMult + curationCoins) * (1 + coinsBoost));
}

/**
 * 返回本次专注触发的里程碑列表（不修改 state）。
 * @param {number} prevWords - 专注前累计字数
 * @param {number} newWords - 专注后累计字数
 * @param {number[]} claimedMilestones - 已领取里程碑索引
 */
export function calculateMilestoneTriggers(prevWords, newWords, claimedMilestones = []) {
  const triggered = [];
  MILESTONES.forEach((ms, idx) => {
    if (claimedMilestones.includes(idx)) return;
    if (newWords >= ms.words && prevWords < ms.words) {
      triggered.push({ idx, words: ms.words });
    }
  });
  return triggered;
}

/**
 * 获取下一个未达成里程碑的字数。
 */
export function getNextMilestone(totalWords) {
  for (const ms of MILESTONES) {
    if (totalWords < ms.words) return ms.words;
  }
  return null;
}
