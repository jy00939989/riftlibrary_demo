# 2026-05-21 变更记录

## 位面系统 Phase 1 框架搭建

基于 `PLANE_SYSTEM_DESIGN.md` 和 `PLANE_SYSTEM_REVIEW.md`，完成位面系统的数据层、逻辑层和渲染层框架。

### 数据层

- **`data/planes.js`**：characters 补充 `unlockStage` 字段，mementos 字段名从 `stage` 统一为 `unlockStage`，修复 `canUnlockPlane` 中 `upgradeOk` 逻辑反转 bug
- **`data/quests/pastoral_tasks.js`**：新建，小艾拉 Stage 1 的 4 条任务（`copy_chapter` ×2 + `copy_book` ×1 + `read_chapter` ×1），含完整信函文本

### 逻辑层

- **`js/quests.js`**（新建）：独立位面访客队列 + 任务生命周期引擎
  - `unlockPlane()` — 位面解锁入口
  - `tickPlaneVisitors()` — 60s 定时分配任务，与 visitors.js 平行运行
  - `checkTaskCompletion()` — 监听章节解锁/书籍完成/章节阅读/种子收集触发
  - `submitTask()` — 回信提交 + 奖励发放 + 立即分配下一个任务
  - `checkPlaneStageAdvance()` — 防重入的位面 Stage 推进
  - `registerFamiliarVisitors()` — 位面完成后注册熟客
  - 查询 API：`getPlaneQuestState()` / `getCharacterTasks()` / `getPlaneCharacters()` / `getAllTasks()`
- **`js/state.js`**：`state.quests.pastoral` 完整结构 + 旧存档迁移补丁（含字段补齐和旧 `plagueProgress` 清理）

### 渲染层

- **`js/render/plane.js`**（新建）：位面详情页（发展手册）
  - 时间线（5个 Stage 可视化 + 已完成/当前/未来状态）
  - 角色列表（含未读/待回信徽章，点击进入角色卡片）
  - 信物收集
  - 墨墨评论（每个 Stage 不同文本）
  - 未解锁状态展示（显示条件进度 + 跳转商店）
- **`js/render/quests.js`**（新建）：角色卡片 + 信函弹窗
  - 进行中 / 待回信 / 已完成 三区任务列表
  - 信函弹窗：查看来信（任务详情）/ 回信提交（确认奖励）
  - 提交后自动刷新角色卡片
- **`js/render/archive.js`**（改造）：新增「🌍 位面」子标签
  - 位面列表（已解锁 → 进入详情 / 可开启 → 跳转商店 / 锁定 → 灰度展示）
  - 待回信数量徽章
  - 占位位面添加窥探感线索文本
  - 注册 `window.__renderArchivePage` 供 plane.js 返回按钮使用

### 入口编排

- **`js/app.js`**：visitor tick 中新增 `tickPlaneVisitors(now)` 调用，专注完成时新增 `checkTaskCompletion('chapter_unlocked', ...)` 和 `checkTaskCompletion('book_completed', ...)` 触发
- **`js/shop.js`**：`purchasePlanePortal()` 调用 `unlockPlane()`，新增书架容量检查（`isBookCapacityFull`）
- **`js/render/bookshelf.js`**：已含章节阅读时 `checkTaskCompletion('chapter_read', ...)` 触发

---

## Bug 修复

### 书架容量限制失效
- 新增 `getBookCapacity()` / `getOwnedBookCount()` / `isBookCapacityFull()` 辅助函数（`js/shop.js`）
- `purchaseBook()` 购买前检查容量
- `buySalesBook()` 阿九推销购买前检查容量
- `exchangeSeed()` 种子兑换前检查容量

### canUnlockPlane 逻辑反转
- `upgradeOk` 从 `planePortals[shopUpgrade]`（要求已购买 → 永不为真）改为 `!planePortals[shopUpgrade]`（要求未购买 → 正确）

---

## Dev 面板增强

- 新增「🌾 一键解锁田园位面」按钮：自动达成氛围≥80 + 12本书 + 2000智慧之光 + 购买传送门 + 跳转档案→位面
- 导入 `SHARED_POOL` / `purchasePlanePortal` / `PLANES` / `canUnlockPlane`

---

## 文档

- **`docs/design/PLANE_SYSTEM_FEEDBACK_2026-05-21.md`**（新建）：首次测试反馈，记录三个待解决问题
- **`docs/changelog/CHANGELOG_2026-05-21.md`**（本文件）

---

## 文件变更清单

| 操作 | 文件 |
|------|------|
| 新建 | `data/quests/pastoral_tasks.js` |
| 新建 | `js/quests.js` |
| 新建 | `js/render/plane.js` |
| 新建 | `js/render/quests.js` |
| 新建 | `docs/design/PLANE_SYSTEM_FEEDBACK_2026-05-21.md` |
| 新建 | `docs/changelog/CHANGELOG_2026-05-21.md` |
| 修改 | `js/state.js` — 位面状态结构 + 迁移 |
| 修改 | `js/app.js` — tickPlaneVisitors + checkTaskCompletion 接入 |
| 修改 | `js/shop.js` — purchasePlanePortal + 书架容量检查 |
| 修改 | `js/visitors.js` — buySalesBook 容量检查 |
| 修改 | `js/plants.js` — exchangeSeed 容量检查 |
| 修改 | `js/dev.js` — 一键解锁位面 + 新 imports |
| 修改 | `js/render/archive.js` — 位面子标签 |
| 修改 | `data/planes.js` — unlockStage 字段 + canUnlockPlane 修复 |
