// 收集系统 —— 收集品状态管理（纯逻辑，不碰 DOM）
import { state } from './state.js';
import { BOOKS } from '../data/books.js';
import { PLANES, canUnlockPlane } from '../data/planes.js';

const STORAGE_KEY = 'library_collection';

// ========== 收集品分类定义 ==========

export const COLLECTION_CATEGORIES = [
  { id: 'books',       name: '书籍收集',       emoji: '📖', mvp: true,
    getProgress: () => getProgress() },
  { id: 'milestones',  name: '图书馆里程碑',   emoji: '📊', mvp: true,
    getProgress: () => getMilestoneProgress() },
  { id: 'plane_archive', name: '位面档案', emoji: '🌍', mvp: true,
    getProgress: () => getPlaneArchiveProgress() }
];

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

function getMilestoneProgress() {
  const items = [];

  // 氛围阶段
  const atmoStage = getAtmosphereStageName();
  items.push({ name: '氛围阶段', value: atmoStage, icon: '✨' });

  // 书架数量
  items.push({ name: '书架数量', value: `${state.library.shelves.length} 个`, icon: '📚' });

  // 借阅区等级
  items.push({ name: '借阅区等级', value: `Lv.${state.library.borrowLevel}`, icon: '🏛️' });

  // 累计专注天数
  const days = countFocusDays();
  items.push({ name: '累计专注天数', value: `${days} 天`, icon: '⏱️' });

  // 访客接待数
  const visitorCount = state.borrowRecords.filter(r => r.status === 'returned').length;
  items.push({ name: '访客接待数', value: `${visitorCount} 人`, icon: '👥' });

  const acquired = items.filter(i => i.value !== '0' && i.value !== '0 个' && i.value !== 'Lv.0' && i.value !== '废墟').length;
  return { items, acquired, total: items.length, percent: Math.round((acquired / items.length) * 100) };
}

// ========== 辅助 ==========

function getAtmosphereStageName() {
  const v = state.library.atmosphere;
  if (v <= 30) return '废墟';
  if (v <= 80) return '破败';
  if (v <= 160) return '陈旧';
  if (v <= 300) return '温暖';
  return '星辰';
}

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
    return { id: p.id, name: p.name, emoji: p.emoji, stage: quest ? quest.stage : 0, charsMet, charsTotal, mementoCount };
  });

  return { acquired, total, percent: Math.round((acquired / total) * 100), planes };
}

// ========== 全量获取 ==========

export function getCollectionState() {
  return COLLECTION_CATEGORIES.map(cat => ({
    ...cat,
    progress: cat.getProgress()
  }));
}
