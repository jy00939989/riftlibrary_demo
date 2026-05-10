# 异世界图书馆 · 章节解锁机制改造

> ⚠️ 历史文档 — 所述改动已于早期版本实施。当前架构见 ARCHITECTURE.md。

## 改动背景

当前章节解锁条件：`state.focus.totalMinutes >= ch.unlockAt`
解锁依据：全局累计专注分钟数

改造目标：改为按「单本书已誊抄字数」解锁，语义更直观。

---

## 改动清单

### 1. `data/books.js`

《小王子》章节阈值改为字数：

```js
// 改这些行的 unlockAt 字段
{ title: "第一章：蟒蛇与象", unlockAt: 0 },       // 保持 0
{ title: "第二章：画羊", unlockAt: 2800 },       // 改
{ title: "第三章：玫瑰", unlockAt: 5600 },       // 改
{ title: "第四章：星球", unlockAt: 8400 },       // 改
{ title: "第五章：点灯人", unlockAt: 11200 }     // 改
```

《动物农场》章节阈值改为字数：

```js
{ title: "第一章", unlockAt: 0 },    // 保持 0
{ title: "第二章", unlockAt: 3500 }, // 改
{ title: "第三章", unlockAt: 7000 }  // 改
```

### 2. `js/app.js`

第56行，解锁判断条件：

```js
// 原文
if (!bookState.unlockedChapters.includes(idx + 1) && state.focus.totalMinutes >= ch.unlockAt)

// 改为
if (!bookState.unlockedChapters.includes(idx + 1) && bookState.copiedWords >= ch.unlockAt)
```

### 3. `js/render.js`

章节列表 UI 文案，展示解锁进度时，把"分钟"改为"字"。

找到显示阈值的文案，类似 `ch.unlockAt + '分钟'` 改成 `ch.unlockAt.toLocaleString() + '字'`，具体行号以实际搜索为准。

### 4. `js/state.js`

`book_001` 初始值归零，新玩家起点：

```js
'book_001': {
  unlockedChapters: [],
  copyCount: 0,
  masteryLevel: 0,
  copiedWords: 0,
  status: 'locked'
}
```

---

## 补充问题：《动物农场》数据不一致

当前 books.js 中《动物农场》：
- `totalWords: 29000`
- 章节：3章，每章3500字，总计10500字

**差距：29000 - 10500 = 18500字，缺7章。**

《动物农场》全书10章，目前只有前3章内容。需补入第4至第10章，并将 `totalWords` 修正为实际字数（各章实际字数以版权公版文本统计为准，章节划分可参考常见的中文译本分章）。

建议每章3500字左右，共补7章，与现有章节保持一致。

---

## 补充问题：倒计时模式显示不正确

**文件：** `js/timer.js`
**位置：** 第 56-58 行

**问题：** 无论什么模式，`formatTime` 都传入 `sess.elapsedSeconds`（已过去的秒数），导致倒计时和番茄钟模式显示的仍是"已过时间"而非"剩余时间"。

**修复：** 倒计时/番茄钟模式下，改为传入 `targetMinutes * 60 - elapsedSeconds`（剩余秒数），且不低于 0。

```js
// 原文
const timeStr = formatTime(sess.elapsedSeconds);

// 改为
const isCountUp = sess.mode === 'stopwatch' || sess.targetMinutes === 0;
const displaySeconds = isCountUp ? sess.elapsedSeconds : sess.targetMinutes * 60 - sess.elapsedSeconds;
const timeStr = formatTime(Math.max(0, displaySeconds));
```

---

## 说明

- 改动均为纯文本替换，无架构调整，无性能风险。
- 旧存档中已解锁的章节不受影响。
- 新阈值逻辑：抄完前 N-1 章的总字数，自然解锁第 N 章。
