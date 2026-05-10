// 访客系统 —— 纯逻辑模块，不碰 DOM
import { state, saveState } from './state.js';
import { addCoins, addAtmosphere, addHistory } from './storage.js';
import { BOOKS } from '../data/books.js';

// ========== 访客角色定义 ==========

export const VISITOR_DEFS = {
  shenmingyuan: {
    id: 'shenmingyuan',
    name: '沈明远',
    emoji: '👨‍🏫',
    title: '退休文学教授 · 白发圆框眼镜',
    category: ['寓言', '哲学'],
    events: ['gift_book', 'annotation']
  },
  xiaoying: {
    id: 'xiaoying',
    name: '小萤',
    emoji: '🧒',
    title: '12岁冒险少女 · 大帆布包',
    category: ['童话', '奇幻'],
    events: ['treasure_map']
  },
  yunyou: {
    id: 'yunyou',
    name: '云游',
    emoji: '🎵',
    title: '流浪吟游诗人 · 浪漫忧郁',
    category: [],  // 无偏好，所有类型
    events: ['poem']
  },
  ajiu: {
    id: 'ajiu',
    name: '阿九',
    emoji: '📦',
    title: '年轻书贩 · 精明善良',
    category: [],  // 偏好稀有书籍（暂用全部）
    events: ['sales_pitch']
  }
};

// ========== 云游诗句库 ==========

const POEMS = [
  '风从远方来，翻开书中某一页，像你的手拂过我的眉间。',
  '书架之间的光柱中，尘埃舞蹈。每一粒都是被遗忘的故事。',
  '墨水在黄纸上晕开，如同夜雾笼罩湖面。这本书记录了谁的梦？',
  '月光斜照进窗棂，照亮旧书上褪色的烫金。古老的字迹低声诉说。',
  '时间是一条河，书籍是漂在河上的纸船，不知会停在谁的手中。',
  '翻书的声音是世上最美妙的音乐，每一页都在等待知音。'
];

// ========== 神秘书籍池（沈明远专属） ==========

const MYSTERY_BOOKS = [
  { title: '《遗忘之书》', words: 28000, emoji: '📕' },
  { title: '《月下独白》', words: 21000, emoji: '📗' },
  { title: '《时间的褶皱》', words: 35000, emoji: '📘' }
];

// ========== 阿九推销书籍池 ==========

const SALE_BOOKS = [
  { title: '《星尘往事》', words: 18000, emoji: '📙', category: '小说' },
  { title: '《梦境漫游》', words: 22000, emoji: '📓', category: '童话' },
  { title: '《古卷传奇》', words: 32000, emoji: '📔', category: '历史' },
  { title: '《异世界植物志》', words: 28000, emoji: '🌿', category: '科学' },
  { title: '《魔法药剂入门》', words: 15000, emoji: '🧪', category: '科学' },
  { title: '《远古符文考》', words: 40000, emoji: '🗿', category: '神话' }
];

// ========== 内部工具 ==========

let visitorIdCounter = Date.now();
function nextVisitorId() { return 'v_' + (visitorIdCounter++).toString(36); }
function nextBorrowId() { return 'br_' + (visitorIdCounter++).toString(36); }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getNow() {
  return window.__dev && window.__dev.getNow ? window.__dev.getNow() : Date.now();
}

function addVisitorFavor(charId, amount) {
  if (!state.visitorFavors) {
    state.visitorFavors = { shenmingyuan: 0, xiaoying: 0, yunyou: 0, ajiu: 0 };
  }
  if (state.visitorFavors[charId] !== undefined) {
    state.visitorFavors[charId] += amount;
  }
}

// ========== 访客刷新 ==========

export function spawnVisitor() {
  const browsing = state.visitors.filter(v => v.status === 'browsing' || v.status === 'borrowed');
  if (browsing.length >= 3) return null; // 同时在馆上限 3 人

  const charIds = Object.keys(VISITOR_DEFS);
  const charId = pick(charIds);
  const def = VISITOR_DEFS[charId];

  const visitor = {
    id: nextVisitorId(),
    charId,
    name: def.name,
    emoji: def.emoji,
    title: def.title,
    status: 'browsing',
    bookId: null,
    bookTitle: null,
    arriveTime: getNow(),
    borrowTime: null,
    dueTime: null,
    eventTriggered: false,
    favorability: 0
  };

  state.visitors.push(visitor);
  saveState();
  addHistory('visitor', `${def.emoji} ${def.name} 来到图书馆`, def.title);
  return visitor;
}

// ========== 借书逻辑 ==========

export function tickVisitorBrowsing(now) {
  const completedBooks = getCompletedBooks();
  if (completedBooks.length === 0) return;

  state.visitors.forEach(visitor => {
    if (visitor.status !== 'browsing') return;

    // 浏览中缓慢增加好感度
    visitor.favorability = (visitor.favorability || 0) + 1;
    addVisitorFavor(visitor.charId, 1);

    // 浏览随机时长后尝试借书（简化：每次 tick 有 40% 概率借书）
    if (Math.random() > 0.4) return;

    attemptBorrow(visitor, completedBooks, now);
  });
}

function getCompletedBooks() {
  return Object.values(BOOKS).filter(book => {
    const bs = state.books[book.id];
    return bs && bs.status === 'completed' && !bs.damaged &&
           !state.visitors.some(v => v.bookId === book.id && (v.status === 'borrowed' || v.status === 'due'));
  });
}

function attemptBorrow(visitor, completedBooks, now) {
  const def = VISITOR_DEFS[visitor.charId];

  // 偏好匹配优先
  let candidates = completedBooks;
  if (def.category && def.category.length > 0) {
    const preferred = completedBooks.filter(b => def.category.includes(b.category));
    if (preferred.length > 0) {
      candidates = preferred;
    }
  }

  const book = pick(candidates);
  if (!book) return;

  const bookWords = book.totalWords || 28000;
  // 还书时间：60分钟 ~ 24小时，书籍越长借阅越久
  const borrowHours = Math.max(1, Math.min(24, Math.round(bookWords / 2000)));
  const dueTime = now + borrowHours * 3600000;

  visitor.status = 'borrowed';
  visitor.bookId = book.id;
  visitor.bookTitle = book.title;
  visitor.borrowTime = now;
  visitor.dueTime = dueTime;
  visitor.favorability = (visitor.favorability || 0) + 3;
  addVisitorFavor(visitor.charId, 3);

  addHistory('visitor', `${visitor.emoji} ${visitor.name} 借走了《${book.title}》`,
    `${borrowHours}小时后归还 · 好感+3`);
  saveState();
}

// ========== 还书到期检查 ==========

export function checkDueVisitors(now) {
  const dueList = [];
  state.visitors.forEach(visitor => {
    if (visitor.status === 'borrowed' && visitor.dueTime && now >= visitor.dueTime) {
      visitor.status = 'due';
      dueList.push(visitor);
      addHistory('visitor', `${visitor.emoji} ${visitor.name} 已读完《${visitor.bookTitle}》`, '等待收取');
    }
  });
  if (dueList.length > 0) saveState();
  return dueList;
}

// ========== 收取还书 + 事件触发 ==========

export function collectReturn(visitorId) {
  const idx = state.visitors.findIndex(v => v.id === visitorId);
  if (idx === -1) return null;

  const visitor = state.visitors[idx];
  if (visitor.status !== 'due') return null;

  const bookId = visitor.bookId;
  const bookTitle = visitor.bookTitle;
  const charId = visitor.charId;
  const def = VISITOR_DEFS[charId];

  // 基础收益
  addCoins(30);
  addAtmosphere(2);
  visitor.favorability = (visitor.favorability || 0) + 5;
  addVisitorFavor(charId, 5);
  addHistory('visitor', `${visitor.emoji} ${visitor.name} 归还了《${bookTitle}》`, '获得30代币 +2氛围 · 好感+5');

  // 记录借阅历史
  state.borrowRecords.unshift({
    id: nextBorrowId(),
    charId,
    charName: visitor.name,
    bookId,
    bookTitle,
    borrowTime: visitor.borrowTime,
    returnTime: getNow(),
    event: null,
    status: 'returned'
  });

  // 判定 1：损毁（~3%）
  let damaged = false;
  if (Math.random() < 0.03 && bookId && state.books[bookId]) {
    const bs = state.books[bookId];
    bs.damaged = true;
    bs.repairWords = Math.round(bs.copiedWords * 0.25);
    addHistory('damage', `⚠️ 《${bookTitle}》在归还时发现损毁`, `需专注修复${bs.repairWords.toLocaleString()}字`);
    damaged = true;
  }

  // 判定 2：角色事件（~60%）
  let eventResult = null;
  if (Math.random() < 0.6 && !visitor.eventTriggered) {
    eventResult = triggerEvent(charId, visitor);
    visitor.eventTriggered = true;
  }

  // 移出访客列表
  state.visitors.splice(idx, 1);
  saveState();

  return { damaged, event: eventResult, bookId, bookTitle, charId };
}

// ========== 随机事件 ==========

function triggerEvent(charId, visitor) {
  const def = VISITOR_DEFS[charId];
  const eventType = pick(def.events);

  switch (eventType) {
    case 'gift_book':
      return eventGiftBook(visitor);
    case 'annotation':
      return eventAnnotation(visitor);
    case 'treasure_map':
      return eventTreasureMap(visitor);
    case 'poem':
      return eventPoem(visitor);
    case 'sales_pitch':
      return eventSalesPitch(visitor);
    default:
      return null;
  }
}

// --- 沈明远事件 ---

function eventGiftBook(visitor) {
  const mystery = pick(MYSTERY_BOOKS);
  // 生成唯一 book id
  const bookId = 'mystery_' + Date.now().toString(36);
  state.books[bookId] = {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'unlocked',
    starred: false,
    damaged: false,
    repairWords: 0
  };
  // 暂存书籍元数据（不加入 BOOKS，只存 meta）
  if (!state._mysteryBooks) state._mysteryBooks = {};
  state._mysteryBooks[bookId] = mystery;
  addHistory('event', '📦 沈明远赠送了一本神秘书籍', `书名显示为"???"，抄完才知道内容`);
  saveState();
  return { type: 'gift_book', bookId, mysteryTitle: mystery.title, emoji: mystery.emoji };
}

function eventAnnotation(visitor) {
  addAtmosphere(5);
  addHistory('event', '📝 沈明远在书中留下了批注卡片', '字迹工整，引经据典 +5氛围');
  saveState();
  return { type: 'annotation', atmosphere: 5 };
}

// --- 小萤事件 ---

function eventTreasureMap(visitor) {
  const roll = Math.random();
  let reward;
  if (roll < 0.5) {
    const coins = rand(20, 50);
    addCoins(coins);
    reward = { type: 'coins', amount: coins, text: `${coins}代币` };
    addHistory('event', '🗺️ 小萤发现了一张藏宝图！', `翻开获得${coins}代币`);
  } else {
    const atmo = rand(3, 8);
    addAtmosphere(atmo);
    reward = { type: 'atmosphere', amount: atmo, text: `${atmo}氛围值` };
    addHistory('event', '🗺️ 小萤发现了一张藏宝图！', `翻开获得${atmo}氛围值`);
  }
  saveState();
  return { type: 'treasure_map', reward };
}

// --- 云游事件 ---

function eventPoem(visitor) {
  const poem = pick(POEMS);
  const atmo = rand(5, 10);
  addAtmosphere(atmo);
  addHistory('event', '🎵 云游在还书时夹了一首诗', `"${poem}" +${atmo}氛围`);
  saveState();
  return { type: 'poem', poem, atmosphere: atmo };
}

// --- 阿九事件 ---

function eventSalesPitch(visitor) {
  const book = pick(SALE_BOOKS);
  const price = rand(500, 5000);
  // 不自动扣款，把选择权交给 UI
  addHistory('event', '📦 阿九推销一本书', `《${book.title}》售价${price.toLocaleString()}代币`);
  saveState();
  return { type: 'sales_pitch', book: { ...book, price } };
}

// ========== 阿九购买确认（由 UI 调用） ==========

export function buySalesBook(bookMeta) {
  if (state.coins < bookMeta.price) return false;
  addCoins(-bookMeta.price);

  const bookId = 'sale_' + Date.now().toString(36);
  state.books[bookId] = {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'unlocked',
    starred: false,
    damaged: false,
    repairWords: 0
  };
  if (!state._mysteryBooks) state._mysteryBooks = {};
  state._mysteryBooks[bookId] = bookMeta;

  addHistory('event', `🛒 购买了阿九推销的《${bookMeta.title}》`, `${(bookMeta.words || 0).toLocaleString()}字`);
  saveState();
  return bookId;
}

// ========== Dev 面板对接 ==========

export function onTimeSkip(hours, now) {
  // 每跳过 0.5 小时，尝试刷新一位访客
  const spawns = Math.floor(hours / 0.5);
  for (let i = 0; i < spawns; i++) {
    spawnVisitor();
  }

  // 对已在馆的访客推进借书
  tickVisitorBrowsing(now);

  // 检查到期
  return checkDueVisitors(now);
}

export function visitorForceReturn(visitorId) {
  const visitor = state.visitors.find(v => v.id === visitorId);
  if (visitor && visitor.status === 'borrowed') {
    visitor.status = 'due';
    visitor.dueTime = getNow();
    saveState();
    return true;
  }
  return false;
}

export function visitorReset() {
  state.visitors = [];
  state.borrowRecords = [];
  saveState();
}
