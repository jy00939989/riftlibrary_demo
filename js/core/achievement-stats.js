// @pure — testable in Node without DOM
// 成就统计辅助 + 加成计算（纯函数）

export function countOwnedBooks(books) {
  return Object.keys(books || {}).filter(id => books[id] && books[id].status !== 'locked').length;
}

export function countCategoryBooks(books, bookDefs, category) {
  return Object.keys(books || {}).filter(id => {
    const bs = books[id];
    if (!bs || bs.status === 'locked') return false;
    const book = bookDefs[id];
    return book && book.category === category;
  }).length;
}

export function countMasteryLevel(books, level) {
  return Object.keys(books || {}).filter(id => {
    const bs = books[id];
    return bs && bs.status !== 'locked' && bs.masteryLevel >= level;
  }).length;
}

export function countTotalVisitors(borrowRecords) {
  return (borrowRecords || []).filter(r => r.status === 'returned').length;
}

export function allVisitorsTriggered(borrowRecords, threshold = 6) {
  const triggered = new Set();
  (borrowRecords || []).forEach(r => { if (r.event) triggered.add(r.charId); });
  return triggered.size >= threshold;
}

export function countFocusDays(history) {
  const days = new Set();
  (history || []).forEach(h => {
    if (h.type === 'focus' && h.time) days.add(h.time.slice(0, 10));
  });
  return days.size;
}

// ── 成就加成计算（纯函数，接收已解锁成就 ID 的 Set）──
export function calcAchievementBonuses(unlockedSet) {
  return {
    streakMultiplier: unlockedSet.has('W06') ? 0.03 : 0.02,
    focusLevelBonus: unlockedSet.has('L04') ? 0.07 : 0.05,
    speedFlat:      unlockedSet.has('B07') ? 0.05 : 0,
    coinsBoost:     unlockedSet.has('V02') ? 0.10 : 0,
    inspirationBonus: (unlockedSet.has('W07') ? 1 : 0) + (unlockedSet.has('B08') ? 2 : 0),
  };
}

// ── 日志装帧等级 ──
export function getDiaryBindingLevel(diaryLogs) {
  const count = (diaryLogs || []).length;
  if (count >= 90) return { level: 4, name: '魔法装帧', icon: '✨' };
  if (count >= 60) return { level: 3, name: '皮面精装', icon: '📔' };
  if (count >= 30) return { level: 2, name: '线装布封', icon: '📒' };
  return { level: 1, name: '简装手记', icon: '📓' };
}

// ── 日期工具 ──
export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
