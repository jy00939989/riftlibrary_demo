// 书籍灾难事件：鼠患 / 潮湿霉斑 / 火灾
// 触发入口：app.js tickVisitors（与台风同级）；预防：标志牌 + 借阅区等级 + 氛围阶段
// 原则（book-damage-events-plan §二）：典藏版/修复中免疫、单次损失 ≤30%、叙事优先、可设置关闭
import { state, saveState } from '../state.js';
import { addHistory, addAtmosphere } from '../storage.js';
import { t } from '../i18n/terms.js';
import { BOOKS } from '../../data/books.js';
import { addDiaryEntry } from '../diary.js';
import { getSettings } from '../settings.js';
import { hasSignboard } from '../shop.js';
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

const DAY = 1000 * 60 * 60 * 24;

// ========== 工具 ==========

/** 免疫规则：典藏版（indestructible）、修缮箱中、已在损毁修复中的书不再受灾 */
function pickVictims(maxCount) {
  const eligible = Object.entries(state.books || {}).filter(([bookId, bs]) => {
    if (!bs || bs.status !== 'completed' || bs.damaged) return false;
    if ((bs.copiedWords || 0) <= 0) return false;
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

/** 套用损毁：与还书损毁同语义（visitors.js 判定 1） */
function applyDamage(bs, book, ratio) {
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

// ========== 入口 ==========

/**
 * 每次 tick 依次判定三类书籍灾难（设置里可整体关闭）。
 * @returns {Array} 命中的事件结果（可能多个，空数组=无事件）
 */
export function tryTriggerBookDisasters() {
  if (typeof state !== 'object' || !state.books) return [];
  if (getSettings().disastersEnabled === false) return [];

  const results = [];
  const rat = triggerRat();
  if (rat) results.push(rat);
  const mold = triggerMold();
  if (mold) results.push(mold);
  const fire = triggerFire();
  if (fire) results.push(fire);

  if (results.length) {
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
  };
  const DESC = {
    rat: t('disasterRatDesc'),
    mold: t('disasterMoldDesc'),
    fire: t('disasterFireDesc'),
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
      </div>
      <p class="text-[11px] text-ink-light/70 mb-3">${t('disasterRepairHint')}</p>
      <button class="disaster-ok-btn px-6 py-2 bg-wood text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all">${t('confirm')}</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('.disaster-ok-btn').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}
