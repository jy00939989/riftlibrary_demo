// 墨墨日志模块 —— 纯前端模板拼接，不依赖后端
import { state, saveState } from './state.js';
import { BOOKS } from '../data/books.js';
import { addCoins, addAtmosphere } from './storage.js';
import { t } from './i18n/terms.js';

// ========== 模板键池 ==========

const OPENING_KEYS = {
  focus_complete: [
    'diary_opening_focus_complete_0',
    'diary_opening_focus_complete_1',
    'diary_opening_focus_complete_2',
    'diary_opening_focus_complete_3',
    'diary_opening_focus_complete_4'
  ],
  focus_abandon: [
    'diary_opening_focus_abandon_0',
    'diary_opening_focus_abandon_1',
    'diary_opening_focus_abandon_2'
  ],
  visitor_arrive: [
    'diary_opening_visitor_arrive_0',
    'diary_opening_visitor_arrive_1',
    'diary_opening_visitor_arrive_2'
  ],
  visitor_borrow: [
    'diary_opening_visitor_borrow_0',
    'diary_opening_visitor_borrow_1',
    'diary_opening_visitor_borrow_2'
  ],
  visitor_return: [
    'diary_opening_visitor_return_0',
    'diary_opening_visitor_return_1',
    'diary_opening_visitor_return_2'
  ],
  book_complete: [
    // Lv2（首次完成）—— 书脊显名
    'diary_opening_book_complete_0',
    'diary_opening_book_complete_1',
    'diary_opening_book_complete_2',
    // Lv3（第二次完成）—— 墨迹加深
    'diary_opening_book_complete_3',
    'diary_opening_book_complete_4',
    // Lv4（第三次完成）—— 书本回应
    'diary_opening_book_complete_5',
    'diary_opening_book_complete_6',
    // Lv5（第四次完成）—— 书本成为伙伴
    'diary_opening_book_complete_7',
    'diary_opening_book_complete_8',
    // Lv6（第五次完成，满熟练）—— 书本拥有灵魂
    'diary_opening_book_complete_9',
    'diary_opening_book_complete_10'
  ],
  milestone: [
    'diary_opening_milestone_0',
    'diary_opening_milestone_1',
    'diary_opening_milestone_2'
  ],
  special_event: [
    'diary_opening_special_event_0',
    'diary_opening_special_event_1',
    'diary_opening_special_event_2'
  ]
};

const MIDDLE_KEYS = {
  focus: [
    'diary_middle_focus_0',
    'diary_middle_focus_1',
    'diary_middle_focus_2',
    'diary_middle_focus_3',
    'diary_middle_focus_4',
    'diary_middle_focus_5',
    'diary_middle_focus_6'
  ],
  visitor: [
    'diary_middle_visitor_0',
    'diary_middle_visitor_1',
    'diary_middle_visitor_2',
    'diary_middle_visitor_3'
  ],
  general: [
    'diary_middle_general_0',
    'diary_middle_general_1',
    'diary_middle_general_2'
  ]
};

const DAILY_OPENING_KEYS = [
  'diary_daily_opening_0',
  'diary_daily_opening_1',
  'diary_daily_opening_2',
  'diary_daily_opening_3'
];

const ENDING_KEYS = [
  'diary_ending_0',
  'diary_ending_1',
  'diary_ending_2',
  'diary_ending_3',
  'diary_ending_4',
  'diary_ending_5'
];

// ========== 工具 ==========

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function fill(template, vars) {
  let s = template;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return s;
}

function getDateStr(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return fill(t('diaryDateFormat'), { year, month, day });
}

function getWeather() {
  const options = t('diaryWeatherOptions').split('|').map(s => s.trim());
  return pick(options);
}

function commonVars() {
  return {
    momo: t('momo'),
    master: t('diaryMaster'),
    library: t('library'),
    scriptorium: t('tabScriptorium'),
    curator: t('curator')
  };
}

// ========== 日志生成 ==========

export function generateDiaryEntry(type, vars = {}) {
  let openingKey;
  if (type === 'book_complete' && vars.mastery) {
    const pool = OPENING_KEYS[type];
    if (!pool) { openingKey = pick(OPENING_KEYS.focus_complete); }
    else {
      const lv = Math.min(vars.mastery, 5);
      // Lv2=首次(0-1), Lv3=二次(2-3), Lv4=三次(4-5), Lv5=四次(6-7), Lv6=五次(8-9)
      const tierMap = { 1: [0, 1], 2: [0, 1], 3: [2, 3], 4: [4, 5], 5: [6, 7], 6: [8, 9] };
      const [a, b] = tierMap[lv] || [0, 1];
      openingKey = pool[Math.floor(Math.random() * (b - a + 1)) + a];
    }
  } else {
    openingKey = pick(OPENING_KEYS[type] || OPENING_KEYS.focus_complete);
  }
  const opening = fill(t(openingKey), { ...commonVars(), ...vars });

  let middleCategory = 'general';
  if (type === 'focus_complete' || type === 'focus_abandon') middleCategory = 'focus';
  else if (type.includes('visitor')) middleCategory = 'visitor';

  const middle = fill(t(pick(MIDDLE_KEYS[middleCategory] || MIDDLE_KEYS.general)), commonVars());
  const ending = fill(t(pick(ENDING_KEYS)), commonVars());

  const weather = getWeather();
  const date = getDateStr();

  const logNumber = (state.diaryLogs ? state.diaryLogs.length : 0) + 1;
  const header = fill(t('diaryLogHeader'), { ...commonVars(), page: logNumber });
  const log = `${header}\n${date}\n${weather}\n\n${opening}\n${middle}\n\n${ending}`;

  return log;
}

// ========== 存储 ==========

export function addDiaryEntry(type, vars = {}) {
  if (!state.diaryLogs) state.diaryLogs = [];
  const log = generateDiaryEntry(type, vars);
  state.diaryLogs.unshift({
    type,
    text: log,
    time: Date.now()
  });
  // 保留最近 30 条
  if (state.diaryLogs.length > 30) state.diaryLogs.length = 30;

  // 检测装帧升级
  const levelUp = checkDiaryLevelUp();
  if (levelUp) {
    // 延迟显示弹窗，避免与其他 UI 冲突
    setTimeout(() => {
      import('./render/animations.js').then(mod => {
        mod.showDiaryLevelUpPopup(levelUp);
      });
    }, 800);
  }

  return levelUp;
}

export function getDiaryEntries() {
  return state.diaryLogs || [];
}

// ========== 每日回顾 ==========

function addRawEntry(text, type) {
  if (!state.diaryLogs) state.diaryLogs = [];
  state.diaryLogs.unshift({
    type: type || 'daily',
    text,
    time: Date.now()
  });
  if (state.diaryLogs.length > 30) state.diaryLogs.length = 30;
}

export function tryGenerateDailySummary() {
  const now = new Date();
  const today = now.toDateString();

  if (!state.diaryLastSummaryDate) state.diaryLastSummaryDate = '';
  if (state.diaryLastSummaryDate === today) return;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const yesterdayEntries = (state.history || []).filter(h => {
    return new Date(h.time).toDateString() === yesterdayStr;
  });
  if (yesterdayEntries.length === 0) return;

  let focusCount = 0, focusMinutes = 0, focusWords = 0;
  const completedBooks = [];
  const milestones = [];
  const visitorLines = [];

  yesterdayEntries.forEach(h => {
    if (h.type === 'focus') {
      focusCount++;
      const minMatch = h.title.match(/(\d+)\s*分钟/);
      if (minMatch) focusMinutes += parseInt(minMatch[1]);
      const wordMatch = h.detail.match(/([\d,]+)\s*字/);
      if (wordMatch) focusWords += parseInt(wordMatch[1].replace(/,/g, ''));
    } else if (h.type === 'achievement' && h.title.includes('完成')) {
      const titleMatch = h.title.match(/《(.+)》/);
      if (titleMatch) completedBooks.push(titleMatch[1]);
    } else if (h.type === 'milestone') {
      milestones.push(h.title);
    } else if (h.type === 'visitor') {
      visitorLines.push(h.title);
    }
  });

  if (focusCount === 0 && completedBooks.length === 0) return;

  // 组装文本
  const dateStr = getDateStr(yesterday);
  const weather = getWeather();
  const opening = fill(t(pick(DAILY_OPENING_KEYS)), commonVars());
  const ending = fill(t(pick(ENDING_KEYS)), commonVars());
  const logNumber = (state.diaryLogs ? state.diaryLogs.length : 0) + 1;

  const header = fill(t('diaryLogHeader'), { ...commonVars(), page: logNumber });
  let body = `${header}\n${dateStr}\n${weather}\n\n${opening}\n`;

  if (focusCount > 0) {
    body += fill(t('diarySummaryFocusBase'), { ...commonVars(), count: focusCount, minutes: focusMinutes });
    if (focusWords > 0) body += fill(t('diarySummaryFocusWords'), { words: focusWords.toLocaleString() });
    body += t('diaryPeriod');
  }

  completedBooks.forEach(title => {
    body += `\n${fill(t('diarySummaryBookComplete'), { title })}`;
  });

  milestones.forEach(m => {
    body += `\n${m}`;
  });

  visitorLines.forEach(v => {
    body += `\n${v}`;
  });

  body += `\n\n${ending}`;

  addRawEntry(body, 'daily');
  state.diaryLastSummaryDate = today;
  saveState();
}

// 日志集满30页后的装帧等级
import { getDiaryBindingLevel as _getDiaryBindingLevel } from './core/achievement-stats.js';

export function getDiaryBindingLevel() {
  return _getDiaryBindingLevel(state.diaryLogs);
}

// ========== 装帧升级奖励 ==========

const DIARY_LEVEL_REWARDS = {
  2: { coins: 50, atmo: 3 },
  3: { coins: 100, atmo: 5 },
  4: { coins: 200, atmo: 10 }
};

const DIARY_LEVEL_MOMO_SPEECH = {
  2: 'diaryLevelSpeech2',
  3: 'diaryLevelSpeech3',
  4: 'diaryLevelSpeech4'
};

export function checkDiaryLevelUp() {
  if (!state.diaryLevelRewardsClaimed) state.diaryLevelRewardsClaimed = [];
  const currentLevel = getDiaryBindingLevel().level;
  if (currentLevel > 1 && !state.diaryLevelRewardsClaimed.includes(currentLevel)) {
    state.diaryLevelRewardsClaimed.push(currentLevel);
    const rewards = DIARY_LEVEL_REWARDS[currentLevel];
    if (rewards) {
      addCoins(rewards.coins);
      addAtmosphere(rewards.atmo);
    }
    saveState();
    return {
      level: currentLevel,
      name: getDiaryBindingLevel().name,
      icon: getDiaryBindingLevel().icon,
      rewards: rewards || { coins: 0, atmo: 0 },
      momoSpeech: fill(t(DIARY_LEVEL_MOMO_SPEECH[currentLevel] || ''), commonVars())
    };
  }
  return null;
}
