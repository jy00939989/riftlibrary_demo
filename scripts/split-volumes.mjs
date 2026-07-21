// 长书分卷拆分脚本
// 用法：node scripts/split-volumes.mjs
// 作用：根据 data/volume_groups.js 的 VOLUME_CHAPTER_RANGES 拆分 7 本长书

import { writeFile } from 'fs/promises';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import {
  VOLUME_GROUPS,
  VOLUME_CHAPTER_RANGES,
  VOLUME_INDEX_NAMES
} from '../data/volume_groups.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const booksDir = join(__dirname, '..', 'data', 'books');

const SPLIT_PLAN = [
  { id: 'book_007', file: 'book_007.js', title: '本草纲目·草部' },
  { id: 'book_008', file: 'book_008.js', title: '物种起源' },
  { id: 'book_009', file: 'book_009.js', title: '红楼梦' },
  { id: 'book_014', file: 'book_014_史记.js', title: '史记' },
  { id: 'book_016', file: 'book_016_西游记.js', title: '西游记' },
  { id: 'book_018', file: 'book_018_几何原本.js', title: '几何原本' },
  { id: 'book_019', file: 'book_019_卡拉马佐夫兄弟.js', title: '卡拉马佐夫兄弟' }
];

function volumeTitle(baseTitle, index) {
  return `${baseTitle} · 卷${VOLUME_INDEX_NAMES[index]}`;
}

function serialize(obj) {
  // 用 JSON 序列化保证字符串转义安全；key 带引号在 JS 中完全合法
  return JSON.stringify(obj, null, 2);
}

async function splitBook(collectedId, filename) {
  const module = await import(pathToFileURL(join(booksDir, filename)).href);
  const meta = module.meta;
  const chapters = module.chapters || [];
  const quotes = module.quotes || {};
  const ranges = VOLUME_CHAPTER_RANGES[collectedId];
  const group = VOLUME_GROUPS[collectedId];

  if (!ranges || ranges.length !== group.volumeCount) {
    throw new Error(`${collectedId}: 章节分配表与卷数不匹配`);
  }

  // 生成单卷文件
  for (let i = 0; i < ranges.length; i++) {
    const sourceIndexes = ranges[i];
    let accumulatedWords = 0;
    const volChapters = sourceIndexes.map((srcIdx, localIdx) => {
      const srcCh = chapters[srcIdx];
      if (!srcCh) throw new Error(`${collectedId} vol${i + 1}: 源章节 ${srcIdx} 不存在`);
      const ch = { ...srcCh };
      ch.unlockAt = accumulatedWords;
      accumulatedWords += ch.words || 0;
      return ch;
    });

    const volMeta = {
      id: group.volumeIds[i],
      plane: meta.plane || 'astral',
      title: meta.title,
      titleEn: meta.titleEn || '',
      volumeTitle: volumeTitle(meta.title, i),
      author: meta.author,
      category: meta.category,
      era: meta.era,
      totalWords: accumulatedWords,
      description: `${meta.title}第${VOLUME_INDEX_NAMES[i]}卷。`,
      emoji: meta.emoji,
      certMessage: `第${VOLUME_INDEX_NAMES[i]}卷已成。${meta.certMessage || ''}`,
      isVolume: true,
      collectedBookId: collectedId,
      volumeIndex: i + 1
    };

    const content = `// ${volMeta.volumeTitle}\nexport const meta = ${serialize(volMeta)};\n\nexport const chapters = ${serialize(volChapters)};\n\nexport const quotes = {};\n`;
    const safeTitle = meta.title.replace(/[·\/\\]/g, '_');
    await writeFile(join(booksDir, `${group.volumeIds[i]}_${safeTitle}.js`), content);
  }

  // 改写原文件为典藏版
  const collectedMeta = {
    id: meta.id,
    title: `${meta.title}（典藏版）`,
    titleEn: meta.titleEn || '',
    author: meta.author,
    category: meta.category,
    era: meta.era,
    totalWords: meta.totalWords,
    description: `${meta.title}典藏版。集齐全部单卷并在古籍修复室合成后可得。`,
    emoji: meta.emoji,
    certMessage: meta.certMessage || '',
    isCollectedEdition: true,
    cannotBePurchased: true,
    indestructible: true,
    volumeGroupId: collectedId
  };

  const content = `// ${meta.title}（典藏版）\nexport const meta = ${serialize(collectedMeta)};\n\nexport const chapters = [];\n\nexport const quotes = ${serialize(quotes)};\n`;
  await writeFile(join(booksDir, filename), content);

  console.log(`✓ ${meta.title}: 拆分为 ${ranges.length} 卷，原文件改为典藏版`);
}

async function main() {
  for (const { id, file } of SPLIT_PLAN) {
    await splitBook(id, file);
  }
  console.log('\n全部拆分完成');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
