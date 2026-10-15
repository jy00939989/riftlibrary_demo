---
anchors:
  - { type: file, path: "docs/tech-debt/2026-10-15-architecture-audit.md", weight: 0.15 }
  - { type: file, path: "docs/plans/reviews/architecture-remediation-plan-review.md", weight: 0.2 }
  - { type: file, path: "js/state/save.js", weight: 0.1 }
  - { type: file, path: "js/state/migrations.js", weight: 0.1 }
  - { type: file, path: "js/backend/client.js", weight: 0.1 }
  - { type: file, path: "js/storage.js", weight: 0.1 }
  - { type: file, path: "js/timer.js", weight: 0.1 }
  - { type: file, path: "js/core/focus-orchestrator.js", weight: 0.1 }
  - { type: file, path: "js/core/focus-rewards.js", weight: 0.1 }
  - { type: file, path: "js/core/day-boundary.js", weight: 0.1 }
  - { type: file, path: "scripts/check-imports.mjs", weight: 0.1 }
---

# 架构修复总体方案 v4

> 2026-10-15 立项。图南指令：全面架构审计后出措施方案，送架构评审。
> **分工注记**：问题清单与证据见 `docs/tech-debt/2026-10-15-architecture-audit.md`（下称《审计报告》）。
> 评审链：v1 → 子代理评审 MAJOR REVISION（10 条）→ v2 → 子代理复审 CONCERNS（R1/N1/N2）→ v3 → **架构通评审补遗**（安全 S1-S4 / 扩展性 E1-E4 / 低耦合 L1-L5 / 健壮性 R5-R7，全部记录在同一份 `docs/plans/reviews/architecture-remediation-plan-review.md`）→ **本版 v4 全量并入**。
>
> **v1 → v3 修订记录**（略，见 v3 版文档或 git 历史；核心：D2(c) 事故快照独立 key + corruption 闸门、序列化串缓存、截断写 loadRawString 三态防线、corruption.js 零依赖落点、刀4 四符号全注入、M2.3 拆两目标 + 14 文件清单、新增 M2.5、§10 对照表）。
>
> **v3 → v4 修订记录**（对应架构通补遗，均已亲验）：
> - S1 → M5：密钥轮换从「顺手」升级为**强制**，补 `git filter-repo`/BFG 历史清理
> - S2 → M1.2：corruption flag 置位期间**禁止云端上传**（防坏档/作弊面上云覆盖）
> - S3 → M4.8：escapeHtml 统一 + lint 闸门（亲验：session.label 当前无渲染消费方，风险为潜在；暖气图/统计上线前必须落地）
> - S4 → M2.3：后端侧安全 checklist 挂账（RLS/限流/归属校验）
> - E1 → 新增 M2.7：systems.js 系统自举注册表（扩展性杠杆最大的一刀）
> - E2 → 新增 M4.9：content() 叙事接缝（D8 不拍板也先铺）
> - E3 → M2.1 注记：mini-bus 是扩展性赋能器（写进 D3 理由）
> - E4 → §10 登记 defer（特性开关中枢，后置）
> - L1 → M2.1：day-boundary 委托 events.js（一个实现两个 API，消灭双轨）
> - L2 → 新增 M2.6：render-registry + ui-hooks，收编 17 处 window 逃生舱与 showToast 全局总线
> - L3 → M2.2 刀2 扩容：updateBodyBackground DOM 耦合改注入，验收加 grep
> - L4 → M2.3：render 层禁直引 storage mutator 的 lint 闸门
> - L5 → M2.2 验收收紧：SCC 终态 = 业务环 0，白名单默认空、逐条预审
> - R5 → M1.1：saveState 写入读回校验
> - R6 → M1.4：tick 错误按「步骤名+指纹」去重、达阈值弹用户可见提示
> - R7 → M1.1/M1.3：backup 写失败不触发主档 Toast；配额兜底文案引导导出
> - 横切 → M6 增列：3 条 ADR + boot-smoke.mjs 启动冒烟（四种存档形态）

## 0. 总目标与四条原则

**目标**：消除 P0 级数据/启动风险，拆掉循环依赖簇，数值单源化，**顺手把架构底座铺好**（安全面收口 + 扩展性杠杆）——全程不引入构建器、不停运、不阻塞内容管线。

| 原则 | 含义 |
|---|---|
| **外科手术** | 每条措施独立 commit、可单独回滚；禁止顺手重构 |
| **样板回填** | 解法只用项目已有模式：`setActions`/`onStageCross` 注入、`onNewDay` 订阅器、focus-rewards 乘区参数化——不引入任何新框架 |
| **零构建守住** | 不引入打包器；首屏治理用「生成期 bundle + 按需动态 import」解决 |
| **每批全量回归** | 18 个测试脚本 + check:imports + check-cycles + check-data-refs 四件套全绿才算完 |

## 1. 决策点（D1–D8）

> v1 评审后 D1/D2 已定；其余待架构师/图南拍板。

| # | 决策点 | 选项 | 推荐 | 理由 |
|---|---|---|---|---|
| D1 ✅ | STATE_BACKUP 策略 | (a) 写前快照单份滚动 (b) 双份交替 (c) 定时快照 | **(a)** | 与 save-manager「恢复上一个备份」按钮语义精确对齐；无写放大 |
| D2 ✅ | 存档校验失败时 | (a) 自动保默认态继续 (b) 事故快照进 STATE_BACKUP (c) **STATE_CORRUPT 独立 key + corruption flag 全局闸门 + 恢复弹窗四选** | **(c)** | (b) 的缺陷：坏档进 backup 毁上一次成功存档、刷新死循环。(c) 原件隔离 + 写入全闸 + 玩家四选 |
| D3 | 事件机制形态 | (a) 新建 core/events.js mini-bus，onStageCross/setCompleteCallback 改挂它，onNewDay 保留但内部委托 events (b) 全部统一 | **(a)** | 一个实现两个 API，消灭双轨（L1）；**mini-bus 本身是扩展性赋能器**（E3）：新特性订阅事件即可，无需改源模块——这是选 (a) 的核心收益 |
| D4 | saveState 事务化范围 | (a) 微任务合并 (b) tick 全链路 dirty 标记 | **(a)** | (b) 动 40+ 文件，收益/成本比低 |
| D5 | 书籍加载治理 | (a) 生成期 bundle (b) SW (c) 运行时动态 import | **(a) 先行，(b) 后续可选** | 机制已存在；SW 单独评估 |
| D6 | 密钥迁移方式 | (a) Netlify env + 构建期生成 (b) 运行时注入 | **(a)** | 与现有 config.local.js 覆盖机制同构 |
| D7 | 循环检测入口 | (a) 独立 (b) 并入 check:imports | **(b)** | 一条命令跑完 |
| D8 ✅ | 叙事内容 i18n 立场 | (a) 「馆藏即中文资产」+ 说明 (b) 认真做 EN | **(a) 图南 2026-10-15 拍板** | 已落地：语言菜单 EN 态显示 narrativeLanguageNote（terms.js + index.html + app.js syncLocaleUI），叙事接缝 M4.9 照铺不误，未来启动 EN 内容批次不需回改 |

## 2. 批 1 · 存档保命（M1，最高优先，D1/D2 已定）

> 量级：约 2.5 天。

### M1.1 STATE_BACKUP 写入者 + 读回校验（审计 P0-1；D1；复审 R5/R7）
- `js/persistence.js` 增加 `saveRawString(key, str)`。
- `js/state/save.js`：模块级 `let lastSerialized = null`。`saveState()` 开头：若 `lastSerialized` 存在 → 异步 `saveRawString(STATE_BACKUP, lastSerialized)`（**backup 写失败只 console.warn，绝不触发 M1.3 的主档失败 Toast**，复审 R7）；本次 `save()` 成功后 `lastSerialized = JSON.stringify(toSave)`。
- **写入读回校验**（复审 R5）：`save()` 返回 ok 后轻量 `load(STATE)` 回读，比对 `_schemaVersion` 与 `savedAt` 一致；不一致按写失败走 M1.3 可见化。
- 序列化串缓存而非对象引用（消灭浅拷贝共享引用，评审 P1-1）。
- 验收：test-state-backup.mjs——① backup 等于上一份（字节级）；② 首次存档不报错；③ 恢复后字段完整；④ 存档后改深层字段再存档，backup 不受污染；⑤ mock 半截写入 → 读回校验捕获 → Toast 路径。

### M1.2 形状校验 + 事故快照 + corruption 闸门 + 上传闸门（审计 P0-1/P0-2；D2-c；复审 R1/N1；补遗 S2）
- 新增 `js/state/corruption.js`（零依赖）：flag + set/clear/is。**不放 migrations.js**（migrations.js:4 import saveState，会造 save↔migrations 环，复审 N1）。
- 新增 `js/state/validate.js`：`validateStateShape(saved)` 裸对象最小检查；`_schemaVersion` 宽容（number/undefined，undefined 归 0）；与 validatePayload 共享 helper 不强行合并。
- `js/persistence.js` 增加 `loadRawString(key)`：返回 `{ status: 'missing'|'ok'|'corrupt', raw }`（复审 R1：现有 load() 对坏 JSON 返 null，「截断写」与「无存档」不可分）。
- `js/state/migrations.js` `initState()` 重排：
  1. `loadRawString(STATE)`：`missing` → 全新玩家正常路径；`corrupt` → **原始字符串原样写 STATE_CORRUPT** + 置 flag + 弹恢复窗（跳过形状校验）；`ok` → 继续 2；
  2. `validateStateShape` 通过 → 正常迁移、清 STATE_CORRUPT；失败 → JSON 写 STATE_CORRUPT + 置 flag + 弹恢复窗；
  3. 置 flag 期间不 Object.assign、不触发任何 saveState；
  4. 迁移循环 per-migration try/catch：单条抛错 → 记版本、中止、走失败路径。
- **corruption 闸门**：`saveState()` 入口第一行查 `isCorrupted()`，全部 150 处调用一处 gate（评审 P0-1）。
- **上传闸门**（补遗 S2）：flag 置位期间 `saveState` 不调 `debouncedUploadSave`——坏档/被篡改面上云覆盖云端的口子在这里堵死。正常路径不变。
- `js/render/shared/crash-recovery.js` 加第四按钮「📦 从备份恢复」（无 backup 时禁用注明）。四选：恢复备份 / 先导出 / 重置 / 刷新。
- 验收：坏档**四**形态（缺 library / books 为数组 / _schemaVersion 为字符串 / 截断 JSON）+ **第五形态：flag 置位期间断言 debouncedUploadSave 零调用**；合法旧档不误伤。

### M1.3 saveState 失败可见化（审计 P1；复审 R7）
- `ok === false`（且非 flag 拒绝、非 backup 失败）→ 一次性 Toast「**存档写入失败，请立即导出备份**」（session 去重）。
- 验收：mock QuotaExceededError → Toast 恰好一次；backup 写失败不触发此 Toast。

### M1.4 60s tick 逐步隔离 + 显式上浮（审计 P0-4；复审 P1-3/R6）
- 每步独立 try/catch；模块级计数器按「步骤名 + 错误指纹（message 哈希）」去重计数（复审 R6）；同指纹连续 3 次 → 弹一次用户可见「部分功能异常，请导出备份」（session 级只弹一次），并保留 console.warn。
- 验收：注入单步抛错 → 其余照常、连续 3 轮弹窗、偶发单轮不弹。

### M1.5 三处静默 catch 补日志（审计 P1-4）
- achievements.js:270-272、timer.js:115,149,173、focus-orchestrator.js:198-201 补 console.warn，不改行为。

### M1.6 boot-smoke 启动冒烟（补遗横切 2）
- 新增 `scripts/boot-smoke.mjs`：对**四种存档**（正常 / 坏形状 / 坏 JSON / 半迁移）跑 initState，断言「坏档不静默新档、不覆写原件、事故快照就位、恢复触发、上传闸门生效」。
- 这是 M1 的锁：比单测覆盖更全（补遗原话），入四件套。

## 3. 批 2 · 断环解劫 + 底座铺设（M2，依赖 D3/D4）

> 量级：约 6 天。每刀独立 commit。

### M2.1 core/events.js mini-bus（D3；补遗 L1/E3）
- 新建 `js/core/events.js`（on/off/emit，Set+退订，抄 day-boundary.js:26）。
- `storage.js:61-62` `_onStageCross` 与 `timer.js:16-17` `setCompleteCallback` 改内部走 events；同名导出保留（多订阅化，向后兼容）。
- **day-boundary 委托**（补遗 L1）：day-boundary.js 内部 Set 实现改为委托 `events.on('new_day')`，`onNewDay` API 原样保留——一个实现、两个 API，消灭双轨。
- 落地前 grep 全量确认注册点唯一（防依赖覆盖语义暗桩）。
- 验收：test-events.mjs 双订阅互不覆盖；day-boundary 现有测试零改动全绿。

### M2.2 五刀解环（审计 P1-A；补遗 L3/L5）

| 刀 | 边 | 改法 |
|---|---|---|
| 1 | `state/migrations.js:13` → capacity.js | `addToManuscriptBox` 推箱核心下沉 `js/state/manuscript.js`；capacity 改那里 import |
| 2 | `storage.js:3` ↔ `audio.js:6` 双向 + **storage.js DOM 耦合**（补遗 L3） | ① 删 `import refreshBGM`，改 `setAudioHooks({ refreshBGM })`（app.js 注入）；② `updateBodyBackground()`（storage.js:84-89 直写 document.body）改 `setUiHooks({ updateBodyBackground })` 注入 |
| 3 | `plants.js:15` → migrations.js | `EMPTY_PLANT` 移 `js/state/state.js` |
| 4 | `timer.js:10` → render/index.js | 四符号全部 `setTimerHooks({...})` 注入；`isMomoAccelerating` 下沉 focus-session（**写入方契约**：focus-session 导出 setter，timer 每 tick 写入，timer-display 读 getter）。验收硬标准：`grep -n "render" js/timer.js` 零 import |
| 5 | visitors.js → cafe.js → plants.js 真三环 | 种子账本下沉 `core/economy.js`；plants.js 退化为纯数据+纯函数 |

- **循环检测固化**：Tarjan 脚本落 `scripts/check-cycles.mjs` 并入 check:imports（D7）。
- **SCC 终态收紧**（补遗 L5）：**业务环 = 0**；白名单默认空——落地时若残留环，逐条登记成因与处置结论进方案，不许临时加白。
- 刀2 验收补：`grep -n "document\.body" js/storage.js` 零命中（补遗 L3）。
- 每刀：环数变化 + 18 脚本全绿 + 手动冒烟。

### M2.3 backend 去 TLA + 解耦 + 安全挂账（评审 P0-5；补遗 L4/S4）
- **(a) de-TLA**：`client.js:43` 顶层 await 改 `export async function ensureBackend()`，initAuth() 内调用。验收：DevTools 阻断 esm.sh 后游戏可进主界面、本地玩法全通。
- **(b) 解耦**：14 文件清单（achievements、app、core/focus-actions、focus-orchestrator、focus-session、redeem、shop-actions、shop/book-shop、dlc-packs、library-upgrades、visitor-actions、state/save、storage、visitors）逐一清零静态 import。契约（复审 N2）：注入 `debouncedUploadSave` 非裸函数；save.js 空值守卫（initState:625 可能早于注入）。验收：14 文件 grep 零命中（门面除外）。
- **(c) 双 lint 闸门**（补遗 L4）：check:imports 扩展两条静态规则——① `render/` 禁止直引 storage.js mutator（只许经 core actions）；② `js/timer.js` 禁引 render（刀4 固化）。
- **(d) 后端侧安全 checklist 挂账**（补遗 S4，本次不动代码）：RLS 行级权限复查 + 同步接口限流/归属校验，记入后端计划。

### M2.4 milestone 发奖权收回 core（审计 P0-3 上半）
- milestone-card.js:19-22 发奖移 orchestrator claimedMilestones 同事务；card 只弹窗；遮罩关闭分支补 saveState。library.js:595 / purchase-modal.js:69 的 checkAchievements 改触发 core 动作。
- 验收：重复触发只发一次（test 断言）。

### M2.5 core 文件 render import 收敛（审计 P0-3 下半；评审 P0-4）
- focus-orchestrator.js:17-32、quest-trigger.js:103、redeem.js:117-118、visitor-actions.js:8-11、shop-actions.js:12-14 收敛进既有动作适配层。
- 验收：core→render import 清零（适配层清单化）；check-cycles 无 core↔render 白名单。

### M2.6 render-registry + ui-hooks（补遗 L2）
- 新增 `js/render/registry.js`：启动期注入 render 函数引用（照抄 hooks 模式），逐步替换 17 处 `window.renderXxxPage`；`window.showToast` 收进 `ui-hooks` 注入（bag.js/bookshelf.js/library.js/music-room.js/account-ui.js 的跨模块 window 调用一并改）。
- 处置分两类：跨入口桥接（app.js:69 switchTab、app.js:233 showToast——save-manager 第二入口依赖）保留+注释固化；调试探针（audio/ambient localhost 门控）保留；其余清零。
- 验收：`grep -rn "window\.render\|window\.showToast" js` 仅剩豁免清单内条目。

### M2.7 systems.js 系统自举注册表（补遗 E1，扩展性杠杆最大的一刀）
- 新增 `js/core/systems.js`：特性模块自注册 `{ name, init?, onNewDay?, onFocusComplete? }`，app.js 启动统一遍历调用——init 290 行隐式顺序改为声明式清单。
- **范围纪律**：本次只做「注册表机制 + 迁 3 个低风险系统试点」（如 offsite/plants/dailytasks），不一次性迁全部 30 步；剩余迁移随触碰顺手迁。
- 依赖 M2.1（事件订阅即注册的另一半）。
- 验收：试点三系统行为与迁移前一致（18 脚本全绿）；新增系统不再手改 app.js init 顺序（注册一行即可）由 ADR 固化。

## 4. 批 3 · 数值与数据单源（M3）

> 量级：约 3 天。只搬家不改数值（faucet 零影响）。

### M3.1 金币公式收编（审计 P1-C）
- orchestrator.js:54 删手抄公式，调 `calculateCoinsEarned` + `eventCoinsMult` 参数；focus-session.js:13 清死 import。
- 验收：同输入两路径同输出 + eventCoinsMult 断言；18 脚本金币断言零变化。

### M3.2 灾难数值下沉 data/（审计 P1-C）
- disasters.js:18-76 八灾配置移 `data/disasters.js`；exhibition.js:19-23、visitors.js FAVOR_CAP/SPAWN_WEIGHT 同批。
- 验收：test-disasters 53 断言零改动全绿；`grep "0\.[0-9]" core/disasters.js` 零命中。

### M3.3 终局访客数单源（审计 P1-C；评审 P1-2）
- tiergoals.js:148 改 `>= VISITOR_DEFS_TOTAL`，从 visitors.js 现位置派生；M4.5 迁 data/visitors.js 时 import 源同步改（登记为 M4.5 验收项）。
- 验收：注册第 11 位假访客后 t5g2 可达。

### M3.4 书籍元数据去冗余（审计 P1-E）
- book_pool.js / volume_groups.js 删公共元数据重复字段，只存 bookId + 专属字段；运行时从 BOOKS 派生（`getPoolEntryMeta`）；purchase-modal.js:38 改读派生值；生成脚本同步。
- 验收：check-data-refs + purchase-modal 显示与 BOOKS 真值一致；三页冒烟。

### M3.5 构建期引用校验（审计 P2-3）
- 新增 `scripts/check-data-refs.mjs`（pastoral condition.bookId/chapterIdx、volumeIds、池内 bookId），并入 check:imports。
- 验收：注入不存在 bookId → 非零退出。

## 5. 批 4 · 体验与性能（M4，穿插进行）

| 措施 | 内容 | 量级 |
|---|---|---|
| M4.1 modal 基类 | `render/shared/modal.js`，首迁 animations.js 与 bookshelf.js | 1 天 |
| M4.2 keydown 泄漏 | common.js:181-186 escClose 改 close() 内统一摘除 | 0.1 天 |
| M4.3 输入焦点 | 含输入态区块重建前记 activeElement.id、重建后恢复 | 0.5 天 |
| M4.4 getNow 收敛 | 13 处复制收敛 `core/clock.js` | 0.3 天 |
| M4.5 visitors.js 瘦身一阶段 | VISITOR_DEFS 等约 700 行迁 `data/visitors.js`（含 M3.3 import 源同步） | 0.5 天 |
| M4.6 i18n 补洞 | animations/visitors-render/plane 三文件优先 + lint 禁未走 t() 的 CJK | 1 天 |
| M4.7 首屏治理（D5） | 书籍 bundle 生成；html2canvas 动态 import；JS cache-busting | 1 天 |
| M4.8 XSS 收口（补遗 S3） | `render/shared/common.js` 增 `escapeHtml()`；session.label 渲染路径（暖气图/统计上线前）统一过转义；lint 禁未转义用户输入进 innerHTML。**亲验备注**：label 当前无渲染消费方，此条为潜在风险保险，随下一个消费方落地时必须已完成 | 0.5 天 |
| M4.9 叙事接缝（补遗 E2） | visitor-events/pastoral 信件包 `content(key, fallbackZh)` 薄包装——D8 不拍板也先铺接缝，未来填 EN 数据不回改调用点 | 0.5 天 |

## 6. P0-5 密钥迁移（M5，独立紧急，强制项）

- `git rm --cached js/backend/config.local.js`；Netlify env + 构建期生成（D6）；本地保留真实文件。
- **轮换升级为强制**（补遗 S1）：`--cached` 只停跟踪，历史提交里明文仍可读——anon key 轮换一次 + `git filter-repo`/BFG 把该文件从全部历史剔除（双推仓库都要做，强推需图南确认时机）。
- Netlify 侧加 key 轮换提醒（低危但流程闭环）。
- 验收：git ls-files 零命中 + 历史搜索零命中；部署后端功能正常。

## 7. 里程碑与验收总表

| M | 内容 | 依赖 | 验收 |
|---|---|---|---|
| M1 | 存档保命（M1.1-1.6） | 无 | test-state-backup + boot-smoke 四形态；18 脚本全绿 |
| M5 | 密钥迁移（强制轮换+历史清理） | 图南确认强推时机 | ls-files 零命中 + 历史零命中 + 部署正常 |
| M2 | 断环+底座（M2.1-2.7） | D3/D4 | check-cycles 业务环=0 白名单空；14 文件+document.body+timer-render 三 grep 清零；18 脚本全绿；断网启动实测 |
| M3 | 数值数据单源（M3.1-3.5） | 无 | check-data-refs 上线；金币/灾难断言零漂移 |
| M4 | 体验性能（M4.1-4.9） | D5/D8（部分） | modal 两样板；首屏请求实测下降；M3.3 import 源同步 |
| M6 | 全量回归 + anchors + **3 条 ADR** + drift 0 | 全部 | 四件套全绿；ADR：① STATE_BACKUP 语义（D1）② 事件基底选型（D3）③ 零构建守门（原则） |

**顺序：M5（半小时+图南确认）→ M1（2.5 天）→ M2（6 天）→ M3（3 天）→ M4 穿插。**

## 8. 风险与缓解

1. **解环回归**——每刀独立 commit + 四件套 + 冒烟三关。
2. **mini-bus 语义差异**——落地前 grep 注册点唯一（M2.1 已含）。
3. **backup 写放大**——单份滚动 + 微任务；存档体积大时观察一次。
4. **bundle 双轨漂移**——同一脚本生成 + check-data-refs 校验。
5. **corruption 闸门误伤**——flag 仅校验/迁移失败置位；合法旧档反向用例（M1.2 验收⑤）。
6. **tick 误弹**——指纹去重 + 阈值 3 + 偶发单轮不弹反向用例。
7. **M2.7 注册表过度设计**——范围纪律：机制 + 3 试点，不迁全部 30 步；剩余顺手迁。
8. **历史清理（M5）强推风险**——双推仓库 + 协作方（如有 fork）需图南确认时机；filter-repo 前先全量备份。

## 9. 不做清单（边界守护）

1. **不引入打包器/bundler**。
2. **不拆大数据文件**。
3. **不上全 MVVM**——改存档调用统一收进已有 actions 注入模式。
4. **不动在途立项**。
5. **叙事 i18n 不扩 terms.js**——D8 拍板后单独立项（接缝 M4.9 先铺）。
6. **本轮不动同步/后端逻辑**——S4（RLS/限流）挂后端 checklist，账号相关安全不在本方案扩面。

## 10. 审计/评审发现对照表（每条有措施或显式 defer）

| 编号 | 发现 | 处置 |
|---|---|---|
| 审计 P0-1/P0-2 | STATE_BACKUP 无写入者 / 无形状校验 | **M1.1 / M1.2** |
| 审计 P0-3 | Supabase TLA | **M2.3(a)** |
| 审计 P0-4 | core↔render 双向 + timer 三位一体 | **M2.2 刀4 + M2.4 + M2.5** |
| 审计 P0-5 | tick 无隔离 | **M1.4** |
| 审计横切 P0 | config.local.js 凭据入库 | **M5** |
| 审计 P1-A~G | 循环簇/事件机制/数值双轨/事务/元数据冗余/i18n/首屏 | **M2.2 / M2.1 / M3.1-3.3 / D4(a) / M3.4 / D8+M4.6 / M4.7** |
| 子代理评 P0-1~P0-5 + P1-1~P1-5 | 方案内部矛盾 10 条 | **v2/v3 全修**（闸门/独立 key/刀4补全/M2.5/两目标拆分/序列化串/M3.3解依赖/显式兜底/宽容校验/§10 本表） |
| 子代理复审 R1/N1/N2 | 截断写静默新档 / flag 落点造环 / 注入符号 | **v3 全修**（loadRawString 三态 / corruption.js / debouncedUploadSave+空守卫） |
| 补遗 S1 | 密钥轮换强制+历史清理 | **M5 升级** |
| 补遗 S2 | 坏档/作弊面上云覆盖 | **M1.2 上传闸门** |
| 补遗 S3 | XSS（label 未转义） | **M4.8**（亲验：当前无渲染消费方，潜在风险保险） |
| 补遗 S4 | RLS/限流/归属校验 | **defer 挂后端 checklist**（本轮不动后端逻辑，理由见不做清单 6） |
| 补遗 E1 | app.js init 扩展瓶颈 | **M2.7 systems.js**（机制+3 试点，范围纪律防过度设计） |
| 补遗 E2 | 叙事接缝 | **M4.9 content()** |
| 补遗 E3 | mini-bus 扩展赋能 | **D3 理由 + M2.1** |
| 补遗 E4 | 特性开关中枢 | **defer 登记**（多实验并行出现时再做，当前收益不明确） |
| 补遗 L1 | events 双轨 | **M2.1 day-boundary 委托** |
| 补遗 L2 | window 逃生舱系统性处置 | **M2.6 render-registry + ui-hooks** |
| 补遗 L3 | storage.js DOM 耦合 | **M2.2 刀2 扩容 + grep 验收** |
| 补遗 L4 | 解耦纪律 CI 闸门 | **M2.3(c) 双 lint** |
| 补遗 L5 | SCC 终态不明确 | **M2.2 验收收紧：业务环=0、白名单默认空** |
| 补遗 R5 | 写入读回校验 | **M1.1** |
| 补遗 R6 | tick 错误上浮细节 | **M1.4 指纹去重** |
| 补遗 R7 | 配额兜底 / backup 失败不触发主 Toast | **M1.3 + M1.1** |
| 审计 P2 其余（account-ui 拆分/analytics 队列/audio track 三轨/空会话字面量/毁损逻辑合并/app.js init 分阶段/t() 性能等） | —— | **defer 登记**（独立小批次，与 P0 无接口耦合，理由同 v3 §10） |

## 11. faucet/台账影响

M3 全部「搬家不改数值」：金币公式同输入同输出（test 锁定），灾难概率原值下沉，sink-ledger 无需记账。M1/M2/M4/M5 无 faucet 触点。M2.7 注册表纯机制无数值。
