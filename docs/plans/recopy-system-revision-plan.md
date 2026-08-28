# 重抄机制修订方案

> 状态：待架构师 review
> 提出时间：2026-08-27
> 相关模块：书籍进度、书架 UI、专注选书、经济系统、证书系统

## 背景

早期书籍数量较少，引入「重抄」机制以拉长单本书的游戏时间。随着长书分卷机制落地，当前流程已变为：

- 玩家购买分卷单卷（如 `book_009_vol1` / `vol2` / `vol3`）
- 完成所有单卷后，在古籍修复室合成典藏版（`book_009`）
- 单卷书完成使命后被锁定

在此流程下，**分卷单卷书的重抄/精通循环与玩家目标脱节**：玩家追求的是合成典藏版，而非反复抄单卷。保留重抄会让 UI 出现「已完成的书还需要花灵感解锁重抄」的鸡肋选项。

## 目标

1. 消除分卷书（单卷 + 典藏版）的重抄/精通逻辑，让它自然成为「过程材料」与「终点产物」。
2. 保留并优化普通书的重抄机制：降低门槛、提高收益感知。
3. 将「精通书籍」与「专注倍率」挂钩，给重抄赋予全局成长意义。

## 已确定设计

### 1. 分卷书取消重抄

- **单卷**（`book_xxx_volN`）：完成后不显示重抄按钮，专注选书时已完成即不可再选。
- **典藏版**（`book_xxx`）：合成后状态为 `completed`，`masteryLevel = 5`，不可重抄。
- 实现方式：**运行时判断**，不修改 `data/books/*.js`。
  - 新增辅助函数 `isNoMasteryBook(bookId)`：
    - `BOOKS[bookId]?.noMastery === true` 直接命中
    - `isVolumeBookId(bookId)` 命中（单卷）
    - `getVolumeGroupByCollectedId(bookId)` 命中（典藏版）

### 2. 普通书重抄成本降低

- 解锁成本从 **2 灵感** 降至 **1 灵感**。
- 已完成的书仍需要手动解锁重抄（保留玩家选择权）。

### 3. 普通书重抄 1 次即 master

- 当前：`masteryLevel = min(5, copyCount)`，需要 5 次完成才能满级。
- 修订后：普通书完成首次后 `masteryLevel = 1`；重抄完成 1 次后（`copyCount >= 2`）直接 `masteryLevel = 5`。
- 证书、成就等依赖 `masteryLevel` 的系统无需改动，只需将「大师/传承」视为同义的最高等级。

### 4. 精通书籍提供全局专注倍率

- 每拥有一本 `masteryLevel >= 5` 的普通书，专注倍率 +0.5%（数值可配）。
- 该加成上限暂定 20%（即 40 本 mastered 书）。
- 分卷书的单卷和典藏版不计入该加成。
- 加成显示在缮写室或馆长办公室的相关面板中。

## 涉及文件

| 文件 | 改动 |
|---|---|
| `data/volume_groups.js` | 新增/复用 `isVolumeBookId` / `getVolumeGroupByCollectedId` 判断 |
| `js/core/book-utils.js` | 新增 `isNoMasteryBook(bookId)` 辅助函数 |
| `js/core/book-progress.js` | 修改 `completeBook()`：普通书 `copyCount >= 2` 时 `masteryLevel = 5` |
| `js/core/shop/library-upgrades.js` 或 `js/core/economy.js` | 新增 `getMasteredBookSpeedBonus()` 并接入 `getFocusSpeedMultiplier()` |
| `js/render/bookshelf.js` | 重抄按钮：成本改为 1 灵感；noMastery 书不显示按钮 |
| `js/render/focus.js` | 专注选书：noMastery 的 completed 书不可再选 |
| `js/app.js` | 同类选书校验（约第 471 行） |
| `js/core/redeem.js` | `isBookEligibleForBrush`：noMastery 的 completed 书不可作为笔目标 |
| `js/i18n/terms.js` | `reCopyCost` 文案改为「1 灵感」 |
| `js/render/focus.js` 或 `js/render/library.js` | 新增 mastered 专注加成显示（可选） |

## 数据兼容性

- 旧存档中分卷单卷可能已有 `copyCount > 1` 或 `masteryLevel > 1`。分卷书被锁定后不再参与重抄，历史数据不影响。
- 普通书旧存档中 `masteryLevel = min(5, copyCount)`。修订后已完成的普通书，其 `masteryLevel` 保持原值；**只有在下一次重抄完成时**，才会按新规则更新为 5。
- 专注倍率加成是读取时计算，无状态迁移风险。

## 风险

1. **经济平衡**：0.5% / 本的加成若上限 20%，对前期专注速度影响有限，但需观察后期是否过强。
2. **证书称号**：`masteryLevel` 直接跳到 5 后，证书会显示「传承」。中间称号（熟悉、精通、大师）在普通书重抄中不再出现，仅在首次完成→重抄的短暂阶段显示。
3. **成就系统**：检查是否存在要求「5 本书达到 masteryLevel 5」之类的成就，新规则下完成速度会加快。

## 实施步骤

1. 在 `js/core/book-utils.js` 新增 `isNoMasteryBook()`。
2. 修改 `js/core/book-progress.js` 的 `completeBook()`。
3. 修改 `js/core/shop/library-upgrades.js` 接入 mastered 加成。
4. 修改 `js/render/bookshelf.js` 重抄成本和显示逻辑。
5. 修改 `js/render/focus.js`、`js/app.js`、`js/core/redeem.js` 的选书/目标校验。
6. 更新 `js/i18n/terms.js` 文案。
7. 本地测试：普通书重抄、分卷书完成/合成、专注倍率变化。
8. 提交 Netlify 预览部署。

## 待架构师确认

1. 每本 mastered 书 +0.5% 专注倍率、上限 20% 是否合理？
2. 是否需要在 UI 中明确提示「精通加成」来源？
3. 分卷单卷是否直接标记为 `noMastery` 写入数据文件，还是保持运行时判断？
4. 普通书重抄 1 次即 master 后，是否保留「copyCount」用于统计/称号，还是 copyCount 也直接封顶？
