// 休息时间行动卡 —— 10张行动池，3选1
import { state, saveState } from './state.js';
import { addCoins, addAtmosphere, addHistory } from './storage.js';
import { BOOKS } from '../data/books.js';

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ========== 行动池 ==========

const ACTIONS = [
  {
    id: 'water_plant',
    emoji: '🌱', name: '给植物浇水',
    desc: '不消耗浇水次数 · +25 进度',
    available(s) { return s.plant.waterAvailable > 0; },
    apply() {
      state.plant.growthProgress = Math.min(100, (state.plant.growthProgress || 0) + 25);
      addHistory('action', '🌱 给植物浇了水', '盆栽进度 +25');
    },
    dailyLimit: 2
  },
  {
    id: 'chat_visitor',
    emoji: '💬', name: '和在馆访客聊天',
    desc: '随机访客好感 +3~5',
    available(s) { return s.visitors.some(v => v.status === 'browsing'); },
    apply() {
      const browsing = state.visitors.filter(v => v.status === 'browsing');
      const v = pick(browsing);
      const favor = rand(3, 5);
      v.favorability = (v.favorability || 0) + favor;
      addHistory('action', `💬 和${v.emoji} ${v.name}聊了一会`, `好感 +${favor}`);
    },
    dailyLimit: 2
  },
  {
    id: 'organize_shelf',
    emoji: '📋', name: '整理书架',
    desc: '+5~10 智慧之光',
    available() { return true; },
    apply() {
      const n = rand(5, 10);
      addCoins(n);
      addHistory('action', '📋 整理了书架', `+${n} 智慧之光`);
    },
    dailyLimit: 2
  },
  {
    id: 'brew_tea',
    emoji: '🍵', name: '泡杯热茶',
    desc: '下次专注前5分钟速度 +10%',
    available() { return true; },
    apply() {
      state.pendingTeaBoost = true;
      addHistory('action', '🍵 泡了一杯热茶', '下次专注前5分钟速度+10%');
    },
    dailyLimit: 2
  },
  {
    id: 'old_notes',
    emoji: '📝', name: '翻翻旧笔记',
    desc: '随机已完成书 誊抄进度 +3%',
    available(s) {
      return Object.entries(s.books).some(([id, bs]) => {
        if (bs.status !== 'completed') return false;
        const book = BOOKS[id];
        if (!book || book.noMastery) return false;
        return bs.masteryLevel < 5;
      });
    },
    apply() {
      const candidates = Object.entries(state.books).filter(([id, bs]) => {
        if (bs.status !== 'completed') return false;
        const book = BOOKS[id];
        if (!book || book.noMastery) return false;
        return bs.masteryLevel < 5;
      });
      const [id, bs] = pick(candidates);
      const book = BOOKS[id];
      const bonus = Math.round(book.totalWords * 0.03);
      bs.copiedWords += bonus;
      addHistory('action', `📝 翻看了《${book.title}》的旧笔记`, `誊抄进度 +${bonus.toLocaleString()} 字`);
    },
    dailyLimit: 1
  },
  {
    id: 'open_window',
    emoji: '🪟', name: '开窗通风',
    desc: '+1 氛围 · +5~8 智慧之光',
    available() { return true; },
    apply() {
      const n = rand(5, 8);
      addAtmosphere(1);
      addCoins(n);
      addHistory('action', '🪟 开了窗通风', `+1 氛围 · +${n} 智慧之光`);
    },
    dailyLimit: 2
  },
  {
    id: 'light_candle',
    emoji: '🕯️', name: '点燃烛台',
    desc: '下次专注完成额外 +1 灵感',
    available() { return true; },
    apply() {
      state.pendingCandleInspiration = true;
      addHistory('action', '🕯️ 点燃了烛台', '下次专注完成额外+1灵感');
    },
    dailyLimit: 1
  },
  {
    id: 'sweep_dust',
    emoji: '🧹', name: '拂去灰尘',
    desc: '+2 氛围',
    available() { return true; },
    apply() {
      addAtmosphere(2);
      addHistory('action', '🧹 拂去了书架上的灰尘', '+2 氛围');
    },
    dailyLimit: 2
  },
  {
    id: 'sort_manuscripts',
    emoji: '🗺️', name: '整理手稿',
    desc: '+8~15 智慧之光',
    available() { return true; },
    apply() {
      const n = rand(8, 15);
      addCoins(n);
      addHistory('action', '🗺️ 整理了散落的手稿', `+${n} 智慧之光`);
    },
    dailyLimit: 2
  },
  {
    id: 'hum_tune',
    emoji: '🎵', name: '轻哼调子',
    desc: '在馆访客各 +2 好感',
    available(s) { return s.visitors.some(v => v.status === 'browsing'); },
    apply() {
      const browsing = state.visitors.filter(v => v.status === 'browsing');
      browsing.forEach(v => {
        v.favorability = (v.favorability || 0) + 2;
      });
      addHistory('action', '🎵 轻轻哼了一首歌', `在馆访客好感各 +2`);
    },
    dailyLimit: 2
  }
];

// ========== 每日重置 ==========

function ensureDailyReset() {
  const today = new Date().toDateString();
  if (!state.actionCardDaily) {
    state.actionCardDaily = { date: '', count: 0, usedActions: {} };
  }
  if (state.actionCardDaily.date !== today) {
    state.actionCardDaily.date = today;
    state.actionCardDaily.count = 0;
    state.actionCardDaily.usedActions = {};
  }
}

// ========== 抽取 ==========

export function canDrawActionCards() {
  ensureDailyReset();
  return state.actionCardDaily.count < 3;
}

export function drawActionCards() {
  ensureDailyReset();
  if (state.actionCardDaily.count >= 3) return [];

  const eligible = ACTIONS.filter(a => {
    const used = state.actionCardDaily.usedActions[a.id] || 0;
    if (used >= a.dailyLimit) return false;
    return a.available(state);
  });

  // 洗牌，取前3
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

// ========== 执行 ==========

export function applyAction(actionId) {
  const action = ACTIONS.find(a => a.id === actionId);
  if (!action) return false;

  ensureDailyReset();
  state.actionCardDaily.count += 1;
  state.actionCardDaily.usedActions[actionId] = (state.actionCardDaily.usedActions[actionId] || 0) + 1;

  action.apply();
  saveState();
  return true;
}
