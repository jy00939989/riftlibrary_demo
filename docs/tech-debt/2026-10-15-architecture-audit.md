# 全项目架构审计报告

> 2026-10-15 图南指令「全面扫描项目架构和代码，找需要解耦、优化的地方」。
> 方法：五路并行深扫（状态层 / core 业务 / render 层 / 入口横切 / data 层）+ 量化摸底（模块图、循环依赖、扇入、测试覆盖）+ 所有 P0 与关键 P1 claim 逐条人工复核。
> 范围：213 个 ES module，794 条依赖边，js/ 约 1.9 万行 + data/ 约 2.3 万行。

---

## 0. 总评

骨架好于同类项目平均水平：阈值单源（atmosphere.js）、纯函数 core 模式已验证（focus-rewards、day-boundary）、迁移链有逐条幂等论证、运行时数据 guard 普遍到位、纯逻辑层有测试纪律。
真正的窟窿集中在四个词：**恢复链断裂、启动链被劫、双向依赖、副作用失控**。以下按严重度分级，每条附 file:line 证据。

---

## P0 —— 正在咬人或一咬就是大事

### P0-1 崩溃恢复链断裂 + 存档三处无防护（状态层，最严重）

- **`STATE_BACKUP` 全项目无写入者**：`js/persistence.js:8` 定义、`js/save-manager.js:182,261` 读取并渲染「恢复上一个备份」按钮、`js/render/shared/crash-recovery.js:42` 恢复后删除——但 `save(STATE_BACKUP)` 一次都不存在。**备份按钮永远渲染不出来，崩溃恢复是安慰剂**。
- **损坏存档无形状校验**：`js/state/migrations.js:619-622` `Object.assign(state, saved)` 把任意可解析 JSON 直接合并进活状态（对比 save-manager.js:48-53 导入路径有 validatePayload，启动路径没有）。迁移中途抛错 → state 已被污染 → `app.js` 忽略 initState 返回值 → 第一次 saveState 把脏数据固化回 localStorage。
- **写失败全程静默**：`persistence.js:49-57` save() 捕获异常返回 false；全仓 150 处 `saveState()` 调用零处检查返回值。配额写满后玩家操作看似成功、刷新全丢，无任何提示。
- 三条叠加：**一次 localStorage 事故 = 永久丢档，而 UI 承诺的保护不存在**。
- 修复：save 成功后写 STATE_BACKUP（滚动一份即可）；initState 开头做最小形状校验（复用 validatePayload），失败保纯净默认态 + 弹 crash-recovery；saveState 失败打一次性用户可见警告。

### P0-2 Supabase 顶层 await 劫持启动链（横切层）

- `js/backend/client.js:43` 模块作用域 `await init()` → 动态 import esm.sh（importmap：`index.html:13-19`）。依赖链：`js/storage.js:4`（扇入 39）→ `backend/analytics.js` → `client.js`。
- esm.sh 慢/被墙时**整个游戏卡在加载屏后**——纯 localStorage 就能玩的核心玩法被可选后端拖住启动。与 client.js 自己声明的「静默降级纯本地」意图相悖：降级发生得太晚。
- 修复：去 TLA，改 `export async function ensureBackend()` 惰性初始化，仅 initAuth() 调用；`storage.js` 的 track 改依赖注入/事件回调，让游戏核心模块脱离 backend 导入链。

### P0-3 core↔render 双向依赖，「core」名不副实（core + render 两路独立发现）

- `js/core/focus-orchestrator.js:17-32` 一个 core 文件 import 10+ 个 render 模块；`core/quest-trigger.js:103`、`core/redeem.js:117-118`、`core/visitor-actions.js:8-11`、`core/shop-actions.js:12-14` 同样。反向：`render/navigation.js:5` import core/quest-trigger。
- **render 层自己发奖励**：`render/shared/milestone-card.js:19-22` 在弹窗展示时 addCoins(100)/addAtmosphere(3)/addHistory/addDiaryEntry（硬编码数值、与 orchestrator 的 claimedMilestones 记账分离——展示层被重复调用即重复发奖）；`render/plants.js:869-870` 在 render 模块内直接 `state.plantLossAlert=null; saveState()`。
- `js/timer.js:10` 自称「只负责计时」却 import 整个 `render/index.js` barrel（7 处直接调 renderFocusPage）+ shop/visitors/curation/capacity 五个业务模块 + 内联会话结算数学 + start 即 saveState。**计时+存档+渲染三位一体**，7 模块循环簇的枢纽。
- 循环已经逼出 window 逃生舱当创可贴：`window.__renderArchivePage`（archive.js:66，plane.js 调用）、`window.renderBookshelfPage`（bookshelf.js:906）、`window.renderFocusPage`（focus/page.js:147）等 17 处。
- 修复：① timer.js 照抄自己已有的 `setCompleteCallback` 注入模式，加 `setTimerHooks({ onRender })` 由 app.js 注入；② orchestrator 等的 render import 收敛到 core/focus-actions 这类「动作适配层」（已存在，extend 它）；③ milestone 发奖移回 orchestrator 与记账同事务，render 只弹窗。

### P0-4 60s 主 tick 无错误隔离（core 层）

- `js/app.js:326-357` tickVisitors 整体无 try/catch：访客浏览 → 位面访客 → 到期还书 → 台风/书籍灾难任何一步抛错，本轮剩余步骤全跳过、**末尾 saveState() 不执行** → 各子函数已各自落盘的中间态固化；setInterval 继续，同一错误每分钟重复炸同一位置。
- 对照：day-boundary.js:43-49 订阅者逐个 try/catch 隔离——同一项目两套纪律。
- 修复：tick 内每步 try/catch + console.warn（照抄 app.js:113 现成写法），一天工作量。

### P0-5 config.local.js 凭据入库的流程谎言（横切层）

- `js/backend/config.js:2-3` 注释声称 config.local.js「已加入 .gitignore 不会提交」、`.gitignore:28` 确有该条——但 `git ls-files` 显示该文件被跟踪（commit 0385aec 强提），项目双推 Gitee/GitHub 含公开仓库。
- anon key 本身低危（RLS 保护），**真正的问题是流程**：下一次有人往里放 service_role key 会毫无阻拦进公开仓库。
- 修复：真实 key 移出仓库（Netlify 环境变量或构建期注入）；从跟踪移除并轮换 anon key。

---

## P1 —— 高优先结构性债务

### P1-A 22 模块循环簇：棱边清晰，五刀可解（量化实测 + 两路报告交叉验证）

SCC 实测 22 节点：state.js ↔ migrations ↔ capacity ↔ storage ↔ audio ↔ shop ↔ visitors ↔ diary ↔ …
五条关键回边（两路报告独立收敛到同一批）：

| # | 边 | 最小解法 |
|---|---|---|
| 1 | `state/migrations.js:13` → capacity.js（addToManuscriptBox）；capacity 又 import state/storage | 推箱核心下沉 js/state/，capacity 改为从那里 import |
| 2 | `storage.js:3` → audio.js（refreshBGM）；`audio.js:6` → storage.js（spendCoins）双向 | 照 storage.js:61 已有注入模式 `setAudioHooks({ refreshBGM })`，app.js 启动注入 |
| 3 | `plants.js:15` → state/migrations.js（只为 EMPTY_PLANT 常量） | 常量移到 state/state.js |
| 4 | `timer.js:10` → render/index.js | P0-3 的钩子注入 |
| 5 | `visitors.js:18` → cafe.js → plants.js → visitors.js 真三环（spendSeed 账本） | 种子账本下沉 core/economy.js |

做完 1+2+3，state 核心从 SCC 脱落；做完 4+5 剩业务弱环。**check:imports 只查漏导入不查循环**——建议把循环检测并入该脚本（本审计用的 Tarjan 脚本可复用）。

### P1-B 事件机制：好样板已有，推广即可解四个问题

- `onNewDay`（day-boundary.js:26）是正确的 Set+退订多订阅实现；`onStageCross`（storage.js:62）是覆盖式单槽——第二个订阅者会静默踩掉第一个。
- 「visitors 达成某事 → diary 记一笔 + achievement 检查 + toast」同一组合拳已在 **8 处复制**（visitor-actions、focus-orchestrator×2、shop-actions×2、focus-actions、library.js:595、purchase-modal.js:69）。
- 修复：抽 `js/core/mini-bus.js`（就用 onNewDay 的形状），onStageCross / timer 完成回调改多订阅；成就检测挂订阅，源模块只 emit。同时解 P1-5（addDiaryEntry 名不副实：日记+存档+升级检测+动态 import 弹 UI 四合一，被 10+ 模块在 tick 链里调用）。

### P1-C 数值双轨制，金币公式已出现幽灵真源（core 层亲验）

- `calculateCoinsEarned`（focus-rewards.js:62）**是死代码**：focus-session.js:13 import 了但全文件零调用；活路径是 orchestrator.js:54 手抄的同构公式（且多乘 `getEventFocusCoinsMult()`，共享函数没有这个参数）。谁改共享函数，改的是空气。
- 灾难系统全套概率/冷却/损失比硬编码在 `core/disasters.js:18-76`（RAT/MOLD/FIRE/WORM/INK/DUST/THEFT/TYPHOON 八灾）；exhibition.js:19-23、visitors.js 多处同病。
- `tiergoals.js:148` 终局目标「全部 10 位访客」与 VISITOR_DEFS（visitors.js:30）数值双份——**第 11 位访客上线时 t5g2 永不可达**（静默死锁）。
- 修复：金币公式收编（orchestrator 调 calculateCoinsEarned，eventCoinsMult 作参数传入）；灾难数值下沉 data/disasters.js；t5g2 改 `>= Object.keys(VISITOR_DEFS).length`。

### P1-D 存档写入无事务概念

- 150 处 saveState 散布 42 文件；每个 addCoins/addHistory/addDiaryEntry 各自同步全量序列化（`state/save.js:9-24`）。一次 collectReturn 触发 5-8 次全量写；一次里程碑弹窗 5 连存（milestone-card.js:19-43）。
- 修复：tick 事务化（子函数标 dirty，tick 尾一次 flush）；或 saveState 合并到微任务单写。与 P0-1 的备份写入一起做。

### P1-E 数据一致性：书籍元数据三处冗余

- `data/books/book_003.js`（meta 真源）与 `data/book_pool.js:5-15`（title/author/category/totalWords/description/emoji 逐字段重复 49 条）与 `data/volume_groups.js:11-22`（又一份）三处平行维护。
- 实锤消费方读旧值：`render/shop/purchase-modal.js:38` 显示 `poolEntry.totalWords` 而非 BOOKS 真值。
- 修复：SHARED_POOL / VOLUME_GROUPS 只存 bookId 引用 + 池子专属字段（plane/weight/volumePrice），公共元数据运行时从 BOOKS 派生；生成脚本同步改。

### P1-F 叙事内容 i18n 决策缺口（内容决策，非技术债）

- UI 壳 1383 键 zh/en 全覆盖，但叙事资产全硬编码中文且渲染处不过 t()：visitor-events.js 269 条叙事零 en 字段（visitors.js:982 原样渲染）、pastoral_tasks.js 信件、VISITOR_DEFS 的 title/aura、atmosphere.js 阶段描述。另有 render 层 213 处硬编码中文字符串（animations.js 32 处整文件没 import terms.js、visitors.js 41 处、plane.js 27 处）。
- 修复：先决策立场——「馆藏即中文资产」若是有意设计，语言切换处加说明收口；若认真做 EN，给叙事层单独建 content-i18n 约定（不能复用 terms.js 平铺键模式装 3000+ 行叙事）。render 层三文件优先补洞。

### P1-G 首屏 208 模块请求 + 零离线能力

- 原生 ESM 无打包：入口可达 208 个模块请求，其中 71 本书（1.2MB 正文）全量静态加载（data/books.js 自动生成 71 条 import）——誊抄页打开前并不需要正文。无 Service Worker，localStorage 存档 +「静默陪伴」定位与零离线能力冲突。
- 修复（不引打包器）：(a) 扩展 `scripts/generate-book-imports.mjs` 发布时合成单文件 bundle；(b) 加 SW 做静态缓存。**200+ 本书之前必须完成其一**，否则首屏请求破 300。
- 另有两个小短板：`html2canvas` CDN 全用户无条件加载（改动态 import）；JS 无 cache-busting（css 有 `?v=` 而 js/app.js 裸引用，旧缓存会版本错乱）。

---

## P2 —— 渐进偿还债（精选）

- **modal 壳复制**：`fixed inset-0` 弹窗外壳在 12+ 文件复制粘贴；ESC/背景关闭生命周期各写一遍。抽 modal 基类 + empty-state 组件 + card 包装器，优先级依次。
- **事件监听泄漏**（实锤）：`render/common.js:181-186` showImagePreview 的 keydown 监听只在按 Escape 时摘除，点 ✕/背景关闭后每开一次大图漏一个。
- **输入焦点风险**：render 全部 innerHTML 全量重建，而输入框（自定义分钟数、session label、命名弹窗）就在容器里——重建即丢焦点。对含输入态区块推广 focus/page.js:125 已有的局部更新模式。
- **getNow/__dev 测试钩 13 处复制** → 收敛 core/clock.js 一处。
- **app.js init 290 行 30 步隐式顺序**；`hideLoadingScreen()` 调两次（第二次把第一次架空）；tier 结算逻辑属业务却塞入口（昨日改动已部分涉及）。
- **空会话字面量三份拷贝**（save.js:10-24、migrations.js:326-340、save-manager.js:90-104，含 intervalId 运行时句柄混进持久态）。
- **account-ui.js 681 行**：showAccountPanel 单函数 250 行，innerHTML+事件绑定+API 直调+hCaptcha 全纠缠；硬编码中文绕过 i18n；account-ui ↔ index.js barrel 循环（现在能跑只因导出全是函数声明，改 const 即 TDZ 崩）。
- **analytics.js:16-18** track() 未就绪时直接丢事件，与其注释「先进本地队列」矛盾；队列仅内存，关页即失。
- **common.js 扇入 38 职责混杂**（DOM 工具+数字动画+状态栏+书籍 i18n+图片预览）→ 拆三份零风险。
- **缺失构建期校验**：pastoral 任务 condition.bookId/chapterIdx 无校验器，删书/章节改序后任务静默卡死。加 node 校验脚本挂 check:imports 同款入口。
- **毁损逻辑两份拷贝**：disasters.js:118-132 applyDamage（内部顺手 grantRestorationRoom 解锁房间）与 visitors.js:1258-1272 复制版并存。
- **t() 性能**：每次调用经 getSettings() 做一次对象展开分配（1058 处调用、plants 单页 166 次）；locale 缓存即可。
- **audio.js 残留**：probe 上限 200 条从不清理死 Audio 元素；环境音在 ambient.js 另起炉灶经 window 互探——长期可抽象 track 列表统一管 BGM/环境音/SFX 三轨。

---

## 不做清单（边界守护）

1. **不引入打包器/bundler**。模块数不是问题；做「书籍 bundle 生成 + SW + 动态 import html2canvas + JS cache-busting」四件事即可，保住零构建部署的简单性。
2. **不拆大数据文件**。pastoral_tasks.js 2057 行、visitor-events.js 1102 行组织良好（注释 banner、按访客分块），是该大的数据文件。
3. **不上全 MVVM**。把「改存档/改业务」的调用统一收进已有的 actions 注入模式即可，render 只读 state + DOM。
4. **叙事 i18n 不扩 terms.js 平铺键**——那是内容决策，需先定立场。

---

## 修复路线图（按收益/成本比排序）

| 批次 | 内容 | 量级 |
|---|---|---|
| **批 1：存档保命** | STATE_BACKUP 写入者 + initState 形状校验 + saveState 失败提示 + tick 逐步 try/catch + 三处静默 catch 补日志 | 1-2 天，全是外科手术 |
| **批 2：断环与解劫** | 五刀解环 + mini-bus 推广（onStageCross 多订阅化）+ TLA 改惰性 + milestone 发奖移回 core | 3-5 天 |
| **批 3：数值与数据** | 金币公式收编 + 灾难数值下沉 data/ + t5g2 访客数单源 + 书籍元数据去冗余 + 构建期引用校验 | 2-3 天 |
| **批 4：体验与随做** | modal 基类 + keydown 泄漏 + 输入焦点局部更新 + getNow 收敛 + i18n 三文件补洞 + 208 请求治理（bundle/SW） | 穿插进行 |
| 随章节系统重做 | milestone 事务化、visitors.js 700 行数据迁 data/、addDiaryEntry 拆 persist/notify | 已立项批次顺带 |

---

## 正面样本（推广即还债）

- `js/core/day-boundary.js` —— 订阅器+抛错隔离+冻结语义注释，全项目事件机制的范本
- `js/core/focus-rewards.js` —— 纯函数参数化乘区，「乘区快照」解环方案的原型
- `js/render/common.js:18-35` —— textContent 定点更新（对比全量 innerHTML）
- `js/audio.js:243-251` —— 9-16 幽灵 BGM 事故后的 onerror 守卫
- `data/atmosphere.js` —— 阈值单源，全项目无 400/900/2800/5600 硬编码（仅 visitors.js:867 的 28000 是字数默认值，不同语义）

**结论一句话**：这个项目不缺正确做法的样板，缺的是把样板回填到旧模块——批 1、批 2 做完，架构风险等级降一档；批 3 做完，数值漂移类 bug 绝迹。
