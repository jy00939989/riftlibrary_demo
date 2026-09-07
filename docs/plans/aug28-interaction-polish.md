---
status: done
importance: 2
scheduledDate:
---

# 8.28 交互优化四条 · 对账补录（aug28-interaction-polish）

> 本文档为**事后补录**（对账发现 47235db 功能改动无方案锚点，2026-09-04 补写）。
> 实现已完成并入库；动机为对账重构，**待图南确认是否符合当时真实意图**。

---

## 决策摘要

| # | 项 | 结论 |
|---|---|---|
| 1 | 购买/失败提示 | 全站统一为 `window.showToast(error)`，不再各处自定义弹法 |
| 2 | 限量挂牌获得 | 弹出专属感谢弹窗（纪念牌仪式感） |
| 3 | 古籍修复室升级叙事 | 补全 i18n 词条（此前有渲染缺词） |
| 4 | 大书架卡片 | 直接解锁重抄入口；典藏档案移除过时 Lv 进度展示 |

## 实现现状（已在 47235db 落地）

- `js/render/common.js`：`showToast` 统一出口；`js/render/shop.js` / `js/render/bag.js` / `js/render/plants.js` 等改调
- `js/core/shop/signboards.js` + `js/render/shop.js`：限量纪念牌购买后感谢弹窗
- `js/i18n/terms.js`：修复室升级叙事词条补全（32 行增量）
- `js/render/bookshelf.js`（74 行改动）：大书架卡片重抄直达；典藏档案去掉过时 Lv 进度——**重抄成本/显示逻辑仍以「重抄机制修订方案」为单一方案源**，本文档不重复立项

## 边界与待确认

1. 第 4 条与 `recopy-system-revision-plan.md` 的 `js/render/bookshelf.js` 锚点（重抄按钮成本 1 灵感、noMastery 不显示）有重叠——两处改的是同一文件的不同侧面，后续改重抄逻辑时以 recopy 方案为准。
2. 「统一 Toast」未含覆盖度校验脚本，新页面可能再次引入自定义弹法；如发现回潮，再考虑加 lint 规则。

## 相关文件

- `js/render/common.js`、`js/render/shop.js`、`js/core/shop/signboards.js`、`js/i18n/terms.js`、`js/render/bookshelf.js`
- 对账提交：`47235db`（2026-08-28）
