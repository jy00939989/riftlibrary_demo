// 单一数据源 —— 整个应用只有一个 state 对象

import { BOOKS } from '../data/books.js';
import { VOLUME_GROUPS } from '../data/volume_groups.js';
import { load, save, STORAGE_KEYS } from './persistence.js';

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
    manuscriptSlots: 5  // 手稿箱已解锁格子数（初始5格免费）
  },

  // 手稿箱：存放未誊抄完的稿子，誊抄完成后上架书架
  manuscriptBox: [],

  // 经济
  coins: 500,
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
    firstBookComplete: false,       // 首次完成一本书
    firstRestorationUnlock: false   // 首次解锁古籍修复室
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
  },

  // 馆长目标阶梯 — 已弹出过的阶段完成弹窗
  tierPopupsShown: [],

  // 墨墨成就点评今日已用
  momoCommentUsedToday: { date: '', comments: [] },

  // 日志装帧升级奖励是否已领取
  diaryLevelRewardsClaimed: [],

  // 音乐选择器：手动选择的曲目 ID，null=随氛围自动
  musicManualTrack: null,

  // 裴舟荐书折扣 { bookId, discount, expiresAt }，null=无推荐
  peizhouRec: null,

  // 古籍修复室：修缮箱（保护单卷不被借出/损坏，仍可合成）
  restorationBox: [],
  restorationBoxSlots: 3,
  restorationLevel: 0,      // 修复室等级 0-5
  restorationUnlocked: false, // 需购买 Lv0 后才开放

  // 环境音（白噪音）— enabled/volume 已迁移到 settings
  ambientSounds: {
    unlocked: [],   // 已解锁的环境音 ID
    current: null,  // 当前播放 ID
  },

  // 卷组吐槽冷却（二阶段叙事用）
  quipCooldown: { recent: [], groupVisits: {} }
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
  }
};

// 初始化/重置状态
export function initState() {
  const saved = load(STORAGE_KEYS.STATE);
  if (saved) {
    try {
      Object.assign(state, saved);
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
          if (state.books[id].repairProgress === undefined) {
            state.books[id].repairProgress = 0;
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
      // 旧存档迁移：visitorFavors（旧版 4 人 → 新版 10 人）
      if (!state.visitorFavors) {
        state.visitorFavors = {
          shenmingyuan: 0, chengyuan: 0, peizhou: 0, jianan: 0, jiangyoushu: 0,
          guyu: 0, qiaoyiyi: 0, xierugui: 0, xiachan: 0, wangxiaolei: 0
        };
      } else {
        // 确保新版 10 人都存在
        const ALL_IDS = ['shenmingyuan','chengyuan','peizhou','jianan','jiangyoushu','guyu','qiaoyiyi','xierugui','xiachan','wangxiaolei'];
        ALL_IDS.forEach(id => {
          if (state.visitorFavors[id] === undefined) state.visitorFavors[id] = 0;
        });
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
            rareEligibleCount: 0,
            postRareTriggered: false,
            postRareCommonTriggered: [],
            postRareOccasionalCompleted: [],
            expansionLevel: 0
          };
        });
      } else {
        // 已有 visitorNarratives 但可能缺少 rareEligibleCount 字段
        Object.keys(state.visitorNarratives).forEach(id => {
          if (state.visitorNarratives[id].rareEligibleCount === undefined) {
            state.visitorNarratives[id].rareEligibleCount = 0;
          }
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
      if (state.tutorialFlags.firstRestorationUnlock === undefined) {
        state.tutorialFlags.firstRestorationUnlock = false;
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
      if (!state.momoCommentUsedToday) {
        state.momoCommentUsedToday = { date: '', comments: [] };
      }
      if (!state.diaryLevelRewardsClaimed) {
        state.diaryLevelRewardsClaimed = [];
      }
      // 旧存档迁移：手稿箱
      if (!state.manuscriptBox) {
        state.manuscriptBox = [];
      }
      if (state.library.manuscriptSlots === undefined) {
        state.library.manuscriptSlots = 5;
      }
      if (state.peizhouRec === undefined) {
        state.peizhouRec = null;
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
      // 旧存档迁移：长书分卷
      // 清理书架上残留的旧长书 ID，它们现在只是典藏版占位
      const collectedIds = new Set(Object.keys(VOLUME_GROUPS));
      (state.library.shelves || []).forEach(shelf => {
        if (!Array.isArray(shelf)) return;
        shelf.forEach((slot, idx) => {
          if (collectedIds.has(slot)) shelf[idx] = null;
        });
      });

      Object.keys(VOLUME_GROUPS).forEach(collectedId => {
        const group = VOLUME_GROUPS[collectedId];
        const oldBook = state.books[collectedId];
        if (!oldBook || oldBook.status === 'locked') return;

        if (oldBook.status === 'completed') {
          group.volumeIds.forEach(id => {
            const volDef = BOOKS[id];
            const chapterIds = (volDef && volDef.chapters || []).map(c => c.id);
            state.books[id] = {
              unlockedChapters: chapterIds.length ? chapterIds : [1],
              copyCount: 1,
              masteryLevel: 1,
              copiedWords: volDef ? volDef.totalWords : 0,
              status: 'completed',
              starred: false,
              damaged: false,
              repairWords: 0,
              repairProgress: 0,
              readChapters: [],
              reCopyUnlocked: false
            };
          });
        } else {
          let remainingWords = oldBook.copiedWords || 0;
          const oldUnlocked = new Set(oldBook.unlockedChapters || [1]);
          group.volumeIds.forEach(id => {
            const volDef = BOOKS[id];
            const volWords = volDef ? volDef.totalWords : 0;
            const copied = Math.min(remainingWords, volWords);
            const volChapterIds = (volDef && volDef.chapters || []).map(c => c.id);
            const intersection = volChapterIds.filter(cid => oldUnlocked.has(cid));
            const unlockedChapters = intersection.length > 0 ? intersection : [1];
            const completed = copied >= volWords;
            state.books[id] = {
              unlockedChapters,
              copyCount: completed ? 1 : 0,
              masteryLevel: completed ? 1 : 0,
              copiedWords: copied,
              status: completed ? 'completed' : (copied > 0 ? 'copying' : 'unlocked'),
              starred: false,
              damaged: false,
              repairWords: 0,
              repairProgress: 0,
              readChapters: [],
              reCopyUnlocked: false
            };
            remainingWords -= copied;
          });
        }

        // 旧长书记录重置为 locked，等待合成
        state.books[collectedId] = {
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
        };
      });

      // 旧存档迁移：修缮箱
      if (!state.restorationBox) {
        state.restorationBox = [];
      }
      if (state.restorationBoxSlots === undefined) {
        state.restorationBoxSlots = 3;
      }
      if (state.restorationLevel === undefined) {
        state.restorationLevel = 0;
      }
      // 旧存档迁移：修复室是否已开放（已有等级>0 或 修缮箱非空 视为已开放）
      if (state.restorationUnlocked === undefined) {
        state.restorationUnlocked = (state.restorationLevel > 0) || (state.restorationBox && state.restorationBox.length > 0);
      }
      // 旧存档迁移：卷组吐槽冷却
      if (!state.quipCooldown) {
        state.quipCooldown = { recent: [], groupVisits: {} };
      }
      // 旧存档迁移：环境音系统
      if (!state.ambientSounds) {
        state.ambientSounds = { unlocked: [], current: null };
      }
      // 旧存档迁移：语言设置已迁移到 settings.js，此处不再处理

      saveState(); // 迁移后立即持久化
      return true;
    } catch (e) {
      // 存档损坏，使用默认状态
    }
  }
  return false;
}

// 手稿箱自动补齐（新旧存档通用）：所有已解锁但未上架+未入箱的书应入箱
export function ensureAllBooksInManuscriptBox() {
  const allShelfIds = new Set();
  (state.library.shelves || []).forEach(shelf => {
    if (Array.isArray(shelf)) shelf.forEach(id => { if (id) allShelfIds.add(id); });
  });
  if (!state.manuscriptBox) state.manuscriptBox = [];
  Object.entries(state.books || {}).forEach(([id, b]) => {
    if (!b || b.status === 'locked') return;
    if (allShelfIds.has(id)) return;
    if (state.manuscriptBox.includes(id)) return;
    state.manuscriptBox.push(id);
  });
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
  // locale 已迁移到 settings，不再写入主存档
  delete toSave.locale;
  return save(STORAGE_KEYS.STATE, toSave);
}
