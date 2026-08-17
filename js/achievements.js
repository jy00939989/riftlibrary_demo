// 成就检测引擎 —— 纯逻辑模块，不碰 DOM
import { state, saveState } from './state.js';
import { BOOKS, CATEGORIES } from '../data/books.js';
import { isVolumeBookId, getVolumeGroupByVolumeId } from '../data/volume_groups.js';
import { load, save, STORAGE_KEYS } from './persistence.js';
import { track } from './backend/analytics.js';

// ========== 成就定义（30个） ==========

const ACHIEVEMENTS = [
  // ---- 修复启蒙 ----
  { id: 'F01', name: 'achName_F01', rarity: 'bronze', category: 'restoration',
    desc: 'achDesc_F01',
    check: (s, t) => s.introCompleted },
  { id: 'F02', name: 'achName_F02', rarity: 'bronze', category: 'restoration',
    desc: 'achDesc_F02',
    check: (s, t) => t === 'focus_complete' },
  { id: 'F03', name: 'achName_F03', rarity: 'bronze', category: 'restoration',
    desc: 'achDesc_F03',
    check: (s, t, p) => t === 'book_complete' },
  { id: 'F04', name: 'achName_F04', rarity: 'silver', category: 'restoration',
    desc: 'achDesc_F04',
    check: (s, t) => t === 'visitor_return' },

  // ---- 智慧之光 ----
  { id: 'W01', name: 'achName_W01', rarity: 'bronze', category: 'wisdom',
    desc: 'achDesc_W01',
    check: (s, t) => t === 'focus' && s.focus.totalMinutes >= 30 },
  { id: 'W02', name: 'achName_W02', rarity: 'bronze', category: 'wisdom',
    desc: 'achDesc_W02',
    check: (s, t) => t === 'focus' && s.focus.totalMinutes >= 60 },
  { id: 'W03', name: 'achName_W03', rarity: 'bronze', category: 'wisdom',
    desc: 'achDesc_W03',
    check: (s, t) => t === 'focus' && s.focus.totalWords >= 10000 },
  { id: 'W04', name: 'achName_W04', rarity: 'silver', category: 'wisdom',
    desc: 'achDesc_W04',
    check: (s, t) => t === 'focus' && s.focus.streak >= 3 },
  { id: 'W05', name: 'achName_W05', rarity: 'silver', category: 'wisdom',
    desc: 'achDesc_W05',
    check: (s, t) => t === 'focus' && s.focus.totalMinutes >= 480 },
  { id: 'W06', name: 'achName_W06', rarity: 'gold', category: 'wisdom',
    desc: 'achDesc_W06',
    check: (s, t) => t === 'focus' && s.focus.streak >= 7 },
  { id: 'W07', name: 'achName_W07', rarity: 'gold', category: 'wisdom',
    desc: 'achDesc_W07',
    check: (s, t) => t === 'focus' && s.focus.totalWords >= 100000 },
  { id: 'W08', name: 'achName_W08', rarity: 'platinum', category: 'wisdom',
    desc: 'achDesc_W08',
    check: (s, t) => t === 'focus' && countFocusDays(s) >= 30 },

  // ---- 书籍收集 ----
  { id: 'B01', name: 'achName_B01', rarity: 'bronze', category: 'collection',
    desc: 'achDesc_B01',
    check: (s, t) => t === 'copy_start' },
  { id: 'B02', name: 'achName_B02', rarity: 'silver', category: 'collection',
    desc: 'achDesc_B02',
    check: (s, t) => t === 'book' && countOwnedBooks(s) >= 10 },
  { id: 'B03', name: 'achName_B03', rarity: 'silver', category: 'collection',
    desc: 'achDesc_B03',
    check: (s, t) => t === 'book' && countCategoryBooks(s, '小说') >= 5 },
  { id: 'B04', name: 'achName_B04', rarity: 'silver', category: 'collection',
    desc: 'achDesc_B04',
    check: (s, t) => t === 'book' && countCategoryBooks(s, '历史') >= 5 },
  { id: 'B05', name: 'achName_B05', rarity: 'silver', category: 'collection',
    desc: 'achDesc_B05',
    check: (s, t) => t === 'book' && countCategoryBooks(s, '科学') >= 3 },
  { id: 'B06', name: 'achName_B06', rarity: 'silver', category: 'collection',
    desc: 'achDesc_B06',
    check: (s, t) => t === 'book' && countCategoryBooks(s, '哲学') >= 3 },
  { id: 'B07', name: 'achName_B07', rarity: 'gold', category: 'collection',
    desc: 'achDesc_B07',
    check: (s, t) => t === 'book' && countMasteryLevel(s, 3) >= 5 },
  { id: 'B08', name: 'achName_B08', rarity: 'platinum', category: 'collection',
    desc: 'achDesc_B08',
    check: (s, t) => t === 'book' && countMasteryLevel(s, 5) >= 3 },
  { id: 'B09', name: 'achName_B09', rarity: 'gold', category: 'collection',
    desc: 'achDesc_B09',
    check: (s, t) => t === 'volume_collect' },

  // ---- 图书馆重建 ----
  { id: 'L01', name: 'achName_L01', rarity: 'bronze', category: 'reconstruction',
    desc: 'achDesc_L01',
    check: (s, t) => t === 'library' && s.library.atmosphere > 30 },
  { id: 'L02', name: 'achName_L02', rarity: 'silver', category: 'reconstruction',
    desc: 'achDesc_L02',
    check: (s, t) => t === 'purchase_shelf' },
  { id: 'L02b', name: 'achName_L02b', rarity: 'bronze', category: 'reconstruction',
    desc: 'achDesc_L02b',
    check: (s, t) => t === 'purchase_book' },
  { id: 'L03', name: 'achName_L03', rarity: 'silver', category: 'reconstruction',
    desc: 'achDesc_L03',
    check: (s, t) => t === 'library' && s.library.atmosphere > 80 },
  { id: 'L04', name: 'achName_L04', rarity: 'silver', category: 'reconstruction',
    desc: 'achDesc_L04',
    check: (s, t) => t === 'library' && s.library.borrowLevel >= 3 },
  { id: 'L05', name: 'achName_L05', rarity: 'gold', category: 'reconstruction',
    desc: 'achDesc_L05',
    check: (s, t) => t === 'library' && s.library.atmosphere > 160 },
  { id: 'L06', name: 'achName_L06', rarity: 'gold', category: 'reconstruction',
    desc: 'achDesc_L06',
    check: (s, t) => t === 'library' && s.library.borrowLevel >= 7 },
  { id: 'L07', name: 'achName_L07', rarity: 'platinum', category: 'reconstruction',
    desc: 'achDesc_L07',
    check: (s, t) => t === 'library' && s.library.atmosphere > 300 },

  // ---- 访客 ----
  { id: 'V03', name: 'achName_V03', rarity: 'bronze', category: 'visitors',
    desc: 'achDesc_V03',
    check: (s, t) => t === 'visitor_arrive' },
  { id: 'V01', name: 'achName_V01', rarity: 'silver', category: 'visitors',
    desc: 'achDesc_V01',
    check: (s, t) => t === 'visitor' && countTotalVisitors(s) >= 20 },
  { id: 'V02', name: 'achName_V02', rarity: 'gold', category: 'visitors',
    desc: 'achDesc_V02',
    check: (s, t) => t === 'visitor' && allVisitorsTriggered(s) },

  // ---- 彩蛋 ----
  { id: 'H01', name: 'achName_H01', rarity: 'gold', category: 'secrets',
    desc: 'achDesc_H01',
    check: (s, t, p) => t === 'visitor_return' && p && p.hour >= 0 && p.hour < 2 },
  { id: 'H02', name: 'achName_H02', rarity: 'gold', category: 'secrets',
    desc: 'achDesc_H02',
    check: (s, t) => t === 'click_emoji' }
];

// ========== 存储 ==========

function loadUnlocked() {
  try {
    const data = load(STORAGE_KEYS.ACHIEVEMENTS, {});
    return data.unlocked || {};
  } catch { return {}; }
}

function saveUnlocked(unlocked) {
  save(STORAGE_KEYS.ACHIEVEMENTS, { unlocked });
}

function isUnlocked(id) {
  const u = loadUnlocked();
  return !!u[id];
}

function unlock(id) {
  const u = loadUnlocked();
  if (u[id]) return false;
  u[id] = { unlockedAt: Date.now() };
  saveUnlocked(u);
  track('achievement_unlock', { achievement_id: id });
  return true;
}

// ========== 辅助统计函数 ==========

// 单卷归并到典藏版 ID，避免 24 单卷冲掉"拥有 10 本书"进度
function normalizeBookIdForStats(id) {
  if (isVolumeBookId(id)) {
    const group = getVolumeGroupByVolumeId(id);
    return group ? group.collectedBookId : id;
  }
  return id;
}

export function countOwnedBooks(s) {
  const seen = new Set();
  Object.keys(s.books || {}).forEach(id => {
    const bs = s.books[id];
    if (!bs || bs.status === 'locked') return;
    seen.add(normalizeBookIdForStats(id));
  });
  return seen.size;
}

export function countCategoryBooks(s, category) {
  const seen = new Set();
  Object.keys(s.books || {}).forEach(id => {
    const bs = s.books[id];
    if (!bs || bs.status === 'locked') return;
    const normalized = normalizeBookIdForStats(id);
    if (seen.has(normalized)) return;
    const book = BOOKS[normalized];
    if (book && book.category === category) {
      seen.add(normalized);
    }
  });
  return seen.size;
}

export function countMasteryLevel(s, level) {
  const seen = new Set();
  Object.keys(s.books || {}).forEach(id => {
    const bs = s.books[id];
    if (!bs || bs.status === 'locked' || bs.masteryLevel < level) return;
    seen.add(normalizeBookIdForStats(id));
  });
  return seen.size;
}

export function countTotalVisitors(s) {
  return s.borrowRecords.filter(r => r.status === 'returned').length;
}

export function allVisitorsTriggered(s) {
  const triggered = new Set();
  s.borrowRecords.forEach(r => { if (r.event) triggered.add(r.charId); });
  return triggered.size >= 6; // 10位中至少触发过6位的事件
}

export function countFocusDays(s) {
  // 从 history 中有 focus 记录的日期去重计数
  const days = new Set();
  (s.history || []).forEach(h => {
    if (h.type === 'focus' && h.time) {
      days.add(h.time.slice(0, 10));
    }
  });
  return days.size;
}

// ========== 全局点击计数（书虫彩蛋） ==========

let emojiClickCount = null;

function getEmojiClickCount() {
  if (emojiClickCount === null) {
    emojiClickCount = load(STORAGE_KEYS.META, 0);
  }
  return emojiClickCount;
}

export function registerEmojiClick() {
  const count = getEmojiClickCount() + 1;
  emojiClickCount = count;
  save(STORAGE_KEYS.META, count);
  if (count >= 30) {
    return checkAchievements('click_emoji');
  }
  return [];
}

// ========== 成就加成查询 ==========

/**
 * 返回已解锁成就的聚合加成对象，供 speed / coins / inspiration 消费。
 * 从 persistence 读取，不依赖 state。
 */
import { calcAchievementBonuses } from './core/achievement-stats.js';
export { calcAchievementBonuses };

export function getAchievementBonuses() {
  const unlocked = loadUnlocked(); // ← 读 persistence（副作用）
  return calcAchievementBonuses(new Set(Object.keys(unlocked)));
}

// ========== 检测入口 ==========

export function checkAchievements(trigger, payload) {
  const newlyUnlocked = [];

  ACHIEVEMENTS.forEach(ach => {
    if (isUnlocked(ach.id)) return;
    try {
      if (ach.check(state, trigger, payload)) {
        if (unlock(ach.id)) {
          newlyUnlocked.push(ach);
        }
      }
    } catch (e) {
      // 单个成就检测异常不应中断整体流程
    }
  });

  return newlyUnlocked;
}

// ========== 批量检测（启动时调用） ==========

export function checkAllOnInit() {
  const triggers = ['focus', 'book', 'library', 'visitor'];
  const all = [];
  triggers.forEach(t => {
    const result = checkAchievements(t);
    all.push(...result);
  });
  return all;
}

// ========== 读取全量状态（供渲染） ==========

export function getAchievementState() {
  const unlocked = loadUnlocked();
  return ACHIEVEMENTS.map(ach => ({
    ...ach,
    unlocked: !!unlocked[ach.id],
    unlockedAt: unlocked[ach.id] ? unlocked[ach.id].unlockedAt : null
  }));
}

export function getAchievementStats() {
  const all = getAchievementState();
  const unlocked = all.filter(a => a.unlocked).length;
  return { unlocked, total: all.length, list: all };
}
