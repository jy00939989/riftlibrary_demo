// 图书馆档案页面渲染（馆史档案 + 墨墨日志 + 位面 子标签）
import { state } from '../state.js';
import { getDiaryEntries, getDiaryBindingLevel } from '../diary.js';
import { PLANES, canUnlockPlane } from '../../data/planes.js';
import { getPlaneQuestState } from '../quests.js';
import { renderPlaneDetail } from './plane.js';

let archiveTab = 'history'; // 'history' | 'diary' | 'planes'

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
    <button class="archive-sub-tab px-4 py-2 rounded-lg font-bold text-sm transition-all ${archiveTab === 'planes' ? 'bg-magic-gold text-white shadow-lg' : 'bg-parchment-dark text-ink'}">🌍 位面</button>
  `;
  container.appendChild(nav);

  const tabs = nav.querySelectorAll('.archive-sub-tab');
  tabs[0].addEventListener('click', () => { archiveTab = 'history'; renderArchivePage(); });
  tabs[1].addEventListener('click', () => { archiveTab = 'diary'; renderArchivePage(); });
  tabs[2].addEventListener('click', () => { archiveTab = 'planes'; renderArchivePage(); });

  if (archiveTab === 'history') {
    container.appendChild(renderHistoryTab());
  } else if (archiveTab === 'diary') {
    container.appendChild(renderDiaryTab());
  } else {
    container.appendChild(renderPlanesTab());
  }
}

// 注册全局引用供 plane.js 的返回按钮使用
window.__renderArchivePage = renderArchivePage;

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

// ========== 位面列表 ==========

function renderPlanesTab() {
  const div = document.createElement('div');
  div.className = 'space-y-4';

  // 标题
  const header = document.createElement('div');
  header.innerHTML = '<h2 class="font-display text-xl font-bold mb-2">🌍 位面</h2><p class="text-xs text-ink-light mb-4">归墟图书馆连接的诸世界。开启传送门，迎接来自其他位面的访客。</p>';
  div.appendChild(header);

  // 位面列表
  const allPlanes = Object.values(PLANES).filter(p => !p.isPlaceholder);

  allPlanes.forEach(plane => {
    const pq = getPlaneQuestState(plane.id);
    const unlocked = (pq && pq.unlocked) || plane.unlocked;

    const card = document.createElement('div');
    const canUnlock = !unlocked && canUnlockPlane(plane.id, state);

    card.className = `rounded-xl p-5 border-2 transition-all ${
      unlocked ? 'parchment-bg magic-glow cursor-pointer hover:shadow-lg border-magic-gold/20 hover:border-magic-gold/50' :
      canUnlock ? 'bg-white border-dashed border-magic-gold/40 cursor-pointer hover:shadow-md' :
      'bg-gray-50 border-gray-200 opacity-60'
    }`;

    const charsMet = pq ? Object.values(pq.characters).filter(c => c && c.met).length : 0;
    const charsTotal = plane.characters ? plane.characters.length : 0;
    const pendingCount = pq ? Object.values(pq.characters).reduce((sum, c) => sum + (c && c.pendingComplete ? c.pendingComplete.length : 0), 0) : 0;

    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <span class="text-4xl">${plane.emoji}</span>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-display font-bold text-lg">${plane.name}</h3>
              ${unlocked ? `<span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">第${pq ? pq.stage : 1}幕</span>` : ''}
              ${canUnlock ? '<span class="text-xs bg-magic-gold/20 text-magic-gold px-2 py-0.5 rounded-full">可开启</span>' : ''}
              ${!unlocked && !canUnlock ? '<span class="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">🔒 未解锁</span>' : ''}
              ${pendingCount > 0 ? `<span class="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">✉️ ${pendingCount}封待回信</span>` : ''}
            </div>
            <p class="text-xs text-ink-light mt-1 max-w-md">${plane.desc}</p>
            ${unlocked && charsTotal > 0 ? `
              <div class="flex items-center gap-3 mt-2 text-xs text-ink-light">
                <span>👥 角色 ${charsMet}/${charsTotal} 已到访</span>
                ${pq && pq.mementos.length > 0 ? `<span>🏛️ 信物 ${pq.mementos.length} 件</span>` : ''}
              </div>
            ` : ''}
            ${!unlocked && plane.unlock ? `
              <div class="text-xs text-ink-light/60 mt-1">
                需要：氛围 ≥${plane.unlock.atmo} · 拥有 ≥${plane.unlock.books} 本书 · 购买传送门
              </div>
            ` : ''}
          </div>
        </div>
        <span class="text-magic-gold text-lg">→</span>
      </div>
    `;

    if (unlocked) {
      card.addEventListener('click', () => {
        renderPlaneDetail(plane.id);
      });
    } else if (canUnlock) {
      card.addEventListener('click', () => {
        // 跳转到位面商店
        window.switchTab('shop');
      });
    }

    div.appendChild(card);
  });

  // 占位位面（窥探感）
  const placeholderCard = document.createElement('div');
  placeholderCard.className = 'bg-gray-50 rounded-xl p-5 border-2 border-dashed border-gray-200 opacity-50';
  placeholderCard.innerHTML = `
    <div class="flex items-center gap-4">
      <span class="text-4xl">🔒</span>
      <div>
        <h3 class="font-display font-bold text-lg">？？？</h3>
        <p class="text-xs text-ink-light">新的传送门尚未开启……裂隙的另一侧传来隐约的回声。</p>
        <p class="text-xs text-ink-light/50 mt-1 italic">"麦浪翻涌……有人在歌唱……"</p>
      </div>
    </div>
  `;
  div.appendChild(placeholderCard);

  return div;
}
