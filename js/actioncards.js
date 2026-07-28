// Break-time action cards — 10-card pool, choose 1 of 3
import { state, saveState } from './state.js';
import { addCoins, addAtmosphere, addHistory } from './storage.js';
import { BOOKS } from '../data/books.js';
import { t } from './i18n/terms.js';

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ========== Action pool ==========

const ACTIONS = [
  {
    id: 'water_plant',
    emoji: '🌱',
    nameKey: 'actionWaterPlant',
    descKey: 'actionWaterPlantDesc',
    descParams: { value: 25 },
    available(s) { return s.plant.waterAvailable > 0; },
    apply() {
      state.plant.growthProgress = Math.min(100, (state.plant.growthProgress || 0) + 25);
      addHistory('action', t('actionWaterPlantHistory'), t('actionPlantGrowthPlus').replace('{value}', 25));
    },
    dailyLimit: 2
  },
  {
    id: 'chat_visitor',
    emoji: '💬',
    nameKey: 'actionChatVisitor',
    descKey: 'actionChatVisitorDesc',
    descParams: { min: 3, max: 5 },
    available(s) { return s.visitors.some(v => v.status === 'browsing'); },
    apply() {
      const browsing = state.visitors.filter(v => v.status === 'browsing');
      const v = pick(browsing);
      const favor = rand(3, 5);
      v.favorability = (v.favorability || 0) + favor;
      addHistory('action', t('actionChatVisitorHistory').replace('{emoji}', v.emoji).replace('{name}', v.name), t('actionFavorPlusN').replace('{n}', favor));
    },
    dailyLimit: 2
  },
  {
    id: 'organize_shelf',
    emoji: '📋',
    nameKey: 'actionOrganizeShelf',
    descKey: 'actionOrganizeShelfDesc',
    descParams: { min: 3, max: 6 },
    available() { return true; },
    apply() {
      const n = rand(3, 6);
      addCoins(n);
      addAtmosphere(1);
      addHistory('action', t('actionOrganizeShelfHistory'), t('actionCoinsAndAtmosphere').replace('{coins}', n));
    },
    dailyLimit: 2
  },
  {
    id: 'brew_tea',
    emoji: '🍵',
    nameKey: 'actionBrewTea',
    descKey: 'actionBrewTeaDesc',
    descParams: { pct: 10 },
    available() { return true; },
    apply() {
      state.pendingTeaBoost = true;
      addHistory('action', t('actionBrewTeaHistory'), t('actionBrewTeaEffect').replace('{pct}', 10));
    },
    dailyLimit: 2
  },
  {
    id: 'old_notes',
    emoji: '📝',
    nameKey: 'actionOldNotes',
    descKey: 'actionOldNotesDesc',
    descParams: { pct: 3 },
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
      addHistory('action', t('actionOldNotesHistory').replace('{title}', book.title), t('actionCopyProgressPlusWords').replace('{words}', bonus.toLocaleString()));
    },
    dailyLimit: 1
  },
  {
    id: 'open_window',
    emoji: '🪟',
    nameKey: 'actionOpenWindow',
    descKey: 'actionOpenWindowDesc',
    descParams: { min: 5, max: 8 },
    available() { return true; },
    apply() {
      const n = rand(5, 8);
      addAtmosphere(1);
      addCoins(n);
      addHistory('action', t('actionOpenWindowHistory'), t('actionAtmosphereAndCoins').replace('{coins}', n));
    },
    dailyLimit: 2
  },
  {
    id: 'light_candle',
    emoji: '🕯️',
    nameKey: 'actionLightCandle',
    descKey: 'actionLightCandleDesc',
    descParams: { n: 1 },
    available() { return true; },
    apply() {
      state.pendingCandleInspiration = true;
      addHistory('action', t('actionLightCandleHistory'), t('actionLightCandleEffect').replace('{n}', 1));
    },
    dailyLimit: 1
  },
  {
    id: 'sweep_dust',
    emoji: '🧹',
    nameKey: 'actionSweepDust',
    descKey: 'actionSweepDustDesc',
    descParams: { n: 2 },
    available() { return true; },
    apply() {
      addAtmosphere(2);
      addHistory('action', t('actionSweepDustHistory'), t('actionSweepDustDesc').replace('{n}', 2));
    },
    dailyLimit: 2
  },
  {
    id: 'sort_manuscripts',
    emoji: '🗺️',
    nameKey: 'actionSortManuscripts',
    descKey: 'actionSortManuscriptsDesc',
    descParams: { min: 8, max: 15 },
    available() { return true; },
    apply() {
      const n = rand(8, 15);
      addCoins(n);
      addHistory('action', t('actionSortManuscriptsHistory'), t('actionCoinsPlusN').replace('{n}', n));
    },
    dailyLimit: 2
  },
  {
    id: 'hum_tune',
    emoji: '🎵',
    nameKey: 'actionHumTune',
    descKey: 'actionHumTuneDesc',
    descParams: { n: 2 },
    available(s) { return s.visitors.some(v => v.status === 'browsing'); },
    apply() {
      const browsing = state.visitors.filter(v => v.status === 'browsing');
      browsing.forEach(v => {
        v.favorability = (v.favorability || 0) + 2;
      });
      addHistory('action', t('actionHumTuneHistory'), t('actionVisitorsFavorPlusN').replace('{n}', 2));
    },
    dailyLimit: 2
  }
];

// ========== Daily reset ==========

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

// ========== Draw ==========

function fillDesc(template, values) {
  return Object.entries(values || {}).reduce((s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), v), template);
}

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

  // Shuffle and take the first 3
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map(a => ({
    ...a,
    name: t(a.nameKey),
    desc: fillDesc(t(a.descKey), a.descParams)
  }));
}

// ========== Apply ==========

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
