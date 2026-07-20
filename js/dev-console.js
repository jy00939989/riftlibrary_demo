// 归墟图书馆 · 调试控制台（仅 localhost 可用）
// 快捷键：按 ` 键（反引号，ESC 下面那个）打开/关闭

import { state } from './state.js';

// 仅本地开发时加载
if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  console.log('📚 调试控制台仅在本地开发环境可用');
}

let panel = null;
let isOpen = false;

// ========== 容错包装 ==========
// 如果 state 还没初始化（模块加载顺序问题），等 state._init 之后再挂载
export function initDevConsole() {
  if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;

  // 快捷键
  document.addEventListener('keydown', (e) => {
    if (e.key === '`' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      toggle();
    }
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      close();
    }
  });

  // 右下角小按钮（非侵入式）
  const btn = document.createElement('div');
  btn.id = 'dev-console-btn';
  btn.title = '调试控制台 (`)';
  btn.style.cssText = 'position:fixed;bottom:4px;right:4px;z-index:999;width:20px;height:20px;border-radius:50%;background:rgba(201,162,39,0.15);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:10px;opacity:0.3;transition:opacity 0.2s;';
  btn.innerHTML = '🔧';
  btn.addEventListener('mouseenter', () => btn.style.opacity = '1');
  btn.addEventListener('mouseleave', () => btn.style.opacity = '0.3');
  btn.addEventListener('click', toggle);
  document.body.appendChild(btn);
}

function toggle() {
  isOpen ? close() : open();
}

function open() {
  if (panel) return;
  isOpen = true;

  panel = document.createElement('div');
  panel.id = 'dev-console';
  panel.style.cssText = 'position:fixed;inset:0;z-index:1000;background:rgba(20,16,10,0.95);color:#f5e6c8;font-family:Consolas,monospace;font-size:13px;overflow-y:auto;padding:16px;';
  panel.innerHTML = buildContent();
  panel.addEventListener('click', (e) => {
    if (e.target === panel) close();
  });
  document.body.appendChild(panel);
}

function close() {
  if (panel) { panel.remove(); panel = null; }
  isOpen = false;
}

function refresh() {
  if (panel) {
    panel.innerHTML = buildContent();
    rebindButtons(panel);
  }
}

function buildContent() {
  const now = new Date();
  const s = state;
  const lib = s.library || {};

  return `
<div style="max-width:900px;margin:0 auto;">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;border-bottom:1px solid rgba(201,162,39,0.3);padding-bottom:8px;">
    <span style="font-size:16px;font-weight:bold;">🦉 调试控制台</span>
    <span style="color:#888;font-size:11px;">按 \` 或 ESC 关闭 · ${now.toLocaleTimeString()}</span>
  </div>

  <!-- 快速概览 -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-bottom:16px;">
    ${statCard('💰 智慧之光', s.coins?.toLocaleString() || '0')}
    ${statCard('✨ 灵感', s.inspiration || '0')}
    ${statCard('🔥 连续', (s.focus?.streak || 0) + ' 天')}
    ${statCard('📝 总字数', (s.focus?.totalWords || 0).toLocaleString())}
    ${statCard('⏱️ 总分钟', s.focus?.totalMinutes || '0')}
    ${statCard('🌡️ 氛围', (lib.atmosphere || 0) + '/500')}
    ${statCard('📚 书架', shelfSummary())}
    ${statCard('🏛️ 缮写室', 'Lv.' + (lib.focusLevel || 0))}
    ${statCard('☕ 借阅区', 'Lv.' + (lib.borrowLevel || 0))}
  </div>

  <!-- 访客叙事进度 -->
  <div style="margin-bottom:16px;">
    <div style="font-size:14px;font-weight:bold;margin-bottom:8px;">📋 访客叙事进度</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px;">
      ${visitorCards()}
    </div>
  </div>

  <!-- 行动按钮 -->
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;padding-top:8px;border-top:1px solid rgba(201,162,39,0.2);">
    <button class="dc-btn" onclick="window._dcAction('refresh')">🔄 刷新</button>
    <button class="dc-btn" onclick="window._dcAction('forceReturn')">📥 强制收书（所有到期）</button>
    <button class="dc-btn" onclick="window._dcAction('addInspiration5')">✨ +5 灵感</button>
    <button class="dc-btn" onclick="window._dcAction('addCoins500')">💰 +500 智慧之光</button>
    <button class="dc-btn" onclick="window._dcAction('damageBook')">⚠️ 损坏当前书</button>
    <button class="dc-btn" style="background:rgba(200,80,80,0.3);" onclick="window._dcAction('resetState')">💣 重置存档</button>
  </div>
  <div id="dc-toast" style="color:#fbbf24;font-size:12px;min-height:18px;"></div>
</div>`;
}

function statCard(label, value) {
  return `<div style="background:rgba(201,162,39,0.06);border:1px solid rgba(201,162,39,0.12);border-radius:6px;padding:8px 10px;">
    <div style="color:#999;font-size:10px;">${label}</div>
    <div style="font-size:16px;font-weight:bold;">${value}</div>
  </div>`;
}

function shelfSummary() {
  const lib = state.library;
  const shelves = lib.shelves || [];
  let onShelf = 0;
  shelves.forEach(s => s.forEach(id => { if (id) onShelf++; }));
  const cap = shelves.length * 5;
  return `${onShelf}/${cap}`;
}

function visitorCards() {
  const ids = ['shenmingyuan','chengyuan','peizhou','jianan','jiangyoushu','guyu','qiaoyiyi','xierugui','xiachan','wangxiaolei'];
  const defs = {
    shenmingyuan: '👨‍🏫沈明远', chengyuan: '💻程远', peizhou: '📚裴舟', jianan: '📋简安',
    jiangyoushu: '🎓江有树', guyu: '🌾谷雨', qiaoyiyi: '🎨乔一一', xierugui: '🏭谢如归',
    xiachan: '💃夏蝉', wangxiaolei: '📦王小磊'
  };

  return ids.map(id => {
    const ns = (state.visitorNarratives || {})[id] || {};
    const favor = (state.visitorFavors || {})[id] || 0;
    const occDone = (ns.occasionalCompleted || []).length;
    const occTotal = 5;
    const rareOk = ns.rareTriggered;
    const postRareOk = ns.postRareTriggered;
    const eligible = ns.rareEligibleCount || 0;

    // 状态条
    let bar = [];
    bar.push(`<span style="color:${favor >= 30 ? '#34d399' : '#666'}">好感${favor}</span>`);
    bar.push(`<span style="color:${occDone >= occTotal ? '#34d399' : occDone > 0 ? '#fbbf24' : '#666'}">偶层${occDone}/${occTotal}</span>`);
    if (rareOk) bar.push(`<span style="color:#f59e0b">✨稀层✓</span>`);
    if (postRareOk) bar.push(`<span style="color:#a78bfa">🎉终局✓</span>`);
    if (eligible > 0 && !rareOk) bar.push(`<span style="color:#f87171">保底${eligible}/5</span>`);

    // 条件不足的灰掉，条件满足的高亮
    const allReady = !rareOk && favor >= 60 && occDone >= occTotal;
    const borderColor = allReady ? '#f59e0b' : rareOk ? '#a78bfa' : 'rgba(255,255,255,0.08)';

    return `<div style="background:rgba(255,255,255,0.03);border:1px solid ${borderColor};border-radius:6px;padding:8px 10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-weight:bold;">${defs[id] || id}</span>
        <span style="font-size:11px;color:#999;">${bar.join(' · ')}</span>
      </div>
      ${allReady ? '<div style="color:#f59e0b;font-size:10px;margin-top:2px;">⚡ 稀层条件全满足，每次还书有概率触发</div>' : ''}
    </div>`;
  }).join('\n');
}

function rebindButtons(el) {
  el.querySelectorAll('.dc-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = e.target.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
      if (action) doAction(action);
    });
  });
}

// ========== 调试操作 ==========

async function doAction(action) {
  const toast = (msg) => {
    const el = document.getElementById('dc-toast');
    if (el) el.textContent = '✓ ' + msg;
    setTimeout(() => { const e = document.getElementById('dc-toast'); if (e) e.textContent = ''; }, 2000);
  };

  switch (action) {
    case 'refresh':
      refresh();
      return;

    case 'forceReturn': {
      const due = state.visitors.filter(v => v.status === 'due');
      if (due.length === 0) { toast('没有待收取的还书'); return; }
      // 动态导入避免循环依赖
      const { collectReturn } = await import('./visitors.js');
      due.forEach(v => collectReturn(v.id));
      toast(`收取了 ${due.length} 本还书`);
      refresh();
      if (window.switchTab) window.switchTab('visitors');
      return;
    }

    case 'addInspiration5': {
      const { addInspiration } = await import('./storage.js');
      for (let i = 0; i < 5; i++) addInspiration(1);
      toast('+5 灵感');
      refresh();
      if (window._updateStatusBar) window._updateStatusBar();
      return;
    }

    case 'addCoins500': {
      const { addCoins } = await import('./storage.js');
      addCoins(500);
      toast('+500 智慧之光');
      refresh();
      if (window._updateStatusBar) window._updateStatusBar();
      return;
    }

    case 'damageBook': {
      const bid = state.currentSession.bookId;
      if (!bid || !state.books[bid]) { toast('请先在缮写室选一本书'); return; }
      const bs = state.books[bid];
      const bookTitle = (await import('../data/books.js')).BOOKS[bid]?.title || bid;
      bs.damaged = true;
      const loss = Math.round((bs.copiedWords || 1000) * 0.25);
      bs.repairWords = loss;
      bs.repairProgress = 0;
      bs.copiedWords = Math.max(0, (bs.copiedWords || 0) - loss);
      if (bs.status === 'completed') bs.status = 'copying';
      const { addHistory } = await import('./storage.js');
      addHistory('damage', `⚠️ 《${bookTitle}》受损（调试触发）`, `损失${loss.toLocaleString()}字，需专注修复`);
      toast(`已损坏《${bookTitle}》，损失 ${loss.toLocaleString()} 字`);
      refresh();
      if (window.switchTab) { window.switchTab('focus'); window.switchTab('focus'); }
      return;
    }

    case 'resetState':
      if (!confirm('确定要清除所有存档重新开始吗？此操作不可恢复。')) return;
      localStorage.removeItem('library_state');
      localStorage.removeItem('library_state_backup');
      location.reload();
      return;
  }
}

// 暴露 action 处理到全局
window._dcAction = doAction;
window._dcRefresh = refresh;

// ========== 注入到 app.js init 末尾 ==========
// 由 app.js 在 init() 最后一行调用
