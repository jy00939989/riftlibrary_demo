# 异世界图书馆 · 架构文档

最后更新：2026-05-15

---

## 项目概览

纯前端 Web 应用，融合番茄钟专注计时 + 书籍收集 + NPC 访客模拟 + 成就与收集系统。无框架（原生 JS ES Modules），Tailwind CSS + 自定义主题，localStorage 持久化。

---

## 文件结构

```
├── index.html                   ← 页面骨架（6个标签页 + Tailwind配置 + 音乐开关）
├── css/style.css                ← 羊皮纸/魔法主题自定义样式 + 缮写动画
│
├── data/                        ← 静态数据层（不依赖任何模块）
│   ├── books.js                 ← 入口：组装 BOOKS + 导出 CATEGORIES 枚举
│   ├── books/                   ← 每本书独立文件（book_001 ~ book_024）
│   │   ├── book_001.js          ← 各书 meta + chapters + quotes + mastery内容
│   │   └── ...
│   ├── book_pool.js             ← 共享书籍池（商店/里程碑/阿九推销共用，17本，含plane字段）
│   ├── plants.js                ← 植物盆栽定义（5级成长 + 种子掉落）
│   ├── signboards.js            ← 标志牌定义（5种）
│   └── atmosphere.js            ← 5个氛围阶段描述文字库 + 阶段判定
│
├── audio/                       ← 音频素材
│   ├── 图书馆 demo 荒废图书馆 2.mp3     ← 废墟/破败/陈旧阶段BGM
│   ├── 图书馆 demo2 城镇风格.mp3        ← 温暖阶段BGM
│   ├── 图书馆 demo 星辰图书馆.mp3       ← 星辰阶段BGM
│   └── 异世界图书馆宣传PV.mp4           ← 开场动画
│   （每种2个变奏，共7个音频文件）
│
├── visual/                      ← 美术素材
│   ├── background/              ← 5张图书馆背景（废墟→华丽）
│   ├── library_readingarea/     ← 7张借阅区等级插画（lv1→lv7）
│   └── focusroom/               ← 7张缮写室等级插画（lv0→lv6）
│
├── js/                          ← 逻辑层
│   ├── app.js                   ← 应用入口：初始化 + 页面切换 + 全局编排 + 里程碑
│   ├── state.js                 ← 单一数据源：全局状态 + 存档序列化 + 旧档迁移
│   ├── timer.js                 ← 计时器：番茄钟(25min) / 倒计时 / 正计时 + 墨墨首次加速
│   ├── storage.js               ← 工具：智慧之光(代币)/氛围/历史/连击的原子读写
│   ├── audio.js                 ← 音频引擎：3层氛围BGM曲目 + 交叉淡入淡出
│   ├── diary.js                 ← 墨墨日志：每日回顾 + 特殊事件记录
│   ├── tutorial.js              ← 教学引擎：情境触发检测 + 首遇标记管理（纯逻辑）
│   ├── intro.js                 ← 开场引导：5步卡片式引导 + PV开场（从app.js提取）
│   ├── visitors.js              ← 访客逻辑：刷新/借书/还书/事件/好感度（纯逻辑）
│   ├── shop.js                  ← 商店逻辑：借阅区/缮写室升级 + 书籍刷新/购买（纯逻辑）
│   ├── books.js                 ← 书籍解锁/进度计算
│   ├── achievements.js          ← 成就引擎：条件检测 + toast通知 + 稀有度推算
│   ├── collection.js            ← 收集系统：收集品状态 + 分类进度
│   ├── dev.js                   ← Dev 面板：时间加速/强制操作/数值注入
│   │
│   └── render/                  ← 渲染层（唯一操作 DOM 的模块）
│       ├── index.js             ← 入口：统一 re-export
│       ├── common.js            ← 工具：el(), h(), formatTime(), setActions()
│       ├── focus.js             ← 缮写室 + 结算卡片 + 缮写动画集成
│       ├── writing.js           ← 缮写动画引擎（canvas排版 + 羽笔效果 + 左右翻页）
│       ├── bookshelf.js         ← 大书库 + 筛选 + mastery详情弹窗
│       ├── visitors.js          ← 读者沙龙 + 事件弹窗
│       ├── library.js           ← 馆长办公室（子标签：概况/成就柜/收藏室/布置/馆长手册）
│       ├── archive.js           ← 馆史档案：统计面板 + 事件历史 + 墨墨日志子标签
│       ├── shop.js              ← 位面商店：借阅区/缮写室升级 + 固定区/特价区
│       ├── achievements.js      ← 成就柜 UI：网格展示 + 稀有度边框 + 详情
│       ├── collection.js        ← 收藏室 UI：分类图鉴 + 进度百分比
│       ├── tutorial-ui.js       ← 教学 UI：情境引导卡片 + 氛围/缮写室/借阅区升级弹窗
│       ├── certificate.js       ← 典藏证书：书籍完成时仪式感分享卡片
│       └── animations.js        ← 弹窗动画（解锁/完成/里程碑）
│
├── docs/                         ← 项目文档
│   ├── ARCHITECTURE.md            ← 本文件
│   ├── CLAUDE_DIARY.md            ← 工作日志
│   ├── CLAUDE_DIARY_2026-05-15.md ← 2026-05-15 工作日志
│   ├── DESIGN.md                  ← 历史文档（Demo Day 设计，部分过时）
│   ├── SHOP_SYSTEM_DESIGN.md      ← 商店系统完整设计
│   ├── AUDIO_SYSTEM_DESIGN.md     ← 音频系统设计
│   ├── MODIFY_AUDIO_SYSTEM.md     ← 音频系统改造指令
│   ├── BOOK_TEMPLATE.md           ← 书籍数据模板（Agent 用）
│   ├── CHANGELOG_2026-05-10.md    ← 变更记录
│   ├── CHANGELOG_2026-05-14.md    ← 变更记录
│   ├── CHANGELOG_2026-05-15.md    ← 最新变更记录
│   ├── ARCHITECTURE_REVIEW_2026-05-15.md ← 架构师 Review
│   ├── 成就与收集系统设计文档.md   ← 成就与收集系统总设计
│   ├── 成就系统设计.md             ← 成就具体条目（30个 + 稀有度 + 触发条件）
│   ├── 成就系统调研报告.md         ← 同类游戏成就系统调研
│   ├── 游戏可玩性与商业化诊断建议.md ← 游戏诊断
│   ├── 留存设计方案_v1.0.md        ← 留存设计
│   └── 美术UI诊断和建议.md         ← 美术/UI 诊断
```

---

## 数据流

```
                     ┌──────────────────────────┐
                     │     localStorage          │
                     │  ┌─────────────────────┐  │
                     │  │ library_state       │  │  ← 核心存档（focus/books/library/visitors）
                     │  │ library_achievements│  │  ← 成就解锁状态
                     │  │ library_collection  │  │  ← 收集品获取状态
                     │  └─────────────────────┘  │
                     └──────────┬───────────────┘
                                ↑ 读写
                     ┌──────────┴──────────┐
                     │     state.js        │  ← 单一数据源
                     │  (initState/saveState)│
                     └──────────┬──────────┘
                                ↓
          ┌─────────────────────┼─────────────────────┐
          ↓                     ↓                      ↓
   ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
   │  app.js      │   │ achievements │   │  shop.js         │
   │  编排层       │   │ .js          │   │  visitors.js     │
   │  注入 actions │   │ 成就检测引擎  │   │  纯逻辑模块       │
   └──────┬───────┘   └──────┬───────┘   └──────────────────┘
          ↓                  ↓
   ┌──────────────────────────────────────┐
   │           render/ (渲染层)            │  ← 唯一操作 DOM
   │  focus / writing / bookshelf /       │
   │  library / visitors / archive /      │
   │  shop / achievements / collection    │
   └──────────────────────────────────────┘
```

**原则：**
- `render/` 是唯一操作 DOM 的模块
- `visitors.js`、`shop.js`、`timer.js`、`achievements.js` 不碰 DOM，只通过 `state` 和 `saveState` 通信
- `app.js` 负责组装 actions 并注入到 render 层
- `data/` 目录是纯静态数据，不依赖任何模块
- 成就和收集系统使用独立 localStorage key，不与核心存档混在一起

---

## 核心模块说明

### state.js — 全局状态

```js
state = {
  // 用户统计
  focus: {
    totalMinutes, totalWords, todayMinutes, todayDate,
    streak, lastFocusDate, claimedMilestones
  },

  // 当前计时会话（不持久化）
  currentSession: {
    active, mode, bookId, targetMinutes,
    elapsedSeconds, paused, intervalId, quoteIndex
  },

  // 书籍状态（按 bookId 索引）
  books: {
    'book_001': {
      unlockedChapters, copyCount, masteryLevel, copiedWords,
      status,       // 'locked' | 'unlocked' | 'copying' | 'completed'
      starred,      // 星标收藏
      damaged,      // 是否损毁
      repairWords   // 修复所需誊抄字数
    }, ...
  },

  // 图书馆
  library: {
    name: '归墟图书馆',
    atmosphere: 0,     // 0~500，分5阶段
    shelves: [1],      // 书架编号数组
    borrowLevel: 0,    // 借阅区等级 0~7
    focusLevel: 0,     // 缮写室等级 0~6
    planePortals: {},  // 位面传送门状态
    nameLocked: false  // 是否已使用铭牌命名
  },

  // 经济
  coins: Number,       // 智慧之光（代币）

  // 访客
  visitors: [{ id, charId, name, emoji, status, bookId, bookTitle,
               arriveTime, borrowTime, dueTime, eventTriggered }],
  borrowRecords: [{ id, charId, charName, bookId, bookTitle,
                    borrowTime, returnTime, event, status }],
  visitorFavors: { shenmingyuan, xiaoying, yunyou, ajiu },

  // 事件历史
  history: [{ type, title, detail, time }],

  // 成就（核心存档中的引用，实际数据在 library_achievements）
  achievements: [],

  // 新手引导
  introCompleted: false,
  tutorialFlags: {
    maxAtmoStageSeen: 1,     // 已见过的最高氛围阶段（1~5）
    firstFocusComplete: false,
    firstVisitorArrive: false,
    firstShopOpen: false,
    firstLibraryOpen: false,
    firstBookComplete: false
  }
}
```

### 持久化策略

| Key | 内容 | 大小估算 |
|-----|------|----------|
| `library_state` | 核心存档（books/library/visitors/history） | ~10-50KB |
| `library_achievements` | 成就解锁状态 + 达成时间戳（由 `js/achievements.js` 自行管理读写） | ~2KB |
| `library_collection` | 收集品获取状态 + 分类进度（由 `js/collection.js` 自行管理读写） | ~2KB |

### achievements.js — 成就引擎

```
专注完成 / 书籍完成 / 购买操作 / 访客事件 ...
        ↓ app.js 调用
checkAchievement(triggerType, payload)
        ↓ 遍历成就条件表
匹配 → 检查是否已解锁 → 否 → 写入 library_achievements
        ↓
showToast(achievement)  ← 右下角 toast 通知，不强制确认
```

31 个成就，分 6 类：修复启蒙(4) / 智慧之光(8) / 书籍收集(8) / 图书馆重建(7) / 访客(3) / 彩蛋(2)

稀有度按目标难度自动推算：青铜(>70%) / 白银(40-70%) / 黄金(15-40%) / 铂金(<15%)

### diary.js — 墨墨日志系统

墨墨（书架精灵）每日回顾 + 特殊事件记录，存档到 `state.diary`。

```
每日首次访问 → tryGenerateDailySummary()
    ↓ 扫描昨日 history 记录
    ↓ 统计专注次数/分钟/字数、完成书籍、里程碑、访客事件
    ↓ 模板库拼装（OPENINGS/MIDDLES/ENDINGS 三段式）
    ↓ 日期 + 天气 + 开头 + 正文 + 结尾
    ↓ 写入 state.diary + 设置 diaryLastSummaryDate
```

特殊事件实时记录：
- 访客首次到来/借书/还书（仅首次）
- 访客特殊事件（赠书、批注、藏宝图、诗句、推销）
- 里程碑达成
- 书籍完成

馆史档案页新增「墨墨日志」子标签，展示墨墨与玩家之间的魔法羁绊等级 + 日记列表。

### audio.js — 音频引擎

三层氛围 BGM 系统，音乐随图书馆氛围变化自动切换：

| 氛围阶段 | 对应曲目组 | 文件 |
|----------|-----------|------|
| 废墟/破败/陈旧 (0-160) | ruined | 荒废图书馆 ×2 |
| 温暖 (161-300) | cozy | 城镇风格 ×2 |
| 星辰 (301-500) | stellar | 星辰图书馆 ×2 |

- **交叉淡入淡出**：10步音量渐变（0.05/步），每步120ms，总过渡1.2s
- **首次激活**：BGM 在首次专注完成后启动（避免开场视频音画重叠），回头客页面加载即播
- **音乐开关**：右上角按钮 🔈/🔇，状态持久化到 `library_music`（localStorage）
- **浏览器自动播放**：利用用户交互事件（点击/视频播放）解除限制

### 新手引导系统（2026-05-15 新增）

三层引导体系：开场引导 → 情境触发 → FAQ 参考。

```
第一层：开场引导（intro.js）
  页面首次打开 → PV 开场 → 5 步卡片（欢迎→缮写室→计时→大书库→访客/商店）
  每步切换对应背景标签页，卡片居中显示

第二层：情境触发（tutorial.js + tutorial-ui.js）
  checkAndShowTutorial(event, payload) → 匹配 TRIGGERS 配置
    → dispatchTutorialUI(trigger, callback) → 对应 UI 弹窗
  
  触发点：
  - focus_complete    → 解释智慧之光 + 氛围
  - visitor_arrive     → 解释访客系统，按钮跳转读者沙龙
  - shop_open          → 解释商店四大区域
  - library_open       → 解释馆长办公室 5 个子标签
  - atmosphere_stage_N → 金边大卡片：美术图 + 叙事文本
  - book_complete      → 典藏证书（html2canvas 导出）

第三层：馆长手册（library.js renderGuideTab）
  馆长办公室 → 📖 馆长手册子标签
  内容：功能介绍 + 核心循环 + 6 个 FAQ
```

**升级弹窗（共享 showUpgradeCard 模板）：**
- 氛围阶段升级（stage 2~5）：金边卡片 + 阶段美术图 + 叙事描述
- 缮写室升级（Lv1~6）：对应 focusroom 插画 + 等级名 + 叙事
- 借阅区升级（Lv1~7）：对应 readingarea 插画 + 等级名 + 叙事

**状态管理：** `state.tutorialFlags` 对象（6 个字段），通过 `markTutorialSeen(event)` 标记，旧档迁移自动补全。

**设计原则：**
- `tutorial.js` 纯逻辑，不碰 DOM，只返回 trigger 对象
- `tutorial-ui.js` 渲染层，负责所有引导/升级弹窗的 DOM 操作
- 氛围阶段使用 `maxAtmoStageSeen: number` 代替多个 boolean
- `addAtmosphere()` 返回 `prevLevel` 供调用方检测阶段跨越，保持 `storage.js` 纯净

### 氛围系统

5 阶段拉伸模型，从快速反馈到漫长养成：

| 阶段 | 名称 | 范围 | 跨度 | 预期达成 |
|------|------|------|------|----------|
| Lv1 | 废墟 | 0-30 | 30 | 第一周 |
| Lv2 | 破败 | 30-80 | 50 | 2-3 周 |
| Lv3 | 陈旧 | 80-160 | 80 | 1-1.5 月 |
| Lv4 | 温暖 | 160-300 | 140 | 2-3 月 |
| Lv5 | 星辰 | 300-500 | 200 | 3-6 月 |

氛围获取来源：

| 来源 | 数值 | 备注 |
|------|------|------|
| 每次专注完成 | +1 | 日常涓涓细流 |
| 完成短篇书籍（<3万字） | +3 | |
| 完成中篇书籍（3-10万字） | +6 | |
| 完成长篇书籍（>10万字） | +10 | 鸿篇巨制 |
| 里程碑（每个） | +3 | 共 7 个阈值 |
| 访客还书 | +1~8 | 按借阅区等级递增 |
| 访客事件 | +2~5 | 诗句/批注/藏宝图等 |
| 借阅区升级 | +15 | 每次升级 |
| 缮写室升级 | +15 | 每次升级 |
| 购买书架 | +5 | 每次购买 |

### timer.js — 计时器

三种模式：
- 番茄钟（25 分钟）：倒计时
- 倒计时（45 分钟）：倒计时
- 正计时：无上限，用户手动完成

每秒 tick：更新 elapsedSeconds，计算当前字数（基础 2字/秒 × 缮写室速率倍率），更新计时器显示。
完成判断：倒计时/番茄钟模式下 `elapsedSeconds >= targetMinutes × 60`。

缮写室速率倍率：`1 + focusLevel × 0.05`，影响实时显示字数、结算字数和放弃字数。

### visitors.js — 访客系统

4 位访客角色：沈明远(文学教授) / 小萤(冒险少女) / 云游(吟游诗人) / 阿九(书贩)

刷新机制：
- **专注完成后概率**：30%~50%（氛围0→500线性加成），不依赖完成整本书
- **完成书籍固定触发**：每完成一本书必吸引一位访客
- **初始补充**：页面加载时若访客列表为空，自动刷新一位

借阅区 Lv0 时容量为 0（需先购买升级），Lv1~Lv7 容量 2~10 人。

生命周期：
```
spawnVisitor() → status: 'browsing'（右下角卡片提醒，8s自消）
    ↓ tickVisitorBrowsing() → 40%概率 + 有completed书籍
attemptBorrow() → status: 'borrowed'（借出中）
    ↓ checkDueVisitors() → now >= dueTime
status: 'due'（等待收取）
    ↓ collectReturn() → 用户点击收取
事件判定（~60%触发）→ 好感度结算 → 移除访客
```

五种事件：gift_book / annotation / treasure_map / poem / sales_pitch

首次访客到来触发成就「墨香来客」（V03）。

### shop.js — 商店系统

```
页面加载 → ensureShopState()
    ├─ 全刷新判定：getNow() - lastRefresh >= 24h
    │   ├─ 固定区 5 本（500~800智慧之光）
    │   └─ 特价区 3 本（原价 × 0.3~0.7）
    └─ 单本补货：soldAt + 24h ≤ getNow() → 新书补位

购买流程：详情弹窗 → 确认 → 扣智慧之光 → 写入 state.books → 标记 soldAt
```

#### 借阅区升级

| Lv | 名称 | 价格 | 效果 |
|----|------|------|------|
| 0 | 未建造 | — | — |
| 1 | 陋室 | 500 | 在馆1人 · 还书+3💰 |
| 2 | 整洁 | 750 | 在馆2人 · 还书+4💰 · 好感+5% |
| 3 | 开放 | 1,125 | 在馆2人 · 还书+5💰 · 好感+10% · 氛围+1 |
| 4 | 舒适 | 1,688 | 在馆3人 · 还书+6💰 · 好感+15% · 氛围+1 |
| 5 | 精致 | 2,531 | 在馆3人 · 还书+8💰 · 好感+20% · 氛围+2 |
| 6 | 优雅 | 3,797 | 在馆4人 · 还书+10💰 · 好感+25% · 氛围+2 |
| 7 | 圣所 | 5,695 | 在馆5人 · 还书+12💰 · 好感+30% · 氛围+3 |

价格公式：500 × 1.5^(n-1)，封顶 5700

#### 缮写室升级

| Lv | 名称 | 价格 | 效果 |
|----|------|------|------|
| 0 | 未建造 | — | 基础速率 ×1.00 |
| 1 | 陋室 | 400 | 速率 ×1.05 |
| 2 | 整洁 | 580 | 速率 ×1.10 |
| 3 | 明亮 | 841 | 速率 ×1.15 |
| 4 | 静雅 | 1,219 | 速率 ×1.20 |
| 5 | 华美 | 1,768 | 速率 ×1.25 |
| 6 | 缮写圣堂 | 2,564 | 速率 ×1.30 |

价格公式：400 × 1.45^(n-1)，封顶 5000

### 书籍系统

#### Mastery 等级

| 等级 | 名称 | 解锁内容 | 数据字段 |
|------|------|----------|----------|
| Lv1 | 初识 | 书籍上架，可被借阅 | — |
| Lv2 | 熟悉 | 作者小传 | authorBio |
| Lv3 | 精通 | 创作轶闻 | anecdotes |
| Lv4 | 大师 | 名家书评 | reviews |
| Lv5 | 传承 | 典藏封面 · 金光特效 | collectorCover |

#### 章节解锁

按单本书誊抄字数：`bookState.copiedWords >= ch.unlockAt`

#### 分类枚举

`童话 | 寓言 | 小说 | 诗歌 | 戏剧 | 散文 | 哲学 | 传记 | 历史 | 科学 | 神话 | 志怪`

#### 新书获取三途径

| 途径 | 触发方式 | 书源 |
|------|----------|------|
| 商店购买 | 智慧之光购买（固定区500~800，特价区打折） | `data/book_pool.js` 共享池 |
| 字数里程碑 | 累计字数达标（5万~120万共7个阈值） | `data/book_pool.js` 共享池 |
| 访客好感度 | 好感度达标 → 专属书入事件池 → 还书概率赠 | 访客专属池 |

### writing.js — 缮写动画引擎

模块级单例动画引擎，在缮写室活跃专注时替代静态计时器显示。

```
startWriting(container, book) → WritingAnim 实例
    ↓
buildDOM() → 书本场景（左页/右页/书脊/羽笔/烛光）
recalcLayout() → canvas 测量字宽 → charsPerLine / linesPerPage
loadChapter(idx) → 从 book.chapters 取章节内容 → typeset(text)
    ↓
tick() 循环（150ms/字 + 40ms 羽笔延迟）：
  羽笔移至行末 → 出字 + 金色粒子 → 字淡入动画 → charIndex++
    ↓ 左页满 → 切右页
    ↓ 右页满 → flipBothPages() 双页淡出翻页
    ↓ 章节结束 → loadQuote() 随机名言 → advanceChapter()
```

- 字体：Zhi Mang Xing（志莽行，行书手写体）
- 字宽测量：canvas `measureText('字')` 动态计算
- 羽笔：CSS transition 平滑跟随，始终停在行末书写位
- 金色粒子：30% 概率触发，0.9s 上升消散
- 翻页过渡：双页同时 opacity 0 → 清空 → 从空白左页重新开始

---

## 页面路由

```
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│  缮写室   │  大书库   │馆长办公室 │ 读者沙龙  │ 馆史档案  │ 位面商店  │
│  (focus) │(bookshelf)│(library) │(visitors)│(archive) │  (shop)  │
└──────────┴──────────┴────┬─────┴──────────┴──────────┴──────────┘
                           │
                    ┌──────┴──────┐
                    │  子标签页    │
                    ├─────────────┤
                    │ 📊 概况     │  ← 氛围进度/描述/状态卡
                    │ 🏆 成就柜   │  ← 网格 + 稀有度 + 已解锁/灰化
                    │ 📦 收藏室   │  ← 分类图鉴 + 进度百分比
                    │ 🏺 布置     │  ← 植物盆栽 + 种子库存 + 标志牌
                    │ 📖 馆长手册  │  ← 功能介绍 + 核心循环 + FAQ
                    └─────────────┘
```

---

## 书籍数据

当前 24 本（book_001 ~ book_024），全部含 `plane: 'astral'` 字段。

### 初始解锁（2本）

| ID | 书名 | 作者 | 分类 | 字数 |
|----|------|------|------|------|
| book_001 | 小王子 | 圣埃克苏佩里 | 童话 | 14,000 |
| book_002 | 动物农场 | 乔治·奥威尔 | 寓言 | 29,000 |

### 共享池（商店/里程碑/阿九推销，17本）

| ID | 书名 | 作者 | 分类 | 字数 |
|----|------|------|------|------|
| book_003 | 老人与海 | 海明威 | 小说 | 25,000 |
| book_004 | 东京梦华录 | 孟元老 | 历史 | 15,000 |
| book_005 | 傲慢与偏见 | 简·奥斯汀 | 小说 | 123,000 |
| book_006 | 庄子 | 庄子 | 哲学 | 32,500 |
| book_007 | 本草纲目·草部 | 李时珍 | 科学 | 190,000 |
| book_008 | 物种起源 | 达尔文 | 科学 | 193,000 |
| book_009 | 红楼梦 | 曹雪芹 | 小说 | 400,000 |
| book_011 | 道德经 | 老子 | 哲学 | 5,162 |
| book_012 | 沉思录 | 马可·奥勒留 | 哲学 | 80,000 |
| book_013 | 理想国 | 柏拉图 | 哲学 | 300,000 |
| book_014 | 史记 | 司马迁 | 历史 | 530,000 |
| book_015 | 诗经 | 孔子编订 | 诗歌 | 39,000 |
| book_016 | 西游记 | 吴承恩 | 小说 | 860,000 |
| book_017 | 鲁滨逊漂流记 | 丹尼尔·笛福 | 小说 | 150,000 |
| book_018 | 几何原本 | 欧几里得 | 科学 | 600,000 |
| book_019 | 卡拉马佐夫兄弟 | 陀思妥耶夫斯基 | 哲学 | 450,000 |
| book_020 | 社会契约论 | 卢梭 | 哲学 | 80,000 |

### 沈明远专属池（好感度赠书，3本）

| ID | 书名 | 作者 | 分类 | 字数 |
|----|------|------|------|------|
| book_010 | 纯粹理性批判 | 康德 | 哲学 | 225,000 |
| book_021 | 第一哲学沉思集 | 笛卡尔 | 哲学 | 60,000 |
| book_022 | 传习录 | 王阳明 | 哲学 | 80,000 |

- 沈明远专属池书籍通过好感度事件赠送，不进商店/里程碑池
- book_021、book_022 为手写内容（非 AI 生成）

### 种子兑换书籍（2本）

| ID | 书名 | 作者 | 分类 | 字数 | 兑换条件 |
|----|------|------|------|------|----------|
| book_023 | 绿野仙踪 | 莱曼·弗兰克·鲍姆 | 童话 | 30,000 | 鹤望兰种子 ×5 |
| book_024 | 爱丽丝梦游奇境 | 刘易斯·卡罗尔 | 童话 | 30,000 | 魔法玫瑰种子 ×5 |

- 种子通过盆栽 Lv5 收获时 60% 概率掉落，集齐 5 颗兑换

---

## 迁移记录

旧存档自动补全字段：
- `starred: false` — 书籍收藏状态
- `damaged: false` + `repairWords: 0` — 书籍损毁
- `visitorFavors` — 访客好感度全局累计
- `claimedMilestones` — 里程碑领取记录
- `borrowLevel` — 借阅区等级（0~7）
- `focusLevel` — 缮写室等级（0~6）
- `planePortals: {}` — 位面传送门状态
- `nameLocked: false` — 铭牌命名状态
- `achievements: []` — 成就数组
- `introCompleted: false` — 新手引导标记
- `tutorialFlags: { maxAtmoStageSeen: 1, firstFocusComplete: false, firstVisitorArrive: false, firstShopOpen: false, firstLibraryOpen: false, firstBookComplete: false }` — 情境引导首遇标记
- `diary: []` — 墨墨日志条目
- `diaryFirsts: { visitorArrive, visitorBorrow, visitorReturn }` — 访客首次事件标记
- `diaryLastSummaryDate: ''` — 上次每日回顾日期
- 旧默认名 `星辉图书馆` → `归墟图书馆`

---

## 废弃/已移除

- 稀有度系统（common/rare/epic/legendary）
- 专注项目选择器（深度学习/工作事务/创意创作）
- `js/render.js` — 旧单体渲染文件，已拆分到 `render/` 目录并删除
- `demo/writing-animation.html` — 缮写动画原型，已集成到正式代码
- `VISITOR_SYSTEM.md` — 过时文档
- `MODIFY_BORROWING_AREA.md` — 借阅区改造指令，已实施完毕
- `BORROWING_AREA_DESIGN.md` — 借阅区设计，已实现
- `BOOK_SYSTEM_REDESIGN.md` — 书库改造纪要，已完成
- `二期架构增量.md` — 临时增量文档
- `SESSION_2026-05-12*.md` — 会话日志
- `boosfordemo1/` — 书籍原始草稿，已删除
- 画廊、音乐收集、Lv5 封面独立收集 — 与现有系统重复或过度设计，已砍

---

## 部署

- **平台**：腾讯云 EdgeOne Pages（自动 HTTPS + CDN + Git 推送自动部署）
- **代码托管**：Gitee（`sallyshen1987/library_demo`，分支 `refactor-book-system`）
- **域名**：`riftlib.com` + `riftlib.cn` + `riftlib.cloud`（待 ICP 备案后绑定自定义域名）
- **访问地址**：`https://riftlibdemo-5tyvfdz4.edgeone.cool`

---

## 技术债

| 项目 | 说明 |
|------|------|
| 商店状态不持久化 | `shopState` 存模块变量，页面刷新后重新随机 |
| `_mysteryBooks`（阿九推销） | 阿九 SALE_BOOKS 仍为虚构空壳书 |
| 访客专属书池 | 沈明远池已改造为真实书ID，小萤/云游/阿九池待建立 |
| 店占位升级项 | 古籍修复室、咖啡角、研究区仍为灰色占位卡片 |
| 位面系统 | 仅完成主位面（归墟图书馆）设定和书籍 plane 字段标注 |
| 古修复机制 | `damaged`/`repairWords` 字段已建，游戏循环未接入 |
