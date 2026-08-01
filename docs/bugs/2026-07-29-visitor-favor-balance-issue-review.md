# Plan Review：2026-07-29-visitor-favor-balance-issue.md

> **Reviewer**：Software Architect（架构师二审）
> **Date**：2026-07-29
> **Target**：`docs/bugs/2026-07-29-visitor-favor-balance-issue.md`（当前版本，无版本号）
> **Verdict**：**诊断正确（非 bug、数值失衡），四方案方向对；但报告把"主诉修复"与"卫生项"混列、方案C 示例低端塌平、且漏了"好感收入随战力膨胀"的撞线错位。用户已拍板组合（纯数值 + 抬高门槛 120/280/560 + cap 600 + 方案C 加权），本文将其固化为可落地设计。**

---

## 一、总体评价

报告对根因的定位是准的：三条好感来源（浏览 tick / 借书 / 还书）无重复计算，夏蝉「舞台之光」(`visual_spawn`) 只加**到来概率**不加好感——所以**这不是代码 bug，是数值设计失衡**，结论成立。我额外核实了 `getAuraSpawnBonus`（core/visitor-lookup.js:91）确认它走的是"来不来"层，与好感获取无关，报告此条无误。

但报告在"怎么修"上有三处结构问题：

1. **主诉与卫生项混列**：报告"首选 A+C"，但 A（cap）只压天花板、完全不碰"有人永远 0"主诉；真正治主诉的是 C（刷新加权）。若实施方只上 A，玩家下次打开仍见 0。
2. **方案C 示例低端塌平**（L113-118）：`favor===0?5 : max(1, 100/(favor+10))` 在 `favor=0` 与 `favor=10` 处权重都是 5，曲线在低端无意义平坦。
3. **漏了收入膨胀错位**：即使加了 cap 和抬高门槛，"赚分速度随战力（借阅区等级、乔一一 +30% 还书）膨胀"→ 老玩家撞线比新手快约 1.4x，cap/门槛都不消除这个错位。

用户已拍板组合：**保持纯数值（不引入到访次数）、抬高后期触发事件门槛、加封顶、并做方案C 刷新加权**。下面把这套固化。

---

## 二、🔴 P0 — 主诉修复不可遗漏（必改 / 必明确）

### P0-1：A 与 C 的主诉归属必须分清

报告的"策划建议组合"（L144-148）把 A+C 列为"首选"，但二者解决的是不同问题：

| 方案 | 治的是 | 对"有人 0"主诉 | 性质 |
|---|---|---|---|
| **C（刷新加权）** | §3.3 刷新不均 | ✅ 直接治 | **主诉修复，必修** |
| **A（全局 cap）** | §3.1 无上限 | ❌ 零贡献 | 卫生项，可选 |
| B（降被动 tick） | §3.2 收益偏高 | ⚠️ 间接 | 备选 |
| D（session 好感） | §3.4 阈值卡死 | ✅ 但改写语义 | 大改，与 A 互斥 |

**风险**：实施方看到"首选 A+C"容易只上 A（改动更小），结果 1948 压成 600 很体面，但 0 还在。用户已明确两者都做，本 review 仅要求文档把"C 必修、A 可选卫生项"写死，避免后人误读。

### P0-2：方案C 示例低端塌平（L113-118）

```js
// 报告原示例
const weights = charIds.map(id => {
  const favor = state.visitorFavors?.[id] || 0;
  return { id, weight: favor === 0 ? 5 : Math.max(1, 100 / (favor + 10)) };
});
```

`favor=0 → 5`，`favor=10 → 100/20 = 5`（同权！），`favor=100 → 0.91`。**未访问(0) 与刚起步(10) 权重完全一样**，bootstrap 在低端失效。

**修法**（本 review §五 固化版）：用"显式 bootstrap 常数 + 软衰减"，见下。

---

## 三、🟠 P1 — 应改

### P1-1：阈值 30/60/100 过低，需重标

按报告估算单次 visit +18~20：到 30 约 **2 次**、到 60 约 **3 次**、到 100 约 **5 次**来访即解锁。对"常客关系"而言过浅。固化版见 §五 表（偶层 120 / 稀层 280 / 终局 560）。

### P1-2：cap 值未与门槛对齐

报告说"100 或 120"（L84），但没说与重标后门槛的关系。建议 cap = **600**（> 终局 560 留 40 余量，纯显示体面）。所有阈值必须落在 cap 之下，否则 cap 会卡住叙事解锁。

### P1-3：好感收入随战力膨胀的撞线错位（保留，用户已知晓）

新手一次 visit ≈ +18，老玩家（借阅区高等级 + 乔一一 +30% 还书）≈ +25。门槛静止、收入膨胀 → 老玩家撞线快约 **1.4x**。抬高门槛只延长耗时、不消除比例。用户已接受该错位（纯数值路线下的已知代价），标注即可，不阻塞。

### P1-4：`weightedPick` 需 `total<=0` 兜底

上游 `spawnVisitor`（visitors.js:527）在"所有人已在馆"时 `charIds` 为空直接 `return null`，weighting 碰不到。但 `weightedPick` 自身应对 `total<=0` 退回 `pick(ids)` 均匀，防未来改动（如引入负权重或全 0）踩坑。固化版已含。

### P1-5：单次 visit +18~20 为估算，需 code 核实

报告 §3.2 的 +18~20 来自手算（L46-52）。代码实际累加为：浏览 tick（visitors.js:581-583，每 60s 受借阅等级加成）+ 借书（:631-633）+ 还书（:883-886，乔一一光环时更高）。**各段实际数值应在写死阈值前从代码逐段确认**，否则 120/280/560 的"几次来访"推算会偏。当前标 **[PLACEHOLDER · 待 code 核实]**。

---

## 四、🟡 P2 — 建议

| 项 | 位置 | 问题 | 建议 |
|----|------|------|------|
| 两层未区分 | 报告 §3.3 vs §四 | "刷新加权"改的是"选谁"层，但 app.js:412 的 `perRollChance`（含 `getAuraSpawnBonus`/`getBorrowSpawnBonus`）是"来不来"层，二者正交；报告没讲清，易让人误改错层 | 固化版 §五 明确只改 visitors.js:529 |
| 显示层已有错 | 报告 §七 L163 | focus.js 还书任务显示 +5 氛围实际 +1，好感/氛围数字已显示与真实不符 | 重平衡前先加好感审计日志，否则改完也无法验证 |
| 平面访客独立路径 | app.js:1390 `tickPlaneVisitors` | 一般访客走 `spawnVisitor`，平面访客走独立路径；本次方案C 不覆盖后者 | 若平面访客也有"有人 0"，需另查（out-of-scope） |
| 方案D 缺锚点 | 报告 §四 | A/C（持久关系条）与 D（session 对话条）设计意图互斥，报告未先写 fun hypothesis 导致 A/D 之争缺锚 | 用户已选 A/C 路线，D 暂缓 |

---

## 五、固化的设计方案（用户拍板版）

### 5.1 叙事阈值重标 + 封顶

| 档位 | 旧阈值 | 新阈值 | 新手到访次数（≈+18/次） | 老玩家（≈+25/次） |
|---|---|---|---|---|
| 偶层（成了常客） | 30 | **120** | ~6.7 次 | ~4.8 次 |
| 稀层（老相识） | 60 | **280** | ~15.5 次 | ~11.2 次 |
| 终局偶层（融进图书馆） | 100 | **560** | ~31 次 | ~22 次 |
| 封顶 cap | — | **600** | — | — |

> 全部标 **[PLACEHOLDER · 待 P1-5 code 核实单次到访速率后定稿]**。cap 600 纯显示体面，不影响任何门槛。

### 5.2 方案C：刷新加权（详细）

**机制定位（两层分离，已核实正交）**
- **"来不来"层**（app.js:412 `perRollChance`）：决定这 tick 是否生成访客，受氛围/夏蝉光环/借阅等级影响 → **方案C 不动**。
- **"选谁"层**（visitors.js:529 `pick(charIds)`）：从"当前不在馆"的访客里均匀随机 → **方案C 只改这层**。

**权重函数**

```js
// visitors.js —— 方案C：刷新加权
const SPAWN_WEIGHT = {
  NEVER_SEEN: 8,   // favor===0 的权重（基线 1 的倍率）[PLACEHOLDER · 待 Monte Carlo 调]
  BASE: 1,
  K: 120,          // 软衰减常数，对齐偶层阈值 120 [PLACEHOLDER · 待 Monte Carlo 调]
  FLOOR: 0.1,      // 已建立访客的最低权重，保证仍偶尔出现
};

function getSpawnWeight(charId) {
  const favor = (state.visitorFavors && state.visitorFavors[charId]) || 0;
  if (favor <= 0) return SPAWN_WEIGHT.NEVER_SEEN;          // 从未见过的访客强推
  return Math.max(SPAWN_WEIGHT.FLOOR,
                  SPAWN_WEIGHT.BASE / (1 + favor / SPAWN_WEIGHT.K));
}

function weightedPick(ids, weightFn) {
  let total = 0;
  const weights = ids.map(id => { const w = weightFn(id); total += w; return w; });
  if (total <= 0) return pick(ids);                        // 兜底：全 0 权重退回均匀
  let r = Math.random() * total;
  for (let i = 0; i < ids.length; i++) { r -= weights[i]; if (r <= 0) return ids[i]; }
  return ids[ids.length - 1];
}
```

**集成点**：`spawnVisitor`（visitors.js:529）

```js
// 原来：charId = pick(charIds);
charId = weightedPick(charIds, getSpawnWeight);
```

第 527 行"排除已在馆访客"的 filter 原样保留——权重只作用在可选池内部。

**边界 / edge cases**
- **在馆已满**：第 527 行 `charIds` 为空 → 上游已 `return null`，weighting 碰不到，无影响。
- **新内容访客**：`state.visitorFavors` 初始化给新 id 赋 0 → 自动吃 `NEVER_SEEN` 强推；顺带覆盖"刚解锁的访客"场景（解锁前 0、解锁后立刻被推），无需单独逻辑。
- **无 VISITOR_DEFS 级门槛**（已 grep 确认：requirement/unlock/locked/gated 全在 books/achievements，与访客无关）：权重无需前置过滤，所有 def 默认可刷。

**失效信号（playtest 前先定义）**
- **A 太弱**：连续 30 次生成后 `min(visitorFavors)` 仍 = 0 → `NEVER_SEEN` 太低或存在隐藏门槛。
- **B 太猛**：同一访客连续出现 ≥ 4 次 → `NEVER_SEEN` 太高，观感像刷屏。
- **C 不平**：平衡态（约 200 次后）各访客 favor 方差 > [PLACEHOLDER] → `K`/`FLOOR` 失准。

**配套调参工具**：`docs/plans/favor-balance-montecarlo.py` 用 Monte Carlo 模拟上述 spawn 循环，输出 catch-up 时间分布 / 平衡态方差 / 最大连续同人，供标定 `NEVER_SEEN`/`K`/`FLOOR`。

> **Monte Carlo 验证结论（已实跑）**：在 N=10/300 事件下，加权相对均匀基线——最惨访客首见事件数 54→14（快 ~4x），选中次数方差 18.1→8.6（更均衡）；N=15/200 事件下首见 77→21（快 ~3.6x）、方差 8.5→4.3。`NEVER_SEEN` 敏感度：4→首见均值 11.9、8→10.2、16→10.0，**8 已饱和、再高收益递减且无方差惩罚**→ **8/120/0.1 为甜点参数，可脱离 [PLACEHOLDER] 直接采用**。注意：N=10~15 下均匀基线 300 事件内亦全覆盖（unseen=0），模型未能复现真实"有人 0"，说明真实根因更可能来自"单局 spawn 数远少于模拟"或"平面访客走独立路径（out-of-scope）"，落地前需按 P1-5 核实真实 spawn 频率。

---

## 六、建议落地顺序

1. **P0-2**：方案C 权重函数改为"bootstrap 常数 + 软衰减"（替换 L113-118 示例）
2. **P1-1 + P1-2**：阈值重标 120/280/560 + cap 600（先标 [PLACEHOLDER]，等 P1-5 核实）
3. **P1-5**：从代码逐段确认浏览/借/还实际好感累加，回填阈值与 cap
4. **P0-1**：文档写死"C 必修、A 可选卫生项"
5. **P1-4**：`weightedPick` 加 `total<=0` 兜底
6. **P2**：补好感审计日志、区分两层、标注平面访客 out-of-scope
7. **Monte Carlo**：跑 `favor-balance-montecarlo.py` 标定权重参数后落 code

---

## 七、ADR 草案（供拍板）

> **ADR-FAVOR-001：好感系统的性质与修复路线**
> - **Context**：玩家反馈"有人 1948、有人 0"。核实为非 bug，是数值失衡。好感是"访客对图书馆的熟悉度/关系条"，用户明确**只增不减、不应 sink**（无衰减、无花费）。
> - **Decision**：① 保持纯数值好感，不引入到访次数；② 叙事门槛重标为 120/280/560，封顶 600（纯显示）；③ 主诉"有人 0"由方案C 刷新加权修复（必修），cap 为可选卫生项；④ 好感收入随战力膨胀导致的老玩家撞线快约 1.4x 错位，作为纯数值路线的已知代价接受。
> - **Consequences**：+ 主诉被根治（C）+ 数值不再无限膨胀（cap）；− 撞线错位保留；− 阈值/cap/权重参数在 code 核实与 Monte Carlo 前均为 [PLACEHOLDER]。

> **待用户拍板项**：
> 1. P1-5：从代码确认单次到访好感实际速率后，是否采纳本文 120/280/560/cap600，或微调。
> 2. 方案C 权重参数 `NEVER_SEEN=8 / K=120 / FLOOR=0.1` 是否经 Monte Carlo 标定后采纳。
> 3. 平面访客（tickPlaneVisitors）是否也需要"防 0"处理（当前 out-of-scope）。

---

## 八、结论

报告**诊断层正确**，但**修复层把主诉与卫生项混列、方案C 示例有缺陷、且漏了收入膨胀错位**。用户已拍板的"纯数值 + 抬高门槛 + 封顶 + 方案C"组合是干净的解法，本文将其固化为可落地设计（§五）。落地前需先完成 P1-5（code 核实实际速率）与 Monte Carlo 标定权重，当前阈值/cap/权重**均为 [PLACEHOLDER]**，不建议直接照抄数字进代码。
