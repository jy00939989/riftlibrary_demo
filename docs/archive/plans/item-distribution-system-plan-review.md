# 道具分发系统计划 · 架构评审

> 评审对象：`riftlib-planner/docs/plans/item-distribution-system-plan.md`
> 代码库：`library_demo-feature-docs-organized`（2026-08-26 快照）
> 评审人：buddy（Software Architect）

---

## 总评

方向对（兑换码+背包+道具是测试用户运营的必要基础设施），与已有 Supabase 后端的衔接也有基础。但这份计划**低估了与现有系统的碰撞面**——标志牌 buff 机制不是多态的、DLC 兑换码系统已有客户端版、道具效果的落地细节有多处实现歧义。按计划字面动手，至少有 2 处会"改完发现不生效"、1 处会变成两套并行兑换系统。

---

## 已核实事实表

| 计划断言 | 代码实测 | 结论 |
|---|---|---|
| 标志牌 `buff: { type: 'focus_speed', value: 0.03 }` 会生效 | `library-upgrades.js:28-30` `getSignboardSpeedBonus()` 硬编码只读 `keep_quiet`，**不遍历 buff.type** | ❌ **新标志牌 buff 不会自动生效** |
| `data/dlc_packs.js` 有 `REDEEM_CODES` | `data/dlc_packs.js:27-30` + `js/core/shop/dlc-packs.js:123-147` 完整客户端兑换流程（`BETA2026`/`ALPHA_RIFT`） | ✅ 存在，但计划未决定合并/共存 |
| `data/items.js` 需新建 | 全代码库无 `data/items.js`、无 `inventory`/`backpack` state | ✅ 确认不存在 |
| 背包系统需新建 | `grep` 全代码库无 `backpack`/`inventory`/`行囊` | ✅ 确认不存在 |
| Supabase 后端已有 | `js/backend/` 含 `client.js`/`auth.js`/`account-ui.js`/`sync.js` | ✅ 存在 |
| `supabase/functions` 需新建 | `supabase/` 目录不存在 | ✅ 需从零创建 |
| 修复书籍机制存在 | `book-progress.js:111-126` 渐进修复（`repairProgress += wordsGained`） | ✅ 存在，但计划未指定 instant repair 实现路径 |
| `visitorFavors` cap | `visitors.js:667` `FAVOR_CAP = 600` | ✅ +20 好感会自动被 min 截断 |
| 标志牌去重 | `signboards.js:13` `purchaseSignboard` 检查 `hasSignboard(id)` | ✅ 已有去重 |

---

## 🔴 P0 — 标志牌 focus_speed buff 不生效（写完等于白写）

### 问题

`data/signboards.js` 定义了 `buff: { type: 'focus_speed', value: 0.01 }`，看起来是多态的——只要加一个同 type 的标志牌就能叠加。**实际不是。**

`library-upgrades.js:28-30`：
```js
function getSignboardSpeedBonus() {
  return hasSignboard('keep_quiet') ? (SIGNBOARDS.keep_quiet?.buff?.value || 0) : 0;
}
```

它**硬编码读 `keep_quiet` 一个 ID**，不遍历 `state.signboards`、不按 `buff.type` 聚合。所以计划里的 `pioneer_ink`（`focus_speed +0.03`）和 `opening_plaque`（`focus_speed +0.02`）加进去后，**data 里有了、state 里有了，但 focus 速度不会变**。

同问题也影响 `book-shop.js:154`（硬编码 `curator_pick`）、`focus-orchestrator.js:153`（硬编码 `welcome`）。整个标志牌系统是"数据看起来通用、代码全走硬编码"。

### 修订（必须选一个）

- **(A) 改成通用聚合（推荐）**：`getSignboardSpeedBonus()` 遍历 `state.signboards`，对每个 ID 查 `SIGNBOARDS[id]?.buff`，若 `type === 'focus_speed'` 则累加 `value`。同理 `focus-orchestrator` 里 `welcome` 的 `spawn_chance` 也走通用聚合。一次性解决，未来任何 `focus_speed`/`spawn_chance` 标志牌自动生效。
- **(B) 继续硬编码**：在 `getSignboardSpeedBonus()` 里加 `hasSignboard('pioneer_ink') ? 0.03 : 0` 和 `hasSignboard('opening_plaque') ? 0.02 : 0`。快但每加一种标志牌改一处代码。

### 影响

不改的话，先驱者的墨印和开馆纪念牌**没有实际游戏效果**，玩家领了等于白牌。10 个限量纪念品变成纯装饰。

---

## 🔴 P0 — 两套兑换码系统并行（计划未决定合并）

### 问题

`js/core/shop/dlc-packs.js` 已有完整客户端兑换流程：
- `redeemDlcCode(code)` → 查 `REDEEM_CODES` → 解锁 pack → 写 `state.dlcPacks.redeemedCodes`
- 码 `BETA2026` / `ALPHA_RIFT` 目前在用

计划 §14 Phase 1+2 step 2 写"扩展 `data/dlc_packs.js` 的 `REDEEM_CODES` 结构**或**迁移到新的统一兑换码系统"——**这是"或"，不是决策**。实现时一定会有人问：DLC 码走旧系统还是新系统？

### 风险

- 如果两系统并存：玩家在账号面板有"兑换礼包"按钮（新系统），DLC 面板也有兑换入口（旧系统），**同一游戏两个兑换入口**，UI 分裂。
- 如果旧码迁移到新系统：需要后端为 `BETA2026`/`ALPHA_RIFT` 也建 `redeem_codes` 行，且旧客户端逻辑要废弃，否则客户端验证能绕过后端。
- 如果不迁移：旧码继续走客户端验证（无后端校验），任何人看到码就能用——对免费 DLC 包可能无所谓，但破坏了"后端校验"的一致性叙事。

### 修订

**必须拍板（三选一）**：
- **(A) 统一到新系统**：将 `BETA2026`/`ALPHA_RIFT` 插入 `redeem_codes` 表，废弃 `dlc-packs.js:redeemDlcCode()`，前端统一走 Edge Function。最干净但改大。
- **(B) 双系统共存，明确边界**：DLC 码（仅解锁书籍包）走旧客户端系统，道具/纪念牌走新后端系统。UI 上分两个入口但文案明确区分。改动最小。
- **(C) 先做新系统，旧系统标记 deprecated**：本次不改旧系统，但 `dlc-packs.js` 顶部加 `@deprecated` 注释，Phase 3 再统一。

---

## 🟠 P1 — 道具效果落地歧义（3 处"写什么"不够精确）

### 1. 鼠须笔/鸡距笔/紫毫笔：加字数后怎么触发完成？

计划写"若使用后排版完成，正常触发 `completeBook` 后续事件与奖励"——但没写**谁负责检测**。

当前 `completeBook()` 是由专注结束时的 `advanceBookProgress()` 触发（`book-progress.js:25` 检查 `projectedEffective >= totalWords`）。笔道具直接加 `bookState.copiedWords += 10000` 后，如果跨过了 `totalWords`，**没人调 `completeBook`**——字数到了但书不完成，状态不一致。

**修订**：道具使用逻辑里必须显式检查：
```js
bookState.copiedWords += brushWords;
const effective = getEffectiveCopiedWords(bookState, book.totalWords);
if (effective >= book.totalWords) {
  completeBook(bookId);  // 或 advanceBookProgress 的等价逻辑
}
```
计划需补这段。

### 2. 修缮符：即时修复的实现路径

当前修复是渐进的：`book-progress.js:119` `repairProgress += wordsGained; if (repairProgress >= repairWords) { damaged = false }`。

修缮符"一次性完全修复"有两条路径：
- **(a)** 设 `bookState.repairProgress = bookState.repairWords` → 触发自然完成逻辑（含 `checkDamageComplete` 的后续效果）
- **(b)** 直接设 `bookState.damaged = false; bookState.repairWords = 0; bookState.repairProgress = 0` → 跳过渐进逻辑

路径 (a) 更安全（复用已有完成逻辑），但需要调 `repairBook()` 函数。路径 (b) 更直接但有遗漏风险（漏掉完成时的 `addAtmosphere(1)` 和 `addHistory`）。

**修订**：计划指定用 (a)（设 `repairProgress = repairWords` 再调 `repairBook()`），确保完成奖励不漏。

### 3. 心意便签：对"不在馆"的访客能用吗？

计划写"指定单个访客 +20 好感"——但没限定访客是否需要"当前在馆"。`visitorFavors` 是全局的（`state.visitorFavors[charId]`，不依赖在馆状态），技术上可以对任意角色用。但 UX 上：选择器是只显示在馆访客（当前 UI 有现成列表），还是显示全部角色（需要新 UI）？

**修订**：计划明确选择器范围——建议**全部角色**（好感系统是永久的，不限在馆；且选择器可复用现有 visitor 列表 UI）。

---

## 🟠 P1 — 缺 state schema 定义

计划定义了数据库表（`redeem_codes`/`user_redeems`），但**没定义客户端 state 的新字段**：

- `state.inventory`：消耗型道具背包——结构是什么？`{ [itemId]: count }` 还是 `Array<{itemId, count}>`？前者去重天然、后者有序。
- `state.redeemedCodes`：与 `state.dlcPacks.redeemedCodes` 的关系？并存还是合并？
- `state.signboards` 新 ID（`pioneer_ink_001` 等）：迁移脚本需兜底初始化（旧存档无新标志牌 ID 是正常的，但需要 `data/signboards.js` 有对应定义）。

**修订**：计划补一节"客户端 state schema"，至少定义 `inventory` 结构和迁移逻辑。

---

## 🟠 P1 — Supabase Edge Function 从零搭建的工作量被低估

计划列了"创建 Edge Function `redeem-code`"作为 Phase 1+2 的一个 checklist 项，但：
- `supabase/` 目录不存在，需要 `supabase init` + `supabase functions` 骨架
- 本地开发需要 `supabase CLI` + Docker（测试 Edge Function）
- 部署需要 `supabase functions deploy` + 环境变量配置
- RLS 策略需要 SQL migration（计划没给 SQL）
- `service_role` key vs `anon` key 选择没定（service_role 绕过 RLS，anon 受 RLS 约束）

这些不是"一个 checklist 项"能覆盖的——参照之前 `backend-supabase-implementation-plan-review.md` 里同样的问题，那篇最终建议加 `supabase/` 初始化为独立 Phase。

**修订**：Phase 1+2 拆出"Supabase 基础设施准备"子步骤（init + local dev + deploy + RLS SQL），并标明用 `service_role` key 还是 `anon` key + RLS。

---

## 🟡 P2 — 安全：缺 rate limiting

计划写"不加验证码（记入技术债）"——OK，CAPTCHA 确实可以后加。但**rate limiting** 比 CAPTCHA 简单得多且应是最底线：

- Edge Function 应检查同一 `user_id` 每分钟最多 5 次兑换尝试
- 或同一 IP 每分钟最多 10 次（匿名用户更难限制）

否则暴力枚举虽因 keyspace 大（31^12 ≈ 10^17）而实际不可行，但频繁无效请求会消耗 Edge Function 配额和数据库连接。

**修订**：Edge Function 加简单 rate limit（计数器或 Supabase pg_rate_limit），不记技术债。

---

## 🟡 P2 — pioneer_ink_001~010 需 10 个独立标志牌定义

计划写 ID 范围 `pioneer_ink_001` ~ `pioneer_ink_010`，但 `data/signboards.js` 是对象结构 `SIGNBOARDS = { keep_quiet: {...}, ... }`。10 个限量编号 = 10 个独立 key，每个 stats 相同但 ID 不同。

当前代码里没有"同类型不叠加"机制——`state.signboards` 是纯 ID 数组，`hasSignboard(id)` 只看单个 ID。计划写"每个账号最多持有一个，同类型不叠加"，但**代码里没有"类型"概念**。

**修订**：二选一——
- **(A)** 只做一个 `pioneer_ink` ID（不做编号），兑换时写入 `state.signboards`，天然最多一个。限量靠后端 `max_uses` 控制，不靠 10 个 ID。简单。
- **(B)** 做 10 个 ID，但 `hasSignboard()` 加"类型前缀"聚合去重（`pioneer_ink_*` 算同类型，只能持有一个）。更复杂但保留"编号唯一"叙事。

如果编号唯一只是运营需要（知道哪个码给了谁），那 **(A) 更好**——`user_redeems` 表已经记录了哪个用户兑换了哪个码，编号信息在后端而不在客户端 state。

---

## 🟡 P2 — reward_json 示例有误导

§11 响应示例：
```json
"seeds": { "bird_of_paradise": 0, "magic_rose": 2 }
```

`bird_of_paradise: 0` 意义不明——0 颗种子为什么要放进响应？且 `starlight_fern` 未出现。§8 先驱者礼包内容写的是"星光蕨种子 × 2"，示例里应该是 `starlight_fern: 2` 而非 `magic_rose: 2`。

**修订**：示例改为只返回非零项 `"seeds": { "starlight_fern": 2 }`。

---

## 🟡 P2 — 计划 §13 埋点与现有 track() 不一致

现有 `js/backend/analytics.js` 有 `track(event, props)` 函数（已在 `dlc-packs.js` 使用 `track('redeem_dlc_code', ...)`）。计划写 `track('redeem_code_success', ...)`——OK，但应与旧事件名对齐或明确区分。建议用 `redeem_code_success`（新系统）和 `redeem_dlc_code`（旧系统）并存直到合并。

---

## 🟢 好的地方

1. **16 位码+排除易混淆字符**——实用，keyspace 足够大
2. **区分永久/限时有效期**——PIONEER 永久、GIFT 90 天，合理
3. **"兑换失败统一提示不暴露原因"**——安全实践正确
4. **Netlify 部署预算意识**——Phase 1+2 合并一次部署，省分
5. **灰度发放**——先 1-2 人再铺开，稳
6. **revoked 字段**——兜底发错码场景

---

## 决策清单

| # | 问题 | 选项 | 推荐 |
|---|---|---|---|
| 1 | 标志牌 buff 机制 | (A) 改通用聚合 (B) 继续硬编码 | **A** |
| 2 | DLC 兑换码与新系统 | (A) 统一到新系统 (B) 双系统共存 (C) 标记 deprecated 后续统一 | **B**（改动最小，Phase 3 再统一） |
| 3 | 笔道具触发完成 | 谁负责检测 completeBook？ | 道具使用逻辑内显式检查 |
| 4 | 修缮符实现路径 | (a) 设 repairProgress=repaired 再调完成 (b) 直接设 damaged=false | **a** |
| 5 | 心意便签选择器范围 | 仅在馆访客 / 全部角色 | **全部角色** |
| 6 | pioneer_ink 编号 | (A) 单 ID (B) 10 个独立 ID + 类型去重 | **A**（限量靠后端） |
| 7 | Edge Function key | service_role 绕过 RLS / anon key + RLS | **service_role**（Edge Function 本身就是鉴权层） |
| 8 | rate limiting | 本次加 / 技术债 | **本次加**（简单计数器即可） |
| 9 | state.inventory 结构 | `{ [itemId]: count }` / `Array` | **`{ [itemId]: count }`**（去重天然） |
