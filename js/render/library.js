// 图书馆 & 收藏室页面渲染（子标签页：概况 / 成就柜 / 收藏室 / 布置 / 攻略）
import { state } from '../state.js';
import { ATMOSPHERE_STAGES, getAtmosphereStage, getRandomDescription } from '../../data/atmosphere.js';
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
        <button data-subtab="guide" class="subtab-btn px-5 py-3 text-sm font-bold transition-all
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
      case 'decoration': renderDecorationTab(contentArea); break;
      case 'guide': renderGuideTab(contentArea); break;
    }
  }
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
    <!-- 当前目标 -->
    <div class="mb-6 bg-gradient-to-r from-ink/5 via-ink/5 to-magic-gold/10 rounded-xl p-5 border-2 border-magic-gold/20">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-display text-sm text-magic-gold font-bold">🏛️ 当前目标</h3>
        <span class="text-xs px-2 py-0.5 rounded-full bg-magic-gold/10 text-magic-gold font-bold">阶段 ${stage.level}/5</span>
      </div>
      <p class="text-ink text-sm mb-3">将图书馆从<span class="font-bold line-through decoration-wood/40">废墟</span>恢复至<span class="font-bold text-magic-gold">星辰之境</span></p>
      ${nextStageDef ? `
      <div class="flex items-center gap-2 mb-2">
        <span class="text-xs text-ink-light">当前</span>
        <span class="text-xs font-bold px-2 py-0.5 rounded bg-wood/10">${stage.name}</span>
        <span class="text-xs text-ink-light/50">→</span>
        <span class="text-xs font-bold px-2 py-0.5 rounded bg-magic-gold/5 text-magic-gold">${nextStageDef.name}</span>
      </div>
      <div class="h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
        <div class="h-full bg-gradient-to-r from-magic-gold/70 to-magic-gold rounded-full transition-all duration-700" style="width:${stageProgress}%"></div>
      </div>
      <p class="text-xs text-ink-light">还需 <span class="font-bold text-magic-blue">${levelInfo.next}</span> 点氛围进入「${nextStageDef.name}」阶段</p>
      ` : `
      <p class="text-sm text-magic-gold font-bold">✨ 图书馆已恢复至巅峰状态！</p>
      `}
    </div>

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
    console.log('✅ 收藏室渲染完成');
  } catch (e) {
    console.error('收藏室渲染失败:', e);
    content.innerHTML = `<p class="text-center text-red-500 py-8">收藏室加载失败: ${e.message}</p>`;
  }
}
