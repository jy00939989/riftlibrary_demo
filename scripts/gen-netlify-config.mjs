// Netlify 构建期生成 config.local.js（M5 密钥迁移，2026-10-15）
// 真实密钥只存在于 Netlify 环境变量与本地未跟踪的 config.local.js，不进 Git。
// 环境变量缺失时静默跳过——config.js 对缺文件有占位符降级（纯本地模式），不阻断构建。

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = join(ROOT, 'js', 'backend', 'config.local.js');

// 本地已有真实配置文件（开发机）时不覆盖
if (!existsSync(TARGET)) {
  // 防御性清洗（2026-10-17）：Netlify 环境变量常带首尾空白或成对引号（复制粘贴引入），
  // 不清洗会生成非法 URL 的配置文件，Supabase 客户端初始化直接抛错
  const clean = (v) => String(v || '').trim().replace(/^[\'"]+|[\'"]+$/g, '');
  const url = clean(process.env.SUPABASE_URL);
  const key = clean(process.env.SUPABASE_ANON_KEY);
  const isValidHttpUrl = (u) => { try { const p = new URL(u).protocol; return p === 'http:' || p === 'https:'; } catch { return false; } };
  if (url && key && isValidHttpUrl(url)) {
    const hcaptcha = clean(process.env.HCAPTCHA_SITE_KEY);
    const content = `// 本文件由 Netlify 构建期自动生成（scripts/gen-netlify-config.mjs），勿手改、勿提交
export default {
  SUPABASE_URL: ${JSON.stringify(url)},
  SUPABASE_ANON_KEY: ${JSON.stringify(key)},
  CLOUD_SYNC_ENABLED: true,
  HCAPTCHA_SITE_KEY: ${JSON.stringify(hcaptcha)}
};
`;
    mkdirSync(dirname(TARGET), { recursive: true });
    writeFileSync(TARGET, content, 'utf8');
    console.log('[gen-netlify-config] config.local.js 已从环境变量生成');
  } else if (url || key) {
    console.warn('[gen-netlify-config] SUPABASE_URL/SUPABASE_ANON_KEY 存在但格式非法（URL 必须是 http/https），跳过——运行时将降级纯本地模式');
  } else {
    console.log('[gen-netlify-config] 未设置 SUPABASE_URL/SUPABASE_ANON_KEY，跳过（运行时将降级纯本地模式）');
  }
} else {
  console.log('[gen-netlify-config] 本地已存在 config.local.js，不覆盖');
}
