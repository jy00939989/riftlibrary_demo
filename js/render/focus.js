// 缮写室（专注页面）渲染
import { state } from '../state.js';
import { BOOKS, COPY_TEMPLATES } from '../../data/books.js';
import { el, h, formatTime, actions, updateStatusBar, getBookTitle, getBookQuotes, getChapterTitle, getChapterPreview } from './common.js';
import { t, getAtmosphereStageName, getFocusRoomLevelName } from '../i18n/terms.js';
import { startWriting, pauseWriting, resumeWriting, stopWriting, isWriting } from './writing.js';
import { isMomoAccelerating } from '../timer.js';
import { ensureDailyTasks, claimAllDoneBonus } from '../dailytasks.js';
import { getActiveChapterTaskForBook } from '../quests.js';
import { getActiveAuras } from '../visitors.js';
import { getEffectiveCopiedWords, getRepairProgress } from '../core/book-utils.js';

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
// 等级名通过 getFocusRoomLevelName(level) 从 i18n 获取

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
    <img src="visual/focusroom/${FOCUS_IMG_NAMES[flv]}" alt="${t('tabScriptorium')} · ${getFocusRoomLevelName(flv)}" class="w-full h-48 object-cover">
    <div class="bg-ink/70 text-white text-center py-2 text-sm">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather-icon"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line></svg> ${t('tabScriptorium')} ·${getFocusRoomLevelName(flv)}${flv > 0 ? ` · ${t('transcribeSpeed').replace('{value}', Math.round((1 + flv * 0.05) * 100))}` : ''}
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

  // 位面任务章节指示器
  if (sess.bookId && book) {
    const indicator = renderQuestChapterIndicator(sess, book);
    if (indicator) card.appendChild(indicator);
  }

  // 本书誊抄进度条
  if (sess.bookId && book) {
    card.appendChild(renderBookProgress(sess, book));
  }

  container.appendChild(card);

  // 在馆光环提示
  const auraSection = renderAuraIndicator();
  if (auraSection) container.appendChild(auraSection);

  // 空闲时显示誊抄预览
  if (!sess.active && sess.bookId && book) {
    container.appendChild(renderCopyPreview(book));
  }
}

// ========== 活跃时轻量更新（不被全量重建打断） ==========

function updateActiveControlsDOM(sess) {
  const pauseBtn = document.querySelector('.focus-pause-btn');
  if (pauseBtn) {
    pauseBtn.innerHTML = sess.paused ? t('resume') : t('pause');
  }
  if (sess.paused) pauseWriting(); else resumeWriting();
  // 实时更新进度条和字数显示
  if (sess.bookId) {
    updateBookProgressDOM(sess);
    updateQuestChapterIndicatorDOM(sess);
  }
}

function updateBookProgressDOM(sess) {
  const book = sess.bookId ? BOOKS[sess.bookId] : null;
  if (!book) return;

  const bookState = state.books[sess.bookId];
  const totalWords = book.totalWords || 1;
  const effectiveWords = getEffectiveCopiedWords(bookState, totalWords);
  const pct = Math.min(100, Math.round((effectiveWords / totalWords) * 100));
  const repair = getRepairProgress(bookState);

  // 进度条
  const bar = document.getElementById('book-progress-bar');
  if (bar) {
    let repairHtml = '';
    if (repair) {
      repairHtml = `
        <div class="flex items-center justify-between mb-1 mt-3">
          <span class="text-xs font-bold text-amber-700">${t('repairProgress')}</span>
          <span class="text-xs text-amber-600">${(repair.done || 0).toLocaleString()} / ${repair.total.toLocaleString()} ${t('wordsUnit')}</span>
        </div>
        <div class="h-2 bg-wood/20 rounded-full overflow-hidden mb-3">
          <div class="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500" style="width:${repair.pct}%"></div>
        </div>
        <div class="text-right text-xs text-amber-600 mb-1">${t('repairSpeedBoost').replace('{pct}', repair.pct).replace('{n}', 5)}</div>
      `;
    }
    bar.innerHTML = `
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-xs font-bold text-ink">📖 ${t('copyProgressLabel').replace('{title}', '《' + getBookTitle(book) + '》')}</span>
        <span class="text-xs text-ink-light">${effectiveWords.toLocaleString()} / ${totalWords.toLocaleString()} ${t('wordsUnit')}</span>
      </div>
      <div class="h-2.5 bg-wood/20 rounded-full overflow-hidden">
        <div class="h-full bg-gradient-to-r from-amber-600 to-magic-gold rounded-full transition-all duration-500" style="width:${pct}%"></div>
      </div>
      <div class="text-right text-xs text-ink-light mt-0.5">${pct}%</div>
      ${repairHtml}
    `;
  }

  // 字数显示（timer 区底下的 span）
  const wordsEl = document.getElementById('focus-book-words');
  if (wordsEl) wordsEl.textContent = effectiveWords.toLocaleString();

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
      <div class="writing-status-bar" id="writing-status-bar">${t('writingStatus').replace('{n}', 1)}</div>
      ${isMomoAccelerating() ? `<div class="text-xs text-magic-gold mt-1 animate-pulse">${t('momoMagicAccelerating')}</div>` : ''}
      <div class="text-xs text-ink-light mt-1">
        ${t('thisBook')} <span id="focus-book-words">${bookWords.toLocaleString()}</span> ${t('wordsUnit')}
        · ${t('totalWordsLabel').replace('{n}', `<span id="focus-active-words">${state.focus.totalWords.toLocaleString()}</span>`)}
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
      ${sess.bookId && book ? `<div class="text-magic-blue font-medium">${t('copyBookLabel').replace('{title}', '《' + getBookTitle(book) + '》')}</div>` : ''}
      <div class="text-sm text-ink-light mt-1">${t('bookWordCount').replace('{book}', book ? (state.books[book.id]?.copiedWords || 0).toLocaleString() : 0).replace('{total}', state.focus.totalWords.toLocaleString())}</div>
    `;
  }

  return wrapper;
}

// ========== 模式选择器 ==========

function renderModeSelector(sess) {
  const modes = [
    { id: 'pomodoro', name: t('focusModePomodoro'), icon: '🍅', target: 25 },
    { id: 'countdown', name: t('focusModeCountdown'), icon: '⏲️', target: 45 },
    { id: 'stopwatch', name: t('focusModeStopwatch'), icon: '⏱️', target: 0 }
  ];

  const div = el('div', 'mb-6');
  div.appendChild(el('h2', 'font-display text-lg font-bold mb-3', { text: t('selectFocusMode') }));
  const grid = el('div', 'grid grid-cols-3 gap-3');

  modes.forEach(m => {
    const active = sess.mode === m.id;
    const desc = m.id === 'stopwatch' ? t('noLimit') : t('durationMinutes').replace('{n}', sess.mode === m.id ? sess.targetMinutes : m.target);
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
      <label class="text-sm text-ink-light">${t('setTime')}</label>
      <input type="number" id="custom-target-minutes"
        class="w-16 px-2 py-1 text-center border border-wood rounded bg-white text-ink font-bold text-sm"
        value="${sess.targetMinutes}" min="1" max="180" step="5">
      <span class="text-sm text-ink-light">${t('minutesSuffix')}</span>
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
  div.appendChild(el('h2', 'font-display text-lg font-bold mb-3', { text: t('selectBookToTranscribe') }));
  const flex = el('div', 'flex gap-3 overflow-x-auto pb-2');

  const eligibleBooks = Object.values(BOOKS).filter(book => {
    const bs = state.books[book.id];
    if (!bs || bs.status === 'locked') return false;
    // 无熟练度的书抄完就不再出现在选择器中
    if (book.noMastery && bs.status === 'completed') return false;
    // mastery Lv5 = 500%+，不再出现在誊抄选择器中
    if (bs.masteryLevel >= 5 || bs.copyCount >= 5) return false;
    // 已完成的书需要先花费灵感解锁重抄
    if (bs.status === 'completed' && !bs.reCopyUnlocked) return false;
    return (bs.status === 'unlocked' || bs.status === 'copying' || bs.copiedWords > 0);
  });

  if (eligibleBooks.length === 0) {
    const tip = el('p', 'text-ink-light text-sm py-4');
    tip.textContent = t('goToShelfSelectBook');
    div.appendChild(tip);
    return div;
  }

  eligibleBooks.forEach(book => {
    const bs = state.books[book.id];
    const active = sess.bookId === book.id;
    const repair = getRepairProgress(bs);
    const isDamaged = bs && bs.damaged;
    const btn = el('button', `book-select flex-shrink-0 w-24 p-2 border-2 rounded-lg text-center transition-all ${
      active ? 'border-magic-gold bg-magic-gold/10' : isDamaged ? 'border-amber-400 bg-amber-50' : 'border-wood/30 bg-white/50'
    }`);
    const effectiveWords = getEffectiveCopiedWords(bs, book.totalWords);
    const progress = book.totalWords > 0 ? Math.round((effectiveWords / book.totalWords) * 100) : 0;
    const repairHtml = repair ? `<div class="text-[10px] text-amber-600 font-bold mt-0.5">${t('repairing').replace('{pct}', repair.pct)}</div>` : '';
    btn.innerHTML = `<div class="text-3xl mb-1">${book.emoji}</div><div class="font-bold text-xs">${getBookTitle(book)}</div><div class="text-xs text-ink-light">${progress}%</div>${repairHtml}`;
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
    { icon: '🖋️', label: t('dailyFocus25Min'), done: dt.focusDone, reward: '💰 30' },
    { icon: '📥', label: t('dailyReturnBook'), done: dt.returnDone, reward: '✨ 5' },
    { icon: '🌱', label: t('dailyWaterPlant'), done: dt.waterDone, reward: '💰 10' }
  ];

  const card = el('div', 'mb-4 rounded-xl overflow-hidden border border-wood/20');
  card.style.background = 'linear-gradient(180deg, rgba(245,230,200,0.75) 0%, rgba(232,213,168,0.55) 100%)';
  card.style.boxShadow = 'inset 0 0 30px rgba(139,105,20,0.06), 0 1px 4px rgba(0,0,0,0.08)';

  card.innerHTML = `
    <div class="flex items-center gap-2 px-4 pt-3 pb-1">
      <span class="text-sm">📜</span>
      <span class="text-xs font-bold tracking-wider" style="color:#6b5010">${t('dailyTask')}</span>
      <span class="text-[11px] ml-auto font-bold" style="color:${allDone ? '#c9a227' : '#2c2419'}">${allDone ? t('allDoneText') : `${done}/3`}</span>
    </div>
    <div class="px-3 pb-1">
      ${tasks.map((task, i) => `
        <div class="flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-500 ${task.done ? '' : ''}"
             style="${task.done
               ? 'background:linear-gradient(90deg, rgba(201,162,39,0.1) 0%, transparent 100%);'
               : ''}${i < 2 ? 'margin-bottom:2px;' : ''}">
          <div class="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-base transition-all duration-500"
               style="${task.done
                 ? 'background:rgba(201,162,39,0.18); box-shadow:0 0 8px rgba(201,162,39,0.12);'
                 : 'background:rgba(44,36,25,0.06);'}">
            ${task.icon}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-[13px] font-bold transition-all duration-500"
                 style="color:${task.done ? '#6b5010' : '#2c2419'}">
              ${task.done ? '✓ ' : ''}${task.label}
            </div>
          </div>
          <div class="text-[11px] transition-all duration-500 font-bold"
               style="color:${task.done ? '#b08818' : '#5c4d3c'}">
            ${task.done ? task.reward : task.reward}
          </div>
        </div>
      `).join('')}
    </div>
    ${allDone && !dt.allClaimed ? `
      <button class="claim-all-btn w-full px-4 py-2.5 text-xs font-bold tracking-wider transition-all duration-300"
              style="background:linear-gradient(135deg, rgba(201,162,39,0.85) 0%, rgba(180,140,20,0.9) 100%); color:#fff; letter-spacing:0.06em;">
        ${t('claimAllDoneReward')}
      </button>
    ` : allDone ? `
      <div class="text-center py-2 text-[11px] tracking-wider font-bold" style="color:#6b5010;">${t('dailyTasksAllCompleted')}</div>
    ` : ''}
  `;

  // 全勤领取
  if (allDone && !dt.allClaimed) {
    const claimBtn = card.querySelector('.claim-all-btn');
    claimBtn.addEventListener('click', () => {
      const bonus = claimAllDoneBonus(state);
      if (bonus) {
        claimBtn.textContent = t('rewardClaimed');
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
  const div = el('div', 'flex flex-wrap justify-center gap-2 sm:gap-4');

  if (!sess.active) {
    const startBtn = el('button',
      'px-8 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all animate-glow text-lg');
    startBtn.textContent = t('startFocus');
    startBtn.addEventListener('click', () => actions.startFocus());
    div.appendChild(startBtn);
  } else {
    const pauseBtn = el('button',
      `focus-pause-btn px-5 py-2 ${sess.paused ? 'bg-magic-gold' : 'bg-wood'} text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all`);
    pauseBtn.innerHTML = sess.paused ? t('resume') : t('pause');
    pauseBtn.addEventListener('click', () => actions.togglePause());

    const doneBtn = el('button',
      'px-5 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all');
    doneBtn.textContent = t('complete');
    doneBtn.addEventListener('click', () => actions.completeFocus());

    const abandonBtn = el('button',
      'px-5 py-2 bg-red-700/60 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-all');
    abandonBtn.textContent = '✋ ' + t('abandon');
    abandonBtn.addEventListener('click', () => {
      if (confirm(t('confirmAbandonFocus').replace('{pct}', 50))) {
        actions.abandonFocus();
      }
    });

    div.appendChild(pauseBtn);
    div.appendChild(doneBtn);
    div.appendChild(abandonBtn);
  }

  return div;
}

// ========== 位面任务章节指示器 ==========

function getPlanePageLink() {
  return `<a href="#" class="underline font-bold text-magic-blue" onclick="window.switchTab('archive')">${t('planePage')}</a>`;
}

function buildChapterUnlockedMessage(chapterNum, chapter) {
  return t('chapterUnlockedPrompt')
    .replace('{n}', chapterNum)
    .replace('{title}', getChapterTitle(chapter))
    .replace('{link}', getPlanePageLink());
}

function buildCopyingChapterMessage(questInfo, chapterNum, chapter, wordsNeeded) {
  const character = `<b>${questInfo.characterEmoji} ${questInfo.characterName}</b>`;
  return t('copyingChapterFor')
    .replace('{character}', character)
    .replace('{n}', chapterNum)
    .replace('{title}', getChapterTitle(chapter))
    .replace('{words}', wordsNeeded.toLocaleString());
}

function renderQuestChapterIndicator(sess, book) {
  const questInfo = getActiveChapterTaskForBook(sess.bookId);
  if (!questInfo) return null;

  const bs = state.books[sess.bookId];
  const copiedWords = bs?.copiedWords || 0;
  const chapter = book.chapters[questInfo.chapterIdx];
  if (!chapter) return null;

  const chapterNum = questInfo.chapterIdx + 1;
  const alreadyUnlocked = bs?.unlockedChapters?.includes(chapterNum);
  const wordsNeeded = Math.max(0, (chapter.unlockAt || 0) - copiedWords);

  const div = el('div', 'mt-3 mb-1');
  div.id = 'quest-chapter-indicator';

  if (alreadyUnlocked) {
    div.innerHTML = `
      <div class="flex items-center gap-2 text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        <span>✅</span>
        <span class="text-green-800">${buildChapterUnlockedMessage(chapterNum, chapter)}</span>
      </div>
    `;
  } else {
    div.innerHTML = `
      <div class="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        <span>✉️</span>
        <span class="text-amber-900">${buildCopyingChapterMessage(questInfo, chapterNum, chapter, wordsNeeded)}</span>
      </div>
    `;
  }

  return div;
}

function updateQuestChapterIndicatorDOM(sess) {
  const div = document.getElementById('quest-chapter-indicator');
  if (!div) return;
  const book = sess.bookId ? BOOKS[sess.bookId] : null;
  if (!book) return;
  const questInfo = getActiveChapterTaskForBook(sess.bookId);
  if (!questInfo) { div.innerHTML = ''; return; }

  const bs = state.books[sess.bookId];
  const copiedWords = bs?.copiedWords || 0;
  const chapter = book.chapters[questInfo.chapterIdx];
  if (!chapter) return;

  const chapterNum = questInfo.chapterIdx + 1;
  const alreadyUnlocked = bs?.unlockedChapters?.includes(chapterNum);
  const wordsNeeded = Math.max(0, (chapter.unlockAt || 0) - copiedWords);

  if (alreadyUnlocked) {
    div.innerHTML = `
      <div class="flex items-center gap-2 text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        <span>✅</span>
        <span class="text-green-800">${buildChapterUnlockedMessage(chapterNum, chapter)}</span>
      </div>
    `;
  } else {
    div.innerHTML = `
      <div class="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        <span>✉️</span>
        <span class="text-amber-900">${buildCopyingChapterMessage(questInfo, chapterNum, chapter, wordsNeeded)}</span>
      </div>
    `;
  }
}

// ========== 本书誊抄进度条 ==========

function renderBookProgress(sess, book) {
  const bookState = state.books[sess.bookId];
  const totalWords = book.totalWords || 1;
  const effectiveWords = getEffectiveCopiedWords(bookState, totalWords);
  const pct = Math.min(100, Math.round((effectiveWords / totalWords) * 100));
  const repair = getRepairProgress(bookState);

  const div = el('div', 'mt-4 pt-4 border-t border-wood/20');
  div.id = 'book-progress-bar';

  let repairBarHtml = '';
  if (repair) {
    repairBarHtml = `
      <div class="flex items-center justify-between mb-1 mt-3">
        <span class="text-xs font-bold text-amber-700">${t('repairProgress')}</span>
        <span class="text-xs text-amber-600">${(repair.done || 0).toLocaleString()} / ${repair.total.toLocaleString()} ${t('wordsUnit')}</span>
      </div>
      <div class="h-2 bg-wood/20 rounded-full overflow-hidden mb-3">
        <div class="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500" style="width:${repair.pct}%"></div>
      </div>
      <div class="text-right text-xs text-amber-600 mb-1">${t('repairSpeedBoost').replace('{pct}', repair.pct).replace('{n}', 5)}</div>
    `;
  }

  div.innerHTML = `
    <div class="flex items-center justify-between mb-1.5">
      <span class="text-xs font-bold text-ink">📖 ${t('copyProgressLabel').replace('{title}', '《' + getBookTitle(book) + '》')}</span>
      <span class="text-xs text-ink-light">${effectiveWords.toLocaleString()} / ${totalWords.toLocaleString()} ${t('wordsUnit')}</span>
    </div>
    <div class="h-2.5 bg-wood/20 rounded-full overflow-hidden">
      <div class="h-full bg-gradient-to-r from-amber-600 to-magic-gold rounded-full transition-all duration-500" style="width:${pct}%"></div>
    </div>
    <div class="text-right text-xs text-ink-light mt-0.5">${pct}%</div>
    ${repairBarHtml}
  `;

  return div;
}

// ========== 誊抄预览卡片 ==========

function renderCopyPreview(book) {
  const bs = state.books[book.id];
  const isDamaged = bs && bs.damaged;

  if (isDamaged) {
    const repair = getRepairProgress(bs);
    const remainStr = repair ? t('repairRemaining').replace('{words}', repair.remaining.toLocaleString()) : '';
    return h(`
      <div class="mt-4 rounded-xl p-4 border-2 border-amber-300 animate-fade-in" style="background:linear-gradient(135deg, rgba(251,243,219,0.9), rgba(245,225,180,0.7))">
        <div class="flex items-start gap-3">
          <span class="text-2xl">🔧</span>
          <div class="flex-1">
            <div class="text-sm font-bold text-amber-800 mb-1">${t('repairingTitle')}</div>
            <div class="text-xs text-amber-700 leading-relaxed mb-2">
              ${t('repairFlavourText')}
            </div>
            ${remainStr ? `<div class="text-xs text-amber-600 font-bold">${remainStr} · ${t('repairSpeedBoost').replace('{pct}', repair.pct).replace('{n}', 5)}</div>` : ''}
          </div>
        </div>
      </div>
    `);
  }

  const template = COPY_TEMPLATES[state.currentSession.quoteIndex % COPY_TEMPLATES.length];
  const quotes = getBookQuotes(book);
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
          <div class="text-xs text-ink-light">${t('bookSource').replace('{title}', getBookTitle(book))}</div>
          <div class="text-xs text-magic-blue mt-1">${template.closing}</div>
        </div>
      </div>
    </div>
  `);
}

// ========== 休息行动卡 ==========

export function showActionCards(cards, callback) {
  if (!cards || cards.length === 0) { if (callback) callback(null); return; }

  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/50 z-[140] flex items-end justify-center pb-8 p-4';
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.2s';
      setTimeout(() => { overlay.remove(); if (callback) callback(null); }, 200);
    }
  });

  const container = document.createElement('div');
  container.className = 'flex gap-3 max-w-lg w-full animate-fade-in-up';

  cards.forEach(card => {
    const btn = document.createElement('button');
    btn.className = 'flex-1 parchment-bg rounded-xl p-4 border-2 border-magic-gold/20 hover:border-magic-gold hover:shadow-lg transition-all text-center cursor-pointer focus:outline-none';
    btn.innerHTML = `
      <div class="text-3xl mb-2">${card.emoji}</div>
      <div class="text-sm font-bold text-ink mb-1">${card.name}</div>
      <div class="text-xs text-ink-light">${card.desc}</div>
    `;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.2s';
      setTimeout(() => {
        overlay.remove();
        if (callback) callback(card);
      }, 200);
    });
    container.appendChild(btn);
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'w-full flex flex-col items-center';
  wrapper.innerHTML = `
    <p class="text-white/80 text-sm mb-3 font-bold">${t('takeABreakChooseAction')}</p>
  `;
  wrapper.appendChild(container);

  overlay.appendChild(wrapper);
  document.body.appendChild(overlay);
}

// ========== 在馆光环提示 ==========

function renderAuraIndicator() {
  const auras = getActiveAuras();
  if (auras.length === 0) return null;

  const wrapper = el('div', 'mt-4 p-3 rounded-xl border border-magic-gold/20');
  wrapper.style.background = 'linear-gradient(135deg, rgba(201,162,39,0.06) 0%, rgba(201,162,39,0.02) 100%)';

  const lines = auras.map(a => {
    // 目前光环无时限，预留 duration 字段
    const timerHtml = a.duration
      ? `<span class="text-xs text-magic-blue ml-1">${t('durationMinutes').replace('{n}', Math.ceil(a.duration / 60000))}</span>`
      : '';
    return `
      <div class="flex items-center gap-2 text-xs text-ink-light">
        <span class="text-magic-gold text-sm">✨</span>
        <span class="font-bold text-ink">${a.name}</span>
        <span>${a.desc}</span>
        ${timerHtml}
      </div>
    `;
  }).join('');

  wrapper.innerHTML = `
    <div class="text-xs text-magic-gold font-bold mb-1.5">${t('activeAurasCount').replace('{n}', auras.length)}</div>
    <div class="space-y-1">${lines}</div>
  `;

  return wrapper;
}

// ========== 墨墨书评池 ==========

const MOMO_REVIEWS = {
  _generic: [
    'momoReviewGeneric0',
    'momoReviewGeneric1',
    'momoReviewGeneric2',
    'momoReviewGeneric3',
    'momoReviewGeneric4',
    'momoReviewGeneric5',
    'momoReviewGeneric6',
    'momoReviewGeneric7'
  ],
  book_001: [
    'momoReviewBook001_0',
    'momoReviewBook001_1'
  ],
  book_016: [
    'momoReviewBook016_0',
    'momoReviewBook016_1'
  ],
  book_017: [
    'momoReviewBook017_0',
    'momoReviewBook017_1'
  ],
  book_023: [
    'momoReviewBook023_0',
    'momoReviewBook023_1'
  ],
  book_024: [
    'momoReviewBook024_0',
    'momoReviewBook024_1'
  ],
  book_027: [
    'momoReviewBook027_0',
    'momoReviewBook027_1'
  ],
  book_028: [
    'momoReviewBook028_0',
    'momoReviewBook028_1'
  ],
  book_029: [
    'momoReviewBook029_0',
    'momoReviewBook029_1'
  ]
};

function getMomoReview(book) {
  if (Math.random() > 0.3) return null;
  const pool = (book && MOMO_REVIEWS[book.id]) ? MOMO_REVIEWS[book.id] : [];
  const fullPool = pool.length > 0 ? [...pool, ...MOMO_REVIEWS._generic] : MOMO_REVIEWS._generic;
  const key = fullPool[Math.floor(Math.random() * fullPool.length)];
  return t(key);
}

// ========== 专注完成结算卡片 ==========

export function showCompletionCard({ minutes, words, coins, book, streak, totalWords, nextMilestone, chapterInfo, nextPreview }, callback) {
  const momoReview = getMomoReview(book);
  let quoteText = '';
  let quoteSource = '';
  if (book && getBookQuotes(book)) {
    const quoteKeys = Object.keys(getBookQuotes(book));
    const key = quoteKeys[Math.floor(Math.random() * quoteKeys.length)];
    quoteText = getBookQuotes(book)[key];
    quoteSource = t('bookSource').replace('{title}', getBookTitle(book));
  }
  if (!quoteText) {
    const generalQuotes = [
      t('completionQuote1'),
      t('completionQuote2'),
      t('completionQuote3')
    ];
    quoteText = generalQuotes[Math.floor(Math.random() * generalQuotes.length)];
  }

  // 下一里程碑进度
  let milestoneHtml = '';
  if (nextMilestone && totalWords) {
    const pct = Math.min(99, Math.round(totalWords / nextMilestone * 100));
    milestoneHtml = `
      <div class="bg-white/60 rounded-lg p-2 mb-1">
        <div class="text-xs text-ink-light mb-1">${t('nextMilestoneLabel').replace('{n}', nextMilestone.toLocaleString())}</div>
        <div class="h-1.5 bg-wood/20 rounded-full overflow-hidden">
          <div class="h-full bg-magic-gold rounded-full" style="width:${pct}%"></div>
        </div>
        <div class="text-xs text-ink-light mt-0.5">${t('progressPct').replace('{n}', pct)}</div>
      </div>
    `;
  }

  // 本书章节进度
  const currentChapter = chapterInfo && book && book.chapters[chapterInfo.current - 1] ? book.chapters[chapterInfo.current - 1] : null;
  const nextChapter = chapterInfo && book && book.chapters[chapterInfo.current] ? book.chapters[chapterInfo.current] : null;
  const localizedChapterTitle = currentChapter ? getChapterTitle(currentChapter) : (chapterInfo ? chapterInfo.title : '');
  const localizedHighlight = currentChapter
    ? (currentChapter.highlight || getChapterPreview(currentChapter))
    : (chapterInfo ? chapterInfo.highlight : '');
  const localizedNextPreview = nextChapter ? getChapterPreview(nextChapter) : nextPreview;

  let chapterHtml = '';
  if (chapterInfo && book) {
    chapterHtml = `
      <div class="bg-white/60 rounded-lg p-3 mb-3 text-left">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs font-bold text-ink">📖 ${localizedChapterTitle}</span>
          <span class="text-xs text-ink-light">${t('chapterProgress').replace('{current}', chapterInfo.current).replace('{total}', chapterInfo.total)}</span>
        </div>
        <div class="h-2 bg-wood/20 rounded-full overflow-hidden mb-1">
          <div class="h-full bg-gradient-to-r from-amber-500 to-magic-gold rounded-full transition-all duration-700" style="width:${chapterInfo.progressPct}%"></div>
        </div>
        <div class="flex justify-between text-xs text-ink-light">
          <span>${t('copiedPct').replace('{n}', chapterInfo.progressPct)}</span>
          <span>${t('remainingMinutes').replace('{n}', chapterInfo.remainingMinutes)}</span>
        </div>
      </div>
    `;
  }

  // 句子回显
  let echoHtml = '';
  if (localizedHighlight) {
    echoHtml = `
      <div class="bg-amber-50/80 border-l-4 border-magic-gold rounded-r-lg p-3 mb-3 text-left">
        <div class="text-xs text-magic-gold font-bold mb-1">${t('justCopiedSentence')}</div>
        <p class="text-sm text-ink italic leading-relaxed">「${localizedHighlight}」</p>
      </div>
    `;
  }

  // 下一章引文预告
  let nextPreviewHtml = '';
  if (localizedNextPreview) {
    nextPreviewHtml = `
      <div class="bg-stone-50/80 border-l-4 border-stone-300 rounded-r-lg p-3 mb-3 text-left">
        <div class="text-xs text-ink-light font-bold mb-1">${t('nextChapterQuotePreview')}</div>
        <p class="text-sm text-ink-light leading-relaxed">${localizedNextPreview}</p>
      </div>
    `;
  }

  // 墨墨书评
  let momoHtml = '';
  if (momoReview) {
    momoHtml = `
      <div class="bg-magic-gold/5 border border-magic-gold/20 rounded-lg p-3 mb-3">
        <div class="flex items-start gap-2">
          <span class="text-xl flex-shrink-0">🦉</span>
          <div class="text-left">
            <span class="text-xs text-magic-gold font-bold">${t('momosBookReview')}</span>
            <p class="text-xs text-ink-light leading-relaxed mt-0.5">${momoReview}</p>
          </div>
        </div>
      </div>
    `;
  }

  const overlay = el('div', 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4');
  const card = el('div', 'parchment-bg rounded-2xl p-6 max-w-sm w-full text-center magic-glow animate-scale-in');

  card.innerHTML = `
    <div class="text-4xl mb-3">✨</div>
    <h3 class="font-display text-xl font-bold mb-4">${t('focusCompleted')}</h3>
    <div class="grid grid-cols-3 gap-2 mb-4">
      <div class="bg-white/60 rounded-lg p-3">
        <div class="text-lg font-bold text-magic-blue">${minutes}</div>
        <div class="text-xs text-ink-light">${t('unitMinutes')}</div>
      </div>
      <div class="bg-white/60 rounded-lg p-3">
        <div class="text-lg font-bold text-magic-blue">${words.toLocaleString()}</div>
        <div class="text-xs text-ink-light">${t('copiedWordsLabel')}</div>
      </div>
      <div class="bg-white/60 rounded-lg p-3">
        <div class="text-lg font-bold text-magic-gold">+${coins}</div>
        <div class="text-xs text-ink-light">${t('coins')}</div>
      </div>
    </div>
    ${streak !== undefined ? `<div class="flex justify-center gap-4 mb-3 text-sm">
      <span>🔥 ${t('streakDays').replace('{n}', streak)}</span>
      ${totalWords !== undefined ? `<span>📝 ${t('totalWordsLabel').replace('{n}', totalWords.toLocaleString())}</span>` : ''}
    </div>` : ''}
    ${milestoneHtml}
    ${chapterHtml}
    ${echoHtml}
    ${nextPreviewHtml}
    <div class="italic text-ink-light mb-3 text-sm">「${quoteText}」${quoteSource}</div>
    ${momoHtml}
    <button class="px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">${t('continueText')}</button>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // 超过一屏时允许滚动
  card.style.maxHeight = '85vh';
  card.style.overflowY = 'auto';

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
