// 情境触发逻辑 —— 检测"首次遇到某事件"，不碰 DOM
import { state, saveState } from './state.js';
import { getAtmosphereLevel } from './storage.js';

const TRIGGERS = {
  focus_complete: {
    flag: 'firstFocusComplete',
    type: 'context-card'
  },
  visitor_arrive: {
    flag: 'firstVisitorArrive',
    type: 'context-card'
  },
  shop_open: {
    flag: 'firstShopOpen',
    type: 'context-card'
  },
  library_open: {
    flag: 'firstLibraryOpen',
    type: 'context-card'
  },
  book_complete: {
    flag: 'firstBookComplete',
    type: 'certificate'
  },
  restoration_unlock: {
    flag: 'firstRestorationUnlock',
    type: 'context-card'
  }
};

function getTrigger(event) {
  // 氛围阶段事件：atmosphere_stage_2/3/4/5
  if (event.startsWith('atmosphere_stage_')) {
    const stage = parseInt(event.split('_').pop());
    if (stage > (state.tutorialFlags.maxAtmoStageSeen || 1)) {
      return { type: 'atmosphere-popup', stage };
    }
    return null;
  }
  // 一般事件
  const cfg = TRIGGERS[event];
  if (!cfg) return null;
  if (state.tutorialFlags[cfg.flag]) return null;
  return { type: cfg.type };
}

export function checkAndShowTutorial(event, payload) {
  const trigger = getTrigger(event);
  if (!trigger) return null;
  return { ...trigger, event, payload };
}

export function markTutorialSeen(event) {
  if (event.startsWith('atmosphere_stage_')) {
    const stage = parseInt(event.split('_').pop());
    if (stage > (state.tutorialFlags.maxAtmoStageSeen || 1)) {
      state.tutorialFlags.maxAtmoStageSeen = stage;
    }
  } else {
    const cfg = TRIGGERS[event];
    if (cfg) {
      state.tutorialFlags[cfg.flag] = true;
    }
  }
  saveState();
}

export function getTutorialFlags() {
  return { ...state.tutorialFlags };
}

export function getTutorialAtmoSeenStage() {
  return state.tutorialFlags.maxAtmoStageSeen || 1;
}

/**
 * 标记第一位访客破败事件已完成。
 * Phase A：消除渲染层直接 state mutation。
 */
export function markFirstVisitorEventDone() {
  state.tutorialFlags.firstVisitorEventDone = true;
  saveState();
}
