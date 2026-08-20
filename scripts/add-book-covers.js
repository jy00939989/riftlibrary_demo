const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COVERS_DIR = path.join(ROOT, 'visual', 'book_covers');
const BOOKS_DIR = path.join(ROOT, 'data', 'books');

const files = fs.readdirSync(COVERS_DIR).filter((f) => /^book_\d+\.png$/.test(f));
let updated = 0;
let skipped = 0;

for (const coverFile of files) {
  const bookId = coverFile.replace('.png', '');
  const bookPath = path.join(BOOKS_DIR, `${bookId}.js`);
  if (!fs.existsSync(bookPath)) {
    console.log(`[skip] ${bookId}: 无对应书籍文件`);
    skipped++;
    continue;
  }

  let text = fs.readFileSync(bookPath, 'utf8');
  if (/['"]cover['"]\s*:/.test(text)) {
    console.log(`[skip] ${bookId}: 已有 cover 字段`);
    skipped++;
    continue;
  }

  const coverValue = `visual/book_covers/${coverFile}`;

  // 在 emoji 字段后插入 cover 字段，并匹配原有键的引号风格
  // 兼容 CRLF / LF，键可带引号可不带
  const emojiPattern = /([\t ]*)(['"]?emoji['"]?\s*:\s*['"][^'"]+['"],?)(\r?\n)/;
  if (emojiPattern.test(text)) {
    text = text.replace(emojiPattern, (match, indent, emojiLine, newline) => {
      const hasComma = emojiLine.endsWith(',');
      const fixedEmoji = hasComma ? emojiLine : emojiLine + ',';
      const keyQuote = emojiLine.trimStart().startsWith('"') ? '"' : '';
      return `${indent}${fixedEmoji}${newline}${indent}${keyQuote}cover${keyQuote}: '${coverValue}',${newline}`;
    });
    fs.writeFileSync(bookPath, text, 'utf8');
    console.log(`[updated] ${bookId}: ${coverValue}`);
    updated++;
  } else {
    console.log(`[skip] ${bookId}: 找不到 emoji 字段`);
    skipped++;
  }
}

console.log(`\n完成：更新 ${updated} 个，跳过 ${skipped} 个`);
