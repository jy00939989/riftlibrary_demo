// 书籍数据入口 —— 组装所有书籍 + 分类枚举 + 通用文案
import { meta as b1, chapters as c1, quotes as q1 } from './books/book_001.js';
import { meta as b2, chapters as c2, quotes as q2 } from './books/book_002.js';
import { meta as b3, chapters as c3, quotes as q3 } from './books/book_003.js';
import { meta as b4, chapters as c4, quotes as q4 } from './books/book_004.js';
import { meta as b5, chapters as c5, quotes as q5 } from './books/book_005.js';
import { meta as b6, chapters as c6, quotes as q6 } from './books/book_006.js';
import { meta as b7, chapters as c7, quotes as q7 } from './books/book_007.js';
import { meta as b8, chapters as c8, quotes as q8 } from './books/book_008.js';
import { meta as b9, chapters as c9, quotes as q9 } from './books/book_009.js';
import { meta as b10, chapters as c10, quotes as q10 } from './books/book_010.js';
import { meta as b11, chapters as c11, quotes as q11 } from './books/book_011_道德经.js';
import { meta as b12, chapters as c12, quotes as q12 } from './books/book_012_沉思录.js';
import { meta as b13, chapters as c13, quotes as q13 } from './books/book_013_理想国.js';
import { meta as b14, chapters as c14, quotes as q14 } from './books/book_014_史记.js';
import { meta as b15, chapters as c15, quotes as q15 } from './books/book_015_诗经.js';
import { meta as b16, chapters as c16, quotes as q16 } from './books/book_016_西游记.js';
import { meta as b17, chapters as c17, quotes as q17 } from './books/book_017_鲁滨逊漂流记.js';
import { meta as b18, chapters as c18, quotes as q18 } from './books/book_018_几何原本.js';
import { meta as b19, chapters as c19, quotes as q19 } from './books/book_019_卡拉马佐夫兄弟.js';
import { meta as b20, chapters as c20, quotes as q20 } from './books/book_020_社会契约论.js';
import { meta as b21, chapters as c21, quotes as q21 } from './books/book_021_第一哲学沉思集.js';
import { meta as b22, chapters as c22, quotes as q22 } from './books/book_022_传习录.js';
import { meta as b23, chapters as c23, quotes as q23 } from './books/book_023_绿野仙踪.js';
import { meta as b24, chapters as c24, quotes as q24 } from './books/book_024_爱丽丝梦游奇境.js';

const ALL_BOOKS = [
  { meta: b1, chapters: c1, quotes: q1 },
  { meta: b2, chapters: c2, quotes: q2 },
  { meta: b3, chapters: c3, quotes: q3 },
  { meta: b4, chapters: c4, quotes: q4 },
  { meta: b5, chapters: c5, quotes: q5 },
  { meta: b6, chapters: c6, quotes: q6 },
  { meta: b7, chapters: c7, quotes: q7 },
  { meta: b8, chapters: c8, quotes: q8 },
  { meta: b9, chapters: c9, quotes: q9 },
  { meta: b10, chapters: c10, quotes: q10 },
  { meta: b11, chapters: c11, quotes: q11 },
  { meta: b12, chapters: c12, quotes: q12 },
  { meta: b13, chapters: c13, quotes: q13 },
  { meta: b14, chapters: c14, quotes: q14 },
  { meta: b15, chapters: c15, quotes: q15 },
  { meta: b16, chapters: c16, quotes: q16 },
  { meta: b17, chapters: c17, quotes: q17 },
  { meta: b18, chapters: c18, quotes: q18 },
  { meta: b19, chapters: c19, quotes: q19 },
  { meta: b20, chapters: c20, quotes: q20 },
  { meta: b21, chapters: c21, quotes: q21 },
  { meta: b22, chapters: c22, quotes: q22 },
  { meta: b23, chapters: c23, quotes: q23 },
  { meta: b24, chapters: c24, quotes: q24 }
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
