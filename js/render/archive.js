// 图书馆档案页面渲染（馆史档案 + 墨墨日志 子标签）
import { state } from '../state.js';
import { getDiaryEntries, getDiaryBindingLevel } from '../diary.js';

let archiveTab = 'history'; // 'history' | 'diary'

export function renderArchivePage() {
  const container = document.getElementById('page-archive');
  if (!container) return;
  container.innerHTML = '';

  // 子标签导航
  const nav = document.createElement('div');
  nav.className = 'flex gap-2 mb-6';
  nav.innerHTML = `
    <button class="archive-sub-tab px-4 py-2 rounded-lg font-bold text-sm transition-all ${archiveTab === 'history' ? 'bg-magic-gold text-white shadow-lg' : 'bg-parchment-dark text-ink'}">📊 馆史档案</button>
    <button class="archive-sub-tab px-4 py-2 rounded-lg font-bold text-sm transition-all ${archiveTab === 'diary' ? 'bg-magic-gold text-white shadow-lg' : 'bg-parchment-dark text-ink'}">📜 墨墨日志</button>
  `;
  container.appendChild(nav);

  const tabs = nav.querySelectorAll('.archive-sub-tab');
  tabs[0].addEventListener('click', () => { archiveTab = 'history'; renderArchivePage(); });
  tabs[1].addEventListener('click', () => { archiveTab = 'diary'; renderArchivePage(); });

  if (archiveTab === 'history') {
    container.appendChild(renderHistoryTab());
  } else {
    container.appendChild(renderDiaryTab());
  }
}

// ========== 馆史档案 ==========

function renderHistoryTab() {
  const div = document.createElement('div');
  div.className = 'parchment-bg rounded-2xl p-6 magic-glow';
  div.innerHTML = `
    <h2 class="font-display text-xl font-bold mb-6">馆史档案</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div class="bg-white rounded-lg p-3 text-center shadow">
        <div class="text-2xl font-bold text-magic-blue">${state.focus.totalMinutes}</div>
        <div class="text-xs text-ink-light">总专注分钟</div>
      </div>
      <div class="bg-white rounded-lg p-3 text-center shadow">
        <div class="text-2xl font-bold text-magic-gold">${Object.values(state.books).filter(b => b.status === 'completed').length}</div>
        <div class="text-xs text-ink-light">完成书籍</div>
      </div>
      <div class="bg-white rounded-lg p-3 text-center shadow">
        <div class="text-2xl font-bold text-purple-600">🔥 ${state.focus.streak}</div>
        <div class="text-xs text-ink-light">连续专注天数</div>
      </div>
      <div class="bg-white rounded-lg p-3 text-center shadow">
        <div class="text-2xl font-bold text-green-600">${state.coins}</div>
        <div class="text-xs text-ink-light">累计智慧之光</div>
      </div>
    </div>
    ${state.history.length > 0 ? `
      <h3 class="font-bold mb-3">事件历史</h3>
      <div class="space-y-3">
        ${state.history.slice(0, 10).map(h => `
          <div class="flex gap-3">
            <div class="flex flex-col items-center">
              <div class="w-3 h-3 bg-magic-gold rounded-full"></div>
              <div class="w-0.5 h-full bg-wood/20"></div>
            </div>
            <div class="pb-4">
              <div class="text-xs text-ink-light">${new Date(h.time).toLocaleString('zh-CN')}</div>
              <div class="font-bold">${h.title}</div>
              <div class="text-sm text-ink-light">${h.detail}</div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : '<p class="text-ink-light text-center py-8">暂无记录，开始你的第一次专注吧 ✨</p>'}
  `;
  return div;
}

// ========== 墨墨日志 ==========

function renderDiaryTab() {
  const div = document.createElement('div');
  const entries = getDiaryEntries();
  const binding = getDiaryBindingLevel();

  // 装帧等级卡片
  let bindingHtml = '';
  if (entries.length > 0) {
    const progressPct = Math.min(100, Math.round((entries.length % 30) / 30 * 100));
    bindingHtml = `
      <div class="parchment-bg rounded-2xl p-4 mb-4 magic-glow text-center">
        <div class="text-3xl mb-1">${binding.icon}</div>
        <div class="font-display font-bold text-lg">${binding.name}</div>
        <div class="text-xs text-ink-light">${binding.level < 4 ? `已记录 ${entries.length} 页 · 距下一级还差 ${30 - (entries.length % 30)} 页` : '墨墨的日志已臻至化境 ✨'}</div>
        ${binding.level < 4 ? `<div class="mt-2 h-1.5 bg-wood/20 rounded-full overflow-hidden"><div class="h-full bg-magic-gold rounded-full" style="width:${entries.length % 30 / 30 * 100}%"></div></div>` : ''}
      </div>
    `;
  }

  // 日志条目
  let entriesHtml = '';
  if (entries.length === 0) {
    entriesHtml = `
      <div class="parchment-bg rounded-2xl p-8 text-center magic-glow">
        <div class="text-4xl mb-3">📜</div>
        <p class="text-ink-light">墨墨还没有开始写日志……</p>
        <p class="text-ink-light text-sm mt-1">完成一次专注后，墨墨会在日志里记录下今天的故事。</p>
      </div>
    `;
  } else {
    entriesHtml = entries.map((entry, i) => `
      <div class="parchment-bg rounded-xl p-4 mb-3 magic-glow ${i === 0 ? 'border-l-4 border-magic-gold' : ''}">
        <div class="text-xs text-ink-light mb-2">${new Date(entry.time).toLocaleString('zh-CN')}</div>
        <div class="text-sm text-ink whitespace-pre-line leading-relaxed">${entry.text}</div>
      </div>
    `).join('');
  }

  div.innerHTML = `
    <h2 class="font-display text-xl font-bold mb-4">📜 墨墨日志</h2>
    ${bindingHtml}
    ${entriesHtml}
  `;
  return div;
}
