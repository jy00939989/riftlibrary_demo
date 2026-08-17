// 里程碑奖励弹窗（共享组件）
import { state, saveState } from '../../state.js';
import { addCoins, addAtmosphere, addHistory } from '../../storage.js';
import { addDiaryEntry } from '../../diary.js';

export function showMilestoneReward(milestones, callback) {
  // 逐个弹出，一次专注可能触发多个里程碑
  const queue = [...milestones];

  function showNext() {
    if (queue.length === 0) {
      callback();
      return;
    }
    const ms = queue.shift();

    // 从共享池随机抽一本书作为奖励（当前用已有书 + 阿九推销池的简单实现）
    // TODO: 后续连接到 data/book_pool.js 共享池
    addCoins(100);
    addAtmosphere(3);
    addHistory('milestone', `🎯 累计誊抄突破 ${ms.words.toLocaleString()} 字！`, '获得100智慧之光 +3氛围');
    addDiaryEntry('milestone', { words: ms.words.toLocaleString() });

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4';
    overlay.innerHTML = `
      <div class="parchment-bg rounded-2xl p-6 max-w-sm w-full text-center magic-glow animate-scale-in">
        <div class="text-4xl mb-3">🎯</div>
        <div class="text-magic-gold text-sm mb-2">里程碑达成</div>
        <h3 class="font-display text-xl font-bold mb-2">累计誊抄 ${ms.words.toLocaleString()} 字</h3>
        <p class="text-ink-light mb-4">获得 <span class="text-magic-blue font-bold">100智慧之光 +3氛围</span></p>
        <button class="px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">太棒了 →</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const btn = overlay.querySelector('button');
    btn.addEventListener('click', () => {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s';
      setTimeout(() => {
        overlay.remove();
        saveState();
        showNext();
      }, 300);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        showNext();
      }
    });
  }

  showNext();
}
