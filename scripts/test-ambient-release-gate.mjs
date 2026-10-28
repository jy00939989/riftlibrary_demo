#!/usr/bin/env node
// 氛围音延后上架门控回归（2026-10-28）
// 覆盖：availableFrom 字段注册 / isAmbientReleased 日期判定 / buyAmbient 未到日期拒售 /
//       常驻曲目不受影响 / 到日后可正常购买
// 用法：node scripts/test-ambient-release-gate.mjs

// ── Node 环境浏览器桩 ──
globalThis.window = { __dev: {} };
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.Audio = class Audio { constructor() {} play() { return Promise.resolve(); } pause() {} addEventListener() {} };

const { state } = await import('../js/state.js');
const { AMBIENT_DEFS, isAmbientReleased, buyAmbient } = await import('../js/ambient.js');

let passed = 0;
const results = [];
function test(name, fn) {
  try {
    fn();
    passed++;
    results.push(`ok  ${name}`);
  } catch (e) {
    results.push(`FAIL ${name}: ${e.message}`);
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

// ── 1. 字段注册 ──
const lakeside = AMBIENT_DEFS.find(d => d.id === 'lakeside_cabin');
const jazz = AMBIENT_DEFS.find(d => d.id === 'jazz_bar');
test('S1a 湖畔木屋注册且带 availableFrom=2026-11-14', () => {
  assert(lakeside, '缺 lakeside_cabin 定义');
  assert(lakeside.availableFrom === '2026-11-14', `availableFrom=${lakeside.availableFrom}`);
});
test('S1b 爵士酒吧注册且带 availableFrom=2026-11-14', () => {
  assert(jazz, '缺 jazz_bar 定义');
  assert(jazz.availableFrom === '2026-11-14', `availableFrom=${jazz.availableFrom}`);
});
test('S1c 旧曲目无 availableFrom 字段（常驻不受门控）', () => {
  for (const id of ['victorian_study', 'medieval_monastery', 'blizzard_fireplace']) {
    const def = AMBIENT_DEFS.find(d => d.id === id);
    assert(def && !def.availableFrom, `${id} 不应有 availableFrom`);
  }
});

// ── 2. isAmbientReleased 判定 ──
test('S2a 无 availableFrom → 常驻放行', () => {
  assert(isAmbientReleased({}) === true);
  assert(isAmbientReleased(undefined) === true);
});
test('S2b 未来日期 → 未上架', () => {
  assert(isAmbientReleased({ availableFrom: '2999-01-01' }) === false);
});
test('S2c 过去日期 → 已上架', () => {
  assert(isAmbientReleased({ availableFrom: '2020-01-01' }) === true);
});
test('S2d 两个新曲目今天（<11-14）均未上架', () => {
  assert(isAmbientReleased(lakeside) === false, '湖畔木屋今天不该上架');
  assert(isAmbientReleased(jazz) === false, '爵士酒吧今天不该上架');
});

// ── 3. buyAmbient 守卫 ──
state.ambientSounds = { unlocked: [], current: null };
state.coins = 10000;

test('S3a 未到日期拒售（reason=not_released，不扣钱）', () => {
  const before = state.coins;
  const r = buyAmbient('lakeside_cabin');
  assert(r.ok === false && r.reason === 'not_released', `期望 not_released，实得 ${r.reason}`);
  assert(state.coins === before, '不应扣钱');
});
test('S3b 常驻曲目不受影响，正常购买', () => {
  const r = buyAmbient('victorian_study');
  assert(r.ok === true, `维多利亚书房购买失败: ${r.reason}`);
  assert(state.ambientSounds.unlocked.includes('victorian_study'), '未写入 unlocked');
});
test('S3c 到日后可购买（模拟 availableFrom 已过）', () => {
  const realNow = Date;
  globalThis.Date = class extends realNow {
    constructor(...args) {
      if (args.length === 0) return new realNow('2026-11-15T12:00:00');
      super(...args);
    }
    static now() { return new realNow('2026-11-15T12:00:00').getTime(); }
  };
  try {
    const r = buyAmbient('jazz_bar');
    assert(r.ok === true, `到日后爵士酒吧购买失败: ${r.reason}`);
    assert(state.ambientSounds.unlocked.includes('jazz_bar'), '未写入 unlocked');
  } finally {
    globalThis.Date = realNow;
  }
});

// ── 结果 ──
console.log(results.join('\n'));
const failed = results.filter(r => r.startsWith('FAIL')).length;
console.log(`\n延后上架门控回归：${passed} 过 ${failed} 挂`);
process.exit(failed ? 1 : 0);
