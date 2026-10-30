// 活动任务链 + 限时植物回收（哥特之夜 2026，gothic-night-assets-2026.md v4.3）
// 领取制（2026-10-27 图南拍板）：任务完成 → 展览厅面板手动领取奖励；不开弹窗。
// 奖励：开卷=BGM《猩红月夜》 · 执灯=魔法南瓜种子×3 · 种瓜=南瓜糖×3（克克设计） · 待客=2026 纪念牌
// 挂点：purchaseBook（开卷）/ runFocusOrchestrator（执灯）/ harvestPlant（种瓜）/ serveVisitor（待客）
import { state, saveState } from '../state.js';
import { isEventWindowActive } from '../../data/event_calendar.js';
import { addHistory, addCoins } from '../storage.js';

export const GOTHIC_EVENT_ID = 'gothic_night';
export const GOTHIC_PLAQUE_ID = 'gothic_night_plaque';

// 2026-10-30 图南拍板：窗口结束时没种完的魔法南瓜种子化作光尘，每颗凝成 15 智慧之光——
// 低于做成咖啡馆万圣品（种子路线 32~44/颗：特饮 88/2 颗、南瓜挞 96/3 颗），但不让种子烂在手里。
const LEFTOVER_SEED_TO_COINS = 15;

// 测试/dev 控制台可注时（与 focus-session 等同款口径）
function getNow() {
  return (typeof window !== 'undefined' && window.__dev && window.__dev.getNow) ? window.__dev.getNow() : Date.now();
}
function windowActive() {
  return isEventWindowActive(GOTHIC_EVENT_ID, new Date(getNow()));
}

// 任务定义：need = 完成口径（count 计数 / set 集合标记）；short = 历史反馈短名；reward = 领取制奖励
const TASK_DEFS = [
  {
    id: 'open_gothic', nameKey: 'evtTaskOpenGothic', short: '开卷', mode: 'set',
    keys: ['book_047_vol1', 'book_047_vol2', 'book_048'], need: 1,
    reward: { type: 'track', trackId: 'gothic_moon', emoji: '🌘', label: 'BGM《猩红血夜》' }
  },
  {
    id: 'focus3', nameKey: 'evtTaskFocus3', short: '执灯', mode: 'count', need: 3,
    reward: { type: 'seeds', seedType: 'magic_pumpkin', count: 3, emoji: '🌱', label: '魔法南瓜种子 ×3' }
  },
  {
    id: 'harvest_pumpkin', nameKey: 'evtTaskHarvestPumpkin', short: '种瓜', mode: 'count', need: 1,
    reward: { type: 'item', itemId: 'pumpkin_candy', count: 3, emoji: '🍬', label: '南瓜糖 ×3' }
  },
  {
    id: 'serve_halloween', nameKey: 'evtTaskServeHalloween', short: '待客', mode: 'set',
    keys: ['gothic_moon_drink', 'pumpkin_tart'], need: 2,
    reward: { type: 'plaque', emoji: '🥀', label: '「哥特之夜 2026」纪念牌' }
  }
];

function progress() {
  if (!state.eventTasks) state.eventTasks = {};
  if (!state.eventTasks[GOTHIC_EVENT_ID]) state.eventTasks[GOTHIC_EVENT_ID] = { steps: {}, granted: false };
  return state.eventTasks[GOTHIC_EVENT_ID];
}

function taskDone(def, st) {
  if (!st) return false;
  return def.mode === 'count' ? st.count >= def.need : st.set.length >= def.need;
}

export function getEventTasks() {
  const p = progress();
  return TASK_DEFS.map(d => {
    const st = p.steps[d.id] || { count: 0, set: [] };
    const done = taskDone(d, st);
    return {
      id: d.id, nameKey: d.nameKey, reward: d.reward,
      count: st.count, set: st.set, need: d.need,
      done, rewarded: !!st.rewarded, claimable: done && !st.rewarded
    };
  });
}

export function isAllEventTasksDone() {
  return getEventTasks().every(t => t.done);
}

/**
 * 任务进度 +1 / 集合标记。窗口外为安全空操作；任务已完成的重复 bump 不再记录。
 * 奖励不自动发放——玩家到展览厅「万圣巡馆」面板手动领取（claimEventTask）。
 */
export function bumpEventTask(taskId, key = null) {
  if (!windowActive()) return;
  const p = progress();
  const def = TASK_DEFS.find(d => d.id === taskId);
  if (!def) return;
  const st = p.steps[taskId] || (p.steps[taskId] = { count: 0, set: [] });
  if (taskDone(def, st)) return; // 已完成：冻结计数
  if (def.mode === 'count') {
    st.count += 1;
  } else {
    const k = key || '_';
    if (def.keys && !def.keys.includes(k)) return; // 只认定义内的键
    if (st.set.includes(k)) return; // 重复标记不再记录（防重复历史噪音）
    st.set.push(k);
  }
  // 每步历史反馈（指引：玩家在历史里看见「万圣巡馆」走到哪一步）
  const cur = def.mode === 'count' ? st.count : st.set.length;
  addHistory('event', `🎃 万圣巡馆 · ${def.short}`, `进度 ${Math.min(cur, def.need)}/${def.need}${taskDone(def, st) ? ' · 可到展览厅领取奖励' : ''}`);
  saveState();
}

/**
 * 领取已完成任务的奖励（展览厅面板按钮调用）。
 * @returns {{ok:boolean, reason?:string, reward?:object}}
 */
export function claimEventTask(taskId) {
  if (!windowActive()) return { ok: false, reason: 'event_ended' };
  const def = TASK_DEFS.find(d => d.id === taskId);
  if (!def) return { ok: false, reason: 'unknown_task' };
  const p = progress();
  const st = p.steps[taskId] || (p.steps[taskId] = { count: 0, set: [] });
  if (!taskDone(def, st)) return { ok: false, reason: 'not_done' };
  if (st.rewarded) return { ok: false, reason: 'already_claimed' };

  const r = def.reward;
  if (r.type === 'track') {
    if (!state.musicRoom) state.musicRoom = { unlocked: false, tracks: [] };
    if (!state.musicRoom.tracks.includes(r.trackId)) state.musicRoom.tracks.push(r.trackId);
    // ⚠️ 音源文件未到前曲目可解锁不可播；Suno 成品落盘 audio/music/gothic-moon.mp3 即响
  } else if (r.type === 'seeds') {
    if (!state.seeds) state.seeds = {};
    state.seeds[r.seedType] = (state.seeds[r.seedType] || 0) + r.count;
  } else if (r.type === 'item') {
    if (!state.inventory) state.inventory = {};
    state.inventory[r.itemId] = (state.inventory[r.itemId] || 0) + r.count;
  } else if (r.type === 'plaque') {
    if (!state.signboards) state.signboards = [];
    if (!state.signboards.includes(GOTHIC_PLAQUE_ID)) state.signboards.push(GOTHIC_PLAQUE_ID);
  }

  st.rewarded = true;
  addHistory('event', `🎁 领取「万圣巡馆 · ${def.short}」奖励`, `${r.emoji} ${r.label}`);
  saveState();
  return { ok: true, reward: r };
}

/**
 * 窗口过期回收：地里未收获的魔法南瓜化作光尘（v4.1 图南拍板：全株限时）；
 * 顺带把没种完的魔法南瓜种子化作光尘凝成智慧之光（2026-10-30 图南拍板，汇率见上）。
 * app 启动链调用（checkFestivalGifts 旁），幂等——只在窗口结束后执行一次回收。
 * @returns {number} 回收盆数
 */
export function recoverEventPlants() {
  if (windowActive()) return 0;
  const plants = state.plants || [];
  let recovered = 0;
  plants.forEach(plant => {
    if (plant && plant.activeType === 'magic_pumpkin' && plant.level > 0) {
      plant.activeType = null;
      plant.level = 0;
      plant.progress = 0;
      recovered += 1;
    }
  });
  let seedCoins = 0;
  const leftoverSeeds = (state.seeds && state.seeds.magic_pumpkin) || 0;
  if (leftoverSeeds > 0) {
    state.seeds.magic_pumpkin = 0;
    seedCoins = leftoverSeeds * LEFTOVER_SEED_TO_COINS;
    addCoins(seedCoins); // 内部 saveState
    addHistory('plant', `🎃 万圣夜落幕，${leftoverSeeds} 颗没种完的魔法南瓜种子化作光尘`,
      `每颗凝成 ${LEFTOVER_SEED_TO_COINS} 智慧之光，共 +${seedCoins} 智慧之光`);
  }
  if (recovered > 0) {
    addHistory('plant', `🎃 万圣夜落幕，${recovered} 株魔法南瓜化作光尘回位面去了`, '哥特之夜的魔法只驻留一周——期待明年的重逢');
    saveState();
  }
  return recovered;
}
