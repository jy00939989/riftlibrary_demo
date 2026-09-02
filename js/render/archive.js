// 图书馆档案页面渲染（馆史档案 + 墨墨日志 + 位面 子标签）
import { state } from '../state.js';
import { t, getLocale, getDiaryBindingName } from '../i18n/terms.js';
import { getDiaryEntries, getDiaryBindingLevel } from '../diary.js';
import { PLANES, canUnlockPlane } from '../../data/planes.js';
import { getPlaneQuestState } from '../quests.js';
import { renderPlaneDetail } from './plane.js';
import { VISITOR_DEFS } from '../visitors.js';
import { getVisitorMemory, getVisitorMemoryNewCount, markSeen, clearAllNew, getVisitorStats, getVisitorItemTitle, getVisitorItemText, retroCollectVisitorMemories } from '../visitorMemory.js';

// 安全转义，防止动态文本经 innerHTML 注入
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

let archiveTab = 'history'; // 'history' | 'diary' | 'planes' | 'visitor-memory'

export function renderArchivePage() {
  const container = document.getElementById('page-archive');
  if (!container) return;
  container.innerHTML = '';

  // 子标签导航
  const newCount = getVisitorMemoryNewCount();
  const nav = document.createElement('div');
  nav.className = 'flex gap-2 mb-6 flex-wrap';
  nav.innerHTML = `
    <button class="archive-sub-tab px-4 py-2 rounded-lg font-bold text-sm transition-all ${archiveTab === 'history' ? 'bg-magic-gold text-white shadow-lg' : 'bg-parchment-dark text-ink'}">📊 ${t('subtabHistory')}</button>
    <button class="archive-sub-tab px-4 py-2 rounded-lg font-bold text-sm transition-all ${archiveTab === 'diary' ? 'bg-magic-gold text-white shadow-lg' : 'bg-parchment-dark text-ink'}">📜 ${t('subtabDiary')}</button>
    <button class="archive-sub-tab px-4 py-2 rounded-lg font-bold text-sm transition-all ${archiveTab === 'visitor-memory' ? 'bg-magic-gold text-white shadow-lg' : 'bg-parchment-dark text-ink'}">🎐 ${t('diaryTabVisitorMemory')}${newCount > 0 ? ` <span class="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">${newCount}</span>` : ''}</button>
    <button class="archive-sub-tab px-4 py-2 rounded-lg font-bold text-sm transition-all ${archiveTab === 'planes' ? 'bg-magic-gold text-white shadow-lg' : 'bg-parchment-dark text-ink'}">🌍 ${t('subtabPlanes')}</button>
  `;
  container.appendChild(nav);

  const tabs = nav.querySelectorAll('.archive-sub-tab');
  tabs[0].addEventListener('click', () => { archiveTab = 'history'; renderArchivePage(); });
  tabs[1].addEventListener('click', () => { archiveTab = 'diary'; renderArchivePage(); });
  tabs[2].addEventListener('click', () => { archiveTab = 'visitor-memory'; renderArchivePage(); });
  tabs[3].addEventListener('click', () => { archiveTab = 'planes'; renderArchivePage(); });

  if (archiveTab === 'history') {
    container.appendChild(renderHistoryTab());
  } else if (archiveTab === 'diary') {
    container.appendChild(renderDiaryTab());
  } else if (archiveTab === 'visitor-memory') {
    container.appendChild(renderVisitorMemoryTab());
  } else {
    container.appendChild(renderPlanesTab());
  }
}

// 注册全局引用供 plane.js 的返回按钮使用
window.__renderArchivePage = renderArchivePage;
window.__setArchiveTab = (tab) => { archiveTab = tab; };

// ========== 馆史档案 ==========

function renderHistoryTab() {
  const div = document.createElement('div');
  div.className = 'parchment-bg rounded-2xl p-6 magic-glow';
  div.innerHTML = `
    <h2 class="font-display text-xl font-bold mb-6">${t('tabArchive')}</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div class="bg-white rounded-lg p-3 text-center shadow">
        <div class="text-2xl font-bold text-magic-blue">${state.focus.totalMinutes}</div>
        <div class="text-xs text-ink-light">${t('totalFocusMinutes')}</div>
      </div>
      <div class="bg-white rounded-lg p-3 text-center shadow">
        <div class="text-2xl font-bold text-magic-gold">${Object.values(state.books).filter(b => b.status === 'completed').length}</div>
        <div class="text-xs text-ink-light">${t('completedBooks')}</div>
      </div>
      <div class="bg-white rounded-lg p-3 text-center shadow">
        <div class="text-2xl font-bold text-purple-600">🔥 ${state.focus.streak}</div>
        <div class="text-xs text-ink-light">${t('consecutiveFocusDays')}</div>
      </div>
      <div class="bg-white rounded-lg p-3 text-center shadow">
        <div class="text-2xl font-bold text-green-600">${state.coins}</div>
        <div class="text-xs text-ink-light">${t('totalCoinsLabel')}</div>
      </div>
    </div>
    ${state.history.length > 0 ? `
      <h3 class="font-bold mb-3">${t('eventHistory')}</h3>
      <div class="space-y-3">
        ${state.history.slice(0, 10).map(h => `
          <div class="flex gap-3">
            <div class="flex flex-col items-center">
              <div class="w-3 h-3 bg-magic-gold rounded-full"></div>
              <div class="w-0.5 h-full bg-wood/20"></div>
            </div>
            <div class="pb-4">
              <div class="text-xs text-ink-light">${new Date(h.time).toLocaleString(getLocale())}</div>
              <div class="font-bold">${escapeHtml(h.title)}</div>
              <div class="text-sm text-ink-light">${escapeHtml(h.detail)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : '<p class="text-ink-light text-center py-8">' + t('noHistoryRecords') + '</p>'}
  `;
  return div;
}

// ========== 墨墨日志 ==========

function generateDiarySummary() {
  const entries = getDiaryEntries();
  if (entries.length === 0) return null;

  const typeCounts = {};
  const bookMentions = {};
  const visitorMentions = {};
  const visitorNames = Object.values(VISITOR_DEFS || {}).map(d => d.name);

  entries.forEach(e => {
    typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
    // 提取书名提及
    const bookMatches = e.text.match(/《(.+?)》/g);
    if (bookMatches) {
      bookMatches.forEach(m => {
        const name = m.replace(/[《》]/g, '');
        bookMentions[name] = (bookMentions[name] || 0) + 1;
      });
    }
    // 提取访客提及
    visitorNames.forEach(name => {
      if (e.text.includes(name)) {
        visitorMentions[name] = (visitorMentions[name] || 0) + 1;
      }
    });
  });

  const topBooks = Object.entries(bookMentions).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topVisitors = Object.entries(visitorMentions).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return { typeCounts, topBooks, topVisitors, totalEntries: entries.length, firstEntries: entries.slice(-5).reverse() };
}

function showDiaryReviewModal() {
  const summary = generateDiarySummary();
  if (!summary) return;

  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4';
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  const typeLabels = {
    focus_complete: t('focusCompleted'),
    focus_abandon: t('focusAbandoned'),
    visitor_arrive: t('visitorArrived'),
    visitor_borrow: t('visitorBorrowed'),
    visitor_return: t('visitorReturned'),
    book_complete: t('bookCompleted'),
    milestone: t('milestone'),
    special_event: t('specialEvent'),
    daily: t('dailyReview')
  };

  let typeHtml = '';
  Object.entries(summary.typeCounts).forEach(([type, count]) => {
    typeHtml += `<span class="bg-white/60 px-2 py-1 rounded-full text-xs">${typeLabels[type] || type} ×${count}</span>`;
  });

  let bookHtml = '';
  summary.topBooks.forEach(([name, count]) => {
    bookHtml += `<div class="text-xs text-ink-light">📖 ${t('bookMentionCount').replace('{name}', name).replace('{count}', count)}</div>`;
  });

  let visitorHtml = '';
  summary.topVisitors.forEach(([name, count]) => {
    visitorHtml += `<div class="text-xs text-ink-light">👤 ${t('visitorAppearanceCount').replace('{name}', name).replace('{count}', count)}</div>`;
  });

  const card = document.createElement('div');
  card.className = 'parchment-bg rounded-2xl p-6 max-w-md w-full magic-glow animate-scale-in max-h-[80vh] overflow-y-auto';
  card.innerHTML = `
    <h2 class="font-display text-lg font-bold mb-4">${t('diaryReviewTitle')}</h2>
    <p class="text-sm text-ink-light mb-4">${t('diaryReviewSummary').replace('{count}', summary.totalEntries)}</p>
    ${typeHtml ? `<div class="mb-3"><div class="text-xs font-bold text-magic-gold mb-1">${t('eventTypes')}</div><div class="flex flex-wrap gap-1">${typeHtml}</div></div>` : ''}
    ${bookHtml ? `<div class="mb-3"><div class="text-xs font-bold text-magic-gold mb-1">${t('mostMentionedBooks')}</div>${bookHtml}</div>` : ''}
    ${visitorHtml ? `<div class="mb-3"><div class="text-xs font-bold text-magic-gold mb-1">${t('mostFrequentVisitors')}</div>${visitorHtml}</div>` : ''}
    <div class="mb-3">
      <div class="text-xs font-bold text-magic-gold mb-1">${t('earliestRecords')}</div>
      ${summary.firstEntries.map(e => `<div class="text-xs text-ink-light mb-1 border-l-2 border-magic-gold/30 pl-2">${new Date(e.time).toLocaleString(getLocale())} — ${e.text.slice(0, 60)}…</div>`).join('')}
    </div>
    <button class="mt-3 px-6 py-2 bg-magic-gold text-white rounded-lg font-bold hover:shadow-lg transition-all w-full">${t('close')}</button>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  card.querySelector('button').addEventListener('click', () => overlay.remove());
}

function renderDiaryTab() {
  const div = document.createElement('div');
  const entries = getDiaryEntries();
  const binding = getDiaryBindingLevel();

  let bindingHtml = '';
  if (entries.length > 0) {
    const progressPct = binding.level >= 4 ? 100 : Math.min(100, Math.round((entries.length % 30) / 30 * 100));
    const levelClass = `diary-binding-lv${binding.level}`;
    bindingHtml = `
      <div class="parchment-bg rounded-2xl p-4 mb-4 magic-glow text-center ${levelClass}">
        <div class="text-3xl mb-1">${binding.icon}</div>
        <div class="font-display font-bold text-lg">${getDiaryBindingName(binding.level)}</div>
        <div class="text-xs text-ink-light">${binding.level < 4 ? t('diaryBindingProgress').replace('{count}', entries.length).replace('{remaining}', 30 - (entries.length % 30)) : t('diaryBindingMax')}</div>
        ${binding.level < 4 ? `<div class="mt-2 h-1.5 bg-wood/20 rounded-full overflow-hidden"><div class="h-full bg-magic-gold rounded-full" style="width:${progressPct}%"></div></div>` : ''}
        ${binding.level >= 3 ? `<button class="diary-review-btn mt-2 px-4 py-1.5 bg-magic-gold/10 border border-magic-gold/30 rounded-lg text-xs font-bold text-magic-gold hover:bg-magic-gold/20 transition-all">${t('review')}</button>` : ''}
      </div>
    `;
  }

  let entriesHtml = '';
  if (entries.length === 0) {
    entriesHtml = `
      <div class="parchment-bg rounded-2xl p-8 text-center magic-glow">
        <div class="text-4xl mb-3">📜</div>
        <p class="text-ink-light">${t('diaryEmptyTitle')}</p>
        <p class="text-ink-light text-sm mt-1">${t('diaryEmptyHint')}</p>
      </div>
    `;
  } else {
    entriesHtml = entries.map((entry, i) => {
      const isSpecial = entry.type === 'book_complete' || entry.type === 'milestone';
      const sparkle = (binding.level >= 4 && isSpecial) ? '✨ ' : '';
      return `
        <div class="parchment-bg rounded-xl p-4 mb-3 magic-glow ${i === 0 ? 'border-l-4 border-magic-gold' : ''}">
          <div class="text-xs text-ink-light mb-2">${sparkle}${new Date(entry.time).toLocaleString(getLocale())}</div>
          <div class="text-sm text-ink whitespace-pre-line leading-relaxed">${escapeHtml(entry.text)}</div>
        </div>
      `;
    }).join('');
  }

  div.innerHTML = `
    <h2 class="font-display text-xl font-bold mb-4">📜 ${t('subtabDiary')}</h2>
    ${bindingHtml}
    ${entriesHtml}
  `;

  // 绑定回顾按钮事件
  setTimeout(() => {
    const reviewBtn = div.querySelector('.diary-review-btn');
    if (reviewBtn) {
      reviewBtn.addEventListener('click', showDiaryReviewModal);
    }
  }, 0);

  return div;
}

// ========== 访客纪念 ==========

function renderVisitorMemoryTab() {
  const div = document.createElement('div');

  // 老存档回溯：把已触发过的叙事事件补录进来（只执行一次，有变化会自动 save）
  retroCollectVisitorMemories();

  const stats = getVisitorStats();
  const groups = getVisitorMemory();

  // 进入标签页时：若全部未读则自动清角标（可选），这里保留手动标记
  let filter = 'all';

  // 总进度
  let html = `
    <div class="parchment-bg rounded-2xl p-4 mb-4 magic-glow">
      <div class="flex items-center justify-between mb-2">
        <div class="font-display font-bold text-lg">🎐 ${t('diaryTabVisitorMemory')}</div>
        <div class="text-sm font-bold text-magic-blue">${t('vmCollected').replace('{collected}', stats.collected).replace('{total}', stats.total)} · ${stats.percent}%</div>
      </div>
      <div class="h-2 bg-wood/20 rounded-full overflow-hidden">
        <div class="h-full bg-gradient-to-r from-magic-blue to-magic-gold rounded-full" style="width:${stats.percent}%"></div>
      </div>
    </div>
  `;

  // 筛选 + 全部已读
  html += `
    <div class="flex items-center justify-between mb-4">
      <div class="flex gap-2" id="vm-filter-bar">
        <button data-filter="all" class="vm-filter-btn px-3 py-1.5 rounded-lg text-sm font-bold bg-magic-gold text-white">${t('vmFilterAll')}</button>
        <button data-filter="note" class="vm-filter-btn px-3 py-1.5 rounded-lg text-sm font-bold bg-parchment-dark text-ink">${t('vmFilterNote')}</button>
        <button data-filter="event" class="vm-filter-btn px-3 py-1.5 rounded-lg text-sm font-bold bg-parchment-dark text-ink">${t('vmFilterEvent')}</button>
      </div>
      ${getVisitorMemoryNewCount() > 0 ? `<button id="vm-mark-all" class="px-3 py-1.5 rounded-lg text-sm font-bold bg-wood/20 text-ink hover:bg-wood/30 transition-colors">${t('vmMarkAllRead')}</button>` : ''}
    </div>
  `;

  // 分组列表
  if (groups.length === 0) {
    html += `
      <div class="parchment-bg rounded-2xl p-8 text-center magic-glow">
        <div class="text-4xl mb-3">🎐</div>
        <p class="text-ink-light">${t('vmEmpty')}</p>
      </div>
    `;
  } else {
    groups.forEach(g => {
      const def = VISITOR_DEFS[g.charId] || {};
      const charTotal = (stats.perChar.find(p => p.charId === g.charId) || {}).total || 0;
      const items = [...g.notes, ...g.events].sort((a, b) => b.lastSeen - a.lastSeen);

      html += `
        <div class="parchment-bg rounded-2xl p-4 mb-4 magic-glow visitor-memory-group" data-char="${g.charId}">
          <div class="flex items-center justify-between mb-3 pb-2 border-b border-wood/20">
            <div class="flex items-center gap-2">
              <span class="text-2xl">${g.charEmoji || def.emoji || '👤'}</span>
              <div>
                <div class="font-bold text-ink">${g.charName || def.name || g.charId}</div>
                <div class="text-xs text-ink-light">${def.title || ''}</div>
              </div>
            </div>
            <div class="text-sm font-bold text-magic-blue">${g.count}/${charTotal}</div>
          </div>
          <div class="space-y-2">
      `;

      items.forEach(item => {
        const title = getVisitorItemTitle(item);
        const text = getVisitorItemText(item);
        const rarityLabel = item.rarity ? t(`vmRarity${item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())}`) : '';
        html += `
          <div class="vm-item relative bg-white/60 rounded-lg p-3 cursor-pointer hover:bg-white transition-colors ${item.isNew ? 'ring-1 ring-magic-gold/40' : ''}" data-uid="${item.uid}" data-kind="${item.kind}">
            ${item.isNew ? `<span class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">${t('vmNew')}</span>` : ''}
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-bold px-1.5 py-0.5 rounded ${item.kind === 'note' ? 'bg-wood/20 text-ink' : 'bg-magic-gold/20 text-magic-gold'}">${item.kind === 'note' ? t('vmKindNote') : t('vmKindEvent')}</span>
              ${rarityLabel ? `<span class="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">${rarityLabel}</span>` : ''}
            </div>
            ${title ? `<div class="font-bold text-sm text-ink mb-1">${title}</div>` : ''}
            <div class="text-sm text-ink-light whitespace-pre-line">${text}</div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });
  }

  div.innerHTML = html;

  // 筛选按钮事件
  const filterBtns = div.querySelectorAll('.vm-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      filterBtns.forEach(b => {
        const active = b.dataset.filter === filter;
        b.className = `vm-filter-btn px-3 py-1.5 rounded-lg text-sm font-bold ${active ? 'bg-magic-gold text-white' : 'bg-parchment-dark text-ink'}`;
      });
      div.querySelectorAll('.vm-item').forEach(el => {
        el.style.display = (filter === 'all' || el.dataset.kind === filter) ? '' : 'none';
      });
    });
  });

  // 点击条目标记已读
  div.querySelectorAll('.vm-item').forEach(el => {
    el.addEventListener('click', () => {
      const uid = el.dataset.uid;
      markSeen(uid);
      const badge = el.querySelector('.absolute');
      if (badge) badge.remove();
      el.classList.remove('ring-1', 'ring-magic-gold/40');
    });
  });

  // 全部已读
  const markAllBtn = div.querySelector('#vm-mark-all');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', () => {
      clearAllNew();
      renderArchivePage();
    });
  }

  return div;
}

// ========== 位面列表 ==========

function renderPlanesTab() {
  const div = document.createElement('div');
  div.className = 'space-y-4';

  // 标题
  const header = document.createElement('div');
  header.innerHTML = `<h2 class="font-display text-xl font-bold mb-2">🌍 ${t('subtabPlanes')}</h2><p class="text-xs text-ink-light mb-4">${t('planesDescription')}</p>`;
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
              ${unlocked ? `<span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">${t('actNumber').replace('{n}', pq ? pq.stage : 1)}</span>` : ''}
              ${canUnlock ? '<span class="text-xs bg-magic-gold/20 text-magic-gold px-2 py-0.5 rounded-full">' + t('canUnlock') + '</span>' : ''}
              ${!unlocked && !canUnlock ? '<span class="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">🔒 ' + t('locked') + '</span>' : ''}
              ${pendingCount > 0 ? `<span class="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">✉️ ${t('pendingReplies').replace('{n}', pendingCount)}</span>` : ''}
            </div>
            <p class="text-xs text-ink-light mt-1 max-w-md">${plane.desc}</p>
            ${unlocked && charsTotal > 0 ? `
              <div class="flex items-center gap-3 mt-2 text-xs text-ink-light">
                <span>👥 ${t('charactersVisited').replace('{met}', charsMet).replace('{total}', charsTotal)}</span>
                ${pq && pq.mementos.length > 0 ? `<span>🏛️ ${t('mementosCollected').replace('{n}', pq.mementos.length)}</span>` : ''}
              </div>
            ` : ''}
            ${!unlocked && plane.unlock ? `
              <div class="text-xs text-ink-light/60 mt-1">
                ${t('planeUnlockRequirements').replace('{atmo}', plane.unlock.atmo).replace('{books}', plane.unlock.books)}
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
        <h3 class="font-display font-bold text-lg">${t('unknownPlane')}</h3>
        <p class="text-xs text-ink-light">${t('placeholderPlaneDesc')}</p>
        <p class="text-xs text-ink-light/50 mt-1 italic">${t('placeholderPlaneWhisper')}</p>
      </div>
    </div>
  `;
  div.appendChild(placeholderCard);

  return div;
}
