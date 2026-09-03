// Daily tasks panel for the focus page
import { state } from '../../state.js';
import { el, updateStatusBar } from '../common.js';
import { ensureDailyTasks, claimAllDoneBonus } from '../../dailytasks.js';
import { t } from '../../i18n/terms.js';

export function renderDailyTasks() {
  ensureDailyTasks();
  const dt = state.dailyTasks;
  const done = (dt.focusDone ? 1 : 0) + (dt.returnDone ? 1 : 0) + (dt.waterDone ? 1 : 0);
  const allDone = done === 3;

  const tasks = [
    { icon: '🖋️', label: t('dailyFocus25Min'), done: dt.focusDone, reward: '💰 30' },
    { icon: '📥', label: t('dailyReturnBook'), done: dt.returnDone, reward: '✨ +1氛围' },
    { icon: '🌱', label: t('dailyWaterPlant'), done: dt.waterDone, reward: '💰 10' }
  ];

  const card = el('div', 'mb-4 rounded-xl overflow-hidden border border-wood/20');
  card.style.background = 'linear-gradient(180deg, rgba(245,230,200,0.75) 0%, rgba(232,213,168,0.55) 100%)';
  card.style.boxShadow = 'inset 0 0 30px rgba(139,105,20,0.06), 0 1px 4px rgba(0,0,0,0.08)';

  card.innerHTML = `
    <div class="flex items-center gap-2 px-4 pt-3 pb-1">
      <span class="text-sm">📜</span>
      <span class="text-xs font-bold tracking-wider" style="color:#6b5010">${t('dailyTask')}</span>
      <span class="text-[11px] ml-auto font-bold" style="color:${allDone ? '#c9a227' : '#2c2419'}">${allDone ? t('allDoneText') : `${done}/3`}</span>
    </div>
    <div class="px-3 pb-1">
      ${tasks.map((task, i) => `
        <div class="flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-500 ${task.done ? '' : ''}"
             style="${task.done
               ? 'background:linear-gradient(90deg, rgba(201,162,39,0.1) 0%, transparent 100%);'
               : ''}${i < 2 ? 'margin-bottom:2px;' : ''}">
          <div class="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-base transition-all duration-500"
               style="${task.done
                 ? 'background:rgba(201,162,39,0.18); box-shadow:0 0 8px rgba(201,162,39,0.12);'
                 : 'background:rgba(44,36,25,0.06);'}">
            ${task.icon}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-[13px] font-bold transition-all duration-500"
                 style="color:${task.done ? '#6b5010' : '#2c2419'}">
              ${task.done ? '✓ ' : ''}${task.label}
            </div>
          </div>
          <div class="text-[11px] transition-all duration-500 font-bold"
               style="color:${task.done ? '#b08818' : '#5c4d3c'}">
            ${task.reward}
          </div>
        </div>
      `).join('')}
    </div>
    ${allDone && !dt.allClaimed ? `
      <button class="claim-all-btn w-full px-4 py-2.5 text-xs font-bold tracking-wider transition-all duration-300"
              style="background:linear-gradient(135deg, rgba(201,162,39,0.85) 0%, rgba(180,140,20,0.9) 100%); color:#fff; letter-spacing:0.06em;">
        ${t('claimAllDoneReward')}
      </button>
    ` : allDone ? `
      <div class="text-center py-2 text-[11px] tracking-wider font-bold" style="color:#6b5010;">${t('dailyTasksAllCompleted')}</div>
    ` : ''}
  `;

  if (allDone && !dt.allClaimed) {
    const claimBtn = card.querySelector('.claim-all-btn');
    claimBtn.addEventListener('click', () => {
      const bonus = claimAllDoneBonus(state);
      if (bonus) {
        claimBtn.textContent = t('rewardClaimed');
        claimBtn.disabled = true;
        claimBtn.style.opacity = '0.6';
        updateStatusBar();
      }
    });
  }

  return card;
}
