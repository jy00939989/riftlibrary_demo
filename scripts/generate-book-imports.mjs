// 自动生成 data/books.js 的 import 语句
// 用法：node scripts/generate-book-imports.mjs
// 扫描 data/books/ 目录，按 bookId 排序生成 import 和 ALL_BOOKS 组装代码

import { readdir, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join, extname, basename } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const booksDir = join(__dirname, '..', 'data', 'books');
const outputFile = join(__dirname, '..', 'data', 'books.js');

async function main() {
  const files = (await readdir(booksDir))
    .filter(f => f.endsWith('.js') && f.startsWith('book_'))
    .sort((a, b) => {
      // 按 bookId 数字部分排序
      const numA = parseInt(a.match(/book_(\d+)/)?.[1] || '0', 10);
      const numB = parseInt(b.match(/book_(\d+)/)?.[1] || '0', 10);
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });

  const imports = [];
  const allBooks = [];

  files.forEach((f, idx) => {
    const varName = `b${idx + 1}`;
    const chapterVar = `c${idx + 1}`;
    const quotesVar = `q${idx + 1}`;
    imports.push(`import { meta as ${varName}, chapters as ${chapterVar}, quotes as ${quotesVar} } from './books/${f}';`);
    allBooks.push(`  { meta: ${varName}, chapters: ${chapterVar}, quotes: ${quotesVar} },`);
  });

  const content = `// 书籍数据入口 —— 组装所有书籍 + 分类枚举 + 通用文案
// ⚠️ 本文件由 scripts/generate-book-imports.mjs 自动生成，手动修改会被覆盖

${imports.join('\n')}

const ALL_BOOKS = [
${allBooks.join('\n')}
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
`;

  await writeFile(outputFile, content);
  console.log(`✓ 已生成 data/books.js，共 ${files.length} 本书`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
