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
  - { type: file, path: "js/core/book-progress.js", weight: 0.1 }
  - { type: file, path: "scripts/simulate-atmosphere-economy.mjs", weight: 0.1 }
  - { type: file, path: "data/atmosphere.js", weight: 0.1 }
  - { type: file, path: "data/tiergoals.js", weight: 0.1 }
  - { type: file, path: "js/collection.js", weight: 0.1 }
  - { type: file, path: "js/achievements.js", weight: 0.1 }
  - { type: file, path: "js/audio.js", weight: 0.1 }
  - { type: file, path: "js/i18n/terms.js", weight: 0.1 }
  - { type: file, path: "js/render/common.js", weight: 0.1 }
  - { type: file, path: "js/render/library.js", weight: 0.1 }
  - { type: file, path: "index.html", weight: 0.1 }
  - { type: file, path: "js/atmosphere.js", weight: 0.1 }
  - { type: file, path: "data/borrow-levels.js", weight: 0.1 }
  - { type: file, path: "js/core/shop/library-upgrades.js", weight: 0.1 }
  - { type: file, path: "js/core/shop-actions.js", weight: 0.1 }
  - { type: file, path: "js/render/shop/library-upgrades.js", weight: 0.1 }
  - { type: file, path: "scripts/verify-atmosphere-narrowing.js", weight: 0.1 }
  - { type: file, path: "js/state/state.js", weight: 0.1 }
  - { type: file, path: "js/state/migrations.js", weight: 0.1 }
  - { type: file, path: "data/planes.js", weight: 0.1 }
  - { type: file, path: "js/render/archive.js", weight: 0.1 }
---

# 氛围系统重设计（atmosphere-system-redesign）

> 立项：2026-09-08。历程：grill 十决策 → 两轮评审（v2/v3）→ 测算脚本 v3.4 → **图南定调 v4：氛围=EXP 经验值**。
> v3 及之前的消耗品架构（双池/仪式付费/门槛/自由池/50:1 兑换）**全部作废**，仅留存其有效部件。
> **本文档吸收合并 atmosphere-venue-map-design（场馆修复地图）**；economy-balance-review 旧结论随 v4 重估。

---

## 〇、核心模型（v4 · 一句话版本）

**氛围 = 图书馆经验值（EXP），智慧之光 = 金币。**

```
氛围（EXP）                智慧之光（金币）
  只增不减，永不消费          唯一支出货币
  总量 = 图书馆阶段 1-5       设施升级/购买/未来消费口
  自动升级，解锁内容           越花越需要有消费口（见 §五 金币通胀）
  来源：抄写/还书/访客/植物     来源：抄写/还书/访客/委托
```

- **阶段 = f(累计氛围)**，达到阈值自动升阶（沿用 5 阶段叙事：废墟 0-30 → 星辰）
- **升级解锁新内容**（场所/功能）：设施等级上限、场馆房间、新功能——RPG 技能树
- **阶段对设施等级设要求**（装备等级门槛）：如 4 阶才允许缮写室 Lv5
- **设施 = 金币购买的经验资产**：买设施花金币，设施给一次性氛围（固定资产 = 经验资产，用户原始构想原样落地）

## 一、有效决策清单（grill+评审+仿真 三轮沉淀，v4 口径）

| # | 决策 | v4 形态 |
|---|---|---|
| 1 | 阶段与库存 | **EXP 只增不减**；~~阶段纯阈值自动升级~~ → **D24 修订：阶段落库，氛围到阈值+设施条件齐后手动举行升阶仪式**；「只进不退」天然成立（EXP 没有退的机制） |
| 2 | 双池制 | **作废**——EXP 无封顶无溢出 |
| 3 | 升阶仪式制 | ~~简化为自动升阶~~ → **D24 复活手动仪式**：仪式感由玩家亲手点击升阶承载；氛围过线但设施未齐时卡阶等待（进度条满格+需求清单），条件齐备出现仪式按钮，点击升阶并播庆典（见证人/馆长目标奖励沿 onStageCross 链路） |
| 4 | 设施固定氛围 | 设施升级**一次性 +氛围（EXP）**（等级×40，仿真定版）；每日涓流 EXP 仿真证伪节奏过快，**不采用** |
| 5 | 设施范围 | MVP 三项：缮写室 / 借阅区 / 修复室（轨道在 capacity.js） |
| 6 | 双消耗 | **作废**——升级只花金币（EXP 不花）；「占比随级爬升」无载体 |
| 7 | 修缮任务链 | **作废**——「升级解锁内容」本身取代任务链（内容即任务） |
| 8 | 老档迁移 | **近零成本**：老存档本来就是「氛围总量推阶段」，只换阈值表，玩家无感 |
| 9 | 单书借阅磨损 | 保留：还书损毁率乘性磨损 ×(1+0.6×steps/15)，**重抄清零** |
| 10 | 自由池出口 | **作废**（自由池不存在）；场馆房间改为**阶段解锁+金币建造** |
| 插单 | 典藏版借出回报 | 保留：还书 智慧之光 ×2、氛围 ×3 |
| D24 | 升阶设施门槛（反向门，图南 2026-09-09 拍板「梯度爬坡」表） | 升阶需设施条件：**2 阶** 缮写室≥1+借阅区≥1｜**3 阶** 缮写室≥2+借阅区≥3+修复室已解锁｜**4 阶** 缮写室≥3+借阅区≥4+修复室≥2+留声阁已解锁｜**5 阶** 缮写室≥5+借阅区≥5+修复室≥3+留声阁已解锁。与 D22 交叉验证可达无死锁（缮写室/借阅区 Lv5 恰需 4 阶，5 阶需求全部可在 4 阶内建成）。阶段改存储字段 `state.library.stage`（migrateV5 老档按已达氛围定阶，不追溯设施）；位面门 pastoral 解锁同步改「需 3 阶」（原 atmo 80 旧表值） |

衍生修订（图南 2026-09-08 裁定）：**火灾罚金改扣金币**（EXP 模型不掉经验，掉经验是最差惩罚）；**50:1 兑灵感删除**（EXP 换货币污染纯度，灵感由 DLC 售卖与既有 sink 承载）。

## 二、数值框架（v4.2 仿真定版，`scripts/simulate-atmosphere-economy.mjs`）

现实锚点：上线十几天多名玩家氛围到顶 500 溢出 → 硬核日入 ~38。三档画像（硬核/核心/休闲 = 0.6/0.3 比例）蒙特卡洛 20 轮：

| 项 | 定版值 | 说明 |
|---|---|---|
| **阶段阈值（累计氛围）** | **2 阶 400 / 3 阶 900 / 4 阶 2,800 / 5 阶 5,600**（v4.3） | 硬核 166 天 / 核心 202 天 / 休闲 247 天首通；分段 11/11/53/91 天（v4.2 断崖 12/10/53/98 已修） |
| 设施 EXP 一次性 | **等级 ×20**（D19） | 占比 35%→~16%，防「买设施比抄书快」稀释核心玩法 |
| 设施金币成本 | 沿用 economy.js 公式 | 借阅区 500×1.5ⁿ（封顶 5700）/ 缮写室·修复室 400×1.45ⁿ（封顶 5000） |
| 设施等级门槛 | **1 阶→Lv2 / 2 阶→Lv3 / 3 阶→Lv4 / 4 阶→Lv5 / 5 阶→Lv6-7**（D22 新手保护） | 阶段压住设施，设施 EXP 反哺阶段——正循环 |
| 升阶设施需求 | **D24 梯度爬坡表**（见决策清单 D24 行） | 反向门：设施齐了才允许升阶；氛围 EXP 照攒不卡获取，只卡升阶时刻 |
| 还书氛围 returnAtmo | **1/2/3/4/5/6/7 随等级递增**（D18） | 每次门槛解锁都有真实产能台阶；原「收窄」压制语义随 EXP 架构转型（图南批） |
| 火灾罚金 | 200 金币 | EXP 不掉；损书照旧 |
| 单书磨损 | 乘性 ×(1+0.6×steps/15)，满磨损 ×1.6，重抄清零 | 三调用点注入 wearCount（还书结算/书卡展示/升级弹窗） |
| 典藏版还书 | 金币 ×2，氛围 ×3 | |

仿真副产物（写进 §五 风险）：**金币后期过剩**（硬核年结余 ~4 万 vs 消耗 ~2.1 万）——双消耗死后金币通胀压力更大，场馆房间/收藏/装饰等金币消费口排期要提前。

## 三、改造点清单（代码层）

1. **D17 三套阈值合并单源**（评审 P0-A，只改一处处必然出 bug：收藏品页会把 400 氛围显示成星辰）：`data/atmosphere.js` 导出统一 `getStageLevel()`，`economy.js:7-11` / `collection.js:73-79` / 各处 import 全部改挂单源；随后阈值表换 v4.3 定版值（30/80/160/300/500 → **400/900/2800/5600**），阶段名与叙事文案不动；`disasters.js` 霉菌阶段因子同挂单源（前期霉概率上升 ~67% 已接受，「越破越潮」贴叙事）
2. 设施升级三处（library-upgrades.js ×2、capacity.js ×1）：升级成功时 `addAtmosphere(等级×40)`；加阶段等级门槛校验
3. `getDamageChance` 加 wearCount 第三参 + 三调用点传值 + 重抄清零钩子（book-progress.js:63）
4. 火灾罚金改扣金币（disasters.js）
5. 移除/改造：500 封顶逻辑保留与否——**EXP 无封顶，`addAtmosphere` 的 `Math.min(500,...)` 移除**；顶栏氛围条改进度条形态（当前值/下一阶阈值）
6. 老档迁移：纯换表，无存档结构变更；`borrowCount` 新字段默认 0
7. UI：升阶时刻给足仪式感（动画/新内容预告）——体验目标 1「长期目标感」的载体

## 四、被吸收的 venue 方案（v4 形态）

- 四个场馆房间（茶室/温室/庭院/档案室）改为：**阶段解锁图纸 + 金币建造**（不再是氛围消费口）
- 房间玩法收益保留（茶室羁绊/温室植物/庭院活动日/档案室馆史）
- 这同时是金币消费口之一，缓解 §五 通胀

## 五、风险与开放项

- **金币通胀**（仿真实证）：结余阶层分化大（休闲 0.05× ~ 硬核 1.85×）→ **消费口必须分层定价**（D20）：便宜高频消耗品面向全体 + 昂贵收藏/限量面向硬核；场馆房间多档定价
- **灵感 sink 缺口**（D21）：实测 faucet ~7/日（仿真实校），v4 删 50:1 后只剩重抄+DLC 两个 sink → 补一个**持续 sink**（限时装帧/特邀检索类），否则 DLC 数月被买穿
- 全员满阶后（休闲 ~1 年）的内容续航：场馆房间 + 未来第 6 阶段（需补文案）是答案
- 阶段门槛数值的唯一硬标定点 = 真实玩家氛围获取速率（上线埋点：日获取量分布），首月数据回测一轮
- 硬核 173 天是否仍偏快：可按首批真实数据再 ±20% 微调

## 六、实施阶段（v4 大瘦身）

1. **Phase 1 换表**：阈值表 + addAtmosphere 去封顶 + 顶栏改进度条（**半日工作量**）✅ 2026-09-09 落地。实施实收编 **6 处**阈值实现（评审 P0-A 点名 3 处之外的增量）：`data/tiergoals.js` 馆长目标阶梯（改挂 STAGE_THRESHOLDS 推导，t5g4 改 5,600）、`js/audio.js tierForAtmo` BGM 三档（1-2 阶 ruined / 3-4 阶 cozy / 5 阶 stellar）、`js/achievements.js` L01/L03/L05/L07（改 getStageLevel>=N）、`js/storage.js updateBodyBackground` 背景分阶；i18n 文案同步（成就描述/t5g4/FAQ 删 500 上限句）；删除死模块 `js/atmosphere.js`（全库无引用，且依赖已删除的 stage.max）。顶栏与概况页进度条 = 阶段内进度（当前值/下一阶阈值，满级 MAX）。
2. **Phase 2 设施**：金币门槛校验 + 升级给 EXP（等级×20）✅ 2026-09-09 落地（D22+ D19 + D18 一并完成）：门槛/EXP 助手入 data/atmosphere.js（`getFacilityLevelCap`/`getFacilityRequiredStage`/`FACILITY_EXP_PER_LEVEL=20`，修一处 max stage = 阈值数+1 的边界 bug）；三升级核心（借阅区/缮写室/修复室）加阶段门槛校验 + 升级发 等级×20 EXP（修复室原本不发，补上）；returnAtmo 表改 1-7 递增（D18，visitors.js 表驱动自动生效）；四处 UI 加 🔒 门控提示（商店三卡+修复室标签页+访客页 action 路径）；verify-atmosphere-narrowing 脚本第 3 节改断言 1-7 线性。
   - **Phase 2.5 升阶设施门槛（D24）**✅ 2026-09-09 当日追加落地（推翻 v4 决策 1/3 的纯阈值自动升阶）：需求表 `STAGE_UP_REQUIREMENTS` 入 data/atmosphere.js（`checkStageUpRequirements` 纯函数 + `resolveStageLevel` 存储字段解析，全部阶段判定函数加可选 stageField 形参）；`state.library.stage` 落库（新档默认 1，migrateV5 老档按已达氛围定阶不追溯）；storage.js 加 `canHoldStageCeremony`/`holdStageCeremony`（升阶沿 onStageCross 链路复用见证人 toast+馆长目标奖励）；概况页进度条改跟存储阶段（卡阶满格 100%），氛围过线未齐显示 ✓/✗ 需求清单，齐备出「✨ 举行升阶仪式」按钮；背景/BGM/成就/收藏/设施上限全部改 `resolveStageLevel` 双参；位面门 pastoral 改 `unlock.stage: 3`（canUnlockPlane + 商店/档案馆两处 UI 文案同步）；verify 脚本加第 6 节（可达性×需求核对×回退解析×卡阶进度，30 项全过）。**遗留**：仿真脚本未建模仪式等待，v4.3 首通天数（166/202/247）将因设施金币门槛略拉长，待真实数据回测一并校准。
3. **Phase 3 借还链**：wearCount + 乘性磨损 + 重抄清零 + 典藏回报 + 书况 UI ✅ 2026-09-10 落地：磨损纯函数入 data/borrow-levels.js（`getWearMultiplier` ×(1+0.6×wear/15) 封顶 ×1.6 / `getBookCondition` 书况五档，node 可直测）；`getDamageChance` 加第三参 wearCount，三调用点注入（还书结算/书卡展示/升级弹窗）；借出即磨损 +1（典藏版 indestructible 除外，`CANONICAL_BOOK_FIELDS.wearCount=0` 老档免迁移）；重抄完成清零（book-progress.js completeBook，**含损毁修复后补抄完成的周期——图南 2026-09-10 裁定：修复清零方向正确，「因祸得福」**，与仿真只建模花灵感重抄的口径有意偏离，仿真偏保守可接受）；典藏版还书回报 币×2 氛×3（含历史/弹窗提示）；书况 UI=书架卡磨损档+该书加权损毁率，借阅区 banner/升级弹窗补磨损封顶说明；verify 脚本加第 7 节（40 项全过）
4. **Phase 4 场馆房间**：阶段解锁 + 金币建造（venue 方案落地 + 金币消费口）
5. Phase 1-3 可打包一次部署；Phase 4 独立

## 七、相关文件

- `data/atmosphere.js`（阈值表）、`js/storage.js`（addAtmosphere 去封顶）
- `js/core/shop/library-upgrades.js`、`js/capacity.js`（门槛 + EXP 发放）
- `js/visitors.js`（磨损/典藏）、`js/core/book-progress.js`（重抄清零）
- `js/core/disasters.js`（火灾罚金币）
- `scripts/simulate-atmosphere-economy.mjs`（Phase 0 已定版，留作后续调参工具）
