// 访客纪念收集模块 —— 收集访客留下的便签与事件，便于重复观看
// 纯逻辑层，不碰 DOM；数据持久化在 state.visitorMemory（随主存档自动保存）
import { state, saveState } from './state.js';
import { t } from './i18n/terms.js';
import { VISITOR_NARRATIVES } from '../data/visitor-events.js';
import { VISITOR_DEFS } from './visitors.js';

function ensure() {
  if (!state.visitorMemory) state.visitorMemory = { items: [] };
  if (!state.visitorMemory.items) state.visitorMemory.items = [];
  return state.visitorMemory;
}

// 一次性特殊事件总数（完成度分母补充）
const SPECIAL_EVENT_TOTAL = 11; // 沈明远赠书1 + 裴舟荐书1 + 裴舟补稿1 + 王小磊诗笺1 + 通用事件×7

// 每个角色"理论上可收集"的便签 + 事件总数（完成度分母）
let _totalsCache = null;
function getTotals() {
  if (_totalsCache) return _totalsCache;
  const perChar = {};
  let grand = 0;
  Object.entries(VISITOR_NARRATIVES).forEach(([charId, nar]) => {
    let n = 0;
    if (nar.common) {
      n += (nar.common.base?.length || 0)
         + (nar.common.expand1?.length || 0)
         + (nar.common.expand2?.length || 0);
    }
    if (nar.postRareCommon) n += nar.postRareCommon.length || 0;
    n += (nar.occasional?.length || 0);
    if (nar.rare) n += 1;
    if (nar.postRare) n += 1;
    if (nar.postRareOccasional) n += nar.postRareOccasional.length || 0;
    perChar[charId] = n;
    grand += n;
  });
  grand += SPECIAL_EVENT_TOTAL;
  _totalsCache = { perChar, grand };
  return _totalsCache;
}

// 收集一条；按 charId:eventId 去重。返回 true 表示本次为"新收集"
export function collectVisitorItem({ charId, kind, eventId, title, titleKey, text, textKey, vars, rarity, charName, charEmoji, markNew = true }) {
  const vm = ensure();
  const uid = `${charId}:${eventId}`;
  const existing = vm.items.find(i => i.uid === uid);
  if (existing) {
    existing.lastSeen = Date.now();
    return false;
  }
  const def = VISITOR_DEFS[charId] || {};
  vm.items.unshift({
    uid,
    charId,
    charName: charName || def.name || charId,
    charEmoji: charEmoji || def.emoji || '👤',
    kind,                                  // 'note' | 'event'
    eventId,
    title: title || null,
    titleKey: titleKey || null,
    text: text || '',
    textKey: textKey || null,
    vars: vars || null,
    rarity: rarity || null,                // occasional | rare | postRare | postRareOccasional | special | null
    firstSeen: Date.now(),
    lastSeen: Date.now(),
    isNew: markNew
  });
  saveState();
  return true;
}

// 按角色分组，按 VISITOR_NARRATIVES 顺序排列
export function getVisitorMemory() {
  const vm = ensure();
  const groups = {};
  vm.items.forEach(i => {
    if (!groups[i.charId]) {
      groups[i.charId] = { charId: i.charId, charName: i.charName, charEmoji: i.charEmoji, notes: [], events: [], count: 0 };
    }
    const g = groups[i.charId];
    g.count++;
    if (i.kind === 'note') g.notes.push(i); else g.events.push(i);
  });
  return Object.keys(VISITOR_NARRATIVES)
    .filter(id => groups[id])
    .map(id => groups[id]);
}

export function getVisitorMemoryNewCount() {
  const vm = ensure();
  return vm.items.filter(i => i.isNew).length;
}

export function markSeen(uid) {
  const vm = ensure();
  const it = vm.items.find(i => i.uid === uid);
  if (it && it.isNew) { it.isNew = false; saveState(); }
}

export function clearAllNew() {
  const vm = ensure();
  let changed = false;
  vm.items.forEach(i => { if (i.isNew) { i.isNew = false; changed = true; } });
  if (changed) saveState();
}

// 完成度统计（供收集面板使用）
export function getVisitorStats() {
  const vm = ensure();
  const totals = getTotals();
  const collected = vm.items.length;
  const perChar = Object.keys(totals.perChar).map(charId => {
    const def = VISITOR_DEFS[charId] || {};
    const c = vm.items.filter(i => i.charId === charId).length;
    return {
      charId,
      name: def.name || charId,
      emoji: def.emoji || '👤',
      collected: c,
      total: totals.perChar[charId]
    };
  });
  return {
    collected,
    total: totals.grand,
    percent: totals.grand > 0 ? Math.round((collected / totals.grand) * 100) : 0,
    perChar
  };
}

// 老存档回溯：根据 state.visitorNarratives 中已触发的事件，补录到 visitorMemory
export function retroCollectVisitorMemories() {
  const vm = ensure();
  let changed = false;

  Object.entries(VISITOR_NARRATIVES).forEach(([charId, narrative]) => {
    const ns = state.visitorNarratives?.[charId];
    if (!ns) return;

    const add = (opts) => {
      if (collectVisitorItem({ ...opts, charId, markNew: false })) changed = true;
    };

    // 1. 常层便签
    const commonPool = [
      ...(narrative.common?.base || []),
      ...(narrative.common?.expand1 || []),
      ...(narrative.common?.expand2 || [])
    ];
    (ns.commonTriggered || []).forEach(id => {
      const item = commonPool.find(e => e.id === id);
      if (item) add({ kind: 'note', eventId: id, text: item.text });
    });

    // 2. 偶层事件
    (ns.occasionalCompleted || []).forEach(id => {
      const item = narrative.occasional?.find(o => o.id === id);
      if (item) add({ kind: 'event', eventId: id, title: item.title, text: item.text, rarity: 'occasional' });
    });

    // 3. 稀层事件
    if (ns.rareTriggered && narrative.rare) {
      add({
        kind: 'event',
        eventId: 'rare',
        title: narrative.rare.title,
        text: `${narrative.rare.text}\n\n${narrative.rare.letter?.title || ''}\n${narrative.rare.letter?.text || ''}`,
        rarity: 'rare'
      });
    }

    // 4. 终局事件
    if (ns.postRareTriggered && narrative.postRare) {
      add({
        kind: 'event',
        eventId: 'postRare',
        title: narrative.postRare.title,
        text: narrative.postRare.text,
        rarity: 'postRare'
      });
    }

    // 5. 终局后常层便签
    (ns.postRareCommonTriggered || []).forEach(id => {
      const item = narrative.postRareCommon?.find(e => e.id === id);
      if (item) add({ kind: 'note', eventId: id, text: item.text, rarity: 'postRare' });
    });

    // 6. 终局后偶层事件
    (ns.postRareOccasionalCompleted || []).forEach(id => {
      const item = narrative.postRareOccasional?.find(o => o.id === id);
      if (item) add({ kind: 'event', eventId: id, title: item.title, text: item.text, rarity: 'postRareOccasional' });
    });
  });

  if (changed) saveState();
  return changed;
}

// 渲染辅助：按当前语言解析 title/text（优先 textKey/titleKey + vars）
function fillTemplate(template, vars) {
  if (!template) return '';
  let s = template;
  for (const [k, v] of Object.entries(vars || {})) {
    s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return s;
}

export function getVisitorItemTitle(item) {
  if (item.titleKey) return fillTemplate(t(item.titleKey), item.vars);
  return item.title || '';
}

export function getVisitorItemText(item) {
  if (item.textKey) return fillTemplate(t(item.textKey), item.vars);
  return item.text || '';
}
