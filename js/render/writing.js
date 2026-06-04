// 缮写动画引擎 —— 左→右→翻页 + canvas精确排版 + 羽笔先行
// 模块级单例

const BASE_SPEED = 150;  // ms/字
const PEN_DELAY = 40;    // 羽笔到位后延迟出字

let currentAnim = null;

export function startWriting(container, book, options) {
  stopWriting();
  currentAnim = new WritingAnim(container, book, options);
  currentAnim.start(options);
  return currentAnim;
}
export function pauseWriting() { if (currentAnim) currentAnim.pause(); }
export function resumeWriting() { if (currentAnim) currentAnim.resume(); }
export function stopWriting() { if (currentAnim) { currentAnim.destroy(); currentAnim = null; } }
export function isWriting() { return currentAnim !== null && currentAnim.running; }

// ========== canvas 字宽测量 ==========

let _measureCtx = null;
function measureCharWidth(font) {
  try {
    if (!_measureCtx) {
      const c = document.createElement('canvas');
      _measureCtx = c.getContext('2d');
    }
    _measureCtx.font = font;
    return _measureCtx.measureText('字').width;
  } catch (e) {
    return 0;
  }
}

// ========== 动画类 ==========

class WritingAnim {
  constructor(container, book, options = {}) {
    this.container = container;
    this.book = book;
    this.speed = options.speed || BASE_SPEED;
    this.running = false;
    this.paused = false;
    this.flipping = false;
    this.pageNumber = 1;

    // 动态排版
    this.charsPerLine = 22;
    this.linesPerPage = 11;

    // 书写状态
    this.allLines = [];
    this.charIndex = 0;
    this.lineIndex = 0;
    this.leftLines = [];   // 左页已完成行
    this.rightLines = [];  // 右页已完成行
    this.writingSide = 'left'; // 'left' | 'right'
    this.currentLineEl = null;
    this.singlePage = false;   // 手机单页模式

    // 书源
    this.chapters = this.book.chapters || [];
    this.quotes = this.book.quotes ? Object.values(this.book.quotes) : [];
    this.chapterIdx = 0;
    this.showingQuote = false;

    // DOM
    this.sceneEl = null;
    this.quillEl = null;
    this.areaRight = null;
    this.areaLeft = null;
    this.pageLeft = null;
    this.pageRight = null;
    this.statusEl = null;

    this._onResize = () => this.recalcLayout();
  }

  // ========== 生命周期 ==========

  start(opts = {}) {
    this.buildDOM();
    this.recalcLayout();

    // 根据 copiedWords 定位当前章节
    const copiedWords = opts.copiedWords || 0;
    let startIdx = 0;
    for (let i = this.chapters.length - 1; i >= 0; i--) {
      if (copiedWords >= (this.chapters[i].unlockAt || 0)) {
        startIdx = i;
        break;
      }
    }
    this.loadChapter(startIdx);
    this.running = true;
    window.addEventListener('resize', this._onResize);
    this.updateStatus(`🖋️ 缮写中… 第${this.pageNumber}页`);
    this.scheduleTick();
  }

  pause() {
    this.paused = true;
    if (this.timerId) { clearTimeout(this.timerId); this.timerId = null; }
    this.updateStatus('⏸️ 已暂停');
  }

  resume() {
    this.paused = false;
    this.updateStatus(`🖋️ 缮写中… 第${this.pageNumber}页`);
    this.scheduleTick();
  }

  destroy() {
    this.running = false;
    if (this.timerId) { clearTimeout(this.timerId); this.timerId = null; }
    window.removeEventListener('resize', this._onResize);
    this.container.innerHTML = '';
  }

  // ========== DOM ==========

  buildDOM() {
    this.container.innerHTML = `
      <div class="writing-scene">
        <div class="writing-candle-glow"></div>
        <div class="writing-book">
          <div class="writing-page writing-page-left" id="writing-page-left">
            <div class="writing-area" id="writing-area-left"></div>
          </div>
          <div class="writing-spine"></div>
          <div class="writing-page writing-page-right" id="writing-page-right">
            <div class="writing-area" id="writing-area-right"></div>
          </div>
        </div>
        <div class="writing-quill-container" id="writing-quill" style="display:none;">
          <div class="writing-quill-inner">✒️</div>
        </div>
      </div>
    `;

    this.sceneEl = this.container.querySelector('.writing-scene');
    this.areaLeft = this.container.querySelector('#writing-area-left');
    this.areaRight = this.container.querySelector('#writing-area-right');
    this.pageLeft = this.container.querySelector('#writing-page-left');
    this.pageRight = this.container.querySelector('#writing-page-right');
    this.quillEl = this.container.querySelector('#writing-quill');
    this.statusEl = document.getElementById('writing-status-bar');
  }

  // ========== 动态排版 ==========

  recalcLayout() {
    this._checkSinglePage();

    // 单页模式强制用右页测量（左页 display:none 时 clientWidth=0）
    const area = this.singlePage ? this.areaRight : (this.areaRight || this.areaLeft);
    if (!area || area.clientWidth === 0) return;

    const style = getComputedStyle(area);
    const fontSize = parseFloat(style.fontSize) || 17;
    const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.9;
    const areaWidth = area.clientWidth;
    const areaHeight = area.clientHeight;

    if (areaWidth > 0) {
      const font = `${style.fontWeight || '400'} ${fontSize}px ${style.fontFamily || 'sans-serif'}`;
      const measured = measureCharWidth(font);
      const charW = measured > 0 ? measured : fontSize * 1.1; // 保守兜底
      this.charsPerLine = Math.max(8, Math.floor(areaWidth / charW) - 1);
    }
    if (areaHeight > 0 && lineHeight > 0) {
      this.linesPerPage = Math.max(4, Math.floor(areaHeight / lineHeight));
    }

    // 重新排版当前文本（如果正在书写中）
    if (this.allLines.length > 0 && this.running) {
      const currentText = this.allLines.join('');
      this.allLines = this.typeset(currentText);
      this.lineIndex = Math.min(this.lineIndex, Math.max(0, this.allLines.length - 1));
      this.charIndex = Math.min(this.charIndex, (this.allLines[this.lineIndex] || '').length);
      if (this.currentLineEl) {
        this.currentLineEl.classList.remove('writing-current-line');
        this.currentLineEl = null;
      }
      this.rerenderBothPages();
    }
  }

  // 检测单页/双页模式切换（用 getComputedStyle 与 CSS 断点自动同步）
  _checkSinglePage() {
    if (!this.pageLeft) return;
    const wasSingle = this.singlePage;
    this.singlePage = getComputedStyle(this.pageLeft).display === 'none';

    if (!wasSingle && this.singlePage) {
      // 双页→单页：左页已有行合并到右页，防止内容丢失
      if (this.leftLines.length > 0) {
        this.rightLines = [...this.leftLines, ...this.rightLines];
        this.leftLines = [];
      }
      // 确保 writingSide 指向可见的右页
      if (this.writingSide === 'left') {
        this.writingSide = 'right';
      }
      // 当前行 DOM 将被重绘清除
      if (this.currentLineEl) {
        this.currentLineEl.classList.remove('writing-current-line');
        this.currentLineEl = null;
      }
      this.rerenderBothPages();
    }
  }

  typeset(text) {
    const lines = [];
    let remaining = text;
    while (remaining.length > 0) {
      lines.push(remaining.slice(0, this.charsPerLine));
      remaining = remaining.slice(this.charsPerLine);
    }
    return lines;
  }

  // ========== 文本源 ==========

  loadChapter(idx) {
    this.showingQuote = false;
    if (this.chapters.length === 0) { this.running = false; return; }
    const ch = this.chapters[idx % this.chapters.length];
    const raw = (ch.content || ch.preview || '').replace(/\n\s*/g, '');
    if (!raw) { this.loadChapter(idx + 1); return; }
    this.allLines = this.typeset(raw);
    this.lineIndex = 0;
    this.charIndex = 0;
  }

  loadQuote() {
    this.showingQuote = true;
    if (this.quotes.length === 0) { this.advanceChapter(); return; }
    const q = this.quotes[Math.floor(Math.random() * this.quotes.length)];
    this.allLines = this.typeset(`「${q}」 ——《${this.book.title}》`);
    this.lineIndex = 0;
    this.charIndex = 0;
  }

  advanceChapter() {
    this.chapterIdx++;
    if (this.chapterIdx >= this.chapters.length) this.chapterIdx = 0;
    this.loadChapter(this.chapterIdx);
  }

  // ========== 页面渲染 ==========

  getActiveArea() {
    // 单页模式下始终返回右页（左页被 CSS 隐藏）
    if (this.singlePage) return this.areaRight;
    return this.writingSide === 'left' ? this.areaLeft : this.areaRight;
  }

  getActiveLines() {
    return this.writingSide === 'left' ? this.leftLines : this.rightLines;
  }

  rerenderBothPages() {
    if (this.areaLeft) {
      this.areaLeft.innerHTML = '';
      this.renderPage(this.areaLeft, this.leftLines);
    }
    if (this.areaRight) {
      this.areaRight.innerHTML = '';
      this.renderPage(this.areaRight, this.rightLines);
    }
  }

  renderPage(areaEl, lines) {
    if (!areaEl) return;
    areaEl.innerHTML = lines.map(line => {
      const esc = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<div class="writing-written-line">${esc}</div>`;
    }).join('');
  }

  renderCurrentLine(areaEl, lineText) {
    const esc = lineText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const el = document.createElement('div');
    el.className = 'writing-written-line writing-current-line';
    areaEl.appendChild(el);
    return el;
  }

  appendChar(lineEl, ch) {
    const span = document.createElement('span');
    span.className = 'writing-char writing-fresh';
    span.textContent = ch;
    lineEl.appendChild(span);
    return span;
  }

  // ========== 羽笔 ==========

  // 笔移到行末（下一个字将出现的位置）
  moveQuillToWritePos(lineEl) {
    if (!this.quillEl || !this.sceneEl) return;
    const sr = this.sceneEl.getBoundingClientRect();
    const lr = lineEl.getBoundingClientRect();
    this.quillEl.style.display = 'block';
    this.quillEl.style.left = (lr.right - sr.left - 10) + 'px';
    this.quillEl.style.top = (lr.top - sr.top - 42) + 'px';
  }

  hideQuill() { if (this.quillEl) this.quillEl.style.display = 'none'; }

  // ========== 粒子 ==========

  spawnParticles(x, y) {
    if (!this.sceneEl) return;
    for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
      const p = document.createElement('div');
      p.className = 'writing-particle';
      p.style.cssText = `
        left:${x}px; top:${y}px;
        width:${2 + Math.random() * 2}px; height:${2 + Math.random() * 2}px;
        --dx:${(Math.random() - 0.5) * 20}px; --dy:${-(10 + Math.random() * 20)}px;
        animation-duration:${0.5 + Math.random() * 0.5}s;
      `;
      this.sceneEl.appendChild(p);
      setTimeout(() => p.remove(), 900);
    }
  }

  // ========== 翻页（左右皆满 → 空白跨页） ==========

  flipBothPages(callback) {
    this.flipping = true;
    this.updateStatus('📖 翻页中…');

    // 两页同时淡出
    if (this.pageLeft) this.pageLeft.classList.add('writing-fading');
    if (this.pageRight) this.pageRight.classList.add('writing-fading');

    setTimeout(() => {
      if (this.pageLeft) this.pageLeft.classList.remove('writing-fading');
      if (this.pageRight) this.pageRight.classList.remove('writing-fading');

      // 清空两页
      this.leftLines = [];
      this.rightLines = [];
      if (this.areaLeft) this.areaLeft.innerHTML = '';
      if (this.areaRight) this.areaRight.innerHTML = '';

      this.writingSide = this.singlePage ? 'right' : 'left';
      this.currentLineEl = null;
      this.pageNumber++;
      this.updateStatus(`🖋️ 缮写中… 第${this.pageNumber}页`);
      this.flipping = false;
      if (callback) callback();
    }, 400);
  }

  // ========== 核心循环 ==========

  ensureLineEl() {
    if (this.currentLineEl) return;
    const area = this.getActiveArea();
    this.currentLineEl = this.renderCurrentLine(area, '');
  }

  tick() {
    if (!this.running) return;
    if (this.paused || this.flipping) { this.scheduleTick(); return; }

    // 当前文本写完
    if (this.lineIndex >= this.allLines.length) {
      if (this.showingQuote) {
        this.advanceChapter();
      } else if (this.quotes.length > 0) {
        this.loadQuote();
      } else {
        this.advanceChapter();
      }
      this.updateStatus(`🖋️ 缮写中… 第${this.pageNumber}页`);
      this.scheduleTick();
      return;
    }

    this.ensureLineEl();

    const lineText = this.allLines[this.lineIndex] || '';

    // 当前行写完
    if (this.charIndex >= lineText.length) {
      if (this.currentLineEl) this.currentLineEl.classList.remove('writing-current-line');
      this.currentLineEl = null;

      // 行归档到对应页
      if (this.writingSide === 'left') {
        this.leftLines.push(lineText);
        if (this.leftLines.length >= this.linesPerPage) {
          // 左页满，切到右页
          this.writingSide = 'right';
        }
      } else {
        this.rightLines.push(lineText);
        if (this.rightLines.length >= this.linesPerPage) {
          // 右页也满 → 翻页
          this.flipBothPages(() => this.scheduleTick());
          this.charIndex = 0;
          this.lineIndex++;
          return;
        }
      }

      this.charIndex = 0;
      this.lineIndex++;
      this.scheduleTick();
      return;
    }

    // ---- 写出一个字 ----
    const ch = lineText[this.charIndex];

    // 羽笔先移到行末书写位（下一个字将出现的位置）
    this.moveQuillToWritePos(this.currentLineEl);

    // 短暂延迟后落笔出字
    if (this.timerId) clearTimeout(this.timerId);
    this.timerId = setTimeout(() => {
      if (!this.running) return;

      const span = this.appendChar(this.currentLineEl, ch);

      // 羽笔留在行末（不下坠到字中心，避免视觉跳动）
      // 下一个 tick 的 moveQuillToWritePos 会自然跟随行增长

      // 粒子
      if (Math.random() < 0.3 && this.sceneEl) {
        const sr = this.sceneEl.getBoundingClientRect();
        const spr = span.getBoundingClientRect();
        this.spawnParticles(spr.right - sr.left, spr.top - sr.top);
      }

      this.charIndex++;
      this.scheduleTick();
    }, PEN_DELAY);

    return;
  }

  scheduleTick() {
    if (!this.running) return;
    if (this.timerId) clearTimeout(this.timerId);
    this.timerId = setTimeout(() => this.tick(), this.speed);
  }

  updateStatus(text) {
    const el = document.getElementById('writing-status-bar') || this.statusEl;
    if (el) el.textContent = text;
  }
}
