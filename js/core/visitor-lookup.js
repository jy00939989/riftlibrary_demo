// @pure — testable in Node without DOM
// 访客查询纯函数：光环计算 / 语录选择 / 氛围见证
// 所有函数接收显式参数，不隐式读 state

// ── 角色定义（常量）──
export const VISITOR_DEFS = {
  shenmingyuan: { id: 'shenmingyuan', name: '沈明远', emoji: '👨‍🏫', title: '退休文学教授', category: ['哲学','历史','诗歌'], aura: { name: '学者之风', type: 'speed', category: ['哲学','历史','诗歌'], value: 0.10 } },
  chengyuan:    { id: 'chengyuan', name: '程远', emoji: '💻', title: '焦虑程序员', category: ['哲学','科学','小说'], aura: { name: '焦虑解药', type: 'streak_speed', value: 0.10 } },
  peizhou:      { id: 'peizhou', name: '裴舟', emoji: '📚', title: '前独立书店老板', category: ['小说','诗歌','散文'], aura: { name: '书商嗅觉', type: 'shop_discount', value: 0.10 } },
  jianan:       { id: 'jianan', name: '简安', emoji: '📋', title: '基层公务员', category: ['小说','历史','散文'], aura: { name: '公文背面', type: 'focus_coins', value: 0.15 } },
  jiangyoushu:  { id: 'jiangyoushu', name: '江有树', emoji: '🎓', title: '待业大学生', category: ['哲学','小说','诗歌'], aura: { name: '年轻气盛', type: 'focus_discount', value: 0.05 } },
  guyu:         { id: 'guyu', name: '谷雨', emoji: '🌾', title: '农村初中女孩', category: ['童话','寓言','诗歌'], aura: { name: '野花的力量', type: 'plant_growth', value: 0.30 } },
  qiaoyiyi:     { id: 'qiaoyiyi', name: '乔一一', emoji: '🎨', title: '叛逆富家少女', category: ['小说','诗歌','戏剧'], aura: { name: '叛逆灵感', type: 'return_favor', value: 0.30 } },
  xierugui:     { id: 'xierugui', name: '谢如归', emoji: '🏭', title: 'I人富二代', category: ['历史','传记','哲学'], aura: { name: '继承者', type: 'visitor_cap', value: 1 } },
  xiachan:      { id: 'xiachan', name: '夏蝉', emoji: '💃', title: '大龄练习生', category: ['诗歌','小说','散文'], aura: { name: '舞台之光', type: 'visual_spawn', value: 0.15 } },
  wangxiaolei:  { id: 'wangxiaolei', name: '王小磊', emoji: '📦', title: '快递员诗人', category: ['诗歌','小说','散文'], aura: { name: '波浪诗笺', type: 'poem_collect', value: 10 } }
};

// ── 借阅区等级表（常量）──
export const BORROW_LEVEL_TABLE_CORE = [
  null,
  { cap:2, returnCoins:30, favorBonus:0,  returnAtmo:1, spawnBonus:0.05 },
  { cap:3, returnCoins:35, favorBonus:10, returnAtmo:1, spawnBonus:0.08 },
  { cap:6, returnCoins:40, favorBonus:20, returnAtmo:3, spawnBonus:0.12 },
  { cap:7, returnCoins:45, favorBonus:30, returnAtmo:3, spawnBonus:0.16 },
  { cap:8, returnCoins:50, favorBonus:40, returnAtmo:5, spawnBonus:0.20 },
  { cap:9, returnCoins:55, favorBonus:50, returnAtmo:5, spawnBonus:0.25 },
  { cap:10,returnCoins:60, favorBonus:60, returnAtmo:8, spawnBonus:0.30 }
];

// ── 纯查表 ──
export function getVisitorDef(charId) {
  return VISITOR_DEFS[charId] || null;
}

// ── 纯 filter ──
export function getActiveBrowsingVisitors(visitors) {
  return (visitors || []).filter(v => v.status === 'browsing');
}

export function getActiveAuras(visitors) {
  return getActiveBrowsingVisitors(visitors)
    .map(v => VISITOR_DEFS[v.charId])
    .filter(def => def && def.aura)
    .map(def => def.aura);
}

// ── 光环加成（纯计算，接收显式 visitors 数组）──

export function getAuraSpeedBonus(bookCategory, visitors, focus) {
  let bonus = 0;
  const browsing = getActiveBrowsingVisitors(visitors);
  for (const v of browsing) {
    const def = VISITOR_DEFS[v.charId];
    if (!def || !def.aura) continue;
    if (def.aura.type === 'speed' && def.aura.category && bookCategory && def.aura.category.includes(bookCategory)) bonus += def.aura.value;
    if (def.aura.type === 'streak_speed' && (focus?.streak || 0) >= 2) bonus += def.aura.value;
  }
  return bonus;
}

export function getAuraCoinsMultiplier(visitors) {
  for (const v of getActiveBrowsingVisitors(visitors)) {
    const def = VISITOR_DEFS[v.charId];
    if (def?.aura?.type === 'focus_coins') return def.aura.value;
  }
  return 0;
}

export function getAuraShopDiscount(visitors) {
  for (const v of getActiveBrowsingVisitors(visitors)) {
    if (VISITOR_DEFS[v.charId]?.aura?.type === 'shop_discount') return VISITOR_DEFS[v.charId].aura.value;
  }
  return 0;
}

export function getAuraFocusUpgradeDiscount(visitors) {
  for (const v of getActiveBrowsingVisitors(visitors)) {
    if (VISITOR_DEFS[v.charId]?.aura?.type === 'focus_discount') return VISITOR_DEFS[v.charId].aura.value;
  }
  return 0;
}

export function getAuraVisitorCapBonus(visitors) {
  for (const v of getActiveBrowsingVisitors(visitors)) {
    if (VISITOR_DEFS[v.charId]?.aura?.type === 'visitor_cap') return VISITOR_DEFS[v.charId].aura.value;
  }
  return 0;
}

export function getAuraSpawnBonus(visitors) {
  for (const v of getActiveBrowsingVisitors(visitors)) {
    if (VISITOR_DEFS[v.charId]?.aura?.type === 'visual_spawn') return VISITOR_DEFS[v.charId].aura.value;
  }
  return 0;
}

export function getAuraPoemCollect(visitors) {
  for (const v of getActiveBrowsingVisitors(visitors)) {
    if (VISITOR_DEFS[v.charId]?.aura?.type === 'poem_collect') return true;
  }
  return false;
}

export function getAuraPlantGrowth(visitors) {
  for (const v of getActiveBrowsingVisitors(visitors)) {
    if (VISITOR_DEFS[v.charId]?.aura?.type === 'plant_growth') return VISITOR_DEFS[v.charId].aura.value;
  }
  return 0;
}

export function getAuraReturnFavorBonus(visitors) {
  for (const v of getActiveBrowsingVisitors(visitors)) {
    if (VISITOR_DEFS[v.charId]?.aura?.type === 'return_favor') return VISITOR_DEFS[v.charId].aura.value;
  }
  return 0;
}

// ── 还书语录（纯查表 + 模板替换）──
// RETURN_QUOTES 数据量较大，留在 js/visitors.js 并由 wrapper 透传
// pickReturnQuote 在 visitors.js 已提升为 export，可直接 re-export

// ── 氛围见证（纯查表）──
// STAGE_WITNESS 数据量较大，留在 js/visitors.js

export function getStageWitnessesCore(stage, visitors, stageWitnessData) {
  const witnesses = [];
  const browsing = getActiveBrowsingVisitors(visitors);
  for (const v of browsing) {
    const text = stageWitnessData[v.charId]?.[stage];
    if (text) witnesses.push({ visitor: v, text });
  }
  return witnesses;
}
