# 归墟图书馆迁移至 PocketBay 可行性评估

> 评估日期：2026-08-26  
> 评估对象：PocketBay 托管平台（含 managed PostgreSQL）  
> 当前版本：归墟图书馆使用 Supabase Auth + Supabase PostgreSQL  
> 文档状态：备查 / 待决策

---

## 一、结论摘要

**技术上可行，但当前阶段不建议完整迁移。**

PocketBay 提供 managed PostgreSQL 后，数据库迁移本身很简单（约 0.5–1 天）。但归墟图书馆目前深度依赖 **Supabase Auth**（匿名登录、邮箱注册/登录、邮箱验证、密码重置、session 管理），而 PocketBay 尚未提供对等的托管认证服务。若现在迁移，需要**自建完整认证系统**，这是主要成本和风险来源，预估额外工作量 **3–7 天**。

**建议**：先观望 1–2 个月，等 PocketBay 推出 managed Auth；如急于验证，可先做最小 PoC。

---

## 二、当前后端架构

| 模块 | 实现 | 依赖 |
|---|---|---|
| 认证 | 匿名登录 + 邮箱/密码注册、登录、验证、重置 | **Supabase Auth** |
| 数据库 | `saves` 存档表、`events` 行为事件表、`profiles` 用户档案表 | **Supabase PostgreSQL** |
| 调用方式 | 前端直接通过 `@supabase/supabase-js` 读写数据库 | 前端 → Supabase |
| Kimi API 代理 | Phase 4 计划中，尚未实施 | 暂时不影响评估 |
| 部署 | 静态前端部署在 Netlify | 无独立后端服务 |

### 2.1 数据库表结构

```sql
-- 用户档案（依赖 Supabase auth.users）
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  created_at timestamptz default now(),
  last_login_at timestamptz default now(),
  display_name text
);

-- 存档表
create table saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  save_data jsonb not null,
  client_version text,
  saved_at timestamptz default now(),
  unique(user_id)
);

-- 行为事件表
create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  anonymous_id text,
  event_type text not null,
  event_data jsonb not null default '{}',
  client_timestamp timestamptz not null,
  server_timestamp timestamptz default now(),
  session_id text
);
```

### 2.2 前端后端模块

- `js/backend/config.js`：Supabase URL / Anon Key / hCaptcha Key
- `js/backend/client.js`：`@supabase/supabase-js` 初始化
- `js/backend/auth.js`：认证逻辑封装
- `js/backend/sync.js`：存档上传/下载
- `js/backend/analytics.js`：事件批量上报
- `js/backend/account-ui.js`：账号面板 UI

---

## 三、PocketBay 方案说明

PocketBay 是国内面向 **Vibe Coding / AI 原生工作流** 的部署与托管平台。当前已支持：

- 前端静态站点部署
- Node.js / Python / Go / Java / PHP / Ruby / Rust 等后端服务（部分需 Dockerfile）
- **Managed PostgreSQL**（通过平台注入的 `DATABASE_URL`）

**明确不提供（截至 2026-08-26）**：托管认证服务（Auth）、邮件发送服务、Row Level Security、实时订阅、对象存储等。

---

## 四、迁移所需工作

### 4.1 架构变化

| 当前架构 | PocketBay 架构 |
|---|---|
| 前端 → Supabase Auth + Supabase Postgres | 前端 → 自建后端 API → PocketBay Postgres |

PocketBay 只给数据库，不给 Auth。因此必须在 PocketBay 上部署一个后端服务，由它持有 `DATABASE_URL` 并暴露认证/存档/事件 API。

### 4.2 认证系统重建（最大成本）

| 功能 | 当前 Supabase | PocketBay 方案 | 备注 |
|---|---|---|---|
| 匿名登录 | `signInAnonymously()` | 自建：生成 UUID + 本地存储 | 需与正式账号绑定逻辑 |
| 邮箱注册 | `signUp(email, password)` + 自动邮件验证 | 自建：bcrypt/argon2 哈希 + 验证 token + 发邮件 | 需集成邮件服务 |
| 邮箱登录 | `signInWithPassword()` | 自建：校验密码 → JWT/session | 需 token 刷新机制 |
| 邮箱验证 | Supabase 自动发验证邮件 | 自建：验证链接 + token 过期 | 邮件送达率需测试 |
| 密码重置 | `resetPasswordForEmail()` | 自建：reset token + 邮件 | 安全链路需完整 |
| 修改密码 | `updateUser({ password })` | 自建：校验旧密码/登录态 + 更新哈希 | — |
| Session 刷新 | `autoRefreshToken: true` | 自建：JWT 过期策略或 session 表 | — |

**预估工作量**：3–7 天（含安全审查、邮件服务调试、全链路测试）。

### 4.3 前端重写

| 文件 | 改动 |
|---|---|
| `js/backend/config.js` | `SUPABASE_URL/ANON_KEY` → `API_BASE_URL` |
| `js/backend/client.js` | 移除 Supabase SDK，改为通用 fetch 客户端 |
| `js/backend/auth.js` | 所有 `client.auth.xxx` 替换为后端 API 调用 |
| `js/backend/sync.js` | `supabase.from('saves').upsert()` → `POST /api/save` |
| `js/backend/analytics.js` | `supabase.from('events').insert()` → `POST /api/event` |

**预估工作量**：1–2 天。

### 4.4 数据库迁移

```bash
# 1. 从 Supabase 导出 schema + data
pg_dump --schema-only ... > schema.sql
pg_dump --data-only --table=saves --table=events --table=profiles ... > data.sql

# 2. 在 PocketBay 创建 PostgreSQL 后导入
psql $DATABASE_URL < schema.sql
psql $DATABASE_URL < data.sql
```

**注意**：
- `profiles.id references auth.users` 外键需删除或改为普通 `uuid`，因为不再有 `auth.users` 表。
- 需新建自建 `users` 表，包含 `id`、`email`、`password_hash`、`email_verified`、`created_at`、`updated_at` 等字段。

**预估工作量**：0.5–1 天。

### 4.5 后端服务最小接口

建议技术栈：Node.js + Express + `pg`（或 Python + FastAPI + `psycopg`）。

| 接口 | 说明 |
|---|---|
| `POST /api/auth/anonymous` | 创建/恢复匿名会话 |
| `POST /api/auth/register` | 邮箱注册，发送验证邮件 |
| `POST /api/auth/verify-email` | 验证邮箱 token |
| `POST /api/auth/login` | 邮箱登录 |
| `POST /api/auth/forgot-password` | 发送密码重置邮件 |
| `POST /api/auth/reset-password` | 重置密码 |
| `POST /api/auth/update-password` | 修改密码（需登录态） |
| `POST /api/auth/logout` | 登出 |
| `POST /api/save` | 上传/覆盖存档 |
| `GET /api/save` | 下载存档 |
| `POST /api/events` | 批量上报事件 |

**预估工作量**：2–3 天。

---

## 五、优缺点对比

### 5.1 优点

| 优点 | 说明 |
|---|---|
| 国内访问稳定 | 解决 Supabase 偶发的网络抖动和邮件送达问题 |
| 统一托管 | 前端 + 后端 + 数据库在同一平台，部署链路更短 |
| 数据持久化 | managed PostgreSQL 保证 redeploy 不丢数据 |
| 成本可能更低 | Supabase 免费档有容量/速率限制，PocketBay 若定价合理可降低支出 |
| Kimi 代理易落地 | 未来 Phase 4 的 `kimi-proxy` 可直接作为 PocketBay 后端路由实现 |
| AI 工作流友好 | 与 Claude Code、Cursor 等工具配合的部署体验较好 |

### 5.2 缺点

| 缺点 | 说明 |
|---|---|
| 认证系统需自建 | 最大成本，涉及密码安全、邮件服务、token 管理 |
| 失去 Supabase 生态 | Auth 后台、RLS、自动邮件、匿名登录、session 管理均需自实现 |
| 平台较新 | PocketBay 稳定性和长期存续待验证，文档和社区支持有限 |
| 邮件服务额外配置 | 需单独接入 SendGrid / Resend / 阿里云邮件推送等，国内邮件送达率需测试 |
| 迁移测试成本高 | 注册/登录/验证/重置/存档同步/事件上报全链路需重测 |
| 安全责任转移 | 原 Supabase RLS 由平台保证，现在需在后端 API 层手动校验权限 |

---

## 六、风险评估

| 风险 | 等级 | 说明 |
|---|---|---|
| 认证实现安全漏洞 | 高 | 密码哈希、JWT、token、session 任一环节出错都会影响全部用户 |
| 邮件送达失败 | 中 | 国内邮件服务商对验证/重置类邮件有反垃圾策略，可能进垃圾箱 |
| PocketBay 平台稳定性 | 中 | 新平台，可能出现服务中断、API 变更、定价调整 |
| 数据迁移丢失 | 低 | 表结构简单，可备份后迁移；主要注意外键和 `auth.users` 依赖 |
| 前端改动引入 bug | 中 | 所有后端调用方式改变，需完整回归测试 |
| 迁移后回滚成本 | 中 | 若 PocketBay 不稳定，回滚到 Supabase 需重新同步数据 |

---

## 七、建议方案

### 方案 A：暂不迁移（推荐）

- 继续当前 Supabase 方案。
- 观望 1–2 个月，待 PocketBay 推出 managed Auth 后再评估。
- 优势：零风险、零成本，保持开发节奏。

### 方案 B：最小 PoC（激进验证）

- 在 PocketBay 部署一个最小后端服务，仅实现：匿名用户 + 邮箱注册/登录 + `saves` 表读写。
- 目标：验证部署流程、`DATABASE_URL` 连接稳定性、国内访问速度。
- 投入：约 2–3 天。
- 结果：若 PoC 通过，再决定是否全量迁移。

### 方案 C：完整迁移（当前不推荐）

- 自建完整认证系统 + 后端 API + 前端重写 + 数据库迁移。
- 投入：约 1–2 周。
- 适用时机：PocketBay 推出 managed Auth，或确实无法继续忍受 Supabase 限制。

---

## 八、决策记录

| 日期 | 决策 | 理由 |
|---|---|---|
| 2026-08-26 | 暂不完整迁移 | PocketBay 仅提供 managed PostgreSQL，缺少 Auth 服务，迁移性价比不高 |
| 2026-08-26 | 保留 PocketBay 作为备选 | 平台方向与 AI 原生工作流匹配，待 managed Auth 完善后再评估 |

---

## 九、参考链接

- PocketBay 数据库文档：https://pocketbay.com/database
- 当前后端实施计划：`docs/plans/backend-supabase-implementation-plan.md`
- 当前后端 FAQ：`docs/archive/guides/backend-faq.md`
