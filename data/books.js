// 书籍数据入口 —— 组装所有书籍 + 分类枚举 + 通用文案
import { meta as b1, chapters as c1, quotes as q1 } from './books/book_001.js';
import { meta as b2, chapters as c2, quotes as q2 } from './books/book_002.js';

const ALL_BOOKS = [
  { meta: b1, chapters: c1, quotes: q1 },
  { meta: b2, chapters: c2, quotes: q2 }
];

// 组装 BOOKS 对象（保持原有访问模式：BOOKS[id]）
export const BOOKS = {};
ALL_BOOKS.forEach(({ meta, chapters, quotes }) => {
  BOOKS[meta.id] = { ...meta, chapters, quotes };
});

// 分类枚举
export const CATEGORIES = ['童话', '寓言', '小说', '诗歌', '戏剧', '散文', '哲学', '传记', '历史', '科学', '神话', '志怪'];

// 誊抄预览文案模板
export const COPY_TEMPLATES = [
  { opening: '羽毛笔在羊皮纸上沙沙作响…', closing: '这段文字已被图书馆永久收藏。' },
  { opening: '烛光摇曳，你专注的身影映在墙上…', closing: '又一段历史被妳修复了。' },
  { opening: '墨水在羊皮纸上缓缓晕开…', closing: '图书馆因妳的努力而复苏。' },
  { opening: '窗外的月光洒在书页上…', closing: '尘封的文字重现光明。' },
  { opening: '你蘸了蘸墨水，继续书写…', closing: '这些文字将永远流传下去。' },
  { opening: '壁炉里的火焰轻轻跳动…', closing: '又一本古籍得到了修复。' },
  { opening: '风从窗缝吹入，拂动书页…', closing: '知识的碎片正在重新拼接。' },
  { opening: '羽毛笔划过粗糙的纸面…', closing: '一字一句，皆是永恒。' }
];

// 解锁动画文案
export const UNLOCK_TEXTS = [
  '尘封的章节已向妳敞开…',
  '又一段历史重见天日。',
  '图书馆因妳的努力而复苏。',
  '封印在金色的光芒中消散。',
  '古老的文字重新焕发光彩。'
];
