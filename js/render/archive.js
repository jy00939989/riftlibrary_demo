// 图书馆档案页面渲染
import { state } from '../state.js';

export function renderArchivePage() {
  const container = document.getElementById('page-archive');
  if (!container) return;
  container.innerHTML = `
    <div class="parchment-bg rounded-2xl p-6 magic-glow">
      <h2 class="font-display text-xl font-bold mb-6">图书馆档案</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div class="bg-white rounded-lg p-3 text-center shadow">
          <div class="text-2xl font-bold text-magic-blue">${state.focus.totalMinutes}</div>
          <div class="text-xs text-ink-light">总专注分钟</div>
        </div>
        <div class="bg-white rounded-lg p-3 text-center shadow">
          <div class="text-2xl font-bold text-magic-gold">${Object.values(state.books).filter(b => b.status === 'completed').length}</div>
          <div class="text-xs text-ink-light">完成书籍</div>
        </div>
        <div class="bg-white rounded-lg p-3 text-center shadow">
          <div class="text-2xl font-bold text-purple-600">🔥 ${state.focus.streak}</div>
          <div class="text-xs text-ink-light">连续专注天数</div>
        </div>
        <div class="bg-white rounded-lg p-3 text-center shadow">
          <div class="text-2xl font-bold text-green-600">${state.coins}</div>
          <div class="text-xs text-ink-light">累计智慧之光</div>
        </div>
      </div>
      ${state.history.length > 0 ? `
        <h3 class="font-bold mb-3">事件历史</h3>
        <div class="space-y-3">
          ${state.history.slice(0, 10).map(h => `
            <div class="flex gap-3">
              <div class="flex flex-col items-center">
                <div class="w-3 h-3 bg-magic-gold rounded-full"></div>
                <div class="w-0.5 h-full bg-wood/20"></div>
              </div>
              <div class="pb-4">
                <div class="text-xs text-ink-light">${new Date(h.time).toLocaleString('zh-CN')}</div>
                <div class="font-bold">${h.title}</div>
                <div class="text-sm text-ink-light">${h.detail}</div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : '<p class="text-ink-light text-center py-8">暂无记录，开始你的第一次专注吧 ✨</p>'}
    </div>
  `;
}
