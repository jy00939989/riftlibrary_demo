-- 补偿兑换码插入脚本（单发，玩家反馈：重抄多次未见金光特效——该特效此前未实装，2026-09-15 已兑现）
-- 生成时间：2026-09-15
-- 奖励口径：重抄每次耗 1 灵感；补偿 20 灵感 + 500 智慧之光（覆盖多次重抄成本并致歉）
-- 用法：Supabase SQL Editor 执行本文件；玩家入口：顶栏 ⚙️ 更多 → ☁️ 账号与云同步 → 兑换礼包码
INSERT INTO public.redeem_codes (code, reward_json, max_uses, code_type, created_by) VALUES
  ('GIFT-ZJS6-BM8E-VZQE-YVQB', '{"coins":500,"inspiration":20}'::jsonb, 1, 'gift', 'compensation_20260915_goldglow');
