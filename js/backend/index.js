// 后端模块统一出口

export { SUPABASE_URL, SUPABASE_ANON_KEY, CLOUD_SYNC_ENABLED } from './config.js';
export { isBackendReady, getClient, getBackendError } from './client.js';
export {
  initAuth, getCurrentUser, isAuthInitialized,
  signUp, signIn, signOut, resendVerification,
  resetPassword, updatePassword
} from './auth.js';
export { debouncedUploadSave, downloadSave, getSyncStatus } from './sync.js';
export { track, getPendingEventCount } from './analytics.js';
export { showAccountPanel, initAccountEntry } from './account-ui.js';
export { redeemCode } from './redeem-code.js';
