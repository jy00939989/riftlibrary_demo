// 缮写室（专注页面）渲染
import { state } from '../state.js';
import { BOOKS, COPY_TEMPLATES } from '../../data/books.js';
import { el, h, formatTime, actions, updateStatusBar } from './common.js';
import { startWriting, pauseWriting, resumeWriting, stopWriting, isWriting } from './writing.js';
import { isMomoAccelerating } from '../timer.js';
import { ensureDailyTasks, claimAllDoneBonus } from '../dailytasks.js';

// 缮写室素材
const FOCUS_IMG_NAMES = [
  'focusroom_lv0_final_0.jpg',
  'focusroom_lv1_no_text_0.jpg',
  'focusroom_lv2_final_0.jpg',
  'focusroom_lv3_final_1.jpg',
  'focusroom_lv4_final_0.jpg',
  'focusroom_lv5_final_1.jpg',
  'focusroom_lv6_sanctuary_16x9_1.jpg'
];
const FOCUS_LV_NAMES = ['残破', '陋室', '整洁', '明亮', '静雅', '华美', '缮写圣堂'];

// ========== 主入口 ==========

export function renderFocusPage() {
  const container = document.getElementById('page-focus');
  if (!container) return;
  const sess = state.currentSession;
  const book = sess.bookId ? BOOKS[sess.bookId] : null;

  // 活跃中 + 动画在跑 → 只更新按钮状态和背景，不重建页面
  if (sess.active && book && isWriting()) {
    updateActiveControlsDOM(sess);
    updateFocusBackground();
    return;
  }

  // 全量重建
  stopWriting();
  container.innerHTML = '';

  updateFocusBackground();

  // 缮写室全景图 banner（仿馆长办公室形式）
  const flv = state.library.focusLevel || 0;
  const banner = el('div', 'mb-6 rounded-xl overflow-hidden border-2 border-wood/30 shadow-lg');
  banner.innerHTML = `
    <img src="visual/focusroom/${FOCUS_IMG_NAMES[flv]}" alt="缮写室 · ${FOCUS_LV_NAMES[flv]}" class="w-full h-48 object-cover">
    <div class="bg-ink/70 text-white text-center py-2 text-sm">
      🖋️ 缮写室 · ${FOCUS_LV_NAMES[flv]}${flv > 0 ? ` · 誊抄速度 ${Math.round((1 + flv * 0.05) * 100)}%` : ''}
    </div>
  `;
  container.appendChild(banner);

  // 今日馆务
  ensureDailyTasks();
  container.appendChild(renderDailyTasks());

  const card = el('div', 'parchment-bg rounded-2xl p-6 md:p-8 magic-glow relative overflow-hidden');
  card.appendChild(el('div', 'grain-texture absolute inset-0 pointer-events-none'));

  // 模式选择器（活跃时也可见，但禁用交互）
  card.appendChild(renderModeSelector(sess));
  // 书籍选择器（活跃时隐藏，节省动画空间）
  if (!sess.active) card.appendChild(renderBookSelector(sess));

  // 计时器显示区域 / 书写动画
  card.appendChild(renderTimerOrAnimation(sess, book));

  // 控制按钮
  card.appendChild(renderControls(sess));

  // 本书誊抄进度条
  if (sess.bookId && book) {
    card.appendChild(renderBookProgress(sess, book));
  }

  container.appendChild(card);

  // 空闲时显示誊抄预览
  if (!sess.active && sess.bookId && book) {
    container.appendChild(renderCopyPreview(book));
  }
}

// ========== 活跃时轻量更新（不被全量重建打断） ==========

function updateActiveControlsDOM(sess) {
  const pauseBtn = document.querySelector('.focus-pause-btn');
  if (pauseBtn) {
    pauseBtn.innerHTML = sess.paused ? '▶️ 继续' : '⏸️ 暂停';
  }
  if (sess.paused) pauseWriting(); else resumeWriting();
  // 实时更新进度条和字数显示
  if (sess.bookId) updateBookProgressDOM(sess);
}

function updateBookProgressDOM(sess) {
  const book = sess.bookId ? BOOKS[sess.bookId] : null;
  if (!book) return;

  const copiedWords = state.books[sess.bookId]?.copiedWords || 0;
  const totalWords = book.totalWords || 1;
  const pct = Math.min(100, Math.round((copiedWords / totalWords) * 100));

  // 进度条
  const bar = document.getElementById('book-progress-bar');
  if (bar) {
    bar.innerHTML = `
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-xs font-bold text-ink">📖 《${book.title}》誊抄进度</span>
        <span class="text-xs text-ink-light">${copiedWords.toLocaleString()} / ${totalWords.toLocaleString()} 字</span>
      </div>
      <div class="h-2.5 bg-wood/20 rounded-full overflow-hidden">
        <div class="h-full bg-gradient-to-r from-amber-600 to-magic-gold rounded-full transition-all duration-500" style="width:${pct}%"></div>
      </div>
      <div class="text-right text-xs text-ink-light mt-0.5">${pct}%</div>
    `;
  }

  // 字数显示（timer 区底下的 span）
  const wordsEl = document.getElementById('focus-book-words');
  if (wordsEl) wordsEl.textContent = copiedWords.toLocaleString();

  const miniTimer = document.getElementById('focus-mini-timer');
  if (miniTimer && sess.active) {
    miniTimer.textContent = formatTime(sess.elapsedSeconds);
  }
}

function updateFocusBackground() {
  const container = document.getElementById('page-focus');
  if (!container) return;
  const flv = state.library.focusLevel || 0;
  container.style.backgroundImage = `linear-gradient(rgba(44,36,25,0.92), rgba(44,36,25,0.92)), url('visual/focusroom/${FOCUS_IMG_NAMES[flv]}')`;
  container.style.backgroundSize = 'cover';
  container.style.backgroundPosition = 'center';
  container.style.backgroundAttachment = 'fixed';
}

// ========== 计时器 / 书写动画区域 ==========

function renderTimerOrAnimation(sess, book) {
  const wrapper = el('div', 'text-center mb-8');
  wrapper.id = 'focus-display-area';

  if (sess.active && book) {
    const bookWords = book ? state.books[book.id]?.copiedWords || 0 : 0;
    wrapper.innerHTML = `
      <div id="writing-anim-container" class="writing-anim-wrapper mx-auto"></div>
      <div class="writing-status-bar" id="writing-status-bar">🖋️ 缮写中… 第1页</div>
      ${isMomoAccelerating() ? '<div class="text-xs text-magic-gold mt-1 animate-pulse">✨ 墨墨的魔法加速中……</div>' : ''}
      <div class="text-xs text-ink-light mt-1">
        本书 <span id="focus-book-words">${bookWords.toLocaleString()}</span> 字
        · 累计 <span id="focus-active-words">${state.focus.totalWords.toLocaleString()}</span> 字
        · <span id="focus-mini-timer">${formatTime(0)}</span>
      </div>
    `;
    // 延迟启动，等 DOM 挂载后动画引擎可以测量容器尺寸
    setTimeout(() => {
      const animContainer = document.getElementById('writing-anim-container');
      if (animContainer) startWriting(animContainer, book, { copiedWords: state.books[book.id]?.copiedWords || 0 });
    }, 50);
  } else {
    wrapper.innerHTML = `
      <div class="text-6xl md:text-7xl font-display font-bold text-ink mb-2">00:00</div>
      ${sess.bookId && book ? `<div class="text-magic-blue font-medium">缮写《${book.title}》</div>` : ''}
      <div class="text-sm text-ink-light mt-1">本书 ${book ? (state.books[book.id]?.copiedWords || 0).toLocaleString() : 0} 字 · 累计 ${state.focus.totalWords.toLocaleString()} 字</div>
    `;
  }

  return wrapper;
}

// ========== 模式选择器 ==========

function renderModeSelector(sess) {
  const modes = [
    { id: 'pomodoro', name: '番茄钟', icon: '🍅', target: 25 },
    { id: 'countdown', name: '倒计时', icon: '⏲️', target: 45 },
    { id: 'stopwatch', name: '正计时', icon: '⏱️', target: 0 }
  ];

  const div = el('div', 'mb-6');
  div.appendChild(el('h2', 'font-display text-lg font-bold mb-3', { text: '选择专注模式' }));
  const grid = el('div', 'grid grid-cols-3 gap-3');

  modes.forEach(m => {
    const active = sess.mode === m.id;
    const desc = m.id === 'stopwatch' ? '无限制' : `${sess.mode === m.id ? sess.targetMinutes : m.target}分钟`;
    const btn = el('button', `mode-btn p-3 border-2 rounded-lg text-center transition-all ${
      active ? 'border-magic-gold bg-magic-gold/20 ring-2 ring-magic-gold' : 'border-wood bg-wood/10 hover:bg-wood/20'
    }${sess.active ? ' opacity-50 cursor-not-allowed' : ''}`);
    btn.innerHTML = `<div class="text-2xl mb-1">${m.icon}</div><div class="font-bold text-sm">${m.name}</div><div class="text-xs text-ink-light">${desc}</div>`;
    btn.addEventListener('click', () => {
      if (!state.currentSession.active) {
        state.currentSession.mode = m.id;
        if (m.id !== 'stopwatch' && state.currentSession.targetMinutes === 0) {
          state.currentSession.targetMinutes = m.target;
        }
        renderFocusPage();
      }
    });
    grid.appendChild(btn);
  });

  div.appendChild(grid);

  // 倒计时/番茄钟模式：自定义分钟输入
  if (!sess.active && sess.mode !== 'stopwatch') {
    const row = el('div', 'flex items-center gap-2 mt-3 justify-center');
    row.innerHTML = `
      <label class="text-sm text-ink-light">设定时间：</label>
      <input type="number" id="custom-target-minutes"
        class="w-16 px-2 py-1 text-center border border-wood rounded bg-white text-ink font-bold text-sm"
        value="${sess.targetMinutes}" min="1" max="180" step="5">
      <span class="text-sm text-ink-light">分钟</span>
    `;
    row.querySelector('input').addEventListener('input', (e) => {
      const v = Math.max(1, Math.min(180, parseInt(e.target.value) || 1));
      state.currentSession.targetMinutes = v;
      e.target.value = v;
    });
    row.querySelector('input').addEventListener('change', (e) => {
      const v = Math.max(1, Math.min(180, parseInt(e.target.value) || 1));
      state.currentSession.targetMinutes = v;
      e.target.value = v;
    });
    div.appendChild(row);
  }

  return div;
}

// ========== 书籍选择器 ==========

function renderBookSelector(sess) {
  const div = el('div', 'mb-8');
  div.appendChild(el('h2', 'font-display text-lg font-bold mb-3', { text: '选择誊抄书籍' }));
  const flex = el('div', 'flex gap-3 overflow-x-auto pb-2');

  const eligibleBooks = Object.values(BOOKS).filter(book => {
    const bs = state.books[book.id];
    if (!bs || bs.status === 'locked') return false;
    // 已开始抄写 / 已解锁 / 抄写中（结算前 copiedWords 为 0）
    return (bs.copiedWords > 0 || bs.status === 'unlocked' || bs.status === 'copying') && bs.masteryLevel < 5;
  });

  if (eligibleBooks.length === 0) {
    const tip = el('p', 'text-ink-light text-sm py-4');
    tip.textContent = '去书架选一本书开始誊抄吧 📚';
    div.appendChild(tip);
    return div;
  }

  eligibleBooks.forEach(book => {
    const bs = state.books[book.id];
    const active = sess.bookId === book.id;
    const btn = el('button', `book-select flex-shrink-0 w-24 p-2 border-2 rounded-lg text-center transition-all ${
      active ? 'border-magic-gold bg-magic-gold/10' : 'border-wood/30 bg-white/50'
    }`);
    const progress = book.totalWords > 0 ? Math.round((bs.copiedWords / book.totalWords) * 100) : 0;
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

// ========== 今日馆务 ==========

function renderDailyTasks() {
  const dt = state.dailyTasks;
  const done = (dt.focusDone ? 1 : 0) + (dt.returnDone ? 1 : 0) + (dt.waterDone ? 1 : 0);
  const allDone = done === 3;

  const tasks = [
    { icon: '🖋️', label: '专注 25 分钟', done: dt.focusDone, reward: '💰 30' },
    { icon: '📥', label: '收取一本还书', done: dt.returnDone, reward: '✨ 5' },
    { icon: '🌱', label: '给植物浇水', done: dt.waterDone, reward: '💰 10' }
  ];

  const card = el('div', 'mb-4 rounded-xl overflow-hidden border border-wood/20');
  card.style.background = 'linear-gradient(180deg, rgba(245,230,200,0.75) 0%, rgba(232,213,168,0.55) 100%)';
  card.style.boxShadow = 'inset 0 0 30px rgba(139,105,20,0.06), 0 1px 4px rgba(0,0,0,0.08)';

  card.innerHTML = `
    <div class="flex items-center gap-2 px-4 pt-3 pb-1">
      <span class="text-sm">📜</span>
      <span class="text-xs font-bold tracking-wider" style="color:#6b5010">今日馆务</span>
      <span class="text-[11px] ml-auto font-bold" style="color:${allDone ? '#c9a227' : '#2c2419'}">${allDone ? '✦ 全数了却' : `${done}/3`}</span>
    </div>
    <div class="px-3 pb-1">
      ${tasks.map((t, i) => `
        <div class="flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-500 ${t.done ? '' : ''}"
             style="${t.done
               ? 'background:linear-gradient(90deg, rgba(201,162,39,0.1) 0%, transparent 100%);'
               : ''}${i < 2 ? 'margin-bottom:2px;' : ''}">
          <div class="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-base transition-all duration-500"
               style="${t.done
                 ? 'background:rgba(201,162,39,0.18); box-shadow:0 0 8px rgba(201,162,39,0.12);'
                 : 'background:rgba(44,36,25,0.06);'}">
            ${t.icon}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-[13px] font-bold transition-all duration-500"
                 style="color:${t.done ? '#6b5010' : '#2c2419'}">
              ${t.done ? '✓ ' : ''}${t.label}
            </div>
          </div>
          <div class="text-[11px] transition-all duration-500 font-bold"
               style="color:${t.done ? '#b08818' : '#5c4d3c'}">
            ${t.done ? t.reward : t.reward}
          </div>
        </div>
      `).join('')}
    </div>
    ${allDone && !dt.allClaimed ? `
      <button class="claim-all-btn w-full px-4 py-2.5 text-xs font-bold tracking-wider transition-all duration-300"
              style="background:linear-gradient(135deg, rgba(201,162,39,0.85) 0%, rgba(180,140,20,0.9) 100%); color:#fff; letter-spacing:0.06em;">
        🎁 领取全勤奖励 · 💰20 + ✨3
      </button>
    ` : allDone ? `
      <div class="text-center py-2 text-[11px] tracking-wider font-bold" style="color:#6b5010;">✦ 今日馆务已悉数完成 ✦</div>
    ` : ''}
  `;

  // 全勤领取
  if (allDone && !dt.allClaimed) {
    const claimBtn = card.querySelector('.claim-all-btn');
    claimBtn.addEventListener('click', () => {
      const bonus = claimAllDoneBonus(state);
      if (bonus) {
        claimBtn.textContent = '✓ 已领取';
        claimBtn.disabled = true;
        claimBtn.style.opacity = '0.6';
        updateStatusBar();
      }
    });
  }

  return card;
}

// ========== 控制按钮 ==========

function renderControls(sess) {
  const div = el('div', 'flex justify-center gap-4');

  if (!sess.active) {
    const startBtn = el('button',
      'px-8 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all animate-glow text-lg');
    startBtn.textContent = '✨ 开始专注';
    startBtn.addEventListener('click', () => actions.startFocus());
    div.appendChild(startBtn);
  } else {
    const pauseBtn = el('button',
      `focus-pause-btn px-5 py-2 ${sess.paused ? 'bg-magic-gold' : 'bg-wood'} text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all`);
    pauseBtn.innerHTML = sess.paused ? '▶️ 继续' : '⏸️ 暂停';
    pauseBtn.addEventListener('click', () => actions.togglePause());

    const doneBtn = el('button',
      'px-5 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all');
    doneBtn.textContent = '✅ 完成';
    doneBtn.addEventListener('click', () => actions.completeFocus());

    const abandonBtn = el('button',
      'px-5 py-2 bg-red-700/60 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-all');
    abandonBtn.textContent = '✋ 放弃';
    abandonBtn.addEventListener('click', () => {
      if (confirm('确定要放弃本次专注吗？已完成时间将计入50%。')) {
        actions.abandonFocus();
      }
    });

    div.appendChild(pauseBtn);
    div.appendChild(doneBtn);
    div.appendChild(abandonBtn);
  }

  return div;
}

// ========== 本书誊抄进度条 ==========

function renderBookProgress(sess, book) {
  const copiedWords = state.books[sess.bookId]?.copiedWords || 0;
  const totalWords = book.totalWords || 1;
  const pct = Math.min(100, Math.round((copiedWords / totalWords) * 100));

  const div = el('div', 'mt-4 pt-4 border-t border-wood/20');
  div.id = 'book-progress-bar';

  div.innerHTML = `
    <div class="flex items-center justify-between mb-1.5">
      <span class="text-xs font-bold text-ink">📖 《${book.title}》誊抄进度</span>
      <span class="text-xs text-ink-light">${copiedWords.toLocaleString()} / ${totalWords.toLocaleString()} 字</span>
    </div>
    <div class="h-2.5 bg-wood/20 rounded-full overflow-hidden">
      <div class="h-full bg-gradient-to-r from-amber-600 to-magic-gold rounded-full transition-all duration-500" style="width:${pct}%"></div>
    </div>
    <div class="text-right text-xs text-ink-light mt-0.5">${pct}%</div>
  `;

  return div;
}

// ========== 誊抄预览卡片 ==========

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

export function showCompletionCard({ minutes, words, coins, book, streak, totalWords, nextMilestone }, callback) {
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

  // 下一里程碑进度
  let milestoneHtml = '';
  if (nextMilestone && totalWords) {
    const pct = Math.min(99, Math.round(totalWords / nextMilestone * 100));
    milestoneHtml = `
      <div class="bg-white/60 rounded-lg p-2 mb-1">
        <div class="text-xs text-ink-light mb-1">🎯 下一里程碑：${nextMilestone.toLocaleString()} 字</div>
        <div class="h-1.5 bg-wood/20 rounded-full overflow-hidden">
          <div class="h-full bg-magic-gold rounded-full" style="width:${pct}%"></div>
        </div>
        <div class="text-xs text-ink-light mt-0.5">进度 ${pct}%</div>
      </div>
    `;
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
        <div class="text-xs text-ink-light">智慧之光</div>
      </div>
    </div>
    ${streak !== undefined ? `<div class="flex justify-center gap-4 mb-3 text-sm">
      <span>🔥 连续专注 <span class="font-bold text-purple-600">${streak}</span> 天</span>
      ${totalWords !== undefined ? `<span>📝 累计 <span class="font-bold text-magic-blue">${totalWords.toLocaleString()}</span> 字</span>` : ''}
    </div>` : ''}
    ${milestoneHtml}
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
