// 后端兑换码调用封装

import { getClient, isBackendReady } from './client.js';
import { getCurrentUser } from './auth.js';
import { applyRedeemRewards } from '../core/redeem.js';

// 本地开发测试码：仅在 localhost / 127.0.0.1 生效，不调用后端，直接到账
const LOCAL_TEST_CODE = 'TEST-LOCAL-2026';
const LOCAL_TEST_REWARDS = {
  coins: 300,
  inspiration: 30,
  seeds: { starlight_fern: 2 },
  items: {
    brush_reed_pen: 2,
    brush_swan_quill: 2,
    brush_mithril_nib: 1,
    repair_scroll: 2,
    favor_note_targeted: 2,
    favor_note_random: 1
  },
  signboards: ['pioneer_ink']
};

function isLocalhost() {
  if (typeof window === 'undefined') return false;
  return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
}

/**
 * 调用后端 Edge Function 兑换礼包码
 * @param {string} code
 * @returns {Promise<{ok: boolean, error?: string, rewards?: object}>}
 */
export async function redeemCode(code) {
  const normalized = normalizeCode(code);

  // 本地测试模式：直接应用奖励，跳过网络请求
  if (isLocalhost() && normalized === normalizeCode(LOCAL_TEST_CODE)) {
    applyRedeemRewards(LOCAL_TEST_REWARDS, 'pioneer');
    return { ok: true, rewards: LOCAL_TEST_REWARDS };
  }

  const user = getCurrentUser();
  if (!user || user.is_anonymous) {
    return { ok: false, error: 'anonymous_user' };
  }

  if (!isBackendReady()) {
    return { ok: false, error: 'backend_not_ready' };
  }

  const client = getClient();
  if (!client) {
    return { ok: false, error: 'backend_not_ready' };
  }

  try {
    // 优先使用 supabase-js 的 functions.invoke
    const { data, error } = await client.functions.invoke('redeem-code', {
      body: { code: normalized }
    });

    if (error) {
      console.warn('[redeem-code] Edge Function error', error);
      return { ok: false, error: parseEdgeError(error) };
    }

    if (!data || !data.ok) {
      return { ok: false, error: data?.error || 'invalid_or_expired_code' };
    }

    // 应用奖励到本地 state
    applyRedeemRewards(data.rewards, data.code_type || guessCodeType(code), data.serial_numbers);

    return { ok: true, rewards: data.rewards };
  } catch (err) {
    console.error('[redeem-code] invoke failed', err);
    // 网络/服务端异常时返回通用错误，不暴露细节
    return { ok: false, error: 'invalid_or_expired_code' };
  }
}

function normalizeCode(code) {
  return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * 解析 Edge Function 返回的错误对象，尽量保留业务错误码。
 * supabase-js 的 FunctionsHttpError 通常把响应体放在 error.context 中。
 */
function parseEdgeError(error) {
  if (!error) return 'invalid_or_expired_code';

  const ctx = error.context;
  if (ctx && typeof ctx === 'object') {
    if (typeof ctx.error === 'string' && ctx.error) return ctx.error;
    if (typeof ctx.message === 'string' && ctx.message) {
      try {
        const parsed = JSON.parse(ctx.message);
        if (parsed && typeof parsed.error === 'string') return parsed.error;
      } catch {
        // 不是 JSON，继续降级匹配
      }
    }
  }

  // 降级：从 message 字符串中匹配已知错误
  const msg = String(error.message || '').toLowerCase();
  if (msg.includes('rate_limited')) return 'rate_limited';
  if (msg.includes('already_redeemed')) return 'already_redeemed';
  if (msg.includes('anonymous_user')) return 'anonymous_user';

  return 'invalid_or_expired_code';
}

function guessCodeType(code) {
  const prefix = String(code || '').toUpperCase().split('-')[0];
  if (prefix === 'PIONEER') return 'pioneer';
  if (prefix === 'OPENING') return 'opening';
  if (prefix === 'GIFT') return 'gift';
  return 'unknown';
}
