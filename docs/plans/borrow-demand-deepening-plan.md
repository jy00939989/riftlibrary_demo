---
status: backlog
importance: 3
scheduledDate:
anchors:
  - { type: file, path: "docs/plans/borrow-demand-deepening-plan.md", weight: 0.1 }
  - { type: file, path: "docs/plans/reviews/borrow-demand-deepening-plan-review.md", weight: 0.1 }
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
---

# 借阅需求深化计划（borrow-demand-deepening-plan）v2

> 立项：2026-09-10。**v2 修订：2026-09-10**，按 `reviews/borrow-demand-deepening-plan-review.md` 一轮评审修订（2 P0 + 2 P1 + 3 P2 全实锤采纳，零事实错误）。
> 痛点来源：真实玩家反馈——抄完 18 本后书借不出去，抄写动力断崖。
> **v2 关键变化：诊断重写（真瓶颈=访客生成速率，非容量上限）；额外书金币 ×0.5→×0.25；寄读上限随藏书浮动。**

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

- **每日结算**（登录即结算当日，覆盖挂机不专注玩家）：每本「已完成 ∧ 未损毁 ∧ 不在修缮箱 ∧ 未被馆内借走」的书，25% 概率产生寄读。
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
- **金币（v2 重算，评审 P0-B）**：额外书 ×0.25 后 Lv3-4 增幅 +25%、Lv5-7 +43%；寄读按浮动上限（50 本 → 6 条/日 ×6-10币 ≈ 40-60/日）。合计 faucet 增量约为馆内主链的 25-45%——**对照仿真通胀缺口（结余 1.85×）仍是净压力，靠咖啡角/展览厅消费口对冲**；上线后按真实数据回测，必要时再降倍率或重跑仿真校准。

## 七、实施步骤

1. 数据层：`getBorrowSlots` 入 borrow-levels.js；`borrowTimes`/`bookIds`/`lastOffsiteDate` 入 schema（`js/core/book-utils.js` + state/migrations）。
2. 核心层：attemptBorrow 多本抽取 → collectReturn 整单结算重构（12 钩子逐一核对，一次且仅一次）→ 日结寄读（浮动上限+汇总）→ 吐槽判定与闭环。
3. UI 层：多本形态（访客卡/还书弹窗视觉增量）+ 书况 wearCount 数字 + 模板接线。
4. 校验：verify 第 9 节（借书槽表/×0.25 结算数学/浮动上限/老旧度判定）；check:imports。
5. i18n：~35 条新词条中英双语。

## 八、风险与 trade-off（v2 重排）

1. **磨损链加速**（v2 归因补齐）：多本 ~×2 + 寄读 ~×1 ≈ 2.5-3 倍——濒危书变常见是特性；确认重抄灵感消耗（1/次）不挤压典藏竞争（上线实测）。
2. **collectReturn 重构面**：12 钩子（收益/时长/好感/诗笺/history/diary/borrowRecords/语录/损毁/叙事/角色事件/移除），重构后逐钩子单测。
3. **金币 faucet（v2 升级）**：+25~45% 净压力，消费口（咖啡角/展览厅）是对冲不是豁免——首月真实数据回测时**金币日获取量列为必看指标**。
4. **「去 break」候选方案评估记录（评审建议，v2 收录但不采纳）**：允许每次专注生成 2 位访客（去掉 `focus-orchestrator.js:165` break）是比多本借阅更简的需求扩容方案，零新角色文本。不采纳理由：①同角色双实例并存需处理叙事引擎去重（rare 事件/终局后事件按 charId 记账，双实例有重入风险）；②多本借阅已覆盖同一需求且不碰叙事引擎；③保留为将来「生成速率整体上调」时的候选（届时须配套叙事去重）。
5. **吐槽频率护栏**：同访客 24h 1 次、全馆日 3 次。
6. **日结钩子**：登录即结算，挂机玩家不亏寄读。

## 九、验收标准

1. 旧档在途单本访客正常迁移，还书不丢书、不漏钩子（12 钩子逐一断言）。
2. Lv3 借 2 本、Lv5 借 3 本；两访客借阅单无交集。
3. 整单到期一起还；首本全收益、额外书 ×0.25 币零氛围。
4. 寄读：浮动上限公式正确、汇总 history、零氛围、wearCount+1、隐性对价在 UI 可见。
5. 老旧馆触发吐槽（-1）、新书完成触发赞叹（+5）闭环、护栏生效。
6. verify 新增节全过；check:imports 过；drift 0。

## 十、相关文件

- `js/visitors.js`（借还链核心改造）、`data/borrow-levels.js`（借书槽表真源）
- `js/core/book-utils.js`（createBookRecord/borrowTimes 默认值）、`js/core/book-progress.js`（赞叹闭环钩子）
- `js/core/focus-orchestrator.js`（生成瓶颈出处，本计划不改动只引用）
- `js/state/state.js` / `js/state/migrations.js`、`js/render/visitors.js`（多本 UI）
- `js/i18n/terms.js`、`scripts/verify-atmosphere-narrowing.js`
