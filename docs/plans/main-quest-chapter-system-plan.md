---
status: backlog
importance: 4
anchors:
  - { type: file, path: "docs/plans/main-quest-chapter-system-plan.md", weight: 0.1 }
  - { type: file, path: "data/questline.js", weight: 0.1 }
  - { type: file, path: "js/core/quest-progress.js", weight: 0.1 }
---

# 复兴之路重做 · 详细实施计划（主线章节系统）v3

> 2026-09-16 立项。设计决策见 `curator-goals-renewal-plan.md`（grill-me 九问锁定，不再 reopen）。
> **v2 = 架构评审修订版**（D1-D10，见 §9）；**v3 = 机制数值复审修订版**（`reviews/main-quest-chapter-system-plan-review-v2.md`，D11-D17，见 §10）。
> 现行实现（将被替换）：`data/tiergoals.js` TIER_GOALS + `js/render/library.js:renderTierGoals` + `app.js:celebrateStageCross` tier 弹窗段。
> 预估 6 个里程碑、**24 个行为小节**、约 120 条 i18n 新键。

## 0. 名词、契约与总架构

- **章（Chapter）**：主线章节 = 1 复合门槛（gate）+ 3~4 行为小节（section）
- **小节 schema（D1 修订，check 一等公民）**：

```js
{ id, icon, labelKey, event, count?, check?, rewardCoins?, rewardInspiration? }
// count 存在 → 默认判定 progress.events[event] >= count（计数型，event 为触发器）
// check 存在 → 显式谓词 (state, ctx) => bool（判定型，event 仅作触发时机）
// 两者不得同时缺
```

- **章完成判定（D2 修订）**：`incrementQuestEvent` 末尾**遍历所有未完成章**，逐章判 `gate.check(s) && 该章 sections 全在 sectionsDone`——各章门槛相互独立，只查「当前章」会让满足后章条件的玩家死锁在前章。`getActiveChapter` 仅用于 UI 导向高亮，不参与完成判定。
- **三章职责**（决策 2）：主线章节=导向｜成就=记录｜升阶仪式=蜕变

数据流：

```
玩家动作 → incrementQuestEvent(event, ctx) → effects: [{type:'section_done'...},{type:'chapter_done'...}]
  → 薄协调层派发（toast/弹窗/日记/标脏存盘）
```

## 1. 数据层：`data/questline.js`（新）

```js
export const QUEST_CHAPTERS = [
  {
    id: 'ch1', emoji: '🚪', tier: 1,           // tier 仅作氛围阶段的大致对应展示，不卡节奏
    nameKey: 'questCh1Name', subtitleKey: 'questCh1Subtitle', flavorKey: 'questCh1Flavor',
    gate: { labelKey: 'questCh1Gate', check: (s) => s.guideQuests?.allCompleted === true },
    plaque: { icon: '🚪', nameKey: 'questCh1Plaque' },    // 章铭牌（挂铭牌墙）
    memoryPage: { image: 'visual/quests/ch1_memory.jpg' }, // 回忆页（成就柜陈列，图后补、缺图 CSS 兜底）
    sections: [
      { id: 'ch1s1', icon: '🕯️', labelKey: 'questCh1S1', event: 'focus_start',    count: 1 },
      { id: 'ch1s2', icon: '✍️', labelKey: 'questCh1S2', event: 'focus_complete', count: 1 },
      { id: 'ch1s3', icon: '📚', labelKey: 'questCh1S3', event: 'manuscript_open', count: 1 },
    ]
  },
  // …ch2-ch7 见 §6
];
// D3 修订：i18n 键生成统一 questCh{N} 前缀（评审抓出 quest1Name 裸键名 bug）
export const getQuestTerm = (ch, suffix) => t('questCh' + ch.id.slice(2) + suffix);
```

判定型小节复用/新建纯函数（与 questline.js 同批迁入或新建，M1 单测锁定）：
- `countUniqueVisitors(state)` —— 自 tiergoals.js 迁入（Set 去重，数种类）
- `getMaxVisitorReturnCount(state)` —— **新建**（D16）：按 charId 聚合 `borrowRecords` 的归还频次取最大值——ch3s3「同一位访客累计归还≥3」用，**不能**复用 countUniqueVisitors（它只数种类不数次数）
- `getCompletedBookCount(state)` —— **新建**（D15）：`copyCount > 0` 的书数单一真源，ch2/4/5/7 四章「完成 N 本书」门槛统一引用（口径对齐 guidequests.js:140）
- `getStageLevel/getStageThreshold`（data/atmosphere.js，**D5：禁硬编码 900/5600**）
- 访客好感等级阈值引用 `FAVOR_THRESHOLDS` 单一真源（visitors.js，**D13：勿硬编码「熟识」数字**）

## 2. 进度层：`js/core/quest-progress.js`（新，D7 修订：effects 返回 + 不内联副作用）

```js
// state.questProgress 形状（D10 修订：删 streaks 死字段；ch1 小节激活前也计数）
{
  events: { focus_complete: 7, visitor_return: 3, ... },
  sectionsDone: ['ch1s1'],
  chaptersDone: [],
  activated: false,          // guideQuests.allCompleted 后章成判定才生效；
                             // 但 ch1 小节计数不卡 activated（免玩家重复动作，仅章成卡）
  dirty: false               // 标脏代替每次 saveState（D7）
}

export function incrementQuestEvent(event, ctx = {}) {
  // 1. 计数（ch1 节不卡 activated；其余章未解锁章的节也照常计数，判定在章成遍历）
  // 2. 遍历所有未完成章 × 未完成节，跑 section.check ? check(state, ctx) : events[event] >= count
  //    命中 → sectionsDone.push + effects.push({type:'section_done', section, reward})
  // 3. 遍历所有未完成章判 gate + 全节 → chaptersDone.push + effects.push({type:'chapter_done', chapter, rewards})
  // 4. dirty = true；章成时 saveState()
  // 返回 effects；不碰 showToast/弹窗/日记（薄协调层派发，保证 M1 可单测）
}
export function getChapterView(chapter, state)   // 纯函数：gate/节进度/章状态
export function getActiveChapter(state)          // 仅 UI 导向（D2）
export function activateQuestline()              // guidequests.js allCompleted 接缝
```

**纪律**：领奖状态只看持久数组 `sectionsDone`/`chaptersDone`，禁止从 events 计数反推。

## 3. 埋点清单（函数级，24 节全覆盖；D4 修订 ceremony 内联）

| event | 埋点位置 | 语义 |
|---|---|---|
| `focus_start` | `js/core/focus-actions.js:handleStartFocus`（startFocus 成功后） | 开始一次专注 |
| `focus_complete` | `js/core/focus-orchestrator.js`（completeFocus 结算后） | 完成一次专注 |
| `manuscript_open` | 大书库手稿箱首次打开 | 初识大书库 |
| `shop_buy_book` | 商店购书成交处 | 购入新书 |
| `visitor_arrive` | `visitors.js` 访客进馆生成处 | 迎来访客 |
| `visitor_return` | `visitors.js` 还书处理（932 段，带 `ctx.charId`） | 完成一次借还 |
| `borrow_level_up` | `js/core/shop/library-upgrades.js` 升级成交处 | 设施升级 |
| `plant_care` | `js/plants.js` 浇水/收获动作处 | 照料植物 |
| `signboard_buy` | 标志牌购买成交处 | 购买标志牌 |
| `plane_unlock` | 位面传送门解锁处 | 解锁位面 |
| `repair_complete` | 修复流程收尾 | 修一本破损书 |
| `visitor_favor` | 还书好感结算处（ctx 带好感等级） | 访客关系深化 |
| `exh_room_open` | `js/core/exhibition.js` 房间修复开放处 | 开放展厅 |
| `record_buy` | 留声阁唱片购买成交处 | 购入唱片 |
| `achievement` | `js/achievements.js` 解锁回调 | 成就+1 |
| `disaster_resolve` | `js/core/disasters.js` 灾难解除处 | 化解灾难 |
| `souvenir` | 访客纪念品入 `visitorMemory.items` 处 | 获得纪念品 |
| `ceremony` | `js/storage.js:holdStageCeremony` **内部**（stage 赋值后）`incrementQuestEvent('ceremony', { stage: state.library.stage })`（D4：内联不改签名，`_onStageCross` 调用链不动） | 举行升阶仪式 |

埋点一律一行调用、try/catch 包尾不崩主流程。

## 4. 迁移（D8/D9 修订）

**版本号落地时取 `MIGRATIONS` 末版 +1，不写死**（评审时末版 12，已被秘密花园 v13 占用——本计划预计为 v14，动工时以代码实际末版为准）。

1. `state.questProgress` 已存在 → return（幂等）
2. 初始化空 progress，`activated = guideQuests.allCompleted`
3. **章成映射**：`state.tierPopupsShown` 含 `tierN` → 第 N 章 `chaptersDone` + 该章全部 sections 写入 `sectionsDone` + 铭牌补发（**不发奖励**，老玩家已领过 tier 奖励）
4. **当前章进度重放（D8 修订）**：对未完成章逐节跑 `section.check ? section.check(state) : events[event] >= count`——**判定型小节一并补判**（老玩家早达成 8 位访客不该卡节）；满足即入 `sectionsDone` 不发奖。events 计数只补确定性可推导项（focus/return/achievement 类），行为 streak 类不追补
5. 不写 `tierPopupsShown`（保留字段防回滚，渲染已不读）

**退役清单**（迁移上线后第二个 commit 再删）：`app.js:celebrateStageCross` tier 弹窗段（247-259）、`renderTierGoals` → `renderQuestChapters`、`data/tiergoals.js` 标 deprecated。

## 5. 渲染与庆祝

| 位置 | 改动 |
|---|---|
| `js/render/library.js` | `renderQuestChapters(stage)` 换 `renderTierGoals`：当前章整卡（gate 行+节列表各带 n/m+✅/○）、已完成章摘要行、下章预告 |
| `js/render/animations.js` | `showChapterCompletePopup(chapter)`；比 tier 旧弹窗多「回忆页已收入成就柜」一行 |
| 庆祝时机 | 解耦（决策 8）：薄协调层监听 effects 派发，章成即庆祝不等仪式；与仪式同日可叠加 |
| 铭牌墙 | `state.questPlaques` 独立数组（不进 SIGNBOARDS buff 系统），馆长办公室铭牌墙分组陈列 |
| 展览厅成就柜 | 陈列「复兴之路回忆页」区（缺图 parchment 卡兜底，同 hall 惯例） |
| 专注结算 | 协调层把本局节进度 toast 成墨墨点评 |
| 激活接缝 | `guidequests.js` 置 `allCompleted = true` 处调 `activateQuestline()`；激活前馆长办公室不渲染章节卡 |

协调层参考实现：`js/core/quest-progress.js` 导出 `drainQuestEffects(effects)` 由 `focus-orchestrator`/埋点调用方执行派发（toast/popup/diary/save），保持 core 纯逻辑可单测。

## 6. 七章节内容草案（24 节；落地日区间 D12；数值待评审把关）

**节奏定位（D12 明文承认）**：章节系统是**叙事骨架**不是节奏填充——ch4→ch5（~30d→~75d）的空窗由 ch6（设施/币驱动，预计 ~40-90d 落地，前置核对：展览厅 stage2+800💰、田园位面 stage3+12本+传送门升级，均 stage4 前可达）填补；ch5→ch7（~90d→~166d）的 76 天窗由玩法系统（咖啡角/借阅深化/展览厅收集/温室）承载。若实测该窗成为留存杀手，启动预案 D12(b)：新增中段章（门槛 `souvenir>=15 + disaster_resolve>=3` 类自然落段信号）。

| 章 | 门槛 gate | 小节 | 节奖/章奖 | 目标落地日 |
|---|---|---|---|---|
| **ch1 推开馆门** 🚪 | 完成新手引导 | ① focus_start×1 ② focus_complete×1 ③ manuscript_open×1 | 20💰 / 铭牌+回忆页+50💰5✨ | 0-2d |
| **ch2 烛火初明** 🕯️ | `getCompletedBookCount >= 2`（D15） | ① visitor_arrive×1 ② shop_buy_book×1 ③ borrow_level_up×1 | 30💰 / 章奖 80💰10✨ | 3-5d |
| **ch3 典籍渐满** 📚 | 累计专注 120 分钟 | ① plant_care×3 ② `check: countUniqueVisitors>=5`（D14 去重，event visitor_return）③ `check: getMaxVisitorReturnCount>=3`（D16 按角色频次，event visitor_return）④ signboard_buy×1 | 30💰 / 章奖 80💰15✨ | 5-10d |
| **ch4 登堂入室** 🏛️ | `getCompletedBookCount>=6` + `atmosphere >= getStageThreshold(3)`（D5/D15） | ① plane_unlock×1 ② repair_complete×1 ③ `check: 任一访客好感达「熟识」`（event visitor_favor，**D13 引用 FAVOR_THRESHOLDS**；可能是本章最慢小节，预估 30-60d） | 40💰 / 章奖 120💰20✨ | ~22-30d |
| **ch5 星辰之境** ✨ | `getCompletedBookCount>=10` + `getStageLevel(atmosphere) >= 4`（**D11：自动推导，不挂手动仪式——防主线软锁**） | ① `check: focus.totalMinutes>=600`（D14 独立指标，event focus_complete）② ceremony×1（**D11：仪式降为叙事小节**，event ceremony）③ `check: countUniqueVisitors>=8`（event visitor_arrive）④ achievement×10 | 50💰 / 章奖 150💰25✨ | ~75-90d |
| **ch6 位面行者** 🌌 | 建成展览厅 + 解锁 2 位面（设施/币驱动，非时间绑定） | ① exh_room_open×1 ② record_buy×1 ③ souvenir×5 ④ disaster_resolve×1 | 50💰 / 章奖 150💰30✨ | ~40-90d（填 ch4→ch5 窗） |
| **ch7 星辰守护者** 👑 | `getCompletedBookCount>=20`（D17：全书 71 本占 28%，若 v4 仿真抄书速率轴实测偏慢降至 15）+ `atmosphere >= getStageThreshold(5)`（D5） | ① `check: countUniqueVisitors>=10`（event visitor_arrive）② souvenir×15 ③ `check: ctx.stage === 5`（event ceremony，D4 内联埋点） | 80💰 / 章奖 300💰50✨+终章证书 | ~166-200d |

**faucet 台账（D6）**：已在 `sink-ledger.md` 登记——金币线「章节系统 +930💰（章奖）+~1,030💰（节奖，24 节），全游一次性」；灵感线「+150✨（章奖），全游一次性」。量级小，不 overturn 基线但记账。

## 7. 里程碑与验收

| M | 内容 | 验收 |
|---|---|---|
| M1 | questline.js + quest-progress.js + terms 骨架 | test-questline.mjs：每节/门槛/章纯函数、**check 型与 count 型双轨**、**遍历所有未完成章**、奖励只发一次、未激活不计数（ch1 除外）、effects 返回无 UI 副作用 |
| M2 | 迁移（末版+1）+ 退役 | 老档三形态（tier 全弹/半弹/新档）映射正确、**check 型小节一并补判**、幂等重跑零变化 |
| M3 | 18 处埋点 | 每 event 至少一个触发路径测试；异常注入不崩主流程；ceremony 内联不断链 |
| M4 | 24 节文案 zh/en | 墨墨口吻 review；键名 lint（`questCh{N}` 模式扫描零缺漏） |
| M5 | 渲染/庆祝/铭牌/成就柜 | 新档七章走通（debug 加速）；章成不等仪式、同日叠加正常 |
| M6 | 全量回归 + drift 锚定 | 现有 12 测试脚本全绿 + check:imports；anchors 收编全部改动 commits |

**不做**（边界守护）：不加功能 buff（决策 5）；不动 guideQuests 内容（决策 9）；不做缮写室 typewriter（D4 属全文批次）；不写死迁移版本号（D9）。

## 8. 风险

1. **埋点遗漏** → M3 event 覆盖测试强制
2. **文案量 24 节×中英** → M4 独立里程碑，labelKey 缺词 t() 回退键名不崩
3. **老档痕迹推导误差** → 只补确定性计数类，判定型跑 check(s) 安全（纯函数）
4. **判定型小节口径漂移** → check 全部引用单一真源（countUniqueVisitors/getStageLevel/好感等级表），纯函数测试锁死

## 9. 修订记录（2026-09-16 架构评审 D1-D10 全落）

| 决策 | 落点 |
|---|---|
| D1 小节 schema 加 `check?` 一等公民 | §0/§1/§6，6+1 个判定型小节改写 |
| D2 章成遍历所有未完成章 | §0/§2，防独立门槛死锁 |
| D3 getQuestTerm 键生成对齐 `questCh{N}` | §1 |
| D4 ceremony 埋点内联 holdStageCeremony（不改签名） | §3/§6 |
| D5 氛围阈值走 getStageThreshold/getStageLevel | §1/§6 |
| D6 faucet 登记 sink-ledger | §6（已登记） |
| D7 incrementQuestEvent 返回 effects、不内联 UI/save | §2/§5 协调层 |
| D8 迁移对 check 型小节也判 check(s) | §4 |
| D9 迁移版本取末版+1（v13 已被秘密花园占用） | §4 |
| D10 删 streaks 死字段；ch1 激活前计数；ch3s3 启用「同一位访客累计归还」 | §2/§6 |

## 10. 修订记录 v3（2026-09-16 机制数值复审 D11-D17）

| 决策 | 级别 | 落点 |
|---|---|---|
| D11 ch5 门槛改 `getStageLevel>=4` 自动推导；仪式降为 ch5 小节 | 🔴 P0 | §6 ch5——原「举行过 4 阶仪式」是手动动作，挂章门槛会让没点按钮的玩家永久漏章（主线软锁） |
| D12 显式每章落地日；ch6 前置核对（展览厅 stage2+800/田园位面 stage3+12本，stage4 前可达 ~40-90d 填窗）；明文承认 ch5→ch7 窗由玩法系统承载；留存杀手预案 D12(b) | ⚠️ P1 | §6 节奏定位段+落地日列 |
| D13 ch4s3「熟识」引用 FAVOR_THRESHOLDS；标注可能最慢小节（30-60d） | ⚠️ P1 | §1/§6 |
| D14 去重无效小节：ch3s2 改 >=5；ch5s1 改 focus.totalMinutes>=600 独立指标 | ◽ P2 | §6 |
| D15 新建 `getCompletedBookCount` 单一真源，四章统一 | ◽ P2 | §1/§6 |
| D16 ch3s3 新建 `getMaxVisitorReturnCount`（按 charId 频次，非 Set 去重） | ◽ P2 | §1/§6 |
| D17 ch7 20 本（28%/71）保留，仿真偏慢降 15 | ◽ P2 | §6 |
