// 渲染工具函数
import { state } from '../state.js';
import { BOOKS } from '../../data/books.js';

// 由 app.js 在初始化时注入
export let actions = {};
export function setActions(a) { actions = a; }

export function el(tag, classes = '', attrs = {}, children = []) {
  const e = document.createElement(tag);
  if (classes) e.className = classes;
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v;
    else e.setAttribute(k, v);
  }
  for (const child of children) {
    if (typeof child === 'string') e.appendChild(document.createTextNode(child));
    else if (child) e.appendChild(child);
  }
  return e;
}

export function h(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.firstElementChild;
}

export function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function updateTimerDisplay(timeStr, words) {
  const display = document.querySelector('#page-focus .text-6xl');
  if (display) display.textContent = timeStr;
  const wordEl = document.querySelector('#page-focus .text-sm.text-ink-light.mt-1');
  if (wordEl) wordEl.textContent = `已誊抄 ${words.toLocaleString()} 字`;
  // 活跃模式下的迷你计时器和字数
  const miniTimer = document.getElementById('focus-mini-timer');
  if (miniTimer) miniTimer.textContent = timeStr;
  const activeWords = document.getElementById('focus-active-words');
  if (activeWords) activeWords.textContent = words.toLocaleString();
}
