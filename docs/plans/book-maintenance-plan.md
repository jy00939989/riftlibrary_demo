---
anchors:
  - { type: file, path: "js/core/book-progress.js", weight: 0.1 }
  - { type: file, path: "js/core/focus-session.js", weight: 0.1 }
  - { type: file, path: "js/capacity.js", weight: 0.1 }
  - { type: file, path: "js/render/library.js", weight: 0.1 }
  - { type: file, path: "js/dailytasks.js", weight: 0.1 }
  - { type: file, path: "data/borrow-levels.js", weight: 0.1 }
  - { type: file, path: "docs/plans/book-maintenance-plan.md", weight: 0.1 }
---

# 归墟图书馆 · 古籍保养机制计划（v2）

> 目标：给磨损账本加「主动管理」层——馆长可在古籍修复室对**未损毁**的书做预防性保养：
> 磨损清零、书况归「崭新」；工时远小于修复（1.5%~8% vs 15%），支持多本一批。
> 解决「只能看着书越来越破、坏了再修」的被动困境。
>
> 图南 2026-10-24 首轮拍板：①效果只清磨损不加保护期；②成本按已抄字数百分比阶梯；
> ③批次上限随修复室等级 1→4，**批次一体结算**（中途退出=挂起续作，图南否决逐本结算）；
> ④奖励只给氛围；⑤崭新不可保养。
>
> **2026-10-24 v2 已实施**：全部落地——data/maintenance.js + core/maintenance.js +
> focus-session 活动类型轴 + dailytasks 4选3 与修缮日任 + 修复室保养台 UI +
> 专注页批次进度条 + 挂起/续作 + 损坏通报预计时长 + terms + test-maintenance.mjs 13/13；
> 全量回归（20+ 脚本）无红。check:imports 绿。
>
> **2026-10-24 v2 修订**（过评审 docs/plans/reviews/book-maintenance-plan-review.md + 图南二轮拍板）：
> - **P0 氛围口改判**：保养完成**不再直接给氛围**；改为嫁接每日任务体系——新增第 4 个日任
>   「修缮一本古籍」（**保养或修复任一计数，每日一次 +2 氛围**），日任规则改为 **4 选 3** 拿全勤奖。
>   评审原方案 A/B/C 废弃；「每日每书首次」废弃（图南：每日只有一次）。
> - **修复奖励不动**（+30 币 +1 灵感 +1 氛围 保留）。
> - 损坏通报升级：显报「修复期间暂停外借」+ **弹窗显示预计修复时长**。
> - 补「设计意图」段（保养=主动路径 / 修复=疏忽安全网）；接受活动类型轴方案；
>   P2 五条全收（速度加成绕损坏门槛、成本 Math.max 防御、schema 冗余字段删除、
>   批次封顶 4 写明设计意图、挂起期间重抄脏数据兜底 + 重载续作入口）。

---

## 一、设计意图（评审 P1 补段，先立支柱）

> **保养 = 主动路径**：便宜（1.5%–8%）、可反复，价值在**避免损坏 downtime**——书永远能借，
> 收入不断，书况好看。
> **修复 = 疏忽的安全网**：贵（15% 蒸发 + 15% 工时）+ 断借书收入 + 磨损滚雪球。
> 二者不是重复 sink，是「勤 vs 懒」的权衡：玩家此刻的决策是「现在花小工时打理，
> 还是放任去赌它暂时不坏」。
> 每个机制必须能回答「玩家此刻在做什么决策、为什么做」——本机制的回答就是这句话。

## 二、已锁定决策

| # | 决策点 | 锁定 |
|---|---|---|
| 1 | 保养效果 | 仅 `wearCount → 0`，书况归崭新；**无保护期 buff**；损毁系统存活（借阅继续累积磨损） |
| 2 | 成本口径 | 每本工时 = `copiedWords × 阶梯率`（下限防御 `Math.max(copiedWords,1)`），与修复同账本（15%） |
| 3 | 批次规则 | 上限随修复室等级：Lv0→1 / Lv1→2 / Lv2→3 / **Lv3+→4（封顶 4 为设计意图，Lv4/Lv5 不增）**；**一体结算**，可挂起续作 |
| 4 | 奖励 | 保养完成**零直接奖励**（仅历史+墨墨日记）；**+2 氛围挂每日任务「修缮一本古籍」**（保养或修复任一计数，每日一次）；日任体系改 **4 选 3** 全勤 |
| 5 | 崭新（磨损 0） | 不可保养，按钮置灰；损毁中书在修复队列，不混进保养台 |
| 6 | 修复奖励 | **不动**（+30 币 +1 灵感 +1 氛围）；修复本身的高成本（蒸发+downtime）即放任的代价 |
| 7 | 速度加成 | 保养吃 `getRestorationRepairSpeedBonus`（+10%/级），**绕过 `bookIsDamaged` 门槛**单独挂 |

## 三、数值表（真源 data/maintenance.js）

| 书况 | 磨损区间 | 保养率 | 相对修复（15%） |
|---|---|---|---|
| 良好 | 1–4 | 1.5% | 1/10 |
| 微旧 | 5–9 | 3.0% | 1/5 |
| 破旧 | 10–14 | 5.0% | 1/3 |
| 濒危 | 15+ | 8.0% | ≈1/2 |

- `getMaintenanceWords(bookState)` = `ceil(max(copiedWords,1) × rate)`——`max(...,1)` 把
  「磨损书必有 copiedWords>0」从隐式不变量钉成显式防御（评审 P2）
- 整批工时 = Σ；曲线意图：**越拖越贵**

## 四、批次与结算规则

1. **保养台选书** → 生成批次（校验：未损毁 / 非崭新 / 非典藏 / 数量 ≤ 等级上限 / 无进行中批次）
2. **保养专注会话**：复用专注基础设施（计时、加速、光环、冲刺同规则），wordsGained 进批次进度池
3. **进度条按本分段**（视觉反馈），不落账——成果统一在整批完成时结算
4. **中途退出 = 挂起**：进度保留，可续作至完成；不存在「已完成单本」的中间态
5. 整批完成 → 逐本 `wearCount = 0` + 历史逐条 + 墨墨日记汇总；**奖励走日任钩子**（见 §五）
6. **活动类型轴**（评审 P1）：`state.currentSession.activity = 'copy'|'repair'|'maintenance'`
   与计时模式正交；旧会话无该字段时按旧逻辑懒推导（repairOnly）。maintenance 分支显式跳过
   `applyWords`，独立路由 `applyMaintenanceProgress`；修复室速度加成对 maintenance 生效
   **不依赖 damaged**

## 五、数据 Schema 与代码改动点

```js
// state.maintenanceSession（进行中或挂起；完成即删除）
{
  bookIds: ['book_003', 'book_007'],
  perBook: { book_003: 900, book_007: 450 },
  progressPool: 0,
  startedAt, pausedAt
  // 无 restorationLevelAtStart——成本开场已算定，字段冗余（评审钉子#1，删除）
}
// state.currentSession.activity: 'copy' | 'repair' | 'maintenance'（新轴；旧档懒推导）
```

| 文件 | 改动 |
|---|---|
| `data/maintenance.js`（新） | 保养率表 / 工时计算 / 批次校验纯函数（node 可直测） |
| `js/core/maintenance.js`（新） | startMaintenanceSession / applyMaintenanceProgress / 挂起续作 / 完成结算 / **挂起期间脏数据兜底**（书被借出→剔除退工时；书损毁→转修复队列剔除退工时；**书被重抄完成 copyCount+1 → 按实时 copiedWords 重算目标或安全剔除**） |
| `js/core/focus-session.js` | 引入 activity 轴；maintenance 分支跳过 applyWords、挂修复室加成（绕 damaged 门槛） |
| `js/capacity.js` | `getMaintenanceBatchCap()` = Lv0→1, Lv1→2, Lv2→3, **Lv3+→4（封顶，设计意图）** |
| `js/dailytasks.js` | 加 `maintainDone`；新任务「修缮一本古籍」（保养或修复完成回调，+2 氛围，每日一次）；**全勤判定改 4 选 3**；任务卡动态条件：存在可保养书或损毁书时显示该任务 |
| `js/render/library.js` | 修复室内「保养台」面板（勾选/书况徽标/工时/批次合计条/挂起续作入口） |
| `js/render/index.js` 等 | 专注页「保养批次」显示（分段进度条）；**重载后续作恢复**：currentSession 带 activity=maintenance 时专注页自动识别挂起批次 |
| `js/visitors.js` 损毁点 / 灾难弹窗 | 损坏通报加「修复期间暂停外借」+ **预计修复时长**（`repairWords ÷ 100字/分 ÷ (1+修复室加成)` 向上取整，弹窗与历史同显） |
| `js/i18n/terms.js` | 保养与修缮日任文案（中英） |
| `scripts/test-maintenance.mjs`（新） | 见 §六 |

## 六、测试要点

- 工时阶梯逐档断言；`copiedWords=0` 防御（结果 ≥1）；崭新/损毁/典藏的入批拦截
- 批次上限按等级（含 Lv3+ 封顶 4）；超上限拒绝
- 进度池满 → 逐本 wearCount 清零、会话对象清除、**保养本身不发氛围**（断言 state.atmosphere 不变）
- 挂起 → 续作 → 完成，进度无损；挂起期间借出/损毁/**重抄完成**三种脏数据兜底各自断言
- 活动类型轴：maintenance 会话不推进誊抄进度（applyWords 未被调用）；旧会话（无 activity）兼容
- 速度加成绕 damaged 门槛：maintenance 模式下修复室加成生效
- **日任**：修缮任务保养完成计数 +2 氛围、修复完成也计数、每日一次封顶；4 选 3 判定（完成任意 3 项即可全勤，含/不含修缮任务各一例）
- 中断会话不吞已投入工时（续作可追回）

## 七、不做

- 不消耗材料/道具；不做预约自动保养；不做保护期 buff
- 不改损毁/修复/磨损公式本体（保养只读消费 wearCount；修复奖励数值不动）
- 不做保养专属成就（后续批次可挂成就线）
