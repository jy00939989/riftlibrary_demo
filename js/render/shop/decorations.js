// Decorations shop section — plant pot and signboards
import { state } from '../../state.js';
import { el, actions, updateStatusBar, showImagePreview } from '../common.js';
import { playSfx } from '../../audio.js';
import { PLANT_TYPES } from '../../../data/plants.js';
import { SIGNBOARDS } from '../../../data/signboards.js';
import {
  plantSeed, canFertilize, fertilizePlant, canWater, waterPlant,
  canHarvest, harvestPlant, abandonPlant
} from '../../plants.js';
import { showPlantMaturityToast, showPlantHarvestPopup, renderPlantArt } from '../plants.js';
import { purchaseSignboard } from '../../shop.js';
import { getPageName, t } from '../../i18n/terms.js';
import { updateStatusAndRefresh } from './utils.js';

export function renderDecorationShop() {
  const section = el('div', 'parchment-bg rounded-2xl p-6 magic-glow');
  section.innerHTML = `<h2 class="font-display text-xl font-bold mb-4">🏺 ${t('decoration')}</h2>`;

  const grid = el('div', 'grid grid-cols-1 md:grid-cols-2 gap-3');
  const plant = state.plant;

  // === Plant Pot ===
  if (!plant.activeType || plant.level === 0) {
    // Empty pot — show purchasable plant types
    Object.values(PLANT_TYPES).forEach(pt => {
      const card = el('div', 'bg-white rounded-xl p-4 border-2 border-green-200 flex gap-4 items-center hover:shadow-lg transition-all cursor-pointer');
      const cost = pt.fertilizeCosts[1];
      const canAfford = state.coins >= cost;

      const artWrap = document.createElement('div');
      artWrap.className = 'flex-shrink-0';
      artWrap.appendChild(renderPlantArt(pt, 1, 64));

      const info = el('div', 'flex-1');
      info.innerHTML = `
        <div class="font-bold">${t(pt.nameKey)}</div>
        <p class="text-xs text-ink-light mt-1">${t(pt.descKey)}</p>
        <div class="flex items-center gap-2 mt-2">
          <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">${t('plantGrowLevels')}</span>
          <span class="text-xs text-ink-light">${t('waterAndFertilize')}</span>
        </div>
      `;

      const btnWrap = document.createElement('div');
      btnWrap.className = 'flex-shrink-0';
      const btn = document.createElement('button');
      btn.className = `plant-buy-btn px-4 py-1.5 ${canAfford ? 'bg-green-600 text-white hover:shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'} rounded-lg text-sm font-bold transition-all`;
      btn.disabled = !canAfford;
      btn.innerHTML = `💰${cost.toLocaleString()}`;
      btnWrap.appendChild(btn);

      card.appendChild(artWrap);
      card.appendChild(info);
      card.appendChild(btnWrap);

      if (canAfford) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (plantSeed(pt.id)) {
            playSfx('buy_success');
            updateStatusAndRefresh();
            if (typeof window.renderLibraryPage === 'function') window.renderLibraryPage();
          } else {
            window.showToast(t('purchaseFailed'), 'error');
          }
        });
      }
      grid.appendChild(card);
    });
  } else {
    // Planted — show current plant status
    const def = PLANT_TYPES[plant.activeType];
    if (def) {
      const plantCard = renderActivePlantCard(def, plant);
      grid.appendChild(plantCard);
    }
  }

  // === Signboards ===
  Object.values(SIGNBOARDS).forEach(sb => {
    const owned = state.signboards.includes(sb.id);
    const serial = state.signboardSerials?.[sb.id];
    const isLimited = sb.price === 0 && sb.image;
    const serialBadge = owned && serial !== undefined
      ? `<span class="text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded" title="限量编号">NO.${serial}</span>`
      : '';
    const ownedBadge = owned
      ? `<span class="text-xs bg-green-200 text-green-700 px-1.5 py-0.5 rounded">✅ ${t('owned')}</span>${serialBadge}`
      : '';
    const actionBadge = !owned
      ? (isLimited
        ? `<span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold">${t('limitedSignboardLabel') || '兑换码获取'}</span>`
        : `<button class="signboard-buy-btn px-3 py-1.5 ${state.coins >= sb.price ? 'bg-magic-gold text-white hover:shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'} rounded-lg text-sm font-bold transition-all"
            ${state.coins < sb.price ? 'disabled' : ''}>
            💰${sb.price}
           </button>`)
      : '';
    const card = el('div', `rounded-xl p-4 border-2 flex gap-3 items-center ${owned ? 'bg-green-50 border-green-200 opacity-80' : 'bg-white border-wood/20 hover:border-magic-gold/50 hover:shadow-lg transition-all'}`);
    card.innerHTML = `
      ${renderSignboardIcon(sb)}
      <div class="flex-1">
        <div class="font-bold text-sm flex items-center gap-2">
          ${sb.name}
          ${ownedBadge}
        </div>
        <p class="text-xs text-ink-light">${sb.description}</p>
        <p class="text-xs text-ink-light mt-0.5">${t('hungOnPage').replace('{page}', getPageName(sb.page))}</p>
      </div>
      ${actionBadge}
    `;

    const iconImg = card.querySelector('img');
    if (iconImg && sb.image) {
      iconImg.classList.add('cursor-pointer');
      iconImg.title = '点击看大图';
      iconImg.addEventListener('click', () => showImagePreview(sb.image, sb.name));
    }

    const buyBtn = card.querySelector('.signboard-buy-btn');
    if (buyBtn && !owned && !isLimited && state.coins >= sb.price) {
      buyBtn.addEventListener('click', () => {
        if (purchaseSignboard(sb.id)) {
          playSfx('buy_success');
          updateStatusAndRefresh();
          if (typeof window.renderLibraryPage === 'function') window.renderLibraryPage();
        } else {
          window.showToast(`${t('insufficientCoins')} 💰`, 'error');
        }
      });
    }
    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}

export function renderActivePlantCard(def, plant) {
  const card = el('div', 'bg-white rounded-xl p-4 border-2 border-green-300 flex gap-4 items-start');
  const progressPercent = Math.min(100, Math.round((plant.growthProgress / def.growthPerLevel) * 100));
  const levelName = def.levelNames[plant.level] || '';
  const canHarvestNow = canHarvest();
  const canWaterNow = canWater();
  const canFertNow = canFertilize();

  const nextFertCost = def.fertilizeCosts[plant.level + 1] || def.fertilizeCosts[5] || 0;
  const footerText = plant.level < 5
    ? t('nextLevelFertilizerCost').replace('{cost}', nextFertCost)
    : t('maxLevelHarvestHint');

  const artWrap = document.createElement('div');
  artWrap.className = 'flex-shrink-0';
  artWrap.appendChild(renderPlantArt(def, plant.level, 80));

  const info = el('div', 'flex-1 min-w-0');
  info.innerHTML = `
    <div class="flex items-center gap-2 mb-1">
      <span class="font-bold">${t(def.nameKey)}</span>
      <span class="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">Lv.${plant.level} · ${levelName}</span>
    </div>
    <div class="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
      <div class="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all" style="width:${progressPercent}%"></div>
    </div>
    <div class="text-xs text-ink-light mb-2">
      ${t('growthProgress').replace('{value}', progressPercent)} · ${t('waterAvailableCount').replace('{n}', plant.waterAvailable)}
    </div>
    <div class="flex gap-2 flex-wrap" id="shop-plant-actions">
      ${canHarvestNow
        ? `<button class="harvest-btn px-4 py-1.5 bg-yellow-500 text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all">${t('harvest')}</button>`
        : `
          <button class="water-btn px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all ${!canWaterNow ? 'opacity-50 cursor-not-allowed' : ''}"
            ${!canWaterNow ? 'disabled' : ''}>${t('water')} ${t('waterGrowth').replace('{value}', def.waterGrowth)}</button>
          <button class="fertilize-btn px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all ${!canFertNow ? 'opacity-50 cursor-not-allowed' : ''}"
            ${!canFertNow ? 'disabled' : ''}>
            ${t('fertilize')} ${t('fertilizeCost').replace('{value}', def.fertilizeGrowth).replace('{cost}', def.fertilizeCosts[plant.level + 1] || 0)}
          </button>
        `}
    </div>
    ${canHarvestNow ? `<p class="text-xs text-yellow-600 mt-2">${t('canHarvestHint')}</p>` : ''}
    <p class="text-xs text-ink-light mt-1">${footerText}</p>
  `;

  card.appendChild(artWrap);
  card.appendChild(info);

  const actionsEl = info.querySelector('#shop-plant-actions');

  // 铲除按钮
  const abandonBtn = document.createElement('button');
  abandonBtn.className = 'px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:shadow-lg transition-all';
  abandonBtn.innerHTML = `🗑️ ${t('plantAbandon')}`;
  abandonBtn.addEventListener('click', () => {
    if (confirm(t('plantAbandonConfirm').replace('{name}', t(def.nameKey)))) {
      abandonPlant();
      updateStatusAndRefresh();
      if (typeof window.renderLibraryPage === 'function') window.renderLibraryPage();
    }
  });
  actionsEl.appendChild(abandonBtn);

  // Water button
  const waterBtn = card.querySelector('.water-btn');
  if (waterBtn && canWaterNow) {
    waterBtn.addEventListener('click', () => {
      const result = waterPlant();
      if (result.ok && result.justMatured) {
        showPlantMaturityToast(def);
      }
      if (actions.renderShopPage) {
        actions.renderShopPage();
      }
    });
  }

  // Fertilize button
  const fertBtn = card.querySelector('.fertilize-btn');
  if (fertBtn && canFertNow) {
    fertBtn.addEventListener('click', () => {
      const result = fertilizePlant();
      if (result.ok && result.justMatured) {
        showPlantMaturityToast(def);
      }
      if (actions.renderShopPage) {
        actions.renderShopPage();
      }
    });
  }

  // Harvest button
  const harvestBtn = card.querySelector('.harvest-btn');
  if (harvestBtn) {
    harvestBtn.addEventListener('click', () => {
      const result = harvestPlant();
      if (result) {
        showPlantHarvestPopup(def, result);
        updateStatusAndRefresh();
        if (typeof window.renderLibraryPage === 'function') window.renderLibraryPage();
      }
    });
  }

  return card;
}

function showLimitedSignboardPopup(signboard) {
  const modal = el('div', 'fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4');
  const content = el('div', 'parchment-bg rounded-2xl p-6 max-w-sm w-full text-center magic-glow relative overflow-hidden');
  const hasImage = signboard.image;
  const serial = state.signboardSerials?.[signboard.id];
  const serialText = serial !== undefined ? `NO.${serial} / ${signboard.maxCount || 10}` : '';

  content.innerHTML = `
    <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-magic-gold via-amber-300 to-magic-gold"></div>
    <div class="mb-4 mt-2">
      ${hasImage
        ? `<img src="${signboard.image}" alt="${signboard.name}" class="w-28 h-28 object-contain mx-auto drop-shadow-lg">`
        : `<span class="text-5xl inline-block">${signboard.emoji || '🏛️'}</span>`}
    </div>
    <h2 class="font-display text-lg font-bold text-ink mb-1">${t('limitedSignboardTitle')}</h2>
    <div class="text-base text-magic-gold font-bold mb-1">${signboard.name}</div>
    ${serialText ? `<div class="text-xs text-ink-light mb-2 font-mono tracking-wider">${serialText}</div>` : ''}
    <p class="text-xs text-ink-light leading-relaxed mb-4">${signboard.description}</p>
    <div class="bg-amber-50/50 rounded-lg p-3 mb-5 border border-amber-100">
      <p class="text-sm text-ink italic leading-relaxed">“${t('limitedSignboardThanks')}”</p>
    </div>
    <button class="close-modal px-6 py-2 bg-magic-gold text-white rounded-full font-bold text-sm hover:shadow-lg transition-all">
      ${t('continue')}
    </button>
  `;

  modal.appendChild(content);
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('close-modal')) {
      modal.remove();
    }
  });
  document.body.appendChild(modal);
}

/** 渲染标志牌图标：优先使用图片，否则回退 emoji */
function renderSignboardIcon(sb) {
  if (sb.image) {
    return `<img src="${sb.image}" alt="${sb.name}" class="w-10 h-10 object-contain flex-shrink-0" />`;
  }
  return `<span class="text-3xl">${sb.emoji}</span>`;
}
