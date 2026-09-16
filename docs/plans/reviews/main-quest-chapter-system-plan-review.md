# 复兴之路·主线章节系统 架构与机制评审

> 评审对象：`docs/plans/main-quest-chapter-system-plan.md`（2026-09-16 立项，status: review）
> 评审维度：**架构 + 机制**。前置：本会话已审 atmosphere v4 / borrow / cafe / sink-ledger；本 plan 与 v4 氛围标度、sink-ledger 治理直接相关。
> 立场：方向正确（单一埋点入口 `incrementQuestEvent`、纯函数 `getChapterView`、铭牌独立于 SIGNBOARDS、迁移幂等），但 **1 个 P0 机制契约缺陷 + 4 个 P1**（i18n bug / 锚点错位 / 阈值硬编码 / 漏登 ledger）会在动工后暴露。

---

## 〇、锚点核实表（逐条落地）

| 锚点 | 计划断言 | 代码实况 | 判定 |
|---|---|---|---|
| `data/tiergoals.js` TIER_GOALS | 现行实现 | ✅ 存在，5 阶 goals，check 纯函数 | 对 |
| `js/render/library.js:renderTierGoals` | 替换点 | ✅ :142 定义、:267 调用 | 对 |
| `app.js:celebrateStageCross` 247-259 | tier 弹窗段 | ✅ 247-259 正是 TIER_GOALS+tierPopupsShown+奖励，与见证 toast(236-246) 分离 | 对（可精准删） |
| `state.tierPopupsShown` | 迁移读 | ✅ state.js:236 | 对 |
| `state.guideQuests.allCompleted` | 激活接缝 | ✅ guidequests.js:110/126/166/182/239 多处置 true | 对 |
| `state.questProgress` / `state.questPlaques` | 新字段 | ✅ Glob 无 `quest-progress.js`/`questline.js`，确为新 | 对 |
| 迁移版本 v13 | 下一版 | ✅ migrations.js 当前到 v12（39-41 行） | 对（但见 P2-7 碰撞） |
| **氛围阈值 900 / 5600** | ch4/ch7 gate | ⚠️ 恰等于 v4 `STAGE_THRESHOLDS[400,900,2800,5600]` → **数值对齐 v4，但硬编码**（见 P1-3） | 数值对/写法错 |
| **`holdStageCeremony(ctx.stage)`** | ceremony 埋点 | ❌ 实际签名 `holdStageCeremony()` 无参（storage.js:113） | **锚点错位** |
| **`getQuestTerm` 键生成** | i18n | ❌ 生成 `quest1Name`，§1 模式是 `questCh1Name` | **bug** |

---

## 一、P0 — 小节契约 `{event, count}` 不足以表达 6 个"带上下文/判定"小节

**问题**：§0 把小节定义为统一契约 `{event, count}`，§3 列 18 个 event。但 §6 内容草案里至少有 **6 个小节无法用 `{event, count}` 表达**，它们需要"判定函数"或"上下文过滤"：

| 章 | 小节（§6 写法） | 真实需要 | 现有可复用 |
|---|---|---|---|
| ch3 | `visitor_return（不同访客）×3` | `countUniqueVisitors(s) >= 3` | ✅ tiergoals.js:30 已有 `countUniqueVisitors` |
| ch4 | `visitor_favor（熟识）×1` | `ctx.favorLevel >= N` | 需定义 N |
| ch5 | `focus_in_stage4×1` | `getStageLevel(s.library.atmosphere) >= 4` | ✅ atmosphere.js:57 `getStageLevel` |
| ch5 | `visitor_arrive（不同访客累计）×8` | `countUniqueVisitors(s) >= 8` | ✅ 同上 |
| ch7 | `visitor_arrive（全 10 访客）×10` | `countUniqueVisitors(s) >= 10` | ✅ 同上 |
| ch7 | `ceremony(stage5)×1` | `ctx.stage === 5` | 需从 `holdStageCeremony` 取 |

而 §2 写的达成逻辑是"对每个**含该 event** 的未完成小节判达成"——这只能处理 `events[event] >= count` 的计数型小节。**那 6 个判定型小节要么永远无法完成，要么被错误按计数判定**（例如 `focus_complete` 计数到 1 就当成"stage4 达成"，玩家在 stage2 完成第一次专注就误判 ch5 小节完成）。这是 P0：契约与内容草案自相矛盾。

**修复（统一小节 schema）**：小节 = `{ id, icon, labelKey, event, count?, check?, rewardCoins?, rewardInspiration? }`
- `count` 存在 → 默认判定 `s.events[event] >= count`（计数型，event 为触发器）
- `check` 存在 → 显式谓词 `(s, ctx) => bool`（判定型，覆盖上面 6 例；`event` 仅作触发器）
- 状态层 `incrementQuestEvent`：**对每个 event 匹配的、所有未完成章的所有小节**，跑 `section.check ? section.check(s, ctx) : s.events[event] >= section.count`。

§6 第 142 行注"判定逻辑放数据层 check，计数只做触发器"——说明作者心里有 `check`，但 **§0 契约和 §3 表没把它写进 schema**，实现者照 §0 写会漏。务必把 `check?` 提升为一等公民。

---

## 二、P0 — 章完成必须遍历"所有未完成章"，否则独立门槛会死锁

**问题**：各章 gate 是**相互独立的门槛**（ch4 要 氛围≥900，ch7 要 氛围≥5600），不是"前一章完成才解锁后章"。但 §2 写"检查**当前章**全节亮且 gate 过 → 章成"，§0 `getActiveChapter` = "第一个未完成章"。若实现成"只检查 active 章"，则一个满足 ch5 条件（8 位不同访客 + 举行过 4 阶仪式 + 10 本书）却还"卡在 ch1"的玩家，**ch5 永远不会完成**——尽管其 gate 早已满足。

**修复**：`incrementQuestEvent` 末尾遍历**所有 `chaptersDone` 之外的章**，逐章判 `gate.check(s) && 该章 sections 全在 sectionsDone`。`getActiveChapter` 仅用于 UI 高亮（导向），不参与完成判定。这样"最先满足的章先完成"，与独立门槛语义自洽。

---

## 三、P1 — `getQuestTerm` i18n 键生成 bug（静默可见）

**核实**：既有 `getTierTerm(tier, suffix) = t('tierGoal'+suffix+tier.level)`（library.js:130）。plan 的 `getQuestTerm = (ch, suffix) => t('quest'+ch.id.slice(2)+suffix)`：
- ch1：`'quest'+'1'+'Name'` = **`quest1Name`**
- §1 第 51 行既定键模式：**`questCh1Name`**

三处不一致：前缀 `quest` vs `questCh`、缺 "Ch"、`Name1` vs `NameCh1`。**结果**：所有章节/小节文案 `t()` 查不到 → 回退成裸键名（plan 自己写的"缺键不崩"让 bug 不崩但**直接把 `quest1Name` 显示给玩家**）。

**修复（二选一，必须前后一致）**：
- 改 helper：`t('questCh' + ch.id.slice(2) + suffix)` → 生成 `questCh1Name`（对齐 §1）；或
- 改 §1 键模式为 `quest{N}Name` 并同步 terms 表。
推荐前者（helper 一处改，terms 表按 §1 已规划）。**M4 的"i18n 缺键扫描"应能抓到，但建议 §1/§2 先对齐再写键。**

---

## 四、P1 — `ceremony` 埋点锚点错位（`holdStageCeremony` 无参）

**核实**：`storage.js:113 export function holdStageCeremony()` **无参数**；内部 `state.library.stage = prevLevel + 1`（116 行），stage 值在作用域内。plan §3 写"js/storage.js:holdStageCeremony（ctx.stage）"、§6 写 `ceremony(stage5)`——**实函数不接收也不传出 stage**。

**修复**：在 `holdStageCeremony` 的 116 行后、`_onStageCross` 调用前，直接 `incrementQuestEvent('ceremony', { stage: state.library.stage })`（stage 就在这）。不要改写函数签名去传 ctx（会波及 `_onStageCross` 调用链 app.js:231）。ch7 小节用 `check: (s, ctx) => ctx.stage === 5`。

---

## 五、P1 — 氛围阈值硬编码，违反 v4 单一真源规则

**核实**：`data/atmosphere.js` 头部明写"氛围阶段阈值只此一份... **禁止再硬编码阈值**"（D17/P0-A 本会话前轮评审结论），并提供 `getStageThreshold(level)` / `getStageLevel(value)`。plan ch4 gate `氛围≥900`、ch7 gate `氛围≥5600`、ch5"4 阶仪式"**直接写死 900/5600**。

数值今天是对的（900/5600 恰为 `STAGE_THRESHOLDS[1]/[3]`），但：
1. 一旦 v4 重标定氛围标度（仿真已注明"上线后用真实获取速率回测"），章节门槛会**静默失同步**——而 v4 的纪律正是为防这个。
2. "focus_in_stage4" 也应走 `getStageLevel(s.library.atmosphere) >= 4`（或 D24 存储阶段 `state.library.stage >= 4`），不要 `>= 2800` 之类。

**修复**：`import { getStageThreshold, getStageLevel } from '../data/atmosphere.js'`；ch4 gate `s.library.atmosphere >= getStageThreshold(3)`、ch7 `>= getStageThreshold(5)`、ch5 小节 `getStageLevel(s.library.atmosphere) >= 4`。

---

## 六、P1 — 漏登 sink-ledger，违反 ledger 自身治理规则

**核实**：`sink-ledger.md` §四 规则 1 明文"**新 plan 凡新增 faucet（任一线）→ 先在本文登记**"（本会话上轮评审我定的 D12）。本 plan 新增 faucet：
- 章奖：coins ≈ 50+80+80+120+150+150+300 = **930💰**，inspiration ≈ 5+10+15+20+25+30+50 = **155✨**
- 节奖：约 20~80💰/节 × 23 节 ≈ 额外数百 💰

却**未在任何 ledger 线登记**。而 ledger 金币线基线本就"v4 仿真 1.85× 过剩"、灵感线"年积累 ~3000 买穿 DLC"——章节奖励是纯增量 faucet，正属 ledger 该管的"系统级缺口"。不登记则 ledger 治理空心化。

**修复**：在 `sink-ledger.md` 金币线"本批新增"补"章节系统 +930💰(章)+~数百💰(节)"、灵感线补"+155✨(章)"，并注明"章节奖励为一次性（7 章全游仅一次），非持续 faucet，量级小，不 overturn 基线但须记账"。

---

## 七、P2 — 核心层副作用过重 + 每事件 saveState

**问题**：§2 `incrementQuestEvent` 内部直接调 `window.showToast` / `showChapterCompletePopup` / `addDiaryEntry` / `saveState`。这把 `quest-progress.js`（core 逻辑层）耦合到 UI（animations.js）、diary、storage。与本 plan 自己的 **M1 测试目标"奖励只发一次"** 冲突——副作用满满的 reducer 难单测。

**修复（推荐）**：`incrementQuestEvent` 纯更新 `state.questProgress` 并返回 `effects: [{type:'section_done',...},{type:'chapter_done',chapter,rewards},...]`；由调用方或薄协调层派发 toast/popup/diary。顺带：**不要在每次 increment 调 `saveState()`**（专注爆发期每秒多次事件 → 多次序列化），改"标脏 + 章成时存 + 复用现有 tickVisitors 周期存"。章成稀疏，存盘成本低。

---

## 八、P2 — 迁移重放对"判定型小节"漏判

**问题**：§4.3 "sectionsDone 只收 count 已达标 的节"。但 §一 那 6 个 `check` 型小节，迁移时即使 `check(s)` 已为真（老玩家早有 8 位不同访客），也**不会**被标记完成——要等下次对应 event 才补。返老玩家会看到"明明早达成却卡着"的小节。

**修复**：迁移对未完成章，逐节跑 `section.check ? section.check(s) : s.events[event] >= count`，满足即写入 `sectionsDone`（不发奖，老玩家已领过）。`check` 是 state 纯函数，确定性安全。

---

## 九、P2 — 迁移版本硬编码 v13 可能碰撞

**问题**：borrow / cafe / sink-ledger 三件套（本会话上轮评审）同为 backlog、未落地、也各自需要迁移（`state.plants`/`state.cafe`/`visitor.bookIds`/`book.borrowTimes`）。若任一先落地占 v13，本 plan 的"v13"会撞号。这正是上轮架构评审 A5（无共享迁移版本）。

**修复**：plan 改为"落地时取 `MIGRATIONS` 当前末版 +1"，不要写死 v13；或三件套 + 本 plan 在 ledger/计划看板排定迁移顺序。

---

## 十、P2 — 激活前 ch1 进度丢失 / `streaks` 字段悬空

- **激活前丢失**：§2 "未激活直接 return" → 引导期内已做的 focus_start/complete/manuscript_open 不计数，激活后需重做。ch1 gate = allCompleted = 激活条件，影响小，但建议 ch1 小节**激活前也计数**（仅章成卡 activated），免玩家重复动作。
- **`streaks` 字段**：§2 state 含 `streaks:{lastReturnChar,returnStreak}`，但 §6 无任一小节用"连续/同一对象"语义（用的是"不同访客累计"= unique count）。当前**死字段**——要么删，要么在 §6 补一条用 streak 的小节（如"连续 3 天同一访客归还"）让字段有意义。

---

## 十一、已确认健康（不重复）

- 单一埋点入口 `incrementQuestEvent` 方向对；埋点清单 18 event 覆盖 23 节，且"纯增量 + try/catch 不崩主流程"纪律正确 ✅
- `getChapterView`/`getActiveChapter` 纯函数、M1 单测设计合理 ✅
- 铭牌 `state.questPlaques` 独立于 SIGNBOARDS（buff 系统），防数值通胀的"决策 5 不加功能 buff"正确 ✅
- 庆祝解耦（章成不等仪式，§5 决策 8）正确；`celebrateStageCross` 退役段精准可删 ✅
- 迁移幂等（`questProgress` 已存在 return）、老档只补确定性 count 类、不重发奖——大方向对 ✅
- 数值纪律：章节奖励零氛围（EXP 纪律延续），coins/inspiration 量级小（全游一次性 ~930💰/155✨），不 overturn v4 基线 ✅
- 边界守护（不动 guideQuests 内容、不做缮写室 typewriter）清晰 ✅

---

## 十二、决策清单

| # | 决策 | 级别 | 处置 |
|---|---|---|---|
| D1 | 小节 schema 加 `check?` 一等公民，6 个判定型小节改写 | 🔴 P0 | §0/§3/§6 统一；§2 遍历 all 章 all 节 |
| D2 | 章成遍历所有未完成章（非仅 active） | 🔴 P0 | 防独立门槛死锁 |
| D3 | `getQuestTerm` 键生成对齐 `questCh{N}` | ⚠️ P1 | helper 改 `t('questCh'+slice(2)+suffix)` |
| D4 | `ceremony` 埋点改在 holdStageCeremony:116 后内联 `incrementQuestEvent('ceremony',{stage})` | ⚠️ P1 | 不动函数签名 |
| D5 | 氛围阈值走 `getStageThreshold/getStageLevel`，禁硬编码 900/5600 | ⚠️ P1 | 接 v4 单一真源 |
| D6 | 章节 faucet 登记 sink-ledger 金币/灵感线 | ⚠️ P1 | 守 ledger 规则 1 |
| D7 | `incrementQuestEvent` 返回 effects、不内联 UI/diary/save | ◽ P2 | 提测试性 + 性能 |
| D8 | 迁移重放对 check 型小节也判 `check(s)` | ◽ P2 | 防返老玩家卡节 |
| D9 | 迁移版本落地时取末版+1，不写死 v13 | ◽ P2 | 防与他 plan 撞号 |
| D10 | ch1 激活前也计小节 / 删或启用 `streaks` 字段 | ◽ P2 | 消悬空 |

---

## 十三、一句话总结

机制大方向对、与 v4 标度对齐；**但 §0 的 `{event,count}` 契约撑不住 §6 里 6 个"判定型/上下文过滤"小节（P0），加上 i18n 键生成 bug、ceremony 锚点错位、氛围阈值硬编码、漏登 ledger 四处 P1**——动工前先把 D1-D6 落进 plan，否则实现者会在第 6 个小节卡住、且全任务文本变裸键名。
