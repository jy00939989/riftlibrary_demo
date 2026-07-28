// 成就柜 UI 渲染
import { getAchievementState } from '../achievements.js';
import { state, saveState } from '../state.js';
import { t, getLocale } from '../i18n/terms.js';

const RARITY_STYLES = {
  bronze: { border: 'border-amber-700/40', bg: 'bg-amber-50', badge: 'bg-amber-700', glow: '' },
  silver: { border: 'border-slate-300', bg: 'bg-slate-50', badge: 'bg-slate-400', glow: '' },
  gold: { border: 'border-yellow-400', bg: 'bg-yellow-50', badge: 'bg-yellow-500', glow: 'shadow-[0_0_8px_rgba(234,179,8,0.3)]' },
  platinum: { border: 'border-purple-400', bg: 'bg-purple-50', badge: 'bg-purple-500', glow: 'shadow-[0_0_12px_rgba(168,85,247,0.4)]' }
};

const BONUS_TEXTS = {
  'W06': 'achBonus_W06',
  'L04': 'achBonus_L04',
  'B07': 'achBonus_B07',
  'V02': 'achBonus_V02',
  'W07': 'achBonus_W07',
  'B08': 'achBonus_B08',
};

// ========== 墨墨成就点评 ==========

const MOMO_ACHIEVEMENT_COMMENTS = {
  restoration: [
    'momoComment_restoration_0',
    'momoComment_restoration_1',
    'momoComment_restoration_2',
    'momoComment_restoration_3',
  ],
  wisdom: [
    'momoComment_wisdom_0',
    'momoComment_wisdom_1',
    'momoComment_wisdom_2',
    'momoComment_wisdom_3',
  ],
  collection: [
    'momoComment_collection_0',
    'momoComment_collection_1',
    'momoComment_collection_2',
    'momoComment_collection_3',
  ],
  reconstruction: [
    'momoComment_reconstruction_0',
    'momoComment_reconstruction_1',
    'momoComment_reconstruction_2',
    'momoComment_reconstruction_3',
  ],
  visitors: [
    'momoComment_visitors_0',
    'momoComment_visitors_1',
    'momoComment_visitors_2',
    'momoComment_visitors_3',
  ],
  secrets: [
    'momoComment_secrets_0',
    'momoComment_secrets_1',
    'momoComment_secrets_2',
    'momoComment_secrets_3',
  ],
};

function pickMomoComment(category) {
  const pool = MOMO_ACHIEVEMENT_COMMENTS[category];
  if (!pool) return '';

  const today = new Date().toDateString();
  if (!state.momoCommentUsedToday) {
    state.momoCommentUsedToday = { date: today, comments: [] };
  }
  if (state.momoCommentUsedToday.date !== today) {
    state.momoCommentUsedToday.date = today;
    state.momoCommentUsedToday.comments = [];
  }

  const used = state.momoCommentUsedToday.comments;
  const available = pool.filter(c => !used.includes(c));
  if (available.length === 0) {
    // 今日该类别已用完，重置并重新挑选
    state.momoCommentUsedToday.comments = [];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    state.momoCommentUsedToday.comments.push(pick);
    saveState();
    return pick;
  }

  const pick = available[Math.floor(Math.random() * available.length)];
  state.momoCommentUsedToday.comments.push(pick);
  saveState();
  return pick;
}

export function renderAchievements(container) {
  let list, unlocked, total;
  try {
    list = getAchievementState();
    unlocked = list.filter(a => a.unlocked).length;
    total = list.length;
  } catch (e) {
    container.innerHTML = `<p class="text-center text-ink-light py-8">${t('achievementLoading')}</p>`;
    return;
  }

  if (!list || list.length === 0) {
    container.innerHTML = `<p class="text-center text-ink-light py-8">${t('achievementEmpty')}</p>`;
    return;
  }

  const categories = ['restoration', 'wisdom', 'collection', 'reconstruction', 'visitors', 'secrets'];
  const localeTag = getLocale() === 'en' ? 'en-US' : 'zh-CN';

  let html = `
    <div class="mb-4 flex items-center justify-between">
      <div class="text-sm text-ink-light">${t('achievementUnlockedCount').replace('{unlocked}', unlocked).replace('{total}', total)}</div>
      <div class="flex gap-1">
        ${Object.entries(RARITY_STYLES).map(([name, s]) =>
          `<span class="text-xs px-2 py-0.5 rounded-full ${s.badge} text-white">${t('rarity_' + name)}</span>`
        ).join('')}
      </div>
    </div>
  `;

  categories.forEach(cat => {
    const catAchievements = list.filter(a => a.category === cat);
    if (catAchievements.length === 0) return;
    const catUnlocked = catAchievements.filter(a => a.unlocked).length;

    html += `
      <div class="mb-6">
        <h4 class="font-bold text-sm mb-3 flex items-center gap-2">
          <span>${t('achievementCategory_' + cat)}</span>
          <span class="text-xs text-ink-light font-normal">${catUnlocked}/${catAchievements.length}</span>
        </h4>
        <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
    `;

    catAchievements.forEach(ach => {
      const rs = RARITY_STYLES[ach.rarity] || RARITY_STYLES['bronze'];
      const bonusKey = BONUS_TEXTS[ach.id] || '';
      const bonusText = bonusKey ? t(bonusKey) : '';
      if (ach.unlocked) {
        html += `
          <div class="relative ${rs.bg} ${rs.border} border rounded-lg p-3 text-center ${rs.glow} transition-all hover:scale-105 cursor-default"
               title="${t(ach.name)}\n${t(ach.desc)}${bonusText ? '\n' + t('effectLabel') + bonusText : ''}\n${new Date(ach.unlockedAt).toLocaleString(localeTag)}">
            <div class="text-2xl mb-1">${getCategoryEmoji(ach.category)}</div>
            <div class="text-xs font-bold leading-tight">${t(ach.name)}</div>
            <span class="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full ${rs.badge} text-white">${t('rarity_' + ach.rarity)}</span>
            ${bonusText ? `<div class="mt-1.5 text-[10px] text-magic-gold font-medium leading-tight">${bonusText}</div>` : ''}
          </div>
        `;
      } else {
        html += `
          <div class="relative bg-gray-100 border border-gray-200 rounded-lg p-3 text-center opacity-50 cursor-default"
               title="${t('achievementLockedName')}&#10;${t(ach.desc)}">
            <div class="text-2xl mb-1 grayscale">🔒</div>
            <div class="text-xs font-bold leading-tight text-gray-400">${t('achievementLockedName')}</div>
            <span class="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-300 text-gray-500">${t('locked')}</span>
          </div>
        `;
      }
    });

    html += `</div></div>`;
  });

  container.innerHTML = html;
}

function getCategoryEmoji(cat) {
  const map = { restoration: '🏚️', wisdom: '✨', collection: '📖', reconstruction: '🏛️', visitors: '👥', secrets: '🥚' };
  return map[cat] || '🏆';
}

// ========== Toast 通知 ==========

export function showAchievementToast(achievement) {
  const rs = RARITY_STYLES[achievement.rarity] || RARITY_STYLES['bronze'];
  const bonusKey = BONUS_TEXTS[achievement.id] || '';
  const bonusText = bonusKey ? t(bonusKey) : '';
  const momoCommentKey = pickMomoComment(achievement.category);
  const momoComment = momoCommentKey ? t(momoCommentKey) : '';

  const toast = document.createElement('div');
  toast.className = `fixed bottom-20 right-4 z-[150] ${rs.bg} ${rs.border} border-2 rounded-xl p-4 shadow-lg ${rs.glow}
    animate-slide-in-right max-w-xs transition-all`;
  toast.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="text-3xl">${getCategoryEmoji(achievement.category)}</div>
      <div>
        <div class="text-[10px] uppercase tracking-wider text-ink-light">${t('achievementUnlocked')}</div>
        <div class="font-bold text-sm">${t(achievement.name)}</div>
        <div class="text-xs text-ink-light mt-0.5">${t(achievement.desc)}</div>
        <span class="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full ${rs.badge} text-white">${t('rarity_' + achievement.rarity)}</span>
        ${bonusText ? `<div class="mt-1.5 text-[10px] text-magic-gold font-medium">${t('effectLabel')}${bonusText}</div>` : ''}
        ${momoComment ? `<div class="mt-2 text-[11px] text-ink-light italic leading-relaxed border-t border-wood/10 pt-1.5">🦉 ${momoComment}</div>` : ''}
      </div>
    </div>
  `;

  document.body.appendChild(toast);

  // 3 秒后自动消失
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
