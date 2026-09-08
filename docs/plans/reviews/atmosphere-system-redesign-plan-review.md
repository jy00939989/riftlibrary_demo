---
status: review
importance: 3
scheduledDate:
anchors:
  - { type: file, path: "docs/plans/atmosphere-system-redesign-plan.md", weight: 0.3 }
  - { type: file, path: "js/storage.js", weight: 0.1 }
  - { type: file, path: "js/visitors.js", weight: 0.1 }
  - { type: file, path: "js/state/state.js", weight: 0.1 }
  - { type: file, path: "data/atmosphere.js", weight: 0.1 }
  - { type: file, path: "js/core/economy.js", weight: 0.1 }
  - { type: file, path: "js/core/shop/library-upgrades.js", weight: 0.1 }
  - { type: file, path: "js/core/book-progress.js", weight: 0.1 }
  - { type: file, path: "docs/plans/reviews/atmosphere-system-redesign-plan-review.md", weight: 0.1 }
---

# 氛围系统重设计 · 评审（atmosphere-system-redesign-plan-review）

> 评审日期：2026-09-08。覆盖 anchor：storage.js / visitors.js / state.js / data/atmosphere.js / economy.js / library-upgrades.js / book-progress.js / borrow-levels.js。
> 立场：方向对（氛围从水位值变消耗品、双池、设施固定资产、升阶仪式都合理），但**有 3 处 P0 矛盾/炸弹在动手前必须解开，否则 Phase 1 一写就错**。

---

## 一、结论先行

**这份 plan 是"grill 锁定的 10 决策 + 数值框架 + 6 期实施"，但缺三样东西让它现在不能直接落：**

1. **stage 的升阶逻辑自相矛盾**（§2 "stage=f(atmospherePeak)" 与决策 3 "不再自动跳" 互斥），且 `state.library.stage` 字段根本没进 schema。
2. **自由池无上限 + 设施永久日产 = 无限氛围泉眼**，再接 50:1 兑灵感就是通胀炸弹。
3. **"6 阶段"与 data 实况 5 阶段不符**，仪式成本与阶段阈值的关系没定义。

外加：缺玩家体验动机（10 决策没说"为什么更好玩"）、数值全无 rationale、修复室无升级实体（MVP 三设施前提缺口）。

**好消息**：锚点全部有效、双池与现有 500 封顶天然契合、`addAtmosphere` 只差一个溢出分支、wear 注入点干净——核心改造风险低，卡住的是设计和数值层。

---

## 二、锚点核实（plan 声称 vs 代码实况）

| plan 声称 / 引用 | 代码实况 | 结论 |
|---|---|---|
| 双池：藏书厅 500 封顶 | `storage.js:49` 已是 `Math.min(500, ...)` | ✅ 封顶已存在，溢出分支是增量 |
| `getDamageChance(borrowLevel, hasCareSignboard, wearCount)` | 现状 2 参（`visitors.js:379`）；体为 `base 3% - 0.4%/级，下限0.5%，care -1%` | ✅ 第 3 参 wearCount 加默认 0 即可，注入点清晰 |
| 自由池（venueAtmosphere 复用） | `venueAtmosphere` 全代码 **0 命中**；旧 venue 文档未落地 | ⚠️ 全新字段，且 plan 未定字段名（与旧 venue 命名潜在打架） |
| atmosphere 被 ~20 处读取 | 实际 **25 文件 / ~75 命中**（含 render/shop/library-upgrades.js、render/library.js、achievements.js、disasters.js、economy.js） | ⚠️ 迁移面被低估 ~3.7 倍 |
| `atmospherePeak` 新字段 | state.library 无 peak / stage / borrowCount（`state.js:75-82`） | ⚠️ 漏了 `stage` 字段本身（决策 3 需存） |
| 阶段 = f(atmospherePeak) | 现状 stage 由 `getAtmosphereStage`(data/atmosphere.js) + `getAtmosphereLevel`(economy.js:7-11) **两套实时推导** | ❌ 切仪式制须让两套同时停薪，plan 未提 |
| MVP 三设施：缮写室/借阅区/修复室 | `library-upgrades.js` 只有 借阅区(borrowLevel)+缮写室(focusLevel)，**修复室无轨道** | ❌ 修复室前提缺口 |
| borrow-levels 加氛围成本列 | `borrow-levels.js` 现有 `returnAtmo` 是**还书奖励**非升级成本 | ⚠️ 新列须改名避歧义 |

---

## 三、P0 — 动手前必须解开

### P0-1：stage 升阶逻辑自相矛盾 + 缺字段
- **矛盾本体**：§2 写"阶段 = f(atmospherePeak)"，决策 3 写"不再自动跳（手动仪式，成功后阶段永久+1）"。如果 stage 仍由 peak 函数推导，peak 一旦越过阈值（30/80/160/300）就**自动跳阶**，仪式形同虚设——"不再自动跳"不成立。
- **必须二选一并写明**：
  - **(A) peak 只是仪式门槛**：`state.library.stage` 是独立字段，初始按迁移映射；peak≥阈值 N 才解锁"发起 N→N+1 仪式"按钮；仪式消耗 atmo + 完成修缮链后 `stage++`。`getAtmosphereStage`/`getAtmosphereLevel` 改为只读 `state.library.stage`，不再算 atmosphere。
  - **(B) 保留 f(peak) 但去掉仪式手动性**：那就不是"升阶仪式制"，决策 3 作废。
- **字段缺口**：plan 决策 1/3 都提新状态，但只写了 `atmospherePeak`。**`state.library.stage` 必须进 schema + migration**（老档按 peak 映射 stage，写入 `stage` 字段，而非靠 f(peak) 实时算）。

### P0-2：自由池无上限 + 设施永久日产 = 通胀泉眼
- 决策 2 自由池**无上限**；决策 4 设施**每日产出永久结算**（满级 +30/日，离线补算）；藏书厅溢出也永久灌自由池。
- 三路叠加 → 自由池**单调递增无界**（除非 venue 维持费 > +30/日）。
- 决策 10 自由池 **50:1 兑灵感**：灵感有 sink（DLC 售卖，见 item-distribution 评审），于是"无限自由池 → 无限灵感 → 无限购买力"是直通的**通胀炸弹**。
- **必须补一道闸**（任选，建议组合）：
  - 自由池兑灵感设**每日兑换上限**（如 ≤200 自由池/日 → ≤4 灵感/日）；
  - 或 venue 维持费合计**恒大于满级设施日产**（+30/日），使自由池净流为负；
  - 或自由池也设软顶（如 5000），超出不再增长。
- rationale 缺失：50:1 和 +30/日 都没说"为什么是这个数"，标 `[PLACEHOLDER · 用新模型收支测算定]`。

### P0-3：阶段数与仪式成本未对齐
- §2 称"6 阶段沿用现有叙事"，但 `data/atmosphere.js` 的 `ATMOSPHERE_STAGES` 只有 **5 个**（废墟/破败/陈旧/温暖/星辰，阈值 30/80/160/300/500）。要么补第 6 阶段文案，要么改口"5 阶段"。
- 仪式成本"2→3 阶 100，每阶 ×2.2"：只给了 2→3、3→4、4→5（100/220/484），**1→2 缺失**；且成本与阈值关系未定义——玩家到 peak=80 自动是 stage3（若走 f(peak)）还是需再花 100 atmo 仪式（若走 A 方案）？见 P0-1，二者成本语义完全不同。
- 全数值 `80/200/450/900`、`100/250/550/1000/1800`、`60/150/350/700`、`×2.2`、`+2/级/日`、磨损 `0.2%/+3%`、**均无 rationale 链**，标 `[PLACEHOLDER · 实施前跑一轮收支测算]`（plan 自己也说"测算脚本必跑"，但初值仍得有 bootstrap rationale）。

---

## 四、P1 — 设计层，落地前请决

### P1-1：缺玩家体验动机（Fun Hypothesis 缺席）
- 10 项决策是 grill 锁定的，但**没有任何一句"这为什么比水位值更好玩"**。氛围消耗品化服务的玩家幻想是什么？"长期目标感"？"资源博弈"？"固定资产养成"？
- 没动机就无法用 design pillars 反验决策（比如决策 6"低等级纯智慧之光新手保护"是好的，但决策 9 磨损 + 决策 10 自由池——新手会不会觉得"刚攒点氛围又被设施吃掉"？）。
- 建议补一节 **"玩家体验目标"**：3 条不可妥协的体验标准，后续每个 Phase 用它们过审。

### P1-2：修复室无升级实体（MVP 三设施前提缺口）
- `library-upgrades.js` 只有 `upgradeBorrowLevel` / `upgradeFocusLevel` / 留声阁解锁。**修复室（repair room）没有升级轨道**。
- plan §3 的"修复室 Lv2-5 氛围成本 60/150/350/700"指向不存在的实体。要么 Phase 2 先新建修复室升级轨道（新 entity + UI + 升级函数），要么把 MVP 三设施改成"缮写室/借阅区/留声阁"（已有轨道）。
- 这条不决，Phase 2 的"设施三项"有 1/3 是空中楼阁。

### P1-3：双消耗与现有币升级的迁移歧义
- 借阅区/缮写室现有升级只花**智慧之光**（`spendCoins`，economy.js:17 `min(5700, 500*1.5^lv)`）。
- 决策 6 要让它们**额外花 atmo**（借阅区 100-1800）。问题：
  - 老玩家已 Lv7 借阅区，是否要**回溯补全 atmo**？还是 atmo 成本只对新升级生效（老档白嫖满级）？
  - `borrow-levels.js` 现有 `returnAtmo` 是**还书奖励**列，新增"升级 atmo 成本"列必须改名（如 `upgradeAtmoCost`）避免与 returnAtmo 混淆。
- `upgradeBorrowLevel`/`upgradeFocusLevel` 当前只 `spendCoins` 一项；双消耗落地要在此二函数内加 `spendAtmosphere` + 失败回滚（币扣了 atmo 不够要整体失败）。

### P1-4：设施一次性加成与现有 +15 冲突
- 两个现有升级历史文案写"花费X智慧之光 · **+15氛围**"（`library-upgrades.js:28/72`）。
- plan §3"一次性 等级×40~60"是**改既有 +15 为缩放值**。老档玩家当年拿 +15，新模型拿 40-60/级——迁移时一次性加成"补发入库存"（决策 8）按新公式算，等于老玩家凭空多拿氛围。需明确：补发用新公式还是旧 +15？建议旧档按"已升等级×旧15"补、新升级走新公式，避免老玩家暴富。

---

## 五、P2 — 实现细节，别漏

1. **`getDamageChance` 调用点清单**：现状 `visitors.js:1183` 无参（默认 borrowLevel）、`render/visitors.js:104` 与 `render/shop/library-upgrades.js:68` 只传 lv。加 `wearCount` 后，**还书结算(1183)与书卡展示(104)必须传该书 wearCount**，否则 wear 不生效。plan 没列调用点。
2. **重抄清零钩子定位错**：决策 9"重抄清零 wear"锚 `book-progress.js`，但该文件只有 `reCopyUnlocked` 解锁开关（75-76/168-176），**没有重抄完成执行点**。wear 清零须挂在"重抄真正落定"的函数上——先找到它（可能在 copy/recopy 完成回调），否则钩子挂空。
3. **自由池 state 字段名未定**：旧 venue 文档用 `venueAtmosphere`，本 plan 未命名。定名后全代码统一，且 migration 初始化。
4. **atmosphere 读取面低估**：~75 命中 / 25 文件（见锚点表）。Phase 1 双池改造须全局 grep `state.library.atmosphere` 改为"读库存 or 读自由池"的分流；`disasters.js`(3)、`economy.js`(5)、`achievements.js`(4) 都可能有阶段判定逻辑要改。
5. **两套 stage 函数并行**：`getAtmosphereStage`(data) 与 `getAtmosphereLevel`(economy.js) 都推导 stage。切仪式制后两者都该只读 `state.library.stage`，否则逻辑分叉（一个跳一个不跳）。

---

## 六、已确认成立（不用改）

- 双池与现有 `Math.min(500)` 封顶天然契合，Phase 1 只给 `addAtmosphere` 加溢出分支，风险低。
- "阶段只进不退"用 `atmospherePeak` 记录历史峰值，是稳健的保留(留存)设计。
- wear 注入 `getDamageChance` 第 3 参带默认 0，向后兼容现有调用。
- venue 方案吸收合并、清理 doc  sprawl，方向对。
- §8 已自认"产出>消耗躺平经济"风险并承诺跑测算——意识到位，只差把测算前置成 P0 门槛。
- 本 redesign 整体**取代** economy-balance-review 的旧"500 硬封顶"结论（atmo 变可消耗后旧模型失效），需另跑新模型 sim。

---

## 七、决策清单（待拍板）

| # | 待决项 | 选项 |
|---|---|---|
| D1 | stage 升阶模型 | (A) peak 仅作仪式门槛 + `state.library.stage` 独立字段【推荐】 / (B) 保留 f(peak) 废仪式 |
| D2 | 自由池通胀闸 | 兑灵感日上限 / venue 维持费>日产 / 自由池软顶 / 组合 |
| D3 | 阶段数 | 补第 6 阶段文案 / 改口"5 阶段" |
| D4 | 仪式成本链 | 补 1→2 成本 + 明确与阈值关系，全标 [PLACEHOLDER] 待测算 |
| D5 | 修复室实体 | 新建升级轨道 / 替换为留声阁（已有轨道） |
| D6 | 老玩家双消耗 | 仅新升级收 atmo / 回溯补全 |
| D7 | 设施一次性加成 | 旧档按 +15 补发 / 旧档按新公式补发 |
| D8 | 数值 rationale | 实施前跑新模型收支测算，初值全标 [PLACEHOLDER] |

> 必改三项：**D1（stage 逻辑）、D2（通胀闸）、D3+D4（阶段数/仪式成本）**。这三项不定，Phase 1-3 写下去就是返工。
