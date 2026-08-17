// Supabase 后端配置
// 真实配置请写入 js/backend/config.local.js（已加入 .gitignore，不会提交）
// 未创建 config.local.js 时，使用下方占位符并降级为纯本地模式

let local = {};
try {
  local = await import('./config.local.js').then(m => m.default || {}).catch(() => ({}));
} catch (e) {
  local = {};
}

export const SUPABASE_URL = local.SUPABASE_URL || 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY = local.SUPABASE_ANON_KEY || 'your-anon-key';
export const HCAPTCHA_SITE_KEY = local.HCAPTCHA_SITE_KEY || '';

// 关闭云端同步总开关（用于本地开发或紧急回退）
export const CLOUD_SYNC_ENABLED = local.CLOUD_SYNC_ENABLED !== undefined ? local.CLOUD_SYNC_ENABLED : true;
