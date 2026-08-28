# 归墟图书馆神模块拆分完整实施计划（剩余 Phase 2/4/5）

> 文档状态：Phase 1/3 已落地归档；本文件只记录剩余未实施的 Phase 2 商店业务、Phase 4 渲染拆分、Phase 5 app.js 最终瘦身。

---

## 一、背景与问题

当前代码存在几个「神模块」（God Module）：

| 文件 | 行数 | 当前职责 | 主要问题 |
|---|---|---|---|
| `js/state.js` | 687 | 状态 schema + 旧存档迁移 + 保存 | 迁移逻辑（≈350 行）与状态 schema 混在一起；任何新增字段都改这里 |
| `js/app.js` | 1487 | 应用入口 + 专注生命周期 + 弹窗链 + 页面切换 + 全局事件 | 典型的 God Module；专注、访客、教程、里程碑、崩溃恢复全在这里 |
| `js/shop.js` | 335 | 商店业务逻辑：书籍、升级、传送门、标志牌 | 多种购买逻辑耦合；注释说「不碰 DOM」但职责仍杂 |
| `js/render/focus.js` | 899 | 缮写室页面渲染 + 结算卡片 + 休息行动卡 | 渲染文件过大，包含业务状态修改（如切换书籍直接改 state） |
| `js/render/shop.js` | 917 | 位面商店所有渲染 | 混合了图书馆升级、新书、环境音、装饰、命名弹窗 |

### 共性症状

- **修改恐惧**：加一个功能要同时改 3-5 个文件，且集中在 `app.js`
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
    focus-orchestrator.js # 专注完成后副作用链（弹窗、访客、成就）
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
      purchase-modal.js
    shared/           # 跨页面弹窗/卡片
      visitor-cards.js
      milestone-card.js
      repair-card.js
      action-cards.js

  app.js              # 只保留：启动顺序、全局事件监听、模块组装
```

---

## 四、Phase 1：状态层拆分（低风险，约 0.5-1 天）

✅ **已完成并归档**，详见 `docs/archive/plans/god-module-split-full-implementation-plan-completed.md`。

当前状态：`js/state/state.js`、`js/state/migrations.js`、`js/state/save.js` 已拆分；`js/state.js` 为薄 shim；旧存档迁移正确。

---

## 五、Phase 2：商店业务拆分（中低风险，约 2 天）

### 5.1 目标

把 `js/shop.js` 拆到 `js/core/shop/*.js`，每个文件负责一类购买逻辑。`js/shop.js` 变成纯转发文件（向后兼容）。

### 5.2 文件映射

| 原函数 | 新位置 |
|---|---|
| `purchaseBook` / `getBookActualPrice` / `getActivePeizhouRec` / `ensureShopState` / `getShopState` | `js/core/shop/book-shop.js` |
| `upgradeBorrowLevel` / `getBorrowLevelPrice` | `js/core/shop/library-upgrades.js` |
| `upgradeFocusLevel` / `getFocusLevelPrice` / `getFocusSpeedMultiplier` | `js/core/shop/library-upgrades.js` |
| `purchasePlanePortal` / `getPlanePortalPrice` | `js/core/shop/plane-portals.js` |
| `purchaseSignboard` / `hasSignboard` / `getSignboardSpeedBonus` | `js/core/shop/signboards.js` |

注意：`js/core/economy.js` 已有参数化版本的 `getFocusSpeedMultiplier` / `hasSignboard`，本阶段评估是否替换调用。

### 5.3 关键动作

1. 创建 `js/core/shop/book-shop.js`
   - 负责书籍刷新、价格计算、购买、Peizhou 推荐
2. 创建 `js/core/shop/library-upgrades.js`
   - 负责借阅区/缮写室升级和价格
3. 创建 `js/core/shop/plane-portals.js`
   - 负责传送门购买
4. 创建 `js/core/shop/signboards.js`
   - 负责标志牌购买和查询
5. 改写 `js/shop.js` 为转发文件
   - 重新导出上述模块的函数，保持所有旧导入路径可用

### 5.4 验证

- `node --check` 全部通过
- 购买书籍、升级借阅区、升级缮写室、购买传送门、购买标志牌全部正常
- 旧存档中的 `planePortals`、`signboards` 数据正确加载

---

## 六、Phase 3：专注业务拆分（中风险，约 2-3 天）

✅ **已完成并归档**，详见 `docs/archive/plans/god-module-split-full-implementation-plan-completed.md`。

当前状态：`js/core/focus-session.js`、`js/core/focus-rewards.js`、`js/core/focus-orchestrator.js` 已创建；专注生命周期及完成后副作用链已迁出 `app.js`。

---

## 七、Phase 4：渲染拆分（中风险，约 3 天）

### 7.1 目标

- 拆分 `js/render/focus.js` → `js/render/focus/*.js`
- 拆分 `js/render/shop.js` → `js/render/shop/*.js`
- 把通用弹窗/卡片抽到 `js/render/shared/`
- 确保 `render/focus/*.js` 不再直接修改 `state`

### 7.2 `js/render/focus.js` 拆分映射

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

### 7.3 `js/render/shop.js` 拆分映射

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

### 7.4 消除 render 层直接改 state

当前发现的问题：
- `js/render/focus.js:228,230,252,257`：直接改 `state.currentSession.mode` / `targetMinutes`
- `js/render/focus.js:306`：直接改 `state.currentSession.bookId`
- `js/render/shop.js:622-624`：命名弹窗直接改 `state.library.name` / `nameLocked`
- `js/render/bookshelf.js:488,503-504,506`：直接改 `bookState.reCopyUnlocked`、`state.currentSession.bookId`
- `js/render/achievements.js:69-89`：直接改 `state.momoCommentUsedToday`

改造后：
- render 文件读取 `state`
- 用户交互调用 `actions.*` 或新 core API
- core 模块修改 `state` 并调用 `saveState()`

### 7.5 验证

- 所有页面渲染正常
- 模式切换、书籍选择、命名弹窗、重抄解锁等交互无回归
- 控制台无直接改 state 的异常（可用静态扫描 `state\.\w+\s*=` in `js/render/`）

---

## 八、Phase 5：`app.js` 最终瘦身（低风险，约 1 天）

### 8.1 目标

把 `js/app.js` 中剩余的弹窗、卡片、辅助函数迁出，只保留启动顺序和全局事件。

### 8.2 `app.js` 保留内容

- `init()` 启动顺序
- 全局错误监听 / 崩溃恢复面板
- `switchTab`（或移到 `js/navigation.js`）
- 模块初始化调用（`initAudio`, `initMusicSelector`, `initState`, ...）
- 访客循环 `tickVisitors`

### 8.3 `app.js` 迁出内容

| 内容 | 目标位置 |
|---|---|
| `showFirstVisitorEvent` | `js/render/shared/visitor-cards.js` |
| 里程碑弹窗 | `js/render/shared/milestone-card.js` |
| 墨墨提示卡片 | `js/render/shared/momo-cards.js` |
| 引导任务相关弹窗 | `js/render/shared/guide-cards.js` |
| `handleBuyShelf` / `handleCollectReturn` / `handleUpgradeBorrowLevel` | 相应的 core 模块 |

### 8.4 验证

- `js/app.js` 行数 < 400
- 全局错误兜底、加载流程、页面切换正常
- 游客循环、访客事件正常触发

---

## 九、数据流改造

### 9.1 当前问题

```
render/focus.js 直接修改 state.currentSession.bookId
app.js 直接修改 state.books / state.focus / state.library
```

### 9.2 目标数据流

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

### 9.3 actions 重构

当前 `actions` 对象在 `js/render/common.js` 中定义，由 `js/app.js` 通过 `setActions()` 注入。

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

## 十、时间估算（剩余 Phase）

| Phase | 天数 |
|---|---|
| Phase 2 商店业务拆分 | 2 |
| Phase 4 渲染拆分 | 3 |
| Phase 5 app.js 瘦身 | 1 |
| **总计** | **6 天** |

---

## 十一、建议实施顺序（剩余 Phase）

1. **Phase 2（商店业务）**：业务边界清晰，不容易出大错
2. **Phase 4（渲染拆分）**：依赖 Phase 2 的 actions 稳定
3. **Phase 5（app.js 瘦身）**：收尾

---

## 十二、验收标准（剩余 Phase）

- [ ] `js/app.js` 行数 < 400，只含启动和全局事件
- [ ] `js/shop.js` 消失或变成纯转发文件
- [ ] `js/render/focus.js` 和 `js/render/shop.js` 消失或大幅瘦身
- [ ] `node --check` 全部通过
- [ ] 专注、购买、访客、教程、成就等核心流程手动测试无回归
- [ ] 旧存档启动后数据正确（重点测长书分卷、访客好感度、植物状态）

---

## 十三、风险与回滚

| 风险 | 应对 |
|---|---|
| 重构引入 bug | 每 Phase 结束都运行完整手动测试；保留 `git tag` |
| 旧存档迁移被破坏 | Phase 1 先单独验证迁移逻辑；准备旧存档样本 |
| 性能下降（模块过多） | 使用原生 ES Module，浏览器会按需加载；如担心可合并过小模块 |
| 循环依赖 | 拆分后定期检查 `node --check` 和浏览器控制台 |
| 渲染层仍直接改 state | Code Review 时重点检查；可写脚本扫描 `state\.\w+\s*=` in `js/render/` |

---

## 十四、相关文件

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
- `docs/plans/god-module-split-plan.md`（原始方案）

---

*计划撰写：克克 | 2026-08-11 | 待图南与架构师审核后实施*
