const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BOOKS_DIR = path.join(ROOT, 'data', 'books');

const files = fs.readdirSync(BOOKS_DIR).filter((f) => /^book_\d+_vol\d+\.js$/.test(f));
let updated = 0;
let skipped = 0;

for (const f of files) {
  const volPath = path.join(BOOKS_DIR, f);
  const parentId = f.replace(/(_vol\d+)\.js$/, '');
  const parentPath = path.join(BOOKS_DIR, `${parentId}.js`);

  if (!fs.existsSync(parentPath)) {
    console.log(`[skip] ${f}: 找不到父书籍 ${parentId}`);
    skipped++;
    continue;
  }

  const parentText = fs.readFileSync(parentPath, 'utf8');
  const quotesMatch = parentText.match(/export\s+const\s+quotes\s*=\s*(\{[\s\S]*?\});/);
  if (!quotesMatch) {
    console.log(`[skip] ${f}: 父书籍 ${parentId} 没有 quotes 对象`);
    skipped++;
    continue;
  }
  const parentQuotes = quotesMatch[1];

  let volText = fs.readFileSync(volPath, 'utf8');
  if (/export\s+const\s+quotes\s*=\s*\{[\s\S]*?\};/.test(volText) && !/export\s+const\s+quotes\s*=\s*\{\s*\};/.test(volText)) {
    console.log(`[skip] ${f}: 分卷已有自己的 quotes`);
    skipped++;
    continue;
  }

  // 替换空的 quotes = {} 为父书的 quotes
  if (/export\s+const\s+quotes\s*=\s*\{\s*\};/.test(volText)) {
    volText = volText.replace(/export\s+const\s+quotes\s*=\s*\{\s*\};/, `export const quotes = ${parentQuotes};`);
    fs.writeFileSync(volPath, volText, 'utf8');
    console.log(`[updated] ${f}: 继承父书 ${parentId} 的 quotes`);
    updated++;
  } else {
    console.log(`[skip] ${f}: 找不到空的 quotes 对象`);
    skipped++;
  }
}

console.log(`\n完成：更新 ${updated} 个分卷文件，跳过 ${skipped} 个`);
