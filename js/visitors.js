// 访客系统 —— 纯逻辑模块，不碰 DOM
import { state, saveState } from './state.js';
import { addCoins, addAtmosphere, addHistory } from './storage.js';
import { BOOKS } from '../data/books.js';
import { addDiaryEntry } from './diary.js';
import { isBookCapacityFull } from './shop.js';

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

// ========== 还书语录池 ==========

const RETURN_QUOTES = {
  shenmingyuan: {
    book: [
      '《{book}》……好书。我教了四十年文学，这本书每年重读都有新的感悟。',
      '这本《{book}》的批注我写了三页纸。有些句子值得反复咀嚼。',
      '《{book}》让我想起在牛津访学的日子。那图书馆的穹顶很高，但灵魂是一样的。',
      '你知道《{book}》最妙的地方在哪吗？在于它从不直接告诉你答案。',
      '我已经很久没有像读《{book}》这样，在深夜对着书页发呆了。',
      '《{book}》里的这段话，我在博士论文里引用过。到现在依然觉得它是真理。'
    ],
    library: [
      '这图书馆越来越有样子了——虽然离它全盛时期还差得远，但灵魂已经回来了。',
      '废墟不可怕，可怕的是无人问津。有人翻书的地方，就是圣殿。',
      '我见过许多图书馆，但这一座……它有自己的心跳。',
      '书架上的灰尘少了很多，空气也清新了。你在用心经营这里。'
    ],
    personal: [
      '退休那天，学生们送了我一本手抄的诗集。说实话，那是我这辈子收到的最珍贵的礼物。',
      '我妻子不喜欢我熬夜看书。但八十岁的人了，不熬夜还能熬什么呢？',
      '你知道吗，我年轻时为了找一本绝版的《纯粹理性批判》，跑遍了整个伦敦的旧书店。',
      '哲学不是用来学的，是用来活的。我花了六十年才明白这个道理。',
      '我最遗憾的事？没能在我父亲活着的时候给他读一本书。'
    ]
  },
  xiaoying: {
    book: [
      '《{book}》太棒了！我最喜欢冒险故事了——虽然有些字我还不认识。',
      '这本书里有好多我想去的地方！等我长大了，我要把书里的地方都走一遍。',
      '《{book}》里的主人公好勇敢啊。我以后也要像他/她一样！',
      '我把《{book}》读给外婆听了。她说我读得比以前好很多。',
      '这本书我看懂了一半……但我会再读一遍的！',
      '《{book}》的故事让我昨晚兴奋得睡不着！'
    ],
    library: [
      '这里比以前亮多了！以前进来的时候我还挺害怕的，现在不会了。',
      '我喜欢墙上的那些画——是馆长你画的吗？',
      '我有一个自己的秘密阅览角落了，不告诉你具体在哪！',
      '下次可以带同学来吗？我可以给他们当小导游！'
    ],
    personal: [
      '我的大帆布包里什么都有：零食、手电筒、还有防身的弹弓。但最重要的位置留给书。',
      '妈妈说图书馆闹鬼——但我跟她说，鬼也是要看书的！',
      '上次我掉了一颗牙，就藏在图书馆的某个书架后面。如果哪天你找到了，可以许个愿。',
      '我在学校不太爱说话，但在这里我可以和书说话。书不会打断我。',
      '我的探险日记已经写到第三本了——前两本都是关于这座图书馆的。'
    ]
  },
  yunyou: {
    book: [
      '《{book}》——啊，这本书的节奏像一首古老的歌谣，翻页就是呼吸。',
      '我在月光下读完了《{book}》。露水打湿了书页，但我不舍得合上。',
      '这本《{book}》里有一句话，我把它抄下来，夹在了随身的乐谱里。',
      '《{book}》让我的手指在琴弦上找到了新的旋律。每一本好书都是一段未写的曲。',
      '你知道吗，《{book}》的作者曾经也是个流浪者。所以他的文字里有风的声音。'
    ],
    library: [
      '这座图书馆的声学很好——我在角落里弹琴的时候，回声像有人在轻轻和声。',
      '现在这里终于有了一点「家」的气息。但还差一盆花和一只猫。',
      '风从破窗吹进来的时候，书架上的书页沙沙作响——那是图书馆在唱自己的歌。',
      '我在很多地方唱过歌：酒馆、广场、废墟。但在这个图书馆里唱歌，感觉最对。'
    ],
    personal: [
      '我的家乡没有图书馆。我们靠吟游诗人传递故事，一首诗就是一个世界。',
      '我在北方的森林里遇见了一位老诗人——他已经一百岁了，还能背出三千首歌。',
      '这把琴跟了我二十年。它的木头来自一棵被闪电击中的老树，声音里有风暴的记忆。',
      '上一次我在一个繁华的城市唱歌，人们往我的帽子里扔铜板。但我觉得他们没听懂。',
      '我见过最美的日落是在一座废弃的灯塔上。风很大，但天空像着了火。'
    ]
  },
  ajiu: {
    book: [
      '《{book}》——这本书品相不错，不过如果你想要更好的版本，我下次可以帮你留意。',
      '说实话，《{book}》在市面上卖得不太好，但我是真的喜欢。好东西不见得人人都识货。',
      '这本《{book}》让我想起了我在另一个位面见过的类似版本。不过那个版本缺了最后三页。',
      '你知道吗，《{book}》的初版现在很难找。这本虽然是抄本，但誊写得很用心。',
      '读《{book}》的时候我在想：如果我在自己的书摊上看到这本书，我该标什么价。'
    ],
    library: [
      '你这图书馆开始像个样子了。不过我建议在入口处摆一个显眼的书架——吸引路人的注意。',
      '以商人的眼光来看，这里的书籍品类还需要扩充。但馆长品味不错，这是最重要的。',
      '我走南闯北见过不少图书馆，但愿意收留一个流浪书贩的，你是第一个。',
      '这些书架的木料不错——是什么木头？我可以帮你联系更便宜的供应商。'
    ],
    personal: [
      '我的书摊在七个位面都有分号——不，不是连锁店，就是我把书背过去卖的。',
      '有一次我为了收一批书，跟一个老巫师赌了三局牌。赢了两局，输了一局，但书全到手了。',
      '我卖书有个原则：不把好书卖给不懂它的人。利润不重要，书得去对的地方。',
      '你以为我是书贩？不，我只是在帮书找到属于它们的人。',
      '最值钱的书不是最贵的，是你读完会在扉页上写满批注的那本。'
    ]
  }
};

function pickReturnQuote(charId, bookTitle, atmosphere) {
  const pool = RETURN_QUOTES[charId];
  if (!pool) return '谢谢。';

  // 选择语录类型：40% 聊书 / 30% 聊图书馆 / 30% 聊自己
  const roll = Math.random();
  let type = 'book';
  if (roll > 0.7) type = 'personal';
  else if (roll > 0.4) type = 'library';

  const quotes = pool[type] || pool.book;
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  return quote.replace('{book}', bookTitle || '这本书');
}

const POEMS = [
  '风从远方来，翻开书中某一页，像你的手拂过我的眉间。',
  '书架之间的光柱中，尘埃舞蹈。每一粒都是被遗忘的故事。',
  '墨水在黄纸上晕开，如同夜雾笼罩湖面。这本书记录了谁的梦？',
  '月光斜照进窗棂，照亮旧书上褪色的烫金。古老的字迹低声诉说。',
  '时间是一条河，书籍是漂在河上的纸船，不知会停在谁的手中。',
  '翻书的声音是世上最美妙的音乐，每一页都在等待知音。'
];

// ========== 神秘书籍池（沈明远专属） ==========

// 沈明远专属书池 —— 全是真实可抄的书
const SHENMINGYUAN_BOOKS = ['book_010', 'book_021', 'book_022'];

// ========== 借阅区等级配置表 ==========

const BORROW_LEVEL_TABLE = [
  null, // 索引0占位(Lv0)
  { cap:2, returnCoins:30, favorBonus:0,  returnAtmo:1 },  // Lv1 陋室
  { cap:3, returnCoins:35, favorBonus:10, returnAtmo:1 },  // Lv2 整洁
  { cap:6, returnCoins:40, favorBonus:20, returnAtmo:3 },  // Lv3 开放
  { cap:7, returnCoins:45, favorBonus:30, returnAtmo:3 },  // Lv4 舒适
  { cap:8, returnCoins:50, favorBonus:40, returnAtmo:5 },  // Lv5 精致
  { cap:9, returnCoins:55, favorBonus:50, returnAtmo:5 },  // Lv6 优雅
  { cap:10,returnCoins:60, favorBonus:60, returnAtmo:8 }   // Lv7 圣所
];

export function getBorrowLevelConfig() {
  const lv = state.library.borrowLevel || 0;
  return BORROW_LEVEL_TABLE[lv] || { cap:0, returnCoins:30, favorBonus:0, returnAtmo:0 };
}

export function getVisitorCap() {
  return getBorrowLevelConfig().cap;
}

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
  if (browsing.length >= getVisitorCap()) return null;

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
  if (!state.diaryFirsts.visitorArrive) {
    state.diaryFirsts.visitorArrive = true;
    addDiaryEntry('visitor_arrive', { emoji: def.emoji, name: def.name, title: def.title });
  }
  return visitor;
}

// ========== 借书逻辑 ==========

export function tickVisitorBrowsing(now) {
  const blvCfg = getBorrowLevelConfig();
  if (blvCfg.cap === 0) return;

  const completedBooks = getCompletedBooks();
  if (completedBooks.length === 0) return;

  state.visitors.forEach(visitor => {
    if (visitor.status !== 'browsing') return;

    // 浏览中缓慢增加好感度（含等级加成）
    const browseFavor = Math.round(1 * (1 + blvCfg.favorBonus / 100));
    visitor.favorability = (visitor.favorability || 0) + browseFavor;
    addVisitorFavor(visitor.charId, browseFavor);

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
  // 还书时间：3小时 ~ 120小时（5天），每2500字=1小时，大部头拉出层次
  const borrowHours = Math.max(3, Math.min(120, Math.round(bookWords / 2500)));
  const dueTime = now + borrowHours * 3600000;

  visitor.status = 'borrowed';
  visitor.bookId = book.id;
  visitor.bookTitle = book.title;
  visitor.borrowTime = now;
  visitor.dueTime = dueTime;
  const borrowFavor = Math.round(3 * (1 + getBorrowLevelConfig().favorBonus / 100));
  visitor.favorability = (visitor.favorability || 0) + borrowFavor;
  addVisitorFavor(visitor.charId, borrowFavor);

  addHistory('visitor', `${visitor.emoji} ${visitor.name} 借走了《${book.title}》`,
    `${borrowHours}小时后归还 · 好感+3`);
  if (!state.diaryFirsts.visitorBorrow) {
    state.diaryFirsts.visitorBorrow = true;
    addDiaryEntry('visitor_borrow', { emoji: visitor.emoji, name: visitor.name, bookTitle: book.title });
  }
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

  // 基础收益（按借阅区等级）
  const retCfg = getBorrowLevelConfig();
  addCoins(retCfg.returnCoins);
  if (retCfg.returnAtmo > 0) addAtmosphere(retCfg.returnAtmo);

  const returnFavor = Math.round(5 * (1 + retCfg.favorBonus / 100));
  visitor.favorability = (visitor.favorability || 0) + returnFavor;
  addVisitorFavor(charId, returnFavor);

  addHistory('visitor', `${visitor.emoji} ${visitor.name} 归还了《${bookTitle}》`,
    `${retCfg.returnCoins}智慧之光 +${retCfg.returnAtmo}氛围 · 好感+${returnFavor}`);
  if (!state.diaryFirsts.visitorReturn) {
    state.diaryFirsts.visitorReturn = true;
    addDiaryEntry('visitor_return', { emoji: visitor.emoji, name: visitor.name, bookTitle });
  }

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

  // 还书语录
  const quote = pickReturnQuote(charId, bookTitle, state.library.atmosphere);

  // 判定 1：损毁（~3%）
  let damaged = false;
  if (Math.random() < 0.03 && bookId && state.books[bookId]) {
    const bs = state.books[bookId];
    const book = BOOKS[bookId];
    bs.damaged = true;
    bs.repairWords = Math.round(bs.copiedWords * 0.25);
    if (bs.repairWords > 0) {
      bs.copiedWords = Math.max(0, bs.copiedWords - bs.repairWords);
      if (bs.status === 'completed' && book && bs.copiedWords < book.totalWords) {
        bs.status = 'copying';
      }
    }
    addHistory('damage', `⚠️ 《${bookTitle}》在归还时发现损毁`, `损失${bs.repairWords.toLocaleString()}字，需专注修复`);
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

  return {
    damaged, event: eventResult, bookId, bookTitle, charId,
    visitorName: visitor.name, visitorEmoji: visitor.emoji,
    coins: retCfg.returnCoins, atmosphere: retCfg.returnAtmo, favor: returnFavor,
    quote
  };
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
  // 从沈明远专属池中选一本玩家尚未拥有的书
  const available = SHENMINGYUAN_BOOKS.filter(id => !state.books[id] || state.books[id].status === 'locked');
  if (available.length === 0) {
    // 三本都送过了，改为批注事件
    addAtmosphere(5);
    addHistory('event', '📝 沈明远在书中留下了新的批注卡片', '三本专属书均已赠予 +5氛围');
    addDiaryEntry('special_event', { detail: '沈明远在书中留下了新的批注卡片，三本专属书都已赠予。' });
    saveState();
    return { type: 'annotation', atmosphere: 5 };
  }
  const bookId = pick(available);
  const book = BOOKS[bookId];

  // 将真实书籍加入玩家状态
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

  addHistory('event', `📦 沈明远赠送了一本《${book.title}》`, `${(book.totalWords || 0).toLocaleString()}字 · ${book.author} · ${book.category}`);
  addDiaryEntry('special_event', { detail: `沈明远赠送了一本《${book.title}》，说是自己珍藏多年的版本。` });
  saveState();
  return { type: 'gift_book', bookId, mysteryTitle: book.title, emoji: book.emoji };
}

function eventAnnotation(visitor) {
  addAtmosphere(3);
  addHistory('event', '📝 沈明远在书中留下了批注卡片', '字迹工整，引经据典 +3氛围');
  addDiaryEntry('special_event', { detail: '沈明远在借阅的书中留下了工整的批注，引经据典。' });
  saveState();
  return { type: 'annotation', atmosphere: 3 };
}

// --- 小萤事件 ---

function eventTreasureMap(visitor) {
  const roll = Math.random();
  let reward;
  if (roll < 0.5) {
    const coins = rand(20, 50);
    addCoins(coins);
    reward = { type: 'coins', amount: coins, text: `${coins}智慧之光` };
    addHistory('event', '🗺️ 小萤发现了一张藏宝图！', `翻开获得${coins}智慧之光`);
  } else {
    const atmo = rand(2, 5);
    addAtmosphere(atmo);
    reward = { type: 'atmosphere', amount: atmo, text: `${atmo}氛围值` };
    addHistory('event', '🗺️ 小萤发现了一张藏宝图！', `翻开获得${atmo}氛围值`);
  }
  addDiaryEntry('special_event', { detail: '小萤在图书馆里发现了一张藏宝图！不知道她找到了什么。' });
  saveState();
  return { type: 'treasure_map', reward };
}

// --- 云游事件 ---

function eventPoem(visitor) {
  const poem = pick(POEMS);
  const atmo = rand(2, 5);
  addAtmosphere(atmo);
  addHistory('event', '🎵 云游在还书时夹了一首诗', `"${poem}" +${atmo}氛围`);
  addDiaryEntry('special_event', { detail: `云游在还书时夹了一首诗："${poem}"` });
  saveState();
  return { type: 'poem', poem, atmosphere: atmo };
}

// --- 阿九事件 ---

function eventSalesPitch(visitor) {
  const book = pick(SALE_BOOKS);
  const price = rand(500, 5000);
  // 不自动扣款，把选择权交给 UI
  addHistory('event', '📦 阿九推销一本书', `《${book.title}》售价${price.toLocaleString()}智慧之光`);
  addDiaryEntry('special_event', { detail: `阿九带来了一本《${book.title}》，售价${price.toLocaleString()}智慧之光。要不要买呢？` });
  saveState();
  return { type: 'sales_pitch', book: { ...book, price } };
}

// ========== 阿九购买确认（由 UI 调用） ==========

export function buySalesBook(bookMeta) {
  if (state.coins < bookMeta.price) return false;
  if (isBookCapacityFull()) return false;
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
