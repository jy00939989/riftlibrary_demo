// 收藏室 UI 渲染
import { getCollectionState } from '../collection.js';
import { t } from '../i18n/terms.js';

const CATEGORY_LABEL_KEYS = {
  '童话': 'categoryFairyTale',
  '寓言': 'categoryFable',
  '小说': 'categoryNovel',
  '诗歌': 'categoryPoetry',
  '戏剧': 'categoryDrama',
  '散文': 'categoryProse',
  '哲学': 'categoryPhilosophy',
  '传记': 'categoryBiography',
  '历史': 'categoryHistory',
  '科学': 'categoryScience',
  '神话': 'categoryMythology',
  '志怪': 'categoryZhiguai',
};

function getCategoryLabel(c) {
  return t(CATEGORY_LABEL_KEYS[c] || c) || c;
}

export function renderCollection(container) {
  let categories;
  try {
    categories = getCollectionState();
  } catch (e) {
    container.innerHTML = `<p class="text-center text-ink-light py-8">${t('collectionLoading')}</p>`;
    return;
  }

  if (!categories || categories.length === 0) {
    container.innerHTML = `<p class="text-center text-ink-light py-8">${t('collectionEmpty')}</p>`;
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
            <span class="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">🏗️ ${t('collectionInPlanning')}</span>
          </div>
          <p class="text-xs text-ink-light">${t('collectionCategoryFutureRelease')}</p>
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
        <span>📖 ${t('collectionBooksOwned').replace('{n}', p.owned)}</span>
        <span>✅ ${t('collectionBooksShelved').replace('{n}', p.completed)}</span>
      </div>
  `;

  // 分类明细
  if (p.byCategory) {
    html += '<div class="grid grid-cols-3 sm:grid-cols-4 gap-2">';
    Object.entries(p.byCategory).sort((a, b) => b[1].owned - a[1].owned).forEach(([name, stats]) => {
      const catPercent = stats.total > 0 ? Math.round((stats.owned / stats.total) * 100) : 0;
      html += `
        <div class="bg-wood/5 rounded-lg p-2 text-center">
          <div class="text-xs font-bold">${getCategoryLabel(name)}</div>
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
      const hasValue = item.hasValue;
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
        <span class="text-sm font-bold text-magic-blue">${t('collectionPlanesOpened').replace('{current}', p.acquired).replace('{total}', p.total)}</span>
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
                ${pl.charsMet > 0 ? t('charactersVisited').replace('{met}', pl.charsMet).replace('{total}', pl.charsTotal) : t('portalOpened')}
                ${pl.mementoCount > 0 ? ` · 🏛️ ${t('mementosCollected').replace('{n}', pl.mementoCount)}` : ''}
              </div>
            </div>
          </div>
          <span class="text-xs text-magic-gold">${t('actNumber').replace('{n}', pl.stage || 1)} →</span>
        </div>
      </div>
    `;
  });

  // 预留位面
  html += `
    <div class="bg-gray-50 rounded-lg p-3 border-2 border-dashed border-gray-200 opacity-60 text-center">
      <span class="text-xl">🔒</span>
      <div class="text-xs text-ink-light mt-1">${t('collectionNewPortalHint')}</div>
    </div>
  `;

  html += '</div></div>';
  return html;
}
