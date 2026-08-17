// 自动更新 data/book_pool.js：将长书条目替换为单卷条目
// 用法：node scripts/generate-book-pool.mjs

import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { VOLUME_GROUPS, VOLUME_CHAPTER_RANGES } from '../data/volume_groups.js';
import { BOOK_ID_TO_DLC_PACK } from '../data/dlc_packs.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const poolFile = join(__dirname, '..', 'data', 'book_pool.js');

const LONG_BOOK_IDS = new Set(Object.keys(VOLUME_GROUPS));

function serialize(obj) {
  return JSON.stringify(obj, null, 2);
}

async function main() {
  // 读取原文件文本，保留顶部注释
  const original = await readFile(poolFile, 'utf-8');
  const headerMatch = original.match(/^(\/\/[^\n]*\n)+/);
  const header = headerMatch ? headerMatch[0] : '';

  // 动态 import 当前 SHARED_POOL
  const { SHARED_POOL } = await import('../data/book_pool.js');

  // 过滤掉所有卷组长书条目及其单卷条目（避免重复生成）
  const allVolumeIds = new Set(
    Object.values(VOLUME_GROUPS).flatMap(g => [g.collectedBookId, ...g.volumeIds])
  );
  const filtered = SHARED_POOL.filter(entry => !allVolumeIds.has(entry.bookId));

  // 生成单卷条目
  const volumeEntries = [];
  Object.values(VOLUME_GROUPS).forEach(group => {
    const ranges = VOLUME_CHAPTER_RANGES[group.collectedBookId];
    group.volumeIds.forEach((volId, idx) => {
      // 从原长书条目中继承部分字段（如果存在）
      const originalEntry = SHARED_POOL.find(e => e.bookId === group.collectedBookId) || {};
      const chapterCount = ranges[idx].length;
      // 从 BOOKS 读取单卷字数（需要动态 import）
      volumeEntries.push({
        type: 'volume',
        plane: originalEntry.plane || 'astral',
        volumeGroupId: group.collectedBookId,
        bookId: volId,
        dlcPackId: BOOK_ID_TO_DLC_PACK[volId] || undefined,
        volumeIndex: idx + 1,
        title: group.title,
        volumeTitle: `${group.title} · 卷${['一', '二', '三', '四', '五', '六'][idx]}`,
        subtitle: `卷 ${idx + 1} / ${group.volumeCount}`,
        author: group.author,
        category: group.category,
        totalWords: 0, // 占位，下面填充
        description: originalEntry.description || `${group.title}第${idx + 1}卷`,
        emoji: group.emoji,
        price: group.volumePrice,
        baseWeight: 1.0
      });
    });
  });

  // 读取 BOOKS 填充 totalWords 和单卷描述
  const { BOOKS } = await import('../data/books.js');
  volumeEntries.forEach(entry => {
    const book = BOOKS[entry.bookId];
    if (book) {
      entry.totalWords = book.totalWords;
      // 优先使用单卷 source 文件的 description，回退到原长书条目或默认
      entry.description = book.description || entry.description;
    }
  });

  const newPool = [...filtered, ...volumeEntries];

  // 组装文件内容
  const entriesText = newPool.map(entry => `  ${serialize(entry)}`).join(',\n\n');
  const content = `${header}export const SHARED_POOL = [\n${entriesText}\n];\n`;

  await writeFile(poolFile, content);
  console.log(`✓ 已更新 data/book_pool.js：移除 ${Object.keys(VOLUME_GROUPS).length} 本长书条目，新增 ${volumeEntries.length} 条单卷条目`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
