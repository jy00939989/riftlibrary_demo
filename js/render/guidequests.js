// 引导任务 UI —— 右下角任务卡片
import { state, saveState } from '../state.js';
import { el } from './common.js';
import { getCurrentQuest, getQuestProgress } from '../guidequests.js';
import { t } from '../i18n/terms.js';

let widgetEl = null;
let isExpanded = false;
let dismissedUntil = 0;

function getPhaseName(phase) {
  return t(`guidePhase${phase}`) || '';
}

export function renderGuideQuestWidget() {
  // 用户已手动关闭且在冷却期内 → 不重新出现
  if (Date.now() < dismissedUntil) return;

  const progress = getQuestProgress();
  const current = getCurrentQuest();

  // 全部完成或当前无任务 → 移除并隐藏
  if (progress.allCompleted || !current) {
    removeWidget();
    return;
  }

  if (widgetEl) {
    updateWidgetContent(current, progress);
    return;
  }

  buildWidget(current, progress);
}

function removeWidget() {
  if (widgetEl) {
    widgetEl.remove();
    widgetEl = null;
  }
}

function buildWidget(current, progress) {
  if (!current) return;

  widgetEl = el('div', 'fixed bottom-6 right-6 z-[80] transition-all duration-300');
  widgetEl.id = 'guide-quest-widget';
  renderWidgetHTML(current, progress);
  document.body.appendChild(widgetEl);

  // 只绑定一次事件监听器，使用事件委托
  widgetEl.addEventListener('click', handleWidgetClick);
}

function renderWidgetHTML(current, progress) {
  if (!widgetEl || !current) return;
  const phase = getPhaseName(current.phase);
  widgetEl.innerHTML = `
    <div class="parchment-bg rounded-xl shadow-lg border border-wood/30 cursor-pointer hover:shadow-xl transition-all"
         style="box-shadow: 0 4px 24px rgba(139,105,20,0.15);">
      <div id="gqw-inner" class="px-4 py-3 ${isExpanded ? 'max-w-xs' : 'max-w-[200px]'} transition-all">
        <div class="flex items-center gap-2 mb-1">
          <span id="gqw-progress" class="text-xs text-magic-gold font-bold">${progress.completed}/${progress.total}</span>
          <span id="gqw-phase" class="text-xs text-ink-light">${phase}</span>
          <button id="gqw-dismiss" type="button" class="ml-auto text-ink-light hover:text-ink text-sm leading-none">&times;</button>
        </div>
        <div id="gqw-title" class="font-bold text-ink text-sm">${current.title}</div>
        <div id="gqw-body" class="${isExpanded ? 'block' : 'hidden'}">
          <div id="gqw-desc" class="mt-2 text-ink-light text-sm leading-relaxed">${current.desc}</div>
          <div id="gqw-reward" class="mt-2 text-xs text-ink-light">
            ${current.rewardCoins > 0 ? `+${current.rewardCoins} ${t('coins')}` : ''}
            ${current.rewardCoins > 0 && current.rewardAtmo > 0 ? ' · ' : ''}
            ${current.rewardAtmo > 0 ? `+${current.rewardAtmo} ${t('atmosphere')}` : ''}
          </div>
        </div>
        <div id="gqw-hint" class="text-xs text-ink-light mt-0.5 ${isExpanded ? 'hidden' : 'block'}">${t('clickToViewDetails')}</div>
      </div>
    </div>
  `;
}

function updateWidgetContent(current, progress) {
  if (!widgetEl || !current) return;

  const phase = getPhaseName(current.phase);
  const progressEl = widgetEl.querySelector('#gqw-progress');
  const phaseEl = widgetEl.querySelector('#gqw-phase');
  const titleEl = widgetEl.querySelector('#gqw-title');
  const descEl = widgetEl.querySelector('#gqw-desc');
  const rewardEl = widgetEl.querySelector('#gqw-reward');
  const bodyEl = widgetEl.querySelector('#gqw-body');
  const hintEl = widgetEl.querySelector('#gqw-hint');
  const innerEl = widgetEl.querySelector('#gqw-inner');

  if (progressEl) progressEl.textContent = `${progress.completed}/${progress.total}`;
  if (phaseEl) phaseEl.textContent = phase;
  if (titleEl) titleEl.textContent = current.title;
  if (descEl) descEl.textContent = current.desc;
  if (rewardEl) {
    rewardEl.innerHTML = `
      ${current.rewardCoins > 0 ? `+${current.rewardCoins} ${t('coins')}` : ''}
      ${current.rewardCoins > 0 && current.rewardAtmo > 0 ? ' · ' : ''}
      ${current.rewardAtmo > 0 ? `+${current.rewardAtmo} ${t('atmosphere')}` : ''}
    `;
  }

  if (innerEl) {
    innerEl.classList.toggle('max-w-xs', isExpanded);
    innerEl.classList.toggle('max-w-[200px]', !isExpanded);
  }
  if (bodyEl) bodyEl.className = isExpanded ? 'block' : 'hidden';
  if (hintEl) hintEl.className = `text-xs text-ink-light mt-0.5 ${isExpanded ? 'hidden' : 'block'}`;
}

function handleWidgetClick(e) {
  // 点击关闭按钮：冷却 30 分钟后才可再次显示
  if (e.target.closest('#gqw-dismiss')) {
    e.stopPropagation();
    dismissedUntil = Date.now() + 30 * 60 * 1000;
    removeWidget();
    return;
  }

  // 点击卡片其他区域：展开/收起
  toggleExpand();
}

function toggleExpand() {
  isExpanded = !isExpanded;
  updateWidgetContent(getCurrentQuest(), getQuestProgress());
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
