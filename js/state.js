// 单一数据源 —— 整个应用只有一个 state 对象

export const state = {
  // 用户统计
  focus: {
    totalMinutes: 0,
    totalWords: 0,
    todayMinutes: 0,
    todayDate: new Date().toDateString(),
    streak: 0,
    lastFocusDate: null
  },

  // 当前计时会话
  currentSession: {
    active: false,
    mode: 'pomodoro',
    bookId: null,
    targetMinutes: 25,
    elapsedSeconds: 0,
    paused: false,
    intervalId: null,
    quoteIndex: 0
  },

  // 书籍状态（新增书籍时同步更新 DEFAULT_BOOKS）
  books: {
    'book_026': {
      unlockedChapters: [1],
      copyCount: 0,
      masteryLevel: 0,
      copiedWords: 0,
      status: 'unlocked',
      starred: false,
      damaged: false,
      repairWords: 0,
      readChapters: [],
    reCopyUnlocked: false
    },
    'book_001': {
      unlockedChapters: [1],
      copyCount: 0,
      masteryLevel: 0,
      copiedWords: 0,
      status: 'unlocked',
      starred: false,
      damaged: false,
      repairWords: 0,
      readChapters: [],
    reCopyUnlocked: false
    },
    'book_002': {
      unlockedChapters: [1],
      copyCount: 0,
      masteryLevel: 0,
      copiedWords: 0,
      status: 'unlocked',
      starred: false,
      damaged: false,
      repairWords: 0,
      readChapters: [],
    reCopyUnlocked: false
    }
  },

  // 图书馆
  library: {
    name: '归墟图书馆',
    atmosphere: 0,
    shelves: [[null, null, null, null, null]],
    borrowLevel: 0,  // 借阅区等级 0-7，0=未建造
    focusLevel: 0,   // 缮写室等级 0-6，0=未建造
    planePortals: {}, // 位面传送门状态 { magic: { unlocked: false, progress: 0 } }
    nameLocked: false, // 是否已使用铭牌命名（false=还可改名）
    manuscriptSlots: 3  // 手稿箱已解锁格子数（初始3格免费）
  },

  // 手稿箱：存放未誊抄完的稿子，誊抄完成后上架书架
  manuscriptBox: [],

  // 经济
  coins: 1250,
  inspiration: 0,

  // 访客（每个访客: { id, charId, name, emoji, status:'browsing'|'borrowed'|'due', bookId, bookTitle, arriveTime, borrowTime, dueTime, eventTriggered }）
  visitors: [],
  // 借阅记录（每条: { id, charId, charName, bookId, bookTitle, borrowTime, returnTime, event, status:'active'|'returned'|'damaged' }）
  borrowRecords: [],

  // 访客好感度（全局累计）
  visitorFavors: {}, // 动态按 VISITOR_DEFS 初始化

  // 访客叙事进度（三层递进事件追踪）
  visitorNarratives: {}, // 动态按 VISITOR_DEFS 初始化

  // 事件历史
  history: [],

  // 成就
  achievements: [],

  // 植物盆栽
  plant: {
    activeType: null,     // 当前种植的植物类型（null=空盆）
    level: 0,             // 0=空盆，1~5=生长阶段
    growthProgress: 0,    // 当前等级内的成长进度 0~100
    waterAvailable: 0,    // 可用的浇水次数（专注获得）
    lastCareTime: 0,      // 上次照料时间戳
    plantedAt: 0,         // 开始种植的时间戳
    harvested: false      // 是否已在Lv5收获过
  },

  // 种子收集
  seeds: {
    bird_of_paradise: 4,  // demo预置，方便展示种子兑换
    magic_rose: 0
  },

  // 标志牌
  signboards: [],

  // 新手引导
  introCompleted: false,

  // 墨墨日志首遇标记
  diaryFirsts: {
    visitorArrive: false,
    visitorBorrow: false,
    visitorReturn: false
  },

  // 新手引导情境触发标记
  tutorialFlags: {
    maxAtmoStageSeen: 1,       // 已见过的最高氛围阶段 1-5
    firstFocusComplete: false,  // 首次专注完成
    firstVisitorArrive: false,      // 首次访客到来
    firstVisitorEventDone: false,   // 首次访客破败事件已完成
    firstBorrowUpgradeDone: false,  // 首次借阅区升级引导完成
    firstShopOpen: false,           // 首次打开位面商店
    firstLibraryOpen: false,        // 首次打开馆长办公室
    firstBookComplete: false        // 首次完成一本书
  },

  // 休息行动卡
  actionCardDaily: { date: '', count: 0, usedActions: {} },

  // 行动卡 buff
  pendingTeaBoost: false,
  pendingCandleInspiration: false,

  // 今日馆务
  dailyTasks: {
    date: '',         // YYYY-MM-DD，与今日不同则重置
    focusDone: false, // 专注 ≥25 分钟
    returnDone: false,// 收取一本还书
    waterDone: false, // 给植物浇水
    allClaimed: false // 全勤奖励是否已领取
  },

  // 位面任务进度
  quests: {
    pastoral: {
      unlocked: false,         // 传送门是否已购买
      stage: 0,                // 当前位面阶段 0-5
      stagesCompleted: [],     // 已完成的位面阶段
      portalPurchasedAt: null, // 传送门购买时间戳
      characters: {
        pastoral_child:     { met: false, stage: 1, activeTasks: [], completedTasks: [], pendingComplete: [], favor: 0 },
        pastoral_herbalist: { met: false, stage: 1, activeTasks: [], completedTasks: [], pendingComplete: [], favor: 0 },
        pastoral_lord:      { met: false, stage: 1, activeTasks: [], completedTasks: [], pendingComplete: [], favor: 0 },
        pastoral_scholar:   { met: false, stage: 1, activeTasks: [], completedTasks: [], pendingComplete: [], favor: 0 },
        pastoral_nun:       { met: false, stage: 1, activeTasks: [], completedTasks: [], pendingComplete: [], favor: 0 }
      },
      mementos: [],
      letters: [],
      storyLog: []
    }
  },

  // 熟客池：位面完成后注册的访客（visitors.js 和 quests.js 通过此字段桥接）
  familiarVisitors: {},

  // 新手引导任务链（10步线性任务）
  guideQuests: {
    completed: [],
    allCompleted: false
  }
};

// 默认书籍状态（新增/变更书籍时同步更新此处）
const DEFAULT_BOOKS = {
  'book_026': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'unlocked',
    starred: false,
    damaged: false,
    repairWords: 0,
    readChapters: [],
    reCopyUnlocked: false
  },
  'book_001': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'unlocked',
    starred: false,
    damaged: false,
    repairWords: 0,
    readChapters: [],
    reCopyUnlocked: false
  },
  'book_002': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'unlocked',
    starred: false,
    damaged: false,
    repairWords: 0,
    readChapters: [],
    reCopyUnlocked: false
  },
  'book_023': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'locked',
    starred: false,
    damaged: false,
    repairWords: 0,
    readChapters: [],
    reCopyUnlocked: false
  },
  'book_024': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'locked',
    starred: false,
    damaged: false,
    repairWords: 0,
    readChapters: [],
    reCopyUnlocked: false
  }
};

// 初始化/重置状态
export function initState() {
  const saved = localStorage.getItem('library_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(state, parsed);
      // 合并书籍状态：保留用户进度，但用默认值补充新增/变更的书籍
      Object.keys(DEFAULT_BOOKS).forEach(id => {
        if (!state.books[id]) {
          state.books[id] = { ...DEFAULT_BOOKS[id] };
        } else {
          // 留存用户进度字段
          const savedBook = state.books[id];
          state.books[id] = { ...DEFAULT_BOOKS[id], ...savedBook };
          // 如果代码已将状态从 locked 升级，应用升级
          if (DEFAULT_BOOKS[id].status !== 'locked' && savedBook.status === 'locked') {
            state.books[id].status = DEFAULT_BOOKS[id].status;
          }
          // 旧存档迁移：damaged/repairWords 字段
          if (state.books[id].damaged === undefined) {
            state.books[id].damaged = false;
          }
          if (state.books[id].repairWords === undefined) {
            state.books[id].repairWords = 0;
          }
          if (state.books[id].starred === undefined) {
            state.books[id].starred = false;
          }
          if (state.books[id].readChapters === undefined) {
            state.books[id].readChapters = [];
          }
          if (state.books[id].reCopyUnlocked === undefined) {
            state.books[id].reCopyUnlocked = false;
          }
        }
      });
      // 旧存档迁移：visitorFavors
      if (!state.visitorFavors) {
        // 旧版访客好感度迁移（4 人 → 10 人）
      if (!state.visitorFavors || Object.keys(state.visitorFavors).length <= 4) {
        state.visitorFavors = {
          shenmingyuan: state.visitorFavors?.shenmingyuan || 0,
          chengyuan: 0, peizhou: state.visitorFavors?.ajiu || 0,
          jianan: 0, jiangyoushu: 0,
          guyu: 0,
          qiaoyiyi: state.visitorFavors?.xiaoying || 0,
          xierugui: 0,
          xiachan: 0,
          wangxiaolei: state.visitorFavors?.yunyou || 0
        };
      }
      }
      // 旧存档迁移：visitorNarratives（10 人叙事进度追踪）
      if (!state.visitorNarratives || Object.keys(state.visitorNarratives).length === 0) {
        state.visitorNarratives = {};
        const ALL_IDS = ['shenmingyuan','chengyuan','peizhou','jianan','jiangyoushu','guyu','qiaoyiyi','xierugui','xiachan','wangxiaolei'];
        ALL_IDS.forEach(id => {
          state.visitorNarratives[id] = {
            commonTriggered: [],
            occasionalCompleted: [],
            rareTriggered: false,
            postRareTriggered: false,
            postRareCommonTriggered: [],
            postRareOccasionalCompleted: [],
            expansionLevel: 0
          };
        });
      }
      // 确保 currentSession 不会从上次恢复
      state.currentSession = {
        active: false,
        mode: 'pomodoro',
        bookId: null,
        targetMinutes: 25,
        elapsedSeconds: 0,
        paused: false,
        intervalId: null,
        quoteIndex: 0
      };
      // 检查日期
      const today = new Date().toDateString();
      if (state.focus.todayDate !== today) {
        state.focus.todayMinutes = 0;
        state.focus.todayDate = today;
      }
      // 旧存档迁移：借阅区等级
      if (state.library.borrowLevel === undefined) {
        state.library.borrowLevel = 0;
      }
      // 旧存档迁移：缮写室等级
      if (state.library.focusLevel === undefined) {
        state.library.focusLevel = 0;
      }
      // 旧存档迁移：introCompleted
      if (state.introCompleted === undefined) {
        state.introCompleted = false;
      }
      // 旧存档迁移：位面传送门 + 命名状态 + 旧默认名
      if (!state.library.planePortals) {
        state.library.planePortals = {};
      }
      if (state.library.nameLocked === undefined) {
        state.library.nameLocked = false;
      }
      if (state.library.name === '星辉图书馆') {
        state.library.name = '归墟图书馆';
      }
      // 新版迁移：植物/种子/标志牌
      if (!state.plant) {
        state.plant = {
          activeType: null,
          level: 0,
          growthProgress: 0,
          waterAvailable: 0,
          lastCareTime: 0,
          plantedAt: 0,
          harvested: false
        };
      }
      if (!state.seeds) {
        state.seeds = { bird_of_paradise: 0, magic_rose: 0 };
      }
      if (!state.signboards) {
        state.signboards = [];
      }
      if (!state.diaryLastSummaryDate) {
        state.diaryLastSummaryDate = '';
      }
      if (!state.diaryFirsts) {
        state.diaryFirsts = { visitorArrive: false, visitorBorrow: false, visitorReturn: false };
      }
      if (!state.tutorialFlags) {
        state.tutorialFlags = {
          maxAtmoStageSeen: 1,
          firstFocusComplete: false,
          firstVisitorArrive: false,
          firstShopOpen: false,
          firstLibraryOpen: false,
          firstBookComplete: false
        };
      }
      if (state.tutorialFlags.maxAtmoStageSeen === undefined) {
        state.tutorialFlags.maxAtmoStageSeen = 1;
      }
      if (state.tutorialFlags.firstLibraryOpen === undefined) {
        state.tutorialFlags.firstLibraryOpen = false;
      }
      if (state.tutorialFlags.firstBookComplete === undefined) {
        state.tutorialFlags.firstBookComplete = false;
      }
      if (state.tutorialFlags.firstVisitorEventDone === undefined) {
        state.tutorialFlags.firstVisitorEventDone = false;
      }
      if (state.tutorialFlags.firstBorrowUpgradeDone === undefined) {
        state.tutorialFlags.firstBorrowUpgradeDone = false;
      }
      if (state.inspiration === undefined) {
        state.inspiration = 0;
      }
      if (!state.actionCardDaily) {
        state.actionCardDaily = { date: '', count: 0, usedActions: {} };
      }
      if (state.pendingTeaBoost === undefined) {
        state.pendingTeaBoost = false;
      }
      if (state.pendingCandleInspiration === undefined) {
        state.pendingCandleInspiration = false;
      }
      if (!state.dailyTasks) {
        state.dailyTasks = { date: '', focusDone: false, returnDone: false, waterDone: false, allClaimed: false };
      }
      if (!state.quests) {
        state.quests = { pastoral: { unlocked: false, stage: 0, stagesCompleted: [], portalPurchasedAt: null, characters: {
          pastoral_child: { met: false, stage: 1, activeTasks: [], completedTasks: [], pendingComplete: [], favor: 0 },
          pastoral_herbalist: { met: false, stage: 1, activeTasks: [], completedTasks: [], pendingComplete: [], favor: 0 },
          pastoral_lord: { met: false, stage: 1, activeTasks: [], completedTasks: [], pendingComplete: [], favor: 0 },
          pastoral_scholar: { met: false, stage: 1, activeTasks: [], completedTasks: [], pendingComplete: [], favor: 0 },
          pastoral_nun: { met: false, stage: 1, activeTasks: [], completedTasks: [], pendingComplete: [], favor: 0 }
        }, mementos: [], letters: [], storyLog: [] } };
      } else {
        // 旧存档迁移：补全新字段
        const p = state.quests.pastoral;
        if (p.unlocked === undefined) p.unlocked = false;
        if (p.stagesCompleted === undefined) p.stagesCompleted = [];
        if (p.portalPurchasedAt === undefined) p.portalPurchasedAt = null;
        if (p.letters === undefined) p.letters = [];
        if (!p.characters) p.characters = {};
        const defaultChar = (stage) => ({ met: false, stage, activeTasks: [], completedTasks: [], pendingComplete: [], favor: 0 });
        ['pastoral_child','pastoral_herbalist','pastoral_lord','pastoral_scholar','pastoral_nun'].forEach(cid => {
          if (!p.characters[cid]) p.characters[cid] = defaultChar(1);
          const c = p.characters[cid];
          if (c.activeTasks === undefined) c.activeTasks = [];
          if (c.completedTasks === undefined) c.completedTasks = [];
          if (c.pendingComplete === undefined) c.pendingComplete = [];
        });
        // 清理旧字段
        if (p.plagueProgress !== undefined) delete p.plagueProgress;
      }
      if (!state.familiarVisitors) {
        state.familiarVisitors = {};
      }
      if (!state.guideQuests) {
        state.guideQuests = { completed: [], allCompleted: false };
      }
      // 旧存档迁移：手稿箱
      if (!state.manuscriptBox) {
        state.manuscriptBox = [];
      }
      if (state.library.manuscriptSlots === undefined) {
        state.library.manuscriptSlots = 3;
      }
      // 旧存档迁移：shelves 从 [1, 2] 数字格式 → [[null×5], ...] 位置格式
      if (state.library.shelves.length > 0 && typeof state.library.shelves[0] === 'number') {
        const oldCount = state.library.shelves.length;
        const newShelves = Array.from({ length: oldCount }, () => Array(5).fill(null));
        // 回填已完成的书籍
        const mBox = state.manuscriptBox || [];
        const completedIds = Object.entries(state.books || {})
          .filter(([id, b]) => b && b.status === 'completed' && !mBox.includes(id))
          .map(([id]) => id);
        let bookIdx = 0;
        for (let s = 0; s < newShelves.length && bookIdx < completedIds.length; s++) {
          for (let p = 0; p < 5 && bookIdx < completedIds.length; p++) {
            newShelves[s][p] = completedIds[bookIdx++];
          }
        }
        state.library.shelves = newShelves;
      }
      saveState(); // 迁移后立即持久化
      return true;
    } catch (e) {
      console.warn('存档损坏，使用默认状态');
    }
  }
  return false;
}

export function saveState() {
  // 不保存正在进行的会话
  const toSave = { ...state };
  toSave.currentSession = {
    active: false,
    mode: 'pomodoro',
    bookId: null,
    targetMinutes: 25,
    elapsedSeconds: 0,
    paused: false,
    intervalId: null,
    quoteIndex: 0
  };
  localStorage.setItem('library_state', JSON.stringify(toSave));
}
