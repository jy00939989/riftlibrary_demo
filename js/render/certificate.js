// 典藏证书 —— 书籍完成时的仪式感分享卡片
import { state } from '../state.js';
import { el } from './common.js';
import { markTutorialSeen } from '../tutorial.js';

function getRandomQuote(book) {
  if (book && book.quotes) {
    const keys = Object.keys(book.quotes);
    if (keys.length > 0) {
      return book.quotes[keys[Math.floor(Math.random() * keys.length)]];
    }
  }
  return '每一页抄写都是对知识的致敬。';
}

export function showCertificate(book, callback) {
  const bs = state.books[book.id];
  const masteryNames = ['', '初识', '熟悉', '精通', '大师', '传承'];
  const masteryName = masteryNames[bs.masteryLevel] || '初识';
  const quote = getRandomQuote(book);

  const overlay = el('div', 'fixed inset-0 bg-black/70 z-[120] flex items-center justify-center p-4');
  overlay.style.transition = 'opacity 0.3s';

  const cert = el('div', 'certificate-card parchment-bg rounded-2xl p-8 max-w-md w-full text-center magic-glow animate-scale-in relative overflow-hidden');
  cert.id = 'certificate-' + Date.now();
  const certMsg = book.certMessage || '每一页抄写都是对知识的致敬。';

  cert.innerHTML = `
    <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-magic-gold to-transparent"></div>
    <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-magic-gold to-transparent"></div>

    <div class="text-xs text-magic-gold font-bold tracking-widest mb-2 uppercase">典藏证书</div>
    <div class="text-3xl mb-2">🎉</div>
    <h2 class="font-display text-xl font-bold mb-1">${book.title} · 誊抄完成</h2>
    <p class="text-magic-blue italic text-sm leading-relaxed mb-4 px-2">「${certMsg}」</p>
    <div class="text-5xl mb-4">${book.emoji}</div>
    <p class="text-ink-light text-sm mb-5">${book.author} · ${book.category}</p>

    <div class="grid grid-cols-3 gap-3 mb-5">
      <div class="bg-white/60 rounded-lg p-3">
        <div class="text-lg font-bold text-magic-blue">${book.totalWords.toLocaleString()}</div>
        <div class="text-xs text-ink-light">总字数</div>
      </div>
      <div class="bg-white/60 rounded-lg p-3">
        <div class="text-lg font-bold text-magic-blue">${bs.copyCount}</div>
        <div class="text-xs text-ink-light">誊抄次数</div>
      </div>
      <div class="bg-white/60 rounded-lg p-3">
        <div class="text-lg font-bold text-magic-gold">${masteryName}</div>
        <div class="text-xs text-ink-light">典藏等级</div>
      </div>
    </div>

    <blockquote class="border-l-4 border-magic-gold pl-4 py-2 my-4 text-ink-light italic text-sm text-left">
      「${quote}」
      <div class="text-xs text-ink-light mt-1 not-italic">——《${book.title}》</div>
    </blockquote>

    <div class="text-xs text-ink-light/50 mt-5 mb-2">${state.library.name} · 第${bs.copyCount}次誊抄完成</div>

    <div class="flex gap-3 justify-center mt-4">
      <button id="cert-save-btn" class="px-5 py-2 bg-wood/20 text-ink rounded-lg font-bold text-sm hover:bg-wood/30 transition-all">📋 保存分享图</button>
      <button id="cert-next-btn" class="px-5 py-2 bg-magic-gold text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all">继续 →</button>
    </div>
  `;

  overlay.appendChild(cert);

  const dismiss = (cb) => {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      if (cb) cb();
    }, 300);
  };

  cert.querySelector('#cert-next-btn').addEventListener('click', () => {
    dismiss(() => {
      markTutorialSeen('book_complete');
      if (callback) callback();
    });
  });

  cert.querySelector('#cert-save-btn').addEventListener('click', () => {
    saveCertificateImage(cert, book.title);
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) cert.querySelector('#cert-next-btn').click();
  });

  document.body.appendChild(overlay);
}

function saveCertificateImage(element, bookTitle) {
  if (typeof html2canvas !== 'undefined') {
    html2canvas(element, { backgroundColor: '#f5e6c8', scale: 2 }).then(canvas => {
      const link = document.createElement('a');
      link.download = `典藏证书_${bookTitle}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }).catch(() => {
      fallbackCopyText(bookTitle);
    });
  } else {
    fallbackCopyText(bookTitle);
  }
}

function fallbackCopyText(bookTitle) {
  const text = `📚 我在「异世界图书馆」完成了《${bookTitle}》的誊抄！`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      alert('分享文字已复制到剪贴板 📋');
    });
  } else {
    prompt('复制这段文字分享吧：', text);
  }
}
