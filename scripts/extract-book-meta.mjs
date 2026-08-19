import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const booksDir = path.resolve(__dirname, '../data/books');
const outFile = path.resolve(__dirname, '../temp/book-meta-list.json');

const files = fs.readdirSync(booksDir).filter(f => f.endsWith('.js'));

function extractString(text, key) {
  const match = text.match(new RegExp(`${key}:\\s*['"]([^'"]+)['"]`));
  return match ? match[1] : '';
}

const books = [];
for (const file of files) {
  const content = fs.readFileSync(path.join(booksDir, file), 'utf-8');
  const metaMatch = content.match(/export const meta = \{[\s\S]*?\};/);
  if (!metaMatch) continue;
  let metaText = metaMatch[0]
    .replace(/"([a-zA-Z_$][a-zA-Z0-9_$]*)"\s*:/g, '$1:')
    .replace(/'([a-zA-Z_$][a-zA-Z0-9_$]*)'\s*:/g, '$1:');
  books.push({
    file,
    id: extractString(metaText, 'id'),
    title: extractString(metaText, 'title'),
    titleEn: extractString(metaText, 'titleEn'),
    author: extractString(metaText, 'author'),
    category: extractString(metaText, 'category'),
    description: extractString(metaText, 'description'),
  });
}

books.sort((a, b) => a.id.localeCompare(b.id));
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(books, null, 2));
console.log(`Extracted ${books.length} books to ${outFile}`);
