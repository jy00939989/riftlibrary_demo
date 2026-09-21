-- 2026 中秋·国庆双节通用兑换码插入脚本（B+C 方案之 C：社媒传播用，人人可兑）
-- 主礼（800💰+30💡+三样种子+中秋纪念牌）走「登录自动领」（js/core/festival.js，无需 SQL）；
-- 本码是轻量补充包（200💰+5💡），发放方式：微博/小红书/TapTap 动态公布。
-- ⚠️ 执行前待验证：Edge Function redeem-code 对同一 user 重复兑换的拦截口径
--   （pioneer/补偿码均 max_uses=1 全局限兑；本码 max_uses=999999 依赖 per-user 去重，请先在测试码上验）。
-- 用法：Supabase SQL Editor 执行本文件；玩家入口：顶栏 ⚙️ 更多 → ☁️ 账号与云同步 → 兑换礼包码
-- 生成时间：2026-09-21（活动窗 9/25–10/8，建议 9/24 前执行）
INSERT INTO public.redeem_codes (code, reward_json, max_uses, code_type, created_by) VALUES
  ('GIFT-MOON-2026-NATL', '{"coins":200,"inspiration":5}'::jsonb, 999999, 'gift', 'festival_midautumn2026');
