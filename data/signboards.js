// 标志牌定义 —— 馆内装潢/标志牌系统
// 纯数据模块，不依赖任何其他模块
// buff 为技术债，当前仅作收集展示

export const SIGNBOARDS = {
  keep_quiet: {
    id: 'keep_quiet',
    name: '请保持安静',
    emoji: '🤫',
    icon: '🤫',
    description: '轻声细语，守护这片宁静的阅读空间。',
    price: 200,
    page: 'focus',       // 挂在缮写室页面
    buff: null           // 技术债：缮写速率 +3%
  },
  no_smoking: {
    id: 'no_smoking',
    name: '禁止烟火',
    emoji: '🚭',
    icon: '🚭',
    description: '古籍怕火，请勿在馆内吸烟或使用明火。',
    price: 250,
    page: 'visitors',    // 挂在读者沙龙
    buff: null           // 技术债：访客负面事件 -25%
  },
  welcome: {
    id: 'welcome',
    name: '欢迎光临',
    emoji: '☕',
    icon: '☕',
    description: '一杯热茶，一本好书，欢迎每一位到访的旅人。',
    price: 200,
    page: 'visitors',    // 挂在读者沙龙
    buff: null           // 技术债：新访客出现间隔 -15%
  },
  curator_pick: {
    id: 'curator_pick',
    name: '馆长推荐',
    emoji: '📖',
    icon: '📖',
    description: '馆长亲自推荐的书目，总有你意想不到的惊喜。',
    price: 300,
    page: 'bookshelf',   // 挂在大书库
    buff: null           // 技术债：新书售价 9 折
  },
  hourglass: {
    id: 'hourglass',
    name: '时光沙漏',
    emoji: '⏳',
    icon: '⏳',
    description: '沙漏缓缓流淌，提醒着每一位誊抄者珍惜眼前的时光。',
    price: 250,
    page: 'focus',       // 挂在缮写室页面
    buff: null           // 技术债：番茄钟结束后额外 +5 氛围
  }
};
