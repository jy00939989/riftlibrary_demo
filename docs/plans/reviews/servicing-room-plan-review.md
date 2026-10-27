# 修缮间计划（锁定待修机制）· 评审

> 评审视角：系统 / 机制 / 数值 / 代码集成。已逐条核对引用代码：
> `js/core/disasters.js`（全篇）、`js/core/maintenance.js`（v2 已落地）、
> `js/visitors.js:858 getCompletedBooks` / `:1399 collectReturn` / `:1447 还书损毁 roll`、
> `js/capacity.js`（restoration box 扩容模式）。
>
> 定位：这份计划解决的是一个**真实的竞态痛点**（玩家想保养书时书已被借走），
> 核心"锁定=断借出"的权衡写得清楚（§二 防通胀复查），比 book-maintenance 计划更自觉地写了玩家决策。
> 本文只挑**机制/代码层面没兜住或自相矛盾**的点，按严重度排。

---

## 先结论

计划方向对、权衡诚实。但有一处**核心安全假设是错的**——它以为"锁定书不在借阅池=不会被损毁 roll"，
可灾难走的是 `pickVictims`（disasters.js:84），只排除 `restorationBox`，**完全没排除 `bs.servicing`**。
于是锁定中的书照样会被鼠患/霉斑/火灾/蛀虫/台风砸成 `damaged=true`，制造 `servicing='locked'` + `damaged=true`
的状态冲突，而计划 §四 的流转图根本没兜这种组合。
另有**容量双付陷阱**（早买格子后升级=白付）、§五 内部自相矛盾、以及三套近似命名的可读性坑。

---

## P0 · 锁定书仍会被灾难砸坏（计划 §四 假设不成立）

**事实**：
- `pickVictims`（disasters.js:84）、`pickColdBooks`（:103）、`pickWindowShelfVictims`（:314）和 dust 候选（:282）
  的排除条件都是 `!damaged && !stolenAt && !restorationBox && copiedWords>0` —— **没有 `!bs.servicing`**。
- 一个 servicing='locked' 的书是"在馆、completed、未损毁、未借出"，**完全满足以上候选条件**，会被鼠患/霉斑/火灾/蛀虫/台风/积灰选中。
- 更糟：失窃（triggerTheft:296）也走 `pickVictims`，锁定中的书还能被"偷走"→ `stolenAt` + `servicing='locked'` 的组合。

**后果**：计划 §四 写"锁定书不在池中，自然不会再吃损毁 roll"——**不成立**。
会出现两种计划没兜的状态：
1. `servicing='locked'` + `damaged=true`：书在"修缮间"却被判定损毁。maintenance 的 `getMaintainableBooks` 排除 damaged，
   于是这书既不能保养、又卡在锁定态（计划说 damaged 书"不可被打标"，但它是先锁定后损坏，没说怎么清）。
2. `servicing='locked'` + `stolenAt`：还回时 `sweepExpiredBookStates`（:389）会 `applyDamage` → 又变 damaged。

**修复（一句话，必加）**：在 `pickVictims` / `pickColdBooks` / `pickWindowShelfVictims` / dust 候选四处
补 `&& !bs.servicing`（语义上"在修缮间预处理的书"应与"修缮箱里的书"同享免疫，本就不该被架上灾难波及）。
这一行让计划 §四 的假设**变真**，且顺手解决了 theft 的锁定书误偷。

**对照**：计划 §四 自己要求 `getCompletedBooks` 加 `!bs.servicing`（visitors.js:858 当前确实没有，改动必要），
但它误以为"排除借阅池=免疫灾难"。两条排除**都得加**，缺一不可——计划只写了前者。

---

## P1 · 容量双付陷阱（早买格子后升级 = 白付）

**公式**：`总格 = min(6, 2 + 修复室等级 + 已购格数)`。

推演：Lv0 玩家花 810 币买满 4 格（30+80+200+500）→ 总格 6。
之后升到 Lv4（公式 2+4+4=10→封顶 6）——**已购的 4 格没有退款、没有抵扣**，等于白付 810。

计划 §八 待评审点 1 只问了"Lv4 免费拿满格接不接受"，**没问"先买后升的白付"**。这是真玩家陷阱。

**建议（让购买变成"提前支取"，而非"超额"）**：升级修复室时，把等级多送的格**冲抵已购格**：
```
升级时：servicingSlotsPurchased = max(0, servicingSlotsPurchased - (新等级 - 旧等级))
```
这样 Lv0 买 4 格 → 升到 Lv4（多送 4 格）→ purchased 归 0，总格仍是 6，玩家等于"花 810 提前拿到了本要等升级才有的满格"，
不亏。早中期的"30 立刻要第 3 格 vs 攒 400 升级连速度带格子"权衡**原样保留**，只是消除了双付。

若你们本意就是"买了就买了、升级另算"，那请在计划里**明示这是刻意的沉没成本**，别让它看起来像 bug。

---

## P1 · pending 占格的死锁风险（待评审点 3 的反面）

计划接受"pending 占格好几天"。但需确认：**'due' 状态的书若玩家一直不点收取，pending 占格会永久卡住**。
- 借阅有 `dueTime`（visitors.js:1422），到点到 'due'；收取走 `collectReturn`。
- 若没有"逾期自动收取"的兜底，一个被遗忘的 pending 会一直占格，直到玩家手动收。
- 这本身可以是设计（懒得收就占着），但**计划应点出"pending 释放的唯一途径是收取/损毁/失窃"**，并在测试里断言"pending 在无收取时持续占格"（确认是 intended 而非漏写）。

---

## P2 · §五.2 与 §五.3 自相矛盾

- §五.2 要求 `getMaintainableBooks()` 输出 **locked 优先**（servicing 锁定书置顶）。
- §五.3 说"批次组建/结算逻辑不动（maintenance.js 核心公式零改动）"。

但当前 `getMaintainableBooks`（maintenance.js:25）**按 `wearCount` 降序、无 servicing 优先**，且它**不排除** servicing
（只排除 `bs.status==='locked'` 这个"转录状态"字段，与 `bs.servicing` 是两码事——servicing 锁定书是 completed，不会被误杀，
所以当前其实能进列表，只是没置顶）。

→ **要让 §五.2 成立，getMaintainableBooks 的排序必须改**（加 `servicing==='locked'` 优先键）。
这跟"核心公式零改动"不冲突（排序是查询层、结算是写入层），但计划文字会让实现者误以为"maintenance.js 完全不动"。
**建议**：把 §五.3 改成"结算/磨损清零公式零改动，查询排序按 §五.2 调整"，消除歧义。

另外：`startMaintenanceSession`（maintenance.js:80）只挡 `bs.status==='locked'`（转录锁），
servicing 锁定书 status='completed' 能正常入批——这点**不用改**，计划可注明，省得实现者多此一举加判断。

---

## P2 · 命名三件套会坑开发

计划里同时出现：
- **修缮间**（servicing room，本计划新机制，锁定待修槽）
- **古籍修复室**（restoration room，capacity.js 的升级设施，给速度/批次上限/本计划的格子）
- **修缮箱**（restorationBox，capacity.js 的卷组收藏箱，disasters 免疫名单里那个）

中文只差一字/两字，玩家和接手开发都会混。本计划的"锁定待修"本质是**预约排队**，和"修复室"无关。
**建议改名**：servicing room 叫「**待修工位 / 预约台**」之类，和"修复室"拉开距离；i18n 也一并改，避免 `restoration`/`servicing` 在英语里也撞。

---

## P2 · collectReturn 必须显式处理"pending 还回命中损毁→取消预约"

计划 §四 流转图写了"还回时损毁 roll 命中 → 预约自动取消"，但 §六 的改动清单只说 collectReturn "结算内原子落锁"，
**没写"命中损毁时清 servicing 而非落 locked"**。
代码现状（visitors.js:1447）还书损毁 roll 会 `bs.damaged=true`；计划需在 collectReturn 里：
- 若该 bid 在"本次要落锁的清单"且损毁命中 → 设 `servicing=undefined`（取消预约）+ 历史告知，不要设 'locked'。
- 若该 bid 是既有 pending（已打标在借）→ 同样清 servicing。
否则会出现"损毁 + 锁定"的脏状态（正是 P0 的同一种冲突，只是触发点在还书而非灾难）。

---

## 跨计划联动（顺带提醒）

servicing 锁给"保养刷氛围"那条边**加了真实机会成本**（锁书断借出收入 + 占格），方向是好的——
它让 maintenance 计划的 +1 氛围农场不再零成本。但**它没解决 maintenance 计划本身的无闸 +1 氛围问题**
（我前一份 review 的 P0）。两条计划是同一系统的上下游，+1 氛围的无闸 source 仍要在 maintenance 那边改掉，
别指望 servicing 锁替你兜。

---

## 测试补点（并入 §七）

1. **灾难免疫**：断言 `pickVictims` / `pickColdBooks` / `pickWindowShelfVictims` 产出的候选**不含** `bs.servicing` 真值书（这是当前 §七 完全没覆盖、却最关键的一条）。
2. **借阅池排除**：`getCompletedBooks` 不含 servicing 锁定/预约书（计划已提，保留）。
3. **pending 还回损毁**：collectReturn 对"勾选落锁且损毁命中"的书 → `servicing` 清空而非 'locked'，且格位释放。
4. **容量双付**：升级修复室后 `servicingSlotsPurchased` 被等级冲抵（按你采纳的 P1 方案断言）。
5. **失窃不误锁**：锁定中在馆书不被 triggerTheft 选中（P0 修复的连带验证）。

---

## 对计划 §八 待评审点的我的判断

| # | 待评审点 | 我的判断 |
|---|---|---|
| 1 | 升级送格 + 封顶 6，Lv4 免费满格 | 接受"免费满格"，但**必须顺手修双付陷阱**（P1）。否则先买后升=bug 观感。 |
| 2 | 行内勾选 vs 弹窗勾选 | **同意行内勾选**。弹窗内勾选确有真实竞态（收取前书已在池，下个 tick 可能借走），行内预锁 + collectReturn 原子落锁是正确取舍。 |
| 3 | pending 占格好几天 | 接受，但**补一句"释放唯一途径=收取/损毁/失窃"**并测死锁（P1）。 |
| 4 | 回架入口只放书架卡片 | **不够顺**。保养完成弹窗里补一个轻量「回架」快捷键（锁书 wear=0 后从保养台消失，跑去书架卡点太绕）。 |
| 5 | 一键收书不加勾选 UI | 接受，pending 自动落锁已覆盖主用途；行内 toggle 留给临场决定。 |

---

## 决策建议（请拍板）

1. **P0 灾难排除**：确认在 disasters.js 四处补 `!bs.servicing`（我强烈建议直接采纳，否则锁定机制有脏状态漏洞）。
2. **P1 双付**：采纳"升级冲抵已购格"还是"刻意沉没成本明示"？
3. **P2 命名**：是否接受把 servicing room 改名为「待修工位/预约台」拉开与修复室距离？
4. **待评审点 4**：保养完成弹窗是否加「回架」快捷键？
