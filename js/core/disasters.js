// 书籍灾难事件：鼠患 / 潮湿霉斑 / 火灾 / 蛀虫 / 墨水打翻 / 积灰 / 窃书 / 台风波及
// 触发入口：app.js tickVisitors（与台风同级）；墨水打翻走 focus-actions 放弃链；台风波及挂台风结果
// 预防：标志牌 + 借阅区等级 + 氛围阶段
// 原则（book-damage-events-plan §二）：典藏版/修复中免疫、单次损失 ≤30%、叙事优先、可设置关闭
// 批次二（2026-09-20 图南「清了剩余」）：蛀虫/墨水/积灰/窃书/台风波及五件全落地
import { state, saveState } from '../state.js';
import { addHistory, addAtmosphere } from '../storage.js';
import { t } from '../i18n/terms.js';
import { BOOKS } from '../../data/books.js';
import { addDiaryEntry } from '../diary.js';
import { getSettings } from '../settings.js';
import { hasSignboard } from '../shop.js';
import { grantRestorationRoom } from '../capacity.js';
import { getAtmosphereStage } from '../../data/atmosphere.js';

// ========== 参数 ==========
// 单位：每分钟判定概率（tick 间隔 60s）；冷却单位：天
const RAT = {
  probability: 0.0001,       // 基础：前期略高、后期靠借阅区等级压低
  cooldownDays: 5,
  lossMin: 0.05, lossMax: 0.10,
  signboardDef: 0.85,        // 猫馆长：概率 -85%
  borrowLevelFactor: 0.1,    // 每级 -10%（下限 30%）
  borrowLevelFactorMin: 0.3,
};
const MOLD = {
  probability: 0.00012,      // 乘以氛围阶段系数（越破越潮）
  cooldownDays: 2,
  lossMin: 0.05, lossMax: 0.10,
  maxBooks: 2,
  signboardDef: 0.75,        // 除湿炭包：概率 -75%
  stageFactorMin: 0.1,       // 星辰期也有微量概率
};
const FIRE = {
  probability: 0.00004,      // 全馆稀有灾难
  cooldownDays: 12,
  lossMin: 0.20, lossMax: 0.30,
  maxBooks: 3,
  signboardDef: 0.88,        // 防火标识：概率 -88%
  atmospherePenalty: 15,
};
// ── 批次二 ──
const WORM = {
  probability: 0.0002,       // 基础 × 冷门系数（越久未借越高，封顶 ×3）
  cooldownDays: 3,
  graceDays: 8,              // 超过 N 天未被借阅才算冷门
  signboardDef: 0.70,        // 樟木书签：概率 -70%
  maxLevel: 3,               // 蛀虫等级：叠加损失封顶 15%
  maxRatio: 0.15,
};
const INK = {
  probability: 0.06,         // 每次放弃专注时判定
  cooldownDays: 1,
  lossMin: 0.03, lossMax: 0.05,  // 只削已抄字数，不打 damaged 标
};
const DUST = {
  probability: 0.0009,       // 低烈度高频率：只挡借阅，不损字数
  cooldownHours: 8,
  maxConcurrent: 3,
  autoClearDays: 3,          // 到期风把灰吹走，自动恢复
};
const THEFT = {
  probability: 0.00002,      // 比火灾更稀有的全馆事件
  cooldownDays: 20,
  returnDays: 7,             // 7 天后自动寻回（损失 15% 已抄字数）
  returnLoss: 0.15,
  signboardDef: 0.60,        // 猫馆长兼任保安：概率 -60%
};
const TYPHOON_BOOKS = {
  hitChance: 0.4,            // 每次台风过境，书籍被波及的条件概率
  lossMin: 0.10, lossMax: 0.20,
  maxBooks: 2,
  signboardDef: 0.80,        // 密封窗棂：概率 -80%
  helperChance: 0.3,         // 每位在场访客（browsing）抢收窗户的概率
  windowSlots: [0, 4],       // 窗边位定义：书架每行 5 列网格的首尾两槽（两端靠窗）
};

const DAY = 1000 * 60 * 60 * 24;

// ========== 工具 ==========

/** 免疫规则：典藏版（indestructible）、修缮箱中、已在损毁修复中的书不再受灾；失窃中的书也不在馆内 */
function pickVictims(maxCount) {
  const eligible = Object.entries(state.books || {}).filter(([bookId, bs]) => {
    if (!bs || bs.status !== 'completed' || bs.damaged) return false;
    if ((bs.copiedWords || 0) <= 0) return false;
    if (bs.stolenAt) return false;
    const book = BOOKS[bookId];
    if (!book || book.indestructible) return false;
    if ((state.restorationBox || []).includes(bookId)) return false;
    return true;
  });
  // 洗牌后取前 N
  for (let i = eligible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
  }
  return eligible.slice(0, maxCount).map(([bookId, bs]) => ({ bookId, bs, book: BOOKS[bookId] }));
}

/** 冷门书：completed、未受损、未失窃、超过 graceDays 天未被借阅（从未借阅=最冷门） */
function pickColdBooks(graceDays) {
  const now = getNow();
  return Object.entries(state.books || {})
    .filter(([bookId, bs]) => {
      if (!bs || bs.status !== 'completed' || bs.damaged || bs.stolenAt) return false;
      const book = BOOKS[bookId];
      if (!book || book.indestructible) return false;
      if ((state.restorationBox || []).includes(bookId)) return false;
      const lastBorrow = bs.lastBorrowedAt || 0;
      return (now - lastBorrow) / DAY >= graceDays;
    })
    .map(([bookId, bs]) => ({ bookId, bs, book: BOOKS[bookId], days: (now - (bs.lastBorrowedAt || 0)) / DAY }))
    .sort((a, b) => b.days - a.days);
}

/** 套用损毁：与还书损毁同语义（visitors.js 判定 1） */
function applyDamage(bs, book, ratio) {
  // 首次受灾自动免费开放修复室（2026-09-21 图南拍板：撤销 300 币解锁，杜绝金币软锁）
  grantRestorationRoom();
  const loss = Math.round((bs.copiedWords || 0) * ratio);
  bs.damaged = true;
  bs.repairWords = loss;
  bs.repairProgress = 0;
  if (loss > 0) {
    bs.copiedWords = Math.max(0, (bs.copiedWords || 0) - loss);
    if (bs.status === 'completed' && book && bs.copiedWords < book.totalWords) {
      bs.status = 'copying';
    }
  }
  return loss;
}

function inCooldown(lastTime, cooldownDays) {
  if (!lastTime) return false;
  return (getNow() - lastTime) / DAY < cooldownDays;
}

function getNow() { return Date.now(); }

function roll(baseProbability, signboardId, signboardDef) {
  let p = baseProbability;
  if (signboardId && hasSignboard(signboardId)) p *= (1 - signboardDef);
  return Math.random() < p;
}

const randRange = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(randRange(min, max + 1));

// ========== 三个事件 ==========

function triggerRat() {
  const victims = pickVictims(1);
  if (!victims.length) return null;

  const borrowLv = state.library.borrowLevel || 0;
  const lvFactor = Math.max(RAT.borrowLevelFactorMin, 1 - borrowLv * RAT.borrowLevelFactor);
  const p = RAT.probability * lvFactor * (hasSignboard('cat_chief') ? 1 - RAT.signboardDef : 1);
  if (Math.random() >= p) return null;
  if (inCooldown(state.lastRatTime, RAT.cooldownDays)) return null;
  state.lastRatTime = getNow();

  const v = victims[0];
  const ratio = randRange(RAT.lossMin, RAT.lossMax);
  const loss = applyDamage(v.bs, v.book, ratio);
  const title = v.book.title;
  addHistory('disaster', `🐭 鼠患！夜里有老鼠啃了《${title}》`, `损失${loss.toLocaleString()}字，需专注修复`);
  addDiaryEntry('special_event', { detail: `🐭 昨夜有老鼠从窗缝钻进来，把《${title}》的书角啃成了月牙形。墨墨说，猫的编制问题必须提上日程了。` });
  return {
    kind: 'rat', emoji: '🐭',
    lines: [t('disasterBookLossLine').replace('{title}', title).replace('{loss}', loss.toLocaleString())],
    saveBy: null,
  };
}

function triggerMold() {
  const victims = pickVictims(MOLD.maxBooks);
  if (!victims.length) return null;

  const stage = getAtmosphereStage(state.library.atmosphere || 0);
  const stageFactor = Math.max(MOLD.stageFactorMin, (6 - (stage?.level || 1)) / 5);
  if (!roll(MOLD.probability * stageFactor, 'dehumidifier', MOLD.signboardDef)) return null;
  if (inCooldown(state.lastMoldTime, MOLD.cooldownDays)) return null;
  state.lastMoldTime = getNow();

  const lines = [];
  victims.forEach(v => {
    const ratio = randRange(MOLD.lossMin, MOLD.lossMax);
    const loss = applyDamage(v.bs, v.book, ratio);
    lines.push(t('disasterBookLossLine').replace('{title}', v.book.title).replace('{loss}', loss.toLocaleString()));
  });
  addHistory('disaster', `🌧️ 潮湿霉斑侵蚀了 ${victims.length} 本书`, '书页长出灰绿色霉斑，需专注修复');
  addDiaryEntry('special_event', { detail: `🌧️ 空气太潮了，书页边缘长出灰绿色的霉斑，像谁在书上画了一幅地图。${victims.map(v => `《${v.book.title}》`).join('、')}都受了波及。` });
  return { kind: 'mold', emoji: '🌧️', lines, saveBy: null };
}

function triggerFire() {
  const victims = pickVictims(FIRE.maxBooks);
  if (!victims.length) return null;
  if (!roll(FIRE.probability, 'fire_notice', FIRE.signboardDef)) return null;
  if (inCooldown(state.lastFireTime, FIRE.cooldownDays)) return null;
  state.lastFireTime = getNow();

  const lines = [];
  victims.forEach(v => {
    const ratio = randRange(FIRE.lossMin, FIRE.lossMax);
    const loss = applyDamage(v.bs, v.book, ratio);
    lines.push(t('disasterBookLossLine').replace('{title}', v.book.title).replace('{loss}', loss.toLocaleString()));
  });
  // addAtmosphere 只封上限不封下限，这里钳制避免氛围被扣成负数
  addAtmosphere(-Math.min(FIRE.atmospherePenalty, state.library.atmosphere || 0));
  addHistory('disaster', `🔥 火灾！${victims.length} 本书被火舌舔伤`, `损失${FIRE.atmospherePenalty}氛围，需专注修复`);
  addDiaryEntry('special_event', { detail: `🔥 烛台倒了。等你赶到时，焦痕已经爬上了${victims.map(v => `《${v.book.title}》`).join('、')}的脊背。墨墨抱着水桶，羽毛都熏黑了。` });
  return { kind: 'fire', emoji: '🔥', lines, saveBy: null, atmospherePenalty: FIRE.atmospherePenalty };
}

// ========== 批次二：蛀虫 / 墨水打翻 / 积灰 / 窃书 / 台风波及 ==========

function triggerWorm() {
  const colds = pickColdBooks(WORM.graceDays);
  if (!colds.length) return null;
  const v = colds[0]; // 最冷门的一本
  const coldFactor = Math.min(3, 1 + v.days / 10);
  if (!roll(WORM.probability * coldFactor, 'camphor_bookmark', WORM.signboardDef)) return null;
  if (inCooldown(state.lastWormTime, WORM.cooldownDays)) return null;
  state.lastWormTime = getNow();

  const level = Math.min(WORM.maxLevel, (v.bs.wormLevel || 0) + 1);
  v.bs.wormLevel = level;
  const ratio = Math.min(WORM.maxRatio, randRange(0.01, 0.03) + (level - 1) * 0.04);
  const loss = applyDamage(v.bs, v.book, ratio);
  const title = v.book.title;
  addHistory('disaster', `🐛 蛀虫侵蚀了《${title}》`, `损失${loss.toLocaleString()}字（${level}级蛀蚀），需专注修复`);
  addDiaryEntry('special_event', { detail: `🐛 《${title}》的书页间出现了细小的蛀洞，像谁用针尖戳了一片星空。${level >= 2 ? '蛀蚀在加深，得尽快修复了。' : '它还静静地躺在冷门架位上，等着被翻开。'}` });
  return {
    kind: 'worm', emoji: '🐛',
    lines: [t('disasterBookLossLine').replace('{title}', title).replace('{loss}', loss.toLocaleString())],
    saveBy: null,
  };
}

/** 墨水打翻：提前结束番茄钟/倒计时时低概率触发（focus-actions handleCompleteFocus 调用）。
 *  只削当前书已抄字数，不打 damaged 标。 */
export function maybeTriggerInkSpill(bookId) {
  if (typeof state !== 'object' || !state.books) return null;
  if (getSettings().disastersEnabled === false) return null;
  if (inCooldown(state.lastInkTime, INK.cooldownDays)) return null;

  const bs = bookId && state.books[bookId];
  const book = bookId && BOOKS[bookId];
  if (!bs || !book || (bs.copiedWords || 0) <= 0) return null;
  if (Math.random() >= INK.probability) return null;
  state.lastInkTime = getNow();

  const loss = Math.max(1, Math.round(bs.copiedWords * randRange(INK.lossMin, INK.lossMax)));
  bs.copiedWords = Math.max(0, bs.copiedWords - loss);
  if (bs.status === 'completed' && bs.copiedWords < book.totalWords) bs.status = 'copying';
  saveState();
  addHistory('disaster', `🖋️ 墨水打翻，污了《${book.title}》`, `损失${loss.toLocaleString()}字，无需修复，重抄即可`);
  addDiaryEntry('special_event', { detail: `🖋️ 提前收笔的那一刻，手肘碰翻了墨水瓶。墨迹在《${book.title}》的纸页上洇开一朵黑色的花。墨墨递来吸墨纸，什么也没说。` });
  const result = {
    kind: 'ink', emoji: '🖋️',
    lines: [t('disasterBookLossLine').replace('{title}', book.title).replace('{loss}', loss.toLocaleString())],
    saveBy: null,
  };
  showDisasterPopup(result);
  return result;
}

function triggerDust() {
  const concurrent = Object.values(state.books || {}).filter(bs => bs && bs.dustyAt).length;
  if (concurrent >= DUST.maxConcurrent) return null;
  const candidates = pickVictims(99).filter(v => !v.bs.dustyAt);
  if (!candidates.length) return null;
  if (!roll(DUST.probability, null, 0)) return null;
  if (state.lastDustTime && (getNow() - state.lastDustTime) / (1000 * 60 * 60) < DUST.cooldownHours) return null;

  const v = candidates[Math.floor(Math.random() * candidates.length)];
  state.lastDustTime = getNow();
  v.bs.dustyAt = getNow();
  const title = v.book.title;
  addHistory('disaster', `🌫️ 《${title}》落了一层薄灰`, '访客暂不愿借它，掸灰后恢复');
  addDiaryEntry('special_event', { detail: `🌫️ 《${title}》的书脊上落了一层薄灰，看来很久没人翻开它了。也许该去书架掸一掸。` });
  return { kind: 'dust', emoji: '🌫️', lines: [t('disasterDustLine').replace('{title}', title)], saveBy: null };
}

function triggerTheft() {
  const victims = pickVictims(1);
  if (!victims.length) return null;
  if (!roll(THEFT.probability, 'cat_chief', THEFT.signboardDef)) return null;
  if (inCooldown(state.lastTheftTime, THEFT.cooldownDays)) return null;
  state.lastTheftTime = getNow();

  const v = victims[0];
  const now = getNow();
  v.bs.stolenAt = now;
  v.bs.stolenReturnAt = now + THEFT.returnDays * DAY;
  const title = v.book.title;
  addHistory('disaster', `🥷 《${title}》失窃了！`, `${THEFT.returnDays}天后寻回，期间无法借阅`);
  addDiaryEntry('special_event', { detail: `🥷 今早开馆，《${title}》不在架位上。窗锁完好，现场只留下一片黑色的羽毛。墨墨把图书馆翻了个底朝天，在借阅登记簿夹页发现一张字条：「借去看看，几日后奉还。」` });
  return { kind: 'theft', emoji: '🥷', lines: [t('disasterTheftLine').replace('{title}', title).replace('{days}', THEFT.returnDays)], saveBy: null };
}

/** 窗边位书架上的受灾候选：书架每行 5 列，首尾两槽定义为窗边位（两端靠窗） */
function pickWindowShelfVictims(maxCount) {
  const slots = new Set();
  for (const shelf of (state.library.shelves || [])) {
    if (!Array.isArray(shelf)) continue;
    TYPHOON_BOOKS.windowSlots.forEach(idx => {
      const id = shelf[idx];
      if (id) slots.add(id);
    });
  }
  if (!slots.size) return [];
  const eligible = Object.entries(state.books || {}).filter(([bookId, bs]) => {
    if (!slots.has(bookId)) return false;
    if (!bs || bs.status !== 'completed' || bs.damaged || bs.stolenAt) return false;
    if ((bs.copiedWords || 0) <= 0) return false;
    const book = BOOKS[bookId];
    if (!book || book.indestructible) return false;
    if ((state.restorationBox || []).includes(bookId)) return false;
    return true;
  });
  for (let i = eligible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
  }
  return eligible.slice(0, maxCount).map(([bookId, bs]) => ({ bookId, bs, book: BOOKS[bookId] }));
}

/** 台风过境时波及窗边书架（app.js 在台风发生后调用）。
 *  阶段≥5 建筑稳固免疫；每位在场访客（browsing）都有概率抢收窗户，每人护住一本。 */
export function tryTriggerTyphoonBookDamage(typhoonResult) {
  if (typeof state !== 'object' || !state.books) return null;
  if (getSettings().disastersEnabled === false) return null;
  if (!typhoonResult) return null;
  if (Math.random() >= TYPHOON_BOOKS.hitChance) return null;
  const stage = getAtmosphereStage(state.library.atmosphere || 0);
  const stageLv = stage?.level || 1;
  if (stageLv >= 5) return null;                        // 建筑稳固：滴水不漏
  if (hasSignboard('sealed_window') && Math.random() < TYPHOON_BOOKS.signboardDef) return null;

  // 全场访客援手：每人独立概率抢收窗户，护住一本书（图南 2026-09-20 修订：不只谷雨）
  const browsing = (state.visitors || []).filter(v => v && v.status === 'browsing');
  const helpers = browsing.filter(() => Math.random() < TYPHOON_BOOKS.helperChance);
  const savedCount = Math.min(TYPHOON_BOOKS.maxBooks, helpers.length);
  const victimCount = TYPHOON_BOOKS.maxBooks - savedCount;
  if (victimCount <= 0) {
    addHistory('disaster', `🌪️ 台风过境，窗边书架安然无恙`, `${helpers.length} 位访客抢收了窗户`);
    addDiaryEntry('special_event', { detail: `🌪️ 强台风过境，雨点砸得窗户哐哐响。${helpers.map(h => h.name || h.charId).join('、')}赶在雨渗进来前合力关紧了所有窗棂。窗边书架，一本没湿。` });
    return { kind: 'typhoon_books', emoji: '🌪️', lines: [], saveBy: helpers.length, fullySaved: true };
  }

  const victims = pickWindowShelfVictims(victimCount);
  if (!victims.length) return null;

  const lines = [];
  victims.forEach(v => {
    const ratio = randRange(TYPHOON_BOOKS.lossMin, TYPHOON_BOOKS.lossMax);
    const loss = applyDamage(v.bs, v.book, ratio);
    lines.push(t('disasterBookLossLine').replace('{title}', v.book.title).replace('{loss}', loss.toLocaleString()));
  });
  addHistory('disaster', `🌪️ 台风渗雨，泡皱了 ${victims.length} 本书`, savedCount ? `${helpers.length} 位访客抢收窗户，护住了 ${savedCount} 本` : '低阶馆舍窗棂不牢，需专注修复');
  addDiaryEntry('special_event', { detail: `🌪️ 强台风过境，雨从窗框渗进来，泡皱了${victims.map(v => `《${v.book.title}》`).join('、')}的最后几页。${savedCount ? `${helpers.map(h => h.name || h.charId).join('、')}死死护住了另外几扇窗。` : '风把整扇窗拍得哐哐响，像有人在敲一个回不去的家。'}` });
  return { kind: 'typhoon_books', emoji: '🌪️', lines, saveBy: savedCount, fullySaved: false };
}

/** 到期状态清扫：积灰风吹自净 / 失窃书自动寻回（带 15% 损失）。每次 tick 入口先扫。 */
function sweepExpiredBookStates() {
  const now = getNow();
  let dirty = false;
  for (const [bookId, bs] of Object.entries(state.books || {})) {
    if (!bs) continue;
    if (bs.dustyAt && (now - bs.dustyAt) / DAY >= DUST.autoClearDays) {
      delete bs.dustyAt;
      const book = BOOKS[bookId];
      addDiaryEntry('special_event', { detail: `🌫️ 连日的风把《${book ? book.title : '那本书'}》书脊上的灰吹走了，书页重新露出干净的底色。` });
      dirty = true;
    }
    if (bs.stolenReturnAt && now >= bs.stolenReturnAt) {
      const book = BOOKS[bookId];
      delete bs.stolenAt;
      delete bs.stolenReturnAt;
      const loss = book ? applyDamage(bs, book, THEFT.returnLoss) : 0;
      addHistory('disaster', `🥷 《${book ? book.title : bookId}》被送回来了`, `夹在还书箱里，损失${loss.toLocaleString()}字，需专注修复`);
      addDiaryEntry('special_event', { detail: `🥷 还书箱里多了一本《${book ? book.title : bookId}》，夹着那片黑色羽毛。书页被翻得起了毛边，角落里有行小字：「好书。可惜不是我的。」` });
      dirty = true;
    }
  }
  return dirty;
}

/** 玩家手动掸灰（书架卡按钮）。 */
export function cleanBookDust(bookId) {
  const bs = state.books?.[bookId];
  if (!bs || !bs.dustyAt) return false;
  delete bs.dustyAt;
  const book = BOOKS[bookId];
  addDiaryEntry('special_event', { detail: `🌫️ 你用软布掸去《${book ? book.title : bookId}》上的灰，阳光落在书脊上，像给它重新上了色。` });
  saveState();
  return true;
}

// ========== 入口 ==========

/**
 * 每次 tick 依次判定书籍灾难（设置里可整体关闭）。
 * @param {object|null} typhoonResult 同 tick 内的台风结果（有则附加判定窗边书架波及）
 * @returns {Array} 命中的事件结果（可能多个，空数组=无事件）
 */
export function tryTriggerBookDisasters(typhoonResult = null) {
  if (typeof state !== 'object' || !state.books) return [];
  if (getSettings().disastersEnabled === false) return [];

  const results = [];
  const swept = sweepExpiredBookStates();
  const rat = triggerRat();
  if (rat) results.push(rat);
  const mold = triggerMold();
  if (mold) results.push(mold);
  const fire = triggerFire();
  if (fire) results.push(fire);
  const worm = triggerWorm();
  if (worm) results.push(worm);
  const dust = triggerDust();
  if (dust) results.push(dust);
  const theft = triggerTheft();
  if (theft) results.push(theft);
  const typhoonBooks = tryTriggerTyphoonBookDamage(typhoonResult);
  if (typhoonBooks) results.push(typhoonBooks);

  if (results.length || swept) {
    saveState();
    results.forEach(showDisasterPopup);
  }
  return results;
}

// ========== 弹窗 ==========

function showDisasterPopup(result) {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('book-disaster-popup');
  if (existing) existing.remove();

  const TITLES = {
    rat: t('disasterRatTitle'),
    mold: t('disasterMoldTitle'),
    fire: t('disasterFireTitle'),
    worm: t('disasterWormTitle'),
    ink: t('disasterInkTitle'),
    dust: t('disasterDustTitle'),
    theft: t('disasterTheftTitle'),
    typhoon_books: t('disasterTyphoonBooksTitle'),
  };
  const DESC = {
    rat: t('disasterRatDesc'),
    mold: t('disasterMoldDesc'),
    fire: t('disasterFireDesc'),
    worm: t('disasterWormDesc'),
    ink: t('disasterInkDesc'),
    dust: t('disasterDustDesc'),
    theft: t('disasterTheftDesc'),
    typhoon_books: t('disasterTyphoonBooksDesc'),
  };

  const overlay = document.createElement('div');
  overlay.id = 'book-disaster-popup';
  overlay.className = 'fixed inset-0 z-[300] flex items-center justify-center bg-ink/70 p-4';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-2xl p-6 max-w-sm w-full text-center border-2 border-red-800/30 shadow-2xl animate-scale-in">
      <div class="text-5xl mb-3">${result.emoji}</div>
      <h3 class="font-display text-xl font-bold text-ink mb-2">${TITLES[result.kind] || result.emoji}</h3>
      <p class="text-sm text-ink-light leading-relaxed mb-3">${DESC[result.kind] || ''}</p>
      <div class="text-left bg-white/50 rounded-lg p-3 mb-3 space-y-1">
        ${result.lines.map(l => `<p class="text-xs text-ink">📕 ${l}</p>`).join('')}
        ${result.atmospherePenalty ? `<p class="text-xs text-red-700 font-bold">✨ ${t('disasterAtmosphereLoss').replace('{n}', result.atmospherePenalty)}</p>` : ''}
        ${result.saveBy ? `<p class="text-xs text-magic-blue font-bold">🌾 ${t('disasterTyphoonHelpersLine').replace('{n}', result.saveBy)}</p>` : ''}
      </div>
      <p class="text-[11px] text-ink-light/70 mb-3">${t('disasterRepairHint')}</p>
      <button class="disaster-ok-btn px-6 py-2 bg-wood text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all">${t('confirm')}</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('.disaster-ok-btn').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}
