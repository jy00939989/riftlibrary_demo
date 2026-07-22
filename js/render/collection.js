// 收藏室 UI 渲染
import { getCollectionState } from '../collection.js';

export function renderCollection(container) {
  let categories;
  try {
    categories = getCollectionState();
  } catch (e) {
    container.innerHTML = `<p class="text-center text-ink-light py-8">收集系统加载中…</p>`;
    return;
  }

  if (!categories || categories.length === 0) {
    container.innerHTML = '<p class="text-center text-ink-light py-8">暂无收集数据</p>';
    return;
  }

  let html = '<div class="space-y-6">';

  categories.forEach(cat => {
    const p = cat.progress;

    if (!cat.mvp) {
      // 占位项
      html += `
        <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 opacity-60">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-bold flex items-center gap-2">
              <span class="text-2xl">${cat.emoji}</span> ${cat.name}
            </h4>
            <span class="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">🏗️ 规划中</span>
          </div>
          <p class="text-xs text-ink-light">该收集品类将在后续版本中开放。</p>
        </div>
      `;
      return;
    }

    // 实装项
    if (cat.id === 'books') {
      html += renderBooksCategory(cat, p);
    } else if (cat.id === 'milestones') {
      html += renderMilestonesCategory(cat, p);
    } else if (cat.id === 'plane_archive') {
      html += renderPlaneArchive(cat, p);
    }
  });

  html += '</div>';
  container.innerHTML = html;
}

function renderBooksCategory(cat, p) {
  let html = `
    <div class="bg-white border-2 border-wood/20 rounded-xl p-5">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-bold flex items-center gap-2">
          <span class="text-2xl">${cat.emoji}</span> ${cat.name}
        </h4>
        <span class="text-sm font-bold text-magic-blue">${p.owned}/${p.total} · ${p.percent}%</span>
      </div>
      <div class="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
        <div class="h-full bg-gradient-to-r from-magic-blue to-magic-gold" style="width:${p.percent}%"></div>
      </div>
      <div class="flex items-center gap-4 text-xs text-ink-light mb-4">
        <span>📖 已上架 <b>${p.owned}</b> 本</span>
        <span>✅ 已完成 <b>${p.completed}</b> 本</span>
      </div>
  `;

  // 分类明细
  if (p.byCategory) {
    html += '<div class="grid grid-cols-3 sm:grid-cols-4 gap-2">';
    Object.entries(p.byCategory).sort((a, b) => b[1].owned - a[1].owned).forEach(([name, stats]) => {
      const catPercent = stats.total > 0 ? Math.round((stats.owned / stats.total) * 100) : 0;
      html += `
        <div class="bg-wood/5 rounded-lg p-2 text-center">
          <div class="text-xs font-bold">${name}</div>
          <div class="text-lg font-bold text-magic-blue">${stats.owned}<span class="text-xs text-ink-light font-normal">/${stats.total}</span></div>
          <div class="h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
            <div class="h-full bg-magic-gold" style="width:${catPercent}%"></div>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  html += '</div>';
  return html;
}

function renderMilestonesCategory(cat, p) {
  let html = `
    <div class="bg-white border-2 border-wood/20 rounded-xl p-5">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-bold flex items-center gap-2">
          <span class="text-2xl">${cat.emoji}</span> ${cat.name}
        </h4>
        <span class="text-sm font-bold text-magic-blue">${p.acquired}/${p.total}</span>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
  `;

  if (p.items) {
    p.items.forEach(item => {
      const hasValue = item.value !== '0' && item.value !== '0 个' && item.value !== 'Lv.0' && item.value !== '废墟';
      html += `
        <div class="rounded-lg p-3 text-center ${hasValue ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-100 opacity-60'}">
          <div class="text-xl mb-1">${item.icon}</div>
          <div class="text-xs text-ink-light">${item.name}</div>
          <div class="font-bold text-sm ${hasValue ? 'text-magic-gold' : 'text-gray-400'}">${item.value}</div>
        </div>
      `;
    });
  }

  html += '</div></div>';
  return html;
}

function renderPlaneArchive(cat, p) {
  const planes = p.planes || [];
  const unlocked = planes.filter(pl => pl.stage >= 0);
  const locked = planes.filter(pl => pl.stage < 0);

  let html = `
    <div class="bg-white border-2 border-wood/20 rounded-xl p-5">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-bold flex items-center gap-2">
          <span class="text-2xl">${cat.emoji}</span> ${cat.name}
        </h4>
        <span class="text-sm font-bold text-magic-blue">${p.acquired}/${p.total} 已开启</span>
      </div>

      <div class="space-y-3">
  `;

  // 已解锁位面
  planes.forEach(pl => {
    html += `
      <div class="bg-wood/5 rounded-lg p-3 cursor-pointer hover:shadow transition-all border border-wood/10">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xl">${pl.emoji}</span>
            <div>
              <div class="font-bold text-sm">${pl.name}</div>
              <div class="text-xs text-ink-light">
                ${pl.charsMet > 0 ? `📖 角色 ${pl.charsMet}/${pl.charsTotal}` : '传送门已开启'}
                ${pl.mementoCount > 0 ? ` · 🏛️ 纪念品 ${pl.mementoCount}件` : ''}
              </div>
            </div>
          </div>
          <span class="text-xs text-magic-gold">第${pl.stage || 1}幕 →</span>
        </div>
      </div>
    `;
  });

  // 预留位面
  html += `
    <div class="bg-gray-50 rounded-lg p-3 border-2 border-dashed border-gray-200 opacity-60 text-center">
      <span class="text-xl">🔒</span>
      <div class="text-xs text-ink-light mt-1">新的传送门尚未开启…</div>
    </div>
  `;

  html += '</div></div>';
  return html;
}
