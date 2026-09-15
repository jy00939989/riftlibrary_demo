// 展览厅业务逻辑（exhibition-hall-plan v2）
// 大厅分级设施（等级=房间容量，Lv5=5 槽）+ 五房间三态（破败→开放，本版不设施工时长）
// + 限时活动增益双 hook（数据真源在 data/event_calendar.js，本模块只做结算侧读取）
// + 墨墨「展厅巡查」叙事 + 全馆开放一次性庆典
//
// 耦合契约：本模块只写 state.exhibition 与 diary/history；不直写 visitors/focus 内部。
// visitors（attemptBorrow）与 focus-orchestrator（结算）只读 getEvent*Mult 乘区。
import { state, saveState } from '../state.js';
import { spendCoins, addHistory } from '../storage.js';
import { getFacilityLevelCap } from '../../data/atmosphere.js';
import { getLibraryStage } from '../storage.js';
import { getEventsOnDate, getEventEffectMults, getMonthBanner } from '../../data/event_calendar.js';
import { getTodayKey, onNewDay } from './day-boundary.js';
import { addDiaryEntry } from '../diary.js';
import { t } from '../i18n/terms.js';

// ========== 常量（plan §三：大厅分级设施 + 房间双门槛） ==========

export const EXHIBITION_BUILD_STAGE = 2;   // 大厅 0→Lv1 需 2 阶
export const EXHIBITION_BUILD_PRICE = 800; // 便宜起步，先把大厅立起来
export const EXHIBITION_MAX_LEVEL = 5;     // Lv5=5 槽全开放
export const EXHIBITION_UPGRADE_BASE = 1000;
export const EXHIBITION_UPGRADE_GROWTH = 1.6; // 1000/1600/2560/4096（grill #4 图南拍板曲线）

function getNow() {
  return window.__dev?.getNow?.() || Date.now();
}

// ========== 房间清单（收集轨：陈列什么，就先要拥有什么） ==========
// price：修复价（金币轨）；condition：收集条件（返回 { met, progressKey } 供 UI 展示）
// tab/subTab：迁入的现有页（路线 A：整页复用，页内脏不改）；musicroom 为既有设施直通，不走修复不占容量

export const EXHIBITION_ROOMS = {
  archive: {
    emoji: '📜', nameKey: 'roomArchive', price: 0, tab: 'archive',
    condition: () => ({ met: true }) // 档案是「馆的记忆」，随馆而生——建成即开放
  },
  signboards: {
    emoji: '🪧', nameKey: 'roomSignboards', price: 500, tab: 'library', subTab: 'decoration',
    condition: () => ({ met: (state.signboards || []).length >= 1, progressKey: 'exhCondSignboard', have: (state.signboards || []).length, need: 1 })
  },
  achievements: {
    emoji: '🏆', nameKey: 'roomAchievements', price: 800, tab: 'library', subTab: 'achievements',
    condition: () => ({ met: (state.achievements || []).length >= 10, progressKey: 'exhCondAchievements', have: (state.achievements || []).length, need: 10 })
  },
  collection: {
    emoji: '🎁', nameKey: 'roomCollection', price: 800, tab: 'library', subTab: 'collection',
    // 「任意收藏品 ≥5 件」落地口径：访客纪念品 ≥5（明确可数的收集线，展柜陈列感最强）
    condition: () => ({ met: (state.visitorMemory?.items || []).length >= 5, progressKey: 'exhCondCollection', have: (state.visitorMemory?.items || []).length, need: 5 })
  },
  musicroom: {
    emoji: '🎵', nameKey: 'roomMusicroom', price: 0, tab: 'musicroom',
    condition: () => ({ met: !!state.musicRoom?.unlocked, progressKey: 'exhCondMusicroom' })
  },
};

export const EXHIBITION_ROOM_IDS = Object.keys(EXHIBITION_ROOMS);

// ========== 大厅（分级设施） ==========

export function isExhibitionBuilt() {
  return !!(state.exhibition && state.exhibition.built && state.exhibition.level > 0);
}

export function canBuildExhibitionHall() {
  if (isExhibitionBuilt()) return false;
  if (getLibraryStage() < EXHIBITION_BUILD_STAGE) return false;
  return state.coins >= EXHIBITION_BUILD_PRICE;
}

export function buildExhibitionHall() {
  if (!canBuildExhibitionHall()) return false;
  spendCoins(EXHIBITION_BUILD_PRICE);
  state.exhibition.built = true;
  state.exhibition.level = 1;
  // 档案室随馆而生：建成即开放（plan §三）
  state.exhibition.rooms.archive = 'open';
  addHistory('exhibition', '🏛 展览厅奠基了', `花费${EXHIBITION_BUILD_PRICE}智慧之光 · 档案室随之开放（容量 1/5）`);
  addDiaryEntry('special_event', { detail: t('exhPatrolArchive') });
  saveState();
  return true;
}

/** 大厅升级价：1000×1.6^(level-1)（Lv1→2=1000 … Lv4→5=4096） */
export function getHallUpgradePrice() {
  return Math.round(EXHIBITION_UPGRADE_BASE * Math.pow(EXHIBITION_UPGRADE_GROWTH, state.exhibition.level - 1));
}

/** 大厅等级上限 = min(5, 设施帽 stage+1)（复用 getFacilityLevelCap，同咖啡角口径） */
export function getHallLevelCap() {
  return Math.min(EXHIBITION_MAX_LEVEL, getFacilityLevelCap(state.library.atmosphere || 0, state.library.stage));
}

export function canUpgradeHall() {
  if (!isExhibitionBuilt()) return false;
  if (state.exhibition.level >= getHallLevelCap()) return false;
  return state.coins >= getHallUpgradePrice();
}

export function upgradeHall() {
  if (!canUpgradeHall()) return false;
  spendCoins(getHallUpgradePrice());
  state.exhibition.level += 1;
  addHistory('exhibition', `🏛 展览厅扩建到 Lv.${state.exhibition.level}`,
    `房间容量 ${state.exhibition.level}/5`);
  saveState();
  return true;
}

// ========== 房间三态与修复 ==========

/**
 * 留声阁直通：既有设施迁入防重复收费（plan §三）——已建则入口点亮，
 * 不占修复容量（容量只约束四个可修复房间的「修复」动作）。
 * 懒同步：在任何房间状态读取前调用。
 */
function syncMusicRoomEntrance() {
  const exh = state.exhibition;
  if (!exh || !exh.built) return;
  if (state.musicRoom?.unlocked && exh.rooms.musicroom !== 'open') {
    exh.rooms.musicroom = 'open';
    saveState();
  }
}

export function getRoomStatus(roomId) {
  syncMusicRoomEntrance();
  return state.exhibition?.rooms?.[roomId] || 'ruined';
}

/** 已开放房间数（含档案室与直通的留声阁） */
export function getOpenRoomCount() {
  syncMusicRoomEntrance();
  return EXHIBITION_ROOM_IDS.filter(id => state.exhibition?.rooms?.[id] === 'open').length;
}

/** 修复条件快照（UI 清单用）：slot=容量，coin=金币，collection=收集条件 */
export function getRepairSnapshot(roomId) {
  const room = EXHIBITION_ROOMS[roomId];
  if (!room) return null;
  const cond = room.condition();
  const openCount = getOpenRoomCount();
  const slotFree = openCount < (state.exhibition?.level || 0);
  return {
    room,
    price: room.price,
    collectionMet: cond.met,
    condition: cond,
    slotFree,
    coinsEnough: state.coins >= room.price,
    alreadyOpen: getRoomStatus(roomId) === 'open'
  };
}

export function canRepairRoom(roomId) {
  const snap = getRepairSnapshot(roomId);
  if (!snap || snap.alreadyOpen) return false;
  if (roomId === 'musicroom') return false; // 留声阁不走修复：去商店建造后自动点亮
  if (!isExhibitionBuilt()) return false;
  if (!snap.slotFree) return false;      // 容量轨：大厅等级 = 房间容量
  if (!snap.collectionMet) return false; // 收集轨
  return state.coins >= snap.price;      // 金币轨（免费修=白嫖点击，plan §三注）
}

/**
 * 修复房间：三轨齐备才放行。修复即完成（本版不设施工时长）。
 * @returns {{ok: boolean, grandOpening?: boolean}}
 */
export function repairRoom(roomId) {
  if (!canRepairRoom(roomId)) return { ok: false };
  const room = EXHIBITION_ROOMS[roomId];
  if (room.price > 0) spendCoins(room.price);
  state.exhibition.rooms[roomId] = 'open';
  addHistory('exhibition', `${room.emoji} ${t(room.nameKey)}修复开放了`,
    room.price > 0 ? `花费${room.price}智慧之光` : '免费');
  // 趣味性：墨墨「展厅巡查」叙事（房间专属一句）
  addDiaryEntry('special_event', { detail: t('exhPatrol' + roomId.charAt(0).toUpperCase() + roomId.slice(1)) });
  const grandOpening = checkGrandOpening();
  saveState();
  return { ok: true, grandOpening };
}

// ========== 全馆开放庆典（一次性，不阻塞） ==========

/** 五房间全开放时置位并返回 true（一次性）；UI 层据此播庆典 */
export function checkGrandOpening() {
  if (!isExhibitionBuilt()) return false;
  if (state.exhibition.grandOpeningShown) return false;
  const allOpen = EXHIBITION_ROOM_IDS.every(id => getRoomStatus(id) === 'open');
  if (!allOpen) return false;
  state.exhibition.grandOpeningShown = true;
  addDiaryEntry('special_event', { detail: t('exhPatrolGrandOpening') });
  saveState();
  return true;
}

// ========== 限时活动增益（双 hook，grill #2：诞辰 borrowFavor / 节日 focusCoins） ==========

export function getEventBorrowFavorMult(now = getNow()) {
  return getEventEffectMults(new Date(now)).borrowFavorMult;
}

export function getEventFocusCoinsMult(now = getNow()) {
  return getEventEffectMults(new Date(now)).focusCoinsMult;
}

/** 今日活动（横幅/日记用；无则空数组） */
export function getTodayEvents(now = getNow()) {
  return getEventsOnDate(new Date(now));
}

/** 当月整月横幅（展示层 only；无则 null） */
export function getCurrentMonthBanner(now = getNow()) {
  return getMonthBanner(new Date(now));
}

/**
 * 活动日墨墨日记（§4.1：活动日提一句）：当日首次见到该活动时写一句并落戳。
 * 落戳 = lastEventId + lastEventDay（按日区分，年年可重复触发）。
 * @returns 新触发的活动 event 或 null
 */
export function checkEventDayDiary(now = getNow()) {
  const events = getTodayEvents(now);
  if (events.length === 0) return null;
  const event = events[0];
  const day = getTodayKey(now);
  const exh = state.exhibition;
  if (exh.lastEventId === event.id && exh.lastEventDay === day) return null;
  exh.lastEventId = event.id;
  exh.lastEventDay = day;
  addDiaryEntry('special_event', { detail: t('exhDiaryEvent').replace('{event}', t(event.nameKey)) });
  saveState();
  return event;
}

// 日界 tick 自检（A1 惯例：模块内自注册订阅）
onNewDay(() => { try { checkEventDayDiary(); } catch (e) { console.warn('[exhibition] event diary error', e); } });
