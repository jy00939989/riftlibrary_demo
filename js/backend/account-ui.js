// 账号 / 云端同步 UI 面板

import {
  isBackendReady, getBackendError, getCurrentUser,
  signUp, signIn, signOut, resendVerification,
  getSyncStatus, getPendingEventCount, downloadSave
} from './index.js';
import { t } from '../i18n/terms.js';
import { saveState } from '../state.js';
import { HCAPTCHA_SITE_KEY } from './config.js';

function isValidPassword(password) {
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
}

// ========== hCaptcha 人机验证 ==========

let hcaptchaToken = null;
let hcaptchaWidgetId = null;
let hcaptchaLoaded = false;
let hcaptchaLoading = false;

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
            <button id="account-signout" class="w-full px-4 py-2 bg-wood/15 text-ink rounded-lg font-bold text-sm hover:bg-wood/25 transition-all">${t('accountSignOut')}</button>
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

  const close = () => overlay.remove();
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

  overlay.querySelector('#account-signup')?.addEventListener('click', async () => {
    const { email, password } = getCredentials();
    if (!email || !password) { msg(t('accountPasswordRequirement'), true); return; }
    if (!isValidPassword(password)) { msg(t('accountPasswordRequirement'), true); return; }
    if (HCAPTCHA_SITE_KEY && !hcaptchaToken) { msg(t('accountCaptchaRequired'), true); return; }
    const result = await signUp(email, password, hcaptchaToken || undefined);
    if (result.ok) {
      msg(t('accountVerifyEmailSent'));
      passwordInput.value = '';
      resetHCaptcha();
    } else {
      msg(t('accountActionFailed').replace('{error}', result.error), true);
      resetHCaptcha();
    }
  });

  overlay.querySelector('#account-signin')?.addEventListener('click', async () => {
    const { email, password } = getCredentials();
    if (!email || !password) { msg(t('accountPasswordRequirement'), true); return; }
    const result = await signIn(email, password);
    if (result.ok) {
      msg(t('accountActionSuccess'));
      // 登录成功后尝试合并云端存档：此处仅提示，由用户决定下一步
      passwordInput.value = '';
      saveState();
    } else {
      msg(t('accountActionFailed').replace('{error}', result.error), true);
    }
  });

  overlay.querySelector('#account-signout')?.addEventListener('click', async () => {
    const result = await signOut();
    msg(result.ok ? t('accountActionSuccess') : t('accountActionFailed').replace('{error}', result.error), !result.ok);
  });

  overlay.querySelector('#account-resend')?.addEventListener('click', async () => {
    const result = await resendVerification(email);
    msg(result.ok ? t('accountVerifyEmailSent') : t('accountActionFailed').replace('{error}', result.error), !result.ok);
  });
}

/**
 * 在「更多」菜单中注入「账号 / 云端同步」入口
 */
export function initAccountEntry() {
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
