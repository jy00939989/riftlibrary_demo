// 图书馆 & 收藏室页面渲染（子标签页：概况 / 成就柜 / 收藏室 / 攻略 / 古籍修复室）
// 2026-09-21：布置（温室）子标签退役——温室独立成顶页 tab-greenhouse（图南决策）
import { state } from '../state.js';
import { getAtmosphereStage, getRandomDescription, getStageProgress, getFacilityLevelCap, getFacilityRequiredStage, getStageUpRequirements, getStageThreshold } from '../../data/atmosphere.js';
import { getAtmosphereLevel, canHoldStageCeremony, holdStageCeremony, getStageUpSnapshot } from '../storage.js';
import { getFocusSpeedMultiplier, getSignboardBuffSum } from '../shop.js';
import { getMasteredBookSpeedBonus } from '../core/shop/library-upgrades.js';
import { renderAchievements } from './achievements.js';
import { renderCollection } from './collection.js';
import { TIER_GOALS, getTierStatus, countTierGoalsComplete } from '../../data/tiergoals.js';
import { updateStatusBar } from './common.js';
import { exhibitionBreadcrumbHTML, bindExhibitionBreadcrumb } from './exhibition.js';
import { getAchievementBonuses } from '../achievements.js';
import { t, getAtmosphereStageName } from '../i18n/terms.js';

// 2026-10-27 图南拍板：古籍修复室（renderRestorationTab/保养台/卷组/修缮箱）迁入大书库（bookshelf.js）子标签

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
  // 2026-10-27 图南拍板：古籍修复室迁入大书库（书架页）子标签；
  // 旧调用方（卷组集齐自动跳转等）直通新位置，无需逐个改
  if (name === 'restoration') {
    if (window.switchBookshelfSubTab) { window.switchBookshelfSubTab('restoration'); return; }
  }
  activeSubTab = name;
  renderLibraryPage();
};

export function renderLibraryPage() {
  const container = document.getElementById('page-library');
  if (!container) return;

  const levelInfo = getAtmosphereLevel();
  const stage = getAtmosphereStage(state.library.atmosphere, state.library.stage);
  const desc = getRandomDescription(stage);
  // 阶段内进度（v4.3 换表：进度条 = 当前阶内的推进，不再以 500 为满；
  // D24：进度跟存储阶段走，卡阶等待仪式时满格 100%）
  const atmoProg = getStageProgress(state.library.atmosphere, state.library.stage);

  container.innerHTML = `
    <div class="parchment-bg rounded-2xl magic-glow overflow-hidden">
      <!-- 子标签导航 -->
      <div class="flex border-b-2 border-wood/20 bg-wood/5 overflow-x-auto flex-nowrap" style="-webkit-overflow-scrolling:touch;scrollbar-width:none">
        <button data-subtab="overview" class="subtab-btn flex-shrink-0 px-3 sm:px-5 py-3 text-sm font-bold transition-all
          ${activeSubTab === 'overview' ? 'bg-white text-magic-gold border-b-2 border-magic-gold -mb-0.5' : 'text-ink-light hover:text-ink hover:bg-white/50'}">
          📊 ${t('subtabOverview')}
        </button>
        <button data-subtab="achievements" class="subtab-btn flex-shrink-0 px-3 sm:px-5 py-3 text-sm font-bold transition-all
          ${activeSubTab === 'achievements' ? 'bg-white text-magic-gold border-b-2 border-magic-gold -mb-0.5' : 'text-ink-light hover:text-ink hover:bg-white/50'}">
          🏆 ${t('subtabAchievements')}
        </button>
        <button data-subtab="collection" class="subtab-btn flex-shrink-0 px-3 sm:px-5 py-3 text-sm font-bold transition-all
          ${activeSubTab === 'collection' ? 'bg-white text-magic-gold border-b-2 border-magic-gold -mb-0.5' : 'text-ink-light hover:text-ink hover:bg-white/50'}">
          📦 ${t('subtabCollection')}
        </button>
        <button data-subtab="guide" class="subtab-btn flex-shrink-0 px-3 sm:px-5 py-3 text-sm font-bold transition-all
          ${activeSubTab === 'guide' ? 'bg-white text-magic-gold border-b-2 border-magic-gold -mb-0.5' : 'text-ink-light hover:text-ink hover:bg-white/50'}">
          📖 ${t('subtabGuide')}
        </button>
      </div>

      <!-- 子标签内容区 -->
      <div id="lib-exh-breadcrumb" class="px-6 pt-3"></div>
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
      case 'overview': renderOverview(contentArea, stage, levelInfo, desc, atmoProg); break;
      case 'achievements': renderAchievementsTab(contentArea); break;
      case 'collection': renderCollectionTab(contentArea); break;
      case 'guide': renderGuideTab(contentArea); break;
    }
  }

  // 展览厅面包屑（三个迁入子标签显示，plan §2.3）
  const crumbSlot = container.querySelector('#lib-exh-breadcrumb');
  if (crumbSlot) {
    const roomMap = { achievements: 'achievements', collection: 'collection', decoration: 'signboards' };
    const roomId = roomMap[activeSubTab];
    crumbSlot.innerHTML = roomId ? exhibitionBreadcrumbHTML(roomId) : '';
    bindExhibitionBreadcrumb(crumbSlot);
  }
}

function getTierTerm(tier, suffix) {
  return t(`tierGoal${suffix}${tier.level}`);
}

function getVolumeGroupTitle(group, unlocked) {
  if (!unlocked) return '❓ ???';
  const key = `volumeGroupTitle_${group.collectedBookId}`;
  const term = t(key);
  return term === key ? group.title : term;
}

// ========== 馆长目标阶梯渲染 ==========

function renderTierGoals(stage) {
  // D24：馆长目标阶梯跟「存储阶段」走——卡阶等待仪式时不提前显示下一阶目标。
  // 各阶 stageMin 与阶段阈值一致，直接以当前阶门槛值代入 getTierStatus。
  const curAtmo = stage.min;
  // 2026-10-15：目标完成即结算——已结算的阶（tierPopupsShown）视同完成，
  // 不等氛围跨阶，避免「奖励已领、卡片仍显示进行中」的撕裂感
  const settledTierIds = state.tierPopupsShown || [];

  // 已完成阶 → 紧凑摘要（一行一行）
  const completedTiers = TIER_GOALS.filter(t => settledTierIds.includes(t.id) || getTierStatus(t, curAtmo) === 'completed');
  let completedHTML = '';
  if (completedTiers.length > 0) {
    const names = completedTiers.map(t => `${t.emoji} ${getTierTerm(t, 'Name')}`).join(' → ');
    completedHTML = `
      <div class="mb-3 bg-green-50/30 border border-green-300/30 rounded-lg px-4 py-2.5 flex items-center gap-2">
        <span class="text-sm font-bold text-green-700">${t('completedStage')}</span>
        <span class="text-xs text-green-600">${names}</span>
      </div>`;
  }

  // 当前阶 → 完整展开（已结算的阶不再占位，让位给下一阶）
  const activeTier = TIER_GOALS.find(t => !settledTierIds.includes(t.id) && getTierStatus(t, curAtmo) === 'active');
  let activeHTML = '';
  if (activeTier) {
    const goalsComplete = countTierGoalsComplete(activeTier, state);
    const goalsTotal = activeTier.goals.length;
    const items = activeTier.goals.map(g => {
      const done = g.check(state);
      return `
        <div class="flex items-center gap-2 text-xs ${done ? 'text-green-700' : 'text-ink-light'}">
          <span class="flex-shrink-0 w-4 text-center">${done ? '✅' : '○'}</span>
          <span>${g.icon} ${t(g.id)}</span>
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
                <span class="font-bold text-sm">${getTierTerm(activeTier, 'Name')}</span>
                <span class="text-xs text-ink-light ml-2">${getTierTerm(activeTier, 'Subtitle')}</span>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full bg-magic-gold/20 text-magic-gold font-bold">${t('inProgress')}</span>
            </div>
            <p class="text-xs leading-relaxed italic text-ink-light mb-1">
              " ${getTierTerm(activeTier, 'Flavor')} "
            </p>
            <div class="space-y-1.5 pt-3 mt-3 border-t border-magic-gold/20">
              ${items}
              <div class="mt-2 pt-2 border-t border-ink/5">
                <span class="text-xs text-ink-light">${t('goalProgress').replace('{current}', goalsComplete).replace('{total}', goalsTotal)}</span>
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
    const preview = t('nextTierPreview')
      .replace('{emoji}', nextTier.emoji)
      .replace('{name}', getTierTerm(nextTier, 'Name'))
      .replace('{atmosphere}', nextTier.stageMin);
    nextHTML = `
      <div class="mt-3 text-center text-xs text-ink-light/60">
        ${preview}
      </div>`;
  }

  return `
    <div class="mb-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-display text-sm text-magic-gold font-bold">${t('curatorGoalTitle')}</h3>
        <span class="text-xs px-2 py-0.5 rounded-full bg-magic-gold/10 text-magic-gold font-bold">${t('stageLevel').replace('{level}', stage.level)}</span>
      </div>
      ${completedHTML}
      ${activeHTML}
      ${nextHTML}
    </div>`;
}

// ========== 概况子标签 ==========

function renderOverview(container, stage, levelInfo, desc, atmoProg) {
  const curAtmo = state.library.atmosphere;
  const stageName = getAtmosphereStageName(stage.level);

  // 誊抄速度加成分解（悬停卡片显示）
  // 小于 1% 的加成保留一位小数（精通每本 +0.1%，Math.round 会显示成 +0% 与缮写室横幅不一致）
  const pct = (v) => {
    const p = v * 100;
    return '+' + (p > 0 && p < 1 ? p.toFixed(1) : Math.round(p)) + '%';
  };
  const speedAch = getAchievementBonuses();
  const speedFocusLv = state.library.focusLevel || 0;
  const speedSignboard = getSignboardBuffSum('focus_speed');
  const speedMastery = getMasteredBookSpeedBonus();
  const speedStreakDays = state.focus.streak || 0;
  const speedStreak = speedStreakDays * speedAch.streakMultiplier;
  const speedAchFlat = speedAch.speedFlat || 0;
  const speedLines = [
    `<div class="flex justify-between gap-6"><span>${t('speedTooltipScriptorium').replace('{lv}', speedFocusLv)}</span><span class="font-bold text-magic-blue">${pct(speedFocusLv * 0.05)}</span></div>`,
    speedSignboard > 0 ? `<div class="flex justify-between gap-6"><span>${t('speedTooltipSignboard')}</span><span class="font-bold text-magic-blue">${pct(speedSignboard)}</span></div>` : '',
    speedMastery > 0 ? `<div class="flex justify-between gap-6"><span>${t('speedTooltipMastery')}</span><span class="font-bold text-magic-blue">${pct(speedMastery)}</span></div>` : '',
    speedAchFlat > 0 ? `<div class="flex justify-between gap-6"><span>${t('speedTooltipAchievement')}</span><span class="font-bold text-magic-blue">${pct(speedAchFlat)}</span></div>` : '',
    speedStreak > 0 ? `<div class="flex justify-between gap-6"><span>${t('speedTooltipStreak').replace('{days}', speedStreakDays)}</span><span class="font-bold text-magic-blue">${pct(speedStreak)}</span></div>` : '',
  ].filter(Boolean).join('');
  const stageMin = atmoProg.min;
  const stageNext = atmoProg.next;

  // D24 升阶仪式：氛围达阈值 + 设施条件齐 → 出仪式按钮；氛围过线但条件未齐 → 需求清单
  const ceremonyReady = canHoldStageCeremony();
  const waitingReqs = !ceremonyReady && stageNext !== null && curAtmo >= stageNext;
  const nextReqs = getStageUpRequirements(stage.level + 1);
  const upSnap = getStageUpSnapshot();
  const reqRows = nextReqs ? [
    nextReqs.focus ? { label: `${t('tabScriptorium')} ≥ Lv.${nextReqs.focus}`, met: upSnap.focus >= nextReqs.focus } : null,
    nextReqs.borrow ? { label: `${t('readingArea')} ≥ Lv.${nextReqs.borrow}`, met: upSnap.borrow >= nextReqs.borrow } : null,
    nextReqs.restorationLevel ? { label: `${t('restorationRoom')} ≥ Lv.${nextReqs.restorationLevel}`, met: upSnap.restorationLevel >= nextReqs.restorationLevel } : null,
    nextReqs.restorationUnlocked ? { label: `${t('restorationRoom')}·${t('unlocked')}`, met: upSnap.restorationUnlocked } : null,
    nextReqs.musicRoomUnlocked ? { label: `${t('tabMusicRoom')}·${t('unlocked')}`, met: upSnap.musicRoomUnlocked } : null,
  ].filter(Boolean) : [];

  container.innerHTML = `
    ${renderTierGoals(stage)}

    <!-- 氛围阶段背景图 -->
    <div class="mb-6 rounded-xl overflow-hidden border-2 border-wood/30 shadow-lg">
      <img src="${STAGE_BG[stage.level]}" alt="${t('libraryStageAlt').replace('{stage}', stageName)}" class="w-full h-48 object-cover">
      <div class="bg-ink/70 text-white text-center py-2 text-sm">
        ${t('libraryStageOverlay').replace('{stage}', stageName).replace('{name}', state.library.name)}
      </div>
    </div>

    <div class="text-center mb-8">
      <h2 class="font-display text-2xl font-bold mb-2">${state.library.name}</h2>
      <div class="inline-flex items-center gap-2 bg-wood/10 px-4 py-2 rounded-full mb-3">
        <span class="text-magic-gold">✨</span>
        <span class="font-bold">${t('atmosphereLevelLabel').replace('{stage}', stageName).replace('{level}', levelInfo.level)}</span>
      </div>
      <div class="max-w-md mx-auto mb-3">
        <div class="flex justify-between text-sm text-ink-light mb-1">
          <span>${stageMin}</span><span class="font-bold text-magic-blue">${curAtmo}${stageNext ? `/${stageNext}` : ''}</span><span>${stageNext ?? 'MAX'}</span>
        </div>
        <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-wood via-magic-gold to-magic-gold" style="width:${atmoProg.percent}%"></div>
        </div>
      </div>
      ${ceremonyReady ? `
        <button id="stage-ceremony-btn" class="mt-2 px-6 py-2.5 rounded-full font-bold text-white bg-gradient-to-r from-magic-gold to-yellow-500 shadow-lg hover:shadow-xl transition-all animate-pulse">${t('stageCeremonyBtn')}</button>
        <p class="text-xs text-ink-light mt-1.5">${t('stageCeremonyHint')}</p>`
      : waitingReqs ? `
        <div class="mt-2">
          <p class="text-sm text-magic-gold font-bold mb-1">✨ ${t('stageUpWaiting')}</p>
          <div class="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
            ${reqRows.map(r => `<span class="${r.met ? 'text-green-700' : 'text-ink-light'}">${r.met ? '✓' : '✗'} ${r.label}</span>`).join('')}
          </div>
        </div>`
      : levelInfo.next > 0 ? `<p class="text-sm text-ink-light">${t('needMoreAtmosphere').replace('{n}', levelInfo.next)}</p>` : `<p class="text-sm text-magic-gold">${t('libraryFullyRestored')}</p>`}
    </div>
    <div class="bg-wood/5 border-2 border-wood/20 rounded-xl p-4 mb-6">
      <h3 class="font-bold mb-2 flex items-center gap-2"><span>📖</span> ${t('todayLibrary')}</h3>
      <p class="text-sm leading-relaxed text-ink-light">${desc}</p>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <div class="bg-white/50 rounded-lg p-3 text-center group relative cursor-help">
        <div class="text-2xl mb-1">📝</div><div class="text-xs text-ink-light">${t('transcribeSpeedLabel')}</div><div class="font-bold text-magic-blue">${Math.round(getFocusSpeedMultiplier() * 100)}%</div>
        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 parchment-bg rounded-xl border border-wood/30 shadow-xl p-3 text-left text-xs text-ink leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
          <p class="font-bold text-magic-gold mb-1.5">${t('speedTooltipTitle')}</p>
          ${speedLines}
          <p class="mt-1.5 pt-1.5 border-t border-wood/20 text-ink-light">${t('speedTooltipCap')}</p>
          <p class="mt-1 text-ink-light/80">${t('speedTooltipAuraNote')}</p>
        </div>
      </div>
      <div class="bg-white/50 rounded-lg p-3 text-center">
        <div class="text-2xl mb-1">💰</div><div class="text-xs text-ink-light">${t('coinsGainLabel')}</div><div class="font-bold text-magic-blue">${t('baseline')}</div>
      </div>
      <div class="bg-white/50 rounded-lg p-3 text-center">
        <div class="text-2xl mb-1">👥</div><div class="text-xs text-ink-light">${t('visitorFavorLabel')}</div><div class="font-bold text-magic-blue">${t('baseline')}</div>
      </div>
    </div>
  `;

  // 升阶仪式按钮（D24）：点击升阶 → onStageCross 链路播庆典（见证人/馆长目标），随后刷新页面
  const ceremonyBtn = container.querySelector('#stage-ceremony-btn');
  if (ceremonyBtn) {
    ceremonyBtn.addEventListener('click', () => {
      const result = holdStageCeremony();
      if (result) {
        updateStatusBar();
        renderLibraryPage();
      }
    });
  }
}

// ========== 成就柜子标签 ==========

function renderAchievementsTab(container) {
  container.innerHTML = '<div id="achievements-grid"></div>';
  const grid = document.getElementById('achievements-grid');
  if (grid) renderAchievements(grid);
}

// ========== 馆长手册子标签 ==========

function renderGuideTab(container) {
  container.innerHTML = `
    <div class="space-y-6 max-w-2xl">

      <!-- 欢迎语 -->
      <section class="bg-magic-gold/10 border border-magic-gold/30 rounded-xl p-5 text-center">
        <p class="font-bold text-ink mb-1">${t('curatorOfficeGuide')}</p>
        <p class="text-sm text-ink-light">${t('guideWelcome')}</p>
      </section>

      <!-- 核心循环 -->
      <section class="bg-white/60 rounded-xl p-5 border border-wood/20">
        <h3 class="font-display text-lg font-bold mb-3">${t('coreLoopDesc')}</h3>
        <p class="text-sm text-ink-light">${t('coreLoopDetail')}</p>
      </section>

      <!-- 核心资源 -->
      <section class="bg-white/60 rounded-xl p-5 border border-wood/20">
        <h3 class="font-display text-lg font-bold mb-3">${t('guideResourcesTitle')}</h3>
        <div class="text-sm text-ink-light whitespace-pre-line">${t('guideResourcesDesc')}</div>
      </section>

      <!-- 5个子标签说明 -->
      <section class="bg-white/60 rounded-xl p-5 border border-wood/20">
        <h3 class="font-display text-lg font-bold mb-3">${t('tutorialOfficeDesc')}</h3>
        <div class="space-y-2 text-sm text-ink-light">
          <div class="bg-white rounded-lg p-3 flex items-start gap-2">
            <span class="text-lg">📊</span>
            <div>${t('guideOverviewDesc')}</div>
          </div>
          <div class="bg-white rounded-lg p-3 flex items-start gap-2">
            <span class="text-lg">🏆</span>
            <div>${t('guideAchievementsDesc')}</div>
          </div>
          <div class="bg-white rounded-lg p-3 flex items-start gap-2">
            <span class="text-lg">📦</span>
            <div>${t('guideCollectionDesc')}</div>
          </div>
          <div class="bg-white rounded-lg p-3 flex items-start gap-2">
            <span class="text-lg">🏺</span>
            <div>${t('guideDecorationDesc')}</div>
          </div>
          <div class="bg-white rounded-lg p-3 flex items-start gap-2">
            <span class="text-lg">📖</span>
            <div>${t('guideGuideDesc')}</div>
          </div>
        </div>
      </section>

      <!-- 系统说明 -->
      <section class="bg-white/60 rounded-xl p-5 border border-wood/20">
        <h3 class="font-display text-lg font-bold mb-3">${t('guideFocusTitle')}</h3>
        <p class="text-sm text-ink-light">${t('guideFocusDesc')}</p>
      </section>

      <section class="bg-white/60 rounded-xl p-5 border border-wood/20">
        <h3 class="font-display text-lg font-bold mb-3">${t('guideVisitorTitle')}</h3>
        <p class="text-sm text-ink-light">${t('guideVisitorDesc')}</p>
      </section>

      <section class="bg-white/60 rounded-xl p-5 border border-wood/20">
        <h3 class="font-display text-lg font-bold mb-3">${t('guideItemTitle')}</h3>
        <div class="text-sm text-ink-light whitespace-pre-line">${t('guideItemDesc')}</div>
      </section>

      <section class="bg-white/60 rounded-xl p-5 border border-wood/20">
        <h3 class="font-display text-lg font-bold mb-3">${t('guideRedeemTitle')}</h3>
        <div class="text-sm text-ink-light whitespace-pre-line">${t('guideRedeemDesc')}</div>
      </section>

      <section class="bg-white/60 rounded-xl p-5 border border-wood/20">
        <h3 class="font-display text-lg font-bold mb-3">${t('guideRestorationTitle')}</h3>
        <p class="text-sm text-ink-light">${t('guideRestorationDesc')}</p>
      </section>

      <section class="bg-white/60 rounded-xl p-5 border border-wood/20">
        <h3 class="font-display text-lg font-bold mb-3">${t('guideRecopyTitle')}</h3>
        <p class="text-sm text-ink-light">${t('guideRecopyDesc')}</p>
      </section>

      <section class="bg-white/60 rounded-xl p-5 border border-wood/20">
        <h3 class="font-display text-lg font-bold mb-3">${t('guidePlantTitle')}</h3>
        <p class="text-sm text-ink-light">${t('guidePlantDesc')}</p>
      </section>

      <!-- 常见问题 -->
      <section class="bg-white/60 rounded-xl p-5 border border-wood/20">
        <h3 class="font-display text-lg font-bold mb-3">${t('faq')}</h3>
        <div class="space-y-3 text-sm">
          ${[1,2,3,4,5,6,7,8,9,10,11,12].map(i => `
            <div class="bg-white rounded-lg p-3">
              <div class="font-bold mb-1">${t('faqQ' + i)}</div>
              <p class="text-ink-light">${t('faqA' + i)}</p>
            </div>
          `).join('')}
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
    content.innerHTML = `<p class="text-center text-red-500 py-8">${t('collectionLoadFailed')}</p>`;
  }
}
