# 变更日志 · 2026-06-02

## 十一期：架构重构 + 手稿箱 + 书架策展 + 灵感重抄

### 架构修复（架构师审查驱动）

**解决循环依赖**：
- 新建 `js/capacity.js` — 从 `shop.js` 拆出容量/手稿箱/书籍工厂，断开 `visitors.js → shop.js` 循环
- 依赖分层：state→capacity/curation→visitors/shop→app→render

**统一书籍工厂**：
- `capacity.js` 新增 `createBookRecord()` 工厂函数 + `unlockBook()` 原子操作
- 8 个规范字段：`unlockedChapters/copyCount/masteryLevel/copiedWords/status/starred/damaged/repairWords/readChapters/reCopyUnlocked`
- 改造 7 个写入点（shop/visitors×3/books/plants/dev×3），消除字段不一致 Bug

**返回值重构**：
- `purchaseBook()` 返回值从 `boolean` → `{ ok, reason, ... }`（3 个精准失败分支）
- 购买卡片手稿箱满时灰掉 + 不可点击

**shelves 数据模型迁移**：
- `state.library.shelves` 从 `[1, 2, 3]`（数字数组）→ `[[bookId|null×5], ...]`（二维位置模型）
- `capacity.js` 新增 `normalizeShelves()`/`placeOnShelf()`
- `initState()` 旧档自动迁移：数字数组→空架 + 已完成书回填

**Bug 修复**：
- B-17：多访客同 tick 借走同一本书（`getCompletedBooks()` 移入循环体）

### 手稿箱系统

- 状态：`state.manuscriptBox: []` + `state.library.manuscriptSlots: 3`
- 流转：买书/获书 → 手稿箱(unlocked) → 誊抄完成 → 自动上架书架
- 扩容定价：1-3格免费，第4格10💡，第5格25💡，之后 80×2.5ⁿ 封顶5000
- 商店页面：手稿箱容量行 + 扩容按钮 + 购买失败细分提示
- 所有获书入口（shop/visitors×3/plants/books）统一经由 `unlockBook()` 或 `addToManuscriptBox()`

### 书架策展系统（P2-02 全部完成）

**数据层**：
- 28 本书加 `era` 字段（ERA_001-009，基于豆包9期文学史划分调研）
- 新建 `data/curation_pairs.js` — 12 组精选作者配对，每组含墨墨点评

**计算引擎**：
- 新建 `js/curation.js` — `calcCurationEffects(shelves)` 纯函数
- 扫描 category 连续段落（≥3本→+1%/1.5%/2% 缮写速度）
- 扫描 era 连续段落（≥3本→+1%/1.5%/2% 借阅率）
- 扫描同排作者配对（2本→+3% 智慧之光）
- 多层叠加，渲染时全量 O(25) 重算

**交互层**：
- HTML5 原生 Drag and Drop 交换（无需第三方库）
- CSS 连携光效：`curation-chain-3/4/5` 底部渐变横线 + 5级脉冲动画
- Toast 通知：新连携触发时弹出（含连携名 + 墨墨点评）
- 拖拽态 CSS：`.dragging`/`.drag-over` 过渡动画

**加成接入**：
- `app.js`：缮写速度公式 `*(1 + auraSpeed + curationSpeed)`
- `app.js`：智慧之光结算 `*(1 + auraCoinsMult + curationCoins)`
- `visitors.js`：借阅概率 `0.4 + curationBorrowBonus`

### 灵感重抄系统

- 新增 `spendInspiration()` — 花费灵感值
- 书籍字段 `reCopyUnlocked` — 已完成书需灵感解锁才能重新出现在缮写室
- 花费：短书(<3万字)2✨ / 中篇 3✨ / 长篇(≥10万字)5✨
- 书架章节弹窗新增"🔮 花费灵感重抄"按钮
- 抄完自动清除标记，需再次花费；mastery Lv5 不可重抄
- 顶部导航栏新增 ✨ 灵感值显示

### 今日访客叙事收尾（上午）

- 程远/裴舟/江有树/简安 4 位访客三层递进叙事数据落地
- 简安特化：公文背面写小说+游戏剧本（联动图南真实经历）
- Bug 修复：裴舟 vendor 字段、墨墨日志 mastery 分级、短书 mastery 溢出

### P2-07 标志牌 Buff 化 + P2-05 誊抄加速（上午）

- 5 标志牌从纯装饰 → 带 buff 对象，价格翻倍
- 连击加成 +2%/天(7天封顶14%) + 章节冲刺 ×1.20

### 文件变更

| 类型 | 数量 | 关键文件 |
|------|------|----------|
| 新建 | 5 | `js/capacity.js`, `js/curation.js`, `data/curation_pairs.js`, `docs/plans/*`, `docs/changelog/CHANGELOG_2026-06-02.md` |
| 修改 | 46 | 28本书 + 15个js + css + html + 4个docs |

### 推送

- commit `c57debb` → 分支 `p2-narrative-signboard-boost` → Gitee
