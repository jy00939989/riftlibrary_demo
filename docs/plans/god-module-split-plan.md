# 归墟图书馆神模块拆分计划

> 针对 7 月总结遗留项：state.js / app.js / focus.js / shop.js 的职责过重问题。
> 目标：把「什么都管」的 God Module 拆成边界清晰、可独立理解的小模块，降低后续功能迭代和排查 bug 的成本。

---

## 一、现状诊断

### 1.1 问题文件

| 文件 | 行数 | 当前职责 | 主要问题 |
|---|---|---|---|
| `js/state.js` | 687 | 定义整个应用状态 + 旧存档迁移 + 保存 | 迁移逻辑（≈350 行）与状态 schema 混在一起；任何新增字段都改这里 |
| `js/app.js` | 1487 | 应用入口 + 专注生命周期 + 弹窗链 + 页面切换 + 全局事件 | 典型的 God Module；专注、访客、教程、里程碑、崩溃恢复全在这里 |
| `js/shop.js` | 335 | 商店业务逻辑：书籍、升级、传送门、标志牌 | 多种购买逻辑耦合；注释说「不碰 DOM」但职责仍杂 |
| `js/render/focus.js` | 899 | 缮写室页面渲染 + 结算卡片 + 休息行动卡 | 渲染文件过大，包含业务状态修改（如切换书籍直接改 state） |
| `js/render/shop.js` | 917 | 位面商店所有渲染 | 混合了图书馆升级、新书、环境音、装饰、命名弹窗 |

### 1.2 共性症状

- **修改恐惧**：加一个功能要同时改 3-5 个文件，且集中在 app.js
- **测试困难**：函数互相依赖，无法单独验证专注逻辑或商店逻辑
- **阅读成本高**：新接触代码的人难以定位「完成一次专注到底发生了什么」
- **重复逻辑**：价格计算、渲染辅助在不同文件重复出现

---

## 二、拆分目标

1. **单一职责**：每个模块只负责一件事
2. **状态拥有者唯一**：状态修改集中在业务 core 模块，渲染只读
3. **渲染无状态副作用**：render 文件不直接修改 `state`，只通过 actions/core API 触发
4. **迁移可维护**：旧存档迁移独立，新增迁移只需改一个文件
5. **渐进式重构**：不一次性大爆炸，按功能逐步迁移，保持游戏可运行

---

## 三、目标架构

```
js/
  state/
    state.js          # 状态 schema 定义（纯数据，无迁移）
    migrations.js     # 所有旧存档迁移逻辑
    save.js           # saveState / 序列化策略

  core/               # 业务逻辑（状态拥有者）
    focus-session.js  # 专注开始/暂停/完成/放弃
    focus-rewards.js  # 字数、金币、灵感、里程碑计算
    book-progress.js  # 书籍进度、章节解锁
    shop/             # 商店业务拆分子目录
      book-shop.js
      library-upgrades.js
      plane-portals.js
      signboards.js
    visitors/         # 访客系统（后续可拆）
    economy.js        # 金币/氛围/灵感通用操作

  render/             # 纯渲染
    focus/            # 缮写室渲染拆分子目录
      page.js
      mode-selector.js
      book-selector.js
      timer-display.js
      progress-bar.js
      completion-card.js
      copy-preview.js
    shop/             # 商店渲染拆分子目录
      page.js
      library-upgrades.js
      book-section.js
      ambient-shop.js
      decorations.js
      naming-modal.js
    shared/           # 跨页面弹窗/卡片
      visitor-cards.js
      milestone-card.js
      repair-card.js
      action-cards.js

  app.js              # 只保留：启动顺序、全局事件监听、模块组装
```

---

## 四、模块边界

### 4.1 `js/state/state.js`

**只保留**：
- `export const state = { ... }` 初始状态定义
- `DEFAULT_BOOKS` 等默认值

**移除**：
- `initState()` 中的迁移逻辑 → 移到 `js/state/migrations.js`
- `saveState()` → 移到 `js/state/save.js`
- `ensureAllBooksInManuscriptBox()` → 移到 `js/core/book-progress.js`

### 4.2 `js/state/migrations.js`

**职责**：
- 接收一个 raw save object
- 按版本号/字段检测依次执行迁移
- 返回规范化后的 state

**迁移策略**：
- 给每次「破坏式」状态变更分配版本号
- 迁移函数按版本顺序执行
- 迁移完成后在 state 中写入 `_schemaVersion`

```js
// js/state/migrations.js
export const MIGRATIONS = [
  { version: 1, migrate: migrateV0ToV1 },  // 旧版 4 人 → 10 人访客
  { version: 2, migrate: migrateV1ToV2 },  // shelves 数字格式 → 位置格式
  { version: 3, migrate: migrateV2ToV3 },  // 长书分卷
  // ...
];

export function runMigrations(raw) {
  let version = raw._schemaVersion || 0;
  for (const m of MIGRATIONS) {
    if (version < m.version) {
      raw = m.migrate(raw);
      raw._schemaVersion = m.version;
    }
  }
  return raw;
}
```

### 4.3 `js/core/focus-session.js`

**职责**：
- `startFocus(bookId, mode, targetMinutes)`
- `pauseFocus()` / `resumeFocus()`
- `completeFocus()`
- `abandonFocus()`
- 管理 `state.currentSession`

**原则**：
- 只修改 `state.currentSession` 和触发计时器
- 不直接操作弹窗、不渲染 DOM
- 完成时返回一个「结果对象」，由 app.js 或弹窗模块消费

### 4.4 `js/core/focus-rewards.js`

**职责**：
- 根据专注时长计算 `wordsGained`
- 计算 `coinsEarned`
- 检测里程碑
- 应用 buff（茶、烛台、沙漏、光环等）

**输入**：session 信息（分钟、bookId、是否茶 boost 等）
**输出**：奖励明细对象

```js
export function calculateFocusRewards({ minutes, bookId, teaBoost, candleInspiration }) {
  // 返回 { wordsGained, coinsEarned, inspirations, milestones, repairProgress, ... }
}
```

### 4.5 `js/core/book-progress.js`

**职责**：
- `applyWords(bookId, words)`
- `unlockChapters(bookId)`
- `completeBook(bookId)`
- `ensureAllBooksInManuscriptBox()`
- 处理手稿箱 → 书架移动

### 4.6 `js/shop.js` → `js/core/shop/*.js`

| 原函数 | 新位置 |
|---|---|
| `purchaseBook` | `js/core/shop/book-shop.js` |
| `upgradeBorrowLevel` | `js/core/shop/library-upgrades.js` |
| `upgradeFocusLevel` | `js/core/shop/library-upgrades.js` |
| `purchasePlanePortal` | `js/core/shop/plane-portals.js` |
| `purchaseSignboard` | `js/core/shop/signboards.js` |
| `getFocusSpeedMultiplier` | `js/core/economy.js` 或 `js/core/shop/library-upgrades.js` |
| `ensureShopState` / `getShopState` | `js/core/shop/book-shop.js`（商店刷新逻辑） |

### 4.7 `js/render/focus.js` → `js/render/focus/*.js`

| 原函数 | 新位置 |
|---|---|
| `renderFocusPage` | `js/render/focus/page.js` |
| `renderModeSelector` | `js/render/focus/mode-selector.js` |
| `renderBookSelector` | `js/render/focus/book-selector.js` |
| `renderTimerOrAnimation` | `js/render/focus/timer-display.js` |
| `renderBookProgress` / 进度更新 | `js/render/focus/progress-bar.js` |
| `showCompletionCard` | `js/render/focus/completion-card.js` |
| `renderCopyPreview` | `js/render/focus/copy-preview.js` |
| `showActionCards` | `js/render/shared/action-cards.js` |
| `MOMO_REVIEWS` / `getMomoReview` | `js/data/momo-reviews.js` |

**重要约束**：
- `render/focus/*.js` 只读取 `state`，不直接修改
- 用户选择书籍时，调用 `actions.selectBook(bookId)`，由 `core/focus-session.js` 修改 state

### 4.8 `js/render/shop.js` → `js/render/shop/*.js`

| 原函数 | 新位置 |
|---|---|
| `renderShopPage` | `js/render/shop/page.js` |
| `renderLibraryUpgrades` | `js/render/shop/library-upgrades.js` |
| `renderBookSection` / `renderBookCard` | `js/render/shop/book-section.js` |
| `renderAmbientShop` | `js/render/shop/ambient-shop.js` |
| `renderDecorationShop` | `js/render/shop/decorations.js` |
| `showNamingModal` | `js/render/shop/naming-modal.js` |
| `showPurchaseModal` | `js/render/shop/purchase-modal.js` |
| `formatCountdown` / `updateCountdowns` | `js/render/shop/countdown.js` |

### 4.9 `js/app.js` 瘦身

**保留**：
- `init()` 启动顺序
- 全局错误监听 / 崩溃恢复面板
- `switchTab`（或移到 `js/navigation.js`）
- 模块初始化调用（`initAudio`, `initMusicSelector`, `initState`, ...）
- 访客循环 `tickVisitors`

**迁出**：
- `handleStartFocus` / `handleCompleteFocus` / `handleAbandonFocus` → `js/core/focus-session.js`
- 专注完成后的弹窗链 → `js/render/shared/` 或 `js/core/focus-orchestrator.js`
- 首个访客事件 → `js/render/shared/visitor-cards.js`
- 里程碑逻辑 → `js/core/milestones.js` + `js/render/shared/milestone-card.js`
- 墨墨提示卡片 → `js/render/shared/momo-cards.js`

**可选新增**：`js/core/focus-orchestrator.js`

协调专注完成后的副作用链：
1. 调用 `focusRewards.calculate()`
2. 应用奖励
3. 触发成就检测
4. 按顺序调度弹窗（修复完成 → 书籍完成 → 章节解锁 → 里程碑 → 结算卡片）
5. 触发访客到来
6. 触发引导任务

---

## 五、分阶段重构步骤

### Phase 1：状态层拆分（低风险，约 1-2 天）

1. 创建 `js/state/migrations.js`，把 `state.js` 中的迁移逻辑原样迁移
2. 创建 `js/state/save.js`，把 `saveState()` 迁过去
3. `js/state.js` 只保留状态定义 + 重新导出 `initState`/`saveState`
4. 验证：`node --check` 通过 + 游戏能正常启动 + 旧存档能正确迁移

### Phase 2：商店业务拆分（中低风险，约 2 天）

1. 创建 `js/core/shop/book-shop.js`、`library-upgrades.js`、`plane-portals.js`、`signboards.js`
2. 从 `js/shop.js` 按函数迁移，保持导出签名不变
3. `js/shop.js` 变成纯转发文件（向后兼容）
4. 验证：购买书籍、升级、传送门、标志牌全部正常

### Phase 3：专注业务拆分（中风险，约 2-3 天）

1. 创建 `js/core/focus-session.js` 和 `js/core/focus-rewards.js`
2. 把 `app.js` 中的 `handleStartFocus` / `handleCompleteFocus` / `handleAbandonFocus` 逐步迁移
3. 创建 `js/core/focus-orchestrator.js` 处理完成后的副作用链
4. `app.js` 中的 `setActions` 改为引用新 core 模块
5. 验证：专注开始、暂停、完成、放弃、弹窗链全部正常

### Phase 4：渲染拆分（中风险，约 3 天）

1. 拆分 `js/render/focus.js` → `js/render/focus/*.js`
2. 拆分 `js/render/shop.js` → `js/render/shop/*.js`
3. 把通用弹窗/卡片抽到 `js/render/shared/`
4. 确保 `render/focus/*.js` 不再直接修改 `state`
5. 验证：所有页面渲染正常，交互无回归

### Phase 5：app.js 最终瘦身（低风险，约 1 天）

1. 把剩余的弹窗、卡片、辅助函数迁出
2. `app.js` 保留启动顺序和全局事件
3. 创建 `js/bootstrap.js` 或 `js/app.js` 彻底清晰
4. 验证：全局错误兜底、加载流程、页面切换正常

---

## 六、数据流改造

### 6.1 当前问题

```
render/focus.js 直接修改 state.currentSession.bookId
app.js 直接修改 state.books / state.focus / state.library
```

### 6.2 目标数据流

```
UI Event
  ↓
render/*.js 捕获事件
  ↓
调用 actions / core API
  ↓
core/*.js 修改 state
  ↓
core/*.js 调用 saveState()
  ↓
render 响应 state 变化重新渲染
```

### 6.3 actions 重构

当前 `actions` 对象在 `app.js` 中设置：

```js
setActions({
  startFocus: handleStartFocus,
  togglePause: handleTogglePause,
  // ...
});
```

改造后：

```js
// js/actions.js
import { startFocus, togglePause, completeFocus, abandonFocus } from './core/focus-session.js';
import { buyShelf, collectReturn, upgradeBorrowLevel } from './core/shop/...';

export const actions = {
  startFocus,
  togglePause,
  completeFocus,
  abandonFocus,
  buyShelf,
  collectReturn,
  upgradeBorrowLevel,
  // ...
};
```

`app.js` 不再 `setActions`，渲染层直接导入 `actions`。

---

## 七、风险与回滚

| 风险 | 应对 |
|---|---|
| 重构引入 bug | 每 Phase 结束都运行完整手动测试；保留 `git tag` |
| 旧存档迁移被破坏 | Phase 1 先单独验证迁移逻辑；准备旧存档样本 |
| 性能下降（模块过多） | 使用原生 ES Module，浏览器会按需加载；如担心可合并过小模块 |
| 循环依赖 | 拆分后定期检查 `node --check` 和浏览器控制台 |
| 渲染层仍直接改 state | Code Review 时重点检查；可写脚本扫描 `state\.\w+\s*= ` 在 render 目录的出现 |

---

## 八、验收标准

- [ ] `js/state.js` 行数 < 200，只含状态定义
- [ ] `js/app.js` 行数 < 400，只含启动和全局事件
- [ ] `js/shop.js` 消失或变成纯转发文件
- [ ] `js/render/focus.js` 和 `js/render/shop.js` 消失或大幅瘦身
- [ ] `node --check` 全部通过
- [ ] 专注、购买、访客、教程、成就等核心流程手动测试无回归
- [ ] 旧存档启动后数据正确（重点测长书分卷、访客好感度、植物状态）

---

## 九、时间估算

| Phase | 天数 |
|---|---|
| Phase 1 状态层拆分 | 1-2 |
| Phase 2 商店业务拆分 | 2 |
| Phase 3 专注业务拆分 | 2-3 |
| Phase 4 渲染拆分 | 3 |
| Phase 5 app.js 瘦身 | 1 |
| **总计** | **9-11 天** |

---

## 十、建议实施顺序

1. **先做 Phase 1（状态层）**：风险最低，为后续所有拆分打基础
2. **再做 Phase 2（商店业务）**：业务边界清晰，不容易出大错
3. **Phase 3 + Phase 4 可以交错**：但建议先拆 focus 业务，再拆 focus 渲染
4. **Phase 5 最后收尾**

> 如果时间有限，可以只做 Phase 1 + Phase 3，先把 `state.js` 和 `app.js` 中最痛的专注逻辑拆出来，收益最大。

---

## 十一、相关文件

- `js/state.js`
- `js/app.js`
- `js/shop.js`
- `js/render/focus.js`
- `js/render/shop.js`
- `js/persistence.js`
- `js/timer.js`
- `js/storage.js`
- `js/capacity.js`
- `js/visitors.js`
- `js/achievements.js`
