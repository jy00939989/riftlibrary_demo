---
status: backlog
importance: 3
scheduledDate:
anchors:
  - { type: file, path: "docs/plans/borrow-demand-deepening-plan.md", weight: 0.1 }
  - { type: file, path: "js/visitors.js", weight: 0.1 }
  - { type: file, path: "data/borrow-levels.js", weight: 0.1 }
  - { type: file, path: "js/core/book-progress.js", weight: 0.1 }
  - { type: file, path: "js/state/state.js", weight: 0.1 }
  - { type: file, path: "js/state/migrations.js", weight: 0.1 }
  - { type: file, path: "js/render/visitors.js", weight: 0.1 }
  - { type: file, path: "js/i18n/terms.js", weight: 0.1 }
  - { type: file, path: "scripts/verify-atmosphere-narrowing.js", weight: 0.1 }
---

# 借阅需求深化计划（borrow-demand-deepening-plan）

> 立项：2026-09-10。痛点来源：真实玩家反馈——抄完 18 本后访客容量（10）见顶，书借不出去，抄写动力断崖。
> 与 `cafe-corner-plan.md` 同属「供给/需求再平衡」批次；本文档供架构师评审，通过前不动代码。

---

## 一、诊断

抄写产出**书（供给）**，借阅收益走**访客（需求）**，需求被 `getVisitorCap()` 硬封顶（借阅区 Lv7=10+光环）。书架超过访客容量后，边际抄写收益≈0——v4.3 仿真锚点（周转率 1.5）隐含「书都能转起来」的假设随之破裂。

**设计约束（图南拍板）**：不加新访客（人物文本债、重复劳动）；瘟疫位面是后续大出口但非日常机制。本计划用三个**零新角色**的需求侧机制补上日常层。

## 二、决策清单

| # | 决策点 | 结论 | 来源 |
|---|---|---|---|
| 1 | 多本借阅上限 | **随借阅区等级**：Lv1-2→1 本，Lv3-4→2 本，Lv5-7→3 本 | 图南 2026-09-10 |
| 2 | 多借的书归还方式 | **同一 dueTime，到期一起还**（取所借书中最大时长） | 图南 |
| 3 | 吐槽代价 | **只降好感（-2）+ 文本表态**，不叠加 debuff | 图南（听克克推） |
| 4 | 多本还书的氛围结算 | **只有第一本书给氛围**，额外书只给币（EXP 纪律） | 克克提案待审 |
| 5 | 多本还书的金币结算 | 第一本 100%，额外书 ×0.5（防金币 faucet 恶化通胀） | 克克提案待审 |
| 6 | 馆外流通收益 | 币 6-10/次（不含氛围），~10% 概率 +1 灵感，日上限 5 条 | 克克提案待审 |

## 三、机制一：多本借阅

### 3.1 规则

- `attemptBorrow` 按 `getBorrowSlots(borrowLevel)` 从候选池**无重复**抽取最多 K 本：`[0,1,1,2,2,3,3,3]`（索引=借阅区等级，真源入 `data/borrow-levels.js`）。
- 每本照常 wearCount+1（Phase 3 磨损链直接受益）；dueTime 取所借书各自时长的最大值，整单一起到期。
- `visitor.bookIds = [...]` 新字段；旧档在途访客迁移为 `[bookId]`，保留 `bookId` 兼容字段一个版本后移除。
- 候选池过滤（getCompletedBooks）扩展为排除「被任何人借走的书」——同一本书不可同时出现在两个访客的借阅单里。

### 3.2 还书结算（collectReturn 重构）

- 遍历 bookIds：**每本**独立做损毁 roll（各自 wearCount 加权）；**第一本书**给全额 returnCoins + returnAtmo；**额外书**给 ×0.5 币、零氛围；借阅时长加成币只算一次（挂整单）。
- 好感/叙事事件/旧版角色事件/诗笺：每次还书只触发一次，不随书数翻倍。
- 还书历史记录逐书单记一条（书名列全）；损毁报告逐本列出。

### 3.3 UI

- 访客卡显示借阅单（多书并列小图标）；还书弹窗奖励行标注「首本 +N✨氛围，附带 M 本」；损毁提示支持多本。

## 四、机制二：馆外流通（寄读服务）

### 4.1 规则

- **每日结算**（登录或当日首次 focus 完成时触发，挂现有日结模式）：每本「已完成 ∧ 未损毁 ∧ 不在修缮箱 ∧ 未被馆内访客借走」的书，25% 概率产生寄读。
- 每次寄读：+6~10 智慧之光（按书价浮动取整）、10% 概率 +1 灵感、**wearCount+1**（喂磨损链）、写 history 一句话（模板 5-8 条）。
- **日上限 5 条**，防 history 刷屏；超出部分静默。
- **零氛围产出**（EXP 纪律）。
- 状态：`state.library.lastOffsiteDate` 防重复结算。

### 4.2 定位

多本借阅接住书架 ≤20 本的馆；寄读接住超出部分——书再多也始终有日常出口，且收益刻意低于馆内（约为馆内还书 1/3），主链不贬值。

## 五、机制三：新书吐槽（供给痛点的角色化反馈）

### 5.1 触发

- 每次 `attemptBorrow` 选书时计算「老旧度」：候选书中 `borrowTimes ≥ 5` 的占比 > 60% 且藏书 ≥ 5 本 → 30% 概率触发吐槽。
- `borrowTimes`（每书终身被借计数）新字段，`createBookRecord` 默认 0；每次借出（含寄读）+1。

### 5.2 效果

- 该访客说一句吐槽（模板 10-15 条轮换，如「馆长，这批书我都快背下来了……」），好感 -2，置 `complainedRecently` 标记。
- **正向闭环**：`completeBook` 完成一本 borrowTimes===0 的新书时，馆内带 complainedRecently 的访客立即赞叹（+3 好感、清标记、模板 5-8 条）——「抄新书 → 被看见 → 被夸奖」的奖励环，给持续抄写一个情感出口。

### 5.3 文本预算

吐槽+赞叹+寄读+多本提示模板合计 ~35 条 zh/en 双语词条，一次性文本投入，无后续维护。

## 六、EXP 与金币纪律

- 氛围产出点全量审计：多本还书仅首本；寄读零；吐槽零。实施后 grep `addAtmosphere` 确认三链路零新增调用点。
- 金币：多本额外书 ×0.5、寄读低额——两机制合计金币 faucet 增量 < 馆内主链 20%，对照仿真通胀缺口（结余 4 万 vs 消耗 2.1 万）可吸收。

## 七、实施步骤

1. 数据层：`getBorrowSlots` 入 borrow-levels.js；`borrowTimes`/`bookIds`/`lastOffsiteDate` 入 schema + migrations。
2. 核心层：attemptBorrow 多本抽取 → collectReturn 整单结算重构 → 日结寄读钩子 → 吐槽判定与闭环。
3. UI 层：访客卡/还书弹窗多本形态 + 模板文案接线。
4. 校验：verify 脚本加第 9 节（借书槽表/结算数学/寄读边界/老旧度判定）；check:imports。
5. i18n：~35 条新词条中英双语。

## 八、风险与 trade-off（请架构师重点审）

1. **磨损链加速**：多本借阅+寄读让 wearCount 增速约为现在 2.5-3 倍——濒危书变常见是特性（重抄/修复决策频率↑），但需确认重抄灵感消耗（1/次）不挤压典藏等竞争用途。
2. **collectReturn 重构面**：还书链路是访客系统最复杂函数（叙事/事件/诗笺/成就钩子），重构须保持各钩子一次且仅一次触发——建议重构后逐钩子单测。
3. **日结钩子选择**：寄读触发点挂登录还是首次 focus？挂机玩家（只登录不专注）是否会零寄读？倾向「登录即结算当日」。
4. **多本对叙事事件频率的稀释**：单访客书多了，单位书摊到的叙事事件密度下降——可接受（总量不变），但架构师可挑战。
5. **吐槽频率护栏**：连续吐槽会烦人——同一访客 24h 内最多吐槽 1 次，全馆每日最多 3 次。

## 九、验收标准

1. 旧档在途单本访客正常迁移，还书不丢书、不漏钩子。
2. Lv3 访客借 2 本、Lv5 借 3 本；两访客借阅单无交集。
3. 整单到期一起还；首本全收益、附带书 ×0.5 币零氛围。
4. 寄读日结：库存书有出路、日上限 5、零氛围、wearCount+1。
5. 老旧馆触发吐槽、新书完成触发赞叹闭环、好感数值正确。
6. verify 新增节全过；check:imports 过；drift 榜 0。

## 十、相关文件

- `js/visitors.js`（借还链核心改造）、`data/borrow-levels.js`（借书槽表真源）
- `js/core/book-progress.js`（borrowTimes/complaint 闭环钩子）、`js/state/`（schema+migrations）
- `js/render/visitors.js`（多本 UI）、`js/i18n/terms.js`（模板词条）
- `scripts/verify-atmosphere-narrowing.js`（数值校验）
