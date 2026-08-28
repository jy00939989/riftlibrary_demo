// 消耗型道具定义
// 纯数据模块，不依赖任何其他模块

export const ITEMS = {
  brush_rat_whisker: {
    id: 'brush_rat_whisker',
    name: '鼠须笔',
    nameEn: 'Rat Whisker Brush',
    emoji: '🖌️',
    icon: '🖌️',
    description: '以鼠须制成的软笔，誊抄时可迅速写下大量文字。',
    category: 'brush',
    effect: { type: 'add_copied_words', value: 10000 }
  },
  brush_ji_ju: {
    id: 'brush_ji_ju',
    name: '鸡距笔',
    nameEn: 'Ji-Ju Brush',
    emoji: '✒️',
    icon: '✒️',
    description: '笔锋劲挺如鸡距，能助你更快完成誊抄。',
    category: 'brush',
    effect: { type: 'add_copied_words', value: 20000 }
  },
  brush_purple_rabbit: {
    id: 'brush_purple_rabbit',
    name: '紫毫笔',
    nameEn: 'Purple Rabbit-Hair Brush',
    emoji: '🖋️',
    icon: '🖋️',
    description: '采野兔紫毫精制而成，一挥而就，万字毕现。',
    category: 'brush',
    effect: { type: 'add_copied_words', value: 30000 }
  },
  repair_scroll: {
    id: 'repair_scroll',
    name: '修缮符',
    nameEn: 'Restoration Scroll',
    emoji: '📜',
    icon: '📜',
    description: '古老的修缮符咒，可一次性完全修复一本损坏的书籍。',
    category: 'repair',
    effect: { type: 'instant_repair', value: 1 }
  },
  favor_note_targeted: {
    id: 'favor_note_targeted',
    name: '心意便签',
    nameEn: 'Personal Favor Note',
    emoji: '💌',
    icon: '💌',
    description: '写上名字、附上心意，可让指定角色的好感度提升。',
    category: 'favor',
    effect: { type: 'add_favor', value: 20, target: 'selected' }
  },
  favor_note_random: {
    id: 'favor_note_random',
    name: '随机便签',
    nameEn: 'Mystery Favor Note',
    emoji: '💟',
    icon: '💟',
    description: '没有署名的便签，会随机送到某位已解锁角色手中。',
    category: 'favor',
    effect: { type: 'add_favor', value: 20, target: 'random' }
  }
};

/** 获取道具定义 */
export function getItemDef(itemId) {
  return ITEMS[itemId] || null;
}

/** 判断道具是否可在背包中使用 */
export function isItemUsable(itemId) {
  const def = ITEMS[itemId];
  if (!def) return false;
  return ['brush', 'repair', 'favor'].includes(def.category);
}

/** 判断道具是否需要选择目标 */
export function itemRequiresTarget(itemId) {
  const def = ITEMS[itemId];
  if (!def) return false;
  if (def.category === 'brush') return 'book';
  if (def.category === 'repair') return 'damaged_book';
  if (def.id === 'favor_note_targeted') return 'visitor';
  return null;
}
