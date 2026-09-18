# 田园瘟疫纪事·位面重建方案 评审（pastoral-plane-rebuild-plan v2）

> 评审人：Game Designer　|　日期：2026-09-18　|　视角：机制 + 数值 + 代码架构 + 经济账本一致性
> 关联：sink-ledger.md、economy-subsystem-architecture-review.md（A1/A2/A4）、main-quest-chapter-system-plan-review-v2.md（ch6 撞车）

---

## 〇、Verdict

**方向对，地基扎实，测试纪律全项目最佳；但有两处 P0 级的"软锁/校准"风险，和一处账本登记的程序性缺口。** 这份 v2 把我上一轮六专科评审揪出的 v1 失败模式（迁移毁档、幕判据缺席、结局支配策略、三≠二、草药悬空 faucet、永久错过收集）**逐条对账闭环了**，锚点也全部经得起核。它最大的价值不是某个机制多妙，而是**契约层重建**——schema v2.1、三态 flags、幕 gate、八键模块接口、M1-M6 迁移矩阵、27 组合 totality 测试——这些让"位面#2 假想数据零新代码可跑"成为可机检的验收，而非口号。

动手前必须解的两处：① gate 的必需信件没有"保证触达"测试（v1 软锁只是换了个位置）；② `chaptersCopiedCum` 没有全局计数器、pacing 仿真也没建模抄书轴，五幕 gate 数字（4/12/22/35）目前**无法校准**。

---

## 一、代码锚点核实（全部成立 ✓）

| plan 主张 | 实测 | 结论 |
|---|---|---|
| `state.js:207` 运行时键是 `state.quests` 非 `state.planes` | `quests: { pastoral: {...} }` 确在；全库零 `state.planes` | ✓ 迁移"不改名"成立 |
| `quests.js:42` 硬编码 `'pastoral'` | `if (planeId === 'pastoral' && char.unlockStage > pq.stage) return;` | ✓ 模板化反面教材坐实 |
| `plane.js:78-79` `atmo` 残读 | `const { atmo, books } = plane.unlock` + `state.library.atmosphere` | ✓ D24 字段已改 `stage`，残读待清 |
| `migrations.js:373` `delete p.plagueProgress` | `if (p.plagueProgress !== undefined) delete p.plagueProgress;` | ✓ "只读不删"反例坐实；当前 v13，v14 下一档 ✓ |
| `data/planes.js` `unlock:{stage:3,books:12}` + `unlockStage` | 字段齐全，与 D6/D3 吻合 | ✓ |
| `pastoral_tasks.js` 2057 行 | `wc -l` = 2057 | ✓ |
| `data/music.js` BGM 管线 | 存在（2070B） | ✓ 基调 S5 有落点 |
| `onNewDay` 事件总线 | `core/day-boundary.js:26` 导出，cafe/offsite/exhibition/diary/achievements/dailytasks 已订阅 | ✓ **已存在**（我前轮 A1 的"无统一日界"已被建好，tend 依赖成立，非悬空） |

---

## 二、P0 — 必须在 Phase A/B 出口前解的机制风险

### P0-1　gate 的必需信件：v1 软锁只是换了位置

v1 的 P0「分支信不回=软锁」在 v2 被 `pointN_unanswered` 三态**治好了分支点**——但未答态只对"已推进到该幕"生效。而 §4.1 的 `gate.required`（小艾拉信件集×3 / 双草药·修女必需信集 / 艾德里安必需信 / 杜兰必需信）是**另一套东西**：它们是幕完成的前置，靠 `trigger: copy_chapter/book_completed/visitor_arrive/letter_completed` 推送。

风险：**若某封必需信的 trigger 在其幕 gate 的 `chaptersCopiedCum` 下永不触发，该幕永远无法完成 → 硬软锁**，且此时 `unanswered` 也来不及自动落（幕没推进）。v1 的软锁从"分支点"挪到了"gate.required"，本质同类。

Phase B 出口只断言了「幕1 信经现有 trigger 到达」——这是单点验证，不是系统性保证。
**修**：建一张 `gate.required → trigger` 映射表，并对每幕补一条 totality 式断言（在 pacing 仿真里跑：到该幕 `chaptersCopiedCum` 时，每个 required 信件都已触发）。复用 §4.4 的 totality 测试框架，成本极低。

### P0-2　`chaptersCopiedCum` 无计数器 + 仿真无抄书轴 → gate 数字无法校准

五幕 gate 用 `chaptersCopiedCum: 4/12/22/35`（§3.2 / §4.1），标记为「【仿真校准】」。但：

1. **全局无累计计数器**：grep 全库只有每本书 `bookState.copyCount`（`book-progress.js:63`）和每本书 `chapters.length`（`purchase-modal.js:29`）。`chaptersCopiedCum = Σ(copyCount × chapterCount)` 可算，**但没有 `getTotalChaptersCopied(state)` 这类单一真源**——gate 判定和 sim 都要各自重算，易漂移。
2. **pacing 仿真不建模抄书**：`simulate-atmosphere-economy.mjs` 只跟踪 `wear`/`recopy`/`inspiration`（:55-56/100），**零建模章节抄写速率**。所以 4/12/22/35 当前没有任何数值 substrate 可校准。

**死锁风险**：幕3 gate = 入谷（stage3，约中期）+ 艾德里安必需信 + **≥22 章**。若抄书速率 < 阶段推进速率，玩家先到 stage3 却卡在 22 章 → 幕3 推不动。v4 硬核曲线是「平台后断崖」（我 main-quest 评审已证），中段 22→75d 几乎无阶段级解锁，恰好是抄书速率最该被验证的区间。
**修**：① 建 `getTotalChaptersCopied(state)`；② 扩仿真加「抄书速率轴」（默认 [PLACEHOLDER · 按真实首月数据定]，建议从 v4 仿真借专注脊柱 2.5 会话/日 × 单会话完成书数反推）；③ 在校准脚本里断言**五幕无任一陷入"已达前置门槛但 chaptersCopiedCum 不足"的死锁**。

---

## 三、P1 — 经济账本与数值纪律

### P1-3　§九 faucet 未真正登记进 sink-ledger（程序性缺口）

§九标题写「sink-ledger 登记项（Phase C 前登记，非事后补记）」，列了 gather（≤3/日×≤10💰）、tend（≤5💰/登录日）、结局奖励、~150 氛围 faucet 移除。但我通读 `sink-ledger.md`：**coins 行只登记了 borrow-demand / cafe / 章节系统，没有 pastoral 的任何条目**。

这违反账本自身的规则 1（「新 plan 凡新增 faucet 必先在此登记」）。当前 §九 是"描述性登记"，不是"真登记"。
**修**：把 gather/tend 两行以 pending-registration 形式**写进 sink-ledger.md 的 coins 行**（含 faucet 增速、无 sink、首月复核责任），§九 改为「已登记见 sink-ledger §三」。

### P1-4　gather/tend 是净 faucet（无 sink）——可接受但须记

gather ≤30💰/日（绑专注，硬核实际 ~25💰）、tend ≤5💰/日（无离线补发），合计 ~30-35💰/日。对比账本金币线已 1.85× 过剩（39,402 vs 21,271），这是**方向性再加通胀但量级小**。plan 的「叙事节流的一次性 faucet 为主、重复 faucet 仅 gather/tend 带 caps 口子」框架正确——caps（≤3/日、≤10/次）就是节流闸，不是 sink。按账本体例记为「faucet-无对应 sink，靠速率上限节流，coins 已过剩故可接受，首月复核」即可。

**正向确认**：gather「每专注会话一次、≤10💰」正是我咖啡角评审逼出的经济纪律——faucet 速率被核心循环（专注）供血，结构上不可能比专注刷得更快。这是 v1「草药无限刷金」的根治，方向完全对。

### P1-5　病倒「真实游戏日」语义未定

§4.0「病倒按旗标表病倒真实游戏日」。但本游戏日界是**活跃日**语义（`state.js:192` 末行「最后活跃日本地日历 key」、`storage.js:129`「活跃日≠专注日」）。两种解读后果相反：
- **日历日**（真实 wall-clock）：离线玩家长时间不登录 → 角色病倒，对 activity-gated 游戏是惩罚式设计；
- **活跃日**（登录/专注日）：病倒 tied to 游玩节奏，与 day-boundary 总线一致。

**修**：明文定为「活跃游戏日」（与 `onNewDay({prevDay,today})` 的总线语义对齐），并说清离线期间是否累计、病倒是否有上限避免长离线一次性全病。

### P1-6　「移除 ~150 氛围隐藏 faucet」需清点 + 重跑 v4 仿真

§九「旧任务拆除 = 移除 ~150 氛围隐藏 faucet（v4.3 EXP 模型下利好硬核 166 天 pacing）」。两点：
1. **~150 是估算**：从 `pastoral_tasks.js`（2057 行）实际数一遍隐藏 `addAtmosphere`/EXP 调用，给出真数；
2. **移除 EXP faucet 会拉长 v4 曲线**：v4 仿真 173/207/254 天是在含这些旧 faucet 下跑的，删掉后 stage 推进更慢 → 必须**重跑 v4 仿真**得到新 pacing（直接挂钩账本 A2「上线后重基线」）。否则「利好 166 天」是拍脑袋。

---

## 四、P2 — 不阻断但合纪律

- **结局奖励 [PLACEHOLDER]**：§九「绝对值进 Phase B 数值评审；档差 ≤100💰 仅约束金币项」——正确延后，但属未定值，建账本/主线 tracked item，别在 Phase C 后才想。
- **gather 钩子依赖专注完成事件**：plan 说「会后结算」，focus-orchestrator 已有完成流（visitor 生成即挂其回调，:147/158/287），gather 应同模式订阅。低风险，Phase C 出口补一条「focus 完成 → gather 入账且 ≤3/日」断言。
- **en locale 87 篇 × 双语 ≈ 5-6 万词**：§六 内容预算真实，但本地化成本是项目级工作量，排期 S4 之前要确认译审人力，否则 §六「100% 完成率」会卡在翻译而非写作。
- **`minDays` 字段**：§3.2 gate 有 `minDays:0` 可选，但全文未用——若想防「速通抄书跳幕」可在 Phase B 借它设下限，否则删掉避免死字段。

---

## 五、已确认扎实（不重复机审，记功）

- **§零 玩家幻想作北极星**：「信使的重量」「安静比怪物吓人」——所有设计回扣此，fun hypothesis 先行做得对。
- **D8 缺席式损失**：「静默邮箱就是惩罚」「页面永不出现死亡」「离别者=流浪熟客」——损失在叙事层不在数值层，优雅且合规（§4.5 宪章 CN cozy 合规）。这是我评审过本项目最干净的机制之一。
- **27 组合 totality + 四路径断言 + M1-M6 迁移矩阵**：测试纪律全项目最佳，直接灭掉 v1「零测试 / 三分支统计不成立」。
- **模板化三态 flags + 引擎清 `'pastoral'` 字面量（lint）**：骨架硬血肉软，位面#2 假想数据可机检。
- **迁移 v14 旧字段只读**：直接针对 `plagueProgress` delete 反例，飞行中存档映射也给了。
- **§六 内容预算 + 每幕完成率进出口**：防 v1「技术过、故事空壳」。
- **onNewDay 正确挂现有总线**：tend 日结不自带 Date 数学，与账本 A1 收敛一致。
- **D11 ch6 stub 契约**：与 main-quest 评审的 ch6 撞车风险正面协调（stub 发射器 + 主线挂注记），不再各写各的。

---

## 六、决策清单

| # | 决策 | 级 | 落点 |
|---|---|---|---|
| D1 | gate.required 建 trigger 映射 + totality 式「必达」断言 | 🔴 P0 | §4.1 / Phase B 出口 |
| D2 | 建 `getTotalChaptersCopied` + 扩仿真加抄书轴 + 断言五幕无死锁 | 🔴 P0 | §3.2 / §8 Phase B |
| D3 | gather/tend 真写进 sink-ledger.md coins 行（pending） | 🟡 P1 | §九 / 账本 |
| D4 | gather/tend 记为「无 sink faucet + 首月复核」 | 🟡 P1 | 账本 §三 |
| D5 | 病倒语义定为「活跃游戏日」+ 离线累计/上限说明 | 🟡 P1 | §4.0 |
| D6 | 清点旧 ~150 faucet 真数 + 重跑 v4 仿真得新 pacing | 🟡 P1 | §九 / 账本 A2 |
| D7 | 结局奖励建 tracked [PLACEHOLDER]（Phase B 定值） | ◽ P2 | §九 |
| D8 | gather 订阅专注完成事件 + ≤3/日断言 | ◽ P2 | §5.2 / Phase C |

**必改 D1、D2**——这两处不定，Phase B/C 会在"信件不触发"或"gate 数字拍脑袋"上返工；其余按你判断。

---

## 处置记录（2026-09-18）

**D1-D8 全折入 plan v2.1**（图南拍板）：D-追1/D-追2 → §4.1+Phase B 出口；D5 → §4.0；D3/D4/D6/D7 → §九 + sink-ledger §三 pending 行（gather/tend、62 点 EXP 移除真数）；D8 → Phase C 出口。主审复核修正一处：旧任务氛围 faucet 实数 **62（57 任务）≠ ~150**，D6 紧迫性降档挂 A2 排期。另补盲区一条：分支载体信「到达」与「已选」在 Phase B 出口分两条断言。
