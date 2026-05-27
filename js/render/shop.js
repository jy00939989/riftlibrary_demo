// 位面商店页面渲染 —— 纯渲染，不持状态
import { state, saveState } from '../state.js';
import { BOOKS } from '../../data/books.js';
import { SHARED_POOL } from '../../data/book_pool.js';
import { el, h, actions, updateStatusBar } from './common.js';
import { ensureShopState, getShopState, purchaseBook, getBorrowLevelPrice, upgradeBorrowLevel, getFocusLevelPrice, upgradeFocusLevel, purchaseSignboard, purchasePlanePortal, getPlanePortalPrice } from '../shop.js';
import { PLANES, canUnlockPlane } from '../../data/planes.js';
import { showFocusRoomUpgrade } from './tutorial-ui.js';
import { getBorrowLevelConfig } from '../visitors.js';
import { PLANT_TYPES } from '../../data/plants.js';
import { checkAchievements } from '../achievements.js';
import { showAchievementToast } from './achievements.js';
import { SIGNBOARDS } from '../../data/signboards.js';
import { plantSeed, canFertilize, fertilizePlant, canWater, waterPlant, canHarvest, harvestPlant } from '../plants.js';

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

  // ========== 馆内装潢区 ==========
  wrapper.appendChild(renderDecorationShop());

  container.appendChild(wrapper);

  // 启动倒计时定时器（仅更新倒计时文本，不重建DOM）
  const hasCountdown = [...shopState.fixed, ...shopState.rotating].some(s => s.soldAt);
  if (hasCountdown) {
    countdownInterval = setInterval(updateCountdowns, 1000);
  }
}

// ========== 图书馆升级区 ==========

function renderLibraryUpgrades() {
  const section = el('div', 'parchment-bg rounded-2xl p-6 magic-glow');

  section.innerHTML = `<h2 class="font-display text-xl font-bold mb-4">🏛️ 图书馆升级</h2>`;

  const grid = el('div', 'grid grid-cols-1 md:grid-cols-2 gap-3');

  // === 借阅区升级（可运作） ===
  const lv = state.library.borrowLevel || 0;
  const lvNames = ['未建造', '陋室', '整洁', '开放', '舒适', '精致', '优雅', '圣所'];
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
      <p class="text-xs text-ink-light mb-2">${
        lv === 0 ? '在馆1人 · 购买升级以容纳更多访客'
        : (() => { const c = getBorrowLevelConfig(); return `在馆${c.cap}人 · 还书+${c.returnCoins}💰 · 好感+${c.favorBonus}% · 氛围+${c.returnAtmo}`; })()
      }</p>
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
        updateStatusBar();
        renderShopPage();
      } else {
        alert('智慧之光不足 💰');
      }
    });
  }

  grid.appendChild(readingCard);

  // === 缮写室升级 ===
  const flv = state.library.focusLevel || 0;
  const flvNames = ['残破', '陋室', '整洁', '明亮', '静雅', '华美', '缮写圣堂'];
  const fprice = getFocusLevelPrice();
  const fmaxed = flv >= 6;

  const focusCard = el('div', 'bg-white rounded-xl p-4 border-2 border-magic-gold/30 flex gap-4 items-center');

  // 缮写室素材文件名映射（lv0~lv6 各一张）
  const fimgNames = [
    'focusroom_lv0_final_0.jpg',
    'focusroom_lv1_no_text_0.jpg',
    'focusroom_lv2_final_0.jpg',
    'focusroom_lv3_final_1.jpg',
    'focusroom_lv4_final_0.jpg',
    'focusroom_lv5_final_1.jpg',
    'focusroom_lv6_sanctuary_16x9_1.jpg'
  ];
  const fimgActualSrc = flv >= 0 ? `visual/focusroom/${fimgNames[flv]}` : '';

  focusCard.innerHTML = `
    <div class="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-wood/10 flex items-center justify-center">
      ${fimgActualSrc
        ? `<img src="${fimgActualSrc}" alt="缮写室Lv${flv}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<span class=text-3xl>🖋️</span>'">`
        : '<span class="text-3xl">🖋️</span>'}
    </div>
    <div class="flex-1">
      <div class="flex items-center gap-2 mb-1">
        <span class="font-bold">🖋️ 缮写室</span>
        <span class="text-xs bg-magic-gold/20 text-magic-gold px-2 py-0.5 rounded-full">Lv.${flv} · ${flvNames[flv]}</span>
      </div>
      <p class="text-xs text-ink-light mb-2">${
        flv === 0 ? '残破的缮写室，修缮可提升誊抄速度'
        : `誊抄速度 +${flv * 5}%`
      }</p>
      ${fmaxed
        ? '<span class="text-sm text-magic-gold font-bold">已满级 ✨</span>'
        : `<button class="upgrade-focus-btn px-4 py-1.5 bg-magic-gold text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all">升级 💰${fprice.toLocaleString()}</button>`
      }
    </div>
  `;

  const fUpgradeBtn = focusCard.querySelector('.upgrade-focus-btn');
  if (fUpgradeBtn) {
    fUpgradeBtn.addEventListener('click', () => {
      if (upgradeFocusLevel()) {
        updateStatusBar();
        renderShopPage();
        showFocusRoomUpgrade(state.library.focusLevel);
      } else {
        alert('智慧之光不足 💰');
      }
    });
  }

  grid.appendChild(focusCard);

  // === 位面传送门 ===
  const pastoral = PLANES.pastoral;
  if (pastoral && pastoral.unlock) {
    const portalKey = pastoral.unlock.shopUpgrade;
    const portalPurchased = state.library.planePortals && state.library.planePortals[portalKey];
    const canPurchase = canUnlockPlane('pastoral', state) && !portalPurchased;
    const meetsReqs = (state.library.atmosphere || 0) >= pastoral.unlock.atmo
      && Object.values(state.books || {}).filter(b => b && b.status !== 'locked').length >= pastoral.unlock.books;

    if (!portalPurchased || canPurchase) {
      const portalCard = el('div', `bg-white rounded-xl p-4 border-2 flex gap-4 items-center ${
        canPurchase ? 'border-magic-gold/50 hover:shadow-lg transition-all cursor-pointer' : 'border-dashed border-gray-300 opacity-70'
      }`);
      const price = getPlanePortalPrice('pastoral');

      portalCard.innerHTML = `
        <span class="text-3xl">${pastoral.emoji}</span>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-bold">${pastoral.name}</span>
            ${portalPurchased
              ? '<span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">已解锁</span>'
              : meetsReqs
                ? '<span class="text-xs bg-magic-gold/20 text-magic-gold px-2 py-0.5 rounded-full">可建造</span>'
                : '<span class="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">条件不足</span>'
            }
          </div>
          <p class="text-xs text-ink-light mb-2">${pastoral.desc}</p>
          ${!meetsReqs
            ? `<p class="text-xs text-ink-light/60">需要：氛围 ≥${pastoral.unlock.atmo} · 拥有 ≥${pastoral.unlock.books} 本书</p>`
            : canPurchase
              ? `<button class="portal-purchase-btn px-4 py-1.5 bg-magic-gold text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all">开启传送门 💰${price.toLocaleString()}</button>`
              : ''
          }
        </div>
      `;

      const purchaseBtn = portalCard.querySelector('.portal-purchase-btn');
      if (purchaseBtn) {
        purchaseBtn.addEventListener('click', () => {
          if (purchasePlanePortal('pastoral')) {
            updateStatusBar();
            renderShopPage();
          } else {
            alert('智慧之光不足 💰');
          }
        });
      }

      grid.appendChild(portalCard);
    }
  }

  // === 空白铭牌（氛围≥80 时可命名） ===
  const atmo = state.library.atmosphere || 0;
  const showPlaque = atmo >= 80 && !state.library.nameLocked;

  if (showPlaque) {
    const plaqueCard = el('div', 'bg-white rounded-xl p-4 border-2 border-magic-gold/50 flex gap-4 items-center cursor-pointer hover:shadow-lg transition-all');
    plaqueCard.innerHTML = `
      <span class="text-3xl">🏷️</span>
      <div class="flex-1">
        <span class="font-bold text-sm">空白铭牌</span>
        <p class="text-xs text-ink-light mt-1">为这座图书馆赋予真正的名字</p>
      </div>
      <span class="text-magic-gold text-sm font-bold">免费</span>
    `;
    plaqueCard.addEventListener('click', showNamingModal);
    grid.appendChild(plaqueCard);
  }

  // === 三个占位项 ===
  const placeholders = [
    { icon: '📜', name: '古籍修复室', desc: '修复损毁珍本' },
    { icon: '☕', name: '咖啡角', desc: '延长访客停留时间' },
    { icon: '🔬', name: '研究区', desc: '深度研究书籍获得加成' },
    { icon: '🚪', name: '位面串门', desc: '参观其他馆长的图书馆' },
    { icon: '📨', name: '书籍漂流', desc: '将誊抄的书复印赠予友人' },
    { icon: '🌟', name: '联合修复', desc: '全服馆长协力解锁限定书籍' }
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
        <div class="text-xs text-magic-blue shop-countdown" data-soldat="${slot.soldAt}">⏰ ${soldText}</div>
      </div>
    `;
    return card;
  }

  card.innerHTML = `
    <div class="text-center">
      ${poolEntry.starter ? '<div class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full inline-block mb-1 font-bold">🌱 新手推荐</div>' : ''}
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
    ${state.coins < price ? '<p class="text-xs text-red-500 text-center mt-2">智慧之光不足 💰</p>' : ''}
  `;

  overlay.appendChild(content);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();

  content.querySelector('.cancel-btn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const confirmBtn = content.querySelector('.confirm-btn');
  confirmBtn.addEventListener('click', () => {
    if (state.coins < price) {
      alert('智慧之光不足 💰');
      return;
    }
    if (purchaseBook(poolEntry.bookId, price)) {
      updateStatusBar();
      overlay.remove();
      renderShopPage();
      const bookAch = checkAchievements('purchase_book');
      bookAch.forEach(a => showAchievementToast(a));
    }
  });
}

// ========== 命名弹窗 ==========

function showNamingModal() {
  const overlay = el('div', 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4');

  const content = el('div', 'parchment-bg rounded-2xl p-6 max-w-md w-full magic-glow animate-scale-in');
  content.innerHTML = `
    <div class="text-center mb-6">
      <div class="text-5xl mb-3">🏷️</div>
      <h3 class="font-display text-xl font-bold mb-2">为图书馆命名</h3>
      <p class="text-sm text-ink-light">
        这座归墟中的图书馆已初现生机。<br>
        给它一个名字吧——一个只属于你的名字。
      </p>
    </div>
    <div class="mb-4">
      <input id="naming-input" type="text" maxlength="12"
        class="w-full px-4 py-3 rounded-lg border-2 border-wood/30 bg-white text-center font-display text-lg focus:border-magic-gold focus:outline-none transition-all"
        placeholder="${state.library.name}" value="">
      <p class="text-xs text-ink-light text-center mt-2" id="naming-hint">最多12个字</p>
    </div>
    <div class="flex justify-center gap-3">
      <button class="cancel-name-btn px-6 py-2.5 bg-wood/20 text-ink-light rounded-lg font-bold hover:bg-wood/30 transition-all">再说吧</button>
      <button class="confirm-name-btn px-6 py-2.5 bg-magic-gold text-white rounded-lg font-bold hover:shadow-lg transition-all">铭刻此名</button>
    </div>
  `;

  overlay.appendChild(content);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  const input = content.querySelector('#naming-input');
  const hint = content.querySelector('#naming-hint');

  // 实时字数提示
  input.addEventListener('input', () => {
    const len = input.value.length;
    hint.textContent = len > 12 ? `已超出 ${len - 12} 字` : `最多${12 - len}字`;
    hint.className = `text-xs text-center mt-2 ${len > 12 ? 'text-red-500' : 'text-ink-light'}`;
  });

  // 回车确认
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmName();
  });

  content.querySelector('.cancel-name-btn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  function confirmName() {
    const rawName = input.value.trim();
    const finalName = rawName || state.library.name; // 没填则保留默认名

    if (finalName.length > 12) {
      hint.textContent = '名称过长，请精简到12字以内';
      hint.className = 'text-xs text-center mt-2 text-red-500';
      return;
    }

    state.library.name = finalName;
    state.library.nameLocked = true;
    saveState();
    // 刷新顶部导航栏名称
    const nameEl = document.getElementById('nav-library-name');
    if (nameEl) nameEl.textContent = finalName;
    overlay.remove();
    renderShopPage();
    // 刷新馆长办公室（如果正在显示）
    if (typeof window.renderLibraryPage === 'function') {
      window.renderLibraryPage();
    }
  }

  content.querySelector('.confirm-name-btn').addEventListener('click', confirmName);

  // 自动聚焦输入框
  setTimeout(() => input.focus(), 100);
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

// ========== 馆内装潢 ==========

function renderDecorationShop() {
  const section = el('div', 'parchment-bg rounded-2xl p-6 magic-glow');
  section.innerHTML = `<h2 class="font-display text-xl font-bold mb-4">🏺 馆内装潢</h2>`;

  const grid = el('div', 'grid grid-cols-1 md:grid-cols-2 gap-3');
  const plant = state.plant;

  // === 植物盆栽 ===
  if (!plant.activeType || plant.level === 0) {
    // 空盆状态 —— 展示可购买的植物种类
    Object.values(PLANT_TYPES).forEach(pt => {
      const card = el('div', 'bg-white rounded-xl p-4 border-2 border-green-200 flex gap-4 items-center hover:shadow-lg transition-all cursor-pointer');
      const cost = pt.fertilizeCosts[1];
      const canAfford = state.coins >= cost;
      card.innerHTML = `
        <span class="text-4xl">${pt.emoji}</span>
        <div class="flex-1">
          <div class="font-bold">${pt.name}</div>
          <p class="text-xs text-ink-light mt-1">${pt.description}</p>
          <div class="flex items-center gap-2 mt-2">
            <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">🌱 Lv1~5 成长</span>
            <span class="text-xs text-ink-light">浇水+施肥培育</span>
          </div>
        </div>
        <button class="plant-buy-btn px-4 py-1.5 ${canAfford ? 'bg-green-600 text-white hover:shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'} rounded-lg text-sm font-bold transition-all"
          ${!canAfford ? 'disabled' : ''}>
          💰${cost.toLocaleString()}
        </button>
      `;
      if (canAfford) {
        card.querySelector('.plant-buy-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          if (plantSeed(pt.id)) {
            updateStatusAndRefresh();
            if (typeof window.renderLibraryPage === 'function') window.renderLibraryPage();
          } else {
            alert('购买失败');
          }
        });
      }
      grid.appendChild(card);
    });
  } else {
    // 已种植 —— 显示当前植物状态
    const def = PLANT_TYPES[plant.activeType];
    if (def) {
      const plantCard = renderActivePlantCard(def, plant);
      grid.appendChild(plantCard);
    }
  }

  // === 标志牌 ===
  Object.values(SIGNBOARDS).forEach(sb => {
    const owned = state.signboards.includes(sb.id);
    const card = el('div', `rounded-xl p-4 border-2 flex gap-3 items-center ${owned ? 'bg-green-50 border-green-200 opacity-80' : 'bg-white border-wood/20 hover:border-magic-gold/50 hover:shadow-lg transition-all'}`);
    card.innerHTML = `
      <span class="text-3xl">${sb.emoji}</span>
      <div class="flex-1">
        <div class="font-bold text-sm flex items-center gap-2">
          ${sb.name}
          ${owned ? '<span class="text-xs bg-green-200 text-green-700 px-1.5 py-0.5 rounded">✅ 已拥有</span>' : ''}
        </div>
        <p class="text-xs text-ink-light">${sb.description}</p>
        <p class="text-xs text-ink-light mt-0.5">📌 挂在${getPageName(sb.page)}页面</p>
      </div>
      ${!owned
        ? `<button class="signboard-buy-btn px-3 py-1.5 ${state.coins >= sb.price ? 'bg-magic-gold text-white hover:shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'} rounded-lg text-sm font-bold transition-all"
            ${state.coins < sb.price ? 'disabled' : ''}>
            💰${sb.price}
           </button>`
        : ''}
    `;
    if (!owned && state.coins >= sb.price) {
      card.querySelector('.signboard-buy-btn').addEventListener('click', () => {
        if (purchaseSignboard(sb.id)) {
          updateStatusAndRefresh();
          if (typeof window.renderLibraryPage === 'function') window.renderLibraryPage();
        } else {
          alert('智慧之光不足 💰');
        }
      });
    }
    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}

function renderActivePlantCard(def, plant) {
  const card = el('div', 'bg-white rounded-xl p-4 border-2 border-green-300 flex gap-4 items-start');
  const progressPercent = Math.min(100, Math.round((plant.growthProgress / def.growthPerLevel) * 100));
  const levelName = def.levelNames[plant.level] || '';
  const canHarvestNow = canHarvest();
  const canWaterNow = canWater();
  const canFertNow = canFertilize();

  card.innerHTML = `
    <span class="text-5xl flex-shrink-0">${def.emoji}</span>
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <span class="font-bold">${def.name}</span>
        <span class="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">Lv.${plant.level} · ${levelName}</span>
      </div>
      <div class="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div class="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all" style="width:${progressPercent}%"></div>
      </div>
      <div class="text-xs text-ink-light mb-2">
        成长进度 ${progressPercent}% · 💧浇水 ${plant.waterAvailable}次可用
      </div>
      <div class="flex gap-2 flex-wrap">
        ${canHarvestNow
          ? `<button class="harvest-btn px-4 py-1.5 bg-yellow-500 text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all">🌾 收获</button>`
          : `
            <button class="water-btn px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all ${!canWaterNow ? 'opacity-50 cursor-not-allowed' : ''}"
              ${!canWaterNow ? 'disabled' : ''}>💧 浇水 (+${def.waterGrowth}进度)</button>
            <button class="fertilize-btn px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all ${!canFertNow ? 'opacity-50 cursor-not-allowed' : ''}"
              ${!canFertNow ? 'disabled' : ''}>
              🧪 施肥 (+${def.fertilizeGrowth}进度 · 💰${def.fertilizeCosts[plant.level + 1] || 0})
            </button>
          `}
      </div>
      ${canHarvestNow ? '<p class="text-xs text-yellow-600 mt-2">✨ 可以收获了！将获得氛围 + 智慧之光，概率掉落种子</p>' : ''}
      <p class="text-xs text-ink-light mt-1">
        ${plant.level < 5 ? `下一级施肥花费 💰${def.fertilizeCosts[plant.level + 1] || def.fertilizeCosts[5]}` : '已满级，成长满后可收获'}
      </p>
    </div>
  `;

  // 浇水按钮
  const waterBtn = card.querySelector('.water-btn');
  if (waterBtn && canWaterNow) {
    waterBtn.addEventListener('click', () => {
      waterPlant();
      renderShopPage();
    });
  }

  // 施肥按钮
  const fertBtn = card.querySelector('.fertilize-btn');
  if (fertBtn && canFertNow) {
    fertBtn.addEventListener('click', () => {
      fertilizePlant();
      renderShopPage();
    });
  }

  // 收获按钮
  const harvestBtn = card.querySelector('.harvest-btn');
  if (harvestBtn) {
    harvestBtn.addEventListener('click', () => {
      const result = harvestPlant();
      if (result) {
        updateStatusAndRefresh();
        if (typeof window.renderLibraryPage === 'function') window.renderLibraryPage();
      }
    });
  }

  return card;
}

function getPageName(page) {
  const names = { focus: '缮写室', visitors: '读者沙龙', bookshelf: '大书库', shop: '位面商店', library: '馆长办公室', archive: '馆史档案' };
  return names[page] || page;
}

function updateStatusAndRefresh() {
  updateStatusBar();
  renderShopPage();
}

// 仅更新倒计时文本，避免每秒重建整个商店DOM
function updateCountdowns() {
  const els = document.querySelectorAll('.shop-countdown');
  if (els.length === 0) {
    cleanupTimer();
    return;
  }
  let anyExpired = false;
  els.forEach(el => {
    const soldAt = parseInt(el.dataset.soldat, 10);
    if (!soldAt) return;
    const remaining = 24 * 3600 * 1000 - (Date.now() - soldAt);
    if (remaining <= 0) {
      anyExpired = true;
    } else {
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      el.textContent = `⏰ 补货中 ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
  });
  // 有倒计时归零时触发一次完整刷新（补货逻辑在 ensureShopState 中）
  if (anyExpired) {
    cleanupTimer();
    renderShopPage();
  }
}

function cleanupTimer() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

window.renderShopPage = renderShopPage;
