// 静态校验 js/ 下所有 ES 模块的导入：
// 1. 相对路径导入的文件是否存在
// 2. 具名导入的符号是否在目标模块中真实导出（export function/const/class、export {}、export default）
// 3. 调用了项目内某个导出函数但忘记 import（如拆分模块后漏加导入）
// 用法：node scripts/check-imports.mjs   （在项目根目录或任意目录运行均可）
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, resolve, normalize } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const JSROOT = join(ROOT, 'js');

function* walk(dir) {
  for (const e of readdirSync(dir)) {
    if (e === 'lib') continue; // 跳过第三方库
    const p = join(dir, e);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (p.endsWith('.js')) yield p;
  }
}

function exportsOf(file) {
  const src = readFileSync(file, 'utf8');
  const names = new Set();
  for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (let part of m[1].split(',')) {
      part = part.trim();
      if (!part) continue;
      const as = part.split(/\s+as\s+/);
      names.add((as[1] || as[0]).trim());
    }
  }
  if (/export\s+default/.test(src)) names.add('default');
  return names;
}

let errors = 0;
const rel = (p) => p.replace(ROOT + '\\', '').replace(ROOT + '/', '');
const allFiles = [...walk(JSROOT)];

// 第一遍：收集全项目导出，供第三遍「漏导入」检测使用
const projectExports = new Set();
for (const file of allFiles) for (const n of exportsOf(file)) projectExports.add(n);

for (const file of allFiles) {
  const src = readFileSync(file, 'utf8');
  const re = /import\s+(?:([A-Za-z_$][\w$]*)\s*,?\s*)?(?:\{([^}]*)\})?\s*from\s*['"]([^'"]+)['"]/g;
  for (const m of src.matchAll(re)) {
    const [, , named, spec] = m;
    if (!spec.startsWith('.')) continue; // 跳过 CDN / importmap 导入
    let target = normalize(resolve(dirname(file), spec));
    if (!target.endsWith('.js')) target += '.js';
    if (!existsSync(target)) { console.log(`MISSING FILE   ${rel(file)}: '${spec}'`); errors++; continue; }
    if (named) {
      const exps = exportsOf(target);
      for (let part of named.split(',')) {
        part = part.trim();
        if (!part) continue;
        const name = (part.split(/\s+as\s+/)[0] || '').trim();
        if (name && !exps.has(name)) { console.log(`MISSING EXPORT ${rel(file)}: '${name}' not in '${spec}'`); errors++; }
      }
    }
  }
}

// 第三遍：漏导入检测 —— 调用了项目内导出的函数，但本文件既未定义也未导入
const GLOBALS = new Set(('setTimeout setInterval clearTimeout clearInterval requestAnimationFrame cancelAnimationFrame ' +
  'console JSON Math Object Array String Number Boolean Promise Date Map Set parseInt parseFloat isNaN isFinite ' +
  'document window localStorage sessionStorage fetch alert confirm prompt navigator location history Image Audio ' +
  'HTMLElement CustomEvent Event KeyboardEvent MutationObserver IntersectionObserver Intl RegExp Error TypeError ' +
  'RangeError Symbol Proxy Reflect WeakMap WeakSet structuredClone queueMicrotask addEventListener removeEventListener ' +
  'dispatchEvent btoa atob encodeURIComponent decodeURIComponent encodeURI decodeURI hcaptcha bootstrap ' +
  'getComputedTextLength Number.isNaN').split(' '));
for (const file of allFiles) {
  const src = readFileSync(file, 'utf8');
  const defined = new Set();
  // 导入的名字
  for (const m of src.matchAll(/import\s+(?:([A-Za-z_$][\w$]*)\s*,?\s*)?(?:\{([^}]*)\})?\s*from\s*['"][^'"]+['"]/g)) {
    if (m[1]) defined.add(m[1]);
    if (m[2]) for (let part of m[2].split(',')) {
      part = part.trim();
      if (!part) continue;
      defined.add((part.split(/\s+as\s+/)[1] || part.split(/\s+as\s+/)[0]).trim());
    }
  }
  for (const m of src.matchAll(/import\s+\*\s+as\s+([A-Za-z_$][\w$]*)/g)) defined.add(m[1]);
  // 本地声明（函数/变量/类，含嵌套——宁多勿漏，避免误报）
  for (const m of src.matchAll(/(?:function\s*\*?\s*|class\s+|(?:const|let|var)\s+)([A-Za-z_$][\w$]*)/g)) defined.add(m[1]);
  // 解构形参：function f({ a, getChapterInfo }) / ({ a }) => ...
  for (const m of src.matchAll(/\(\s*\{([^{}]*)\}\s*\)/g)) {
    for (let part of m[1].split(',')) {
      part = part.trim();
      if (!part) continue;
      defined.add((part.split(/\s+as\s+/)[0].split('=')[0]).trim());
    }
  }
  // 去掉注释和字符串字面量，避免把文本内容误判为函数调用
  const noComments = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/'[^'\n]*'/g, "''")
    .replace(/"[^"\n]*"/g, '""')
    .replace(/`[^`]*`/g, '``');
  const calls = noComments.matchAll(/(?<![\w$.!])([A-Za-z_$][\w$]*)\s*\(/g);
  const reported = new Set();
  for (const m of calls) {
    const name = m[1];
    if (defined.has(name) || GLOBALS.has(name) || !projectExports.has(name) || reported.has(name)) continue;
    reported.add(name);
    console.log(`MISSING IMPORT ${rel(file)}: 调用了 '${name}(' 但未导入`);
    errors++;
  }
}
console.log(errors ? `\n共 ${errors} 个问题` : '全部导入校验通过 ✓');
process.exit(errors ? 1 : 0);