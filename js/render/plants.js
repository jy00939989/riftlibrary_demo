// 温室页面渲染（2026-09-21 独立成页，图南三决策：种子购买迁入/标志牌迁展览厅/贴纸记技术债）
// 结构：盆栽区（盆位+解锁）→ 培育设施（喷壶/水箱/绿手指）→ 购买种子 → 种子库存
import { state, saveState } from '../state.js';
import { updateStatusBar, showImagePreview } from './common.js';
import { playSfx } from '../audio.js';
import { PLANT_TYPES, SEED_EXCHANGE, WATERING_CANS, WATER_TANKS } from '../../data/plants.js';
import { canHarvest, harvestPlant, canExchangeSeed, exchangeSeed, getActivePlantDef, canWater, canFertilize, abandonPlant, getSeedExchanges, waterPlant, fertilizePlant, unlockPot, canUnlockPot, getPotCount, getNextPotPrice, MAX_POTS, getWaterCount, getWateringCanLevel, getWaterTankLevel, getNextCanUpgrade, getNextTankUpgrade, canUpgradeCan, canUpgradeTank, upgradeCan, upgradeTank, getGreenThumbLevel, getGreenThumbProgress, isImproved, getEffectiveSeedDropRate, canUnlockImproved, unlockImproved, getSplashTargets, plantSeed } from '../plants.js';
import { t } from '../i18n/terms.js';
import { suppressGuideWidget } from './guidequests.js';

// 温室场景导览注入样式（一次）
let sceneStyleInjected = false;
function ensureSceneStyle() {
  if (sceneStyleInjected || typeof document === 'undefined') return;
  sceneStyleInjected = true;
  const style = document.createElement('style');
  style.id = 'gh-scene-style';
  style.textContent = `
    .gh-flash { animation: ghFlash 1.6s ease-out; }
    @keyframes ghFlash {
      0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.8); }
      100% { box-shadow: 0 0 0 18px rgba(52, 211, 153, 0); }
    }
    .gh-dot { position: absolute; top: -4px; right: -4px; width: 14px; height: 14px; border-radius: 9999px; border: 2px solid #fff; animation: ghPulse 1.6s infinite; }
    @keyframes ghPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.25); } }
    .gh-hotspot { transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease; }
    .gh-hotspot:hover { filter: brightness(1.08); }
    button.gh-hotspot:focus-visible { outline: 2px solid #34d399; outline-offset: 2px; }
  `;
  document.head.appendChild(style);
}

// 平滑滚动到功能区并高亮一闪
function scrollToSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el.classList.remove('gh-flash');
  void el.offsetWidth; // 重置动画
  el.classList.add('gh-flash');
  setTimeout(() => el.classList.remove('gh-flash'), 1700);
}

// ========== 温室场景导览（展览厅式可点击热点；2026-09-21 B 路底图版） ==========
// 底图 visual/greenhouse/greenhouse_main.jpg（1920×1089 压缩档 481KB；母档 gh_master.png 同目录）。
// 坐标全部为相对图宽高的实测百分比；换图必须重测（同 exhibition.js SPOT_COORDS 纪律）。
// 铭牌藏名纪律：图内三块空白铭牌无文字，名称由本组件 HTML 盖。

// 长椅四空盆盆位中心（从左到右）
const GH_POT_SLOTS = [
  { x: 21.7, y: 64.5 }, { x: 32.7, y: 64.0 }, { x: 42.4, y: 63.5 }, { x: 51.6, y: 63.0 }
];
// 功能区热点框（左/上/宽/高 %）：右上工具架 = 设施升级区；右下柜台 = 兑换区
const GH_REGIONS = {
  facilities: { x: 64, y: 8, w: 25, h: 45 },
  exchange: { x: 66, y: 56, w: 34, h: 42 }
};
// 铭牌标签锚点（中心点 %）：顶部大牌=温室名；长椅上方=盆栽；工具架铭牌=设施；柜台铭牌=兑换
const GH_LABELS = {
  title: { x: 34.5, y: 16 },
  pots: { x: 15, y: 47 },
  facilities: { x: 76.5, y: 12.5 },
  exchange: { x: 79, y: 86 }
};

function renderGreenhouseScene() {
  ensureSceneStyle();
  const scene = document.createElement('div');
  scene.className = 'relative rounded-2xl border-2 border-green-300 overflow-hidden';

  const img = document.createElement('img');
  img.src = 'visual/greenhouse/greenhouse_main.jpg';
  img.alt = t('tabGreenhouse');
  img.className = 'w-full block select-none';
  scene.appendChild(img);

  // 状态判定（与旧 CSS 版同语义）
  const activeIdx = (state.plants || []).map((p, i) => (p && p.activeType && p.level > 0 ? i : -1)).filter(i => i >= 0);
  const anyHarvest = activeIdx.some(i => canHarvest(i));
  const anyWaterable = getWaterCount() > 0 && activeIdx.some(i => canWater(i));
  const facilityDot = canUpgradeCan() || canUpgradeTank();
  const anyExchange = Object.keys(SEED_EXCHANGE).some(st => getSeedExchanges(st).some(x => x.canExchange));

  // 功能区整面透明热区（铭牌标签下方，保证移动端点按面积）
  scene.appendChild(sceneRegion(GH_REGIONS.facilities, () => scrollToSection('gh-section-facilities')));
  scene.appendChild(sceneRegion(GH_REGIONS.exchange, () => scrollToSection('gh-section-seeds')));

  // 铭牌标签（盖在图的空白铭牌上）
  scene.appendChild(sceneLabel(GH_LABELS.title, `🌿 ${t('tabGreenhouse')} · 💧${getWaterCount()}`, null, null));
  scene.appendChild(sceneLabel(GH_LABELS.pots, t('plantPotsTitle'), anyHarvest ? '#f59e0b' : anyWaterable ? '#3b82f6' : null, () => scrollToSection('gh-section-pots')));
  scene.appendChild(sceneLabel(GH_LABELS.facilities, t('greenhouseFacilities'), facilityDot ? '#10b981' : null, () => scrollToSection('gh-section-facilities')));
  scene.appendChild(sceneLabel(GH_LABELS.exchange, t('greenhouseExchangeTitle'), anyExchange ? '#10b981' : null, () => scrollToSection('gh-section-seeds')));

  // 四个盆位：已种植 → 活立绘（点击去盆栽区）；空盆 → 隐形按钮（点击去购买种子）
  (state.plants || []).forEach((plant, idx) => {
    const slot = GH_POT_SLOTS[idx];
    if (!slot) return;
    const planted = plant && plant.activeType && plant.level > 0;
    const btn = document.createElement('button');
    btn.className = 'absolute transform -translate-x-1/2 -translate-y-[92%] flex items-end justify-center';
    btn.style.left = slot.x + '%';
    btn.style.top = slot.y + '%';
    btn.style.width = '8%';
    btn.style.minWidth = '34px';
    btn.style.minHeight = '44px';
    if (planted) {
      const def = PLANT_TYPES[plant.activeType];
      if (def) btn.appendChild(renderPlantArt(def, plant.level, 56));
      btn.title = t(def?.nameKey || 'plantPotsTitle');
    } else {
      btn.title = t('greenhouseSeedShop');
    }
    btn.addEventListener('click', () => scrollToSection(planted ? 'gh-section-pots' : 'gh-section-shop'));
    scene.appendChild(btn);
  });

  return scene;
}

// 整面透明热区按钮
function makeDot(color) {
  const dot = document.createElement('span');
  dot.className = 'gh-dot';
  dot.style.background = color;
  return dot;
}

function sceneRegion(region, onClick) {
  const btn = document.createElement('button');
  btn.className = 'gh-hotspot absolute cursor-pointer';
  btn.style.left = region.x + '%';
  btn.style.top = region.y + '%';
  btn.style.width = region.w + '%';
  btn.style.height = region.h + '%';
  btn.addEventListener('click', onClick);
  return btn;
}

// 铭牌标签：pos=中心点%；dot 颜色非空则加脉冲点；onClick 为空则纯展示
function sceneLabel(pos, html, dotColor, onClick) {
  const el = document.createElement(onClick ? 'button' : 'div');
  el.className = 'absolute transform -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50/90 text-amber-900 border border-amber-300/70 shadow-sm whitespace-nowrap';
  el.style.left = pos.x + '%';
  el.style.top = pos.y + '%';
  if (onClick) {
    el.classList.add('gh-hotspot');
    el.addEventListener('click', onClick);
  }
  el.innerHTML = html;
  if (dotColor) el.appendChild(makeDot(dotColor));
  return el;
}

export function renderGreenhousePage() {
  const container = document.getElementById('page-greenhouse');
  if (!container) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'space-y-6';

  wrapper.appendChild(renderGreenhouseScene());
  wrapper.appendChild(renderPlantArea());
  wrapper.appendChild(renderFacilities());
  wrapper.appendChild(renderPlantShop());
  wrapper.appendChild(renderSeedInventory());

  container.innerHTML = '';
  container.appendChild(wrapper);
}

window.renderGreenhousePage = renderGreenhousePage;

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
  section.id = 'gh-section-pots';

  const header = document.createElement('h3');
  header.className = 'font-bold text-lg mb-3 flex items-center gap-2 flex-wrap';
  header.innerHTML = `🌱 ${t('plantPotsTitle')} <span class="text-xs font-normal text-ink-light">${t('plantPotCount').replace('{n}', getPotCount()).replace('{max}', MAX_POTS)}</span>
    <span class="text-xs font-normal text-magic-blue bg-magic-blue/10 px-2 py-0.5 rounded-full" title="${t('waterPoolHint')}">💧 ${t('waterPoolCount').replace('{n}', getWaterCount())}</span>`;
  section.appendChild(header);

  // 植物消失通报（凋谢/台风）：醒目红卡，dismiss 后清零——不再让玩家「忽然发现植物不见了」
  if (state.plantLossAlert) {
    section.appendChild(renderPlantLossAlert(state.plantLossAlert));
  }

  // 盆位横向排列（§2.6）；末尾跟解锁卡
  const row = document.createElement('div');
  row.className = 'flex gap-4 flex-wrap items-stretch';
  (state.plants || []).forEach((plant, idx) => {
    row.appendChild(renderPotCard(plant, idx));
  });
  row.appendChild(renderPotUnlockCard());
  section.appendChild(row);
  return section;
}

// 解锁新盆卡（虚线占位样式；满 4 盆显示上限注记）
function renderPotUnlockCard() {
  const card = document.createElement('div');
  card.className = 'rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 min-w-[180px] flex-1';

  if (getPotCount() >= MAX_POTS) {
    card.className += ' border-gray-300 text-gray-400';
    card.innerHTML = `<span class="text-2xl">🪴</span><p class="text-xs mt-2">${t('plantPotMax')}</p>`;
    return card;
  }

  const price = getNextPotPrice();
  const canAfford = canUnlockPot();
  card.className += canAfford ? ' border-green-300 text-green-700' : ' border-gray-300 text-gray-400';
  card.innerHTML = `
    <span class="text-2xl">🪴</span>
    <p class="text-xs font-bold mt-2">${t('plantPotUnlock')}</p>
    <p class="text-xs opacity-80">${t('plantPotCount').replace('{n}', getPotCount()).replace('{max}', MAX_POTS)}</p>
  `;
  const btn = document.createElement('button');
  btn.className = `px-4 py-1.5 mt-3 rounded-lg text-sm font-bold transition-all ${canAfford ? 'bg-green-600 text-white hover:shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`;
  btn.disabled = !canAfford;
  btn.innerHTML = `💰${price.toLocaleString()}`;
  btn.addEventListener('click', () => {
    if (unlockPot()) {
      renderGreenhousePage();

      updateStatusBar();
    }
  });
  card.appendChild(btn);
  return card;
}

// 浇水按钮文案（温室页与位面商店装潢页共用；喷壶档位决定文案，2026-09-21）
export function getWaterButtonLabel(def, potIndex = 0) {
  const canLv = getWateringCanLevel();
  if (canLv === 2) return t('waterSplashTwo');
  if (canLv === 3) {
    const activeCount = Math.max(1, getSplashTargets(potIndex).length);
    const per = Math.max(1, Math.round(def.waterGrowth * 2 / activeCount));
    return t('waterSplashAll').replace('{per}', per);
  }
  return `${t('water')} ${t('waterGrowth').replace('{value}', def.waterGrowth)}`;
}

// 单盆卡：空盆 → 引导提示；活盆 → 立绘/进度/操作（交互与单株时代一致，仅索引化）
function renderPotCard(plant, potIndex) {
  const card = document.createElement('div');
  card.className = 'bg-white rounded-xl p-4 border-2 border-green-200 flex-1 min-w-[240px]';

  if (!plant.activeType || plant.level === 0) {
    card.innerHTML = `
      <div class="text-center py-4">
        <div class="mb-2 flex justify-center">
          <img src="visual/plants/plant_16_empty_pot.png" alt="${t('plantPotEmpty')}" class="w-16 h-16 object-contain opacity-70">
        </div>
        <p class="text-xs text-ink-light">${t('plantPotEmpty')}</p>
        <p class="text-xs text-ink-light mt-1">在本页下方 <span class="text-magic-gold font-bold">购买种子</span> 种下新植物</p>
      </div>
    `;
    return card;
  }

  const def = PLANT_TYPES[plant.activeType];
  if (!def) return card;

  const improved = isImproved(plant.activeType);
  const dropRate = Math.round(getEffectiveSeedDropRate(plant.activeType) * 100);

  const progressPercent = Math.min(100, Math.round((plant.growthProgress / def.growthPerLevel) * 100));
  const levelName = def.levelNames[plant.level] || '';
  const canHarvestNow = canHarvest(potIndex);

  const artWrap = document.createElement('div');
  artWrap.className = 'flex justify-center mb-2';
  artWrap.appendChild(renderPlantArt(def, plant.level));

  const info = document.createElement('div');
  info.innerHTML = `
    <div class="flex items-center justify-center gap-2 mb-2 flex-wrap">
      <span class="font-bold">${t(def.nameKey)}</span>
      ${improved ? `<span class="text-xs bg-teal-200 text-teal-800 px-2 py-1 rounded-full font-bold">${t('improvedBadge')}</span>` : ''}
      <span class="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">Lv.${plant.level} · ${levelName}</span>
    </div>
    <div class="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
      <div class="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all" style="width:${progressPercent}%"></div>
    </div>
    <p class="text-xs text-ink-light mb-3 text-center">成长进度 ${progressPercent}%</p>
    <div class="flex gap-2 flex-wrap justify-center" id="dec-plant-actions-${potIndex}"></div>
    ${canHarvestNow
      ? `<p class="text-xs text-yellow-600 mt-3 text-center">✨ 可以收获了！将以${dropRate}%概率获得种子${improved && def.improved ? `<br>${t('harvestPerennialNote')}` : ''}</p>`
      : `<p class="text-xs text-ink-light mt-2 text-center">${plant.level < 5 ? `下一级施肥所需 💰${def.fertilizeCosts[plant.level + 1] || 0}` : '进度满即可收获'}</p>`
    }
  `;
  card.appendChild(artWrap);
  card.appendChild(info);

  const actions = info.querySelector(`#dec-plant-actions-${potIndex}`);

  // 收获按钮
  if (canHarvestNow) {
    const harvestBtn = document.createElement('button');
    harvestBtn.className = 'px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all';
    harvestBtn.innerHTML = `🌾 收获 (氛围+${def.harvestAtmosphere} 💰+${def.harvestCoins})`;
    harvestBtn.addEventListener('click', () => {
      const result = harvestPlant(potIndex);
      if (result) showPlantHarvestPopup(def, result);
      updateStatusBar();

      renderGreenhousePage();
    });
    actions.appendChild(harvestBtn);
  } else {
    // 浇水按钮（喷壶档位决定泼溅范围，2026-09-21）
    const canWaterNow = canWater(potIndex);
    const waterLabel = getWaterButtonLabel(def, potIndex);
    const waterBtn = document.createElement('button');
    waterBtn.className = `px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all ${!canWaterNow ? 'opacity-50 cursor-not-allowed' : ''}`;
    waterBtn.disabled = !canWaterNow;
    waterBtn.innerHTML = waterLabel;
    waterBtn.addEventListener('click', () => {
      const result = waterPlant(potIndex);
      if (result.ok && result.justMatured) showPlantMaturityToast(def);
      renderGreenhousePage();

      updateStatusBar();
    });
    actions.appendChild(waterBtn);

    // 施肥按钮
    const canFertNow = canFertilize(potIndex);
    const fertBtn = document.createElement('button');
    fertBtn.className = `px-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all ${!canFertNow ? 'opacity-50 cursor-not-allowed' : ''}`;
    fertBtn.disabled = !canFertNow;
    fertBtn.innerHTML = `✨ 施肥 (+${def.fertilizeGrowth} 💰${def.fertilizeCosts[plant.level + 1] || 0})`;
    fertBtn.addEventListener('click', () => {
      const result = fertilizePlant(potIndex);
      if (result.ok && result.justMatured) showPlantMaturityToast(def);
      renderGreenhousePage();

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
      abandonPlant(potIndex);
      renderGreenhousePage();

      updateStatusBar();
    }
  });
  actions.appendChild(abandonBtn);

  return card;
}

// ========== 培育设施（喷壶 / 水箱 / 绿手指，2026-09-21 温室培育线） ==========

function renderFacilities() {
  const section = document.createElement('div');
  section.className = 'bg-white/60 rounded-xl p-5 border-2 border-teal-200';
  section.id = 'gh-section-facilities';

  section.innerHTML = `<h3 class="font-bold text-lg mb-3 flex items-center gap-2">🛠️ ${t('greenhouseFacilities')}</h3>`;

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 md:grid-cols-3 gap-3';

  grid.appendChild(renderFacilityCard({
    emoji: WATERING_CANS[getWateringCanLevel() - 1].emoji,
    name: t(WATERING_CANS[getWateringCanLevel() - 1].nameKey),
    desc: t(WATERING_CANS[getWateringCanLevel() - 1].descKey),
    next: getNextCanUpgrade(),
    canAfford: canUpgradeCan(),
    onUpgrade: () => upgradeCan()
  }));

  grid.appendChild(renderFacilityCard({
    emoji: WATER_TANKS[getWaterTankLevel() - 1].emoji,
    name: t(WATER_TANKS[getWaterTankLevel() - 1].nameKey),
    desc: t(WATER_TANKS[getWaterTankLevel() - 1].descKey),
    next: getNextTankUpgrade(),
    canAfford: canUpgradeTank(),
    onUpgrade: () => upgradeTank()
  }));

  const thumbLv = getGreenThumbLevel();
  const thumbProg = getGreenThumbProgress();
  grid.appendChild(renderFacilityCard({
    emoji: '🌿',
    name: t('greenThumb'),
    desc: thumbLv === 0
      ? t('greenThumbDesc')
      : `${t('greenThumbDesc')}（+${thumbLv * 5}%）`,
    footer: thumbProg.next === null
      ? t('greenThumbMaxed').replace('{n}', thumbProg.current)
      : `${t('greenThumbProgress').replace('{n}', thumbProg.current)} · ${t('greenThumbProgress').replace('{n}', thumbProg.next)} → Lv${thumbLv + 1}`,
    next: null // 被动成长，不可购买
  }));

  section.appendChild(grid);
  return section;
}

function renderFacilityCard({ emoji, name, desc, footer = null, next = null, canAfford = false, onUpgrade = null }) {
  const card = document.createElement('div');
  card.className = 'bg-white rounded-xl p-4 border-2 border-teal-200 flex flex-col';

  const btnHtml = next
    ? `<button class="facility-upgrade-btn px-4 py-1.5 mt-3 rounded-lg text-sm font-bold transition-all ${canAfford ? 'bg-teal-600 text-white hover:shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}">${t('facilityUpgrade').replace('{price}', next.price.toLocaleString())}</button>`
    : `<span class="text-xs text-green-600 font-bold mt-3 inline-block">✅ ${t('facilityMaxed')}</span>`;

  card.innerHTML = `
    <div class="flex items-center gap-2 mb-2">
      <span class="text-2xl">${emoji}</span>
      <span class="font-bold text-sm">${name}</span>
    </div>
    <p class="text-xs text-ink-light leading-relaxed flex-1">${desc}</p>
    ${footer ? `<p class="text-xs text-teal-700 mt-2">${footer}</p>` : ''}
    ${btnHtml}
  `;

  if (next && canAfford && onUpgrade) {
    card.querySelector('.facility-upgrade-btn').addEventListener('click', () => {
      if (onUpgrade()) {
        renderGreenhousePage();

        updateStatusBar();
      }
    });
  }
  return card;
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
  section.id = 'gh-section-seeds';

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
            renderGreenhousePage();
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

    // 嫁接改良（2026-09-21 温室培育线）：种子 sink + 掉率提升 + 多年生
    if (plantDef.improved) {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between text-sm border-t border-teal-200 pt-2 mt-1';

      const left = document.createElement('div');
      left.className = 'text-ink-light';
      if (isImproved(seedType)) {
        left.innerHTML = `<span class="text-xs text-teal-700 font-bold">${t('improvedUnlocked').replace('{rate}', Math.round(plantDef.improved.seedDropRate * 100))}</span>`;
      } else {
        left.innerHTML = `<span class="font-bold text-teal-700">${t('unlockImprovedTitle')}</span><br><span class="text-xs">${t('unlockImprovedDesc').replace('{cost}', plantDef.improved.seedCost)}</span>`;
      }

      const right = document.createElement('div');
      if (!isImproved(seedType)) {
        if (canUnlockImproved(seedType)) {
          const btn = document.createElement('button');
          btn.className = 'px-3 py-1 bg-teal-600 text-white rounded-lg text-xs font-bold hover:shadow transition-all';
          btn.textContent = `🌰 ×${plantDef.improved.seedCost}`;
          btn.addEventListener('click', () => {
            if (unlockImproved(seedType)) renderGreenhousePage();
          });
          right.appendChild(btn);
        } else {
          right.innerHTML = `<span class="text-xs text-ink-light">${t('needSeedsToImprove').replace('{n}', plantDef.improved.seedCost - count)}</span>`;
        }
      }

      row.appendChild(left);
      row.appendChild(right);
      list.appendChild(row);
    }

    card.appendChild(list);
    grid.appendChild(card);
  });

  if (!hasAny) {
    grid.innerHTML = '<p class="text-sm text-ink-light text-center py-4">还没有种子。种植并收获植物来获取种子吧！</p>';
  }

  section.appendChild(grid);
  return section;
}

// ========== 购买种子（2026-09-21 图南决策：从位面商店迁入温室；有空盆才展示） ==========

function renderPlantShop() {
  const section = document.createElement('div');
  section.className = 'bg-white/60 rounded-xl p-5 border-2 border-green-200';
  section.id = 'gh-section-shop';

  const pots = state.plants || [];
  const hasEmptyPot = pots.some(p => !p.activeType || p.level === 0);
  if (!hasEmptyPot) return section;

  section.innerHTML = `<h3 class="font-bold text-lg mb-3 flex items-center gap-2">🌰 ${t('greenhouseSeedShop')}</h3>`;

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 md:grid-cols-3 gap-3';

  Object.values(PLANT_TYPES).forEach(pt => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl p-4 border-2 border-green-200 flex gap-3 items-center hover:shadow-lg transition-all';
    const cost = pt.fertilizeCosts[1];
    const canAfford = state.coins >= cost;

    const artWrap = document.createElement('div');
    artWrap.className = 'flex-shrink-0';
    artWrap.appendChild(renderPlantArt(pt, 1, 56));

    const info = document.createElement('div');
    info.className = 'flex-1 min-w-0';
    info.innerHTML = `
      <div class="font-bold text-sm">${t(pt.nameKey)}</div>
      <p class="text-xs text-ink-light mt-0.5 line-clamp-2">${t(pt.descKey)}</p>
      <div class="flex items-center gap-2 mt-1.5">
        <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">${t('plantGrowLevels')}</span>
        <span class="text-xs text-ink-light">${t('waterAndFertilize')}</span>
      </div>
    `;

    const btn = document.createElement('button');
    btn.className = `flex-shrink-0 px-4 py-1.5 ${canAfford ? 'bg-green-600 text-white hover:shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'} rounded-lg text-sm font-bold transition-all`;
    btn.disabled = !canAfford;
    btn.innerHTML = `💰${cost.toLocaleString()}`;
    btn.addEventListener('click', () => {
      if (plantSeed(pt.id)) {
        playSfx('buy_success');
        updateStatusBar();
        renderGreenhousePage();
      } else {
        window.showToast(t('purchaseFailed'), 'error');
      }
    });

    card.appendChild(artWrap);
    card.appendChild(info);
    card.appendChild(btn);
    grid.appendChild(card);
  });

  section.appendChild(grid);
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
  const releaseWidget = suppressGuideWidget();

  const close = () => {
    releaseWidget();
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
  const perennialText = result.perennial
    ? `<p class="text-sm text-teal-700 font-bold mb-2">🧬 ${t('harvestPerennialNote')}</p>`
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
      ${perennialText}
      <p class="text-xs text-ink-light mb-4">${result.perennial
        ? `🧬 ${t(def.nameKey)} ${t('improvedPerennialHint').replace('{lv}', def.improved.restartLevel).replace('{rate}', Math.round(def.improved.seedDropRate * 100))}`
        : t('plantHarvestEmptyPot')}</p>
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

// ========== 植物消失通报（凋谢/台风） ==========

/** 通报文案统一出口：温室红卡与 init 弹窗共用 */
function getPlantLossAlertText(alert) {
  if (alert.kind === 'wither') {
    const names = (alert.plantTypes || [])
      .map(id => PLANT_TYPES[id]).filter(Boolean)
      .map(d => `${d.emoji}${t(d.nameKey)}`).join('、') || t('unknown');
    return {
      emoji: '🥀',
      title: t('plantLossWitherTitle'),
      desc: t('plantLossWitherDesc').replace('{names}', names)
    };
  }
  const def = PLANT_TYPES[alert.plantType];
  const name = def ? `${def.emoji}${t(def.nameKey)}` : t('unknown');
  return {
    emoji: alert.savedByGuyu ? '🌾' : '🌪️',
    title: t('plantLossTyphoonTitle'),
    desc: alert.savedByGuyu
      ? t('plantLossTyphoonSavedDesc').replace('{name}', name)
      : t('plantLossTyphoonLostDesc').replace('{name}', name)
  };
}

// 温室页顶部持久通报卡（玩家点「知道了」清零）
function renderPlantLossAlert(alert) {
  const card = document.createElement('div');
  const text = getPlantLossAlertText(alert);
  card.className = 'mb-4 rounded-xl border-2 border-red-300 bg-red-50/80 p-4 flex items-start gap-3 animate-scale-in';
  card.innerHTML = `
    <span class="text-3xl flex-shrink-0">${text.emoji}</span>
    <div class="flex-1 min-w-0">
      <p class="font-bold text-red-800 text-sm mb-1">${text.title}</p>
      <p class="text-xs text-red-700/90 leading-relaxed">${text.desc}</p>
    </div>
    <button class="plant-loss-dismiss flex-shrink-0 px-3 py-1.5 bg-red-200/80 hover:bg-red-200 text-red-800 rounded-lg text-xs font-bold transition-all">${t('gotIt')}</button>
  `;
  card.querySelector('.plant-loss-dismiss').addEventListener('click', () => {
    state.plantLossAlert = null;
    saveState();
    renderGreenhousePage();
  });
  return card;
}

// init 弹窗（凋谢路径：打开游戏立即告知，红卡兜底防漏看）
export function showPlantLossPopup(alert) {
  const text = getPlantLossAlertText(alert);
  const existing = document.getElementById('plant-loss-popup');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'plant-loss-popup';
  overlay.className = 'fixed inset-0 z-[250] flex items-center justify-center bg-ink/70 p-4';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-2xl p-6 max-w-sm w-full text-center border-2 border-red-300 shadow-2xl animate-scale-in">
      <div class="text-5xl mb-3">${text.emoji}</div>
      <h3 class="font-display text-xl font-bold text-red-800 mb-2">${text.title}</h3>
      <p class="text-sm text-ink-light leading-relaxed mb-5">${text.desc}</p>
      <button class="px-6 py-2.5 bg-wood text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">${t('gotIt')}</button>
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
