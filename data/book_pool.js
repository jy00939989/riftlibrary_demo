// 共享书籍池 —— 商店、里程碑、阿九推销共用
// 纯数据模块，不依赖任何其他模块
export const SHARED_POOL = [
  {
    plane: 'astral',
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
    plane: 'astral',
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
    plane: 'astral',
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
    plane: 'astral',
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
    plane: 'astral',
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
    plane: 'astral',
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
    plane: 'astral',
    bookId: 'book_009',
    title: '红楼梦',
    author: '曹雪芹',
    category: '小说',
    totalWords: 400000,
    chapterCount: 24,
    description: '满纸荒唐言，一把辛酸泪。',
    emoji: '🏮'
  },
  // book_010 纯粹理性批判 — 沈明远好感度专属，不进商店池
  // book_021 第一哲学沉思集 — 沈明远好感度专属
  // book_022 传习录 — 沈明远好感度专属

  // 二期新增 10 本（book_011~020）
  {
    plane: 'astral',
    bookId: 'book_011',
    title: '道德经',
    author: '老子',
    category: '哲学',
    totalWords: 5162,
    chapterCount: 5,
    description: '五千言道尽天地玄机，中国哲学的源头活水。',
    emoji: '☯️'
  },
  {
    plane: 'astral',
    bookId: 'book_012',
    title: '沉思录',
    author: '马可·奥勒留',
    category: '哲学',
    totalWords: 80000,
    chapterCount: 5,
    description: '罗马皇帝的哲学日记，斯多葛派的永恒经典。',
    emoji: '🏛️'
  },
  {
    plane: 'astral',
    bookId: 'book_013',
    title: '理想国',
    author: '柏拉图',
    category: '哲学',
    totalWords: 300000,
    chapterCount: 10,
    description: '西方哲学的奠基之作，关于正义与理想城邦的永恒对话。',
    emoji: '🏺'
  },
  {
    plane: 'astral',
    bookId: 'book_014',
    title: '史记',
    author: '司马迁',
    category: '历史',
    totalWords: 530000,
    chapterCount: 10,
    description: '史家之绝唱，无韵之离骚。三千年兴衰尽在其中。',
    emoji: '📜'
  },
  {
    plane: 'astral',
    bookId: 'book_015',
    title: '诗经',
    author: '孔子编订',
    category: '诗歌',
    totalWords: 39000,
    chapterCount: 6,
    description: '诗三百，一言以蔽之，曰思无邪。',
    emoji: '🌸'
  },
  {
    plane: 'astral',
    bookId: 'book_016',
    title: '西游记',
    author: '吴承恩',
    category: '小说',
    totalWords: 860000,
    chapterCount: 15,
    description: '神魔皆有人情，精魅亦通世故。中国古典四大名著之一。',
    emoji: '🐒'
  },
  {
    plane: 'astral',
    bookId: 'book_017',
    title: '鲁滨逊漂流记',
    author: '丹尼尔·笛福',
    category: '小说',
    totalWords: 150000,
    chapterCount: 8,
    description: '二十八年的荒岛求生，人类意志与智慧的赞歌。',
    emoji: '🏝️'
  },
  {
    plane: 'astral',
    bookId: 'book_018',
    title: '几何原本',
    author: '欧几里得',
    category: '科学',
    totalWords: 600000,
    chapterCount: 13,
    description: '人类历史上最成功的教科书，演绎推理的不朽典范。',
    emoji: '📐'
  },
  {
    plane: 'astral',
    bookId: 'book_019',
    title: '卡拉马佐夫兄弟',
    author: '陀思妥耶夫斯基',
    category: '哲学',
    totalWords: 450000,
    chapterCount: 12,
    description: '一部关于信仰、理性与自由意志的文学巅峰。',
    emoji: '⚖️'
  },
  {
    plane: 'astral',
    bookId: 'book_020',
    title: '社会契约论',
    author: '卢梭',
    category: '哲学',
    totalWords: 80000,
    chapterCount: 4,
    description: '人生而自由，却无往不在枷锁之中。现代民主的理论基石。',
    emoji: '🗽'
  }
];
