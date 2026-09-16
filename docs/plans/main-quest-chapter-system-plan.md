---
status: review
importance: 4
anchors:
  - { type: file, path: "docs/plans/main-quest-chapter-system-plan.md", weight: 0.1 }
  - { type: file, path: "data/questline.js", weight: 0.1 }
  - { type: file, path: "js/core/quest-progress.js", weight: 0.1 }
---

# 复兴之路重做 · 详细实施计划（主线章节系统）

> 2026-09-16 立项。设计决策见 `curator-goals-renewal-plan.md`（grill-me 九问锁定，本文不再 reopen）。
> 现行实现（将被替换）：`data/tiergoals.js` TIER_GOALS + `js/render/library.js:renderTierGoals` + `app.js:celebrateStageCross` 里的 tier 弹窗段。
> 本计划过架构评审后动工；预估 6 个里程碑、23 个行为小节、约 120 条 i18n 新键。

## 0. 名词与总架构

- **章（Chapter）**：主线的一个章节 = 1 复合门槛（gate）+ 3~4 行为小节（section）
- **门槛**：计数/状态条件（含氛围/仪式成分），决定章是否可完成
- **小节**：行为型任务，玩家「做动作」推进，`{event, count}` 契约
- **三章职责**（决策 2）：主线章节=导向（接下来做什么）｜成就=记录｜升阶仪式=蜕变

数据流：

```
玩家动作 → incrementQuestEvent(event, ctx) → state.questProgress 计数
  → 小节达成（发小奖+toast）→ 全节亮+门槛过 → 章成（发铭牌+回忆页+庆祝弹窗）
```

## 1. 数据层：`data/questline.js`（新）

```js
export const QUEST_CHAPTERS = [
  {
    id: 'ch1', emoji: '🚪', tier: 1,           // tier 保留：与氛围阶段的大致对应（展示用，不卡节奏）
    nameKey: 'questCh1Name', subtitleKey: 'questCh1Subtitle', flavorKey: 'questCh1Flavor',
    gate: { labelKey: 'questCh1Gate', check: (s) => s.guideQuests?.allCompleted === true },
    plaque: { icon: '🚪', nameKey: 'questCh1Plaque' },   // 章铭牌（挂铭牌墙）
    memoryPage: { image: 'visual/quests/ch1_memory.jpg' }, // 回忆页（成就柜陈列，图可后补，缺图 CSS 兜底）
    sections: [
      { id: 'ch1s1', icon: '🕯️', labelKey: 'questCh1S1', event: 'focus_start',   count: 1 },
      { id: 'ch1s2', icon: '✍️', labelKey: 'questCh1S2', event: 'focus_complete', count: 1 },
      { id: 'ch1s3', icon: '📚', labelKey: 'questCh1S3', event: 'manuscript_open', count: 1 },
    ]
  },
  // …ch2-ch7 见 §6 内容草案
];
export const getQuestTerm = (ch, suffix) => t('quest' + ch.id.slice(2) + suffix); // 仿 getTierTerm
```

- i18n 键模式：`questCh{N}Name/Subtitle/Flavor/Gate/Plaque`、`questCh{N}S{M}`（小节标签）、`questCh{N}S{M}Done`（完成文案）。zh/en 双语，墨墨/馆长口吻。
- 章铭牌**不进** SIGNBOARDS（那是 buff 标志牌系统）：独立 `state.questPlaques: [{chapterId, icon, nameKey, earnedAt}]`。

## 2. 进度层：`js/core/quest-progress.js`（新）

```js
// state.questProgress 形状
{
  events: { focus_complete: 7, visitor_return: 3, ... },   // 原始事件计数（跨章节的同 event 可复用）
  sectionsDone: ['ch1s1', 'ch1s2'],                        // 小节完成即写入（奖励只发一次的关键）
  chaptersDone: [],                                        // 章完成
  streaks: { lastReturnChar: 'xiachan', returnStreak: 2 }, // 「连续/同一对象」类语义
  activated: false,                                        // guideQuests.allCompleted 后激活
  migratedFromTiers: false
}

export function incrementQuestEvent(event, ctx = {})      // 唯一埋点入口
export function getChapterView(chapter, state)            // 纯函数：gate 过否/节进度/章状态
export function getActiveChapter(state)                   // 第一个未完成章
export function activateQuestline()                       // 引导完成接缝（决策 9）
```

`incrementQuestEvent` 内部：未激活直接 return → 计数（含 streak 维护）→ 对每个含该 event 的未完成小节判达成 → 达成则 `sectionsDone.push` + 发节奖励（金币/灵感，数值见 §6）+ `window.showToast` → 检查当前章全节亮且 gate 过 → 章成：`chaptersDone.push` + 铭牌入 `questPlaques` + 发章奖励 + `showChapterCompletePopup` + `addDiaryEntry('special_event')` + `saveState()`。

**纪律**：所有判定必须走 `sectionsDone`/`chaptersDone` 持久数组，禁止从 events 计数反推「是否已领奖」。

## 3. 埋点清单（函数级，23 节全覆盖）

| event | 埋点位置 | 语义 |
|---|---|---|
| `focus_start` | `js/core/focus-actions.js:handleStartFocus`（startFocus 成功后） | 开始一次专注 |
| `focus_complete` | `js/core/focus-orchestrator.js`（completeFocus 结算后） | 完成一次专注 |
| `manuscript_open` | 大书库手稿箱首次打开（bookshelf 渲染处补一次性钩子） | 初识大书库 |
| `shop_buy_book` | 商店购书成交处 | 购入新书 |
| `visitor_arrive` | `visitors.js` 访客进馆生成处 | 迎来访客 |
| `visitor_return` | `visitors.js` 还书处理（932 还书到期检查段，带 `ctx.charId`） | 完成一次借还；streak 维护 |
| `borrow_level_up` | `js/core/shop/library-upgrades.js` 升级成交处 | 设施升级 |
| `plant_care` | `js/plants.js` 浇水/收获动作处 | 照料植物 |
| `signboard_buy` | 标志牌购买成交处 | 购买标志牌 |
| `plane_unlock` | 位面传送门解锁处 | 解锁位面 |
| `repair_complete` | 修复完成回调（copy-preview/repair 流程收尾） | 修一本破损书 |
| `visitor_favor` | 还书好感结算处（ctx 带好感等级） | 访客关系深化 |
| `exh_room_open` | `js/core/exhibition.js` 房间修复开放处 | 开放展厅 |
| `record_buy` | 留声阁唱片购买成交处 | 购入唱片 |
| `achievement` | `js/achievements.js` 解锁回调 | 成就+1 |
| `disaster_resolve` | `js/core/disasters.js` 灾难解除处 | 化解灾难 |
| `souvenir` | 访客纪念品入 `visitorMemory.items` 处 | 获得纪念品 |
| `ceremony` | `js/storage.js:holdStageCeremony`（ctx.stage） | 举行升阶仪式 |

埋点一律一行调用 `incrementQuestEvent('xxx', {...ctx})`；**纯增量**，失败不影响主流程（包 try/catch）。

## 4. 迁移 v13（幂等全量映射，决策 10）

`js/state/migrations.js` 新增 `migrateV13`：

1. `state.questProgress` 已存在 → return（幂等）
2. 初始化空 progress，`migratedFromTiers: true`
3. **章成映射**：`state.tierPopupsShown` 含 `tierN` → 第 N 章 `chaptersDone` + 该章全部 sections 写入 `sectionsDone` + 铭牌补发（不发奖励——老玩家已领过 tier 奖励）
4. **当前章节进度重放**：对未完成章，按现有痕迹对可推导的 event 一次性补数（focus_complete←focus 统计、visitor_return←borrowRecords 计数、achievement←achievements.length 等），**只补 events 计数不触发庆祝**；`sectionsDone` 只收「count 已达标」的节
5. `activated` = `guideQuests.allCompleted`（老玩家必为 true）
6. 不写 `tierPopupsShown`（保留字段防回滚，渲染已不读）

**退役清单**（迁移上线后第二个 commit 再删，回滚保险）：
- `app.js:celebrateStageCross` 内 tier 弹窗段（247-259 行，奖励/history/tierPopupsShown）
- `js/render/library.js:renderTierGoals` → 换 `renderQuestChapters`
- `data/tiergoals.js` 标记 deprecated（先留 terms 键防遗留引用崩溃，下版本清理）

## 5. 渲染与庆祝

| 位置 | 改动 |
|---|---|
| `js/render/library.js` | `renderQuestChapters(stage)` 替换 `renderTierGoals`：当前章整卡（gate 行 + 节列表各带 `n/m` 进度 + ✅/○）、已完成章摘要行（emoji→名称链）、下章一行预告；章卡数据来自 `getChapterView` |
| `js/render/animations.js` | `showChapterCompletePopup(chapter)`：仿 showTierCompletePopup 规格（大图 flavor+节清单回顾+奖励展示），比 tier 旧弹窗多「回忆页已收入成就柜」一行 |
| 庆祝时机 | **解耦**（决策 8）：章成即在 `incrementQuestEvent` 末尾触发，不等升阶仪式；仪式庆典维持现状 |
| 铭牌墙 | 馆长办公室铭牌墙区追加「章节铭牌」分组（读 `state.questPlaques`，纯展示无 buff） |
| 展览厅成就柜 | `roomAchievements` 陈列页追加「复兴之路回忆页」区：每完成章一张图文卡（image 缺档时 parchment 卡兜底，同 hall 缺图回退惯例） |
| 专注结算 | `runFocusOrchestration` 里若本局推进了节进度，toast 一句墨墨点评（如「📜 复兴之路：为 3 位访客服务（2/3）」） |
| 激活接缝 | `guidequests.js` 标记 `allCompleted = true` 处调 `activateQuestline()`；馆长办公室在激活前不渲染章节卡（避免新手期双任务板） |

## 6. 七章节内容草案（23 节；数值待架构评审把关）

| 章 | 门槛 gate | 小节（event × count） | 节奖/章奖 |
|---|---|---|---|
| **ch1 推开馆门** 🚪 | 完成新手引导 | focus_start×1 ／ focus_complete×1 ／ manuscript_open×1 | 20💰 / 铭牌+回忆页+50💰5✨ |
| **ch2 烛火初明** 🕯️ | 誊抄完成 2 本书 | visitor_arrive×1 ／ shop_buy_book×1 ／ borrow_level_up×1 | 30💰 / 章奖 80💰10✨ |
| **ch3 典籍渐满** 📚 | 累计专注 120 分钟 | plant_care×3 ／ visitor_return（不同访客）×3 ／ signboard_buy×1 | 30💰 / 章奖 80💰15✨ |
| **ch4 登堂入室** 🏛️ | 完成 6 本书 + 氛围≥900 | plane_unlock×1 ／ repair_complete×1 ／ visitor_favor（熟识）×1 | 40💰 / 章奖 120💰20✨ |
| **ch5 星辰之境** ✨ | 完成 10 本书 + 举行过 4 阶仪式 | focus_in_stage4×1 ／ visitor_arrive（不同访客累计）×8 ／ achievement×10 | 50💰 / 章奖 150💰25✨ |
| **ch6 位面行者** 🌌 | 建成展览厅 + 解锁 2 位面 | exh_room_open×1 ／ record_buy×1 ／ souvenir×5 ／ disaster_resolve×1 | 50💰 / 章奖 150💰30✨ |
| **ch7 星辰守护者** 👑 | 完成 20 本书 + 氛围≥5600 | visitor_arrive（全 10 访客）×10 ／ souvenir×15 ／ ceremony(stage5)×1 | 80💰 / 章奖 300💰50✨+终章证书 |

注：ch5 的 `focus_in_stage4` 需 ctx.stage 判定（increment 时过滤）；「不同访客累计」类用 `visitor_arrive`/`visitor_return` 原始计数 + 完成判定处查 `countUniqueVisitors` 式辅助——**判定逻辑放数据层 check，计数只做触发器**，实现时以纯函数测试锁死口径。

## 7. 里程碑与验收

| M | 内容 | 验收 |
|---|---|---|
| M1 | questline.js 数据层 + quest-progress.js 进度层 + terms 键骨架 | `scripts/test-questline.mjs`：每节/门槛/章纯函数、奖励只发一次、未激活不计数 |
| M2 | 迁移 v13 + 退役清单 | 老档模拟：tier 全弹/半弹/新档三形态映射正确、幂等重跑零变化 |
| M3 | 18 处埋点接入 | 每 event 至少一个触发路径测试；埋点失败不崩主流程（异常注入测） |
| M4 | 七章节文案 zh/en 全量 | 墨墨口吻 review；i18n 缺键扫描零遗漏 |
| M5 | 渲染/庆祝/铭牌/成就柜陈列 | 新档七章走通（debug 加速门）；章成不等仪式、与仪式同日叠加正常 |
| M6 | 全量回归 + drift 锚定 | 现有 11 测试脚本全绿 + check:imports；本计划 anchors 收编全部改动 commits |

**不做**（边界守护）：不给章节加功能 buff（防数值通胀，决策 5）；不动 guideQuests 任务内容（决策 9）；不做缮写室真文 typewriter（属全文批次 D4，不混入）。

## 8. 风险

1. **埋点遗漏** → M3 的 event 覆盖测试强制每 event 有测试路径
2. **文案量 23 节×中英** → M4 独立里程碑，可先上骨架后补文案（节 labelKey 缺词时 t() 回退键名，不崩）
3. **老档痕迹推导误差** → 迁移只补「确定性可推导」的 event（计数类），行为 streak 类不追补（从迁移后重新积累），口径写进迁移注释
4. **terms 键大爆炸** → 键命名收敛 `questCh{N}{Suffix}` 单一模式，脚本可扫描校验完整性
