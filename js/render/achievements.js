// 成就柜 UI 渲染
import { getAchievementState } from '../achievements.js';

const RARITY_STYLES = {
  '青铜': { border: 'border-amber-700/40', bg: 'bg-amber-50', badge: 'bg-amber-700', glow: '' },
  '白银': { border: 'border-slate-300', bg: 'bg-slate-50', badge: 'bg-slate-400', glow: '' },
  '黄金': { border: 'border-yellow-400', bg: 'bg-yellow-50', badge: 'bg-yellow-500', glow: 'shadow-[0_0_8px_rgba(234,179,8,0.3)]' },
  '铂金': { border: 'border-purple-400', bg: 'bg-purple-50', badge: 'bg-purple-500', glow: 'shadow-[0_0_12px_rgba(168,85,247,0.4)]' }
};

const BONUS_TEXTS = {
  'W06': '⚡ 连击加成 3%/天',
  'L04': '⚡ 缮写室升级 7%/级',
  'B07': '📝 誊抄速度 +5%',
  'V02': '💰 智慧之光 +10%',
  'W07': '✨ 每次专注 +1 灵感',
  'B08': '✨ 每次专注 +2 灵感',
};

export function renderAchievements(container) {
  let list, unlocked, total;
  try {
    list = getAchievementState();
    unlocked = list.filter(a => a.unlocked).length;
    total = list.length;
  } catch (e) {
    console.error('成就状态读取失败:', e);
    container.innerHTML = '<p class="text-center text-ink-light py-8">成就系统加载中…</p>';
    return;
  }

  if (!list || list.length === 0) {
    container.innerHTML = '<p class="text-center text-ink-light py-8">成就列表为空，请检查数据。</p>';
    return;
  }

  const categories = ['修复启蒙', '智慧之光', '书籍收集', '图书馆重建', '访客', '彩蛋'];

  let html = `
    <div class="mb-4 flex items-center justify-between">
      <div class="text-sm text-ink-light">已解锁 <span class="font-bold text-magic-gold">${unlocked}</span> / ${total}</div>
      <div class="flex gap-1">
        ${Object.entries(RARITY_STYLES).map(([name, s]) =>
          `<span class="text-xs px-2 py-0.5 rounded-full ${s.badge} text-white">${name}</span>`
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
          <span>${cat}</span>
          <span class="text-xs text-ink-light font-normal">${catUnlocked}/${catAchievements.length}</span>
        </h4>
        <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
    `;

    catAchievements.forEach(ach => {
      const rs = RARITY_STYLES[ach.rarity] || RARITY_STYLES['青铜'];
      const bonusText = BONUS_TEXTS[ach.id] || '';
      if (ach.unlocked) {
        html += `
          <div class="relative ${rs.bg} ${rs.border} border rounded-lg p-3 text-center ${rs.glow} transition-all hover:scale-105 cursor-default"
               title="${ach.name}\n${ach.desc}${bonusText ? '\n效果：' + bonusText : ''}\n${new Date(ach.unlockedAt).toLocaleString('zh-CN')}">
            <div class="text-2xl mb-1">${getCategoryEmoji(ach.category)}</div>
            <div class="text-xs font-bold leading-tight">${ach.name}</div>
            <span class="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full ${rs.badge} text-white">${ach.rarity}</span>
            ${bonusText ? `<div class="mt-1.5 text-[10px] text-magic-gold font-medium leading-tight">${bonusText}</div>` : ''}
          </div>
        `;
      } else {
        html += `
          <div class="relative bg-gray-100 border border-gray-200 rounded-lg p-3 text-center opacity-50 cursor-default"
               title="???&#10;${ach.desc}">
            <div class="text-2xl mb-1 grayscale">🔒</div>
            <div class="text-xs font-bold leading-tight text-gray-400">???</div>
            <span class="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-300 text-gray-500">未解锁</span>
          </div>
        `;
      }
    });

    html += `</div></div>`;
  });

  container.innerHTML = html;
}

function getCategoryEmoji(cat) {
  const map = { '修复启蒙': '🏚️', '智慧之光': '✨', '书籍收集': '📖', '图书馆重建': '🏛️', '访客': '👥', '彩蛋': '🥚' };
  return map[cat] || '🏆';
}

// ========== Toast 通知 ==========

export function showAchievementToast(achievement) {
  const rs = RARITY_STYLES[achievement.rarity] || RARITY_STYLES['青铜'];
  const bonusText = BONUS_TEXTS[achievement.id] || '';

  const toast = document.createElement('div');
  toast.className = `fixed bottom-20 right-4 z-[150] ${rs.bg} ${rs.border} border-2 rounded-xl p-4 shadow-lg ${rs.glow}
    animate-slide-in-right max-w-xs transition-all`;
  toast.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="text-3xl">${getCategoryEmoji(achievement.category)}</div>
      <div>
        <div class="text-[10px] uppercase tracking-wider text-ink-light">成就解锁</div>
        <div class="font-bold text-sm">${achievement.name}</div>
        <div class="text-xs text-ink-light mt-0.5">${achievement.desc}</div>
        <span class="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full ${rs.badge} text-white">${achievement.rarity}</span>
        ${bonusText ? `<div class="mt-1.5 text-[10px] text-magic-gold font-medium">效果：${bonusText}</div>` : ''}
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
