// 馆长目标阶梯 —— 5个阶段，对应5个氛围层级
// 纯数据模块，不引入 DOM 依赖。check() 均为 state 纯函数。

/**
 * 氛围阶段映射：
 *   1: 废墟残响 (0-29)
 *   2: 破败 (30-79)
 *   3: 陈旧 (80-159)
 *   4: 温暖 (160-299)
 *   5: 星辰之境 (300-500)
 *
 * 每阶 3-4 个子目标，覆盖专注/书籍/访客/设施/植物/位面/标志牌/成就 维度。
 */

// ---- 辅助 ----

function countCompletedBooks(s) {
  return Object.values(s.books || {}).filter(b => b.status === 'completed').length;
}

function countUniqueVisitors(s) {
  if (!s.visitorFavors) return 0;
  return Object.values(s.visitorFavors).filter(v => v > 0).length;
}

function hasBorrowedOrVisited(s) {
  return (s.visitors || []).length > 0 || (s.borrowRecords || []).length > 0;
}

function checkAnyPlaneUnlocked(s) {
  if (s.quests && s.quests.pastoral && s.quests.pastoral.unlocked) return true;
  const portals = s.library && s.library.planePortals;
  if (!portals) return false;
  return Object.values(portals).some(p => p && p.unlocked);
}

function countAchievements(s) {
  return (s.achievements || []).length;
}

// ---- 阶定义 ----

export const TIER_GOALS = [
  {
    id: 'tier1',
    level: 1,
    stageMin: 0,
    stageMax: 29,
    name: '推开馆门',
    emoji: '🚪',
    subtitle: '废墟中的第一道门',
    flavor: '你站在门外太久了。门缝里漏出的光浮动着灰尘和某种古老的回响。推门进去——这座图书馆，现在是你的了。在缮写室落下第一笔，然后去大书库看看手稿箱里有什么。',
    image: 'visual/tiers/tier1_unlock.jpg',
    rewardCoins: 30,
    rewardAtmo: 5,
    goals: [
      { id: 't1g1', icon: '📖', label: '完成新手引导',       check: (s) => s.introCompleted === true },
      { id: 't1g2', icon: '🕯️', label: '开始第一次专注',     check: (s) => (s.focus && s.focus.totalMinutes > 0) },
      { id: 't1g3', icon: '✍️', label: '完成第一次誊抄',     check: (s) => (s.focus && s.focus.totalWords > 0) },
      { id: 't1g4', icon: '📚', label: '打开大书库查看手稿箱', check: (s) => (s.guideQuests && s.guideQuests.completed || []).includes('q04') },
    ]
  },
  {
    id: 'tier2',
    level: 2,
    stageMin: 30,
    stageMax: 79,
    name: '烛火初明',
    emoji: '🕯️',
    subtitle: '第一簇烛光亮起',
    flavor: '你费力地扶正第三排书架——它不再摇晃了。第一本书被誊抄完成，烛光照亮了整个东厅。你还不太熟悉这里，但图书馆已经开始记得你的温度。',
    image: 'visual/tiers/tier2_unlock.jpg',
    rewardCoins: 50,
    rewardAtmo: 10,
    goals: [
      { id: 't2g1', icon: '✅', label: '誊抄完成第一本书',    check: (s) => countCompletedBooks(s) >= 1 },
      { id: 't2g2', icon: '🛒', label: '在商店购买新书',      check: (s) => (s.guideQuests && s.guideQuests.completed || []).includes('q05') },
      { id: 't2g3', icon: '⬆️', label: '升级借阅区至 Lv.1',  check: (s) => (s.library && s.library.borrowLevel || 0) >= 1 },
      { id: 't2g4', icon: '👤', label: '迎来第一位访客',      check: (s) => hasBorrowedOrVisited(s) },
    ]
  },
  {
    id: 'tier3',
    level: 3,
    stageMin: 80,
    stageMax: 159,
    name: '典籍渐满',
    emoji: '📚',
    subtitle: '书香渐浓，秩序初成',
    flavor: '现在走进图书馆，首先注意到的不再是破败，而是安静——一种被妥善维护的、有尊严的安静。书架站稳了，书脊整齐排列。角落里那株植物见证了这一切。',
    image: 'visual/tiers/tier3_unlock.jpg',
    rewardCoins: 80,
    rewardAtmo: 15,
    goals: [
      { id: 't3g1', icon: '📖', label: '完成 5 本书',           check: (s) => countCompletedBooks(s) >= 5 },
      { id: 't3g2', icon: '⏱️', label: '累计专注 120 分钟',    check: (s) => (s.focus && s.focus.totalMinutes >= 120) },
      { id: 't3g3', icon: '👥', label: '吸引 3 位不同访客',    check: (s) => countUniqueVisitors(s) >= 3 },
      { id: 't3g4', icon: '🌿', label: '拥有一株植物',          check: (s) => !!(s.plant && s.plant.activeType) },
    ]
  },
  {
    id: 'tier4',
    level: 4,
    stageMin: 160,
    stageMax: 299,
    name: '登堂入室',
    emoji: '🏛️',
    subtitle: '不只是建筑，而是庇护所',
    flavor: '图书馆有了一种特别的温度——不是壁炉的温度，而是被许多人触碰过的温度。访客们开始在这里停留，不只是借书，而是坐下阅读。异世界的门扉也悄然开启。',
    image: 'visual/tiers/tier4_unlock.jpg',
    rewardCoins: 120,
    rewardAtmo: 20,
    goals: [
      { id: 't4g1', icon: '📚', label: '完成 10 本书',       check: (s) => countCompletedBooks(s) >= 10 },
      { id: 't4g2', icon: '🌌', label: '解锁一个位面',       check: (s) => checkAnyPlaneUnlocked(s) },
      { id: 't4g3', icon: '👥', label: '吸引 6 位不同访客',  check: (s) => countUniqueVisitors(s) >= 6 },
      { id: 't4g4', icon: '🪧', label: '购买一个标志牌',      check: (s) => (s.signboards || []).length >= 1 },
    ]
  },
  {
    id: 'tier5',
    level: 5,
    stageMin: 300,
    stageMax: 500,
    name: '星辰之境',
    emoji: '✨',
    subtitle: '奇迹在此栖息',
    flavor: '某个深夜，你誊抄完最后一页。抬起头，发现图书馆的穹顶变成了星空——那是所有被誊抄过的文字，在天花板上化为了光点。你已经把一座废墟，变成了一方世界。',
    image: 'visual/tiers/tier5_unlock.jpg',
    rewardCoins: 200,
    rewardAtmo: 30,
    goals: [
      { id: 't5g1', icon: '📚', label: '完成 15 本书',       check: (s) => countCompletedBooks(s) >= 15 },
      { id: 't5g2', icon: '👥', label: '吸引全部 10 位访客', check: (s) => countUniqueVisitors(s) >= 10 },
      { id: 't5g3', icon: '🏆', label: '解锁 15 个成就',     check: (s) => countAchievements(s) >= 15 },
      { id: 't5g4', icon: '⭐', label: '氛围达到 500',       check: (s) => (s.library && s.library.atmosphere >= 500) },
    ]
  }
];

// ---- 公开辅助函数 ----

/** 根据当前氛围返回阶状态: 'completed' | 'active' | 'locked' */
export function getTierStatus(tier, currentAtmosphere) {
  if (currentAtmosphere > tier.stageMax) return 'completed';
  if (currentAtmosphere >= tier.stageMin) return 'active';
  return 'locked';
}

/** 计算某一阶已完成子目标数 */
export function countTierGoalsComplete(tier, state) {
  return tier.goals.filter(g => g.check(state)).length;
}

/** 某一阶是否全部完成 */
export function isTierComplete(tier, state) {
  return tier.goals.every(g => g.check(state));
}

/** 获取当前氛围所处的阶对象 */
export function getCurrentTier(atmosphere) {
  return TIER_GOALS.find(t => atmosphere >= t.stageMin && atmosphere <= t.stageMax) || TIER_GOALS[0];
}
