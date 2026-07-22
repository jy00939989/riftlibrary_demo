// 卷追踪面板 —— 书架页常驻组件
// 按卷组聚合显示收集/抄写进度与可合成状态

import { state } from '../state.js';
import { VOLUME_GROUPS, getVolumeGroupProgress } from '../../data/volume_groups.js';
import { canCollectVolumeGroup } from '../volumes.js';
import { BOOKS } from '../../data/books.js';

export function renderVolumeTracker(container) {
  if (!container) return;
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'bg-white/60 rounded-xl p-4 border border-wood/20 mb-6';

  const header = document.createElement('div');
  header.className = 'flex items-center justify-between mb-3';
  header.innerHTML = `
    <h3 class="font-display text-sm font-bold text-ink">📜 长书分卷进度</h3>
    <button class="goto-restoration text-xs text-magic-blue hover:underline">前往古籍修复室 →</button>
  `;
  header.querySelector('.goto-restoration').addEventListener('click', () => {
    if (window.switchTab) window.switchTab('library');
    if (window.switchLibrarySubTab) window.switchLibrarySubTab('restoration');
  });
  wrapper.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3';

  Object.values(VOLUME_GROUPS).forEach(group => {
    const progress = getVolumeGroupProgress(group, state.books);
    const collectable = canCollectVolumeGroup(group);
    const percent = Math.round((progress.completed / progress.total) * 100);
    const ownedCount = group.volumeIds.filter(id => {
      const bs = state.books[id];
      return bs && bs.status !== 'locked';
    }).length;

    const card = document.createElement('div');
    card.className = `rounded-lg p-3 border text-xs ${collectable ? 'bg-magic-gold/10 border-magic-gold/40' : 'bg-white border-wood/10'}`;
    card.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-1.5">
          <span>${group.emoji}</span>
          <span class="font-bold">${group.title}</span>
        </div>
        ${collectable ? '<span class="text-[10px] px-1.5 py-0.5 bg-magic-gold text-white rounded-full font-bold">可合成</span>' : ''}
      </div>
      <div class="flex items-center justify-between text-ink-light mb-1">
        <span>已收集 ${ownedCount}/${group.volumeCount}</span>
        <span>已抄完 ${progress.completed}/${progress.total}</span>
      </div>
      <div class="w-full h-1.5 bg-wood/10 rounded-full overflow-hidden">
        <div class="h-full ${collectable ? 'bg-magic-gold' : 'bg-magic-blue'} rounded-full" style="width:${percent}%"></div>
      </div>
    `;
    grid.appendChild(card);
  });

  wrapper.appendChild(grid);
  container.appendChild(wrapper);
}
