# 归墟图书馆 · 氛围系统拉长设计：场馆修复地图

> 状态：设计稿 v1.0（brainstorm 落地）
> 关联：economy-balance-review.md（§P0 氛围硬封顶问题）、visitor-memory-collection-plan.md（羁绊便签收集）
> 设计原则：不破坏现有 5 阶段叙事与成就；引入持续 sink 根治"攒到顶就空"；用新玩法丰富修复过程。

---

## 一、背景与现状（代码核实）

- 氛围 = `state.library.atmosphere`，**唯一硬封顶 500**（`storage.js:49`：`Math.min(500, ...)`）。
- 5 阶段叙事（`data/atmosphere.js`）：废墟 0–30 / 破败 30–80 / 陈旧 80–160 / 温暖 160–300 / 星辰 300–500。
- **🔴 关键事实：氛围当前零 sink。** 全代码库 grep `.atmosphere` 写操作，只有 `addAtmosphere`（visitors.js 多处加氛围）和读取；**没有任何 `spendAtmosphere` 或 `atmosphere -=`**。氛围阶段是自动升级（达阈值即升），不消耗氛围。→ 它是一条"只进不出、攒到 500 被截断"的纯累积值。
- 现有"氛围→解锁空间"先例：`data/planes.js` 的 `PLANES.pastoral.unlock.atmo:80`（位面解锁用氛围当门槛）。场馆房间可复用此模式，但 `rooms` 是**馆内空间**，与跨位面 `planes` 是两件事，文档明确区分。
- 痛点（economy-balance-review 实测）：典型玩家约 **33 天**撞 500，之后访客归还主奖励全部作废；叙事终点 = 数值终点，"星辰之境"之后空。

---

## 二、设计目标

1. 拉长第一空间旅程（用户要求"抬高整体门槛"）。
2. 500 之后不再是终点，而是新层起点。
3. **引入持续 sink**，根治"一劳永逸 / 攒到顶就空"。
4. 用新玩法内容（用户选定的 3 个）丰富修复过程。
5. 零/低迁移成本，保留现有 5 阶段叙事与成就。

---

## 三、核心框架：场馆修复地图

**概念**：氛围从"数值进度条"→"图书馆空间地图"。玩家修的不是抽象数值，是一栋会慢慢长出来的图书馆。

### 3.1 双池模型（关键架构决策）

| 字段 | 语义 | 范围 | 行为 |
|---|---|---|---|
| `state.library.atmosphere` | 藏书厅修复度（第一空间） | 0→500，**单向增长**，满后不再涨 | 作为"解锁场馆地图"门槛；保留现有 5 阶段叙事、成就(30/80/160/300/500)、UI 全部不动 |
| `state.library.venueAtmosphere` | 场馆自由氛围 | 解除封顶，**可增可减** | 用于房间解锁 / 维持 / 兑灵感 |

**访客归还奖励路由**（`addAtmosphere` 改造）：
- `atmosphere < 500` → 进 `atmosphere`（推第一空间）；
- 已满（≥500）→ 自动转 `venueAtmosphere`（自由池）。

→ 这就是用户认可的"溢出转"：溢出不再被 `Math.min` 截断，而是进**可消费池**。

> **为何双池而非单池**：若只用一个 `atmosphere` 总池且房间扣费从它走，玩家把自由氛围花光后总池可能 <500，第一空间进度条会"倒退"，视觉怪异。双池让第一空间永远单向增长到满（保留成就/叙事），自由池独立承担消费。

### 3.2 空间清单（用户选定）

| 空间 | 定位 | 解锁成本（自由氛围·一次性） | 维持成本（自由氛围/天） | 功能 / 奖励 |
|---|---|---|---|---|
| 藏书厅（第一空间） | 现有 5 阶段，门槛 | —（默认开放） | — | 修复度叙事；满 500 解锁地图视图 |
| 访客茶室 | B 羁绊落点 | 400 | 5 | 访客羁绊事件、限定便签；维持期羁绊概率↑ |
| 植物温室 | 植物联动 | 350 | 4 | 植物成长/收获加成；给"为什么种"的持续理由 |
| 露天庭院 | D 活动场地 | 500 | 6 | 现实日历活动的举办地；限定奖励发放口 |
| 档案室 | 藏限定内容 | 600 | 7 | 藏限定书/剧情碎片；维持期访客稀有度↑ |

> 数值为初版量级，上线按手感调（见 §十 决策 2）。

### 3.3 维持机制（C 玩法 · 持续 sink）

- **每日结算** `settleVenueMaintenance()`（focus 完成或登录时触发）：每个已解锁房间扣维持费；不足则房间"**暂暗**"（加成失效，已解锁不丢失——无惩罚性降级）。
- 提供"**一键维持全部**"按钮（花 `venueAtmosphere`）。
- 制造"有进有出"节奏，防一劳永逸。

---

## 四、三个玩法接入

### B 访客羁绊（茶室）
- 解锁茶室后，访客归还时可触发"**邀约**"：花自由氛围请喝茶 → 解锁羁绊剧情 + 限定便签。
- 维持茶室期间，羁绊事件概率提升。
- 便签收集复用 `visitor-memory-collection-plan.md` 的 `visitorMemory` 模块（按 charId:eventId 去重入库）。

### C 养护维持（全局）
- 见 §3.3。是所有房间的统一 sink。

### D 限时活动（庭院 · 现实日历）
- **锚点（不挂星象，用户明确要求）**：世界图书日(4/23)、作家诞辰/纪念日（用户播客讲过的英美文学作家）、国际档案馆日等。
- 活动期庭院开放特别事件，投入氛围/专注得限定奖励（限定书 / 装饰 / BGM）。
- 需新增轻量"日期事件"检查（`isEventDay(today)` 读系统日期匹配静态日历表）。现有无时间调度框架，见 §八 风险。

---

## 五、溢出兜底：自由氛围 → 灵感

- 当玩家暂不解锁/维持房间时，提供"**兑换**"入口：每 **50 自由氛围 → 1 灵感**（对齐现有灵感稀缺度：灵感 1.6/天，刷满 68 本 5 星需 544 点）。
- 这是用户明确认可的"氛围兑换灵感"，作为自由池的兜底消耗，确保**没有任何氛围来源变废纸**。

---

## 六、与现有系统关系 & 迁移

- **硬封顶解除**：`storage.js:49` 的 `Math.min(500, ...)` 改为——`atmosphere` 仍 clamp 500（单向满），超出路由到 `venueAtmosphere`。`addAtmosphere(points)` 内部：
  ```js
  const room = 500 - state.library.atmosphere;
  if (room > 0) {
    const toFirst = Math.min(room, points);
    state.library.atmosphere += toFirst;
    const rest = points - toFirst;
    if (rest > 0) state.library.venueAtmosphere += rest;
  } else {
    state.library.venueAtmosphere += points;
  }
  ```
- **planes.js 区分**：现有 `PLANES[].unlock.atmo` 是跨位面门槛（pastoral 需 80），与馆内 `rooms` 是两件事。本设计**不碰 planes**，rooms 走 `state.library.venue`。
- **UI 兼容**：`render/library.js` 第一空间进度条 `min(atmosphere,500)` 不变；新增"场馆地图"视图 + 自由氛围显示（`render/common.js` 顶栏可加 `venueAtmosphere` 图标）。
- **成就兼容**：现有氛围成就(30/80/160/300/500)基于 `atmosphere`（第一空间），不受影响。
- **state 新增**：
  ```js
  state.library.venueAtmosphere = 0;
  state.library.rooms = {
    tea:        { unlocked: false, maintained: true, lastSettleDay: null },
    greenhouse: { unlocked: false, maintained: true, lastSettleDay: null },
    courtyard:  { unlocked: false, maintained: true, lastSettleDay: null },
    archive:    { unlocked: false, maintained: true, lastSettleDay: null },
  };
  ```
- **migration**（`js/state/migrations.js` 加 v(N+1)）：
  ```js
  state.library.venueAtmosphere ||= 0;
  state.library.rooms ||= { tea:{unlocked:false,maintained:true,lastSettleDay:null}, greenhouse:{...}, courtyard:{...}, archive:{...} };
  ```
  老存档 `atmosphere < 500` 继续推第一空间，零破坏。

---

## 七、实施步骤（分阶段，最小集优先）

- **Phase 1（打地基·零风险）**：解除硬封顶 + 双池路由 + migration + 顶栏显示自由氛围。→ 立即解决"溢出作废"。
- **Phase 2**：场馆地图视图 + 4 房间解锁/维持 UI + `settleVenueMaintenance`。
- **Phase 3**：B 访客羁绊（茶室）。
- **Phase 4**：D 限时活动（庭院 + 日期事件框架）。
- **Phase 5**：溢出兑灵感入口。
- （温室/档案室功能可在 Phase 2 一并或后续）

---

## 八、风险与 trade-off

- **休闲玩家焦虑**：维持"暂暗无惩罚"已规避；需确保默认维持费低、且"不维持只是少加成"。
- **数值通胀**：房间奖励（访客率 / BGM / 稀有度）需控制，避免强于现有升级。
- **日期事件框架**：D 玩法需新增"今日是否活动日"检查。静态日历表维护成本低（hobby 友好），但首次实现有工作量。
- **双池认知负担**：玩家要理解"藏书厅氛围 vs 自由氛围"。UI 明确区分（第一空间进度条 vs 自由池图标），文案讲清。
- **自由氛围也可能堆积**：若玩家狂攒不花，`venueAtmosphere` 无上限——但兑灵感兜底吸收 + 房间维持持续消耗，实际不会堆积。

---

## 九、验收标准

1. 老存档加载无破坏，`atmosphere < 500` 正常推第一空间。
2. `atmosphere` 达 500 后，访客归还奖励进 `venueAtmosphere`，不再被截断。
3. 4 房间可解锁、可维持；维持不足时加成正确失效/恢复。
4. 茶室羁绊事件可触发并收集（复用 `visitorMemory`）。
5. 庭院活动日正确触发（用系统日期测试，含非活动日回退）。
6. 自由氛围兑灵感入口生效，无氛围来源变废纸。

---

## 十、待定决策清单（需图南拍板）

1. **第一空间门槛是否保留 500（推荐）还是抬高？**
   → 我推**保留 500**：抬高会破坏现有成就(500 阈值)和 5 阶段叙事文案；"总旅程拉长"由双池 + 房间实现（玩家要花远多于 500 的自由氛围才能玩透），等价于"抬高整体门槛"的效果，却不破坏现有内容。若坚持抬高，建议抬到 800–1000 并同步改成就/文案。
2. **房间解锁/维持数值初版是否接受 §3.2 量级**（400/350/500/600 解锁，5/4/6/7 维持）？
3. **兑灵感比率 50:1 是否合适**？
4. **D 活动首批日历锚点清单**（你来定作家/日期）？
5. **双池 vs 单池** → 我推**双池**（避免第一空间进度条倒退怪象）。

---

## 附：与现有模块呼应

- `visitor-memory-collection-plan.md`：茶室羁绊便签直接复用其 `visitorMemory` 收集层。
- `economy-balance-review.md` §P0：本设计直接解决"氛围硬封顶 + 零 sink"问题。
- `data/planes.js`：跨位面解锁的 `atmo` 门槛模式可参考，但本设计 rooms 独立于 planes。
