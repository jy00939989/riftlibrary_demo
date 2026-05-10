// 专注页面渲染
import { state } from '../state.js';
import { BOOKS, COPY_TEMPLATES } from '../../data/books.js';
import { el, h, formatTime, updateTimerDisplay, actions } from './common.js';

// ========== 计时器页面 ==========

export function renderFocusPage() {
  const container = document.getElementById('page-focus');
  if (!container) return;
  const sess = state.currentSession;
  const book = sess.bookId ? BOOKS[sess.bookId] : null;

  container.innerHTML = '';

  const card = el('div', 'parchment-bg rounded-2xl p-6 md:p-8 magic-glow relative overflow-hidden');
  card.appendChild(el('div', 'grain-texture absolute inset-0 pointer-events-none'));

  card.appendChild(renderModeSelector());
  card.appendChild(renderBookSelector());
  card.appendChild(renderTimerDisplay());
  card.appendChild(renderTimerControls());

  container.appendChild(card);

  if (sess.active && book) {
    container.appendChild(renderCopyPreview(book));
  }
}

function renderModeSelector() {
  const modes = [
    { id: 'pomodoro', name: '番茄钟', icon: '🍅', desc: '25分钟', target: 25 },
    { id: 'countdown', name: '倒计时', icon: '⏲️', desc: '45分钟', target: 45 },
    { id: 'stopwatch', name: '正计时', icon: '⏱️', desc: '无限制', target: 0 }
  ];
  const sess = state.currentSession;

  const div = el('div', 'mb-6');
  div.appendChild(el('h2', 'font-display text-lg font-bold mb-3', { text: '选择专注模式' }));
  const grid = el('div', 'grid grid-cols-3 gap-3');

  modes.forEach(m => {
    const active = sess.mode === m.id;
    const btn = el('button', `mode-btn p-3 border-2 rounded-lg text-center transition-all ${
      active ? 'border-magic-gold bg-magic-gold/20 ring-2 ring-magic-gold' : 'border-wood bg-wood/10 hover:bg-wood/20'
    }`);
    btn.innerHTML = `<div class="text-2xl mb-1">${m.icon}</div><div class="font-bold text-sm">${m.name}</div><div class="text-xs text-ink-light">${m.desc}</div>`;
    btn.addEventListener('click', () => {
      if (!state.currentSession.active) {
        state.currentSession.mode = m.id;
        state.currentSession.targetMinutes = m.target;
        renderFocusPage();
      }
    });
    grid.appendChild(btn);
  });

  div.appendChild(grid);
  return div;
}

function renderBookSelector() {
  const sess = state.currentSession;
  const div = el('div', 'mb-8');
  div.appendChild(el('h2', 'font-display text-lg font-bold mb-3', { text: '选择誊抄书籍' }));
  const flex = el('div', 'flex gap-3 overflow-x-auto pb-2');

  // 只展示已开启过誊抄且未满 mastery 5 的书
  const eligibleBooks = Object.values(BOOKS).filter(book => {
    const bookState = state.books[book.id];
    if (!bookState || bookState.status === 'locked') return false;
    return bookState.copiedWords > 0 && bookState.masteryLevel < 5;
  });

  if (eligibleBooks.length === 0) {
    const tip = el('p', 'text-ink-light text-sm py-4');
    tip.textContent = '去书架选一本书开始誊抄吧 📚';
    div.appendChild(tip);
    return div;
  }

  eligibleBooks.forEach(book => {
    const bookState = state.books[book.id];
    const active = sess.bookId === book.id;
    const btn = el('button', `book-select flex-shrink-0 w-24 p-2 border-2 rounded-lg text-center transition-all ${
      active ? 'border-magic-gold bg-magic-gold/10' : 'border-wood/30 bg-white/50'
    }`);
    const progress = book.totalWords > 0 ? Math.round((bookState.copiedWords / book.totalWords) * 100) : 0;
    btn.innerHTML = `<div class="text-3xl mb-1">${book.emoji}</div><div class="font-bold text-xs">${book.title}</div><div class="text-xs text-ink-light">${progress}%</div>`;
    btn.addEventListener('click', () => {
      if (!state.currentSession.active) {
        state.currentSession.bookId = book.id;
        renderFocusPage();
      }
    });
    flex.appendChild(btn);
  });

  div.appendChild(flex);
  return div;
}

function renderTimerDisplay() {
  const sess = state.currentSession;
  const div = el('div', 'text-center mb-8');
  const timeStr = formatTime(sess.elapsedSeconds);

  div.innerHTML = `
    <div class="text-6xl md:text-7xl font-display font-bold text-ink mb-2">${timeStr}</div>
    ${sess.bookId ? `<div class="text-magic-blue font-medium">正在誊抄《${BOOKS[sess.bookId]?.title || ''}》...</div>` : ''}
    <div class="text-sm text-ink-light mt-1">已誊抄 ${state.focus.totalWords.toLocaleString()} 字</div>
  `;
  return div;
}

function renderTimerControls() {
  const sess = state.currentSession;
  const div = el('div', 'flex justify-center gap-4');

  if (!sess.active) {
    const startBtn = el('button',
      'px-8 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all animate-glow text-lg');
    startBtn.textContent = '✨ 开始专注';
    startBtn.addEventListener('click', () => {
      actions.startFocus();
    });
    div.appendChild(startBtn);
  } else {
    const pauseBtn = el('button', 'px-6 py-3 bg-magic-blue text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all');
    pauseBtn.textContent = sess.paused ? '▶️ 继续' : '⏸️ 暂停';
    pauseBtn.addEventListener('click', () => {
      actions.togglePause();
    });

    const stopBtn = el('button', 'px-6 py-3 bg-wood text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all');
    stopBtn.textContent = '✋ 放弃';
    stopBtn.addEventListener('click', () => {
      actions.abandonFocus();
    });

    const doneBtn = el('button', 'px-6 py-3 bg-green-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all animate-glow');
    doneBtn.textContent = '✅ 完成';
    doneBtn.addEventListener('click', () => {
      actions.completeFocus();
    });

    div.appendChild(pauseBtn);
    div.appendChild(stopBtn);
    div.appendChild(doneBtn);
  }

  return div;
}

function renderCopyPreview(book) {
  const template = COPY_TEMPLATES[state.currentSession.quoteIndex % COPY_TEMPLATES.length];
  const quotes = book.quotes;
  const quoteKeys = Object.keys(quotes);
  const randomKey = quoteKeys[Math.floor(Math.random() * quoteKeys.length)];
  const quote = quotes[randomKey];

  return h(`
    <div class="mt-4 parchment-bg rounded-xl p-4 border-2 border-magic-gold/30 animate-fade-in">
      <div class="flex items-start gap-3">
        <span class="text-2xl">✨</span>
        <div class="flex-1">
          <div class="text-sm text-ink-light mb-1">${template.opening}</div>
          <blockquote class="text-ink italic border-l-4 border-magic-gold pl-3 py-1 my-2">
            「${quote}」
          </blockquote>
          <div class="text-xs text-ink-light">——《${book.title}》</div>
          <div class="text-xs text-magic-blue mt-1">${template.closing}</div>
        </div>
      </div>
    </div>
  `);
}

// ========== 专注完成结算卡片 ==========

export function showCompletionCard({ minutes, words, coins, book }, callback) {
  // 随机取一句名言
  let quoteText = '';
  let quoteSource = '';
  if (book && book.quotes) {
    const quoteKeys = Object.keys(book.quotes);
    const key = quoteKeys[Math.floor(Math.random() * quoteKeys.length)];
    quoteText = book.quotes[key];
    quoteSource = `——《${book.title}》`;
  }
  if (!quoteText) {
    const generalQuotes = [
      '每一页抄写都是对知识的致敬。',
      '持之以恒，终有回响。',
      '文字因你的笔触而重生。'
    ];
    quoteText = generalQuotes[Math.floor(Math.random() * generalQuotes.length)];
  }

  const overlay = el('div', 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4');
  const card = el('div', 'parchment-bg rounded-2xl p-6 max-w-sm w-full text-center magic-glow animate-scale-in');

  card.innerHTML = `
    <div class="text-4xl mb-3">✨</div>
    <h3 class="font-display text-xl font-bold mb-4">专注完成</h3>
    <div class="grid grid-cols-3 gap-2 mb-4">
      <div class="bg-white/60 rounded-lg p-3">
        <div class="text-lg font-bold text-magic-blue">${minutes}</div>
        <div class="text-xs text-ink-light">分钟</div>
      </div>
      <div class="bg-white/60 rounded-lg p-3">
        <div class="text-lg font-bold text-magic-blue">${words.toLocaleString()}</div>
        <div class="text-xs text-ink-light">誊抄字</div>
      </div>
      <div class="bg-white/60 rounded-lg p-3">
        <div class="text-lg font-bold text-magic-gold">+${coins}</div>
        <div class="text-xs text-ink-light">代币</div>
      </div>
    </div>
    <div class="italic text-ink-light mb-4 text-sm">「${quoteText}」${quoteSource}</div>
    <button class="px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">继续 →</button>
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
