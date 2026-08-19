import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const books = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../temp/book-meta-list.json'), 'utf-8'));

// 主书核心意象（英文，用于图像生成 prompt）
const IMAGERY = {
  'book_001': 'A small golden-haired prince standing on a tiny asteroid with a rose under a glass dome, stars and comets in the background',
  'book_002': 'A farmyard with a pig and a horse standing before a weathered barn, a green flag with hoof and horn, stormy sky',
  'book_003': 'A small weathered skiff on a vast grey-blue ocean, a giant marlin skeleton beneath the surface, distant clouds',
  'book_004': 'A bustling Northern Song dynasty street market with lantern-lit wine shops, pagodas, and crowds in misty evening light',
  'book_005': 'A Regency-era English manor with a woman in a long dress reading a letter, a feather quill, and rose gardens',
  'book_006': 'A giant butterfly soaring over misty mountains, a gnarled pine tree, an ancient scholar in flowing robes',
  'book_007': 'An ornate herbal medicine cabinet with dried herbs, porcelain jars, mountain scrolls, and gold seal accents',
  'book_008': 'A branching tree of life illustration with finches, tortoises, and tropical plants, vintage naturalist style',
  'book_009': 'A traditional Chinese garden pavilion with red lanterns, blooming crabapple, jade hairpins, and falling petals',
  'book_010': 'A starry night sky above an 18th-century study with an open book, compass, and candlelight',
  'book_011': 'An old sage riding an ox through mountain mist, a simple scroll, yin-yang symbol subtly in the clouds',
  'book_012': 'A Roman emperor in armor writing by lamplight, marble columns, a stoic laurel wreath, warm golden tones',
  'book_013': 'A classical Greek cave with prisoners watching shadows on a wall, sunlight above, ideal city in the distance',
  'book_014': 'An ancient bamboo scroll unfurling across a map of empires, bronze vessels, and calligraphy brushes',
  'book_015': 'A field of millet and wildflowers with a bamboo flute, a moon over a river, classical Chinese poetry atmosphere',
  'book_016': 'A monkey king wielding a staff standing on a cloud, celestial palace gates, peaches of immortality',
  'book_017': 'A lone figure standing on a tropical beach with a crude shelter, palm trees, and a footprint in the sand',
  'book_018': 'An open ancient geometry book with compass, straightedge, intersecting circles, and constellation patterns',
  'book_019': 'A Russian Orthodox church with candlelit windows, a family gathered around an old table, dark emotional atmosphere',
  'book_020': 'A quill signing a social contract on a wooden table, chains breaking, a rising sun over a free city',
  'book_021': 'A candlelit study with a figure at a desk, a wax seal, a melting candle, the phrase "I think therefore I am" implied',
  'book_022': 'A Ming dynasty scholar standing by a mountain stream, plum blossoms, a heart-shaped moon reflection in water',
  'book_023': 'A yellow brick road winding through a fantastical landscape with a scarecrow, tin man, and lion walking together',
  'book_024': 'A white rabbit with a pocket watch running down a rabbit hole, oversized mushrooms, teacups floating',
  'book_026': 'An owl perched on a bookshelf in a cozy library, an open guidebook, ink bottle, and warm candlelight',
  'book_027': 'A flock of birds flying across a sunset sky over a calm river, delicate flowers, and distant mountains',
  'book_028': 'A fox and a crow beneath a grape vine, a tortoise and hare on a country road, classical Greek pottery style',
  'book_029': 'A simple porcelain teacup, a gnarled pine branch, misty mountains, ink-wash texture with gold seal accents',
  'book_030': 'A medieval English monastery with monks illuminating manuscripts, a stone cross, and Celtic knot borders',
  'book_031': 'A sword in a stone, a round table with knights, a grail glowing with golden light, misty Camelot castle',
  'book_032': 'A group of medieval pilgrims riding horses along a country road toward Canterbury Cathedral, spring flowers',
  'book_033': 'A red rose and a single sonnet scroll, a quill pen, warm Renaissance light, delicate gold filigree',
  'book_034': 'An old stone wall covered with ivy and climbing roses, a weathered wooden door slightly ajar, a robin perched on the handle',
};

// 分卷主题叠加（基于主书意象 + 卷数变化）
const VOLUME_NOTES = {
  'book_007': ['wild mountain herbs and ginseng roots', 'collected dried herbs in porcelain jars'],
  'book_008': ['Galapagos finches and volcanic islands', 'diverse tropical species and evolutionary tree'],
  'book_009': ['Daguan Garden entrance and Daiyu burying flowers', 'poetry club and Baoyu\'s jade', 'Jia family decline and monk\'s departure'],
  'book_013': ['Socrates debating in the agora', 'the allegory of the cave and the ideal city'],
  'book_014': ['ancient emperors and founding myths', 'Warring States strategists and battles', 'Han dynasty splendor and Silk Road', 'later dynasties and historians'],
  'book_016': ['Monkey King born from stone and havoc in heaven', 'journey begins and three disciples gather', 'demons and trials on the road west', 'kingdom of women and flaming mountain', 'battles with bull demon and heavenly help', 'reaching the West and attaining Buddhahood'],
  'book_018': ['triangles and parallel lines', 'circles and proportions', 'golden ratio and prime numbers', 'solid geometry and cosmic solids'],
  'book_019': ['the Karamazov family gathered', 'faith and doubt in the monastery', 'the trial and the brothers\' fates'],
  'book_030': ['ancient Britons and Augustine\'s mission', 'Northumbrian conversion and Christian kings', 'saints, poets, and unified church'],
  'book_031': ['the sword in the stone and Round Table founding', 'knightly adventures and forbidden love', 'the Holy Grail quest', 'civil war and Arthur\'s final battle'],
  'book_032': ['knight, miller, and steward tales', 'scholar, merchant, and squire stories', 'clerk, nun, and parson pilgrims'],
  'book_034': ['the locked garden gate and hidden key', 'spring blooming and children laughing in the garden'],
};

function getImagery(book) {
  if (IMAGERY[book.id]) return IMAGERY[book.id];
  if (book.id.includes('_vol')) {
    const baseId = book.id.split('_vol')[0];
    const idx = parseInt(book.id.split('_vol')[1], 10) - 1;
    const base = IMAGERY[baseId] || `A book cover for ${book.title}`;
    const note = VOLUME_NOTES[baseId]?.[idx] || `volume ${idx + 1}`;
    return `${base}. This volume focuses on ${note}`;
  }
  // fallback: use English title or Chinese description hint
  const title = book.titleEn || book.title;
  return `A book cover illustration for "${title}" by ${book.author}, evoking ${book.description.slice(0, 80)}`;
}

function cleanTitle(book) {
  return book.title.replace(/（典藏版）/, '').trim();
}

function cleanAuthor(book) {
  return book.author.replace(/（[^）]+）/g, '').trim();
}

// Group by category, preserving order
const groups = {};
for (const book of books) {
  groups[book.category] = groups[book.category] || [];
  groups[book.category].push(book);
}

// Flatten into batches of 4, keeping same-category together when possible
const batches = [];
for (const category of Object.keys(groups).sort()) {
  const list = groups[category];
  for (let i = 0; i < list.length; i += 4) {
    batches.push({
      category,
      index: Math.floor(i / 4) + 1,
      books: list.slice(i, i + 4)
    });
  }
}

let md = `# 归墟图书馆 · 书籍封面批量生成提示词（Sprite Sheet 版）

> 目标：为全部 71 本书（33 本主书 + 38 个分卷单元）生成统一风格封面。
> 策略：**每 4 本书生成一张图**，2×2 网格排列，每个格子 512×768px，总画布 1024×1536px。
> 优点：大幅减少 token 消耗和生成次数，同时保持同一分类/风格的系列感。

---

## 零、通用前缀（每次生成前复制）

\`\`\`text
Generate a sprite sheet of 4 vertical book covers arranged in a 2×2 grid on a single canvas.

Canvas: 1024×1536 pixels total. Each cell is 512×768 pixels (2:3 vertical book cover ratio).
Style: warm hand-painted watercolor, parchment and old leather tones, muted palette, classical book-cover illustration.
Each cover must have a subtle decorative border with gold-foil corner accents and a dark leather spine strip, giving a unified series feel.
No text, no letters, no modern elements.
High detail, centered composition within each cell, consistent warm lighting across all four covers.
\`\`\`

---

`;

for (const batch of batches) {
  const cells = batch.books.map((book, idx) => {
    const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    return `**Cover ${idx + 1} (${positions[idx]}):** 《${cleanTitle(book)}》 by ${cleanAuthor(book)}\n- Imagery: ${getImagery(book)}`;
  }).join('\n\n');

  md += `## ${batch.category} · 第 ${batch.index} 组\n\n${cells}\n\n\`\`\`text
${batch.category} book covers (2×2 grid):\n`;

  batch.books.forEach((book, idx) => {
    md += `${idx + 1}. ${book.titleEn || cleanTitle(book)} by ${cleanAuthor(book)}: ${getImagery(book)}\n`;
  });

  md += `\nUnified style: warm watercolor, parchment/leather tones, gold-foil border accents, no text, 2:3 vertical format, 1024×1536px canvas.
\`\`\`\n\n---\n\n`;
}

md += `## 文件命名规范

生成后切图保存为：

\`\`\`
visual/books/book_001.png
visual/books/book_002.png
...
visual/books/book_034_vol1.png
visual/books/book_034_vol2.png
\`\`\`

- 主书：\`{bookId}.png\`
- 分卷：\`{bookId}_vol{n}.png\`
- 切图尺寸：512×768px

---

## 生成优先级建议

1. **第一批**：童话/寓言（小王子、绿野仙踪、爱丽丝、动物农场、伊索寓言）
2. **第二批**：小说（老人与海、傲慢与偏见、鲁滨逊漂流记、秘密花园）
3. **第三批**：哲学（道德经、庄子、沉思录、菜根谭、传习录）
4. **第四批**：诗歌（诗经、飞鸟集、十四行诗、坎特伯雷故事集）
5. **第五批**：历史/科学（东京梦华录、史记、本草纲目、物种起源、几何原本）
6. **第六批**：长书分卷 + 典藏版（红楼梦、西游记、理想国、卡拉马佐夫兄弟、亚瑟王之死、英吉利教会史）
7. **最后**：图书馆指南（单独一本，可与其他散文类合并）
`;

const outPath = path.resolve(__dirname, '../docs/prompts/book-cover-prompts-batch.md');
fs.writeFileSync(outPath, md);
console.log(`Generated ${outPath} with ${batches.length} sprite-sheet prompts covering ${books.length} books.`);
