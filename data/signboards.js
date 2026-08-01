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
  }
};
