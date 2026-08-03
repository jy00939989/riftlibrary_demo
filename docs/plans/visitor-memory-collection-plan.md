# 访客纪念收集模块 · 策划文档

> 目标：把访客留下的**便签**与**事件**收集进「墨墨日志」，支持反复回看，并作为「收集」的一种计入完成度。
> 状态：数据层已落地（脚手架），挂钩调用 + UI + i18n 待实现。

---

## 0. 进度概览

| 模块 | 状态 | 落点 |
|------|------|------|
| 数据层 `state.visitorMemory` 字段 | ✅ 已完成 | `js/state.js:137` |
| 逻辑模块 `js/visitorMemory.js` | ✅ 已完成 | 全量实现 |
| `visitors.js` 的 import | ✅ 已完成 | `js/visitors.js:9` |
| 挂钩调用（叙事 + 特殊事件） | ⬜ 待实现 | `triggerNarrative` / `eventXxx` 内 |
| 墨墨日志「访客纪念」子标签 | ⬜ 待实现 | `js/render/archive.js` `renderDiaryTab()` |
| 收集面板「访客纪念」计数卡 | ⬜ 待实现 | `js/collection.js` + `js/render/collection.js` |
| i18n 文案 | ⬜ 待实现 | `js/i18n/terms.js` |

---

## 1. 背景与问题

当前访客叙事内容存在两处"看完即丢"的体验缺口：

1. **便签（还书时夹的小纸条）看完弹窗即消失**
   `js/render/visitors.js` 还书弹窗里只渲染一次 `result.common.text`，未写入任何 state，玩家无法回看。
2. **事件（偶层/稀层/终局/特殊）虽进日记，但被压成纯文本流水**
   `visitors.js` 中走 `addDiaryEntry('special_event', { detail: ... })`——谁写的、什么类型、标题全部丢失，回头想精读找不到。
3. **墨墨日志 `diaryLogs` 本身是"限 30 条 + 临时拼文本"的流水**（`js/diary.js`），不是结构化存储，不适合做"收集"。
4. **现有 `collection.js` 是"完成度进度"收集**（书籍/里程碑/位面），是很好的"收集"范式，但只收宏观进度、不收具体叙事内容。

> 用户原话意图："把看过的访客留下的便签和事件都收集起来，便于重复观看，也属于收集的一种。"

---

## 2. 设计决策（已与用户确认）

| # | 决策点 | 结论 |
|---|--------|------|
| 1 | 收集口径 | **按事件去重**：同一便签/事件只收一次（按 `charId:eventId` 去重），符合"收集"语义，能显示"已收 X/N"完成度；已收的随时可重看。重复看到不再新增。 |
| 2 | UI 落点 | **墨墨日志为主 + 收集面板计数**：主入口在墨墨日志内开「访客纪念」子标签（浏览/筛选/重读）；同时在收集面板加一张完成度计数卡，呼应"也属于收集"。 |
| 3 | 收录范围 | **最大范围**：还书便签(common) + 偶层/稀层/终局事件 + 终局后常层/偶层(postRareCommon/postRareOccasional) + **一次性特殊事件**（沈明远赠书、裴舟荐书/补稿、王小磊诗笺、通用事件）。 |

---

## 3. 数据模型

`state.visitorMemory = { items: [...] }`（顶层字段，随主存档整对象序列化自动持久化，无需单独迁移）。

每条 item 结构（`js/visitorMemory.js:48`）：

```js
{
  uid:        `${charId}:${eventId}`,   // 去重键
  charId,                          // 角色 id
  charName,                        // 角色名（缺省回退 VISITOR_DEFS）
  charEmoji,                       // 角色 emoji
  kind:       'note' | 'event',    // 便签 or 事件
  eventId,                         // 该角色内唯一 id（便签用 common.id，事件用 occasional.id / 'rare' / 'postRare' / special_xxx）
  title:      null | string,       // 事件标题（便签为 null）
  text:       string,              // 正文（回看内容）
  rarity:     null | 'occasional'|'rare'|'postRare'|'postRareOccasional'|'special',
  firstSeen:  number,             // Date.now()
  lastSeen:   number,
  isNew:      boolean             // 新收集角标
}
```

**兼容性**：老存档没有 `visitorMemory` 时，`ensure()`（`visitorMemory.js:7`）防御式初始化为 `{ items: [] }`，不会崩。

---

## 4. 已落地逻辑模块 API（`js/visitorMemory.js`）

纯逻辑层，不碰 DOM。函数清单：

| 函数 | 行为 |
|------|------|
| `collectVisitorItem({charId, kind, eventId, title, text, rarity, charName, charEmoji})` | 按 `uid` 去重入库；已存在则刷新 `lastSeen` 并返回 `false`；新条目 `isNew=true` 并 `saveState()`。返回 `true` 表示本次为新收集。 |
| `getVisitorMemory()` | 按角色分组（依 `VISITOR_NARRATIVES` 顺序），每组含 `notes[]` / `events[]` / `count`。 |
| `getVisitorMemoryNewCount()` | 返回 `isNew` 条目数（供角标）。 |
| `markSeen(uid)` | 清单条 `isNew`。 |
| `clearAllNew()` | 清空全部 `isNew`（如"全部已读"）。 |
| `getVisitorStats()` | 返回 `{ collected, total, percent, perChar[] }`，分母来自 `getTotals()` 对 `VISITOR_NARRATIVES` 的静态统计。 |

> ⚠️ **已知缺口（待补）**：`getTotals()` 目前只统计 `VISITOR_NARRATIVES` 内的便签 + 事件（common / postRareCommon / occasional / rare / postRare / postRareOccasional），**未包含一次性特殊事件**。决策 3 要求也收特殊事件，因此分母需追加一个常量列表（沈明远赠书、裴舟荐书、裴舟补稿、王小磊诗笺、通用事件 ×7），否则 `percent` 与"已完成"会漏算这部分。建议：在 `getTotals()` 末尾 `grand += SPECIAL_EVENT_TOTAL`（约 11 条）。

---

## 5. 挂钩点设计（待实现）

原则：**收集时机 = 玩家"看到"的时刻**，与弹窗展示同源，避免"后台偷偷收集"或"重复收集"。

### 5.1 叙事事件 —— `triggerNarrative(charId)`（`visitors.js:760`）

在 `return result` 之前（或紧接各分支 `addDiaryEntry` 之后）调用 `collectVisitorItem`：

| 分支 | 行 | 调用参数 |
|------|----|----------|
| `result.common` | 769 | `kind:'note'`, `eventId:common.id`, `text:common.text` |
| `result.occasional` | 776 | `kind:'event'`, `rarity:'occasional'`, `eventId:occasional.id`, `title:occasional.title`, `text:occasional.text` |
| `result.rare` | 796 | `kind:'event'`, `rarity:'rare'`, `eventId:'rare'`, `title:narrative.rare.title`, `text:narrative.rare.text` |
| `result.postRare` | 830 | `kind:'event'`, `rarity:'postRare'`, `eventId:'postRare'`, `title:narrative.postRare.title`, `text:narrative.postRare.text` |
| `result.postRareCommon` | 853 | `kind:'note'`, `eventId:chosen.id`, `text:chosen.text` |
| `result.postRareOccasional` | 863 | `kind:'event'`, `rarity:'postRareOccasional'`, `eventId:next.id`, `title:next.title`, `text:next.text` |

> 注意：`common` / `postRareCommon` / `occasional` / `postRareOccasional` 为可重复随机选取，去重键 `charId:eventId` 天然防止同一条重复入库。

### 5.2 一次性特殊事件（`visitors.js` 各 `eventXxx` 函数）

在每个函数的 `addDiaryEntry('special_event', ...)` 之后追加 `collectVisitorItem({ kind:'event', rarity:'special', ... })`：

| 函数 | 行 | eventId | title | text |
|------|----|---------|-------|------|
| `eventGiftBook` | 1022 | `'shen_gift_book'` | `沈明远赠书：《${book.title}》` | diary detail（line 1039） |
| `eventPeizhouRecommend` | 1061 | `'peizhou_recommend'` | `裴舟推荐《${book.title}》` | diary detail（line 1077） |
| `eventPeizhouPreview` | 1082 | `'peizhou_preview'` | `裴舟赠阅残章` | diary detail（line 1109） |
| `eventWavePoem` | 1116 | `'wang_poem'` | `王小磊波浪诗笺` | `poem` |
| `eventGeneric` | 1140 | `'generic_'+charId` | `evt.text` | `evt.msg` |

`charId` 在各函数中可直接取（叙事事件有 `charId`；`eventGeneric(charId, visitor)` 直接传参；赠书/诗笺等需确认其所属 `charId`——沈明远=`shenmingyuan`、裴舟=`peizhou`、王小磊=`wangxiaolei`）。

---

## 6. UI 设计

### 6.1 墨墨日志「访客纪念」子标签（主入口）

落点：`js/render/archive.js` 的 `renderDiaryTab()`。在面板顶部加分段切换：

```
[ 日志 ]  [ 访客纪念 ·{newCount} ]
```

- 选「日志」→ 维持现有 `diaryLogs` 渲染。
- 选「访客纪念」→ 渲染 `getVisitorMemory()` 结果：
  - **按角色分组**（组头显示 `emoji + 角色名 + 已收/该角色总数`）。
  - 每组内分 `便签` / `事件` 两栏（或小标签区分）。
  - 每条卡片显示 `text`（事件额外显示 `title` + 稀有度标签）。
  - `isNew` 条目右上角红点 / "新"角标；点击卡片（或"标记已读"）调用 `markSeen(uid)`。
  - 顶部可选筛选：`全部 / 便签 / 事件`。
  - 空态文案：`还没有收集到任何访客便签或事件`。

### 6.2 收集面板「访客纪念」计数卡

落点：`js/collection.js` 的 `COLLECTION_CATEGORIES` 增加 `visitor_memory` 分类；`js/render/collection.js` 增加对应渲染分支（参照 `milestones` 风格）。

- 进度：`getVisitorStats()` 的 `collected / total` 与 `percent`。
- 卡片文案：`访客纪念 · 已收集 {collected}/{total}`。
- 点击可跳转/聚焦墨墨日志的「访客纪念」子标签（与 6.1 联动）。

---

## 7. i18n 文案清单（`js/i18n/terms.js` 待补）

| key | zh | en |
|-----|----|----|
| `collectionCategoryVisitorMemory` | 访客纪念 | Visitor Memories |
| `diaryTabVisitorMemory` | 访客纪念 | Visitor Memories |
| `vm_filter_all` | 全部 | All |
| `vm_filter_note` | 便签 | Notes |
| `vm_filter_event` | 事件 | Events |
| `vm_empty` | 还没有收集到任何访客便签或事件 | No visitor notes or events collected yet |
| `vm_new` | 新 | NEW |
| `vm_collected` | 已收集 {collected}/{total} | Collected {collected}/{total} |
| `vm_kind_note` | 便签 | Note |
| `vm_kind_event` | 事件 | Event |

> 角色名/emoji 复用 `VISITOR_DEFS`（`terms.js` 中已有对应 key），无需新增。

---

## 8. 实施步骤（建议顺序）

1. **补分母缺口**：在 `js/visitorMemory.js` 的 `getTotals()` 追加一次性特殊事件常量计数（决策 3 落地前提）。
2. **挂叙事事件**：在 `triggerNarrative`（`visitors.js:760`）各分支后加 `collectVisitorItem` 调用（5.1 表）。
3. **挂特殊事件**：在 5 个 `eventXxx` 函数内加调用（5.2 表），确认各自 `charId`。
4. **i18n**：补 7 节清单。
5. **墨墨日志子标签**：改 `render/archive.js` `renderDiaryTab()`，加分段切换 + 访客纪念渲染。
6. **收集面板卡**：改 `collection.js` + `render/collection.js`。
7. **校验**：对所有改动 js 跑 `node --check`；自测去重（重复触发同事件不增条）、`isNew` 角标、`percent` 计算、老存档 `ensure()` 兜底。

---

## 9. 风险与边界

- **存档兼容**：`ensure()` 已兜底，老存档首次进入自动建空数组；`persistence.js` 整对象序列化自动持久化新字段。
- **分母与分子一致性**：若不补 §4 缺口，特殊事件会被收集但不计入 `total`，导致 `percent` 统计失真（建议必补）。
- **重复触发**：依赖 `charId:eventId` 去重，事件 id 必须稳定（避免使用随机/时间戳作 id）。
- **性能**：`getVisitorMemory()` 每次全量分组，数据量小（角色 × 数十条），无性能压力。

---

## 10. 验收标准

- [ ] 还书便签、偶/稀/终局及终局后事件首次出现即入库，可于「访客纪念」回看。
- [ ] 沈明远赠书、裴舟荐书/补稿、王小磊诗笺、通用事件均被收集。
- [ ] 同一便签/事件重复出现不再新增条目。
- [ ] 新收集条目有角标，阅读后角标消失。
- [ ] 收集面板显示「已收集 X/N」完成度，且 N 含特殊事件。
- [ ] 老存档（无 `visitorMemory`）打开不报错。
- [ ] 所有改动 js 通过 `node --check`。
