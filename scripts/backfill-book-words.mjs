#!/usr/bin/env node
// 字数回填：按章节正文实际字数（非空白字符计，含标点）回写 words / unlockAt / meta.totalWords
// 全文入库标准工艺的第三步（取材→入库→回填→验收）
// 用法：
//   node scripts/backfill-book-words.mjs book_026           # 只出报告，不改文件
//   node scripts/backfill-book-words.mjs book_026 --write   # 改写文件（先在同目录留 .bak）
// 计数口径与 scripts/audit-book-word-counts.mjs、道德经先例（80292e9）一致

const fs = await import('node:fs');
const path = await import('node:path');
const url = await import('node:url');

const here = path.dirname(url.fileURLToPath(import.meta.url));
const booksDir = path.join(here, '..', 'data', 'books');

function countText(s) {
  if (!s) return 0;
  return (s.match(/[^\s]/g) || []).length;
}

const bookId = process.argv[2];
const write = process.argv.includes('--write');
if (!bookId) process.exit('用法: node scripts/backfill-book-words.mjs <book_id> [--write]');

const file = path.join(booksDir, `${bookId}.js`);
if (!fs.existsSync(file)) process.exit(`找不到 ${file}`);

// 正文计数必须拿到「真实 content」——通过 import 本文件（content 是模板字符串，转义已还原）
const mod = await import(url.pathToFileURL(file).href);
const chapters = mod.chapters || [];
if (chapters.length === 0) process.exit(`${bookId} 无章节，无从回填`);

const actuals = chapters.map(c => countText(c.content));
const total = actuals.reduce((a, b) => a + b, 0);
let cum = 0;
const plan = chapters.map((c, i) => {
  const entry = { title: c.title, oldUnlockAt: c.unlockAt || 0, oldWords: c.words || 0, newUnlockAt: cum, newWords: actuals[i] };
  cum += actuals[i];
  return entry;
});

const oldTotal = mod.meta?.totalWords;
console.log(`=== ${bookId}《${mod.meta?.title}》 ===`);
console.log(`总字数: ${oldTotal} -> ${total}${oldTotal === total ? '（不变）' : ''}`);
plan.forEach((p, i) => {
  const changed = p.oldUnlockAt !== p.newUnlockAt || p.oldWords !== p.newWords;
  console.log(`  ch${i + 1} ${p.title}: unlockAt ${p.oldUnlockAt}->${p.newUnlockAt}, words ${p.oldWords}->${p.newWords}${changed ? '' : '（不变）'}`);
});

if (!write) {
  console.log('\n（报告模式；加 --write 回写文件，会先留 .bak）');
  process.exit(0);
}

// ── 回写：按出现顺序替换「unlockAt: N, words: N」（章节区）与 meta 的「totalWords: N」──
let src = fs.readFileSync(file, 'utf8');
const bak = file + '.bak';
fs.writeFileSync(bak, src);

let idx = 0;
src = src.replace(/unlockAt:\s*\d+,\s*words:\s*\d+/g, () => {
  const p = plan[idx++];
  return `unlockAt: ${p.newUnlockAt}, words: ${p.newWords}`;
});
if (idx !== chapters.length) {
  process.exit(`替换章节数不符：命中 ${idx} 处，章节 ${chapters.length} 个，已中止（.bak 未动用原文件已还原）`);
}

const totalRe = /totalWords:\s*\d+/;
if (!totalRe.test(src)) process.exit('未找到 meta.totalWords，已中止');
src = src.replace(totalRe, `totalWords: ${total}`);

fs.writeFileSync(file, src);
console.log(`\n已回写 ${file}（备份：${path.basename(bak)}）`);
console.log('请核对 git diff 后删除 .bak 再提交。');
