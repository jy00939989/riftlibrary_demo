// 旧存档迁移与规范化

import { state, DEFAULT_BOOKS } from './state.js';
import { saveState } from './save.js';
import { load, STORAGE_KEYS } from '../persistence.js';
import { BOOKS } from '../../data/books.js';
import { VOLUME_GROUPS } from '../../data/volume_groups.js';
import { DLC_PACKS } from '../../data/dlc_packs.js';
import { PLANT_TYPES } from '../../data/plants.js';

// 规范空盆常量（铲除/凋谢/灾难后复用）
export const EMPTY_PLANT = {
  activeType: null,
  level: 0,
  growthProgress: 0,
  waterAvailable: 0,
  lastCareTime: 0,
  plantedAt: 0,
  harvested: false
};

// ========== 迁移版本门控 ==========

/**
 * 所有迁移函数按版本顺序排列。
 * 每个迁移必须幂等：同一存档多次运行结果相同。
 */
const MIGRATIONS = [
  { version: 1, up: migrateV1 },
  { version: 2, up: migrateV2 },
  { version: 3, up: migrateV3 },
  { version: 4, up: migrateV4 }
];

function migrateV4() {
  // 2026-08-30：纪念牌限量编号
  if (!state.signboardSerials) state.signboardSerials = {};
}

function migrateV3() {
  // 2026-08-30：三种笔从中式名改为西式名，ID 同步变更
  if (!state.inventory) state.inventory = {};
  const itemIdMapping = {
    brush_rat_whisker: 'brush_reed_pen',
    brush_ji_ju: 'brush_swan_quill',
    brush_purple_rabbit: 'brush_mithril_nib'
  };
  Object.entries(itemIdMapping).forEach(([oldId, newId]) => {
    if (state.inventory[oldId]) {
      state.inventory[newId] = (state.inventory[newId] || 0) + state.inventory[oldId];
      delete state.inventory[oldId];
    }
  });
}

function migrateV2() {
  // 新版迁移：消耗型道具背包
  if (!state.inventory) state.inventory = {};
  // 确保 inventory 值为非负整数
  Object.keys(state.inventory).forEach(key => {
    const count = state.inventory[key];
    if (typeof count !== 'number' || count < 0 || !Number.isFinite(count)) {
      state.inventory[key] = 0;
    }
  });
}

function migrateV1() {
  // 合并书籍状态：保留用户进度，但用默认值补充新增/变更的书籍
  Object.keys(DEFAULT_BOOKS).forEach(id => {
    if (!state.books[id]) {
      state.books[id] = { ...DEFAULT_BOOKS[id] };
    } else {
      const savedBook = state.books[id];
      state.books[id] = { ...DEFAULT_BOOKS[id], ...savedBook };
      if (DEFAULT_BOOKS[id].status !== 'locked' && savedBook.status === 'locked') {
        state.books[id].status = DEFAULT_BOOKS[id].status;
      }
      if (state.books[id].damaged === undefined) state.books[id].damaged = false;
      if (state.books[id].repairWords === undefined) state.books[id].repairWords = 0;
      if (state.books[id].repairProgress === undefined) state.books[id].repairProgress = 0;
      if (state.books[id].starred === undefined) state.books[id].starred = false;
      if (state.books[id].readChapters === undefined) state.books[id].readChapters = [];
      if (state.books[id].reCopyUnlocked === undefined) state.books[id].reCopyUnlocked = false;
    }
  });

  // 旧存档迁移：visitorFavors（旧版 4 人 → 新版 10 人）
  if (!state.visitorFavors) {
    state.visitorFavors = {
      shenmingyuan: 0, chengyuan: 0, peizhou: 0, jianan: 0, jiangyoushu: 0,
      guyu: 0, qiaoyiyi: 0, xierugui: 0, xiachan: 0, wangxiaolei: 0
    };
  } else {
    const ALL_IDS = ['shenmingyuan','chengyuan','peizhou','jianan','jiangyoushu','guyu','qiaoyiyi','xierugui','xiachan','wangxiaolei'];
    ALL_IDS.forEach(id => {
      if (state.visitorFavors[id] === undefined) state.visitorFavors[id] = 0;
    });
  }

  // 旧存档迁移：visitorNarratives
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

  // 旧存档迁移：借阅区/缮写室等级
  if (state.library.borrowLevel === undefined) state.library.borrowLevel = 0;
  if (state.library.focusLevel === undefined) state.library.focusLevel = 0;

  // 旧存档迁移：introCompleted
  if (state.introCompleted === undefined) state.introCompleted = false;

  // 旧存档迁移：位面传送门 + 命名状态 + 旧默认名
  if (!state.library.planePortals) state.library.planePortals = {};
  if (state.library.nameLocked === undefined) state.library.nameLocked = false;
  if (state.library.name === '星辉图书馆') state.library.name = '归墟图书馆';

  // 新版迁移：植物/种子/标志牌
  if (!state.plant) {
    state.plant = { ...EMPTY_PLANT };
  } else {
    // 补全缺失字段
    Object.keys(EMPTY_PLANT).forEach(key => {
      if (state.plant[key] === undefined) state.plant[key] = EMPTY_PLANT[key];
    });
  }
  if (!state.seeds) state.seeds = {};
  Object.values(PLANT_TYPES).forEach(def => {
    if (state.seeds[def.seedType] === undefined) state.seeds[def.seedType] = 0;
  });
  if (!state.signboards) state.signboards = [];
  if (!state.diaryLastSummaryDate) state.diaryLastSummaryDate = '';
  if (!state.diaryFirsts) state.diaryFirsts = { visitorArrive: false, visitorBorrow: false, visitorReturn: false };

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
  if (state.tutorialFlags.maxAtmoStageSeen === undefined) state.tutorialFlags.maxAtmoStageSeen = 1;
  if (state.tutorialFlags.firstLibraryOpen === undefined) state.tutorialFlags.firstLibraryOpen = false;
  if (state.tutorialFlags.firstBookComplete === undefined) state.tutorialFlags.firstBookComplete = false;
  if (state.tutorialFlags.firstVisitorEventDone === undefined) state.tutorialFlags.firstVisitorEventDone = false;
  if (state.tutorialFlags.firstBorrowUpgradeDone === undefined) state.tutorialFlags.firstBorrowUpgradeDone = false;
  if (state.tutorialFlags.firstRestorationUnlock === undefined) state.tutorialFlags.firstRestorationUnlock = false;

  if (state.inspiration === undefined) state.inspiration = 0;
  if (!state.actionCardDaily) state.actionCardDaily = { date: '', count: 0, usedActions: {} };
  if (state.pendingTeaBoost === undefined) state.pendingTeaBoost = false;
  if (state.pendingCandleInspiration === undefined) state.pendingCandleInspiration = false;

  if (!state.dailyTasks) state.dailyTasks = { date: '', focusDone: false, returnDone: false, waterDone: false, allClaimed: false };

  if (state.lastTyphoonTime === undefined) state.lastTyphoonTime = 0;

  if (!state.quests) {
    state.quests = { pastoral: { unlocked: false, stage: 0, stagesCompleted: [], portalPurchasedAt: null, characters: {
      pastoral_child: { met: false, stage: 1, activeTasks: [], completedTasks: [], pendingComplete: [], favor: 0 },
      pastoral_herbalist: { met: false, stage: 1, activeTasks: [], completedTasks: [], pendingComplete: [], favor: 0 },
      pastoral_lord: { met: false, stage: 1, activeTasks: [], completedTasks: [], pendingComplete: [], favor: 0 },
      pastoral_scholar: { met: false, stage: 1, activeTasks: [], completedTasks: [], pendingComplete: [], favor: 0 },
      pastoral_nun: { met: false, stage: 1, activeTasks: [], completedTasks: [], pendingComplete: [], favor: 0 }
    }, mementos: [], letters: [], storyLog: [] } };
  } else {
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
    if (p.plagueProgress !== undefined) delete p.plagueProgress;
  }

  if (!state.familiarVisitors) state.familiarVisitors = {};
  if (!state.guideQuests) state.guideQuests = { completed: [], allCompleted: false };
  if (!state.momoCommentUsedToday) state.momoCommentUsedToday = { date: '', comments: [] };
  if (!state.diaryLevelRewardsClaimed) state.diaryLevelRewardsClaimed = [];

  // 旧存档迁移：手稿箱
  if (!state.manuscriptBox) state.manuscriptBox = [];
  if (state.library.manuscriptSlots === undefined) state.library.manuscriptSlots = 5;
  if (state.peizhouRec === undefined) state.peizhouRec = null;

  // 旧存档迁移：shelves 数字格式 → 位置格式
  if (state.library.shelves.length > 0 && typeof state.library.shelves[0] === 'number') {
    const oldCount = state.library.shelves.length;
    const newShelves = Array.from({ length: oldCount }, () => Array(5).fill(null));
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
  if (!state.restorationBox) state.restorationBox = [];
  if (state.restorationBoxSlots === undefined) state.restorationBoxSlots = 3;
  if (state.restorationLevel === undefined) state.restorationLevel = 0;
  if (state.restorationUnlocked === undefined) {
    state.restorationUnlocked = (state.restorationLevel > 0) || (state.restorationBox && state.restorationBox.length > 0);
  }

  // 旧存档迁移：卷组吐槽冷却
  if (!state.quipCooldown) state.quipCooldown = { recent: [], groupVisits: {} };

  // 旧存档迁移：环境音系统
  if (!state.ambientSounds) state.ambientSounds = { unlocked: [], current: null };

  // 新版迁移：DLC 补充包
  if (!state.dlcPacks) state.dlcPacks = { unlocked: [], redeemedCodes: [] };
  DLC_PACKS.forEach(pack => {
    if (state.dlcPacks.unlocked.includes(pack.id)) return;
    const allOwned = pack.bookIds.every(bookId => {
      const bs = state.books[bookId];
      return bs && bs.status !== 'locked';
    });
    if (allOwned) {
      state.dlcPacks.unlocked.push(pack.id);
    }
  });
}

// ========== 书籍状态修正迁移 ==========
// 从旧存档 copiedWords 修正 copyCount/masteryLevel，以及扩充字数后旧 completed 回退。

function migrateBookProgressFromCopiedWords() {
  Object.keys(state.books).forEach(bookId => {
    const book = BOOKS[bookId];
    const bs = state.books[bookId];
    if (!book || !bs || !book.totalWords || bs.copiedWords <= 0) return;

    const actualCopies = Math.floor(bs.copiedWords / book.totalWords);
    if (actualCopies > (bs.copyCount || 0)) {
      bs.copyCount = actualCopies;
      if (!book.noMastery) {
        bs.masteryLevel = Math.min(5, actualCopies);
      }
      if (bs.masteryLevel >= 5) {
        bs.status = 'completed';
      }
    }

    if (bs.status === 'completed' && bs.copiedWords < book.totalWords) {
      bs.status = bs.copiedWords > 0 ? 'copying' : 'unlocked';
    }

    if (bs.status === 'copying' && bs.copiedWords <= 0) {
      bs.status = 'unlocked';
    }

    if (bs.status === 'copying' && bs.copiedWords >= book.totalWords) {
      bs.status = 'completed';
      bs.copyCount = Math.max(bs.copyCount || 1, Math.floor(bs.copiedWords / book.totalWords));
      if (!book.noMastery) {
        bs.masteryLevel = Math.min(5, bs.copyCount);
      }
    }

    if (book.chapters && bs.unlockedChapters) {
      book.chapters.forEach((ch, idx) => {
        if (bs.copiedWords >= ch.unlockAt && !bs.unlockedChapters.includes(idx + 1)) {
          bs.unlockedChapters.push(idx + 1);
        }
      });
    }

    if (!book.noMastery && bs.copyCount > 0 && bs.masteryLevel > bs.copyCount) {
      bs.masteryLevel = Math.min(5, bs.copyCount);
    }
  });
}

// ========== 公开 API ==========

export function runMigrations() {
  const currentVersion = state._schemaVersion || 0;
  for (let i = currentVersion; i < MIGRATIONS.length; i++) {
    MIGRATIONS[i].up();
    state._schemaVersion = MIGRATIONS[i].version;
  }
}

export function initState() {
  const saved = load(STORAGE_KEYS.STATE);
  if (saved) {
    try {
      Object.assign(state, saved);
      runMigrations();
      migrateBookProgressFromCopiedWords();
      saveState();
      return true;
    } catch (e) {
      console.error('[initState] save migration failed', e);
    }
  } else {
    // 新存档：直接标记为最新 schema 版本
    state._schemaVersion = MIGRATIONS.length;
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
