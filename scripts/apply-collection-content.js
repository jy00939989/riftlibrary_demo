const fs = require('fs');
const path = require('path');

const generated = JSON.parse(fs.readFileSync('data/generated-collection-content.json', 'utf8'));
let updated = 0;

for (const [bookId, content] of Object.entries(generated)) {
  const filePath = path.join('data/books', bookId + '.js');
  if (!fs.existsSync(filePath)) {
    console.log('skip (not found):', bookId);
    continue;
  }

  let text = fs.readFileSync(filePath, 'utf8');
  const metaMatch = text.match(/export const meta = \{([\s\S]*?)\n\};/);
  if (!metaMatch) {
    console.log('skip (no meta):', bookId);
    continue;
  }

  let metaBody = metaMatch[1];
  let changed = false;
  const fields = ['authorBio', 'anecdotes', 'reviews', 'collectorCover'];

  for (const field of fields) {
    if (metaBody.includes('"' + field + '"')) continue;
    const value = content[field];
    if (value === undefined) continue;
    const safeValue = String(value)
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');
    metaBody += `\n  "${field}": "${safeValue}",`;
    changed = true;
  }

  if (changed) {
    text = text.replace(
      /export const meta = \{[\s\S]*?\n\};/,
      'export const meta = {' + metaBody + '\n};'
    );
    fs.writeFileSync(filePath, text, 'utf8');
    updated++;
    console.log('updated:', bookId);
  }
}

console.log('total updated:', updated);
