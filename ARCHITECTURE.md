# 异世界图书馆 · 架构文档

最后更新：2026-05-10

---

## 项目概览

纯前端 Web 应用，融合番茄钟专注计时 + 书籍收集 + NPC 访客模拟。无框架（原生 JS ES Modules），Tailwind CSS + 自定义主题，localStorage 持久化。

---

## 文件结构

```
├── index.html              ← 页面骨架（6个标签页 + Tailwind配置）
├── css/style.css            ← 羊皮纸/魔法主题自定义样式
│
├── data/                    ← 静态数据层（无需持久化的内容）
│   ├── books.js             ← 入口：组装 BOOKS + 导出 CATEGORIES 枚举
│   ├── books/               ← 每本书独立文件
│   │   ├── book_001.js      ← 《小王子》章节 + mastery内容
│   │   └── book_002.js      ← 《动物农场》章节 + mastery内容
│   └── atmosphere.js        ← 5个氛围阶段描述文字库
│
├── js/                      ← 逻辑层
│   ├── app.js               ← 应用入口：初始化 + 页面切换 + 全局操作编排
│   ├── state.js             ← 单一数据源：全局状态 + 存档序列化 + 迁移
│   ├── timer.js             ← 计时器：番茄钟/倒计时/正计时
│   ├── storage.js           ← 工具：代币/氛围/历史的原子读写
│   ├── visitors.js          ← 访客逻辑：刷新/借书/还书/事件/好感度
│   ├── dev.js               ← Dev 面板：时间加速/强制操作
│   │
│   └── render/              ← 渲染层（唯一操作 DOM 的模块）
│       ├── index.js          ← 入口：统一 re-export
│       ├── common.js         ← 工具：el(), h(), formatTime(), setActions()
│       ├── focus.js          ← 专注页 + 结算卡片
│       ├── bookshelf.js      ← 书架页 + 筛选 + mastery详情
│       ├── visitors.js       ← 访客中心 + 事件弹窗
│       ├── library.js        ← 图书馆页
│       ├── archive.js        ← 档案页
│       ├── shop.js           ← 商店页
│       └── animations.js     ← 弹窗动画（解锁/完成/里程碑）
│
└── .claude/skills/grill-me/ ← Claude Code 项目级 skill
```

---

## 数据流

```
state.js (单一数据源)
    ↓ 读写
app.js (编排层)  ←→  storage.js (工具)
    ↓ 注入 actions
render/ (渲染层) ← 只通过 actions 回调触发操作
    ↓ 调用
visitors.js / timer.js (纯逻辑模块)
```

**原则：**
- `render/` 是唯一操作 DOM 的模块
- `visitors.js` 和 `timer.js` 不碰 DOM，只通过 `state` 和 `saveState` 通信
- `app.js` 负责组装 actions 并注入到 render 层
- `data/` 目录是纯静态数据，不依赖任何模块

---

## 核心模块说明

### state.js — 全局状态

```js
state = {
  focus: { totalMinutes, totalWords, todayMinutes, todayDate, streak, lastFocusDate, claimedMilestones },
  currentSession: { active, mode, bookId, targetMinutes, elapsedSeconds, paused, intervalId, quoteIndex },
  books: { 'book_001': { unlockedChapters, copyCount, masteryLevel, copiedWords, status, starred, damaged, repairWords }, ... },
  library: { name, atmosphere, shelves, borrowLevel },
  coins: Number,
  visitors: [{ id, charId, name, emoji, status, bookId, bookTitle, ...favorability }],
  borrowRecords: [{ id, charId, ... }],
  visitorFavors: { shenmingyuan, xiaoying, yunyou, ajiu },
  history: [{ type, title, detail, time }],
  achievements: []
}
```

存档 key：`library_state`（localStorage）

迁移逻辑：`initState()` 加载时自动补全新增字段，确保旧存档不报错。

### visitors.js — 访客系统

```
spawnVisitor() → status: 'browsing'
    ↓ tickVisitorBrowsing() → 40%概率借书
attemptBorrow() → status: 'borrowed'
    ↓ checkDueVisitors() → 到期检测
status: 'due'
    ↓ collectReturn() → 用户点击收取
事件判定 → 好感度结算 → 移除访客
```

四种事件类型：gift_book, annotation, treasure_map, poem, sales_pitch

### timer.js — 计时器

每秒 tick：更新 elapsedSeconds，显示剩余/已过时间
完成判断：倒计时/番茄钟模式下 elapsedSeconds >= targetMinutes × 60
正计时模式：无上限，用户手动完成

### render/ — 渲染层

所有文件通过 `import { actions } from './common.js'` 获取回调引用。
app.js 通过 `setActions({...})` 注入回调。
原则：render 层负责"怎么展示"，app 层负责"发生什么"。

---

## 书籍系统

### Mastery 等级

| 等级 | 名称 | 解锁内容 | 数据字段 |
|------|------|----------|----------|
| Lv1 | 初识 | 书籍上架，可被借阅 | — |
| Lv2 | 熟悉 | 作者小传 | authorBio |
| Lv3 | 精通 | 创作轶闻 | anecdotes |
| Lv4 | 大师 | 名家书评 | reviews |
| Lv5 | 传承 | 典藏封面 · 金光特效 | collectorCover |

### 章节解锁

按单本书誊抄字数解锁，`bookState.copiedWords >= ch.unlockAt`

### 分类枚举

`童话 | 寓言 | 小说 | 诗歌 | 戏剧 | 散文 | 哲学 | 传记 | 历史 | 科学 | 神话 | 志怪`

---

## 新书获取三途径

| 途径 | 触发方式 | 书源 |
|------|----------|------|
| 商店购买 | 代币购买（统一500~800，福利特价100~300） | 共享混合池 |
| 字数里程碑 | 累计字数达标（5万~120万共7个阈值） | 共享混合池 |
| 访客好感度 | 好感度达标 → 专属书入随机事件池 → 还书时概率赠 | 访客专属池 |

---

## 迁移记录

旧存档自动补全字段：
- `starred: false` — 书籍收藏状态
- `damaged: false` + `repairWords: 0` — 书籍损毁
- `starred` 迁移
- `visitorFavors` — 访客好感度
- `claimedMilestones` — 里程碑领取记录
- `borrowLevel` — 借阅区等级

---

## 废弃/已移除

- 稀有度系统（common/rare/epic/legendary）
- 专注项目选择器（深度学习/工作事务/创意创作）
- `js/books.js` — 死代码
- `js/atmosphere.js` — 薄封装，已内联
- `tryUnlockNewBook()` — 从未被调用
