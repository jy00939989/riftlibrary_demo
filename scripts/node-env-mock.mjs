// Node 测试环境浏览器桩（side-effect 模块，须作为第一个 import 引入）
// 用法：import './node-env-mock.mjs'; 必须放在其他 import 之前——ESM 按 import 顺序求值，
// 本模块先把 window/document 装好，后续被导入的渲染模块顶层的 window.xxx 赋值才不会炸。
// 2026-10-25 抽出：test-copy-remaining 因 progress-bar 链接入 render/bookshelf 顶层 window 赋值而崩。

function elStub() {
  return {
    style: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    addEventListener() {}, appendChild() {}, remove() {},
    querySelector: () => elStub(), querySelectorAll: () => [],
    innerHTML: '', textContent: '', dataset: {}
  };
}

if (typeof globalThis.window === 'undefined') {
  globalThis.window = globalThis;
  globalThis.document = {
    getElementById: () => elStub(),
    querySelector: () => elStub(),
    querySelectorAll: () => [],
    addEventListener() {},
    body: elStub(),
    documentElement: elStub(),
    createElement: () => elStub()
  };
  globalThis.Audio = class Audio {
    play() { return Promise.resolve(); }
    pause() {}
    addEventListener() {}
  };
}
