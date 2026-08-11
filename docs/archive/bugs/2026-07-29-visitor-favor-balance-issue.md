# 访客好感度数值失衡问题报告

> **状态**：已定位、已拍板、已实施  
> **发现日期**：2026-07-29  
> **相关模块**：`js/visitors.js`、`js/app.js`、`js/dev-console.js`、`data/visitor-events.js`  
> **标签**：balance、visitor-system、f2f-design  
> **ADR**：ADR-FAVOR-001

---

## 一、玩家反馈

当前存档中，访客「夏蝉」的好感度高达 **1948**，同时仍有若干角色好感度为 **0**。

玩家质疑：这是否是 bug，以及数值差距是否过大。

---

## 二、结论：非代码 bug，是数值设计失衡

经核对代码，好感度的三条获取路径均无重复计算或异常加成：

| 来源 | 触发频率 | 单次好感 | 是否写入全局好感 | 代码位置 |
|------|----------|----------|------------------|----------|
| 在馆浏览 | 每 60 秒 tick | 1~2（受借阅区等级加成） | 是 | `js/visitors.js:581-583` |
| 借书 | 每次借出 | 3~5 | 是 | `js/visitors.js:631-633` |
| 还书 | 每次归还 | 5~10（乔一一光环时更高） | 是 | `js/visitors.js:883-886` |

夏蝉的被动光环「舞台之光」类型为 `visual_spawn`，只增加**访客到来概率**，不增加好感获取速度。`core/visitor-lookup.js:91` 的 `getAuraSpawnBonus` 也确认它只影响"来不来"层，与好感获取无关。

---

## 三、根因分析

### 3.1 全局好感无上限

`state.visitorFavors[charId]` 会永久累积，没有任何 soft cap 或衰减机制。

- 在 Lv7 借阅区下，浏览 tick 每次 +2 好感
- 1948 约等于在馆累计浏览 **16 小时**
- 对长期挂机/长游玩档而言，该数值完全可达

### 3.2 单次 visit 收益偏高

以 Lv7 借阅区估算一次完整 visit 的收益：

```
浏览约 2.5 分钟：+5
借书：+5
还书：+8 ~ +10
─────────────────
单次 visit 合计：+18 ~ +20
```

1948 / 20 ≈ **100 次来访**。在现有 spawn 频率下，单个角色出现 100 次并非不可能。

### 3.3 刷新机制无低好感保护（主诉）

`js/visitors.js:525-529` 的 spawn 逻辑为均匀随机：

```js
const presentCharIds = new Set(state.visitors.map(v => v.charId));
const charIds = Object.keys(VISITOR_DEFS).filter(id => !presentCharIds.has(id));
charId = pick(charIds); // 均匀随机
```

未访问过的角色没有加权保护，脸黑时始终刷不到，导致好感度为 0。**这是玩家主诉，必须修复。**

### 3.4 叙事阈值被全局好感卡死

原系统设计：

- 偶层事件：好感 ≥ 30
- 稀层事件：好感 ≥ 60
- 终局后偶层：好感 ≥ 100

按单次 visit +18~20 估算，2~5 次来访即可解锁深层叙事，对"常客关系"而言过浅。同时老角色早早跨过高阈值，新角色/脸黑角色长期卡在 0，叙事解锁节奏被严重拉大。

---

## 四、已确认设计方案（ADR-FAVOR-001）

### 4.1 叙事阈值重标 + 封顶

| 档位 | 旧阈值 | 新阈值 | 新手到访次数（≈+18/次） | 老玩家（≈+25/次） |
|------|--------|--------|--------------------------|-------------------|
| 偶层（成了常客） | 30 | **120** | ~6.7 次 | ~4.8 次 |
| 稀层（老相识） | 60 | **280** | ~15.5 次 | ~11.2 次 |
| 终局偶层（融进图书馆） | 100 | **560** | ~31 次 | ~22 次 |
| 封顶 cap | — | **600** | — | — |

cap 600 纯显示体面，不影响任何门槛，所有阈值均落在 cap 之下。

### 4.2 方案 C：刷新加权（主诉修复，必修）

**机制定位（两层分离）**：
- **"来不来"层**（`app.js:412` `perRollChance`）：决定这 tick 是否生成访客，受氛围/夏蝉光环/借阅等级影响 → **不动**。
- **"选谁"层**（`visitors.js:529`）：从"当前不在馆"的访客里均匀随机 → **只改这层**。

**权重函数**：

```js
const SPAWN_WEIGHT = {
  NEVER_SEEN: 8,   // 从未见过的访客强推倍率
  BASE: 1,
  K: 120,          // 软衰减常数，对齐偶层阈值
  FLOOR: 0.1       // 已建立访客的最低权重
};

function getSpawnWeight(charId) {
  const favor = state.visitorFavors?.[charId] || 0;
  if (favor <= 0) return SPAWN_WEIGHT.NEVER_SEEN;
  return Math.max(SPAWN_WEIGHT.FLOOR,
                  SPAWN_WEIGHT.BASE / (1 + favor / SPAWN_WEIGHT.K));
}

function weightedPick(ids, weightFn) {
  let total = 0;
  const weights = ids.map(id => { const w = weightFn(id); total += w; return w; });
  if (total <= 0 || !Number.isFinite(total)) return pick(ids);
  let r = Math.random() * total;
  for (let i = 0; i < ids.length; i++) { r -= weights[i]; if (r <= 0) return ids[i]; }
  return ids[ids.length - 1];
}
```

**集成点**：`spawnVisitor` 中 `charId = weightedPick(charIds, getSpawnWeight);`

**Monte Carlo 验证结论**：`NEVER_SEEN=8 / K=120 / FLOOR=0.1` 为甜点参数。相对均匀基线，最惨访客首见事件数快约 ~4x，选中次数方差降低约 50%，且 `NEVER_SEEN` 再高收益递减。

### 4.3 方案 A：全局 cap（卫生项，可选）

将 `visitorFavors[charId]` 上限设为 **600**。防止数值无限膨胀，给显示层一个体面天花板。**仅压天花板，不解决"有人 0"主诉。**

### 4.4 不采纳的方案

- **方案 B（降浏览 tick）**：会明显拖慢整体进度，需同步重标阈值，收益不大。
- **方案 D（session 好感）**：改写"长期关系条"语义，与本次纯数值路线冲突。

---

## 五、主诉 vs 卫生项归属

| 方案 | 治的是 | 对"有人 0"主诉 | 性质 |
|------|--------|----------------|------|
| **C（刷新加权）** | 刷新不均 | ✅ 直接治 | **主诉修复，必修** |
| **A（全局 cap）** | 无上限 | ❌ 零贡献 | 卫生项，可选 |

实施时必须保证 **C 已落地**，A 可与 C 同时上，但绝不能只上 A。

---

## 六、已知代价

- **好感收入随战力膨胀**：新手一次 visit ≈ +18，老玩家（借阅区高等级 + 乔一一 +30% 还书）≈ +25。门槛静止、收入膨胀 → 老玩家撞线快约 **1.4x**。这是纯数值路线下的已知代价，已接受。
- **平面访客（`tickPlaneVisitors`）**：走独立路径，本次方案C 不覆盖。若平面访客也出现"有人 0"，需另开 issue。

---

## 七、落地代码

- `js/visitors.js`：新增 `FAVOR_CAP = 600`、`FAVOR_THRESHOLDS`、权重函数与 `weightedPick`，`spawnVisitor` 改用加权抽取。
- `js/dev-console.js`：调试面板阈值显示同步为 120/280。
- `data/visitor-events.js`：注释中的阈值同步更新。

---

## 八、备注

- 该问题与 `js/render/focus.js` 中的每日任务显示 bug（还书任务显示 +5 氛围，实际 +1）已一并修复。
- 修复提交可在本地工作区或后续推送的分支中查看。
