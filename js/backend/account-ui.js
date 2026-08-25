// 账号 / 云端同步 UI 面板

import {
  isBackendReady, getBackendError, getCurrentUser,
  signUp, signIn, signOut, resendVerification,
  resetPassword, updatePassword,
  getSyncStatus, getPendingEventCount, downloadSave
} from './index.js';
import { t } from '../i18n/terms.js';
import { saveState } from '../state.js';
import { HCAPTCHA_SITE_KEY } from './config.js';

import { save, STORAGE_KEYS } from '../persistence.js';

function isValidPassword(password) {
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
}

// ========== hCaptcha 人机验证 ==========

let hcaptchaToken = null;
let hcaptchaWidgetId = null;
let hcaptchaLoaded = false;
let hcaptchaLoading = false;

// 注册按钮冷却：防止连续点击触发 Supabase 邮件频率限制
const SIGNUP_COOLDOWN_MS = 60000;
const SIGNUP_COOLDOWN_KEY = 'riftlib_signup_cooldown';
let signupCooldownTimer = null;

function getSignupCooldownRemaining() {
  const last = parseInt(localStorage.getItem(SIGNUP_COOLDOWN_KEY) || '0', 10);
  if (!last) return 0;
  return Math.max(0, last + SIGNUP_COOLDOWN_MS - Date.now());
}

function setSignupCooldown() {
  localStorage.setItem(SIGNUP_COOLDOWN_KEY, String(Date.now()));
}

function clearSignupCooldownTimer() {
  if (signupCooldownTimer) {
    clearInterval(signupCooldownTimer);
    signupCooldownTimer = null;
  }
}

function formatSignupCooldownText(ms) {
  const seconds = Math.ceil(ms / 1000);
  return `${seconds} 秒后可重试`;
}

function updateSignupButtonState(button) {
  const remaining = getSignupCooldownRemaining();
  if (remaining > 0) {
    button.disabled = true;
    button.classList.add('opacity-60', 'cursor-not-allowed');
    button.textContent = formatSignupCooldownText(remaining);
    return remaining;
  }
  button.disabled = false;
  button.classList.remove('opacity-60', 'cursor-not-allowed');
  button.textContent = t('accountSignUp');
  return 0;
}

function loadHCaptcha() {
  if (window.hcaptcha) return Promise.resolve();
  if (hcaptchaLoading) return new Promise((resolve, reject) => {
    const check = () => {
      if (window.hcaptcha) return resolve();
      if (!hcaptchaLoading) return reject(new Error('hCaptcha load failed'));
      setTimeout(check, 50);
    };
    check();
  });
  hcaptchaLoading = true;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      hcaptchaLoaded = true;
      hcaptchaLoading = false;
      resolve();
    };
    script.onerror = () => {
      hcaptchaLoading = false;
      reject(new Error('hCaptcha script load failed'));
    };
    document.head.appendChild(script);
  });
}

function renderHCaptcha(containerId) {
  if (!window.hcaptcha || !HCAPTCHA_SITE_KEY) return;
  const container = document.getElementById(containerId);
  if (!container) return;
  if (hcaptchaWidgetId !== null) {
    window.hcaptcha.reset(hcaptchaWidgetId);
    hcaptchaToken = null;
    return;
  }
  hcaptchaWidgetId = window.hcaptcha.render(container, {
    sitekey: HCAPTCHA_SITE_KEY,
    callback: (token) => { hcaptchaToken = token; },
    'expired-callback': () => { hcaptchaToken = null; },
    'error-callback': () => { hcaptchaToken = null; }
  });
}

function resetHCaptcha() {
  hcaptchaToken = null;
  if (hcaptchaWidgetId !== null && window.hcaptcha) {
    window.hcaptcha.reset(hcaptchaWidgetId);
  }
}

function formatSyncStatus() {
  const { status, error } = getSyncStatus();
  if (status === 'error') return t('accountSyncStatusError').replace('{error}', error || '?');
  if (status === 'syncing') return t('accountSyncStatusSyncing');
  if (status === 'pending') return t('accountSyncStatusSyncing');
  return t('accountSyncStatusIdle');
}

export function showAccountPanel() {
  const existing = document.getElementById('account-panel-modal');
  if (existing) { existing.remove(); return; }

  const configured = isBackendReady();
  const user = getCurrentUser();
  const isAnonymous = !user || user.is_anonymous;
  const email = user?.email || '';

  const overlay = document.createElement('div');
  overlay.id = 'account-panel-modal';
  overlay.className = 'fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-2xl p-6 max-w-sm w-full magic-glow animate-scale-in">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-display text-lg font-bold">${t('accountCloudSyncTitle')}</h3>
        <button id="account-close" class="text-ink-light/50 hover:text-ink text-xl leading-none">&times;</button>
      </div>

      ${!configured ? `
        <div class="text-xs text-ink-light bg-wood/10 p-3 rounded-lg mb-4">
          ${t('accountNotConfigured')}<br/>
          <span class="text-red-500">${getBackendError() || 'SUPABASE_URL / SUPABASE_ANON_KEY not set'}</span>
        </div>
      ` : ''}

      <div class="text-sm mb-4">
        ${isAnonymous
          ? `<span class="text-ink-light">${t('accountLoggedInAs').replace('{email}', t('accountAnonymousUser'))}</span>
             <div class="text-xs text-ink-light/60 mt-1">${formatSyncStatus()} · ${t('accountPendingEvents').replace('{n}', getPendingEventCount())}</div>`
          : `<span class="text-magic-blue font-bold">${t('accountLoggedInAs').replace('{email}', email)}</span>
             <div class="text-xs text-ink-light/60 mt-1">${formatSyncStatus()} · ${t('accountPendingEvents').replace('{n}', getPendingEventCount())}</div>`
        }
      </div>

      ${configured ? `
        <div class="space-y-3">
          ${isAnonymous ? `
            <div class="space-y-2">
              <label class="text-xs text-ink-light block">${t('accountEmailLabel')}</label>
              <input id="account-email" type="email" class="w-full px-3 py-2 border border-wood/30 rounded-lg text-sm" placeholder="email@example.com" />
              <label class="text-xs text-ink-light block">${t('accountPasswordLabel')}</label>
              <input id="account-password" type="password" class="w-full px-3 py-2 border border-wood/30 rounded-lg text-sm" placeholder="••••••••" />
              <button id="account-forgot" type="button" class="text-xs text-magic-blue hover:underline text-left">${t('accountForgotPassword')}</button>
              <p class="text-[10px] text-ink-light/60">${t('accountPasswordRequirement')}</p>
              ${HCAPTCHA_SITE_KEY ? `
                <div id="account-hcaptcha" class="flex justify-center min-h-[78px]"></div>
              ` : ''}
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button id="account-signup" class="px-4 py-2 bg-magic-gold text-white rounded-lg font-bold text-sm hover:shadow transition-all">${t('accountSignUp')}</button>
              <button id="account-signin" class="px-4 py-2 bg-magic-blue text-white rounded-lg font-bold text-sm hover:shadow transition-all">${t('accountSignIn')}</button>
            </div>
          ` : `
            <button id="account-download" class="w-full px-4 py-2 bg-magic-blue text-white rounded-lg font-bold text-sm hover:shadow transition-all">${t('accountDownloadSave')}</button>
            <button id="account-signout" class="w-full px-4 py-2 bg-wood/15 text-ink rounded-lg font-bold text-sm hover:bg-wood/25 transition-all mt-2">${t('accountSignOut')}</button>
            ${!user.email_confirmed_at ? `
              <button id="account-resend" class="w-full px-4 py-2 bg-magic-blue text-white rounded-lg font-bold text-sm hover:shadow transition-all mt-2">${t('accountResendVerify')}</button>
            ` : ''}
          `}
        </div>
      ` : ''}

      <p id="account-msg" class="text-xs text-center mt-3 min-h-[1rem]"></p>
    </div>
  `;

  document.body.appendChild(overlay);

  const msg = (text, isError) => {
    const el = document.getElementById('account-msg');
    if (!el) return;
    el.textContent = text;
    el.className = `text-xs text-center mt-3 min-h-[1rem] ${isError ? 'text-red-500' : 'text-green-600'}`;
  };

  const close = () => {
    clearSignupCooldownTimer();
    overlay.remove();
  };
  overlay.querySelector('#account-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  if (!configured) return;

  // 匿名注册界面才需要加载 hCaptcha
  if (HCAPTCHA_SITE_KEY && isAnonymous) {
    loadHCaptcha()
      .then(() => renderHCaptcha('account-hcaptcha'))
      .catch(err => console.warn('[hcaptcha] load failed', err));
  }

  const emailInput = overlay.querySelector('#account-email');
  const passwordInput = overlay.querySelector('#account-password');

  const getCredentials = () => ({
    email: emailInput?.value?.trim() || '',
    password: passwordInput?.value || ''
  });

  const signupBtn = overlay.querySelector('#account-signup');
  signupBtn?.addEventListener('click', async () => {
    const cooldownRemaining = getSignupCooldownRemaining();
    if (cooldownRemaining > 0) {
      msg(formatSignupCooldownText(cooldownRemaining), true);
      updateSignupButtonState(signupBtn);
      return;
    }

    const { email, password } = getCredentials();
    if (!email || !password) { msg(t('accountPasswordRequirement'), true); return; }
    if (!isValidPassword(password)) { msg(t('accountPasswordRequirement'), true); return; }
    if (HCAPTCHA_SITE_KEY && !hcaptchaToken) { msg(t('accountCaptchaRequired'), true); return; }

    // 发送请求前立即上锁，防止等待响应期间重复点击
    setSignupCooldown();
    updateSignupButtonState(signupBtn);

    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    const result = await signUp(email, password, hcaptchaToken || undefined, redirectTo);
    if (result.ok) {
      msg(t('accountVerifyEmailSent'));
      passwordInput.value = '';
      resetHCaptcha();
      // 注册成功后立即尝试上传当前本地存档（仅在已建立 session 时有效）
      saveState();
    } else {
      // 非频率类错误时解锁按钮，让用户可以立即修正输入
      if (result.code !== 'over_email_send_rate_limit' && !result.error.includes('太频繁')) {
        localStorage.removeItem(SIGNUP_COOLDOWN_KEY);
        updateSignupButtonState(signupBtn);
      }
      msg(t('accountActionFailed').replace('{error}', result.error), true);
      resetHCaptcha();
    }
  });

  overlay.querySelector('#account-signin')?.addEventListener('click', async () => {
    const { email, password } = getCredentials();
    if (!email || !password) { msg(t('accountPasswordRequirement'), true); return; }
    msg(t('accountSigningIn'));
    const result = await signIn(email, password);
    if (result.ok) {
      passwordInput.value = '';
      // 登录成功后先检查云端是否有存档，再决定上传还是下载
      const cloudSave = await downloadSave();
      if (cloudSave) {
        close();
        showSyncChoiceModal(cloudSave);
      } else {
        // 云端无存档，直接上传本地存档
        saveState();
        msg(t('accountActionSuccess'));
        setTimeout(close, 1000);
      }
    } else {
      msg(t('accountActionFailed').replace('{error}', result.error), true);
    }
  });

  overlay.querySelector('#account-forgot')?.addEventListener('click', () => {
    showPasswordResetPanel();
  });

  overlay.querySelector('#account-signout')?.addEventListener('click', async () => {
    const result = await signOut();
    msg(result.ok ? t('accountActionSuccess') : t('accountActionFailed').replace('{error}', result.error), !result.ok);
  });

  overlay.querySelector('#account-download')?.addEventListener('click', async () => {
    msg(t('accountDownloading'));
    const cloudSave = await downloadSave();
    if (cloudSave) {
      close();
      showSyncChoiceModal(cloudSave, true);
    } else {
      msg(t('accountNoCloudSave'), true);
    }
  });

  overlay.querySelector('#account-resend')?.addEventListener('click', async () => {
    const result = await resendVerification(email);
    msg(result.ok ? t('accountVerifyEmailSent') : t('accountActionFailed').replace('{error}', result.error), !result.ok);
  });

  // 启动注册按钮冷却倒计时
  if (signupBtn) {
    updateSignupButtonState(signupBtn);
    signupCooldownTimer = setInterval(() => {
      const remaining = updateSignupButtonState(signupBtn);
      if (remaining <= 0) clearSignupCooldownTimer();
    }, 1000);
  }
}

/**
 * 显示密码重置邮件发送面板
 */
function showPasswordResetPanel() {
  const existing = document.getElementById('password-reset-modal');
  if (existing) { existing.remove(); return; }

  const overlay = document.createElement('div');
  overlay.id = 'password-reset-modal';
  overlay.className = 'fixed inset-0 bg-black/50 z-[210] flex items-center justify-center p-4';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-2xl p-6 max-w-sm w-full magic-glow animate-scale-in">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-display text-lg font-bold">${t('accountResetPasswordTitle')}</h3>
        <button id="reset-close" class="text-ink-light/50 hover:text-ink text-xl leading-none">&times;</button>
      </div>
      <p class="text-xs text-ink-light mb-3">${t('accountResetPasswordDesc')}</p>
      <input id="reset-email" type="email" class="w-full px-3 py-2 border border-wood/30 rounded-lg text-sm mb-3" placeholder="email@example.com" />
      <button id="reset-submit" class="w-full px-4 py-2 bg-magic-blue text-white rounded-lg font-bold text-sm hover:shadow transition-all">${t('accountSendResetEmail')}</button>
      <p id="reset-msg" class="text-xs text-center mt-3 min-h-[1rem]"></p>
    </div>
  `;

  document.body.appendChild(overlay);

  const msg = (text, isError) => {
    const el = document.getElementById('reset-msg');
    if (!el) return;
    el.textContent = text;
    el.className = `text-xs text-center mt-3 min-h-[1rem] ${isError ? 'text-red-500' : 'text-green-600'}`;
  };

  const close = () => overlay.remove();
  overlay.querySelector('#reset-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  overlay.querySelector('#reset-submit').addEventListener('click', async () => {
    const email = document.getElementById('reset-email')?.value?.trim();
    if (!email) { msg(t('accountEmailRequired'), true); return; }
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    const result = await resetPassword(email, redirectTo);
    if (result.ok) {
      msg(t('accountResetEmailSent'));
    } else {
      msg(t('accountActionFailed').replace('{error}', result.error), true);
    }
  });
}

/**
 * 显示密码更新面板（用户从重置邮件链接返回后）
 */
function showPasswordUpdatePanel() {
  const existing = document.getElementById('password-update-modal');
  if (existing) { existing.remove(); return; }

  const overlay = document.createElement('div');
  overlay.id = 'password-update-modal';
  overlay.className = 'fixed inset-0 bg-black/50 z-[210] flex items-center justify-center p-4';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-2xl p-6 max-w-sm w-full magic-glow animate-scale-in">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-display text-lg font-bold">${t('accountUpdatePasswordTitle')}</h3>
        <button id="update-close" class="text-ink-light/50 hover:text-ink text-xl leading-none">&times;</button>
      </div>
      <p class="text-xs text-ink-light mb-3">${t('accountUpdatePasswordDesc')}</p>
      <input id="update-password" type="password" class="w-full px-3 py-2 border border-wood/30 rounded-lg text-sm mb-3" placeholder="••••••••" />
      <button id="update-submit" class="w-full px-4 py-2 bg-magic-blue text-white rounded-lg font-bold text-sm hover:shadow transition-all">${t('accountUpdatePassword')}</button>
      <p id="update-msg" class="text-xs text-center mt-3 min-h-[1rem]"></p>
    </div>
  `;

  document.body.appendChild(overlay);

  const msg = (text, isError) => {
    const el = document.getElementById('update-msg');
    if (!el) return;
    el.textContent = text;
    el.className = `text-xs text-center mt-3 min-h-[1rem] ${isError ? 'text-red-500' : 'text-green-600'}`;
  };

  const close = () => overlay.remove();
  overlay.querySelector('#update-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  overlay.querySelector('#update-submit').addEventListener('click', async () => {
    const password = document.getElementById('update-password')?.value;
    if (!password) { msg(t('accountPasswordRequirement'), true); return; }
    if (!isValidPassword(password)) { msg(t('accountPasswordRequirement'), true); return; }
    const result = await updatePassword(password);
    if (result.ok) {
      msg(t('accountPasswordUpdated'));
      setTimeout(() => {
        close();
        // 清理 URL 中的 recovery token
        if (window.history?.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        }
      }, 1500);
    } else {
      msg(t('accountActionFailed').replace('{error}', result.error), true);
    }
  });
}

/**
 * 检查 URL 中是否有 Supabase 密码恢复 token
 */
function isPasswordRecoveryFlow() {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash || '';
  return hash.includes('type=recovery');
}

/**
 * 显示云端 / 本地存档二选一弹窗
 * @param {object} cloudSave - 从云端下载的 save_data
 * @param {boolean} [isManual] - 是否为用户手动点击「从云端恢复」触发
 */
function showSyncChoiceModal(cloudSave, isManual = false) {
  const existing = document.getElementById('sync-choice-modal');
  if (existing) { existing.remove(); return; }

  const overlay = document.createElement('div');
  overlay.id = 'sync-choice-modal';
  overlay.className = 'fixed inset-0 bg-black/60 z-[210] flex items-center justify-center p-4';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-2xl p-6 max-w-sm w-full magic-glow animate-scale-in">
      <h3 class="font-display text-lg font-bold mb-2 text-center">${t('accountSyncChoiceTitle')}</h3>
      <p class="text-xs text-ink-light mb-5 text-center">${t('accountSyncChoiceDesc')}</p>
      <div class="space-y-3">
        <button id="sync-upload-local" class="w-full px-4 py-2 bg-magic-gold text-white rounded-lg font-bold text-sm hover:shadow transition-all">
          ${t('accountUploadLocal')}
        </button>
        <button id="sync-download-cloud" class="w-full px-4 py-2 bg-magic-blue text-white rounded-lg font-bold text-sm hover:shadow transition-all">
          ${t('accountDownloadCloud')}
        </button>
        ${isManual ? '' : `<button id="sync-decide-later" class="w-full px-4 py-2 bg-wood/15 text-ink rounded-lg font-bold text-sm hover:bg-wood/25 transition-all">${t('accountDecideLater')}</button>`}
      </div>
      <p id="sync-msg" class="text-xs text-center mt-3 min-h-[1rem]"></p>
    </div>
  `;

  document.body.appendChild(overlay);

  const msg = (text, isError) => {
    const el = document.getElementById('sync-msg');
    if (!el) return;
    el.textContent = text;
    el.className = `text-xs text-center mt-3 min-h-[1rem] ${isError ? 'text-red-500' : 'text-green-600'}`;
  };

  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  overlay.querySelector('#sync-upload-local').addEventListener('click', async () => {
    saveState();
    msg(t('accountUploadSuccess'));
    setTimeout(close, 1200);
  });

  overlay.querySelector('#sync-download-cloud').addEventListener('click', () => {
    if (save(STORAGE_KEYS.STATE, cloudSave)) {
      msg(t('accountDownloadSuccess'));
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } else {
      msg(t('accountDownloadFailed'), true);
    }
  });

  const laterBtn = overlay.querySelector('#sync-decide-later');
  if (laterBtn) laterBtn.addEventListener('click', close);
}

/**
 * 初始化账号入口，并检查是否需要显示密码更新面板
 */
export function initAccountEntry() {
  // 如果用户通过密码重置邮件返回，直接显示更新密码面板
  if (isPasswordRecoveryFlow()) {
    // 等 Supabase client 自动从 URL 建立 session
    setTimeout(() => showPasswordUpdatePanel(), 500);
  }

  const menu = document.getElementById('nav-more-menu');
  if (!menu || document.getElementById('nav-more-account')) return;

  const divider = document.createElement('div');
  divider.className = 'my-1.5 border-t border-wood/20';

  const btn = document.createElement('button');
  btn.id = 'nav-more-account';
  btn.type = 'button';
  btn.className = 'w-full text-left px-3 py-2 rounded-lg hover:bg-wood/20 text-sm text-ink flex items-center gap-2';
  btn.innerHTML = `<span>☁️</span><span>${t('accountCloudSyncTitle')}</span>
  `;
  btn.addEventListener('click', showAccountPanel);

  menu.appendChild(divider);
  menu.appendChild(btn);
}
