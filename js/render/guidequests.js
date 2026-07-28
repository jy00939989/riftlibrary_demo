// 引导任务 UI —— 右下角任务卡片
import { state } from '../state.js';
import { el } from './common.js';
import { getCurrentQuest, getQuestProgress, getAllQuests } from '../guidequests.js';
import { t } from '../i18n/terms.js';

let widgetEl = null;
let isExpanded = false;

function getPhaseName(phase) {
  return t(`guidePhase${phase}`) || '';
}

export function renderGuideQuestWidget() {
  const progress = getQuestProgress();
  const current = getCurrentQuest();

  // 全部完成则隐藏
  if (progress.allCompleted) {
    if (widgetEl) {
      widgetEl.remove();
      widgetEl = null;
    }
    return;
  }

  if (widgetEl) {
    updateWidgetContent(current, progress);
    return;
  }

  buildWidget(current, progress);
}

function buildWidget(current, progress) {
  if (!current) return;

  widgetEl = el('div', 'fixed bottom-6 right-6 z-[80] transition-all duration-300');
  widgetEl.id = 'guide-quest-widget';
  widgetEl.innerHTML = widgetHTML(current, progress);
  document.body.appendChild(widgetEl);

  // 点击事件
  widgetEl.addEventListener('click', (e) => {
    if (e.target.closest('#gqw-dismiss')) {
      widgetEl.remove();
      widgetEl = null;
      return;
    }
    toggleExpand(current, progress);
  });
}

function widgetHTML(current, progress) {
  const phase = getPhaseName(current.phase);
  return `
    <div class="parchment-bg rounded-xl shadow-lg border border-wood/30 cursor-pointer hover:shadow-xl transition-all"
         style="box-shadow: 0 4px 24px rgba(139,105,20,0.15);">
      <div id="gqw-inner" class="px-4 py-3 ${isExpanded ? 'max-w-xs' : 'max-w-[200px]'} transition-all">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs text-magic-gold font-bold">${progress.completed}/${progress.total}</span>
          <span class="text-xs text-ink-light">${phase}</span>
          <button id="gqw-dismiss" class="ml-auto text-ink-light hover:text-ink text-sm leading-none">&times;</button>
        </div>
        <div class="font-bold text-ink text-sm">${current.title}</div>
        ${isExpanded ? `
          <div class="mt-2 text-ink-light text-sm leading-relaxed">${current.desc}</div>
          <div class="mt-2 text-xs text-ink-light">
            ${current.rewardCoins > 0 ? `+${current.rewardCoins} ${t('coins')}` : ''}
            ${current.rewardCoins > 0 && current.rewardAtmo > 0 ? ' · ' : ''}
            ${current.rewardAtmo > 0 ? `+${current.rewardAtmo} ${t('atmosphere')}` : ''}
          </div>
        ` : `
          <div class="text-xs text-ink-light mt-0.5">${t('clickToViewDetails')}</div>
        `}
      </div>
    </div>
  `;
}

function updateWidgetContent(current, progress) {
  if (!widgetEl || !current) return;
  const inner = widgetEl.querySelector('#gqw-inner');
  if (inner) {
    inner.innerHTML = widgetHTML(current, progress).match(/id="gqw-inner"[^>]*>([\s\S]*)<\/div>/)?.[1] || '';
  }
}

function toggleExpand(current, progress) {
  isExpanded = !isExpanded;
  const inner = widgetEl.querySelector('#gqw-inner');
  if (inner) {
    if (isExpanded) {
      inner.classList.remove('max-w-[200px]');
      inner.classList.add('max-w-xs');
    } else {
      inner.classList.add('max-w-[200px]');
      inner.classList.remove('max-w-xs');
    }
  }
  // 重建内容
  if (widgetEl && current) {
    widgetEl.innerHTML = widgetHTML(current, progress);
    // 重新绑定事件
    widgetEl.addEventListener('click', (e) => {
      if (e.target.closest('#gqw-dismiss')) {
        widgetEl.remove();
        widgetEl = null;
        return;
      }
      const c = getCurrentQuest();
      const p = getQuestProgress();
      toggleExpand(c, p);
    });
  }
}

// 任务完成时的 toast 动画
export function showQuestCompleteToast(quest) {
  if (!quest) return;
  const toast = el('div', 'fixed top-24 left-1/2 -translate-x-1/2 z-[90] animate-scale-in pointer-events-none');
  toast.innerHTML = `
    <div class="parchment-bg rounded-xl px-5 py-3 shadow-lg border border-magic-gold/40 text-center"
         style="box-shadow: 0 0 20px rgba(201,162,39,0.3);">
      <div class="text-xs text-magic-gold mb-1">${t('questCompleted')}</div>
      <div class="font-bold text-ink text-base">${quest.title}</div>
      <div class="text-xs text-ink-light mt-1">
        ${quest.rewardCoins > 0 ? `+${quest.rewardCoins} ${t('coins')}` : ''}
        ${quest.rewardCoins > 0 && quest.rewardAtmo > 0 ? ' · ' : ''}
        ${quest.rewardAtmo > 0 ? `+${quest.rewardAtmo} ${t('atmosphere')}` : ''}
      </div>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s';
    setTimeout(() => toast.remove(), 500);
  }, 2500);
}
