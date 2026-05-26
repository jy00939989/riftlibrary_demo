# 变更日志 · 2026-05-26

## 八期：田园位面全角色全阶段任务 + 三合一修复

### 任务内容填充

- `data/quests/pastoral_tasks.js`：从 4 条任务扩充至 100 条（5 角色 × 5 阶段 × 4 任务）
- 角色覆盖：小艾拉（20）/ 玛格丽特（20）/ 卡特琳修女（20）/ 艾德里安（20）/ 杜兰伯爵（20）
- 书信文本：200 封（委托信 + 回信），总字数约 24,000 字
- 任务类型：copy_chapter 62 / read_chapter 26 / copy_book 12
- 叙事弧线：Stage 1 瘟疫初现 → Stage 2 草药与祈祷 → Stage 3 禁忌之书 → Stage 4 领主低头 → Stage 5 黎明的山谷

### Part A：任务条件兜底

- `js/quests.js` 新增 `isTaskConditionMet(taskDef)` 函数
- 检测 copy_chapter / copy_book / read_chapter / collect_seed 四种任务类型
- `tickPlaneVisitors()` 和 `submitTask()` 分配新任务时：条件已满足 → 直接标记为可提交，跳过 activeTasks
- 解决旧档玩家已解锁章节/完成书籍后接任务会永久卡死的问题

### Part B：缮写室章节指示器

- `js/quests.js` 新增 `getActiveChapterTaskForBook(bookId)` 导出函数
- `js/render/focus.js` 新增 `renderQuestChapterIndicator()` 组件 + `updateQuestChapterIndicatorDOM()` 实时更新
- 选书后如有关联位面任务，显示目标章节和解锁进度
- 未解锁："✉️ 正在为小艾拉誊抄第3章「xxx」· 还需约 N 字解锁"
- 已解锁："✅ 第3章已解锁！去位面页面回信提交吧"

### Part C：书信世界观修复

- 核心原则：位面角色通过图书馆**发现**书籍，而非世界中本来就有
- 重写以下 8 封关键书信：
  - 小艾拉 S1T1：玛格丽特"讲"小王子 → 艾拉在图书馆书架上发现
  - 小艾拉 S1T4：玛格丽特"指着"本草纲目 → 推荐去图书馆找
  - 小艾拉 S2T2：玛格丽特"有一本"物种起源 → 从图书馆回来后知道的
  - 玛格丽特 S1T1："手头"本草纲目缺页 → 在贵馆发现此书
  - 玛格丽特 S5T2：艾德里安"借给"她几何原本 → 推荐她读
  - 卡特琳 S1T1：玛格丽特"递给她"沉思录 → 带她来图书馆指认
  - 卡特琳 S2T3：玛格丽特"递给"卡拉马佐夫兄弟 → 指向书架
  - 卡特琳 S4T4：玛格丽特"塞到手里"物种起源 → 拉她来图书馆

### 文档更新

- `CLAUDE.md`：新增八期增量条目
- `STATUS.md`：更新至 2026-05-26 状态
