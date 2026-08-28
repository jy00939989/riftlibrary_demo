const fs = require('fs');
const path = require('path');

const generated = JSON.parse(fs.readFileSync('data/generated-collection-content.json', 'utf8'));
let fixed = 0;

for (const bookId of Object.keys(generated)) {
  const filePath = path.join('data/books', bookId + '.js');
  if (!fs.existsSync(filePath)) continue;

  let text = fs.readFileSync(filePath, 'utf8');
  const original = text;

  // 修复 meta 对象内字段缺少尾部逗号的问题
  // 匹配 "key": "..." 或 "key": true/false/number 后面没有逗号的情况（后面紧跟着换行+"key"）
  text = text.replace(
    /("[a-zA-Z0-9_]+":\s*(?:"(?:[^"\\]|\\.)*"|true|false|\d+|null))\s*(?=\n\s*"[a-zA-Z0-9_]+":)/g,
    '$1,'
  );

  if (text !== original) {
    fs.writeFileSync(filePath, text, 'utf8');
    fixed++;
    console.log('fixed:', bookId);
  }
}

console.log('total fixed:', fixed);
