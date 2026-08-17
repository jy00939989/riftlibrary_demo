// 云端存档同步：debounce 上传 + 下载恢复 + 同步状态暴露

import { getClient, isBackendReady } from './client.js';
import { getCurrentUser } from './auth.js';
import { track } from './analytics.js';

const SYNC_DEBOUNCE_MS = 3000;

let syncStatus = 'idle'; // idle | pending | syncing | error
let syncError = null;
let debounceTimer = null;

export function getSyncStatus() {
  return { status: syncStatus, error: syncError };
}

/**
 * 在 saveState() 单一出口调用；会自动 debounce，避免每次小改动都请求网络
 */
export function debouncedUploadSave(statePayload) {
  if (!isBackendReady() || !getCurrentUser()) return;

  syncStatus = 'pending';
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    uploadSave(statePayload);
  }, SYNC_DEBOUNCE_MS);
}

async function uploadSave(statePayload) {
  const client = getClient();
  const user = getCurrentUser();
  if (!client || !user) return;

  syncStatus = 'syncing';
  syncError = null;

  try {
    const { error } = await client
      .from('saves')
      .upsert(
        {
          user_id: user.id,
          save_data: statePayload,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      );

    if (error) throw error;
    syncStatus = 'idle';
  } catch (err) {
    syncStatus = 'error';
    syncError = err?.message || 'upload_failed';
    console.warn('[backend] save upload failed', err);
    track('sync_error', { error: syncError });
  }
}

/**
 * 登录成功后拉取云端存档
 * @returns {object|null} 云端 save_data 或 null
 */
export async function downloadSave() {
  if (!isBackendReady() || !getCurrentUser()) return null;
  const client = getClient();
  const user = getCurrentUser();

  try {
    const { data, error } = await client
      .from('saves')
      .select('save_data, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data?.save_data || null;
  } catch (err) {
    console.warn('[backend] save download failed', err);
    return null;
  }
}
