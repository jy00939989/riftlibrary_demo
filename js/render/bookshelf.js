// 书架页面渲染
import { state, saveState } from '../state.js';
import { BOOKS, CATEGORIES } from '../../data/books.js';
import { t } from '../i18n/terms.js';
import { el, actions, updateStatusBar, getBookTitle, getChapterTitle, getChapterPreview, getChapterContent, getBookAuthorBio, getBookAnecdotes, getBookReviews } from './common.js';
import { playSfx } from '../audio.js';
import { checkTaskCompletion } from '../quests.js';
import { spendInspiration } from '../storage.js';
import { getManuscriptSlots, getManuscriptBoxCount, getManuscriptSlotPrice, expandManuscriptSlots, getBookCapacity, getOwnedBookCount, placeOnShelf } from '../capacity.js';
import { calcCurationEffects } from '../curation.js';
import { getEffectiveCopiedWords } from '../core/book-utils.js';

const SHELF_CAPACITY = 5;
let currentFilter = 'all';
let currentCategory = 'all';
let currentSort = 'default';

// 拖拽状态（模块级，不持久化）
let dragFromShelf = -1;
let dragFromSlot = -1;

const CATEGORY_LABEL_KEYS = {
  '童话': 'categoryFairyTale',
  '寓言': 'categoryFable',
  '小说': 'categoryNovel',
  '诗歌': 'categoryPoetry',
  '戏剧': 'categoryDrama',
  '散文': 'categoryProse',
  '哲学': 'categoryPhilosophy',
  '传记': 'categoryBiography',
  '历史': 'categoryHistory',
  '科学': 'categoryScience',
  '神话': 'categoryMythology',
  '志怪': 'categoryZhiguai',
};

function getCategoryLabel(c) {
  return t(CATEGORY_LABEL_KEYS[c] || c) || c;
}

export function renderBookshelfPage() {
  const container = document.getElementById('page-bookshelf');
  if (!container) return;
  container.innerHTML = '';

  // 自动上架：手稿箱中已完成的书籍写入书架空位
  const mBox = state.manuscriptBox || [];
  if (mBox.length > 0) {
    let changed = false;
    for (let i = mBox.length - 1; i >= 0; i--) {
      const bookId = mBox[i];
      const bs = state.books[bookId];
      if (bs && bs.status === 'completed') {
        if (placeOnShelf(bookId)) {
          mBox.splice(i, 1);
          changed = true;
        } else {
          break; // 书架没空位了
        }
      }
    }
    if (changed) saveState();
  }

  const card = el('div', 'parchment-bg rounded-2xl p-6 magic-glow');
  // 集齐所有已完成且不在手稿箱的书，用于筛选判断可见性
  let allCompletedBooks = Object.values(BOOKS).filter(b =>
    state.books[b.id]?.status === 'completed' && !(state.manuscriptBox || []).includes(b.id)
  );

  // 架上书籍：书架上的所有 bookId 对应的 BOOKS 条目（含未完成但已上架的书）
  const allShelfBookIds = new Set();
  (state.library.shelves || []).forEach(s => {
    if (Array.isArray(s)) s.forEach(id => { if (id) allShelfBookIds.add(id); });
  });
  const allShelfBooks = [...allShelfBookIds].map(id => BOOKS[id]).filter(Boolean);

  // 合并两套书籍用于筛选（架上书籍始终可见）
  const allDisplayBooks = [...allCompletedBooks];
  allShelfBooks.forEach(b => {
    if (!allDisplayBooks.find(x => x.id === b.id)) allDisplayBooks.push(b);
  });

  // 筛选栏
  card.appendChild(renderFilterBar());

  // 应用筛选（只影响可见性，不影响位置）
  const visibleBookIds = new Set(applyFilters(allDisplayBooks).map(b => b.id));

  // 标题栏
  const header = el('div', 'flex items-center justify-between mb-6');
  const shelfCountText = t('bookCount').replace('{n}', allShelfBookIds.size);
  header.innerHTML = `<h2 class="font-display text-xl font-bold">${t('myBookshelf')} <span class="text-sm font-normal text-ink-light">(${shelfCountText})</span></h2>`;
  const n = state.library.shelves.length;
  const price = Math.min(4800, 300 * Math.pow(2, n - 1));
  const buyBtn = el('button', 'px-4 py-2 bg-magic-gold text-white rounded-lg text-sm font-bold shadow hover:shadow-lg transition-all');
  buyBtn.textContent = t('purchaseNewShelf').replace('{price}', price.toLocaleString());
  buyBtn.addEventListener('click', () => {
    actions.buyShelf();
  });
  header.appendChild(buyBtn);
  card.appendChild(header);

  // 手稿箱区域（始终显示，方便随时扩容）
  const mBox2 = state.manuscriptBox || [];
  const mSlots2 = getManuscriptSlots();
  const mCount2 = getManuscriptBoxCount();
  const mPrice2 = getManuscriptSlotPrice();
  const mMaxed2 = mSlots2 >= 20;
  {
    const mSection = el('div', 'mb-6 p-4 rounded-xl border-2 border-dashed border-amber-400/40 bg-amber-50/30');
    const slotsText = t('slotsStatus').replace('{current}', mCount2).replace('{total}', mSlots2);
    mSection.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-display text-sm font-bold text-ink">📦 ${t('manuscriptBox')} <span class="text-xs font-normal text-ink-light">(${slotsText})</span></h3>
        ${mMaxed2
          ? `<span class="text-xs text-magic-gold font-bold">${t('maxSlotsReached').replace('{n}', 20)}</span>`
          : `<button class="m-expand-btn px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold hover:bg-amber-200 transition-all">
              + ${t('expand')} 💰${mPrice2.toLocaleString()}
             </button>`}
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        ${mBox2.map(bookId => {
          const book = BOOKS[bookId];
          const bs = state.books[bookId];
          if (!book || !bs) return '';
          const isCompleted = bs.status === 'completed';
          return `
            <div class="p-3 rounded-lg border ${isCompleted ? 'bg-green-50/60 border-green-300' : 'bg-white/70 border-wood/20'} text-center">
              <div class="text-2xl mb-1">${book.emoji}</div>
              <div class="text-xs font-bold text-ink">${getBookTitle(book)}</div>
              <div class="text-[10px] text-ink-light mt-0.5">
                ${isCompleted ? t('completedPendingShelve') : t('pendingTranscription')}
              </div>
            </div>
          `;
        }).join('')}
        ${Array.from({ length: Math.max(0, mSlots2 - mCount2) }, () => `
          <div class="p-3 rounded-lg border border-dashed border-wood/20 flex items-center justify-center min-h-[80px]">
            <span class="text-wood/20 text-lg">+</span>
          </div>
        `).join('')}
      </div>
    `;

    const mExpandBtn = mSection.querySelector('.m-expand-btn');
    if (mExpandBtn) {
      mExpandBtn.addEventListener('click', () => {
        if (expandManuscriptSlots()) {
          playSfx('buy_success');
          updateStatusBar();
          renderBookshelfPage();
        } else if (mPrice2 > 0) {
          alert(t('insufficientCoinsExclamation'));
        }
      });
    }

    card.appendChild(mSection);
  }

  // 书架网格（按架分组，按位排列 + 拖拽交换）
  // 先算一次旧连携，用于对比
  const oldCuration = calcCurationEffects(state.library.shelves);

  const shelvesContainer = el('div', 'space-y-6');
  const shelves = state.library.shelves || [[null, null, null, null, null]];
  shelves.forEach((shelf, shelfIdx) => {
    if (!Array.isArray(shelf)) return;
    const shelfDiv = el('div', '');
    shelfDiv.innerHTML = `<div class="text-xs text-ink-light mb-2 font-bold">${t('shelfLabel').replace('{n}', shelfIdx + 1)}</div>`;
    const row = el('div', 'grid grid-cols-5 gap-3');

    shelf.forEach((bookId, slotIdx) => {
      // 计算连携光效 class
      let chainClass = '';
      for (const chain of oldCuration.chains) {
        if (chain.shelfIdx === shelfIdx && slotIdx >= chain.startSlot && slotIdx <= chain.endSlot) {
          chainClass = `curation-chain-${chain.length}`;
          break;
        }
      }

      if (bookId) {
        const book = BOOKS[bookId];
        const bs = state.books[bookId];
        if (book && bs && visibleBookIds.has(bookId)) {
          const cardDiv = el('div', `curation-slot ${chainClass}`);
          cardDiv.setAttribute('data-shelf-idx', shelfIdx);
          cardDiv.setAttribute('data-slot-idx', slotIdx);
          cardDiv.setAttribute('draggable', 'true');
          cardDiv.addEventListener('dragstart', (e) => {
            dragFromShelf = shelfIdx;
            dragFromSlot = slotIdx;
            e.dataTransfer.effectAllowed = 'move';
            e.target.classList.add('dragging');
          });
          cardDiv.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
            dragFromShelf = -1;
            dragFromSlot = -1;
          });
          cardDiv.addEventListener('dragover', (e) => { e.preventDefault(); });
          cardDiv.addEventListener('drop', handleDrop);
          cardDiv.appendChild(renderBookCard(book));
          row.appendChild(cardDiv);
        } else {
          const dim = el('div', `curation-slot min-h-[200px] p-3 border border-dashed border-wood/10 rounded-lg flex items-center justify-center opacity-20 ${chainClass}`);
          dim.setAttribute('data-shelf-idx', shelfIdx);
          dim.setAttribute('data-slot-idx', slotIdx);
          dim.innerHTML = '<span class="text-wood/20 text-lg">·</span>';
          row.appendChild(dim);
        }
      } else {
        const empty = el('div', `curation-slot min-h-[200px] p-3 border-2 border-dashed border-wood/30 rounded-lg flex items-center justify-center ${chainClass}`);
        empty.setAttribute('data-shelf-idx', shelfIdx);
        empty.setAttribute('data-slot-idx', slotIdx);
        empty.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.currentTarget.classList.add('drag-over');
        });
        empty.addEventListener('dragleave', (e) => {
          e.currentTarget.classList.remove('drag-over');
        });
        empty.addEventListener('drop', handleDrop);
        empty.innerHTML = '<span class="text-wood/30 text-2xl">+</span>';
        row.appendChild(empty);
      }
    });

    shelfDiv.appendChild(row);
    shelvesContainer.appendChild(shelfDiv);
  });
  card.appendChild(shelvesContainer);
  container.appendChild(card);
}

// ========== 拖拽处理 ==========

function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');

  const toShelf = parseInt(e.currentTarget.dataset.shelfIdx);
  const toSlot = parseInt(e.currentTarget.dataset.slotIdx);

  if (dragFromShelf < 0 || dragFromSlot < 0) return;
  if (dragFromShelf === toShelf && dragFromSlot === toSlot) return;

  // 旧连携快照
  const oldEffects = calcCurationEffects(state.library.shelves);

  // 交换
  const shelves = state.library.shelves;
  const tmp = shelves[dragFromShelf][dragFromSlot];
  shelves[dragFromShelf][dragFromSlot] = shelves[toShelf][toSlot];
  shelves[toShelf][toSlot] = tmp;

  saveState();

  // 检测新连携
  const newEffects = calcCurationEffects(shelves);
  const oldIds = new Set(oldEffects.chains.map(c => `${c.type}:${c.shelfIdx}:${c.startSlot}`));
  const newChains = newEffects.chains.filter(c => !oldIds.has(`${c.type}:${c.shelfIdx}:${c.startSlot}`));
  const oldPairIds = new Set(oldEffects.pairs.map(p => p.pairId));
  const newPairs = newEffects.pairs.filter(p => !oldPairIds.has(p.pairId));

  // Toast 通知
  const toasts = [];
  for (const chain of newChains) {
    const typeLabel = chain.type === 'category' ? t('categoryResonance') : t('eraResonance');
    const tierLabel = chain.length >= 5 ? t('resonanceTierPerfect') : chain.length >= 4 ? t('resonanceTierLarge') : t('resonanceTierSmall');
    toasts.push(`✦ ${typeLabel}：${chain.value} ×${chain.length}「${tierLabel}」`);
  }
  for (const pair of newPairs) {
    toasts.push(`🔗 ${t('authorDialogue')}：${pair.name}`);
    // 首次触发墨墨点评
    if (pair.momoComment) {
      toasts.push(`🦉 ${t('momo')}：${pair.momoComment}`);
    }
  }

  if (toasts.length > 0) {
    showCurationToast(toasts.join('\n'));
  }

  renderBookshelfPage();
}

function showCurationToast(message) {
  const existing = document.querySelector('.curation-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'curation-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

function renderFilterBar() {
  const bar = el('div', 'flex flex-wrap items-center gap-2 mb-4');

  const tabs = [
    { id: 'all', label: t('all') },
    { id: 'starred', label: t('starred') }
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
  select.innerHTML = `<option value="all">${t('allCategories')}</option>${CATEGORIES.map(c => `<option value="${c}" ${currentCategory === c ? 'selected' : ''}>${getCategoryLabel(c)}</option>`).join('')}`;
  select.addEventListener('change', () => {
    currentCategory = select.value;
    renderBookshelfPage();
  });
  bar.appendChild(select);

  // 排序按钮
  const sortBtn = el('button', 'px-3 py-1 rounded-full text-xs font-bold bg-wood/10 text-ink-light hover:bg-wood/20');
  const labels = { 'default': t('sortDefault'), 'words-asc': t('sortWordsAsc'), 'words-desc': t('sortWordsDesc') };
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
  const effectiveWords = getEffectiveCopiedWords(bookState, book.totalWords);
  const progress = book.totalWords > 0 ? Math.round((effectiveWords / book.totalWords) * 100) : 0;
  const masteryNames = ['', t('masteryName1'), t('masteryName2'), t('masteryName3'), t('masteryName4'), t('masteryName5')];
  const masteryName = masteryNames[bookState.masteryLevel] || '';
  const isCompleted = bookState.status === 'completed';
  const isCopying = bookState.status === 'copying' || (bookState.copiedWords > 0 && !isCompleted);
  const isUnstarted = !isCompleted && !isCopying;
  const isJustCompleted = isCompleted && effectiveWords === 0;
  const displayProgress = isJustCompleted ? 100 : progress;
  const starIcon = bookState.starred ? '⭐' : '☆';
  const coverSrc = book.cover || null;
  const hasCover = !!coverSrc;
  const cardDiv = el('div', `book-spine ${isCompleted ? 'completed' : isCopying ? 'copying' : 'unstarted'} flex flex-col`);

  cardDiv.innerHTML = `
    <button class="star-btn absolute top-1.5 right-1.5 text-sm w-7 h-7 flex items-center justify-center rounded-full bg-white/60 hover:bg-white z-10 transition-all" data-book-id="${book.id}">${starIcon}</button>

    <!-- 封面区：按 2:3 比例显示，匹配 512x768 封面图 -->
    <div class="book-cover relative aspect-[2/3] overflow-hidden rounded-t-lg flex items-center justify-center">
      <div class="cover-fallback flex flex-col items-center justify-center w-full h-full p-4 ${hasCover ? 'hidden' : ''}">
        <div class="text-5xl mb-2 drop-shadow-sm">${book.emoji}</div>
        <div class="font-bold text-sm text-center text-ink leading-tight px-1">${getBookTitle(book)}</div>
        <div class="text-[10px] text-ink-light/60 mt-1">${book.author}</div>
      </div>
      ${hasCover
        ? `<img src="${coverSrc}" alt="${getBookTitle(book)}" class="absolute inset-0 w-full h-full object-cover"
             onerror="this.style.display='none'; this.parentElement.querySelector('.cover-fallback').classList.remove('hidden');">`
        : ''}
      ${isCompleted ? '<div class="absolute top-2 left-2 text-xs z-10">🏆</div>' : ''}
    </div>

    <!-- 书脊信息区 -->
    <div class="bg-white/80 px-3 py-2.5 border-t border-wood/10">
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-[10px] text-ink-light">${t('wordsCount').replace('{n}', book.totalWords.toLocaleString())}</span>
        ${masteryName ? `<span class="text-[10px] font-bold text-magic-gold">✦ ${masteryName}</span>` : ''}
        ${isUnstarted ? `<span class="text-[10px] text-ink-light/50">${t('clickToStart')}</span>` : ''}
      </div>
      <div class="h-2 bg-wood/10 rounded-full overflow-hidden">
        <div class="h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-magic-gold' : 'bg-magic-blue'}" style="width:${Math.min(100, displayProgress)}%"></div>
      </div>
      <div class="text-[10px] text-ink-light/60 mt-1">
        ${isCompleted ? `${t('completed')} ✓` : isCopying ? `${t('copying')} ${progress}%` : t('pendingTranscription')}
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

  // 重抄灵感费用：固定 2 灵感一次
  const getReCopyCost = () => 2;

  const isCompleted = bookState.status === 'completed';
  const needReCopy = isCompleted && !bookState.reCopyUnlocked && !book.noMastery;

  content.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-display text-xl font-bold">${book.emoji} ${getBookTitle(book)}</h2>
      <button class="text-2xl text-ink-light hover:text-ink close-modal">✕</button>
    </div>
    <div class="text-sm text-ink-light mb-1">${book.author} · ${getCategoryLabel(book.category)} · ${t('wordsCount').replace('{n}', book.totalWords.toLocaleString())}</div>
    ${isCompleted ? `<div class="text-xs text-magic-gold mb-2">${t('masteryLevelLabel').replace('{level}', bookState.masteryLevel).replace('{count}', bookState.copyCount)}</div>` : ''}
    ${needReCopy
      ? `<button id="re-copy-btn" class="w-full px-4 py-2 mb-4 bg-purple-600 text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all">${t('reCopyCost').replace('{cost}', getReCopyCost())}</button>
         <div class="text-center text-xs text-ink-light mb-3">${t('currentInspiration').replace('{n}', state.inspiration || 0)}</div>`
      : `<button id="start-copy-btn" class="w-full px-4 py-2 mb-4 bg-magic-gold text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all">${t('startTranscribeThisBook')}</button>`
    }
    <div class="space-y-2">
      ${book.chapters.map((ch, i) => {
        const unlocked = bookState.unlockedChapters.includes(i + 1);
        const isRead = bookState.readChapters && bookState.readChapters.includes(i);
        return `
          <div class="chapter-item p-3 rounded-lg border ${unlocked ? 'bg-white border-wood cursor-pointer hover:shadow' : 'bg-gray-100 border-gray-200 opacity-60'}">
            <div class="flex items-center justify-between">
              <div class="font-bold text-sm">${isRead ? '✓ ' : ''}${getChapterTitle(ch)}</div>
              <div class="text-xs ${unlocked ? (isRead ? 'text-magic-gold' : 'text-green-600') : 'text-gray-500'}">
                ${unlocked ? (isRead ? `📖 ${t('statusRead')}` : `🔓 ${t('statusUnlocked')}`) : `🔒 ${t('needTranscribeWords').replace('{words}', ch.unlockAt.toLocaleString())}`}
              </div>
            </div>
            ${unlocked ? `<div class="text-xs text-ink-light mt-1">${getChapterPreview(ch)}</div>` : ''}
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
  const startBtn = content.querySelector('#start-copy-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      state.currentSession.bookId = book.id;
      modal.remove();
      document.getElementById('tab-focus').click();
    });
  }

  // 灵感重抄按钮
  const reCopyBtn = content.querySelector('#re-copy-btn');
  if (reCopyBtn) {
    reCopyBtn.addEventListener('click', () => {
      const cost = getReCopyCost();
      if (!spendInspiration(cost)) {
        alert(t('insufficientInspiration').replace('{cost}', cost).replace('{current}', state.inspiration || 0));
        return;
      }
      bookState.reCopyUnlocked = true;
      saveState();
      modal.remove();
      state.currentSession.bookId = book.id;
      document.getElementById('tab-focus').click();
    });
  }

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

  const chapterContent = getChapterContent(chapter);
  // 分页：按 ---page--- 切分，无标记则全文为 1 页
  const rawPages = chapterContent.split('---page---').map(p => p.trim()).filter(p => p);
  const pages = rawPages.length > 0 ? rawPages : [chapterContent.trim()];
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
    <h2 class="font-display text-lg font-bold" style="color:#c9a227">${book.emoji} ${getBookTitle(book)}</h2>
    <p class="text-xs mt-1" style="color:rgba(245,230,200,0.5)">${getChapterTitle(chapter)}</p>
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
    pageIndicator.textContent = t('pageIndicator').replace('{current}', currentPage + 1).replace('{total}', totalPages);
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
      prevBtn.textContent = `← ${getChapterTitle(prevChapter)}`;
      prevBtn.addEventListener('click', () => {
        markChapterRead();
        closeReading();
        setTimeout(() => renderReadingPage(book, prevChapter), 200);
      });
      chapterNav.appendChild(prevBtn);
    }

    const label = el('span', 'reading-chapter-label');
    const readMark = bookState.readChapters.includes(chapterIndex) ? ` ✓${t('statusRead')}` : '';
    label.textContent = `${chapterIndex + 1}/${book.chapters.length}${readMark}`;
    chapterNav.appendChild(label);

    if (nextChapter && isChapterUnlocked(chapterIndex + 1)) {
      const nextBtn = el('button', '');
      nextBtn.textContent = `${getChapterTitle(nextChapter)} →`;
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

  const titles = ['', t('masteryName1'), t('masteryName2'), t('masteryName3'), t('masteryName4'), t('masteryName5')];
  const contents = [
    null,
    t('bookShelvedAvailable'),
    getBookAuthorBio(book) || t('authorBioMissing'),
    getBookAnecdotes(book) || t('anecdotesMissing'),
    getBookReviews(book) || t('reviewsMissing'),
    t('collectorCoverEffect').replace('{cover}', book.collectorCover || '🌟')
  ];

  const modal = el('div', 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4');
  const content = el('div', `parchment-bg rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto magic-glow ${level >= 5 ? 'animate-glow' : ''}`);

  content.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-display text-xl font-bold">${book.emoji} ${getBookTitle(book)} · ${t('collectorArchive')}</h2>
      <button class="text-2xl text-ink-light hover:text-ink close-modal">✕</button>
    </div>
    <div class="text-sm text-ink-light mb-4">${book.author} · ${getCategoryLabel(book.category)} · ${t('totalCopies').replace('{n}', bookState.copyCount)}</div>
    <div class="space-y-3 mb-4">
      ${[1,2,3,4,5].map(lv => {
        const unlocked = lv <= level;
        return `
          <div class="p-3 rounded-lg border ${unlocked ? 'bg-white border-magic-gold/30' : 'bg-gray-100 border-gray-200 opacity-50'}">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm">${unlocked ? '🔓' : '🔒'}</span>
              <span class="font-bold text-sm">Lv${lv} · ${titles[lv]}</span>
              ${lv === level ? `<span class="text-xs text-magic-gold font-bold">${t('currentLabel')}</span>` : ''}
            </div>
            <p class="text-xs text-ink-light ml-6">${unlocked ? contents[lv] : t('unlockAfterCopies').replace('{n}', lv - level)}</p>
          </div>
        `;
      }).join('')}
    </div>
    <button class="read-chapters-btn w-full mt-4 px-4 py-2 bg-magic-gold text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all">${t('readChapters')}</button>
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
