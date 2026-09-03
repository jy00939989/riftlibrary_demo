// Visitor transaction handlers
import { state, saveState } from '../state.js';
import { collectReturn } from '../visitors.js';
import { playSfx } from '../audio.js';
import { updateStatusBar } from '../render/index.js';
import { updateVisitorBadge } from '../render/navigation.js';
import { checkAchievements, showAchievementBatch } from '../achievements.js';
import { markTaskDone, addHistory } from '../storage.js';
import { track } from '../backend/index.js';

function getNow() {
  return window.__dev && window.__dev.getNow ? window.__dev.getNow() : Date.now();
}

export function handleCollectReturn(visitorId) {
  const result = collectReturn(visitorId);
  if (result) {
    playSfx('book_return');
    const hour = new Date(getNow()).getHours();
    track('visitor_return', { visitor_id: visitorId, hour });
    const achResults = [];
    achResults.push(...checkAchievements('visitor_return', { hour }));
    achResults.push(...checkAchievements('visitor'));
    showAchievementBatch(achResults);
    updateStatusBar();
    updateVisitorBadge();
    const taskResult = markTaskDone('return', state);
    if (taskResult) {
      addHistory('task', `📜 今日馆务：${taskResult.name}`, taskResult.reward);
    }
    saveState();
  }
  return result;
}
