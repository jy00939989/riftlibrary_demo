# 访客系统 · 技术文档

> ⚠️ 部分过时 — 稀有度已移除、好感度已新增、沈明远/阿九池待改造。当前状态见 ARCHITECTURE.md 和 BOOK_SYSTEM_REDESIGN.md。

## 模块架构

```
visitors.js  ← 纯逻辑，只依赖 state.js / storage.js / data/books.js
    ↑ 导出函数
app.js       ← 编排层：定时循环 + actions 注入
    ↓ 注入 actions
render.js    ← UI 层：只读 state.visitors，通过 actions 回调触发操作
    ↓
dev.js       ← 通过 import 直接调用 visitors.js 函数
```

## 核心数据结构

### state.visitors（访客数组）

```js
{
  id: 'v_xxx',          // 唯一实例ID
  charId: 'shenmingyuan', // 角色定义ID（VISITOR_DEFS 的 key）
  name: '沈明远',
  emoji: '👨‍🏫',
  title: '退休文学教授',  // 身份描述
  status: 'browsing',   // 'browsing' | 'borrowed' | 'due'
  bookId: null,         // 借走的书籍ID
  bookTitle: null,      // 借走的书名
  arriveTime: 1700000,  // 到达时间戳
  borrowTime: null,     // 借书时间戳
  dueTime: null,        // 到期时间戳
  eventTriggered: false // 是否已触发过随机事件
}
```

### state.borrowRecords（借阅历史）

```js
{
  id: 'br_xxx',
  charId: 'shenmingyuan',
  charName: '沈明远',
  bookId: 'book_001',
  bookTitle: '小王子',
  borrowTime: 1700000,
  returnTime: 1701000,
  event: null,         // 触发的事件类型
  status: 'returned'   // 'returned' | 'damaged'
}
```

### state.books 新增字段

```js
damaged: false,    // 是否损毁
repairWords: 0     // 修复所需誊抄字数（25% × 总字数）
```

### state.library 新增字段

```js
borrowLevel: 0   // 借阅区等级 0-3，0=未建造
```

### state._mysteryBooks（暂存书籍元数据，不持久化）

```js
{
  'mystery_xxx': { title: '《遗忘之书》', words: 28000, rarity: 'rare', emoji: '📕' },
  'sale_xxx':    { title: '《星尘往事》', words: 18000, rarity: 'common', emoji: '📙', price: 2500 }
}
```

## VISITOR_DEFS 角色定义

| key | 名称 | 偏好分类 | 事件 |
|-----|------|----------|------|
| shenmingyuan | 沈明远 👨‍🏫 | 寓言、哲学 | gift_book(60%) / annotation(40%) |
| xiaoying | 小萤 🧒 | 童话、奇幻 | treasure_map(100%) |
| yunyou | 云游 🎵 | 无偏好 | poem(100%) |
| ajiu | 阿九 📦 | 无偏好 | sales_pitch(100%) |

## 访客生命周期

```
spawnVisitor() → status: 'browsing'（在馆区）
    ↓ tickVisitorBrowsing() 40%概率 + 有completed书籍
attemptBorrow() → status: 'borrowed'（借出区）
    ↓ checkDueVisitors() 到期检查
status: 'due'（待收取区）
    ↓ collectReturn() 用户点击收取
事件判定 → 移除访客 → 写借阅记录
```

## 刷新与借阅规则

- 同时在馆上限：3人
- 定时循环：每60秒 tick（app.js setInterval）
- 借书偏好：按 VISITOR_DEFS.category 匹配，有偏好优先，无偏好全选
- 还书时长：`总字数 / 2000` 小时，下限1h，上限24h
- Dev 加速：每0.5小时尝试刷新1位

## 事件表

| 事件类型 | 角色 | 效果 |
|----------|------|------|
| gift_book | 沈明远 | 赠送神秘书籍（书名???），存在 _mysteryBooks |
| annotation | 沈明远 | +5氛围 |
| treasure_map | 小萤 | 50%概率+20~50代币，50%概率+3~8氛围 |
| poem | 云游 | +5~10氛围，展示随机诗句 |
| sales_pitch | 阿九 | 推销一本书(500~5000代币)，可选购买 |

## 损毁系统

- 判定：还书收取时 ~3%
- 效果：`book.damaged = true`，`book.repairWords = 总字数 × 25%`
- 修复：专注誊抄达到 repairWords 后恢复 completed（待实现UI）
- 损毁书籍不可被借出（getCompletedBooks 过滤）

## Actions 回调（render.js ← app.js）

| key | 函数 | 用途 |
|-----|------|------|
| collectReturn | handleCollectReturn(visitorId) | 收取还书，返回 { damaged, event, ... } |
| buySalesBook | handleBuySalesBook(bookMeta) | 购买阿九推销的书 |

## Dev 面板对接

- `时间加速` → `onTimeSkip(hours, now)` → 批量刷新 + 推进到到期
- `刷新访客` → `spawnVisitor()` + `renderVisitorsPage()`
- `强制还书` → `visitorForceReturn()` 循环所有 borrowed 访客
- `重置访客` → `visitorReset()` 清空 visitors + borrowRecords
