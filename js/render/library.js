// 图书馆 & 收藏室页面渲染（子标签页：概况 / 成就柜 / 收藏室 / 布置 / 攻略 / 古籍修复室）
import { state } from '../state.js';
import { ATMOSPHERE_STAGES, getAtmosphereStage, getRandomDescription } from '../../data/atmosphere.js';
import { getAtmosphereLevel } from '../storage.js';
import { getFocusSpeedMultiplier } from '../shop.js';
import { renderAchievements } from './achievements.js';
import { renderCollection } from './collection.js';
import { renderDecorationPage } from './plants.js';
import { TIER_GOALS, getTierStatus, countTierGoalsComplete } from '../../data/tiergoals.js';
import { BOOKS } from '../../data/books.js';
import { VOLUME_GROUPS, getVolumeGroupProgress, isVolumeBookId } from '../../data/volume_groups.js';
import { canCollectVolumeGroup, collectVolumeGroup } from '../volumes.js';
import { storeInRestorationBox, removeFromRestorationBox, getRestorationBoxSlots, getRestorationBoxCount, getRestorationSlotPrice, expandRestorationBoxSlots, getRestorationLevel, getRestorationUpgradePrice, upgradeRestorationLevel, getRestorationRepairSpeedBonus, isRestorationUnlocked, unlockRestorationRoom, getRestorationUnlockPrice } from '../capacity.js';
import { updateStatusBar } from './common.js';
import { playSfx } from '../audio.js';
import { checkAchievements } from '../achievements.js';
import { showAchievementToast } from './achievements.js';
import { checkAndShowTutorial } from '../tutorial.js';
import { dispatchTutorialUI } from './tutorial-ui.js';

// 氛围阶段 → 背景图映射
const STAGE_BG = {
  1: 'visual/background/library_bg_01_abandoned.jpg',
  2: 'visual/background/library_bg_02_ruined.jpg',
  3: 'visual/background/library_bg_03_cozy.jpg',
  4: 'visual/background/library_bg_04_gorgeous.jpg',
  5: 'visual/background/library_bg_05_magnificent.jpg'
};

let activeSubTab = 'overview';

window.renderLibraryPage = renderLibraryPage;

// 供外部调用切换子标签
window.switchLibrarySubTab = function(name) {
  activeSubTab = name;
  renderLibraryPage();
};

export function renderLibraryPage() {
  const container = document.getElementById('page-library');
  if (!container) return;

  const levelInfo = getAtmosphereLevel();
  const stage = getAtmosphereStage(state.library.atmosphere);
  const desc = getRandomDescription(stage);
  const maxAtmo = 500;
  const atmoPercent = Math.min(100, Math.round((state.library.atmosphere / maxAtmo) * 100));

  container.innerHTML = `
    <div class="parchment-bg rounded-2xl magic-glow overflow-hidden">
      <!-- 子标签导航 -->
      <div class="flex border-b-2 border-wood/20 bg-wood/5 overflow-x-auto flex-nowrap" style="-webkit-overflow-scrolling:touch;scrollbar-width:none">
        <button data-subtab="overview" class="subtab-btn flex-shrink-0 px-3 sm:px-5 py-3 text-sm font-bold transition-all
          ${activeSubTab === 'overview' ? 'bg-white text-magic-gold border-b-2 border-magic-gold -mb-0.5' : 'text-ink-light hover:text-ink hover:bg-white/50'}">
          📊 概况
        </button>
        <button data-subtab="achievements" class="subtab-btn flex-shrink-0 px-3 sm:px-5 py-3 text-sm font-bold transition-all
          ${activeSubTab === 'achievements' ? 'bg-white text-magic-gold border-b-2 border-magic-gold -mb-0.5' : 'text-ink-light hover:text-ink hover:bg-white/50'}">
          🏆 成就柜
        </button>
        <button data-subtab="collection" class="subtab-btn flex-shrink-0 px-3 sm:px-5 py-3 text-sm font-bold transition-all
          ${activeSubTab === 'collection' ? 'bg-white text-magic-gold border-b-2 border-magic-gold -mb-0.5' : 'text-ink-light hover:text-ink hover:bg-white/50'}">
          📦 收藏室
        </button>
        <button data-subtab="restoration" class="subtab-btn flex-shrink-0 px-3 sm:px-5 py-3 text-sm font-bold transition-all
          ${activeSubTab === 'restoration' ? 'bg-white text-magic-gold border-b-2 border-magic-gold -mb-0.5' : 'text-ink-light hover:text-ink hover:bg-white/50'}">
          📜 古籍修复室
        </button>
        <button data-subtab="decoration" class="subtab-btn flex-shrink-0 px-3 sm:px-5 py-3 text-sm font-bold transition-all
          ${activeSubTab === 'decoration' ? 'bg-white text-magic-gold border-b-2 border-magic-gold -mb-0.5' : 'text-ink-light hover:text-ink hover:bg-white/50'}">
          🏺 布置
        </button>
        <button data-subtab="guide" class="subtab-btn flex-shrink-0 px-3 sm:px-5 py-3 text-sm font-bold transition-all
          ${activeSubTab === 'guide' ? 'bg-white text-magic-gold border-b-2 border-magic-gold -mb-0.5' : 'text-ink-light hover:text-ink hover:bg-white/50'}">
          📖 馆长手册
        </button>
      </div>

      <!-- 子标签内容区 -->
      <div id="lib-content-area" class="p-6"></div>
    </div>
  `;

  // 绑定子标签切换
  container.querySelectorAll('.subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeSubTab = btn.dataset.subtab;
      renderLibraryPage();
    });
  });

  // 渲染对应子标签内容
  const contentArea = document.getElementById('lib-content-area');
  if (contentArea) {
    switch (activeSubTab) {
      case 'overview': renderOverview(contentArea, stage, levelInfo, desc, maxAtmo, atmoPercent); break;
      case 'achievements': renderAchievementsTab(contentArea); break;
      case 'collection': renderCollectionTab(contentArea); break;
      case 'restoration': renderRestorationTab(contentArea); break;
      case 'decoration': renderDecorationTab(contentArea); break;
      case 'guide': renderGuideTab(contentArea); break;
    }
  }
}

// ========== 馆长目标阶梯渲染 ==========

function renderTierGoals(stage) {
  const curAtmo = state.library.atmosphere;

  // 已完成阶 → 紧凑摘要（一行一行）
  const completedTiers = TIER_GOALS.filter(t => getTierStatus(t, curAtmo) === 'completed');
  let completedHTML = '';
  if (completedTiers.length > 0) {
    const names = completedTiers.map(t => `${t.emoji} ${t.name}`).join(' → ');
    const totalGoals = completedTiers.reduce((s, t) => s + t.goals.length, 0);
    const totalDone = completedTiers.reduce((s, t) => s + countTierGoalsComplete(t, state), 0);
    completedHTML = `
      <div class="mb-3 bg-green-50/30 border border-green-300/30 rounded-lg px-4 py-2.5 flex items-center gap-2">
        <span class="text-sm font-bold text-green-700">✅ 已完成的阶段</span>
        <span class="text-xs text-green-600">${names}</span>
      </div>`;
  }

  // 当前阶 → 完整展开
  const activeTier = TIER_GOALS.find(t => getTierStatus(t, curAtmo) === 'active');
  let activeHTML = '';
  if (activeTier) {
    const goalsComplete = countTierGoalsComplete(activeTier, state);
    const goalsTotal = activeTier.goals.length;
    const items = activeTier.goals.map(g => {
      const done = g.check(state);
      return `
        <div class="flex items-center gap-2 text-xs ${done ? 'text-green-700' : 'text-ink-light'}">
          <span class="flex-shrink-0 w-4 text-center">${done ? '✅' : '○'}</span>
          <span>${g.icon} ${g.label}</span>
        </div>`;
    }).join('');

    activeHTML = `
      <div class="rounded-xl p-4 border-2 border-magic-gold/30 bg-magic-gold/5">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-8 h-8 rounded-full bg-magic-gold/20 flex items-center justify-center text-lg">
            ${activeTier.emoji}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-1 flex-wrap gap-1">
              <div>
                <span class="font-bold text-sm">${activeTier.name}</span>
                <span class="text-xs text-ink-light ml-2">${activeTier.subtitle}</span>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full bg-magic-gold/20 text-magic-gold font-bold">进行中</span>
            </div>
            <p class="text-xs leading-relaxed italic text-ink-light mb-1">
              " ${activeTier.flavor} "
            </p>
            <div class="space-y-1.5 pt-3 mt-3 border-t border-magic-gold/20">
              ${items}
              <div class="mt-2 pt-2 border-t border-ink/5">
                <span class="text-xs text-ink-light">目标进度：${goalsComplete}/${goalsTotal}</span>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  // 下一阶段预告
  const nextTier = TIER_GOALS.find(t => getTierStatus(t, curAtmo) === 'locked');
  let nextHTML = '';
  if (nextTier) {
    nextHTML = `
      <div class="mt-3 text-center text-xs text-ink-light/60">
        🔜 下一阶段「${nextTier.emoji} ${nextTier.name}」—— 氛围达到 <span class="font-bold text-magic-blue">${nextTier.stageMin}</span> 解锁
      </div>`;
  }

  return `
    <div class="mb-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-display text-sm text-magic-gold font-bold">🏛️ 馆长目标 · 复兴之路</h3>
        <span class="text-xs px-2 py-0.5 rounded-full bg-magic-gold/10 text-magic-gold font-bold">阶段 ${stage.level}/5</span>
      </div>
      ${completedHTML}
      ${activeHTML}
      ${nextHTML}
    </div>`;
}

// ========== 概况子标签 ==========

function renderOverview(container, stage, levelInfo, desc, maxAtmo, atmoPercent) {
  const curAtmo = state.library.atmosphere;
  const currStageDef = ATMOSPHERE_STAGES[stage.level - 1];
  const stageMin = currStageDef ? currStageDef.min : 0;
  const stageMax = currStageDef ? currStageDef.max : 30;
  const stageRange = stageMax - stageMin;
  const stageProgress = Math.min(100, Math.round(((curAtmo - stageMin) / stageRange) * 100));
  const nextStageDef = stage.level < 5 ? ATMOSPHERE_STAGES[stage.level] : null;

  container.innerHTML = `
    ${renderTierGoals(stage)}

    <!-- 氛围阶段背景图 -->
    <div class="mb-6 rounded-xl overflow-hidden border-2 border-wood/30 shadow-lg">
      <img src="${STAGE_BG[stage.level]}" alt="图书馆 · ${stage.name}" class="w-full h-48 object-cover">
      <div class="bg-ink/70 text-white text-center py-2 text-sm">
        ${stage.name} · ${state.library.name}
      </div>
    </div>

    <div class="text-center mb-8">
      <h2 class="font-display text-2xl font-bold mb-2">${state.library.name}</h2>
      <div class="inline-flex items-center gap-2 bg-wood/10 px-4 py-2 rounded-full mb-3">
        <span class="text-magic-gold">✨</span>
        <span class="font-bold">氛围等级：${stage.name} Lv.${levelInfo.level}</span>
      </div>
      <div class="max-w-md mx-auto mb-3">
        <div class="flex justify-between text-sm text-ink-light mb-1">
          <span>0</span><span class="font-bold text-magic-blue">${state.library.atmosphere}/${maxAtmo}</span><span>${maxAtmo}</span>
        </div>
        <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-wood via-magic-gold to-magic-gold" style="width:${atmoPercent}%"></div>
        </div>
      </div>
      ${levelInfo.next > 0 ? `<p class="text-sm text-ink-light">还需 ${levelInfo.next} 点氛围升级至下一阶段</p>` : '<p class="text-sm text-magic-gold">图书馆已完全复苏！</p>'}
    </div>
    <div class="bg-wood/5 border-2 border-wood/20 rounded-xl p-4 mb-6">
      <h3 class="font-bold mb-2 flex items-center gap-2"><span>📖</span> 今日图书馆</h3>
      <p class="text-sm leading-relaxed text-ink-light">${desc}</p>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <div class="bg-white/50 rounded-lg p-3 text-center">
        <div class="text-2xl mb-1">📝</div><div class="text-xs text-ink-light">誊抄速度</div><div class="font-bold text-magic-blue">${Math.round(getFocusSpeedMultiplier() * 100)}%</div>
      </div>
      <div class="bg-white/50 rounded-lg p-3 text-center">
        <div class="text-2xl mb-1">💰</div><div class="text-xs text-ink-light">智慧之光获取</div><div class="font-bold text-magic-blue">基准</div>
      </div>
      <div class="bg-white/50 rounded-lg p-3 text-center">
        <div class="text-2xl mb-1">👥</div><div class="text-xs text-ink-light">访客好感</div><div class="font-bold text-magic-blue">基准</div>
      </div>
    </div>
  `;
}

// ========== 成就柜子标签 ==========

function renderAchievementsTab(container) {
  container.innerHTML = '<div id="achievements-grid"></div>';
  const grid = document.getElementById('achievements-grid');
  if (grid) renderAchievements(grid);
}

// ========== 布置子标签 ==========

function renderDecorationTab(container) {
  container.innerHTML = '<div id="decoration-content"></div>';
  const content = document.getElementById('decoration-content');
  if (!content) return;
  try {
    renderDecorationPage();
  } catch (e) {
    content.innerHTML = `<p class="text-center text-red-500 py-8">布置页面加载失败</p>`;
  }
}

// ========== 馆长手册子标签 ==========

function renderGuideTab(container) {
  container.innerHTML = `
    <div class="space-y-6 max-w-2xl">

      <!-- 5个子标签说明 -->
      <section class="bg-white/60 rounded-xl p-5 border border-wood/20">
        <h3 class="font-display text-lg font-bold mb-3">🏛️ 馆长办公室指南</h3>
        <div class="space-y-2 text-sm text-ink-light">
          <div class="bg-white rounded-lg p-3 flex items-start gap-2">
            <span class="text-lg">📊</span>
            <div><strong>概况</strong> — 图书馆数据总览、氛围进度条、修改馆名</div>
          </div>
          <div class="bg-white rounded-lg p-3 flex items-start gap-2">
            <span class="text-lg">🏆</span>
            <div><strong>成就柜</strong> — 查看已解锁成就和未达成条件</div>
          </div>
          <div class="bg-white rounded-lg p-3 flex items-start gap-2">
            <span class="text-lg">📦</span>
            <div><strong>收藏室</strong> — 浏览收集品进度</div>
          </div>
          <div class="bg-white rounded-lg p-3 flex items-start gap-2">
            <span class="text-lg">🏺</span>
            <div><strong>布置</strong> — 植物盆栽、种子库存、标志牌</div>
          </div>
          <div class="bg-white rounded-lg p-3 flex items-start gap-2">
            <span class="text-lg">📖</span>
            <div><strong>馆长手册</strong> — 你正在看这里</div>
          </div>
        </div>
      </section>

      <!-- 核心循环 -->
      <section class="bg-magic-gold/10 border border-magic-gold/30 rounded-xl p-5 text-center">
        <p class="font-bold text-ink mb-1">🖋️ 专注誊抄 → 💰 赚智慧之光 → 🏛️ 升级设施 → 👥 吸引访客 → 📚 解锁更多书籍</p>
        <p class="text-xs text-ink-light">这是图书馆复苏的核心循环，一切操作都围绕它展开。</p>
      </section>

      <!-- 常见问题 -->
      <section class="bg-white/60 rounded-xl p-5 border border-wood/20">
        <h3 class="font-display text-lg font-bold mb-3">❓ 常见问题</h3>
        <div class="space-y-3 text-sm">
          <div class="bg-white rounded-lg p-3">
            <div class="font-bold mb-1">Q: 忘了收归还的书怎么办？</div>
            <p class="text-ink-light">不会有损失。访客会一直等待，直到你去收取。</p>
          </div>
          <div class="bg-white rounded-lg p-3">
            <div class="font-bold mb-1">Q: 氛围怎么涨？</div>
            <p class="text-ink-light">完成书籍、访客还书、里程碑和成就奖励都会提升氛围。</p>
          </div>
          <div class="bg-white rounded-lg p-3">
            <div class="font-bold mb-1">Q: 智慧之光怎么赚？</div>
            <p class="text-ink-light">专注结算（每分钟 0.8）、访客还书、成就奖励、连续 7 天专注奖励。</p>
          </div>
          <div class="bg-white rounded-lg p-3">
            <div class="font-bold mb-1">Q: 如何修改图书馆名字？</div>
            <p class="text-ink-light">馆长办公室 → 概况页，点击馆名即可修改。</p>
          </div>
          <div class="bg-white rounded-lg p-3">
            <div class="font-bold mb-1">Q: 存档在哪里？</div>
            <p class="text-ink-light">保存在浏览器的 localStorage 中，清除浏览器数据会导致存档丢失。</p>
          </div>
          <div class="bg-white rounded-lg p-3">
            <div class="font-bold mb-1">Q: 怎么关背景音乐？</div>
            <p class="text-ink-light">点击顶部导航栏右侧的 🔈 按钮即可。</p>
          </div>
        </div>
      </section>

    </div>
  `;
}

// ========== 收藏室子标签 ==========

function renderCollectionTab(container) {
  container.innerHTML = '<div id="collection-content"></div>';
  const content = document.getElementById('collection-content');
  if (!content) return;
  try {
    renderCollection(content);
  } catch (e) {
    content.innerHTML = `<p class="text-center text-red-500 py-8">收藏室加载失败</p>`;
  }
}

// ========== 古籍修复室子标签 ==========

function renderRestorationTab(container) {
  container.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'space-y-6';

  // 0. 修复室是否已解锁
  if (!isRestorationUnlocked()) {
    const unlockCard = document.createElement('div');
    unlockCard.className = 'bg-amber-50/80 rounded-xl p-6 border-2 border-amber-200 text-center';
    unlockCard.innerHTML = `
      <div class="text-4xl mb-3">🔒</div>
      <h3 class="font-display text-lg font-bold mb-2">古籍修复室尚未开放</h3>
      <p class="text-sm text-ink-light mb-4">残破的修复室堆满灰尘，需要先修缮才能使用。</p>
      <button class="unlock-restoration-btn px-5 py-2 bg-magic-gold text-white text-sm font-bold rounded-lg hover:shadow-lg transition-all">
        修缮开放 💰${getRestorationUnlockPrice().toLocaleString()}
      </button>
    `;
    unlockCard.querySelector('.unlock-restoration-btn').addEventListener('click', () => {
      if (unlockRestorationRoom()) {
        playSfx('buy_success');
        updateStatusBar();
        renderRestorationTab(container);
        // 首次解锁后触发教学
        const trigger = checkAndShowTutorial('restoration_unlock');
        if (trigger) {
          setTimeout(() => dispatchTutorialUI(trigger), 300);
        }
      } else {
        alert('智慧之光不足 💰');
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
  const levelCard = document.createElement('div');
  levelCard.className = 'bg-white/60 rounded-xl p-5 border border-wood/20';
  levelCard.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-3xl">📜</span>
        <div>
          <div class="font-bold text-ink">古籍修复室 Lv.${level}</div>
          <div class="text-xs text-ink-light">修复时额外速度 +${5 + repairBonus}%（基础 5% + 等级 ${repairBonus}%）</div>
        </div>
      </div>
      ${level < maxLevel
        ? `<button class="upgrade-restoration-level-btn px-3 py-1.5 bg-magic-gold text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all">
            升级 💰${upgradePrice.toLocaleString()}
           </button>`
        : '<span class="text-xs text-magic-gold font-bold">已满级 ✨</span>'}
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
        alert('智慧之光不足 💰');
      }
    });
  }
  wrapper.appendChild(levelCard);

  // 1. 卷组进度与合成
  const groupsSection = document.createElement('div');
  groupsSection.className = 'bg-white/60 rounded-xl p-5 border border-wood/20';
  groupsSection.innerHTML = `<h3 class="font-display text-lg font-bold mb-4">📜 长书卷组</h3>`;

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
    const groupTitle = groupUnlocked ? group.title : '❓ ???';

    const percent = Math.round((progress.completed / progress.total) * 100);
    card.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-2xl">${groupEmoji}</span>
          <div>
            <div class="font-bold text-ink">${groupTitle}</div>
            <div class="text-xs text-ink-light">${progress.completed}/${progress.total} 卷已抄完</div>
          </div>
        </div>
        ${collectable ? `<button class="collect-btn px-3 py-1.5 bg-magic-gold text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all" data-group="${group.collectedBookId}">合成典藏版</button>` : ''}
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
          <span class="text-sm font-bold">${book ? (book.volumeTitle || book.title) : id}</span>
        </div>
        <button class="remove-restoration-btn text-xs px-2 py-1 bg-wood/10 hover:bg-wood/20 rounded" data-id="${id}">取出</button>
      </div>
    `;
  }).join('');

  boxSection.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-display text-lg font-bold">🧰 修缮箱</h3>
      <div class="text-xs text-ink-light">${count}/${slots} 格</div>
    </div>
    <p class="text-xs text-ink-light mb-3">锁入修缮箱的单卷不会被访客借出、不会损坏，仍可参与合成典藏版。</p>
    ${boxItems ? `<div class="space-y-2 mb-4">${boxItems}</div>` : '<p class="text-sm text-ink-light mb-4">修缮箱为空。</p>'}
    ${canExpand ? `
      <button class="expand-restoration-btn px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-200 transition-all">
        + 扩容至 ${slots + 1} 格 💰${boxPrice.toLocaleString()}
      </button>
    ` : '<span class="text-xs text-magic-gold font-bold">已达到最大 20 格</span>'}
  `;

  const expandBtn = boxSection.querySelector('.expand-restoration-btn');
  if (expandBtn) {
    expandBtn.addEventListener('click', () => {
      if (expandRestorationBoxSlots()) {
        playSfx('buy_success');
        updateStatusBar();
        renderRestorationTab(container);
      } else {
        alert('智慧之光不足 💰');
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
          <span class="text-sm font-bold">${book ? (book.volumeTitle || book.title) : id}</span>
        </div>
        <button class="store-restoration-btn text-xs px-2 py-1 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded" data-id="${id}">锁入修缮箱</button>
      </div>
    `;
  }).join('');

  storeSection.innerHTML = `
    <h3 class="font-display text-lg font-bold mb-3">🔒 可保护的单卷</h3>
    ${storeRows ? `<div class="space-y-2">${storeRows}</div>` : '<p class="text-sm text-ink-light">没有可锁入的单卷。</p>'}
  `;

  storeSection.querySelectorAll('.store-restoration-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (storeInRestorationBox(btn.dataset.id)) {
        renderRestorationTab(container);
      } else {
        alert('修缮箱已满或该卷无法锁入');
      }
    });
  });

  wrapper.appendChild(storeSection);
  container.appendChild(wrapper);
}

function renderVolumeRow(bookId) {
  const bs = state.books[bookId];
  const book = BOOKS[bookId];
  if (!book) return '';

  const isLocked = !bs || bs.status === 'locked';
  let statusText = '未获得';
  let statusClass = 'text-gray-400';
  let extra = '';

  if (!isLocked) {
    const borrowed = (state.visitors || []).some(v =>
      v.bookId === bookId && (v.status === 'borrowed' || v.status === 'due')
    );
    if (bs.damaged) {
      statusText = '损坏待修';
      statusClass = 'text-red-500';
    } else if (borrowed) {
      statusText = '外借中';
      statusClass = 'text-amber-500';
    } else if (bs.status === 'completed') {
      statusText = '已抄完';
      statusClass = 'text-green-600';
    } else {
      statusText = '誊抄中';
      statusClass = 'text-magic-blue';
    }
    extra = bs.damaged ? ' 🩹' : (borrowed ? ' 📤' : (bs.status === 'completed' ? ' ✓' : ' ✎'));
  }

  // 未获得的卷保持神秘感，不显示卷名
  const displayName = isLocked ? '❓ ???' : (book.volumeTitle || book.title);

  return `
    <div class="flex items-center justify-between text-xs bg-wood/5 rounded-lg px-3 py-1.5">
      <span class="font-medium">${displayName}</span>
      <span class="${statusClass}">${statusText}${extra}</span>
    </div>
  `;
}
