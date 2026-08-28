// 馆内布置子标签渲染 —— 植物状态 + 标志牌展示 + 种子库存
import { state, saveState } from '../state.js';
import { updateStatusBar, showImagePreview } from './common.js';
import { PLANT_TYPES, SEED_EXCHANGE } from '../../data/plants.js';
import { SIGNBOARDS } from '../../data/signboards.js';
import { canHarvest, harvestPlant, canExchangeSeed, exchangeSeed, getActivePlantDef, canWater, canFertilize, abandonPlant, getSeedExchanges, waterPlant, fertilizePlant } from '../plants.js';
import { t } from '../i18n/terms.js';

export function renderDecorationPage() {
  const container = document.getElementById('decoration-content');
  if (!container) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'space-y-6';

  wrapper.appendChild(renderPlantArea());
  wrapper.appendChild(renderSeedInventory());
  wrapper.appendChild(renderSignboardCollection());
  wrapper.appendChild(renderStickerPlaceholder());

  container.innerHTML = '';
  container.appendChild(wrapper);
}

// 植物立绘渲染：预加载探测，失败回退 emoji
export function renderPlantArt(def, level, size = null) {
  if (!def) return document.createTextNode('');

  const src = def.art?.[level] || def.art?.[1];
  const fallbackEmoji = def.emoji || '🪴';
  const wrap = document.createElement('span');
  wrap.className = 'plant-art inline-block';

  const finalSize = size || (48 + level * 12); // Lv1 60 → Lv5 96
  wrap.style.width = `${finalSize}px`;
  wrap.style.height = `${finalSize}px`;
  wrap.style.display = 'inline-flex';
  wrap.style.alignItems = 'center';
  wrap.style.justifyContent = 'center';

  if (!src) {
    wrap.textContent = fallbackEmoji;
    wrap.style.fontSize = `${Math.round(finalSize * 0.7)}px`;
    return wrap;
  }

  const img = new Image();
  img.onload = () => {
    wrap.innerHTML = '';
    const el = document.createElement('img');
    el.src = src;
    el.alt = t(def.nameKey);
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.objectFit = 'contain';
    wrap.appendChild(el);
  };
  img.onerror = () => {
    wrap.innerHTML = '';
    wrap.textContent = fallbackEmoji;
    wrap.style.fontSize = `${Math.round(finalSize * 0.7)}px`;
  };
  img.src = src;

  // 占位 emoji，加载成功/失败后会替换
  wrap.textContent = fallbackEmoji;
  wrap.style.fontSize = `${Math.round(finalSize * 0.7)}px`;
  return wrap;
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
      <div class="mb-3 flex justify-center">
        <img src="visual/plants/plant_16_empty_pot.png" alt="空花盆" class="w-24 h-24 object-contain opacity-80">
      </div>
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

  const card = document.createElement('div');
  card.className = 'flex gap-5 items-center flex-wrap';

  const artWrap = document.createElement('div');
  artWrap.className = 'flex-shrink-0';
  artWrap.appendChild(renderPlantArt(def, plant.level));
  card.appendChild(artWrap);

  const info = document.createElement('div');
  info.className = 'flex-1 min-w-[200px]';
  info.innerHTML = `
    <div class="flex items-center gap-2 mb-2">
      <span class="font-bold text-lg">${t(def.nameKey)}</span>
      <span class="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">Lv.${plant.level} · ${levelName}</span>
    </div>
    <div class="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
      <div class="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all" style="width:${progressPercent}%"></div>
    </div>
    <p class="text-xs text-ink-light mb-3">成长进度 ${progressPercent}% · 可浇水 ${plant.waterAvailable} 次</p>
    <div class="flex gap-2 flex-wrap" id="dec-plant-actions"></div>
    ${canHarvestNow
      ? `<p class="text-xs text-yellow-600 mt-3">✨ 可以收获了！将以${Math.round(def.seedDropRate * 100)}%概率获得种子</p>`
      : `<p class="text-xs text-ink-light mt-2">${plant.level < 5 ? `下一级施肥所需 💰${def.fertilizeCosts[plant.level + 1] || 0}` : '进度满即可收获'}</p>`
    }
  `;
  card.appendChild(info);

  const actions = info.querySelector('#dec-plant-actions');

  // 收获按钮
  if (canHarvestNow) {
    const harvestBtn = document.createElement('button');
    harvestBtn.className = 'px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all';
    harvestBtn.innerHTML = `🌾 收获 (氛围+${def.harvestAtmosphere} 💰+${def.harvestCoins})`;
    harvestBtn.addEventListener('click', () => {
      const result = harvestPlant();
      if (result) showPlantHarvestPopup(def, result);
      updateStatusBar();
      if (typeof window.renderShopPage === 'function') window.renderShopPage();
      renderDecorationPage();
    });
    actions.appendChild(harvestBtn);
  } else {
    // 浇水按钮
    const canWaterNow = canWater();
    const waterBtn = document.createElement('button');
    waterBtn.className = `px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all ${!canWaterNow ? 'opacity-50 cursor-not-allowed' : ''}`;
    waterBtn.disabled = !canWaterNow;
    waterBtn.innerHTML = `💧 浇水 (+${def.waterGrowth})`;
    waterBtn.addEventListener('click', () => {
      const result = waterPlant();
      if (result.ok && result.justMatured) showPlantMaturityToast(def);
      renderDecorationPage();
      if (typeof window.renderShopPage === 'function') window.renderShopPage();
      updateStatusBar();
    });
    actions.appendChild(waterBtn);

    // 施肥按钮
    const canFertNow = canFertilize();
    const fertBtn = document.createElement('button');
    fertBtn.className = `px-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all ${!canFertNow ? 'opacity-50 cursor-not-allowed' : ''}`;
    fertBtn.disabled = !canFertNow;
    fertBtn.innerHTML = `✨ 施肥 (+${def.fertilizeGrowth} 💰${def.fertilizeCosts[plant.level + 1] || 0})`;
    fertBtn.addEventListener('click', () => {
      const result = fertilizePlant();
      if (result.ok && result.justMatured) showPlantMaturityToast(def);
      renderDecorationPage();
      if (typeof window.renderShopPage === 'function') window.renderShopPage();
      updateStatusBar();
    });
    actions.appendChild(fertBtn);
  }

  // 铲除按钮
  const abandonBtn = document.createElement('button');
  abandonBtn.className = 'px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:shadow-lg transition-all';
  abandonBtn.innerHTML = `🗑️ ${t('plantAbandon')}`;
  abandonBtn.addEventListener('click', () => {
    if (confirm(t('plantAbandonConfirm').replace('{name}', t(def.nameKey)))) {
      abandonPlant();
      renderDecorationPage();
      if (typeof window.renderShopPage === 'function') window.renderShopPage();
      updateStatusBar();
    }
  });
  actions.appendChild(abandonBtn);

  section.appendChild(card);
  return section;
}

// ========== 种子库存 ==========

function getRewardDisplay(item) {
  switch (item.type) {
    case 'book': return `📖《${t(item.rewardTitleKey)}》`;
    case 'coins': return `💰${item.value}`;
    case 'atmosphere': return `✨${item.value}`;
    case 'inspiration': return `💡${item.value}`;
    case 'seed': return `🌰 ${t(item.rewardTitleKey)} ×${item.count}`;
    default: return '';
  }
}

function renderSeedInventory() {
  const section = document.createElement('div');
  section.className = 'bg-white/60 rounded-xl p-5 border-2 border-amber-200';

  section.innerHTML = '<h3 class="font-bold text-lg mb-3 flex items-center gap-2">🌰 种子库存</h3>';

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 gap-3';

  let hasAny = false;

  Object.keys(SEED_EXCHANGE).forEach(seedType => {
    const plantDef = Object.values(PLANT_TYPES).find(p => p.seedType === seedType);
    if (!plantDef) return;
    hasAny = true;

    const count = state.seeds[seedType] || 0;
    const exchanges = getSeedExchanges(seedType);

    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl p-4 border-2 border-wood/20';

    const header = document.createElement('div');
    header.className = 'flex items-center gap-3 mb-3';
    header.innerHTML = `
      <span class="text-3xl">${plantDef.emoji}</span>
      <div class="flex-1">
        <div class="font-bold text-sm">${t(plantDef.nameKey)} ${t('seed')}</div>
        <div class="text-xs text-ink-light">🌰 ×${count}</div>
      </div>
    `;
    card.appendChild(header);

    const list = document.createElement('div');
    list.className = 'space-y-2';

    exchanges.forEach(item => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between text-sm';

      const left = document.createElement('div');
      left.className = 'text-ink-light';
      left.innerHTML = `🌰 ×${item.required} → ${getRewardDisplay(item)}`;

      const right = document.createElement('div');
      if (item.exchanged) {
        right.innerHTML = `<span class="text-xs text-green-600 font-bold">✅ ${t('exchanged')}</span>`;
      } else if (item.canExchange) {
        const btn = document.createElement('button');
        btn.className = 'px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold hover:shadow transition-all';
        btn.textContent = t('exchange');
        btn.addEventListener('click', () => {
          if (exchangeSeed(seedType, item.index)) {
            if (typeof window.renderBookshelfPage === 'function') window.renderBookshelfPage();
            renderDecorationPage();
          }
        });
        right.appendChild(btn);
      } else {
        right.innerHTML = `<span class="text-xs text-ink-light">${t('needMoreSeeds').replace('{n}', item.required - count)}</span>`;
      }

      row.appendChild(left);
      row.appendChild(right);
      list.appendChild(row);
    });

    card.appendChild(list);
    grid.appendChild(card);
  });

  if (!hasAny) {
    grid.innerHTML = '<p class="text-sm text-ink-light text-center py-4">还没有种子。种植并收获植物来获取种子吧！</p>';
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
    const iconHtml = sb.image
      ? `<img src="${sb.image}" alt="${sb.name}" class="w-10 h-10 object-contain mx-auto mb-2 cursor-pointer" title="点击看大图" />`
      : `<div class="text-3xl mb-2">${sb.emoji}</div>`;
    card.innerHTML = `
      ${iconHtml}
      <div class="font-bold text-xs">${sb.name}</div>
      <div class="text-xs text-ink-light mt-1">📌 ${getPageDisplayName(sb.page)}</div>
      ${buffNote}
    `;

    const iconImg = card.querySelector('img');
    if (iconImg && sb.image) {
      iconImg.addEventListener('click', () => showImagePreview(sb.image, sb.name));
    }

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

export function showPlantMaturityToast(def) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed bottom-6 right-6 z-[120] animate-slide-in-right';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-xl p-5 shadow-2xl border-2 border-yellow-400/30 max-w-xs">
      <div class="flex items-start gap-3">
        <div class="text-4xl">${def.emoji}</div>
        <div class="flex-1 min-w-0">
          <p class="text-xs text-yellow-600 font-bold mb-1">${t('plantMatured')}</p>
          <p class="text-ink font-bold">${t(def.nameKey)}</p>
          <p class="text-ink-light text-xs">${t('plantMaturedHint').replace('{name}', t(def.nameKey))}</p>
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

export function showPlantHarvestPopup(def, result) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4';
  const seedText = result.seedDropped
    ? `<p class="text-sm text-magic-gold font-bold mb-2">🌰 ${t('seedObtained').replace('{name}', t(def.nameKey))}</p>`
    : '';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-2xl p-6 max-w-sm w-full text-center magic-glow animate-scale-in">
      <div class="text-5xl mb-3">${def.emoji}</div>
      <div class="text-yellow-600 text-sm mb-2 font-bold">${t('plantHarvested')}</div>
      <h3 class="font-display text-xl font-bold mb-2">${t(def.nameKey)}</h3>
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
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}

// 兼容旧版：直接传入 config 对象时也支持
export function showPlantSeedExchangePopup(seedType, config) {
  // 种子兑换成功提示已内联在 renderSeedInventory 中，此方法保留供外部调用
}
