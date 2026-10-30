#!/usr/bin/env node
// 缮写速度档 + 底版皮肤回归（2026-10-30 图南拍板）
// 覆盖：速度档映射/兜底 · 皮肤解锁条件（修复室/展览厅/直购/节日保留）·
//       解析规则（窗口内自动哥特+永久入账 · 窗口外自选回退羊皮纸）
// 用法：node scripts/test-writing-skins.mjs

globalThis.window = { __dev: {} };
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

const {
  WRITING_SPEEDS, DEFAULT_WRITING_SPEED, DEFAULT_WRITING_SKIN,
  WRITING_SKINS, getWritingSkinDef, isWritingSkinUnlocked, getWritingSkinLockKey, resolveWritingSkin
} = await import('../data/writing-skins.js');

let passed = 0;
const results = [];
function test(name, fn) {
  try { fn(); passed++; results.push(`ok  ${name}`); }
  catch (e) { results.push(`FAIL ${name}: ${e.message}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

const IN_WINDOW = '2026-10-30T12:00:00';   // 哥特窗口 10-27~11-13 内
const OUT_WINDOW = '2026-12-01T12:00:00';  // 窗口外

function mkState(over = {}) {
  return {
    restorationLevel: 0,
    exhibition: { built: false },
    writingSkinsOwned: {},
    ...over
  };
}

// ── 1. 速度档 ──
test('S1a 速度档映射：舒缓230/标准150/轻快90', () => {
  assert(WRITING_SPEEDS.calm === 230 && WRITING_SPEEDS.normal === 150 && WRITING_SPEEDS.swift === 90,
    JSON.stringify(WRITING_SPEEDS));
  assert(DEFAULT_WRITING_SPEED === 'normal', '默认档应为 normal');
});

// ── 2. 皮肤注册与解锁条件 ──
test('S2a 五款皮肤全注册，羊皮纸为默认', () => {
  assert(WRITING_SKINS.length === 5, `len=${WRITING_SKINS.length}`);
  assert(DEFAULT_WRITING_SKIN === 'parchment', '默认底版应为 parchment');
  for (const id of ['parchment', 'gothic', 'manuscript', 'chinese', 'oilpaint']) {
    assert(getWritingSkinDef(id), `缺皮肤 ${id}`);
  }
});

test('S2b 羊皮纸免费解锁', () => {
  assert(isWritingSkinUnlocked(getWritingSkinDef('parchment'), mkState(), OUT_WINDOW) === true);
});

test('S2c 手抄本=修复室≥Lv3', () => {
  const def = getWritingSkinDef('manuscript');
  assert(isWritingSkinUnlocked(def, mkState({ restorationLevel: 2 }), OUT_WINDOW) === false, 'Lv2 不应解锁');
  assert(isWritingSkinUnlocked(def, mkState({ restorationLevel: 3 }), OUT_WINDOW) === true, 'Lv3 应解锁');
});

test('S2d 中国风=展览厅建成', () => {
  const def = getWritingSkinDef('chinese');
  assert(isWritingSkinUnlocked(def, mkState(), OUT_WINDOW) === false);
  assert(isWritingSkinUnlocked(def, mkState({ exhibition: { built: true } }), OUT_WINDOW) === true);
});

test('S2e 油画风=直购入账（writingSkinsOwned.oilpaint）', () => {
  const def = getWritingSkinDef('oilpaint');
  assert(def.unlock.price === 800, `price=${def.unlock.price}`);
  assert(isWritingSkinUnlocked(def, mkState(), OUT_WINDOW) === false);
  assert(isWritingSkinUnlocked(def, mkState({ writingSkinsOwned: { oilpaint: true } }), OUT_WINDOW) === true);
});

test('S2f 哥特窗口外凭「曾获得」永久保留', () => {
  const def = getWritingSkinDef('gothic');
  assert(isWritingSkinUnlocked(def, mkState(), OUT_WINDOW) === false, '未获得过，窗外不解锁');
  assert(isWritingSkinUnlocked(def, mkState({ writingSkinsOwned: { gothic: true } }), OUT_WINDOW) === true, '过窗保留');
});

test('S2g 锁定原因 key 齐全', () => {
  assert(getWritingSkinLockKey(getWritingSkinDef('manuscript')) === 'writingSkinLockRestoration');
  assert(getWritingSkinLockKey(getWritingSkinDef('chinese')) === 'writingSkinLockExhibition');
  assert(getWritingSkinLockKey(getWritingSkinDef('parchment')) === null, '免费皮肤无锁');
});

// ── 3. 解析规则 ──
test('S3a 窗口内无自选 → 哥特默认 + 首次入账', () => {
  const s = mkState();
  const r1 = resolveWritingSkin(s, undefined, IN_WINDOW);
  assert(r1.skin === 'gothic' && r1.newlyOwned === true, `r1=${JSON.stringify(r1)}`);
  assert(s.writingSkinsOwned.gothic === true, '所有权必须落账（过窗保留凭据）');
  const r2 = resolveWritingSkin(s, undefined, IN_WINDOW);
  assert(r2.skin === 'gothic' && r2.newlyOwned === false, '二次解析不应重复入账');
});

test('S3a2 窗口内有已解锁自选 → 尊重自选（2026-10-30 图南实测修复）', () => {
  const s1 = mkState();
  const r1 = resolveWritingSkin(s1, 'parchment', IN_WINDOW);
  assert(r1.skin === 'parchment', `自选羊皮纸应生效, 实=${r1.skin}`);
  assert(r1.newlyOwned === true, '哥特所有权仍应首次入账');
  const s2 = mkState({ exhibition: { built: true } });
  const r2 = resolveWritingSkin(s2, 'chinese', IN_WINDOW);
  assert(r2.skin === 'chinese', `自选中国风应生效, 实=${r2.skin}`);
});

test('S3a3 窗口内自选未解锁 → 回退哥特默认', () => {
  const r = resolveWritingSkin(mkState(), 'oilpaint', IN_WINDOW);
  assert(r.skin === 'gothic', `应回退哥特, 实=${r.skin}`);
});

test('S3b 窗口外回退玩家自选（已解锁）', () => {
  const s = mkState({ exhibition: { built: true } });
  const r = resolveWritingSkin(s, 'chinese', OUT_WINDOW);
  assert(r.skin === 'chinese' && r.newlyOwned === false, `r=${JSON.stringify(r)}`);
});

test('S3c 窗口外选未解锁皮肤 → 回退羊皮纸', () => {
  const r = resolveWritingSkin(mkState(), 'oilpaint', OUT_WINDOW);
  assert(r.skin === 'parchment', `应回退 parchment, 实=${r.skin}`);
});

test('S3d 窗口外非法选择 → 回退羊皮纸', () => {
  const r = resolveWritingSkin(mkState(), 'no_such_skin', OUT_WINDOW);
  assert(r.skin === 'parchment', `应回退 parchment, 实=${r.skin}`);
});

test('S3e 窗口外已保留哥特仍可选', () => {
  const s = mkState({ writingSkinsOwned: { gothic: true } });
  const r = resolveWritingSkin(s, 'gothic', OUT_WINDOW);
  assert(r.skin === 'gothic', `实=${r.skin}`);
});

console.log(results.join('\n'));
const failed = results.filter(r => r.startsWith('FAIL')).length;
console.log(`\n缮写速度档+皮肤回归：${passed} 过 ${failed} 挂`);
process.exit(failed ? 1 : 0);
