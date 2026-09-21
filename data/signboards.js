// 标志牌定义 —— 馆内装潢/标志牌系统
// 纯数据模块，不依赖任何其他模块

export const SIGNBOARDS = {
  keep_quiet: {
    id: 'keep_quiet',
    name: '请保持安静',
    emoji: '🤫',
    icon: '🤫',
    description: '轻声细语，守护这片宁静的阅读空间。',
    price: 400,
    page: 'focus',       // 挂在缮写室页面
    buff: { type: 'focus_speed', value: 0.01, desc: '缮写速率 +1%' }
  },
  no_smoking: {
    id: 'no_smoking',
    name: '禁止烟火',
    emoji: '🚭',
    icon: '🚭',
    description: '古籍怕火，请勿在馆内吸烟或使用明火。',
    price: 500,
    page: 'visitors',    // 挂在读者沙龙
    buff: { type: 'water_crit', value: 0.20, desc: '浇水时有几率暴击 ×2 成长' }
  },
  welcome: {
    id: 'welcome',
    name: '欢迎光临',
    emoji: '☕',
    icon: '☕',
    description: '一杯热茶，一本好书，欢迎每一位到访的旅人。',
    price: 400,
    page: 'visitors',    // 挂在读者沙龙
    buff: { type: 'spawn_chance', value: 0.03, desc: '访客到来概率 +3%' }
  },
  curator_pick: {
    id: 'curator_pick',
    name: '馆长推荐',
    emoji: '📖',
    icon: '📖',
    description: '馆长亲自推荐的书目，总有你意想不到的惊喜。',
    price: 600,
    page: 'bookshelf',   // 挂在大书库
    buff: { type: 'shop_discount', value: 0.02, desc: '商店买书额外折扣 2%' }
  },
  hourglass: {
    id: 'hourglass',
    name: '时光沙漏',
    emoji: '⏳',
    icon: '⏳',
    description: '沙漏缓缓流淌，提醒着每一位誊抄者珍惜眼前的时光。',
    price: 500,
    page: 'focus',       // 挂在缮写室页面
    buff: { type: 'long_focus_inspiration', value: 0, desc: '专注≥60分钟后概率获得额外灵感' }
  },
  care_for_books: {
    id: 'care_for_books',
    name: '爱惜书籍',
    emoji: '📖',
    icon: '📖',
    description: '墨墨亲手写的提示牌：请像对待羽毛笔一样对待每一本书。',
    price: 600,
    page: 'visitors',    // 挂在读者沙龙
    buff: { type: 'damage_reduction', value: 0.01, desc: '访客还书时损坏概率 -1%' }
  },
  pioneer_ink: {
    id: 'pioneer_ink',
    name: '先驱者的墨印',
    emoji: '🏛️',
    icon: '🏛️',
    image: 'visual/signboards/sign_pioneer.png',
    description: '第一批踏入归墟图书馆的读者留下的印记，时光在此流速稍缓。全球限量 10 个。',
    price: 0,
    maxCount: 10,
    page: 'focus',
    buff: { type: 'focus_speed', value: 0.03, desc: '缮写速率 +3%' }
  },
  opening_plaque: {
    id: 'opening_plaque',
    name: '开馆纪念牌',
    emoji: '🦉',
    icon: '🦉',
    image: 'visual/signboards/sign_opening.png',
    description: '归墟图书馆正式开馆的纪念，墨墨亲手挂上的牌子。限量 100 个。',
    price: 0,
    maxCount: 100,
    page: 'focus',
    buff: { type: 'focus_speed', value: 0.02, desc: '缮写速率 +2%' }
  },
  cat_chief: {
    id: 'cat_chief',
    name: '猫馆长',
    emoji: '🐱',
    icon: '🐱',
    description: '一只神情严肃的橘猫，编制上属于图书馆正式员工。有它在，老鼠不敢造次。',
    price: 900,
    page: 'bookshelf',
    buff: { type: 'disaster_defense', target: 'rat', value: 0.85, desc: '鼠患概率 -85%' }
  },
  dehumidifier: {
    id: 'dehumidifier',
    name: '除湿炭包',
    emoji: '🧺',
    icon: '🧺',
    description: '挂在书架角落的竹炭包，默默吸走潮气。书页不再长出灰绿色的地图。',
    price: 650,
    page: 'bookshelf',
    buff: { type: 'disaster_defense', target: 'mold', value: 0.75, desc: '潮湿霉斑概率 -75%' }
  },
  fire_notice: {
    id: 'fire_notice',
    name: '防火标识',
    emoji: '🧯',
    icon: '🧯',
    description: '墨墨用爪印按出来的告示：烛台远离书架，墨水瓶远离烛台。图书馆安全，人人有责。',
    price: 1500,
    page: 'bookshelf',
    buff: { type: 'disaster_defense', target: 'fire', value: 0.88, desc: '火灾概率 -88%' }
  },
  camphor_bookmark: {
    id: 'camphor_bookmark',
    name: '樟木书签',
    emoji: '🪵',
    icon: '🪵',
    description: '一片薄薄的樟木，夹在书页间散发出冷冷的清香。蛀虫闻了直摇头，纷纷搬家。',
    price: 700,
    page: 'bookshelf',
    buff: { type: 'disaster_defense', target: 'worm', value: 0.70, desc: '蛀虫概率 -70%' }
  },
  sealed_window: {
    id: 'sealed_window',
    name: '密封窗棂',
    emoji: '🪟',
    icon: '🪟',
    description: '谷雨亲手糊的窗纸，又加了一道木栓。台风天，雨点在窗外发脾气，书里一片干燥。',
    price: 800,
    page: 'bookshelf',
    buff: { type: 'disaster_defense', target: 'typhoon_books', value: 0.80, desc: '台风波及书籍概率 -80%' }
  },
  // 2026 中秋·国庆双节纪念牌：活动窗内登录自动发放（giftOnly，不可购买），暂用 emoji 立绘，图出图后补 image
  mid_autumn_plaque: {
    id: 'mid_autumn_plaque',
    name: '中秋纪念牌',
    emoji: '🌕',
    icon: '🌕',
    description: '2026 中秋与国庆相逢，图书馆挂起一轮不会落下的圆月。限时不限量——只要在双节期间推开馆门，它就在那里。',
    price: 0,
    giftOnly: true,
    page: 'focus',
    buff: { type: 'focus_speed', value: 0.02, desc: '缮写速率 +2%' }
  }
};
