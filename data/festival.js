// 双节活动单一真源（2026 中秋+国庆）：日期窗判定 + 节日礼定义
// 纯数据/纯函数模块，不依赖游戏状态。日期按本地时区的月/日判定（玩家体感口径）。

function getNow() {
  return (typeof window !== 'undefined' && window.__dev?.getNow?.()) || Date.now();
}

// 月/日比较：start ≤ (m,d) ≤ end（同年内；本活动 9/25–10/8 不跨年）
function within(m, d, start, end) {
  const after = m > start.month || (m === start.month && d >= start.day);
  const before = m < end.month || (m === end.month && d <= end.day);
  return after && before;
}

export const FESTIVALS = {
  midAutumn2026: {
    key: 'midAutumn2026',
    titleKey: 'festivalMidAutumnTitle',
    descKey: 'festivalMidAutumnDesc',
    emoji: '🌕',
    // 2026-09-25 中秋 → 10-08 国庆黄金周收官
    start: { month: 9, day: 25 },
    end: { month: 10, day: 8 },
    // 登录自动领（B 方案：活动窗内首次启动入账，claim 标记随云存档同步防重）
    giftRewards: {
      coins: 800,
      inspiration: 30,
      seeds: { bird_of_paradise: 1, magic_rose: 1, starlight_fern: 1 },
      signboards: ['mid_autumn_plaque']
    },
    // 通用兑换码（C 方案：社媒传播用；SQL 见 scripts/midautumn-2026-code-insert.sql，待图南执行）
    universalCode: 'GIFT-MOON-2026-NATL',
    universalCodeRewards: { coins: 200, inspiration: 5 }
  }
};

/** 某活动是否在窗口内（默认现在；测试经 window.__dev.getNow 注入时间） */
export function isFestivalActive(key, now = getNow()) {
  const fest = FESTIVALS[key];
  if (!fest) return false;
  const d = new Date(now);
  return within(d.getMonth() + 1, d.getDate(), fest.start, fest.end);
}
