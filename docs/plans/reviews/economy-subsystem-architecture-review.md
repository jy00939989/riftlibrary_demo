# 经济子系统架构评审（borrow × cafe × sink-ledger，v3 三件套）

> 评审对象：`borrow-demand-deepening-plan.md`(v3) + `cafe-corner-plan.md`(v3) + `sink-ledger.md`(新建)
> 评审维度：**程序架构整体**——模块边界、上下文映射、共享状态耦合、日界节奏、经济仿真收敛、迁移一致性。
> 前置：两份 v2 单审 + `borrow-cafe-joint-review-v2.md`(联合评审 D9-D14)。本评审假定 v3 已采纳联合评审全部结论，**不重复机制层问题**，只审"三份拼成一套经济子系统"时的架构层裂缝。
> 立场：v3 机制层已健康，sink-ledger 是正确协调原语；但有 **3 个跨 plan 的架构级缺口**，单份 plan 的 verify 抓不到。

---

## 〇、结论速览

| 维度 | 判定 |
|---|---|
| 机制正确性（v3） | ✅ 已落地联合评审 D9-D14，进店时序 / 维持费 / 浮动上限 / 失败信号均正确 |
| 模块边界 | ⚠️ 咖啡角增益以"共享可变字段"直写 Visitor 聚合，无契约/事件 |
| 日界节奏 | 🔴 无统一 `onNewDay()`；cafe 费(浏览 tick) 与 寄读(登录钩) 将落在两套节奏 |
| 经济仿真收敛 | 🔴 三份 plan 的 faucet 均未被 `simulate-atmosphere-economy.mjs` 建模；ledger 金币基线过期 |
| 资源建模盲区 | ⚠️ ledger 只记 3 种可囤积货币，未记真正稀缺资源（玩家专注/时长） |
| 迁移一致性 | ⚠️ 3 plan 往重叠聚合写字段，但无共享迁移版本/顺序 |

**必改（架构级，非机制）**：A1 日界事件统一、A2 仿真/基线对齐（或 ledger 显式声明"上线后重基线"）、A3 增益耦合契约化。

---

## 一、上下文映射（C4 L2）

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Economy Context (hub)                         │
│        coins / atmosphere(EXP) / inspiration / favor / 设施等级        │
│   提供 spendCoins / earnCoins —— 所有 plan 的 sink/faucet 都过这里 ✅   │
└───────┬───────────────────────┬───────────────────────┬──────────────┘
        │ 读设施等级              │ 读阶段门槛             │ 读设施等级
        ▼                        ▼                        ▼
┌──────────────────┐   ┌──────────────────────┐   ┌──────────────────┐
│ Visitor/Borrow   │   │ Cafe/Venue           │   │ Plant            │
│ 拥有: visitor聚合 │   │ 拥有: cafe/stock/    │   │ 拥有: plants/    │
│      book聚合     │   │      recipe          │   │      seeds       │
│ 多本借阅 / 寄读   │──▶│ 招待 / 增益 / 维持费 │   │ 种子产出来源     │
│ 吐槽闭环          │   │ (消费 seeds)         │   │                  │
└────────┬─────────┘   └─────────┬────────────┘   └──────────────────┘
         │                       │
         │ 直写 visitor.borrowChance (共享字段!) │
         └───────────────────────┘
                    ▲
                    │ 100% 由专注驱动生成访客
┌───────────────────────────────────────────────────┐
│ Focus Context (spine)                              │
│ focus-orchestrator: 每次专注 → 最多1访客(break)     │
│ 既不属 Borrow 也不属 Cafe，却是两者吞吐的真脊柱     │
└───────────────────────────────────────────────────┘

共享内核 (Shared Kernel):
  - Visitor 聚合: Borrow 与 Cafe 都改写 (bookIds / borrowChance / favor)
  - Book 聚合: Borrow 拥有 (borrowTimes/wearCount)，Plant 只读
  - getCompletedBooks(): 已 published-language，多本候选池 + 寄读 共用 ✅
```

**健康的点**：`getCompletedBooks()` 是真正的单一真源（多本候选池与寄读共用），Economy 作为 sink/faucet hub 集中了所有货币流，Plant→Cafe 是干净的下游消费（Plant 不知道 Cafe 存在）。这三处边界是对的。

---

## 二、耦合分析（A3：咖啡角增益的共享可变字段）

**问题**：cafe v3 §2.4.4 的增益"进店的访客获得「本次停留期间借书概率 +5%×等级」"——它的落地点是 **`visitor.borrowChance` 这个 Borrow 上下文拥有的字段**。这是 **upstream→downstream 的共享可变状态耦合**，没有事件、没有 ACL、没有 getter。

**风险**（已在代码核实 `visitors.js:789`）：
- `tickVisitorBrowsing` 里 `borrowChance = 0.4 + getCurationBorrowBonus()` 是**硬编码在 Borrow 内的局部计算**。若 Borrow 将来重构（例如把 borrowChance 抽成 `getBorrowChance(visitor)` 函数、或加更多加成源），Cafe 直写的 `+0.05*level` 会**静默失效或双重叠加**——因为没有任何地方声明"borrowChance 由 Cafe 参与构成"。
- 更糟：Cafe 在 786-789 之间插桩写 buff，但如果将来 Borrow 在 `attemptBorrow` 内部**重新算** borrowChance（而非用 tick 层的值），buff 在真正借书那一步丢失。

**修复（二选一，推荐前者）**：
1. **显式契约**：Cafe 只设 `visitor.pendingBorrowBuff = 0.05 * level`（不改 borrowChance），Borrow 在 `attemptBorrow` 计算 borrowChance 时 `+= visitor.pendingBorrowBuff ?? 0`。耦合变成"Borrow 声明它消费一个 buff 字段"，Cafe 不碰 Borrow 的内部变量。
2. **事件**：Cafe 发 `cafe:served` 领域事件，Borrow 的 attemptBorrow 订阅查询。重量级，对单机游戏过度。

无论哪种，都应在 `cafe-corner-plan.md` §2.7 补一句**耦合契约声明**："Cafe 通过 `visitor.pendingBorrowBuff` 影响 Borrow 的 borrowChance，Borrow 在 attemptBorrow 内读取，二者不允许互相直接改写对方内部计算。"

---

## 三、日界节奏缺口（A1：🔴 无统一 `onNewDay()`）

**核实**：全项目 grep 日界逻辑——
- `diary.js:222` `new Date().toDateString()`
- `storage.js:127` `toDateString()` 日 streak
- `achievements.js:351-357` `momoCommentUsedToday`
- `dailytasks.js:11` `todayKey()`
- **没有任何集中的 `onNewDay(prevDay, today)` 事件**——每个系统各写各的日期比较。

而两份 v3 plan 的"每日"机制将挂在**两个不同的节奏钩子**：
- **cafe 维持费**（§2.4.7）："每日首次**营业 tick** 扣除" → 挂在 `tickVisitorBrowsing`（`app.js:259` 的 60s `tickVisitors`）。
- **寄读日结**（§4.1）："**登录即结算**当日" → 挂在 load/login 钩子。

**后果**：
1. **同一游戏日，两个"每日"机制可能触发在不同瞬间**：玩家登录 → 寄读先结算；之后首个浏览 tick → cafe 费才扣。若某天 app 开着但首 tick 时恰无 browsing 访客（罕见但可能），cafe 费延迟到下一个有访客的 tick——与寄读节奏错位。
2. **"持续 sink"实为"活跃会话日 sink"**：`tickVisitorBrowsing` 只在 app 前台运行（`setInterval` 后台节流）、且只处理 `status==='browsing'` 的访客。若玩家**连续 3 天没开 app**，这 3 天**不扣费也不产生寄读收入**（无离线日推进）。对单机放置游戏这未必错（不玩不罚），但 plan 称"持续 sink"的措辞与"仅在活跃日发生"的行为不符，需在 plan 里对齐措辞，否则验收时"维持费持续扣除"会被判不通过。
3. **雪球效应**：后续展览厅等每期都新增"每日"机制，继续往 `toDateString()` 散点里加，债务累积。

**修复（小重构，收益跨所有未来 plan）**：
抽 `onNewDay(prevDay, today)` 事件，由两处触发——① 存档 load/login 时若 `lastSeenDay != today`；② 60s tick 内检测本地跨日。cafe 费、寄读日结、dailytasks、diary streak **全部路由到它**。本评审建议把它列为 café/寄读 实施步骤的第 0 项（或单独立一个 `daily-boundary-refactor` 小 plan），因为它同时修掉 A1 与 §七 的措辞错位。

---

## 四、仿真/基线缺口（A2：🔴 ledger 金币基线过期 + 无统一经济模型）

**核实**：`simulate-atmosphere-economy.mjs` grep 全文——只 `import BORROW_LEVEL_TABLE` 用于设施 EXP 计算（读 `returnAtmo`），**零命中** borrow 收入 / 寄读 / 咖啡角。即该仿真建模的是：氛围 EXP、设施升级开销、损毁率；**完全没建模** borrow 营收(×0.25 额外书)、寄读(6-10/本×浮动上限)、咖啡角(24-55k/年毛利)。

**后果**：
- `sink-ledger.md` §三 金币线写的"现状 v4 仿真硬核已过剩（39,402 vs 21,271，**1.85×**）"是**这三份 plan 上线前的旧基线**。两份 v3 plan 各自"上线首月回测"时，实际金币曲线会与这个 1.85× 基线显著偏离——ledger 把"新 faucet"叠加在一个**不含这些 faucet 的旧基线**上，比较无意义。
- 更深：项目**没有统一经济模型**——每份 plan 仿真自己的切片。sink-ledger 是用人肉流程补偿"缺统一仿真"的事实。这是架构债，不是文档债。

**修复（二选一）**：
1. **扩展仿真（推荐，一次性投入长期受益）**：给 `simulate-atmosphere-economy.mjs` 加"专注会话/日"作为**脊柱输入**（默认 2.5，可标定），并建模 borrow 营收 / 寄读 / 咖啡角（含维持费/停业）。这样 v4 的 173/207/254 天与金币 1.85× 能与本批 plan 在同模型内重算，ledger 基线自然成立。
2. **ledger 显式声明重基线（若暂不扩仿真）**：在 `sink-ledger.md` §三 加注"本基线 = v4 仿真、未含 borrow/cafe/寄读；**本三件套上线后须用真实首月数据重基线**，期间阈值仅作方向参考"。并承认 ledger 是"人工月度复核"流程而非自动断言——把 trade-off 写明白。

无论哪种，**ledger 当前"回调信号"里只有金币线有数值阈值（结余增速 >+20%/月），灵感/好感线全是人工可观测判据**（"玩家反馈好感数字无意义""叙事文本重复率上升"），无代码可算。这本身没问题，但 plan 应明示"灵感/好感线 = 人工巡检，非自动"。

---

## 五、资源建模盲区（A4：真正稀缺资源未入 ledger）

**洞察**：ledger 记了 3 种**可囤积货币**（coins/inspiration/favor），但漏了**真正稀缺资源——玩家专注/时长**。

- borrow 吞吐（2.4 访客/日）与 cafe 吞吐**都 100% 由 `focus-orchestrator` 的专注会话驱动**（每次专注最多 1 访客，`break` 实锤）。专注会话/日才是经济脊柱，两份 plan 都把它当常数 2.5 用。
- 而 borrow v3 自己最关键的负反馈信号（D11：`repairWords` 累计占专注时长比 >15%）恰恰是**时间资源**，不在任何 ledger 线里。
- 所以 ledger 在监控**错误的层**：它盯次级货币，真约束（玩家每天愿做几次专注）被当作外生常量。

**修复**：ledger 加第四条"专注/注意力"线：| 现有 faucet | 专注会话驱动访客生成(100%) | 本批新增 | 修复专注(repairWords, 借多本/寄读加速磨损→修复↑) | 现有 sink | 无(玩家真实时间) | 缺口 | 修复专注挤占抄书/新专注 → 需求与供给同降 | 责任 | borrow D11 监控 | 回调信号 | repairWords/专注时长 >15% |。这把 borrow 自己的 D11 正式纳入 ledger，也补上"脊柱资源"的可见性。

---

## 六、迁移一致性（A5：重叠聚合无共享版本）

**核实**：三份 plan 的 state 改动落在**重叠的聚合**上：
- `visitor`：`bookIds`(数组, borrow) + `pendingBorrowBuff`(cafe, 见 A3)
- `book`：`borrowTimes`(borrow) + `wearCount`(已存在, 本批加速)
- `library`：`lastOffsiteDate`(borrow)
- `plants`：单数→数组(cafe, §2.6)
- `cafe`：新建(cafe)

全是**加法字段**，单看各自迁移零风险。但：
- 三份 plan 各自拥有独立 migration（backlog 项按各自排期落地，**落地顺序不确定**）。若两个 migration 都给 `visitor` 设默认值，顺序影响"老档在途访客 `bookId→bookIds`"与"cafe buff 字段"的默认值共存正确性。
- 现有 `migrations.js` 是**版本号递增**机制（grep 见 `today` 守卫、逐版 `if (!state.x) state.x=...`）。但 plan 文档没声明"本 plan 期望的 MIGRATION_VERSION"和"与其他 plan 的先后"。

**修复**：在 `sink-ledger.md` 或各 plan §实施步骤补"迁移期望版本"——每份 plan 注明它追加到 `MIGRATION_VERSION = N`，且 `verify` 增加一条"多 plan 同档迁移：bookIds/pendingBorrowBuff/lastOffsiteDate/cafe 共存默认态正确"。轻量，但防未来"我改了 visitor 迁移把你的字段冲掉"。

---

## 七、次要项

- **A6 停业死投资**：cafe §2.4.7 "余额不足当日停业"——若玩家长期 0 币，cafe 永久停业，但已投入 1,500+5,800 沉没。建议：低于某币阈值时改"休眠"状态（不扣费、不营业）而非"停业"，或"当日未招待则不扣费"。
- **A7 节奏措辞对齐**：cafe"持续 sink"与"仅在活跃会话日扣费"行为错位（见 A1 后果 2），plan 验收标准第 7 条"每日扣除"应改为"每个活跃游戏日扣除（离线日不补扣）"，免得验收判不通过。
- **A8 寄读与 cafe 都依赖 app 前台 tick**：多日未开 app → 无收入也无费 → 实际是"闲置即冻结"，与放置类预期一致，但两份 plan 的"日结/维持费"措辞都隐含"自然日"，建议统一为"活跃日"。

---

## 八、决策清单（架构级，供拍板）

| # | 决策 | 必改? | 处置 |
|---|---|---|---|
| A1 | 抽 `onNewDay(prevDay,today)` 统一日界，cafe费/寄读/dailytasks 全路由 | 🔴 必改 | 立 `daily-boundary-refactor` 小 plan 或并入 café 实施第 0 步 |
| A2 | 扩仿真建模 borrow/cafe/寄读（含专注脊柱输入）；或 ledger 显式"上线后重基线" | 🔴 必改 | 二选一，但 ledger 当前基线必须标注过期 |
| A3 | Cafe 增益改 `visitor.pendingBorrowBuff`，Borrow 在 attemptBorrow 读取 | ⚠️ 强烈建议 | 解耦共享可变字段，防 Borrow 重构静默失效 |
| A4 | ledger 加"专注/注意力"第 4 线，纳入 borrow D11 | ⚠️ 建议 | 补真约束可见性 |
| A5 | 各 plan 注明 MIGRATION_VERSION 期望 + 多 plan 共存迁移 verify | ⚠️ 建议 | 防重叠聚合迁移顺序冲突 |
| A6 | 停业→休眠（防沉没死投资） | ◽ 可选 | 边角体验 |
| A7/A8 | "持续/日结"措辞对齐"活跃日" | ◽ 可选 | 验收一致性 |

---

## 九、已确认健康（不重复机审）

- v3 进店时序(D9) 在 `visitors.js:786-789` 插桩点干净、无死代码分支 ✅
- 维持费(D10) 逻辑自洽（停业/补足/lastFeeDay 防重扣），仅节奏钩子需并入 A1 ✅
- 浮动寄读上限 `min(12,max(3,⌊n/8⌋))`、×0.25 额外书、吐槽-1/赞叹+5 闭环——机制层已核过，数值纪律(零氛围)成立 ✅
- `getCompletedBooks()` 单源、Plant→Cafe 下游消费、Economy hub——边界正确 ✅
- sink-ledger 作为"跨 plan 协调原语"的方向正确，只差 A2/A4 让它从文档升级为可信账本 ✅
