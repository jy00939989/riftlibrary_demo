// 状态模块统一入口 —— 薄 shim，向后兼容

export { state, DEFAULT_BOOKS } from './state/state.js';
export { initState, ensureAllBooksInManuscriptBox } from './state/migrations.js';
export { saveState } from './state/save.js';
