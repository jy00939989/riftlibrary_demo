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
    lastFocusDate: null,
    sessions: []
  },

  // 当前计时会话
  currentSession: {
    active: false,
    mode: 'pomodoro',
    bookId: null,
    targetMinutes: 25,
    elapsedSeconds: 0,
    fractionalSeconds: 0,
    paused: false,
    intervalId: null,
    quoteIndex: 0,
    lastQuoteMinute: 0,
    startTime: 0,
    lastTickTime: 0,
    speedMultiplier: 1
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
    stage: 1, // D24：阶段落库（升阶需手动举行仪式）；老档由 migrateV5 按已达氛围定阶
    shelves: [[null, null, null, null, null]],
    borrowLevel: 0,
    focusLevel: 0,
    planePortals: {},
    nameLocked: false,
    manuscriptSlots: 5
  },

  // 手稿箱
  manuscriptBox: [],

  // 留声阁（乐室）：unlocked = 设施已解锁；tracks = 已购唱片 id 列表
  musicRoom: { unlocked: false, tracks: [] },

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

  // 温室成长日志（种植/改良/收获/多年生/消失分类记录，温室页筛选查看）
  plantLogs: [],

  // 成就
  achievements: [],

  // 植物盆栽（温室花盆扩容：单株 → 数组，最多 4 盆，盆位 0 为原单株）
  plants: [{
    activeType: null,
    level: 0,
    growthProgress: 0,
    lastCareTime: 0,
    plantedAt: 0,
    harvested: false
  }],

  // 浇水次数全局池（2026-09-15 图南决策）：不挂单盆——有无植物都累积，可分配给任意一盆
  water: 0,

  // 植物消失通报（凋谢/台风）：温室页顶部红色通报卡，玩家点「知道了」清零
  plantLossAlert: null,

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

  // 日界单一真源（A1）：最后活跃日本地日历 key，day-boundary 据此判跨日
  lastSeenDay: new Date().toDateString(),

  // 咖啡角（cafe-corner-plan v3.1；lastFeeDay/lastServeDay 为本地日历 key 防重）
  cafe: {
    unlocked: false,
    level: 0,
    stock: {},
    totalServed: 0,
    lastServeDay: null,
    lastFeeDay: null,
    dormant: false
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
  quipCooldown: { recent: [], groupVisits: {} },

  // 展览厅（exhibition-hall-plan v2）：大厅分级设施（等级=房间容量，Lv5=5 槽）+ 五房间三态
  // rooms 仅两档：'ruined' | 'open'（本版不设施工时长）；档案室在大厅建成时即开放
  exhibition: {
    built: false,
    level: 0,
    rooms: { archive: 'ruined', signboards: 'ruined', achievements: 'ruined', collection: 'ruined', musicroom: 'ruined' },
    grandOpeningShown: false,
    lastEventId: null,
    lastEventDay: null
  }
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
