// 咖啡角面板（cafe-corner-plan §三 UI：等级/增益/统计/食谱/升级/休眠标识）
import { state } from '../../state.js';
import { el } from '../common.js';
import { t } from '../../i18n/terms.js';
import { PLANT_TYPES } from '../../../data/plants.js';
import {
  CAFE_RECIPES, CAFE_FEE_PER_LEVEL, CAFE_BORROW_BUFF_PER_LEVEL, CAFE_FAVOR_MULT_STEP
} from '../../../data/cafe.js';
import {
  isCafeBuilt, isCafeDormant, getCafeDailyFee, getCafeLevelCap, getCafeUpgradePrice,
  canUpgradeCafe, upgradeCafe, getCafeStock, canCraftRecipe, craftRecipe
} from '../../core/cafe.js';
import { getFacilityRequiredStage } from '../../../data/atmosphere.js';
import { isFestivalActive } from '../../../data/festival.js';

export function openCafePanel() {
  const existing = document.getElementById('cafe-panel-modal');
  if (existing) existing.remove();

  const modal = el('div', 'fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4');
  modal.id = 'cafe-panel-modal';
  const panel = el('div', 'parchment-bg rounded-2xl p-6 max-w-lg w-full magic-glow max-h-[85vh] overflow-y-auto');
  panel.appendChild(renderHeader());
  panel.appendChild(renderStats());
  panel.appendChild(renderRecipes());
  panel.appendChild(renderUpgradeRow());
  panel.appendChild(renderCloseRow());
  modal.appendChild(panel);
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

function renderHeader() {
  const cafe = state.cafe;
  const dormant = isCafeDormant();
  const header = el('div', 'flex items-center gap-2 mb-4');
  header.innerHTML = `
    <span class="text-2xl">☕</span>
    <h2 class="font-display text-lg font-bold flex-1">${t('cafePanelTitle')}</h2>
    <span class="text-xs bg-magic-gold/20 text-magic-gold px-2 py-0.5 rounded-full">Lv.${cafe.level}</span>
    ${dormant ? `<span class="text-xs bg-gray-300 text-gray-600 px-2 py-0.5 rounded-full">💤 ${t('cafeDormant')}</span>` : ''}
  `;
  return header;
}

function renderStats() {
  const cafe = state.cafe;
  const level = cafe.level;
  const wrap = el('div', 'grid grid-cols-2 gap-2 mb-4 text-center');
  wrap.innerHTML = `
    <div class="bg-white/60 rounded-lg p-2">
      <div class="text-sm font-bold">${level}</div>
      <div class="text-[10px] text-ink-light">${t('cafeConcurrentCap')}</div>
    </div>
    <div class="bg-white/60 rounded-lg p-2">
      <div class="text-sm font-bold">+${level * CAFE_BORROW_BUFF_PER_LEVEL * 100}%</div>
      <div class="text-[10px] text-ink-light">${t('cafeBorrowBuffDesc')}</div>
    </div>
    <div class="bg-white/60 rounded-lg p-2">
      <div class="text-sm font-bold">×${(1 + CAFE_FAVOR_MULT_STEP * (level - 1)).toFixed(1)}</div>
      <div class="text-[10px] text-ink-light">${t('cafeFavorMultDesc')}</div>
    </div>
    <div class="bg-white/60 rounded-lg p-2">
      <div class="text-sm font-bold">${cafe.totalServed}</div>
      <div class="text-[10px] text-ink-light">${t('cafeTotalServed')}</div>
    </div>
  `;
  const feeNote = el('p', 'text-xs text-ink-light text-center mb-4',
    { text: `${t('cafeDailyFee').replace('{n}', getCafeDailyFee())} · ${isCafeDormant() ? t('cafeDormantHint') : t('cafeAutoServeHint')}` });
  const box = el('div');
  box.appendChild(wrap);
  box.appendChild(feeNote);
  return box;
}

function renderRecipes() {
  const cafe = state.cafe;
  const dormant = isCafeDormant();
  const list = el('div', 'space-y-2 mb-4');

  // 节日限定饮品：仅在活动窗口内出现（festivalKey 门控，窗口外完全隐藏）
  const visibleRecipes = CAFE_RECIPES.filter(r => !r.festivalKey || isFestivalActive(r.festivalKey));
  visibleRecipes.forEach(recipe => {
    const locked = cafe.level < recipe.unlockLevel;
    const stock = getCafeStock(recipe.id);
    const seedDef = PLANT_TYPES[recipe.material.seedType];
    const have = state.seeds[recipe.material.seedType] || 0;
    const need = recipe.material.count;
    const canCraft = !locked && !dormant && canCraftRecipe(recipe.id);

    const card = el('div', `bg-white rounded-xl p-3 border-2 flex items-center gap-3 ${locked ? 'opacity-50 border-gray-200' : 'border-wood/20'}`);
    const iconHtml = recipe.image
      ? `<img src="${recipe.image}" alt="${t(recipe.nameKey)}" class="w-10 h-10 object-contain flex-shrink-0" onerror="this.outerHTML='<span class=\\'text-2xl\\'>${recipe.emoji}</span>'" />`
      : `<span class="text-2xl">${recipe.emoji}</span>`;
    card.innerHTML = `
      ${iconHtml}
      <div class="flex-1 min-w-0">
        <div class="font-bold text-sm">${t(recipe.nameKey)}
          <span class="text-xs font-normal text-ink-light ml-1">${t('cafeStockLabel')} ${stock}</span>
          ${locked ? `<span class="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded ml-1">🔒 Lv.${recipe.unlockLevel}</span>` : ''}
        </div>
        <div class="text-xs text-ink-light">
          ${seedDef ? seedDef.emoji : ''}${t(seedDef.nameKey)}种子 ×${need}（现有 ${have}）→ 💰${recipe.price} · 好感+${recipe.favor}
        </div>
      </div>
    `;
    const btn = el('button', `px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${canCraft ? 'bg-magic-gold text-white hover:shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`);
    btn.textContent = t('cafeCraft');
    btn.disabled = !canCraft;
    if (canCraft) {
      btn.addEventListener('click', () => {
        if (craftRecipe(recipe.id)) {
          if (typeof window.showToast === 'function') window.showToast(`${recipe.emoji} ${t('cafeCrafted')}`, 'success');
          refreshPanel();
        }
      });
    }
    card.appendChild(btn);
    list.appendChild(card);
  });
  return list;
}

function renderUpgradeRow() {
  const row = el('div', 'flex items-center justify-between mb-4');
  const cap = getCafeLevelCap();
  const maxed = state.cafe.level >= cap;
  const info = el('div', 'text-xs text-ink-light', {
    text: maxed
      ? (cap >= 5 ? t('cafeMaxed') : t('facilityStageGate').replace('{level}', state.cafe.level + 1).replace('{stage}', getFacilityRequiredStage(state.cafe.level + 1)))
      : `${t('cafeNextLevelPreview')}：${t('cafeBorrowBuffDesc').replace('{n}', (state.cafe.level + 1) * 5)}`
  });
  row.appendChild(info);
  if (!maxed) {
    const btn = el('button', `px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${canUpgradeCafe() ? 'bg-magic-gold text-white hover:shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`);
    btn.innerHTML = `${t('upgrade')} 💰${getCafeUpgradePrice().toLocaleString()}`;
    btn.disabled = !canUpgradeCafe();
    btn.addEventListener('click', () => {
      if (upgradeCafe()) {
        if (typeof window.showToast === 'function') window.showToast(`☕ Lv.${state.cafe.level}`, 'success');
        refreshPanel();
        if (typeof window.renderShopPage === 'function') window.renderShopPage();
      }
    });
    row.appendChild(btn);
  }
  return row;
}

function renderCloseRow() {
  const row = el('div', 'text-center');
  const btn = el('button', 'px-6 py-2 bg-wood/80 text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all');
  btn.textContent = t('continue');
  btn.addEventListener('click', () => {
    const modal = document.getElementById('cafe-panel-modal');
    if (modal) modal.remove();
  });
  row.appendChild(btn);
  return row;
}

function refreshPanel() {
  const modal = document.getElementById('cafe-panel-modal');
  if (modal) {
    modal.remove();
    openCafePanel();
  }
}
