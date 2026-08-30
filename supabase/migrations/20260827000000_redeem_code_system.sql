-- 道具兑换码系统迁移
-- 创建时间：2026-08-27

-- ========== 1. 兑换码主表 ==========
CREATE TABLE IF NOT EXISTS public.redeem_codes (
  code text PRIMARY KEY,
  reward_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  max_uses int NOT NULL DEFAULT 1,
  used_count int NOT NULL DEFAULT 0,
  expires_at timestamptz,
  code_type text NOT NULL DEFAULT 'gift',
  created_by text,
  created_at timestamptz DEFAULT now(),
  revoked boolean NOT NULL DEFAULT false
);

COMMENT ON TABLE public.redeem_codes IS '兑换码主表，一码可多次使用由 max_uses 控制';

-- ========== 2. 用户兑换记录表 ==========
CREATE TABLE IF NOT EXISTS public.user_redeems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL REFERENCES redeem_codes(code),
  rewards_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  serial_number int,
  redeemed_at timestamptz DEFAULT now(),
  UNIQUE (user_id, code)
);

CREATE INDEX IF NOT EXISTS idx_user_redeems_user ON public.user_redeems (user_id);
CREATE INDEX IF NOT EXISTS idx_user_redeems_code ON public.user_redeems (code);

COMMENT ON TABLE public.user_redeems IS '用户兑换记录，用于防止重复兑换与审计';

-- ========== 3. 兑换尝试审计/限频表 ==========
CREATE TABLE IF NOT EXISTS public.redeem_attempt_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address text,
  code text,
  success boolean DEFAULT false,
  attempted_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_redeem_attempts_user_time ON public.redeem_attempt_logs (user_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_redeem_attempts_ip_time ON public.redeem_attempt_logs (ip_address, attempted_at DESC);

COMMENT ON TABLE public.redeem_attempt_logs IS '兑换尝试日志，用于限频与异常审计';

-- ========== 4. RLS 策略 ==========
ALTER TABLE public.redeem_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_redeems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redeem_attempt_logs ENABLE ROW LEVEL SECURITY;

-- redeem_codes：不向公众暴露任何读写（Edge Function 使用 service_role 绕过 RLS）
CREATE POLICY "deny all public redeem_codes"
  ON public.redeem_codes
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- user_redeems：用户只能查看自己的记录
CREATE POLICY "read own redeems"
  ON public.user_redeems
  FOR SELECT
  USING (auth.uid() = user_id);

-- redeem_attempt_logs：不向公众暴露
CREATE POLICY "deny all public attempt_logs"
  ON public.redeem_attempt_logs
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ========== 5. 原子化兑换函数 ==========
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
