// 访客相关弹窗卡片（共享组件）
import { state, saveState } from '../../state.js';
import { t } from '../../i18n/terms.js';
import { playSfx } from '../../audio.js';
import { addDiaryEntry } from '../../diary.js';
import { getVisitorDef, removeVisitor, getStageWitnesses } from '../../visitors.js';
import { checkAndShowTutorial } from '../../tutorial.js';
import { dispatchTutorialUI } from '../tutorial-ui.js';

export function showFirstVisitorEvent(visitor) {
  const def = getVisitorDef(visitor.charId);
  const line = def ? def.firstImpression : '这地方……好破旧啊。';

  // 步骤1：访客入场动画 + 破败台词
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-ink/60';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-2xl p-8 shadow-2xl border-2 border-magic-gold/30 max-w-md mx-4 text-center animate-fade-in-up">
      <div class="text-5xl mb-3 animate-bounce-in">${visitor.emoji}</div>
      <p class="text-xs text-magic-gold font-bold mb-2">第一位访客</p>
      <p class="text-ink font-bold text-lg mb-4">${visitor.name}</p>
      <p class="text-ink-light text-sm leading-relaxed mb-6">「${line}」</p>
      <p class="text-xs text-ink-light/50">${visitor.name} 环顾了一圈，轻轻叹了口气<br>然后转身离开了</p>
    </div>
  `;
  document.body.appendChild(overlay);

  // 访客离开
  removeVisitor(visitor.id);
  state.tutorialFlags.firstVisitorEventDone = true;
  saveState();

  // 5秒后切换到墨墨的反馈
  setTimeout(() => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.5s';
    setTimeout(() => overlay.remove(), 500);

    // 步骤2：墨墨转述 + 建议升级借阅区
    setTimeout(() => showMomoShabbyLibraryCard(), 300);
  }, 5000);
}

export function showMomoShabbyLibraryCard() {
  const overlay = document.createElement('div');
  overlay.className = 'fixed bottom-6 right-6 z-[200] animate-slide-in-right';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-xl p-5 shadow-2xl border-2 border-magic-gold/30 max-w-xs">
      <div class="flex items-start gap-3">
        <div class="text-3xl">🦉</div>
        <div>
          <p class="text-xs text-magic-gold font-bold mb-1">墨墨</p>
          <p class="text-ink text-sm leading-relaxed mb-3">刚才那位读者走的时候摇了摇头……说图书馆太破了，连像样的桌椅都没有。馆长，要不要去<b class="text-magic-gold">位面商店</b>升级一下借阅区？</p>
          <button class="momo-upgrade-btn px-4 py-1.5 bg-magic-gold text-white rounded-lg text-xs font-bold hover:shadow-lg transition-all">去看看 →</button>
        </div>
        <button class="momo-close-btn text-ink-light/50 hover:text-ink ml-1 text-sm leading-none">×</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => overlay.remove(), 300);
  };
  overlay.querySelector('.momo-close-btn').addEventListener('click', close);
  overlay.querySelector('.momo-upgrade-btn').addEventListener('click', () => {
    close();
    window.switchTab('shop');
  });
  // 15秒后自动消失
  setTimeout(close, 15000);
}

export function showVisitorArrivalCard(visitor) {
  const def = getVisitorDef(visitor.charId);
  const auraHtml = def?.aura
    ? `<div class="mt-2 pt-2 border-t border-magic-gold/20"><p class="text-xs text-magic-gold font-bold">✨ ${def.aura.name}</p><p class="text-xs text-ink-light">${def.aura.desc}</p></div>`
    : '';

  const overlay = document.createElement('div');
  overlay.className = 'fixed bottom-6 right-6 z-[120] animate-slide-in-right';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-xl p-5 shadow-2xl border-2 border-magic-gold/30 max-w-xs">
      <div class="flex items-start gap-3">
        <div class="text-4xl">${visitor.emoji}</div>
        <div>
          <p class="text-xs text-magic-gold font-bold mb-1">访客到来</p>
          <p class="text-ink font-bold">${visitor.name}</p>
          <p class="text-ink-light text-xs">${visitor.title}</p>
          ${auraHtml}
        </div>
        <button class="text-ink-light/50 hover:text-ink ml-2 text-sm leading-none">×</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => overlay.remove(), 300);
  };
  overlay.querySelector('button').addEventListener('click', close);
  // 8秒后自动消失
  setTimeout(close, 8000);

  // 首次访客到来时触发教学（卡片消失后弹出）
  const trigger = checkAndShowTutorial('visitor_arrive');
  if (trigger) {
    setTimeout(() => {
      dispatchTutorialUI(trigger);
    }, 9000); // 等访客卡片自动消失后
  }
}

export function showWitnessToast(witnesses, stage) {
  const stageNames = ['', '废墟', '破败', '陈旧', '温暖', '星辰'];
  const stageName = stageNames[stage] || `阶段${stage}`;

  const itemsHtml = witnesses.map(w => `
    <div class="flex items-start gap-2 mb-2 last:mb-0">
      <div class="text-2xl flex-shrink-0">${w.visitor.emoji}</div>
      <div>
        <p class="text-xs text-magic-gold font-bold">${w.visitor.name}</p>
        <p class="text-xs text-ink-light leading-relaxed">「${w.text}」</p>
      </div>
    </div>
  `).join('');

  const overlay = document.createElement('div');
  overlay.className = 'fixed bottom-6 right-6 z-[130] animate-slide-in-right';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-xl p-5 shadow-2xl border-2 border-magic-gold/30 max-w-xs">
      <div class="flex items-center gap-2 mb-3 pb-2 border-b border-magic-gold/20">
        <span class="text-lg">✨</span>
        <span class="text-xs text-magic-gold font-bold">氛围突破 · ${stageName}</span>
      </div>
      ${itemsHtml}
      <p class="text-xs text-ink-light/40 mt-3 text-center">点击关闭 · 8秒后自动消失</p>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => overlay.remove(), 300);
  };
  overlay.addEventListener('click', close);
  setTimeout(close, 8000);
}

export function showMomoBorrowReadyCard() {
  const overlay = document.createElement('div');
  overlay.className = 'fixed bottom-6 right-6 z-[200] animate-slide-in-right';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-xl p-5 shadow-2xl border-2 border-magic-gold/30 max-w-xs">
      <div class="flex items-start gap-3">
        <div class="text-3xl">🦉</div>
        <div>
          <p class="text-xs text-magic-gold font-bold mb-1">墨墨</p>
          <p class="text-ink text-sm leading-relaxed mb-2">借阅区升级完成！现在访客可以<b class="text-magic-gold">正式办理借书手续</b>了。多抄几本书上架，大家就有书可借啦。</p>
          <p class="text-xs text-ink-light/50">去缮写室誊抄你的第一本书吧</p>
        </div>
        <button class="momo-borrow-close-btn text-ink-light/50 hover:text-ink ml-1 text-sm leading-none">×</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => overlay.remove(), 300);
  };
  overlay.querySelector('.momo-borrow-close-btn').addEventListener('click', close);
  setTimeout(close, 12000);
}
