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
  const coverMatch = parentText.match(/['"]?cover['"]?\s*:\s*['"]([^'"]+)['"]/);
  if (!coverMatch) {
    console.log(`[skip] ${f}: 父书籍 ${parentId} 没有 cover 字段`);
    skipped++;
    continue;
  }
  const coverValue = coverMatch[1];

  let volText = fs.readFileSync(volPath, 'utf8');
  if (/['"]?cover['"]?\s*:/.test(volText)) {
    console.log(`[skip] ${f}: 已有 cover 字段`);
    skipped++;
    continue;
  }

  // 在 emoji 字段后插入 cover（兼容带引号和不带引号）
  const emojiPattern = /([\t ]*)(['"]?emoji['"]?\s*:\s*['"][^'"]+['"],?)(\r?\n)/;
  if (emojiPattern.test(volText)) {
    volText = volText.replace(emojiPattern, (match, indent, emojiLine, newline) => {
      const hasComma = emojiLine.endsWith(',');
      const fixedEmoji = hasComma ? emojiLine : emojiLine + ',';
      const keyQuote = emojiLine.trimStart().startsWith('"') ? '"' : '';
      return `${indent}${fixedEmoji}${newline}${indent}${keyQuote}cover${keyQuote}: '${coverValue}',${newline}`;
    });
    fs.writeFileSync(volPath, volText, 'utf8');
    console.log(`[updated] ${f}: ${coverValue}`);
    updated++;
  } else {
    console.log(`[skip] ${f}: 找不到 emoji 字段`);
    skipped++;
  }
}

console.log(`\n完成：更新 ${updated} 个分卷文件，跳过 ${skipped} 个`);
