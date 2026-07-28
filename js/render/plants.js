// 馆内布置子标签渲染 —— 植物状态 + 标志牌展示 + 种子库存
import { state, saveState } from '../state.js';
import { updateStatusBar } from './common.js';
import { PLANT_TYPES, SEED_EXCHANGE } from '../../data/plants.js';
import { SIGNBOARDS } from '../../data/signboards.js';
import { canHarvest, harvestPlant, canExchangeSeed, exchangeSeed, getActivePlantDef, canWater, canFertilize } from '../plants.js';
import { t } from '../i18n/terms.js';

export function renderDecorationPage() {
  const container = document.getElementById('decoration-content');
  if (!container) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'space-y-6';

  // ========== 植物区 ==========
  wrapper.appendChild(renderPlantArea());

  // ========== 种子库存 ==========
  wrapper.appendChild(renderSeedInventory());

  // ========== 标志牌收集 ==========
  wrapper.appendChild(renderSignboardCollection());

  // ========== 将来造景贴纸区占位 ==========
  wrapper.appendChild(renderStickerPlaceholder());

  container.innerHTML = '';
  container.appendChild(wrapper);
}

function renderPlantArea() {
  const section = document.createElement('div');
  section.className = 'bg-white/60 rounded-xl p-5 border-2 border-green-200';

  const plant = state.plant;
  const header = document.createElement('h3');
  header.className = 'font-bold text-lg mb-3 flex items-center gap-2';
  header.innerHTML = '🌱 盆栽';

  section.appendChild(header);

  if (!plant.activeType || plant.level === 0) {
    const empty = document.createElement('div');
    empty.className = 'text-center py-8';
    empty.innerHTML = `
      <div class="text-5xl mb-3">🪴</div>
      <p class="text-ink-light mb-2">盆栽空空如也</p>
      <p class="text-xs text-ink-light">前往 <span class="text-magic-gold font-bold">位面商店 → 馆内装潢</span> 购买一盆植物吧</p>
    `;
    section.appendChild(empty);
    return section;
  }

  const def = PLANT_TYPES[plant.activeType];
  if (!def) return section;

  const progressPercent = Math.min(100, Math.round((plant.growthProgress / def.growthPerLevel) * 100));
  const levelName = def.levelNames[plant.level] || '';
  const canHarvestNow = canHarvest();
  const canWaterNow = canWater();
  const canFertNow = canFertilize();

  const card = document.createElement('div');
  card.className = 'flex gap-5 items-center flex-wrap';
  card.innerHTML = `
    <div class="text-6xl flex-shrink-0">${def.emoji}</div>
    <div class="flex-1 min-w-[200px]">
      <div class="flex items-center gap-2 mb-2">
        <span class="font-bold text-lg">${def.name}</span>
        <span class="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">Lv.${plant.level} · ${levelName}</span>
      </div>
      <div class="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div class="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all" style="width:${progressPercent}%"></div>
      </div>
      <p class="text-xs text-ink-light mb-3">成长进度 ${progressPercent}% · 可浇水 ${plant.waterAvailable} 次</p>
      <div class="flex gap-2 flex-wrap">
        ${canHarvestNow
          ? `<button id="dec-harvest-btn" class="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all">🌾 收获 (氛围+${def.harvestAtmosphere} 💰+${def.harvestCoins})</button>`
          : `<p class="text-xs text-ink-light">💧 前往 <span class="text-magic-gold font-bold cursor-pointer underline" onclick="window.switchTab('shop')">位面商店 → 馆内装潢</span> 进行浇水和施肥</p>`
        }
      </div>
      ${canHarvestNow
        ? `<p class="text-xs text-yellow-600 mt-3">✨ 可以收获了！将以${Math.round(def.seedDropRate * 100)}%概率获得种子</p>`
        : `<p class="text-xs text-ink-light mt-2">${plant.level < 5 ? `下一级施肥所需 💰${def.fertilizeCosts[plant.level + 1] || 0}` : '进度满即可收获'}</p>`
      }
    </div>
  `;

  // 绑定按钮事件（布置页仅保留收获操作）
  const refresh = () => renderDecorationPage();

  const harvestBtn = card.querySelector('#dec-harvest-btn');
  if (harvestBtn) {
    harvestBtn.addEventListener('click', () => {
      const result = harvestPlant();
      if (result) {
        showPlantHarvestPopup(def, result);
      }
      updateStatusBar();
      if (typeof window.renderShopPage === 'function') window.renderShopPage();
      refresh();
    });
  }

  section.appendChild(card);
  return section;
}

// ========== 种子库存 ==========

function renderSeedInventory() {
  const section = document.createElement('div');
  section.className = 'bg-white/60 rounded-xl p-5 border-2 border-amber-200';

  section.innerHTML = '<h3 class="font-bold text-lg mb-3 flex items-center gap-2">🌰 种子库存</h3>';

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-3';

  let hasAny = false;

  Object.entries(SEED_EXCHANGE).forEach(([seedType, config]) => {
    hasAny = true;
    const count = state.seeds[seedType] || 0;
    const canExchange = canExchangeSeed(seedType);
    const bookOwned = state.books[config.rewardBookId] && state.books[config.rewardBookId].status !== 'locked';
    // 找到对应植物的 emoji
    const plantDef = Object.values(PLANT_TYPES).find(p => p.seedType === seedType);
    const emoji = plantDef ? plantDef.emoji : '🌰';

    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl p-4 border-2 border-wood/20 flex items-center gap-3';

    const ownedText = bookOwned ? '✅ 已拥有' : '';
    const canExchangeText = canExchange ? '可兑换' : '';

    card.innerHTML = `
      <span class="text-3xl">${emoji}</span>
      <div class="flex-1">
        <div class="font-bold text-sm">${plantDef ? plantDef.name : seedType} 种子</div>
        <p class="text-xs text-ink-light">收集进度 ${count}/${config.required} · 可换《${config.rewardTitle}》</p>
      </div>
      <div class="text-right">
        <div class="font-bold text-lg text-amber-700">🌰 ×${count}</div>
        ${bookOwned
          ? '<span class="text-xs text-green-600 font-bold">✅ 已拥有</span>'
          : canExchange
            ? `<button class="exchange-btn px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold hover:shadow transition-all">兑换 🎁</button>`
            : `<span class="text-xs text-ink-light">还需 ${config.required - count} 颗</span>`
        }
      </div>
    `;

    const exchangeBtn = card.querySelector('.exchange-btn');
    if (exchangeBtn) {
      exchangeBtn.addEventListener('click', () => {
        if (exchangeSeed(seedType)) {
          // 刷新
          if (typeof window.renderBookshelfPage === 'function') window.renderBookshelfPage();
          renderDecorationPage();
        }
      });
    }

    grid.appendChild(card);
  });

  if (!hasAny) {
    grid.innerHTML = '<p class="text-sm text-ink-light col-span-2 text-center py-4">还没有种子。种植并收获植物来获取种子吧！</p>';
  }

  section.appendChild(grid);
  return section;
}

// ========== 标志牌收集 ==========

function renderSignboardCollection() {
  const section = document.createElement('div');
  section.className = 'bg-white/60 rounded-xl p-5 border-2 border-magic-gold/20';

  section.innerHTML = '<h3 class="font-bold text-lg mb-3 flex items-center gap-2">🪧 标志牌</h3>';

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3';

  const owned = state.signboards || [];

  if (owned.length === 0) {
    grid.innerHTML = '<p class="text-sm text-ink-light col-span-full text-center py-4">还没有标志牌。前往 <span class="text-magic-gold font-bold">位面商店 → 馆内装潢</span> 购买吧</p>';
    section.appendChild(grid);
    return section;
  }

  Object.values(SIGNBOARDS).forEach(sb => {
    const isOwned = owned.includes(sb.id);
    if (!isOwned) return;

    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl p-3 border-2 border-magic-gold/30 text-center hover:shadow-md transition-all';
    const buffNote = sb.buff && sb.buff.desc ? `<div class="text-xs text-magic-gold/70 mt-1 italic">${sb.buff.desc}</div>` : '';
    card.innerHTML = `
      <div class="text-3xl mb-2">${sb.emoji}</div>
      <div class="font-bold text-xs">${sb.name}</div>
      <div class="text-xs text-ink-light mt-1">📌 ${getPageDisplayName(sb.page)}</div>
      ${buffNote}
    `;
    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}

function getPageDisplayName(page) {
  const names = { focus: '缮写室', visitors: '读者沙龙', bookshelf: '大书库', shop: '位面商店', library: '馆长办公室', archive: '馆史档案' };
  return names[page] || page;
}

// ========== 将来造景贴纸区占位 ==========

function renderStickerPlaceholder() {
  const section = document.createElement('div');
  section.className = 'bg-gray-100 rounded-xl p-5 border-2 border-dashed border-gray-300 text-center';
  section.innerHTML = `
    <div class="text-3xl mb-2">🎨</div>
    <p class="text-sm text-ink-light font-bold">造景贴纸</p>
    <p class="text-xs text-ink-light mt-1">将盆栽和标志牌拖放布置到图书馆场景中</p>
    <span class="text-xs text-ink-light bg-gray-200 px-2 py-0.5 rounded mt-2 inline-block">🏗️ 规划中…</span>
  `;
  return section;
}

// ========== 植物弹窗 ==========

/** 植物成熟提示（右下角自动消失卡片） */
export function showPlantMaturityToast(def) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed bottom-6 right-6 z-[120] animate-slide-in-right';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-xl p-5 shadow-2xl border-2 border-yellow-400/30 max-w-xs">
      <div class="flex items-start gap-3">
        <div class="text-4xl">${def.emoji}</div>
        <div class="flex-1 min-w-0">
          <p class="text-xs text-yellow-600 font-bold mb-1">${t('plantMatured')}</p>
          <p class="text-ink font-bold">${def.name}</p>
          <p class="text-ink-light text-xs">${t('plantMaturedHint').replace('{name}', def.name)}</p>
        </div>
        <button class="plant-toast-close text-ink-light/50 hover:text-ink ml-2 text-sm leading-none">&times;</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => overlay.remove(), 300);
  };
  overlay.querySelector('.plant-toast-close').addEventListener('click', close);
  overlay.addEventListener('click', close);
  setTimeout(close, 8000);
}

/** 植物收获奖励弹窗 */
export function showPlantHarvestPopup(def, result) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4';
  const seedText = result.seedDropped
    ? `<p class="text-sm text-magic-gold font-bold mb-2">🌰 ${t('seedObtained').replace('{name}', def.name)}</p>`
    : '';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-2xl p-6 max-w-sm w-full text-center magic-glow animate-scale-in">
      <div class="text-5xl mb-3">${def.emoji}</div>
      <div class="text-yellow-600 text-sm mb-2 font-bold">${t('plantHarvested')}</div>
      <h3 class="font-display text-xl font-bold mb-2">${def.name}</h3>
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="bg-white/60 rounded-lg p-3">
          <div class="text-lg font-bold text-magic-blue">+${def.harvestAtmosphere}</div>
          <div class="text-xs text-ink-light">${t('atmosphere')}</div>
        </div>
        <div class="bg-white/60 rounded-lg p-3">
          <div class="text-lg font-bold text-magic-gold">+${def.harvestCoins}</div>
          <div class="text-xs text-ink-light">${t('coins')}</div>
        </div>
      </div>
      ${seedText}
      <p class="text-xs text-ink-light mb-4">${t('plantHarvestEmptyPot')}</p>
      <button class="px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">${t('continueBtn')}</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => overlay.remove(), 300);
  };
  overlay.querySelector('button').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
}
