// 书架页面渲染
import { state } from '../state.js';
import { BOOKS, CATEGORIES } from '../../data/books.js';
import { t } from '../i18n/terms.js';
import { el, actions, updateStatusBar, getBookTitle, getChapterTitle, getChapterPreview, getChapterContent, getBookAuthorBio, getBookAnecdotes, getBookReviews } from './common.js';
import { playSfx } from '../audio.js';
import { cleanBookDust } from '../core/disasters.js';
import { checkTaskCompletion } from '../quests.js';
import { getManuscriptSlots, getManuscriptBoxCount, getManuscriptSlotPrice, expandManuscriptSlots, getBookCapacity, getOwnedBookCount, getServicingSlots, storeInRestorationBox, removeFromRestorationBox, getRestorationBoxSlots, getRestorationBoxCount, getRestorationSlotPrice, expandRestorationBoxSlots, getRestorationLevel, getRestorationUpgradePrice, upgradeRestorationLevel, getRestorationRepairSpeedBonus, isRestorationUnlocked, grantRestorationRoom, getMaintenanceBatchCap, getServicingSlotPrice, expandServicingSlots } from '../capacity.js';
import { calcCurationEffects } from '../curation.js';
import { getEffectiveCopiedWords, getRepairProgress } from '../core/book-utils.js';
import { isNoMasteryBook } from '../core/book-eligibility.js';
import { setFocusBook } from '../core/focus-session.js';
import { unlockReCopy, toggleBookStar, markChapterRead } from '../core/book-progress.js';
import { autoShelveCompletedManuscripts, swapShelfSlots } from '../core/library.js';
import { getBookCondition, getDamageChance, isBookLentOut } from '../visitors.js';
import { getReadableChapters, isVolumeDivider, canCollectVolumeGroup, collectVolumeGroup } from '../volumes.js';
import { canMarkServicing, markServicing, cancelServicing, returnToShelf, getAwaitingShelfReturnBooks, getServicingUsed } from '../core/servicing.js';
import { getMaintainableBooks, startMaintenanceSession, startMaintenanceFocus, cancelMaintenanceSession, getMaintenanceSessionTotal } from '../core/maintenance.js';
import { getFacilityLevelCap, getFacilityRequiredStage } from '../../data/atmosphere.js';
import { VOLUME_GROUPS, getVolumeGroupProgress } from '../../data/volume_groups.js';
import { dispatchTutorialUI } from './tutorial-ui.js';
import { checkAndShowTutorial } from '../tutorial.js';
import { checkAchievements } from '../achievements.js';
import { showAchievementToast } from './achievements.js';

// 2026-10-27 图南拍板：古籍修复室迁入大书库——书架页改子标签制（📚 藏书格 / 📜 古籍修复室）
let bsSubTab = 'shelf';

// 供外部调用切换大书库子标签（卷组集齐自动跳转等；window.switchTab 由 app.js 挂载）
window.switchBookshelfSubTab = function(name) {
  bsSubTab = name;
  if (window.switchTab) window.switchTab('bookshelf');
  else renderBookshelfPage();
};

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

function tryUnlockReCopy(book) {
  const result = unlockReCopy(book.id);
  if (!result.ok) {
    if (result.reason === 'insufficient_inspiration') {
      window.showToast(t('insufficientInspiration').replace('{cost}', 1).replace('{current}', state.inspiration || 0), 'error');
    }
    return false;
  }
  playSfx('buy_success');
  window.showToast(t('reCopyUnlockedToast'), 'success');
  return true;
}

export function renderBookshelfPage() {
  const container = document.getElementById('page-bookshelf');
  if (!container) return;
  container.innerHTML = '';

  // 子标签导航（2026-10-27 图南：古籍修复室迁入大书库）
  const nav = el('div', 'flex border-b-2 border-wood/20 bg-wood/5 overflow-x-auto flex-nowrap');
  nav.innerHTML = `
    <button data-bs-subtab="shelf" class="subtab-btn flex-shrink-0 px-3 sm:px-5 py-3 text-sm font-bold transition-all
      ${bsSubTab === 'shelf' ? 'bg-white text-magic-gold border-b-2 border-magic-gold -mb-0.5' : 'text-ink-light hover:text-ink hover:bg-white/50'}">
      📚 ${t('bookshelfSubtabShelf')}
    </button>
    <button data-bs-subtab="restoration" class="subtab-btn flex-shrink-0 px-3 sm:px-5 py-3 text-sm font-bold transition-all
      ${bsSubTab === 'restoration' ? 'bg-white text-magic-gold border-b-2 border-magic-gold -mb-0.5' : 'text-ink-light hover:text-ink hover:bg-white/50'}">
      📜 ${t('restorationRoom')}
    </button>`;
  nav.querySelectorAll('.subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => { bsSubTab = btn.dataset.bsSubtab; renderBookshelfPage(); });
  });
  container.appendChild(nav);

  const page = el('div', '');
  container.appendChild(page);
  if (bsSubTab === 'restoration') { renderRestorationTab(page); return; }
  renderShelfTab(page);
}

// 大书库 · 藏书格子标签（原 renderBookshelfPage 主体，2026-10-27 迁入子标签结构）
function renderShelfTab(container) {
  // 自动上架：手稿箱中已完成的书籍写入书架空位
  autoShelveCompletedManuscripts();

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
          // 受灾降档的书优先显示损坏标识：否则 copying+damaged 会被读成「又多一本未抄的」
          // （2026-10-10 绿野仙踪手稿箱误会事件）
          const isDamaged = !!bs.damaged;
          const statusText = isDamaged
            ? `🩹 ${t('damagedPendingRepair')}`
            : (isCompleted ? t('completedPendingShelve') : t('pendingTranscription'));
          const statusClass = isDamaged ? 'text-red-500 font-bold' : 'text-ink-light';
          return `
            <div class="p-3 rounded-lg border ${isCompleted && !isDamaged ? 'bg-green-50/60 border-green-300' : 'bg-white/70 border-wood/20'} text-center">
              <div class="text-2xl mb-1">${book.emoji}</div>
              <div class="text-xs font-bold text-ink">${getBookTitle(book)}</div>
              <div class="text-[10px] ${statusClass} mt-0.5">
                ${statusText}
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
          window.showToast(t('insufficientCoinsExclamation'), 'error');
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
  if (!swapShelfSlots(dragFromShelf, dragFromSlot, toShelf, toSlot)) return;

  // 检测新连携
  const newEffects = calcCurationEffects(state.library.shelves);
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

// 书况（Phase 3 借还链）：磨损档位（2026-09-30 「磨损」改名「微旧」，与损毁状态消歧）+ 该书磨损加权后的还书损毁率
function renderBookCondition(bookId) {
  const bs = state.books[bookId];
  if (!bs) return '';
  const wear = bs.wearCount || 0;
  const condKey = getBookCondition(wear);
  const condClass = {
    pristine: 'text-green-600', good: 'text-green-600',
    worn: 'text-amber-600', fragile: 'text-orange-600', critical: 'text-red-500'
  }[condKey];
  const dmg = (getDamageChance(state.library.borrowLevel || 0, (state.signboards || []).includes('care_for_books'), wear) * 100).toFixed(1);
  // §4.3：wearCount 具体数字让玩家看见寄读的隐性账
  const wearNote = wear > 0 ? ` · ${t('wearCountN').replace('{n}', wear)} · ${t('wearDamageRate').replace('{rate}', dmg)}` : '';
  // 保养保护期徽记（2026-10-26 图南拍板）
  const shieldNote = (bs.damageShield || 0) > 0 ? ` · 🛡${t('damageShieldBadge').replace('{n}', bs.damageShield)}` : '';
  return `<div class="text-[10px] mt-1 ${condClass}">📖 ${t('bookConditionLabel')}:${t('condition_' + condKey)}${wearNote}${shieldNote}</div>`;
}

// 保养预约控制（servicing-room-plan v3）：书卡开关 + 待回架按钮
function renderServicingControl(book, bookState, isLentOut) {
  const servicing = bookState.servicing;
  // 已保养待回架（§五.4）：手动回架（决策 ③）
  if (servicing === 'locked' && (bookState.wearCount || 0) <= 0) {
    return `<button class="servicing-shelf-btn w-full mt-2 px-2 py-1.5 bg-teal-50 border border-teal-300 rounded-lg text-[10px] font-bold hover:shadow transition-all">
      <div class="text-teal-600">✨ ${t('servicingAwaitingShelf')}</div>
      <div class="text-teal-500 text-[9px]">👉 ${t('servicingReturnToShelf')}</div>
    </button>`;
  }
  if (servicing === 'locked') {
    return `<button class="servicing-toggle-btn w-full mt-2 px-2 py-1.5 bg-amber-50 border border-amber-300 rounded-lg text-[10px] font-bold hover:shadow transition-all">
      <div class="text-amber-600">🔒 ${t('servicingLockedBadge')}</div>
      <div class="text-amber-500/80 text-[9px]">${t('servicingCancel')}</div>
    </button>`;
  }
  const chk = canMarkServicing(book.id);
  if (!chk.ok || (bookState.wearCount || 0) <= 0) return '';
  if (servicing === 'pending') {
    return `<button class="servicing-toggle-btn w-full mt-2 px-2 py-1.5 bg-sky-50 border border-sky-300 rounded-lg text-[10px] font-bold hover:shadow transition-all">
      <div class="text-sky-600">📅 ${t('servicingPendingBadge')}</div>
      <div class="text-sky-500/80 text-[9px]">${t('servicingCancel')}</div>
    </button>`;
  }
  return `<button class="servicing-toggle-btn w-full mt-2 px-2 py-1.5 bg-white border border-amber-300 text-amber-700 rounded-lg text-[10px] font-bold hover:shadow transition-all">
    <div>${t('servicingReserveBtn')}</div>
    ${isLentOut ? `<div class="text-[9px] text-ink-light/70 font-normal">${t('servicingLentHint')}</div>` : ''}
  </button>`;
}

function renderBookCard(book) {
  const bookState = state.books[book.id];
  const effectiveWords = getEffectiveCopiedWords(bookState, book.totalWords);
  const progress = book.totalWords > 0 ? Math.round((effectiveWords / book.totalWords) * 100) : 0;
  // 2026-09-30 图南拍板：书卡不显示 在架/精通/大师/典藏 等等级文案——典藏版只用左上角 🏆 小图标表示
  const isCollectorEdition = (bookState.masteryLevel || 0) >= 2;
  const isCompleted = bookState.status === 'completed';
  const isLentOut = isCompleted && isBookLentOut(book.id); // 借出中的书优先显示「已借出」
  const isCopying = bookState.status === 'copying' || (bookState.copiedWords > 0 && !isCompleted);
  const isUnstarted = !isCompleted && !isCopying;
  const isJustCompleted = isCompleted && effectiveWords === 0;
  // 损坏标识：书卡必须能看出"这本坏了且能去修"（此前损坏书与普通在抄书无差别，玩家找不到修复入口）
  const isDamaged = !!bookState.damaged;
  const repairInfo = isDamaged ? getRepairProgress(bookState) : null;
  const displayProgress = isJustCompleted ? 100 : progress;
  const starIcon = bookState.starred ? '⭐' : '☆';
  const coverSrc = book.cover || null;
  const hasCover = !!coverSrc;
  const cardDiv = el('div', `book-spine ${isCompleted ? 'completed' : isCopying ? 'copying' : 'unstarted'} flex flex-col${!isNoMasteryBook(book.id) && (bookState.masteryLevel || 0) >= 2 ? ' mastered' : ''}`);

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
      ${isCollectorEdition && !isDamaged ? '<div class="absolute top-2 left-2 text-xs z-10">🏆</div>' : ''}
      ${isDamaged ? '<div class="absolute top-2 left-2 text-xs z-10">🩹</div>' : ''}
    </div>

    <!-- 书脊信息区 -->
    <div class="bg-white/80 px-3 py-2.5 border-t border-wood/10">
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-[10px] text-ink-light">${t('wordsCount').replace('{n}', book.totalWords.toLocaleString())}</span>
        ${isUnstarted ? `<span class="text-[10px] text-ink-light/50">${t('clickToStart')}</span>` : ''}
      </div>
      <div class="h-2 bg-wood/10 rounded-full overflow-hidden">
        <div class="h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-magic-gold' : 'bg-magic-blue'}" style="width:${Math.min(100, displayProgress)}%"></div>
      </div>
      <div class="text-[10px] text-ink-light/60 mt-1">
        ${isLentOut ? t('borrowed') : isCompleted ? `${t('completed')} ✓` : isCopying ? `${t('copying')} ${progress}%` : t('pendingTranscription')}
      </div>
      ${isDamaged ? `
        <div class="mt-2 rounded-lg bg-red-50 border border-red-300 px-2 py-1.5 text-center">
          <div class="text-[10px] text-red-500 font-bold mb-1">${repairInfo ? t('repairing').replace('{pct}', repairInfo.pct) : `🩹 ${t('damaged')}`}</div>
          <button class="repair-card-btn w-full px-2 py-1 bg-red-400/90 text-white rounded text-[10px] font-bold hover:shadow transition-all">${t('goRepair')}</button>
        </div>` : ''}
      ${isCompleted && !book.indestructible ? renderBookCondition(book.id) : ''}
      ${isCompleted ? renderServicingControl(book, bookState, isLentOut) : ''}
      ${isCompleted && bookState.dustyAt ? `
        <div class="mt-2 rounded-lg bg-stone-100 border border-stone-300 px-2 py-1.5 text-center">
          <div class="text-[10px] text-stone-500 font-bold mb-1">🌫️ ${t('dustyBadge')}</div>
          <button class="dust-clean-btn w-full px-2 py-1 bg-wood/80 text-white rounded text-[10px] font-bold hover:shadow transition-all">${t('dustCleanBtn')}</button>
        </div>` : ''}
      ${isCompleted && bookState.stolenAt ? `
        <div class="mt-2 rounded-lg bg-ink/80 px-2 py-1.5 text-center">
          <div class="text-[10px] text-amber-200 font-bold">🥷 ${t('stolenBadge').replace('{days}', Math.max(0, Math.ceil((bookState.stolenReturnAt - Date.now()) / 86400000)))}</div>
        </div>` : ''}
      ${isCompleted && !bookState.reCopyUnlocked && !bookState.servicing && !isNoMasteryBook(book.id)
        ? `<button class="re-copy-card-btn w-full mt-2 px-3 py-1.5 bg-purple-600/90 text-white rounded-lg text-[10px] font-bold hover:shadow-lg transition-all flex items-center justify-center gap-1">
             ${t('unlockReCopyCost').replace('{cost}', 1)}
           </button>`
        : ''}
    </div>
  `;

  // 星标点击
  const starBtn = cardDiv.querySelector('.star-btn');
  starBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleBookStar(book.id);
    renderBookshelfPage();
  });

  // 卡片上直接解锁重抄
  const reCopyCardBtn = cardDiv.querySelector('.re-copy-card-btn');
  if (reCopyCardBtn) {
    reCopyCardBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (tryUnlockReCopy(book)) {
        renderBookshelfPage();
      }
    });
  }

  // 掸灰（book-damage-events 批次二：积灰书恢复可借）
  const dustCleanBtn = cardDiv.querySelector('.dust-clean-btn');
  if (dustCleanBtn) {
    dustCleanBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (cleanBookDust(book.id)) {
        playSfx('button_click');
        if (window.showToast) window.showToast(t('dustCleanedToast'), 'success');
        renderBookshelfPage();
      }
    });
  }

  // 去修复：设为专注书并跳专注页（专注誊抄即修复）
  const repairCardBtn = cardDiv.querySelector('.repair-card-btn');
  if (repairCardBtn) {
    repairCardBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setFocusBook(book.id);
      document.getElementById('tab-focus').click();
    });
  }

  // 保养预约开关 / 待回架（servicing-room-plan v3）
  const servicingToggleBtn = cardDiv.querySelector('.servicing-toggle-btn');
  if (servicingToggleBtn) {
    servicingToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (bookState.servicing) {
        if (cancelServicing(book.id)) { playSfx('button_click'); renderBookshelfPage(); }
      } else {
        const res = markServicing(book.id, { lent: isBookLentOut(book.id) });
        if (res.ok) {
          playSfx('buy_success');
          if (window.showToast) window.showToast(t('servicingMarkedToast'), 'success');
        } else if (res.reason === 'full' && window.showToast) {
          window.showToast(t('servicingFullToast').replace('{n}', String(getServicingSlots())), 'error');
        }
        renderBookshelfPage();
      }
    });
  }
  const servicingShelfBtn = cardDiv.querySelector('.servicing-shelf-btn');
  if (servicingShelfBtn) {
    servicingShelfBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (returnToShelf(book.id)) {
        playSfx('button_click');
        if (window.showToast) window.showToast(t('servicingReturnedToast').replace('{title}', getBookTitle(book)), 'success');
        renderBookshelfPage();
      }
    });
  }

  // 整卡点击
  cardDiv.addEventListener('click', (e) => {
    if (e.target.classList.contains('star-btn')) return;
    if (e.target.classList.contains('re-copy-card-btn')) return;
    if (e.target.classList.contains('repair-card-btn')) return;
    if (isCompleted && bookState.masteryLevel >= 1 && !isNoMasteryBook(book.id)) {
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

  // 重抄灵感费用：1 灵感一次
  const getReCopyCost = () => 1;

  const isCompleted = bookState.status === 'completed';
  const needReCopy = isCompleted && !bookState.reCopyUnlocked && !isNoMasteryBook(book.id);
  // 2026-09-15 图南拍板：典藏版/分卷书不参与重抄——已完成时「开始誊抄」是重抄的伪装入口，置灰并说明
  const noMasteryCompleted = isCompleted && isNoMasteryBook(book.id);

  // 章节列表：典藏版从卷组单卷拼合（其 def chapters 为空），卷间插分隔条；
  // 全卷合璧即全章节解锁。章号按真实章节全局连续编号（分隔条不占号）。
  const chapters = getReadableChapters(book);
  const isChapterUnlocked = (i) => book.isCollectedEdition || bookState.unlockedChapters.includes(i + 1);
  const realChapters = chapters.filter(ch => !isVolumeDivider(ch));

  content.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-display text-xl font-bold">${book.emoji} ${getBookTitle(book)}</h2>
      <button class="text-2xl text-ink-light hover:text-ink close-modal">✕</button>
    </div>
    <div class="text-sm text-ink-light mb-1">${book.author} · ${getCategoryLabel(book.category)} · ${t('wordsCount').replace('{n}', book.totalWords.toLocaleString())}</div>
    ${(() => {
      const ded = (state.bookDedications || {})[book.id];
      if (!ded) return '';
      const d = new Date(ded.date);
      const dateStr = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
      return `<div class="my-2 p-2.5 bg-magic-gold/10 rounded-lg border border-magic-gold/30">
        <div class="text-xs font-bold text-magic-gold">📜 ${ded.charEmoji} ${ded.charName} 题赠 · ${dateStr}</div>
        <div class="text-xs text-ink-light mt-0.5 italic">「这本书你早已有了。那就在这一页留个名字吧。」</div>
      </div>`;
    })()}
    ${isCompleted
      ? (isNoMasteryBook(book.id)
        ? `<div class="text-xs text-magic-gold mb-2">${t('noMasteryCompletedLabel')}</div>`
        : `<div class="text-xs text-magic-gold mb-2">${t('masteryLevelLabel').replace('{level}', bookState.masteryLevel).replace('{count}', bookState.copyCount)}</div>`)
      : ''}
    ${needReCopy
      ? `<button id="re-copy-btn" class="w-full px-4 py-2 mb-4 bg-purple-600 text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all">${t('reCopyCost').replace('{cost}', getReCopyCost())}</button>
         <div class="text-center text-xs text-ink-light mb-3">${t('currentInspiration').replace('{n}', state.inspiration || 0)}</div>`
      : noMasteryCompleted
        ? `<button disabled class="w-full px-4 py-2 mb-2 bg-gray-200 text-gray-400 rounded-lg font-bold text-sm cursor-not-allowed">${t('recopyUnavailable')}</button>
           <div class="text-center text-xs text-ink-light mb-3">${t('collectorNoRecopyHint')}</div>`
        : `<button id="start-copy-btn" class="w-full px-4 py-2 mb-4 bg-magic-gold text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all">${t('startTranscribeThisBook')}</button>`
    }
    <div class="space-y-2">
      ${(() => {
        let realIdx = -1;
        return chapters.map((ch) => {
          if (isVolumeDivider(ch)) {
            return `<div class="flex items-center gap-2 py-1 px-1 text-xs text-magic-gold font-bold"><span class="flex-1 border-t border-magic-gold/30"></span>${ch.volumeTitle}<span class="flex-1 border-t border-magic-gold/30"></span></div>`;
          }
          realIdx += 1;
          const i = realIdx;
          const unlocked = isChapterUnlocked(i);
          const isRead = bookState.readChapters && bookState.readChapters.includes(i);
          return `
          <div class="chapter-item p-3 rounded-lg border ${unlocked ? 'bg-white border-wood cursor-pointer hover:shadow' : 'bg-gray-100 border-gray-200 opacity-60'}" data-ch-idx="${i}">
            <div class="flex items-center justify-between">
              <div class="font-bold text-sm">${isRead ? '✓ ' : ''}${book.isCollectedEdition ? `${i + 1}. ` : ''}${getChapterTitle(ch)}</div>
              <div class="text-xs ${unlocked ? (isRead ? 'text-magic-gold' : 'text-green-600') : 'text-gray-500'}">
                ${unlocked ? (isRead ? `📖 ${t('statusRead')}` : `🔓 ${t('statusUnlocked')}`) : `🔒 ${t('needTranscribeWords').replace('{words}', ch.unlockAt.toLocaleString())}`}
              </div>
            </div>
            ${unlocked ? `<div class="text-xs text-ink-light mt-1">${getChapterPreview(ch)}</div>` : ''}
          </div>
        `;
        }).join('');
      })()}
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
      setFocusBook(book.id);
      modal.remove();
      document.getElementById('tab-focus').click();
    });
  }

  // 灵感重抄按钮
  const reCopyBtn = content.querySelector('#re-copy-btn');
  if (reCopyBtn) {
    reCopyBtn.addEventListener('click', () => {
      if (tryUnlockReCopy(book)) {
        modal.remove();
        setFocusBook(book.id);
        document.getElementById('tab-focus').click();
      }
    });
  }

  // 章节点击进入阅读（data-ch-idx = 全局连续章号-1，分隔条不占号、不可点击）
  content.querySelectorAll('.chapter-item.cursor-pointer').forEach((item) => {
    item.addEventListener('click', () => {
      const ch = realChapters[Number(item.dataset.chIdx)];
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

  const chapters = getReadableChapters(book);
  // 章号/导航按真实章节全局连续编号，卷分隔条不占号、不参与导航
  const realChapters = chapters.filter(ch => !isVolumeDivider(ch));
  const chapterIndex = realChapters.indexOf(chapter);
  const prevChapter = chapterIndex > 0 ? realChapters[chapterIndex - 1] : null;
  const nextChapter = chapterIndex < realChapters.length - 1 ? realChapters[chapterIndex + 1] : null;

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
    return book.isCollectedEdition || bookState.unlockedChapters.includes(idx + 1);
  }

  function onChapterRead() {
    if (markChapterRead(book.id, chapterIndex)) {
      checkTaskCompletion('chapter_read', { bookId: book.id, chapterIdx: chapterIndex });
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
        onChapterRead();
        closeReading();
        setTimeout(() => renderReadingPage(book, prevChapter), 200);
      });
      chapterNav.appendChild(prevBtn);
    }

    const label = el('span', 'reading-chapter-label');
    const readMark = bookState.readChapters.includes(chapterIndex) ? ` ✓${t('statusRead')}` : '';
    label.textContent = `${chapterIndex + 1}/${realChapters.length}${readMark}`;
    chapterNav.appendChild(label);

    if (nextChapter && isChapterUnlocked(chapterIndex + 1)) {
      const nextBtn = el('button', '');
      nextBtn.textContent = `${getChapterTitle(nextChapter)} →`;
      nextBtn.addEventListener('click', () => {
        onChapterRead();
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

  const firstPhaseUnlocked = level >= 1;   // 1=在架
  const recopyPhaseUnlocked = level >= 2;  // 2=典藏

  const firstPhaseContents = [
    t('bookShelvedAvailable'),
    getBookAuthorBio(book) || t('authorBioMissing')
  ].filter(Boolean);

  const recopyPhaseContents = [
    getBookAnecdotes(book) || t('anecdotesMissing'),
    getBookReviews(book) || t('reviewsMissing'),
    t('collectorCoverEffect').replace('{cover}', book.collectorCover || '🌟'),
    t('masteryMasterBonus')
  ].filter(Boolean);

  const modal = el('div', 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4');
  const content = el('div', `parchment-bg rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto magic-glow ${recopyPhaseUnlocked ? 'animate-glow' : ''}`);

  content.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-display text-xl font-bold">${book.emoji} ${getBookTitle(book)} · ${t('collectorArchive')}</h2>
      <button class="text-2xl text-ink-light hover:text-ink close-modal">✕</button>
    </div>
    <div class="text-sm text-ink-light mb-4">${book.author} · ${getCategoryLabel(book.category)} · ${t('totalCopies').replace('{n}', bookState.copyCount)}</div>

    <!-- 阶段一：首次完成 -->
    <div class="p-3 rounded-lg border mb-3 ${firstPhaseUnlocked ? 'bg-white border-magic-gold/30' : 'bg-wood/5 border-wood/20 opacity-70'}">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-sm">${firstPhaseUnlocked ? '🔓' : '🔒'}</span>
        <span class="font-bold text-sm ${firstPhaseUnlocked ? '' : 'text-ink-light/70'}">${t('masteryPhaseFirst')}</span>
      </div>
      ${firstPhaseUnlocked
        ? firstPhaseContents.map(c => `<p class="text-xs text-ink-light ml-6 mb-1">${c}</p>`).join('')
        : `<p class="text-xs text-ink-light/70 ml-6">${t('masteryUnlockOnFirst')}</p>`}
    </div>

    <!-- 阶段二：重抄解锁 -->
    <div class="p-3 rounded-lg border mb-4 ${recopyPhaseUnlocked ? 'bg-white border-magic-gold/30' : 'bg-wood/5 border-wood/20 opacity-70'}">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-sm">${recopyPhaseUnlocked ? '🔓' : '🔒'}</span>
        <span class="font-bold text-sm ${recopyPhaseUnlocked ? '' : 'text-ink-light/70'}">${t('masteryPhaseRecopy')}</span>
      </div>
      ${recopyPhaseUnlocked
        ? recopyPhaseContents.map(c => `<p class="text-xs text-ink-light ml-6 mb-1">${c}</p>`).join('')
        : `<p class="text-xs text-ink-light/70 ml-6">${t('masteryUnlockOnRecopy')}</p>`}
    </div>

    <button class="read-chapters-btn w-full mt-2 px-4 py-2 bg-magic-gold text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all">${t('readChapters')}</button>
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


// ========== 古籍修复室子标签（2026-10-27 图南拍板：从馆长办公室迁入大书库） ==========

// 修复室等级 → 场景图映射
const RESTORATION_BG = {
  0: 'visual/restoration/restoration_lv0_ruins.jpg',
  1: 'visual/restoration/restoration_lv1_shelter.jpg',
  2: 'visual/restoration/restoration_lv2_tidy.jpg',
  3: 'visual/restoration/restoration_lv3_bright.jpg',
  4: 'visual/restoration/restoration_lv4_elegant.jpg',
  5: 'visual/restoration/restoration_lv5_sanctum.jpg'
};

// ========== 保养台（book-maintenance-plan v2） ==========

function renderMaintenanceBench(rerender) {
  const card = document.createElement('div');
  card.className = 'bg-white/60 rounded-xl p-5 border border-wood/20';
  const cap = getMaintenanceBatchCap();
  const ms = state.maintenanceSession;
  const condClass = c => ({
    pristine: 'text-green-600', good: 'text-green-600',
    worn: 'text-amber-600', fragile: 'text-orange-600', critical: 'text-red-500'
  }[c] || 'text-ink-light');

  // 保养预约面板 + 待回架条带（servicing-room-plan v3 拍板 B：servicing 操作全聚在保养台）
  const sPrice = getServicingSlotPrice();
  const prefixHTML = `
    <div class="flex items-center justify-between mb-2 px-2 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
      <span class="text-xs font-bold text-amber-700">📅 ${t('servicingPanelTitle')} ${getServicingUsed()}/${getServicingSlots()}</span>
      ${sPrice > 0
        ? `<button class="servicing-expand-btn px-2 py-1 bg-magic-gold text-white rounded text-[10px] font-bold hover:shadow transition-all">${t('servicingExpandBtn').replace('{price}', sPrice)}</button>`
        : `<span class="text-[10px] text-ink-light/70">${t('servicingMaxed')}</span>`}
    </div>` + (() => {
      const awaiting = getAwaitingShelfReturnBooks();
      if (awaiting.length === 0) return '';
      return `<div class="mb-3 space-y-1">${awaiting.map(b => `
        <div class="flex items-center gap-2 px-2 py-1.5 bg-teal-50 border border-teal-200 rounded-lg">
          <span class="text-sm">${b.emoji}</span>
          <span class="text-xs font-bold text-teal-700 flex-1 min-w-0 truncate">✨ 《${b.title}》 ${t('servicingAwaitingShelf')}</span>
          <button class="servicing-shelf-btn px-2 py-1 bg-teal-500 text-white rounded text-[10px] font-bold hover:shadow transition-all" data-book="${b.bookId}">${t('servicingReturnToShelf')}</button>
        </div>`).join('')}</div>`;
    })();

  function bindServicing() {
    const expandBtn = card.querySelector('.servicing-expand-btn');
    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        if (expandServicingSlots()) { playSfx('buy_success'); rerender(); }
        else if (window.showToast) window.showToast(t('insufficientCoinsExclamation') + ' 💰', 'error');
      });
    }
    card.querySelectorAll('.servicing-shelf-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (returnToShelf(btn.dataset.book)) { playSfx('button_click'); rerender(); }
      });
    });
  }

  const headerHTML = `
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-display font-bold text-ink">🧴 ${t('maintenanceBenchTitle')}</h3>
      <span class="text-xs text-ink-light">${t('maintenanceBatchCap').replace('{n}', cap)}</span>
    </div>`;

  // 进行中 / 挂起批次：一体结算，续作或取消
  if (ms) {
    const total = getMaintenanceSessionTotal(ms);
    const pool = Math.min(ms.progressPool || 0, total);
    const pct = total > 0 ? Math.min(100, Math.round((pool / total) * 100)) : 0;
    const titles = ms.bookIds.map(id => BOOKS[id] ? (BOOKS[id].volumeTitle || BOOKS[id].title) : id);
    card.innerHTML = headerHTML + prefixHTML + `
      <div class="text-xs text-ink-light mb-2">${t('maintenanceBatchBooks').replace('{n}', ms.bookIds.length)}：${titles.map(x => '《' + x + '》').join('、')}</div>
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-xs font-bold text-ink">${t('maintenanceProgress')}</span>
        <span class="text-xs text-ink-light">${pool.toLocaleString()} / ${total.toLocaleString()} ${t('wordsUnit')}</span>
      </div>
      <div class="h-2.5 bg-wood/20 rounded-full overflow-hidden mb-4">
        <div class="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all duration-500" style="width:${pct}%"></div>
      </div>
      <div class="flex gap-2">
        <button class="resume-maintenance-btn flex-1 px-4 py-2 bg-magic-gold text-white text-sm font-bold rounded-lg hover:shadow-lg transition-all">${t('maintenanceResume')}</button>
        <button class="cancel-maintenance-btn px-4 py-2 bg-wood/20 text-ink-light text-sm font-bold rounded-lg hover:shadow transition-all">${t('maintenanceCancel')}</button>
      </div>
      <p class="text-[11px] text-ink-light/70 mt-2">${t('maintenanceSuspendHint')}</p>`;
    card.querySelector('.resume-maintenance-btn').addEventListener('click', () => {
      const res = startMaintenanceFocus('pomodoro', 25);
      if (res.ok) { playSfx('buy_success'); if (window.showToast) window.showToast(t('maintenanceStarted'), 'success'); }
      else if (window.showToast) window.showToast(t('maintenanceBusy'), 'error');
    });
    card.querySelector('.cancel-maintenance-btn').addEventListener('click', () => {
      if (window.confirm(t('maintenanceCancelConfirm'))) { cancelMaintenanceSession(); rerender(); }
    });
    bindServicing();
    return card;
  }

  // 组建批次：勾选可保养书
  const list = getMaintainableBooks();
  if (list.length === 0) {
    card.innerHTML = headerHTML + prefixHTML + `
      <div class="text-center py-4">
        <div class="text-2xl mb-1">✨</div>
        <p class="text-xs text-ink-light">${t('maintenanceEmpty')}</p>
      </div>`;
    bindServicing();
    return card;
  }

  card.innerHTML = headerHTML + prefixHTML + `
    <div class="space-y-1 mb-3 max-h-56 overflow-y-auto">
      ${list.map(b => `
        <label class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/70 cursor-pointer transition-colors">
          <input type="checkbox" class="maint-check accent-amber-600" data-book="${b.bookId}">
          <span class="text-base">${b.emoji}</span>
          <span class="text-xs font-bold text-ink flex-1 min-w-0 truncate">${b.servicing ? '🔒 ' : ''}《${b.title}》</span>
          <span class="text-[10px] ${condClass(b.condition)}">${t('condition_' + b.condition)} · ${t('wearCountN').replace('{n}', b.wearCount)}</span>
          <span class="text-[10px] text-ink-light">${b.words.toLocaleString()}${t('wordsUnit')}</span>
        </label>`).join('')}
    </div>
    <div class="flex items-center justify-between mb-2">
      <span class="maint-sel text-xs text-ink-light"></span>
      <span class="maint-total text-xs font-bold text-magic-gold"></span>
    </div>
    <button class="start-maintenance-btn w-full px-4 py-2 bg-magic-gold text-white text-sm font-bold rounded-lg hover:shadow-lg transition-all opacity-50 pointer-events-none">${t('maintenanceStart')}</button>
    <p class="text-[11px] text-ink-light/70 mt-2">${t('maintenanceBenchHint').replace('{n}', cap)}</p>`;

  const byId = Object.fromEntries(list.map(b => [b.bookId, b]));
  const checks = [...card.querySelectorAll('.maint-check')];
  const selEl = card.querySelector('.maint-sel');
  const totalEl = card.querySelector('.maint-total');
  const startBtn = card.querySelector('.start-maintenance-btn');

  function refresh() {
    const picked = checks.filter(c => c.checked).map(c => c.dataset.book);
    const total = picked.reduce((s, id) => s + (byId[id] ? byId[id].words : 0), 0);
    selEl.textContent = t('maintenanceSelected').replace('{n}', picked.length).replace('{cap}', cap);
    totalEl.textContent = picked.length > 0 ? `${t('maintenanceTotalWords')}${total.toLocaleString()}${t('wordsUnit')}` : '';
    const ok = picked.length >= 1 && picked.length <= cap;
    startBtn.classList.toggle('opacity-50', !ok);
    startBtn.classList.toggle('pointer-events-none', !ok);
    return picked;
  }
  checks.forEach(c => c.addEventListener('change', () => {
    const picked = checks.filter(x => x.checked);
    if (picked.length > cap) {
      c.checked = false;
      if (window.showToast) window.showToast(t('maintenanceOverCap').replace('{n}', cap), 'error');
      return;
    }
    refresh();
  }));
  refresh();

  startBtn.addEventListener('click', () => {
    const picked = refresh();
    const res = startMaintenanceSession(picked);
    if (!res.ok) {
      if (window.showToast) window.showToast(t('maintenanceStartFail'), 'error');
      return;
    }
    const focus = startMaintenanceFocus('pomodoro', 25);
    if (focus.ok) { playSfx('buy_success'); if (window.showToast) window.showToast(t('maintenanceStarted'), 'success'); }
    else if (window.showToast) window.showToast(t('maintenanceBatchReady'), 'success');
  });

  bindServicing();
  return card;
}

function renderRestorationTab(container) {
  container.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'space-y-6';

  // 0. 修复室是否已解锁（Lv0 免费：主动修缮或首次受灾自动点亮）
  if (!isRestorationUnlocked()) {
    const unlockCard = document.createElement('div');
    unlockCard.className = 'bg-amber-50/80 rounded-xl p-6 border-2 border-amber-200 text-center';
    unlockCard.innerHTML = `
      <div class="text-4xl mb-3">🔒</div>
      <h3 class="font-display text-lg font-bold mb-2">${t('restorationRoomLocked')}</h3>
      <p class="text-sm text-ink-light mb-4">${t('restorationRoomLockedDesc')}</p>
      <button class="grant-restoration-btn px-5 py-2 bg-magic-gold text-white text-sm font-bold rounded-lg hover:shadow-lg transition-all">
        ${t('grantRestorationFree')}
      </button>
      <p class="text-xs text-ink-light/60 mt-3">${t('restorationGrantHint')}</p>
    `;
    unlockCard.querySelector('.grant-restoration-btn').addEventListener('click', () => {
      if (grantRestorationRoom()) {
        playSfx('buy_success');
        const trigger = checkAndShowTutorial('restoration_unlock');
        if (trigger) dispatchTutorialUI(trigger);
        renderRestorationTab(container);
      }
    });
    container.appendChild(unlockCard);
    return;
  }

  // 1. 修复室等级
  const level = getRestorationLevel();
  const maxLevel = 5;
  const upgradePrice = getRestorationUpgradePrice();
  const repairBonus = Math.round(getRestorationRepairSpeedBonus() * 100);
  const rgateLocked = level < maxLevel && level + 1 > getFacilityLevelCap(state.library.atmosphere || 0, state.library.stage); // D22
  const levelCard = document.createElement('div');
  levelCard.className = 'bg-white/60 rounded-xl overflow-hidden border border-wood/20';
  levelCard.innerHTML = `
    <div class="relative h-40 overflow-hidden">
      <img src="${RESTORATION_BG[level]}" alt="${t('restorationRoomLevelTitle').replace('{level}', level)}" class="w-full h-full object-cover">
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
      <div class="absolute bottom-3 left-4 text-white">
        <div class="font-bold" style="text-shadow:0 1px 4px rgba(0,0,0,0.8)">${t('restorationRoomLevelTitle').replace('{level}', level)}</div>
      </div>
    </div>
    <div class="p-5">
      <div class="flex items-center justify-between">
        <div class="text-xs text-ink-light">${t('restorationRepairSpeedDesc').replace('{bonus}', repairBonus)}</div>
        ${level < maxLevel
          ? rgateLocked
            ? `<span class="text-xs text-ink-light">🔒 ${t('facilityStageGate').replace('{level}', level + 1).replace('{stage}', getFacilityRequiredStage(level + 1))}</span>`
            : `<button class="upgrade-restoration-level-btn px-3 py-1.5 bg-magic-gold text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all">
              ${t('upgrade')} 💰${upgradePrice.toLocaleString()}
             </button>`
          : `<span class="text-xs text-magic-gold font-bold">${t('maxLevel')} ✨</span>`}
      </div>
    </div>
  `;
  const upgradeLevelBtn = levelCard.querySelector('.upgrade-restoration-level-btn');
  if (upgradeLevelBtn) {
    upgradeLevelBtn.addEventListener('click', () => {
      if (upgradeRestorationLevel()) {
        playSfx('buy_success');
        updateStatusBar();
        renderRestorationTab(container);
      } else {
        window.showToast(t('insufficientCoinsExclamation') + ' 💰', 'error');
      }
    });
  }
  wrapper.appendChild(levelCard);

  // 2. 保养台（book-maintenance-plan v2：主动保养层——批次一体结算，可挂起续作）
  wrapper.appendChild(renderMaintenanceBench(() => renderRestorationTab(container)));

  // 3. 卷组进度与合成
  const groupsSection = document.createElement('div');
  groupsSection.className = 'bg-white/60 rounded-xl p-5 border border-wood/20';
  groupsSection.innerHTML = `<h3 class="font-display text-lg font-bold mb-4">${t('volumeGroupsTitle')}</h3>`;

  const groupsGrid = document.createElement('div');
  groupsGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';

  Object.values(VOLUME_GROUPS).forEach(group => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl p-4 border border-wood/10';

    const progress = getVolumeGroupProgress(group, state.books);
    const collectable = canCollectVolumeGroup(group);
    const volRows = group.volumeIds.map(id => renderVolumeRow(id)).join('');

    // 卷组标题神秘感：未获得任何一卷时隐藏书名
    const groupUnlocked = group.volumeIds.some(id => {
      const bs = state.books[id];
      return bs && bs.status !== 'locked';
    });
    const groupEmoji = groupUnlocked ? group.emoji : '❓';
    const groupTitle = getVolumeGroupTitle(group, groupUnlocked);

    const percent = Math.round((progress.completed / progress.total) * 100);
    card.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-2xl">${groupEmoji}</span>
          <div>
            <div class="font-bold text-ink">${groupTitle}</div>
            <div class="text-xs text-ink-light">${t('volumesCopied').replace('{current}', progress.completed).replace('{total}', progress.total)}</div>
          </div>
        </div>
        ${collectable ? (level >= 1
          ? `<button class="collect-btn px-3 py-1.5 bg-magic-gold text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all" data-group="${group.collectedBookId}">${t('craftCollectorEdition')}</button>`
          : `<span class="text-xs text-ink-light">🔒 ${t('craftRequiresRestorationLevel1')}</span>`) : ''}
      </div>
      <div class="w-full h-2 bg-wood/10 rounded-full mb-3 overflow-hidden">
        <div class="h-full bg-magic-gold rounded-full" style="width:${percent}%"></div>
      </div>
      <div class="space-y-1.5">${volRows}</div>
    `;

    const collectBtn = card.querySelector('.collect-btn');
    if (collectBtn) {
      collectBtn.addEventListener('click', () => {
        const g = VOLUME_GROUPS[collectBtn.dataset.group];
        if (!g) return;
        const result = collectVolumeGroup(g);
        if (result.ok) {
          playSfx('buy_success');
          const ach = checkAchievements('volume_collect');
          if (ach.length > 0) showAchievementToast(ach[0]);
          updateStatusBar();
          renderRestorationTab(container);
        } else if (result.reason === 'restoration_level_required') {
          window.showToast(t('craftRequiresRestorationLevel1'), 'error');
        }
      });
    }

    groupsGrid.appendChild(card);
  });

  groupsSection.appendChild(groupsGrid);
  wrapper.appendChild(groupsSection);

  // 2. 修缮箱
  const boxSection = document.createElement('div');
  boxSection.className = 'bg-white/60 rounded-xl p-5 border border-wood/20';
  const slots = getRestorationBoxSlots();
  const count = getRestorationBoxCount();
  const boxPrice = getRestorationSlotPrice();
  const canExpand = slots < 20;

  const boxItems = (state.restorationBox || []).map(id => {
    const book = BOOKS[id];
    return `
      <div class="flex items-center justify-between bg-amber-50/60 border border-amber-200 rounded-lg px-3 py-2">
        <div class="flex items-center gap-2">
          <span>${book ? book.emoji : '📜'}</span>
          <span class="text-sm font-bold">${book ? getBookTitle(book) : id}</span>
        </div>
        <button class="remove-restoration-btn text-xs px-2 py-1 bg-wood/10 hover:bg-wood/20 rounded" data-id="${id}">${t('takeOut')}</button>
      </div>
    `;
  }).join('');

  boxSection.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-display text-lg font-bold">${t('restorationBoxTitle')}</h3>
      <div class="text-xs text-ink-light">${t('slotsStatus').replace('{current}', count).replace('{total}', slots)}</div>
    </div>
    <p class="text-xs text-ink-light mb-3">${t('restorationBoxDesc')}</p>
    ${boxItems ? `<div class="space-y-2 mb-4">${boxItems}</div>` : `<p class="text-sm text-ink-light mb-4">${t('restorationBoxEmpty')}</p>`}
    ${canExpand ? `
      <button class="expand-restoration-btn px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-200 transition-all">
        ${t('expandSlotsTo').replace('{n}', slots + 1)} 💰${boxPrice.toLocaleString()}
      </button>
    ` : `<span class="text-xs text-magic-gold font-bold">${t('maxSlotsReached').replace('{n}', 20)}</span>`}
  `;

  const expandBtn = boxSection.querySelector('.expand-restoration-btn');
  if (expandBtn) {
    expandBtn.addEventListener('click', () => {
      if (expandRestorationBoxSlots()) {
        playSfx('buy_success');
        updateStatusBar();
        renderRestorationTab(container);
      } else {
        window.showToast(t('insufficientCoinsExclamation') + ' 💰', 'error');
      }
    });
  }

  boxSection.querySelectorAll('.remove-restoration-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (removeFromRestorationBox(btn.dataset.id)) {
        renderRestorationTab(container);
      }
    });
  });

  wrapper.appendChild(boxSection);

  // 3. 可锁入修缮箱的单卷
  const storeSection = document.createElement('div');
  storeSection.className = 'bg-white/60 rounded-xl p-5 border border-wood/20';

  const storeableIds = Object.values(VOLUME_GROUPS).flatMap(g => g.volumeIds).filter(id => {
    const bs = state.books[id];
    if (!bs || bs.status === 'locked') return false;
    if ((state.restorationBox || []).includes(id)) return false;
    return true;
  });

  const storeRows = storeableIds.map(id => {
    const book = BOOKS[id];
    return `
      <div class="flex items-center justify-between bg-white border border-wood/10 rounded-lg px-3 py-2">
        <div class="flex items-center gap-2">
          <span>${book ? book.emoji : '📜'}</span>
          <span class="text-sm font-bold">${book ? getBookTitle(book) : id}</span>
        </div>
        <button class="store-restoration-btn text-xs px-2 py-1 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded" data-id="${id}">${t('storeInRestorationBoxLabel')}</button>
      </div>
    `;
  }).join('');

  storeSection.innerHTML = `
    <h3 class="font-display text-lg font-bold mb-3">${t('protectableVolumes')}</h3>
    ${storeRows ? `<div class="space-y-2">${storeRows}</div>` : `<p class="text-sm text-ink-light">${t('noProtectableVolumes')}</p>`}
  `;

  storeSection.querySelectorAll('.store-restoration-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (storeInRestorationBox(btn.dataset.id)) {
        renderRestorationTab(container);
      } else {
        window.showToast(t('restorationBoxFullOrInvalid'), 'error');
      }
    });
  });

  wrapper.appendChild(storeSection);
  container.appendChild(wrapper);
}

function getVolumeGroupTitle(group, unlocked) {
  if (!unlocked) return '❓ ???';
  const key = `volumeGroupTitle_${group.collectedBookId}`;
  const term = t(key);
  return term === key ? group.title : term;
}

function renderVolumeRow(bookId) {
  const bs = state.books[bookId];
  const book = BOOKS[bookId];
  if (!book) return '';

  const isLocked = !bs || bs.status === 'locked';
  let statusText = t('notObtained');
  let statusClass = 'text-gray-400';
  let extra = '';

  if (!isLocked) {
    const borrowed = (state.visitors || []).some(v =>
      v.bookId === bookId && (v.status === 'borrowed' || v.status === 'due')
    );
    if (bs.damaged) {
      statusText = t('damagedPendingRepair');
      statusClass = 'text-red-500';
    } else if (borrowed) {
      statusText = t('onLoan');
      statusClass = 'text-amber-500';
    } else if (bs.status === 'completed') {
      statusText = t('copiedCompleted');
      statusClass = 'text-green-600';
    } else {
      statusText = t('copying');
      statusClass = 'text-magic-blue';
    }
    extra = bs.damaged ? ' 🩹' : (borrowed ? ' 📤' : (bs.status === 'completed' ? ' ✓' : ' ✎'));
  }

  // 未获得的卷保持神秘感，不显示卷名
  const displayName = isLocked ? '❓ ???' : getBookTitle(book);

  return `
    <div class="flex items-center justify-between text-xs bg-wood/5 rounded-lg px-3 py-1.5">
      <span class="font-medium">${displayName}</span>
      <span class="${statusClass}">${statusText}${extra}</span>
    </div>
  `;
}
