// 长书卷组配置 —— 拆分书目、偏置/保底配置、查询工具
// 纯数据模块，不依赖任何其他模块

export const VOLUME_GROUPS = {
  book_007: {
    collectedBookId: 'book_007',
    title: '本草纲目·草部',
    emoji: '🌿',
    category: '科学',
    author: '李时珍',
    volumeIds: ['book_007_vol1', 'book_007_vol2'],
    volumePrice: 300,
    volumeCount: 2
  },
  book_008: {
    collectedBookId: 'book_008',
    title: '物种起源',
    emoji: '🐦',
    category: '科学',
    author: '达尔文',
    volumeIds: ['book_008_vol1', 'book_008_vol2'],
    volumePrice: 300,
    volumeCount: 2
  },
  book_009: {
    collectedBookId: 'book_009',
    title: '红楼梦',
    emoji: '🏮',
    category: '小说',
    author: '曹雪芹',
    volumeIds: ['book_009_vol1', 'book_009_vol2', 'book_009_vol3'],
    volumePrice: 367,
    volumeCount: 3
  },
  book_014: {
    collectedBookId: 'book_014',
    title: '史记',
    emoji: '📜',
    category: '历史',
    author: '司马迁',
    volumeIds: ['book_014_vol1', 'book_014_vol2', 'book_014_vol3', 'book_014_vol4'],
    volumePrice: 325,
    volumeCount: 4
  },
  book_016: {
    collectedBookId: 'book_016',
    title: '西游记',
    emoji: '🐒',
    category: '小说',
    author: '吴承恩',
    volumeIds: ['book_016_vol1', 'book_016_vol2', 'book_016_vol3',
                'book_016_vol4', 'book_016_vol5', 'book_016_vol6'],
    volumePrice: 317,
    volumeCount: 6
  },
  book_018: {
    collectedBookId: 'book_018',
    title: '几何原本',
    emoji: '📐',
    category: '科学',
    author: '欧几里得',
    volumeIds: ['book_018_vol1', 'book_018_vol2', 'book_018_vol3', 'book_018_vol4'],
    volumePrice: 350,
    volumeCount: 4
  },
  book_019: {
    collectedBookId: 'book_019',
    title: '卡拉马佐夫兄弟',
    emoji: '⚖️',
    category: '哲学',
    author: '陀思妥耶夫斯基',
    volumeIds: ['book_019_vol1', 'book_019_vol2', 'book_019_vol3'],
    volumePrice: 400,
    volumeCount: 3
  },
  book_013: {
    collectedBookId: 'book_013',
    title: '理想国',
    emoji: '🏺',
    category: '哲学',
    author: '柏拉图',
    volumeIds: ['book_013_vol1', 'book_013_vol2'],
    volumePrice: 400,
    volumeCount: 2
  },
  book_030: {
    collectedBookId: 'book_030',
    title: '英吉利教会史',
    emoji: '⛪',
    category: '历史',
    author: '比德',
    volumeIds: ['book_030_vol1', 'book_030_vol2', 'book_030_vol3'],
    volumePrice: 325,
    volumeCount: 3
  },
  book_031: {
    collectedBookId: 'book_031',
    title: '亚瑟王之死',
    emoji: '⚔️',
    category: '小说',
    author: '托马斯·马洛礼',
    volumeIds: ['book_031_vol1', 'book_031_vol2', 'book_031_vol3', 'book_031_vol4'],
    volumePrice: 350,
    volumeCount: 4
  },
  book_032: {
    collectedBookId: 'book_032',
    title: '坎特伯雷故事集',
    emoji: '📖',
    category: '诗歌',
    author: '杰弗里·乔叟',
    volumeIds: ['book_032_vol1', 'book_032_vol2', 'book_032_vol3'],
    volumePrice: 325,
    volumeCount: 3
  },
  book_034: {
    collectedBookId: 'book_034',
    title: '秘密花园',
    emoji: '🌳',
    category: '小说',
    author: '弗朗西丝·霍奇森·伯内特',
    volumeIds: ['book_034_vol1', 'book_034_vol2'],
    volumePrice: 300,
    volumeCount: 2
  }
};

/** 商店刷新动态轻偏置配置 */
export const VOLUME_REFRESH = {
  baseWeight: 1.0,        // 普通书 / 未拥有卷组的卷的基础权重
  minBias: 2.0,           // 拥有 1 卷时的偏置系数
  maxBias: 5.0,           // 拥有 total-1 卷时的偏置系数
  // 动态公式：bias = minBias + (owned / total) * (maxBias - minBias)
  // 例：6 卷组拥有 1 卷 → 2.5；拥有 3 卷 → 3.5；拥有 5 卷 → 5.0
  // 2 卷组拥有 1 卷 → 3.5
};

/** 临门一脚保底配置 */
export const VOLUME_GUARANTEE = {
  enabled: true,
  triggerGap: 1,          // gap === 1 时触发
  maxPerRefresh: 1        // 每轮刷新最多保 1 条，避免占满商店
};

/** 判断某 bookId 是否是卷组中的单卷 */
export function isVolumeBookId(bookId) {
  return Object.values(VOLUME_GROUPS).some(g => g.volumeIds.includes(bookId));
}

/** 根据单卷 ID 找到所属卷组 */
export function getVolumeGroupByVolumeId(volumeId) {
  return Object.values(VOLUME_GROUPS).find(g => g.volumeIds.includes(volumeId)) || null;
}

/** 根据典藏版 ID 找到卷组 */
export function getVolumeGroupByCollectedId(collectedId) {
  return VOLUME_GROUPS[collectedId] || null;
}

/**
 * 计算卷组的抄写进度（纯函数，不读 state）
 * completed：已抄写完成且未损坏（不含借出状态），用于卷追踪面板
 * booksData：{ [id]: bookState }
 */
export function getVolumeGroupProgress(group, booksData) {
  const completed = group.volumeIds.filter(id => {
    const bs = booksData[id];
    return bs && bs.status === 'completed' && !bs.damaged;
  }).length;
  return { completed, total: group.volumeCount };
}

/**
 * 返回"已拥有部分卷但未集齐"的卷组（供轻偏置判定 / 裴舟推荐）
 * 纯函数，传入 booksData
 */
export function getIncompleteVolumeGroups(booksData) {
  return Object.values(VOLUME_GROUPS).filter(g => {
    const owned = g.volumeIds.filter(id => {
      const bs = booksData[id];
      return bs && bs.status !== 'locked';
    });
    return owned.length > 0 && owned.length < g.volumeCount;
  });
}

/**
 * 卷组章节分配表：每个卷组 -> [每卷包含的章节下标（从 0 开始）]
 * 用于拆分脚本和单卷 meta 生成
 */
export const VOLUME_CHAPTER_RANGES = {
  book_007: [[0, 1, 2, 3, 4, 5], [6, 7, 8, 9, 10, 11]],
  book_008: [[0, 1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12, 13, 14]],
  book_009: [[0, 1, 2, 3, 4, 5, 6, 7], [8, 9, 10, 11, 12, 13, 14, 15], [16, 17, 18, 19, 20, 21, 22, 23]],
  book_013: [[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]],
  book_014: [[0, 1, 2], [3, 4, 5], [6, 7], [8, 9]],
  book_016: [[0, 1, 2], [3, 4], [5, 6], [7, 8, 9], [10, 11, 12], [13, 14]],
  book_018: [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11, 12]],
  book_019: [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11]],
  book_030: [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [10, 11, 12, 13, 14, 15, 16, 17, 18, 19], [20, 21, 22, 23, 24, 25, 26, 27, 28, 29]],
  book_031: [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [10, 11, 12, 13, 14, 15, 16, 17, 18, 19], [20, 21, 22, 23, 24, 25, 26, 27, 28, 29], [30, 31, 32, 33, 34, 35, 36, 37, 38, 39]],
  book_032: [[0, 1, 2, 3, 4, 5, 6, 7], [8, 9, 10, 11, 12, 13, 14, 15], [16, 17, 18, 19, 20, 21, 22, 23]],
  book_034: [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]]
};

/** 单卷标题后缀（中文数字） */
export const VOLUME_INDEX_NAMES = ['一', '二', '三', '四', '五', '六'];
