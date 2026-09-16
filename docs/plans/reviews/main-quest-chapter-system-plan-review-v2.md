---
status: done
anchors:
  - { type: file, path: "docs/plans/reviews/main-quest-chapter-system-plan-review-v2.md", weight: 0.1 }
  - { type: file, path: "docs/plans/main-quest-chapter-system-plan.md", weight: 0.1 }
---

# 复兴之路重做 v2 · 机制与数值复审（main-quest-chapter-system-plan-review-v2）

> 处置：D11-D17 已全落计划 v3（修订对照见计划 §10）。

> 复审视角：v2 已落地架构评审 D1-D10（§9 修订记录）。本轮不重复架构核查，聚焦**游戏机制与数值**——即"玩家为什么觉得好玩""节奏是否平滑""数字是否自洽"。
> 锚点全部代码核实：data/atmosphere.js、data/tiergoals.js、data/books.js、js/visitors.js、js/storage.js、js/render/library.js。

## 0. 结论（先读）

**v2 架构健康，机制大框架成立；但有一处 P0 机制缺陷 + 一处 P1 节奏缺陷，必须在动手前处理。数值总量安全（一次性 ~1990💰+150✨，不撼动 sink-ledger 基线）。**

- ✅ **已纠正我上轮一处误判**：`getStageThreshold(5)` 不是 undefined——实现为 `STAGE_THRESHOLDS[level-2] ?? null`，`level=5 → STAGE_THRESHOLDS[3] = 5600`。ch7 门槛 `atmosphere >= 5600` 成立，**不软锁**。
- ✅ **`countUniqueVisitors` 确实在 `tiergoals.js:30`**，旧 tier 目标已用 `>=10 = "全部10位访客"`，证明访客共 **10 种**，ch3/5/7 的 3/8/10 全在界内。plan §1"复用现有纯函数"属实。
- ✅ **`focus.totalMinutes` 真实存在**（`tiergoals.js:110`），ch3"120分钟"门槛有单一数据源。
- ✅ **`borrowRecords.charId` 存在**（`visitors.js:1298`），ch3s3"同一访客归还≥3"可聚合。

---

## 1. 🔴 P0-1 — ch5 门槛"举行过4阶仪式"= 手动仪式，主线软锁 + 与 ch4/ch7 不一致

**机制问题**：ch4/ch7 的氛围门槛走 `getStageLevel` / `getStageThreshold`（**自动**，由氛围值纯函数推导）；唯独 ch5 写"**举行过4阶仪式**"——而仪式是**玩家手动点击**的（`library.js:292` 脉冲按钮 → `holdStageCeremony()`）。

**后果**：
1. **主线软锁**：玩家氛围到 2800（stage4）但没点仪式按钮 → ch5 永远不完成。由于 `getStageLevel`（ch4/ch7 用）与 `state.library.stage`（仪式写）是两套独立来源，玩家可一路推到 ch7（stage5）却**永久漏掉 ch5 的铭牌+150💰20✨+叙事**，"复兴之路"出现断章。这不是崩溃，但是一条会被 completionist 撞见的真实断点——而主线章节系统的**唯一职责就是引导叙事**，把引导挂在易漏的手动动作上是设计倒错。
2. **不一致**：同一套章节，ch4/ch7 用自动阶段、ch5 用手动仪式，规则分裂，后人维护会困惑。

**修法**：ch5 门槛改为 `getStageLevel(atmosphere) >= 4`（与 ch4/ch7 同构、自动、零软锁）。若想要"仪式"叙事节拍，把它降为 **ch5 的一个小节**（`event: ceremony, count: 1`）而非章门槛——这样既保留叙事，又不阻断进度。

**验证位**：`library.js:254 ceremonyReady = canHoldStageCeremony()`、`:291-330` 按钮；`storage.js:113 holdStageCeremony()` 无参、`:116 state.library.stage = prevLevel+1`。

---

## 2. ⚠️ P1-2 — 章节节奏继承 v4 的"断崖"，中段 76 天无里程碑

**机制问题**：把章节门槛映射到 v4 的硬核首通曲线（data/atmosphere.js:4 注释，stage 落地日：S2≈12d / S3≈22d / S4≈75d / S5≈166d）：

| 章 | 门槛 | 大致落地日 |
|---|---|---|
| ch1 | 新手引导 | 0-2d |
| ch2 | 2 本 | 3-5d |
| ch3 | 120min+3访客 | 5-10d |
| ch4 | 6 本 + S3(900) | ~22-30d |
| ch5 | 10 本 + S4 | ~75-90d |
| ch6 | 展览厅+2位面（**无氛围门槛**） | 浮动 |
| ch7 | 20 本 + S5(5600) | ~166-200d |

**断点**：ch4(~30d) → ch5(~75-90d) 空 45-60 天；ch5(~90d) → ch7(~166d) 空 **~76 天**。而 v4 最长的"反馈空窗"正是 S4→S5 的 ~91 天（我前轮 atmosphere v4 评审已标为留存杀手）——**章节系统非但没填这个洞，反而因 ch4/5/7 绑定氛围阶段而继承了断崖**。

唯一不带氛围门槛的 ch6（展览厅+2位面）本该填洞，但它的落地日由**设施/币**决定、非时间绑定——若其前置设施 require 高 stage 或巨币，ch6 会滑到 ~166d 而非中段，洞仍空。

**修法（二选一，建议前者）**：
- (a) 在 §6 显式给出**每章目标落地日区间**，并确认 ch6 的前置（展览厅/位面解锁）在 stage4 前后即可达成、不被 stage5 设施需求拖住，使其落在 ~100-140d 填洞；
- (b) 新增一章/小节，门槛用自然落在中段的信号（如 `souvenir>=15 + disaster_resolve>=3` 或 `achievement>=25`），专门补 S4→S5 空窗。
- 最低限度：plan 应**明文承认**中段空窗由 cafe/borrow/展览厅等玩法系统填充、章节系统是"叙事骨架"而非"节奏填充"，否则评审无法判断这是有意为之还是疏忽。

---

## 3. ⚠️ P1-3 — ch4s3"任一访客好感达熟识"可能是 ch4 的绑定约束

`visitorFavors` 经 browsing(+~1/tick) 与 return(+~3/tick) 缓慢累积（`visitors.js:699-707`、`:888`、`:1270`）。"熟识"是 favor 中档，对**单一访客**达成需该类型反复出现并交互 20-40 次。按 ~2.4 访客/日、加权 spawn，ch4s3 可能比 ch4 的 S3(900, ~22d) 更晚达成（推到 ~30-60d）。

**影响**：可接受（给 ch4 一点中后期分量），但 plan 应注明 ch4s3 可能是最慢小节；且 **"熟识"阈值必须引用 `FAVOR_THRESHOLDS` 单一真源**（visitors.js:1035 已用 `FAVOR_THRESHOLDS.OCCASIONAL`），勿硬编码数字。

---

## 4. ◽ P2 — 两处"无效小节"（章节门槛与小节重复）

设计信条"消除无效选择"：当章门槛是 A∧B 复合，而某小节恰好是 A 或 B，该小节与门槛**同时完成**，无独立挑战。

- **ch3s2** `countUniqueVisitors>=3` 与 ch3 门槛"3 位不同访客"**完全重复** → 小节零独立意义。建议改 `>=5`（或换指标）。
- **ch5s1** `getStageLevel>=4` 与 ch5 门槛"举行过4阶仪式(=stage4)"**重复半边** → 小节随门槛同时勾掉。修 P0-1 后若改 `getStageLevel>=4`，该小节与门槛同源，仍冗余；建议 ch5s1 改独立指标（如"专注累计达 X 分钟"或并入 ch5 其它）。

> 注：冗余不阻断、不崩，但违背项目"无空洞数值"纪律，且会让玩家觉得"章成和小节是同一件事"。

---

## 5. ◽ P2 — "完成 N 本书"缺单一数据源

ch2"誊抄完成2本" / ch4"完成6本" / ch5"完成10本" / ch7"完成20本" 用语不一致（"誊抄" vs "完成"）。实际口径应为 `copyCount > 0` 的书数（`guidequests.js:140` 内联 `b.status==='completed' || b.copyCount>0`）。

- **建议**：新增 `getCompletedBookCount(state)` 单一真源（与 `countUniqueVisitors` 同批迁入 questline.js），四章统一引用；ch2"誊抄"仅为文案风味，口径与另三章对齐。
- **数值校验**：全书 71 本（node 实测 `Object.keys(BOOKS).length = 71`）。20/71=28%、10/71=14%、6/71=8%、2/71=3%——早期宽松、ch7 偏肝但合理。**建议 v4 仿真补"抄书速率"轴**，确认 stage5(~166d) 时 20 本可达；若实测偏慢，ch7 降到 15。

---

## 6. ◽ P2 — ch3s3 需"按角色计数"而非"去重计数"

`countUniqueVisitors`（tiergoals.js:30）用 `Set` 去重，**只数种类不数次数**。ch3s3"同一位访客累计归还≥3"需要**按 charId 的频次计数**（`borrowRecords` 聚合），是不同函数。plan §6 写"借 borrowRecords 角色频次"方向对，但需**新建**该聚合（M1 单测锁定），不能复用 `countUniqueVisitors`。

---

## 7. ✅ 已核实健康（不改）

| 项 | 核实结果 |
|---|---|
| 章节 schema（count/check 双轨） | §0 契约干净，check 型在 incrementQuestEvent 每事件全量评估，count 型仅当 event 匹配——算法自洽（§2 step2） |
| D2 遍历所有未完成章 | 防独立门槛死锁，算法正确；`getActiveChapter` 仅 UI 高亮 |
| 激活前 ch1 计数（D10） | ch1 小节 pre-activation 计数、章成卡 activated；新玩家 tutorial 期动作不丢，迁移 D8 重放补确定性项 |
| 阈值引用（D5） | `getStageThreshold(3)=2800`/`(5)=5600` 与 STAGE_THRESHOLDS 一致；ch4/ch7 不硬编码 ✓ |
| ceremony 内联（D4） | `holdStageCeremony` 内 `state.library.stage` 赋值后内联 `incrementQuestEvent('ceremony',{stage})`，不改签名、`_onStageCross` 链不动 ✓ |
| 访客上限 | 10 种 → ch3/5/7 的 3/8/10 全可达，ch7=集齐全图鉴 ✓ |
| 数值总量 | 节奖~1060💰 + 章奖930💰 + 150✨，全游一次性；vs 基线金币 1.85× 过剩（~39k），占比 <5%，通胀安全；sink-ledger D6 登记正确 |
| 奖励手感 | 早期(20-50💰/节) 有存在感，后期(80💰/节) 微末——对"引导系统"合理，叙事奖励(铭牌/回忆页)承担后期价值 |

---

## 8. 决策清单

| # | 级别 | 决策 | 落点 |
|---|---|---|---|
| D11 | 🔴 P0 | ch5 门槛改 `getStageLevel(atmosphere)>=4`；"仪式"降为 ch5 小节（count:1, event:ceremony） | §6 ch5 |
| D12 | ⚠️ P1 | 显式每章目标落地日；确认 ch6 前置不被 stage5 设施拖住、落在 ~100-140d 填 S4→S5 空窗（或新增中段章） | §6 + §0 |
| D13 | ⚠️ P1 | ch4s3"熟识"引用 `FAVOR_THRESHOLDS` 单一真源；注明其可能是 ch4 最慢小节 | §6 ch4s3 |
| D14 | ◽ P2 | 去重无效小节：ch3s2→`>=5`；ch5s1 改独立指标 | §6 |
| D15 | ◽ P2 | 新增 `getCompletedBookCount(state)` 单一真源，四章统一引用；v4 仿真补抄书速率轴校验 ch7=20 | §1/§6 |
| D16 | ◽ P2 | ch3s3 新建"按 charId 频次计数"聚合（非 countUniqueVisitors 的 Set） | §1/§3 |
| D17 | ◽ P2 | ch7"20本"若仿真偏慢降至 15；全书 71 本确认可行 | §6 |

**必改**：D11（主线软锁）、D12（中段节奏空洞）。其余按判断。
