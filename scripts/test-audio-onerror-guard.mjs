#!/usr/bin/env node
// 音频 onerror 守卫回归测试（无浏览器环境，mock localStorage/DOM/Audio）
// 锁死 2026-09-16 「点静音 BGM 还在播」根因修复（1eaf2dc）：
//   旧代码 BGM 元素 onerror 无条件 currentAudio=null；旧音频 src 置空（切歌淡出/静音收尾）
//   会异步触发 error，把正在播的新曲目清成无主音频（静音关不掉、重开叠播）。
//   修复后：只有出错元素确为当前轨时才清状态。
// 用法：node scripts/test-audio-onerror-guard.mjs

// ── 环境 mock（必须在动态 import 之前装好）──
const store = new Map();
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
  clear: () => store.clear(),
  key: i => [...store.keys()][i] ?? null,
  get length() { return store.size; },
};
globalThis.document = {
  body: { style: {} },
  documentElement: { style: {} },
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {},
};
globalThis.window = globalThis;

const audioInstances = [];
globalThis.Audio = class {
  constructor(src) {
    this.src = src;
    this.volume = 1;
    this.loop = false;
    this.currentTime = 0;
    this.paused = true;
    this.onerror = null;
    audioInstances.push(this);
  }
  play() { return Promise.resolve(); }
  pause() { this.paused = true; }
  addEventListener() {}
  removeEventListener() {}
  setAttribute() {}
};

const { state } = await import('../js/state.js');
const audio = await import('../js/audio.js');

let pass = 0, fail = 0;
function assert(cond, name) {
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.log(`  FAIL ${name}`); }
}

// 关静音状态下测（避免环境音等干扰）
if (!audio.isMusicOn()) audio.toggleMusic(); // 默认开；双保险

// ── S1：正常切歌，旧音频的异步 error 不得清掉新曲目 ──
audio.startBgm('spring');
const sp1 = audioInstances[audioInstances.length - 1];
assert(audio.getCurrentTrackId() === 'spring', 'S1a 首曲 spring 成为当前轨');

audio.startBgm('winter');
const w1 = audioInstances[audioInstances.length - 1];
assert(audio.getCurrentTrackId() === 'winter', 'S1b 切歌后 winter 成为当前轨');
assert(sp1 !== w1, 'S1c 切歌产生了新 Audio 实例');

// 模拟旧音频 src 置空后异步触发的 error（幽灵 BGM 根因现场）
sp1.onerror();
assert(audio.getCurrentTrackId() === 'winter', 'S1d 旧音频 error 不得清空当前轨（核心回归）');

const before = audioInstances.length;
audio.startBgm('winter'); // 当前轨仍是 winter 时应走「同曲不打断」分支，不新建实例
assert(audioInstances.length === before, 'S1e 同曲重入不新建实例（证明句柄未丢）');

// ── S2：当前轨自己出错才允许清状态 ──
w1.onerror();
assert(audio.getCurrentTrackId() === null, 'S2a 当前轨自身 error 正常清状态');

// ── S3：静音收尾 src 置空触发的 error 不得复活/错乱状态 ──
audio.startBgm('spring');
const sp2 = audioInstances[audioInstances.length - 1];
audio.toggleMusic(); // 静音：pause + src=''（浏览器里随后会异步触发 sp2 的 error）
assert(!audio.isMusicOn(), 'S3a 静音已落设置');
sp2.onerror();         // 模拟该异步 error
assert(audio.getCurrentTrackId() === null, 'S3b 收尾 error 后状态保持清空、无幽灵引用');
audio.toggleMusic();   // 恢复，让定时器/句柄归位
assert(audio.isMusicOn(), 'S3c 恢复开音正常');
audio.toggleMusic();   // 收尾静音，清掉 fadeTimer 便于进程退出

console.log(`\nonerror 守卫回归：${pass} 过 ${fail} 挂`);
process.exit(fail ? 1 : 0);
