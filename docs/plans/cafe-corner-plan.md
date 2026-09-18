---
status: backlog
importance: 3
scheduledDate:
anchors:
  - { type: file, path: "docs/plans/cafe-corner-plan.md", weight: 0.1 }
  - { type: file, path: "docs/plans/reviews/cafe-corner-plan-review.md", weight: 0.1 }
  - { type: file, path: "docs/plans/reviews/borrow-cafe-joint-review-v2.md", weight: 0.1 }
  - { type: file, path: "docs/plans/reviews/economy-subsystem-architecture-review.md", weight: 0.1 }
  - { type: file, path: "docs/archive/plans/daily-boundary-refactor-plan.md", weight: 0.1 }
  - { type: file, path: "js/render/shop/library-upgrades.js", weight: 0.1 }
  - { type: file, path: "js/visitors.js", weight: 0.1 }
  - { type: file, path: "js/plants.js", weight: 0.1 }
  - { type: file, path: "js/capacity.js", weight: 0.1 }
  - { type: file, path: "scripts/test-cafe.mjs", weight: 0.1 }
  - { type: file, path: "scripts/test-plant-care.mjs", weight: 0.1 }
  - { type: file, path: "scripts/test-seed-exchange-books.mjs", weight: 0.1 }
  - { type: file, path: "data/plants.js", weight: 0.1 }
  - { type: file, path: "data/atmosphere.js", weight: 0.1 }
  - { type: file, path: "js/state/state.js", weight: 0.1 }
  - { type: file, path: "js/state/migrations.js", weight: 0.1 }
  - { type: file, path: "js/i18n/terms.js", weight: 0.1 }
  - { type: file, path: "js/core/focus-orchestrator.js", weight: 0.1 }
  - { type: file, path: "scripts/verify-atmosphere-narrowing.js", weight: 0.1 }
  - { type: file, path: "scripts/test-greenhouse-pots.mjs", weight: 0.1 }
  - { type: file, path: "js/render/plants.js", weight: 0.1 }
  - { type: file, path: "js/render/shop/decorations.js", weight: 0.1 }
  - { type: file, path: "js/actioncards.js", weight: 0.1 }
  - { type: file, path: "js/render/momo-suggestion.js", weight: 0.1 }
  - { type: file, path: "data/cafe.js", weight: 0.2 }
  - { type: file, path: "js/core/cafe.js", weight: 0.2 }
  - { type: file, path: "js/render/shop/cafe-panel.js", weight: 0.1 }
  - { type: file, path: "js/render/visitors.js", weight: 0.1 }
  - { type: file, path: "scripts/test-cafe.mjs", weight: 0.1 }
---

# 咖啡角计划（cafe-corner-plan）v3.1

> 立项：2026-09-10。**v3.1 修订：2026-09-10**，按 `reviews/economy-subsystem-architecture-review.md` 架构评审修订（A3 增益契约化 / A5 迁移注记 / A6 休眠语义 / A7 活跃日措辞，图南全采纳；A1 日界统一见 daily-boundary-refactor-plan）。
> **v3 修订：2026-09-10**，按 `reviews/borrow-cafe-joint-review-v2.md` 联合评审修订（2 P0 + 2 P1 + 失败信号 + 座位语义，D9-D14 图南全采纳）。
> **v2 修订：2026-09-10**，按 `reviews/cafe-corner-plan-review.md` 一轮评审修订（3 P0 + 3 P1 全实锤采纳，P2-7 事实性驳回）。
> 所属：氛围系统重设计 v4.3 **Phase 4 场馆房间** 第一批（房间定版：咖啡角 / 温室 / 展览厅）。
> 上游文档：`atmosphere-system-redesign-plan.md` §四、`atmosphere-venue-map-design.md`（v3 旧案，经济层已死）。
> **v2 关键变化：咖啡角与温室花盆扩容同批上线**（供给先于消费，评审 D1）。
> **v3 关键变化：进店判定提至 borrowChance 之前（D9 反噬修复）+ 每日维持费持续 sink（D10）+ 失败信号与自动断言（D13）+ 座位改并发语义（D14）。**

---

## 修订记录

### v1 → v2（评审修订）

| # | 评审问题 | v2 处理 |
|---|---|---|
| P0-1 材料断供（单花盆，种子数天 1 颗 vs 日耗 3-9 颗） | **温室花盆扩容与咖啡角同批**（§2.6 Phase 0），材料同步降耗（§2.3） |
| P0-2 种子效率失衡（咖啡角每颗产出仅为兑换的 30%） | 售价 15/20/35 → **50/65/110**（≈兑换效率九折，§2.3），剩余差价=好感+借书增益的定价 |
| P0-3 吞吐塌陷（专注驱动生成，browsing 2.5 分钟，日均招待 1.5-3 次，回本 200+ 天） | ① 售价提升后单次均价 57💰，Lv1 日收益 85-170💰，建造回本 9-18 天 ② 升级费 600×1.6ⁿ→**400×1.6ⁿ**（升满 ~5,800）③ 升级配非金币增益（§2.4.5）④ 明确定位「专注节律的延伸，非挂机收益」 |
| P1-4 Lv2 空升级 | 星蕨特调前置 **Lv2**；每级都有食谱或增益（§2.3/§2.4.5） |
| P1-5 「延长停留」无载体 | **废弃该功能与旧文案**，改为「本次借书概率 +5%×咖啡角等级」（§2.4.4），UI 如实描述 |
| P1-6 均匀随机稀释高价食谱 | 取用改为**库存加权**（库存多者优先消耗，§2.4.3） |
| P2-7 「getFacilityLevelCap 不存在」 | **驳回**：函数存在于 `data/atmosphere.js:170/176`（Phase 2 建成，commit `3fd2b65`），评审基于旧版文件。照抄不改 |
| P2-8 好感通胀未核算 | v2 核算见 §五.3；咖啡角好感产出已计入日上限模型 |
| D8 时间跳跃补算未定义 | 明确规则：**按比例补算**，单次封顶 2 次/座位，消耗真实库存（§2.4.6） |

### v2 → v3（联合评审修订，reviews/borrow-cafe-joint-review-v2.md）

| # | 联合评审问题 | v3 处理 |
|---|---|---|
| P0-1 增益自我反噬 | 「先借阅判定后咖啡角」+ 借书概率增益 → 借书概率越高进店窗口越短，Lv5 期望收益（14.9 币/访客）反低于 Lv1（15.3）；且字面实现有永不执行的死代码分支 | **进店判定提到 borrowChance 判定之前**（§2.4.1，每个 browsing tick 独立判定，进店与增益解耦，D9）；§五.1 重算：Lv5 单位访客收益 ≈ Lv1 的 3.4 倍，升级恢复严格正收益 |
| P0-2 净 faucet | 回本（9-18 天）后年净流入 +2.4~5.5 万，与借阅 plan 同向叠加非对冲 | **每日维持费 20×等级**（§2.4.7 持续 sink；余额不足当日停业、补足次日恢复，D10）；金币缺口归口 `sink-ledger.md` |
| P2-5 无失败信号 | 只有验收标准，没有「坏掉长什么样」 | §七 补 3 条失败信号（A 制作冷启动 / B 长期停摆 / C 升级反噬）；**信号 C 进 verify 第 8 节自动断言**（D13） |
| D14 座位非瓶颈 | 日均访客仅 2.4 位、停留 ~2.5 分钟，5 座位几乎用不满，座位收益名不副实 | 座位语义改「**同时接待上限**」（并发在店数），升级主收益 = 食谱解锁 + 增益档位（§2.5） |

### v3 → v3.1（架构评审修订，reviews/economy-subsystem-architecture-review.md）

| # | 架构评审问题 | v3.1 处理 |
|---|---|---|
| A3 共享可变字段 | 增益直写 Borrow 的 `visitor.borrowChance`，Borrow 重构时 buff 会静默失效/双重叠加 | **契约化**：Cafe 只设 `visitor.pendingBorrowBuff = 0.05×level`，Borrow 在 `attemptBorrow` 内 `+=` 读取；双方互不直写对方内部计算（§2.4.4 / §2.7 契约声明） |
| A1 日界分裂 | 维持费挂浏览 tick、寄读挂登录，两套「每日」节奏错位 | 日界判定统一走 `onNewDay()`（daily-boundary-refactor-plan，本 plan 动工前置）；维持费改「**活跃游戏日**」扣除，离线日不补扣不罚（§2.4.7） |
| A6 停业死投资 | 长期 0 币 → 永久停业，7,300 沉没死投资 | 停业改**休眠**：低于当日维持费不扣费不营业，金币回升自动唤醒（§2.4.7） |
| A7/A8 措辞错位 | 「持续 sink」实为「活跃会话日 sink」，验收会判不通过 | 全部措辞对齐「活跃日」；验收标准第 7 条同步改写（§七） |
| A5 迁移一致性 | 多 plan 写重叠聚合（visitor/book），无版本/顺序声明 | §2.1 补迁移期望注记；verify 增「多 plan 同档迁移共存」断言（§四.4） |

---

## 一、定位与决策来源

**咖啡角 = 商店占位卡转正的场馆房间**：访客招待空间 + 植物产出的消费口 + 金币建造/升级消费口 + 好感/借书增益层。

图南决策（2026-09-10）：

| # | 决策点 | 结论 |
|---|---|---|
| 1 | 茶室去留 | **茶室被咖啡角吸收，只留咖啡角**（占位卡转正） |
| 2 | 访客进店方式 | **自动**——不做手动邀约 |
| 3 | 玩法形态 | **食谱制作 + 客人自动取用** |
| 4 | 等级 | **要升级**，等级影响座位/食谱/增益 |
| 5 | 评审修订包 | 全部接受评审推荐，P2-7 事实性驳回（v2 修订记录） |

连锁价值：咖啡角吃种子 → 温室有动力 → 接住「种子兑换完后种植意义」开放项。

## 二、系统设计

### 2.1 状态结构

```js
state.cafe = {
  unlocked: false,
  level: 0,                        // 1-5，0 = 未建造
  stock: { vanilla_tea: 2, ... },  // 库存：recipeId -> 件数
  totalServed: 0,                  // 累计招待（统计/成就用）
  lastServeDay: null,
  lastFeeDay: null                 // v3：维持费日结标记（防重复扣除）
}
// 温室花盆扩容（Phase 0 同批，见 §2.6）
state.plants = [ { ...原 state.plant 结构 } ]  // 1→最多 4 盆，迁移：单株包成数组
```

迁移：`state.cafe ||= 默认值`；`state.plant`（单数）→ `state.plants`（数组），老档单株包成 `[原株]`。

> **迁移期望（v3.1 新增，架构评审 A5）**：本 plan 字段为**纯加法**，与借阅 plan 的 visitor/book 字段（bookIds/borrowTimes）**无顺序依赖**；落地时须注明追加的 `MIGRATION_VERSION`，并由 verify「多 plan 同档迁移共存」断言覆盖（bookIds / pendingBorrowBuff / lastOffsiteDate / cafe / plants 默认态同档正确）。

### 2.2 建造与升级

| 项 | v1 | **v2** | 说明 |
|---|---|---|---|
| 建造门槛 | 2 阶 + 💰1500 | 不变 | 2 阶=破败 |
| 等级上限 | level ≤ stage+1 | 不变 | 复用 `data/atmosphere.js:176 getFacilityLevelCap`（已存在，P2-7 驳回依据） |
| 升级费 | 600×1.6ⁿ | **400×1.6ⁿ** | 升满 ~5,800（评审 D3） |
| 每级收益 | +1 座位 + 食谱 | +1 同时接待上限 + 食谱/增益交替（Lv2 星蕨特调）+ **招待增益随级** | 见 §2.4.5 |

### 2.3 食谱表（`data/cafe.js` 单一真源，v2 修订）

| 食谱 | 材料 | 售价 | 好感 | 解锁 | 每颗种子产出（对照兑换 26.7/33.3/40） |
|---|---|---|---|---|---|
| 🍵 香草茶 | 2 鹤望兰种子 | **50💰** | +4 | Lv1 | 25.0（94%） |
| 🌹 玫瑰露 | 2 魔法玫瑰种子 | **65💰** | +6 | Lv1 | 32.5（98%） |
| ✨ 星蕨特调 | 3 星光蕨种子 | **110💰** | +10 | **Lv2**（前置，评审 D4） | 36.7（92%） |

- 效率对齐兑换值的 ~92-98%，剩余 2-8% 差价 = 好感 + 借书增益的服务费（评审 D2 方案 A）。
- v2 定位修正：咖啡角不是高吞吐玩法（吞吐见 §五.1，日均 1.5-3 次是结构性上限），而是**「种子 → 币+好感+增益」的高价值转换口**——种子有了除兑换外的第二出口，制作按钮在效率对齐后成立。

### 2.4 自动营业规则（v2 修订）

1. 访客 browsing + 咖啡角已建 + **当日已付维持费（未停业）** + 库存非空 + 在店数 < 同时接待上限 → **25%/tick** 进店，判定挂在 `tickVisitorBrowsing`（`visitors.js`）入口、**borrowChance 判定之前**（**v3 修订，联合评审 D9**）。v2「先借阅判定后咖啡角」+ 借书概率增益的组合会让借书概率越高、进店窗口越短（Lv5 期望收益反低于 Lv1，联合评审 P0-1 推算表），且字面实现产生永不执行的死代码分支；v3 改为**每个 browsing tick 独立判定**，进店与增益彻底解耦。
2. **取用：库存加权随机**（库存件数越多越优先消耗，评审 D6）。
3. 结算：玩家得食谱售价、访客好感 +食谱值 ×(1+0.1×(Lv-1))（§2.4.5）。
4. **增益（废弃「延长停留」，评审 D5；v3.1 契约化，架构评审 A3）**：进店的访客获得「本次停留期间借书概率 +5%×咖啡角等级」（借到书或离开即失效）。**增益不改写 Borrow 的 `borrowChance`**——Cafe 只设 `visitor.pendingBorrowBuff = 0.05×level`（Cafe 的写入点），Borrow 在 `attemptBorrow` 计算 borrowChance 时 `+= visitor.pendingBorrowBuff ?? 0`（Borrow 的读取点）；双方互不直写对方内部变量，契约声明见 §2.7。理由：browsing 平均仅 2.5 分钟，延长时间无载体；借书概率是真实价值且喂养主玩法。UI 文案不用「延长停留」旧表述。
5. 产出**不加氛围**（EXP 纪律不变）；每次招待写 history。
6. **时间跳跃（onTimeSkip）补算规则（评审 D8）**：按跳过小时数比例补算，公式 `补算次数 = min(floor(hours/6), 座位数, 库存可用数, 2×座位数)`——消耗真实库存、有封顶，防用时间跳跃刷招待。
7. **维持费（v3 新增，联合评审 D10；v3.1 修订，架构评审 A1/A6/A7）**：**每个活跃游戏日**首次营业 tick 扣除 `20×等级` 金币（Lv1 20 … Lv5 100/日，`lastFeeDay` 防重复扣）；日界判定统一走 `onNewDay()`（见 `daily-boundary-refactor-plan`，本 plan 动工前置），**离线日不补扣不罚**（闲置即冻结，放置语义）。金币低于当日维持费则进入**休眠**——不扣费、不招待、增益不生效，面板显示休眠标识；金币回升至当日维持费以上后**自动唤醒**。**休眠而非停业（A6）**：保护已投入的 7,300 沉没成本，长期 0 币不会把房间变成死投资。性质：**活跃日 sink**，防「回本后永久净流入」；休眠机制让维持费成为真实压力而非白扣。

### 2.5 每级增益（评审 D3/D4 新增；v3 座位改并发语义，D14）

| 等级 | 同时接待上限 | 食谱 | 招待增益 |
|---|---|---|---|
| Lv1 | 1 | 香草茶、玫瑰露 | 借书概率 +5%，好感 ×1.0 |
| Lv2 | 2 | +星蕨特调 | 借书概率 +10%，好感 ×1.1 |
| Lv3 | 3 | +新食谱槽（温室新植物批次填充，开放项） | 借书概率 +15%，好感 ×1.2 |
| Lv4 | 4 | —（增益档） | 借书概率 +20%，好感 ×1.3 |
| Lv5 | 5 | —（增益档） | 借书概率 +25%，好感 ×1.4 |

> **v3 语义修订（D14）**：「同时接待上限」= 并发在店访客数（保险丝，非吞吐瓶颈）。日均访客仅 ~2.4 位、停留 ~2.5 分钟，上限 5 几乎不触发——**升级的真实收益在食谱解锁与增益档位**，UI 不再把座位数字当主要卖点。

### 2.6 Phase 0：温室花盆扩容（同批前置，评审 D1）

- `state.plant` 单株 → `state.plants` 数组，**最多 4 盆**；新盆用金币解锁（800×1.8ⁿ，无阶段门槛，植物是休闲系统）。
- 浇水/施肥/收获逻辑逐株循环，单株数据结构不变。
- 供给重估：4 盆 × 单盆 ~10 天 1 颗 ≈ **2.5 天/颗 → 日均 0.4 颗**；对照 v2 材料消耗（每份 2-3 颗，日均招待 1.5-3 次）——供给仍低于吞吐，但咖啡角 v2 定位已改为「高价值转换口」而非「高吞吐」：**库存可累积，有料才营业，营业即高价值**。新植物批次（图南已定方向：延长主线 1 株 + 食材株 2 株）上线后供给再翻几倍，吞吐随时间自然松弛。
- 植物的浇水交互密度随盆数上升——4 盆为手感上限，超出需配「一键浇水」（v2 暂不做，记开放项）。

> **✅ Phase 0 已落地（2026-09-11，commit e973fd1 + 977ed08）**：`state.plants` 数组（migrateV7 单株→数组，盆位 0=原单株零漂移），解锁价 800/1440/2592 对应 2/3/4 盆（`plants.js` MAX_POTS/getNextPotPrice/unlockPot）；全部单株函数 potIndex 参数化（默认 0 兼容旧调用）；访客事件改随机活盆语义（单盆玩家行为逐字不变）；浇水机会/凋谢逐盆循环；UI 盆位横向排列 + 解锁卡 + 商店逐盆状态卡。测试 `scripts/test-greenhouse-pots.mjs` 34 项全绿。**实施时补充决策**：行动卡 water_plant 改全活盆 +25（原单株 quirk 保留）；新植物批次（食材株）上线时 Lv3 食谱槽照 §2.5 填充。

> **✅ 咖啡角本体已落地（2026-09-11，commit ed08554 + ab2718d）**：步骤 1-4 全执行。`data/cafe.js` 单一真源 + `js/core/cafe.js` 营业链路（cafeTick 挂 tickVisitorBrowsing 入口 borrowChance 之前，v3 D9 时序验收满足）+ `js/render/shop/cafe-panel.js` 面板 + 商店占位卡转正 + 访客 ☕ 标识 + migrateV8（A5 同档共存断言含 cafe/plants）。测试 `scripts/test-cafe.mjs` 51 项全绿（含 92-98% 数值对齐、维持费防重、休眠唤醒、补算封顶、失败信号 C 单调性解析断言）。**实施时补充决策**：①92-98% 断言容差 ±0.5pp——§2.3 表内 92% 为四舍五入展示值（星蕨特调实际 91.67%），售价 110 为评审定版不动；②在店时长取 3min（浏览均时 2.5min）；③onTimeSkip 原为死代码（无调用方），cafeOnTimeSkip 已挂入其中，时间跳跃检测将来接线上即生效；④招待好感只加 visitor.favorability 实时的，不累积 visitorFavors 聚合池（避免 visitors↔cafe 循环依赖）；⑤维持费不随时间跳跃补扣（活跃日 tick 口径，lastFeeDay 防重）。

### 2.7 与现有系统的关系

- 占位卡转正（`library-upgrades.js:367`）；访客 tick 接入（`visitors.js tickVisitorBrowsing`）；阶段门槛照抄 `data/atmosphere.js`（函数已存在）。
- `focus-orchestrator.js` 专注结算吸引访客——咖啡角吞吐受专注节律驱动，**不是挂机收益**（评审 P0-3 约束如实写入）。
- **耦合契约（v3.1 新增，架构评审 A3）**：Cafe 通过 `visitor.pendingBorrowBuff` 影响 Borrow 的 borrowChance——Cafe 只写这个字段，Borrow 只在 `attemptBorrow` 内读取；**双方不允许直接改写对方的内部计算**（Cafe 不碰 borrowChance 局部计算，Borrow 不改写 cafe 状态）。防止 Borrow 将来重构 borrowChance（抽函数/内部重算）时 buff 静默失效或双重叠加。

## 三、UI 设计

- **商店咖啡角卡**：未建=建造按钮（门槛/价格+🔒）；已建=等级徽章+「进入咖啡角」。
- **咖啡角面板**：等级/同时接待上限/增益一览/营业统计/停业标识；食谱卡（材料/售价/好感/库存/制作按钮，材料不足置灰）；升级按钮（价格+下一级预览：食谱或增益）。
- **招待反馈**：toast + history；buff 生效时访客卡有小图标（☕）。
- **温室**：盆位横向排列，新盆解锁按钮；单株交互不变。

## 四、实施步骤（v2 重排）

0. **温室花盆扩容**（供给先行）：`state.plants` 重构 + 迁移 + UI 盆位排布。（评审 D1：先于或同批于咖啡角）
1. 数据层：`data/cafe.js` + `state.cafe` schema + migrations。
2. 核心层：建造/升级/制作/自动营业（含库存加权、增益、时间跳跃补算）。
3. UI 层：商店卡转正 + 咖啡角面板 + 温室盆位 + toast。
4. 校验：verify 加第 8 节（食谱数值对齐兑换率 92-98% 断言/增益随级/补算封顶/失败信号 C 自动断言——按 §2.3 售价表 + §2.5 增益表数学推演 Lv1 与 Lv5 单位访客期望收益（进店判定在 borrowChance 之前的口径），断言 Lv5 > Lv1，防 P0-1 反噬回归/**v3.1：多 plan 同档迁移共存断言，A5**）；check:imports。
5. i18n：新词条中英双语（废弃 coffeeCornerDesc 旧文案）。

## 五、数值与风险（v2 重算）

### 5.1 吞吐与回本（评审 P0-3 重算）

日均访客 ~2.4 位（专注驱动生成的结构性上限）。**v3 重算（D9 时序修复后，库存充足口径）**：期望 browsing 停留 = 1/(1-borrowChance) tick，期望招待 = 停留 × 25%/tick——Lv1：1.82 tick → 0.46 次 ×50 ≈ **23 币/访客**；Lv5：2.86 tick → 0.71 次 ×110 ≈ **79 币/访客**，Lv5 ≈ Lv1 的 3.4 倍，升级恢复严格正收益（v2 顺序下 Lv5 反低于 Lv1，联合评审 P0-1 推算表）。扣除维持费摊销（按 2.4 访客/日：Lv1 ~8、Lv5 ~42 币/访客），净利仍随级递增（Lv1 ~15 → Lv5 ~37 币/访客）。

日毛利 Lv1 55-110💰（扣维持费后净 35-90），建造 1500 回本 **10-23 天**；升满追加 ~5,800，回本再 ~50-100 天。年化维持费 7,300 ≈ 建造+升满成本——**回本后是「高维护费的小额稳健生意」，不是印钞机**（联合评审 P0-2 修复目标）。定位：**小额稳健投资 + 种子转换口**。

### 5.2 EXP 纪律

产出零氛围（多本/寄读/吐槽同纪律）；实施后 grep `addAtmosphere` 确认咖啡角链路零调用。

### 5.3 好感日上限核算（评审 P2-8）

browsing tick +1~2/分钟级 + 还书 +5~ + 咖啡角 +4~14/次 × 1.5-3 次 ≈ 日增 15-35。好感用途（访客叙事/羁绊未来）vs 无 sink——**好感堆积是系统级问题，咖啡角增量 <30% 不背锅**，但记总账：后续访客深度玩法须带好感消耗口。（v3：总账归口 `docs/plans/sink-ledger.md` 好感线，联合评审 D12）

### 5.4 其他风险

- 库存加权取用可能长期消耗不完某件高价库存——可接受（玩家可手动平衡制作配比）。
- 时间跳跃补算封顶已防刷；若未来出现低成本时间跳跃源需复审。

## 六、开放项

- 温室新植物批次（延长主线 1 株 + 食材株 2 株，图南已定方向待排期；各需 5 张阶段立绘，美术债）。
- 一键浇水（盆数 >4 时再做）。
- 展览厅计划（另立文档）。

## 七、验收标准

1. 老档迁移：`state.plant` 包成 `state.plants[0]`，`state.cafe` 默认态，零破坏。
2. 未达 2 阶不可建造；等级上限 stage+1 生效。
3. 食谱售价/材料与兑换率 92-98% 对齐（verify 断言）。
4. 库存加权取用；增益随级（借书概率/好感乘区）生效且 UI 如实描述。
5. 时间跳跃补算消耗真实库存、封顶 2×座位。
6. 全程零氛围产出；verify 新增节全过；check:imports 过；drift 0。
7. **维持费链路（v3.1）**：**每个活跃游戏日**扣除 20×等级（离线日不补扣，日界走 `onNewDay()`）；金币低于当日维持费进入**休眠**（不扣费、不招待、增益不生效、有标识），回升自动唤醒；`lastFeeDay` 防重复扣。
8. **进店判定时序（v3）**：咖啡角判定在 borrowChance 判定之前执行（代码评审可见插桩位置），无死代码分支。

### 失败信号（v3 新增，联合评审 D13）

| 信号 | 判据 | 含义 | 处置 |
|---|---|---|---|
| A 制作冷启动 | 上线首月制作按钮点击率 < **30%**（玩家仍直接兑换种子） | 92-98% 效率对齐仍不够 | 再提售价或加制作独占收益 |
| B 长期停摆 | 库存为空的天数占比 > **70%** | 供给仍不足，房间名存实亡 | 提温室供给 / 降材料消耗 |
| C 升级反噬 | **Lv5 单位访客收益 < Lv1** | P0-1 反噬回归 | 回炉时序/增益设计 |

信号 C 为可自动化断言，已列入 §四.4 verify 第 8 节。

## 八、相关文件

- `js/plants.js` / `data/plants.js`（花盆扩容 + 种子只读引用）、`js/render/shop/library-upgrades.js`（占位卡转正）
- `js/visitors.js`（tick 接入）、`js/core/focus-orchestrator.js`（专注驱动约束）
- `js/state/state.js` / `js/state/migrations.js`、`data/cafe.js`（新建）、`data/atmosphere.js`（门槛函数复用）
- `js/i18n/terms.js`、`scripts/verify-atmosphere-narrowing.js`
- 联合评审：`reviews/borrow-cafe-joint-review-v2.md`；架构评审：`reviews/economy-subsystem-architecture-review.md`；待补 sink 台账：`sink-ledger.md`（好感/金币线）；日界前置：`daily-boundary-refactor-plan.md`（A1，动工第 0 步前置）

## 对账注记（2026-09-16）

- **植物照料改版 · 浇水全局池**（`3db1351`，2026-09-15/16 玩家反馈驱动）：浇水次数改全局累积（state.water，有无植物都累积、可分配给任意一盆），v11 收编旧 per-pot 字段；植物消失三重告知（凋谢弹窗/温室持久红卡/墨墨日记）；行动卡改全局池判定。温室/咖啡角共用植物线，锚定本文档
- **台风模拟改全局池建模**（`45a037f` 半侧）：plant-typhoon-sim 同步全局池口径（成熟后余量留池不浪费）
