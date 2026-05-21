// 位面定义 —— 归墟图书馆连接的诸世界
// 纯数据模块，不依赖任何其他模块

export const PLANES = {
  astral: {
    id: 'astral',
    name: '星界·归墟',
    emoji: '⭐',
    desc: '你的图书馆本体，位面枢纽。坐落在世界之间的裂隙中，书架延伸向无尽的星海。',
    unlocked: true,
    unlock: null, // 默认解锁
    characters: [], // 本馆无专属角色（访客来自各位面）
    mementos: [],
    bgClass: 'plane-astral'
  },

  pastoral: {
    id: 'pastoral',
    name: '田园瘟疫纪事',
    emoji: '🌾',
    desc: '一个中世纪田园位面。麦浪翻涌的山谷中，村庄静静安睡——直到瘟疫降临，愚昧与知识展开了搏斗。',
    unlocked: false,
    unlock: {
      atmo: 80,
      books: 12,
      shopUpgrade: 'plane_portal_pastoral'
    },
    characters: [
      { id: 'pastoral_child', name: '小艾拉', emoji: '👧', role: '普通孩子', unlockStage: 1,
        desc: '一个安静的女孩，在图书馆里从童话读到草药书，成为瘟疫中最年轻的眼睛。' },
      { id: 'pastoral_herbalist', name: '玛格丽特', emoji: '🌿', role: '草药师', unlockStage: 1,
        desc: '被村民称为"女巫"的女人。她比任何人都懂草药，也比任何人都孤独。' },
      { id: 'pastoral_lord', name: '杜兰伯爵', emoji: '⚔️', role: '领主', unlockStage: 4,
        desc: '封地的统治者。他相信秩序比慈悲更能拯救生命——直到事实证明他错了。' },
      { id: 'pastoral_scholar', name: '艾德里安', emoji: '📖', role: '年轻学者', unlockStage: 3,
        desc: '伯爵之子，在禁书中发现了另一个世界。他的知识将成为瘟疫的解药。' },
      { id: 'pastoral_nun', name: '卡特琳修女', emoji: '🕯️', role: '流浪修女', unlockStage: 2,
        desc: '在瘟疫中照顾病患，在祈祷中质疑信仰。她的双手沾满血，但信念从未动摇。' }
    ],
    mementos: [
      { id: 'recipe', name: '玛格丽特的草药配方', emoji: '📝', unlockStage: 2 },
      { id: 'letter', name: '伯爵的开放令', emoji: '📜', unlockStage: 3 },
      { id: 'storybook', name: '小艾拉的童话书页', emoji: '📄', unlockStage: 3 },
      { id: 'lamp', name: '卡特琳的蜡烛', emoji: '🕯️', unlockStage: 4 },
      { id: 'manuscript', name: '艾德里安的研究手稿', emoji: '📚', unlockStage: 5 }
    ],
    bgClass: 'plane-pastoral',
    theme: {
      colors: '琥珀与鼠尾草绿',
      mood: '田园 → 阴郁 → 复苏',
      music: '田园牧歌 → 瘟疫低音 → 曙光'
    }
  },

  // 预留位面
  placeholder: {
    id: 'placeholder',
    name: '？？？',
    emoji: '🔒',
    desc: '传送门尚未开启，未知的世界在裂隙的另一侧等待。',
    unlocked: false,
    unlock: null,
    characters: [],
    mementos: [],
    bgClass: '',
    isPlaceholder: true
  }
};

// 已实装的位面列表（按解锁顺序排列）
export const ACTIVE_PLANES = ['astral', 'pastoral'];

// 位面解锁条件检查
export function canUnlockPlane(planeId, state) {
  const plane = PLANES[planeId];
  if (!plane || plane.unlocked || !plane.unlock) return false;
  const { atmo, books, shopUpgrade } = plane.unlock;

  const atmoOk = (state.library.atmosphere || 0) >= atmo;
  const booksOk = Object.values(state.books || {}).filter(
    b => b && b.status !== 'locked'
  ).length >= books;
  // shopUpgrade 为空表示无前置升级要求；非空则检查是否还未购买（避免重复购买）
  const upgradeOk = !shopUpgrade || !(state.library.planePortals && state.library.planePortals[shopUpgrade]);

  return atmoOk && booksOk && upgradeOk;
}
