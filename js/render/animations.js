// 动画弹窗 —— 解锁动画 + 书籍完成动画
import { el, actions } from './common.js';
import { UNLOCK_TEXTS } from '../../data/books.js';

export function showUnlockAnimation(bookTitle, chapterTitle, callback) {
  const text = UNLOCK_TEXTS[Math.floor(Math.random() * UNLOCK_TEXTS.length)];
  const overlay = el('div', 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4');

  const card = el('div', 'parchment-bg rounded-2xl p-8 max-w-md w-full text-center magic-glow animate-scale-in');
  card.innerHTML = `
    <div class="text-5xl mb-4">✨</div>
    <div class="text-magic-gold text-sm mb-2">📖 章节解锁</div>
    <h3 class="font-display text-xl font-bold mb-2">${bookTitle}</h3>
    <div class="text-ink font-bold mb-4">${chapterTitle}</div>
    <p class="text-ink-light italic mb-6">「${text}」</p>
    <button class="px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">继续专注 →</button>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const btn = card.querySelector('button');
  btn.addEventListener('click', () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => {
      overlay.remove();
      if (callback) callback();
    }, 300);
  });
}

export function showBookCompleteAnimation(bookTitle, bookEmoji, copyCount, callback) {
  const overlay = el('div', 'fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4');

  const card = el('div', 'parchment-bg rounded-2xl p-8 max-w-md w-full text-center magic-glow animate-scale-in');
  card.innerHTML = `
    <div class="text-6xl mb-4">${bookEmoji}</div>
    <div class="text-magic-gold text-sm mb-2">🎉 书籍完成！</div>
    <h3 class="font-display text-2xl font-bold mb-2">《${bookTitle}》</h3>
    <p class="text-ink-light mb-2">已完整誊抄，永久收录于图书馆</p>
    <p class="text-magic-blue font-bold mb-2">📚 第${copyCount}次誊抄 · 可以出借了</p>
    <div class="flex justify-center gap-1 mb-4">
      ${Array(Math.min(copyCount, 5)).fill('<span class="text-magic-gold text-lg">⭐</span>').join('')}
    </div>
    <p class="text-xs text-ink-light mb-1">+50智慧之光 · +5氛围 · 成就解锁</p>
    <button class="mt-2 px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">太棒了 →</button>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const btn = card.querySelector('button');
  btn.addEventListener('click', () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => {
      overlay.remove();
      if (callback) callback();
    }, 300);
  });
}
