---
status: done
importance: 3
scheduledDate:
anchors:
  - { type: file, path: "docs/plans/daily-boundary-refactor-plan.md", weight: 0.1 }
  - { type: file, path: "js/core/day-boundary.js", weight: 0.2 }
  - { type: file, path: "scripts/test-day-boundary.mjs", weight: 0.1 }
  - { type: file, path: "js/app.js", weight: 0.2 }
  - { type: file, path: "js/storage.js", weight: 0.2 }
  - { type: file, path: "js/dailytasks.js", weight: 0.1 }
  - { type: file, path: "js/diary.js", weight: 0.1 }
  - { type: file, path: "js/achievements.js", weight: 0.1 }
  - { type: file, path: "js/actioncards.js", weight: 0.1 }
  - { type: file, path: "js/state/state.js", weight: 0.1 }
  - { type: file, path: "js/state/migrations.js", weight: 0.1 }
  - { type: file, path: "docs/plans/cafe-corner-plan.md", weight: 0.1 }
  - { type: file, path: "docs/plans/borrow-demand-deepening-plan.md", weight: 0.1 }
  - { type: file, path: "docs/plans/reviews/economy-subsystem-architecture-review.md", weight: 0.1 }
---

# 日界统一重构计划（daily-boundary-refactor-plan）v1

> 立项：2026-09-10，经济子系统架构评审 A1（🔴 必改），图南已拍板。
> 性质：**小重构、大收益**——一次投入，cafe 维持费 / 寄读日结 / 每日任务 / 日记 streak / 成就日限全路由，且未来所有「每日」机制（展览厅等）不再散点负债。

---

## 一、问题（评审核实）

全项目无集中的日界事件，各系统各自 `toDateString()` 比较：

| 现状散点 | 位置 | 用途 |
|---|---|---|
| `js/diary.js:222` | `new Date().toDateString()` | 日记日判 |
| `js/state/storage.js:127` | `toDateString()` | 日 streak |
| `js/achievements.js:351-357` | `momoCommentUsedToday` | 成就日限 |
| `js/core/dailytasks.js:11` | `todayKey()` | 每日任务 |

**后果**：两份 v3.1 plan 的「每日」机制将挂两套钩子（cafe 维持费=浏览 tick，寄读=登录），同一游戏日触发时刻错位；「持续 sink」措辞与「仅活跃会话日发生」行为不符，验收会判不通过；后续每期新「每日」机制都往散点里加，债务累积。

## 二、设计

### 2.1 核心原语

```js
// js/core/day-boundary.js（新建，单一真源）
export function checkDayRollover(state) {
  const today = new Date().toDateString();
  if (state.lastSeenDay === today) return null;
  const prevDay = state.lastSeenDay;
  state.lastSeenDay = today;
  emit('onNewDay', { prevDay, today });   // 订阅者模式，与现有事件总线同惯例
  return { prevDay, today };
}
```

- **触发点两处**：① 存档 load/login 后（`app.js` 初始化链）；② 60s tick（`app.js:259 tickVisitors` 同周期）内检测本地跨日——app 持续开着过 0 点也能触发。
- **state 加 `lastSeenDay`**（迁移：纯加法，`state.lastSeenDay ||= today`）。
- **离线语义**：多天未开 app，下次登录只触发**一次** `onNewDay`（prevDay=上次活跃日）——**不补发中间天数**（闲置即冻结，与 cafe 休眠/寄读冻结同口径）。

### 2.2 路由清单（迁移目标）

| 系统 | 现状 | 迁移后 |
|---|---|---|
| 每日任务 `dailytasks.js todayKey()` | 各自日期比较 | 订阅 onNewDay 刷新任务 |
| 日记 streak `storage.js:127` | 各自日期比较 | 订阅 onNewDay 判定连续 |
| 成就日限 `achievements.js:351` `momoCommentUsedToday` | 各自重置 | 订阅 onNewDay 清日限 |
| 日记日判 `diary.js:222` | 各自日期比较 | 订阅 onNewDay |
| **cafe 维持费**（cafe v3.1 §2.4.7，未实施） | 计划挂浏览 tick | **onNewDay 触发扣除判定**（`lastFeeDay` 保留防重） |
| **寄读日结**（borrow v3.1 §4.1，未实施） | 计划挂登录钩 | **onNewDay 触发结算**（`lastOffsiteDate` 保留防重） |

> 已有机制（前四行）迁移是**行为等价重构**——先在重构前补现状行为单测（seed 固定日期断言），重构后跑同测，零行为漂移。

### 2.3 明确不做

- 不做跨多日补发（冻结语义，A8 已拍板）。
- 不引入真实时区/夏令时处理（单机游戏，`toDateString()` 够用）。
- 不改任何机制数值——本 plan 只统一「何时算新的一天」。

## 三、实施步骤

0. **行为基线测试**：对 diary streak / dailytasks / achievements 日限三处写现状快照测试（固定 `Date` seed），锁定重构前行为。
1. 新建 `js/core/day-boundary.js`（checkDayRollover + 订阅注册）；`state.lastSeenDay` 迁移。
2. 两处触发点接入（load/login 链 + 60s tick）。
3. 四个存量系统逐个迁移到 onNewDay（一次一个 commit，每个 commit 跑基线测试）。
4. cafe/寄读的 plan 实施时直接挂 onNewDay（本 plan 先行落地，它们在各自实施步骤第 0 步引用）。
5. 校验：`grep -rn "toDateString" js/` 确认业务代码零散点（仅 day-boundary.js 内）；check:imports；drift 0。

## 四、验收标准

1. 存量四系统行为与基线测试完全一致（零漂移）。
2. 跨日两种路径（开着过 0 点 / 隔日登录）都恰好触发一次 onNewDay。
3. 离线 3 天登录只触发一次，不补发。
4. 业务代码 `toDateString()` 全收敛进 day-boundary.js。
5. cafe 维持费与寄读日结挂入后，`lastFeeDay`/`lastOffsiteDate` 防重断言通过（多 plan 同档共存断言的一部分，A5）。

## 五、失败信号

| 信号 | 判据 | 含义 |
|---|---|---|
| A 双触发 | 跨日单次 onNewDay 订阅者收到两次事件（测试可断言） | 触发点竞态，修去重 |
| B 漏触发 | 开着过 0 点但 cafe 费当日未扣（lastFeeDay 滞留昨日） | tick 检测缺失 |
| C 补发风暴 | 离线 N 天触发 N 次事件 | 冻结语义被破坏，回 §2.3 |

## 六、前置关系

- **本 plan = cafe-corner-plan 与 borrow-demand-deepening-plan 的动工第 0 步前置**（两 plan v3.1 已各自声明）。
- 动工序列更新：`daily-boundary-refactor → 温室扩容 → 咖啡角 → 借阅深化`。

## 七、相关文件

- 新建：`js/core/day-boundary.js`；改造：`js/app.js`、`js/storage.js`、`js/dailytasks.js`、`js/diary.js`、`js/achievements.js`、`js/state/state.js`/`migrations.js`
- 消费方：`cafe-corner-plan.md` §2.4.7（维持费）、`borrow-demand-deepening-plan.md` §4.1（寄读日结）

---

## 八、实施记录（2026-09-11 落地，7 commits）

实施步骤 0-5 全执行：基线 24 项 → 全量 39 项全绿；`check:imports` 通过；grep 审计通过。

**与本文档的偏离（均有测试锁死，均为有意决策）：**

1. **streak 不挂 onNewDay**（§2.2 迁移表第一行 aspirational）。streak 语义是「连续**专注日**」，由专注完成驱动；挂活跃日边界后，只开 app 不专注的隔天会错误影响 streak——违反验收标准 1（零漂移）。实际处理：仅收敛日期原语（getTodayKey/getPrevDayKey），判定逻辑原样。测试 S6 有「onNewDay 不触碰 streak」断言。
2. **每日任务日期 key 从 UTC 统一为本地日历日**（原 `toISOString().slice(0,10)`，北京时间早 8 点刷新 → 零点刷新）。这正是 A1 要消灭的「触发时刻错位」之一，属统一范围而非数值改动。
3. **第五处散点**：`js/actioncards.js` ensureDailyReset（行动卡日限）不在 §一 清单里，grep 审计时发现，已同套路迁移。
4. **死代码清除**：`focus.todayMinutes` 全仓库只写不读，migrateV1 的日期检查块随之删除。
5. **路径勘误**：§一/§七 引用 `js/state/storage.js`、`js/core/dailytasks.js`，实际为 `js/storage.js`、`js/dailytasks.js`（frontmatter 锚点已按实际路径修正，原错误路径锚点等于没锚）。
6. **惰性兜底全部保留**（ensureDailyTasks / ensureDailyReset / pickMomoComment 内部守卫）：事件未触达的直调链不炸，同日零开销。

**落地后消费契约（cafe / 寄读动工时直接引用）：**

```js
import { onNewDay } from './core/day-boundary.js';
// 维持费/寄读日结：onNewDay(({ prevDay, today }) => { ... })
// 防重字段（lastFeeDay / lastOffsiteDate）照旧各自保留，多 plan 共存断言用
```
