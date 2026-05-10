// 共享书籍池 —— 商店、里程碑、阿九推销共用
// 纯数据模块，不依赖任何其他模块
export const SHARED_POOL = [
  {
    bookId: 'book_003',
    title: '老人与海',
    author: '海明威',
    category: '小说',
    totalWords: 25000,
    chapterCount: 5,
    description: '一位古巴老渔夫与海洋的史诗对决。',
    emoji: '🎣'
  },
  {
    bookId: 'book_004',
    title: '东京梦华录',
    author: '孟元老',
    category: '历史',
    totalWords: 15000,
    chapterCount: 10,
    description: '北宋东京汴梁的繁华旧梦。',
    emoji: '🏙️'
  },
  {
    bookId: 'book_005',
    title: '傲慢与偏见',
    author: '简·奥斯汀',
    category: '小说',
    totalWords: 123000,
    chapterCount: 12,
    description: '跨越傲慢与偏见的爱情传奇。',
    emoji: '👒'
  },
  {
    bookId: 'book_006',
    title: '庄子',
    author: '庄子',
    category: '哲学',
    totalWords: 32500,
    chapterCount: 10,
    description: '逍遥游于天地之间，大美而不言。',
    emoji: '🦋'
  },
  {
    bookId: 'book_007',
    title: '本草纲目·草部',
    author: '李时珍',
    category: '科学',
    totalWords: 190000,
    chapterCount: 12,
    description: '东方医药宝典，草木皆有灵性。',
    emoji: '🌿'
  },
  {
    bookId: 'book_008',
    title: '物种起源',
    author: '达尔文',
    category: '科学',
    totalWords: 193000,
    chapterCount: 15,
    description: '物竞天择，适者生存。一场改变世界的科学革命。',
    emoji: '🐦'
  },
  {
    bookId: 'book_009',
    title: '红楼梦',
    author: '曹雪芹',
    category: '小说',
    totalWords: 400000,
    chapterCount: 24,
    description: '满纸荒唐言，一把辛酸泪。',
    emoji: '🏮'
  }
  // book_010 纯粹理性批判 — 不在此池，属于沈明远好感度专属
];
