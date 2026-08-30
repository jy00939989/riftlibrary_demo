// 状态 schema 定义 —— 纯数据，无迁移/序列化逻辑

export const state = {
  _schemaVersion: 0,

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
    borrowLevel: 0,
    focusLevel: 0,
    planePortals: {},
    nameLocked: false,
    manuscriptSlots: 5
  },

  // 手稿箱
  manuscriptBox: [],

  // 经济
  coins: 500,
  inspiration: 0,

  // 访客
  visitors: [],
  borrowRecords: [],

  // 访客好感度
  visitorFavors: {},

  // 访客叙事进度
  visitorNarratives: {},

  // 事件历史
  history: [],

  // 成就
  achievements: [],

  // 植物盆栽
  plant: {
    activeType: null,
    level: 0,
    growthProgress: 0,
    waterAvailable: 0,
    lastCareTime: 0,
    plantedAt: 0,
    harvested: false
  },

  // 种子收集
  seeds: {
    bird_of_paradise: 4,
    magic_rose: 0
  },

  // 标志牌
  signboards: [],

  // 标志牌限量编号 { [signboardId]: serialNumber }
  signboardSerials: {},

  // 消耗型道具背包
  inventory: {},

  // 新手引导
  introCompleted: false,

  // 墨墨日志首遇标记
  diaryFirsts: {
    visitorArrive: false,
    visitorBorrow: false,
    visitorReturn: false
  },

  // 访客纪念收集
  visitorMemory: { items: [] },

  // 新手引导情境触发标记
  tutorialFlags: {
    maxAtmoStageSeen: 1,
    firstFocusComplete: false,
    firstVisitorArrive: false,
    firstVisitorEventDone: false,
    firstBorrowUpgradeDone: false,
    firstShopOpen: false,
    firstLibraryOpen: false,
    firstBookComplete: false,
    firstRestorationUnlock: false
  },

  // 休息行动卡
  actionCardDaily: { date: '', count: 0, usedActions: {} },

  // DLC 补充包
  dlcPacks: {
    unlocked: [],
    redeemedCodes: []
  },

  // 行动卡 buff
  pendingTeaBoost: false,
  pendingCandleInspiration: false,

  // 今日馆务
  dailyTasks: {
    date: '',
    focusDone: false,
    returnDone: false,
    waterDone: false,
    allClaimed: false
  },

  // 位面任务进度
  quests: {
    pastoral: {
      unlocked: false,
      stage: 0,
      stagesCompleted: [],
      portalPurchasedAt: null,
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

  // 熟客池
  familiarVisitors: {},

  // 新手引导任务链
  guideQuests: {
    completed: [],
    allCompleted: false
  },

  // 馆长目标阶梯
  tierPopupsShown: [],

  // 墨墨成就点评今日已用
  momoCommentUsedToday: { date: '', comments: [] },

  // 日志装帧升级奖励是否已领取
  diaryLevelRewardsClaimed: [],

  // 音乐选择器
  musicManualTrack: null,

  // 裴舟荐书折扣
  peizhouRec: null,

  // 古籍修复室
  restorationBox: [],
  restorationBoxSlots: 3,
  restorationLevel: 0,
  restorationUnlocked: false,

  // 环境音
  ambientSounds: {
    unlocked: [],
    current: null,
  },

  // 卷组吐槽冷却
  quipCooldown: { recent: [], groupVisits: {} }
};

// 默认书籍状态（新增/变更书籍时同步更新此处）
export const DEFAULT_BOOKS = {
  'book_026': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'unlocked',
    starred: false,
    damaged: false,
    repairWords: 0,
    repairProgress: 0,
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
    repairProgress: 0,
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
    repairProgress: 0,
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
    repairProgress: 0,
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
    repairProgress: 0,
    readChapters: [],
    reCopyUnlocked: false
  },
  'book_030': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'locked',
    starred: false,
    damaged: false,
    repairWords: 0,
    repairProgress: 0,
    readChapters: [],
    reCopyUnlocked: false
  },
  'book_030_vol1': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'locked',
    starred: false,
    damaged: false,
    repairWords: 0,
    repairProgress: 0,
    readChapters: [],
    reCopyUnlocked: false
  },
  'book_030_vol2': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'locked',
    starred: false,
    damaged: false,
    repairWords: 0,
    repairProgress: 0,
    readChapters: [],
    reCopyUnlocked: false
  },
  'book_030_vol3': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'locked',
    starred: false,
    damaged: false,
    repairWords: 0,
    repairProgress: 0,
    readChapters: [],
    reCopyUnlocked: false
  },
  'book_031': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'locked',
    starred: false,
    damaged: false,
    repairWords: 0,
    repairProgress: 0,
    readChapters: [],
    reCopyUnlocked: false
  },
  'book_031_vol1': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'locked',
    starred: false,
    damaged: false,
    repairWords: 0,
    repairProgress: 0,
    readChapters: [],
    reCopyUnlocked: false
  },
  'book_031_vol2': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'locked',
    starred: false,
    damaged: false,
    repairWords: 0,
    repairProgress: 0,
    readChapters: [],
    reCopyUnlocked: false
  },
  'book_031_vol3': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'locked',
    starred: false,
    damaged: false,
    repairWords: 0,
    repairProgress: 0,
    readChapters: [],
    reCopyUnlocked: false
  },
  'book_031_vol4': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'locked',
    starred: false,
    damaged: false,
    repairWords: 0,
    repairProgress: 0,
    readChapters: [],
    reCopyUnlocked: false
  },
  'book_032': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'locked',
    starred: false,
    damaged: false,
    repairWords: 0,
    repairProgress: 0,
    readChapters: [],
    reCopyUnlocked: false
  },
  'book_032_vol1': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'locked',
    starred: false,
    damaged: false,
    repairWords: 0,
    repairProgress: 0,
    readChapters: [],
    reCopyUnlocked: false
  },
  'book_032_vol2': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'locked',
    starred: false,
    damaged: false,
    repairWords: 0,
    repairProgress: 0,
    readChapters: [],
    reCopyUnlocked: false
  },
  'book_032_vol3': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'locked',
    starred: false,
    damaged: false,
    repairWords: 0,
    repairProgress: 0,
    readChapters: [],
    reCopyUnlocked: false
  },
  'book_033': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'locked',
    starred: false,
    damaged: false,
    repairWords: 0,
    repairProgress: 0,
    readChapters: [],
    reCopyUnlocked: false
  },
  'book_034': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'locked',
    starred: false,
    damaged: false,
    repairWords: 0,
    repairProgress: 0,
    readChapters: [],
    reCopyUnlocked: false
  },
  'book_034_vol1': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'locked',
    starred: false,
    damaged: false,
    repairWords: 0,
    repairProgress: 0,
    readChapters: [],
    reCopyUnlocked: false
  },
  'book_034_vol2': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 0,
    copiedWords: 0,
    status: 'locked',
    starred: false,
    damaged: false,
    repairWords: 0,
    repairProgress: 0,
    readChapters: [],
    reCopyUnlocked: false
  }
};
