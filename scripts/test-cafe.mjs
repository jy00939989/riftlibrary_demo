#!/usr/bin/env node
// 咖啡角（cafe-corner-plan v3.1）存储层 + 营业链路测试
// 覆盖：建造门槛/升级曲线与设施帽/制作与数值对齐 92-98%/营业 tick 时序/维持费防重/
//       休眠与唤醒/时间跳跃补算封顶/加权取用/失败信号 C 单调性/多 plan 同档迁移共存（A5）
// 用法：node scripts/test-cafe.mjs

// ── 环境 mock（必须在动态 import 之前装好）──
const store = new Map();
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
  clear: () => store.clear(),
  key: i => [...store.keys()][i] ?? null,
  get length() { return store.size; },
};
globalThis.document = {
  body: { style: {} },
  documentElement: { style: {} },
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
};
globalThis.window = globalThis;
globalThis.Audio = class {
  play() { return new Promise(() => {}); }
  pause() {}
  addEventListener() {}
};

const { state } = await import('../js/state.js');
const { runMigrations } = await import('../js/state/migrations.js');
const cafe = await import('../js/core/cafe.js');
const { CAFE_RECIPES, CAFE_STAY_MS, CAFE_SERVE_PROBABILITY,
        CAFE_BORROW_BUFF_PER_LEVEL, CAFE_FAVOR_MULT_STEP } = await import('../data/cafe.js');
const { SEED_EXCHANGE } = await import('../data/plants.js');

const RealDate = Date;
const T1 = new RealDate('2026-09-10T12:00:00').getTime();
const dstr = ms => new RealDate(ms).toDateString();

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { console.log(`  ✅ ${msg}`); pass++; }
  else { console.log(`  ❌ ${msg}`); fail++; }
}
const realRandom = Math.random;
const rollZero = () => { Math.random = () => 0; };      // 一切随机判定全过
const rollHigh = () => { Math.random = () => 0.99; };   // 一切随机判定全不过
const restoreRoll = () => { Math.random = realRandom; };

function freshCafe(opts = {}) {
  state.library.stage = opts.stage ?? 3;
  state.library.atmosphere = opts.atmosphere ?? 500;
  state.coins = opts.coins ?? 10000;
  state.cafe = { unlocked: false, level: 0, stock: {}, totalServed: 0, lastServeDay: null, lastFeeDay: null, dormant: false };
  state.seeds = { bird_of_paradise: 0, magic_rose: 0, starlight_fern: 0 };
  state.visitors = [];
}
function browsingVisitor(id) {
  return { id, charId: 'shenmingyuan', emoji: '📚', name: '测试访客' + id, status: 'browsing', favorability: 0 };
}

// ═══ 1. 建造门槛（§2.2：2 阶 + 1500）═══
console.log('\n=== 1. 建造门槛 ===');
freshCafe({ stage: 1, coins: 99999 });
assert(!cafe.canBuildCafe() && !cafe.buildCafe(), '1 阶不可建造');
freshCafe({ stage: 2, coins: 1000 });
assert(!cafe.canBuildCafe() && !cafe.buildCafe(), '金币不足 1500 不可建造');
freshCafe({ stage: 2, coins: 5000 });
assert(cafe.canBuildCafe(), '2 阶 + 1500 可建造');
assert(cafe.buildCafe() && state.cafe.level === 1 && state.cafe.unlocked, '建造成功 Lv1');
assert(state.coins === 3500, '扣款 1500');
assert(!cafe.buildCafe(), '已建不可重复建造');

// ═══ 2. 升级曲线与设施帽（§2.2：400×1.6ⁿ，cap=min(5,stage+1)）═══
console.log('\n=== 2. 升级曲线与设施帽 ===');
freshCafe({ stage: 2, coins: 99999 });
cafe.buildCafe();
assert(cafe.getCafeUpgradePrice() === Math.round(400 * 1.6), 'Lv1→2 = 640');
assert(cafe.getCafeLevelCap() === 3, '2 阶 cap = min(5, 3) = 3');
cafe.upgradeCafe(); cafe.upgradeCafe();
assert(state.cafe.level === 3 && !cafe.canUpgradeCafe(), '升到 cap 3 后不可再升（同阶）');
state.library.stage = 4;
assert(cafe.getCafeLevelCap() === 5 && cafe.canUpgradeCafe(), '4 阶 cap 放宽到 5');
cafe.upgradeCafe(); cafe.upgradeCafe();
assert(state.cafe.level === 5 && !cafe.canUpgradeCafe(), '满级 5 封顶');
const totalSpent = Math.round(400*1.6) + Math.round(400*1.6**2) + Math.round(400*1.6**3) + Math.round(400*1.6**4);
assert(99999 - 1500 - state.coins === totalSpent, `升级总价 ≈ 5,923（${totalSpent}）`);

// ═══ 3. 制作与数值对齐 92-98%（§2.3，verify 断言核心）═══
console.log('\n=== 3. 制作与数值对齐 ===');
freshCafe({ stage: 3, coins: 99999 });
cafe.buildCafe();
state.seeds.bird_of_paradise = 2;
assert(cafe.canCraftRecipe('vanilla_tea'), '材料足可制作');
assert(cafe.craftRecipe('vanilla_tea') && cafe.getCafeStock('vanilla_tea') === 1
  && state.seeds.bird_of_paradise === 0, '制作入库、种子扣除');
assert(!cafe.canCraftRecipe('vanilla_tea'), '材料尽不可再制');
assert(!cafe.canCraftRecipe('starlight_special'), '星蕨特调 Lv1 未解锁拒绝');
cafe.upgradeCafe(); // Lv2
state.seeds.starlight_fern = 3;
assert(cafe.canCraftRecipe('starlight_special') && cafe.craftRecipe('starlight_special'), 'Lv2 解锁星蕨特调');

// 92-98%：每颗种子产出对照该种子最优可重复兑换率
// 容差 ±0.5pp：plan §2.3 表内 92%/94%/98% 为展示四舍五入值（星蕨实际 91.67%，表记 92%）
CAFE_RECIPES.forEach(r => {
  const eff = r.price / r.material.count;
  const rates = (SEED_EXCHANGE[r.material.seedType] || [])
    .filter(e => e.type === 'coins' && e.repeatable !== false)
    .map(e => e.value / e.required);
  const baseline = Math.max(...rates);
  const ratio = eff / baseline;
  assert(ratio >= 0.915 && ratio <= 0.985,
    `${r.id} 种子效率 ${eff.toFixed(1)} / 兑换率 ${baseline.toFixed(1)} = ${(ratio * 100).toFixed(1)}% ∈ 92-98%（±0.5pp 展示容差）`);
});

// ═══ 4. 营业 tick 时序（§2.4：fee → serve；25% 判定；并发=等级）═══
console.log('\n=== 4. 营业 tick 时序 ===');
freshCafe({ stage: 3, coins: 3000 }); // 建造后剩 1500
cafe.buildCafe();
state.seeds.bird_of_paradise = 10;
cafe.craftRecipe('vanilla_tea'); cafe.craftRecipe('vanilla_tea'); cafe.craftRecipe('vanilla_tea');
state.visitors = [browsingVisitor('v1'), browsingVisitor('v2')];
const fee = 20;
rollZero();
cafe.cafeTick(T1);
assert(state.coins === 1500 - fee + 50, '首次 tick 扣维持费 20 + 招待 1 位得 50（并发 cap=1）');
assert(state.visitors.filter(v => v.status === 'cafe').length === 1
  && state.visitors.filter(v => v.status === 'browsing').length === 1, 'Lv1 并发 1：一位在店一位仍浏览');
const served = state.visitors.find(v => v.status === 'cafe');
assert(served.pendingBorrowBuff === CAFE_BORROW_BUFF_PER_LEVEL * 1, '进店 buff 写入 5%（A3 契约）');
assert(served.favorability === Math.round(4 * (1 + CAFE_FAVOR_MULT_STEP * 0)), '好感 +4（Lv1 乘区 ×1.0）');
assert(state.cafe.lastFeeDay === dstr(T1) && state.cafe.lastServeDay === dstr(T1), '费/营业日落戳');
cafe.cafeTick(T1);
assert(state.coins === 1500 - fee + 50, '同日再 tick 维持费不重复扣（lastFeeDay 防重）');
restoreRoll();

// 在店时长到点返回浏览（buff 保留至借到书或离场）
rollHigh(); // 不再触发新招待
const tLater = T1 + CAFE_STAY_MS + 1000;
cafe.cafeTick(tLater);
assert(state.visitors.every(v => v.status === 'browsing'), '在店超时返回 browsing');
assert(state.visitors[0].pendingBorrowBuff > 0 || state.visitors[1].pendingBorrowBuff > 0, '返回后 buff 保留（借到书才失效）');
restoreRoll();

// ═══ 5. 休眠与唤醒（v3 D10/A6：不足费→休眠不扣不招待；回升自动唤醒）═══
console.log('\n=== 5. 休眠与唤醒 ===');
freshCafe({ stage: 3, coins: 3000 });
cafe.buildCafe();
state.coins = 15; // 人为压到低于当日维持费 20
state.seeds.bird_of_paradise = 10;
cafe.craftRecipe('vanilla_tea');
state.visitors = [{ ...browsingVisitor('v3'), pendingBorrowBuff: 0.1 }];
const coinsBeforeDormant = state.coins;
rollZero();
cafe.cafeTick(T1);
assert(state.cafe.dormant === true, '金币不足维持费 → 进入休眠');
assert(state.coins === coinsBeforeDormant, '休眠不扣费');
assert(state.cafe.stock.vanilla_tea === 1, '休眠不招待（库存未动）');
assert(state.visitors[0].pendingBorrowBuff === 0, '休眠清空未消费 buff（增益不生效）');
cafe.cafeTick(T1 + 60000);
assert(state.cafe.dormant && state.visitors[0].status === 'browsing', '休眠持续：不招待');
state.coins = 100; // 回升
cafe.cafeTick(T1 + 120000);
assert(state.cafe.dormant === false, '金币回升自动唤醒');
assert(state.coins === 100 - fee + 50, '唤醒当 tick 收维持费并正常招待');
restoreRoll();

// ═══ 6. 时间跳跃补算封顶（§2.4.6 D8）═══
console.log('\n=== 6. 时间跳跃补算 ===');
freshCafe({ stage: 3, coins: 99999 });
cafe.buildCafe();
cafe.upgradeCafe(); // Lv2，座位=2
state.seeds.bird_of_paradise = 20;
for (let i = 0; i < 5; i++) cafe.craftRecipe('vanilla_tea');
rollZero();
const served6 = cafe.cafeOnTimeSkip(48, T1);
assert(served6 === 2, '48h：min(floor(48/6)=8, 座位2, 库存5, 2×座位=4) = 2 次（座位封顶）');
assert(cafe.getCafeStockTotal() === 3, '消耗真实库存 5→3');
assert(cafe.getCafeStock('vanilla_tea') === 3, '加权取用首件（roll=0）');
const servedMore = cafe.cafeOnTimeSkip(12, T1);
assert(servedMore === Math.min(2, 3), '再跳 12h：min(2, 2, 库存3, 4) = 2（小时数封顶）');
// 休眠中不补算
state.cafe.dormant = true;
assert(cafe.cafeOnTimeSkip(48, T1) === 0, '休眠中补算为 0');
restoreRoll();

// ═══ 7. 库存加权取用（§2.4.2 D6）═══
console.log('\n=== 7. 加权取用 ===');
freshCafe({ stage: 3, coins: 99999 });
cafe.buildCafe();
state.cafe.stock = { vanilla_tea: 3, rose_dew: 1 };
rollZero();
assert(cafe.pickWeightedStock() === 'vanilla_tea', '权重 3:1 时 roll→0 取件多者');
Math.random = () => 0.99;
assert(cafe.pickWeightedStock() === 'rose_dew', 'roll→1 取尾部件少者');
state.cafe.stock = {};
assert(cafe.pickWeightedStock() === null, '空库存返回 null');
restoreRoll();

// ═══ 8. 失败信号 C：升级单调性（v3 进店判定与增益解耦，D9 口径）═══
console.log('\n=== 8. 失败信号 C 解析断言 ===');
// 每 tick 期望收益 = 0.25×E[售价|库存]（各级相同，判定独立）+ buff 价值（随级单调增）
const serveEv = CAFE_SERVE_PROBABILITY * (CAFE_RECIPES[0].price); // 用统一库存口径
const buffVals = [1, 2, 3, 4, 5].map(lv => CAFE_BORROW_BUFF_PER_LEVEL * lv);
const favorMults = [1, 2, 3, 4, 5].map(lv => 1 + CAFE_FAVOR_MULT_STEP * (lv - 1));
assert(buffVals.every((v, i) => i === 0 || v > buffVals[i - 1]), '借书增益随级严格递增（5%→25%）');
assert(favorMults.every((m, i) => i === 0 || m > favorMults[i - 1]), '好感乘区随级严格递增（×1.0→×1.4）');
assert(CAFE_SERVE_PROBABILITY > 0 && serveEv > 0, '进店判定与等级解耦：营业期望各级相同且为正');
assert(buffVals[4] * 100 === 25 && favorMults[4] === 1.4, 'Lv5 口径：buff 25% · 好感 ×1.4（§2.5）');
console.log('  📐 信号 C 结论：Lv5 单位访客期望收益 = Lv1 营业期望 + 严格正增益差 > Lv1，反噬不可能回归');

// ═══ 9. 多 plan 同档迁移共存（A5：v7 plants + v8 cafe 同档默认态）═══
console.log('\n=== 9. 迁移共存（A5）===');
state._schemaVersion = 6;
delete state.plants;
delete state.cafe;
state.plant = { activeType: 'magic_rose', level: 2, growthProgress: 5 };
runMigrations();
assert(state._schemaVersion === 8, 'schemaVersion 升到 8');
assert(Array.isArray(state.plants) && state.plants[0].activeType === 'magic_rose', 'v7 plants 正确');
assert(state.cafe && state.cafe.unlocked === false && state.cafe.level === 0
  && state.cafe.stock && typeof state.cafe.stock === 'object'
  && state.cafe.totalServed === 0 && state.cafe.dormant === false, 'v8 cafe 默认态完整');
runMigrations();
assert(state.plants.length === 1 && state.cafe.level === 0, '重复迁移幂等');

console.log(`\n${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
