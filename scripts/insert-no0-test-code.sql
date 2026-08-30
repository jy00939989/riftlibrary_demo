-- 管理员 NO.0 测试码
-- 不占用 10 个 PIONEER 用户码名额，仅用于团队内部测试

INSERT INTO public.redeem_codes (code, reward_json, max_uses, code_type, created_by)
VALUES (
  'NO0-PIONEER-0000-0000-0000',
  '{"coins":300,"inspiration":30,"seeds":{"starlight_fern":2},"items":{"brush_reed_pen":2,"brush_swan_quill":2,"brush_mithril_nib":1,"repair_scroll":2,"favor_note_targeted":2,"favor_note_random":1},"signboards":["pioneer_ink"]}'::jsonb,
  1,
  'pioneer',
  'admin_no0_test'
)
ON CONFLICT (code) DO NOTHING;
