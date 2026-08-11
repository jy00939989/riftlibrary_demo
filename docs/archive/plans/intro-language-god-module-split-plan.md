# 实施计划：开场语言选择框 + 神模块拆分

> 计划生成时间：2026-07-29
> 关联项目：归墟图书馆 / Rift Library

---

## 第一部分：开场语言选择框

### 目标
玩家首次进入游戏、看完开场动画之前，先弹出语言选择框，选完语言再进入开场动画和主界面。

### 核心原则
- 只弹一次，选完后持久化标记。
- 不刷新页面：`t()` 动态读取 locale，设置后即可生效。
- 复用现有 `makeOverlay()` 弹窗样式（parchment-bg + magic-gold CTA）。
- 先完成 `intro.js` 英文化，否则开场动画仍是中文，语言选择框意义打折。

### 新建文件

`js/language-selector.js`
- 导出 `showLanguageSelector(onSelected)`。
- 渲染居中语言选择卡片：中文 / English 两个大按钮。
- 调用 `setLocale(value)`、`setSetting('localeSelected', true)`。
- 设置 `document.documentElement.lang`。
- 点击“进入图书馆”后调用 `onSelected()`。

### 修改文件

`js/settings.js`
- `DEFAULT_SETTINGS` 增加 `localeSelected: false`。
- 旧存档迁移：如果用户已有 `locale` 设置，可视为已选择过语言。

`js/i18n/terms.js`
- 新增术语：
  - `languageSelectorTitle`
  - `languageSelectorSubtitle`
  - `languageOptionZh`
  - `languageOptionEn`
  - `enterLibrary`

`js/render/tutorial-ui.js`
- `makeOverlay()` 支持可选 `opts.zIndexClass`，让语言选择框可以覆盖在 loading 层之上（如 `z-[1000]`）。

`js/app.js`
- 把 `init()` 里 intro 之后的流程拆成 `startMainFlow()`。
- 在 `localizeStaticElements()` 之后判断：
  - 若 `!getSettings().localeSelected`，调用 `showLanguageSelector(...)`，在回调里重新 `localizeStaticElements()` 并 `startMainFlow()`。
  - 否则直接 `startMainFlow()`。
- `startMainFlow()` 内部保持现有 intro 调用逻辑。

`index.html`
- 无需新增静态 markup，弹窗动态创建。

### 测试点
1. `node --check js/language-selector.js js/app.js js/settings.js js/render/tutorial-ui.js`
2. 浏览器清空 localStorage 后刷新：
   - 确认语言选择框在 loading 后出现、在开场动画前出现。
   - 切换 English，确认静态文案和开场卡片都变英文。
   - 再次刷新，确认不再弹出。

### 风险与优先级
- 优先级：P0（小功能，高体验价值）。
- 风险：低。

---

## 第二部分：神模块拆分

### 总体策略
- 一次只拆一个模块，每步都跑 `node --check` + 浏览器 smoke test。
- 先打破真实循环依赖，再做其他拆分。
- 整个过程中保持 `js/app.js` 可运行，最后才把它压成入口文件。

### 真实循环依赖：timer.js → render/index.js → render/focus.js → timer.js

解决方案：把 `isMomoAccelerating` 状态从 `timer.js` 迁到新的 `js/core/focus-session.js`。
- `timer.js` 设置状态时 import `core/focus-session.js`。
- `render/focus.js` 读取状态时也从 `core/focus-session.js` 读取。
- 循环被打破。

---

### 分阶段实施表

| 阶段 | 内容 | 新建文件 | 修改文件 |
|---|---|---|---|
| 1 | 打破 timer 循环 | `js/core/focus-session.js` | `js/timer.js`, `js/render/focus.js` |
| 2 | 拆分 state.js | `js/state/defaults.js`, `js/state/migrations.js` | `js/state.js` |
| 3 | 提取崩溃恢复 | `js/crash-recovery.js` | `js/app.js` |
| 4 | 提取里程碑 | `js/core/milestones.js` | `js/app.js` |
| 5 | 提取访客事件/卡片 | `js/core/visitor-events.js`, `js/render/visitor-cards.js` | `js/app.js` |
| 6 | 提取教程链 | `js/core/tutorial-chain.js` | `js/app.js` |
| 7 | 提取 actions + 完善 focus session | `js/actions.js`（扩展 `js/core/focus-session.js`） | `js/app.js` |
| 8 | 提取 bootstrap | `js/bootstrap.js` | `js/app.js` |
| 9 | 拆分 shop 控制器 | `js/shop-controller.js` | `js/render/shop.js` |

---

### 阶段 1：打破 timer 循环

新建 `js/core/focus-session.js`：
- `let momoAccelerating = false`
- `isMomoAccelerating()` / `setMomoAccelerating(value)`
- 可选初版：`selectFocusMode(mode, target)`、`selectBook(bookId)`

修改：
- `js/timer.js`：移除本地 `momoAccelerating`，改为 import `setMomoAccelerating`。
- `js/render/focus.js`：`import { isMomoAccelerating } from '../core/focus-session.js'`。

测试：开始首次专注，确认墨墨加速提示正常出现。

---

### 阶段 2：拆分 state.js

新建：
- `js/state/defaults.js`：
  - `DEFAULT_STATE`（当前 `state` 对象字面量）
  - `DEFAULT_BOOKS`
  - `createDefaultState()` 返回深拷贝
- `js/state/migrations.js`：
  - `runStateMigrations(savedState)` 包含当前 `initState()` 里的所有迁移逻辑
  - 返回布尔值表示是否有迁移发生

修改：
- `js/state.js`：
  - 保留 `export const state = createDefaultState()`
  - 保留 `initState()`、`saveState()`、`ensureAllBooksInManuscriptBox()`
  - `initState()` 把迁移工作委托给 `runStateMigrations()`

测试：
- 清空存档刷新，确认默认值正确。
- 导入旧存档，确认迁移仍然生效。

---

### 阶段 3：提取崩溃恢复

新建 `js/crash-recovery.js`：
- `showCrashRecovery(message, file, line)`
- `hideLoadingScreen()`

修改 `js/app.js`：
- 移除上述两个函数，改为 import。

测试：正常加载，loading 屏幕正常隐藏。

---

### 阶段 4：提取里程碑

新建 `js/core/milestones.js`：
- `MILESTONES` 数组
- `getNextMilestone(totalWords)`
- `checkMilestones(prevWords, newWords)`
- `showMilestoneReward(milestones, callback)`（DOM 弹窗）

修改 `js/app.js`：
- 移除相关函数，改为 import。
- `handleCompleteFocus` 调用导入的里程碑函数。

测试：完成一次跨越 5 万字阈值的专注，确认里程碑弹窗弹出。

---

### 阶段 5：提取访客事件 UI

新建：
- `js/render/visitor-cards.js`：
  - `showFirstVisitorEventCard(visitor, onComplete)`
  - `showMomoShabbyLibraryCard()`
  - `showMomoBorrowReadyCard()`
  - `showVisitorArrivalCard(visitor)`
  - `showWitnessToast(witnesses, stage)`
- `js/core/visitor-events.js`：
  - `runFirstVisitorEvent(visitor)`：移除访客、设置 flag、保存、触发卡片链

修改 `js/app.js`：
- 移除 5 个卡片函数和 `showFirstVisitorEvent`。
- 改为 import 并调用 `runFirstVisitorEvent` / 卡片函数。

测试：触发首次访客事件，确认叙事流程完整。

---

### 阶段 6：提取教程链

新建 `js/core/tutorial-chain.js`：
- `handlePostFocusEffects(effects, callbacks)`
- `tryShowActionCards(minutes)`
- `checkAndShowPostFocusTutorials()`
- `showAtmoStageChain(queue, callback)`
- `checkAndShowFocusCompleteTutorial()`

注意：通过 `callbacks = { showAchievementBatch, triggerQuestCheck }` 参数传入，避免 `tutorial-chain.js` import `actions.js` 造成循环。

修改 `js/app.js`：
- 移除上述函数，改为 import 并传入 callbacks。

测试：完成专注，确认完整弹窗链（解锁 / 完成 / 里程碑 / 完成卡 / 行动卡）都正常。

---

### 阶段 7：提取 actions + 完善 focus session

新建 `js/actions.js`：
- 定义全局 handler：
  - `handleStartFocus`
  - `handleTogglePause`
  - `handleCompleteFocus`
  - `handleAbandonFocus`
  - `handleBuyShelf`
  - `handleCollectReturn`
  - `handleUpgradeBorrowLevel`
- import `setActions`  from `render/common.js` 并注册。
- 在模块加载时调用 `setCompleteCallback(handleCompleteFocus)`。

扩展 `js/core/focus-session.js`：
- 增加 `selectFocusMode(mode, target)`、`selectBook(bookId)`、`setNewUserDefaults()` 等共享状态变更函数。

修改 `js/app.js`：
- 移除所有 handler 定义。

测试清单：
- 开始 / 暂停 / 完成 / 放弃专注
- 购买书架
- 收取访客还书
- 升级借阅区
- 确认 `actions.startFocus` 仍能从缮写页正常调用

---

### 阶段 8：提取 bootstrap

新建 `js/bootstrap.js`：
- 完整的 `init()` 启动流程：
  - loading 进度
  - 崩溃恢复监听
  - 音频激活
  - persistence / settings / state 初始化
  - 书籍迁移
  - tab 按钮绑定
  - `window.switchTab`
  - `localizeStaticElements`
  - 访客 tick
  - intro / 成就 / loading 隐藏

修改 `js/app.js`：
- 缩减为：
  ```js
  if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    console.log = () => {};
    console.warn = () => {};
  }
  import './actions.js';
  import { init } from './bootstrap.js';
  init();
  ```

测试：完整冷启动 → intro → 标签切换 → 首次专注 → 刷新。

---

### 阶段 9：拆分 shop 控制器

新建 `js/shop-controller.js`：
- `showPurchaseModal(poolEntry, price, originalPrice, discount)`
- `showNamingModal()`

修改 `js/render/shop.js`：
- 移除上述两个函数。
- 从 `js/shop-controller.js` import。
- 保留 `renderShopPage`、卡片构建、倒计时等纯渲染逻辑。

测试：
- 购买固定区和轮换区的书
- 确认智慧之光不足报错路径
- 通过空白铭牌给图书馆命名
- 确认倒计时仍在更新而不重建 DOM

---

## 防循环依赖规则

1. `render/focus.js` 从 `core/focus-session.js` 读取 `isMomoAccelerating`，不再 import `timer.js`。
2. `actions.js` 可以 import render 模块；render 模块只通过 `render/common.js` 的 `actions` 对象调用，不直接 import `actions.js`。
3. `tutorial-chain.js` 通过参数接收 achievement/quest callbacks，不直接 import `actions.js`。
4. 没有任何新模块 import `js/app.js`；`app.js` 最终变成叶子入口。

---

## 通用测试命令

每次阶段后：
```bash
node --check js/app.js js/bootstrap.js js/actions.js \
  js/core/focus-session.js js/core/milestones.js \
  js/core/tutorial-chain.js js/core/visitor-events.js \
  js/render/visitor-cards.js js/shop-controller.js \
  js/crash-recovery.js js/state.js js/state/defaults.js \
  js/state/migrations.js js/language-selector.js
```

浏览器 smoke test：
```bash
npx serve . -p 8080
# open http://localhost:8080
```

手动清单：
- 清空 localStorage 后冷启动
- loading → 语言选择框（首次）→ 开场动画
- 静态文案随语言切换
- 开始 / 暂停 / 完成 / 放弃专注
- 书籍完成动画链和行动卡
- 访客到来和首次访客叙事
- 买书、买书架、升级借阅区、命名图书馆
- 刷新后状态保留

---

## 待你确认的问题

1. **顶部语言选择器行为**：现有下拉菜单切换语言时会整页刷新。是否允许保持刷新，还是也要改成无刷新？
2. **语言选择框对谁显示**：仅 `introCompleted === false` 的全新玩家，还是所有旧用户也弹一次？
3. **shop 控制器命名**：已有 `js/shop.js` 是业务逻辑。是新建 `js/shop-controller.js`，还是把现有业务逻辑改名、复用 `js/shop.js`？
4. **actions 位置**：偏好 `js/actions.js` 还是 `js/core/actions.js`？
5. **bootstrap 入口**：`js/app.js` 继续作为 `<script type="module">` 入口、只 import `js/bootstrap.js`，还是直接让 `index.html` 引用 `js/bootstrap.js`？
6. **focus-session 职责范围**：只放 session flag + mode/book 选择，还是把 `handleCompleteFocus` 的计算流程也放进去？
7. **提交粒度**：每个阶段一个独立 commit，还是全部拆完再一次性 commit？
