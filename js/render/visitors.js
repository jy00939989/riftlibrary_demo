// 访客中心页面渲染
import { state } from '../state.js';
import { el, actions } from './common.js';
import { getBorrowLevelConfig, getVisitorCap, getVisitorDef } from '../visitors.js';

function timeLeft(dueTime) {
  const now = Date.now();
  const ms = dueTime - now;
  if (ms <= 0) return { text: '已到期', pct: 100 };
  const total = dueTime - (dueTime - ms); // elapsed
  const totalDuration = dueTime - (dueTime - ms) + ms; // full duration approximation
  // 从访客状态推断总借阅时长
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const text = h > 0 ? `${h}小时${m}分后` : `${m}分钟后`;
  return { text, pct: 0 }; // pct 在渲染时单独计算
}

function calcProgress(visitor) {
  if (!visitor.borrowTime || !visitor.dueTime) return 0;
  const total = visitor.dueTime - visitor.borrowTime;
  const elapsed = Date.now() - visitor.borrowTime;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

// 借阅区素材（Lv1~Lv7 各对应一张图，Lv0 不显示）
const READING_IMG_NAMES = [
  'library_reading_01_shell.jpg',    // Lv1 陋室
  'library_reading_02_tidy.jpg',     // Lv2 整洁
  'library_reading_03_open.jpg',     // Lv3 开放
  'library_reading_04_comfy.jpg',    // Lv4 舒适
  'library_reading_05_refined.jpg',  // Lv5 精致
  'library_reading_06_elegant.jpg',  // Lv6 优雅
  'library_reading_07_sanctum.jpg'   // Lv7 圣所
];
const READING_LV_NAMES = ['', '陋室', '整洁', '开放', '舒适', '精致', '优雅', '圣所'];

export function renderVisitorsPage() {
  const container = document.getElementById('page-visitors');
  if (!container) return;

  const browsing = state.visitors.filter(v => v.status === 'browsing');
  const borrowed = state.visitors.filter(v => v.status === 'borrowed');
  const due = state.visitors.filter(v => v.status === 'due');

  container.innerHTML = '';

  const blv = state.library.borrowLevel || 0;
  const bcfg = getBorrowLevelConfig();

  // 背景图（Lv1 起才显示）
  if (blv > 0) {
    container.style.backgroundImage = `linear-gradient(rgba(44,36,25,0.92), rgba(44,36,25,0.92)), url('visual/library_readingarea/${READING_IMG_NAMES[blv - 1]}')`;
    container.style.backgroundSize = 'cover';
    container.style.backgroundPosition = 'center';
    container.style.backgroundAttachment = 'fixed';
  }

  // 借阅区全景图 banner（建造后显示）
  if (blv > 0) {
    const banner = el('div', 'mb-6 rounded-xl overflow-hidden border-2 border-wood/30 shadow-lg');
    banner.innerHTML = `
      <img src="visual/library_readingarea/${READING_IMG_NAMES[blv - 1]}" alt="借阅区 · ${READING_LV_NAMES[blv]}" class="w-full h-48 object-cover">
      <div class="bg-ink/70 text-white text-center py-2 text-sm">
        📚 借阅区 · ${READING_LV_NAMES[blv]} · 容纳${bcfg.cap}人 · 还书+${bcfg.returnCoins}💰
      </div>
    `;
    container.appendChild(banner);
  }

  if (blv === 0) {
    const emptyCard = el('div', 'parchment-bg rounded-2xl p-6 magic-glow text-center py-12');
    emptyCard.innerHTML = `
      <div class="text-6xl mb-4">🏚️</div>
      <h2 class="font-display text-xl font-bold mb-3">这里还只是一片空荡荡的角落</h2>
      <p class="text-ink-light text-sm leading-relaxed mb-4 max-w-md mx-auto">
        阳光从高窗斜照进来，在石板地面上画出一方金色的池子。
        你想象着将来有一天，这里会摆上柔软的扶手椅，壁炉里的火焰轻轻跳动，
        访客们围坐在一起，低声交谈或安静阅读。
      </p>
      <p class="text-sm text-magic-blue mb-6">在那之前，你需要先建造一间借阅区。</p>
      <button class="build-borrow-btn px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">
        🔨 建造借阅区 · 💰500
      </button>
    `;
    container.appendChild(emptyCard);

    const buildBtn = emptyCard.querySelector('.build-borrow-btn');
    if (buildBtn) {
      buildBtn.addEventListener('click', () => {
        if (actions.upgradeBorrowLevel) actions.upgradeBorrowLevel();
      });
    }
    return;
  }

  const card = el('div', 'parchment-bg rounded-2xl p-6 magic-glow');
  card.innerHTML = `<h2 class="font-display text-xl font-bold mb-4">👥 访客中心</h2>`;

  // --- 在馆区 ---
  const section1 = el('div', 'mb-6');
  section1.innerHTML = `<h3 class="font-bold text-sm text-ink-light mb-2">🛋️ 在馆阅览（${browsing.length}/${getVisitorCap()}人）</h3>`;
  if (browsing.length === 0) {
    section1.appendChild(el('div', 'text-sm text-ink-light py-4 text-center border border-dashed border-wood/30 rounded-lg', { text: '暂无访客在馆，完成专注可吸引访客到来' }));
  } else {
    browsing.forEach(v => {
      const browseMoods = ['从书架上抽出一本书', '翻阅泛黄的书页', '驻足在某本书前', '低声念出几个句子', '踮脚够高处的书', '轻轻拂去书上的灰'];
      const mood = browseMoods[Math.floor(Math.random() * browseMoods.length)];
      const favorText = v.favorability ? `好感 ${v.favorability}` : '';
      const def = getVisitorDef(v.charId);
      const auraHtml = def?.aura
        ? `<div class="text-xs text-magic-gold mt-0.5">✨ ${def.aura.name}：${def.aura.desc}</div>`
        : '';
      const row = el('div', 'flex items-center gap-3 bg-white/60 rounded-lg p-3 mb-2');
      row.innerHTML = `<span class="text-2xl">${v.emoji}</span>
        <div class="flex-1">
          <span class="font-bold">${v.name}</span>
          <span class="text-xs text-ink-light ml-2">${v.title || ''}</span>
          ${auraHtml}
          <div class="text-sm text-magic-blue mt-0.5 browsing-mood animate-ellipsis">${mood}</div>
        </div>
        <div class="text-xs text-ink-light/60 text-right">
          ${favorText ? `<div>💛 ${favorText}</div>` : ''}
          <div class="text-magic-gold/50 text-[10px] mt-0.5">浏览中</div>
        </div>`;
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
      const pct = calcProgress(v);
      const tl = timeLeft(v.dueTime);
      const row = el('div', 'flex items-center gap-3 bg-white/60 rounded-lg p-3 mb-2');
      row.innerHTML = `<span class="text-2xl">${v.emoji}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <span class="font-bold text-sm">${v.name}</span>
            <span class="text-xs text-magic-blue">⏰ ${tl.text}</span>
          </div>
          <div class="text-xs text-ink-light truncate">《${v.bookTitle}》</div>
          <div class="mt-1.5 h-1.5 bg-wood/10 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-[2000ms] ${pct > 80 ? 'bg-magic-gold' : 'bg-magic-blue'}" style="width:${pct}%"></div>
          </div>
        </div>`;
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
      const row = el('div', 'flex items-center gap-3 bg-magic-gold/10 rounded-lg p-3 mb-2 border border-magic-gold/30 animate-pulse-glow');
      row.innerHTML = `<span class="text-2xl due-book-emoji">${v.emoji}</span>
        <div class="flex-1"><span class="font-bold">${v.name}</span><span class="text-sm text-ink-light ml-2">《${v.bookTitle}》</span></div>`;
      const btn = el('button', 'px-4 py-2 bg-magic-gold text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all');
      btn.textContent = '📥 收取';
      btn.addEventListener('click', () => {
        if (actions.collectReturn) {
          // 收取动画：emoji 飞升
          const emojiEl = row.querySelector('.due-book-emoji');
          if (emojiEl) {
            emojiEl.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.5s';
            emojiEl.style.transform = 'translateY(-30px) scale(1.5)';
            emojiEl.style.opacity = '0';
          }
          setTimeout(() => {
            const result = actions.collectReturn(v.id);
            if (result) {
              showVisitorEventModal(result, () => renderVisitorsPage());
            }
          }, 400);
        }
      });
      row.appendChild(btn);
      section3.appendChild(row);
    });
  }
  card.appendChild(section3);

  // 借阅区等级信息
  card.appendChild(el('div', 'text-xs text-ink-light mt-4 pt-4 border-t border-wood/20', {
    text: `借阅区 Lv.${blv} ${READING_LV_NAMES[blv]} · 在馆${bcfg.cap}人 · 还书+${bcfg.returnCoins}💰 +${bcfg.returnAtmo}氛围 · 好感+${bcfg.favorBonus}%`
  }));

  container.appendChild(card);
}

// ========== 访客还书反馈卡 ==========

export function showVisitorEventModal(result, callback) {
  if (!result) { if (callback) callback(); return; }

  const overlay = el('div', 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4');

  // 基础收益行
  let rewardsHtml = '';
  if (result.coins > 0 || result.atmosphere > 0) {
    rewardsHtml = '<div class="flex justify-center gap-3 mt-3 text-xs">';
    if (result.coins > 0) rewardsHtml += `<span class="bg-magic-gold/10 px-2 py-1 rounded-full">💰 +${result.coins}</span>`;
    if (result.atmosphere > 0) rewardsHtml += `<span class="bg-magic-blue/10 px-2 py-1 rounded-full">✨ +${result.atmosphere}氛围</span>`;
    if (result.favor > 0) rewardsHtml += `<span class="bg-wood/10 px-2 py-1 rounded-full">💛 +${result.favor}好感</span>`;
    rewardsHtml += '</div>';
  }

  // 语录区
  const quoteHtml = result.quote ? `<p class="text-ink-light italic leading-relaxed mt-3 text-sm">「${result.quote}」</p>` : '';

  // 基础卡内容
  let contentHtml = `
    <div class="text-4xl mb-2">${result.visitorEmoji || '👤'}</div>
    <div class="font-bold text-ink">${result.visitorName || '访客'} 归还了《${result.bookTitle || '书'}》</div>
    ${quoteHtml}
    ${rewardsHtml}
  `;

  // 损坏提示
  if (result.damaged) {
    contentHtml += `<div class="mt-3 p-2 bg-red-50 rounded-lg text-xs text-red-700">
      ⚠️ 《${result.bookTitle}》在归还时发现轻微损毁，需要重新修复部分内容。
    </div>`;
  }

  // 事件（叠加在基础上）
  if (result.event) {
    const ev = result.event;
    if (ev.type === 'gift_book') {
      contentHtml += `<div class="mt-3 p-3 bg-magic-gold/10 rounded-lg">
        <div class="text-2xl">${ev.emoji}</div>
        <div class="text-magic-gold font-bold text-sm">沈明远赠送了一本旧书！</div>
        <div class="text-ink-light text-sm"><span class="italic">${ev.mysteryTitle}</span></div>
      </div>`;
    } else if (ev.type === 'annotation') {
      contentHtml += `<div class="mt-3 p-2 bg-wood/10 rounded-lg text-xs text-ink-light">📝 沈明远在书中留下了批注卡片，字迹工整，引经据典。</div>`;
    } else if (ev.type === 'treasure_map') {
      contentHtml += `<div class="mt-3 p-2 bg-magic-gold/10 rounded-lg text-xs">🗺️ 小萤发现了一张藏宝图！翻开获得：<b>${ev.reward.text}</b></div>`;
    } else if (ev.type === 'poem') {
      contentHtml += `<div class="mt-3 p-2 bg-wood/10 rounded-lg text-xs text-ink-light italic">🎵 "${ev.poem}"</div>`;
    } else if (ev.type === 'sales_pitch') {
      contentHtml += `<div class="mt-3 p-3 bg-magic-gold/10 rounded-lg">
        <div class="text-magic-gold font-bold text-sm">📦 阿九推销一本书！</div>
        <div class="text-ink-light text-sm">《${ev.book.title}》${ev.book.emoji}</div>
        <div class="text-magic-blue font-bold text-xs mt-1">售价：${ev.book.price.toLocaleString()} 💰</div>
      </div>`;
    }
  }

  // 叙事事件（三层递进：常层便签 → 偶层故事 → 稀层深度 → 终局）
  if (result.narrative) {
    const nar = result.narrative;
    // 常层：铅笔信/便签（每次还书都有）
    if (nar.common) {
      contentHtml += `<div class="mt-3 p-3 bg-wood/5 rounded-lg border border-wood/10 text-left">
        <div class="text-xs text-ink-light mb-1">📝 ${result.visitorName}在书里夹了一张便签：</div>
        <p class="text-sm text-ink leading-relaxed italic">"${nar.common.text}"</p>
      </div>`;
    }
    // 偶层：野花标本/特别礼物
    if (nar.occasional) {
      contentHtml += `<div class="mt-3 p-3 bg-magic-gold/10 rounded-lg border border-magic-gold/20 text-left animate-scale-in">
        <div class="text-xs text-magic-gold font-bold mb-1">🌸 ${nar.occasional.title}</div>
        <p class="text-sm text-ink leading-relaxed">${nar.occasional.text}</p>
      </div>`;
    }
    // 稀层：深层叙事 + 信件
    if (nar.rare) {
      contentHtml += `<div class="mt-3 p-4 bg-magic-blue/10 rounded-lg border-2 border-magic-blue/30 text-left animate-scale-in">
        <div class="text-base text-magic-blue font-bold mb-2">✨ ${nar.rare.title}</div>
        <p class="text-sm text-ink leading-relaxed whitespace-pre-line">${nar.rare.text}</p>
        ${nar.rare.letter ? `<div class="mt-3 p-3 bg-white/60 rounded-lg border border-wood/20">
          <div class="text-xs text-ink-light font-bold mb-1">📨 ${nar.rare.letter.title}</div>
          <p class="text-xs text-ink leading-relaxed whitespace-pre-line italic">${nar.rare.letter.text}</p>
        </div>` : ''}
        ${nar.rare.permanentEffect?.message ? `<div class="mt-2 text-xs text-magic-blue font-bold">🎁 ${nar.rare.permanentEffect.message}</div>` : ''}
      </div>`;
    }
    // 稀层后终局
    if (nar.postRare) {
      contentHtml += `<div class="mt-3 p-4 bg-magic-gold/10 rounded-lg border-2 border-magic-gold/30 text-left animate-scale-in">
        <div class="text-base text-magic-gold font-bold mb-2">🎉 ${nar.postRare.title}</div>
        <p class="text-sm text-ink leading-relaxed whitespace-pre-line">${nar.postRare.text}</p>
      </div>`;
    }
    // 终局后常层（终局完成后的新日常事件）
    if (nar.postRareCommon) {
      contentHtml += `<div class="mt-3 p-3 bg-wood/5 rounded-lg border border-wood/10 text-left">
        <div class="text-xs text-ink-light mb-1">📝 ${result.visitorName} 的消息：</div>
        <p class="text-sm text-ink leading-relaxed italic">"${nar.postRareCommon.text}"</p>
      </div>`;
    }
    // 终局后偶层（终局完成后的深度事件）
    if (nar.postRareOccasional) {
      contentHtml += `<div class="mt-3 p-4 bg-magic-blue/10 rounded-lg border border-magic-blue/20 text-left animate-scale-in">
        <div class="text-sm text-magic-blue font-bold mb-2">🌟 ${nar.postRareOccasional.title}</div>
        <p class="text-sm text-ink leading-relaxed whitespace-pre-line">${nar.postRareOccasional.text}</p>
      </div>`;
    }
  }

  const card = el('div', 'parchment-bg rounded-2xl p-6 max-w-sm w-full text-center magic-glow animate-scale-in');
  card.innerHTML = contentHtml;

  // 按钮区
  const btnRow = el('div', 'flex justify-center gap-3 mt-4');
  if (result.event && result.event.type === 'sales_pitch') {
    const buyBtn = el('button', 'px-6 py-2 bg-magic-gold text-white rounded-lg font-bold hover:shadow-lg transition-all');
    buyBtn.textContent = `购买 💰${result.event.book.price.toLocaleString()}`;
    buyBtn.addEventListener('click', () => {
      if (actions.buySalesBook) actions.buySalesBook(result.event.book);
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
