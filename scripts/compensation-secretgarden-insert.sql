-- 补偿兑换码插入脚本（单发，玩家反馈：秘密花园典藏版消失变成两卷待抄写）
-- 生成时间：2026-09-21
-- 背景：该玩家为 9-16 前旧配置直发典藏版的受害者（星光蕨种子×5 直发 book_034，
--       0 章不可抄永卡手稿箱）；V13 迁移回锁补卷系预期修复，但其需重抄两卷+修复室合成
--       才能拿回典藏版，体验受损，补此码致歉。
--       同批修复 V13 误伤合法合成者的 bug（migrations.js 补闸），见当日提交。
-- 奖励口径：星光蕨种子×5（退回当次兑换成本；兑换一次性无法重兑本书，可兑其他奖励）
--           + 秘银笔尖×4（12万字）+ 天鹅翎管×4（8万字）= 20 万字，全额覆盖两卷抄写
--             （book_034_vol1/vol2 各 10 万字，笔类道具直接加抄写进度并完成全流程）
--           + 15 灵感 + 1000 智慧之光（致歉；参照 9-15 补偿 20 灵感/500 币）
-- ⚠️ 单发码不绑定账号：请通过私聊发放，先到先兑，勿公开张贴
-- 用法：Supabase SQL Editor 执行本文件；玩家入口：顶栏 ⚙️ 更多 → ☁️ 账号与云同步 → 兑换礼包码
INSERT INTO public.redeem_codes (code, reward_json, max_uses, code_type, created_by) VALUES
  ('GIFT-USB5-JQSP-ZJBG-PGDN', '{"coins":1000,"inspiration":15,"seeds":{"starlight_fern":5},"items":{"brush_mithril_nib":4,"brush_swan_quill":4}}'::jsonb, 1, 'gift', 'compensation_20260921_secret_garden');
