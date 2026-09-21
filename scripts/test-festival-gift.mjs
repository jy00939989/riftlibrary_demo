#!/usr/bin/env node
// 2026 中秋·国庆双节活动测试（B 登录自动领 + 节日门控）
// 覆盖：日期窗边界（9/24 否 / 9/25 是 / 10/8 是 / 10/9 否）/ 自动领一次幂等 /
//       奖励到账（金币/灵感/种子/纪念牌）/ claim 标记持久化 / 中秋纪念牌不可购买 /
//       咖啡角限定饮品窗口内外可见性
// 用法：node scripts/test-festival-gift.mjs

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
function makeEl() {
  return {
    className: '', id: '', innerHTML: '', textContent: '', dataset: {},
    style: {},
    querySelector: () => ({ addEventListener() {} }),
    querySelectorAll: () => [],
    addEventListener() {},
    appendChild() {},
    remove() {}
  };
}
globalThis.document = {
  body: { style: {}, appendChild() {} },
  documentElement: { style: {} },
  head: { appendChild() {} },
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: makeEl,
};
globalThis.window = globalThis;
globalThis.Audio = class {
  play() { return new Promise(() => {}); }
  pause() {}
  addEventListener() {}
};

const { state } = await import('../js/state.js');
const { runMigrations } = await import('../js/state/migrations.js');
const festival = await import('../js/core/festival.js');
const { isFestivalActive, FESTIVALS } = await import('../data/festival.js');
const { SIGNBOARDS } = await import('../data/signboards.js');
const { CAFE_RECIPES } = await import('../data/cafe.js');
const signShop = await import('../js/core/shop/signboards.js');

const RealDate = Date;
const at = (m, d, h = 12) => new RealDate(`2026-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:00:00`).getTime();
window.__dev = { getNow: () => at(9, 10) };

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { console.log(`  ✅ ${msg}`); pass++; }
  else { console.log(`  ❌ ${msg}`); fail++; }
}

console.log('\n[1] 迁移 v16 默认值（幂等）');
assert(isFestivalActive('midAutumn2026', at(9, 24, 23)) === false, '9/24 窗口外');
assert(isFestivalActive('midAutumn2026', at(9, 25, 0)) === true, '9/25 零点窗口内');
assert(isFestivalActive('midAutumn2026', at(10, 1, 12)) === true, '国庆日窗口内');
assert(isFestivalActive('midAutumn2026', at(10, 8, 23)) === true, '10/8 收官日仍内');
assert(isFestivalActive('midAutumn2026', at(10, 9, 0)) === false, '10/9 窗口外');
assert(isFestivalActive('no_such_fest', at(9, 25)) === false, '未知活动恒 false');

console.log('\n[2] 登录自动领：一次幂等 + 奖励到账');
runMigrations();
state.coins = 100;
state.inspiration = (state.inspiration || 0);
state.seeds = {};
state.signboards = [];
state.diaryLogs = state.diaryLogs || [];
const inCoins = state.coins, inInsp = state.inspiration;

let granted = festival.checkFestivalGifts(at(9, 10)); // 窗口外：不发
assert(granted.length === 0 && !state.eventClaims?.midAutumn2026, '窗口外不发放、不落 claim 标记');

granted = festival.checkFestivalGifts(at(9, 26));
assert(granted.length === 1 && granted[0].key === 'midAutumn2026', '9/26 窗口内发放一次');
assert(state.eventClaims?.midAutumn2026 === at(9, 26), 'claim 标记落档');
const R = FESTIVALS.midAutumn2026.giftRewards;
assert(state.coins === inCoins + R.coins, `智慧之光 +${R.coins}`);
assert(state.inspiration === inInsp + R.inspiration, `灵感 +${R.inspiration}`);
assert(state.seeds.bird_of_paradise === 1 && state.seeds.magic_rose === 1 && state.seeds.starlight_fern === 1, '三样种子各 ×1');
assert(state.signboards.includes('mid_autumn_plaque'), '中秋纪念牌入袋');
assert((state.diaryLogs || []).length > 0, '墨墨日记记一笔');

const again = festival.checkFestivalGifts(at(10, 1));
assert(again.length === 0, '已领过：再查不重复发放');
const coinsAfterFirst = state.coins;
festival.checkFestivalGifts(at(10, 2));
assert(state.coins === coinsAfterFirst, '重复调用金币不增（幂等）');

console.log('\n[3] 中秋纪念牌：giftOnly 不可购买 + buff 生效');
assert(SIGNBOARDS.mid_autumn_plaque.giftOnly === true, '牌定义 giftOnly');
state.coins = 99999;
assert(signShop.purchaseSignboard('mid_autumn_plaque') === false, '商店买不了礼物牌');
assert(signShop.hasSignboard('mid_autumn_plaque') === true, '已拥有判定正常');
const focusSum = signShop.getSignboardBuffSum('focus_speed');
assert(focusSum >= 0.02, `专注 buff 聚合含 +2%（当前 ${focusSum}）`);

console.log('\n[4] 桂花月饼茶：窗口内外可见性（festivalKey 门控数据）');
const mooncake = CAFE_RECIPES.find(r => r.id === 'osmanthus_mooncake_tea');
assert(!!mooncake && mooncake.festivalKey === 'midAutumn2026', '限定饮品在食谱表带 festivalKey');
assert(mooncake.material.seedType === 'starlight_fern' && mooncake.material.count === 3, '配方：星光蕨种子 ×3');

console.log('\n[5] 活动日历：中秋/国庆入列 + 区间横幅');
const { getEventsOnDate, getMonthBanner } = await import('../data/event_calendar.js');
const evt925 = getEventsOnDate(new RealDate('2026-09-25T12:00:00'));
assert(evt925.some(e => e.id === 'mid_autumn') && evt925.some(e => e.id === 'luxun_birthday'), '9/25 中秋与鲁迅诞辰并存');
assert(evt925.find(e => e.id === 'mid_autumn').effect.focusCoinsMult === 1.1, '中秋 focusCoinsMult 1.1');
const evt1001 = getEventsOnDate(new RealDate('2026-10-01T12:00:00'));
assert(evt1001.some(e => e.id === 'national_day') && evt1001.some(e => e.id === 'intl_music_day'), '10/1 国庆与国际音乐日并存');
const bannerIn = getMonthBanner(new RealDate('2026-09-26T12:00:00'));
assert(bannerIn && bannerIn.id === 'midautumn_natl_banner' && bannerIn.image === 'banner_midautumn2026', '9/26 命中双节横幅（带挂图名）');
assert(getMonthBanner(new RealDate('2026-09-24T12:00:00')) === null, '9/24 横幅未开始');
assert(getMonthBanner(new RealDate('2026-10-08T12:00:00'))?.id === 'midautumn_natl_banner', '10/8 横幅收官日仍命中');
assert(getMonthBanner(new RealDate('2026-10-09T12:00:00')) === null, '10/9 横幅已结束');
assert(getMonthBanner(new RealDate('2026-04-10T12:00:00'))?.id === 'book_suzhou_month', '4 月整月横幅旧行为不破');

console.log(`\n========== 结果: ${pass} 通过, ${fail} 失败 ==========`);
process.exit(fail > 0 ? 1 : 0);
