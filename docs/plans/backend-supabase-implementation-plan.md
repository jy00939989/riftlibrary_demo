# 归墟图书馆后端实施计划（剩余 Phase 3–5）

> 基于 2026-08-10 后端决策：Supabase + 渐进式登录 + 本地优先存档 + 详细行为统计。
> 目标：Phase 1–2 已完成归档；本文件只记录剩余未实施的 Phase 3 行为统计、Phase 4 Kimi API 代理、Phase 5 统计看板。

---

## 一、目标与范围

### 1.1 核心目标

| 目标 | 说明 |
|---|---|
| 用户身份 | 游客可继续游玩；登录后绑定云端账号 |
| 存档同步 | 登录用户自动上传本地存档覆盖云端，换设备可恢复 |
| 行为统计 | 记录 focus_start / focus_complete / visitor_arrive / book_unlock / atmosphere_upgrade 等事件 |
| API 代理 | 将 Kimi API 调用从本地 Flask 代理迁移到 Supabase Edge Function |
| 部署兼容 | 前端继续部署在 Netlify，后端托管在 Supabase |

### 1.2 非目标（本次不做）

- 多人协作 / 社交功能
- 实时排行榜
- 服务端游戏逻辑校验（仍信任客户端）
- 复杂冲突解决（采用「本地覆盖云端」简单策略）

---

## 二、技术选型

### 2.1 后端：Supabase

理由：

- 用户无编程基础，自搭 Node.js 成本过高
- 免费 tier 足够早期用户量
- 同时提供 Auth + PostgreSQL + Edge Functions + RLS
- 前端只需引入 `@supabase/supabase-js`
- 与 Netlify 部署无冲突

### 2.2 关键库

```bash
npm install @supabase/supabase-js
```

### 2.3 项目新增文件

```
js/
  backend/
    client.js          # Supabase client 初始化
    auth.js            # 登录/登出/游客状态
    sync.js            # 存档上传/下载
    analytics.js       # 行为事件上报
    api-proxy.js       # Edge Function 调用封装（Kimi API）
```

---

## 三、数据库 Schema

### 3.1 用户档案表 `profiles`

```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  created_at timestamptz default now(),
  last_login_at timestamptz default now(),
  display_name text
);
```

### 3.2 存档表 `saves`

```sql
create table saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  save_data jsonb not null,
  client_version text,
  saved_at timestamptz default now(),
  unique(user_id)
);
```

### 3.3 行为事件表 `events`

```sql
create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  anonymous_id text,           -- 游客唯一标识
  event_type text not null,    -- focus_start / focus_complete / visitor_arrive / ...
  event_data jsonb not null default '{}',
  client_timestamp timestamptz not null,
  server_timestamp timestamptz default now(),
  session_id text
);

-- 索引：按事件类型和时间查询
CREATE INDEX idx_events_type_time ON events(event_type, server_timestamp desc);
CREATE INDEX idx_events_user_time ON events(user_id, server_timestamp desc);
CREATE INDEX idx_events_anonymous ON events(anonymous_id, server_timestamp desc);
```

### 3.4 RLS 策略

```sql
-- profiles：用户只能读写自己
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own profile"
  ON profiles FOR ALL
  USING (auth.uid() = id);

-- saves：用户只能读写自己的存档
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own save"
  ON saves FOR ALL
  USING (auth.uid() = user_id);

-- events：插入允许匿名（通过 service_role），读取仅自己
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own events"
  ON events FOR SELECT
  USING (auth.uid() = user_id);
```

> 匿名事件通过 `service_role` key 从 Edge Function 写入，避免暴露高权限 key 给前端。

---

## 四、实施步骤

### Phase 1：基础接入（约 1-2 天）

✅ **已完成并归档**，详见 `docs/archive/plans/backend-supabase-implementation-plan-completed.md`。

当前状态：`js/backend/client.js`、`js/backend/auth.js` 已存在；匿名/邮箱登录、注册、密码重置、登出均已实现。

### Phase 2：存档同步（约 2-3 天）

✅ **已完成并归档**，详见 `docs/archive/plans/backend-supabase-implementation-plan-completed.md`。

当前状态：`js/backend/sync.js`、`account-ui.js` 中的云端同步 UI 已实现；登录用户可上传/下载存档。

### Phase 3：行为统计（约 2 天）

1. **封装事件上报**
   - `track(eventType, eventData)`
   - 登录用户带 `user_id`
   - 游客带 `anonymous_id`

2. **在关键埋点调用**

| 事件 | 位置 | 数据 |
|---|---|---|
| `focus_start` | `app.js handleStartFocus` | mode, targetMinutes, bookId |
| `focus_complete` | `app.js handleCompleteFocus` | minutes, words, coins, bookId |
| `focus_abandon` | `app.js handleAbandonFocus` | elapsedSeconds |
| `book_unlock` | `shop.js purchaseBook` | bookId, price |
| `book_complete` | `app.js handleCompleteFocus` | bookId, copyCount |
| `visitor_arrive` | `visitors.js spawnVisitor` | charId |
| `visitor_return` | `app.js handleCollectReturn` | charId, reward |
| `atmosphere_upgrade` | `storage.js addAtmosphere` | from, to, source |
| `purchase_shelf` | `app.js handleBuyShelf` | price |
| `purchase_focus_level` | `shop.js upgradeFocusLevel` | level, price |
| `purchase_borrow_level` | `shop.js upgradeBorrowLevel` | level, price |
| `tutorial_complete` | `intro.js / tutorial.js` | step |
| `achievement_unlock` | `achievements.js` | achievementId |

3. **批量与降级**
   - 事件先写入本地 `pending_events` 队列
   - 网络可用时批量上报
   - 上报失败则保留，下次重试

### Phase 4：Kimi API 代理迁移（约 1-2 天）

1. **创建 Edge Function `kimi-proxy`**
   - 转发请求到 Moonshot API
   - 服务端保存 `MOONSHOT_API_KEY`
   - 记录 token 用量，接近上限告警

2. **前端替换**
   - 将 `C:/kimi-proxy/proxy.py` 的调用改为 `js/backend/api-proxy.js`
   - 统一错误处理

3. **鉴权**
   - Edge Function 可选校验 `anon` token，防止裸爬
   - 初期不做强限制，后续加 rate limit

### Phase 5：统计看板（约 2-3 天，可选）

1. 使用 Supabase Dashboard 或简单 SQL 查询查看：
   - DAU / WAU
   - 平均专注时长
   - 最受欢迎书籍
   - 氛围升级漏斗

2. 如需可视化，可后续接入 Metabase 或自建小面板。

---

## 五、安全与隐私

1. **API Key 管理**
   - `SUPABASE_ANON_KEY` 可暴露在前端
   - `SUPABASE_SERVICE_ROLE_KEY` 只用于 Edge Function 环境变量
   - `MOONSHOT_API_KEY` 只存在于 Supabase 服务端

2. **数据最小化**
   - 不收集用户真实姓名、邮箱内容
   - OAuth 只获取公开 profile
   - 行为事件不包含用户输入的敏感文本

3. **RLS**
   - 所有用户数据表启用 RLS
   - 匿名事件通过 service_role 写入，避免前端直接写

---

## 六、回滚策略

| 风险 | 应对 |
|---|---|
| Supabase 不可用 | 前端继续走 localStorage 纯本地模式，提示「云端同步暂停」 |
| 同步损坏存档 | 上传前本地自动备份；提供「恢复上次本地备份」 |
| 登录后数据被覆盖 | 首次同步时弹窗确认「本地覆盖云端 / 云端覆盖本地 / 稍后决定」 |
| 事件上报失败 | 本地队列保留，不阻塞游戏流程 |
| Edge Function 超时 | 前端 fallback 到本地简单逻辑或提示稍后重试 |

---

## 七、验收标准（剩余 Phase）

- [ ] 专注完成、购买、访客等关键事件成功写入 `events` 表
- [ ] Kimi API 调用通过 Supabase Edge Function 成功返回
- [ ] 断网时游戏可继续游玩，联网后自动补报事件
- [ ] `node --check` 与现有构建流程无报错
- [ ] 部署到 Netlify 后功能正常

---

## 八、时间估算（剩余 Phase）

| Phase | 天数 |
|---|---|
| Phase 3 行为统计 | 2 |
| Phase 4 Kimi 代理 | 1-2 |
| Phase 5 统计看板 | 2-3（可选） |
| **总计** | **5-7 天** |

---

## 九、相关文件

- `js/state.js`
- `js/persistence.js`
- `js/settings.js`
- `js/app.js`
- `js/shop.js`
- `js/visitors.js`
- `js/achievements.js`
- `js/storage.js`
- 新增：`js/backend/client.js`, `js/backend/auth.js`, `js/backend/sync.js`, `js/backend/analytics.js`, `js/backend/api-proxy.js`
