// 成就检测引擎 —— 纯逻辑模块，不碰 DOM
import { state, saveState } from './state.js';
import { BOOKS, CATEGORIES } from '../data/books.js';

// ========== 成就定义（30个） ==========

const ACHIEVEMENTS = [
  // ---- 修复启蒙 ----
  { id: 'F01', name: '图书馆之门', rarity: '青铜', category: '修复启蒙',
    desc: '完成新手引导，正式接手这座破败的图书馆',
    check: (s, t) => s.introCompleted },
  { id: 'F02', name: '智慧初光', rarity: '青铜', category: '修复启蒙',
    desc: '第一次完成专注模式',
    check: (s, t) => t === 'focus_complete' },
  { id: 'F03', name: '首卷修复', rarity: '青铜', category: '修复启蒙',
    desc: '完整誊抄完成第一本书并上架',
    check: (s, t, p) => t === 'book_complete' },
  { id: 'F04', name: '借阅初启', rarity: '白银', category: '修复启蒙',
    desc: '迎来第一位访客并完成借阅归还',
    check: (s, t) => t === 'visitor_return' },

  // ---- 智慧之光 ----
  { id: 'W01', name: '晨读半小时', rarity: '青铜', category: '智慧之光',
    desc: '累计专注时长达到30分钟',
    check: (s, t) => t === 'focus' && s.focus.totalMinutes >= 30 },
  { id: 'W02', name: '夜读一小时', rarity: '青铜', category: '智慧之光',
    desc: '累计专注时长达到1小时',
    check: (s, t) => t === 'focus' && s.focus.totalMinutes >= 60 },
  { id: 'W03', name: '万字千言', rarity: '青铜', category: '智慧之光',
    desc: '累计誊抄1万字',
    check: (s, t) => t === 'focus' && s.focus.totalWords >= 10000 },
  { id: 'W04', name: '三日不辍', rarity: '白银', category: '智慧之光',
    desc: '连续3天专注',
    check: (s, t) => t === 'focus' && s.focus.streak >= 3 },
  { id: 'W05', name: '八小时修行', rarity: '白银', category: '智慧之光',
    desc: '累计专注时长达到8小时',
    check: (s, t) => t === 'focus' && s.focus.totalMinutes >= 480 },
  { id: 'W06', name: '七日不绝', rarity: '黄金', category: '智慧之光',
    desc: '连续7天专注',
    check: (s, t) => t === 'focus' && s.focus.streak >= 7 },
  { id: 'W07', name: '十万字匠', rarity: '黄金', category: '智慧之光',
    desc: '累计誊抄10万字',
    check: (s, t) => t === 'focus' && s.focus.totalWords >= 100000 },
  { id: 'W08', name: '三十日之约', rarity: '铂金', category: '智慧之光',
    desc: '累计30天有专注记录（可不连续）',
    check: (s, t) => t === 'focus' && countFocusDays(s) >= 30 },

  // ---- 书籍收集 ----
  { id: 'B01', name: '开卷有益', rarity: '青铜', category: '书籍收集',
    desc: '第一次开始誊抄一本书',
    check: (s, t) => t === 'copy_start' },
  { id: 'B02', name: '十卷初成', rarity: '白银', category: '书籍收集',
    desc: '拥有10本不同的书籍',
    check: (s, t) => t === 'book' && countOwnedBooks(s) >= 10 },
  { id: 'B03', name: '小说世界', rarity: '白银', category: '书籍收集',
    desc: '小说类书籍收集达到5本',
    check: (s, t) => t === 'book' && countCategoryBooks(s, '小说') >= 5 },
  { id: 'B04', name: '史海钩沉', rarity: '白银', category: '书籍收集',
    desc: '历史类书籍收集达到5本',
    check: (s, t) => t === 'book' && countCategoryBooks(s, '历史') >= 5 },
  { id: 'B05', name: '格物致知', rarity: '白银', category: '书籍收集',
    desc: '科学类书籍收集达到3本',
    check: (s, t) => t === 'book' && countCategoryBooks(s, '科学') >= 3 },
  { id: 'B06', name: '哲思之路', rarity: '白银', category: '书籍收集',
    desc: '哲学类书籍收集达到3本',
    check: (s, t) => t === 'book' && countCategoryBooks(s, '哲学') >= 3 },
  { id: 'B07', name: '五书精通', rarity: '黄金', category: '书籍收集',
    desc: '5本书达到mastery Lv3以上',
    check: (s, t) => t === 'book' && countMasteryLevel(s, 3) >= 5 },
  { id: 'B08', name: '典藏大师', rarity: '铂金', category: '书籍收集',
    desc: '3本书达到mastery Lv5',
    check: (s, t) => t === 'book' && countMasteryLevel(s, 5) >= 3 },

  // ---- 图书馆重建 ----
  { id: 'L01', name: '初见光明', rarity: '青铜', category: '图书馆重建',
    desc: '氛围脱离废墟阶段（>30）',
    check: (s, t) => t === 'library' && s.library.atmosphere > 30 },
  { id: 'L02', name: '书架添丁', rarity: '白银', category: '图书馆重建',
    desc: '购买第一个新书架',
    check: (s, t) => t === 'purchase_shelf' },
  { id: 'L02b', name: '墨香初遇', rarity: '青铜', category: '图书馆重建',
    desc: '购买第一本书',
    check: (s, t) => t === 'purchase_book' },
  { id: 'L03', name: '书香满架', rarity: '白银', category: '图书馆重建',
    desc: '氛围达到陈旧阶段（>80）',
    check: (s, t) => t === 'library' && s.library.atmosphere > 80 },
  { id: 'L04', name: '借阅进阶', rarity: '白银', category: '图书馆重建',
    desc: '借阅区升至Lv3',
    check: (s, t) => t === 'library' && s.library.borrowLevel >= 3 },
  { id: 'L05', name: '温暖殿堂', rarity: '黄金', category: '图书馆重建',
    desc: '氛围达到温暖阶段（>160）',
    check: (s, t) => t === 'library' && s.library.atmosphere > 160 },
  { id: 'L06', name: '借阅殿堂', rarity: '黄金', category: '图书馆重建',
    desc: '借阅区升至Lv7',
    check: (s, t) => t === 'library' && s.library.borrowLevel >= 7 },
  { id: 'L07', name: '星辰图书馆', rarity: '铂金', category: '图书馆重建',
    desc: '氛围达到星辰阶段（>300）',
    check: (s, t) => t === 'library' && s.library.atmosphere > 300 },

  // ---- 访客 ----
  { id: 'V01', name: '门庭若市', rarity: '白银', category: '访客',
    desc: '累计迎接20位访客',
    check: (s, t) => t === 'visitor' && countTotalVisitors(s) >= 20 },
  { id: 'V02', name: '四海皆知', rarity: '黄金', category: '访客',
    desc: '4位访客各触发过至少一次事件',
    check: (s, t) => t === 'visitor' && allVisitorsTriggered(s) },

  // ---- 彩蛋 ----
  { id: 'H01', name: '午夜访客', rarity: '黄金', category: '彩蛋',
    desc: '在凌晨0:00-2:00间收取一位访客的还书',
    check: (s, t, p) => t === 'visitor_return' && p && p.hour >= 0 && p.hour < 2 },
  { id: 'H02', name: '书虫之友', rarity: '黄金', category: '彩蛋',
    desc: '在专注页累计点击书籍emoji 30次',
    check: (s, t) => t === 'click_emoji' }
];

// ========== 存储 ==========

const STORAGE_KEY = 'library_achievements';

function loadUnlocked() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw).unlocked || {} : {};
  } catch { return {}; }
}

function saveUnlocked(unlocked) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ unlocked }));
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
  return true;
}

// ========== 辅助统计函数 ==========

function countOwnedBooks(s) {
  return Object.keys(s.books).filter(id => s.books[id] && s.books[id].status !== 'locked').length;
}

function countCategoryBooks(s, category) {
  return Object.keys(s.books).filter(id => {
    const bs = s.books[id];
    if (!bs || bs.status === 'locked') return false;
    const book = BOOKS[id];
    return book && book.category === category;
  }).length;
}

function countMasteryLevel(s, level) {
  return Object.keys(s.books).filter(id => {
    const bs = s.books[id];
    return bs && bs.status !== 'locked' && bs.masteryLevel >= level;
  }).length;
}

function countTotalVisitors(s) {
  return s.borrowRecords.filter(r => r.status === 'returned').length;
}

function allVisitorsTriggered(s) {
  const triggered = new Set();
  s.borrowRecords.forEach(r => { if (r.event) triggered.add(r.charId); });
  return triggered.has('shenmingyuan') && triggered.has('xiaoying')
      && triggered.has('yunyou') && triggered.has('ajiu');
}

function countFocusDays(s) {
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

let emojiClickCount = parseInt(localStorage.getItem('lib_emoji_clicks') || '0', 10);

export function registerEmojiClick() {
  emojiClickCount++;
  localStorage.setItem('lib_emoji_clicks', emojiClickCount.toString());
  if (emojiClickCount >= 30) {
    return checkAchievements('click_emoji');
  }
  return [];
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
      console.warn(`成就检测异常 [${ach.id}]:`, e);
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
