// Supabase Edge Function: redeem-code
// 负责后端校验兑换码、限频、写入兑换记录，并返回奖励内容。

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

function errorResponse(status: number, error: string) {
  return new Response(
    JSON.stringify({ ok: false, error }),
    { status, headers: corsHeaders }
  );
}

function normalizeCode(code: string): string {
  return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

async function checkRateLimits(
  admin: ReturnType<typeof createClient>,
  userId: string,
  ip: string
): Promise<boolean> {
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();

  const [{ count: userCount }, { count: ipCount }] = await Promise.all([
    admin
      .from('redeem_attempt_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('attempted_at', oneMinuteAgo),
    admin
      .from('redeem_attempt_logs')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('attempted_at', oneMinuteAgo)
  ]);

  // 同一用户每分钟最多 5 次，同一 IP 每分钟最多 10 次
  if ((userCount ?? 0) >= 5) return false;
  if ((ipCount ?? 0) >= 10) return false;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'invalid_or_expired_code');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[redeem-code] missing env vars');
    return errorResponse(500, 'invalid_or_expired_code');
  }

  try {
    // 1. 校验调用者 JWT（来自 supabase-js functions.invoke 自动携带的 Authorization 头）
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const { data: { user }, error: userError } = await adminClient.auth.getUser(token);

    if (userError || !user) {
      console.warn('[redeem-code] auth failed', userError);
      return errorResponse(401, 'invalid_or_expired_code');
    }

    // 2. 解析请求体
    let body: { code?: string } = {};
    try {
      body = await req.json();
    } catch {
      return errorResponse(400, 'invalid_or_expired_code');
    }

    const rawCode = body.code;
    if (!rawCode || typeof rawCode !== 'string') {
      return errorResponse(400, 'invalid_or_expired_code');
    }

    const code = normalizeCode(rawCode);
    if (code.length < 4) {
      return errorResponse(400, 'invalid_or_expired_code');
    }

    // 3. 获取客户端 IP（Supabase 网关通常通过 x-forwarded-for 传递）
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    // 4. 先写入尝试日志（用于限频审计）
    const { data: logRow, error: logError } = await adminClient
      .from('redeem_attempt_logs')
      .insert({ user_id: user.id, ip_address: ip, code, success: false })
      .select('id')
      .single();

    if (logError) {
      console.warn('[redeem-code] failed to log attempt', logError);
    }

    // 5. 限频检查
    const withinLimits = await checkRateLimits(adminClient, user.id, ip);
    if (!withinLimits) {
      return errorResponse(429, 'rate_limited');
    }

    // 6. 原子化兑换（所有业务校验在 PostgreSQL 函数内完成）
    const { data: rpcResult, error: rpcError } = await adminClient.rpc('redeem_code_atomic', {
      p_user_id: user.id,
      p_code: code
    });

    if (rpcError) {
      console.error('[redeem-code] rpc error', rpcError);
      return errorResponse(400, 'invalid_or_expired_code');
    }

    if (!rpcResult || rpcResult.ok !== true) {
      return errorResponse(400, rpcResult?.error || 'invalid_or_expired_code');
    }

    // 7. 标记尝试成功
    if (logRow?.id) {
      await adminClient
        .from('redeem_attempt_logs')
        .update({ success: true })
        .eq('id', logRow.id);
    }

    // 8. 返回奖励
    return new Response(
      JSON.stringify({
        ok: true,
        rewards: rpcResult.rewards,
        code_type: rpcResult.code_type
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error('[redeem-code] unexpected error', err);
    return errorResponse(500, 'invalid_or_expired_code');
  }
});
