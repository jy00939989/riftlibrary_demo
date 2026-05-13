// 图书馆 & 收藏室页面渲染（子标签页：概况 / 成就柜 / 收藏室）
import { state } from '../state.js';
import { getAtmosphereStage, getRandomDescription } from '../../data/atmosphere.js';
import { getAtmosphereLevel } from '../storage.js';
import { getFocusSpeedMultiplier } from '../shop.js';
import { renderAchievements } from './achievements.js';
import { renderCollection } from './collection.js';
import { renderDecorationPage } from './plants.js';

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
      <div class="flex border-b-2 border-wood/20 bg-wood/5">
        <button data-subtab="overview" class="subtab-btn px-5 py-3 text-sm font-bold transition-all
          ${activeSubTab === 'overview' ? 'bg-white text-magic-gold border-b-2 border-magic-gold -mb-0.5' : 'text-ink-light hover:text-ink hover:bg-white/50'}">
          📊 概况
        </button>
        <button data-subtab="achievements" class="subtab-btn px-5 py-3 text-sm font-bold transition-all
          ${activeSubTab === 'achievements' ? 'bg-white text-magic-gold border-b-2 border-magic-gold -mb-0.5' : 'text-ink-light hover:text-ink hover:bg-white/50'}">
          🏆 成就柜
        </button>
        <button data-subtab="collection" class="subtab-btn px-5 py-3 text-sm font-bold transition-all
          ${activeSubTab === 'collection' ? 'bg-white text-magic-gold border-b-2 border-magic-gold -mb-0.5' : 'text-ink-light hover:text-ink hover:bg-white/50'}">
          📦 收藏室
        </button>
        <button data-subtab="decoration" class="subtab-btn px-5 py-3 text-sm font-bold transition-all
          ${activeSubTab === 'decoration' ? 'bg-white text-magic-gold border-b-2 border-magic-gold -mb-0.5' : 'text-ink-light hover:text-ink hover:bg-white/50'}">
          🏺 布置
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
      case 'decoration': renderDecorationTab(contentArea); break;
    }
  }
}

// ========== 概况子标签 ==========

function renderOverview(container, stage, levelInfo, desc, maxAtmo, atmoPercent) {
  container.innerHTML = `
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
    console.error('布置页面渲染失败:', e);
    content.innerHTML = `<p class="text-center text-red-500 py-8">布置页面加载失败: ${e.message}</p>`;
  }
}

// ========== 收藏室子标签 ==========

function renderCollectionTab(container) {
  container.innerHTML = '<div id="collection-content"></div>';
  const content = document.getElementById('collection-content');
  if (!content) return;
  try {
    renderCollection(content);
    console.log('✅ 收藏室渲染完成');
  } catch (e) {
    console.error('收藏室渲染失败:', e);
    content.innerHTML = `<p class="text-center text-red-500 py-8">收藏室加载失败: ${e.message}</p>`;
  }
}
