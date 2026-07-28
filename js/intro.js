// 新手开场引导 —— 3 步卡片式引导 + PV 开场
import { state, saveState } from './state.js';
import { t } from './i18n/terms.js';

export function showIntro(onComplete) {
  const steps = [
    {
      emoji: '🏚️',
      title: t('introWelcomeTitle'),
      text: t('introWelcomeText'),
      isOpening: true,
      switchTab: null
    },
    {
      emoji: '🖋️',
      title: t('introScriptoriumTitle'),
      text: t('introScriptoriumText').replace('{startFocus}', t('startFocus')),
      isOpening: false,
      switchTab: 'focus'
    },
    {
      emoji: '⏱️',
      title: t('introTimerTitle'),
      text: t('introTimerText')
        .replace('{pomodoro}', t('focusModePomodoro'))
        .replace('{pomodoroDuration}', t('durationMinutes').replace('{n}', '25'))
        .replace('{countdown}', t('focusModeCountdown'))
        .replace('{stopwatch}', t('focusModeStopwatch'))
        .replace('{noLimit}', t('noLimit'))
        .replaceAll('{coins}', t('coins'))
        .replaceAll('{atmosphere}', t('atmosphere')),
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
  skipBtn.textContent = t('introSkip');
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
      <p class="text-white text-lg font-bold mb-2">${t('introTapToPlayVideo')}</p>
      <p class="text-white/60 text-sm">${t('introDoubleTapToSkip')}</p>
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
          <button class="intro-next-btn px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">${t('introStartAdventure')}</button>
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
          <button class="intro-next-btn px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">${t('continueText')}</button>
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
      if (onComplete) onComplete();
    }, 300);
  }

  // 结束后轻提示：指向其他标签页
  function showExploreHint() {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 z-[90] animate-fade-in';
    toast.innerHTML = `
      <div class="parchment-bg rounded-xl px-5 py-3 shadow-2xl border border-wood/20 text-center text-sm text-ink-light">
        ${t('introExploreHint')
          .replace('{grandLibrary}', t('tabGrandLibrary'))
          .replace('{readerSalon}', t('tabReaderSalon'))
          .replace('{planeShop}', t('tabPlaneShop'))}
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
