// 展览厅大厅渲染（exhibition-hall-plan §2）
// 路线 A：大厅图 = 展览厅首页，五房间入口 = 现有整页复用（页内脏不改）；
// 三态视觉：破败灰度暗化+🔒 / 开放全彩铭牌发光；修复 = 金币+收集+容量三轨面板；
// 修复过渡 = CSS 光扫 + 灰度褪去（~1.2s，本厅不入 seedance 清单）。
// 美术债：大厅底图 visual/exhibition/hall_v1.jpg 未出图前，用羊皮纸大厅 CSS 构图（零美术债实现）。
import { state } from '../state.js';
import { t } from '../i18n/terms.js';
import { playSfx } from '../audio.js';
import { updateStatusBar } from './common.js';
import { showToast } from './shared/toast.js';
import { getLibraryStage } from '../storage.js';
import {
  isExhibitionBuilt, canBuildExhibitionHall, buildExhibitionHall,
  getHallUpgradePrice, getHallLevelCap, canUpgradeHall, upgradeHall,
  EXHIBITION_ROOMS, EXHIBITION_ROOM_IDS, EXHIBITION_BUILD_STAGE, EXHIBITION_BUILD_PRICE,
  getRoomStatus, getOpenRoomCount, getRepairSnapshot, canRepairRoom, repairRoom,
  checkGrandOpening, getTodayEvents, getCurrentMonthBanner
} from '../core/exhibition.js';

// ========== 公共件：房间页面包屑（迁入页 header 一行，plan §2.3 工程注记） ==========

export function exhibitionBreadcrumbHTML(roomId) {
  if (!isExhibitionBuilt()) return '';
  const room = EXHIBITION_ROOMS[roomId];
  if (!room) return '';
  return `
    <div class="flex items-center gap-2 mb-3 text-sm">
      <button class="exh-back-hall-btn px-3 py-1 rounded-full bg-wood/10 hover:bg-wood/20 text-ink-light transition-all text-xs">
        🏛 ${t('exhBreadcrumb').replace('{room}', t(room.nameKey))}
      </button>
    </div>`;
}

export function bindExhibitionBreadcrumb(container) {
  const btn = container.querySelector('.exh-back-hall-btn');
  if (btn) btn.addEventListener('click', () => window.switchTab('exhibition'));
}

// ========== 大厅页 ==========

export function renderExhibitionPage() {
  const container = document.getElementById('page-exhibition');
  if (!container) return;
  container.innerHTML = '';

  if (!isExhibitionBuilt()) {
    renderUnbuiltHall(container);
    return;
  }
  renderHall(container);
}

function renderUnbuiltHall(container) {
  const stageOk = getLibraryStage() >= EXHIBITION_BUILD_STAGE;
  const card = document.createElement('div');
  card.className = 'parchment-bg rounded-2xl magic-glow p-6 max-w-2xl mx-auto';
  card.innerHTML = `
    <div class="text-center mb-6">
      <div class="text-5xl mb-3">🏛️</div>
      <h2 class="font-display text-2xl font-bold mb-2">${t('tabExhibitionHall')}</h2>
      <p class="text-sm text-ink-light leading-relaxed max-w-md mx-auto">${t('exhHallFlavor')}</p>
    </div>
    <div class="bg-white/60 rounded-xl p-5 border-2 ${stageOk ? 'border-magic-gold/30' : 'border-gray-200'} flex gap-4 items-center">
      <div class="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center text-3xl bg-wood/10">🏛️</div>
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-1">
          <span class="font-bold">${t('exhHallBuildTitle')}</span>
          <span class="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">${t('locked')}</span>
        </div>
        <p class="text-xs text-ink-light mb-2">${t('exhHallBuildDesc')}</p>
        ${!stageOk
          ? `<span class="text-xs text-ink-light">🔒 ${t('exhBuildGate').replace('{stage}', EXHIBITION_BUILD_STAGE)}</span>`
          : `<button class="exh-build-btn px-4 py-1.5 ${state.coins >= EXHIBITION_BUILD_PRICE ? 'bg-magic-gold text-white hover:shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'} rounded-lg text-sm font-bold transition-all" ${state.coins < EXHIBITION_BUILD_PRICE ? 'disabled' : ''}>${t('build')} 💰${EXHIBITION_BUILD_PRICE.toLocaleString()}</button>`}
      </div>
    </div>
  `;
  const btn = card.querySelector('.exh-build-btn');
  if (btn && stageOk && state.coins >= EXHIBITION_BUILD_PRICE) {
    btn.addEventListener('click', () => {
      if (buildExhibitionHall()) {
        playSfx('buy_success');
        updateStatusBar();
        renderExhibitionPage();
      } else {
        showToast(`${t('insufficientCoins')} 💰`, 'error');
      }
    });
  }
  container.appendChild(card);
}

function renderHall(container) {
  const exh = state.exhibition;
  const openCount = getOpenRoomCount();
  const level = exh.level;
  const cap = getHallLevelCap();
  const upgradePrice = getHallUpgradePrice();
  const events = getTodayEvents();
  const monthBanner = getCurrentMonthBanner();

  const wrapper = document.createElement('div');
  wrapper.className = 'parchment-bg rounded-2xl magic-glow overflow-hidden';

  // ── 头部：大厅等级 + 容量 + 扩建 ──
  const head = document.createElement('div');
  head.className = 'p-5 border-b-2 border-wood/20 bg-wood/5';
  head.innerHTML = `
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h2 class="font-display text-xl font-bold flex items-center gap-2">🏛️ ${t('tabExhibitionHall')}
          <span class="text-xs bg-magic-gold/20 text-magic-gold px-2 py-0.5 rounded-full">Lv.${level}</span>
        </h2>
        <p class="text-xs text-ink-light mt-1">${t('exhCapacityHint').replace('{level}', level).replace('{current}', openCount).replace('{total}', EXHIBITION_ROOM_IDS.length)}</p>
      </div>
      <div>
        ${level < cap
          ? `<button class="exh-upgrade-btn px-4 py-1.5 ${canUpgradeHall() ? 'bg-magic-gold text-white hover:shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'} rounded-lg text-sm font-bold transition-all" ${canUpgradeHall() ? '' : 'disabled'}>${t('exhUpgrade')} 💰${upgradePrice.toLocaleString()}</button>`
          : `<span class="text-xs text-magic-gold font-bold">${t('maxLevel')} ✨ ${t('exhHallFullCapacity')}</span>`}
      </div>
    </div>
  `;
  const upgradeBtn = head.querySelector('.exh-upgrade-btn');
  if (upgradeBtn && canUpgradeHall()) {
    upgradeBtn.addEventListener('click', () => {
      if (upgradeHall()) {
        playSfx('buy_success');
        updateStatusBar();
        renderExhibitionPage();
      } else {
        showToast(`${t('insufficientCoins')} 💰`, 'error');
      }
    });
  }
  wrapper.appendChild(head);

  // ── 五房间热点舞台（底图 + SVG-free clip 热点；缺图兜底卡片网格） ──
  const floor = document.createElement('div');
  wrapper.appendChild(floor);
  renderHallStage(floor, openCount);

  // ── 页脚：活动横幅位（活动日优先，整月横幅兜底）+ 旧入口收编提示 ──
  const foot = document.createElement('div');
  foot.className = 'p-4 border-t-2 border-wood/20 space-y-2';
  if (events.length > 0) {
    const ev = events[0];
    const effectDesc = ev.effect?.borrowFavorMult
      ? t('exhEventEffectFavor').replace('{mult}', ev.effect.borrowFavorMult)
      : t('exhEventEffectCoins').replace('{mult}', ev.effect?.focusCoinsMult || 1);
    foot.innerHTML += `
      <div class="exh-event-banner rounded-xl px-4 py-3 text-center text-sm font-bold">
        🎉 ${t('exhEventToday').replace('{name}', t(ev.nameKey)).replace('{effect}', effectDesc)}
      </div>`;
  } else if (monthBanner) {
    foot.innerHTML += `
      <div class="exh-month-banner rounded-xl px-4 py-2.5 text-center text-xs">
        📚 ${t(monthBanner.nameKey)}
      </div>`;
  }
  foot.innerHTML += `<p class="text-center text-[11px] text-ink-light/50">${t('exhLegacyNote')}</p>`;
  wrapper.appendChild(foot);

  container.appendChild(wrapper);
}

// ========== 大厅舞台热点坐标（按 hall_lv5.jpg 2731×1536 实测百分比；图变时重测此处） ==========
// 画面从左到右：卷宗门=档案室 / 荣誉墙=纪念牌墙 / 阶梯展台=成就柜 / 玻璃展柜=收藏品展柜 / 侧厅拱门=留声阁
// 图上自带五块空白铭牌，exh-tag 叠加 localized 房名；arch=拱顶造型（border-radius 近似半圆拱）
const EXHIBITION_SPOTS = {
  archive:      { x: 7.6,  y: 33.0, w: 11.8, h: 35.0, arch: true  },
  signboards:   { x: 25.8, y: 34.0, w: 12.4, h: 34.0, arch: false },
  achievements: { x: 43.9, y: 34.0, w: 12.6, h: 35.5, arch: true  },
  collection:   { x: 62.4, y: 35.5, w: 13.6, h: 33.0, arch: false },
  musicroom:    { x: 81.0, y: 34.0, w: 12.2, h: 35.0, arch: true  },
};

// 底图分档：按已开放房间数选 hall_lvN.jpg；缺档自动向 lv5 回退（全部缺失回退 CSS 卡片构图）
function loadHallImage(openCount, onOk, onFail) {
  const start = Math.max(1, Math.min(5, openCount || 1));
  const tryLoad = (k) => {
    const img = new Image();
    img.onload = () => onOk(`visual/exhibition/hall_lv${k}.jpg`);
    img.onerror = () => { if (k < 5) tryLoad(k + 1); else onFail(); };
    img.src = `visual/exhibition/hall_lv${k}.jpg`;
  };
  tryLoad(start);
}

function renderHallStage(container, openCount) {
  container.innerHTML = '';
  container.className = 'p-3';
  loadHallImage(openCount, (src) => {
    const stage = document.createElement('div');
    stage.className = 'exh-stage';

    const img = document.createElement('img');
    img.src = src;
    img.alt = t('tabExhibitionHall');
    stage.appendChild(img);

    EXHIBITION_ROOM_IDS.forEach(roomId => {
      stage.appendChild(renderSpot(roomId));
      stage.appendChild(renderSpotTag(roomId));
    });

    container.innerHTML = '';
    container.appendChild(stage);
  }, () => {
    // 美术图缺失兜底：退回零美术债卡片网格
    const floor = document.createElement('div');
    floor.className = 'grid grid-cols-2 md:grid-cols-3 gap-4';
    EXHIBITION_ROOM_IDS.forEach(roomId => floor.appendChild(renderEntrance(roomId)));
    container.appendChild(floor);
  });
}

// 单个热点：clip 形内叠「破败暗化层 + hover 发光层」，hover 微浮起；点击行为同旧入口卡
function renderSpot(roomId) {
  const room = EXHIBITION_ROOMS[roomId];
  const spotDef = EXHIBITION_SPOTS[roomId];
  const status = getRoomStatus(roomId);
  const isMusicUnbuilt = roomId === 'musicroom' && status === 'ruined';

  const spot = document.createElement('div');
  spot.className = `exh-spot ${spotDef.arch ? 'arch' : ''} ${status === 'open' ? 'open' : 'ruined'}`;
  spot.dataset.room = roomId;
  spot.style.left = spotDef.x + '%';
  spot.style.top = spotDef.y + '%';
  spot.style.width = spotDef.w + '%';
  spot.style.height = spotDef.h + '%';

  const shape = document.createElement('div');
  shape.className = 'exh-spot-shape';
  shape.innerHTML = `<div class="exh-spot-dim"></div><div class="exh-spot-glow"></div>`;
  spot.appendChild(shape);

  spot.addEventListener('click', () => {
    if (status === 'open') {
      enterRoom(roomId);
    } else if (isMusicUnbuilt) {
      window.switchTab('shop');
    } else {
      openRepairPanel(roomId, spot);
    }
  });
  return spot;
}

// 铭牌标签：叠在图自带的空白铭牌位上；破败修复类房间藏名（❓ 未修复的展厅），修复瞬间亮真名（揭示感）
function renderSpotTag(roomId) {
  const room = EXHIBITION_ROOMS[roomId];
  const spotDef = EXHIBITION_SPOTS[roomId];
  const status = getRoomStatus(roomId);
  const isMusicUnbuilt = roomId === 'musicroom' && status === 'ruined';
  const mystery = status === 'ruined' && !isMusicUnbuilt;

  const tag = document.createElement('div');
  tag.className = `exh-tag ${status === 'open' ? 'open' : 'ruined'}`;
  tag.style.left = (spotDef.x + spotDef.w / 2) + '%';
  tag.style.top = (spotDef.y - 6.2) + '%';
  tag.textContent = mystery
    ? `❓ ${t('exhRoomMystery')} 🔒`
    : `${room.emoji} ${t(room.nameKey)}${status === 'ruined' ? ' 🔒' : ''}`;
  return tag;
}

// 零美术债兜底：大图缺失时的五入口卡片网格（保留旧视觉）
function renderEntrance(roomId) {
  const room = EXHIBITION_ROOMS[roomId];
  const status = getRoomStatus(roomId);
  const isMusicUnbuilt = roomId === 'musicroom' && status === 'ruined';

  const entrance = document.createElement('div');
  entrance.className = `exh-entrance rounded-xl border-2 cursor-pointer select-none ${status === 'open' ? 'open border-magic-gold/40' : 'ruined border-gray-400/40'}`;
  entrance.dataset.room = roomId;

  // 门区（视觉层，灰度滤镜只作用在这层，铭牌保持可读）
  const door = document.createElement('div');
  door.className = 'exh-door relative h-28 flex items-center justify-center';
  door.innerHTML = `
    <span class="text-4xl">${status === 'open' ? room.emoji : (isMusicUnbuilt ? '🚪' : '🔒')}</span>
    ${status === 'ruined' && !isMusicUnbuilt ? '<span class="absolute top-2 right-2 text-xs opacity-70">🔨</span>' : ''}
  `;

  // 铭牌（零美术兜底网格同规则：破败修复类房间藏名）
  const plaque = document.createElement('div');
  plaque.className = 'exh-plaque text-center py-2 px-1';
  const showMystery = status === 'ruined' && !isMusicUnbuilt;
  const nameHtml = `<div class="text-sm font-bold">${showMystery ? `❓ ${t('exhRoomMystery')}` : t(room.nameKey)}</div>`;
  if (status === 'open') {
    plaque.innerHTML = `${nameHtml}<div class="text-[11px] text-magic-gold font-bold">${t('exhEnter')} →</div>`;
  } else if (isMusicUnbuilt) {
    plaque.innerHTML = `${nameHtml}<div class="text-[11px] text-ink-light">${t('exhGoShopBuild')}</div>`;
  } else {
    plaque.innerHTML = `${nameHtml}<div class="text-[11px] text-ink-light">${t('exhRuinedHint')}</div>`;
  }

  entrance.appendChild(door);
  entrance.appendChild(plaque);

  entrance.addEventListener('click', () => {
    if (status === 'open') {
      enterRoom(roomId);
    } else if (isMusicUnbuilt) {
      window.switchTab('shop');
    } else {
      openRepairPanel(roomId, entrance);
    }
  });
  return entrance;
}

function enterRoom(roomId) {
  const room = EXHIBITION_ROOMS[roomId];
  if (room.tab === 'library') {
    window.switchTab('library');
    if (room.subTab && window.switchLibrarySubTab) window.switchLibrarySubTab(room.subTab);
  } else {
    window.switchTab(room.tab);
  }
}

// ========== 修复面板（破败态点击；三轨清单 + 修复按钮置灰） ==========

function openRepairPanel(roomId, entranceEl) {
  const snap = getRepairSnapshot(roomId);
  if (!snap || snap.alreadyOpen) return;
  const room = snap.room;
  const cond = snap.condition;

  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[150] flex items-center justify-center bg-ink/60 backdrop-blur-sm';

  const condRow = cond.progressKey ? `
    <div class="flex items-center gap-2 text-xs ${cond.met ? 'text-green-700' : 'text-ink-light'}">
      <span>${cond.met ? '✓' : '❌'}</span>
      <span>${t(cond.progressKey).replace('{have}', cond.have).replace('{need}', cond.need)}</span>
    </div>` : '';

  const panel = document.createElement('div');
  panel.className = 'parchment-bg rounded-2xl border-2 border-wood/30 shadow-2xl p-6 w-[92%] max-w-sm';
  panel.innerHTML = `
    <h3 class="font-display text-lg font-bold mb-3 text-center">${room.emoji} ${t('exhRepairTitle').replace('{room}', t(room.nameKey))}</h3>
    <div class="space-y-2 mb-4">
      <div class="flex items-center gap-2 text-xs ${snap.slotFree ? 'text-green-700' : 'text-ink-light'}">
        <span>${snap.slotFree ? '✓' : '❌'}</span>
        <span>${t('exhConditionSlot').replace('{have}', state.exhibition.level).replace('{need}', getOpenRoomCount() + 1)}</span>
      </div>
      ${condRow}
      <div class="flex items-center gap-2 text-xs ${snap.coinsEnough ? 'text-green-700' : 'text-ink-light'}">
        <span>${snap.coinsEnough ? '✓' : '❌'}</span>
        <span>${snap.price > 0 ? t('exhConditionCoins').replace('{price}', snap.price.toLocaleString()) : t('exhRepairFree')}</span>
      </div>
    </div>
    <div class="flex gap-3">
      <button class="exh-do-repair flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${canRepairRoom(roomId) ? 'bg-magic-gold text-white hover:shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}" ${canRepairRoom(roomId) ? '' : 'disabled'}>
        ${t('exhRepair')}${snap.price > 0 ? ` 💰${snap.price.toLocaleString()}` : ''}
      </button>
      <button class="exh-cancel-repair px-4 py-2 rounded-lg text-sm font-bold bg-wood/10 hover:bg-wood/20 transition-all">${t('cancel')}</button>
    </div>
  `;

  const close = () => overlay.remove();
  panel.querySelector('.exh-cancel-repair').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const doBtn = panel.querySelector('.exh-do-repair');
  if (doBtn && canRepairRoom(roomId)) {
    doBtn.addEventListener('click', () => {
      const result = repairRoom(roomId);
      if (!result.ok) { close(); return; }
      playSfx('buy_success');
      updateStatusBar();
      close();
      // 修复「蜕变」过渡：光扫 + 灰度褪去（~1.2s），随后重渲染大厅
      if (entranceEl) {
        entranceEl.classList.add('resto-flash');
        entranceEl.querySelector('.exh-door')?.classList.add('resto-reveal');
        setTimeout(() => renderExhibitionPage(), 1250);
      } else {
        renderExhibitionPage();
      }
      showToast(`${room.emoji} ${t(room.nameKey)} ${t('exhRepairDone')}`);
      if (result.grandOpening) showGrandOpeningCelebration();
    });
  }

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}

// ========== 全馆开放庆典（一次性；witness toast 模式的展厅版） ==========

function showGrandOpeningCelebration() {
  playSfx('achievement_unlock');
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[180] flex items-center justify-center bg-ink/70 backdrop-blur-sm animate-fade-in';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-2xl border-2 border-magic-gold/60 shadow-2xl px-8 py-6 text-center max-w-sm mx-4">
      <div class="text-4xl mb-2 animate-bounce">🎊</div>
      <h3 class="font-display text-xl font-bold text-magic-gold mb-1">${t('exhGrandTitle')}</h3>
      <p class="text-sm text-ink-light mb-3">${t('exhGrandDesc')}</p>
      <div class="text-2xl tracking-widest">${EXHIBITION_ROOM_IDS.map(id => EXHIBITION_ROOMS[id].emoji).join(' ')}</div>
    </div>`;
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.5s';
    setTimeout(() => overlay.remove(), 500);
  }, 4000);
}

// ========== 大厅页刷新时的庆典兜底（留声阁直通点亮凑齐五室的场景） ==========

export function checkAndShowGrandOpening() {
  if (checkGrandOpening()) showGrandOpeningCelebration();
}
