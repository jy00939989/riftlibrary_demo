# 异世界图书馆

纯前端 Web 应用，番茄钟专注计时 + 书籍收集 + NPC 访客模拟 + 成就与收集系统。

## 技术栈

- 原生 JS ES Modules，无框架
- Tailwind CSS CDN + 自定义主题 (`css/style.css`)
- localStorage 持久化（3 个 key）
- 单页应用，6 个标签页切换

## 启动

直接在浏览器打开 `index.html`，无需构建/服务器。

## 文件结构

```
index.html              ← 页面骨架 + Tailwind 配置
css/style.css           ← 羊皮纸/魔法主题样式 + 缮写动画样式

data/                   ← 静态数据（不依赖任何模块）
  books.js              ← BOOKS 入口，组装 22 本书 + CATEGORIES 枚举
  books/book_001~022.js ← 每本书 meta/chapters/quotes/mastery内容
  book_pool.js          ← 商店/里程碑共享池（17本，含 plane 字段）
  atmosphere.js         ← 5 阶段氛围描述（废墟→星辰，0~500）

audio/                  ← 音频素材
  7 首 BGM（3层氛围 ×2变奏）+ 1 部开场PV

visual/                 ← 美术素材
  background/           ← 5 张图书馆背景（废墟→华丽）
  library_readingarea/  ← 7 张借阅区等级插画（外壳→圣所）
  focusroom/            ← 7 张缮写室等级插画（lv0→lv6）

js/                     ← 逻辑层
  app.js                ← 入口：初始化/页面切换/全局编排/新手引导/PV开场/成就检测接入
  state.js              ← 全局状态 + localStorage 序列化 + 旧档迁移
  timer.js              ← 计时器（番茄钟25min/倒计时/正计时 + 墨墨首次加速）
  storage.js            ← 智慧之光/氛围/历史/连击 原子读写 + 氛围→BGM联动
  audio.js              ← 音频引擎：3层氛围BGM + 交叉淡入淡出
  diary.js              ← 墨墨日志：每日回顾 + 特殊事件
  visitors.js           ← 访客逻辑（纯逻辑，不碰DOM）
  shop.js               ← 商店逻辑：借阅区/缮写室升级 + 书籍刷新/购买
  books.js              ← 书籍解锁/进度计算
  achievements.js       ← 成就引擎：31 成就定义 + 条件判定 + toast
  collection.js         ← 收集系统：5 类收集品进度
  dev.js                ← Dev 面板（右下角齿轮，Ctrl+Shift+D）
  render/               ← 渲染层（唯一操作 DOM 的模块）
    index.js            ← 统一 re-export
    common.js           ← el/h/formatTime/setActions
    focus.js            ← 缮写室 + 结算卡片
    writing.js          ← 缮写动画引擎（canvas排版 + 羽笔效果 + 左右翻页）
    bookshelf.js        ← 大书库 + 筛选 + mastery 弹窗
    visitors.js         ← 读者沙龙 + 事件弹窗
    library.js          ← 馆长办公室（子标签：概况/成就柜/收藏室）
    archive.js          ← 馆史档案 + 墨墨日志子标签
    shop.js             ← 位面商店（借阅区/缮写室升级 + 新书购买）
    achievements.js     ← 成就柜 UI 网格 + toast 通知
    collection.js       ← 收藏室 UI
    animations.js       ← 弹窗动画
```

## 数据流核心原则

```
state.js (单一数据源) → app.js (编排层) → render/ (DOM层)
                            ↑
              visitors.js / shop.js / achievements.js (纯逻辑，不碰 DOM)
```

- `render/` 是唯一操作 DOM 的模块
- `app.js` 通过 `setActions()` 注入回调到 render 层
- 逻辑模块只通过 `state` + `saveState()` 通信

## localStorage 持久化

| Key | 内容 | 管理方 |
|-----|------|--------|
| `library_state` | 核心存档（books/library/visitors/history/diary） | state.js |
| `library_achievements` | 成就解锁状态 | achievements.js |
| `library_collection` | 收集品状态（待用） | collection.js |
| `library_music` | 音乐开关（on/off） | audio.js |

## 核心数值

- 货币：智慧之光（代码变量名 `coins`）
- 氛围：0~500，5 阶段（废墟0-30 / 破败30-80 / 陈旧80-160 / 温暖160-300 / 星辰300-500）
- 专注：每分钟 100 字誊抄 + 0.8 智慧之光 + 1 氛围
- 缮写室速率：每级 +5%（`1 + focusLevel × 0.05`），影响显示/结算/放弃字数
- 书架扩容：300×2^(n-1)，封顶 4800
- 借阅区升级：0~7 级，500×1.5^(n-1) 封顶 5700
- 缮写室升级：0~6 级，400×1.45^(n-1) 封顶 5000
- 书籍 mastery：Lv1~5（初识→传承），纯收集向
- 借阅区 Lv0 容量为 0（需购买升级），Lv1~Lv7 容量 2~10 人
- 访客每 60 秒 tick 一次（浏览 + 40%概率借书）
- 专注完成后 30%~50% 概率吸引访客（氛围加成），完成整本书固定吸引
- 首次访客到来解锁「墨香来客」成就 + 右下角卡片提醒
- BGM 首次专注完成后激活（新用户），回头客页面加载即播

## 当前书籍（22 本）

### 初始解锁
| ID | 书名 | 作者 | 分类 | 字数 |
|----|------|------|------|------|
| book_001 | 小王子 | 圣埃克苏佩里 | 童话 | 14,000 |
| book_002 | 动物农场 | 乔治·奥威尔 | 寓言 | 29,000 |

### 共享池（商店/里程碑/阿九推销，17本）
| ID | 书名 | 作者 | 分类 | 字数 |
|----|------|------|------|------|
| book_003 | 老人与海 | 海明威 | 小说 | 25,000 |
| book_004 | 东京梦华录 | 孟元老 | 历史 | 15,000 |
| book_005 | 傲慢与偏见 | 简·奥斯汀 | 小说 | 123,000 |
| book_006 | 庄子 | 庄子 | 哲学 | 32,500 |
| book_007 | 本草纲目·草部 | 李时珍 | 科学 | 190,000 |
| book_008 | 物种起源 | 达尔文 | 科学 | 193,000 |
| book_009 | 红楼梦 | 曹雪芹 | 小说 | 400,000 |
| book_011 | 道德经 | 老子 | 哲学 | 5,162 |
| book_012 | 沉思录 | 马可·奥勒留 | 哲学 | 80,000 |
| book_013 | 理想国 | 柏拉图 | 哲学 | 300,000 |
| book_014 | 史记 | 司马迁 | 历史 | 530,000 |
| book_015 | 诗经 | 孔子编订 | 诗歌 | 39,000 |
| book_016 | 西游记 | 吴承恩 | 小说 | 860,000 |
| book_017 | 鲁滨逊漂流记 | 丹尼尔·笛福 | 小说 | 150,000 |
| book_018 | 几何原本 | 欧几里得 | 科学 | 600,000 |
| book_019 | 卡拉马佐夫兄弟 | 陀思妥耶夫斯基 | 哲学 | 450,000 |
| book_020 | 社会契约论 | 卢梭 | 哲学 | 80,000 |

### 沈明远专属池（好感度赠书，不进商店）
| ID | 书名 | 作者 | 分类 | 字数 |
|----|------|------|------|------|
| book_010 | 纯粹理性批判 | 康德 | 哲学 | 225,000 |
| book_021 | 第一哲学沉思集 | 笛卡尔 | 哲学 | 60,000 |
| book_022 | 传习录 | 王阳明 | 哲学 | 80,000 |

## 导航标签

```
🖋️ 缮写室  |  📖 大书库  |  🏛️ 馆长办公室  |  ☕ 读者沙龙  |  📜 馆史档案  |  🌌 位面商店
```

## 关键变量/函数速查

- `state` — 全局状态对象，在 state.js
- `saveState()` → 写入 `library_state`
- `addCoins(n)` / `spendCoins(n)` — 代币操作
- `addAtmosphere(n)` — 氛围值操作，上限 500，联调 refreshBGM()
- `addHistory(type, title, detail)` — 历史记录
- `updateStreak()` — 连续专注天数更新
- `checkAchievements(trigger, payload)` — 成就检测，返回解锁列表
- `showAchievementToast(ach)` — 成就 toast
- `getFocusSpeedMultiplier()` — 缮写室速率倍率（1.00~1.30）
- `getNow()` — 统一时间源，Dev 加速时返回偏移时间
- `window.switchTab(name)` — 切换顶层标签页
- `window.__dev` — Dev 面板 API
- `initAudio()` / `refreshBGM()` / `toggleMusic()` / `onFirstInteraction()` — 音频管理
- `addDiaryEntry(type, payload)` / `tryGenerateDailySummary()` — 墨墨日志
- `getDiaryEntries()` / `getDiaryBindingLevel()` — 日志读取
- `getActivePlantDef()` / `waterPlant()` / `fertilizePlant()` / `harvestPlant()` — 植物盆栽操作
- `canExchangeSeed(type)` / `exchangeSeed(type)` — 种子兑换
- `addWaterOpportunity()` — 浇水机会（专注完成触发）
- `checkWither()` — 72h 凋谢检测
- `purchaseSignboard(id)` — 标志牌购买

## 植物盆栽系统（2026-05-13 新增）

- 位面商店「馆内装潢」区购买盆栽（💰50）
- 5级成长（幼苗→小株→茂叶→含苞→绽放），浇水+施肥推进进度
- 浇水：每次番茄钟25分钟专注完成获得1次机会（+25进度）
- 施肥：花费智慧之光（+50进度，花费按等级 50/80/120/180）
- Lv5 绽放后收获：氛围+25 + 智慧之光+30 + 60%概率掉落种子
- 收获后凋谢回空盆；72小时不照料自然凋谢
- 种子集齐5颗兑换女儿推荐书：《绿野仙踪》《爱丽丝梦游奇境》
- 新增文件：`data/plants.js`、`js/plants.js`、`js/render/plants.js`
- 馆长办公室新增「🏺 布置」子标签（植物状态 + 种子库存 + 标志牌收集 + 造景贴纸占位）

## 标志牌系统（2026-05-13 新增）

- 5种标志牌：请保持安静/禁止烟火/欢迎光临/馆长推荐/时光沙漏（💰200~300）
- 一次性购买，永久拥有，展示在「布置」页
- 页面挂件和buff效果为技术债

## 种子兑换书籍（2026-05-13 新增）

| ID | 书名 | 作者 | 分类 | 兑换条件 |
|----|------|------|------|----------|
| book_023 | 绿野仙踪 | 莱曼·弗兰克·鲍姆 | 童话 | 鹤望兰种子 ×5 |
| book_024 | 爱丽丝梦游奇境 | 刘易斯·卡罗尔 | 童话 | 魔法玫瑰种子 ×5 |

## 部署

- **平台**：腾讯云 EdgeOne Pages（`riftlibdemo-5tyvfdz4.edgeone.cool`）
- **代码托管**：Gitee `sallyshen1987/library_demo`，分支 `refactor-book-system`
- **域名**：`riftlib.com` + `riftlib.cn` + `riftlib.cloud`（待 ICP 备案）
- **音频/视频**：总计 ~40MB，通过 CDN 分发

## 新增/改造的文件（二期 ~ 四期，2026-05-11~14）

- **新建**：`js/achievements.js`、`js/collection.js`、`js/render/achievements.js`、`js/render/collection.js`、`js/render/writing.js`
- **重写**：`js/render/library.js`（子标签页）、`js/render/focus.js`（缮写动画集成）、`data/atmosphere.js`（阈值 0-500）
- **修改**：`js/app.js`（新手引导 + 成就接入 + 氛围收益 + 缮写室速率）、`js/storage.js`（氛围上限）、`js/state.js`（introCompleted + borrowLevel + focusLevel + planePortals + nameLocked）、`js/visitors.js`（氛围收益 + 沈明远赠书改造）、`js/dev.js`（氛围收益）、`js/shop.js`（缮写室升级 + 速率倍率）、`js/render/shop.js`（缮写室卡片 + 借阅区卡片）、`js/timer.js`（缮写室速率应用）、`js/books.js`（import 路径迁移）
- **更名**：全局文案「代币」→「智慧之光」；导航标签全部重命名（欧式古典调性）；图书馆默认名「星辉」→「归墟」
- **新增书籍数据**：`data/books/book_011~020.js`（10本，Coze 生成后人工审核修正）、`data/books/book_021~022.js`（2本，手写）
- **新增美术素材**：`visual/focusroom/`（7张缮写室等级插画 lv0~lv6）
- **清理**：删除 `js/render.js`（旧单体渲染）、`demo/writing-animation.html`（原型）、`VISITOR_SYSTEM.md`、`MODIFY_BORROWING_AREA.md`、`BORROWING_AREA_DESIGN.md`、`BOOK_SYSTEM_REDESIGN.md`、`二期架构增量.md`、会话日志
- **三期增量（2026-05-13）**：新建 `data/plants.js`、`data/signboards.js`、`js/plants.js`、`js/render/plants.js`、`data/books/book_023_绿野仙踪.js`、`data/books/book_024_爱丽丝梦游奇境.js`；修改 `js/state.js`（plant/seeds/signboards 状态 + 迁移）、`js/shop.js`（标志牌购买）、`js/render/shop.js`（馆内装潢区）、`js/render/library.js`（布置子标签）、`js/app.js`（浇水机会 + 凋谢检测）、`data/books.js`（注册新书）
- **四期增量（2026-05-14）**：新建 `audio/`（7首BGM + 1部PV）、`js/audio.js`（3层氛围BGM + 交叉淡入淡出）、`js/diary.js`（墨墨日志系统）；修改 `js/app.js`（PV开场引导 + 墨墨加速叙事 + BGM首次专注激活 + 访客概率刷新 + 访客到来卡片）、`index.html`（音乐开关按钮 + 导航标签）、`js/storage.js`（氛围→BGM联动）、`js/achievements.js`（V03墨香来客）、`js/visitors.js`（访客首次事件日志）、`js/state.js`（diary字段 + diaryFirsts迁移）、`js/render/archive.js`（重写：馆史档案 + 墨墨日志子标签）、`js/render/visitors.js`（借阅区等级Banner）、`js/shop.js`（氛围奖励 + 墨香初遇成就）、`js/render/shop.js`（成就触发）

## 待实现

- 访客好感度等级系统及信物收集
- 位面系统（传送门、多位面内容）
- 店占位升级项实体化（古籍修复室、咖啡角、研究区）
- 阿九推销书池改造（SALE_BOOKS 仍为虚构空壳书）
- 古修复室（damaged/repairWords 机制尚未接入游戏循环）

## 文档索引

| 文档 | 用途 |
|------|------|
| `ARCHITECTURE.md` | 完整架构文档 |
| `成就系统设计.md` | 30 成就详细条目 |
| `成就与收集系统设计文档.md` | 成就与收集总设计（框架+砍项决策） |
| `成就系统调研报告.md` | 同类游戏成就调研 |
| `SHOP_SYSTEM_DESIGN.md` | 商店系统完整设计 |
| `BOOK_TEMPLATE.md` | 书籍数据模板（Agent 用） |
| `CHANGELOG_2026-05-10.md` | 变更记录 |
| `DESIGN.md` | 早期 Demo Day 设计（部分过时） |
