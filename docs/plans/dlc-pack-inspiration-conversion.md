---
status: done
importance: 3
scheduledDate:
---

# 补充包改纯灵感兑换 · 对账补录（dlc-pack-inspiration-conversion）

> 本文档为**事后补录**（对账发现 bf4a0a4 功能改动无方案锚点，2026-09-04 补写）。
> 实现已完成并入库；「动机」部分为对账重构，**待图南确认是否符合当时真实意图**。

---

## 决策摘要

| 项 | 结论 |
|---|---|
| 货币 | 补充包解锁从 💰1200 智慧之光改为 ✨纯灵感兑换 |
| 首包特惠 | 玩家首次解锁任意包仅需 **60 灵感** |
| 后续原价 | 每包默认 **120 灵感**，可在 `data/dlc_packs.js` 按包用 `inspirationCost` 覆盖 |
| 兑换码 | 保留不变（`BETA2026`、`ALPHA_RIFT`） |

## 动机（对账重构，待确认）

- 智慧之光是高频流通货币，1200 定价对中后期玩家无感、对前期玩家够不着，补充包存在感弱。
- 灵感是稀缺资源（专注誊抄产出），用灵感换包把「专注行为」与「内容解锁」直接挂钩：想读新书 → 去专注。
- 首包 60 灵感（约等于前期半次专注的产出）作为新玩家的即时钩子。

## 实现现状（已在 bf4a0a4 落地）

- `data/dlc_packs.js`：`price: 1200` → `inspirationCost: 120`
- `js/core/shop/dlc-packs.js`：`FIRST_PACK_INSPIRATION_COST = 60`、`DEFAULT_PACK_INSPIRATION_COST = 120`、`getPackInspirationCost(packId)`（首包判定 = `unlocked` 数组为空）、`getDlcPackUnlockInfo()` 返回 `isFirstPackDiscount`、`unlockDlcPack` 改走 `spendInspiration`
- `js/render/dlc-packs.js`：✨价格展示、首包特惠徽标 + 划线原价
- `js/i18n/terms.js`：新增 `dlcPackInsufficientInspiration` / `dlcPackFirstPackDiscount` / `dlcPackInspirationPrice`

## 边界与待确认

1. **兑换码会消耗首包特惠资格**：实现按「是否已解锁任何包」判定，用兑换码解锁也算。用码白嫖后首包 60 灵感窗口即关闭——是特性还是坑，待确认。
2. **120 定价的校准依据**：灵感产出口径（专注时长/天、其他消耗口子）未见测算文档，后续经济平衡时可复核。
3. 旧玩家从 coins 定价迁移到 inspiration 定价没有补偿/过渡逻辑（包未解锁的玩家直接适用新价），当时是否评估过影响面？

## 相关文件

- `data/dlc_packs.js`、`js/core/shop/dlc-packs.js`、`js/render/dlc-packs.js`、`js/render/shop.js`、`js/i18n/terms.js`
- 对账提交：`bf4a0a4`（2026-08-20）
