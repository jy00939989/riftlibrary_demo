// 动画弹窗 —— 解锁动画 + 书籍完成动画 + 馆长目标阶段完成弹窗
import { el, actions, getBookTitle, getBookAuthorBio, getBookAnecdotes, getBookReviews } from './common.js';
import { UNLOCK_TEXTS } from '../../data/books.js';
import { addCoins, addAtmosphere, addHistory } from '../storage.js';
import { saveState } from '../state.js';

// ========== 馆长目标阶段完成弹窗 ==========

/**
 * @param {Object} tier — TIER_GOALS 条目
 * @param {Object} progress — { goalsComplete, goalsTotal, allDone }
 */
export function showTierCompletePopup(tier, progress) {
  const overlay = el('div', 'fixed inset-0 bg-black/70 z-[140] flex items-center justify-center p-4');
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const card = el('div', 'parchment-bg rounded-2xl p-0 max-w-lg w-full magic-glow animate-scale-in overflow-hidden');

  // 图片区（有图则显示，无图则显示 emoji 占位）
  const imgHTML = tier.image
    ? `<img src="${tier.image}" alt="${tier.name}" class="w-full h-48 object-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
    : '';
  const fallbackHTML = tier.image
    ? `<div class="w-full h-48 bg-gradient-to-br from-magic-gold/20 to-ink/10 flex items-center justify-center text-6xl" style="display:none">${tier.emoji}</div>`
    : `<div class="w-full h-48 bg-gradient-to-br from-magic-gold/20 to-ink/10 flex items-center justify-center text-6xl">${tier.emoji}</div>`;

  card.innerHTML = `
    ${imgHTML}
    ${fallbackHTML}
    <div class="p-6 text-center">
      <div class="text-xs text-magic-gold font-bold mb-1 uppercase tracking-wider">馆长目标 · 阶段达成</div>
      <h2 class="font-display text-xl font-bold mb-1">${tier.emoji} ${tier.name}</h2>
      <p class="text-sm text-ink-light mb-4">${tier.subtitle}</p>
      <p class="text-sm leading-relaxed text-ink-light italic mb-5 px-2">" ${tier.flavor} "</p>
      <div class="flex items-center justify-center gap-3 mb-4">
        ${tier.rewardCoins > 0 ? `<span class="bg-magic-gold/10 px-3 py-1.5 rounded-full text-sm font-bold text-magic-gold">💰 +${tier.rewardCoins} 智慧之光</span>` : ''}
        ${tier.rewardAtmo > 0 ? `<span class="bg-amber-100 px-3 py-1.5 rounded-full text-sm font-bold text-amber-700">✨ +${tier.rewardAtmo} 氛围</span>` : ''}
      </div>
      ${progress.allDone
        ? '<p class="text-xs text-green-600 mb-3 font-medium">✅ 该阶段所有目标均已达成</p>'
        : `<p class="text-xs text-ink-light mb-3">目标完成度：${progress.goalsComplete}/${progress.goalsTotal}</p>`}
      <button class="px-8 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">太好了 →</button>
    </div>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const close = () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => overlay.remove(), 300);
  };

  const btn = card.querySelector('button');
  btn.addEventListener('click', close);
}

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

// 书籍上架动画 —— 书本从屏幕中央飞向大书库标签
export function showBookShelvingAnimation(book, callback) {
  const targetBtn = document.getElementById('tab-bookshelf');
  if (!targetBtn) { if (callback) callback(); return; }

  const targetRect = targetBtn.getBoundingClientRect();
  const startX = window.innerWidth / 2;
  const startY = window.innerHeight / 2;
  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;

  // 飞行书本
  const flyer = document.createElement('div');
  flyer.className = 'fixed z-[180] pointer-events-none';
  flyer.style.cssText = `
    left: ${startX}px; top: ${startY}px;
    transform: translate(-50%, -50%) scale(1.5);
    transition: all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  `;
  flyer.innerHTML = `
    <div class="text-center">
      <div class="text-5xl">${book.emoji}</div>
      <div class="text-xs text-ink-light mt-1 whitespace-nowrap">《${getBookTitle(book)}》</div>
    </div>
  `;

  // 金色粒子尾迹
  const particles = [];
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div');
    p.className = 'fixed z-[175] pointer-events-none rounded-full';
    p.style.cssText = `
      left: ${startX}px; top: ${startY}px;
      width: 6px; height: 6px;
      background: radial-gradient(circle, #c9a227, transparent);
      opacity: 0.8;
      transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      transition-delay: ${i * 0.05}s;
    `;
    document.body.appendChild(p);
    particles.push(p);
  }

  document.body.appendChild(flyer);

  // 起飞！
  requestAnimationFrame(() => {
    flyer.style.left = endX + 'px';
    flyer.style.top = endY + 'px';
    flyer.style.transform = 'translate(-50%, -50%) scale(0.4)';
    flyer.style.opacity = '0.9';

    particles.forEach(p => {
      const offsetX = (Math.random() - 0.5) * 80;
      const offsetY = (Math.random() - 0.5) * 80;
      p.style.left = (endX + offsetX) + 'px';
      p.style.top = (endY + offsetY) + 'px';
      p.style.opacity = '0';
    });
  });

  // 到达后：标签按钮闪金光
  setTimeout(() => {
    targetBtn.classList.add('animate-shelving-glow');
    setTimeout(() => targetBtn.classList.remove('animate-shelving-glow'), 800);

    flyer.remove();
    particles.forEach(p => p.remove());

    if (callback) setTimeout(callback, 200);
  }, 750);
}

export function showBookCompleteAnimation(bookTitle, bookEmoji, copyCount, callback, book, newLevel) {
  const overlay = el('div', 'fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4');
  const card = el('div', 'parchment-bg rounded-2xl p-8 max-w-md w-full text-center magic-glow animate-scale-in relative');

  const masteryRewards = ['',
    '📖 书籍上架 · 可供访客借阅',
    `📝 解锁作者小传：${book ? getBookAuthorBio(book).slice(0, 40) + '…' : '待发现'}`,
    `💬 解锁创作轶闻：${book ? getBookAnecdotes(book).slice(0, 40) + '…' : '待发现'}`,
    `🏅 解锁名家书评：${book ? getBookReviews(book).slice(0, 40) + '…' : '待发现'}`,
    `🌟 解锁典藏封面 · 金光特效${book?.collectorCover ? ' · ' + book.collectorCover : ''}`
  ];

  const isFirstTime = copyCount === 1;
  const rewardText = newLevel && masteryRewards[newLevel] ? masteryRewards[newLevel] : '';

  if (isFirstTime) {
    card.innerHTML = `
      <div class="text-6xl mb-4">${bookEmoji}</div>
      <div class="text-magic-gold text-sm mb-2">🎉 书籍完成！</div>
      <h3 class="font-display text-2xl font-bold mb-2">《${bookTitle}》</h3>
      <p class="text-ink-light mb-2">已完整誊抄，永久收录于图书馆</p>
      <p class="text-magic-blue font-bold mb-2">📚 第${copyCount}次誊抄 · 可以出借了</p>
      ${rewardText ? `<div class="bg-magic-gold/10 border border-magic-gold/30 rounded-lg p-3 mb-3 text-sm text-ink">
        <span class="text-xs text-magic-gold font-bold">🔓 新解锁</span><br>${rewardText}
      </div>` : ''}
      <div class="flex justify-center gap-1 mb-4">
        ${Array(Math.min(copyCount, 5)).fill('<span class="text-magic-gold text-lg">⭐</span>').join('')}
      </div>
      <p class="text-xs text-ink-light mb-1">+50智慧之光 · +5氛围 · 成就解锁</p>
      <div class="flex flex-wrap gap-2 justify-center mt-4">
        <button id="book-complete-save" class="px-4 py-2 bg-wood/20 text-ink rounded-lg font-bold text-sm hover:bg-wood/30 transition-all">📥 保存证书图</button>
        <button id="book-complete-share" class="px-4 py-2 bg-magic-blue/20 text-ink rounded-lg font-bold text-sm hover:bg-magic-blue/30 transition-all">📋 复制分享文字</button>
        <button id="book-complete-next" class="px-6 py-2 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">太棒了 →</button>
      </div>
    `;
  } else {
    card.innerHTML = `
      <div class="text-5xl mb-3">${bookEmoji}</div>
      <h3 class="font-display text-lg font-bold mb-1">《${bookTitle}》</h3>
      <p class="text-magic-blue font-bold text-sm mb-3">📚 第${copyCount}次誊抄完成</p>
      ${rewardText ? `<div class="bg-magic-gold/10 border border-magic-gold/30 rounded-lg p-3 mb-3 text-sm text-ink">
        <span class="text-xs text-magic-gold font-bold">🔓 新解锁</span><br>${rewardText}
      </div>` : ''}
      <div class="flex justify-center gap-1 mb-3">
        ${Array(Math.min(copyCount, 5)).fill('<span class="text-magic-gold text-lg">⭐</span>').join('')}
      </div>
      <p class="text-xs text-ink-light mb-1">+50智慧之光 · +5氛围</p>
      <div class="flex flex-wrap gap-2 justify-center mt-4">
        <button id="book-complete-save" class="px-4 py-2 bg-wood/20 text-ink rounded-lg font-bold text-sm hover:bg-wood/30 transition-all">📥 保存证书图</button>
        <button id="book-complete-share" class="px-4 py-2 bg-magic-blue/20 text-ink rounded-lg font-bold text-sm hover:bg-magic-blue/30 transition-all">📋 复制分享文字</button>
        <button id="book-complete-next" class="px-6 py-2 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">太棒了 →</button>
      </div>
    `;
  }

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const closeOverlay = () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => {
      overlay.remove();
      if (callback) callback();
    }, 300);
  };

  card.querySelector('#book-complete-next').addEventListener('click', closeOverlay);

  card.querySelector('#book-complete-save').addEventListener('click', () => {
    if (typeof html2canvas !== 'undefined') {
      html2canvas(card, { backgroundColor: '#f5e6c8', scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `誊抄完成_${bookTitle}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('证书图已保存 📥');
      }).catch(() => {
        copyBookShareText(bookTitle, bookEmoji, newLevel);
      });
    } else {
      copyBookShareText(bookTitle, bookEmoji, newLevel);
    }
  });

  card.querySelector('#book-complete-share').addEventListener('click', () => {
    copyBookShareText(bookTitle, bookEmoji, newLevel);
  });

  // 完成弹窗必须点击按钮确认，禁止点击空白处关闭
}

function copyBookShareText(bookTitle, bookEmoji, newLevel) {
  const masteryNames = ['', '初识', '熟悉', '精通', '大师', '传承'];
  const masteryLine = newLevel && masteryNames[newLevel] ? ` · 典藏等级：${masteryNames[newLevel]}` : '';
  const text = `${bookEmoji || '📚'} 我在「归墟图书馆」完成了《${bookTitle}》的誊抄${masteryLine}。每一页抄写，都是对世界的重建。`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast('分享文字已复制到剪贴板 📋')).catch(() => prompt('复制这段文字分享吧：', text));
  } else {
    prompt('复制这段文字分享吧：', text);
  }
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-ink/80 text-white rounded-full text-sm z-[200] animate-fade-in-up';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ========== 日志装帧升级弹窗 ==========

export function showDiaryLevelUpPopup(levelUp) {
  if (!levelUp) return;

  const overlay = el('div', 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4');
  const card = el('div', 'parchment-bg rounded-2xl p-6 max-w-sm w-full text-center magic-glow animate-scale-in');
  card.innerHTML = `
    <div class="text-4xl mb-3">${levelUp.icon}</div>
    <div class="text-magic-gold text-sm mb-1">📜 日志装帧升级</div>
    <h3 class="font-display text-xl font-bold mb-2">${levelUp.name}</h3>
    <p class="text-ink-light italic mb-4 text-sm leading-relaxed">"${levelUp.momoSpeech}"</p>
    <div class="flex justify-center gap-3 mb-4">
      ${levelUp.rewards.coins > 0 ? `<span class="bg-magic-gold/10 px-3 py-1 rounded-full text-sm">💰 +${levelUp.rewards.coins}</span>` : ''}
      ${levelUp.rewards.atmo > 0 ? `<span class="bg-magic-blue/10 px-3 py-1 rounded-full text-sm">✨ +${levelUp.rewards.atmo} 氛围</span>` : ''}
    </div>
    <button class="px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">太棒了 →</button>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const closeBtn = card.querySelector('button');
  closeBtn.addEventListener('click', () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => overlay.remove(), 300);
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s';
      setTimeout(() => overlay.remove(), 300);
    }
  });
}
