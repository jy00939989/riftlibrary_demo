// 书架页面渲染
import { state, saveState } from '../state.js';
import { BOOKS, CATEGORIES } from '../../data/books.js';
import { el, actions } from './common.js';
import { checkTaskCompletion } from '../quests.js';

const SHELF_CAPACITY = 5;
let currentFilter = 'all';
let currentCategory = 'all';
let currentSort = 'default';

export function renderBookshelfPage() {
  const container = document.getElementById('page-bookshelf');
  if (!container) return;
  container.innerHTML = '';

  const card = el('div', 'parchment-bg rounded-2xl p-6 magic-glow');
  let books = Object.values(BOOKS).filter(b => state.books[b.id]?.status === 'completed');

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
    const empty = el('div', 'min-h-[200px] p-3 border-2 border-dashed border-wood/30 rounded-lg flex items-center justify-center');
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

  if (currentFilter === 'starred') {
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
  const masteryName = masteryNames[bookState.masteryLevel] || '';
  const isCompleted = bookState.status === 'completed';
  const isCopying = bookState.status === 'copying' || (bookState.copiedWords > 0 && !isCompleted);
  const isUnstarted = !isCompleted && !isCopying;
  const starIcon = bookState.starred ? '⭐' : '☆';
  const cardDiv = el('div', `book-spine ${isCompleted ? 'completed' : isCopying ? 'copying' : 'unstarted'} flex flex-col min-h-[200px]`);

  cardDiv.innerHTML = `
    <button class="star-btn absolute top-1.5 right-1.5 text-sm w-7 h-7 flex items-center justify-center rounded-full bg-white/60 hover:bg-white z-10 transition-all" data-book-id="${book.id}">${starIcon}</button>

    <!-- 封面区 -->
    <div class="book-cover flex-1 flex flex-col items-center justify-center p-4 relative min-h-[130px]">
      <div class="text-5xl mb-2 drop-shadow-sm">${book.emoji}</div>
      <div class="font-bold text-sm text-center text-ink leading-tight">${book.title}</div>
      <div class="text-[10px] text-ink-light/60 mt-1">${book.author}</div>
      ${isCompleted ? '<div class="absolute top-2 left-2 text-xs">🏆</div>' : ''}
    </div>

    <!-- 书脊信息区 -->
    <div class="bg-white/80 px-3 py-2.5 border-t border-wood/10">
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-[10px] text-ink-light">${book.totalWords.toLocaleString()}字</span>
        ${masteryName ? `<span class="text-[10px] font-bold text-magic-gold">✦ ${masteryName}</span>` : ''}
        ${isUnstarted ? '<span class="text-[10px] text-ink-light/50">点击开始</span>' : ''}
      </div>
      <div class="h-2 bg-wood/10 rounded-full overflow-hidden">
        <div class="h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-magic-gold' : 'bg-magic-blue'}" style="width:${Math.min(100, progress)}%"></div>
      </div>
      <div class="text-[10px] text-ink-light/60 mt-1">
        ${isCompleted ? '已完成 ✓' : isCopying ? '誊抄中 ' + progress + '%' : '待誊抄'}
      </div>
    </div>
  `;

  // 星标点击
  const starBtn = cardDiv.querySelector('.star-btn');
  starBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    bookState.starred = !bookState.starred;
    renderBookshelfPage();
  });

  // 整卡点击
  cardDiv.addEventListener('click', (e) => {
    if (e.target.classList.contains('star-btn')) return;
    if (isCompleted && bookState.masteryLevel >= 1 && !book.noMastery) {
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
        const isRead = bookState.readChapters && bookState.readChapters.includes(i);
        return `
          <div class="chapter-item p-3 rounded-lg border ${unlocked ? 'bg-white border-wood cursor-pointer hover:shadow' : 'bg-gray-100 border-gray-200 opacity-60'}">
            <div class="flex items-center justify-between">
              <div class="font-bold text-sm">${isRead ? '✓ ' : ''}${ch.title}</div>
              <div class="text-xs ${unlocked ? (isRead ? 'text-magic-gold' : 'text-green-600') : 'text-gray-500'}">
                ${unlocked ? (isRead ? '📖 已读' : '🔓 已解锁') : '🔒 需誊抄' + ch.unlockAt.toLocaleString() + '字'}
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
  const bookState = state.books[book.id];
  if (!bookState) return;

  const chapterIndex = book.chapters.indexOf(chapter);
  const prevChapter = chapterIndex > 0 ? book.chapters[chapterIndex - 1] : null;
  const nextChapter = chapterIndex < book.chapters.length - 1 ? book.chapters[chapterIndex + 1] : null;

  // 分页：按 ---page--- 切分，无标记则全文为 1 页
  const rawPages = chapter.content.split('---page---').map(p => p.trim()).filter(p => p);
  const pages = rawPages.length > 0 ? rawPages : [chapter.content.trim()];
  const totalPages = pages.length;

  let currentPage = 0;
  let fontSizeLevel = 0; // 0=正常, 1=大, 2=很大
  const fontClasses = ['reading-font-normal', 'reading-font-large', 'reading-font-xlarge'];
  const fontLabels = ['A', 'A', 'A'];

  function isChapterUnlocked(idx) {
    return bookState.unlockedChapters.includes(idx + 1);
  }

  function markChapterRead() {
    if (!bookState.readChapters.includes(chapterIndex)) {
      bookState.readChapters.push(chapterIndex);
      checkTaskCompletion('chapter_read', { bookId: book.id, chapterIdx: chapterIndex });
      saveState();
    }
  }

  // ========== 构建 DOM ==========

  const overlay = el('div', 'fixed inset-0 z-[100] flex flex-col items-center justify-center reading-overlay');

  // 关闭按钮
  const closeBtn = el('button', 'reading-close-btn');
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', closeReading);
  overlay.appendChild(closeBtn);

  // 书籍容器
  const bookContainer = el('div', 'reading-book flex-col items-center');

  // 标题区
  const header = el('div', 'text-center mb-3');
  header.innerHTML = `
    <h2 class="font-display text-lg font-bold" style="color:#c9a227">${book.emoji} ${book.title}</h2>
    <p class="text-xs mt-1" style="color:rgba(245,230,200,0.5)">${chapter.title}</p>
  `;
  bookContainer.appendChild(header);

  // 页面板（首次渲染用入场动画）
  const panel = el('div', 'reading-panel w-full max-w-xl reading-page-enter');
  bookContainer.appendChild(panel);

  // 页脚控制栏
  const footer = el('div', 'reading-footer');

  const prevPageBtn = el('button', 'reading-font-btn');
  prevPageBtn.textContent = '◀';
  prevPageBtn.addEventListener('click', goPrev);

  const pageIndicator = el('span', 'reading-page-indicator');

  const fontSizeBtns = fontLabels.map((label, i) => {
    const btn = el('button', `reading-font-btn ${i === fontSizeLevel ? 'active' : ''}`);
    btn.textContent = label;
    btn.style.fontSize = ['0.7rem', '0.85rem', '1rem'][i];
    btn.addEventListener('click', () => {
      fontSizeLevel = i;
      renderPageContent();
      updateControls();
    });
    return btn;
  });

  const nextPageBtn = el('button', 'reading-font-btn');
  nextPageBtn.textContent = '▶';
  nextPageBtn.addEventListener('click', goNext);

  footer.appendChild(prevPageBtn);
  footer.appendChild(pageIndicator);
  fontSizeBtns.forEach(b => footer.appendChild(b));
  footer.appendChild(nextPageBtn);
  bookContainer.appendChild(footer);

  // 章间导航
  const chapterNav = el('div', 'reading-chapter-nav');
  bookContainer.appendChild(chapterNav);

  overlay.appendChild(bookContainer);

  // ========== 渲染函数 ==========

  function renderPageContent() {
    const pageContent = pages[currentPage];
    const fontClass = fontClasses[fontSizeLevel];
    const mainIllus = (currentPage === 0 && chapter.illustrations && chapter.illustrations.main)
      ? `<img src="${chapter.illustrations.main}" class="reading-main-illustration" alt="">` : '';

    panel.innerHTML = `
      ${mainIllus}
      <div class="reading-content ${fontClass}">
        ${pageContent.split('\n\n').filter(p => p.trim()).map(p => `<p>${p.trim()}</p>`).join('')}
      </div>
    `;

    // 左右点击区域
    if (currentPage > 0) {
      const tapL = el('div', 'reading-tap-zone reading-tap-left');
      tapL.addEventListener('click', goPrev);
      panel.appendChild(tapL);
    }
    if (currentPage < totalPages - 1) {
      const tapR = el('div', 'reading-tap-zone reading-tap-right');
      tapR.addEventListener('click', goNext);
      panel.appendChild(tapR);
    }
  }

  function updateControls() {
    pageIndicator.textContent = `第 ${currentPage + 1}/${totalPages} 页`;
    prevPageBtn.style.visibility = currentPage > 0 ? 'visible' : 'hidden';
    nextPageBtn.style.visibility = currentPage < totalPages - 1 ? 'visible' : 'hidden';

    // 字号按钮激活态
    const allFontBtns = footer.querySelectorAll('.reading-font-btn');
    const fontOnly = Array.from(allFontBtns).filter(b =>
      !b.textContent.includes('◀') && !b.textContent.includes('▶')
    );
    fontOnly.forEach((b, i) => {
      b.classList.toggle('active', i === fontSizeLevel);
    });

    // 章间导航
    renderChapterNav();
  }

  function renderChapterNav() {
    chapterNav.innerHTML = '';
    if (prevChapter && isChapterUnlocked(chapterIndex - 1)) {
      const prevBtn = el('button', '');
      prevBtn.textContent = `← ${prevChapter.title}`;
      prevBtn.addEventListener('click', () => {
        markChapterRead();
        closeReading();
        setTimeout(() => renderReadingPage(book, prevChapter), 200);
      });
      chapterNav.appendChild(prevBtn);
    }

    const label = el('span', 'reading-chapter-label');
    const readMark = bookState.readChapters.includes(chapterIndex) ? ' ✓已读' : '';
    label.textContent = `${chapterIndex + 1}/${book.chapters.length}${readMark}`;
    chapterNav.appendChild(label);

    if (nextChapter && isChapterUnlocked(chapterIndex + 1)) {
      const nextBtn = el('button', '');
      nextBtn.textContent = `${nextChapter.title} →`;
      nextBtn.addEventListener('click', () => {
        markChapterRead();
        closeReading();
        setTimeout(() => renderReadingPage(book, nextChapter), 200);
      });
      chapterNav.appendChild(nextBtn);
    }
  }

  // ========== 翻页 ==========

  function goNext() {
    if (currentPage >= totalPages - 1) return;
    currentPage++;
    renderPageContent();
    updateControls();
    if (currentPage === totalPages - 1) markChapterRead();
  }

  function goPrev() {
    if (currentPage <= 0) return;
    currentPage--;
    renderPageContent();
    updateControls();
  }

  // ========== 键盘 ==========

  function onKeyDown(e) {
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'Escape') closeReading();
  }
  document.addEventListener('keydown', onKeyDown);

  // ========== 关闭 ==========

  function closeReading() {
    document.removeEventListener('keydown', onKeyDown);
    overlay.remove();
    renderBookshelfPage();
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeReading();
  });

  // ========== 初始渲染 ==========

  renderPageContent();
  updateControls();
  container.appendChild(overlay);
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
