-- 修复：兑换码在数据库存储时带连字符，但前端/Edge Function 会标准化为纯字母数字，
-- 导致 redeem_code_atomic 查询时匹配失败，表现为“无效或已兑换”。
-- 本迁移将函数内所有 code 比较改为标准化后比较，并在写入 user_redeems 时保留原始带连字符的码。

CREATE OR REPLACE FUNCTION public.redeem_code_atomic(p_user_id uuid, p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code public.redeem_codes%ROWTYPE;
  v_exists boolean;
  v_serial int;
BEGIN
  -- 标准化兑换码（忽略连字符、空格、大小写）
  p_code := upper(regexp_replace(p_code, '[^A-Z0-9]', '', 'g'));

  -- 查询兑换码（存储时可能带连字符，按标准化形式匹配）
  SELECT * INTO v_code
  FROM public.redeem_codes
  WHERE upper(regexp_replace(code, '[^A-Z0-9]', '', 'g')) = p_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_or_expired_code');
  END IF;

  -- 作废检查
  IF v_code.revoked THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_or_expired_code');
  END IF;

  -- 有效期检查
  IF v_code.expires_at IS NOT NULL AND v_code.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_or_expired_code');
  END IF;

  -- 次数检查
  IF v_code.used_count >= v_code.max_uses THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_or_expired_code');
  END IF;

  -- 重复兑换检查（同样按标准化形式比较）
  SELECT EXISTS(
    SELECT 1 FROM public.user_redeems
    WHERE user_id = p_user_id
      AND upper(regexp_replace(code, '[^A-Z0-9]', '', 'g')) = p_code
  ) INTO v_exists;

  IF v_exists THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_redeemed');
  END IF;

  -- 递增使用次数并捕获编号（第几块）
  UPDATE public.redeem_codes
  SET used_count = used_count + 1
  WHERE upper(regexp_replace(code, '[^A-Z0-9]', '', 'g')) = p_code
  RETURNING used_count INTO v_serial;

  -- 写入兑换记录时保留原始带连字符的码，以满足外键约束
  INSERT INTO public.user_redeems (user_id, code, rewards_json, serial_number)
  VALUES (p_user_id, v_code.code, v_code.reward_json, v_serial);

  RETURN jsonb_build_object(
    'ok', true,
    'rewards', v_code.reward_json,
    'code_type', v_code.code_type,
    'serial_number', v_serial
  );
END;
$$;

COMMENT ON FUNCTION public.redeem_code_atomic(uuid, text) IS '原子化兑换：支持带连字符存储，内部按标准化形式匹配';
