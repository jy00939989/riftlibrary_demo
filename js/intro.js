// 新手开场引导 —— 3 步卡片式引导 + PV 开场
import { state, saveState } from './state.js';

export function showIntro() {
  const steps = [
    {
      emoji: '🏚️',
      title: '欢迎来到异世界图书馆',
      text: '你推开沉重的橡木门，灰尘在从破洞屋顶洒下的光柱中飞舞。曾经辉煌的大厅如今只剩断壁残垣，书架倒塌如墓碑，破损的书籍散落一地。但空气中残留着某种古老魔法的气息——这里曾经有人守护，而那个人，现在是你。',
      isOpening: true,
      switchTab: null
    },
    {
      emoji: '🖋️',
      title: '缮写室 · 誊抄修复',
      text: '在缮写室中选择一本初始书籍，点击「开始专注」。每一次专注誊抄，都是对图书馆的修复——破损的书架会被修补，蒙尘的角落重见光明。你誊抄的每一个字，都在让这座废墟重新呼吸。',
      isOpening: false,
      switchTab: 'focus'
    },
    {
      emoji: '⏱️',
      title: '计时与收获',
      text: '三种专注模式供你选择：🍅 番茄钟（25分钟）、⏲️ 倒计时（自定义时长）、⏱️ 正计时（不限时）。专注结束后会获得誊抄字数和智慧之光（顶部 💰），完成整本书籍、达成里程碑、访客还书等事件会提升氛围值——氛围积累到一定程度，图书馆会发生可见的变化。',
      isOpening: false,
      switchTab: 'focus'
    }
  ];

  let currentStep = 0;
  let phase = 'loading';
  let videoEl = null;

  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[200] flex items-center justify-center p-4';
  overlay.id = 'intro-overlay';
  overlay.style.background = "url('visual/background/library_bg_01_abandoned.jpg') center/cover no-repeat";
  overlay.style.transition = 'background 0.8s ease';

  // 右下角跳过按钮
  let skipBtn = document.createElement('button');
  skipBtn.className = 'absolute bottom-8 right-8 text-white/50 hover:text-white/80 text-sm z-10 transition-all';
  skipBtn.textContent = '跳过 →';
  skipBtn.addEventListener('click', dismissIntro);
  overlay.appendChild(skipBtn);

  function enterActivePhase() {
    if (phase === 'active') return;
    phase = 'active';
    overlay.style.background = `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.7)), url('visual/background/library_bg_01_abandoned.jpg') center/cover no-repeat`;
    const cardSkipBtn = skipBtn.cloneNode(true);
    skipBtn.replaceWith(cardSkipBtn);
    skipBtn = cardSkipBtn;
    skipBtn.textContent = '✕';
    skipBtn.className = 'absolute top-4 right-4 text-white/70 hover:text-white text-lg leading-none z-20 transition-all';
    skipBtn.addEventListener('click', dismissIntro);
    // 切到第一步对应的标签页
    switchBackgroundTab('focus');
    renderStep();
  }

  function enterVideoPhase() {
    if (phase === 'video' || phase === 'active') return;
    phase = 'video';

    overlay.innerHTML = '';
    overlay.appendChild(skipBtn);

    videoEl = document.createElement('video');
    videoEl.src = 'audio/异世界图书馆宣传PV.mp4';
    videoEl.className = 'absolute inset-0 w-full h-full object-cover z-0';
    videoEl.playsInline = true;
    videoEl.addEventListener('ended', () => enterActivePhase());

    videoEl.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      videoEl.pause();
      enterActivePhase();
    });

    overlay.appendChild(videoEl);

    const playHint = document.createElement('div');
    playHint.className = 'absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 cursor-pointer';
    playHint.id = 'video-play-hint';
    playHint.innerHTML = `
      <div class="text-6xl mb-4 animate-pulse">▶️</div>
      <p class="text-white text-lg font-bold mb-2">点击观看开场动画</p>
      <p class="text-white/60 text-sm">双击可跳过</p>
    `;
    playHint.addEventListener('click', () => {
      playHint.remove();
      videoEl.play().catch(() => {});
    });
    overlay.appendChild(playHint);

    const newSkipBtn = skipBtn.cloneNode(true);
    skipBtn.replaceWith(newSkipBtn);
    skipBtn = newSkipBtn;
    skipBtn.addEventListener('click', () => {
      if (videoEl) videoEl.pause();
      enterActivePhase();
    });
  }

  const loadingTimer = setTimeout(enterVideoPhase, 3000);

  overlay.addEventListener('click', function quickEnter(e) {
    if (phase === 'loading' && e.target === overlay) {
      clearTimeout(loadingTimer);
      enterVideoPhase();
    }
  });

  function switchBackgroundTab(tabName) {
    if (window.switchTab) {
      window.switchTab(tabName);
    }
  }

  function renderStep() {
    const step = steps[currentStep];
    const isLast = currentStep === steps.length - 1;

    // 切换背景页面
    if (step.switchTab) {
      switchBackgroundTab(step.switchTab);
    }

    overlay.innerHTML = '';
    overlay.appendChild(skipBtn);

    const card = document.createElement('div');
    card.className = `${step.isOpening ? 'bg-white/85 backdrop-blur-sm' : 'parchment-bg'} rounded-2xl p-8 max-w-md w-full magic-glow animate-scale-in text-center relative`;

    if (isLast) {
      card.innerHTML = `
        <div class="text-5xl mb-4">${step.emoji}</div>
        <h2 class="font-display text-xl font-bold mb-4">${step.title}</h2>
        <p class="text-ink-light leading-relaxed mb-6 text-sm">${step.text}</p>
        <div class="flex items-center justify-between">
          <div class="flex gap-1">
            ${steps.map((_, i) => `<span class="w-2 h-2 rounded-full ${i === currentStep ? 'bg-magic-gold' : 'bg-wood/30'}"></span>`).join('')}
          </div>
          <button class="intro-next-btn px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">✨ 开始冒险</button>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="text-5xl mb-4">${step.emoji}</div>
        <h2 class="font-display text-xl font-bold mb-4">${step.title}</h2>
        <p class="text-ink-light leading-relaxed mb-6 text-sm">${step.text}</p>
        <div class="flex items-center justify-between">
          <div class="flex gap-1">
            ${steps.map((_, i) => `<span class="w-2 h-2 rounded-full ${i === currentStep ? 'bg-magic-gold' : 'bg-wood/30'}"></span>`).join('')}
          </div>
          <button class="intro-next-btn px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">继续 →</button>
        </div>
      `;
    }

    overlay.appendChild(card);

    const nextBtn = card.querySelector('.intro-next-btn');
    nextBtn.addEventListener('click', () => {
      if (isLast) {
        dismissIntro();
      } else {
        currentStep++;
        if (!steps[currentStep].isOpening) {
          overlay.style.background = 'rgba(0,0,0,0.75)';
        }
        renderStep();
      }
    });
  }

  function dismissIntro() {
    clearTimeout(loadingTimer);
    if (videoEl) { videoEl.pause(); videoEl.src = ''; }
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => {
      overlay.remove();
      state.introCompleted = true;
      saveState();
      showExploreHint();
    }, 300);
  }

  // 结束后轻提示：指向其他标签页
  function showExploreHint() {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 z-[90] animate-fade-in';
    toast.innerHTML = `
      <div class="parchment-bg rounded-xl px-5 py-3 shadow-2xl border border-wood/20 text-center text-sm text-ink-light">
        大书库、读者沙龙、位面商店——其余的角落，等你慢慢发现。
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.6s';
      setTimeout(() => toast.remove(), 600);
    }, 5000);
  }

  document.body.appendChild(overlay);
}
