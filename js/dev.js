// Dev Panel —— 隐藏在右下角齿轮图标，点击打开调试面板
import { state, saveState } from './state.js';
import { addCoins, addAtmosphere, addHistory } from './storage.js';
import { addDiaryEntry } from './diary.js';
import { renderFocusPage, showBookCompleteAnimation, showBookShelvingAnimation, renderVisitorsPage, updateStatusBar } from './render/index.js';
import { showCertificate } from './render/certificate.js';
import { spawnVisitor, onTimeSkip, visitorForceReturn as doForceReturn, visitorReset as doReset, VISITOR_DEFS } from './visitors.js';
import { SHARED_POOL } from '../data/book_pool.js';
import { purchasePlanePortal } from './shop.js';
import { getBookCapacity, getOwnedBookCount, createBookRecord } from './capacity.js';
import { PLANES, canUnlockPlane } from '../data/planes.js';

window.__devTimeOffset = window.__devTimeOffset || 0;
window.__dev = {};

const PANEL_HTML = `
<div id="dev-overlay" class="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 hidden">
  <div class="parchment-bg rounded-2xl p-6 max-w-sm w-full magic-glow shadow-2xl">
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-display text-lg font-bold flex items-center gap-2">
        <span>🔧</span> Dev Panel
      </h2>
      <button id="dev-close" class="text-xl text-ink-light hover:text-ink leading-none">&times;</button>
    </div>

    <div class="space-y-3">
      <div>
        <label class="text-xs text-ink-light block mb-1">加速时间（小时）</label>
        <div class="flex gap-2">
          <input id="dev-hours" type="number" value="1" min="0.1" step="0.5"
            class="flex-1 px-3 py-2 border border-wood/30 rounded-lg bg-white text-sm font-mono">
          <button id="dev-accelerate" class="px-4 py-2 bg-magic-blue text-white rounded-lg text-sm font-bold hover:brightness-110">⚡ 快进</button>
        </div>
      </div>

      <hr class="border-wood/20">

      <div>
        <p class="text-xs text-ink-light mb-1">👤 召唤指定访客</p>
        <div class="grid grid-cols-5 gap-1 mb-2" id="dev-summon-grid">
          <!-- 动态生成 -->
        </div>
        <div class="grid grid-cols-3 gap-2">
          <button id="dev-visitor-spawn" class="px-3 py-2 bg-wood/10 border border-wood/30 rounded-lg text-xs hover:bg-wood/20">🎲 随机刷新</button>
          <button id="dev-visitor-return" class="px-3 py-2 bg-wood/10 border border-wood/30 rounded-lg text-xs hover:bg-wood/20">📥 强制还书</button>
          <button id="dev-visitor-reset" class="px-3 py-2 bg-wood/10 border border-wood/30 rounded-lg text-xs hover:bg-wood/20">🔄 重置访客</button>
        </div>
      </div>

      <hr class="border-wood/20">

      <div class="grid grid-cols-2 gap-2">
        <button id="dev-add-coins" class="px-3 py-2 bg-magic-gold/20 border border-magic-gold/50 rounded-lg text-sm hover:bg-magic-gold/30">💰 +500智慧之光</button>
        <button id="dev-add-atmo" class="px-3 py-2 bg-magic-blue/20 border border-magic-blue/50 rounded-lg text-sm hover:bg-magic-blue/30">✨ +10氛围</button>
      </div>

      <button id="dev-unlock-all" class="w-full px-3 py-2 bg-purple-100 border border-purple-300 rounded-lg text-sm font-bold hover:bg-purple-200">
        📖 解锁全部书籍&章节
      </button>

      <button id="dev-complete-current" class="w-full px-3 py-2 bg-green-100 border border-green-300 rounded-lg text-sm font-bold hover:bg-green-200">
        ✅ 完成当前书籍
      </button>

      <hr class="border-magic-gold/30">

      <button id="dev-unlock-plane" class="w-full px-3 py-2 bg-amber-100 border border-amber-400 rounded-lg text-sm font-bold hover:bg-amber-200">
        🌾 一键解锁田园位面
      </button>

      <hr class="border-red-200">

      <button id="dev-reset-all" class="w-full px-3 py-2 bg-red-100 border border-red-400 rounded-lg text-sm font-bold text-red-700 hover:bg-red-200">
        ⚠️ 重置所有数据
      </button>
    </div>

    <div class="mt-4 pt-3 border-t border-wood/20">
      <div id="dev-status" class="text-xs text-ink-light font-mono">
        时间偏移: 0h | 访客: (待实现)
      </div>
    </div>
  </div>
</div>
`;

const GEAR_HTML = `
<button id="dev-gear" class="fixed bottom-4 right-4 z-[99] w-9 h-9 rounded-full bg-wood/20 border border-wood/30
  flex items-center justify-center text-sm opacity-40 hover:opacity-100 hover:bg-wood/40 transition-all cursor-pointer
  shadow-sm" title="Dev Panel">
  ⚙️
</button>
`;

let panelRoot = null;

function getNow() {
  return Date.now() + (window.__devTimeOffset || 0);
}

function updateStatusLine() {
  const el = document.getElementById('dev-status');
  if (!el) return;
  const h = (window.__devTimeOffset / 3600000).toFixed(1);
  const vc = state.visitors ? state.visitors.length : 0;
  el.textContent = `时间偏移: ${h}h | 访客: ${vc}`;
}

// ========== 操作实现 ==========

function accelerate(hours) {
  const ms = hours * 3600000;
  window.__devTimeOffset += ms;
  addHistory('system', `⏩ Dev: 时间快进 ${hours}小时`, `总偏移 ${(window.__devTimeOffset / 3600000).toFixed(1)}h`);
  // 推进访客系统
  const due = onTimeSkip(hours, getNow());
  if (due && due.length > 0) {
    addHistory('system', `📥 ${due.length}位访客已到还书时间`);
  }
  renderVisitorsPage();
  updateStatusLine();
}

function addCoins500() {
  addCoins(500);
  addHistory('system', '🔧 Dev: +500智慧之光');
  updateStatusBar();
  updateStatusLine();
}

function addAtmo10() {
  addAtmosphere(10);
  addHistory('system', '🔧 Dev: +10氛围');
  updateStatusBar();
  updateStatusLine();
}

function unlockAll() {
  const { BOOKS } = requireBooks();
  Object.keys(BOOKS).forEach(id => {
    if (!state.books[id]) {
      state.books[id] = createBookRecord({ unlockedChapters: [] });
    }
    if (state.books[id].status === 'locked') {
      state.books[id].status = 'unlocked';
    }
    const book = BOOKS[id];
    if (book) {
      state.books[id].unlockedChapters = book.chapters.map((_, i) => i + 1);
    }
    state.books[id].copiedWords = book ? book.totalWords : state.books[id].copiedWords;
    state.books[id].status = 'completed';
  });
  addHistory('system', '🔧 Dev: 解锁全部书籍&章节');
  saveState();
  updateStatusLine();
}

function completeCurrentBook() {
  const bookId = state.currentSession.bookId;
  if (!bookId) {
    alert('请先在专注页面选择一本书');
    return;
  }
  const { BOOKS } = requireBooks();
  const book = BOOKS[bookId];
  if (!book) return;
  if (!state.books[bookId]) {
    state.books[bookId] = createBookRecord({ unlockedChapters: [] });
  }
  const bs = state.books[bookId];
  bs.unlockedChapters = book.chapters.map((_, i) => i + 1);
  bs.copiedWords = book.totalWords;
  bs.status = 'completed';
  bs.copyCount += 1;
  bs.masteryLevel = Math.min(5, bs.masteryLevel + 1);
  addAtmosphere(book.totalWords < 30000 ? 3 : book.totalWords < 100000 ? 6 : 10);
  addCoins(50);
  addHistory('system', `🔧 Dev: 完成《${book.title}》`);
  addDiaryEntry('book_complete', { title: book.title });
  saveState();

  // 关闭 dev 面板，展示完成动画/证书 → 上架动画
  const panel = document.getElementById('dev-overlay');
  if (panel) panel.classList.add('hidden');

  const isFirstBook = !state.tutorialFlags.firstBookComplete;
  const afterCeremony = () => {
    showBookShelvingAnimation(book, () => {
      renderFocusPage();
      updateStatusBar();
    });
  };

  if (isFirstBook) {
    showCertificate(book, afterCeremony);
  } else {
    showBookCompleteAnimation(book.title, book.emoji, bs.copyCount, afterCeremony, book, bs.masteryLevel);
  }
  updateStatusLine();
}

// 访客相关
function visitorSpawn() {
  const v = spawnVisitor();
  if (v) {
    addHistory('system', `🔧 Dev: 刷新访客 ${v.name}`);
    renderVisitorsPage();
  }
  updateStatusLine();
}

function visitorForceReturn() {
  // 将所有借出中的访客设为到期
  state.visitors.forEach(v => {
    if (v.status === 'borrowed') {
      doForceReturn(v.id);
    }
  });
  addHistory('system', '🔧 Dev: 强制所有借出访客还书');
  renderVisitorsPage();
  updateStatusLine();
}

function visitorReset() {
  doReset();
  addHistory('system', '🔧 Dev: 重置所有访客状态');
  renderVisitorsPage();
  updateStatusLine();
}

function unlockPastoralPlane() {
  const plane = PLANES.pastoral;
  if (!plane) return;

  // 1. 确保氛围 ≥80
  if ((state.library.atmosphere || 0) < 80) {
    const needed = 80 - (state.library.atmosphere || 0);
    addAtmosphere(needed);
    addHistory('system', `🔧 Dev: 氛围 +${needed}（达到80）`);
  }

  // 2. 确保拥有 ≥12 本书
  const ownedBooks = Object.values(state.books || {}).filter(b => b && b.status !== 'locked');
  if (ownedBooks.length < 12) {
    const needed = 12 - ownedBooks.length;
    const available = SHARED_POOL.filter(b => {
      const bs = state.books[b.bookId];
      return !bs || bs.status === 'locked';
    });
    let added = 0;
    for (const entry of available) {
      if (added >= needed) break;
      state.books[entry.bookId] = createBookRecord();
      added++;
    }
    addHistory('system', `🔧 Dev: 解锁 ${added} 本书（总数达到12本）`);
  }

  // 3. 确保足够智慧之光购买传送门
  if (state.coins < 2000) {
    const needed = 2000 - state.coins;
    addCoins(needed);
    addHistory('system', `🔧 Dev: +${needed}智慧之光`);
  }

  saveState();

  // 4. 购买传送门
  if (!state.library.planePortals || !state.library.planePortals[plane.unlock.shopUpgrade]) {
    const result = purchasePlanePortal('pastoral');
    if (result) {
      addHistory('system', '🔧 Dev: 田园位面传送门已开启！');
    }
  } else {
    addHistory('system', '🔧 Dev: 田园位面传送门已存在，跳过购买');
  }

  updateStatusLine();
  // 关闭面板
  const panel = document.getElementById('dev-overlay');
  if (panel) panel.classList.add('hidden');
  // 切换到档案→位面
  if (typeof window.switchTab === 'function') {
    window.switchTab('archive');
  }
}

function resetAllData() {
  if (!confirm('确定要清除所有存档数据吗？此操作不可撤销！')) return;
  localStorage.removeItem('library_state');
  localStorage.removeItem('library_achievements');
  localStorage.removeItem('library_collection');
  window.__devTimeOffset = 0;
  location.reload();
}

// ========== 书籍数据引用 ==========

function requireBooks() {
  // 动态 import 不可行时，用 window.__dev._books 兜底
  if (window.__dev._books) return { BOOKS: window.__dev._books };
  return { BOOKS: {} };
}

// ========== 安装 ==========

export function installDevPanel() {
  // 注入 HTML
  const gear = document.createElement('div');
  gear.innerHTML = GEAR_HTML;
  document.body.appendChild(gear.firstElementChild);

  const panel = document.createElement('div');
  panel.innerHTML = PANEL_HTML;
  document.body.appendChild(panel.firstElementChild);
  panelRoot = document.getElementById('dev-overlay');

  // 事件绑定
  // —— 填充召唤访客网格 ——
  const summonGrid = document.getElementById('dev-summon-grid');
  if (summonGrid) {
    Object.values(VISITOR_DEFS).forEach(def => {
      const btn = document.createElement('button');
      btn.className = 'px-1 py-1.5 bg-white/70 border border-wood/20 rounded text-sm hover:bg-magic-gold/20 hover:border-magic-gold/40 transition-all';
      btn.title = `${def.name} · ${def.title}`;
      btn.innerHTML = `<span class="text-lg leading-none">${def.emoji}</span>`;
      btn.addEventListener('click', () => {
        const v = spawnVisitor(def.id);
        if (v) {
          addHistory('system', `🔧 Dev: 召唤 ${v.name}`);
          renderVisitorsPage();
        }
        updateStatusLine();
      });
      summonGrid.appendChild(btn);
    });
  }

  document.getElementById('dev-gear').addEventListener('click', () => {
    panelRoot.classList.remove('hidden');
    updateStatusLine();
  });

  document.getElementById('dev-close').addEventListener('click', () => {
    panelRoot.classList.add('hidden');
  });

  document.getElementById('dev-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) panelRoot.classList.add('hidden');
  });

  document.getElementById('dev-accelerate').addEventListener('click', () => {
    const input = document.getElementById('dev-hours');
    const hours = parseFloat(input.value) || 0;
    if (hours > 0) accelerate(hours);
  });

  document.getElementById('dev-add-coins').addEventListener('click', addCoins500);
  document.getElementById('dev-add-atmo').addEventListener('click', addAtmo10);
  document.getElementById('dev-unlock-all').addEventListener('click', unlockAll);
  document.getElementById('dev-complete-current').addEventListener('click', completeCurrentBook);
  document.getElementById('dev-visitor-spawn').addEventListener('click', visitorSpawn);
  document.getElementById('dev-visitor-return').addEventListener('click', visitorForceReturn);
  document.getElementById('dev-visitor-reset').addEventListener('click', visitorReset);
  document.getElementById('dev-unlock-plane').addEventListener('click', unlockPastoralPlane);
  document.getElementById('dev-reset-all').addEventListener('click', resetAllData);

  // 键盘快捷键 Ctrl+Shift+D 也可以开关
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      panelRoot.classList.toggle('hidden');
      if (!panelRoot.classList.contains('hidden')) updateStatusLine();
    }
  });

  // 暴露引用给后续模块
  window.__dev.getNow = getNow;
  window.__dev.updateStatusLine = updateStatusLine;

  console.log('🔧 Dev Panel 已就绪 (Ctrl+Shift+D 或右下角齿轮)');
}
