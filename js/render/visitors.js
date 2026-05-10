// 访客中心页面渲染
import { state } from '../state.js';
import { el, actions } from './common.js';

function timeLeft(dueTime) {
  const now = Date.now();
  const ms = dueTime - now;
  if (ms <= 0) return '已到期';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}小时${m}分后`;
  return `${m}分钟后`;
}

export function renderVisitorsPage() {
  const container = document.getElementById('page-visitors');
  if (!container) return;

  const browsing = state.visitors.filter(v => v.status === 'browsing');
  const borrowed = state.visitors.filter(v => v.status === 'borrowed');
  const due = state.visitors.filter(v => v.status === 'due');

  container.innerHTML = '';

  const card = el('div', 'parchment-bg rounded-2xl p-6 magic-glow');
  card.innerHTML = `<h2 class="font-display text-xl font-bold mb-4">👥 访客中心</h2>`;

  // --- 在馆区 ---
  const section1 = el('div', 'mb-6');
  section1.innerHTML = `<h3 class="font-bold text-sm text-ink-light mb-2">🛋️ 在馆阅览（${browsing.length}人）</h3>`;
  if (browsing.length === 0) {
    section1.appendChild(el('div', 'text-sm text-ink-light py-4 text-center border border-dashed border-wood/30 rounded-lg', { text: '暂无访客在馆，完成专注可吸引访客到来' }));
  } else {
    browsing.forEach(v => {
      const favorText = v.favorability ? ` · 好感 ${v.favorability}` : '';
      const row = el('div', 'flex items-center gap-3 bg-white/60 rounded-lg p-3 mb-2');
      row.innerHTML = `<span class="text-2xl">${v.emoji}</span>
        <div class="flex-1"><span class="font-bold">${v.name}</span><span class="text-xs text-ink-light ml-2">${v.title || ''}</span></div>
        <div class="text-sm text-magic-blue">正在浏览书架...${favorText}</div>`;
      section1.appendChild(row);
    });
  }
  card.appendChild(section1);

  // --- 借出区 ---
  const section2 = el('div', 'mb-6');
  section2.innerHTML = `<h3 class="font-bold text-sm text-ink-light mb-2">📤 已借出（${borrowed.length}本）</h3>`;
  if (borrowed.length === 0) {
    section2.appendChild(el('div', 'text-sm text-ink-light py-4 text-center border border-dashed border-wood/30 rounded-lg', { text: '暂无借出书籍' }));
  } else {
    borrowed.forEach(v => {
      const row = el('div', 'flex items-center gap-3 bg-white/60 rounded-lg p-3 mb-2');
      row.innerHTML = `<span class="text-2xl">${v.emoji}</span>
        <div class="flex-1"><span class="font-bold">${v.name}</span><span class="text-sm text-ink-light ml-2">《${v.bookTitle}》</span></div>
        <div class="text-sm text-magic-blue">⏰ ${timeLeft(v.dueTime)}</div>`;
      section2.appendChild(row);
    });
  }
  card.appendChild(section2);

  // --- 待收取区 ---
  const section3 = el('div', 'mb-4');
  section3.innerHTML = `<h3 class="font-bold text-sm text-ink-light mb-2">📥 待收取（${due.length}本）</h3>`;
  if (due.length === 0) {
    section3.appendChild(el('div', 'text-sm text-ink-light py-4 text-center border border-dashed border-wood/30 rounded-lg', { text: '暂无待收取书籍' }));
  } else {
    due.forEach(v => {
      const row = el('div', 'flex items-center gap-3 bg-magic-gold/10 rounded-lg p-3 mb-2 border border-magic-gold/30');
      row.innerHTML = `<span class="text-2xl">${v.emoji}</span>
        <div class="flex-1"><span class="font-bold">${v.name}</span><span class="text-sm text-ink-light ml-2">《${v.bookTitle}》</span></div>`;
      const btn = el('button', 'px-4 py-2 bg-magic-gold text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all');
      btn.textContent = '📥 收取';
      btn.addEventListener('click', () => {
        if (actions.collectReturn) {
          const result = actions.collectReturn(v.id);
          if (result) {
            showVisitorEventModal(result, () => renderVisitorsPage());
          }
        }
      });
      row.appendChild(btn);
      section3.appendChild(row);
    });
  }
  card.appendChild(section3);

  // 借阅区等级
  const blv = state.library.borrowLevel || 0;
  card.appendChild(el('div', 'text-xs text-ink-light mt-4 pt-4 border-t border-wood/20', {
    text: `借阅区 Lv.${blv} · 阅览氛围 +${blv * 10}%`
  }));

  container.appendChild(card);
}

// ========== 访客事件弹窗 ==========

export function showVisitorEventModal(result, callback) {
  const overlay = el('div', 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4');
  let contentHtml = '';

  if (result.damaged) {
    contentHtml += `<div class="text-center mb-4"><span class="text-4xl">⚠️</span>
      <p class="text-ink-light mt-2">《${result.bookTitle}》在归还时发现轻微损毁，需要重新修复部分内容。</p></div>`;
  }

  if (result.event) {
    const ev = result.event;
    if (ev.type === 'gift_book') {
      contentHtml += `<div class="text-center mb-4"><span class="text-4xl">${ev.emoji}</span>
        <p class="text-magic-gold font-bold mt-2">沈明远赠送了一本旧书！</p>
        <p class="text-ink-light">书名：<span class="italic">${ev.mysteryTitle}</span></p>
        <p class="text-xs text-ink-light mt-1">抄完才知道里面藏着什么故事</p></div>`;
    } else if (ev.type === 'annotation') {
      contentHtml += `<div class="text-center mb-4"><span class="text-4xl">📝</span>
        <p class="text-ink-light mt-2">沈明远在书中留下了批注卡片，字迹工整，引经据典。</p>
        <p class="text-magic-blue font-bold">+${ev.atmosphere} 氛围</p></div>`;
    } else if (ev.type === 'treasure_map') {
      contentHtml += `<div class="text-center mb-4"><span class="text-4xl">🗺️</span>
        <p class="text-magic-gold font-bold mt-2">小萤发现了一张藏宝图！</p>
        <p class="text-ink-light">翻开宝图获得：<span class="text-magic-blue font-bold">${ev.reward.text}</span></p></div>`;
    } else if (ev.type === 'poem') {
      contentHtml += `<div class="text-center mb-4"><span class="text-4xl">🎵</span>
        <p class="text-ink-light italic mt-2">"${ev.poem}"</p>
        <p class="text-magic-blue font-bold">+${ev.atmosphere} 氛围</p></div>`;
    } else if (ev.type === 'sales_pitch') {
      contentHtml += `<div class="text-center mb-4"><span class="text-4xl">📦</span>
        <p class="text-magic-gold font-bold mt-2">阿九推销一本书！</p>
        <p class="text-ink-light">《${ev.book.title}》${ev.book.emoji}</p>
        <p class="text-sm text-ink-light">${(ev.book.totalWords || ev.book.words || 0).toLocaleString()}字 · ${ev.book.category || ''}</p>
        <p class="text-magic-blue font-bold mt-1">售价：${ev.book.price.toLocaleString()} 代币</p></div>`;
    }
  }

  if (!contentHtml) {
    overlay.remove();
    if (callback) callback();
    return;
  }

  const card = el('div', 'parchment-bg rounded-2xl p-6 max-w-sm w-full text-center magic-glow animate-scale-in');
  card.innerHTML = contentHtml;

  const btnRow = el('div', 'flex justify-center gap-3 mt-4');

  if (result.event && result.event.type === 'sales_pitch') {
    const buyBtn = el('button', 'px-6 py-2 bg-magic-gold text-white rounded-lg font-bold hover:shadow-lg transition-all');
    buyBtn.textContent = `购买 💰${result.event.book.price.toLocaleString()}`;
    buyBtn.addEventListener('click', () => {
      if (actions.buySalesBook) {
        actions.buySalesBook(result.event.book);
      }
      overlay.remove();
      if (callback) callback();
    });
    const cancelBtn = el('button', 'px-4 py-2 bg-wood/20 text-ink-light rounded-lg');
    cancelBtn.textContent = '不买了';
    cancelBtn.addEventListener('click', () => {
      overlay.remove();
      if (callback) callback();
    });
    btnRow.appendChild(buyBtn);
    btnRow.appendChild(cancelBtn);
  } else {
    const okBtn = el('button', 'px-6 py-3 bg-magic-gold text-white rounded-lg font-bold');
    okBtn.textContent = '知道了';
    okBtn.addEventListener('click', () => {
      overlay.remove();
      if (callback) callback();
    });
    btnRow.appendChild(okBtn);
  }

  card.appendChild(btnRow);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      if (callback) callback();
    }
  });
}
