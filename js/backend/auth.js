// 认证：匿名登录 + 邮箱/密码注册登录

import { getClient, isBackendReady } from './client.js';

let currentUser = null;
let authInitialized = false;

/**
 * 初始化认证状态：
 * 1. 监听 auth 状态变化
 * 2. 尝试恢复当前 session；无则自动匿名登录
 */
export async function initAuth() {
  if (!isBackendReady()) return;
  const client = getClient();

  client.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
  });

  const { data: { session }, error: sessionError } = await client.auth.getSession();
  if (sessionError) {
    console.warn('[backend] getSession failed', sessionError);
  }

  if (session?.user) {
    currentUser = session.user;
    authInitialized = true;
    return;
  }

  // 无 session 时自动匿名登录，让游客也能有 user_id 用于事件上报
  const { data, error } = await client.auth.signInAnonymously();
  if (error) {
    console.warn('[backend] anonymous sign-in failed', error);
    return;
  }
  currentUser = data.user;
  authInitialized = true;
}

export function getCurrentUser() {
  return currentUser;
}

export function isAuthInitialized() {
  return authInitialized;
}

/**
 * 注册 / 将匿名用户升级为邮箱用户
 * @param {string} email
 * @param {string} password
 * @param {string} [captchaToken] - hCaptcha / reCAPTCHA token
 */
export async function signUp(email, password, captchaToken) {
  if (!isBackendReady()) return { ok: false, error: 'backend_not_ready' };
  const client = getClient();

  const signUpOptions = captchaToken ? { captchaToken } : undefined;

  // 若当前是匿名用户，直接 updateUser 升级为邮箱账号，保留同一 user_id
  if (currentUser && currentUser.is_anonymous) {
    const { data, error } = await client.auth.updateUser({ email, password });
    if (error) return { ok: false, error: error.message };
    currentUser = data.user;
    return { ok: true, user: data.user };
  }

  const { data, error } = await client.auth.signUp({ email, password, options: signUpOptions });
  if (error) return { ok: false, error: error.message };
  if (data.user) currentUser = data.user;
  return { ok: true, user: data.user };
}

/**
 * 邮箱 + 密码登录
 */
export async function signIn(email, password) {
  if (!isBackendReady()) return { ok: false, error: 'backend_not_ready' };
  const client = getClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  if (data.user) currentUser = data.user;
  return { ok: true, user: data.user };
}

/**
 * 登出：清除当前 session 并重新匿名登录，保持事件上报能力
 */
export async function signOut() {
  if (!isBackendReady()) return { ok: true };
  const client = getClient();
  const { error } = await client.auth.signOut();
  if (error) return { ok: false, error: error.message };
  currentUser = null;
  await initAuth();
  return { ok: true };
}

/**
 * 重发邮箱验证邮件
 */
export async function resendVerification(email) {
  if (!isBackendReady()) return { ok: false, error: 'backend_not_ready' };
  const client = getClient();
  const { data, error } = await client.auth.resend({
    type: 'signup',
    email
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}
