---
status: done
importance: 3
scheduledDate:
anchors:
  - { type: file, path: "docs/plans/borrow-demand-deepening-plan.md", weight: 0.1 }
  - { type: file, path: "docs/plans/reviews/borrow-demand-deepening-plan-review.md", weight: 0.1 }
  - { type: file, path: "docs/plans/reviews/borrow-cafe-joint-review-v2.md", weight: 0.1 }
  - { type: file, path: "docs/plans/reviews/economy-subsystem-architecture-review.md", weight: 0.1 }
  - { type: file, path: "docs/plans/daily-boundary-refactor-plan.md", weight: 0.1 }
  - { type: file, path: "js/visitors.js", weight: 0.1 }
  - { type: file, path: "js/core/focus-orchestrator.js", weight: 0.1 }
  - { type: file, path: "js/core/book-utils.js", weight: 0.1 }
  - { type: file, path: "js/core/book-progress.js", weight: 0.1 }
  - { type: file, path: "data/borrow-levels.js", weight: 0.1 }
  - { type: file, path: "js/state/state.js", weight: 0.1 }
  - { type: file, path: "js/state/migrations.js", weight: 0.1 }
  - { type: file, path: "js/render/visitors.js", weight: 0.1 }
  - { type: file, path: "js/i18n/terms.js", weight: 0.1 }
  - { type: file, path: "scripts/verify-atmosphere-narrowing.js", weight: 0.1 }
  - { type: file, path: "js/core/offsite.js", weight: 0.2 }
  - { type: file, path: "js/core/book-progress.js", weight: 0.1 }
  - { type: file, path: "scripts/test-borrow-deepening.mjs", weight: 0.1 }
  - { type: file, path: "js/render/bookshelf.js", weight: 0.1 }
---

# 借阅需求深化计划（borrow-demand-deepening-plan）v3.1

> 立项：2026-09-10。**v3.1 修订：2026-09-10**，按 `reviews/economy-subsystem-architecture-review.md` 架构评审修订（A1 日界前置 / A3 增益读取契约 / A5 迁移注记 / A8 活跃日措辞，图南全采纳）。
> **v3 修订：2026-09-10**，按 `reviews/borrow-cafe-joint-review-v2.md` 联合评审修订（金币口径改写 + 修复成本监控 + sink 台账 + 失败信号，D10-D13 图南全采纳）。
> **v2 修订：2026-09-10**，按 `reviews/borrow-demand-deepening-plan-review.md` 一轮评审修订（2 P0 + 2 P1 + 3 P2 全实锤采纳，零事实错误）。
> 痛点来源：真实玩家反馈——抄完 18 本后书借不出去，抄写动力断崖。
> **v2 关键变化：诊断重写（真瓶颈=访客生成速率，非容量上限）；额外书金币 ×0.5→×0.25；寄读上限随藏书浮动。**
> **v3 关键变化：删除「靠咖啡角对冲」口径（P0-2）；修复专注成本纳入净收益 + repairWords 观测指标（D11）；faucet 缺口归口 sink-ledger（D12）；补 3 条失败信号（D13）。**

---

## 修订记录

### v1 → v2（评审修订）

| # | 评审问题 | v2 处理 |
|---|---|---|
| P0-A 诊断指错瓶颈 | **§一 重写**：真瓶颈=生成速率（每次专注最多 1 位访客，`focus-orchestrator.js:165` break 实锤），容量 cap 10 从未触及；两机制的价值=绕过生成瓶颈。附「去 break」候选方案评估记录（§五.5） |
| P0-B 金币 faucet 低估 4 倍（我写 <20%，实际 +50~100%） | 额外书金币 **×0.5 → ×0.25**（增幅降到 +25~43%，§3.2）；EXP 纪律（额外书零氛围）保留 |
| P1-C 寄读上限 5 对痛点人群最窄（50 本书仅 10% 有出口） | 上限改**随藏书浮动**：`min(12, max(3, ⌊藏书数/8⌋))` + history 合并一条汇总（§4.1） |
| P1-D 寄读隐性磨损代价未写明 | §4.1 明确「寄读磨损=隐性对价，累积到后续馆内借阅损毁率」；书况 UI 补显 wearCount 数字（§4.3） |
| P2-E createBookRecord 锚点偏差 | 真身 `js/core/book-utils.js:20`，anchor 已修正 |
| P2-F 吐槽/赞叹数值净负 | **吐槽 -1 / 赞叹 +5**（§5.2），完整闭环净 +4 |
| P2-G 多本反馈密度不随书数增加 | 还书弹窗做视觉增量：书名并列 + 逐本小结（§3.3） |
| 附：候选池过滤措辞 | `getCompletedBooks()`（visitors.js:801）已有排除逻辑，v1「扩展为」改为「适配 bookIds 数组」 |

### v2 → v3（联合评审修订，reviews/borrow-cafe-joint-review-v2.md）

| # | 联合评审问题 | v3 处理 |
|---|---|---|
| P0-2 连带 | 「靠咖啡角对冲金币通胀」假设失效——咖啡角是净 faucet（v3 已自带维持费持续 sink，净流入仍为正），两 plan 金币压力**同向叠加非对冲** | §六 删除对冲表述、各自记账；**金币日获取量 + 结余增速列为两 plan 联合必看指标**（首月回测）；缺口归口 `sink-ledger.md` 金币线 |
| P1-3 修复时间成本 | 磨损加速 2.5-3 倍 → 修复专注↑ → 生成访客/抄新书的专注↓，负反馈闭环无监控 | §八.1 修复专注成本纳入净收益评估 + 观测 `repairWords` 累计占专注时长比，>15% 触发回调（D11） |
| P1-4 sink 台账 | 灵感/好感缺口散记各 plan「系统级不归我」 | 建 `sink-ledger.md` 统一台账（D12）；寄读灵感 +1.2/日已登记 |
| P2-5 无失败信号 | 只有验收标准，没有「坏掉长什么样」 | §九 补 3 条失败信号（A 需求未接住 / B 主链贬值 / C 负反馈过量）（D13） |

### v3 → v3.1（架构评审修订，reviews/economy-subsystem-architecture-review.md）

| # | 架构评审问题 | v3.1 处理 |
|---|---|---|
| A1 日界分裂 | 寄读日结挂登录钩、与 cafe 维持费两套节奏；全项目无统一 `onNewDay()` | 实施步骤加**第 0 步**：`onNewDay()` 落地（daily-boundary-refactor-plan）后寄读挂入；措辞「每日结算」改「**活跃游戏日结算**，离线日冻结不补结」（§4.1） |
| A3 增益契约 | borrowChance 是 Borrow 内部计算，须声明消费 cafe buff 字段 | §3.1 增条款：`attemptBorrow` 计算 borrowChance 时 `+= visitor.pendingBorrowBuff ?? 0`（Cafe 写入，Borrow 读取，互不直写对方内部计算） |
| A5 迁移一致性 | 与 cafe 重叠写 visitor/book 聚合，无版本/顺序声明 | §四.1 注记：纯加法字段无顺序依赖，落地注明 `MIGRATION_VERSION`；verify 增多 plan 同档共存断言 |

---

## 一、诊断（v2 重写）

**痛点真实**：抄写产出书（供给），借阅收益走访客（需求），玩家抄到 18 本后边际收益断崖。

**v1 诊断错误**：v1 写「需求被 getVisitorCap() 硬封顶（10）」——**实测 cap 从未被触及**。真实瓶颈链（评审 P0-A 实锤，已复核）：

1. 访客**只由专注结算驱动生成**，且 `focus-orchestrator.js:156-168` 的 spawn 循环有 `break`（:165）——**每次专注最多 1 位访客**，rolls 只提高命中率不提高数量；
2. 硬核日均 ≈2.4 位访客，平均借期 ≈0.5 天 → **同时在途书量 ≈1.2 本**；
3. 离 cap 10 差一个数量级——**调 cap 是白工**。

**两机制为什么有效**——恰恰因为绕过了生成瓶颈：

- **多本借阅**不看访客数，提高**单访客消化量**（在途 1.2 → ~3.6 本）；
- **寄读完全不依赖访客**，是纯藏书量的函数。

## 二、决策清单（v2）

| # | 决策点 | v2 结论 | 来源 |
|---|---|---|---|
| 1 | 多本借阅上限 | 随借阅区等级：Lv1-2→1，Lv3-4→2，Lv5-7→3 | 图南 |
| 2 | 归还方式 | 同一 dueTime（取所借书最大时长），到期一起还 | 图南 |
| 3 | 吐槽代价 | 只动好感+文本，无 debuff | 图南 |
| 4 | 多本还书氛围 | 仅首本给氛围，额外书零氛围 | 克克，评审确认保留 |
| 5 | 多本还书金币 | 首本 100%，**额外书 ×0.25**（v1 ×0.5 被评审否掉，通胀纪律） | v2 修订 |
| 6 | 寄读收益 | 币 6-10/次、~10% +1 灵感、零氛围、wearCount+1；**上限随藏书浮动** | v2 修订 |
| 7 | 吐槽/赞叹 | **-1 / +5**，闭环净 +4 | v2 修订 |
| 8 | 寄读隐性对价 | 文档明示 + 书况 UI 显 wearCount | v2 修订 |

## 三、机制一：多本借阅

### 3.1 规则

- `attemptBorrow` 按 `getBorrowSlots(borrowLevel)` 从候选池无重复抽取最多 K 本：`[0,1,1,2,2,3,3,3]`（真源入 `data/borrow-levels.js`）。
- **增益读取契约（v3.1 新增，架构评审 A3）**：`attemptBorrow` 计算 borrowChance 时 `+= visitor.pendingBorrowBuff ?? 0`——该字段由 Cafe 写入（进店招待时置 `0.05×level`，借到书或离开即清除），Borrow 只读不写，互不直写对方内部计算（契约全文见 cafe-corner-plan §2.7）。
- 每本照常 wearCount+1（Phase 3 链）；dueTime 取所借书各自时长最大值，整单一起到期。
- `visitor.bookIds = [...]` 新字段；旧档在途访客迁移 `[bookId]`，`bookId` 兼容字段保留一个版本。
- 候选池： `getCompletedBooks()`（visitors.js:801）**已有**「排除被借走的书」逻辑，本计划只做 `bookIds` 数组适配，不新增过滤。

### 3.2 还书结算（collectReturn 重构）

- 遍历 bookIds：每本独立损毁 roll（各自 wearCount 加权）；**首本**全额 returnCoins + returnAtmo；**额外书 ×0.25 币、零氛围**（v2：评审 P0-B，原 ×0.5 增幅 +86% 加剧通胀，×0.25 后 +25~43%）；借阅时长加成币整单一次。
- 好感/叙事/角色事件/诗笺：每次还书一次且仅一次（`eventTriggered` 标记已有先例）。
- 还书历史逐单一条（书名列全）；损毁逐本列出。

### 3.3 UI（v2 增补：视觉密度补数值密度，评审 P2-G）

- 访客卡借阅单并列显示；还书弹窗**书名并列 + 逐本小结行**（每本：币/损毁状态），首本高亮「主借」标识与氛围收益。

## 四、机制二：馆外流通（寄读服务）

### 4.1 规则（v2 修订）

- **活跃日结算（v3.1 修订，架构评审 A1/A8）**：挂在统一 `onNewDay()`（daily-boundary-refactor-plan，动工第 0 步前置），覆盖挂机不专注玩家；**离线日整体冻结、不补结**（闲置即冻结，与 cafe 维持费同一节奏）。每本「已完成 ∧ 未损毁 ∧ 不在修缮箱 ∧ 未被馆内借走」的书，25% 概率产生寄读。
- 每次寄读：+6~10 智慧之光（按书价浮动取整）、10% 概率 +1 灵感、**wearCount+1**、当日 history 合并为**一条汇总**（「今日寄读 N 本 · +X💰」）。
- **日上限随藏书浮动**：`min(12, max(3, ⌊藏书数/8⌋))`（v2：评审 P1-C——固定上限对书多者最苛刻；浮动后 50 本书出口占比回到 25%）。
- **隐性对价（v2 明示，评审 P1-D）**：寄读累积的磨损会放大该书**后续馆内借阅**的损毁率（getDamageChance 第三参已接）——寄读不是纯赚，是「用未来风险换当下收益」的长期账。磨损链加速归因：多本借阅 ~×2 + 寄读 ~×1，合计 ~2.5-3 倍（v1 §八.1 归因不全，v2 补齐）。
- **零氛围产出**（EXP 纪律）；`state.library.lastOffsiteDate` 防重复结算。

### 4.2 定位

多本借阅接住书架 ≤20 本的馆；寄读接住超出部分，且收益刻意低于馆内（~1/3），主链不贬值。

### 4.3 UI（v2 增补）

书况显示补 **wearCount 具体数字**（现书架卡只有档位+损毁率；数字让玩家看得见寄读的隐性账）；寄读汇总进 history。

## 五、机制三：新书吐槽

### 5.1 触发

- `attemptBorrow` 选书时计算「老旧度」：候选中 `borrowTimes ≥ 5` 占比 > 60% 且藏书 ≥ 5 → 30% 概率吐槽。
- `borrowTimes` 新字段，真身 **`js/core/book-utils.js:20` `createBookRecord`**（CANONICAL_BOOK_FIELDS 加默认值 0，v2 锚点修正）；每次借出（含寄读）+1。

### 5.2 效果（v2 修订）

- 吐槽：模板一句 + **好感 -1** + `complainedRecently` 标记（v1 -2 吃掉还书收益 25-40%，评审 P2-F）。
- **正向闭环**：完成 borrowTimes===0 的新书时，馆内带标记访客赞叹 **+5** 好感、清标记——闭环净 +4。
- 护栏不变：同访客 24h 最多 1 次，全馆每日 3 次。

### 5.3 文本预算

吐槽/赞叹/寄读汇总/多本小结模板合计 ~35 条 zh/en，一次性投入。

## 六、数值与纪律（v2 重算）

- **EXP**：氛围产出点全量审计——多本仅首本、寄读零、吐槽零。实施后 grep `addAtmosphere` 确认零新增调用点。**保留，评审确认正确。**
- **金币（v3 口径，联合评审 P0-2）**：额外书 ×0.25 后 Lv3-4 增幅 +25%、Lv5-7 +43%；寄读按浮动上限（50 本 → 6 条/日 ×6-10币 ≈ 40-60/日）。合计 faucet 增量约为馆内主链的 25-45%。**v3 删除 v2「靠咖啡角/展览厅消费口对冲」表述**——联合评审实锤两 plan 是同向叠加；金币缺口统一由 `sink-ledger.md` 金币线记账。**两 plan 上线后，金币日获取量 + 结余增速列为联合必看指标**（首月真实数据回测，超阈值按台账回调信号处置，必要时再降倍率或重跑仿真校准）。
- **灵感（v3 登记，联合评审 D12）**：寄读 10% × 浮动上限 ≈ +1.2/日（基础 ~7/日）。增量已登记 `sink-ledger.md` 灵感线，消耗口责任归展览厅计划——本 plan 不背锅但已记账，不再散记「系统级问题」。

## 七、实施步骤

0. **日界前置（v3.1 新增，架构评审 A1）**：`onNewDay(prevDay, today)` 统一日界落地（见 `daily-boundary-refactor-plan.md`）；本 plan 寄读日结与 cafe 维持费均挂入，不做各自为政的日期比较。
1. 数据层：`getBorrowSlots` 入 borrow-levels.js；`borrowTimes`/`bookIds`/`lastOffsiteDate` 入 schema（`js/core/book-utils.js` + state/migrations）。**迁移注记（A5）**：均为纯加法字段，与 cafe 的 visitor 字段（pendingBorrowBuff）无顺序依赖；落地时注明追加的 `MIGRATION_VERSION`。
2. 核心层：attemptBorrow 多本抽取 → collectReturn 整单结算重构（12 钩子逐一核对，一次且仅一次）→ 日结寄读（浮动上限+汇总）→ 吐槽判定与闭环。
3. UI 层：多本形态（访客卡/还书弹窗视觉增量）+ 书况 wearCount 数字 + 模板接线。
4. 校验：verify 第 9 节（借书槽表/×0.25 结算数学/浮动上限/老旧度判定）；check:imports。
5. i18n：~35 条新词条中英双语。

## 八、风险与 trade-off（v2 重排）

1. **磨损链加速**（v2 归因补齐）：多本 ~×2 + 寄读 ~×1 ≈ 2.5-3 倍——濒危书变常见是特性；确认重抄灵感消耗（1/次）不挤压典藏竞争（上线实测）。**v3 增补（联合评审 D11）**：损毁书退出 `getCompletedBooks()` 候选池（与「让更多书流通」相抵），修复专注成本（repairWords = copiedWords×0.15）**纳入净收益评估**——真正的负反馈闭环是「磨损↑ → 修复专注↑ → 生成访客/抄新书的专注↓，需求与供给同时降」。上线后观测 **`repairWords` 累计占专注时长比，>15% 触发回调**（降磨损速率或修复成本）。
2. **collectReturn 重构面**：12 钩子（收益/时长/好感/诗笺/history/diary/borrowRecords/语录/损毁/叙事/角色事件/移除），重构后逐钩子单测。
3. **金币 faucet（v3 口径升级）**：+25~45% 净压力，与咖啡角**同向叠加非对冲**（联合评审 P0-2）——首月真实数据回测时**金币日获取量 + 结余增速为两 plan 联合必看指标**（见 `sink-ledger.md` 金币线）。
4. **「去 break」候选方案评估记录（评审建议，v2 收录但不采纳）**：允许每次专注生成 2 位访客（去掉 `focus-orchestrator.js:165` break）是比多本借阅更简的需求扩容方案，零新角色文本。不采纳理由：①同角色双实例并存需处理叙事引擎去重（rare 事件/终局后事件按 charId 记账，双实例有重入风险）；②多本借阅已覆盖同一需求且不碰叙事引擎；③保留为将来「生成速率整体上调」时的候选（届时须配套叙事去重）。
5. **吐槽频率护栏**：同访客 24h 1 次、全馆日 3 次。
6. **日结钩子（v3.1）**：挂统一 `onNewDay()`，挂机玩家不亏寄读；离线日冻结不补结。

## 九、验收标准

1. 旧档在途单本访客正常迁移，还书不丢书、不漏钩子（12 钩子逐一断言）。
2. Lv3 借 2 本、Lv5 借 3 本；两访客借阅单无交集。
3. 整单到期一起还；首本全收益、额外书 ×0.25 币零氛围。
4. 寄读：浮动上限公式正确、汇总 history、零氛围、wearCount+1、隐性对价在 UI 可见。
5. 老旧馆触发吐槽（-1）、新书完成触发赞叹（+5）闭环、护栏生效。
6. verify 新增节全过（**含多 plan 同档迁移共存断言，A5**：bookIds/pendingBorrowBuff/lastOffsiteDate/cafe 默认态同档正确）；check:imports 过；drift 0。

### 失败信号（v3 新增，联合评审 D13）

| 信号 | 判据 | 含义 | 处置 |
|---|---|---|---|
| A 需求未接住 | 上线后仍收「书借不出去」反馈，且**在途书量 <3 本而藏书 >20** | 多本借阅没接住 | 回到「去 break」候选方案重评估（须配套叙事去重，见 §八.4） |
| B 主链贬值 | 寄读金币占总金币收入 > **40%** | 寄读取代馆内借阅，主链贬值 | 降寄读收益/上限 |
| C 负反馈过量 | 吐槽:赞叹 触发比 > **3:1** | 负反馈过量，玩家被烦 | 降吐槽概率或收紧触发条件 |

## 十、相关文件

- `js/visitors.js`（借还链核心改造）、`data/borrow-levels.js`（借书槽表真源）
- `js/core/book-utils.js`（createBookRecord/borrowTimes 默认值）、`js/core/book-progress.js`（赞叹闭环钩子）
- `js/core/focus-orchestrator.js`（生成瓶颈出处，本计划不改动只引用）
- `js/state/state.js` / `js/state/migrations.js`、`js/render/visitors.js`（多本 UI）
- `js/i18n/terms.js`、`scripts/verify-atmosphere-narrowing.js`
- 联合评审：`reviews/borrow-cafe-joint-review-v2.md`；架构评审：`reviews/economy-subsystem-architecture-review.md`；待补 sink 台账：`sink-ledger.md`（灵感/金币/专注线）；日界前置：`daily-boundary-refactor-plan.md`（A1，动工第 0 步前置）

---

## 十一、实施记录（2026-09-11 落地，4 commits bcd2f27→6bb49b3）

实施步骤 0-5 全执行。测试 `scripts/test-borrow-deepening.mjs` **52 项全绿**（槽表/多本整单到期/×0.25 结算数学/寄读浮动上限/吐槽三护栏/赞叹闭环/A5 迁移共存）；cafe 51 / greenhouse 34 / day-boundary 39 无回归；check:imports 过；drift 0。

**三机制落地形态**：
- 多本借阅：`getBorrowSlots` 入 `data/borrow-levels.js`（Lv0 兜底 1 保持既有行为）；attemptBorrow 无重复抽 K 本、整单 dueTime 取最大、bookIds + bookId 兼容字段；collectReturn 逐本结算（首本全收益/额外 ×0.25 零氛围/时长加成整单一次/每本独立损毁 roll），12 钩子整单一次且仅一次
- 寄读：`js/core/offsite.js` 挂 onNewDay（A1/A8），lastOffsiteDate 防重，浮动上限 `min(12,max(3,⌊n/8⌋))`，币 6-10 按书价浮动（SHARED_POOL 查价），10% 灵感，wear+借次 +1，history 合并一条，零氛围
- 新书吐槽：borrowTimes≥5 占比 >60% 且藏书 ≥5 → 30%，-1 好感 + complainedRecently 标记；护栏同访客 24h/全馆日 3（日限走 day-boundary getTodayKey）；赞叹闭环在 completeBook（borrowTimes===0 新书 → 带标记访客 +5 清标记）

**实施时补充决策**：① 寄读结算抽为导出函数 settleOffsite(today)，onNewDay 订阅与测试/调试共用入口；② 测试池排除典藏版（indestructible 不磨损，wearCount 断言专用）；③ 24h 护栏基线用真实 Date.now()（getNow 为实时时钟）；④ A5 同档断言覆盖 v7 plants / v8 cafe / v9 borrow 三 plan 字段无顺序依赖。

**首月回测联合指标（v3 P0-2 记账要求）**：金币日获取量 + 结余增速、寄读金币占比（信号 B 阈值 40%）、吐槽：赞叹比（信号 C 阈值 3:1）、在途书量 vs 藏书量（信号 A）、repairWords 占专注比（D11 阈值 15%）——数据面已齐（history 类型齐全 + borrowRecords.bookIds），回测时从存档/history 提取。
