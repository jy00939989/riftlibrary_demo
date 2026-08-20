import { meta as collectedMeta, chapters as collectedChapters, quotes as collectedQuotes } from '../data/books/book_031.js';
import { meta as vol1Meta, chapters as vol1Chapters, quotes as vol1Quotes } from '../data/books/book_031_vol1.js';
import { meta as vol2Meta, chapters as vol2Chapters, quotes as vol2Quotes } from '../data/books/book_031_vol2.js';
import { meta as vol3Meta, chapters as vol3Chapters, quotes as vol3Quotes } from '../data/books/book_031_vol3.js';
import { meta as vol4Meta, chapters as vol4Chapters, quotes as vol4Quotes } from '../data/books/book_031_vol4.js';
import { VOLUME_GROUPS, VOLUME_CHAPTER_RANGES } from '../data/volume_groups.js';
import { BOOKS } from '../data/books.js';
import { SHARED_POOL } from '../data/book_pool.js';
import { DEFAULT_BOOKS } from '../js/state/state.js';

let passed = 0;
let failed = 0;

function check(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error('FAIL:', message);
  }
}

function checkEqual(actual, expected, message) {
  check(actual === expected, `${message} (actual: ${actual}, expected: ${expected})`);
}

console.log('开始校验 book_031 亚瑟王之死四卷组书...\n');

// 1. 典藏版校验
console.log('【典藏版 book_031 校验】');
checkEqual(collectedMeta.id, 'book_031', '典藏版 id');
check(collectedMeta.isCollectedEdition === true, '典藏版 isCollectedEdition 为 true');
checkEqual(collectedMeta.volumeGroupId, 'book_031', '典藏版 volumeGroupId');
checkEqual(collectedMeta.totalWords, 784000, '典藏版 totalWords');
check(Array.isArray(collectedChapters), '典藏版 chapters 是数组');
checkEqual(collectedChapters.length, 0, '典藏版 chapters 为空数组');
check(collectedMeta.cannotBePurchased === true, '典藏版 cannotBePurchased 为 true');
check(collectedMeta.indestructible === true, '典藏版 indestructible 为 true');
const collectedQuoteKeys = Object.keys(collectedQuotes);
checkEqual(collectedQuoteKeys.length, 6, '典藏版 quotes 数量');
['10', '25', '40', '55', '70', '85'].forEach(k => check(collectedQuoteKeys.includes(k), `典藏版 quotes 包含 ${k}%`));

// 2. 四卷 meta 校验
console.log('【四卷 meta 校验】');
const vols = [
  { meta: vol1Meta, chapters: vol1Chapters, quotes: vol1Quotes, index: 1 },
  { meta: vol2Meta, chapters: vol2Chapters, quotes: vol2Quotes, index: 2 },
  { meta: vol3Meta, chapters: vol3Chapters, quotes: vol3Quotes, index: 3 },
  { meta: vol4Meta, chapters: vol4Chapters, quotes: vol4Quotes, index: 4 }
];

vols.forEach(({ meta, index }) => {
  checkEqual(meta.id, `book_031_vol${index}`, `卷${index} id`);
  checkEqual(meta.plane, 'astral', `卷${index} plane`);
  check(meta.isVolume === true, `卷${index} isVolume 为 true`);
  checkEqual(meta.collectedBookId, 'book_031', `卷${index} collectedBookId`);
  checkEqual(meta.volumeIndex, index, `卷${index} volumeIndex`);
  checkEqual(meta.totalWords, 196000, `卷${index} totalWords`);
  checkEqual(meta.category, '小说', `卷${index} category`);
  checkEqual(meta.era, 'ERA_005', `卷${index} era`);
});

// 3. 章节结构校验
console.log('【章节结构校验】');
vols.forEach(({ chapters, index }) => {
  checkEqual(chapters.length, 10, `卷${index} 章节数`);
  let expectedUnlock = 0;
  chapters.forEach((ch, i) => {
    checkEqual(ch.id, `ch${i + 1}`, `卷${index} 第${i + 1}章 id`);
    checkEqual(ch.words, 19600, `卷${index} 第${i + 1}章 words`);
    checkEqual(ch.unlockAt, expectedUnlock, `卷${index} 第${i + 1}章 unlockAt`);
    check(ch.title && ch.title.length > 0, `卷${index} 第${i + 1}章 title 非空`);
    check(ch.content && ch.content.length > 0, `卷${index} 第${i + 1}章 content 非空`);
    check(ch.preview && ch.preview.length > 0, `卷${index} 第${i + 1}章 preview 非空`);
    check(ch.highlight && ch.highlight.length > 0, `卷${index} 第${i + 1}章 highlight 非空`);
    expectedUnlock += 19600;
  });
  checkEqual(expectedUnlock - 19600, 176400, `卷${index} 最后一章 unlockAt`);
});

// 4. 四卷 quotes 校验（应为空对象，与项目卷组惯例一致）
console.log('【四卷 quotes 校验】');
vols.forEach(({ quotes, index }) => {
  checkEqual(typeof quotes, 'object', `卷${index} quotes 是对象`);
  checkEqual(Object.keys(quotes).length, 0, `卷${index} quotes 为空`);
});

// 5. VOLUME_GROUPS 校验
console.log('【VOLUME_GROUPS 校验】');
const group = VOLUME_GROUPS.book_031;
check(group != null, 'VOLUME_GROUPS 包含 book_031');
checkEqual(group.collectedBookId, 'book_031', 'group collectedBookId');
checkEqual(group.title, '亚瑟王之死', 'group title');
checkEqual(group.volumeCount, 4, 'group volumeCount');
checkEqual(group.volumePrice, 350, 'group volumePrice');
checkEqual(group.volumeIds.length, 4, 'group volumeIds 长度');
checkEqual(group.volumeIds.join(','), 'book_031_vol1,book_031_vol2,book_031_vol3,book_031_vol4', 'group volumeIds 顺序与内容');

// 6. VOLUME_CHAPTER_RANGES 校验
console.log('【VOLUME_CHAPTER_RANGES 校验】');
const ranges = VOLUME_CHAPTER_RANGES.book_031;
check(Array.isArray(ranges), 'book_031 ranges 是数组');
checkEqual(ranges.length, 4, 'book_031 ranges 长度');
const flat = ranges.flat();
checkEqual(flat.length, 40, 'book_031 总章节下标数');
for (let i = 0; i < 40; i++) {
  checkEqual(flat[i], i, `book_031 ranges 连续性下标 ${i}`);
}
ranges.forEach((range, i) => checkEqual(range.length, 10, `book_031 卷${i + 1} ranges 长度`));

// 7. data/books.js 校验
console.log('【books.js 入口校验】');
['book_031', 'book_031_vol1', 'book_031_vol2', 'book_031_vol3', 'book_031_vol4'].forEach(id => {
  check(BOOKS[id] != null, `BOOKS 包含 ${id}`);
  checkEqual(BOOKS[id].id, id, `BOOKS[${id}].id`);
});
check(BOOKS['book_031'].isCollectedEdition === true, 'BOOKS[book_031] isCollectedEdition');
check(BOOKS['book_031_vol1'].isVolume === true, 'BOOKS[book_031_vol1] isVolume');

// 8. data/book_pool.js 校验
console.log('【book_pool.js 校验】');
const poolVols = SHARED_POOL.filter(p => p.volumeGroupId === 'book_031');
checkEqual(poolVols.length, 4, 'pool 中 book_031 四卷数量');
check(!SHARED_POOL.some(p => p.bookId === 'book_031'), 'pool 中无典藏版 book_031');
poolVols.forEach(p => {
  checkEqual(p.type, 'volume', `${p.bookId} pool type 为 volume`);
  checkEqual(p.price, 350, `${p.bookId} pool price`);
  checkEqual(p.totalWords, 196000, `${p.bookId} pool totalWords`);
  check(p.description && p.description.length > 0, `${p.bookId} pool description 非空`);
});

// 9. DEFAULT_BOOKS 校验
console.log('【DEFAULT_BOOKS 校验】');
['book_031', 'book_031_vol1', 'book_031_vol2', 'book_031_vol3', 'book_031_vol4'].forEach(id => {
  check(DEFAULT_BOOKS[id] != null, `DEFAULT_BOOKS 包含 ${id}`);
  checkEqual(DEFAULT_BOOKS[id].status, 'locked', `${id} DEFAULT_BOOKS status 为 locked`);
  check(Array.isArray(DEFAULT_BOOKS[id].unlockedChapters), `${id} unlockedChapters 是数组`);
  checkEqual(DEFAULT_BOOKS[id].unlockedChapters[0], 1, `${id} unlockedChapters 首项为 1`);
});

// 汇总
console.log('\n--------------------');
console.log(`校验完成：通过 ${passed} 项，失败 ${failed} 项`);
if (failed > 0) {
  process.exit(1);
}
console.log('✅ 全部通过');
