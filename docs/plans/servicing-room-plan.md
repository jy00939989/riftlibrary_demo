# 保养预约（锁定待修机制）· Plan v3 定稿

> 2026-10-25 · 痛点：馆长操作窗口被访客 tick 节奏碾压——轮到玩家修书时书已被借走。
> 图南四决策（v1 拍板）：① 初始 2 格、damaged 不占格 ② 价目 30/80/200/500 封顶 6，升级修复室送格子
> ③ 修完手动点「回架」④ 收书入口勾选默认不勾。
> v2：过一轮评审修订（P0 灾难免疫、双付冲抵、pending 死锁写明等 8 项，见修订记录）。
> v3：图南终拍——冲抵采纳、命名走方案乙（新机制定名「**保养预约**」、修缮箱改名「**卷册匣**」）、回架入口选 B（保养台待回架条带）。
> 状态：**v3 定稿已实施完毕（2026-10-25），22 测试套件全绿（含新增 servicing 59 项）。**
> 实施附带修复：① visitors.js 补导入 `getRestorationRepairSpeedBonus`——此前损坏还书的历史行在生产环境必抛 ReferenceError（前窗口遗留未提交改动引入）；② 7 个测试套件的 schemaVersion 硬编码随 v17 迁移更新；③ test-copy-remaining 引入 node-env-mock 修预存 breakage；④ test-visitor-gift-books 的 elStub 递归化修弹窗崩溃。

---

## 修订记录

| 版本 | 内容 |
|---|---|
| v1 | 初版：锁定待修机制 + 四决策 + 五待评审点 |
| v2 | 评审修订 R1-R8：灾难免疫三过滤器补 `!bs.servicing`（P0）；升级冲抵 purchased 防双付；pending 释放途径写明 intended；§五查询/写入层澄清；collectReturn 损毁处理写死；测试并入评审补点；日任 +1 氛围旧账记入 §九 |
| v3 | 终拍落定：冲抵采纳（§二公式入案）；命名方案乙入案——**修缮箱→卷册匣**、新机制显示名「**保养预约**」、修复室/保养台保留（§一、§三、§五全量替换）；回架入口选 B：保养台「待回架」条带（§五.4）；§八决策记录封闭 |

---

## 一、核心概念

书可打「**保养预约**」（`bs.servicing`）：留在书架原位（策展/陈列不受影响）、**不可外借、免疫架上灾难**，直到玩家手动回架。

> 命名方案乙（v3 拍板）：修复室（设施，保留）/ 保养台（批次面板，保留）/ **保养预约**（本机制，槽位）/ **卷册匣**（原"修缮箱"，卷组单卷收纳，本次随带改名正名）。

```
bs.servicing 取值：
  'locked'  —— 书在馆，已锁定，不可借、免疫灾难
  'pending' —— 书在借，已预约，还回瞬间自动转 locked（打标即享灾难免疫——评审 R1 定：与卷册匣同列免疫名单，
              不区分在馆在借；v3 实施注记：与 §一 v2 草稿"在借不免疫"的表述不同，以 blanket 免疫为准）
  undefined —— 正常状态
```

占用规则：
- locked 与 pending 各占 1 格（pending 从打标那一刻起占格——它是对格位的预订）。
- **damaged 永不占格**：损毁是被动灾难，不该被容量二次惩罚；damaged 书也不可打预约（修好之后想锁再打）。

## 二、容量与经济（决策 ①② + 冲抵）

**总格数 = min(6, 2 + 修复室等级 + 已购格数)**

| 来源 | 格数 |
|---|---|
| 基础 | 2 |
| 修复室等级赠送 | 每级 +1（Lv1→3 格 … Lv4 已达 6 格封顶） |
| 花钱扩容 | 第 3 格 30 / 第 4 格 80 / 第 5 格 200 / 第 6 格 500 |

- 价目按「当前总格数的下一格」取值：3→30、4→80、5→200、6→500；满 6 格不再显示扩容入口。
- 扩容走 `spendCoins` + `addHistory('purchase', …)`，模式照抄卷册匣（原修缮箱）扩容。
- **升级送格不改升级价**（400×1.45^n 照旧）：修复室原有的修复速度 +10%/级、保养批次上限 1/2/3/4 不变，格子是新增收益。
- **冲抵（v3 拍板，防双付）**：`upgradeRestorationLevel` 成功时执行
  `servicingSlotsPurchased = max(0, servicingSlotsPurchased - (新等级 - 旧等级))`。
  效果：Lv0 买 4 格 → 升到 Lv4（多送 4 格）→ purchased 归 0，总格全程保持 6。
  810 币买到的是「提前享受满格」，不吃亏；「30 立刻要第 3 格 vs 攒 400 升级」的权衡原样保留。

防通胀复查：锁定 = 断该书的借还收入（机会成本即代价）；扩容与升级都是 sink；无新产出源。保养零直接奖励的纪律不动（日任 +1 氛围旧账见 §九）。

## 三、入口

### 入口一：大书架卡片（主动预约）

书卡操作区加「**保养预约**」开关（`js/render/bookshelf.js` 条件行附近）：

| 书的状态 | 开关行为 |
|---|---|
| 在馆未借、wear>0 | 开 → 立即 locked（校验容量，满则拒绝并 toast） |
| 在借 | 开 → pending（占 1 格），卡片显示「🔒 已预约 · 还回后自动锁定」 |
| 任何状态 | 关 → 立即取消（locked 回可借池，磨损保留；pending 释放格位） |
| damaged / 典藏(indestructible) / 积灰(dustyAt) | 不显示开关（无可保养内容） |

锁定书的卡片视觉：🔒 徽记 + 标题区降饱和；locked 书在保养台置顶（见 §五）。

### 入口二：待收取行内勾选（临场决定，决策 ④）

勾选不放结算弹窗里，放「待收取」行的每本磨损书标题旁（🔒 小 toggle，`js/render/visitors.js`）。

理由：结算弹窗打开期间 visitor tick 仍在跑，书一旦还回池子、弹窗还没点完就可能被下个访客抱走——弹窗内勾选存在真实竞态。行内勾选在收取**之前**完成，`collectReturn` 同一事务内落锁，零竞态。

交互：
- 待收取行内，每本「wear>0 且未损毁」的书标题旁出 🔒 toggle，**默认不勾**（决策 ④），tooltip「保养预约」。
- 勾选时即校验容量（满则拒绝勾选 + toast「保养预约已满（x/6），先回架或扩容」）。
- 点「收取」时原子生效：collectReturn 结算内对被勾选书设 `servicing='locked'`。
- **一键收书不新增勾选 UI**：合并弹窗保持不动；已打 pending 的书在一键收书里自动落锁（预标记本来就是它的主用途）。想在收书时临场锁就用单收行内 toggle。

## 四、状态流转与边界

```
打标(在馆) ──→ locked ──→ 保养完成 ──→ locked（wear 已清零，保持锁定）
                              │                │
                              │                └── 玩家点「回架」→ 解锁回池
                              └── 玩家随时可取消 → 立即回池，磨损保留

打标(在借) ──→ pending ──┬── 还回收取 ──→ locked（入口二勾选时同此）
                         ├── 还回时损毁 roll 命中 ──→ 预约自动取消（写死：
                         │     设 servicing=undefined + 弹窗/历史告知「《X》还回时已损毁，
                         │     预约取消——先送修复室吧」，**绝不设 'locked'**），格位释放
                         └── 失窃 ──→ pending 自动清除 + 历史一条
```

- **灾难免疫（P0 修复）**：`js/core/disasters.js` 三处候选过滤器补 `&& !bs.servicing`：
  - `pickVictims`（:84）——一处同时覆盖鼠患(:155)/霉斑(:179)/火灾(:200)/积灰(:282)/失窃(:297)；
  - `pickColdBooks`（:103，蛀虫 :222）；
  - `pickWindowShelfVictims`（:314，台风 :363)。
  语义：已打保养预约的书如同在卷册匣里，是「不在架上流通的预处理书」，架上灾难不该波及。此修复让「锁定=免疫损毁」成为事实，并消掉锁定书被误偷（stolen+locked 在 sweep 还回时还会 applyDamage 变 damaged，脏上加脏）。
- **借出池排除**：`getCompletedBooks()`（visitors.js:858）加 `!bs.servicing`。
- **pending 释放途径**：只有三种——还回收取转 locked / 还回损毁命中取消 / 失窃清除。'due' 状态不自动收取，所以「忘了收，pending 就占着格」是 **intended**（懒的代价），不是漏写；测试断言此行为锁死。
  实施注记：pickVictims 排除 servicing 后，失窃已**结构性打不中**预约书——triggerTheft 里的清除是防御性兜底（死代码保险），测试改断言「失窃不选预约书」这一真实行为。
- **重抄**：locked/pending 书禁用重抄入口（提示「先回架/取消预约」）。不做「重抄自动取消锁」，少一条隐式副作用。
- **卷组单卷**：与卷册匣（原修缮箱，卷组收纳）正交，可正常打预约。
- **保养批次挂起期间打锁**：sanitizeSession 不受影响——locked 书未借出、未损毁，依然可保养，锁只是断外借。
- **入批限制**：`startMaintenanceSession` 只挡转录锁 `status==='locked'`，servicing 锁定书 status='completed' 可正常入批，**不要**多加判断。
- **存档**：`bs.servicing` 读时兜底 undefined 即可；新增 `state.servicingSlotsPurchased = 0` 需在 state.js 默认值 + migrations.js 补迁移。
- **容量只增不减**：修复室等级不会下降，冲抵只减 purchased 不减总格，无收缩边界。

## 五、保养台联动（js/render/library.js:471）

1. **头部加保养预约面板**：「📅 保养预约 x/6」+ 扩容按钮（显示下一格价目，满 6 隐藏）。
2. **排序（查询层）**：`getMaintainableBooks()` 输出 locked 优先（先按 `servicing==='locked'` 分组、组内按 wear 降序；未锁组照旧 wear 降序）。**结算/磨损清零公式零改动**——改的是查询排序，不是核心公式。
3. **结算后**：locked 书保持锁定，显示「✨ 已保养 · 待回架」（决策 ③：手动确认，不自动解锁）。
4. **回架入口（v3 拍板 B）**：保养台顶部加「**待回架**」条带——列出已保养待回架的书，每本一个「回架」按钮；servicing 相关操作全聚在保养台一处，不新开弹窗。
5. 待回架书不在可保养列表（wear=0 已不满足条件）。

## 六、改动文件清单

| 文件 | 改动 |
|---|---|
| `js/capacity.js` | 新增 getServicingSlots / getServicingSlotPrice / expandServicingSlots（模式照抄卷册匣扩容）；`upgradeRestorationLevel` 加 purchased 冲抵；**卷册匣改名**（restorationBox 显示串："修缮箱"→"卷册匣"） |
| `js/state/state.js` | 新增 `servicingSlotsPurchased: 0` |
| `js/state/migrations.js` | 迁移补 `servicingSlotsPurchased` |
| `js/core/disasters.js` | **P0**：pickVictims / pickColdBooks / pickWindowShelfVictims 三处过滤器补 `!bs.servicing` |
| `js/visitors.js` | `getCompletedBooks` 排除 servicing；`collectReturn` 收可选 lockBookIds 参数，结算内原子落锁；损毁命中时清 servicing（勾选清单与既有 pending 都清），绝不写 'locked' |
| `js/core/maintenance.js` | `getMaintainableBooks` 查询排序 locked 优先（只动排序，不动结算公式） |
| `js/render/bookshelf.js` | 卡片：保养预约开关 / 🔒 徽记 / 待回架态 |
| `js/render/visitors.js` | 待收取行：磨损书 🔒 toggle（勾选即占格校验） |
| `js/render/library.js` | 保养台头部保养预约面板 + 扩容按钮 + 待回架条带 |
| `js/i18n/terms.js` | 全部新词条 + 改名词条中英双语（保养预约 Care Reservation / 卷册匣 Volume Case） |
| `js/render/volumeTracker.js` / `js/render/tutorial-ui.js` | 卷册匣改名渲染串 |
| `tests/` | 新增测试（§七） |

> 改名说明：旧档历史记录里的「修缮箱」字样是写入即固化的历史文本，不回溯改（历史上它确实叫那个名）；只改所有面向未来的显示串与词条。

## 七、测试要点

1. 容量公式：基础 2 / 升级送格 / 价目 30/80/200/500 / 封顶 6。
2. **冲抵**：升级后 `servicingSlotsPurchased` 被等级差冲抵，总格不缩水。
3. 打标：在馆立即 locked；在借转 pending 且占格；容量满拒绝。
4. 还回：入口二勾选 → collectReturn 后 locked；pending 自动转 locked。
5. **还回损毁**：collectReturn 对「勾选落锁且损毁命中」的书 → `servicing` 清空而非 'locked'，格位释放。
6. **灾难免疫**：pickVictims / pickColdBooks / pickWindowShelfVictims 产出的候选不含 servicing 书；失窃不选锁定书。
7. 借阅池排除：locked/pending 书不出现在 getCompletedBooks。
8. 保养：locked 书可入批；结算后保持 locked；回架后解锁 + wear 保持 0。
9. **pending 死锁**：无收取时 pending 持续占格（intended，断言锁死）。
10. 取消：任何时刻取消，书立即回池、磨损保留。
11. 失窃清 pending。
12. 扩容扣款 + addHistory；满 6 拒绝。
13. 迁移：旧档读新字段不炸。

## 八、决策记录（全部封闭）

| # | 议题 | 结论 |
|---|---|---|
| 1 | 容量公式 / damaged 不占格 | 图南拍板（v1）：min(6, 2+等级+已购)，damaged 不占格 |
| 2 | 价目 + 升级送格 | 图南拍板（v1）：30/80/200/500，升级送格不改升级价 |
| 3 | 回架方式 | 图南拍板（v1）：手动点「回架」 |
| 4 | 收书勾选默认 | 图南拍板（v1）：默认不勾 |
| 5 | 双付陷阱 | 图南拍板（v3）：采纳升级冲抵 |
| 6 | 命名 | 图南拍板（v3）：方案乙——新机制「保养预约」、修缮箱→「卷册匣」、修复室/保养台保留 |
| 7 | 回架入口位置 | 图南拍板（v3）：B——保养台「待回架」条带 |
| 8 | 行内勾选修正 / pending 占格 / 一键收书不加勾选 | 评审背书 + 无反对，按 v2 入案 |

## 九、跨计划联动（不阻塞本计划）

保养日任 +1 氛围（dailytasks.js:33）是无闸 source：每天只要保养一批就 +1，保养预约给的是机会成本不是闸。这是 book-maintenance 计划的旧账（前一份 review 的 P0），应在 maintenance 侧单独立项修，别指望本机制替你兜。
