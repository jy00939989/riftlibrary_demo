# js/core/ 纯函数层抽取方案

> **目标**：将 2.6 万行中所有"输入 state → 输出结果"的纯逻辑从渲染层和业务层剥离，集中到 `js/core/` 目录。
> **判定标准**：函数能否在 Node.js 里、没有 `window` 的情况下跑出正确结果？能 → 进 core/，配单元测试。
> **原则**：只抽取不重写。core/ 是新文件，现有 js/ 模块改为从 core/ import。不改任何业务行为。

---

## 〇、前置步骤：提升私有函数为 export（必须先做）

以下函数当前是**模块内私有函数**，未 export。必须在搬运前先提升为 `export function/const`，否则无法被 core/ 引用。

| 函数 | 所在文件 | 当前形态 | 操作 |
|------|---------|---------|------|
| `pickReturnQuote` | js/visitors.js L330 | `function pickReturnQuote` (私有) | 加 `export` |
| `getActiveBrowsingVisitors` | js/visitors.js L387 | `function getActiveBrowsingVisitors` (私有) | 加 `export` |
| `BORROW_LEVEL_TABLE` | js/visitors.js L361 | `const BORROW_LEVEL_TABLE` (私有) | 加 `export` |
| `getNarrativeState` | js/visitors.js L664 | `function getNarrativeState(charId)` (私有) | 加 `export` |
| `isTaskConditionMet` | js/quests.js L259 | `function isTaskConditionMet(taskDef)` (私有) | 加 `export` + 参数显式化 |
| `findTaskById` | js/quests.js L246 | `function findTaskById(planeId, taskId)` (私有) | 加 `export` + 参数显式化 |
| `findNextAvailableTask` | js/quests.js L221 | `function findNextAvailableTask(planeId, charId, charData)` (私有) | 第三个参数是 charData 不是 ALL_TASKS。加 `export` |
| `getChapterInfo` | js/app.js L40 | `function getChapterInfo(book, bookState)` (私有) | 加 `export` |
| `getNextChapterPreview` | js/app.js L76 | `function getNextChapterPreview(book, bookState)` (私有) | 加 `export` |
| `getDiaryBindingLevel` | js/diary.js | `function getDiaryBindingLevel(state)` (私有) | 加 `export` |
| `countOwnedBooks` | js/achievements.js | `function countOwnedBooks(s)` (私有) | 加 `export` |
| `countCategoryBooks` | js/achievements.js | `function countCategoryBooks(s, category)` (私有) | 加 `export` |
| `countMasteryLevel` | js/achievements.js | `function countMasteryLevel(s, level)` (私有) | 加 `export` |
| `countTotalVisitors` | js/achievements.js | `function countTotalVisitors(s)` (私有) | 加 `export` |
| `allVisitorsTriggered` | js/achievements.js | `function allVisitorsTriggered(s)` (私有) | 加 `export` |
| `countFocusDays` | js/achievements.js | `function countFocusDays(s)` (私有) | 加 `export` |

**操作**：在 `js/visitors.js`、`js/quests.js`、`js/app.js`、`js/diary.js`、`js/achievements.js` 中，逐个将上述 `function`/`const` 改为 `export function`/`export const`。这一步零风险——只加了 export 关键字，不影响任何现有调用。

---

## 一、目录结构设计

```
js/
  core/                        ← 新建目录
    economy.js                 ← 奖励/定价/概率/氛围阶段
    visitor-lookup.js          ← 访客查询（光环/等级/语录/见证）
    narrative.js               ← 叙事条目抽取/好感门槛/去重
    book-utils.js              ← 章节进度/书籍状态/手稿箱容量
    curation.js                ← 从 js/curation.js 移入（它本来就是纯的）
    achievement-stats.js       ← 成就统计辅助函数 + 加成计算
  state.js                     ← 不动（所有模块的 import 根）
  storage.js                   ← 不动（有副作用：写 localStorage）
  app.js / visitors.js / ...  ← 逐步改为从 core/ import，本身不动
```

**为什么 state.js 不动**：它被 30+ 模块 import，移动会触达全项目。core/ 是增量层，不是重构层。

---

## 二、逐模块抽取清单

### 2.1 `js/core/economy.js` — 经济/奖励/概率

> 定位行号使用：`grep -n "export function\|^function\|^const" <file>` 而非计划中估算的行号。

| 函数 | 来源文件 | 已 export? | 签名 | 说明 |
|------|---------|-----------|------|------|
| `getAtmosphereLevel()` | js/storage.js | ✅ | `(atmosphere) → { level, name }` | 纯查表 |
| `getBorrowLevelConfig()` | js/visitors.js | ✅ | `(borrowLevel) → config` | 纯查表 |
| `getVisitorCap()` | js/visitors.js | ✅ | `(state) → number` | 查表 + 求和 |
| `getBorrowSpawnBonus()` | js/visitors.js | ✅ | `(state) → number` | 查表 |
| `getBorrowLevelPrice()` | js/shop.js | ✅ | `(borrowLevel) → number` | 纯公式 |
| `getFocusLevelPrice()` | js/shop.js | ✅ | `(focusLevel, auraDiscount) → number` | 纯公式 |
| `getFocusSpeedMultiplier()` | js/shop.js | ✅ | `(state, achievementBonuses, signboardBonus) → number` | 参数注入 |
| `getPlanePortalPrice(planeId)` | js/shop.js | ✅ | `(planeId) → number` | 纯查表 |
| `getAvailableBooks()` | js/shop.js | ✅ | `(state, SHARED_POOL) → array` | filter |
| `hasSignboard(id)` | js/shop.js | ✅ | `(state, id) → boolean` | 纯查表 |
| `getManuscriptSlotPrice()` | js/capacity.js | ✅ | `(currentSlots) → number` | 纯公式 |
| `getBookCapacity()` | js/capacity.js | ✅ | `(state) → number` | 纯计算 |
| `getOwnedBookCount()` | js/capacity.js | ✅ | `(state) → number` | 纯 filter |
| `isBookCapacityFull()` | js/capacity.js | ✅ | `(state) → boolean` | 纯判定 |
| `getManuscriptSlots()` | js/capacity.js | ✅ | `(state) → number` | 纯读取 |
| `getManuscriptBoxCount()` | js/capacity.js | ✅ | `(state) → number` | 纯读取 |
| `isManuscriptBoxFull()` | js/capacity.js | ✅ | `(state) → boolean` | 纯判定 |

**预计行数**：~180 行

---

### 2.2 `js/core/visitor-lookup.js` — 访客查询（纯读取）

| 函数/常量 | 来源 | 已 export? | 签名 | 说明 |
|-----------|------|-----------|------|------|
| `VISITOR_DEFS` | js/visitors.js | ✅ | 常量 | 10人定义对象，re-export |
| `BORROW_LEVEL_TABLE` | js/visitors.js | ❌ **私有** | 常量 | 先提升为 `export const` |
| `getVisitorDef(charId)` | js/visitors.js | ✅ | `(charId) → def \| null` | 纯查表 |
| `getActiveBrowsingVisitors()` | js/visitors.js | ❌ **私有** | `(visitors[]) → array` | 纯 filter，先提升 export |
| `getActiveAuras()` | js/visitors.js | ✅ | `(visitors[]) → aura[]` | 纯 map+filter |
| `getAuraSpeedBonus()` | js/visitors.js | ✅ | `(bookCategory, visitors, focus) → number` | 改为显式参数 |
| `getAuraCoinsMultiplier()` | js/visitors.js | ✅ | `(visitors) → number` | 同上 |
| `getAuraShopDiscount()` | js/visitors.js | ✅ | `(visitors) → number` | 同上 |
| `getAuraFocusUpgradeDiscount()` | js/visitors.js | ✅ | `(visitors) → number` | 同上 |
| `getAuraVisitorCapBonus()` | js/visitors.js | ✅ | `(visitors) → number` | 同上 |
| `getAuraSpawnBonus()` | js/visitors.js | ✅ | `(visitors) → number` | 同上 |
| `getAuraPoemCollect()` | js/visitors.js | ✅ | `(visitors) → boolean` | 同上 |
| `getAuraPlantGrowth()` | js/visitors.js | ✅ | `(visitors) → number` | 同上 |
| `getAuraReturnFavorBonus()` | js/visitors.js | ✅ | `(visitors) → number` | 同上 |
| `pickReturnQuote()` | js/visitors.js | ❌ **私有** | `(charId, bookTitle, atmosphere) → string` | 先提升 export |
| `getStageWitnesses()` | js/visitors.js | ✅ | `(stage, visitors[]) → array` | 改为显式参数 |

**隐性收益**：搬完后 `js/shop.js` 可以直接从 `./core/visitor-lookup.js` import 光环函数，不再需要 `import { getAuraShopDiscount, getAuraFocusUpgradeDiscount } from './visitors.js'`——**顺带解决 shop.js ↔ visitors.js 循环依赖**。

**关键变更**：当前所有 `getAura*` 函数内部调用 `getActiveBrowsingVisitors()` 隐式读取 `state.visitors`。抽取后改为接收显式参数 `(visitors[, ...])`。调用方（app.js）负责传入 `state.visitors.filter(...)` 的结果。

**预计行数**：~200 行

---

### 2.3 `js/core/narrative.js` — 叙事引擎（纯逻辑部分）

| 函数 | 来源 | 已 export? | 签名 | 说明 |
|------|------|-----------|------|------|
| `getAvailableCommonEvents(narrative, ns)` | js/visitors.js | 新增 | `(narrative, ns) → event[]` | 根据 expansionLevel 拼接池 |
| `getNarrativeProgress(charId, state)` | js/visitors.js | ✅ | `(charId, state) → progress` | 纯查询 |
| `isTaskConditionMet(taskDef, books, seeds)` | js/quests.js | ❌ **私有** | `(taskDef, books, seeds) → boolean` | 先提升 export + 显式化参数 |
| `findTaskById(planeId, taskId, tasks)` | js/quests.js | ❌ **私有** | `(planeId, taskId, tasks) → task \| null` | 先提升 export + tasks 参数注入 |
| `findNextAvailableTask(planeId, charId, charData, tasks)` | js/quests.js | ❌ **私有** | `(planeId, charId, charData, tasks) → task \| null` | 第三个参数是 **charData** 不是 ALL_TASKS。先提升 export |

#### 副作用拆分设计（核心难点）

以下三个函数当前有副作用（直接修改 state 或模块变量），必须拆为纯计算 + 调用方写回。

**① `getNarrativeState(charId)`** — 当前私有，签名 `(charId)` 隐式读写 `state.visitorNarratives`。

拆分方案：
```js
// core/narrative.js（纯函数）
export function ensureNarrativeState(existingNs) {
  // existingNs 可能为 undefined（新角色）
  if (!existingNs) {
    return {
      commonTriggered: [],
      occasionalCompleted: [],
      rareTriggered: false,
      postRareTriggered: false,
      postRareCommonTriggered: [],
      postRareOccasionalCompleted: [],
      expansionLevel: 0
    };
  }
  return existingNs; // 已有则原样返回
}
```

调用方（visitors.js `triggerNarrative`）：
```js
const ns = ensureNarrativeState(state.visitorNarratives[charId]);
if (!state.visitorNarratives[charId]) {
  state.visitorNarratives[charId] = ns; // 写回由调用方负责
}
```

**② `pickCommonEvent(charId)`** — 当前私有，读 `getNarrativeState` + 写 `ns.commonTriggered.push()` + 数组截断。

拆分方案：
```js
// core/narrative.js（纯函数）
export function selectCommonEvent(eventPool, triggeredHistory) {
  // eventPool: getAvailableCommonEvents 的返回值
  // triggeredHistory: ns.commonTriggered（数组）
  const recent = triggeredHistory.slice(-3);
  const candidates = eventPool.filter(e => !recent.includes(e.id));
  const chosen = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : eventPool[Math.floor(Math.random() * eventPool.length)];
  // 返回 chosen + 更新后的历史（不写 state）
  const updated = [...triggeredHistory, chosen.id].slice(-20);
  return { event: chosen, updatedTriggered: updated };
}
```

调用方写回：`ns.commonTriggered = result.updatedTriggered;`

**③ `pickOccasionalEvent(charId)`** — 更复杂，当前还会触发 `expansionLevel` 升级（副作用）。

拆分方案：
```js
// core/narrative.js（纯函数）
export function selectOccasionalEvent(narrative, ns) {
  if (!narrative.occasional) return { event: null, updatedCompleted: ns.occasionalCompleted, newExpansionLevel: ns.expansionLevel };
  const next = narrative.occasional.find(o => !ns.occasionalCompleted.includes(o.id));
  if (!next) return { event: null, updatedCompleted: ns.occasionalCompleted, newExpansionLevel: ns.expansionLevel };
  const updated = [...ns.occasionalCompleted, next.id];
  const newLevel = (updated.length >= 1 && ns.expansionLevel < 1) ? 1 : ns.expansionLevel;
  return { event: next, updatedCompleted: updated, newExpansionLevel: newLevel };
}
```

调用方写回：
```js
const result = selectOccasionalEvent(narrative, ns);
if (result.event) {
  ns.occasionalCompleted = result.updatedCompleted;
  ns.expansionLevel = result.newExpansionLevel;
}
```

**预计行数**：~180 行（拆分设计增加了纯函数数量）

---

### 2.4 `js/core/book-utils.js` — 书籍/章节工具

| 函数 | 来源文件 | 已 export? | 签名 | 说明 |
|------|---------|-----------|------|------|
| `createBookRecord(overrides)` | js/capacity.js | ✅ | `(overrides?) → bookState` | 工厂函数 |
| `getChapterInfo(book, bookState)` | js/app.js | ❌ **私有** | `(book, bookState) → chapterInfo \| null` | 先提升 export |
| `getNextChapterPreview(book, bookState)` | js/app.js | ❌ **私有** | `(book, bookState) → string \| null` | 先提升 export |
| `getBookProgress(bookId, state)` | js/books.js | ✅ | `(bookId, state) → number` | 百分比进度 |
| `getUnlockedChapters(bookId, state)` | js/books.js | ✅ | `(bookId, state) → array` | 纯查表 |
| `canBorrowBook(bookId, state)` | js/books.js | ✅ | `(bookId, state) → boolean` | 纯查表 |

**预计行数**：~100 行

---

### 2.5 `js/core/curation.js` — 书架策展（整体移入）

当前 `js/curation.js` 已经全部是纯函数：`calcCurationEffects`、`scanRow`、`scanPairs`、`getCurationFocusSpeed`、`getCurationBorrowBonus`、`getCurationCoinsBonus`。零改动移入 `js/core/curation.js`。

**预计行数**：~100 行（现有代码量）

---

### 2.6 `js/core/achievement-stats.js` — 成就统计 + 加成

| 函数 | 来源 | 已 export? | 签名 | 说明 |
|------|------|-----------|------|------|
| `countOwnedBooks(s)` | js/achievements.js | ❌ 私有 | `(state) → number` | 纯 filter，先提升 export |
| `countCategoryBooks(s, category)` | js/achievements.js | ❌ 私有 | `(state, category) → number` | 同上 |
| `countMasteryLevel(s, level)` | js/achievements.js | ❌ 私有 | `(state, level) → number` | 同上 |
| `countTotalVisitors(s)` | js/achievements.js | ❌ 私有 | `(state) → number` | 同上 |
| `allVisitorsTriggered(s)` | js/achievements.js | ❌ 私有 | `(state) → boolean` | 同上 |
| `countFocusDays(s)` | js/achievements.js | ❌ 私有 | `(state) → number` | 同上 |
| `calcAchievementBonuses(unlockedSet)` | **新增** | 纯函数 | `(Set) → bonuses` | 核心纯计算，见下方拆分 |
| `getDiaryBindingLevel(state)` | js/diary.js | ❌ 私有 | `(state) → { level, name, icon }` | 纯查表 |
| `todayKey()` | js/dailytasks.js | ✅ | `() → string` | 纯工具 |

#### ⚠️ `getAchievementBonuses()` 拆分

当前 `getAchievementBonuses()` 内部调用 `loadUnlocked()` 读 `localStorage`，**不是纯函数**。不能直接搬入 core/。

拆分方案：
```js
// ── core/achievement-stats.js（纯函数，可在 Node 测试）──
export function calcAchievementBonuses(unlockedSet) {
  // unlockedSet: Set of achievement IDs
  return {
    streakMultiplier: unlockedSet.has('W06') ? 0.03 : 0.02,
    focusLevelBonus: unlockedSet.has('L04') ? 0.07 : 0.05,
    speedFlat:      unlockedSet.has('B07') ? 0.05 : 0,
    coinsBoost:     unlockedSet.has('V02') ? 0.10 : 0,
    inspirationBonus: (unlockedSet.has('W07') ? 1 : 0) + (unlockedSet.has('B08') ? 2 : 0),
  };
}

// ── js/achievements.js（wrapper，保留在原处）──
import { calcAchievementBonuses } from './core/achievement-stats.js';

export function getAchievementBonuses() {
  const unlocked = loadUnlocked(); // ← 读 localStorage，有副作用
  return calcAchievementBonuses(new Set(Object.keys(unlocked)));
}
```

所有现有调用方 `getAchievementBonuses()` 不受影响（wrapper 签名不变）。

---

## 三、实施步骤（共 6 步，约 2-3 小时）

### Step 0：提升私有函数为 export（15min，必须先做）

在 `js/visitors.js` 和 `js/quests.js` 中：
```js
// visitors.js
function pickReturnQuote(...)       → export function pickReturnQuote(...)
function getActiveBrowsingVisitors  → export function getActiveBrowsingVisitors
const BORROW_LEVEL_TABLE            → export const BORROW_LEVEL_TABLE
function getNarrativeState(...)     → export function getNarrativeState(...)

// quests.js
function isTaskConditionMet(...)    → export function isTaskConditionMet(...)
function findTaskById(...)          → export function findTaskById(...)
function findNextAvailableTask(...) → export function findNextAvailableTask(...)

// app.js
function getChapterInfo(...)        → export function getChapterInfo(...)
function getNextChapterPreview(...) → export function getNextChapterPreview(...)

// diary.js
function getDiaryBindingLevel(...)  → export function getDiaryBindingLevel(...)

// achievements.js
function countOwnedBooks(...)       → export function countOwnedBooks(...)
function countCategoryBooks(...)    → export function countCategoryBooks(...)
function countMasteryLevel(...)     → export function countMasteryLevel(...)
function countTotalVisitors(...)    → export function countTotalVisitors(...)
function allVisitorsTriggered(...)  → export function allVisitorsTriggered(...)
function countFocusDays(...)        → export function countFocusDays(...)
```

### Step 1：创建文件骨架（10min）

```
js/core/economy.js              ← 空 export
js/core/visitor-lookup.js       ← 空 export
js/core/narrative.js            ← 空 export
js/core/book-utils.js           ← 空 export
js/core/curation.js             ← 从 js/curation.js 复制（纯搬运）
js/core/achievement-stats.js    ← 空 export
```

### Step 2：逐文件搬运函数体

搬运规则：
- 纯查表/纯公式的函数：函数体一字不改，签名中隐式读 state 的改为显式参数
- 有副作用的函数：按 2.3 和 2.6 的拆分方案，创建纯版本（新函数名 `selectXxx` / `ensureXxx` / `calcXxx`），原函数保留为 wrapper
- 每个 core/ 文件顶部标注 `// @pure — testable in Node without DOM`

**搬运顺序**（难度递增，先搬简单的建立信心）：
1. `core/curation.js` — 纯搬运，零改动
2. `core/book-utils.js` — 纯参数搬运
3. `core/economy.js` — 纯参数搬运
4. `core/achievement-stats.js` — 含 `calcAchievementBonuses` 拆分
5. `core/visitor-lookup.js` — 含隐式 state 显式化
6. `core/narrative.js` — 含副作用拆分（最复杂）

### Step 3：原文件添加 re-export（15min）

每个来源文件的原有 export 保留，内部改为从 core/ import。例：

```js
// js/visitors.js（旧）
export function getAuraSpeedBonus(category) { ... }

// js/visitors.js（新）
import { getAuraSpeedBonus } from './core/visitor-lookup.js';
export { getAuraSpeedBonus };
```

目的：不破坏任何现有 import 路径。

### Step 4：更新调用方（30min）

逐步将 `app.js`、`render/*.js` 等中的调用改为直接从 core/ import（可选——先走 re-export 兼容过渡，逐步切）。

### Step 5：处理有副作用的函数（15min）

以下函数当前有副作用（写入 state 或 localStorage），**不搬入 core/**，但抽取其纯计算部分为 helper：

| 函数 | 处理方式 |
|------|---------|
| `pickCommonEvent` | 拆为：`pickCommonEvent(eventPool, history) → {event, updatedHistory}`（纯）+ 调用方写回 state |
| `pickOccasionalEvent` | 同上 |
| `getNarrativeState` | 纯读取部分抽入 core，兜底创建逻辑留在调用方 |
| 光环函数 | 当前隐式读 state.visitors → 改参数为 `(browsingVisitors[])` |

### Step 6：添加单元测试（后续单独做）

当前项目零测试基础设施（`package.json` devDependencies 为空，无 `tests/` 目录）。

**测试框架选型**：

| 方案 | 优点 | 缺点 |
|------|------|------|
| **Node.js `node:test`**（推荐） | 零依赖，Node 18+ 自带 | core/ 文件的 import 路径需要 `.js` 后缀；若 data/ 文件引用了浏览器 API 则需 mock |
| Vitest | 配置简单，天然 ESM | 需要装 devDependency，引入构建链 |

**建议**：用 `node:test`。项目刻意保持零构建工具链，`node:test` 与之对齐。前提是确保 core/ 文件只 import 纯数据（`data/*.js` 中已在 core/ 之前确认无 `window` 引用）。

**目录结构**：
```
tests/
  core/
    economy.test.js
    visitor-lookup.test.js
    book-utils.test.js
    curation.test.js
    achievement-stats.test.js
    narrative.test.js
  fixtures/
    sample-state.json        ← 最小完整 state 快照（含 3 本书、2 个访客、氛围 60）
    sample-visitors.json     ← 3 个不同状态的访客数组
```

**优先级**：先让 core/ 文件存在且能通过 re-export 正常工作，测试后补。最优先写 `economy.test.js`（定价+奖励公式——改了这里数值整个游戏翻车）和 `achievement-stats.test.js`（加成叠乘极易出错）。

---

## 四、不搬入 core/ 的边界

| 模块 | 原因 |
|------|------|
| `js/timer.js` | 纯副作用（setInterval / DOM 回调），不入 core |
| `js/audio.js` | 纯副作用（Audio API），不入 core |
| `js/intro.js` | 纯 DOM 操作，不入 core |
| `js/tutorial.js` | 少量纯逻辑（getTrigger），量太小不值得拆 |
| `js/render/*.js` | 全部是 DOM 操作，不入 core |
| `js/state.js` | 已经是最底层，不动——被 30+ 文件 import |
| `js/storage.js` | 全部有副作用（写 localStorage / 更新 DOM body 背景），不入 core |
| `data/*.js` | 纯数据文件，不入 core（它们本身就是纯数据） |

---

## 五、风险评估（已根据架构师审核修正）

| 风险 | 概率 | 缓解 |
|------|------|------|
| 私有函数提升 export 时遗漏调用方 | 极低 | 只是加 `export` 关键字，不改变函数名/签名，现有调用 100% 兼容 |
| 搬运时签名变更导致调用方参数不匹配 | 中 | Step 3 re-export 兼容层兜底；每个函数搬运后 `grep -rn "函数名" js/` 找所有调用方确认 |
| `getNarrativeState` / `pickCommonEvent` / `pickOccasionalEvent` 副作用拆分遗漏 | **高** | 这三个是最复杂的——已给出详细拆分伪代码（见 2.3），逐函数按伪代码实现；拆分后调用方 `triggerNarrative` 需逐行比对行为不变 |
| `getAchievementBonuses` 拆分后 wrapper 忘记 import | 低 | wrapper 签名不变，所有调用方无感 |
| curation.js 搬运后 import 路径断开 | 极低 | Step 3 re-export 彻底消除 |
| 性能回归 | 极低 | 纯函数搬运不改调用次数，参数显式化不增加新分配 |
| `findNextAvailableTask` 第三个参数签名为 charData 而非 ALL_TASKS | 已修正 | 计划已更新 |

---

## 六、收益预估

| 指标 | 当前 | 抽取后 |
|------|------|--------|
| 可单元测试的纯逻辑行数 | ~0（全部耦合 DOM/window） | ~800 行 |
| "改 A 炸 B"耦合面 | render ↔ visitor ↔ shop ↔ achievement 全互联 | render → core（单向） |
| 数值模拟可行性 | 必须打开浏览器手动玩 | `node tests/core/economy.test.js` |
| 新人/AI 理解项目成本 | 需要读懂 app.js 1200 行才能改一句话 | core/economy.js 180 行独立可读 |
