# 位面商店 · 系统设计文档

日期：2026-05-10

---

## 一、概述

商店名为「位面商店」，是用户获取新书的主要途径之一。页面分上下两大区域：图书馆升级区 + 新书区。

---

## 二、页面布局

```
┌─────────────────────────────────────────┐
│              🛒 位面商店                  │
│                                         │
│  ┌─ 图书馆升级 ─────────────────────────┐│
│  │  📚 借阅区升级  Lv.N  [升级 💰xxx]   ││
│  │  [    借阅区当前等级插画    ]         ││
│  │                                     ││
│  │  🚪 传送门大厅    装修中…            ││
│  │  📜 古籍修复室    装修中…            ││
│  │  ☕ 咖啡角        装修中…            ││
│  │  🔬 研究区        装修中…            ││
│  └──────────────────────────────────────┘│
│                                         │
│  ┌─ 新书上架 ───────────────────────────┐│
│  │  [书1] [书2] [书3] [书4] [书5] ←固定 ││
│  │                                     ││
│  │  🔥 限时特惠                         ││
│  │  [特价1] [特价2] [特价3]   ←轮换     ││
│  └──────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

---

## 三、图书馆升级区

### 3.1 借阅区升级（可运作）

| 属性 | 值 |
|------|-----|
| 等级范围 | Lv0（未建造）~ Lv7（圣所） |
| 美术素材 | `visual/library_readingarea/library_reading_0X_*.jpg`（7张） |
| 当前效果 | 纯装饰（数值暂不实现，标记技术债） |
| 升级方式 | 消耗代币逐级升级 |

素材文件与等级对应：
- Lv1: `library_reading_01_shell.jpg` — 外壳
- Lv2: `library_reading_02_tidy.jpg` — 整洁
- Lv3: `library_reading_03_open.jpg` — 开放
- Lv4: `library_reading_04_comfy.jpg` — 舒适
- Lv5: `library_reading_05_refined.jpg` — 精致
- Lv6: `library_reading_06_elegant.jpg` — 优雅
- Lv7: `library_reading_07_sanctum.jpg` — 圣所

UI 展示：当前等级插画 + 等级名称 + 升级按钮（显示价格）

### 3.2 占位项（不可购买）

四个未来功能，显示为灰态卡片：

| 项目 | 图标 | 简短描述 |
|------|------|----------|
| 传送门大厅 | 🚪 | 解锁多位面探索 |
| 古籍修复室 | 📜 | 修复损毁珍本 |
| 咖啡角 | ☕ | 延长访客停留时间 |
| 研究区 | 🔬 | 深度研究书籍获得加成 |

每个占位项：灰底 + 「🏗️ 装修中…」标识。

---

## 四、新书区

### 4.1 书源：共享书籍池 `data/book_pool.js`

商店和里程碑共享同一个书籍池，定义为 `data/book_pool.js`：

```js
// data/book_pool.js — 商店、里程碑、阿九推销共享
export const SHARED_POOL = [
  {
    bookId: 'book_003',       // 对应 data/books/book_003.js
    title: '老人与海',
    author: '海明威',
    category: '小说',
    totalWords: 25000,
    chapterCount: 5,
    description: '一位古巴老渔夫与海洋的史诗对决。',
    emoji: '🎣'
  },
  // ... 共7本
];
```

**设计原则：**
- SHARED_POOL 只存元数据（轻量引用），完整章节内容在 `data/books/book_xxx.js`
- 商店、里程碑、阿九推销三个系统都从此池读取
- 池中书籍可以标记为「商店可见」「里程碑可见」「阿九可见」来控制渠道（当前 Demo 7本全开）

**不进入商店池的书：**
| 书 | 原因 |
|-----|------|
| 《小王子》《动物农场》 | 初始已拥有 |
| 《纯粹理性批判》 | 沈明远好感度专属（存入 `data/visitor_books.js`） |

### 4.2 固定区

- **数量**：5本
- **选书逻辑**：从 SHARED_POOL 随机抽取 5 本，去重
- **重复处理**：如果池中未拥有的书不足 5 本，空位填充「新书上架中…」占位
- **刷新机制**：每 24 小时（真实时间）全部重新随机
  - 时间源：`getNow()` = `window.__dev?.getNow?.() || Date.now()`
  - `getNow()` 封装让 Dev 面板的时间快进也能推进商店刷新
  - 刷新判定：`getNow() - shopState.lastRefresh >= 24 * 3600 * 1000`
  - 页面每次渲染商店时检查是否过期
- **已拥有**：如果随机到 `state.books[bookId]` 存在且非 `locked`，UI 显示「已拥有」灰态，不可重复购买
- **补货倒计时**：每本书被买走后，该位置显示「补货中 · HH:MM:SS」，24 小时后自动刷新一本新书填上

### 4.3 轮换区（特价）

- **数量**：3本
- **选书逻辑**：从 SHARED_POOL 随机抽取 3 本，去重（可与固定区重复）
- **折扣**：`rand(0.3, 0.7)`，向下取整到整数代币
- **刷新机制**：
  - 与固定区使用同一个 `lastRefresh` 时间戳
  - 24 小时同步刷新
  - 上一轮的特价被买走后，24h 后随整区刷新重新随机
- **已拥有**：同固定区逻辑
- **补货倒计时**：同固定区，24 小时后随全店刷新

### 4.4 定价

- 固定区：500~800 代币随机（每本书单独随机，刷新时确定）
- 特价区：固定区原价 × 随机折扣，向下取整
- 不按字数浮动（保持简单，数值后续调优）

### 4.5 刷新机制的完整生命周期

```
页面加载
    │
    ▼
getNow() - lastRefresh >= 24h ?
    ├─ 否 → 展示已保存的 shopState（如果持久化了）或重新随机
    └─ 是 → 重新随机 fixed[5] + rotating[3]
            → 更新 lastRefresh = getNow()
            → 渲染商店

用户购买一本书
    │
    ▼
扣除代币 → state.books[bookId] 初始化 → saveState()
该位置变为「补货中」倒计时
    │
    ▼
24h 后 → 全刷新时该位置被新随机书替换
       → 但如果刷新前用户又打开了页面，倒计时显示剩余时间
```

---

## 五、购买流程与书籍状态初始化

### 5.1 购买流程

```
用户点击书籍卡片
        │
        ▼
┌──────────────────────────────┐
│       书籍详情弹窗             │
│                              │
│  📖 书名                      │
│  作者 · 分类 · 字数 · 章节数    │
│                              │
│  简介（藏书简介精简版）         │
│                              │
│  价格：xxx 代币                │
│  （特价显示划线原价 + 折扣标签） │
│                              │
│  [取消]       [确认购买 →]    │
└──────────────────────────────┘
        │ 用户点击确认
        ▼
    代币 >= 价格？
    ├─ 否 → alert「代币不足 💰」
    └─ 是 →
        spendCoins(price)
        ├─ 初始化 state.books[bookId]（见 5.2）
        ├─ addHistory('purchase', `购买《书名》`, `花费xxx代币`)
        ├─ saveState()
        ├─ 卡片 UI 变为「已拥有」
        └─ 该位置进入 24h 补货倒计时
```

### 5.2 购买后书籍状态初始化

从商店购买的新书，在 `state.books` 中以以下初始状态创建：

```js
state.books[bookId] = {
  unlockedChapters: [1],  // 第一章默认解锁
  copyCount: 0,
  masteryLevel: 0,        // 待首次誊抄后升至 Lv1
  copiedWords: 0,
  status: 'unlocked',     // 非 locked，可被选择誊抄
  starred: false,
  damaged: false,
  repairWords: 0
};
```

**关键行为：**
- `copiedWords = 0` → 不在专注页快捷选择区出现（符合「copiedWords > 0」规则）
- `masteryLevel = 0` → 「待誊抄」状态，书架显示「未开始」
- `status = 'unlocked'` → 书架可见，需去书架点「开始誊抄」后才能触发 `copiedWords > 0`
- `starred = false` → 不在收藏筛选结果中

### 5.3 与「已拥有」判断的关系

```
state.books[bookId] 存在 且 status !== 'locked'  → 「已拥有」
state.books[bookId] 不存在                         → 「可购买」
```

注意：旧存档可能残留 `status: 'locked'` 的书（从未解锁过），此时仍视为「可购买」。

---

## 六、数据结构

### 6.1 共享书籍池（`data/book_pool.js`）

见 4.1 节。同时 `data/book_pool.js` 导出一个工具函数：

```js
export function getAvailableBooks() {
  return SHARED_POOL.filter(b => {
    const bs = state.books[b.bookId];
    return !bs || bs.status === 'locked';
  });
}
```

### 6.2 商店运行时状态

```js
// js/render/shop.js 内部状态（模块级变量，不持久化）
let shopState = {
  fixed: [
    // { bookId, price, soldAt: timestamp|null }
  ],
  rotating: [
    // { bookId, originalPrice, discount, price, soldAt: timestamp|null }
  ],
  lastRefresh: 0       // 上次全店刷新时间戳
};
```

**刷新/补货逻辑伪代码：**

```js
function ensureShopState() {
  const now = getNow();
  const expired = (now - shopState.lastRefresh) >= 24 * 3600 * 1000;

  if (!shopState.fixed.length || expired) {
    // 全刷新
    const available = getAvailableBooks();
    shuffle(available);
    shopState.fixed = available.slice(0, 5).map(b => ({ bookId: b.bookId, price: rand(500, 800), soldAt: null }));
    shopState.rotating = available.slice(5, 8).map(b => {
      const price = rand(500, 800);
      const discount = rand(0.3, 0.7);
      return { bookId: b.bookId, originalPrice: price, discount, price: Math.floor(price * discount), soldAt: null };
    });
    shopState.lastRefresh = now;
  }

  // 单本补货检查（每本被买走24h后自动恢复）
  shopState.fixed.forEach(slot => {
    if (slot.soldAt && (now - slot.soldAt) >= 24 * 3600 * 1000) {
      const newBook = pickAvailable(getAvailableBooks());
      if (newBook) Object.assign(slot, { bookId: newBook.bookId, price: rand(500, 800), soldAt: null });
    }
  });
  // 轮换区同理
}
```

**技术债**：
- 商店状态当前不持久化，页面刷新后重新随机
- 后续需持久化 `shopState` 到 localStorage 或在 `state.js` 中加入 `state.shop`

---

## 七、文件变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 新建 | `data/book_pool.js` | 共享书籍池 |
| 新建 | `data/books/book_003.js` ~ `book_009.js` | 7本新书数据 |
| 修改 | `data/books.js` | 引入新书模块，组装 BOOKS |
| 重写 | `js/render/shop.js` | 完整商店 UI |
| 修改 | `js/app.js` | 商店购买逻辑、初始化 |
| 修改 | `js/state.js` | borrowLevel 从 0-3 扩展到 0-7 |

---

## 八、边界情况与时间系统

### 8.1 时间系统

所有时间判断统一使用 `getNow()`：

```js
function getNow() {
  return window.__dev?.getNow?.() || Date.now();
}
```

`window.__dev.getNow()` 返回 `Date.now() + __devTimeOffset`，确保 Dev 面板的「时间加速」功能能同时推进访客还书和商店刷新。

### 8.2 补货倒计时

每张已售出卡片显示倒计时：
- 计算：`24h - (getNow() - soldAt)`
- 显示格式：`HH:MM:SS`，每秒更新一次
- 倒计时归零 → 该位置自动补货（从可用池随机新书）
- 如果池中无可用新书 → 显示「新书上架中…」

### 8.3 完整边界表

| 情况 | 处理 |
|------|------|
| 用户已拥有池中所有书（7本全齐） | 固定区/特价区全部「已拥有」灰态 |
| 可用书不足8本（如只有3本未拥有） | 固定区填满未拥有的，剩余空位「新书上架中…」；特价区同理 |
| 可用书为0本 | 整个新书区显示「🎉 你已收集了所有可购买的书！新书上架中…」 |
| 代币不足 | 详情弹窗的「确认购买」按钮旁标红提示，点击弹 alert |
| 同本书出现在固定区和特价区 | 允许并存，购买一处后两处同步变为「已拥有」 |
| 用户连续打开页面（不关浏览器） | 每次 `renderShopPage()` 时检查 `ensureShopState()`，过期自动刷新 |
| 用户关闭浏览器24h后重开 | `ensureShopState()` 检测过期 → 全刷新 |
| Dev 面板时间加速24h | `getNow()` 返回值跳变 → `ensureShopState()` 判定过期 → 刷新 |
| 专注中打开商店 | 不影响，购买是独立操作 |
| 同一本书在上次刷新时买了，再次刷新又出现 | 已购买过 → 显示「已拥有」，不会重复购买 |

---

## 九、与现有系统的交互

### 9.1 书架
- 购买后 `state.books[bookId]` 即时创建，书架 `renderBookshelfPage()` 立即可见
- 新书状态 `unlocked` + `copiedWords: 0`，出现在「全部」和「未开始」筛选

### 9.2 专注页
- `copiedWords = 0` 不满足快捷选择条件（`copiedWords > 0`）
- 用户需先到书架 → 点书 →「开始誊抄此书」→ 自动切回专注页
- 首次誊抄后 `copiedWords > 0`，以后出现在快捷选择区

### 9.3 访客
- 新书 `status = 'unlocked'`，抄到 `completed` 后才可被访客借阅
- 新书 `category` 自动匹配现有访客偏好逻辑

### 9.4 里程碑
- 共享同一个 `SHARED_POOL`
- 未来里程碑送书时调用 `getAvailableBooks()` 过滤已拥有的书

### 9.5 存档
- 商店状态（`shopState`）**不写入 localStorage**（技术债）
- 书籍状态（`state.books[bookId]`）通过 `saveState()` 正常持久化
- 页面刷新后：已购买的书不会丢，但商店布局重新随机

### 9.6 阿九推销
- 未来阿九的 `sales_pitch` 事件也从 `SHARED_POOL` 随机选书
- 与商店同源，但走不同的触发路径（还书事件 vs 直接购买）
