# 访客借书时长与收益调整 — 设计/数值评审

> 评审对象：`visitor-borrow-duration-and-reward-adjustment.md`（提出 2026-08-31）
> 评审时间：2026-09-01
> 评审方式：先读 plan → 核对代码锚点（`js/visitors.js`、`data/borrow-levels.js`、`js/render/visitors.js`、`js/core/achievement-stats.js`、`js/tutorial.js`、`js/guidequests.js`）→ 落成此文

---

## 结论先行（3 句话）

1. **锚点全部有效**，这份 plan 没被 god-module-split 改到代码失效——`attemptBorrow`（809-810）、`collectReturn`（1110-1112）、`BORROW_LEVEL_TABLE` 逐字吻合，可以直接动手。
2. **一个 P0 必改**：variance 把原代码的 `[3,120]` 小时上下限钳掉了——短书能跌到 2 小时（破 3h 下限），长书能冲到 156 小时（破 5 天上限），且 plan 自己的效果表也写错了。
3. **一个 P1 设计缺口**：每 24h +5 币对"借久=不公平"的体感补偿偏弱，且额外币没进历史/弹窗（反馈通道断裂）；外加额外币按真实 elapsed 算，会把"玩家赖着不收"误算成"借得久"。

---

## 一、锚点核实（通过，可放心改）

| plan 引用 | 实际位置 | 状态 |
|---|---|---|
| `attemptBorrow` 内 `borrowHours = Math.max(3, Math.min(120, Math.round(bookWords / 2500)))` | `js/visitors.js:809` | ✓ 完全一致 |
| `collectReturn` 内 `addCoins(retCfg.returnCoins); if (retCfg.returnAtmo>0) addAtmosphere(...)` | `js/visitors.js:1110-1112` | ✓ 完全一致 |
| `getBorrowLevelConfig()` 返回 `{ returnCoins, returnAtmo, ... }` | `js/visitors.js:373-376` | ✓ 一致 |
| 借阅等级表 | `data/borrow-levels.js` | ✓ returnCoins 30→60，returnAtmo 1→5 |

**引导/成就影响（plan §5.4 的悬疑，已核实）**：`achievement-stats.js` 无任何 borrow-duration 判定；`tutorial.js`/`guidequests.js` 只有"及时收取归还书籍"的软提示，没有"X 小时内归还"的硬性任务。→ **variance 不会破坏任何引导/成就，该开放问题可关闭。**

---

## 二、P0 — variance 破坏了 `[3,120]` 钳制（必改）

**现状代码**（plan 建议）：
```js
const baseHours = Math.max(3, Math.min(120, Math.round(bookWords / 2500)));
const variance  = 0.7 + Math.random() * 0.6; // 0.7 ~ 1.3
const borrowHours = Math.round(baseHours * variance);   // ← 钳制在此丢失
const dueTime = now + borrowHours * 3600000;
```

`baseHours` 已经钳在 `[3,120]`，但乘完 variance 之后**没有二次钳制**。结果如下：

| 书籍字数 | baseHours | variance=0.7 | variance=1.3 | 实际范围 | 期望/声明范围 |
|---|---|---|---|---|---|
| 7,500 | 3 | round(2.1)=**2** ❌ | round(3.9)=4 | **2~4** | plan 表写"3~4（下限3）" → 错 |
| 50,000 | 20 | 14 | 26 | 14~26 | 14~26 ✓ |
| 200,000 | 80 | 56 | 104 | 56~104 | 56~104 ✓ |
| 300,000 | 120 | 84 | round(156)=**156** ❌ | **84~156** | plan 表写"84~120（上限120）" → 错 |

**两处违反原契约**：
- 短书（≤7500 字）原保证最少 3 小时，variance 后可能 2 小时。
- 长书（≥30 万字）原保证最多 120 小时（5 天），variance 后可能 156 小时（6.5 天）。plan §5.4 自己说"时长上限 120 小时保留"，代码没做到。

**修复（一行）**：
```js
const borrowHours = Math.max(3, Math.min(120, Math.round(baseHours * variance)));
```
二次钳制后，短书稳定 3~4h、长书稳定 84~120h，且**顺带把额外币的上限锁在 +25**（见第三节，120h/24=5 天×5=25）。

---

## 三、P1 — 时长奖励：数值偏弱 + 反馈断裂

### 3.1 数值是否够"填平不公平"

用户原话："有的书借出去 2 天，有的只借几小时，收益也差不多，感觉不公平。"

方案 A：`extraCoins = floor(h/24) * 5`，h 经 P0 修复后上限 120 → 封顶 +25。

| 借阅实际时长 | 额外币 | 相对 base 收益（Lv1=30） | 相对 base 收益（Lv7=60） |
|---|---|---|---|
| 3h（短书） | 0 | +0% | +0% |
| 48h（2 天） | +10 | +33% | +17% |
| 120h（5 天） | +25 | +83% | +42% |

**判断**：补偿方向对，但幅度**在低等级才明显、高等级偏弱**。Lv7 时一本借 2 天的书只多给 17%，能不能消除"不公平"的体感存疑。这不是 blocker——plan 明确选 A 是为了"上限低、不破坏经济"——但要诚实：它**部分**解决了抱怨，且越到后期越弱。

**可选强化（待你拍板，非必改）**：
- 提每 24h 到 +8~10：2 天=+16~20（Lv7 时 +27~33%），5 天封顶 +40~50，仍温和；
- 或改百分比模型 `floor(h/24)*round(base*0.15)`：随等级一起涨，长书长收益在高等级也成立。
- 二者都需跑一次经济模拟确认不冲击现有 sink（智慧之光消耗点：商店/缮写室升级/专注）。当下 coins 有充足 sink，+5~25/次封顶在量级上安全。

### 3.2 反馈通道断裂（必补）

额外币用 `addCoins(extraCoins)` 进了钱包，但：
- `collectReturn` 返回对象（原 1193 行）`coins: retCfg.returnCoins` **不含**额外币；
- 历史记录（原 1134-1135 行）只写 `${retCfg.returnCoins}智慧之光`，**不含**额外币。

后果：玩家看到钱包多了币，但还书弹窗/历史里看不到来源，反馈闭环断了一截。修复：把额外币并入 `result.coins` 与历史文案（如 `+${extraCoins}（借阅时长）`）。

---

## 四、P2 — 额外币计算口径与意图错位

plan §3.2：
```js
const borrowDurationMs = (visitor.returnTime || getNow()) - (visitor.borrowTime || visitor.arriveTime);
```

**问题**：`visitor.returnTime` 在访客对象上**从未被赋值**（它只存在于 `state.borrowRecords` 的条目里，`collectReturn` 原 1149 行）。所以 `visitor.returnTime` 恒为 `undefined` → 退化为 `getNow()`。

即额外币 = `(点击收取时刻 - borrowTime)` 的真实 wall-clock 时长。若玩家在书变 'due' 后**赖着不点**，elapsed 继续涨 → 额外币变多。这奖励的是"拖延收取"，不是 plan 想要的"借得久"。

**修复（用计划时长，排除拖延）**：
```js
const plannedDurationHours = (visitor.dueTime && visitor.borrowTime)
  ? (visitor.dueTime - visitor.borrowTime) / (1000 * 60 * 60)
  : 0;
const borrowDurationHours = Math.max(0, plannedDurationHours);
```
`dueTime - borrowTime` 正是 §3.1 随机出来的那段时长，额外币随之与 variance 耦合（借得久→多币），且不受玩家收取时机影响。好处：奖励在借出那一刻就确定，调试可复现。

---

## 五、设计层面 — variance 本身值不值得做

**玩家决策检查（系统思维红线）**：借书是访客 AI 自主行为，玩家不参与选书、不选时长。variance 只改了一个玩家"看到的数字"，**不产生任何新玩家决策**。它是 flavor，不是机制。

**真实副作用**：`dueTime` 驱动 `render/visitors.js` 的倒计时（45-46 行）。variance 让"某本想要的书什么时候回来"变不可预期——对**等特定书**的玩家是轻微负面（比预期晚回）。±30% 时这个负面在可接受区；若放大到 ±50% 会明显 annoy。

**结论**：保留 variance（消"机械感"意图成立），但**必须做 P0 钳制**，且范围维持 ±30% 别放大。plan 应把"增加不可预期性"改写成诚实的"纯展示层波动，不改玩法"——免得日后有人误以为它影响了经济。

---

## 六、经济影响（sources / sinks）

| 维度 | 评估 |
|---|---|
| 注入源 | 每还书 +0~25 智慧之光（方案 A，P0 修复后封顶 +25） |
| 消耗汇 | 商店购书、缮写室升级、专注消耗——sink 充足 |
| 通胀风险 | 低。平均每次还书约 +3~6 币（多数中短书 0~5，长书 10~25），且借书频率受访客容量/概率限制 |
| 氛围 | 不加氛围 ✓ 正确——氛围是硬封顶资源，coins 才是可通胀资源，plan 在这点上选对了 |

---

## 七、决策清单（待你拍板）

| # | 事项 | 建议 | 必改？ |
|---|---|---|---|
| 1 | P0：`borrowHours` 乘 variance 后二次钳 `[3,120]` | 加一行 `Math.max(3, Math.min(120, ...))` | **必改** |
| 2 | P1：额外币并入历史文案 + `result.coins` | 反馈闭环 | **必改** |
| 3 | P2：额外币改用 `dueTime - borrowTime` 而非真实 elapsed | 排除拖延奖励 | 建议改 |
| 4 | +5/24h 是否提到 +8~10 或改百分比模型 | 看是否要"明显消除不公平" | 待定 |
| 5 | variance 范围维持 ±30% | 别放大到 ±50% | 维持 |

**一句话收尾**：机制方向对（只加 coins 不加氛围、按时长补收益），但 §3.1 的 variance 有 P0 钳制 bug、§3.2 的额外币有口径错位和反馈断裂——改掉这三项，这份 plan 就能落。
