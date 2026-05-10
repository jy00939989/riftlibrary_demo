// 图书馆页面渲染
import { state } from '../state.js';
import { getAtmosphereStage, getRandomDescription } from '../../data/atmosphere.js';
import { getAtmosphereLevel } from '../storage.js';

export function renderLibraryPage() {
  const container = document.getElementById('page-library');
  if (!container) return;
  const levelInfo = getAtmosphereLevel();
  const stage = getAtmosphereStage(state.library.atmosphere);
  const desc = getRandomDescription(stage);

  container.innerHTML = `
    <div class="parchment-bg rounded-2xl p-6 magic-glow">
      <div class="text-center mb-8">
        <h2 class="font-display text-2xl font-bold mb-2">${state.library.name}</h2>
        <div class="inline-flex items-center gap-2 bg-wood/10 px-4 py-2 rounded-full mb-3">
          <span class="text-magic-gold">✨</span>
          <span class="font-bold">氛围等级：${stage.name} Lv.${levelInfo.level}</span>
        </div>
        <div class="max-w-md mx-auto mb-3">
          <div class="flex justify-between text-sm text-ink-light mb-1">
            <span>0</span><span class="font-bold text-magic-blue">${state.library.atmosphere}/100</span><span>100</span>
          </div>
          <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-wood via-magic-gold to-magic-gold" style="width:${state.library.atmosphere}%"></div>
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
          <div class="text-2xl mb-1">📝</div><div class="text-xs text-ink-light">誊抄速度</div><div class="font-bold text-magic-blue">基准</div>
        </div>
        <div class="bg-white/50 rounded-lg p-3 text-center">
          <div class="text-2xl mb-1">💰</div><div class="text-xs text-ink-light">代币收益</div><div class="font-bold text-magic-blue">基准</div>
        </div>
        <div class="bg-white/50 rounded-lg p-3 text-center">
          <div class="text-2xl mb-1">👥</div><div class="text-xs text-ink-light">访客好感</div><div class="font-bold text-magic-blue">基准</div>
        </div>
      </div>
    </div>
  `;
}
