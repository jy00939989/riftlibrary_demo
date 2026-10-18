// Supabase client 初始化
// 工程无构建工具，通过动态 import + importmap 加载 @supabase/supabase-js
// 若 CDN/SDK 加载失败或未配置，则静默降级为纯本地模式

import { SUPABASE_URL, SUPABASE_ANON_KEY, CLOUD_SYNC_ENABLED } from './config.js';

let client = null;
let ready = false;
let backendError = null;

const isValidHttpUrl = (u) => {
  try {
    const p = new URL(u).protocol;
    return p === 'http:' || p === 'https:';
  } catch {
    return false;
  }
};

const isConfigured = () => {
  return Boolean(
    CLOUD_SYNC_ENABLED &&
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('your-project') &&
    SUPABASE_ANON_KEY.length > 20
  );
};

async function init() {
  if (!isConfigured()) {
    backendError = 'Supabase not configured';
    return;
  }
  // 配置存在但 URL 非法时给出明确错误并降级（2026-10-17：占位符挡不住「带引号/缺协议」的值，
  // 那会直接抛给 createClient，变成玩家看不懂的红色报错）
  if (!isValidHttpUrl(SUPABASE_URL)) {
    backendError = `SUPABASE_URL 格式无效（必须是 http/https URL）：${SUPABASE_URL}`;
    console.warn('[backend] SUPABASE_URL 非法，已降级纯本地模式', SUPABASE_URL);
    return;
  }
  try {
    const mod = await import('@supabase/supabase-js');
    const { createClient } = mod;
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    ready = true;
  } catch (err) {
    backendError = err?.message || 'SDK load failed';
    console.warn('[backend] Supabase SDK 加载失败，已回退纯本地模式', err);
  }
}

await init();

export function isBackendReady() {
  return ready;
}

export function getClient() {
  return client;
}

export function getBackendError() {
  return backendError;
}
