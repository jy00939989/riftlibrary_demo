---
anchors:
  - { type: file, path: "js/visitors.js", weight: 0.1 }
  - { type: file, path: "js/core/maintenance.js", weight: 0.1 }
  - { type: file, path: "js/capacity.js", weight: 0.1 }
  - { type: file, path: "js/render/bookshelf.js", weight: 0.1 }
  - { type: file, path: "js/render/visitors.js", weight: 0.1 }
  - { type: file, path: "docs/plans/book-servicing-plan.md", weight: 0.1 }
---

# 归墟图书馆 · 修缮间（锁书预约）计划

> 目标：解决「轮到馆长操作时书已被借走」的窗口碾压——书可进入「锁定待修」状态：
> 留架原位（策展对不受影响）、**不可外借**，保养/修复完成后**手动回架**重新开放借阅。
> 锁定位数 = 修缮间容量，**花钱扩容 + 修复室等级送格**。
>
> 图南 2026-10-25 拍板：①初始 2 格、damaged 不占格；②价目 30/80/200/500（封顶 4 次购买），
> **升级修复室送格子**（每级 +1）；③完成不自动解锁，**手动点回架**；④收书弹窗勾选默认不勾。
>
> 前置：古籍保养机制（book-maintenance-plan v2）已上线，本计划是其交互层补完。

---

## 一、核心机制

### 1.1 「预约修缮」标记（`bs.servicing`）

| 状态 | 行为 |
|---|---|
| 书在馆 + 打标记 | **立即锁定**：不可外借，可进保养批次 |
| 书在借 + 打标记（预约） | 正常流通；**还回瞬间自动锁定**（预约即占位，占 1 格） |
| 在借期间损毁 + 带标记 | 还回后 damaged+servicing 并存：先修复，修完进入「待回架」 |
| 保养/修复完成 | **保持锁定**，进入「待回架」，玩家手动点「回架」后重新可借 |
| 玩家取消预约 | 立即解锁回可借池，磨损保留 |

### 1.2 锁定规则（硬校验）

- 仅 `wearCount > 0 && !damaged && 非典藏` 的书可打标记（崭新没可修的、损毁走修复线、典藏无磨损）
- damaged 书不可打标记（修复即是它的"待修"状态，不占格不受理）
- 锁定书**留在书架原位**，视觉加 🔒；策展对、书架布局零影响

### 1.3 容量与经济（修缮间）

```
总格数 = 基础 2 格 + 已购格（≤4） + 修复室等级（每级 +1）
占用   = 所有 bs.servicing 的书（含在借预约中）——预约即占位
```

| 项 | 数值 |
|---|---|
| 基础 | 2 |
| 购买价目 | 30 → 80 → 200 → 500（第 3/4/5/6 格，各一次） |
| 修复室赠送 | +等级数（Lv3 = +3） |
| 理论上限 | 2+4+5 = 11 格 |

- 满格 → 拒绝新预约（提示：回架释放 / 处理手上 / 扩容）
- **damaged 不占格**——损毁是被动灾难，容量只闸主动行为

## 二、入口（两入口一标记）

1. **大书架书籍详情**：「预约修缮」开关按钮（含容量提示）
2. **收书弹窗**：磨损书逐本显示「🔒 锁回待修」勾选，**默认不勾**；确认时统一打标记

## 三、代码改动点

| 文件 | 改动 |
|---|---|
| `js/core/servicing.js`（新） | 纯逻辑：`toggleServicing/releaseServicing/getServicingCount/getServicingSlots/getServicingPrice/purchaseServicingSlot` |
| `js/capacity.js` | 修缮间容量真源：基础 2 + `state.servicingExtraSlots`（已购 ≤4）+ `getRestorationLevel()` |
| `js/visitors.js` | `getCompletedBooks()` 排除 `bs.servicing`——锁定书退出借书候选池（核心过滤点，仅此一处） |
| `js/core/maintenance.js` | 结算**不清 servicing**，历史改「已修好，等待回架」；保养台分组「待保养 / 待回架」+ 回架按钮（单本/全部） |
| `js/core/book-progress.js` | 修复完成不动 servicing（damaged+servicing 并存的书修完自然落入待回架） |
| `js/render/bookshelf.js` | 书籍卡片 🔒 角标；详情加「预约修缮/取消预约」与「回架」按钮 |
| `js/render/visitors.js` | 收书弹窗：磨损书加「锁回待修」勾选（默认不勾），确认时批量打标记 |
| `js/render/library.js` | 保养台：待回架区 + 回架按钮；容量条显示（占用/总格/购买扩容按钮） |
| `js/i18n/terms.js` | 锁书/回架/容量文案（中英） |
| `scripts/test-servicing.mjs`（新） | 见 §四 |

## 四、测试要点

- 打标记规则：崭新/损毁/典藏拒绝；wear>0 通过
- 容量：基础 2；满格拒绝；购买价目阶梯与上限 4 次；**修复室每级 +1**
- **预约即占位**：在借书打标记即占格
- `getCompletedBooks` 排除锁定书（含预约在借的）；取消预约后回归候选池
- 还回自动锁定：在借预约书 collectReturn 后 servicing 生效且不可再借
- 结算不清锁：保养完成后 servicing 保留（待回架），手动回架后才可借
- damaged+servicing 并存：修复完成后仍待回架
- 收书弹窗勾选默认不勾（渲染层逻辑单独验证或人工）

## 五、不做

- 不做自动解锁（图南拍板手动回架）
- 不做访客对缺书的抱怨系统（借书候选是随机池，少书仅概率微调）
- 锁定不收费——机会成本（断借书收入）已是代价
- 一键收书（合并收书）不加勾选，仅单收弹窗
