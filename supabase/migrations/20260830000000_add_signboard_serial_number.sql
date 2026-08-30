-- 2026-08-30：为限量纪念牌增加编号（serial_number）支持
-- 已在项目 jfehwxfjiwfmbprrfoxt 应用后追加

-- 1. 为用户兑换记录增加编号字段
ALTER TABLE public.user_redeems
ADD COLUMN IF NOT EXISTS serial_number int;

COMMENT ON COLUMN public.user_redeems.serial_number IS '该次兑换在对应兑换码中的序号，用于限量纪念牌展示编号';

-- 2. 更新原子化兑换函数，返回 serial_number
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
  -- 标准化兑换码
  p_code := upper(regexp_replace(p_code, '[^A-Z0-9]', '', 'g'));

  -- 查询兑换码
  SELECT * INTO v_code
  FROM public.redeem_codes
  WHERE code = p_code;

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

  -- 重复兑换检查
  SELECT EXISTS(
    SELECT 1 FROM public.user_redeems WHERE user_id = p_user_id AND code = p_code
  ) INTO v_exists;

  IF v_exists THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_redeemed');
  END IF;

  -- 递增使用次数并捕获编号（第几块）
  UPDATE public.redeem_codes
  SET used_count = used_count + 1
  WHERE code = p_code
  RETURNING used_count INTO v_serial;

  INSERT INTO public.user_redeems (user_id, code, rewards_json, serial_number)
  VALUES (p_user_id, p_code, v_code.reward_json, v_serial);

  RETURN jsonb_build_object(
    'ok', true,
    'rewards', v_code.reward_json,
    'code_type', v_code.code_type,
    'serial_number', v_serial
  );
END;
$$;

COMMENT ON FUNCTION public.redeem_code_atomic(uuid, text) IS '原子化兑换：校验、扣次数、写记录、返回限量编号一次性完成';
