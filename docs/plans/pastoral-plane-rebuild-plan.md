# 田园瘟疫纪事·位面重建方案（pastoral-plane-rebuild-plan）v2

> 状态：v2.1——2026-09-18 六专科评审全面修订为 v2 后，同日 game-designer 追评（`reviews/pastoral-plane-rebuild-plan-review.md`）D1-D8 全折入；待图南终审后入 planner
> 关联待办：`plane1-overhaul`（第一位面整体建设重启）
> 决策来源：图南 2026-09-18 拍板——①重建 ②叙事重打磨 ③模板化 ④双轨·先馆后谷 ⑤轻分支·抉择有痕 ⑥骨架硬·血肉软；
> 评审后追加——⑦三分支点（补幕3）⑧结局对称化 ⑨完整损失模型 ⑩草药砍出 v1 ⑪ gather 绑定专注 ⑫ ch6 stub 契约 ⑬ 墨墨含蓄规则

---

## 零、玩家幻想（Player Fantasy）

**你是位面行者——不是挥剑的英雄，而是夹在两个世界之间的信使。** 你每抄一页书，山谷里就有一盏灯多亮一分；你每回一封信，某个人的命运就悄悄转弯。瘟疫不向你挥刀，它只是让邮箱安静几天——而那安静比任何怪物都吓人。当山谷终于迎来黎明，你会发现：那不是书救了他们，是你一页一页抄出来的书。

> 评审注：v1 缺此章。这是全案的北极星——凡是不能服务于「信使的重量」的设计（街机式小游戏、无限刷的资源）都是反幻想的。

---

## 一、决策总表

| # | 决策 | 内容 | 优先级 |
|---|---|---|---|
| D1 | 重建 | 推翻七期/八期实现，引擎在重写范围 | 🔴 P0 |
| D2 | 叙事重打磨 | 旧 2057 行任务与信件归档为**逐角色重写底稿**（非仅参考），五角色保留、弧光重写 | 🔴 P0 |
| D3 | 模板化·骨架硬血肉软 | schema 泛化已知会变要素，交互模块可插拔；防为想象中的位面#2过度抽象 | 🔴 P0 |
| D4 | 双轨·先馆后谷 | 幕1-2 守馆线；幕3 起「谷门洞开」入谷。与氛围五阶段/展览厅同节奏美学 | 🔴 P0 |
| D5 | 轻分支·三分支点 | 幕2（知识/信仰）、幕3（禁书处置）、幕4（进言方式）；**未答=合法第四态**（幕推进自动落 `pointN_unanswered`） | 🔴 P0 |
| D6 | 解锁模型保留 | `stage 3 + books 12 + 传送门购买` 不动 | ◽ P2 |
| D7 | 结局对称化 | 无单一幕2旗标封死曙光；两条 act-2 路线都有通往最好结局的路径（同结局、异结语/信物注记） | 🔴 P0 |
| D8 | 完整损失模型（签署） | 角色病倒按真实游戏日计、信件暂停=静默邮箱、余烬有角色永久离开山谷（最后一封信+永久痕迹+选择前预告）、**页面永不出现死亡**、熟客与结局解耦（离开山谷≠失联图书馆） | 🔴 P0 |
| D9 | 草药砍出 v1 | gather v1 只产上限金币（≤3次/日 × ≤10💰）；草药待有 sink 时单独立项 | 🔴 P0 |
| D10 | gather 绑定专注 | 收割=专注会话完成的奖励（会后结算）；专注进行中禁止入谷采集（`allowedDuringFocus=false`，「专注结束后再来」风味文案） | 🔴 P0 |
| D11 | ch6 stub 契约 | Phase A 定义 `plane_unlock` 事件契约（事件名+payload+stub 发射器+测试）；主线计划 ch6 挂注记，门槛待主线落地时修订 | 🔴 P0 |
| D12 | 墨墨含蓄规则 | 每幕至多一处含蓄旗标引用，结尾集中兑现；「痕」的扩量走旗标差异化回信（选择后 24-48h 游戏内），墨墨引用玩家而非旗标 | 🟡 P1 |
| D13 | 测试基线先行 | Phase 0 建 `test-plane-baseline.mjs` + 聚合器；每 Phase 出口=全量测试零失败 | 🔴 P0 |

**腐化修复（Phase 0）**：`js/render/plane.js:78` 锁定页 `atmo` 残读（D24 字段已改 `stage`）；`js/quests.js:42` 引擎硬编码 `'pastoral'`（模板化验收的反面教材，重构时清除并加 lint）。

---

## 二、现状盘点与处置（2026-09-18 核实版）

| 层 | 文件 | 核实事实 | 处置 |
|---|---|---|---|
| 数据 | `data/planes.js` | 结构可用 | schema v2.1 基础 |
| 内容 | `data/quests/pastoral_tasks.js` | 2057 行 ≈100 任务，含 ~150 氛围隐藏 faucet | 移 `docs/archive/data/`；**逐角色重写底稿**；faucet 移除登记 sink-ledger |
| 系统 | `js/quests.js` | 队列/幕推进骨架可留；**`:42` 硬编码 plane id** | 重构基底 |
| 存档 | `js/state/state.js:207` | **运行时键是 `state.quests`，不是 `state.planes`**（全库零命中） | flags 落 `state.quests.<planeId>.flags`，**不改名**（保接口、降迁移面） |
| 迁移 | `js/state/migrations.js` | 当前 v13 → 新迁移 v14；**现行代码会 delete 旧字段**（:373 `plagueProgress` 先例） | v14 旧字段只读不删，违背即评审打回 |
| 渲染 | `js/render/plane.js` | 随 D1 重写 | 形态参考 |
| 测试 | `scripts/test-*.mjs` ×12 | **零测试碰位面系统**；无聚合器、无 npm test | Phase 0 补基线+聚合器 |
| 主线钩子 | — | `plane_unlock` 全库零代码命中（纯文档词） | D11 stub 契约 |
| 视觉 | — | 零资产 | §七 |

---

## 三、模板架构（schema v2.1）

### 3.1 原则

- **骨架硬**：位面#2 假想数据零新代码可跑通是 Phase A 验收（机检，非口号）
- **血肉软**：交互模块可插拔；位面#2 新玩法类型允许新增模块
- **存档键不改**：一切落 `state.quests.<planeId>`

### 3.2 PLANES schema v2.1

```js
pastoral: {
  id, name, emoji, desc, bgClass, theme,                  // 沿用
  unlock: { stage, books, shopUpgrade },                  // D6 不动
  baseMap: { arts: [5 幕态图键] },                        // 谷底图，顶层字段，不入 zones
  acts: [{
    n, title, mood, momoComment, libraryLine: bool,
    gate: {                                                // 🔴 新增：幕完成判据（v1 完全缺席）
      required: ['letter_a', 'task_b'],                    // 必需信件/任务集合
      chaptersCopiedCum: 4,                                // 累计誊抄章数下限【仿真校准】
      minDays: 0                                           // 可选天数下限
    }
  }],
  characters: [{ id, name, emoji, role, portrait, firstAct, arc,
    fateFlags }],                                          // fateFlags: 命运受哪些旗标影响
  mementos: [{ id, name, emoji, art, condition }],         // condition 只影响获得时机/注记，**不关闭图鉴格子**（D8）
  zones: [{ id, name, emoji,
    visibleAct,                                            // 🔴 新增：可见门槛
    unlockAct,                                             // 可进入门槛（塔楼 3≠4）
    module,                                                // 可插拔模块键；null=纯展示热区
    states: [{ key, art, when: { actGte?, flag? } }] }],  // 🔴 改：从计数改为规则表
  letters: { /* §4.3 */ },
  branches: { points: [...], rules: [...], default }       // 🔴 改：机检规则表（§4.4）
}
```

**v1→v2 字段增改对照**：`stage`→`acts`（每幕加 `gate`）；`characters[].unlockStage`→`firstAct`；letters 增 `requiresFlag?`/`afterLetter?`/`reward?`（choice 级同名可选）；trigger 枚举扩 **`letter_completed`**（条件后续信——v1 schema 在自己的内容上就会断的第一处）；zones 拆 `visibleAct`/`unlockAct`、`states` 改规则表；新增顶层 `baseMap`。

### 3.3 Flags 系统（三态·只设不消）

- 每分支点三态：`选项A旗标 / 选项B旗标 / pointN_unanswered`（幕推进时未答自动落）
- 3 点 × 3 态 = **27 组合空间**（v1 写「8 组合」是数学错误——未答态没算进去）
- 落库：`state.quests.<planeId>.flags[]`（数组，去重）；迁移 v14（§8.2 矩阵）
- 判定：结局规则表机检（§4.4），附 27 组合全展开 + totality 测试
- 护栏：旗标只设不消、不新增第 4 分支点；次级送书旗标**砍掉**（v1 §4.2 遗留，拆护栏）

### 3.4 可插拔交互模块（八键接口）

```js
registerZoneModule('gather', {
  enter(zone), interact(), leave(),
  render(container, ctx),            // 谷视图挂载
  onNewDay(zoneState),               // 挂 day-boundary 事件总线，禁自带 Date 数学
  serialize(), deserialize(s),       // 存档往返
  canInteract(state),                // 分区自判灰锁
  allowedDuringFocus: false          // D10：专注中禁采集；tend/vignette=true
});
```

引擎为缺省键提供兜底（render 缺省=纯按钮热区、serialize 缺省=无状态）。位面#1 模块：**gather**（会后收割，§4.6）、**vignette**（聆听独白）、**tend**（教堂照料，onNewDay 日结一次、无离线补发）。

### 3.5 引擎与事件契约

- `js/quests.js` 重构：队列/幕推进骨架保留；**清除全部 plane-id 字面量**（lint：引擎路径零 `'pastoral'`）
- 事件契约（D11）：`emit('plane_unlock', { planeId, act, flags })` 等主线将绑定的事件，Phase A stub 发射器 + 测试；主线计划 ch6 挂注记：「『解锁 2 位面』门槛待主线落地时修订，候选=田园位面五幕通关」

---

## 四、叙事框架 v2.1

### 4.0 损失模型（D8，替换 v1「不设失败态」条款）

**损失以「缺席」存在，永不做页面死亡。** 三个机制：

1. **病倒**：角色按旗标表病倒真实游戏日（§4.2），期间信件暂停到达——**静默邮箱就是惩罚**（放置基因自带的力量感，评审最佳创意）。病倒可愈，痊愈信即补偿。**计日语义（追评 D5）**：按**活跃游戏日**（onNewDay 总线语义，`state.js:192`），离线日历日不累计；病倒队列设上限（同时 ≤2 人），防长离线回归一次性全病
2. **离别**：仅余烬结局一名角色永久离开山谷（最后一封信+永久痕迹）。选择文案提前预告代价（「这封信寄出后，有些门会关上」）；flag→离别者映射写死在数据里，不临场决定
3. **解耦**：离开山谷的角色仍以「流浪熟客」来访图书馆——**损失在叙事层，不在数值层**（熟客注册与结局无关，五人全入池）

### 4.1 幕结构（含完成判据——v1 完全缺席，现补齐）

| 幕 | 标题 | 线 | gate（required / 累计誊抄） | 分支 | 目标日【仿真校准】 |
|---|---|---|---|---|---|
| 1 | 求救之声 | 守馆 | 小艾拉信件集 ×3 / ≥4 章 | — | 解锁日 ~22-30d |
| 2 | 草药与祈祷 | 守馆 | 双草药/修女必需信集 / ≥12 章 | **点①** | ~50d |
| 3 | 禁忌之书 | **开谷** | 入谷 + 艾德里安必需信 / ≥22 章 | **点③** | ~75d |
| 4 | 领主之责 | 入谷 | 杜兰必需信 / ≥35 章 | **点②** | ~105d |
| 5 | 黎明的山谷 | 入谷 | 旗标汇总 → 结局演出 | 汇总解析 | ~130d（硬核 166d 首通线内） |

gate 数字为提案，Phase B 用 pacing 仿真脚本（扩展 `simulate-atmosphere-economy.mjs` 先例，**加抄书速率轴**）校准后定版。

**追评折入（2026-09-18，D-追1/D-追2）**：
① **gate.required 必须有「保证触达」证明**——建 required→trigger 映射表，仿真里 totality 式断言「到该幕 chaptersCopiedCum 时每个 required 信均已触发」；分支载体信分两条断言（**信到达 ≠ 玩家已选**）。v1 的软锁风险在 gate 层的残余到此封死。
② **chaptersCopiedCum 判定单一真源 = 新建 `getTotalChaptersCopied(state)`**（Σ copyCount×chapterCount，落 `js/core/`），gate 判定与仿真共用，禁止各自重算。

### 4.2 分支点明细与「痕」

| 点 | 幕 | 抉择 | 旗标 | 病倒顺序影响 |
|---|---|---|---|---|
| ① | 2 | 瘟疫 blame 落地后：公开护草药师 / 借教会之手 | `herbal_trusted` / `faith_trusted` / `p1_unanswered` | herbal→卡特琳先病；faith→玛格丽特先病 |
| ③ | 3 | 禁书：直接交给艾德里安 / 先经杜兰伯爵 | `adrian_open` / `adrian_cautious` / `p3_unanswered` | open→艾德里安幕4冒险暴露（病一场） |
| ② | 4 | 向领主进言：直陈 / 迂回 | `lord_convinced` / `lord_shamed` / `p2_unanswered` | shamed→村庄幕5初仍封锁 |

**痕的三条载体（全部必做）**：
1. **即时闭环**：分支落定后 24-48h 游戏内收到该角色的旗标差异化短回信（每点 2 篇变体——一封信的成本让痕当幕可见，补上 v1 的两幕真空期）
2. **病倒与离别**：§4.0 机制 + 分区视觉态（states 规则表 `when.flag`）
3. **墨墨（D12）**：每幕至多一处含蓄引用（「我记得」对，「你把草药书递给了她」错——信里说过的事实她不再复述）；集中兑现放结局序列。墨墨引用**玩家**，不枚举旗标

### 4.3 信件数据形态与交互规格

数据：`{ id, from, act, trigger, body, requiresFlag?, afterLetter?, reward?, choices?[{ id, text, setFlag, reward? }] }`；trigger 枚举：`copy_chapter / book_completed / chapter_read / visitor_arrive / letter_completed`。

交互规格（v1 全缺，UX 审查红线）：
- **分支信火漆印标记** + 信头引语「此信将决定……」——玩家必须知道自己在抉择
- 选择后**确认步**，文案预告影响域不剧透细节（「这次回信会被记住」）
- **寄信簿**：已寄出信件+所选项可重读（痕的载体，数据已在，成本极低）
- 选项区与正文视觉分离防误触；分支选项文案 **100 字符硬上限**（en 膨胀 2.5-3×）
- 弹窗 `max-h-[80vh] + overflow-y-auto`，选项区 sticky 底部；en locale 360px 视口可完整滚动阅读（Phase B 实测项）

### 4.4 结局规则表（机检格式）

判定输入 = {p1, p2, p3} 三态旗标。规则**有序**，首命中生效；**恰好一条 default** 吸收全部未覆盖组合：

| # | 条件 | 结局 |
|---|---|---|
| R1 | p2=convinced ∧ p1≠unanswered ∧ p3≠unanswered | **曙光** |
| R2 | p2=convinced ∧ p1=unanswered | 余烬（领主动了，但医者从未被信任——空心胜利） |
| R3 | p2=convinced ∧ p3=unanswered | 余烬（学者的线头未织完） |
| R4 | p2=shamed ∧ p1≠unanswered | 余烬（真相已言，权力未动——抵抗年代） |
| R5 | default（p2=unanswered，或 shamed∧unanswered） | **长夜火种** |

**D7 校验**：faith+convinced → R1 → 曙光 ✓；herbal+convinced → 曙光 ✓。两条 act-2 路线都有最好结局路径；旗标差异落在结语/信物注记/分区终态（不增结局档数）。

27 组合分布：曙光 4、余烬 11、长夜 12。totality 测试枚举全部 27 行，每行**恰好一个**结局。

| 结局 | 演出 | 信物 | 熟客 |
|---|---|---|---|
| 曙光 🌅 | 山谷全复苏终图；双路线异结语 | 5 全得，注记随旗标 | 五人全入池 |
| 余烬 🕯️ | 复苏 2/3；**一名角色离别**（最后一封信+永久痕迹，谁离别由 flag→离别映射表写死） | 全可得，时机异 | 五人全入池（离别者=流浪熟客） |
| 长夜火种 🌌 | 阴郁终图+图书馆窗光 | 全可得，时机异 | 五人全入池 |

**信物图鉴永不缺格**：condition 只影响获得时机/风味注记；未得者显示「另一条时间线可得」。「再度入谷」重演机制进 backlog 锚点（不进 v1）。

### 4.5 基调宪章（CN 渠道 cozy 合规）

| 页面可写 ✅ | 幕后规则（永不出现）❌ |
|---|---|
| 病痛、哀悼、替罪羊背景（「女巫」只作为他人的残忍，永非游戏的判词） | 儿童死亡（小艾拉永不离场） |
| 猎巫作为背景压力，**不晚于幕4解决**（搬药材/圆规课式和解） | 火刑/焚烧意象 |
| 离别（最后一封信+痕迹） | 页面死亡 |
| 信仰怀疑与和解（旧版最佳：卡特琳「怀疑本身就是更深信仰的开始」） | 对任一信仰阵营的判词式结局 |

---

## 五、分区规划（谷视图全规格）

### 5.1 分区总表

| 分区 | 角色 | 模块 | visibleAct / unlockAct | 视觉态 |
|---|---|---|---|---|
| （baseMap）麦浪山谷 🌾 | — | 主视觉承载 | 3 / — | 5 幕态 |
| 村庄 🏘️ | 小艾拉 | vignette | 3 / 3 | 3 态（规则表） |
| 草药园 🌿 | 玛格丽特 | gather | 3 / 3 | 3 态 |
| 教堂 ⛪ | 卡特琳 | tend | 3 / 3 | 3 态 |
| 塔楼书房 🗼 | 艾德里安 | vignette | **3 / 4** | 3 态 |
| 城堡 🏰 | 杜兰 | 剧情演出型 | 4 / 4 | 3 态 |

### 5.2 谷视图交互规格（UX 审查红线全落地）

- **画幅**：S1 出图锁竖版 **3:4**（山谷纵深构图天然竖版；与横版大厅形成差异）
- **热区**：视觉锚点与命中区解耦，可点区固定 ≥48px 圆形按钮（带引线），不随图缩放；360px 视口实测 ≥44px 进 Phase C 出口
- **分区快捷列表**：图下方常驻列表为主交互，热点为快捷入口（兜底提升主交互）
- **导航归宿**：谷视图 = **act 门控第 9 tab**「田园」，幕<3 不渲染（非灰锁占位），幕3 开谷时 tab 仪式性出现（D4 揭面美学）；不放档案子页
- **横屏**：左图右列表双栏（图 ≤50vw），一鱼两吃
- **可达性**：热点用 `<button>`、`aria-label` 带分区名+状态（「草药园，已复苏/幕4解锁」）、锁定态 🔒+文字标签（非纯灰度——与阴郁幕态色阶重叠会误读）
- **幕1-2 预告**：位面页顶部放幕5 底图灰调剪影（零新资产）标「幕3 显形」；幕2 末墨墨钩子「山那边的雾散了，我看见了麦田」
- **命名**：幕3 事件叫**「谷门洞开」**，与购买的传送门脱钩（v1「传送门开启谷视图」一词两义）
- **专注并发**：模块 `allowedDuringFocus` 声明；gather=false（热点显示「专注结束后再来」——限制做成风味）；谷 overlay 走单实例 overlay 管理器（防 modal 叠 modal 黑屏事故史）
- **gather（D10）**：收割绑定专注会话完成——「艾拉替你采了一篮，因为你今天守住了专注」；每专注会话一次、每日 ≤3 次、≤10💰/次。结构上不可能比专注刷得更快（漏斗由核心回路供血，经济审查红线的根治）

---

## 六、内容预算（v1 完全缺席——评审认定的旧失败原因之一）

| 幕 | 信件 | 分支变体 | 病倒/离别信 | 分区独白 | 墨墨 | 小计 |
|---|---|---|---|---|---|---|
| 1 | 6 | — | — | — | 2 | 8 |
| 2 | 8 | 4（点①即时回信） | 2 | — | 3 | 17 |
| 3 | 6 | 4（点③） | 1 | 9（3 区×3） | 3 | 23 |
| 4 | 6 | 4（点②） | 3（含离别预告） | 6（2 区×3） | 3 | 22 |
| 5 | 5 | — | 3 档结局演出 | 5 | 4 | 17 |
| **合计** | | | | | | **≈87 篇 / 2.5-3 万中字 × 双语** |

- 全部 zh/en 从 Phase B 进 `terms.js`（项目英文化纪律，不复读后补模式）
- 旧信件为**逐角色重写底稿**：小艾拉/玛格丽特的旧信质量达标（评审抽验），以角色为单位改写而非从零写
- Phase B/C/D 出口各挂「本幕内容预算完成率 100%」——防止技术验收过了、故事空壳（v1 会重蹈的覆辙）

---

## 七、素材清单与生产排期

| 批次 | 素材 | 数量 | 规格要点 | 用途阶段 |
|---|---|---|---|---|
| S1 | 山谷底图 | 5（幕态） | **竖版 3:4**，纵深构图 | Phase C |
| S2 | 角色立绘 | 5 + **命运变体 2（必做，非可选）** | 病倒/离别态 | Phase B 起 |
| S3 | 分区图 | 15（5 区×3 态） | 阴郁/转机/复苏 | Phase C/D |
| S4 | 信物图 ×5、火漆印、笺纸、寄信簿 UI、谷门视觉 | 9 | — | Phase B 起 |
| S5 | BGM ×3（田园牧歌/瘟疫低音/曙光） | 3 | 走 `data/music.js` 管线 | Phase C 起 |

风格锚点（草案待图南定调）：中世纪手抄本/木刻版画质感，琥珀+鼠尾草绿，瘟疫期压灰绿烟灰；AI 出图提示词另文（`ui-assets-prompt.md` 体例）。

---

## 八、分阶段交付（v2 全部出口机检化）

### Phase 0 止血+基线（先行小批，随时可动工）
- 修 `plane.js:78` atmo 残读
- 建 `scripts/test-plane-baseline.mjs`（照 test-day-boundary BASELINE 模式：mock localStorage/DOM/Date + `__dev.getNow` 注入），seeded state 驱动五幕走通，输出提交为基线；建 `run-all-tests.mjs` 聚合器（任一失败即非零退出）
- **出口**：基线脚本存在且可跑；聚合器列出 12+1 个脚本

### Phase A 引擎+模板
- schema v2.1、flags 三态、幕 gate 判据、八键模块接口、引擎重构（清 `'pastoral'` 字面量）
- 迁移 v14 + **M1-M6 矩阵**（fresh / mid-act 飞行中 / 已完成 / 损坏容错 / 幂等 / 旧字段只读深比较）；飞行中旧任务 ID 按「幕3+ → 新幕3 断点续玩、幕1-2 信物按 unlockStage 补发」映射
- 事件契约 stub（D11）+ `emit('plane_unlock')` 测试
- `data/planes/_fixtures/hypothetical_plane2.js` + `scripts/validate-plane-schema.mjs`（字段必填/引用完整性/分支点≤3/结局表 totality+唯一 default）挂进 check 链；引擎冒烟测试跑 fixture
- **出口**：fixture 零新代码机检过（含引擎路径零 plane-id 字面量 lint）；M1-M6 全过；全量测试零失败

### Phase B 守馆线
- 幕1-2 新文案 + 分支点① + 即时回信闭环 + 寄信簿 + 火漆印/确认步 + 基调宪章执行
- pacing 仿真脚本跑 gate 数字定版；内容预算幕1-2 完成率 100%
- **出口**（断言化）：headless 驱动 unlock→幕1 信经现有 trigger 到达→点①渲染 ≥2 选项→选 A 后 `state.quests.pastoral.flags` 含 `herbal_trusted` 且 saveState/loadState 往返保持；24-48h 后差异化回信到达；en locale 360px 视口信件可完整滚动；本幕预算完成；全量测试零失败；**`getTotalChaptersCopied` 单一真源存在且 gate 判定走它（D-追2）；gate.required 触达断言：到幕1 gate 章数时 required 信全部已触发，分支载体信「到达」与「已选」分两条断言（D-追1）**

### Phase C 开谷
- 谷视图全规格（§5.2）+ 村庄/草药园/教堂三分区 + 幕3 + 分支点③ + gather 专注绑定 + tend 挂 onNewDay
- **出口**：幕2 完成 → 谷 tab 出现；恰好 3 热点 + 塔楼 visible-not-enterable；gather 专注中禁入、会后结算入账（台账数字）；**focus 完成事件 → gather 入账且 ≤3/日断言（追评 D8，订阅模式同 visitor 生成挂 focus 完成流）**；locked zone 点击返回原因字符串非静默；360px 热区 ≥44px 实测；全量测试零失败

### Phase D 收束
- 塔楼/城堡 + 幕4-5 + 结局机检表 + 信物联动 + 「另一条时间线可得」文案 + 离别映射执行
- **四象限路径测试**（替代 v1「三分支」）：(herbal,convinced)/(herbal,shamed)/(faith,convinced)/(faith,shamed) 逐路径断言 flags/病倒顺序/结局/信物集/熟客注册集 + totality 27 组合测试
- **出口**：四路径断言全过；27 组合每行恰一结局；离别者有 flag→离别映射且最后一封信触达；全量测试零失败

### Phase E 素材与验收
- S1-S5 穿插生产；手动走查表存 `production/qa/evidence/`（state seed/点击/预期截图）
- **出口**：素材全接入；五幕×三结局走查证据齐；全量测试零失败 + check:imports + validate-plane-schema

---

## 九、经济联动（v3 修订——建设代价 + 持续好处 + 完成奖励）

### 9.0 设计模型
复用已落地的**设施模型**（咖啡角/展览厅：建造代价 + 每日维护 + 持续产出），主题从「馆内房间」换为「馆外世界重建」。位面发展 = 玩家往垂死山谷灌注资源（sink）→ 山谷康复后回流图书馆（上游好处）→ 叙事里程碑给一次性奖励（completion reward）。

### 9.1 货币分工（避免两币职责重叠）
- **灵感 = 资本性投入（建）**：建草药园/信息站/议会厅花灵感——「创造的灵光注入世界」主题成立。
- **智慧之光 = 经营性成本（养）**：维持山谷运转的日常开销，走 `onNewDay` 每日扣，与咖啡角/展览厅维护费同构。

### 9.2 建设代价（sink 表）
| 幕 | 建设内容 | 一次性（灵感） | 持续（智慧之光/日，onNewDay） |
|---|---|---|---|
| 1 | 信使站（图书馆"出现"在山谷） | 小 [PLACEHOLDER] | — |
| 2 | 草药园 / 祈祷所（分支点①落点） | 中 [PLACEHOLDER] | 低 [PLACEHOLDER] |
| 3 | 信息站（小图书馆，艾德里安解方） | 中 [PLACEHOLDER] | 低 [PLACEHOLDER] |
| 4 | 公民议会厅（杜兰推动制度化） | 大 [PLACEHOLDER] | 中 [PLACEHOLDER] |
| 5 | 出版《山谷纪事》 | 大（一次性，收束）[PLACEHOLDER] | — |

> 灵感 sink 必须为**持续型**（分幕升级 + 持续维护），禁止学 DLC 一次性买穿。

### 9.3 持续好处（上游资源，非直发币——2026-09-18 拍板"上游资源"路线）
| 建设内容 | 持续产出（喂回核心循环，不直发币） |
|---|---|
| 草药园 | `onNewDay` 概率掉**种子** → 植物系统 → 氛围/智慧之光 |
| 信息站 | **专注 EXP +X%**（山谷识字率回流图书馆）[PLACEHOLDER] |
| 公民议会 | 解锁**新访客类型** / 好感上限 + [PLACEHOLDER] |
| 出版纪事 | 馆藏**永久 +1 本**（驱动借阅/exp，计入 ch7"完成20本"） |
| 分支点① herb | 玛格丽特线 → 草药学院（种子产出↑）；faith → 卡特琳线 → 怀疑之烛（专注 inspiration 微量+）[PLACEHOLDER] |

> **纪律**：好处是"源"不是"印钞机"。若偷懒做成「每日 +X 氛围」直灌，等于新增 faucet 抵消 sink，且与 v4 EXP 曲线打架——禁止。

### 9.4 完成奖励（刺激推进）
- **每幕完成**：智慧之光 + 灵感 + 一枚**信物**（叙事纪念：配方注记/怀疑之烛/议会印章），信物纯收藏、零数值膨胀。绝对值 [PLACEHOLDER]，档差 ≤100💰 仅约束金币项。
- **三结局差异**（接主线 D7）：余烬 / 曙光给不同持续注记（草药学院 vs 怀疑之烛 vs 公民议会），收束后仍可读。

### 9.5 既有事实保留（v2 核对）
- **gather**：≤3 次/日 × ≤10💰，绑定专注会话（不可能超专注速率）；**tend**：每登录日 1 次 ≤5💰，挂 `onNewDay`，离线不补发。两口为带 cap 的重复 faucet，靠速率上限节流（coins 线已 1.85× 过剩，量级可接受）。
- **faucet 移除（真数）**：拆除 `pastoral_tasks.js` 实测移除 **62 点氛围 EXP**（57 条任务；原估 ~150 系 2.4× 高估）。
- **熟客解耦**：结局不影响熟客注册，无双轨复利损失。

### 9.6 系统纪律（落地前必守）
1. 维护费挂既有 `onNewDay` 总线（core/day-boundary.js，cafe/offsite/exhibition 已订阅），不自建时钟。
2. 门槛复用 `getStageThreshold` 单源，禁止硬编码 900/5600。
3. **已真写进 sink-ledger §一（灵感 sink）/§三（金币 sink + gather/tend faucet）**——本 v3 撤销原"pending"状态（2026-09-18 登记补实）。
4. 数值占位全进 Phase B 数值评审；所有 [PLACEHOLDER] 须跑 v4 仿真 + 扩抄书轴后定值。

---

## 十、风险表

| # | 风险 | v2 处置 | 级 |
|---|---|---|---|
| R1 | 迁移毁档 | M1-M6 矩阵 + 旧字段只读（现行 delete 先例为反例） | 🔴 |
| R2 | zones vs venue rooms 边界 | 视觉统一、状态层分库（`planes.zones` vs `state.library.venue`） | 🟡 |
| R3 | quests 重构 vs god-module-split 次序 | 位面先行（当前玩家可触功能），拆分让路 | 🟡 |
| R4 | 27 组合复杂度 | 有序规则表 + 唯一 default + totality 测试 + 全展开附表 | 🟡 |
| R5 | 素材 29+ 张带宽 | S1-S5 分批，开谷前只卡 S1/S2 | 🟡 |
| R6 | 核心循环被边缘化 | 幕3-5 trigger 仍以誊抄/读书为主；gather 反向绑定专注 | 🔴 |
| R7 | 主线 ch6 撞车 | D11 stub 契约 + 主线计划挂注记，主线落地时修订 | 🔴 |
| R8 | 基调合规（CN 渠道） | §4.5 宪章 + Phase B 文案评审对照执行 | 🟡 |
| R9 | 内容空壳（技术过、故事空） | §六预算表 + 每幕内容完成率进出口标准 | 🟡 |

---

## 十一、相关文件

- 本方案：`docs/plans/pastoral-plane-rebuild-plan.md`
- 待办锚点：`docs/plans/_todo-index.md` §plane1-overhaul
- 重写底稿（Phase A 移档）：`data/quests/pastoral_tasks.js` → `docs/archive/data/`
- 关联：`main-quest-chapter-system-plan.md`（ch4/ch6 + D11 注记落点）、`exhibition-hall-plan.md`（揭面节奏参照）、`atmosphere-venue-map-design.md`（rooms/zones 边界）、`sink-ledger.md`（§九登记）

---

## 评审对账注记（2026-09-18）

v1 经六专科对抗评审（game-designer / narrative-director / systems-designer / economy-designer / ux-designer / qa-lead）+ creative-director 终审，verdict **MAJOR REVISION NEEDED**。v2 对账：

| v1 问题（评审级） | v2 落点 |
|---|---|
| P0 迁移路径毁档（`state.planes` 不存在；飞行中存档软锁） | §二核实 + §8.2 M1-M6 + 存档键不改决策 |
| P0 幕完成判据缺席（分支信不回=软锁） | §3.2 acts.gate + §4.1 + 未答第四态（§3.3） |
| P0 结局支配性策略（信仰线封顶）+ 表内空洞 + 8≠27 | D7 + §4.4 机检规则表 + 27 展开 + totality |
| P0 D5 三≠二 + ch6 撞车 | D5（补幕3点③）+ D11 |
| P0 草药悬空 faucet + 无限刷金 | D9（砍）+ D10（专注绑定）+ §九数字 |
| P0 永久错过收集 + 复利熟客损失 | D8（解耦）+ §4.4 图鉴不缺格 + backlog 锚点 |
| 测试基线不存在 / 三分支统计不成立 / 零新代码不可机检 | D13 + Phase 0/A/D 出口重写 |
| 痕两幕真空 / 分支信 UX 无规格 / i18n 无规范 | §4.2 即时闭环 + §4.3 规格 + §5.2 |
| 内容量零预算 | §六预算表 + 出口完成率 |
| 基调合规裸奔 | §4.5 宪章 |
| 谷视图竖屏冲突 / 无 IA 归宿 / 并发无守卫 | §5.2 全规格 |
| 墨墨引用分歧（叙事vs玩法） | D12 终审裁决（含蓄+扩量走回信渠道） |
| 余烬离别分歧（叙事vs玩法） | D8 终审裁决（缺席式损失+预告+映射表） |
| **同日追评（game-designer 复审 v2）**：gate.required 触达无保证（软锁搬家）、誊抄无单一计数器+仿真无抄书轴（gate 数字无法校准）、faucet 未真入账本、病倒日语义未定、~150 氛围系高估 | D1-D8 全折入 §4.1（D-追1/D-追2）/§4.0/§九/§八 Phase B/C 出口；氛围真数修正 **62（57 任务）≠150**；sink-ledger §三 已挂 pending 行 |

**终审一句话**（creative-director）：七/八期失败在契约层不亚于内容层；v2 两层都重建——骨架方向全部保留，契约层补齐。
