// 收集系统 —— 收集品状态管理（纯逻辑，不碰 DOM）
import { state } from './state.js';
import { BOOKS } from '../data/books.js';
import { PLANES, canUnlockPlane } from '../data/planes.js';
import { t, getAtmosphereStageName } from './i18n/terms.js';
import { getVisitorStats } from './visitorMemory.js';

const STORAGE_KEY = 'library_collection';

// ========== 收集品分类定义 ==========

export const COLLECTION_CATEGORIES = [
  { id: 'books',       nameKey: 'collectionCategoryBooks',       emoji: '📖', mvp: true,
    getProgress: () => getProgress() },
  { id: 'milestones',  nameKey: 'collectionCategoryMilestones',   emoji: '📊', mvp: true,
    getProgress: () => getMilestoneProgress() },
  { id: 'visitor_memory', nameKey: 'collectionCategoryVisitorMemory', emoji: '🎐', mvp: true,
    getProgress: () => getVisitorMemoryProgress() },
  { id: 'plane_archive', nameKey: 'collectionCategoryPlaneArchive', emoji: '🌍', mvp: true,
    getProgress: () => getPlaneArchiveProgress() }
];

const PLANE_NAME_KEYS = {
  astral: 'planeName_astral',
  pastoral: 'planeName_pastoral',
  placeholder: 'planeName_placeholder'
};

function getPlaneName(id, fallback) {
  const key = PLANE_NAME_KEYS[id];
  return key ? t(key) : fallback;
}

// ========== 书籍收集进度 ==========

function getProgress() {
  const allBookIds = Object.keys(BOOKS);
  const owned = allBookIds.filter(id => {
    const bs = state.books[id];
    return bs && bs.status !== 'locked';
  });
  const completed = owned.filter(id => state.books[id].status === 'completed');

  // 按分类统计
  const byCategory = {};
  owned.forEach(id => {
    const book = BOOKS[id];
    if (!book) return;
    const cat = book.category;
    if (!byCategory[cat]) byCategory[cat] = { owned: 0, completed: 0, total: 0 };
    byCategory[cat].owned++;
    if (state.books[id].status === 'completed') byCategory[cat].completed++;
  });
  // 统计各分类总量
  Object.values(BOOKS).forEach(book => {
    if (!byCategory[book.category]) {
      byCategory[book.category] = { owned: 0, completed: 0, total: 0 };
    }
    byCategory[book.category].total++;
  });

  return {
    owned: owned.length,
    completed: completed.length,
    total: allBookIds.length,
    percent: allBookIds.length > 0 ? Math.round((owned.length / allBookIds.length) * 100) : 0,
    byCategory
  };
}

// ========== 图书馆里程碑进度 ==========

function getAtmosphereStageLevel(value) {
  if (value <= 30) return 1;
  if (value <= 80) return 2;
  if (value <= 160) return 3;
  if (value <= 300) return 4;
  return 5;
}

function getMilestoneProgress() {
  const items = [];

  // 氛围阶段
  const atmo = state.library.atmosphere || 0;
  const atmoStageLevel = getAtmosphereStageLevel(atmo);
  const atmoStageName = getAtmosphereStageName(atmoStageLevel);
  items.push({ name: t('collectionMilestoneAtmosphere'), value: atmoStageName, hasValue: atmo > 30, icon: '✨' });

  // 书架数量
  const shelfCount = state.library.shelves.length;
  items.push({ name: t('collectionMilestoneShelfCount'), value: t('collectionShelfCountValue').replace('{n}', shelfCount), hasValue: shelfCount > 0, icon: '📚' });

  // 借阅区等级
  const borrowLevel = state.library.borrowLevel || 0;
  items.push({ name: t('collectionMilestoneBorrowLevel'), value: t('levelShort').replace('{n}', borrowLevel), hasValue: borrowLevel > 0, icon: '🏛️' });

  // 累计专注天数
  const days = countFocusDays();
  items.push({ name: t('collectionMilestoneFocusDays'), value: t('daysCount').replace('{n}', days), hasValue: days > 0, icon: '⏱️' });

  // 访客接待数
  const visitorCount = state.borrowRecords.filter(r => r.status === 'returned').length;
  items.push({ name: t('collectionMilestoneVisitors'), value: t('peopleCount').replace('{n}', visitorCount), hasValue: visitorCount > 0, icon: '👥' });

  const acquired = items.filter(i => i.hasValue).length;
  return { items, acquired, total: items.length, percent: Math.round((acquired / items.length) * 100) };
}

// ========== 访客纪念进度 ==========

function getVisitorMemoryProgress() {
  const stats = getVisitorStats();
  return {
    collected: stats.collected,
    total: stats.total,
    percent: stats.percent
  };
}

// ========== 辅助 ==========

function countFocusDays() {
  const days = new Set();
  (state.history || []).forEach(h => {
    if (h.type === 'focus' && h.time) {
      days.add(h.time.slice(0, 10));
    }
  });
  return days.size;
}

// ========== 位面档案进度 ==========

function getPlaneArchiveProgress() {
  const unlocked = Object.values(PLANES).filter(p => !p.isPlaceholder && (p.unlocked || canUnlockPlane(p.id, state)));
  const total = Object.values(PLANES).filter(p => !p.isPlaceholder).length;
  const acquired = unlocked.length;

  // 各已解锁位面的简要信息
  const planes = unlocked.map(p => {
    const quest = state.quests && state.quests[p.id];
    const charsMet = quest ? Object.values(quest.characters).filter(c => c && c.met).length : 0;
    const charsTotal = p.characters ? p.characters.length : 0;
    const mementoCount = quest ? quest.mementos.length : 0;
    return { id: p.id, name: getPlaneName(p.id, p.name), emoji: p.emoji, stage: quest ? quest.stage : 0, charsMet, charsTotal, mementoCount };
  });

  return { acquired, total, percent: Math.round((acquired / total) * 100), planes };
}

// ========== 全量获取 ==========

export function getCollectionState() {
  return COLLECTION_CATEGORIES.map(cat => ({
    ...cat,
    name: t(cat.nameKey),
    progress: cat.getProgress()
  }));
}
