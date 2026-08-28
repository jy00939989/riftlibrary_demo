-- 归墟图书馆 Supabase Phase 1 SQL
-- 执行顺序：先建表 → 再开 RLS → 再建策略 → 最后 trigger

-- ========== profiles 表 ==========
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz DEFAULT now(),
  last_login_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.profiles IS '用户公开资料，auth.users 的扩展';

-- ========== saves 表 ==========
CREATE TABLE IF NOT EXISTS public.saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  save_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

COMMENT ON TABLE public.saves IS '用户云端存档';

-- ========== events 表 ==========
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.events IS '行为事件埋点';
CREATE INDEX IF NOT EXISTS idx_events_user_created
  ON public.events (user_id, created_at DESC);

-- ========== 开启 RLS ==========
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- ========== profiles 策略 ==========
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ========== saves 策略 ==========
CREATE POLICY "Users can read own save"
  ON public.saves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can write own save"
  ON public.saves FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ========== events 策略 ==========
CREATE POLICY "Users can read own events"
  ON public.events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ========== 自动创建 profiles 行 ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, created_at, last_login_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', 'curator'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== 可选：登录时更新 last_login_at ==========
CREATE OR REPLACE FUNCTION public.handle_user_signin()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET last_login_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_session_created ON auth.sessions;
CREATE TRIGGER on_auth_session_created
  AFTER INSERT ON auth.sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_signin();
