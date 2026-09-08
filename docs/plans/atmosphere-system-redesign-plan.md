---
status: backlog
importance: 3
scheduledDate:
anchors:
  - { type: file, path: "docs/plans/atmosphere-system-redesign-plan.md", weight: 0.1 }
  - { type: file, path: "js/storage.js", weight: 0.1 }
  - { type: file, path: "js/visitors.js", weight: 0.1 }
  - { type: file, path: "js/capacity.js", weight: 0.1 }
  - { type: file, path: "js/core/economy.js", weight: 0.1 }
  - { type: file, path: "js/core/shop/library-upgrades.js", weight: 0.1 }
  - { type: file, path: "js/core/book-progress.js", weight: 0.1 }
---

# 氛围系统重设计（atmosphere-system-redesign）

> 立项：2026-09-08，图南发起并 grill 锁定 10 项决策。**本文档吸收合并 atmosphere-venue-map-design（场馆修复地图）**；
> economy-balance-review 的旧「500 硬封顶」结论随本设计整体失效。
>
> **修订 v2（2026-09-08）**：过架构评审（review 见 `reviews/atmosphere-system-redesign-plan-review.md`），
> P0-1 升阶矛盾/P0-2 通胀闸/P0-3 阶段数三处已解，评审事实错误两处已驳回（修复室轨道在 capacity.js 存在；
> 重抄完成点在 book-progress.js:63）。**所有具体数值标 `[PLACEHOLDER]`，收支测算脚本为 P0 门槛。**
>
> 核心命题：氛围从「水位值」重设计为**消耗品**——有库存、有产能、有消费口，设施成为固定资产。

---

## 〇、玩家体验目标（评审 P1-1 增补，各 Phase 过审标准）

1. **长期目标感**：每次上线都知道「我在为下一个升阶仪式攒钱攒任务」，而不是看着水位条无意义地涨
2. **资源博弈**：花氛围升设施（产能）还是攒着升阶（地位）还是兑灵感（即时爽），三选一要有真实的取舍痛感
3. **固定资产养成**：设施是「我的图书馆在实体上变好了」的可见证据，升级瞬间要有仪式感

## 一、十个已锁定决策（2026-09-08 grill 全记录）

| # | 决策点 | 结论 |
|---|---|---|
| 1 | 阶段与库存关系 | **最高水位制**：阶段只进不退，库存可花。state 新增 `atmospherePeak`（仅作仪式门槛，见 §二） |
| 2 | 库存上限 | **双池制**：藏书厅库存保 500 封顶，溢出自动入**自由氛围池** |
| 3 | 升阶机制 | **升阶仪式制**：peak 达阈值解锁仪式入口；手动消耗大笔氛围 + 完成修缮任务链，成功后 `stage++` 永久生效 |
| 4 | 设施固定氛围形态 | **一次性 + 每日混合**：升级时一次性大头入库存，之后每日结算小产出（离线补算） |
| 5 | 设施范围 | 设计全覆盖；**MVP 三项**：缮写室 / 借阅区 / **修复室（轨道在 `js/capacity.js`，非 library-upgrades.js）** |
| 6 | 双消耗曲线 | **占比随级爬升**：低等级纯智慧之光（新手保护），高等级氛围成大头 |
| 7 | 升阶前置 | **修缮任务链**：每阶一串修缮任务（物资+氛围），设施等级是链上一环 |
| 8 | 老档迁移 | **保底映射 + 不追溯**：阶段按 peak 映射、设施一次性加成**按旧 +15/级**补发入库存、每日产出自今日起算、赠「开馆元老」成就+称号 |
| 9 | 损毁递增 | **单书借阅磨损**：每本书的还书损毁率随借出次数缓升；**重抄清零**（钩子挂 `book-progress.js:63` copyCount 落点） |
| 10 | 自由池出口 | **50:1 兑灵感（设每日上限）+ 四个场馆房间**，加通胀双闸（见 §五） |

插单决策：**典藏版借出回报调高**（典藏版免疫损毁+免疫磨损，作为对价还书收益显著上调，坐实「终极产物」地位）。

## 二、系统模型（P0-1 修订：stage 独立字段，peak 只作仪式门槛）

**状态 schema 新增（migration 一并落地）**：
```
state.library.atmospherePeak   // 历史最高水位，只增不减
state.library.stage            // 当前阶段 1-5，独立字段，仪式推进
state.library.freeAtmosphere   // 自由氛围池（避开旧 venueAtmosphere 命名，venue 方案已吸收）
state.books[bookId].borrowCount // 借阅磨损计数（决策 9）
```

**阶段推进（修订后唯一路径）**：
```
atmosphere ≥ 阈值[N+1]  →  解锁「N→N+1 升阶仪式」入口
     ↓（手动发起）
消耗大笔氛围 + 完成本阶修缮任务链  →  state.library.stage++（永久，之后花光库存也不掉段）
```
- **5 阶段**（评审 P0-3 勘误，原写 6 有误）：废墟 0-30 / 破败 30-80 / 陈旧 80-160 / 温暖 160-300 / 星辰 300-500，沿用 `data/atmosphere.js` 现有叙事
- 阈值语义改变：不再「自动跳阶」，只决定「仪式可发起」
- **两套 stage 推导函数同时停薪**：`getAtmosphereStage`(data/atmosphere.js) 与 `getAtmosphereLevel`(economy.js) 改为只读 `state.library.stage`（评审 P2-5）；全部 ~25 文件 / ~75 处 `state.library.atmosphere` 读取需全局排查分流（评审 P2-4）

```
            抄写 / 还书 / 访客事件 / 植物 / 设施每日产出
                    ↓ 流入
            ┌──────────────┐   溢出(满500)
            │  藏书厅库存   │ ─────────────→ ┌──────────────┐
            │  cap 500     │                │ 自由氛围池     │
            └──────┬───────┘                │ freeAtmosphere│
                   │ 消耗                    └───┬───────┬──┘
                   ↓                             │       │
        设施升级(双消耗) / 升阶仪式          兑灵感     场馆房间
        （新升级收氛围，老档不追溯）        (日上限!)  (维持费>日产!)
```

## 三、数值框架（**全部 [PLACEHOLDER · 待收支测算]**，测算脚本 = P0 门槛）

| 项 | 初值（占位） | 备注 |
|---|---|---|
| 缮写室 Lv3-6 氛围成本 | 80 / 200 / 450 / 900 | 曲线形：占比随级爬升；Lv1-2 纯币 |
| 借阅区 Lv3-7 氛围成本 | 100 / 250 / 550 / 1000 / 1800 | 新列命名 `upgradeAtmoCost`（避与还书奖励 returnAtmo 歧义，评审 P1-3） |
| 修复室 Lv2-5 氛围成本 | 60 / 150 / 350 / 700 | 定价函数在 capacity.js |
| 设施一次性加成 | 等级×40~60 氛围 | **新升级走新公式；老档补发按旧 +15/级（决策 8 细化，防暴富）** |
| 设施每日产出 | 每级 +2/日（三项满级约 +30/日） | 小于抄写流水，防躺平 |
| 升阶仪式消耗 | 1→2: 30 / 2→3: 100 / 3→4: 220 / 4→5: 484（×2.2 阶梯） | peak 达阈值才可发起；1→2 为评审 P0-3 补 |
| 单书借阅磨损 | 每次借还 +0.2%，该书上限 +3% | 重抄清零；注入 `getDamageChance` 第 3 参（默认 0 向后兼容） |
| 典藏版还书加成 | 智慧之光 ×2，氛围 ×3 | 与典藏诊断收藏定价匹配 |
| 自由池兑灵感 | 50 : 1，**每日兑换上限 200 池（=4 灵感）** | 通胀闸之一 |

## 四、借还子系统改造（决策 9 + 典藏回报）

- `borrowCount` 持久化（migration 默认 0；存量老书默认 0 = 隐性元老福利）
- `getDamageChance(borrowLevel, hasCareSignboard, wearCount)`：**三个调用点必须传该书 wearCount**——还书结算 `visitors.js:1183`、书卡展示 `render/visitors.js:104`、升级弹窗 `render/shop/library-upgrades.js:68`（评审 P2-1，漏传则磨损不生效）
- 书卡/详情显示**书况**（磨损星级），重抄按钮旁提示「重抄可恢复书况」
- **磨损清零钩子：挂在 `book-progress.js:63`（copyCount 落点，即重抄真正完成处）**（评审 P2-2 勘误：该点存在，钩子位置本就正确）
- 典藏版还书：`returnCoins ×2 + returnAtmo ×3`，配专属访客台词（与 visitor-book-review-notes 联动点）

## 五、通胀双闸（P0-2 增补，评审裁定：组合闸）

自由池无上限 + 设施永久日产（满级 +30/日）+ 溢出常开 = 单调递增泉眼；直通 50:1 灵感则衔接 DLC 购买力，是通胀炸弹。双保险：

1. **兑灵感每日上限**：≤200 池/日（=4 灵感/日），UI 明示「明日再来」
2. **场馆维持费恒大于满级日产**：四房间维持费合计设计为 >+30/日，使自由池自然净流出为负
3. （备选）自由池软顶 5000，超出停止增长——若测算后双闸不足再加

`50:1` 与 `+30/日` 的最终值由 P0 测算脚本定（见 §七 Phase 0）。

## 六、老存档迁移（决策 8 + 评审 D6/D7 细化）

- `atmospherePeak` = 迁移时当前 atmosphere；`stage` = 按 peak 映射的当前阶段（写入字段，不再实时推导）
- 已购设施等级保留；**一次性加成补发 = Σ(各级 × 旧 15)** 入库存（溢出转自由池，写历史记录告知）
- **双消耗不追溯**：老档已升等级不补收氛围，仅新升级生效
- 每日产出自迁移日起算；`borrowCount` 存量默认 0
- 赠「开馆元老」成就 + 限定称号（成就系统改造后挂图标）

## 七、实施阶段（**Phase 0 测算前置**）

0. **Phase 0 收支测算脚本**：新模型氛围/灵感日收支仿真（来源收窄+设施产出 vs 仪式/升级/维持费/兑换），全部 [PLACEHOLDER] 定值，双闸强度校核——**不过测算不开工**
1. **Phase 1 核心模型**：双池 + peak + stage 字段 + 双 stage 函数停薪 + `spendAtmosphere`（含双消耗失败整体回滚）+ 顶栏双池展示 + 全局 ~75 处读取排查分流
2. **Phase 2 设施三项**：双消耗升级（`upgradeBorrowLevel`/`upgradeFocusLevel`/`upgradeRestorationLevel` 内加 spendAtmosphere）+ 一次性加成 + 每日产出结算（离线补算，上限 24h）
3. **Phase 3 升阶仪式**：仪式入口 + 修缮任务链（含设施等级环节；任务物资来源此时小决策）+ 阶段只进不退
4. **Phase 4 借还改造**：borrowCount + 三调用点 wear 注入 + 重抄清零 + 典藏回报 + 书况 UI
5. **Phase 5 场馆房间**：四房间 + `settleVenueMaintenance()` 维持结算 + 50:1 兑灵感（带日上限）
6. **Phase 6 迁移与纪念**：老档迁移 + 开馆元老成就
- 每 Phase 独立可部署

## 八、风险与开放项

- 修缮任务链的物资来源（金币？新材料？）Phase 3 前小决策
- 与 DLC 补充包（灵感售卖）的汇率关系，待 Phase 0 测算一并校核
- 阶段叙事 5 阶为满（星辰 300-500）；未来若要第 6 阶段（飞升？）需先补 ATMOSPHERE_STAGES 文案
- `atmosphere` 字段被约 25 文件 / 75 处读取，Phase 1 需全局 grep 改造（anchors 已挂核心文件）

## 九、被吸收的 venue 方案要点（原文档归档不删）

- 四个场馆房间：茶室（访客羁绊事件）/ 温室（植物联动）/ 庭院（现实日历活动日）/ 档案室（馆史）
- `settleVenueMaintenance()` 每日结算房间维持费（走自由池，**设计值 > 满级设施日产**，见 §五）
- 以上全部并入本文档实施范围，`_todo-index` 对应条目标已吸收

## 十、相关文件

- `js/storage.js`（addAtmosphere 双池改造、spendAtmosphere 新出口）
- `js/state/state.js` + `js/state/migrations.js`（四个新字段 + 老档迁移）
- `js/core/shop/library-upgrades.js`（缮写室/借阅区双消耗）+ `js/capacity.js`（修复室轨道在此，评审勘误）
- `js/visitors.js`（getDamageChance 磨损项、典藏回报、borrowCount 结算）
- `js/core/book-progress.js`（重抄清零钩子 :63）
- `data/borrow-levels.js`（加 `upgradeAtmoCost` 列）、`data/atmosphere.js`（阶段文案停薪改读字段）
