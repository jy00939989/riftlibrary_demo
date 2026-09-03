// Momo's first-focus narrative intro modal
export function showMomoIntro(callback) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/70 z-[150] flex items-center justify-center p-4';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-2xl p-8 max-w-sm w-full text-center magic-glow animate-scale-in">
      <div class="text-6xl mb-4">📚</div>
      <div class="text-xs text-magic-gold mb-2 font-bold tracking-wider">？？？</div>
      <p class="text-ink leading-relaxed mb-2 text-sm">好不容易有个人来了……</p>
      <p class="text-ink leading-relaxed mb-4 text-sm">不能让他没耐心跑了！让我用魔法给他加加速——</p>
      <p class="text-xs text-ink-light mb-6">✨ 书架深处传来一声低语，空气中泛起金色的微光 ✨</p>
      <button class="px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">✨ 开始誊抄</button>
    </div>
  `;

  overlay.querySelector('button').addEventListener('click', () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => {
      overlay.remove();
      if (callback) callback();
    }, 300);
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.querySelector('button').click();
    }
  });

  document.body.appendChild(overlay);
}
