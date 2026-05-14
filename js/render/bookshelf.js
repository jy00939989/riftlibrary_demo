// 书架页面渲染
import { state } from '../state.js';
import { BOOKS, CATEGORIES } from '../../data/books.js';
import { el, actions } from './common.js';

const SHELF_CAPACITY = 5;
let currentFilter = 'all';
let currentCategory = 'all';
let currentSort = 'default';

export function renderBookshelfPage() {
  const container = document.getElementById('page-bookshelf');
  if (!container) return;
  container.innerHTML = '';

  const card = el('div', 'parchment-bg rounded-2xl p-6 magic-glow');
  let books = Object.values(BOOKS).filter(b => state.books[b.id]);

  // 筛选栏
  card.appendChild(renderFilterBar());

  // 应用筛选
  books = applyFilters(books);

  // 标题栏
  const header = el('div', 'flex items-center justify-between mb-6');
  header.innerHTML = `<h2 class="font-display text-xl font-bold">我的书架 <span class="text-sm font-normal text-ink-light">(${books.length}本)</span></h2>`;
  const n = state.library.shelves.length;
  const price = Math.min(4800, 300 * Math.pow(2, n - 1));
  const buyBtn = el('button', 'px-4 py-2 bg-magic-gold text-white rounded-lg text-sm font-bold shadow hover:shadow-lg transition-all');
  buyBtn.textContent = `+ 购买新书架 💰${price.toLocaleString()}`;
  buyBtn.addEventListener('click', () => {
    actions.buyShelf();
  });
  header.appendChild(buyBtn);
  card.appendChild(header);

  // 书架网格
  const gridDiv = el('div', 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3');
  books.forEach(book => {
    gridDiv.appendChild(renderBookCard(book));
  });
  // 空位
  const totalSlots = state.library.shelves.length * SHELF_CAPACITY;
  const emptySlots = Math.max(0, totalSlots - books.length);
  for (let i = 0; i < emptySlots; i++) {
    const empty = el('div', 'book-card p-3 border-2 border-dashed border-wood/30 rounded-lg flex items-center justify-center min-h-[150px]');
    empty.innerHTML = '<span class="text-wood/30 text-2xl">+</span>';
    gridDiv.appendChild(empty);
  }

  card.appendChild(gridDiv);
  container.appendChild(card);
}

function renderFilterBar() {
  const bar = el('div', 'flex flex-wrap items-center gap-2 mb-4');

  const tabs = [
    { id: 'all', label: '全部' },
    { id: 'copying', label: '誊抄中' },
    { id: 'completed', label: '已完成' },
    { id: 'starred', label: '⭐收藏' }
  ];

  tabs.forEach(tab => {
    const btn = el('button', `px-3 py-1 rounded-full text-xs font-bold transition-all ${
      currentFilter === tab.id ? 'bg-magic-gold text-white' : 'bg-wood/10 text-ink-light hover:bg-wood/20'
    }`);
    btn.textContent = tab.label;
    btn.addEventListener('click', () => {
      currentFilter = tab.id;
      renderBookshelfPage();
    });
    bar.appendChild(btn);
  });

  // 分类下拉
  const select = document.createElement('select');
  select.className = 'px-3 py-1 rounded-full text-xs font-bold bg-wood/10 text-ink-light border border-wood/20 cursor-pointer';
  select.innerHTML = `<option value="all">全部分类</option>${CATEGORIES.map(c => `<option value="${c}" ${currentCategory === c ? 'selected' : ''}>${c}</option>`).join('')}`;
  select.addEventListener('change', () => {
    currentCategory = select.value;
    renderBookshelfPage();
  });
  bar.appendChild(select);

  // 排序按钮
  const sortBtn = el('button', 'px-3 py-1 rounded-full text-xs font-bold bg-wood/10 text-ink-light hover:bg-wood/20');
  const labels = { 'default': '默认排序', 'words-asc': '字数 ↑', 'words-desc': '字数 ↓' };
  sortBtn.textContent = labels[currentSort];
  sortBtn.addEventListener('click', () => {
    const order = ['default', 'words-asc', 'words-desc'];
    const idx = order.indexOf(currentSort);
    currentSort = order[(idx + 1) % order.length];
    renderBookshelfPage();
  });
  bar.appendChild(sortBtn);

  return bar;
}

function applyFilters(books) {
  let result = [...books];

  if (currentFilter === 'copying') {
    result = result.filter(b => {
      const bs = state.books[b.id];
      return bs && bs.status !== 'completed' && bs.copiedWords > 0;
    });
  } else if (currentFilter === 'completed') {
    result = result.filter(b => state.books[b.id]?.status === 'completed');
  } else if (currentFilter === 'starred') {
    result = result.filter(b => state.books[b.id]?.starred);
  }

  if (currentCategory !== 'all') {
    result = result.filter(b => b.category === currentCategory);
  }

  if (currentSort === 'words-asc') {
    result.sort((a, b) => a.totalWords - b.totalWords);
  } else if (currentSort === 'words-desc') {
    result.sort((a, b) => b.totalWords - a.totalWords);
  }

  return result;
}

function renderBookCard(book) {
  const bookState = state.books[book.id];
  const progress = book.totalWords > 0 ? Math.round((bookState.copiedWords / book.totalWords) * 100) : 0;
  const masteryNames = ['', '初识', '熟悉', '精通', '大师', '传承'];
  const starIcon = bookState.starred ? '⭐' : '☆';

  const cardDiv = el('div', 'book-card p-3 bg-white rounded-lg shadow border-l-4 border-magic-blue/30 hover:shadow-lg transition-all relative');

  cardDiv.innerHTML = `
    <button class="star-btn absolute top-1 right-1 text-sm w-6 h-6 flex items-center justify-center rounded-full hover:bg-magic-gold/20 z-10" data-book-id="${book.id}">${starIcon}</button>
    <div class="text-2xl mb-2">${book.emoji}</div>
    <div class="font-bold text-sm mb-1">${book.title}</div>
    <div class="text-xs text-ink-light mb-2">${book.author} · ${book.totalWords.toLocaleString()}字</div>
    <div class="text-xs text-magic-blue mb-2">${masteryNames[bookState.masteryLevel] || '未开始'} | 再抄${Math.max(0, 3 - bookState.copyCount)}次升级</div>
    <div class="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
      <div class="h-full bg-magic-blue" style="width:${progress}%"></div>
    </div>
    <div class="text-xs text-ink-light mt-1">${bookState.status === 'completed' ? '已完成 ✓' : progress > 0 ? '誊抄中 ' + progress + '%' : '未开始'}</div>
  `;

  // 星标点击
  const starBtn = cardDiv.querySelector('.star-btn');
  starBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    bookState.starred = !bookState.starred;
    renderBookshelfPage();
  });

  // 整卡点击 → 章节列表 or mastery 详情
  cardDiv.addEventListener('click', (e) => {
    if (e.target.classList.contains('star-btn')) return;
    if (bookState.status === 'completed' && bookState.masteryLevel >= 1) {
      showMasteryDetail(book);
    } else {
      renderChapterList(book);
    }
  });

  return cardDiv;
}

function renderChapterList(book) {
  const bookState = state.books[book.id];
  const container = document.getElementById('page-bookshelf');

  const modal = el('div', 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4');
  const content = el('div', 'parchment-bg rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto magic-glow');

  content.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-display text-xl font-bold">${book.emoji} ${book.title}</h2>
      <button class="text-2xl text-ink-light hover:text-ink close-modal">✕</button>
    </div>
    <div class="text-sm text-ink-light mb-3">${book.author} · ${book.category} · ${book.totalWords.toLocaleString()}字</div>
    <button id="start-copy-btn" class="w-full px-4 py-2 mb-4 bg-magic-gold text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all">📝 开始誊抄此书</button>
    <div class="space-y-2">
      ${book.chapters.map((ch, i) => {
        const unlocked = bookState.unlockedChapters.includes(i + 1);
        return `
          <div class="chapter-item p-3 rounded-lg border ${unlocked ? 'bg-white border-wood cursor-pointer hover:shadow' : 'bg-gray-100 border-gray-200 opacity-60'}">
            <div class="flex items-center justify-between">
              <div class="font-bold text-sm">${ch.title}</div>
              <div class="text-xs ${unlocked ? 'text-green-600' : 'text-gray-500'}">
                ${unlocked ? '🔓 已解锁' : '🔒 需誊抄' + ch.unlockAt.toLocaleString() + '字'}
              </div>
            </div>
            ${unlocked ? `<div class="text-xs text-ink-light mt-1">${ch.preview}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;

  modal.appendChild(content);
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('close-modal')) {
      modal.remove();
    }
  });

  // 开始誊抄按钮
  content.querySelector('#start-copy-btn').addEventListener('click', () => {
    state.currentSession.bookId = book.id;
    modal.remove();
    document.getElementById('tab-focus').click();
  });

  // 章节点击进入阅读
  content.querySelectorAll('.chapter-item.cursor-pointer').forEach((item, i) => {
    item.addEventListener('click', () => {
      const unlockedChs = book.chapters.filter((ch, idx) => bookState.unlockedChapters.includes(idx + 1));
      const realIdx = Array.from(content.querySelectorAll('.chapter-item.cursor-pointer')).indexOf(item);
      const ch = unlockedChs[realIdx];
      if (ch) {
        modal.remove();
        renderReadingPage(book, ch);
      }
    });
  });

  container.appendChild(modal);
}

function renderReadingPage(book, chapter) {
  const container = document.getElementById('page-bookshelf');
  const modal = el('div', 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4');
  const content = el('div', 'parchment-bg rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto magic-glow reading-page');

  content.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="font-display text-xl font-bold">${book.title}</h2>
        <div class="text-sm text-ink-light">${chapter.title}</div>
      </div>
      <button class="text-2xl text-ink-light hover:text-ink close-modal">✕</button>
    </div>
    <div class="prose prose-sm max-w-none leading-relaxed text-ink whitespace-pre-line font-serif">
      ${chapter.content}
    </div>
    <div class="mt-6 pt-4 border-t border-wood/20 text-center text-sm text-ink-light">
      — 本章完 · 感谢你的专注 —
    </div>
  `;

  modal.appendChild(content);
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('close-modal')) {
      modal.remove();
    }
  });
  container.appendChild(modal);
}

// ========== Mastery 详情弹窗 ==========

export function showMasteryDetail(book) {
  const bookState = state.books[book.id];
  const level = bookState.masteryLevel;
  const container = document.getElementById('page-bookshelf');

  const titles = ['', '初识', '熟悉', '精通', '大师', '传承'];
  const contents = [
    null,
    '书籍上架 · 可供访客借阅',
    book.authorBio || '作者小传待发现',
    book.anecdotes || '创作轶闻待发现',
    book.reviews || '名家书评待发现',
    `典藏封面 · 金光特效 · ${book.collectorCover || '🌟'}`
  ];

  const modal = el('div', 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4');
  const content = el('div', `parchment-bg rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto magic-glow ${level >= 5 ? 'animate-glow' : ''}`);

  content.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-display text-xl font-bold">${book.emoji} ${book.title} · 典藏档案</h2>
      <button class="text-2xl text-ink-light hover:text-ink close-modal">✕</button>
    </div>
    <div class="text-sm text-ink-light mb-4">${book.author} · ${book.category} · 共${bookState.copyCount}次誊抄</div>
    <div class="space-y-3 mb-4">
      ${[1,2,3,4,5].map(lv => {
        const unlocked = lv <= level;
        return `
          <div class="p-3 rounded-lg border ${unlocked ? 'bg-white border-magic-gold/30' : 'bg-gray-100 border-gray-200 opacity-50'}">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm">${unlocked ? '🔓' : '🔒'}</span>
              <span class="font-bold text-sm">Lv${lv} · ${titles[lv]}</span>
              ${lv === level ? '<span class="text-xs text-magic-gold font-bold">← 当前</span>' : ''}
            </div>
            <p class="text-xs text-ink-light ml-6">${unlocked ? contents[lv] : `再抄${lv - level}次解锁`}</p>
          </div>
        `;
      }).join('')}
    </div>
    <button class="read-chapters-btn w-full mt-4 px-4 py-2 bg-magic-gold text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all">📖 阅读章节</button>
  `;

  modal.appendChild(content);
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('close-modal')) {
      modal.remove();
    }
  });

  // "阅读章节" 按钮：关闭 mastery 弹窗，打开章节列表
  content.querySelector('.read-chapters-btn').addEventListener('click', () => {
    modal.remove();
    renderChapterList(book);
  });

  container.appendChild(modal);
}

// 跨模块引用：供 plants.js 种子兑换后刷新书架
window.renderBookshelfPage = renderBookshelfPage;
