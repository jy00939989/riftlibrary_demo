// 位面商店页面渲染 —— 纯渲染，不持状态
import { state } from '../state.js';
import { BOOKS } from '../../data/books.js';
import { SHARED_POOL } from '../../data/book_pool.js';
import { el, h, actions } from './common.js';
import { ensureShopState, getShopState, purchaseBook, getBorrowLevelPrice, upgradeBorrowLevel } from '../shop.js';

let countdownInterval = null;

export function renderShopPage() {
  cleanupTimer();
  ensureShopState();
  const shopState = getShopState();

  const container = document.getElementById('page-shop');
  if (!container) return;
  container.innerHTML = '';

  const wrapper = el('div', 'space-y-6');

  // ========== 图书馆升级区 ==========
  wrapper.appendChild(renderLibraryUpgrades());

  // ========== 新书区 ==========
  wrapper.appendChild(renderBookSection('📚 新书上架', shopState.fixed, false));
  wrapper.appendChild(renderBookSection('🔥 限时特惠', shopState.rotating, true));

  container.appendChild(wrapper);

  // 启动倒计时定时器
  const hasCountdown = [...shopState.fixed, ...shopState.rotating].some(s => s.soldAt);
  if (hasCountdown) {
    countdownInterval = setInterval(() => renderShopPage(), 1000);
  }
}

// ========== 图书馆升级区 ==========

function renderLibraryUpgrades() {
  const section = el('div', 'parchment-bg rounded-2xl p-6 magic-glow');

  section.innerHTML = `<h2 class="font-display text-xl font-bold mb-4">🏛️ 图书馆升级</h2>`;

  const grid = el('div', 'grid grid-cols-1 md:grid-cols-2 gap-3');

  // === 借阅区升级（可运作） ===
  const lv = state.library.borrowLevel || 0;
  const lvNames = ['未建造', '外壳', '整洁', '开放', '舒适', '精致', '优雅', '圣所'];
  const price = getBorrowLevelPrice();
  const maxed = lv >= 7;

  const readingCard = el('div', 'bg-white rounded-xl p-4 border-2 border-magic-gold/30 flex gap-4 items-center');
  const imgNum = String(lv === 0 ? 1 : lv).padStart(2, '0');

  // 如果有美术素材则展示
  const imgSrc = lv > 0
    ? `visual/library_readingarea/library_reading_${imgNum}_${['', 'shell','tidy','open','comfy','refined','elegant','sanctum'][lv]}.jpg`
    : '';

  readingCard.innerHTML = `
    <div class="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-wood/10 flex items-center justify-center">
      ${imgSrc
        ? `<img src="${imgSrc}" alt="Lv${lv}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<span class=text-3xl>📚</span>'">`
        : '<span class="text-3xl">📚</span>'}
    </div>
    <div class="flex-1">
      <div class="flex items-center gap-2 mb-1">
        <span class="font-bold">📚 借阅区</span>
        <span class="text-xs bg-magic-gold/20 text-magic-gold px-2 py-0.5 rounded-full">Lv.${lv} · ${lvNames[lv]}</span>
      </div>
      <p class="text-xs text-ink-light mb-2">${lv === 0 ? '建造借阅区，让访客有舒适的阅读空间' : `当前等级：${lvNames[lv]} — 访客阅读体验提升中`}</p>
      ${maxed
        ? '<span class="text-sm text-magic-gold font-bold">已满级 ✨</span>'
        : `<button class="upgrade-borrow-btn px-4 py-1.5 bg-magic-gold text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all">升级 💰${price.toLocaleString()}</button>`
      }
    </div>
  `;

  const upgradeBtn = readingCard.querySelector('.upgrade-borrow-btn');
  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', () => {
      if (upgradeBorrowLevel()) {
        const coinsEl = document.getElementById('status-coins');
        if (coinsEl) coinsEl.textContent = state.coins.toLocaleString();
        renderShopPage();
      } else {
        alert('代币不足 💰');
      }
    });
  }

  grid.appendChild(readingCard);

  // === 四个占位项 ===
  const placeholders = [
    { icon: '🚪', name: '传送门大厅', desc: '解锁多位面探索' },
    { icon: '📜', name: '古籍修复室', desc: '修复损毁珍本' },
    { icon: '☕', name: '咖啡角', desc: '延长访客停留时间' },
    { icon: '🔬', name: '研究区', desc: '深度研究书籍获得加成' }
  ];

  placeholders.forEach(p => {
    const card = el('div', 'bg-gray-100 rounded-xl p-4 border-2 border-dashed border-gray-300 flex items-center gap-3 opacity-70');
    card.innerHTML = `
      <span class="text-2xl">${p.icon}</span>
      <div class="flex-1">
        <span class="font-bold text-sm">${p.name}</span>
        <span class="text-xs text-ink-light ml-2">${p.desc}</span>
      </div>
      <span class="text-xs text-ink-light bg-gray-200 px-2 py-0.5 rounded">🏗️ 规划中…</span>
    `;
    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}

// ========== 新书区 ==========

function renderBookSection(title, slots, isRotating) {
  const section = el('div', 'parchment-bg rounded-2xl p-6 magic-glow');
  section.innerHTML = `<h2 class="font-display text-xl font-bold mb-4">${title}</h2>`;

  const grid = el('div', 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3');

  slots.forEach(slot => {
    if (!slot || !slot.bookId) {
      // 空位
      const empty = el('div', 'bg-wood/5 rounded-xl p-4 border-2 border-dashed border-wood/20 flex items-center justify-center min-h-[180px]');
      empty.innerHTML = '<span class="text-wood/30 text-sm text-center">新书上架中…</span>';
      grid.appendChild(empty);
      return;
    }

    const poolEntry = SHARED_POOL.find(b => b.bookId === slot.bookId);
    if (!poolEntry) return;

    const owned = state.books[slot.bookId] && state.books[slot.bookId].status !== 'locked';

    grid.appendChild(renderBookCard(slot, poolEntry, owned, isRotating));
  });

  section.appendChild(grid);
  return section;
}

function renderBookCard(slot, poolEntry, owned, isRotating) {
  const card = el('div', `book-card rounded-xl p-4 border-2 transition-all relative ${
    owned ? 'bg-gray-100 border-gray-200 opacity-50' : 'bg-white border-wood/20 hover:border-magic-gold/50 hover:shadow-lg cursor-pointer'
  }`);

  if (owned) {
    card.innerHTML = `
      <div class="text-center">
        <div class="text-3xl mb-2">${poolEntry.emoji}</div>
        <div class="font-bold text-sm mb-1">${poolEntry.title}</div>
        <div class="text-xs text-ink-light mb-2">${poolEntry.author} · ${poolEntry.category}</div>
        <div class="text-xs text-magic-gold font-bold">✅ 已拥有</div>
      </div>
    `;
    return card;
  }

  const priceDisplay = isRotating
    ? `<div class="text-sm"><span class="text-gray-400 line-through text-xs">💰${slot.originalPrice}</span> <span class="text-magic-gold font-bold">💰${slot.price}</span></div>
       <div class="text-xs text-red-500 font-bold">${Math.round(slot.discount * 10)}折</div>`
    : `<div class="text-sm text-magic-gold font-bold">💰${slot.price}</div>`;

  const soldText = slot.soldAt ? formatCountdown(slot.soldAt) : '';

  if (soldText) {
    card.innerHTML = `
      <div class="text-center">
        <div class="text-3xl mb-2">${poolEntry.emoji}</div>
        <div class="font-bold text-sm mb-1">${poolEntry.title}</div>
        <div class="text-xs text-ink-light mb-2">${poolEntry.author}</div>
        <div class="text-xs text-magic-blue">⏰ ${soldText}</div>
      </div>
    `;
    return card;
  }

  card.innerHTML = `
    <div class="text-center">
      <div class="text-3xl mb-2">${poolEntry.emoji}</div>
      <div class="font-bold text-sm mb-1">${poolEntry.title}</div>
      <div class="text-xs text-ink-light mb-1">${poolEntry.author}</div>
      <div class="text-xs text-ink-light mb-2">${poolEntry.category} · ${poolEntry.totalWords.toLocaleString()}字</div>
      ${priceDisplay}
    </div>
  `;

  card.addEventListener('click', () => {
    showPurchaseModal(poolEntry, slot.price, isRotating ? slot.originalPrice : null, isRotating ? slot.discount : null);
  });

  return card;
}

// ========== 购买弹窗 ==========

function showPurchaseModal(poolEntry, price, originalPrice, discount) {
  const overlay = el('div', 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4');

  const desc = poolEntry.description || '';
  const shortDesc = desc.length > 60 ? desc.slice(0, 60) + '…' : desc;

  const priceLine = discount
    ? `<span class="text-gray-400 line-through mr-2">💰${originalPrice}</span><span class="text-magic-gold font-bold text-lg">💰${price}</span> <span class="text-xs text-red-500">${Math.round(discount * 10)}折</span>`
    : `<span class="text-magic-gold font-bold text-lg">💰${price}</span>`;

  const content = el('div', 'parchment-bg rounded-2xl p-6 max-w-sm w-full magic-glow animate-scale-in');
  content.innerHTML = `
    <div class="text-center mb-4">
      <div class="text-5xl mb-3">${poolEntry.emoji}</div>
      <h3 class="font-display text-xl font-bold mb-1">${poolEntry.title}</h3>
      <p class="text-sm text-ink-light">${poolEntry.author} · ${poolEntry.category}</p>
      <p class="text-xs text-ink-light mt-1">${poolEntry.totalWords.toLocaleString()}字 · ${poolEntry.chapterCount}章</p>
    </div>
    <div class="bg-white/60 rounded-lg p-3 mb-4">
      <p class="text-sm text-ink-light">${shortDesc}</p>
    </div>
    <div class="text-center mb-4">${priceLine}</div>
    <div class="flex justify-center gap-3">
      <button class="cancel-btn px-6 py-2.5 bg-wood/20 text-ink-light rounded-lg font-bold hover:bg-wood/30 transition-all">取消</button>
      <button class="confirm-btn px-6 py-2.5 bg-magic-gold text-white rounded-lg font-bold hover:shadow-lg transition-all ${state.coins < price ? 'opacity-50 cursor-not-allowed' : ''}">确认购买</button>
    </div>
    ${state.coins < price ? '<p class="text-xs text-red-500 text-center mt-2">代币不足 💰</p>' : ''}
  `;

  overlay.appendChild(content);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();

  content.querySelector('.cancel-btn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const confirmBtn = content.querySelector('.confirm-btn');
  confirmBtn.addEventListener('click', () => {
    if (state.coins < price) {
      alert('代币不足 💰');
      return;
    }
    if (purchaseBook(poolEntry.bookId, price)) {
      // 更新顶部状态栏
      const coinsEl = document.getElementById('status-coins');
      if (coinsEl) coinsEl.textContent = state.coins.toLocaleString();
      overlay.remove();
      renderShopPage();
    }
  });
}

// ========== 工具 ==========

function formatCountdown(soldAt) {
  const now = Date.now();
  const remaining = 24 * 3600 * 1000 - (now - soldAt);
  if (remaining <= 0) return '';
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return `补货中 ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function cleanupTimer() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}
