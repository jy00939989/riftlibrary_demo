// 缮写室底版皮肤 + 书写速度档（2026-10-30 图南拍板）
// 玩家反馈：缮写动画文字出现速度希望可调；皮肤四款（哥特之夜/中世纪手抄本/中国风/油画风）。
// 技术口径：皮肤 = CSS 变量注入（data/writing-skin 属性），底图槽位 visual/writing/skin_<id>_<variant>_pages.png
// 缺图时 CSS 手绘兜底，图到即换；竖排（中国风二期）已记入 riftlib-planner（t_20261030_vertical_writing）。
// 变体命名（2026-10-30 图南定）：每款内页都有独立名字，同风格再出新内页=新变体名——
// 哥特风·银蔓 yinman / 中世纪·泥金 nijin / 中国风·素雅 suya（油画风本次无图不上架）。

import { isFestivalActive } from './festival.js';

// ── 书写速度档（ms/字；BASE_SPEED 150 为现状基准）──
export const WRITING_SPEEDS = { calm: 230, normal: 150, swift: 90 };
export const DEFAULT_WRITING_SPEED = 'normal';
/** 读取速度档对应 ms；未设置/非法键回退标准档 */
export function getWritingSpeedMs(gear, now = Date.now()) {
  return WRITING_SPEEDS[gear] || WRITING_SPEEDS[DEFAULT_WRITING_SPEED];
}

// ── 皮肤定义 ──
// unlock.type: free=初始 · festival=窗口内自动启用并永久保留 · restoration=修复室≥level ·
//              exhibition=展览厅建成 · purchase=智慧之光直购（价入 unlock.price）
export const DEFAULT_WRITING_SKIN = 'parchment';

export const WRITING_SKINS = [
  { id: 'parchment',  nameKey: 'writingSkinParchment',  unlock: { type: 'free' } },
  { id: 'gothic',     nameKey: 'writingSkinGothic',     unlock: { type: 'festival', festivalKey: 'gothicNight2026' } },
  { id: 'manuscript', nameKey: 'writingSkinManuscript', unlock: { type: 'restoration', level: 3 } },
  { id: 'chinese',    nameKey: 'writingSkinChinese',    unlock: { type: 'exhibition' } },
  { id: 'oilpaint',   nameKey: 'writingSkinOilpaint',   unlock: { type: 'purchase', price: 800 } }
];

export function getWritingSkinDef(id) {
  return WRITING_SKINS.find(s => s.id === id) || null;
}

/** 皮肤是否已解锁（festival 以「窗口内获得过」为永久解锁凭据，见 resolveWritingSkin 的入账动作） */
export function isWritingSkinUnlocked(def, state, now = Date.now()) {
  if (!def) return false;
  const u = def.unlock;
  switch (u.type) {
    case 'free': return true;
    case 'festival': return !!(state.writingSkinsOwned?.[def.id]);
    case 'restoration': return (state.restorationLevel || 0) >= (u.level || 1);
    case 'exhibition': return !!(state.exhibition?.built);
    case 'purchase': return !!(state.writingSkinsOwned?.[def.id]);
    default: return false;
  }
}

/** 皮肤锁定原因的 i18n key（未锁定时返回 null，调用方据此渲染 🔒+说明或选择按钮） */
export function getWritingSkinLockKey(def) {
  if (!def) return null;
  const u = def.unlock;
  if (u.type === 'restoration') return 'writingSkinLockRestoration';
  if (u.type === 'exhibition') return 'writingSkinLockExhibition';
  if (u.type === 'purchase') return 'writingSkinLockPurchase';
  return null;
}

/**
 * 解析当前生效皮肤：
 * ① 哥特窗口内：自动入账哥特所有权（过窗保留凭据），但哥特只是「窗口默认」——
 *    玩家有显式自选且已解锁时必须尊重自选（2026-10-30 图南实测：强制覆盖让选择器失效）
 * ② 无自选/自选未解锁/非法：窗口内回退哥特，窗口外回退默认羊皮纸
 * @returns {{skin: string, newlyOwned: boolean}}
 */
export function resolveWritingSkin(state, chosenId, now = Date.now()) {
  const gothicDef = getWritingSkinDef('gothic');
  const gothicKey = gothicDef.unlock.festivalKey;
  const windowActive = isFestivalActive(gothicKey, now);
  let newlyOwned = false;
  if (windowActive && !state.writingSkinsOwned?.gothic) {
    state.writingSkinsOwned = { ...(state.writingSkinsOwned || {}), gothic: true };
    newlyOwned = true;
  }
  const def = getWritingSkinDef(chosenId);
  if (def && isWritingSkinUnlocked(def, state, now)) {
    return { skin: def.id, newlyOwned };
  }
  return { skin: windowActive ? 'gothic' : DEFAULT_WRITING_SKIN, newlyOwned };
}
