// 状态序列化策略

import { state } from './state.js';
import { save, STORAGE_KEYS } from '../persistence.js';
import { debouncedUploadSave } from '../backend/sync.js';

export function saveState() {
  // 不保存正在进行的会话
  const toSave = { ...state };
  toSave.currentSession = {
    active: false,
    mode: 'pomodoro',
    bookId: null,
    targetMinutes: 25,
    elapsedSeconds: 0,
    fractionalSeconds: 0,
    paused: false,
    intervalId: null,
    quoteIndex: 0,
    lastQuoteMinute: 0,
    startTime: 0,
    lastTickTime: 0,
    speedMultiplier: 1
  };
  // locale 已迁移到 settings，不再写入主存档
  delete toSave.locale;
  const ok = save(STORAGE_KEYS.STATE, toSave);
  if (ok) {
    debouncedUploadSave(toSave);
  }
  return ok;
}
