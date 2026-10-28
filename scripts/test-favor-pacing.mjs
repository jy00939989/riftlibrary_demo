#!/usr/bin/env node
// 好感节奏三车道回归（2026-10-28 图南拍板：4~6 周/人满好感）
// 覆盖：每日 cap=15（逛/借/还车道截断/静默丢弃/跨日重置）·
//       咖啡角豁免 cap 且写持久账本（修复离场丢失生产bug）· 满好感溢出×3转小费 ·
//       满好感便签拒用不消耗
// 用法：node scripts/test-favor-pacing.mjs

// ── Node 环境浏览器桩 ──
globalThis.window = { __dev: {} };
const elStub = () => ({
  style: {}, classList: { add() {}, remove() {}, toggle() {} },
  addEventListener() {}, appendChild() {}, remove() {},
  querySelector: () => null, querySelectorAll: () => [], innerHTML: '', textContent: ''
});
globalThis.document = {
  getElementById: elStub, querySelector: elStub, querySelectorAll: () => [],
  addEventListener() {}, body: elStub(), documentElement: elStub(), createElement: elStub
};
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.Audio = class Audio { constructor() {} play() { return Promise.resolve(); } pause() {} addEventListener() {} };

const { state } = await import('../js/state.js');
const { FAVOR_CAP, DAILY_ACTION_FAVOR_CAP, FAVOR_OVERFLOW_TO_COINS, gainActionFavor, gainCafeFavor } = await import('../js/core/favor-ledger.js');
const { useItem } = await import('../js/core/redeem.js');
const { VISITOR_DEFS } = await import('../js/visitors.js');

let passed = 0;
const results = [];
function test(name, fn) {
  try { fn(); passed++; results.push(`ok  ${name}`); }
  catch (e) { results.push(`FAIL ${name}: ${e.message}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function mkVisitor(charId) { return { charId, favorability: 0 }; }

state.visitorFavors = {};
state.visitorFavorDaily = {};

// ── 1. 每日 cap 车道 ──
test('S1a 常数口径：cap=15 / 封顶600 / 溢出汇率3', () => {
  assert(DAILY_ACTION_FAVOR_CAP === 15, `cap=${DAILY_ACTION_FAVOR_CAP}`);
  assert(FAVOR_CAP === 600, `FAVOR_CAP=${FAVOR_CAP}`);
  assert(FAVOR_OVERFLOW_TO_COINS === 3, `rate=${FAVOR_OVERFLOW_TO_COINS}`);
});

test('S1b cap 内全额入账（持久+session 双写）', () => {
  const v = mkVisitor('guyu');
  const grant = gainActionFavor(v, 5);
  assert(grant === 5, `grant=${grant}`);
  assert(state.visitorFavors.guyu === 5, `持久=${state.visitorFavors.guyu}`);
  assert(v.favorability === 5, `session=${v.favorability}`);
});

test('S1c 超 cap 静默截断（免费流水不提示不报错）', () => {
  state.visitorFavorDaily = {}; // 清日账，独立于 S1b 的已花额度（S1b 花 5，持久 guyu=5）
  const v = mkVisitor('guyu');
  const g1 = gainActionFavor(v, 9);   // 入 9，余 6
  const g2 = gainActionFavor(v, 5);   // min(5,6)=5，余 1
  const g3 = gainActionFavor(v, 3);   // min(3,1)=1，余 0
  const g4 = gainActionFavor(v, 2);   // 0
  assert(g1 === 9 && g2 === 5 && g3 === 1 && g4 === 0, `g=${g1},${g2},${g3},${g4}`);
  assert(state.visitorFavors.guyu === 5 + 15, `持久=${state.visitorFavors.guyu}`);
  assert(v.favorability === 15, `session=${v.favorability}`);
});

test('S1d 额度按角色独立（互不占额度）', () => {
  const v = mkVisitor('linxiaoman');
  const grant = gainActionFavor(v, 8);
  assert(grant === 8, `grant=${grant}`);
  assert(state.visitorFavors.linxiaoman === 8, 'linxiaoman 应独立计 8');
  assert(state.visitorFavors.guyu === 20, 'guyu 不应被影响');
});

// ── 2. 跨日重置（时钟模拟明天）──
test('S2a 次日额度清零重计', () => {
  const realNow = Date.now;
  const tomorrow = realNow() + 24 * 3600 * 1000;
  Date.now = () => tomorrow;
  try {
    const v = mkVisitor('guyu');
    const grant = gainActionFavor(v, 6);
    assert(grant === 6, `次日应全额入账, grant=${grant}`);
    assert(state.visitorFavors.guyu === 26, `持久应累计 20+6=26, 实=${state.visitorFavors.guyu}`);
  } finally {
    Date.now = realNow;
  }
});

// ── 3. 咖啡角车道（豁免 cap + 持久化修复）──
test('S3a 咖啡角入账写持久账本（修复离场丢失 bug）', () => {
  const v = mkVisitor('peizhou');
  const { grant, tip } = gainCafeFavor(v, 10);
  assert(grant === 10 && tip === 0, `grant=${grant} tip=${tip}`);
  assert(state.visitorFavors.peizhou === 10, '咖啡好感必须落持久账本');
  assert(v.favorability === 10, 'session 角标同步');
});

test('S3b 咖啡角豁免每日 cap（当日动作额度已用尽仍全入）', () => {
  const v = mkVisitor('guyu'); // guyu 今日已花 15
  const { grant } = gainCafeFavor(v, 12);
  assert(grant === 12, `咖啡角被 cap 误伤, grant=${grant}`);
  assert(state.visitorFavors.guyu === 26 + 12, `实=${state.visitorFavors.guyu}`);
});

test('S3c 满好感溢出 ×3 转小费（600 封顶不溢出账本）', () => {
  state.visitorFavors.shenmingyuan = 598;
  const v = mkVisitor('shenmingyuan');
  const { grant, tip } = gainCafeFavor(v, 10);
  assert(grant === 2, `grant=${grant}`);
  assert(state.visitorFavors.shenmingyuan === 600, '必须封在 600');
  assert(tip === (10 - 2) * 3, `tip=${tip}`);
});

test('S3d 满好感整单溢出：grant=0, tip=全额×3', () => {
  state.visitorFavors.wangxiaolei = 600;
  const v = mkVisitor('wangxiaolei');
  const { grant, tip } = gainCafeFavor(v, 12);
  assert(grant === 0 && tip === 36, `grant=${grant} tip=${tip}`);
  assert(state.visitorFavors.wangxiaolei === 600, '满值不动');
});

// ── 4. 便签车道（豁免 cap + 满好感拒用不消耗）──
state.inventory = { favor_note_targeted: 2, favor_note_random: 1 };

test('S4a 便签正常赠送 +20 且豁免每日 cap', () => {
  const v = mkVisitor('guyu');
  gainActionFavor(v, 15); // 先耗尽 guyu 今日额度（跨日测试后 today key 已变，重花一次保险）
  const before = state.visitorFavors.guyu;
  const r = useItem('favor_note_targeted', 'guyu');
  assert(r.ok === true, `便签被拒: ${r.message}`);
  assert(state.visitorFavors.guyu === before + 20, `应 +20, 实=${state.visitorFavors.guyu - before}`);
  assert(state.inventory.favor_note_targeted === 1, '应消耗 1 张');
});

test('S4b 满好感目标拒用且不动库存', () => {
  state.visitorFavors.guyu = 600;
  const r = useItem('favor_note_targeted', 'guyu');
  assert(r.ok === false, '满好感必须拒用');
  assert((r.message || '').includes('心意已经满了'), `文案=${r.message}`);
  assert(state.inventory.favor_note_targeted === 1, '库存绝不允许扣');
  assert(state.visitorFavors.guyu === 600, '好感值不动');
});

test('S4c 随机便签 roll 到满好感目标同样拒用', () => {
  // 全员满好感：无论 random roll 到谁都必中拒用分支，断言与随机数无关
  for (const id of Object.keys(VISITOR_DEFS)) state.visitorFavors[id] = 600;
  const r = useItem('favor_note_random');
  assert(r.ok === false && (r.message || '').includes('心意已经满了'),
    `随机便签未拒用: ${r.message}`);
  assert(state.inventory.favor_note_random === 1, '随机便签库存不动');
});

// ── 结果 ──
console.log(results.join('\n'));
const failed = results.filter(r => r.startsWith('FAIL')).length;
console.log(`\n好感节奏三车道回归：${passed} 过 ${failed} 挂`);
process.exit(failed ? 1 : 0);
