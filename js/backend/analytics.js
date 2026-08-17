// 行为事件上报：本地队列 + 批量上报 + 断网重试

import { getClient, isBackendReady } from './client.js';
import { getCurrentUser } from './auth.js';

const FLUSH_INTERVAL_MS = 5000;
const MAX_QUEUE_SIZE = 100;

let pendingEvents = [];
let flushTimer = null;

/**
 * 记录一个事件；若未登录或后端未就绪，则先进入本地队列等待上报
 */
export function track(eventType, eventData = {}) {
  if (!isBackendReady()) return;

  pendingEvents.push({
    type: eventType,
    data: eventData,
    ts: Date.now()
  });

  if (pendingEvents.length > MAX_QUEUE_SIZE) {
    pendingEvents.shift();
  }

  scheduleFlush();
}

export function getPendingEventCount() {
  return pendingEvents.length;
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(flushEvents, FLUSH_INTERVAL_MS);
}

async function flushEvents() {
  flushTimer = null;
  if (!isBackendReady() || pendingEvents.length === 0) return;

  const user = getCurrentUser();
  if (!user) {
    // 尚未登录（如匿名登录还在进行），稍后再试
    scheduleFlush();
    return;
  }

  const client = getClient();
  const batch = pendingEvents.splice(0);
  const rows = batch.map(evt => ({
    user_id: user.id,
    event_type: evt.type,
    event_data: evt.data
  }));

  try {
    const { error } = await client.from('events').insert(rows);
    if (error) throw error;
  } catch (err) {
    console.warn('[backend] event flush failed, requeueing', err);
    pendingEvents = batch.concat(pendingEvents).slice(-MAX_QUEUE_SIZE);
    scheduleFlush();
  }
}
