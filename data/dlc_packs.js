// 书籍补充包（DLC Pack）定义
// 纯数据模块，不依赖任何 state 或业务逻辑

export const DLC_PACKS = [
  {
    id: 'pack_british_legends',
    title: '不列颠传奇',
    titleKey: 'dlcPackBritishLegendsTitle',
    emoji: '🏰',
    description: '中世纪英格兰的双重回响：比德笔下的教会史，与马洛礼的圆桌骑士传奇。',
    descriptionKey: 'dlcPackBritishLegendsDesc',
    bookIds: [
      'book_030_vol1', 'book_030_vol2', 'book_030_vol3',
      'book_031_vol1', 'book_031_vol2', 'book_031_vol3', 'book_031_vol4'
    ],
    // 解锁 pack 所需灵感（纯灵感兑换，不可用智慧之光）
    // 玩家解锁的第一个 pack 享受首包特惠 60 灵感，之后按此原价
    inspirationCost: 120,
    // 可解锁本 pack 的兑换码（不区分大小写）
    codes: ['BETA2026', 'ALPHA_RIFT'],
    visible: true,
    sortOrder: 1
  }
];

// 兑换码 -> packId 列表
export const REDEEM_CODES = {
  'BETA2026': ['pack_british_legends'],
  'ALPHA_RIFT': ['pack_british_legends']
};

// bookId -> packId 快速索引
export const BOOK_ID_TO_DLC_PACK = {};
DLC_PACKS.forEach(pack => {
  pack.bookIds.forEach(bookId => {
    BOOK_ID_TO_DLC_PACK[bookId] = pack.id;
  });
});
