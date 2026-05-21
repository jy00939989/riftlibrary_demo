# 位面系统设计审查报告

**审查对象**：`docs/design/PLANE_SYSTEM_DESIGN.md`
**审查时间**：2026-05-21
**审查者**：WorkBuddy AI（软件架构师视角）
**项目版本**：library_demo-feature-docs-organized

---

## 总体评价

> **总分：7.5 / 10 — 设计思路清晰，叙事设计有亮点，但数据层与逻辑层存在几处需要在实施前修补的结构风险。**

| 维度 | 评分 | 说明 |
|------|------|------|
| 叙事设计 | ⭐⭐⭐⭐⭐ | 五线并行 + Stage 关键事件的结构，非常适合休闲游戏节奏 |
| 数据模型 | ⭐⭐⭐ | 几处字段不一致，与现有 state.js 存在冲突需要对齐 |
| 逻辑边界 | ⭐⭐⭐⭐ | 核心流程清晰，但访客系统的扩写边界需要更明确 |
| 持久化与迁移 | ⭐⭐⭐ | state.js 骨架与设计文档字段不匹配，迁移补丁必须同步设计 |
| 与现有系统耦合 | ⭐⭐⭐⭐ | 大多数接入点合理，但 visitors.js 扩写可能破坏现有逻辑 |
| 实施可行性 | ⭐⭐⭐⭐ | Phase 1 的端到端验证策略非常务实 |

---

## 一、总体结构审查

### ✅ 好的地方

**1. 四层分离清晰**

设计遵循项目已有的 数据层 → 逻辑层 → 渲染层 → 入口编排 四层结构，没有引入新的分层范式，降低了接入复杂度。

**2. 叙事触发不打断专注**

"任务以信函传递、角色到访为媒介"的设计，与现有"专注完成后触发访客/事件"的时机完全一致，不会干扰核心游戏节奏。

**3. Stage 推进策略务实**

"五角色个人阶段全部 ≥ planeStage 时位面推进"的聚合逻辑，避免了只有某一角色单线突进、位面大事件失真的问题，是正确的群像叙事保障。

**4. Phase 1 端到端验证策略**

先只做小艾拉 Stage 1 的 4 条任务做端到端验证，然后再填充其他内容，这是非常务实的实施策略，避免大批量内容完成后才发现框架有问题。

---

## 二、数据层：具体问题与修复建议

### 🔴 问题 1：state.quests.pastoral 字段与设计文档不一致

**当前 state.js 骨架（第 131-138 行）**：
```js
pastoral: {
  stage: 0,
  characters: {},       // 设计文档要求的字段远多于此
  mementos: [],
  storyLog: [],
  plagueProgress: 0     // ← 设计文档中没有这个字段
}
```

**设计文档要求的字段**（第 3.4 节）：
```js
pastoral: {
  unlocked: false,         // ← state.js 中缺失
  stage: 0,
  stagesCompleted: [],     // ← state.js 中缺失
  portalPurchasedAt: null, // ← state.js 中缺失
  characters: {
    pastoral_child: {
      met: false,          // ← state.js 中 characters 是空对象
      stage: 1,
      activeTasks: [],     // ← state.js 中缺失
      completedTasks: [],  // ← state.js 中缺失
      pendingComplete: [], // ← state.js 中缺失
      favor: 0
    }
  },
  mementos: [],
  letters: [],             // ← state.js 中缺失
  storyLog: []
  // plagueProgress: 0 ← state.js 中有但设计文档没有，是否保留？
}
```

**修复要求**：
- 在实施 Phase 1 前，**必须同步更新 state.js 中的骨架**
- 在 `initState()` 中增加对应的旧存档迁移补丁（参照现有 `if (!state.quests)` 的写法）
- 明确 `plagueProgress` 字段的去留（建议保留，放入 state，不放入设计文档只是遗漏）

---

### 🔴 问题 2：planes.js 中 mementos 字段的 unlock 信号与设计文档不一致

**planes.js 实际代码**：
```js
mementos: [
  { id: 'recipe', name: '玛格丽特的草药配方', emoji: '📝', stage: 2 },
  ...
]
```

**设计文档（第 3.1 节）**：
```js
mementos: [
  { id: 'recipe', name: '玛格丽特的草药配方', emoji: '📝', unlockStage: 2 }
]
```

字段名不同：代码是 `stage`，文档是 `unlockStage`。

**修复要求**：在实施时统一命名，选一个并全局保持一致。建议用 `unlockStage`，与 characters 的 `unlockStage` 字段保持对齐（但注意 characters 目前也没有 unlockStage 字段，见问题3）。

---

### 🟡 问题 3：characters 定义中缺少 unlockStage 字段

**planes.js 实际代码**中的 characters 没有 `unlockStage`：
```js
characters: [
  { id: 'pastoral_child', name: '小艾拉', emoji: '👧', role: '普通孩子', desc: '...' }
  // ← 没有 unlockStage
]
```

但设计文档第 3.1 节、第 4.4 节的角色解锁节奏表都依赖这个字段：
```js
{ id: 'pastoral_child', name: '小艾拉', emoji: '👧', role: '孩子',
  unlockStage: 1, intro: '...' }
```

**修复要求**：planes.js 的 characters 数组中，每个角色必须加 `unlockStage` 字段。参照第 4.4 节的节奏表补全。

---

### 🟡 问题 4：unlock 条件里的 shopUpgrade 字段与现有 state.library.planePortals 的 key 命名约定不明确

**planes.js 的解锁条件**：
```js
unlock: { atmo: 80, books: 12, shopUpgrade: 'plane_portal_pastoral' }
```

**state.library.planePortals 当前结构**（state.js 第 59 行）：
```js
planePortals: {}  // { magic: { unlocked: false, progress: 0 } }
```

注释里用的是 `magic`，unlock 条件里用的是 `plane_portal_pastoral`，**两者格式不一致**，`canUnlockPlane()` 函数（planes.js 第 83 行）检查的是 `state.library.planePortals[shopUpgrade]`，目前这个 key 的设置时机和格式需要在 shop.js 里明确实现。

**修复要求**：在 shop.js 的传送门购买逻辑中，明确将 `state.library.planePortals['plane_portal_pastoral']` 设为 truthy 值（例如 `{ purchased: true, purchasedAt: Date.now() }`），与 `canUnlockPlane()` 的判断逻辑对齐。

---

## 三、逻辑层：潜在风险

### 🔴 风险 1：visitors.js 扩写可能破坏现有访客逻辑

设计文档提出"改造 `js/visitors.js`，访客来访时留信逻辑"。

**现有 visitors.js 的问题**：
- `spawnVisitor()` 完全随机选取 charId（来自固定 4 人池：沈明远/小萤/云游/阿九）
- 位面角色（pastoral_child 等）**与现有访客是两个完全不同的系统**——位面角色会带任务信函，现有访客做借阅/归还/事件
- 如果直接在 spawnVisitor() 里混入位面角色，会导致位面角色也参与借书/还书/事件系统（触发 `pickReturnQuote()`、`triggerEvent()` 等），产生逻辑错误

**建议**：**不要改造现有 visitors.js，而是在 quests.js 里建立独立的位面访客队列**。两者并行存在，互不干扰：
```
普通访客队列（visitors.js 不动）
  → 借书/还书/事件，使用现有 state.visitors[]

位面访客队列（quests.js 新增）
  → 留信/接任务/回信，使用 state.quests.pastoral.pendingVisits[]
  → 位面角色不占用普通访客名额（cap），不触发借书逻辑
```

---

### 🟡 风险 2：Stage 推进的原子性与冲突

设计文档中 Stage 推进发生在"角色完成当前阶段全部任务后检查"，但没有明确这是同步检查还是异步触发。

**潜在问题**：如果两个角色在同一次 `handleCompleteFocus()` 里同时完成最后一个任务，Stage 推进逻辑可能被触发两次，导致 `planeStage` +2。

**修复要求**：`checkStageAdvance()` 函数里加防重入标记（`advancing: false`），推进过程中不再接受新的推进请求：
```js
if (state.quests.pastoral._advancing) return;
state.quests.pastoral._advancing = true;
// ... 推进逻辑
state.quests.pastoral._advancing = false;
```

---

### 🟡 风险 3：任务完成判定时机——`pendingComplete` 状态的清理

设计文档引入了 `pendingComplete: []`（已完成但未回信提交的任务 ID），这是一个好设计，保证了"玩家必须主动回信"的交互感。

但需要明确：
1. **pendingComplete 里的任务能否被取消？**（玩家接了任务但不打算提交）
2. **pendingComplete 的清理时机**：是玩家点击"回信提交"按钮时清理，还是角色下次到访时自动清理？
3. **如果书籍被损毁，已经在 pendingComplete 里的相关任务如何处理？**

建议在设计文档里补充这三个 edge case 的处理策略。

---

### 🟡 风险 4：`copy_chapter` 类型任务的完成判定

任务类型 `copy_chapter` 的 condition 是 `{ bookId, chapterIdx }`，但现有书籍进度跟踪用的是：
- `state.books[bookId].unlockedChapters`（章节解锁，通过 copiedWords 累计）
- `state.books[bookId].readChapters`（阅读标记）

**誊抄某一章**和**解锁某一章**不是同一概念——`unlockedChapters` 是章节被解锁（可读），而不是章节被主动"誊抄了一遍"。

**修复要求**：明确 `copy_chapter` 任务的判定逻辑是：
- 方案 A：`chapterIdx` 出现在 `unlockedChapters` 中即视为完成（宽松，推荐）
- 方案 B：新增 `state.books[bookId].copiedChapters[]` 字段精确追踪（严格，但需改造书籍系统）

对于个人项目来说，**方案 A 足够**，记得在代码注释里说清楚即可。

---

## 四、持久化层：迁移安全性

### 🟡 问题 5：新字段迁移补丁必须在 initState() 里同步添加

现有 `initState()` 里有完整的旧存档迁移逻辑。当位面系统上线时，会有已存在的 localStorage 存档没有新字段，必须补充：

```js
// 在 initState() 的迁移段落末尾添加
if (!state.quests.pastoral.unlocked) {
  state.quests.pastoral.unlocked = false;
}
if (!state.quests.pastoral.stagesCompleted) {
  state.quests.pastoral.stagesCompleted = [];
}
if (!state.quests.pastoral.portalPurchasedAt) {
  state.quests.pastoral.portalPurchasedAt = null;
}
if (!state.quests.pastoral.letters) {
  state.quests.pastoral.letters = [];
}
// 初始化各角色的完整结构
['pastoral_child', 'pastoral_herbalist', 'pastoral_lord',
 'pastoral_scholar', 'pastoral_nun'].forEach(charId => {
  if (!state.quests.pastoral.characters[charId]) {
    state.quests.pastoral.characters[charId] = {
      met: false, stage: 1, activeTasks: [],
      completedTasks: [], pendingComplete: [], favor: 0
    };
  }
});
```

**这步必须在 Phase 1 开始前完成，否则旧存档加载后会报 undefined 错误。**

---

## 五、UI 层：小问题

### 🟢 无大问题，但有一处需要澄清

**馆史档案页改造**：设计文档提出在现有的两个子标签（馆史档案 / 墨墨日志）后面新增"🌍 位面"子标签。

查看 `render/archive.js`，当前 `archiveTab` 是模块内变量 `'history' | 'diary'`，新增位面标签需要：
1. 新增 `'planes'` 选项
2. 新增一个 `case 'planes': container.appendChild(renderPlanesTab())` 分支
3. 位面子标签内容是否调用 `render/plane.js`（新建文件）还是直接内联？需要明确

这不是风险，但实施时容易被遗漏，建议在 `MODIFY_PLANE_SYSTEM.md` 里明确指出。

---

## 六、内容规模评估

设计文档第六节估算了内容规模：5角色 × 5阶段 × ~4任务 = ~100条任务，加上双向信函文本 = ~200条文本。

**这是一个不小的创作量。**架构建议：

1. **Phase 2 不要批量创作**，按角色按阶段创作，每写完一个角色的一个阶段就部署测试
2. **信函文本建议单独提取**为常量对象，不要内联在任务定义里：
```js
// 不推荐（都在一个文件）
PASTORAL_TASKS = [{ ..., letterOffer: { body: '...' } }]

// 推荐（文本独立）
PASTORAL_LETTERS = {
  'child_s1_t1_offer': { greeting: '亲爱的馆长', body: '...' },
  'child_s1_t1_complete': { body: '...' }
}
```
这样后期修改文本不用碰任务逻辑代码，**降低改错的风险**。

---

## 七、修复优先级汇总

按"必须实施前修复 / 建议修复 / 可推迟"三档：

### 🔴 必须在 Phase 1 开始前修复

| # | 问题 | 涉及文件 |
|---|------|----------|
| 1 | state.quests.pastoral 字段与设计文档对齐 | state.js |
| 2 | initState() 添加新字段迁移补丁 | state.js |
| 3 | visitors.js 不改造，改为在 quests.js 中建立独立位面访客队列 | 架构决策 |

### 🟡 建议在 Phase 1 期间修复

| # | 问题 | 涉及文件 |
|---|------|----------|
| 4 | planes.js characters 补充 unlockStage 字段 | data/planes.js |
| 5 | mementos 的字段名统一（stage vs unlockStage） | data/planes.js |
| 6 | shop.js 传送门购买后明确设置 planePortals key | js/shop.js |
| 7 | Stage 推进加防重入标记 | js/quests.js |
| 8 | copy_chapter 任务判定逻辑明确（方案A宽松） | js/quests.js |

### 🟢 可推迟到 Phase 2 或按需处理

| # | 问题 | 涉及文件 |
|---|------|----------|
| 9 | pendingComplete 三个 edge case 的处理策略 | 设计文档补充 |
| 10 | 信函文本独立为常量对象 | data/quests/ |

---

## 八、一个补充设计建议

读完整个设计，有一个值得加入的小功能点：

> **位面解锁前的"占位展示"增加窥探感**

目前 UI 设计中未解锁位面只是"🔒 ？？？"的灰度占位，可以升级为：
- 随机显示一条来自该位面的"碎片线索"（如一张破损的信件角落、一个奇怪的词语）
- 当氛围值/书籍数量接近解锁条件时，线索变得更清晰

这个功能完全不需要改动核心逻辑，只需要在 planes.js 里给每个位面加几条 `hints: []` 静态文字，在 render/plane.js 的占位卡片里根据玩家进度显示不同数量的线索。**投入极小，但能大幅增加探索欲。**

---

## 九、总结

**位面系统的叙事设计是这个项目迄今为止最有深度的一个设计文档**——五线并行群像、信函交互不打断专注、访客即信使的机制，都与游戏核心调性高度契合。

主要风险集中在**数据层字段不一致**和**访客系统扩写边界**这两块。按照本报告的修复优先级清单，从 state.js 的字段对齐和迁移补丁开始，然后明确位面访客队列独立于普通访客，Phase 1 就可以安全启动。

> **建议行动**：将本报告的「必须修复」清单（共 3 项）转化为 `MODIFY_PLANE_SYSTEM.md` 的开头"前置准备"章节，在 Phase 1 框架搭建时一并处理。

---

*本报告由 WorkBuddy AI 基于对 PLANE_SYSTEM_DESIGN.md、state.js、visitors.js、app.js、data/planes.js、js/render/archive.js 的完整阅读生成。*
