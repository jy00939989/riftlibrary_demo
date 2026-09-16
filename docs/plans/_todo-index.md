---
layout: breakdown
anchors:
  - { type: file, path: "docs/plans/_todo-index.md", weight: 0.1 }
  - { type: file, path: "docs/updates/2026-09-week2-deploy-prep.md", weight: 0.1 }
---

# 归墟图书馆 · 待办总览

> 本文件由项目规划器自动同步使用。每条 `- [ ]` 会作为独立待办条目导入 planner。

---

## 🟢 已 ready 可立即做

### atmosphere-source-narrowing-plan（氛围来源收窄）
- [x] `js/core/book-progress.js`：誊抄氛围改为首通全额、重抄 ×0.5
- [x] `data/visitor-events.js`：稀层事件氛围 30/40 改为 10/15，金币保持 60/80
- [x] `js/visitors.js`：借阅区 Lv7 `returnAtmo` 由 8 降到 5
- [x] `data/plants.js`：魔法玫瑰收获氛围 25→10，星光蕨 45→15，鹤望兰 2 不动
- [x] 验证新存档连续誊抄、稀层事件、Lv7 还书、植物收获数值正确（`scripts/verify-atmosphere-narrowing.js` 16 项全过）
- [x] 后续把 `BORROW_LEVEL_TABLE` 三处重复定义合并为单一真源（`data/borrow-levels.js`）

### borrow-level-damage-reduction（借阅等级减损）
- [x] 在 `js/visitors.js` 还书损毁判定中读取 `state.library.borrowLevel`
- [x] 按等级减免：基础概率 - `(borrowLevel - 1) * 0.004`，下限 0.5%
- [x] “爱惜书籍”标志牌效果在等级减免后再叠加
- [x] 在读者沙龙页面/借阅区升级弹窗提示当前损毁概率
- [ ] 考虑在成就或访客叙事中引用该机制

### public-domain-linear-copy-plan（公版书线性誊抄）
- [ ] 在书籍 meta 中新增 `copyMode: 'linear'` / `'chapter'` 与 `isPublicDomain` 标记
- [ ] 把 1–2 本公版书（建议《菜根谭》《道德经》）改写成 `segments` 数组
- [ ] 在 `js/core/book-utils.js` 新增 `getCurrentSegment(book, bookState)` 按字数定位段落
- [ ] 专注页按 `copyMode` 分支：线性模式显示当前段 + 上下预览 + 全书进度百分比
- [ ] 完成一本书后重置段落到 0，支持重抄循环
- [ ] 旧存档 `copiedWords` 按 `% totalWords` 重新定位，确保兼容
- [ ] 决定段落切分规则：固定 100 字还是按自然句/条目切分

### xiachan-text-rewrite-plan（夏蝉文案重写）
- [ ] 重写夏蝉初次登场/缮写室对话，统一“安静、神秘、知书达理”语气
- [ ] 重写夏蝉的常层/偶层/稀层/终局事件文案
- [ ] 补全与至少 1 本书、1 个访客事件的联动文案
- [ ] 调整移动端单句长度到 35 字以内
- [ ] 如存在语音/音效台词，一并修订
- [ ] 通读全部夏蝉文本，消除逻辑断裂与重复

### exhibition-legacy-entry-retire（展览厅旧入口收编，v2 上线后下一个版本执行）
- [ ] 撤掉顶栏旧入口（馆史档案等），导航统一到展览厅大厅；保留深链兼容（旧书签可跳）
- [ ] 撤前一周数据观察：旧入口点击占比，>5% 则延期并强化引导

### copy-eta-minutes（誊抄室显示剩余分钟，2026-09-11 图南提）
- [x] 专注页进度条显示「⏳ 预计还需约 N 分钟」（2026-09-14 落地 df1d11f：纯函数 estimateRemainingMinutes 对齐 tick 实际结算 100字/分×倍率×冲刺1.2，墨墨首会10×；**有意偏离**原注的 sessionEstimate 120/分预览口径——与实际结算差 20%，时间估算须用真实结算公式）
- [ ] N 按当前誊抄速率实时刷新（暂停时停走）——分钟级刷新已随 updateBookProgressDOM 落地，>99 分钟「X 小时 Y 分」格式未做（当前直显大分钟数）
- [ ] 移动端不挤占进度条位置（放副标题行）——当前为 pct 行下方独立右对齐小字，未做移动端专门排布

### game-animations-plan（游戏动画）——【已被 seedance 方案取代，全节关闭】
> 2026-09-04 重建为 [animation-suite-seedance-2.5](animation-suite-seedance-2.5.md)（AI 视频路线替代 Lottie）。9-11 已有 6 键入库挂接：`book_complete_shelving`（誊抄完成）/ `borrow_lv0_1` / `focus_lv0_1` / `focus_lv1_2`（设施升级）/ `visitor_first`（首访）/ `atmo_0_1`（首次跨阈）。
- [x] 确定首批 P0 动画清单：氛围升级、房间解锁、专注完成、书籍完成（→ seedance 清单 32+2 键）
- [x] 确定动画色调与风格（琥珀金、墨黑、暖白，parchment/wood）
- [x] 原型验证（→ 路线变更：Seedance 视频直出，CSS/Lottie 原型不需要了）
- [x] 统一注册表与触发入口（→ `visual/animations/manifest.json` + `playVideoOverlay`，三级降级链）
- [x] 动画播放不阻塞核心交互，支持跳过（点按跳过 + 播完自动关）
- [x] 设置「跳过重复动画」可访问性选项（skipSeenAnimations）
- [x] 资源体积约束（→ 路线变更不再适用：480p 单条约 5MB；旧 <1MB 条作废）

---

## 🟡 需先决策/设计

### settings-page-consolidation（设置项收编正经设置页，2026-09-14 图南提）
> 现状锚点：灾难开关（`settingsDisasters`）与跳过动画开关（`skipSeenAnimations`）渲染在音乐面板 `js/render/music-selector.js`（顶栏 🎼 打开），玩家找不到（图南本人也找不到）；设置真源在 `js/settings.js`（disastersEnabled 默认 true，关闭仅停随机灾难、保留还书磨损）。
- [ ] 决策入口形态：顶栏新增 ⚙️ 独立设置页，还是收进展览厅大厅导航（与 exhibition-legacy-entry-retire 同批做）
- [ ] 把 disastersEnabled / skipSeenAnimations 从音乐面板迁出，音乐面板回归音乐/音效本职
- [ ] 迁移期兼容：老玩家已养成的 🎼 路径留一个版本的重定向提示
- [ ] 顺带决策：音效独立音量等其他设置项是否一并归位

### curator-goals-renewal-optimize（复兴之路重做 · 主线章节系统，2026-09-16 九问锁定）
> 设计决策：`docs/plans/curator-goals-renewal-plan.md`（grill-me 全锁）。详细实施计划：`docs/plans/main-quest-chapter-system-plan.md`（**待架构评审**，7 章 23 节全草案/18 事件埋点清单/v13 迁移/双层奖励/解耦庆祝）。现行锚点：TIER_GOALS（curatorGoalTitle「🏛️ 馆长目标 · 复兴之路」），阶段仪式时弹 tier 完成弹窗（tierPopupsShown 一次性）。
- [x] ~~诊断现状：复兴之路各 tier 完成率/卡点~~ **痛点四连（被动/节奏/奖励/边界）2026-09-16 图南确认，重做非修补**
- [x] ~~决策优化方向~~ **grill-me 九问锁定，见方案文档锁定决策表**
- [x] ~~出详细实施 plan~~ **main-quest-chapter-system-plan.md 已落（2026-09-16），待架构评审**
- [x] ~~架构评审实施计划~~ **两轮评审全关：架构轮 D1-D10→v2、机制数值轮 D11-D17→v3**（ch5 仪式软锁根治/落地日区间/无效小节去重/计数单一真源）；评审焦点清零，待动工
- [ ] 评估与展览厅成就柜的咬合（章完成=铭牌+回忆页陈列，已在决策 5 锁定，实施时对接成就柜数据结构）
- [ ] M1-M6 实施（数据层→迁移→埋点→文案→渲染庆祝→全量回归）

### skill-tree-system（升级技能点系统，2026-09-11 图南想法待展开）
- [ ] 开 brainstorm 定方向：技能点从哪来（升级/成就/收集）、花到哪（速率/经济/访客三线？）、与现有成就 buff 体系的关系（叠加还是收编）
- [ ] 决策技能树形态：线性三系 vs 树状前置；重置成本（免费/金币/灵感）
- [ ] 评估与 200% 速率封顶、展览厅 sink 批次的数值咬合（技能点若是新 sink，台账归口）
- [ ] 出立项 plan 过 grill-me

### bookshelf-visual-optimization-plan（大书库视觉优化）
- [ ] 决策视觉主方向：实景书架（层板书脊）vs 封面墙+场景背景
- [ ] 决策背景切换维度：按书架数量还是氛围阶段（倾向书架数量，对齐借阅区/修复室惯例）
- [ ] 决策受损书视觉是否区分灾种（啃痕/霉斑/焦痕）还是统一受损标
- [ ] 决策封面网格视图是否保留为切换项
- [ ] 书库场景背景 6 档 AI 出图（风格锚定 parchment/wood/琥珀金）
- [ ] 受损 overlay 小图 3 张（透明底：鼠啃痕/霉斑/焦痕）
- [ ] 书架层板/书立 CSS 视觉 + 书库网格包裹进书架单元
- [ ] 新书架空位虚线轮廓 + 等待新书插画
- [ ] 受损书视觉联动 disasters.js damaged 状态（修复完成消失）
- [ ] 移动端响应式验收（不溢出不堆叠）

### visitor-book-review-notes（访客书评便签）
- [ ] 决策触发方式：借某本书归还时必掉/概率掉专属便签（与现有 40% 通用便签掉率如何并存）
- [ ] 决策内容形态：访客口吻的书评短句（带访客性格差异，如夏蝉引文、谷雨务实）+ 是否含小额数值奖励
- [ ] 决策收集呈现：便签挂进墨墨日记/馆史档案，还是独立「读者来信」收藏页
- [ ] 决策首批覆盖书目数量（建议从热门书 10-15 本起步，每本 2-3 条）
- [ ] 数据层：`data/book_reviews.js` 定义 bookId × charId 的专属便签池
- [ ] 触发逻辑：还书判定处（visitors.js 判定 2/3 附近）按 bookId+charId 查专属池优先掉落
- [ ] i18n：便签文案 zh/en 词条
- [ ] 与收藏系统的联动评估（能否算一类收藏品）

### plane1-overhaul（第一位面整体建设重启 · 大待办）
- [ ] 盘点第一位面现状：位面商店/传送门/馆藏分布/视觉资产，输出现状清单
- [ ] 决策「重启建设」范围：是纯视觉重建，还是玩法+叙事+视觉全包
- [ ] 决策与现有位面系统（plane portals/多平面藏书）的关系：第一位面特殊化还是模板化
- [ ] 出第一位面建设方案文档（风格锚点/分区规划/分阶段交付），过架构师审阅后入 planner
- [ ] 素材生产排期（AI 出图/视频的清单与优先级）

### ambient-jazz-lakeside（新环境音两首）
- [ ] 生成「爵士酒吧环境音」循环音频（嘈杂人声/杯盏/萨克斯背景，≥5 分钟可循环）
- [ ] 生成「清晨湖边森林小屋环境音」循环音频（鸟鸣/湖水/木柴噼啪，≥5 分钟可循环）
- [ ] 注册 `data/music.js` 环境音轨道 + 绑定 i18n 曲名（中英）
- [ ] 留声阁环境音陈列架验证上架/播放/购买流程
- [ ] 试听验收：循环无爆音、音量与现有环境音档位一致

### atmosphere-economy-rework（氛围经济改造 · v4 EXP 模型定版，见 atmosphere-system-redesign-plan）
- [x] 决策：氛围=EXP 经验值、智慧之光=金币（图南 2026-09-08 定调，v3 消耗品架构全作废）
- [x] 决策：阶段纯阈值自动升级，无封顶无溢出；火灾罚金币；兑灵感删除
- [x] 决策：设施=金币购买的经验资产（一次性 +EXP 等级×20，D19）
- [x] 决策：returnAtmo 改 1-7 递增产能（D18，「来源收窄」压制语义转型，图南批）
- [x] 决策：阶段对设施设等级门槛，gate 含新手 1:2（D22）
- [x] 决策：升阶设设施门槛「梯度爬坡」表 + 手动升阶仪式（D24，推翻「纯阈值自动升阶」：2阶 缮写室≥1+借阅区≥1／3阶 +修复室已解锁／4阶 +修复室≥2+留声阁已解锁／5阶 缮写室≥5+借阅区≥5+修复室≥3；阶段落库 state.library.stage；位面门改需3阶）
- [x] 三轮评审 D17-D23 全落地：三套 stage 阈值合并单源（P0-A 必改）、阈值形状重定 [400/900/2800/5600]、灵感按实测校正、金币消费口分层、霉菌概率上升接受
- [x] Phase 0 测算脚本四轮迭代定版（scripts/simulate-atmosphere-economy.mjs：硬核166/核心202/休闲247 天首通）
- [x] Phase 1：三套阈值合并单源 getStageLevel() + 换 v4.3 表 + addAtmosphere 去封顶 + 顶栏进度条（2026-09-09 落地；实际收编 6 处阈值：economy/collection/tiergoals/audio BGM 档/achievements L01-L07/storage 背景，删死模块 js/atmosphere.js）
- [x] Phase 2：设施等级门槛校验 + 升级给 EXP（等级×20）+ returnAtmo 表改递增（2026-09-09 落地，D18/D19/D22 一并完成）
- [x] Phase 2.5：升阶设施门槛 + 手动升阶仪式（2026-09-09 当日追加，D24：需求表/条件核对/阶段落库迁移/概况页仪式按钮+卡阶需求清单/全调用点 resolveStageLevel 化；verify 30 项全过。遗留：仿真未建模仪式等待，首通天数将略拉长，待真实数据回测校准）
- [x] Phase 3：wearCount + 乘性磨损 + 重抄清零 + 典藏回报 + 书况 UI（2026-09-10 借还链落地 e3daffa，verify 40 项）
- [x] Phase 4 第一批：温室花盆扩容 + 咖啡角 + 借阅深化（2026-09-11 三连落地：migrateV7-V9、data/cafe.js、core/cafe.js、core/offsite.js、多本借阅/寄读/吐槽；176 测试全绿）
- [ ] Phase 4 剩余：展览厅立项（灵感持续 sink 责任归口）+ 金币高频消耗品
- [ ] 上线埋点：氛围日获取量分布，首月真实数据回测阈值表

### achievement-system-overhaul（成就系统整体优化升级）
- [ ] 成就图标体系：为每个成就配专属图标（emoji/AI 小图），制定图标规范（风格/尺寸/稀有度区分）
- [ ] 说明文案升级：解锁条件显性化（未解锁时显示进度 x/y 而非藏条件），分稀有度措辞
- [ ] buff 体系扩展：在现有 speedFlat/streakMultiplier 基础上新增 buff 类型（金币/氛围/损毁减免/访客相关），成就能看「装备了什么效果」
- [ ] 分类分组展示：按藏书/访客/专注/收集/灾难等分区陈列，进度总览（如 45/80）
- [ ] 解锁反馈升级：从当前 toast 升级为弹窗/动画（与动画注册表联动）
- [ ] 与收藏系统/称号体系联动评估（成就点能否兑换称号/装饰）
- [ ] i18n 全量（现状成就文案中英覆盖度盘点补齐）
- [ ] 数值审计：现有成就 buff 强度与新系统（灾难/氛围改造）的兼容性检查

### backend-supabase-implementation-plan（后端接入）
- [ ] 创建 Supabase 项目并把 `SUPABASE_URL` / `SUPABASE_ANON_KEY` 注入前端配置
- [ ] 新建 `js/backend/client.js`、`auth.js`、`sync.js`、`analytics.js`、`api-proxy.js`
- [ ] 在 Supabase 建 `profiles`、`saves`、`events` 表并启用 RLS，补全 `events` 的 INSERT 策略
- [ ] 登录后走 `saveState()` 单一出口触发 `uploadSave()`，保留本地优先与手动云端恢复
- [ ] 实现事件本地队列 `pending_events`，关键埋点调用 `track()` 并支持断网补报
- [ ] 新建 Edge Function `kimi-proxy` 转发 Moonshot API，前端替换本地 Flask 代理调用
- [ ] 补全 OAuth 回调处理、`profiles` 自动建行、离线 fallback 与错误状态暴露

### god-module-split-plan（神模块拆分）
- [x] Phase 1：拆出 `js/state/state.js` / `migrations.js` / `save.js`，`js/state.js` 变 shim
- [x] Phase 2：按购买类型拆分 `js/shop.js` 到 `js/core/shop/*.js`，原文件变转发壳
- [x] Phase 3：把专注生命周期从 `app.js` 迁到 `js/core/focus-session.js`、`focus-rewards.js`、`focus-orchestrator.js`
- [x] Phase 4：拆分 `js/render/focus.js` / `js/render/shop.js` 到子目录，确保 render 不再直接改 state
- [x] Phase 5：`app.js` 只保留启动顺序与全局事件，其余弹窗/卡片迁出
- [x] 同步改造 `actions`：由 app 注入或静态导入，建立“render → actions → core → state → save”数据流

### god-module-split-full-implementation-plan（神模块拆分完整实施）
- [x] Phase 1：落地 `js/state/state.js`、`migrations.js`、`save.js`，`js/state.js` 仅 re-export
- [x] Phase 2：创建 `js/core/shop/book-shop.js`、`library-upgrades.js`、`plane-portals.js`、`signboards.js`
- [x] Phase 3：创建 `js/core/focus-session.js`、`focus-rewards.js`、`focus-orchestrator.js`
- [x] Phase 4：拆分 `js/render/focus/*.js` 与 `js/render/shop/*.js`，通用弹窗抽到 `js/render/shared/`
- [x] Phase 5：`app.js` 瘦身到 <400 行，剩余弹窗/卡片迁到 render shared
- [x] 重构 `actions` 为统一入口，render 通过 actions 调用 core，不直接修改 state

### economy-balance-review（经济平衡）
- [x] 为氛围 500 硬封顶后增加消费口 → **v4 整个问题消失**：500 封顶随 EXP 模型移除，溢出概念不存在
- [ ] 重平衡植物经济：提高 `harvestCoins` 到 80–150 或降低施肥成本，明确植物是氛围/收集投资
- [ ] 在种子兑换中优先落地 `coins` / `atmosphere` 奖励项
- [ ] 书价分层：前 30 本 400–600，后 38 本 700–1000
- [ ] 给后期增加可重复金币来源，如高等级访客赠礼事件或 Lv7 归还币提升
- [ ] 新增 1–2 个灵感来源，或把首次重抄成本从 2 降到 1
- [x] 典藏版被访客借阅时提供额外还书收益——v4 决策落地：还书 智慧之光 ×2、氛围 ×3
- [x] 评审并落地 `docs/plans/visitor-borrow-duration-and-reward-adjustment.md`：借阅时长 ±30% 随机 + 按时长追加智慧之光（floor(h/6)×3，整单一次）已随 9-10 借还链落地

### atmosphere-venue-map-design（场馆地图）——【已吸收，勿单独实施】
> 2026-09-08 整体并入 [atmosphere-system-redesign-plan](atmosphere-system-redesign-plan.md)（决策 10 吸收合并），下列条目由该文档 Phase 5 承接：
- [x] 改造 `addAtmosphere`：藏书厅 `atmosphere` 仍封顶 500，溢出自动转入 `venueAtmosphere` → 归重设计 Phase 1
- [x] state 新增 `venueAtmosphere` 与 `rooms`（茶室、温室、庭院、档案室），migration 兜底旧存档 → 归 Phase 5/6
- [x] 实现场馆地图 UI 与 4 房间解锁/维持功能，`settleVenueMaintenance()` 每日结算 → 归 Phase 5
- [x] 茶室接入访客羁绊事件，复用 `visitorMemory` 收集层 → 归 Phase 5
- [x] 庭院接入现实日历活动日框架，确定首批作家/纪念日清单 → 归 Phase 5
- [x] 实现自由氛围兑灵感入口（建议 50:1）→ 归 Phase 5
- [x] 调整顶栏/图书馆 UI，区分藏书厅进度条与自由氛围池 → 归 Phase 1

### book-damage-events-plan（书籍损毁事件）
- [x] 选定首批 2–3 个 MVP 损毁来源（推荐鼠患、潮湿霉斑）——2026-09-07 落地鼠患+霉斑+火灾
- [x] 在 `data/signboards.js` 新增对应预防类标志牌（猫馆长、除湿炭包等）——三牌入库：猫馆长/除湿炭包/防火标识
- [x] 在 tick/每日首次登录/还书时触发事件，计算概率后应用有界损失——tickVisitors 60s 入口，冷却制
- [x] 保证典藏版、修复中书籍免疫，单次损失不超过 30%
- [x] 每条损毁事件写入墨墨日志，配叙事文案——弹窗+馆史+日记三处
- [x] 设置里增加“灾难事件”开关，照顾休闲玩家——🎼 面板总开关，默认开
- [x] 实现 UI 提示当前损毁概率与借阅区等级关系——沙龙横幅/升级弹窗已有（d37776a）

### library-music-expansion-plan（音乐扩展）
> 2026-09-11 部分落地：春/冬/格什温三首已入库 `audio/music/`（winter-reverie / spring-reverie / rhapsody-jazz）+ 湖边早春/亚瑟王（留声阁亚瑟王联动），均注册 TRACK_DEFS `tier:'any'` 中英曲名齐。
- [ ] 确认最终曲目清单：德沃夏克《自新大陆·第二乐章》仍未入库（春/冬/格什温已落地）
- [x] 生成/采购 MP3（→ 路径为 `audio/music/`，5 首衍生曲 + 主题曲已规范命名入库）
- [x] 在 BGM 配置中注册 track，绑定 i18n key（TRACK_DEFS 6 条 any 档）
- [ ] 实现场景切换：专注默认《春》、深夜/低氛围切换《冬》《自新大陆》
- [x] 扩展 `TRACK_DEFS` 支持独立唱片（→ 以 `tier:'any'` 落地，购买即得；special 档位未做，等价目标已达成）
- [x] 实现多种解锁方式（→ 金币购买 + requiresBook 前置（亚瑟王联动）已落地；种子兑换/访客事件未做）
- [x] 中英文曲名文案（9-11 随 audio 整理同步）

### curator-office-organization-plan（馆长办公室整理）
- [ ] 梳理现有 `js/render/office.js` 信息结构，输出新版线框
- [ ] 顶部放 KPI 卡片（氛围、智慧之光、灵感、连续专注天数），可点击跳转
- [ ] 中间放“今日行动”待办清单，未完成置顶、已完成折叠
- [ ] 增加“今日推荐”模块，根据状态推荐下一步最优行动
- [ ] 底部长期进度（成就、收集、位面）用折叠面板
- [ ] 背景/光照随氛围阶段切换，强化馆长办公室场景感
- [ ] 完成移动端适配，确保不溢出、不堆叠混乱

### scriptorium-visualization-plan（缮写室可视化）
- [ ] 确定缮写室视觉风格与 moodboard
- [ ] 实现羽毛笔/毛笔书写动画，速度与当前誊抄速度挂钩
- [ ] 当前书籍封面展示 + 微光/尘埃效果
- [ ] 窗外天色随真实时间变化，氛围阶段影响室内装饰
- [ ] 进度可视化：卷轴展开或墨水填充，章节解锁时印章/翻页动画
- [ ] 暂停时烛火变暗、完成时墨水瓶金光庆祝动画
- [ ] 提供“低性能模式”开关，移动端保 60fps

### diorama-sticker-system-plan（立体贴纸系统）
- [ ] 制定贴纸资源规范（尺寸、格式、锚点适配）
- [ ] 新建 `data/stickers.js` 定义贴纸与解锁方式
- [ ] 实现贴纸解锁逻辑，与成就、访客、商店、活动系统对接
- [ ] 在图书馆大厅、缮写室、馆长办公室、书架特写设置场景画布与锚点
- [ ] 实现编辑模式：底部抽屉、拖拽吸附、旋转/缩放、长按删除、恢复默认、保存布局
- [ ] `state.decorations` 持久化，migration 兜底旧存档
- [ ] 首批至少 20 张贴纸、3 个场景可布置，移动端手势不冲突

### momo-diary-optimization-plan（墨墨日记优化）
- [ ] 每个模板池扩容到 20–30 条，按 atmosphere 阶段、晨午夜、季节分组
- [ ] 增加 `contextLine` 上下文句：引用上一本完成的书、当日最常来访访客、氛围阶段名
- [ ] 接入动态占位符：`{totalBooks}`、`{favoriteVisitor}`、`{daysSinceStart}` 等
- [ ] 增加典藏版、位面全收集、访客好感升级、书籍损毁等专属日志
- [ ] 日期分组展示 + 情绪标签（平静/喜悦/担忧/紧急）
- [ ] 实现 atmosphereStage 分层语气（废墟期简短试探 → 星辰期诗意信任）
- [ ] 增加日志收藏/搜索功能，确定入口在“馆史档案”还是独立子页

### collection-system-optimization-plan（收藏系统优化）
- [ ] 顶部导航新增“收藏馆”入口（或确定放在馆史档案内）
- [ ] 总完成度环形图 + 最近解锁 + 四类收藏卡片
- [ ] 解锁反馈升级：首次解锁小卡片动画 + 墨墨评论
- [ ] 25%/50%/75%/100% 阶段奖励落地（灵感 + 称号/皮肤/装饰）
- [ ] 书籍收藏显示封面、熟练度 Lv1–5，点击展开简介/解锁故事
- [ ] 访客记忆墙、位面星图、典藏版专属展台
- [ ] 100% 全收集仪式：证书/称号/馆长办公室终极装饰

### plants-post-reward-and-abandon（植物后期价值与废弃）
- [ ] 在植物 UI 增加“废弃/移除”按钮，点击后二次确认
- [ ] 废弃后将花盆重置为可立即重新种植的规范空状态
- [ ] 决策废弃是否返还种子/肥料、是否消耗智慧之光、是否有冷却期
- [ ] 设计种子后期消费口：种子商店（标志牌/装饰/BGM/皮肤）、访客礼物、植物图鉴
- [ ] 决策成熟植物被动 Buff（专注速度/微量氛围）与视觉装饰联动
- [ ] 明确枯萎植物与正常植物废弃时是否有差异待遇

### greenhouse-upgrade-plan（温室升级：美术 + 实用好处，2026-09-16 图南提）
> 现状锚点：温室/花盆在布置页；星光蕨种子掉落 60%；浇水已改全局池建模（state.water，2026-09-15/16）。灵感原话：「温室升级，也要有图片和额外好处，提升种子掉落概率/有时能爆出多个种子/每日免费浇水次数/自动浇水器/等等」。
- [ ] 决策升级线形态：温室整体等级（1-3 级？）还是单盆升级；金币单轨还是金币+灵感双轨
- [ ] 逐项设计好处并测算：种子掉落概率提升 / 多种子暴击 / 每日免费浇水次数 / 自动浇水器（全自动还是仅防枯）/ 其他
- [ ] 美术资产清单：温室分级状态图（对齐大厅 hall_lvN 破败→繁茂语言，AI 出图）
- [ ] 与 plants-post-reward-and-abandon 咬合（废弃/种子 sink 是否借升级线消化）
- [ ] 数值测算（参照 plant-typhoon-sim 验证掉落/浇水经济不回退）
- [ ] 出 plan 过 grill-me

### focus-after-random-events（丰富专注后随机事件选项，2026-09-16 图南提）
> 现状锚点：专注完成走 runFocusOrchestration（core/focus-orchestrator.js）结算链；灾难（鼠患/霉斑/火灾）已是 60s tick 冷却制的随机事件框架（core/disasters.js，含 🎼 面板总开关）。
- [ ] 盘点现有专注后事件池与触发权重（灾难/访客/墨墨点评/成就等），输出现状清单
- [ ] 设计新事件方向池：正/负/中性三系？是否与氛围阶段、当前所抄书籍、在馆访客做上下文关联
- [ ] 决策频率纪律：防连出冷却、防长缺保底、与 disastersEnabled 总开关的关系
- [ ] 文案 zh/en 词条，墨墨口吻校准
- [ ] 过 grill-me 后出实施 plan

---

## ✅ 2026-09-11 落地批次（A1 日界重构 + Phase 4 动工序列全通）

### daily-boundary-refactor（A1 日界统一重构，8 commits）
- [x] 新建 `js/core/day-boundary.js` 单一真源（onNewDay/checkDayRollover，同日防双触发/离线冻结/订阅者隔离）
- [x] 双触发点接入（init 链 + 60s tick）+ migrateV6 播种 lastSeenDay
- [x] 五处日期散点收敛：每日任务/墨墨日限/日记回顾/行动卡日限挂 onNewDay，streak 仅收敛原语（语义=连续专注日，刻意不挂）
- [x] 基线 24 项 → 全量 39 项测试全绿（test-day-boundary.mjs）

### cafe-corner + greenhouse + borrow-demand-deepening（Phase 4 三连）
- [x] 温室花盆扩容：state.plants 数组（v7），1→4 盆 800×1.8ⁿ，逐株隔离，34 项测试
- [x] 咖啡角本体：data/cafe.js 单一真源 + 营业链路（维持费/休眠/补算封顶）+ 面板 UI，51 项测试
- [x] 借阅深化：多本借阅/寄读日结/新书吐槽三机制（v9 迁移），52 项测试
- [x] 誊抄速率 balance：整体封顶 180%→200%，连击加成 30 天封顶（图南拍板）

### 杂项
- [x] 玩家 bug 修复：合成典藏版后分卷不再刷出书店（locked 语义撞车，真源反推零迁移）
- [x] audio 整理：根目录清零，6 动画键入库挂接（4 条 seedance 清单勾选），宣传PV 归 visual/promo/
- [x] drift 8→0 + planner 总览卡显示层同步

---

## 🟠 已部分完成待收尾

### god-module-split-full-implementation-plan（收尾）
- [x] Phase 2–5 继续推进：shop 拆分、focus 拆分、render 拆分、app.js 瘦身
- [x] 按 review 决策重渲染触发机制与 actions 注入方式
- [x] `migrations.js` 版本门控 runner 长期可用

### recopy-system-revision-plan（重抄系统修订）
- [ ] 修正 import 路径：`saveState` 来自 `js/state/save.js`，`createBookRecord` 来自 `js/core/book-utils.js`
- [ ] 决定 i18n 策略：推荐 `nameKey` + `t()`，否则收窄英文验收范围
- [ ] `SEED_EXCHANGE` 数组化，每项加 `type` 与 `repeatable`；dispatch 加 `default` 分支
- [ ] `abandonPlant` 重置为规范空盆对象，不要 `= null`
- [ ] 实现 `renderPlantArt` 预加载 fallback，不要依赖行内 `onerror`
- [ ] 新增 `addSeed()` / `spendSeed()` 集中 helper，替换裸赋值
- [ ] 确认 `DEFAULT_BOOKS` 是否含 book_023/024，若不含则明确 book 分支走 `createBookRecord`

### item-distribution-system-plan（道具分发系统）
- [x] `data/items.js`：6 种道具定义（笔类/修缮符/便签）
- [x] `js/core/redeem.js`：兑换奖励应用、背包增删、道具使用逻辑
- [x] `js/render/bag.js`：行囊面板、目标选择器、二次确认
- [x] 三种笔改名：莎草芦管/天鹅翎管/秘银笔尖（方案 C）
- [x] 本地测试码与生成脚本中的道具 ID 同步为新 ID
- [x] Supabase 后端部署：`redeem_codes` 表、Edge Function `redeem-code`
- [x] 生成并发放 10 个 `PIONEER` 先驱者码给 7 名测试用户（已生成 10 个码并入库）
- [x] 账号面板兑换入口 UI（已存在，注册登录后可用）
- [x] `supabase/migrations/20260830000000_add_signboard_serial_number.sql`：限量纪念牌增加 `serial_number` 字段并更新原子化兑换函数
- [x] `supabase/functions/redeem-code/index.ts`：兑换成功返回 `serial_number`
- [x] `js/render/library.js` / `js/i18n/terms.js`：纪念牌展示“第 N 号 / 共 N 块”
- [x] 新建 `data/borrow-levels.js` 作为 `BORROW_LEVEL_TABLE` 单一真源
- [x] `js/visitors.js` / `js/core/economy.js` / `js/core/visitor-lookup.js` 改从 `data/borrow-levels.js` 读取
- [x] 提交 8.30 改动并推送 Gitee `feature/2026-08-28-updates` + `deploy`

> **对账注记（2026-09-04）**：本节主体由 `47235db`（2026-08-28）落地——`js/core/redeem.js`、`js/render/bag.js`、`js/backend/redeem-code.js`、Edge Function `redeem-code`、迁移 `20260827000000_redeem_code_system.sql`、限量纪念牌 serial_number 展示；道具改名、`data/items.js`、`data/borrow-levels.js` 单一真源为 8-30/8-31 后续提交。本节无独立方案文档，锚点即本清单。
