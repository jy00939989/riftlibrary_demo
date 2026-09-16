#!/usr/bin/env node
// 字数对齐审计：逐本核对 声明 totalWords / 章节 words  vs  实际文本字数
// 「完全实时对应」= meta.totalWords == 全文章节正文实际字数（非空白字符计，含标点）
//                  且每个章节的 words 字段 == 该章正文实际字数
// 用法：node scripts/audit-book-word-counts.mjs [--all]
//   默认只列「不完全对应」的书；--all 连完全对应的也列出

const { BOOKS } = await import('../data/books.js');

const fs = await import('node:fs');
const path = await import('node:path');
const url = await import('node:url');

const here = path.dirname(url.fileURLToPath(import.meta.url));
const booksDir = path.join(here, '..', 'data', 'books');

// 与誊抄体验对齐的计字规则：非空白字符（含中文标点，不含空格/换行/制表符）
function countText(s) {
  if (!s) return 0;
  return (s.match(/[^\s]/g) || []).length;
}

const rows = [];
for (const id of Object.keys(BOOKS)) {
  const file = path.join(booksDir, `${id}.js`);
  if (!fs.existsSync(file)) {
    rows.push({ id, title: BOOKS[id].title, missing: true });
    continue;
  }
  const mod = await import(url.pathToFileURL(file).href);
  const meta = mod.meta || {};
  const chapters = mod.chapters || [];
  const declaredTotal = meta.totalWords || 0;

  let actualTotal = 0;
  let chapterDeclSum = 0;
  const badChapters = [];
  chapters.forEach((ch, i) => {
    const actual = countText(ch.content);
    actualTotal += actual;
    chapterDeclSum += ch.words || 0;
    if ((ch.words || 0) !== actual) {
      badChapters.push({ i, title: ch.title, declared: ch.words || 0, actual });
    }
  });

  rows.push({
    id,
    title: meta.title || BOOKS[id].title,
    declaredTotal,
    actualTotal,
    chapterDeclSum,
    diff: declaredTotal - actualTotal,
    exact: declaredTotal === actualTotal && badChapters.length === 0 && chapters.length > 0,
    noContent: chapters.length === 0,
    badChapters
  });
}

const exact = rows.filter(r => r.exact);
const broken = rows.filter(r => !r.exact && !r.missing);
const missing = rows.filter(r => r.missing);

console.log(`共 ${rows.length} 本：完全对应 ${exact.length}，不对应 ${broken.length}，缺文件 ${missing.length}\n`);

if (process.argv.includes('--all')) {
  console.log('=== 完全对应（实时）===');
  exact.forEach(r => console.log(`  ${r.id}  ${r.title}  ${r.actualTotal} 字 / ${(r.badChapters ? 0 : 0)}`));
  console.log('');
}

console.log('=== 不完全对应 ===');
broken.forEach(r => {
  const totalMatch = r.declaredTotal === r.actualTotal;
  console.log(`  ${r.id}  ${r.title}`);
  console.log(`    总字数: 声明 ${r.declaredTotal} vs 实际 ${r.actualTotal}（差 ${r.diff >= 0 ? '+' : ''}${r.diff}）${totalMatch ? ' ✓' : ' ✗'}`);
  if (r.chapterDeclSum !== r.declaredTotal) {
    console.log(`    章节 words 合计 ${r.chapterDeclSum} 与 meta.totalWords ${r.declaredTotal} 也不一致`);
  }
  if (r.noContent) console.log('    ⚠ 无章节正文');
  r.badChapters.slice(0, 5).forEach(c => {
    console.log(`    章${c.i + 1}「${c.title}」: 声明 ${c.declared} vs 实际 ${c.actual}（差 ${c.declared - c.actual >= 0 ? '+' : ''}${c.declared - c.actual}）`);
  });
  if (r.badChapters.length > 5) console.log(`    …另有 ${r.badChapters.length - 5} 章不一致`);
});
if (missing.length) {
  console.log('\n=== 缺 book 文件 ===');
  missing.forEach(r => console.log(`  ${r.id}  ${r.title}`));
}

// 汇总精确对应名单（ always 打印，方便直接回答「哪几本」）
console.log('\n=== 精确对应名单 ===');
console.log(exact.map(r => `${r.id}《${r.title}》(${r.actualTotal})`).join('\n') || '（无）');
