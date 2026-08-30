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
- [ ] 在 `js/visitors.js` 还书损毁判定中读取 `state.library.borrowLevel`
- [ ] 按等级减免：基础概率 - `(borrowLevel - 1) * 0.004`，下限 0.5%
- [ ] “爱惜书籍”标志牌效果在等级减免后再叠加
- [ ] 在读者沙龙页面/借阅区升级弹窗提示当前损毁概率
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

### game-animations-plan（游戏动画）
- [ ] 确定首批 P0 动画清单：氛围升级、房间解锁、专注完成、书籍完成
- [ ] 确定动画色调与风格（琥珀金、墨黑、暖白，parchment/wood）
- [ ] 用 CSS/SVG/Lottie 制作 3 个 P0 原型并玩家测试
- [ ] 实现统一动画注册表 `data/animations.js` 与触发入口
- [ ] 动画播放不阻塞核心交互，支持跳过
- [ ] 设置中增加“关闭动画/减少动画”可访问性选项
- [ ] 资源总大小首期 < 1MB，移动端 60fps、低端设备降级静态效果

---

## 🟡 需先决策/设计

### backend-supabase-implementation-plan（后端接入）
- [ ] 创建 Supabase 项目并把 `SUPABASE_URL` / `SUPABASE_ANON_KEY` 注入前端配置
- [ ] 新建 `js/backend/client.js`、`auth.js`、`sync.js`、`analytics.js`、`api-proxy.js`
- [ ] 在 Supabase 建 `profiles`、`saves`、`events` 表并启用 RLS，补全 `events` 的 INSERT 策略
- [ ] 登录后走 `saveState()` 单一出口触发 `uploadSave()`，保留本地优先与手动云端恢复
- [ ] 实现事件本地队列 `pending_events`，关键埋点调用 `track()` 并支持断网补报
- [ ] 新建 Edge Function `kimi-proxy` 转发 Moonshot API，前端替换本地 Flask 代理调用
- [ ] 补全 OAuth 回调处理、`profiles` 自动建行、离线 fallback 与错误状态暴露

### god-module-split-plan（神模块拆分）
- [ ] Phase 1：拆出 `js/state/state.js` / `migrations.js` / `save.js`，`js/state.js` 变 shim
- [ ] Phase 2：按购买类型拆分 `js/shop.js` 到 `js/core/shop/*.js`，原文件变转发壳
- [ ] Phase 3：把专注生命周期从 `app.js` 迁到 `js/core/focus-session.js`、`focus-rewards.js`、`focus-orchestrator.js`
- [ ] Phase 4：拆分 `js/render/focus.js` / `js/render/shop.js` 到子目录，确保 render 不再直接改 state
- [ ] Phase 5：`app.js` 只保留启动顺序与全局事件，其余弹窗/卡片迁出
- [ ] 同步改造 `actions`：由 app 注入或静态导入，建立“render → actions → core → state → save”数据流

### god-module-split-full-implementation-plan（神模块拆分完整实施）
- [ ] Phase 1：落地 `js/state/state.js`、`migrations.js`、`save.js`，`js/state.js` 仅 re-export
- [ ] Phase 2：创建 `js/core/shop/book-shop.js`、`library-upgrades.js`、`plane-portals.js`、`signboards.js`
- [ ] Phase 3：创建 `js/core/focus-session.js`、`focus-rewards.js`、`focus-orchestrator.js`
- [ ] Phase 4：拆分 `js/render/focus/*.js` 与 `js/render/shop/*.js`，通用弹窗抽到 `js/render/shared/`
- [ ] Phase 5：`app.js` 瘦身到 <400 行，剩余弹窗/卡片迁到 render shared
- [ ] 重构 `actions` 为统一入口，render 通过 actions 调用 core，不直接修改 state

### economy-balance-review（经济平衡）
- [ ] 为氛围 500 硬封顶后增加消费口：溢出折算智慧之光/灵感或解锁星辰阶装饰/BGM
- [ ] 重平衡植物经济：提高 `harvestCoins` 到 80–150 或降低施肥成本，明确植物是氛围/收集投资
- [ ] 在种子兑换中优先落地 `coins` / `atmosphere` 奖励项
- [ ] 书价分层：前 30 本 400–600，后 38 本 700–1000
- [ ] 给后期增加可重复金币来源，如高等级访客赠礼事件或 Lv7 归还币提升
- [ ] 新增 1–2 个灵感来源，或把首次重抄成本从 2 降到 1

### atmosphere-venue-map-design（场馆地图）
- [ ] 改造 `addAtmosphere`：藏书厅 `atmosphere` 仍封顶 500，溢出自动转入 `venueAtmosphere`
- [ ] state 新增 `venueAtmosphere` 与 `rooms`（茶室、温室、庭院、档案室），migration 兜底旧存档
- [ ] 实现场馆地图 UI 与 4 房间解锁/维持功能，`settleVenueMaintenance()` 每日结算
- [ ] 茶室接入访客羁绊事件，复用 `visitorMemory` 收集层
- [ ] 庭院接入现实日历活动日框架，确定首批作家/纪念日清单
- [ ] 实现自由氛围兑灵感入口（建议 50:1）
- [ ] 调整顶栏/图书馆 UI，区分藏书厅进度条与自由氛围池

### book-damage-events-plan（书籍损毁事件）
- [ ] 选定首批 2–3 个 MVP 损毁来源（推荐鼠患、潮湿霉斑）
- [ ] 在 `data/signboards.js` 新增对应预防类标志牌（猫馆长、除湿炭包等）
- [ ] 在 tick/每日首次登录/还书时触发事件，计算概率后应用有界损失
- [ ] 保证典藏版、修复中书籍免疫，单次损失不超过 30%
- [ ] 每条损毁事件写入墨墨日志，配叙事文案
- [ ] 设置里增加“灾难事件”开关，照顾休闲玩家
- [ ] 实现 UI 提示当前损毁概率与借阅区等级关系

### library-music-expansion-plan（音乐扩展）
- [ ] 确认最终曲目清单：维瓦尔第《春/冬》、德沃夏克《自新大陆·第二乐章》，可选格什温/贝多芬/德彪西
- [ ] 生成/采购 MP3，压缩到 128kbps、单首 < 3MB，按命名放入 `assets/audio/bgm/`
- [ ] 在 BGM 配置中注册 track，绑定场景与 i18n key
- [ ] 实现场景切换：专注默认《春》、深夜/低氛围切换《冬》《自新大陆》
- [ ] 扩展 `TRACK_DEFS` 支持 `tier: 'special'` 的“馆长的私人唱片”
- [ ] 实现三种解锁方式：植物种子兑换、访客事件、书籍满级
- [ ] 中英文曲名与作曲家说明文案补全，测试循环无卡顿

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

---

## 🟠 已部分完成待收尾

### god-module-split-full-implementation-plan（收尾）
- [ ] Phase 2–5 继续推进：shop 拆分、focus 拆分、render 拆分、app.js 瘦身
- [ ] 按 review 决策重渲染触发机制与 actions 注入方式
- [ ] `migrations.js` 版本门控 runner 长期可用

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
