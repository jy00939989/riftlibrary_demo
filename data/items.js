// 消耗型道具定义
// 纯数据模块，不依赖任何其他模块

export const ITEMS = {
  brush_reed_pen: {
    id: 'brush_reed_pen',
    name: '莎草芦管',
    nameEn: 'Reed Pen',
    emoji: '🖌️',
    icon: '🖌️',
    description: '取自尼罗河畔的莎草茎秆，是中世纪缮写室最常见的入门之笔。',
    category: 'brush',
    effect: { type: 'add_copied_words', value: 10000 }
  },
  brush_swan_quill: {
    id: 'brush_swan_quill',
    name: '天鹅翎管',
    nameEn: 'Swan Quill',
    emoji: '✒️',
    icon: '✒️',
    description: '天鹅翅羽制成的翎管，柔韧有力，是缮写室抄经人的骄傲。',
    category: 'brush',
    effect: { type: 'add_copied_words', value: 20000 }
  },
  brush_mithril_nib: {
    id: 'brush_mithril_nib',
    name: '秘银笔尖',
    nameEn: 'Mithril Nib',
    emoji: '🖋️',
    icon: '🖋️',
    description: '以秘银锻造的细小笔尖，落字如刻，一挥而就，万字毕现。',
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
