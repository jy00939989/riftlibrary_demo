#!/usr/bin/env node
// 音乐节日半价日（2026-09-20 图南拍板）回归测试
// 锁死五件套：
//   ① 活动日历新增 6 个 type:'music' 节日，单日命中 shopDiscount 0.5
//   ② 三个乘区互不干扰：非音乐日 shopDiscount=1；音乐日 borrowFavor/focusCoins 仍为 1
//   ③ 12/16 贝多芬 × 简·奥斯汀同日重叠：borrowFavorMult 1.5 与 shopDiscount 0.5 并存（连乘预留）
//   ④ getMusicSalePrice 单一口径：半价日折后、原价不动、0 元档不参与、非活动日 onSale=false
//   ⑤ 结算与展示共用同一纯函数（audio.js/ambient.js 均 import 它）
// 用法：node scripts/test-music-festival-sale.mjs

const { EVENT_CALENDAR, getEventsOnDate, getEventEffectMults, fmtZhe, fmtOff } = await import('../data/event_calendar.js');
const { getMusicSalePrice } = await import('../data/music.js');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('  ✗', label); }
}
const d = (y, m, day) => new Date(y, m - 1, day);

// ── ① 节日清单与命中 ──
const MUSIC_DAYS = [
  ['mozart_birthday', 1, 27], ['vivaldi_birthday', 3, 4], ['bach_birthday', 3, 21],
  ['jazz_day', 4, 30], ['intl_music_day', 10, 1], ['beethoven_birthday', 12, 16],
];
ok(EVENT_CALENDAR.length === 13, `日历总条数 13（7 旧 + 6 新），实际 ${EVENT_CALENDAR.length}`);
for (const [id, m, day] of MUSIC_DAYS) {
  const ev = EVENT_CALENDAR.find(e => e.id === id);
  ok(!!ev, `${id} 存在`);
  ok(ev && ev.type === 'music', `${id} type='music'`);
  ok(ev && ev.effect?.shopDiscount === 0.5, `${id} shopDiscount 0.5`);
  const hit = getEventsOnDate(d(2027, m, day)).some(e => e.id === id);
  ok(hit, `${id} 在 ${m}/${day} 命中`);
}

// ── ② 乘区隔离 ──
for (const [id, m, day] of MUSIC_DAYS) {
  const mults = getEventEffectMults(d(2027, m, day));
  ok(mults.shopDiscount === 0.5, `${m}/${day} shopDiscount=0.5`);
  const expectFavor = id === 'beethoven_birthday' ? 1.5 : 1; // 12/16 与奥斯汀同日
  ok(mults.borrowFavorMult === expectFavor && mults.focusCoinsMult === 1,
    `${m}/${day} borrowFavor=${expectFavor} focusCoins=1（实际 ${mults.borrowFavorMult}）`);
}
const plain = getEventEffectMults(d(2027, 6, 1));
ok(plain.shopDiscount === 1 && plain.borrowFavorMult === 1 && plain.focusCoinsMult === 1, '非活动日三乘区全 1');
const tolkien = getEventEffectMults(d(2027, 1, 3));
ok(tolkien.borrowFavorMult === 1.5 && tolkien.shopDiscount === 1, '旧作者日不受新乘区影响');

// ── ③ 12/16 重叠 ──
const overlap = getEventEffectMults(d(2027, 12, 16));
ok(overlap.borrowFavorMult === 1.5, '12/16 奥斯汀 borrowFavor ×1.5 保留');
ok(overlap.shopDiscount === 0.5, '12/16 贝多芬 shopDiscount ×0.5 并存');
ok(getEventsOnDate(d(2027, 12, 16)).length === 2, '12/16 双活动并存');

// ── ④ 价格口径 ──
const saleDay = d(2027, 3, 21);   // 巴赫诞辰
const offDay = d(2027, 6, 15);    // 普通日
const cases = [[800, 400], [600, 300], [500, 250], [400, 200], [200, 100], [1, 1], [3, 2]]; // 末两个锁取整与下限
for (const [base, final] of cases) {
  const s = getMusicSalePrice(base, saleDay);
  ok(s.price === final && s.original === base && s.onSale === true, `半价日 ${base}→${final}（实际 ${s.price}）`);
}
ok(getMusicSalePrice(0, saleDay).onSale === false && getMusicSalePrice(0, saleDay).price === 0, '0 元档不参与折扣');
ok(getMusicSalePrice(-5, saleDay).price === 0, '负价防御为 0');
const noSale = getMusicSalePrice(800, offDay);
ok(noSale.price === 800 && noSale.original === 800 && noSale.onSale === false, '非活动日原价');

// ── ⑤ 展示格式 ──
ok(fmtZhe(0.5) === '5' && fmtOff(0.5) === '50', '0.5 → 五折 / -50%');
ok(fmtZhe(0.75) === '7.5' && fmtOff(0.75) === '25', '0.75 → 7.5折 / -25%');

console.log(`\nmusic-festival-sale：${pass} 通过，${fail} 失败`);
process.exit(fail ? 1 : 0);
