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
    'book_001': {
      unlockedChapters: [1],
      copyCount: 1,
      masteryLevel: 1,
      copiedWords: 2240,
      status: 'copying',
      starred: false,
      damaged: false,
      repairWords: 0
    },
    'book_002': {
      unlockedChapters: [1],
      copyCount: 0,
      masteryLevel: 1,
      copiedWords: 0,
      status: 'unlocked',
      starred: false,
      damaged: false,
      repairWords: 0
    }
  },

  // 图书馆
  library: {
    name: '星辉图书馆',
    atmosphere: 0,
    shelves: [1],
    borrowLevel: 0   // 借阅区等级 0-3，0=未建造
  },

  // 经济
  coins: 1250,

  // 访客（每个访客: { id, charId, name, emoji, status:'browsing'|'borrowed'|'due', bookId, bookTitle, arriveTime, borrowTime, dueTime, eventTriggered }）
  visitors: [],
  // 借阅记录（每条: { id, charId, charName, bookId, bookTitle, borrowTime, returnTime, event, status:'active'|'returned'|'damaged' }）
  borrowRecords: [],

  // 访客好感度（全局累计）
  visitorFavors: { shenmingyuan: 0, xiaoying: 0, yunyou: 0, ajiu: 0 },

  // 事件历史
  history: [],

  // 成就
  achievements: []
};

// 默认书籍状态（新增/变更书籍时同步更新此处）
const DEFAULT_BOOKS = {
  'book_001': {
    unlockedChapters: [1],
    copyCount: 1,
    masteryLevel: 1,
    copiedWords: 2240,
    status: 'copying',
    starred: false,
    damaged: false,
    repairWords: 0
  },
  'book_002': {
    unlockedChapters: [1],
    copyCount: 0,
    masteryLevel: 1,
    copiedWords: 0,
    status: 'unlocked',
    starred: false,
    damaged: false,
    repairWords: 0
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
        }
      });
      // 旧存档迁移：visitorFavors
      if (!state.visitorFavors) {
        state.visitorFavors = { shenmingyuan: 0, xiaoying: 0, yunyou: 0, ajiu: 0 };
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
