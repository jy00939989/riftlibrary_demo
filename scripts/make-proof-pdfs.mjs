#!/usr/bin/env node
// 校对打印 PDF 生成器（2026-10-30 图南：夏蝉剧情 + 田园瘟疫纪事文本打印校对）
// 产物：桌面/个人项目/打印校对/ 下两份 A4 大留白 PDF
// 用法：node scripts/make-proof-pdfs.mjs &&（随后 chrome headless 打印，见文件尾部说明）

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = 'E:/360MoveData/Users/Administrator/Desktop/个人项目/打印校对';
mkdirSync(outDir, { recursive: true });

// ── 夏蝉剧情提取 ──
const { VISITOR_NARRATIVES } = await import(pathToFileURL(join(root, 'data/visitor-events.js')).href);
const { VISITOR_DEFS } = await import(pathToFileURL(join(root, 'js/visitors.js')).href);
const xc = VISITOR_NARRATIVES.xiachan;
const xcDef = VISITOR_DEFS.xiachan;

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const paras = s => esc(s).split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');

function entryHtml(e, showTone = false) {
  return `<div class="entry">
    <div class="eid">${esc(e.id)}${showTone && e.tone ? ` · tone:${esc(e.tone)}` : ''}</div>
    ${e.title ? `<h4>${esc(e.title)}</h4>` : ''}
    ${paras(e.text)}
    ${e.reward ? `<div class="reward">奖励：${esc(JSON.stringify(e.reward))}</div>` : ''}
  </div>`;
}

const commonGroups = [['base', '基础 6 条'], ['expand1', '扩展 1（+4 条）'], ['expand2', '扩展 2（+4 条）']];
let commonHtml = '';
for (const [key, label] of commonGroups) {
  const arr = xc.common?.[key] || [];
  commonHtml += `<h3>常层 · ${label}</h3>` + arr.map(e => entryHtml(e, true)).join('');
}

const occasionalHtml = (xc.occasional || []).map(e => entryHtml(e)).join('');
const rareHtml = xc.rare ? entryHtml(xc.rare) : '<p class="muted">（本角色无稀层事件）</p>';
const postRareHtml = xc.postRare ? entryHtml(xc.postRare) : '';
const postCommonHtml = (xc.postRareCommon || []).map(e => entryHtml(e)).join('');
const postOccHtml = (xc.postRareOccasional || []).map(e => entryHtml(e)).join('');

const xiachanHtml = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><style>${baseCss()}</style></head><body>
<h1>夏蝉 · 剧情文本全集（校对稿）</h1>
<div class="meta">来源：data/visitor-events.js（VISITOR_NARRATIVES.xiachan）+ js/visitors.js（角色定义）<br>
角色：${esc(xcDef.title)}　｜　初印象：「${esc(xcDef.firstImpression)}」<br>
光环：${esc(xcDef.aura.name)}——${esc(xcDef.aura.desc)}<br>
导出时间：${new Date().toLocaleString('zh-CN')}</div>

<div class="rules"><b>写作铁律（原文注释，改写时勿违反）：</b><br>
1. 先算账，再打气：每条必须先出现一笔具体的账（第几遍/多少小时/第几页/多少钱）<br>
2. 感叹号全条限两处、只砸在账算完之后，14条常层至少3条以低音结束<br>
3. "继续，再来一遍"全树限用四次，其中至少一次以句号形式出现，且必须放在刚数完亏损的位置<br>
4. 那条"感叹号是给妈看的"是全树所有感叹号被追加的一层含义，保留<br>
5. tone标签：连续两次 low 后强制下一条为 high（防连抽低音误导玩家）</div>

<h2>一、常层（还书随机触发，≥6 条可重复）</h2>
${commonHtml}
<h2>二、偶层（好感≥120，30% 概率，5 条不重复）</h2>
${occasionalHtml}
<h2>三、稀层（偶层全完成 + 好感≥280，10% 概率 / 第 5 次保底）</h2>
${rareHtml}
<h2>四、终局事件（稀层完成后 100% 一次性触发）</h2>
${postRareHtml}
<h2>五、终局后常层（可重复）</h2>
${postCommonHtml}
<h2>六、终局后偶层（好感≥560，30% 概率，不重复）</h2>
${postOccHtml}
</body></html>`;

// ── 瘟疫纪事 markdown 汇编 ──
function mdToHtml(md) {
  // 去 YAML frontmatter
  md = md.replace(/^---\n[\s\S]*?\n---\n*/, '');
  const lines = md.split('\n');
  let html = '', inCode = false, inTable = false, inList = null;
  const inline = s => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
  const closeList = () => { if (inList) { html += inList === 'ol' ? '</ol>' : '</ul>'; inList = null; } };
  const closeTable = () => { if (inTable) { html += '</table>'; inTable = false; } };
  for (const line of lines) {
    if (line.startsWith('```')) { closeList(); closeTable(); html += inCode ? '</pre>' : '<pre>'; inCode = !inCode; continue; }
    if (inCode) { html += esc(line) + '\n'; continue; }
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) { closeList(); closeTable(); html += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`; continue; }
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) { closeList(); closeTable(); html += '<hr>'; continue; }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      closeList();
      const cells = line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      if (/^\s*\|[\s\-|:]+\|\s*$/.test(line)) { inTable = true; continue; } // 分隔行
      if (!inTable) { html += '<table>'; inTable = true; }
      html += '<tr>' + cells.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>'; continue;
    }
    closeTable();
    const ul = line.match(/^\s*[-*]\s+(.*)/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)/);
    if (ul || ol) {
      const type = ul ? 'ul' : 'ol';
      if (inList !== type) { closeList(); html += type === 'ul' ? '<ul>' : '<ol>'; inList = type; }
      html += `<li>${inline((ul || ol)[1])}</li>`; continue;
    }
    closeList();
    if (line.trim() === '') { html += ''; continue; }
    if (line.startsWith('>')) { html += `<blockquote>${inline(line.replace(/^>\s?/, ''))}</blockquote>`; continue; }
    html += `<p>${inline(line)}</p>`;
  }
  closeList(); closeTable();
  return html;
}

const docs = [
  ['田园瘟疫纪事 · 白话全解（叙事真源）', 'docs/plans/pastoral-plane-plain.md'],
  ['田园瘟疫纪事 · 设定简报', 'docs/plans/pastoral-plane-briefing.md'],
  ['田园瘟疫纪事 · 重建计划 v2（含结局机检表/内容预算）', 'docs/plans/pastoral-plane-rebuild-plan.md'],
];
let pastoralBody = `<h1>田园瘟疫纪事 · 文本汇编（校对稿）</h1>
<div class="meta">来源：docs/plans/ 下三份文档（frontmatter 已剥除）<br>导出时间：${new Date().toLocaleString('zh-CN')}</div>`;
for (const [title, rel] of docs) {
  const p = join(root, rel);
  if (!existsSync(p)) { pastoralBody += `<h1>${esc(title)}</h1><p class="muted">（缺文件 ${esc(rel)}）</p>`; continue; }
  pastoralBody += `<div class="part"><h1 class="part-title">${esc(title)}</h1>${mdToHtml(readFileSync(p, 'utf8'))}</div>`;
}
const pastoralHtml = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><style>${baseCss()}</style></head><body>${pastoralBody}</body></html>`;

function baseCss() {
  return `@page { size: A4; margin: 22mm 20mm; }
  body { font-family: "Microsoft YaHei", "SimSun", serif; font-size: 11.5pt; line-height: 1.85; color: #1a1a1a; }
  h1 { font-size: 17pt; border-bottom: 2px solid #333; padding-bottom: 6px; margin: 0 0 14px; }
  h1.part-title { page-break-before: always; border-bottom: 2px solid #333; }
  h2 { font-size: 14pt; margin: 26px 0 10px; page-break-after: avoid; }
  h3 { font-size: 12pt; margin: 18px 0 8px; page-break-after: avoid; }
  h4 { font-size: 11.5pt; margin: 10px 0 4px; }
  p { margin: 6px 0; text-indent: 2em; }
  .meta { font-size: 9.5pt; color: #555; border: 1px solid #999; padding: 10px 14px; margin-bottom: 18px; text-indent: 0; }
  .rules { font-size: 10pt; background: #f5f0e6; border-left: 4px solid #8b6914; padding: 10px 14px; margin: 12px 0 20px; }
  .entry { margin: 14px 0 18px; }
  .eid { font-size: 9pt; color: #888; font-family: Consolas, monospace; }
  .reward { font-size: 9.5pt; color: #666; }
  .muted { color: #999; }
  pre { background: #f4f4f4; padding: 10px; font-size: 9.5pt; white-space: pre-wrap; }
  code { font-family: Consolas, monospace; font-size: 10pt; background: #f0f0f0; padding: 0 3px; }
  table { border-collapse: collapse; width: 100%; font-size: 10pt; margin: 8px 0; }
  td { border: 1px solid #aaa; padding: 4px 8px; vertical-align: top; }
  blockquote { margin: 6px 0 6px 12px; padding-left: 10px; border-left: 3px solid #ccc; color: #444; }
  ul, ol { margin: 6px 0; padding-left: 24px; }
  hr { border: none; border-top: 1px solid #bbb; margin: 16px 0; }`;
}

const html1 = join(outDir, '_xiachan.html');
const html2 = join(outDir, '_pastoral.html');
writeFileSync(html1, xiachanHtml);
writeFileSync(html2, pastoralHtml);
console.log('HTML 已生成：');
console.log(' ', html1);
console.log(' ', html2);
console.log('下一步（Git Bash 手动跑，Chrome headless 打印 PDF）：');
console.log(`  "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${outDir}/夏蝉剧情全集-校对稿.pdf" "file:///E:/360MoveData/Users/Administrator/Desktop/个人项目/打印校对/_xiachan.html"`);
console.log(`  "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${outDir}/田园瘟疫纪事-文本汇编-校对稿.pdf" "file:///E:/360MoveData/Users/Administrator/Desktop/个人项目/打印校对/_pastoral.html"`);
