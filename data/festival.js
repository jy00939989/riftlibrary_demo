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
  },
  // 2026-10-17 图南指示：bug 修补补偿 + 10 月礼物（登录自动领，无兑换码）。
  // 背景：①M5 密钥迁移期间云端同步故障；②菜根谭事件（损坏扣字挖穿已完成周期，
  //       commit e624026 已修根因）。10 月考试季无大更新，11 月位面重建——文案带预告。
  // 数额按 10-17 指示减半（原拟 500 币/灵感 5/笔 5 支/便签 4）。
  octoberGift2026: {
    key: 'octoberGift2026',
    titleKey: 'festivalOctGiftTitle',
    descKey: 'festivalOctGiftDesc',
    diaryKey: 'diaryOctGift',
    emoji: '🍂',
    start: { month: 10, day: 17 },
    end: { month: 10, day: 31 },
    giftRewards: {
      coins: 250,
      inspiration: 2,
      items: {
        brush_reed_pen: 1,
        brush_swan_quill: 1,
        favor_note_targeted: 1,
        favor_note_random: 1
      }
    }
  }
};

/** 某活动是否在窗口内（默认现在；测试经 window.__dev.getNow 注入时间） */
export function isFestivalActive(key, now = getNow()) {
  const fest = FESTIVALS[key];
  if (!fest) return false;
  const d = new Date(now);
  return within(d.getMonth() + 1, d.getDate(), fest.start, fest.end);
}
