# 后端常见问题（Backend FAQ）

> 归墟图书馆云端同步基于 Supabase。本文档记录接入、运维与故障排查要点。

---

## 1. 用户注册时提示「注册请求太频繁，请稍后再试」

### 现象

账号 / 云端同步面板点击注册后，提示：

```
操作失败：email rate limit exceeded
```

或中文映射后的：

```
操作失败：注册请求太频繁，请稍后再试（建议间隔 1 小时）
```

### 原因

Supabase Auth 对邮件类操作（注册、验证邮件重发、密码重置）有内置频率限制。项目默认使用 Supabase 共享邮件池，限制更严格：

- 同一邮箱短时间内多次注册/重发验证邮件。
- 同一 IP / 网络下多人同时注册。
- 共享邮件池触发全局限流。

### 临时解决

1. 让用户**等待约 1 小时后重试**。
2. 建议用户**换一个邮箱**尝试。
3. 前端已加入 60 秒按钮冷却，防止用户连续点击。

### 长期解决：接入第三方 SMTP

配置自定义 SMTP 后，邮件不再走 Supabase 共享池，可显著放宽限制并提升送达率。

---

## 2. 用户说确认邮件里的链接打不开，登录提示「邮箱或密码错误」

### 现象

1. 注册后收到了确认邮件。
2. 邮件里的链接点击后打不开（空白页 / 超时 / 被拦截）。
3. 返回游戏用邮箱 + 密码登录，提示：

```
操作失败：邮箱或密码错误
```

或中文映射后的：

```
操作失败：邮箱尚未验证，请先点击确认邮件中的链接；若链接打不开，请联系管理员开启免验证登录
```

### 原因

Supabase 默认开启**邮箱确认（Email Confirmations）**。注册后用户必须点击邮件里的 `https://your-project.supabase.co/auth/v1/verify?...` 链接才能激活账号。

对于中国用户，可能出现以下情况：

- `*.supabase.co` 域名访问不稳定或被拦截，导致确认链接打不开。
- 邮件被归入垃圾箱，用户找不到。
- 链接过期（默认 24 小时）。

由于账号未确认，Supabase 不允许密码登录，因此提示凭证错误。

### 推荐解决方案

#### 方案 A：关闭邮箱确认（适合独立游戏 / 中国大陆用户）

1. 打开 Supabase Dashboard → 你的项目 → **Authentication → Providers → Email**。
2. 关闭 **Confirm email**。
3. 保存后，新注册用户无需点击邮件确认，注册成功后直接可以登录和同步存档。

> 注意：关闭后任何人都可以用任意邮箱注册，安全性略低。对早期独立游戏 Demo 来说通常是可接受的权衡。

#### 方案 B：保留邮箱确认，但使用自定义域名跳转

1. 在 `js/backend/auth.js` 的 `signUp` 中已经支持传入 `redirectTo`。
2. 在 `js/backend/account-ui.js` 中已传入 `window.location.origin`。
3. 在 Supabase Dashboard → **Authentication → URL Configuration** 中：
   - 设置 **Site URL** 为你的游戏域名（如 `https://riftlib.example.com`）。
   - 在 **Redirect URLs** 中添加同样的域名。
4. 这样确认邮件的链接会跳转回你的域名，而不是 `supabase.co`。
5. 需要在前端新增一个确认回调页面，处理 URL 中的 `access_token` / `refresh_token` / `type` 参数。

> 方案 B 实施成本更高，建议初期先用方案 A。

---

## 3. 用户注册成功了，但存档没有同步到云端

### 可能原因

1. **邮箱确认未关闭**：`signUp` 成功后如果没有建立有效 session，云端存档上传会因未登录而失败。
2. **注册成功后没有触发 `saveState()`**：旧版本中注册面板没有自动调用存档上传。
3. **网络波动或 RLS 策略问题**：上传请求失败但 UI 没有明确提示。

### 已做的代码改进

- `js/backend/account-ui.js`：注册成功后自动调用 `saveState()`，触发 `debouncedUploadSave()`。
- `js/backend/auth.js`：`signUp` 增加 `emailRedirectTo` 参数，指向当前页面 origin。
- 若仍有问题，请先确认 Supabase 中 **Confirm email** 已关闭。

### 排查步骤

1. 在浏览器控制台查看是否有 `[backend] save upload failed` 报错。
2. 打开 Supabase Dashboard → **Table Editor → saves**，查看该用户的 `user_id` 是否有记录。
3. 检查 `saves` 表的 RLS 策略是否正确（参考 `backend-supabase-implementation-plan.md`）。
4. 让用户重新登录一次，登录成功后会再次触发存档上传。

---

## 4. 如何接入第三方邮件服务（SMTP）

推荐方案：**Resend**（开发者友好、免费额度充足）。

### 4.1 注册并验证域名

1. 访问 https://resend.com 注册账号。
2. 进入 **Domains → Add Domain**。
3. 输入你的发信域名，例如 `riftlib.com` 或当前部署域名。
4. 按提示在域名 DNS 添加 TXT / MX / DKIM / SPF 记录。
5. 等待验证通过（通常几分钟到几小时）。

### 4.2 创建 API Key

1. 进入 **API Keys → Create API Key**。
2. 权限选择 **Sending access**。
3. 复制生成的 key（以 `re_` 开头）。

### 4.3 在 Supabase 配置 SMTP

1. 打开 Supabase Dashboard → 你的项目 → **Authentication → SMTP**。
2. 开启 **Enable Custom SMTP**。
3. 填入以下信息：

| 字段 | 值 |
|---|---|
| Host | `smtp.resend.com` |
| Port | `587` |
| Username | `resend` |
| Password | 你的 Resend API Key |
| From email | `noreply@你的域名.com` |
| From name | `归墟图书馆` 或 `Rift Library` |
| Reply-to | 可选，可留空 |

4. 点击 **Send test email**，输入自己的邮箱测试是否能收到。
5. 保存设置。

### 4.4 验证

- 重新打开游戏账号面板，尝试注册一个新邮箱。
- 检查收件箱（含垃圾邮件文件夹）是否收到验证邮件。
- 在 Supabase Dashboard → **Authentication → Logs** 中查看邮件发送状态。

---

## 5. 邮件服务费用

| 服务商 | 免费额度 | 超出后价格 | 备注 |
|---|---|---|---|
| **Resend** | 100 封/月 | 约 $0.10 / 1000 封 | 推荐，配置最简单 |
| SendGrid | 100 封/天 | 约 $19.95/月起 | 老牌，但近年送达率口碑略降 |
| AWS SES | 无免费额度（但前 12 个月每月 62,000 封免费出站邮件）| 约 $0.10 / 1000 封 | 最便宜，但配置复杂 |
| Brevo（原 Sendinblue）| 300 封/天 | 套餐制 | 适合欧洲用户 |
| Mailgun | 1000 封/3 个月试用 | 约 $0.80 / 1000 封起 | 适合高发送量 |
| Postmark | 100 封/月试用 | $15 / 10,000 封起 | 送达率高 |

> Supabase 本身对 Custom SMTP 配置**不额外收费**，只需向邮件服务商付费。

对归墟图书馆这种早期独立游戏，**Resend 的 100 封/月免费额度通常足够**。

---

## 6. 如何查看 Supabase Auth 日志

1. Supabase Dashboard → 你的项目 → **Authentication → Logs**。
2. 可筛选事件类型：`user_signed_up`、`user_confirmed`、`token_revoked` 等。
3. 若看到 `over_email_send_rate_limit`，说明触发了频率限制，应引导用户等待或检查 SMTP 配置。

---

## 7. 相关文件

- `js/backend/auth.js` — 认证逻辑与错误码映射
- `js/backend/account-ui.js` — 账号面板 UI 与注册冷却
- `js/backend/client.js` — Supabase client 初始化
- `js/backend/config.js` / `config.local.js` — Supabase 项目配置
- `docs/plans/backend-supabase-implementation-plan.md` — 后端整体实施计划
