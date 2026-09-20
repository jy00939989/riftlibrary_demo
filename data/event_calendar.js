// 展览厅限时活动日历（exhibition-hall-plan §4）——单一真源
// 纯数据 + 纯函数：无 state/DOM 依赖，Node 可测；判定读系统日期，调用方负责时机（页面渲染/结算/日界 tick）
//
// 结构契约（§4.3 演化路线预留）：id 可扩展 reward 字段，不写死 effect-only；
// monthSpan 类区间仅用于展示层（横幅），数值判定保持单日等值（grill #3 书香苏州 C 拍板）。
// 2026-09-20 图南拍板新增 type:'music' 音乐节日（半价日，单日等值）：effect.shopDiscount 乘区。

export const EVENT_CALENDAR = [
  { id: 'tolkien_birthday', month: 1, day: 3, nameKey: 'evtTolkienBirthday', type: 'author',
    effect: { borrowFavorMult: 1.5 } },
  { id: 'mozart_birthday', month: 1, day: 27, nameKey: 'evtMozartBirthday', type: 'music',
    effect: { shopDiscount: 0.5 } },
  { id: 'vivaldi_birthday', month: 3, day: 4, nameKey: 'evtVivaldiBirthday', type: 'music',
    effect: { shopDiscount: 0.5 } },
  { id: 'bach_birthday', month: 3, day: 21, nameKey: 'evtBachBirthday', type: 'music',
    effect: { shopDiscount: 0.5 } },
  { id: 'children_book_day', month: 4, day: 2, nameKey: 'evtChildrenBookDay', type: 'festival',
    effect: { focusCoinsMult: 1.1 } },
  { id: 'jazz_day', month: 4, day: 30, nameKey: 'evtJazzDay', type: 'music',
    effect: { shopDiscount: 0.5 } },
  // 4/23 世界读书日 × 书香苏州合并峰值（grill #3 C：书香苏州 4 月整月仅展示横幅，
  // 数值峰值与读书日合并为单日 focusCoinsMult 1.2，不引入区间逻辑进数值层）
  { id: 'world_book_day', month: 4, day: 23, nameKey: 'evtWorldBookDay', type: 'festival',
    effect: { focusCoinsMult: 1.2 } },
  { id: 'agatha_birthday', month: 9, day: 15, nameKey: 'evtAgathaBirthday', type: 'author',
    effect: { borrowFavorMult: 1.5 } },
  { id: 'luxun_birthday', month: 9, day: 25, nameKey: 'evtLuxunBirthday', type: 'author',
    effect: { borrowFavorMult: 1.5 } },
  { id: 'intl_music_day', month: 10, day: 1, nameKey: 'evtIntlMusicDay', type: 'music',
    effect: { shopDiscount: 0.5 } },
  { id: 'qianzhongshu_birthday', month: 10, day: 16, nameKey: 'evtQianzhongshuBirthday', type: 'author',
    effect: { borrowFavorMult: 1.5 } },
  // 12/16 贝多芬与简·奥斯汀同日：两活动并存，shopDiscount × borrowFavorMult 各算各的（多日重叠连乘预留）
  { id: 'austen_birthday', month: 12, day: 16, nameKey: 'evtAustenBirthday', type: 'author',
    effect: { borrowFavorMult: 1.5 } },
  { id: 'beethoven_birthday', month: 12, day: 16, nameKey: 'evtBeethovenBirthday', type: 'music',
    effect: { shopDiscount: 0.5 } },
];

// 整月展示横幅（monthSpan 仅展示层）：4 月「书香苏州」（苏州市全民阅读系列活动，图南苏州人指定收录）
export const MONTH_BANNERS = [
  { id: 'book_suzhou_month', month: 4, nameKey: 'evtBookSuzhouMonth' },
];

/** 某日命中的活动日列表（不设时分秒，纯日历日等值判定） */
export function getEventsOnDate(date = new Date()) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return EVENT_CALENDAR.filter(e => e.month === m && e.day === d);
}

/** 是否活动日（页面加载/日界 tick 两处询问；结算侧直接用 getEventEffectMults 乘区） */
export function isEventDay(date = new Date()) {
  return getEventsOnDate(date).length > 0;
}

/** 某日命中的整月横幅（无则 null） */
export function getMonthBanner(date = new Date()) {
  const m = date.getMonth() + 1;
  return MONTH_BANNERS.find(b => b.month === m) || null;
}

// 折扣显示格式（纯函数，展示层共用）：0.5 → '5'（五折）/ fmtOff → '50'
export function fmtZhe(mult) { return String(parseFloat((mult * 10).toFixed(2))); }
export function fmtOff(mult) { return String(Math.round((1 - mult) * 100)); }

/**
 * 某日活动增益乘区（三 hook：作家诞辰 borrowFavorMult / 读书节 focusCoinsMult / 音乐节日 shopDiscount，
 * grill #2 + 2026-09-20 音乐节日拍板）。
 * 多日命中取连乘（12/16 贝多芬×奥斯汀并存，两乘区互不干扰）。无命中全返回 1，零永久遗留。
 */
export function getEventEffectMults(date = new Date()) {
  const mults = { borrowFavorMult: 1, focusCoinsMult: 1, shopDiscount: 1 };
  getEventsOnDate(date).forEach(e => {
    if (e.effect?.borrowFavorMult) mults.borrowFavorMult *= e.effect.borrowFavorMult;
    if (e.effect?.focusCoinsMult) mults.focusCoinsMult *= e.effect.focusCoinsMult;
    if (e.effect?.shopDiscount) mults.shopDiscount *= e.effect.shopDiscount;
  });
  return mults;
}
