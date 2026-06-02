# 田园位面任务 — 三合一修复计划

## Context

当前位面任务系统有三个相互关联的问题需要修复：

1. **章节选择缺失**：缮写室只能选书不能选章，玩家对"正在为某人誊抄某章"无感知
2. **世界观一致性**：部分任务书信让位面角色引用了他们世界不存在的书（如玛格丽特"已经知道"小王子、本草纲目等），破坏了"角色通过图书馆发现异世界书籍"的核心设定
3. **已抄完书的兜底**：如果玩家接任务前已经解锁了目标章节/完成了整本书，`chapter_unlocked` 事件不会再触发，任务永久卡死

## 方案总览

| 问题 | 方案 | 改动范围 |
|------|------|----------|
| 章节选择缺失 | 缮写室加"任务目标章节"指示器，不改誊抄底层 | `js/render/focus.js` + `js/quests.js` |
| 世界观一致性 | 重写约 30-40 封有问题的书信 | `data/quests/pastoral_tasks.js` |
| 已抄完兜底 | 任务分配时检测条件是否已满足→自动完成 | `js/quests.js` |

---

## Part A: 任务条件兜底（最高优先级，阻塞其他）

### 问题

`findNextAvailableTask()` 分配任务时不检查条件是否已满足。如果玩家已解锁目标章节或已完成目标书籍，`chapter_unlocked`/`book_completed` 事件早已触发过，任务永远无法完成。

### 改动

**`js/quests.js`** — 在 `findNextAvailableTask()` 返回前增加预检：

```js
// 如果任务条件已满足（旧档兜底），跳过并标记为可提交
if (isTaskConditionMet(taskDef, charData, planeId)) {
  // 不加入 activeTasks，直接加入 pendingComplete
  // 角色下次 tick 时玩家即可回信提交
}
```

新增 `isTaskConditionMet(taskDef)` 辅助函数：
- `copy_chapter`：检查 `bookState.unlockedChapters` 是否已包含该章节
- `copy_book`：检查 `bookState.status === 'completed'`
- `read_chapter`：检查 `bookState.readChapters` 是否已包含该章节
- `collect_seed`：检查种子库存

同时需要在 `tickPlaneVisitors()` 中处理这个自动完成的路径——任务不进 activeTasks，直接进 pendingComplete，并生成历史记录。

### 验证

用 dev 面板先把小王子抄到第3章 → 买传送门 → 小艾拉 S1T1（誊抄第3章）应自动完成 → 角色卡片显示"待回信"

---

## Part B: 缮写室章节指示器

### 改动

**`js/render/focus.js`** — 新增 `renderQuestChapterIndicator(sess, book)` 组件：

- 查询当前 bookId 是否有位面 `copy_chapter` 类型活跃任务
- 如果有，在进度条上方渲染一行提示：
  ```
  ✉️ 正在为小艾拉誊抄《小王子》第3章 · 还需约 2,800 字解锁
  ```
- 如果该章已解锁 → 提示变为 "✅ 第3章已解锁！去位面页面回信提交吧"
- 如果接了多个同书不同章的任务 → 显示最近的一个

**数据获取**：在 `js/quests.js` 新增导出函数：
```js
export function getActiveChapterTaskForBook(bookId)
// 返回 { characterName, targetChapterIdx, chapterTitle, taskId } 或 null
```

**`js/state.js`** — 不改。`currentSession` 不需要加 chapterId 字段，指示器只是 UI 层提示。

**`js/render/writing.js`** — 不改。动画引擎内部已有 `this.chapterIdx`，不需要对外暴露。

### 验证

选中小王子 → 接小艾拉 task child_s1_t1（第3章）→ 缮写室出现提示条 → 字数到达后提示更新为"已解锁"

---

## Part C: 世界观一致性 — 书信重写

### 核心原则

- 位面角色**第一次**在图书馆发现某本书 → 馆长（玩家）誊抄分享给他们
- 角色可以**描述他们世界的问题**（瘟疫、咳嗽），馆长推荐对应的书
- 角色之前没读过这些书，信中的语气应该是"发现"和"请求"，而非"引用"
- 玛格丽特可以有自己的草药经验，但《本草纲目》是她在图书馆的**新发现**

### 需要重写的书信类别

**类别1：角色暗示已拥有/读过图书馆的书**

例如：
- 小艾拉 S1T1 "玛格丽特阿姨给我讲了小王子" → 应改为"我在图书馆的书架上发现了一本画着金色头发男孩的书"
- 小艾拉 S1T4 "她指着一本好大好大的书" → 应改为"我在图书馆找到一本很大很大的书，叫《本草纲目》"
- 卡特琳 S1T1 "她递给我一本破旧的书" → 应改为"她带我来图书馆，指给我看一本叫《沉思录》的书"

**类别2：角色引用图书馆的书作为已有知识**

例如信中角色引用书中句子作为"我之前就知道的" → 应改为"我从你上次誊抄给我的章节里读到……"

**类别3：角色之间的对话引用（可保留部分）**

如果角色 A 说"角色 B 告诉我书里说了 XXX"→ 这是合理的，因为 B 先通过图书馆获得了知识再转述。但如果时间线对不上（B 还没完成任务），则需要调整。

### 改动范围

约 30-40 封书信的 `letterOffer.body` 和 `letterComplete.body` 字段。不改变任务结构（id/condition/prereqTasks/reward 都不动）。

### 验证

逐角色阅读 Stage 1 的书信文本，确保每个角色第一次提到一本书时都是"发现"的口吻。

---

## 实施顺序

1. **Part A 兜底逻辑** — 先确保所有任务在技术上不会卡死
2. **Part B 章节指示器** — 加 UI 提示，让玩家感知任务目标
3. **Part C 书信重写** — 最后处理内容问题，此时可以边改边在 UI 上看到效果

---

## 影响文件清单

| 文件 | 改动 |
|------|------|
| `js/quests.js` | Part A：`isTaskConditionMet()` + `findNextAvailableTask` 预检 + Part B：`getActiveChapterTaskForBook()` |
| `js/render/focus.js` | Part B：`renderQuestChapterIndicator()` 组件，插入缮写室卡片 |
| `data/quests/pastoral_tasks.js` | Part C：重写 30-40 封书信的 body/closing 文案 |
