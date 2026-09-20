# 技术债：借阅区等级应影响书籍损毁概率

> **✅ 已解决（2026-08-31 落地）**
>
> `js/visitors.js` `getDamageChance()`（现 visitors.js:379）：基础 3%，借阅区每级 -0.4%（下限 0.5%），「爱惜书籍」标志牌在等级减免后再 -1%。数值与本文件建议公式完全一致。
> 待实现清单：1 ✓ 2 ✓（先等级后标志牌，与本文件期望一致）3 ✓（`borrowAreaDamageRate` UI 文案已带说明）4（成就/访客叙事引用）未做，属可选项，不阻塞关闭。
>
> 对账记录：与 `docs/archive/plans/book-damage-events-plan.md` 的鼠患预防设计（借阅区等级降低损毁）为同一机制，实施时以本实现为准。（plan 已 2026-09-20 归档）

---

## 现状（历史记录，已过时）

`js/visitors.js:961` 中书籍损毁判定为固定概率：

```js
const damageBaseChance = hasCareBooksSignboard ? 0.02 : 0.03;
```

当前只有「爱惜书籍」标志牌能降低 1% 损毁概率，**借阅区等级（borrowLevel）尚未参与计算**。

## 期望行为

借阅区等级越高，访客借书环境越好，损毁概率应逐步降低：

| 借阅区等级 | 建议损毁概率 |
|---|---|
| Lv0（未建造）| 不借书，不适用 |
| Lv1 | 3.0% |
| Lv2 | 2.6% |
| Lv3 | 2.2% |
| Lv4 | 1.8% |
| Lv5 | 1.4% |
| Lv6 | 1.0% |
| Lv7 | 0.6% |

或者简化公式：`baseChance - (borrowLevel - 1) * 0.004`，下限 0.5%。

## 待实现

1. 在 `js/visitors.js` 的还书损毁判定中读取 `state.library.borrowLevel`。
2. 与「爱惜书籍」标志牌效果叠加（先算等级减免，再算标志牌减免）。
3. 在 UI 中提示当前借阅区等级对损毁概率的影响（例如读者沙龙页面、借阅区升级弹窗）。
4. 考虑成就/访客叙事中引用该机制（如某访客在高等级借阅区更温柔）。

## 相关文件

- `js/visitors.js` — 损毁判定
- `js/visitors.js` 的 `getBorrowLevelConfig()` — 可扩展返回 `damageReduction`
- `data/signboards.js` — 已有「爱惜书籍」标志牌
- `js/render/visitors.js` — 读者沙龙页面可展示当前损毁概率

## 备注

修复完成后弹窗中的墨墨小贴士可提前预告该机制：
"借阅区越舒适，访客越懂得珍惜书哦。"
