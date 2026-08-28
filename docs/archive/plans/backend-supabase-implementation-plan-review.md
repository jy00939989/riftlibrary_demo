# 架构评审：《归墟图书馆后端实施计划（Supabase）》

> 评审对象：`docs/plans/backend-supabase-implementation-plan.md`
> 评审基线：当前代码库实测（2026-08-13 状态）
> 评审风格：严重度分级 + 修订表 + ADR 草案 + 决策清单（对齐此前两份 review）

---

## 〇、总评

方向正确：Supabase + 本地优先 + 游客兼容 + `service_role` 代理 Kimi API，这套选型对一个无后端经验的单人项目是合理的，战略层（先不碰服务端校验、本地覆盖云端、游客事件用 anonymous_id）也克制。

但有一处**阻断性问题**和一组**锚点失效**会让计划"照着抄"时踩坑：

1. **计划写于 god-module-split 重构之前**。代码库现在已被部分拆分——`state` 拆进 `js/state/`、`shop` 逻辑搬进 `js/core/shop/`、`focus` 搬进 `js/core/`。计划的文件/函数锚点约一半已失效。
2. **项目无构建工具链**（无 vite、无依赖、纯静态原生 ESM）。计划 §2.2 `npm install @supabase/supabase-js` + §2.3 裸模块名 import，**在当前工程模型下直接失败**——这是 P0。

好消息：我之前在 god-split review 里提的"迁移版本门控 runner"**已经被落地**（`js/state/migrations.js` 存在），说明克克在按评审改。

---

## 一、已核实事实（代码实测背书，非空谈）

| 断言 | 实测结果 |
|---|---|
| 有无构建工具 | `package.json` 无 dependencies、无 vite；dev 用 `python3 -m http.server`。**纯静态原生 ESM**（`index.html` 用 `<script type="module" src="js/app.js">`） |
| `js/state/` 是否拆分 | **已拆**：`js/state/state.js`(定义) / `js/state/save.js`(saveState) / `js/state/migrations.js`(迁移 runner) |
| `js/shop.js` 现状 | 仅 **545 字节薄壳**；`purchaseBook`→`js/core/shop/book-shop.js:161`；`upgradeBorrowLevel`/`upgradeFocusLevel`→`js/core/shop/library-upgrades.js:14/40` |
| 存档管理器 | `js/save-manager.js` 已存在（导出文件 / 剪贴板存档码），**计划未提及** |
| `addAtmosphere` 锚点 | 确实仍在 `js/storage.js` ✅ |
| `handleStartFocus/Complete/Abandon/BuyShelf/CollectReturn` | 仍在 `app.js:57/135/158/164/182`，但现在是**薄壳**，真逻辑在 `js/core/`（`handleCompleteFocus` 调 `coreCompleteFocus` + `runFocusOrchestration`） |
| `js/backend/` | 尚不存在 |

---

## 二、问题分级

### 🔴 P0 — 阻断性：无构建工具，`@supabase/supabase-js` 无法按计划引入

**问题**：计划 §2.2/§2.3 默认 `npm install @supabase/supabase-js` 后 `import { createClient } from '@supabase/supabase-js'`。但当前工程**没有打包器**，浏览器原生 ESM 无法解析裸模块名 `@supabase/supabase-js`。§2.3 新增的 5 个 `js/backend/*.js` 全部依赖它，Phase 1 第 2 步会直接卡死。同时"前端继续部署在 Netlify"从"丢静态文件"变成"需要构建"，部署模型被静默改变。

**修订（三选一，都写进计划）**：
- **(A) importmap + esm.sh（最省事，推荐给无编程基础）**：在 `index.html` 加
  ```html
  <script type="importmap">
  { "imports": { "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2" } }
  </script>
  ```
  零构建、一个 `<script>` 标签搞定；代价是运行时依赖 CDN（断网/esm.sh 抖动时 SDK 加载失败，需 fallback 到纯本地模式）。
- **(B) 本地 vendoring ESM（离线最稳）**：把 supabase-js 的 ESM 构建下载进 `js/lib/supabase.js`，`js/backend/client.js` 用**相对路径** `import { createClient } from '../lib/supabase.js'`。保持无构建、无运行时 CDN；代价是要手动跟进版本更新。
- **(C) 加 Vite 构建**：最"正规"但彻底改变工程（dev/build 命令、Netlify build 配置、发布目录），对一个 hobby 项目负担最大，**不推荐**。

**推荐 A 或 B**。无论哪个，计划必须明确，否则 Phase 1 无法启动。

### 🔴 P0/P1 — 存档流程已漂移，计划 hook 点失效

**问题**：§Phase 2 假设"在 `app.js` 关键操作后自动触发 `uploadSave`"并要改 `js/state.js` + `js/persistence.js`。但现在的存档真正入口是 `saveState()`（`js/state/save.js`），且已有 `js/save-manager.js`。在散落的 handler 里挂上传既重复又易漏（任何一处 save 忘了挂就不同步）。计划还**漏提了 `save-manager.js` 与 `js/state/` 三件套**，把"改 state.js"当成存档逻辑落点已不准确。

**修订**：把 `uploadSave` 挂到 `saveState()` 这一**单一持久化出口**（debounce 一次/数秒），自动覆盖所有存档触发点；`downloadSave` 在登录成功后从这里注入即可。计划 §9 文件清单补 `js/state/save.js`、`js/save-manager.js`，删/改对 `js/state.js` 的单点假设。

### 🟠 P1 — Phase 3 埋点表锚点约一半失效

**问题**：§Phase 3 埋点表写 `shop.js purchaseBook` / `upgradeFocusLevel` / `upgradeBorrowLevel`、`state.js`——这些路径已变（`js/core/shop/book-shop.js`、`js/core/shop/library-upgrades.js`、`js/state/`）。且 `app.js` 的 `handleXxx` 是薄壳，真上下文（mode / bookId / minutes / reward）在 `js/core/` 函数返回处才完整；把 `track()` 挂在 `app.js` 壳层拿不全字段。

**修订**：埋点表改为指向 `js/core/shop/book-shop.js`(`purchaseBook`)、`js/core/shop/library-upgrades.js`(`upgradeXxxLevel`)、`js/core/focus-session.js` / `js/core/focus-orchestrator.js`(focus_start/complete/abandon/book_complete)、`js/visitors.js`(`spawnVisitor`)、`js/storage.js`(`addAtmosphere`)、`js/core/book-progress.js`(book_unlock 若在此) 等真实落点，并在 core 函数"拿到完整 result 后"调用 `track()`。

### 🟠 P1 — `events` 表缺 INSERT RLS 策略（匿名事件直写会失败）

**问题**：§3.3 的 RLS 只给了 `events` 的 SELECT 策略，**没有 INSERT 策略**。§Phase 3 说事件先入本地 `pending_events` 队列、联网后"批量上报"——若"上报"= 前端用 anon key 直插 Supabase，RLS 会直接拒绝，事件一个都写不进。计划既没补 INSERT 策略，也没明确"所有事件都走 Edge Function(service_role)"。

**修订（二选一，必须写清）**：
- **(A) 直连 anon + 补策略**：加
  ```sql
  CREATE POLICY "Anon/user can insert events"
    ON events FOR INSERT
    WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
  ```
  前端用 anon key 直插，零函数成本。
- **(B) 全走 Edge Function**：所有 `track()` 经 `api-proxy` 类函数用 `service_role` 写，前端永不直连 `events`。代价是每个事件多一跳延迟/函数调用费。

### 🟠 P1 — Kimi 代理鉴权"可选"= 真金白银漏洞

**问题**：§Phase 4.3 把 Edge Function 鉴权写成"可选校验 anon token，初期不做强限制"。Moonshot 按 token 计费，开放函数会被裸爬/恶意刷量直接烧你的 API 额度。

**修订**：**强制**至少两层——(1) 来源校验（Supabase anon JWT 或你的前端 Origin 白名单）；(2) 按 `anonymous_id`（或用户）**限速**（如每 IP/每匿名 id 每日 N 次）。写进计划，不要"可选"。

### 🟡 P2 — OAuth 回调 / redirect URL 未规划

**问题**：§Phase 1 Auth 只列了 `signInWithOAuth/signOut`，但 SPA 用 OAuth 必须：(1) 在 Supabase 后台登记 redirect URL；(2) 处理回调（Supabase JS v2 PKCE 模式下需 `getSessionFromUrl()` 或自动检测 hash）。计划对"重定向回来后落在哪个页面、游戏态是否丢失"只字未提。

**修订**：补"配置 redirect URLs + 回调落点"步骤；说明游戏态在 localStorage 已持久化，重定向不丢档，回站后照常读取。

### 🟡 P2 — `profiles` 自动建行未规划

**问题**：§3.1 `profiles` 靠 `auth.users` 级联，但 Supabase **不会**自动建 profile 行。登录后 `last_login_at`/`display_name` 无处写。

**修订**：加 DB trigger（`on auth.users insert` 写 profiles）或 `auth.js` 登录后补建。

### 🟡 P2 — "数据最小化"与存档同步自相矛盾

**问题**：§5 承诺"不收集用户输入的敏感文本"，但 §Phase 2 的 `saves` 表存的是**整份 localStorage**——包含图书馆名、墨墨日志 diary 文本、访客便签等用户原创内容。这是用户自己的存档，存云端可接受，但计划应坦白：**最小化只适用于 `events` 表**，云端存档必然含用户文本，两者口径不同。

### 🟡 P2 — 回滚提示依赖尚未就绪的渲染通道

**问题**：§6 回滚说"提示『云端同步暂停』"。但错误态要上屏依赖 toast/UI 层；而 god-split 评审里我标过的"re-render 触发机制"若未落地，sync 失败状态可能没法显示。

**修订**：明确 sync 模块只暴露状态（如 `syncStatus: 'idle'|'syncing'|'error'`），由**现有** UI（如 `save-manager.js` 面板）展示，不依赖新渲染系统。

### 🟢 战略层 — 时间估算偏乐观 + 与 god-split 的依赖关系

8–12 天对一个无编程基础用户偏乐观：构建工具决策（P0）、OAuth、Edge Function 部署各耗時。且后端应建在 god-split **已完成**的架构上——否则 hook 点还会随拆分继续漂移。建议：**先收尾 god-split（尤其 re-render 机制 + save 编排），再启动后端**。

---

## 三、ADR 草案

### ADR-BE-1：Supabase SDK 引入方式
- **状态**：待定
- **上下文**：工程为纯静态原生 ESM、无打包器。需让 `@supabase/supabase-js` 可用。
- **决策**：推荐 **importmap+esm.sh**（A）或 **vendoring ESM**（B），拒绝加 Vite（C）。
- **后果**：A 引入运行时 CDN 依赖（需纯本地 fallback）；B 需手动跟版本；两者都保持"丢静态文件即可部署"。

### ADR-BE-2：存档同步 hook 点
- **状态**：建议
- **上下文**：存档入口已收敛到 `saveState()`，且 `save-manager.js` 已做导出。
- **决策**：`uploadSave` 挂在 `saveState()` 单一出口（debounce），不散挂各 handler。
- **后果**：所有 save 自动触发同步；但 `saveState` 调用频率需 debounce，避免每次小改动都打网络。

### ADR-BE-3：匿名事件写入路径
- **状态**：待定
- **上下文**：`events` 表 RLS 无 INSERT 策略。
- **决策**：选 (A) 直连 anon+补 INSERT 策略，或 (B) 全走 Edge Function。
- **后果**：A 零函数成本但暴露直写面（靠 RLS 守）；B 安全但每事件多一跳。

### ADR-BE-4：Kimi 代理鉴权强度
- **状态**：建议强制
- **上下文**：Moonshot 按 token 计费，开放函数=烧钱。
- **决策**：强制 Origin/anon-JWT 校验 + 每匿名 id 限速；不"可选"。

---

## 四、决策清单（需图南/克克拍板）

1. Supabase 引入方式：importmap+esm.sh / vendoring ESM / 加 Vite？——**我推 A 或 B（保持无构建）**
2. 同步 hook 点：saveState 集中 / 各 handler 散挂？——**我推 saveState 集中**
3. 匿名事件：直连 anon+补 INSERT 策略 / 全走 Edge Function？——**需拍板**
4. Kimi 代理鉴权：强制（Origin+限速）/ 真可选？——**我推强制**
5. 后端启动前置：先收尾 god-split / 并行启动？——**我推先收尾**

---

## 五、建议修订后实施顺序

1. **先收尾 god-split**：re-render 机制 + save 编排（否则后端 hook 点会继续变）。
2. **后端 Phase 1 前置决策**：定 ADR-BE-1（引入方式）+ ADR-BE-4（Kimi 鉴权强度）。
3. **Phase 1**：Supabase 项目 + client + Auth + OAuth 回调 + profiles 建行（ADR 补）。
4. **Phase 2**：按 ADR-BE-2 把 sync 挂 `saveState`；补 `js/state/save.js`/`save-manager.js` 到文件清单。
5. **Phase 3**：埋点表锚点更新到 `js/core/*`；按 ADR-BE-3 定事件写入路径 + 补 RLS。
6. **Phase 4**：Edge Function + 强制鉴权 + 限速。
7. **Phase 5**：看板（可选）。

---

## 六、落地自检建议

- 所有改动 `js` 跑 `node --check`（现有工程无 bundler，node --check 仍是语法兜底）。
- 验收标准补一条：**断网/SDK 加载失败时游戏完全回退纯本地**，不白屏、不卡死。
- 验收标准补一条：**游客事件能写 `events` 表**（验证 ADR-BE-3 选的路径真通）。
