# 神模块拆分实施计划 · 架构评审

> 文档状态：评审稿 v1.0  
> 评审对象：`docs/plans/god-module-split-full-implementation-plan.md`（克克，2026-08-11）  
> 评审人：架构通（Software Architect）  
> 日期：2026-08-11  
> 范围：整体架构方向、分阶段策略、关键缺口与待拍板决策

---

## 一、总评

方向正确、分阶段合理、薄 shim 向后兼容的设计也对，且文档对"render 直接改 state"的诊断**经得起代码核对**（见第二节）。

但存在一个**结构性缺口会让核心目标（"render 不直接改 state"）根本落不了地**，外加若干"延后决策"和"边界模糊"应在规划期拍板、而非实现期补救。评审按严重度排序，给出可落地的修订建议与三条 ADR 草案。

**结论**：保留分阶段骨架，但必须先补 §三 P0 的"重渲染触发机制"与"迁移版本门控"，并把 §四 的若干延后决策前置拍板。推荐路径见 §六。

---

## 二、已核实事实（评审依据，非空谈）

| 断言 | 文档说法 | 代码实测 | 结论 |
|---|---|---|---|
| 行数 | state 687 / app 1487 / shop 335 / render/focus 899 / render/shop 917 | 686 / 1486 / 334 / 898 / 916 | ✅ 一致（差 1 行=末尾换行） |
| §7.4 render 直接改 state 行号 | focus 228/230/252/257/306；shop 622-624；bookshelf 488/503-504/506；achievements 69-89 | 全部精确命中（focus 228/230/252/257/306；shop 622-623；bookshelf 488/506；achievements 72/73/80） | ✅ 诊断可信 |
| 存储文件归属 | §4.2 用 persistence.js；§14 又列 storage.js | 两文件**并存** | ⚠️ 边界模糊（见 P1-5） |
| 状态订阅/通知机制 | §9.2 写"render 响应 state 变化重新渲染" | 全代码库无 `subscribe/onStateChange/eventBus/emit/dispatch` | 🔴 机制缺失（见 P0-1） |

---

## 三、关键问题（按严重度）

### 🔴 P0-1 — 阻断性：缺"状态变化 → 重渲染"触发机制

**问题**：§9.2 数据流图末端声称"render 响应 state 变化重新渲染"，但代码实测**无任何订阅/通知机制**。当前是命令式：core/app 改完 state 后**显式调用** `renderXxx()`。

**风险**：Phase 3/4 的口号是"core 不碰 DOM、render 纯渲染"。一旦把渲染调用从 core 摘除，又没有订阅机制，结果就是——state 已改、屏幕不刷新。这正是此类重构最易翻车处，而验收标准"无回归"无法定义"谁触发重渲染"。

**修订（必须二选一并写进计划）**：
- **(A) 显式回流（评审推荐）**：core action 返回 domain result；由 `focus-orchestrator` / `actions` 在调完 core 后**显式触发**对应 `renderXxx()`。本质保留命令式渲染，仅把触发点从散落各处集中到 orchestrator。改动最小、无新概念。
- **(B) 轻量发布订阅**：给 state 包一层 `subscribe(fn)`，core 改完 notify。代价：引入全局观察者 + 需防无限循环。

> 游戏是 vanilla 命令式 UI，无框架帮你 diff，硬上 (B) 反增复杂度。**无论选哪个，计划必须写明**，否则 Phase 4 验收无据。

### 🔴 P0-2 — 迁移机制是半成品（§4.2）

**问题**：§4.2.2 让 `migrations.js` "末尾设 `_schemaVersion=1` 并 save"，但 migrations 目前**每次加载无条件全跑**。一旦加 v2，必须加载时判断 `state._schemaVersion < 2` 才跑——版本门控 runner 现在就该建，哪怕只有 v1。

**修订**：
```js
// js/state/migrations.js
const MIGRATIONS = [
  { version: 1, up },   // 现有全部迁移逻辑
  // { version: 2, up }, // 未来在此追加
];
export function runMigrations(state) {
  while ((state._schemaVersion ?? 0) < MIGRATIONS.length) {
    MIGRATIONS[state._schemaVersion ?? 0].up(state);
    state._schemaVersion = (state._schemaVersion ?? 0) + 1;
  }
  saveState();
}
```
这才能让 §2 目标"新增迁移只改一个文件"真正成立。

### 🟠 P1-1 — 共享 core 地基未分配 Phase（§3 有，§4-8 无）

**问题**：`core/economy.js`（金币/氛围/灵感/价格）与 `core/book-progress.js`（书籍进度/章节解锁）在目标架构出现，但 Phase 2（shop）与 Phase 3（focus）**都依赖它们**，却无 Phase 先行创建。实现时必被随手塞进 shop.js 或 focus——god module 换壳重生。

**修订**：加 Phase 0（或并入 Phase 1），先落地这两个共享地基，作为 shop/focus 的公共契约。

### 🟠 P1-2 — 重复逻辑未定 single source of truth（§5.2 注）

**问题**：§5.2 自承 `economy.js` 已有参数化版 `getFocusSpeedMultiplier` / `hasSignboard`，却写"本阶段评估是否替换调用"——延后决策，但映射表已定。评估与映射应同时定。

**修订（现在拍板）**：`economy.js` 为 canonical；shop.js 内联旧版价格/倍数函数在 Phase 2 末全部删除。计划补一句："Phase 2 完成后，shop.js 内联价格与倍数函数删除，统一走 economy.js。"

### 🟠 P1-3 — persistence vs storage 边界模糊（§4.2 vs §14）

**问题**：`js/storage.js` 与 `js/persistence.js` 并存（已核实）。§4.2 让 `state/save.js` 从 persistence.js 导入 `save/STORAGE_KEYS`，又说 save.js 拥有序列化——`storage.js` 究竟干嘛？**谁是 localStorage 唯一 owner？**

**修订**：明确分工——`persistence.js` 管"密钥 + 读写原语"；`state/save.js` 管"序列化/裁剪 state"。`storage.js` 若是旧壳/别名，Phase 1 顺手合并或删除，避免三个 owner。

### 🟡 P2-1 — render 过度拆分（architecture astronautics）

**问题**：Phase 4 把 render 拆成 ~17 个微文件（mode-selector / book-selector / timer-display / progress-bar…）。对**无组件框架、无测试套件、1-2 人维护**的游戏，这是 React 思维硬套 vanilla JS。代价：import 抖动、跳转成本高、"缮写室页面谁组装"反而找不到。

**修订**：按"页面/功能区"聚合为 3-5 个文件——`focus/page.js`（装配+模式/书籍选择）、`focus/completion.js`（结算+动作卡）、`focus/progress.js`（进度/计时）、`shop/page.js` + `shop/sections.js`。保留"render 不改 state"红线，但别为纯度牺牲可导航性。

### 🟡 P2-2 — 静态 actions 单例反向削弱现有 DI 缝（§9.3）

**问题**：现有 `setActions()` 是穷人版 DI 缝（render 不直接依赖实现）。计划改成 render 直接 `import { actions }`，把耦合从"运行时注入"变回"编译期硬编码"。对无单测的游戏问题不大，但是**有意识取舍**，应写明 trade-off 而非悄悄回退。

**选项**：(A) 保留 setActions 注入缝（零成本，未来加测试有用）；(B) 静态导入（更简单）。**评审建议保留 (A)**。无论哪种写进 ADR（见 §五 ADR-004）。

### 🟡 P2-3 — 缺 ADR

**问题**：计划是"描述性"而非"决策记录"。多个关键决策值得写 ADR 记录 WHY。

**修订**：补 §五 三条 ADR 草案。

---

## 四、战略层：ROI 值得再权衡

对一个 2 人 hobby 项目，8.5-10 天全量重构回报比要算。1486 行 app.js 对单人维护不是"必须现在解决"的痛；计划列了症状但未量化"不重构的代价"。

**建议**：把 **Phase 1（state 拆分，零风险打地基）+ Phase 3（focus 业务拆分，核心玩法收益最大）** 定为**推荐最小重构**；Phase 2/4/5 作为"有空再做"。理由：state 拆分几乎零风险且造福所有后续；focus 是改动最频繁最痛的域；shop/render 拆分是 nicer-to-have，不影响交付。文档"建议实施顺序"仍把 5 phase 当主线，建议把最小集提升到主线。

---

## 五、ADR 草案

### ADR-001：重渲染触发机制

- **Status**：Proposed
- **Context**：拆分后 core 不碰 DOM、render 纯渲染，但现有渲染是命令式显式调用，无订阅机制。若 core 摘除渲染调用而不补机制，UI 会 stale。
- **Decision**：采用 **(A) 显式回流**——core action 返回 domain result，由 `focus-orchestrator` / `actions` 在调完 core 后显式触发对应 `renderXxx()`。不引入全局观察者。
- **Consequences**：
  - 易：无新概念、无循环依赖风险、调试路径清晰。
  - 难：渲染触发点需人工维护在 orchestrator，新增 core 行为要记得接渲染（可接受，因本就是命令式项目）。

### ADR-002：旧存档迁移版本门控

- **Status**：Proposed
- **Context**：§4.2 的 `_schemaVersion=1` 目前无条件全跑，未来加 v2 会重复跑 v1 且漏门控。
- **Decision**：建立 `runMigrations(state)` 版本门控 runner（见 P0-2），现在只放 v1。
- **Consequences**：
  - 易：新增迁移只改 `MIGRATIONS` 数组一处，符合 §2 目标。
  - 难：需约定"每个迁移幂等"，旧存档可能中途失败需重跑——幂等性写进 runner 注释约束。

### ADR-003：render 拆分粒度

- **Status**：Proposed
- **Context**：Phase 4 提议 ~17 个微文件，对小团队 vanilla 项目导航成本高。
- **Decision**：按"页面/功能区"聚合为 3-5 个文件（见 P2-1），保留"render 不改 state"红线。
- **Consequences**：
  - 易：跳转成本低、组装关系清晰。
  - 难：单文件仍偏大（约 200-400 行），但远低于当前 898/916，且职责内聚。

### ADR-004：actions 注入方式

- **Status**：Proposed
- **Context**：现有 `setActions()` 注入缝，计划拟改静态导入。
- **Decision**：**保留 `setActions()` 注入缝**（选项 A），render 仍通过 app 注入的 actions 调用，不改为静态 `import { actions }`。
- **Consequences**：
  - 易：保留解耦 seam，未来若加测试/换实现零成本。
  - 难：app.js 仍需持有 setActions 装配逻辑（少量代码），但远低于回退耦合的代价。

---

## 六、决策清单（需图南/克克拍板）

| # | 决策点 | 评审推荐 | 备注 |
|---|---|---|---|
| 1 | re-render 机制：(A) 显式回流 / (B) 发布订阅 | **A** | 见 ADR-001 |
| 2 | 迁移 runner 是否现在建版本门控 | **是** | 见 P0-2 / ADR-002 |
| 3 | economy.js 是否定为价格/倍数唯一真源，Phase 2 删 shop 内联版 | **是** | 见 P1-2 |
| 4 | persistence vs storage 谁是 localStorage owner；storage.js 是否合并 | 待定 | 见 P1-3 |
| 5 | render 拆分粒度：~17 微文件 / 聚合 3-5 个 | **聚合** | 见 P2-1 / ADR-003 |
| 6 | 保留 setActions 注入缝 / 改静态导入 | **保留** | 见 P2-2 / ADR-004 |
| 7 | 全量 5 phase / 最小集(1+3) 优先 | **最小集优先** | 见 §四 |

---

## 七、建议修订后实施顺序

1. **Phase 0（新增）**：`core/economy.js` + `core/book-progress.js` 落地（公共地基）。
2. **Phase 1（状态层）**：拆 state + 建 `runMigrations` 版本门控 + 厘清 persistence/storage 归属。
3. **Phase 3（专注业务）**：focus 拆分 + 显式回流渲染触发（ADR-001）。
4. *（有空再做）* Phase 2（商店业务）/ Phase 4（渲染聚合拆分）/ Phase 5（app.js 瘦身）。

---

*评审撰写：架构通 | 2026-08-11 | 待图南与克克就 §六 决策清单拍板后，由克克修订原计划*
