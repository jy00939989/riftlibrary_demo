-- 兑换码系统诊断脚本
-- 在 Supabase SQL Editor 中运行，排查兑换失败根因

-- 1. 检查 redeem_codes 表中是否存在目标码（支持带连字符存储）
-- 把下面的占位符换成实际测试的兑换码
-- SELECT * FROM public.redeem_codes
-- WHERE upper(regexp_replace(code, '[^A-Z0-9]', '', 'g')) = upper(regexp_replace('PIONEER-XXXX-XXXX-XXXX-XXXX', '[^A-Z0-9]', '', 'g'));

-- 2. 检查 redeem_code_atomic 函数是否包含标准化匹配逻辑
-- 如果函数定义里没有 regexp_replace，说明旧版本函数仍在运行，需要重新应用迁移 20260830094947_fix_redeem_code_normalization.sql
SELECT
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'redeem_code_atomic';

-- 3. 检查所有有效的兑换码（总量、已用、剩余）
SELECT
  code,
  code_type,
  max_uses,
  used_count,
  (max_uses - used_count) AS remaining,
  revoked,
  expires_at,
  created_by,
  created_at
FROM public.redeem_codes
ORDER BY created_at DESC;

-- 4. 检查最近 50 条兑换尝试日志（辅助排查限频、重复兑换）
SELECT
  user_id,
  code,
  ip_address,
  success,
  attempted_at
FROM public.redeem_attempt_logs
ORDER BY attempted_at DESC
LIMIT 50;

-- 5. 按用户查询兑换记录（把 uuid 换成实际 user_id）
-- SELECT * FROM public.user_redeems WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- 6. 快速自检测：用一个不存在的码调用函数，观察返回的错误格式
-- 预期返回：{"ok": false, "error": "invalid_or_expired_code"}
SELECT public.redeem_code_atomic('00000000-0000-0000-0000-000000000000'::uuid, 'FAKE-CODE-1234');
