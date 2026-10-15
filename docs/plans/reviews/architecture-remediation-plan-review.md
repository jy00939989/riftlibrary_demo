# 架构修复总体方案 v1 · 评审补遗

> 评审人：架构通（Software Architect）
> 评审对象：`docs/plans/architecture-remediation-plan.md`（《方案》）+ `docs/tech-debt/2026-10-15-architecture-audit.md`（《审计》）
> 评审日期：2026-10-15
> **定位**：同目录已有评审 `architecture-remediation-plan-review.md`（下称「前评」）已深挖方案内部自相矛盾（批 1 备份设计打架、D2 死循环、刀 4 砍空、P0-3 只接一半）与多数健壮性缺口（P0-1/P0-2/P1-1/P1-3/P1-4 等）。本文**不重复**前评，只补其**未覆盖的两个轴——系统安全与扩展性**，并对低耦合 / 健壮性补几处前评未触及的点。

---

## 〇、与前评的分工

| 轴 | 前评已覆盖 | 本文补 |
|---|---|---|
| 健壮 | 写闸门、事故快照覆写 backup、浅拷贝、tick 失明显、形状校验误伤 | 不可解析存档静默新档、写入读回、tick 阈值上浮、配额兜底 |
| 低耦合 | orchestrator render import、window 逃生舱（点名未成措施） | 事件双轨 substrate、storage DOM 耦合、render→storage lint 闸门、SCC 终态=0、render-registry 成形 |
| 系统安全 | （几乎空白） | **全文主轴**：密钥历史清理、作弊/云覆盖、XSS、RLS |
| 扩展性 | （空白） | **全文主轴**：系统自举注册表、叙事接缝、mini-bus 赋能、特性开关 |

---

## 一、系统安全（Security）——前评完全空白，本文主轴之一

### S1 · P0-5 密钥：`git rm --cached` 不抹历史，轮换是**强制**不是可选
《方案》M5 写「轮换一次 anon key（低危但顺手）」。《审计》已确认 `config.local.js` 被 commit `0385aec` 强提进公开仓库（GitHub/Gitee 双推）。`--cached` 只停跟踪，**历史提交里明文依旧可读**。
- 建议：把「轮换」从「顺手」升级为**强制项**；并补历史清理一步——`git filter-repo` / BFG 把该文件从全部历史剔除（即便低危，流程要闭环）。Netlify 侧加 key 轮换提醒。

### S2 · 存档篡改 / 作弊面（方案未覆盖）
localStorage 明文，玩家手改 `state.coins` / `state.books` 即作弊；更要命的是 **`save.js:5` 每次 `saveState` 都 `debouncedUploadSave(toSave)` 上云**（sync.js:20）——本地改了直接覆盖云端。
- 建议（低成本）：上传前加闸门——**safe-mode / crash-recovery 期间禁止上传**（见 R1/R4）；并明确云端只接受服务端可校验的增量或至少对上传 payload 标注版本/完整性。即便本次不动同步逻辑，也记入后端侧安全 checklist。

### S3 · XSS / 注入（方案未覆盖，但历史已踩过）
`focus-session-label-plan` 自己就被审出过 session label 未转义经 `innerHTML` 渲染（你之前的评审记录）。`storage.js:182` 的 `session.label` 只 `.slice(0,40)`、**无转义**，渲染处大概率直接 innerHTML 拼接。
- 建议：补一条——统一 `escapeHtml` 落 `common.js`（项目已有 textContent 定点更新样板），所有 innerHTML 路径过一次转义；加 lint 禁「未转义用户输入进 innerHTML」。列入 M4 或单列安全小项。

### S4 · 同步端点授权（一笔带过）
sync.js 涉及账号与存档上传。建议方案挂一句后端侧确认项：**RLS 行级权限 + 同步接口限流 / 归属校验**，防止公开 anon key 被拿来做枚举或脏写。即便本次不动代码，记一笔。

---

## 二、扩展性（Extensibility）——前评空白，本文主轴之二

### E1 ·【重要】系统自举注册表缺失，app.js init 是扩展瓶颈
《审计》P2 指出 `app.js init` 290 行 30 步**隐式顺序**。《方案》M4 完全没碰 app.js 启动。随着章节系统 / 位面 / 新玩法持续立项，**每加一个系统就要手改 init 顺序**——扩展成本线性上升、且极易踩顺序雷。
- 建议：新增轻量 `js/core/systems.js` 注册表，各特性模块自注册 `{ init, onNewDay, onFocusComplete, onDayBoundary }`，app.js 启动统一遍历。扩展性杠杆最大的一刀，且天然配合 M2.1 的 mini-bus（事件订阅即注册）。可列 **M2.5 / 后续 ADR**。

### E2 · 叙事内容接缝（D8 的低成本前置）
即便 EN 叙事不立项，`visitor-events.js` 269 条 / `pastoral_tasks` 信件里的硬编码中文也应先包一层 `content(key, fallbackZh)` 薄包装，把「接缝」铺好——未来填 EN 数据即可，不必回改调用点。成本极低、扩展性收益明确。建议与 D8 同决策，但**接缝现在就铺**。

### E3 · mini-bus 本身即扩展赋能器（肯定）
M2.1 一旦事件一等公民化，新特性订阅源模块即可、无需改源。方案已对，建议在 D3 决策里点明这是**扩展性收益**而不仅是解耦。

### E4 · 配置 / 特性开关中枢（后置一笔）
多实验并行下，集中 feature-flag / config 模块能降低「if 实验」散落。可后置，但记一笔。

---

## 三、低耦合补点（Low coupling）——前评点到但未成措施

### L1 · events.js 与 onNewDay 双轨隐患（D3 选 (a) 的代价）
新 `core/events.js` mini-bus 与 `day-boundary.js` 自带的 `Set` 实现是**两套事件原语**长期并行。
- 建议：`day-boundary.js` 内部改为**委托** `events.js`（薄封装，保留 `onNewDay` 友好 API）。一个实现、两个 API，避免未来语义漂移。风险极低（day-boundary 稳定），一致性收益大。

### L2 · 17 处 `window` 全局逃生舱应落成「render-registry」措施
前评 P0-4 点名「17 处 window 逃生舱无任何处置」，但《方案》未承接。实测：`archive.js:66`、`bookshelf.js:906`、`library.js:45` 等 `window.renderXxxPage = ...`；外加 `window.showToast` 被 `bag.js/bookshelf.js/library.js/music-room.js/account-ui.js` 当**全局总线**跨模块调用。这些是比 import 环更隐蔽的耦合：无类型、逃避 import 图、全局可变命名空间。
- 建议：新增 **render-registry**——启动期注入 render 函数引用（照抄 hooks 模式），逐步替换 `window.renderXxxPage`；`showToast` 也收进 `ui-hooks` 注入，消除跨模块 window 依赖。可单列 **M2.6**，并把它与前评 P0-4 的「orchestrator render import 收敛」合并为「core↔render 解耦收口」专项。

### L3 · `storage.js` 的 DOM 耦合未被验收覆盖
`storage.js:84-89` `updateBodyBackground()` 直接 `document.body.style.backgroundImage = ...`——core 层耦合 DOM。M2.3 验收只查 `backend` 零命中，没查 DOM。
- 建议：背景切换抽成 hook（`setUiHooks({ updateBodyBackground })`）或下沉 render 层；验收补 `grep -n "document\.body" js/storage.js` 零命中。

### L4 · 解耦纪律固化成 CI 闸门（防回潮）
M2.4 把 milestone 发奖收回 core，但「render 层直接调 `addCoins/addAtmosphere/addHistory`」这类越权会在未来回潮。
- 建议：加静态检查（并入 `check:imports` 或独立 lint）：`render/` 下**禁止直接 import storage 的 mutator**，只许经 core actions。把「解耦纪律」写成机器闸门。

### L5 · SCC 目标值要明确
M2.2 验收写「环数递减」。**建议明确终态：业务环 = 0，仅 barrel 转发 / 白名单环允许**——否则递减到 1 也算过，等于没解干净。白名单条目必须在方案里预审列出，不许落地临时加（前评 P0-4 已强调）。

---

## 四、健壮性补点（Robustness）——补前评未触的几处

### R1 ·【严重且独立于前评 P0-2】不可解析存档被静默当新档
前评 P0-2 处理的是「可解析但形状非法」的档（M1.2 事故快照覆写 backup）。但还有另一条输入路径：《方案》M1.2 写「`load(STATE)` 得到任意可解析 JSON 后」——而 `persistence.load`（persistence.js:38-46）对坏 JSON **吞异常返回 `null`**、`initState:619` 的 `if (saved)` 为 false → 走 `else` 直接 `_schemaVersion = MIGRATIONS.length` 当成**全新游戏**。
**后果**：存档若被写成坏 JSON（截断 / 编码损坏），游戏不弹恢复、不覆盖原件，而是悄无声息开新号。这比 P0-2 的「坏档还能凑活」更恶劣，且《方案》的措辞暴露它只考虑了「可解析」分支。
- 建议：M1.2 必须把「不可解析」当成与「坏形状」同级的事故。`persistence` 暴露 `getRaw(key)` 或让 `load` 返回 `{ok, value, raw}`；`initState` 在 `load` 前先探 raw 是否存在且非空，若 raw 存在但解析失败 → 事故快照（独立 key，见前评 P0-2 修正）+ `showCrashRecovery`，**绝不默默新档**。验收补「注入坏 JSON（非坏形状）→ 不静默新档、recovery 弹出」。

### R5 · 写入读回校验
localStorage 写同步原子，但极端情况下（配额临界、序列化异常）可能写出半截。建议 `saveState` 成功后做一次轻量 read-back（`load` 回来比对 `_schemaVersion`/savedAt），捕获异常即走失败可见化。开销极小、可靠性收益明确。

### R6 · tick 隔离的错误上浮（延展前评 P1-3）
前评 P1-3 已正确指出：M1.4 把错误 catch 掉后，生产 `console` 被置空（app.js:4-7），tick 对玩家与开发者都失明。前评给的方向①是「同错连续计数达阈值主动 showCrashRecovery」。
- 补充落地细节：建议计数挂在 `tickVisitors` 模块级，按「步骤名 + 错误指纹」去重；达阈值（如 3）弹一次用户可见「功能异常，请导出备份」提示，而非永远静默。把全局兜底**显式化**，而不是假装 `window.onerror` 还在。

### R7 · 配额写满的兜底
M1.3 只 toast。建议文案引导「导出备份」，并对未来可能出现的**无限增长数组**加一条 guard（当前 sessions/history/plantLogs 都已封顶，但新系统易忘）。另：backup 自身写满不应触发主档失败 Toast（前评 P2-1 已提，此处并入提醒）。

---

## 五、横切：决策记录与验收增强

1. **ADR 化**：D1–D8 目前是决策表。建议把最关键的 3 条——`STATE_BACKUP` 语义、事件基底选型、零构建守门——落成 ADR（含 Consequences），符合「记决策不记设计」。
2. **启动冒烟测试（比单测更值）**：新增 `scripts/boot-smoke.mjs`（jsdom 或纯逻辑），对 **4 种存档**（正常 / 坏形状 / 坏 JSON / 半迁移）跑 `initState`，断言「坏档不静默新档、不覆写原件、backup 有快照、recovery 触发」。直接锁 M1，且比前评建议的「tick 后原件不变」断言覆盖更全。

---

## 六、给方案的补丁清单（仅列本文新增，去重前评）

| 级别 | 补丁 | 并入位置 |
|---|---|---|
| P0 | R1 区分「不可解析」与「坏形状」，都走事故快照 + recovery，**不静默新档** | M1.2 |
| P1 | S1 密钥轮换强制 + 历史清理 | M5 |
| P1 | S2 云端上传对坏档 / 作弊闸门（safe-mode 期间禁传） | M1.2 / M2.3 |
| P1 | S3 XSS escape 统一 + lint | M4 / 安全小项 |
| P1 | L2 window 全局系统清除，列 **M2.6 render-registry** | M2 |
| P1 | L3 `storage.js` 的 `document.body` 耦合 + L4 render→storage mutator lint 闸门 | M2.3 / check:imports |
| P1 | E1 app.js 系统注册表（systems.js） | 新增 M2.5 |
| P2 | E2 叙事 `content()` 接缝；E4 特性开关中枢；R5 读回校验；R6 tick 阈值上浮；R7 配额兜底；L1 events 委托；L5 SCC 终态=0；boot-smoke 测试；3 条 ADR | 各自并入 |

**一句话结论**：前评已把方案的「内部自相矛盾」扒得很透（可直接排期）；本文补的是它没看的两个方向——**安全面几乎全空（密钥历史、作弊云覆盖、XSS）** 与 **扩展性毫无杠杆（app.js 自举注册表、叙事接缝）**，外加几个漏网的健壮性 / 低耦合钉子。这两块补上，方案才从「修旧账」升级为「顺手把架构底座也铺好」。

---

## v2 复审

> 复审对象：`docs/plans/architecture-remediation-plan.md` v2（修订记录见文档头部，对应本文件首节的 10 条发现）
> 复审方式：只验证 v1 评审 10 条发现是否真正解决（验证修订后的设计本身，不认文字应付），并重点复查四个时序/耦合问题：① M1.1 序列化串缓存 × M1.2 corruption 闸门的介入时序；② M1.2 STATE_CORRUPT 的清理时机；③ M2.3(b) save.js 注入后「backend 不可用静默跳过」语义是否保留；④ §10 defer 条目与 P0 修复的耦合。
> 代码抽查：save.js 全文、migrations.js:1-48/610-635、persistence.js 全文、backend/sync.js 全文、visitors.js:383/1240-1274、core/disasters.js 数值区。
> 去重声明：本文独立复现的「不可解析存档被静默当新档」与上文第二部分 R1 是同一发现（证据互补，本文补 persistence.js:38-46 的实测行号），不再重复立条。

### Verdict：CONCERNS

v1 的 10 条发现全部得到**实质**回应，四个重点复查项中三个干净通过。最高优先批次剩一个已被双方评审逮住的必改洞（上文 R1：截断写绕过 M1.2 全程），外加两个本文新见的写清级钉子（N1/N2）。全部修复量半页纸；R1 必须在 M1 开工前并入方案，否则按方案做完「一次事故不再丢档」的核心承诺仍不兑现，届时升级为 MAJOR REVISION。

### v1 十条发现的处置状态

| 发现 | 状态 | 复审结论 |
|---|---|---|
| P0-1 无写闸门 | **resolved** | flag 置位期间 saveState 入口一律返回 false，tick 60s 等全部 150 处调用方一处 gate 全覆盖；M1.3 Toast 显式排除 corruption 拒绝不会误报；验收②「静置 2 分钟 STATE 未被默认态覆盖」直接命中 v1 要求的 tick 断言。 |
| P0-2 事故快照毁 backup + 无恢复入口 | **resolved，但保护面有缺口（=上文 R1）** | STATE_CORRUPT 独立 key 永不碰 backup；crash-recovery 第四按钮「从备份恢复」三选齐全；D2 补 (c) 并定为推荐，v1 的两条修复方向都被采纳。缺口：整个机制只对「可解析但形状坏」生效，「不可解析」（截断写，最高发形态）走 load() 的 catch 返回 null → initState 静默当新档，原件被首个 tick 覆盖（详见上文 R1，本复审独立复核属实）。 |
| P0-3 刀 4 砍空 | **resolved，残留半行** | 四符号全部注入 + 硬验收 `grep -n "render" js/timer.js` 零 import。残留：isMomoAccelerating 下沉 focus-session 后**写入方仍未点名**（v1 问过「写入方是谁」，v2 只答了 getter 归宿）——落地补一句「timer start/stop 调 focus-session setter」即可，不阻塞。 |
| P0-4 core↔render 处置②丢弃 | **resolved** | 新增 M2.5：五文件适配层收敛（附行号）+ 17 处 window 逃生舱逐条处置表 + check-cycles 不设白名单写入验收。审计 P0-3 三条修复全部有承接。 |
| P0-5 M2.3 验收口径 + 漏 save.js | **resolved** | 拆为 de-TLA / 解耦两个独立目标分开验收（断网实测 vs 14 文件 grep 清零）；14 文件清单与评审实测一致（抽查 save.js:5 `import debouncedUploadSave from '../backend/sync.js'` ✓），save.js 在列。 |
| P1-1 浅拷贝污染快照 | **resolved，重点复查①通过** | 改序列化串缓存从根上消灭共享引用；验收④「存档后改深层字段再存档，backup 不受污染」正是 v1 要的嵌套变异断言。时序复查：闸门是 saveState 第一行，拒绝期间不写 STATE、不写 backup、不更新 lastSerialized；lastSerialized 只在本次 save() 成功后更新，且 backup 写的是上一份**成功**串——失败档永远进不了 backup，闸门与缓存无相互污染路径。 |
| P1-2 M3.3 依赖错位 | **resolved** | 改从 visitors.js 现位置派生 VISITOR_DEFS_TOTAL，不等 M4.5；M4.5 验收项登记 import 源同步改，笔误随正文修订消除。 |
| P1-3 隔离后生产失明 | **resolved** | 显式计数器替代不成立的 window.onerror 依赖；阈值 3 次、按步骤区分、含「偶发单轮不弹窗」反向用例。 |
| P1-4 校验误伤两面 | **resolved** | _schemaVersion number/undefined 均接受、undefined 归 0，合法旧档不误伤；validatePayload（包裹格式）与 validateStateShape（裸 state）共享 helper 但不强行合并，适配层语义正确。 |
| P1-5 无对照表 | **resolved，重点复查④通过** | §10 逐条编号有措施或显式 defer。逐条核对 defer 与 P0 的耦合：毁损逻辑两份拷贝 defer 不与 M3.2 冲突（实测归还损毁数字自含于 visitors.js:383/1262，与 disasters.js 八灾配置是两套独立数字集，M3.2 下沉不依赖去重）；addDiaryEntry/t() 性能/account-ui/analytics 队列/localStorage 持久化/app.js init 分阶段均与 M1/M2 无接口耦合，defer 不造成返工。 |

### v2 新发现（去重后）

**N1（P2，方案写一句即可）· corruptionFlag 存放位置未指定，naive 落法必然造 save↔migrations 环。**
实测 migrations.js:4 `import { saveState } from './save.js'`（initState:625 固化调用在用）。flag 按 M1.2 语境直觉放 migrations.js、save.js 入口去查它 → save.js↔migrations.js 双节点环，正好撞 M2.2「check-cycles 不设白名单、SCC 须解体」的验收。修复：flag 落 `state/state.js` 或新建零依赖 `state/corruption-flag.js`，方案补一句存放位置与「save.js 单向 import」。

**N2（P2，一行注记）· setSyncHooks 注入语义两点要写清，否则「静默跳过」现有行为有变质风险。**
① 注入对象应是 `debouncedUploadSave` 而非裸 `uploadSave`：debounce 与「backend 未就绪静默早退」（sync.js:21 `if (!isBackendReady() || !getCurrentUser()) return`）都住在 debouncedUploadSave 内，注入它即完整保留「backend 不可用时上传静默跳过」语义；注入裸 uploadSave 会丢 debounce、且 save.js 需自行复制就绪判断。② save.js 对「注入完成前」的调用需空值守卫——initState:625 的 saveState 可能早于 app.js 启动注入执行，空值守卫的效果等同现状的未就绪早退，但方案应点名这一句（照抄 onStageCross 的空槽静默模式即可）。

### 复审一句话

十条 v1 发现全部实质解决、四个重点复查项三个干净通过，方案已可排期——但「截断写坏档静默当新档」（上文 R1，双方评审一致命中）必须在 M1 开工前并入，再随手写清 flag 落点（N1）与注入符号（N2），半页纸的事。
