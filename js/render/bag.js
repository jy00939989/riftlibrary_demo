// 背包（行囊）面板渲染
import { state, saveState } from '../state.js';
import { el, h, updateStatusBar } from './common.js';
import { ITEMS, getItemDef, itemRequiresTarget } from '../../data/items.js';
import { BOOKS } from '../../data/books.js';
import { VISITOR_DEFS } from '../visitors.js';
import {
  useItem,
  getInventoryCount,
  getEligibleBooksForBrush,
  getDamagedBooks,
  getUnlockedVisitors,
  getItemTargetType
} from '../core/redeem.js';
import { t } from '../i18n/terms.js';

let bagOverlay = null;

/** 更新导航栏背包徽标 */
export function updateBagBadge() {
  const btn = document.getElementById('nav-bag-btn');
  if (!btn) return;
  const total = Object.values(state.inventory || {}).reduce((sum, n) => sum + (n || 0), 0);
  let badge = btn.querySelector('.bag-badge');
  if (total > 0) {
    if (!badge) {
      badge = el('span', 'bag-badge absolute -top-1 -right-1 bg-magic-gold text-ink text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center');
      btn.style.position = 'relative';
      btn.appendChild(badge);
    }
    badge.textContent = total > 99 ? '99+' : total.toString();
    badge.classList.remove('hidden');
  } else if (badge) {
    badge.classList.add('hidden');
  }
}

/** 打开背包面板 */
export function showBagPanel() {
  if (bagOverlay) {
    bagOverlay.remove();
    bagOverlay = null;
  }

  bagOverlay = el('div', 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4');
  bagOverlay.addEventListener('click', (e) => {
    if (e.target === bagOverlay) hideBagPanel();
  });

  const modal = el('div', 'parchment-bg rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col magic-glow animate-scale-in');

  // 头部
  const title = el('h2', 'text-xl font-bold text-ink', { text: '🎒 ' + (t('bag_title') || '行囊') });
  const closeBtn = el('button', 'text-ink-light hover:text-ink text-xl', { text: '✕' });
  closeBtn.addEventListener('click', hideBagPanel);
  const header = el('div', 'flex items-center justify-between mb-4', {}, [title, closeBtn]);

  // 内容区
  const content = el('div', 'flex-1 overflow-y-auto pr-1');
  renderBagContent(content);

  modal.appendChild(header);
  modal.appendChild(content);
  bagOverlay.appendChild(modal);
  document.body.appendChild(bagOverlay);
}

export function hideBagPanel() {
  if (bagOverlay) {
    bagOverlay.remove();
    bagOverlay = null;
  }
}

function renderBagContent(container) {
  container.innerHTML = '';

  const itemIds = Object.keys(state.inventory || {})
    .filter(id => (state.inventory[id] || 0) > 0)
    .sort((a, b) => {
      const order = { brush: 1, repair: 2, favor: 3 };
      const ca = ITEMS[a]?.category || 'zzz';
      const cb = ITEMS[b]?.category || 'zzz';
      return (order[ca] || 9) - (order[cb] || 9);
    });

  if (itemIds.length === 0) {
    container.appendChild(el('div', 'text-center text-ink-light py-12', { text: t('bag_empty') || '行囊空空如也。' }));
    return;
  }

  const grid = el('div', 'grid grid-cols-1 sm:grid-cols-2 gap-3');
  itemIds.forEach(id => {
    grid.appendChild(renderItemCard(id));
  });
  container.appendChild(grid);
}

function renderItemCard(itemId) {
  const def = getItemDef(itemId);
  const count = getInventoryCount(itemId);
  const targetType = getItemTargetType(itemId);

  const card = el('div', 'parchment-dark/30 border border-wood/20 rounded-xl p-3 flex gap-3 items-start');

  const icon = el('div', 'text-3xl flex-shrink-0', { text: def?.emoji || '📦' });

  const body = el('div', 'flex-1 min-w-0');
  const titleRow = el('div', 'flex items-center justify-between gap-2', {}, [
    el('div', 'font-bold text-ink truncate', { text: def?.name || itemId }),
    el('span', 'bg-magic-gold/20 text-ink text-sm font-bold px-2 py-0.5 rounded-full', { text: '×' + count })
  ]);
  const desc = el('div', 'text-xs text-ink-light mt-1 line-clamp-2', { text: def?.description || '' });

  body.appendChild(titleRow);
  body.appendChild(desc);

  const actions = el('div', 'mt-2 flex gap-2');
  if (targetType) {
    const useBtn = el('button', 'btn btn-primary btn-sm', { text: t('item_use') || '使用' });
    useBtn.addEventListener('click', () => openUseSelector(itemId));
    actions.appendChild(useBtn);
  } else if ((def?.category) === 'favor' && itemId === 'favor_note_random') {
    const useBtn = el('button', 'btn btn-primary btn-sm', { text: t('item_use') || '使用' });
    useBtn.addEventListener('click', () => useItemWithConfirm(itemId));
    actions.appendChild(useBtn);
  }

  body.appendChild(actions);
  card.appendChild(icon);
  card.appendChild(body);

  return card;
}

/** 根据道具类型打开对应的选择器 */
function openUseSelector(itemId) {
  const targetType = getItemTargetType(itemId);
  if (!targetType) return;

  if (targetType === 'book') {
    const books = getEligibleBooksForBrush();
    if (books.length === 0) {
      showToast(t('no_eligible_book') || '没有可作为目标的书籍');
      return;
    }
    showBookSelector(books, itemId);
  } else if (targetType === 'damaged_book') {
    const books = getDamagedBooks();
    if (books.length === 0) {
      showToast(t('no_damaged_book') || '没有损坏的书籍');
      return;
    }
    showDamagedBookSelector(books, itemId);
  } else if (targetType === 'visitor') {
    const visitors = getUnlockedVisitors();
    if (visitors.length === 0) {
      showToast(t('no_unlocked_visitor') || '没有已解锁的角色');
      return;
    }
    showVisitorSelector(visitors, itemId);
  }
}

/** 书籍选择器 */
function showBookSelector(bookIds, itemId) {
  const def = getItemDef(itemId);
  const words = def?.effect?.value || 0;

  buildSelectorModal({
    title: t('select_book') || '选择要誊抄的书籍',
    subtitle: `《${def?.name}》可增加 ${words.toLocaleString()} 字进度`,
    items: bookIds.map(id => ({
      id,
      icon: BOOKS[id]?.emoji || '📖',
      title: BOOKS[id]?.title || id,
      meta: renderBookProgressMeta(id),
      onClick: () => confirmAndUse(itemId, id)
    }))
  });
}

/** 损坏书籍选择器 */
function showDamagedBookSelector(bookIds, itemId) {
  buildSelectorModal({
    title: t('select_damaged_book') || '选择要修复的书籍',
    items: bookIds.map(id => ({
      id,
      icon: BOOKS[id]?.emoji || '📖',
      title: BOOKS[id]?.title || id,
      meta: `需要 ${state.books[id].repairWords - (state.books[id].repairProgress || 0)} 字修复`,
      onClick: () => confirmAndUse(itemId, id)
    }))
  });
}

/** 角色选择器 */
function showVisitorSelector(visitorIds, itemId) {
  buildSelectorModal({
    title: t('select_visitor') || '选择要赠送的角色',
    items: visitorIds.map(id => ({
      id,
      icon: VISITOR_DEFS[id]?.emoji || '👤',
      title: VISITOR_DEFS[id]?.name || id,
      meta: `好感度 ${state.visitorFavors?.[id] || 0}`,
      onClick: () => confirmAndUse(itemId, id)
    }))
  });
}

function renderBookProgressMeta(bookId) {
  const bs = state.books[bookId];
  const book = BOOKS[bookId];
  if (!bs || !book) return '';
  const pct = Math.min(100, Math.round((bs.copiedWords / book.totalWords) * 100));
  return `进度 ${pct}%`;
}

function buildSelectorModal({ title, subtitle, items }) {
  const overlay = el('div', 'fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  const modal = el('div', 'parchment-bg rounded-2xl p-5 max-w-md w-full max-h-[80vh] flex flex-col magic-glow animate-scale-in');

  modal.appendChild(el('h3', 'text-lg font-bold text-ink mb-1', { text: title }));
  if (subtitle) {
    modal.appendChild(el('p', 'text-xs text-ink-light mb-3', { text: subtitle }));
  }

  const list = el('div', 'flex-1 overflow-y-auto space-y-2 max-h-[60vh]');
  items.forEach(item => {
    const row = el('button', 'w-full text-left flex items-center gap-3 p-3 rounded-xl border border-wood/20 hover:bg-wood/10 transition-colors');
    row.addEventListener('click', () => {
      overlay.remove();
      item.onClick();
    });
    row.appendChild(el('span', 'text-2xl', { text: item.icon }));
    const textCol = el('div', 'flex-1 min-w-0');
    textCol.appendChild(el('div', 'font-bold text-ink truncate', { text: item.title }));
    if (item.meta) {
      textCol.appendChild(el('div', 'text-xs text-ink-light', { text: item.meta }));
    }
    row.appendChild(textCol);
    list.appendChild(row);
  });

  modal.appendChild(list);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

/** 二次确认后使用 */
function confirmAndUse(itemId, target) {
  const def = getItemDef(itemId);
  const targetName = getTargetName(itemId, target);
  if (!confirm(`确定对「${targetName}」使用 ${def?.name} 吗？`)) return;

  const result = useItem(itemId, target);
  if (result.ok) {
    showToast(result.message);
    refreshBagPanel();
    updateBagBadge();
  } else {
    showToast(result.message, 'error');
  }
}

/** 随机便签直接确认使用 */
function useItemWithConfirm(itemId) {
  const def = getItemDef(itemId);
  if (!confirm(`确定使用 ${def?.name} 吗？`)) return;

  const result = useItem(itemId);
  if (result.ok) {
    showToast(result.message);
    refreshBagPanel();
    updateBagBadge();
  } else {
    showToast(result.message, 'error');
  }
}

function getTargetName(itemId, target) {
  if (getItemTargetType(itemId) === 'visitor') {
    return VISITOR_DEFS[target]?.name || target;
  }
  return BOOKS[target]?.title || target;
}

function refreshBagPanel() {
  if (!bagOverlay) return;
  const content = bagOverlay.querySelector('.flex-1.overflow-y-auto');
  if (content) renderBagContent(content);
}

/** 简易 Toast */
function showToast(msg, type = 'info') {
  if (typeof window !== 'undefined' && window.showToast) {
    window.showToast(msg, type);
    return;
  }
  // fallback
  const root = document.getElementById('toast-root') || document.body;
  const t = el('div', `fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm z-[70] ${type === 'error' ? 'bg-red-800 text-white' : 'bg-ink text-parchment'}`, { text: msg });
  root.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

/** 初始化：绑定导航栏背包按钮 */
export function initBagEntry() {
  updateBagBadge();
  const btn = document.getElementById('nav-bag-btn');
  if (btn) {
    btn.addEventListener('click', showBagPanel);
  }
}
