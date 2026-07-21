# 长书分卷方案 · 程序改动设计

> 状态：**待架构师三审（v2.3 修订版）**  
> 版本：v2.3（2026-07-21）  
> 作者：克克（Claude Code）  
> 适用范围：异世界图书馆 / 归墟图书馆  
> 修订说明：v2.3 根据架构师二审反馈修复：① P1 吐槽占位符 `{title}`/`{missingVol}` 未替换（新增 `fillQuip`）；② P2-a `getRefreshWeight` 已拥有损坏卷仍刷出；③ P2-b 保底卷与加权抽取去重防重复上架；④ P2-c `collectVolumeGroup`/`canCollectVolumeGroup` 统一读 `state` 去除 books/visitors 参数；⑤ ⚪ 进度函数复用、`VOLUME_QUIPS` 条目形状、未用参数说明；⑥ 🔎 单卷+典藏双计数的目标稀释观察。

---

## 1. 背景与目标

### 1.1 问题

当前游戏内存在多部字数远超常规阅读耐心的"长书"：

| 书名 | 字数 | 25分钟番茄钟数 | 每天1小时所需天数 |
|---|---|---|---|
| 西游记 | 86 万 | ~344 个 | ~143 天 |
| 几何原本 | 60 万 | ~240 个 | ~100 天 |
| 史记 | 53 万 | ~212 个 | ~88 天 |
| 卡拉马佐夫兄弟 | 45 万 | ~180 个 | ~75 天 |
| 红楼梦 | 40 万 | ~160 个 | ~67 天 |

单本过长会导致：
- 玩家心理负担重，难以感知进度
- "完成一本书"的反馈周期过长
- 书架被少数几本书长期占用视觉空间

### 1.2 目标

1. 将长书按约 15 万字/卷拆分为多本独立书籍（物理分册）
2. 购买时**商店随机刷出单卷**，玩家逐卷收集；不提供一次性整包购买
3. 商店对已拥有部分卷的卷组做**轻偏置**，提高缺失卷出现概率（保留集卡惊喜感）
4. 访客按单卷借阅，单卷独立损坏/修复
5. 单卷不参与书架策展连携（`CURATION_PAIRS`）
6. 全卷**都完成**且**未损坏、未借出**时，可在**古籍修复室**合成为一本"典藏版"
7. 典藏版不会损坏，且占用 1 个书架格子（替代多卷占用的格子）
8. 典藏版才参与书架策展连携
9. 新增**卷追踪面板**，展示各卷组的收集/抄写进度与"可合成"状态
10. 访客会对"卷组不齐"的情况做出吐槽（复用现有叙事系统）

---

## 2. 术语定义

| 术语 | 定义 |
|---|---|
| **典藏版** | 长书的最终形态，如 `book_016`。不可直接购买，由全部单卷合成。不会损坏，参与连携。 |
| **单卷** | 长书的拆分单元，如 `book_016_vol1`。可购买、可抄写、可上架、可借阅、会损坏。不参与连携。 |
| **卷组（Volume Group）** | 一个典藏版 + 其所有单卷的集合，如"西游记卷组"。 |
| **卷追踪面板** | 书架页或古籍修复室内的常驻 UI，按卷组聚合显示进度（已得/未得、已抄/未抄）与"可合成"徽标。 |
| **古籍修复室** | 馆长办公室内新增子标签页，用于查看可合成卷组并执行合成。 |
| **轻偏置** | 商店刷新时，对"已拥有部分卷但组内未集齐"的卷组，提高其缺失卷的出现权重；但不屏蔽其他书，保留随机乐趣。 |

---

## 3. 拆分书目与卷数

拆分原则：
- 仅拆分 `totalWords >= 150,000` 的书籍
- 每卷字数控制在 **12 万 ~ 18 万** 之间
- 切分边界优先按章节边界，允许 ±30% 字数波动
- 拆卷后原书 ID 保留为典藏版，内容迁移到 `*_volN`

> ⚠️ **已知待复核（来自架构师审核 P2-⑦）**：`book_007`（19 万）、`book_008`（19.3 万）拆出的单卷仅约 9.5~10.3 万，低于"12~18 万"下限，且 19 万与现有单本（如 15 万《鲁滨逊漂流记》）体验差异不大。建议二阶段再决定是否拆分这两本，或放宽下限。本计划其余逻辑不依赖此决定。

### 3.1 拆分表

| 原书 ID | 书名 | 原字数 | 原章节数 | 卷数 | 单卷章节分配 | 单卷字数约 |
|---|---|---|---|---|---|---|
| `book_007` | 本草纲目·草部 | 19 万 | 12 | 2 | vol1: 1-6 章；vol2: 7-12 章 | 9.5 万 / 9.5 万 |
| `book_008` | 物种起源 | 19.3 万 | 15 | 2 | vol1: 1-7 章；vol2: 8-15 章 | 9.0 万 / 10.3 万 |
| `book_009` | 红楼梦 | 40 万 | 24 | 3 | vol1: 1-8 章；vol2: 9-16 章；vol3: 17-24 章 | 13.3 万 × 3 |
| `book_014` | 史记 | 53 万 | 10 | 4 | vol1: 1-3 章；vol2: 4-6 章；vol3: 7-8 章；vol4: 9-10 章 | 15.9 万 / 15.9 万 / 10.6 万 / 10.6 万 |
| `book_016` | 西游记 | 86 万 | 15 | 6 | vol1: 1-3 回；vol2: 4-5 回；vol3: 6-7 回；vol4: 8-10 回；vol5: 11-13 回；vol6: 14-15 回 | 17.2 万 / 11.5 万 / 11.5 万 / 17.2 万 / 17.2 万 / 11.5 万 |
| `book_018` | 几何原本 | 60 万 | 13 | 4 | vol1: 1-3 章；vol2: 4-6 章；vol3: 7-9 章；vol4: 10-13 章 | 13.8 万 × 3 / 18.5 万 |
| `book_019` | 卡拉马佐夫兄弟 | 45 万 | 12 | 3 | vol1: 1-4 部；vol2: 5-8 部；vol3: 9-12 部 | 15 万 × 3 |

### 3.2 不分卷书目

| 书名 | 字数 | 原因 |
|---|---|---|
| 傲慢与偏见 | 12.3 万 | 低于阈值 |
| 鲁滨逊漂流记 | 15 万 | 刚达阈值，可不分；若分则 1 卷无意义 |
| 沉思录 | 8 万 | 低于阈值 |
| 社会契约论 | 8 万 | 低于阈值 |

---

## 4. 核心规则

### 4.1 购买规则（单卷随机刷新 + 轻偏置）

- 商店不再直接出售长书典藏版，也**不提供整卷包**
- 商店池中包含各长书的**单卷条目**（`type: 'volume'`），每个条目对应一卷；单卷作为普通书被 `getAvailableBooks` 正常刷新
- 玩家在商店里随机遇到某卷，像买普通书一样点"购买"即可（复用现有 `purchaseBook`，无需新增购买函数）
- **轻偏置**：当玩家已拥有某卷组的至少一卷、但该组尚未集齐时，商店提高该组**缺失卷**的出现权重（见 5.4 / 7.1）。已拥有且完好的卷不会再次刷出
- 单卷价格见 11.2，由 `volumePrice` 字段定义，约等于「典藏版总价 ÷ 卷数」
- 典藏版 `status` 保持 `locked`，直到合成

### 4.2 抄写规则

- 每卷独立抄写，独立解锁章节
- 每卷完成时触发普通 `bookComplete` 流程；在 `bookComplete` 中读取 `BOOKS[bookId].meta.isVolume`，若为 `true` 则智慧之光与氛围奖励减半（证书动画保留）
- 单卷熟练度独立计算

### 4.3 上架与借阅规则

- 单卷完成（`status === 'completed'`）后可上架、可被访客借阅
- 访客借书时，候选池包含所有未损坏、未借出的单卷
- 单卷借阅时长按单卷字数计算
- 典藏版合成后，单卷从书架/手稿箱移除，典藏版自动上架并可借阅

### 4.4 损坏规则与修缮箱

- 单卷在还书时有 3% 概率损坏，损坏后需修复
- 典藏版**不会损坏**
- 损坏的单卷**不可用于合成**，必须先修复完成
- **修缮箱**：玩家在古籍修复室可将任意单卷"锁进修缮箱"。锁入后：
  - 该卷不会被访客借出
  - 该卷不会损坏
  - 仍可用于合成典藏版（无需取出）
  - 玩家可随时取出，取出后恢复正常的借出/损坏规则
- 修缮箱初始 **3 格免费**，最多 **20 格**；扩容价格见 11.3

### 4.5 合成规则

- 某卷组的**全部**单卷都达到 `status === 'completed'` 且 `damaged === false` 且**未被借出（或已锁入修缮箱）**时，才可合成（修复 P0-②：借出中的卷会使合成后访客还书悬空）
- 合成入口在馆长办公室 → 古籍修复室
- 合成后：
  - 解锁 `book_016`（典藏版），状态为 `completed`，`masteryLevel = 5`；典藏版**不参与重抄系统**，直接拥有满级权益
  - 从书架、手稿箱和修缮箱中移除所有单卷 `book_016_vol1` ~ `book_016_vol6`
  - 典藏版自动上架；**若书架已满，则放入手稿箱顶部**（修复 P1-③：`placeOnShelf` 满架返回 `false`，必须处理返回值，不可静默丢弃）
  - 记录历史事件：`在古籍修复室将《西游记》六卷合成为典藏版`
  - 奖励：氛围 +10，智慧之光 +100

### 4.6 连携规则

- `CURATION_PAIRS` 中只使用典藏版 ID（如 `book_016`）
- 单卷阶段不触发任何连携 bonus
- 合成典藏版后，正常触发连携

### 4.7 成就与目标规则

- **"完成一本书"类成就**：单卷完成不计入；典藏版合成后计入一次
- **阶段目标"完成 X 本书"**：单卷完成计入一次；典藏版合成后再计入一次
  > ⚠️ 设计观察：7 组全做完会累计 24（单卷）+ 7（典藏）= 31 次"完成书"计数，可能使"完成 X 本书"类目标在单卷阶段即被刷满。若希望目标更"重质"，可考虑单卷阶段不计入、仅典藏版计入。待产品拍板。
- 统计函数（`countOwnedBooks` / `countCategoryBooks` 等）遇到 `isVolumeBookId` 时须归并到 `collectedBookId` 计数，忽略单卷（修复 P1-④：否则买一套 6 卷会冲掉"拥有 10 本书"大半进度）
- 新增成就（可选）：`卷轴收藏家`——首次合成一本典藏版

---

## 5. 数据结构设计

### 5.1 新增卷组配置 `data/volume_groups.js`

```javascript
export const VOLUME_GROUPS = {
  book_007: {
    collectedBookId: 'book_007',
    title: '本草纲目·草部',
    emoji: '🌿',
    category: '科学',
    author: '李时珍',
    volumeIds: ['book_007_vol1', 'book_007_vol2'],
    volumePrice: 300,          // 单卷价格（原 bundlePrice 已移除）
    volumeCount: 2
  },
  book_008: {
    collectedBookId: 'book_008',
    title: '物种起源',
    emoji: '🐦',
    category: '科学',
    author: '达尔文',
    volumeIds: ['book_008_vol1', 'book_008_vol2'],
    volumePrice: 300,
    volumeCount: 2
  },
  book_009: {
    collectedBookId: 'book_009',
    title: '红楼梦',
    emoji: '🏮',
    category: '小说',
    author: '曹雪芹',
    volumeIds: ['book_009_vol1', 'book_009_vol2', 'book_009_vol3'],
    volumePrice: 367,
    volumeCount: 3
  },
  book_014: {
    collectedBookId: 'book_014',
    title: '史记',
    emoji: '📜',
    category: '历史',
    author: '司马迁',
    volumeIds: ['book_014_vol1', 'book_014_vol2', 'book_014_vol3', 'book_014_vol4'],
    volumePrice: 325,
    volumeCount: 4
  },
  book_016: {
    collectedBookId: 'book_016',
    title: '西游记',
    emoji: '🐒',
    category: '小说',
    author: '吴承恩',
    volumeIds: ['book_016_vol1', 'book_016_vol2', 'book_016_vol3',
                'book_016_vol4', 'book_016_vol5', 'book_016_vol6'],
    volumePrice: 317,
    volumeCount: 6
  },
  book_018: {
    collectedBookId: 'book_018',
    title: '几何原本',
    emoji: '📐',
    category: '科学',
    author: '欧几里得',
    volumeIds: ['book_018_vol1', 'book_018_vol2', 'book_018_vol3', 'book_018_vol4'],
    volumePrice: 350,
    volumeCount: 4
  },
  book_019: {
    collectedBookId: 'book_019',
    title: '卡拉马佐夫兄弟',
    emoji: '⚖️',
    category: '哲学',
    author: '陀思妥耶夫斯基',
    volumeIds: ['book_019_vol1', 'book_019_vol2', 'book_019_vol3'],
    volumePrice: 400,
    volumeCount: 3
  }
};

/** 商店刷新偏置配置（动态轻偏置） */
export const VOLUME_REFRESH = {
  baseWeight: 1.0,        // 普通书 / 未拥有卷组的卷的基础权重
  minBias: 2.0,           // 拥有 1 卷时的偏置系数
  maxBias: 5.0,           // 拥有 total-1 卷时的偏置系数
  // 动态公式：bias = minBias + (owned / total) * (maxBias - minBias)
  // 例：6 卷组拥有 1 卷 → 2.5；拥有 3 卷 → 3.5；拥有 5 卷 → 5.0
  // 2 卷组拥有 1 卷 → 3.5
  // 保留随机乐趣，同时让"临门一脚"更容易出现
};

/** 临门一脚保底：当某卷组只差 1 卷时，下一次商店刷新必出该缺失卷 */
export const VOLUME_GUARANTEE = {
  enabled: true,
  triggerGap: 1,          // gap === 1 时触发
};

/** 判断某 bookId 是否是卷组中的单卷 */
export function isVolumeBookId(bookId) {
  return Object.values(VOLUME_GROUPS).some(g => g.volumeIds.includes(bookId));
}

/** 根据单卷 ID 找到所属卷组 */
export function getVolumeGroupByVolumeId(volumeId) {
  return Object.values(VOLUME_GROUPS).find(g => g.volumeIds.includes(volumeId)) || null;
}

/** 根据典藏版 ID 找到卷组 */
export function getVolumeGroupByCollectedId(collectedId) {
  return VOLUME_GROUPS[collectedId] || null;
}

/**
 * 计算卷组的抄写进度（纯函数，不读 state）
 * completed：已抄写完成且未损坏（不含借出/修缮箱状态），用于卷追踪面板和吐槽分桶
 * booksData：{ [id]: bookState }
 */
export function getVolumeGroupProgress(group, booksData) {
  const completed = group.volumeIds.filter(id => {
    const bs = booksData[id];
    return bs && bs.status === 'completed' && !bs.damaged;
  }).length;
  return { completed, total: group.volumeCount };
}

/**
 * 返回"已拥有部分卷但未集齐"的卷组（供访客吐槽 + 轻偏置判定）
 * 纯函数，传入 booksData
 */
export function getIncompleteVolumeGroups(booksData) {
  return Object.values(VOLUME_GROUPS).filter(g => {
    const owned = g.volumeIds.filter(id => {
      const bs = booksData[id];
      return bs && bs.status !== 'locked';
    });
    return owned.length > 0 && owned.length < g.volumeCount;
  });
}
```

### 5.2 书籍数据文件拆分

原 `data/books/book_016_西游记.js` 拆分为：
- `data/books/book_016_西游记.js`：保留为典藏版，只含 meta（无 chapters/quotes 或仅含展示文本）
- `data/books/book_016_vol1_西游记.js`
- `data/books/book_016_vol2_西游记.js`
- ...
- `data/books/book_016_vol6_西游记.js`

单卷文件示例结构：

```javascript
// data/books/book_016_vol1_西游记.js
export const meta = {
  id: 'book_016_vol1',
  volumeGroupId: 'book_016',
  volumeIndex: 1,
  volumeTitle: '西游记 · 卷一',
  title: '西游记',
  titleEn: 'Journey to the West',
  author: '吴承恩',
  category: '小说',
  era: 'ERA_005',
  totalWords: 172000,
  description: '西游记第一卷，从石猴出世到官封弼马心何足。',
  emoji: '🐒',
  certMessage: '第一卷已成，西行之路刚刚展开。',
  // 其他 meta 字段...
  isVolume: true,           // 标识这是单卷
  collectedBookId: 'book_016'
};

export const chapters = [/* 第 1-3 回 */];
export const quotes = { /* 本卷名言 */ };
```

典藏版文件结构：

```javascript
// data/books/book_016_西游记.js
export const meta = {
  id: 'book_016',
  title: '西游记（典藏版）',
  titleEn: 'Journey to the West',
  author: '吴承恩',
  category: '小说',
  era: 'ERA_005',
  totalWords: 860000,
  description: '中国古典四大名著之一，明代神魔小说巅峰之作。',
  emoji: '🐒',
  certMessage: '九九八十一难，第一难是提笔，你已经过了。',
  // ...
  isCollectedEdition: true,  // 标识这是典藏版
  volumeGroupId: 'book_016',
  cannotBePurchased: true,   // 不可直接购买
  indestructible: true       // 不会损坏
};

export const chapters = [];  // 空，或合并所有卷章节仅用于展示
export const quotes = { /* 全书名言，或保留原 quotes */ };
```

### 5.3 书籍状态 `state.books[bookId]`

无需新增字段。单卷和典藏版均使用现有的 `CANONICAL_BOOK_FIELDS`：

```javascript
{
  unlockedChapters: [1],
  copyCount: 0,
  masteryLevel: 0,
  copiedWords: 0,
  status: 'locked',        // 单卷初始 locked，购买后 unlocked → copying → completed
  starred: false,
  damaged: false,
  repairWords: 0,
  repairProgress: 0,
  readChapters: [],
  reCopyUnlocked: false
}
```

典藏版初始状态为 `locked`，合成后变为 `completed`。

### 5.4 商店池 `data/book_pool.js`

长书条目从 SHARED_POOL 中移除，替换为**每个单卷一条** `type: 'volume'` 条目：

```javascript
{
  type: 'volume',                 // 新增类型，区别于普通书
  plane: 'astral',
  volumeGroupId: 'book_016',
  bookId: 'book_016_vol1',        // 实际书籍 ID（对应 BOOKS 中的单卷定义）
  volumeIndex: 1,
  title: '西游记',
  volumeTitle: '西游记 · 卷一',
  subtitle: '卷 1 / 6',
  author: '吴承恩',
  category: '小说',
  totalWords: 172000,
  description: '神魔皆有人情，精魅亦通世故。中国古典四大名著之一。',
  emoji: '🐒',
  price: 317,                     // 单卷价格（取自 VOLUME_GROUPS[group].volumePrice）
  baseWeight: 1.0                 // 刷新基础权重，供轻偏置计算
}
// ... 其余 5 卷各一条
```

普通书条目保持 `type: 'book'`（或默认无 type），不参与偏置。

> 注：单卷条目**不携带 `chapterCount` 冗余字段**（修复 P2-⑨：章节数从 `BOOKS[id].chapters` 取，避免失真）。

---

## 6. 模块改动清单

### 6.1 数据层

| 文件 | 改动 |
|---|---|
| `data/volume_groups.js` | **新增**：卷组配置、偏置配置、查询/进度/缺失组工具函数 |
| `data/books/*.js` | **拆分**：7 本长书各拆出 vol 文件，原文件改为典藏版 |
| `data/books.js` | **修改**：导入所有 vol 文件和典藏版文件，组装 `BOOKS[id]` |
| `data/book_pool.js` | **修改**：长书条目改为多条 `type: 'volume'` 条目（每卷一条） |
| `data/curation_pairs.js` | **修改**：长书 ID 保持不变（已经是典藏版 ID），确保连携只匹配典藏版 |

### 6.2 业务逻辑层

| 文件 | 改动 |
|---|---|
| `js/core/economy.js` | **修改**：`getAvailableBooks` 增加动态轻偏置 + 临门一脚保底；新增 `getRefreshWeight` / `getGuaranteedVolumeEntries`（见 7.1）；单卷按普通书过滤（已拥有且完好的卷权重置 0） |
| `js/shop.js` | **修改**：单卷走普通 `purchaseBook`；`ensureShopState` / 补货逻辑改为调用 `core/economy.js` 的 `getAvailableBooks` 或 `getRefreshWeight`，确保轻偏置生效；裴舟推荐过滤为只推荐缺失单卷（见 7.5） |
| `js/capacity.js` | **新增修缮箱操作**：`canStoreInRestorationBox` / `storeInRestorationBox` / `removeFromRestorationBox`；`createBookRecord` 通用；单卷购买即入手稿箱（一次一卷） |
| `js/volumes.js` | **新增**：`canCollectVolumeGroup` / `collectVolumeGroup`（含借出/修缮箱检查 + 上架回退，见 7.2） |
| `js/curation.js` / `js/core/curation.js` | **修改**：连携计算过滤单卷（见 7.3，参数化，不读 state） |
| `js/visitors.js` | **修改**：`getCompletedBooks` 只返回 `status === 'completed'` 的书；`triggerNarrative` 以 18% 概率用 `maybeVolumeQuip` 替代 common，末尾调用 `tickQuipCooldown()`；`attemptBorrow` 二阶段以 25% 概率气泡展示定向吐槽（见 7.4） |
| `js/achievements.js` | **修改**：`countOwnedBooks` / `countCategoryBooks` 遇到 `isVolumeBookId` 归并到 `collectedBookId`（P1-④） |
| `js/app.js` | **修改**：专注完成逻辑无需特殊处理，单卷完成即触发 bookComplete；合成典藏版时不应再次触发完成奖励 |
| `js/state.js` | **修改**：DEFAULT_BOOKS 增加所有 vol 和典藏版；新增 `restorationBox: []` 与 `restorationBoxSlots: 3`；旧存档迁移逻辑处理已解锁长书 → 解锁全部单卷（含 `unlockedChapters` 修复，见 8.1） |

### 6.3 渲染层

| 文件 | 改动 |
|---|---|
| `js/render/shop.js` | **小改**：`type: 'volume'` 条目显示"卷 N / M"徽标与单卷价格；复用普通购买按钮（点击即 `purchaseBook`） |
| `js/render/bookshelf.js` | **修改**：单卷显示为"书名 · 卷 N"；**新增卷追踪面板**（见 6.4）展示各卷组进度与"可合成"徽标 |
| `js/render/focus.js` | **修改**：书籍选择器中单卷显示卷名；进度条保持单卷进度 |
| `js/render/library.js` | **修改**：新增"古籍修复室"子标签页；渲染可合成卷组列表、合成按钮、修缮箱存取 UI（含"某卷外借中/损坏中"提示） |
| `js/render/visitors.js` | **修改**：借阅/还书提示中显示单卷全名（如《西游记 · 卷三》） |

### 6.4 新增文件

| 文件 | 用途 |
|---|---|
| `data/volume_groups.js` | 卷组静态配置 + 偏置配置 + 工具函数 |
| `js/volumes.js` | 合成逻辑（canCollect / collect），纯状态操作封装 |
| `js/render/restoration.js` | 古籍修复室渲染逻辑（可并入 `js/render/library.js`，若代码量大则独立） |
| `js/render/volumeTracker.js` | **新增**：卷追踪面板组件（按卷组聚合进度 + 可合成徽标），可嵌入书架页或修复室 |
| `data/volume_quips.js` | **新增**：三桶文案表 `VOLUME_QUIPS` + 触发/冷却配置 `VOLUME_QUIP_CONFIG` |
| `js/volumeQuips.js` | **新增**：`maybeVolumeQuip` / `pickTargetGroup` / `groupProgress`（纯叙事，与偏置解耦） |

---

## 7. 关键函数设计

### 7.1 商店单卷刷新：动态轻偏置 + 临门一脚保底

单卷复用普通 `purchaseBook`，无需新的购买函数。业务新增两部分：**刷新权重**和**保底强制刷新**。

```javascript
// js/core/economy.js（纯函数，无状态依赖，对齐 core-extraction-plan）
import { VOLUME_GROUPS, VOLUME_REFRESH, VOLUME_GUARANTEE, getIncompleteVolumeGroups }
  from '../data/volume_groups.js';

/**
 * 计算某条 pool 条目的刷新权重。
 * - 普通书：baseWeight
 * - 单卷：已拥有且完好 → 0（不再刷出）；属于"已部分拥有"的组 → 动态偏置
 */
export function getRefreshWeight(entry, booksData) {
  if (entry.type !== 'volume') return entry.baseWeight ?? 1.0;

  const volState = booksData[entry.bookId];
  // 已拥有（无论是否损坏）→ 不刷；损坏卷走修复室路径，不应再作为新商品出售（P2-a 修复）
  if (volState && volState.status !== 'locked') return 0;

  // 该组已拥有部分卷（但组未集齐）→ 动态轻偏置
  const group = VOLUME_GROUPS[entry.volumeGroupId];
  if (!group) return entry.baseWeight ?? 1.0;

  const owned = group.volumeIds.filter(id => {
    const bs = booksData[id];
    return bs && bs.status !== 'locked';
  }).length;

  if (owned > 0 && owned < group.volumeCount) {
    const ratio = owned / group.volumeCount;
    const bias = VOLUME_REFRESH.minBias + ratio * (VOLUME_REFRESH.maxBias - VOLUME_REFRESH.minBias);
    return (entry.baseWeight ?? 1.0) * bias;
  }

  return entry.baseWeight ?? 1.0;
}

/**
 * 临门一脚保底：返回 gap === 1 的缺失单卷条目。
 * 调用方应把这些条目放入本次刷新结果；若多组同时 gap===1，为避免占满商店，
 * 每轮刷新最多只取 1 条保底卷（随机挑一个 gap===1 的组），其余槽位走动态偏置。
 */
export function getGuaranteedVolumeEntries(sharedPool, booksData) {
  if (!VOLUME_GUARANTEE.enabled) return [];

  const candidates = [];
  Object.values(VOLUME_GROUPS).forEach(group => {
    const ownedIds = group.volumeIds.filter(id => {
      const bs = booksData[id];
      return bs && bs.status !== 'locked';
    });
    const missingIds = group.volumeIds.filter(id => !ownedIds.includes(id));
    if (missingIds.length === VOLUME_GUARANTEE.triggerGap) {
      missingIds.forEach(id => {
        const entry = sharedPool.find(p => p.bookId === id && p.type === 'volume');
        if (entry) candidates.push({ group, entry });
      });
    }
  });

  if (candidates.length === 0) return [];
  // 每轮最多保 1 条
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  return [picked.entry];
}

// getAvailableBooks 在选取 rotating 槽位时：
// 1. 先把 getGuaranteedVolumeEntries 的最多 1 条保底卷放入固定/特价区
// 2. 剩余槽位按 getRefreshWeight 做加权随机抽样，且**必须从候选池排除已保底的 bookId**
//    （否则保底卷可能被加权抽中两次，商店同一卷出现重复）——直接过滤候选池或临时置 0 其权重
// 3. 保底卷与加权卷之间不做跨区去重，由本步骤统一保证唯一
```

> 设计取舍：
> - **动态偏置**：拥有卷数越多，偏置越高。既保留前期淘书惊喜，又降低临门一脚的挫败。
> - **临门一脚保底**：当某卷组只差 1 卷时，**每次商店刷新都会包含该缺失卷**（而非只保一次）。这是"最后一块拼图"的确定性保障。
> - **保底槽位限制**：若多组同时 gap===1，为避免商店被保底卷占满，每轮刷新最多保留 **1 个保底槽位**给 gap===1 的缺失卷；其余槽位仍按动态偏置填充。这样既保证玩家能买到缺失卷，又保留普通书出现空间。
> - 两者结合：保底优先占 1 槽，偏置填充剩余槽位，普通书仍有出现空间。
> 
> **重要**：当前 `js/shop.js` 有自己的 `getAvailableBooks`（第 44 行）和 `ensureShopState` 刷新逻辑。实施时必须让 `js/shop.js` 调用 `js/core/economy.js` 的 `getAvailableBooks` / `getRefreshWeight` / `getGuaranteedVolumeEntries`，否则偏置与保底都不会生效。

### 7.2 合成典藏版（含借出检查 + 上架回退）

```javascript
// js/volumes.js（新增模块）
import { getVolumeGroupByCollectedId } from '../data/volume_groups.js';

/** 该单卷是否"可被合成"（完成、未损坏、未借出，或已锁入修缮箱）。
 *  统一读 state.books / state.visitors，不再依赖调用方传入的快照，
 *  避免判定用的 books/visitors 与变更用的 state.* 数据不一致（P2-c 修复） */
function isVolumeCollectable(volId) {
  const bs = state.books[volId];
  if (!bs || bs.status !== 'completed' || bs.damaged) return false;
  // 锁入修缮箱的卷可直接参与合成
  if ((state.restorationBox || []).includes(volId)) return true;
  // 借出中（修复 P0-②）：复用与 getCompletedBooks 一致的借出判定
  const borrowed = (state.visitors || []).some(v =>
    v.bookId === volId && (v.status === 'borrowed' || v.status === 'due'));
  return !borrowed;
}

export function canCollectVolumeGroup(group) {
  // 全组都 collectable 才可合成
  return group.volumeIds.every(id => isVolumeCollectable(id));
}

export function collectVolumeGroup(group) {
  if (!canCollectVolumeGroup(group)) {
    return { ok: false, reason: 'not_ready' };
  }

  // 从书架移除所有单卷
  state.library.shelves.forEach(shelf => {
    shelf.forEach((slot, idx) => {
      if (group.volumeIds.includes(slot)) shelf[idx] = null;
    });
  });

  // 从手稿箱移除所有单卷
  state.manuscriptBox = state.manuscriptBox.filter(id => !group.volumeIds.includes(id));

  // 从修缮箱移除所有单卷（合成后不再需要）
  state.restorationBox = (state.restorationBox || []).filter(id => !group.volumeIds.includes(id));

  // 创建典藏版记录
  state.books[group.collectedBookId] = createBookRecord({
    status: 'completed',
    masteryLevel: 5,
    copyCount: 1,
    copiedWords: BOOKS[group.collectedBookId].totalWords
  });

  // 典藏版上架；满架则回退到手稿箱（修复 P1-③：必须处理返回值）
  const placed = placeOnShelf(group.collectedBookId);
  if (!placed) {
    const ok = addToManuscriptBox(group.collectedBookId);
    if (!ok) {
      // 极端情况：手稿箱也满。保留记录但提示，避免凭空消失
      console.warn('[volumes] 典藏版上架失败且手稿箱已满：', group.collectedBookId);
    }
  }

  // 奖励
  addAtmosphere(10);
  addCoins(100);
  addHistory('event', `📜 在古籍修复室合成《${group.title}》典藏版`, '全卷合璧，永驻书架');
  saveState();

  return { ok: true, collectedBookId: group.collectedBookId };
}
```

### 7.3 连携计算过滤单卷（参数化，对齐 core 提取）

```javascript
// js/core/curation.js
import { isVolumeBookId } from '../data/volume_groups.js';

/** 参数化：接收 bookId 与 bookState，不读全局 state（对齐 core-extraction-plan） */
export function isEligibleForCuration(bookId, bookState) {
  if (isVolumeBookId(bookId)) return false;   // 单卷不参与连携
  return bookState && bookState.status === 'completed' && !bookState.damaged;
}
```

在遍历书架计算连携前，先用此函数过滤。调用方在书架渲染/状态栏计算时传入 `(slotId, state.books[slotId])`。

### 7.4 访客借阅候选池 + 卷组不齐吐槽

借阅候选池（现有 `getCompletedBooks`）无需大改：单卷完成自然进入候选池，典藏版合成后也进入。仅确保书名显示用 `book.volumeTitle || book.title`。

#### 7.4.1 三桶分语气（互斥，按"距可合成差几本"判定）
对未集齐组 `g`，定义：
- `owned` = 已拥有的卷数（`status !== 'locked'`）
- `completed` = 已抄写完成且未损坏的卷数（**不含借出状态**，避免"全抄完但外借中"被误判为差一卷）
- `gap = g.volumeCount - completed`

| 桶 | 条件 | 语气 | 文案示例（支持 `{title}` 占位符） |
|---|---|---|---|
| A 起步/进行中 | `gap >= 2` 且 `owned < total` | 鼓励 | "《{title}》才攒了几卷？慢慢来，书斋最不缺的是时间。" |
| B 临门一脚 | `gap == 1` | 催促 | "《{title}》就差最后一卷了，你这是吊自己胃口啊。" |
| C 卡壳 | `owned == total` 且 `gap >= 2` | 无奈 | "《{title}》六卷都到手了，怎么还差几本没抄完？" |

> `completed` 只看抄写完成度，合成可用性（是否被借出）由 `canCollectVolumeGroup` 单独判断。吐槽分桶与合成检查语义分离，避免玩家"明明都抄完了"却被吐槽"还差一卷"的困惑。

#### 7.4.2 锚定算法（临门一脚优先）
`pickTargetGroup(booksData, visitors)`：
1. 取 `getIncompleteVolumeGroups(booksData)` 并算每组 `gap`
2. 若有 `gap === 1` 的组 → 在其间随机挑（临门一脚优先，引导性最强）
3. 否则退化到 `gap` 最小（最接近集齐）的组
4. 返回该组；借书分支直接用 `ctx.currentVolGroupId` 锁定同组

#### 7.4.3 触发点与概率（双链，单访客最多 1 条）
- **主触发·还书（必做）**：`triggerNarrative` 的常层分支，以 18% 概率用卷组吐槽替代本次 common：
  ```javascript
  const vq = maybeVolumeQuip(state.books, state.visitors, VOLUME_QUIP_CONFIG.arriveChance);
  result.common = vq || pickCommonEvent(charId);
  ```
  无论是否触发，在 `triggerNarrative` 末尾调用 `tickQuipCooldown()`，对所有 `groupVisits` 减 1。
- **借书顺势（二阶段）**：在 `attemptBorrow` 成功路径，若所借 `book.id` 为单卷（`isVolumeBookId`）且其同组 `gap > 0`，以 `borrowChance`(0.25) 生成定向吐槽，通过现有气泡/吐司函数（如 `showVisitorQuip`）直接展示，**不持久化进 visitor 状态**，避免脏数据进存档和渲染链路不明。调用 `maybeVolumeQuip` 时须传 `ctx: { trigger: 'borrow', currentVolGroupId: <组ID>, missingVolTitle: BOOKS[book.id].meta.volumeTitle }`，使 `{missingVol}` 解析为所借单卷名。
- 两链独立、不叠加；同一访客至多 1 条吐槽。

#### 7.4.4 去重 + 冷却（防刷屏）
新增全局轻量状态 `state.quipCooldown = { recent: string[], groupVisits: { [groupId]: number } }`：
- `recent`：最近 3 条已说 text，新吐槽命中则重选或跳过（句级去重）
- `groupVisits`：同组冷却，触发某组时设为 `groupCooldownVisits`(3)，每次还书对所有组 -1
- 命中冷却/去重则 `maybeVolumeQuip` 返回 null（退回普通 common）

> 不污染现有 `ns.commonTriggered`（那是 per-charId 常层去重，跨角色不共享）；卷组吐槽跨角色，故用全局冷却。

#### 7.4.5 与偏置解耦（重要取舍）
吐槽**纯叙事，绝不修改 `getRefreshWeight` / `VOLUME_REFRESH`**。否则出现"访客吐槽某组 → 商店更刷那组"的隐藏耦合，debug 极难。单一职责：吐槽只管吐槽。

#### 7.4.6 文案表 `data/volume_quips.js`（独立，不污染 `VISITOR_NARRATIVES`）
```javascript
export const VOLUME_QUIPS = {
  start:   [ /* 桶A 鼓励型 4~6 条，支持 {title} */ ],
  oneAway: [ /* 桶B 催促型 4~6 条，支持 {title} */ ],
  stuck:   [ /* 桶C 无奈型 4~6 条，支持 {title}/{missingVol} */ ]
};
export const VOLUME_QUIP_CONFIG = {
  arriveChance: 0.18,        // 还书主触发概率
  borrowChance: 0.25,        // 借书顺势概率（二阶段）
  groupCooldownVisits: 3,    // 同组冷却次数（访客事件计）
  recentMemory: 3            // 同句记忆条数
};
```
占位符：`{title}`（组名，如 西游记）、`{missingVol}`（缺失卷名，如 卷三，借书分支用）。

#### 7.4.7 落地函数签名（建议新增 `js/volumeQuips.js`）
```javascript
import { getIncompleteVolumeGroups, getVolumeGroupByCollectedId, isVolumeBookId }
  from '../data/volume_groups.js';
import { VOLUME_QUIPS, VOLUME_QUIP_CONFIG } from '../data/volume_quips.js';

/** 计算组进度：owned / completed / gap（completed 只看抄写完成度，不看借出） */
function groupProgress(group, booksData, visitors) { /* ... 见 7.4.1 ... */ }

/** 锚定目标组：临门一脚优先，否则最接近集齐（见 7.4.2） */
function pickTargetGroup(booksData, visitors) { /* ... */ }

/** 每次还书结束时调用：所有 groupVisits 减 1，归零删除 */
export function tickQuipCooldown() {
  const qc = state.quipCooldown;
  if (!qc) return;
  Object.keys(qc.groupVisits).forEach(gid => {
    qc.groupVisits[gid] -= 1;
    if (qc.groupVisits[gid] <= 0) delete qc.groupVisits[gid];
  });
}

/**
 * 主入口：返回 { bucket, text } 或 null（被冷却/去重拦截时）
 * ctx: { trigger: 'return' | 'borrow', currentVolGroupId? }
 */
export function maybeVolumeQuip(booksData, visitors, chanceOverride, ctx = {}) {
  if (Math.random() > (chanceOverride ?? VOLUME_QUIP_CONFIG.arriveChance)) return null;

  // 防御性初始化（兼容旧存档）
  if (!state.quipCooldown) {
    state.quipCooldown = { recent: [], groupVisits: {} };
  }

  const target = ctx.currentVolGroupId
    ? getVolumeGroupByCollectedId(ctx.currentVolGroupId)
    : pickTargetGroup(booksData, visitors);
  if (!target) return null;

  const p = groupProgress(target, booksData);
  const bucket = p.gap === 1 ? 'oneAway'
    : (p.owned === p.total && p.gap >= 2 ? 'stuck' : 'start');

  // 同组冷却检查
  const qc = state.quipCooldown;
  if ((qc.groupVisits[target.collectedBookId] || 0) > 0) return null;

  // 文案池非空检查
  const pool = VOLUME_QUIPS[bucket];
  if (!pool || pool.length === 0) return null;

  // 句级去重：过滤最近 3 条；若全部命中则跳过
  const candidates = pool.filter(q => !qc.recent.includes(q.text));
  const chosen = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : null;
  if (!chosen) return null;

  // 更新冷却
  qc.recent.push(chosen.text);
  if (qc.recent.length > VOLUME_QUIP_CONFIG.recentMemory) {
    qc.recent.shift();
  }
  qc.groupVisits[target.collectedBookId] = VOLUME_QUIP_CONFIG.groupCooldownVisits;

  // 占位符替换（P1 修复：渲染层不识别 {title}/{missingVol}，必须在此替换，否则玩家看到原文）
  const text = fillQuip(chosen.text, target.title, ctx.missingVolTitle || '');

  return { bucket, text };
}

/**
 * 替换文案占位符：{title}=组名；{missingVol}=缺失/所借单卷名（借书分支由调用方传入）
 * 纯函数，避免把占位符替换散落到各渲染层
 */
function fillQuip(text, title, missingVol) {
  return (text || '')
    .replace(/\{title\}/g, title || '')
    .replace(/\{missingVol\}/g, missingVol || '');
}
```

> **实现注意（一致性，⚪ 小瑕疵修复）**：
> - `groupProgress`（7.4.7）的 `completed` 计数应直接复用 5.1 的 `getVolumeGroupProgress(group, booksData).completed`，不要另写一份，避免两处逻辑漂移。
> - `VOLUME_QUIPS` 条目必须为 `{ text: string }` 对象（非纯字符串），`maybeVolumeQuip` 按 `q.text` 读取；占位符 `{title}`/`{missingVol}` 写在 text 字符串中。
> - `groupProgress(group, booksData, visitors)` 的 `visitors` 参数当前未使用，可移除。

### 7.5 裴舟荐书：只推荐缺失单卷

`js/shop.js` 的推荐生成逻辑（`eventPeizhouRecommend` / `getActivePeizhouRec`）需增加过滤：

- 若玩家存在"已拥有部分卷但未集齐"的卷组，优先从这些卷组的**缺失单卷**中随机选择
- 不推荐典藏版（`cannotBePurchased: true`）
- 不推荐已拥有或已损坏的单卷
- 若不存在缺失单卷，则回退到现有普通书推荐逻辑
- 推荐折扣、过期机制保持不变

```javascript
// js/shop.js
import { VOLUME_GROUPS, getIncompleteVolumeGroups } from '../data/volume_groups.js';

function pickPeizhouRecommendBook(pool) {
  // 1. 优先推荐缺失单卷
  const incompleteGroups = getIncompleteVolumeGroups(state.books);
  if (incompleteGroups.length > 0) {
    const targetGroup = incompleteGroups[Math.floor(Math.random() * incompleteGroups.length)];
    const ownedIds = new Set(targetGroup.volumeIds.filter(id => {
      const b = state.books[id];
      return b && b.status !== 'locked';
    }));
    const missingIds = targetGroup.volumeIds.filter(id => !ownedIds.has(id));
    if (missingIds.length > 0) {
      return missingIds[Math.floor(Math.random() * missingIds.length)];
    }
  }
  // 2. 回退到普通书推荐逻辑
  // ... 现有逻辑 ...
}
```

---

## 8. 状态迁移策略

### 8.1 旧存档兼容

旧玩家可能已经有 `book_016` 处于 `unlocked/copying/completed` 状态（旧版本长书 ID）。迁移逻辑：

```javascript
// js/state.js 初始化迁移
Object.keys(VOLUME_GROUPS).forEach(collectedId => {
  const group = VOLUME_GROUPS[collectedId];
  const oldBook = state.books[collectedId];

  if (oldBook && oldBook.status !== 'locked') {
    if (oldBook.status === 'completed') {
      group.volumeIds.forEach(id => {
        const volDef = BOOKS[id];
        const chapterIds = (volDef.chapters || []).map(c => c.id);  // 修复 P2-⑥：补全章节
        state.books[id] = createBookRecord({
          status: 'completed',
          copiedWords: volDef.totalWords,
          copyCount: 1,
          masteryLevel: 1,
          unlockedChapters: chapterIds     // ← 旧版漏设，会导致聚焦界面只显示第 1 章
        });
      });
    } else {
      let remainingWords = oldBook.copiedWords || 0;
      const oldUnlocked = new Set(oldBook.unlockedChapters || [1]);
      group.volumeIds.forEach(id => {
        const volDef = BOOKS[id];
        const volWords = volDef.totalWords;
        const copied = Math.min(remainingWords, volWords);
        // 保留已解锁章节：原书已解锁章节与本卷章节的交集（修复 P2-⑥ 进阶：避免进度回退）
        const volChapterIds = (volDef.chapters || []).map(c => c.id);
        const intersection = volChapterIds.filter(cid => oldUnlocked.has(cid));
        const unlockedChapters = intersection.length > 0 ? intersection : [1];
        state.books[id] = createBookRecord({
          status: copied >= volWords ? 'completed' : (copied > 0 ? 'copying' : 'unlocked'),
          copiedWords: copied,
          copyCount: copied >= volWords ? 1 : 0,
          masteryLevel: copied >= volWords ? 1 : 0,
          unlockedChapters
        });
        remainingWords -= copied;
      });
    }

    // 旧长书记录重置为 locked（等待合成）
    state.books[collectedId] = createBookRecord({ status: 'locked' });
  }
});

// 旧存档迁移：初始化修缮箱
if (!state.restorationBox) {
  state.restorationBox = [];
}
if (state.restorationBoxSlots === undefined) {
  state.restorationBoxSlots = 3; // 初始 3 格
}

// 旧存档迁移：初始化卷组吐槽冷却（P0 修复：未初始化会导致 maybeVolumeQuip 崩溃）
if (!state.quipCooldown) {
  state.quipCooldown = { recent: [], groupVisits: {} };
}
```

### 8.2 旧借阅记录

旧 `borrowRecords` 中的 `bookId` 可能是 `book_016`。保留原记录不变，仅作为历史展示。新借阅使用单卷或典藏版 ID。

---

## 9. 边界情况与处理

| 情况 | 处理 |
|---|---|
| 玩家买了某卷但没抄完 | 单卷按普通书处理，可抄、可借、会损坏 |
| 某单卷损坏 | 必须修复后才能合成；修复室该组合成按钮禁用，提示"某卷损坏待修复" |
| 单卷被访客借出未还 | 借出期间不可合成（P0-②）；修复室提示"某卷外借中"；可锁入修缮箱避免被借 |
| 想保护某卷不被损坏 | 锁入修缮箱即可；锁入后仍可用于合成 |
| 修缮箱已满 | 扩容或取出其他卷；初始 3 格，最多 20 格，可花费智慧之光扩容 |
| 锁入修缮箱的卷参与合成 | 合成时自动从修缮箱移除该卷，无需提前取出 |
| 书架已满时合成 | 优先上架典藏版；失败则放入手稿箱顶部（P1-③） |
| 手稿箱也满时合成 | 极罕见；保留典藏版记录并 warn，不静默丢弃 |
| 玩家已拥有全部卷且都已抄完 | 卷追踪面板 + 修复室亮"可合成"徽标 |
| 沈明远赠书事件 | 不赠长书/单卷，仅赠普通书，避免复杂度 |
| 旧存档中已有 `book_016` 在书架上 | 迁移时移除旧书，替换为按进度分配的单卷 |
| 商店长期刷不到临门一卷 | 动态偏置已提高概率；gap === 1 时下一次刷新必出缺失卷（保底） |
| 裴舟推荐系统 | 优先推荐缺失单卷；无缺失单卷时回退到普通书推荐 |

---

## 10. 验收标准

### 10.1 数据正确性

- [ ] `data/volume_groups.js` 包含 7 个卷组，`volumePrice` / `volumeCount` 正确
- [ ] `BOOKS` 对象包含所有单卷和典藏版
- [ ] 原长书 ID 现在对应典藏版 meta
- [ ] `SHARED_POOL` 中长书以多条 `type: 'volume'` 条目出现

### 10.2 购买流程（单卷刷新）

- [ ] 商店中单卷显示"卷 N / M"徽标与单卷价格
- [ ] 单卷点"购买"走普通 `purchaseBook`，正常扣费、入箱
- [ ] 已拥有的卷（无论是否损坏）不再刷出；损坏卷走修复室路径，不作为新商品出售（P2-a）
- [ ] 保底卷与加权抽取去重，商店同一卷不重复出现（P2-b）
- [ ] 动态轻偏置生效：拥有卷数越多，缺失卷权重越高（如 1/6→2.5x，5/6→5.0x）
- [ ] 临门一脚保底生效：某卷组只差 1 卷时，下一次刷新必出该缺失卷
- [ ] 裴舟推荐优先推荐缺失单卷

### 10.3 抄写与完成

- [ ] 单卷可独立抄写、完成、上架
- [ ] 单卷完成时触发完成动画，并在 `bookComplete` 中通过 `BOOKS[bookId].meta.isVolume` 判定，智慧之光/氛围奖励为普通书的一半
- [ ] 单卷进度不跨卷累计

### 10.4 借阅与损坏

- [ ] 访客可借阅单卷
- [ ] 单卷还书时可能损坏
- [ ] 损坏单卷必须先修复才能继续借阅或合成
- [ ] 典藏版不会被损坏

### 10.5 合成

- [ ] 古籍修复室子标签页可见
- [ ] 全部单卷完成且未损坏、**未借出（或已锁入修缮箱）**时，合成按钮可用
- [ ] 合成后单卷从书架/手稿箱/修缮箱移除
- [ ] 合成后典藏版出现在书架上（或手稿箱兜底）
- [ ] 合成后氛围和智慧之光增加
- [ ] 合成时书架满有正确的上架/兜底处理，无静默丢失

### 10.6 连携与成就

- [ ] 单卷上架不触发任何 `CURATION_PAIRS` 连携
- [ ] 典藏版上架后正常触发连携
- [ ] "完成一本书"类成就：单卷完成不计入；典藏版合成后计入一次
- [ ] 阶段目标"完成 X 本书"：单卷完成计入一次；典藏版合成后再计入一次
- [ ] 统计按 `collectedBookId` 归并，单卷不单独计数
- [ ] 卷追踪面板正确显示各组进度与"可合成"状态

### 10.7 存档迁移

- [ ] 旧存档中已解锁/完成的长书正确迁移为单卷进度
- [ ] 迁移后各卷 `unlockedChapters` 与 `status` 一致（修复 P2-⑥）
- [ ] 迁移后旧长书 ID 重置为 locked
- [ ] 新存档正常初始化所有 vol 和典藏版记录

### 10.8 访客叙事（卷组吐槽 v1）

- [ ] 玩家拥有部分卷但未集齐时，还书叙事有 18% 概率吐槽"卷组不齐"（替代当次 common）
- [ ] 三桶分语气正确：差 1 卷=催促(oneAway)、全拥有但卡进度=无奈(stuck)、其余=鼓励(start)
- [ ] 锚定优先临门一脚组（`gap === 1`），无则退化到最接近集齐组
- [ ] （二阶段）借书顺势吐槽：借到单卷且同组缺失时 25% 概率定向吐槽，气泡展示
- [ ] 去重冷却生效：同句记忆 3 条、同组冷却 3 次访客，不连说同一本/同一句
- [ ] 吐槽文案使用实际卷名/组名，无占位符残留
- [ ] 吐槽纯叙事，不修改 `getRefreshWeight` / `VOLUME_REFRESH`（解耦验证）

### 10.9 修缮箱与裴舟推荐

- [ ] 修缮箱初始 3 格，最多 20 格，可扩容
- [ ] 单卷可锁入/取出修缮箱
- [ ] 锁入修缮箱的卷不会被借出、不会损坏
- [ ] 锁入修缮箱的卷仍可用于合成
- [ ] 裴舟推荐优先推荐缺失单卷
- [ ] 不存在缺失单卷时，裴舟推荐回退到普通书逻辑

---

## 11. 实施建议

### 11.1 实施策略

本次长书分卷**一次性完成 7 本拆分**，不再分阶段。实施顺序建议：

1. **数据层先行**：`data/volume_groups.js`、单卷文件、典藏版文件、`data/book_pool.js`、`data/books.js`
2. **核心逻辑层**：`js/core/economy.js`（动态偏置 + 保底）、`js/volumes.js`（合成）、`js/capacity.js`（修缮箱）、`js/shop.js`（裴舟推荐过滤）
3. **渲染层**：卷追踪面板、古籍修复室、商店单卷展示
4. **叙事层**：`data/volume_quips.js` 文案表 + `js/volumeQuips.js`
5. **存档迁移**：旧长书进度迁移、新字段初始化
6. **联调验收**：按第 10 节逐项验证

> 一次性实施会增加单次改动量，但 7 本书共享同一套卷组机制，拆分到第二阶段反而要维护两套数据/逻辑。只要按上述顺序落地，风险可控。

### 11.2 定价建议（单卷价格）

| 卷组 | 单卷价格 `volumePrice` | 卷数 | 典藏版总价约 | 备注 |
|---|---|---|---|---|
| 本草纲目（2 卷） | 300 | 2 | 600 | 略高于普通书均价 |
| 物种起源（2 卷） | 300 | 2 | 600 | 略高于普通书均价 |
| 红楼梦（3 卷） | 367 | 3 | 1101 | — |
| 史记（4 卷） | 325 | 4 | 1300 | — |
| 几何原本（4 卷） | 350 | 4 | 1400 | — |
| 西游记（6 卷） | 317 | 6 | 1902 | 单本均价约 317 |
| 卡拉马佐夫兄弟（3 卷） | 400 | 3 | 1200 | — |

> 定价统一为 `volumePrice × volumeCount`，不再有 bundle 折扣/溢价歧义（修复原 5.1 写 2200、11.2 写 1900 的前后不一致）。单卷总价 ≈ 普通书均价 × 卷数，符合"高于普通单本但等于一本长书总价值"的直觉。

### 11.3 修缮箱扩容价格

| 格数 | 扩容到该格的价格 | 累计价格 |
|---|---|---|
| 1-3 | 0（免费） | 0 |
| 4 | 50 | 50 |
| 5 | 100 | 150 |
| 6 | 200 | 350 |
| 7 | 400 | 750 |
| 8 | 800 | 1550 |
| 9-20 | 每格 `min(5000, round(800 × 1.5^(n-8)))` | — |

说明：
- 前 3 格免费，让玩家早期就能保护 3 卷关键长书
- 4-8 格线性翻倍，鼓励中期投入
- 9 格起指数增长并封顶 5000，作为后期金币 sink
- 最多 20 格，足够保护所有长书单卷（7 组共 24 卷）中的大部分

---

## 12. 附录：bookId 对照表

| 典藏版 ID | 书名 | 单卷 ID 列表 |
|---|---|---|
| `book_007` | 本草纲目·草部 | `book_007_vol1`, `book_007_vol2` |
| `book_008` | 物种起源 | `book_008_vol1`, `book_008_vol2` |
| `book_009` | 红楼梦 | `book_009_vol1`, `book_009_vol2`, `book_009_vol3` |
| `book_014` | 史记 | `book_014_vol1`, `book_014_vol2`, `book_014_vol3`, `book_014_vol4` |
| `book_016` | 西游记 | `book_016_vol1` ~ `book_016_vol6` |
| `book_018` | 几何原本 | `book_018_vol1` ~ `book_018_vol4` |
| `book_019` | 卡拉马佐夫兄弟 | `book_019_vol1`, `book_019_vol2`, `book_019_vol3` |

---

## 13. 已确认决策（v2.2 修订版）

以下决策已在本方案中落实：

1. **实施范围**：**一次性完成 7 本长书分卷**（不分阶段）。见 11.1。
2. **商店刷新**：采用**动态轻偏置**（拥有卷数越多，缺失卷权重越高：1/6→2.5x，5/6→5.0x），配合**临门一脚保底**（gap === 1 时下一次刷新必出缺失卷）。见 5.1 / 7.1。
3. **古籍修复室**：放在**馆长办公室子标签页**。见 4.5。
4. **单卷完成奖励**：智慧之光与氛围奖励减半，证书动画保留。见 4.2。
5. **典藏版权益**：不参与重抄系统，`masteryLevel = 5` 直接解锁满级权益。见 4.5。
6. **旧存档迁移**：已完成旧长书解锁为全部单卷完成状态，玩家可在修复室手动合成。见 8.1。
7. **`data/books.js` 组装**：不重构，加生成脚本辅助。见 6.1 / 11.1。
8. **卷追踪面板**：书架页常驻 + 古籍修复室复用，组件化。见 6.3 / 6.4。
9. **访客吐槽**：已定 v1（三桶分语气 + 临门一脚锚定 + 还书主触发 18% + 借书顺势 25% 二阶段 + 去重冷却 + 与偏置解耦）。见 7.4。
10. **保底机制**：已加入临门一脚保底。见 5.1 / 7.1。
11. **修缮箱扩容**：初始 **3 格免费**，最多 **20 格**，价格曲线见 11.3。

---

*方案已定稿，提交架构师审核。*
