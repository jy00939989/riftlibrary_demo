# 访客借书时长与收益调整方案

> 状态：待数值评审  
> 提出时间：2026-08-31  
> 相关文件：`js/visitors.js`、`js/core/shop/library-upgrades.js`、`data/borrow-levels.js`

---

## 一、背景与问题

当前访客借书机制存在两点体验问题：

1. **借阅时长过于机械**：`borrowHours = round(bookWords / 2500)`，同一本书每次被借时长完全一致，玩家很快能预判，缺乏变数。
2. **借书收益与时长脱钩**：借 3 小时和借 5 天归还，智慧之光与氛围收益完全相同（仅由借阅区等级决定）。有用户反馈"有的书借出去 2 天，有的书只借出去几小时，收益也差不多，感觉不公平"。
3. **氛围已溢出**：当前版本氛围存在硬封顶，不宜再通过借书系统继续投放氛围。

---

## 二、设计目标

1. 让同一本书的借阅时长有合理波动，增加不可预期性。
2. 让"借得久"在收益上有所体现，但仅通过**智慧之光**投放，避免加剧氛围溢出。
3. 保持改动范围小，不影响现有借阅区等级、访客容量、损毁概率等核心数值。

---

## 三、具体改动

### 3.1 借阅时长加入随机波动

**位置**：`js/visitors.js`（`attemptBorrow` 函数中计算 `dueTime` 处）

**当前代码**：

```js
const borrowHours = Math.max(3, Math.min(120, Math.round(bookWords / 2500)));
const dueTime = now + borrowHours * 3600000;
```

**建议改为**：

```js
const baseHours = Math.max(3, Math.min(120, Math.round(bookWords / 2500)));
const variance = 0.7 + Math.random() * 0.6; // ±30% 浮动
const borrowHours = Math.round(baseHours * variance);
const dueTime = now + borrowHours * 3600000;
```

**效果示例**：

| 书籍字数 | 原时长 | 新时长范围（±30%） |
|---|---|---|
| 7,500 字 | 3 小时 | 3~4 小时（下限 3） |
| 50,000 字 | 20 小时 | 14~26 小时 |
| 200,000 字 | 80 小时 | 56~104 小时 |
| 300,000 字 | 120 小时 | 84~120 小时（上限 120） |

### 3.2 按时长追加智慧之光收益

**位置**：`js/visitors.js`（`collectReturn` 函数中基础收益之后）

**当前代码**：

```js
const retCfg = getBorrowLevelConfig();
addCoins(retCfg.returnCoins);
if (retCfg.returnAtmo > 0) addAtmosphere(retCfg.returnAtmo);
```

**建议追加**：

```js
const borrowDurationMs = (visitor.returnTime || getNow()) - (visitor.borrowTime || visitor.arriveTime);
const borrowDurationHours = Math.max(0, borrowDurationMs / (1000 * 60 * 60));
const extraCoins = Math.floor(borrowDurationHours / 24) * 5; // 每满 24 小时额外 5 币
if (extraCoins > 0) {
  addCoins(extraCoins);
}
```

**备选公式（待数值确认）**：

| 方案 | 公式 | 5 天最长收益 |
|---|---|---|
| A（线性） | `floor(hours / 24) * 5` | +25 币 |
| B（递增） | `floor(hours / 24) * (5 + floor(hours / 24))` | +175 币（可能过高） |
| C（按字数 × 时长） | `floor(hours / 24) * floor(bookWords / 50000) * 3` | 长书更高 |

推荐 **方案 A**，简单可控，上限低，不破坏经济。

---

## 四、预期影响

| 维度 | 影响 |
|---|---|
| 经济 | 每次还书最多额外 +25 智慧之光，对整体经济影响有限 |
| 氛围 | **不加氛围**，不加剧溢出 |
| 体验 | 长书借出更有"值得等"的感觉；短书周转更快，玩家可灵活安排 |
| 技术 | 改动范围小，2 个函数内完成 |

---

## 五、待数值确认

1. **随机浮动范围**：±30% 是否合适？±20% 太接近原值，±50% 差异过大。
2. **时长额外金币公式**：每 24 小时 +5 币是否太少/太多？是否需要按书籍类别差异化？
3. **是否需要上限**：目前时长上限 120 小时（5 天）保留；额外金币是否也应设上限？
4. **是否影响引导/成就**：当前有"快速收书"类引导任务吗？加随机数后是否会导致任务节奏不可控？

---

## 六、建议实施顺序

1. 数值确认方案 A 参数（浮动 ±30%，每 24h +5 币）。
2. 修改 `js/visitors.js` 并跑 `node --check`。
3. 手动测试：借一本短书、一本长书，验证时长波动和额外金币。
4. 部署到 Netlify。
