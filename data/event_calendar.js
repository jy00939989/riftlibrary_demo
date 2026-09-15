// 展览厅限时活动日历（exhibition-hall-plan §4）——单一真源
// 纯数据 + 纯函数：无 state/DOM 依赖，Node 可测；判定读系统日期，调用方负责时机（页面渲染/结算/日界 tick）
//
// 结构契约（§4.3 演化路线预留）：id 可扩展 reward 字段，不写死 effect-only；
// monthSpan 类区间仅用于展示层（横幅），数值判定保持单日等值（grill #3 书香苏州 C 拍板）。

export const EVENT_CALENDAR = [
  { id: 'tolkien_birthday', month: 1, day: 3, nameKey: 'evtTolkienBirthday', type: 'author',
    effect: { borrowFavorMult: 1.5 } },
  { id: 'children_book_day', month: 4, day: 2, nameKey: 'evtChildrenBookDay', type: 'festival',
    effect: { focusCoinsMult: 1.1 } },
  // 4/23 世界读书日 × 书香苏州合并峰值（grill #3 C：书香苏州 4 月整月仅展示横幅，
  // 数值峰值与读书日合并为单日 focusCoinsMult 1.2，不引入区间逻辑进数值层）
  { id: 'world_book_day', month: 4, day: 23, nameKey: 'evtWorldBookDay', type: 'festival',
    effect: { focusCoinsMult: 1.2 } },
  { id: 'agatha_birthday', month: 9, day: 15, nameKey: 'evtAgathaBirthday', type: 'author',
    effect: { borrowFavorMult: 1.5 } },
  { id: 'luxun_birthday', month: 9, day: 25, nameKey: 'evtLuxunBirthday', type: 'author',
    effect: { borrowFavorMult: 1.5 } },
  { id: 'qianzhongshu_birthday', month: 10, day: 16, nameKey: 'evtQianzhongshuBirthday', type: 'author',
    effect: { borrowFavorMult: 1.5 } },
  { id: 'austen_birthday', month: 12, day: 16, nameKey: 'evtAustenBirthday', type: 'author',
    effect: { borrowFavorMult: 1.5 } },
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

/**
 * 某日活动增益乘区（双 hook：作家诞辰 borrowFavorMult / 节日 focusCoinsMult，grill #2）。
 * 多日命中取连乘（当前日历无重叠日；预留保险）。无命中返回 1/1，零永久遗留。
 */
export function getEventEffectMults(date = new Date()) {
  const mults = { borrowFavorMult: 1, focusCoinsMult: 1 };
  getEventsOnDate(date).forEach(e => {
    if (e.effect?.borrowFavorMult) mults.borrowFavorMult *= e.effect.borrowFavorMult;
    if (e.effect?.focusCoinsMult) mults.focusCoinsMult *= e.effect.focusCoinsMult;
  });
  return mults;
}
