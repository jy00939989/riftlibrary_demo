# 自出版系统计划评审 · 系统健壮 + 数值平衡主轴

> 评审口径：以代码为事实源，逐条核对方案自称「经济数字全部核实属实」的引用是否落地。
> 重点轴按用户要求：**系统健壮性**、**数值机制平衡性**，其余查漏补缺。
> 代码锚点已实读：book-progress.js / focus-orchestrator.js / visitors.js / books.js / collection.js /
> volumes.js / borrow-levels.js / data/items.js / save.js / sync.js / account-ui.js / dailytasks.js。

---

## 结论（先讲）

方案方向对、双闸哲学（执照准入 + 耗材摩擦）站得住、注入架构（进度走 `state.books` 默认形状、内容走 `customBooks` 独立 key、BOOKS 运行时注入）合理。
但有两处硬伤必须改：

1. **经济基线数字（方案立信之本）与代码不符且内部打架** —— 方案自称「全部核实属实」，这条立不住。
2. **跨设备云同步会让自定义书变成「有进度无定义」的孤儿条目**，而 36 处 `BOOKS[bid]` 消费点无防护。

下面按重点轴 + 查漏展开。

---

## 一、数值机制平衡性（重点轴）

### P0-A · 经济基线数字错误（方案立信之本）

| 项 | 方案 §一.1 写的 | 代码实测（book-progress.js:84-88） |
|---|---|---|
| 完成氛围（<3万字） | 4 氛围 | **3 氛围** |
| 完成氛围（≥10万字） | 15 氛围 | **10 氛围** |
| 完成金币 | 100 币（line36）/ 50 币（line35 自相矛盾） | **50 币** |

- 方案 §一.1 写成「4 氛围 + 100 币 / 15 氛围 + 100 币」——既错对代码，又自相矛盾（line 35 写"固定 50 币"，line 36 写"100 币"）。
- 影响：后续所有防刷论证的"地基数字"都建在错的引用上。结论（净沉没、长线投资）在纠正后**更稳**（50<100，沉没更彻底；自定义书 atmo/coin 效率严格低于 curated，无农场动机），但「核实属实」的立信崩了。
- 修法：§一.1 改为 **3/6/10 氛围 + 50 币**，删 line 36 的 100 币；§一.1 标题「全部来自现行代码」保留但数字须对齐。

### P1 · 灵感流速 3→2 未传导到汇总口径

- `dailytasks.js:62` 已落地 3→2（每日馆务全勤 `addInspiration(2)`，注释明写"2026-10-30 图南拍板"）。
- 但 §一 汇总行「100 灵感 ≈ **33 天**日常灵感」仍按旧 3/天算（100/3≈33）；按现 2/天应为 **~50 天**。§一.4 自己记了 3→2 却没回改汇总。
- 同理「月产 120+」按 3/天≈90+其他；现 2/天≈60+其他 —— 整段流速校准口径停留在旧值。
- 修法：汇总口径统一用 2/天，或显式标 `[PLACEHOLDER · 待流速校准]`。

### P1 · 耗材「打底 1+1」的短会话悬崖（平衡尖角）

- §一.7/§一.5：每 commenced 30 分钟耗 1 纸+1 墨，打底 1+1；犊皮纸/墨水各 80 币/10 → **1+1 = 32 币/次打底**。
- 收益曲线：60min 赚 48 币 → 净 **+16**；30min 赚 24 币 → 净 **-8**；5min 赚 4 币 → 净 **-28**。
- 即玩家导入一段短文做 5–10 分钟自定义抄写，首体验是「倒贴 28 币」——与 §一.2「消除花钱抄自己字的心理阻力」初衷直接相悖。
- 缺口：方案没定义"commenced"门槛——是**任何开抄都扣打底**，还是必须跨过某分钟数？中途放弃是否退还？
- 建议：打底只在会话实际达到最小计费单位（如 ≥15min 或真正 commenced）时扣；或首 15min 免费（标 `[PLACEHOLDER]`），让短自定义会话不至于负体验。扣耗材时机（开场扣 vs 完成按比例扣）也须写明，否则"开抄即扣、中途放弃白损"是另一处摩擦税。

### P1 · 刊行分成 / 上传冷却无数字（红线）

- §一.3③「被抄分成（**日上限**）」、§四「pending ≤3/人、**上传冷却**」——只有名字没有数。
- 按设计红线，未标定数值必须标 `[PLACEHOLDER · 附假设与验证路径]`。
- 建议：分成比例、日上限、上传冷却时长全部标 `[PLACEHOLDER]`，V2 前用仿真定档。

### P2 · 跨计划：自定义书进借阅池后复用 maintenance +1 氛围农场

- 一旦自定义书拿流通执照进 `getCompletedBooks`，它和 curated 书同口径吃 wear/damage/repair，也同口径吃「古籍保养 +1 氛围」（book-maintenance-plan 决策 4）。
- 那条 +1 氛围无 sink（我前评 P0）本就是通胀口；自定义书把它扩散到玩家自创内容上。
- 方案没跨引。建议：§五 防刷清单加一条「自定义书同样受保养 +1 氛围闸门约束（引用 maintenance-plan 的 P0 修法）」。

---

## 二、系统健壮性（重点轴）

### P0-B · 跨设备云同步 → 自定义书「有进度无定义」孤儿（必改）

链路还原：
- `save.js` 整档上传（含 `state.books[custom_id]` 进度）——所以云档**含**进度；
- `account-ui.js:640` 云端下载直接 `save(STORAGE_KEYS.STATE, cloudSave)` + `reload()`；
- `customBooks`（内容/执照）是独立 key、§五 明确"v1 零 payload 不上云"。

后果：新设备登录 → `state.books` 里有 `custom_id` 进度，但 `customBooks` 空 → 加载时无法从 `customBooks` 重建 BOOKS def → `state.books[custom_id]` 成引用缺失定义的孤儿。

风险点：
- `getCompletedBooks`（visitors.js:851）遍历 `Object.values(BOOKS)`——没有 def 就不出现，**反而安全**；
- 但书架渲染遍历 `state.library.shelves` 的 id → `BOOKS[bid]` undefined → 崩溃/空卡；
- 磨损/损毁循环带孤儿条目跑无意义逻辑。

修法（二选一，推荐前者）：
- **(a)** 加载时做 reconcile：删除 `state.books` 中 `custom_id` 但 `BOOKS`/`customBooks` 无 def 的孤儿条目（干净降级：本设备无此书）；
- (b) 全 36 处 `BOOKS[bid]` 消费点统一走 `resolveBook(bid)` 返回 null 守卫——成本高，不如 (a)。

**同时方案应显式声明 v1 自定义书是设备绑定的**（local 导入 local 玩），把"跨设备不跟随"写成已知限制而非静默损坏。

### P1-A · tryUnlockNewBook 守卫须配对「准印即建条目」时机

- `books.js:10` `allBookIds = Object.keys(BOOKS)`，注入自定义书后未付费的会进 `lockedIds` 被随机白送（绕过 300+40 闸）。方案守卫#1 命中真漏洞。
- 但光加守卫不够：必须规定「**买抄本准印券时即创建 `state.books[custom_id]`**（status='copying' 或新 'licensed' 态）」，否则"准印后、首抄前"窗口里自定义书在 BOOKS 不在 `state.books` → 仍可被白送。
- 建议：守卫改为 `lockedIds = allBookIds.filter(id => !unlockedIds.includes(id) && !BOOKS[id]?.isCustom)`；并锁定创建时机为准印瞬间。

### P1-B · 借阅闸门需定义 getBookLicense 访问器

- §三 要 `getCompletedBooks` 加 `license.lendable` 过滤，但 license 在 `customBooks`（独立库），不在 BOOKS def 也不在 `state.books`。
- `getCompletedBooks`（visitors.js:851）当前**完全不查 license**（curated 书默认可借）——自定义书一旦注入 BOOKS 就自动进借阅池，与"流通执照是叠加闸"矛盾。
- 修法：抽 `getBookLicense(bookId)`——custom 书读 `customBooks[id].license`，curated 返回 `{copy:true, lendable:true}`；`getCompletedBooks` 调用它做唯一收口。守卫#3（里程碑/兑换码过滤）也走同一访问器，避免各写各的判据。

### P1-C · 耗材 'material' 分类与商店管线

- `data/items.js` 当前**无 'material' 分类**；`isItemUsable`（line 88）只认 brush/repair/favor/candy。
- 若商店按 `isItemUsable` 过滤展示，材料不会上架。方案说"与心意便签同商店管线"但未验证渲染路径。
- 修法：明确材料走"可购买但不可在背包使用"的展示分支（shop 按 `ITEMS` 全量或 category 白名单渲染，而非仅 `isItemUsable`）。实现前先 grep shop 渲染逻辑确认。

### P1-D · VOLUME_GROUPS / BOOKS 刷新重建须覆盖卷组 + 典藏版 def

- `js/volumes.js` 的 `VOLUME_GROUPS` 是模块级 const 可变、但**不落盘**；自定义多卷须从 `customBooks` 重建 BOOKS def + `VOLUME_GROUPS` 条目 + **典藏版 def**，三者缺一不可（方案 P1-B4 只提了 BOOKS 与卷组，漏了典藏版 def 注入点）。
- 注入时机"render 前同步"成立（volumes.js 仅在函数内引用 VOLUME_GROUPS，无顶层遍历），但重建脚本须保证顺序：先 BOOKS → 再 VOLUME_GROUPS → 再典藏版 def。

### P2 · localStorage 总预算未封顶

- §二「单书 ≤10 万字（localStorage 预算）」只限单书；多本自定义书累计无上限，长期玩可能撑爆 localStorage（尤其多卷巨著）。
- 建议：加全局自定义字数/本数硬上限（`[PLACEHOLDER]`），超限引导拆书或 V2 上云。

---

## 三、查漏补缺（其他）

### §七 两拍板点建议

1. **还书整单自定义书为主时叙事照发（推荐）**：叙事是 char 驱动、与被借书无关；suppress = 对自出版玩家额外削一刀，违背"有奖励不隔离"基调。
2. **图鉴百分比不计入自定义书（推荐）**：全收集党不被迫买执照补齐非 curated 项；自定义书走独立陈列位——但方案须补"独立陈列位"的 **UI 工作量评估**，别只说"不计入"就当做完了（collection.js `getProgress` 改完还要加独立展示区块）。

### 测试计划缺口

- §六 缺"云档下载后自定义书 reconcile"用例（P0-B 的回归）。
- 缺"准印即建 `state.books` 条目"的创建时机用例（P1-A）。
- 经济仿真脚本要按**纠正后的**完成奖励（50 币 / 3–10 氛围）重跑；原脚本若用了 100 币会高估 curated 优势、低估自定义书相对吸引力。

---

## 决策清单（请图南勾选）

- [ ] **P0-A**：§一.1 数字改为 3/6/10 氛围 + 50 币，删 line36 的 100 币
- [ ] **P0-B**：加载 reconcile 删孤儿 `custom_id`；声明 v1 设备绑定
- [ ] **P1**：灵感汇总 33天 → 50天（或标 `[PLACEHOLDER]`）
- [ ] **P1**：耗材打底门槛 / 放弃退还定义（标 `[PLACEHOLDER]`）
- [ ] **P1**：刊行分成 / 日上限 / 上传冷却 标 `[PLACEHOLDER]`
- [ ] **P1-A**：tryUnlockNewBook 守卫 + 准印即建条目
- [ ] **P1-B**：`getBookLicense` 访问器 + `getCompletedBooks` 单一收口
- [ ] **P1-C**：材料分类商店渲染路径确认
- [ ] **P1-D**：卷组重建含典藏版 def
- [ ] **P2**：localStorage 总预算封顶
- [ ] **§七**：两拍板点照发 / 不计入（含独立陈列位 UI）
