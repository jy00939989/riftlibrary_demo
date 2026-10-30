---
anchors:
  - { type: file, path: "js/render/writing.js", weight: 0.1 }
  - { type: file, path: "js/core/focus-orchestrator.js", weight: 0.1 }
  - { type: file, path: "js/core/book-progress.js", weight: 0.1 }
  - { type: file, path: "data/items.js", weight: 0.1 }
  - { type: file, path: "js/core/favor-ledger.js", weight: 0.05 }
  - { type: file, path: "docs/plans/self-publishing-plan.md", weight: 0.1 }
---

# 归墟图书馆 · 玩家自出版系统计划

> 目标：玩家可以抄写自己想抄的文字——本地导入（任何文本）为 v1，服务器共享（图书漂流）为 v2。
> 核心设计哲学（图南 2026-10-30 拍板）：**有奖励，但门槛苛刻**。自出版走「出版执照 + 耗材」双闸：
> 执照是准入门槛（智慧之光 + 灵感值，或氪金），耗材是持续摩擦（魔法失效——图书馆的保存魔法
> 只覆盖馆藏，自己的书必须自备纸墨）。
>
> 设计先例：The Sims 4 三级出版制（自出版便宜/版税低 → 出版商 → 文学文摘限量）、Steam Direct
> 上架费（防垃圾上传）、Roblox 开发者许可 + 虚拟币结算；现实原型 = 书号制度（文化共鸣梗，
> 命名世界观化为「归墟出版司」）。
>
> 图南 2026-10-30 拍板清单：① 有奖励不隔离，但苛刻门槛 ② 每书需出版执照，自抄便宜、公共流传难
> ③ 自抄本要可借阅（不然没劲），另设「可借阅执照」再抬门槛 ④ 自抄/刊行本都需自购纸墨消耗品，
> **西洋风**（羽毛笔世界观配犊皮纸+墨水）⑤ 耗材按专注时间消耗，**每次打底 1+1**。
> **2026-10-30 评审一轮 REVISE 后修订**：经济数字全部核实属实；架构按两条 P0 重写
> （进度状态全走 state.books 默认形状 + BOOKS 运行时注入配 isCustom 守卫清单）；
> 叙事护栏修正为「char 驱动零过滤，唯一闸门=借阅池」；云同步体积方案落定
> （customBooks 独立于 state，V2 行级同步）；遗留两拍板点入 §七。
> **2026-10-30 评审二轮（架构师·系统健壮+数值平衡轴）REVISE 后修订**：
> ① P0-A 数字之争经克克回代码仲裁（`book-progress.js:88` `addCoins` 无 mult）——
> 计划的一生口径（4 氛围/100 币）**成立**，二轮评审拿单次口径对比属误读；但 §一.1 已改写
> 「单次/一生」双行制杜绝再误读 ② 采纳真 P0-B：云同步孤儿条目 reconcile + v1 设备绑定声明
> ③ 采纳 P1：准印即建条目时机 / getBookLicense 访问器 / 耗材短会话悬崖与刊行数值标
> [PLACEHOLDER] / 商店渲染路径确认 / 卷组重建含典藏版 def / localStorage 总封顶 ④
> §七两拍板点两轮评审一致推荐（照发 / 不计入+独立陈列位）。

---

## 一、已锁定决策

### 经济（真实测算口径，全部来自现行代码）
1. **单书完成奖励**（`book-progress.js:84-88`）——**单次/一生双行制**（二轮评审数字之争的
   仲裁落盘，防再误读）：
   | 书型 | 单次首通 | 单次重抄 | **一生合计** |
   |---|---|---|---|
   | 普通书 <3万字 | 3 氛围 + 50 币 | floor(1.5)=1 氛围 + **50 币（金币不减半，`addCoins` 无 mult）** | **4 氛围 + 100 币** |
   | 3万~10万字 | 6 + 50 | 3 + 50 | **9 氛围 + 100 币** |
   | ≥10万字 | 10 + 50 | 5 + 50 | **15 氛围 + 100 币** |
   | 分卷（每卷） | ×0.5 | ×0.5 | ~1 氛围 + 50 币 |
   防刷第一原理：**执照费 > 单书一生边际收益回收**。
2. **专注过程收益**（`focus-orchestrator.js:49`）：`分钟 × 0.8 币`，**book-neutral**——抄什么书
   同时长入账相同，0.8 币/分钟由真实时间封顶。不计入执照锚（不推高定价），但消除
   「花钱抄自己的字」的心理阻力：过程收益一分不少。
3. **借阅收益**是 curated 书真正的长尾。评审修正口径（`visitors.js:1413-1431`）：单趟不止
   returnCoins 30~60——每满 6 小时计划时长 +3 币（10 万字书借满 = **+60**），Lv5+ 多本借阅
   额外书 ×0.6 币，单趟合计可达 **~120 币**，外加 returnAtmo 1~7/趟。单书借阅生涯
   「500~1500」按真实公式是**低估**，M2 验收必须按含时长/多本加成的完整公式重测回本账。
   防刷方向不变：借阅总吞吐受访客生成速率封顶，自定义书只是分走馆藏份额，不增量发币。
4. **灵感真实流速**：每日任务 +2/天（`dailytasks.js` 全勤奖，**2026-10-30 图南拍板 3→2**——
   自出版执照上线前的流速校准），修复/种子兑换/连专注/节日礼叠加，
   活跃玩家月产 120+。灵感分量按此校准（40 ≈ 20 天日常，150 ≈ 10 周）。
5. **耗材定价**：60 分钟专注产 ~48 币，耗材 2 纸 + 2 墨 ≈ 32 币 → 净 16/时段（馆藏 48）。
   净收益为正（不拦人），边际差显著（魔法差距可感），摩擦税不是拦路虎。

### 执照三级制（叠加收费）
| 层级 | 费用 | 解锁 |
|---|---|---|
| ① 抄本准印券 | 300 智慧之光 + 40 灵感 | 进缮写室抄写；可上架展示、计藏书数 |
| ② 流通准印执照 | 再 +800 币 + 60 灵感 | 该书进入访客借阅池（在①之上叠加） |
| ③ 刊行准印执照（v2） | 2000 币 + 150 灵感，或 ¥6 直购 | 公共漂流：全服可见可抄、署名 + 被抄分成 |
| ③ 附 | 分成比例 / 日上限 / 上传冷却 | `[PLACEHOLDER · V2 前仿真定档]`（二轮评审红线：未标数值必须标占位） |

全套可借阅自定义书 = 1100 币 + 100 灵感 ≈ **50 天**日常灵感（按 2/天口径，二轮评审指正
一轮 33 天未传导 3→2）——对数月借阅生涯 500~1500 币，
是**长线投资不是印钞机**。对照锚：DLC 七书包 120 灵感 = 17/本还带完整借阅生涯；
自定义书为「抄自己的字」付溢价，体系内部自洽。

### 耗材（西洋风 · 魔法失效）
6. 商店消耗品：**犊皮纸 ×10 = 80 币、墨水 ×10 = 80 币**（data/items.js 新 category 'material'，
   与心意便签同商店管线）。
7. **消耗口径：按专注时间，每 commenced 30 分钟耗 1 纸 + 1 墨，打底 1+1**——
   30 分钟=1+1，60=2+2，90=3+3。仅自定义书消耗；馆藏有保存魔法零耗材。
   ⚠️ **短会话悬崖（二轮评审 P1）**：5~10 分钟会话赚 4~8 币、打底 32 币 → **净亏**，
   与「消除心理阻力」初衷相悖。`[PLACEHOLDER · 待拍板]`：最小计费门槛（如 ≥15 分钟才扣打底）、
   中途放弃是否按已抄比例退耗材、扣耗材时机（开场扣 vs 结算扣）——M1 实现前定档。
8. 会话**开场校验库存**，不足则拒绝开抄并提示补货（墨尽不辍耕的体面）。
9. v2 刊行后，**其他玩家抄你的漂流书同样自备纸墨**——纸墨铺是所有自出版者的共同上游出口。

### 内容与叙事护栏
10. **叙事层零过滤（评审修正）**：`triggerNarrative`/`triggerEvent` 是 **charId 驱动**——叙事池/
    赠书表/诗笺全是静态 curated id，**从不接收被借书的 bookId**，自定义书在结构上就不可能
    进叙事输入，不存在「按书过滤的钩子」。真正引用被借书的只有 `pickReturnQuote`
    （`visitors.js:368-381`，纯标题插值，对《大学物理笔记》说「好书」是无害梗）。
    **唯一闸门 = 借阅池的 license.lendable 过滤器**（单一收口 `getCompletedBooks`）。
    ⚠️ 遗留拍板点：访客归还**整单**以自定义书为主时，char 驱动的整单叙事照常触发
    （无法按书 suppress）——是接受（推荐：叙事是角色内容，照发）还是整单 suppress
    （等于对自出版玩家额外削一刀），需图南显式拍板，见 §七。
11. **字数门槛**：手稿 ≥5000 字才发执照，杜绝一页书刷藏书数/位面门。
12. **多卷制支持**（M3）：复用 VOLUME_GROUPS 集齐联动；第 1 卷标准价，第 2 卷起每卷
    +150 币 +10 灵感；全卷集齐给典藏边框 + 套装氛围奖励。
13. 自定义书**重抄清零磨损照常，但重抄是重新抄写 = 重新消耗纸墨**——魔法失效贯穿全生命周期。

---

## 二、M1：本地导入 + 抄本准印券 + 耗材（v1 核心）

**导入器**（自出版司页签，挂大书库子标签第三位：📚藏书格 / 📜古籍修复室 / 🖋️自出版司）
- 粘贴文本 + .txt/.md 文件导入；空行/章节标题自动分章，可手动调分章点
- 单书 ≤10 万字（localStorage 预算），超限提示拆书；草稿态 → 申请执照 → 准印态
- **数据形状（评审 P0-B1 修正）**：进度状态与内容分离——
  - `state.customBooks`（内容/元数据仓，**独立于 state 走单独 localStorage key**）：
    `{ [custom_id]: { title, totalWords, chapters[], license:{copy,lendable}, isCustom:true } }`，
    **不含任何进度字段**（copyCount/copiedWords/wearCount 等一律不放——双写必裂）
  - **进度状态全走 `state.books[custom_id]`**，用默认书形状工厂建条目（`state.js` DEFAULT
    形状 11 个必需字段：unlockedChapters/copyCount/masteryLevel/copiedWords/status/starred/
    damaged/repairWords/repairProgress/readChapters/reCopyUnlocked）——引擎（applyWords/
    completeBook/磨损/保养/修复）零改动自动同口径
- **BOOKS 运行时注入（评审 P0-B2 修正）**：加载时（render 前同步 + 云档合并后重注入）
  `Object.assign(BOOKS, 自定义 defs)`——BOOKS 全仓 36 处消费、7 处全局迭代（藏书格渲染/
  借阅池/缮写选书/收藏/兑换码）零改动接通，「resolveBook 只接三处」不可行的判断正确，弃用
- **`isCustom` 守卫清单（注入方案的必配件，漏一条=免费发书漏洞）**：
  1. `books.js:10` `tryUnlockNewBook`（locked 判定只看 state.books——会把未购执照自定义书
     当「待解锁新书」**随机白送，直接绕过 300+40 执照闸**）→ 守卫公式：
     `lockedIds = allBookIds.filter(id => !unlockedIds.includes(id) && !BOOKS[id]?.isCustom)`。
     **且必须配对「准印即建条目」（二轮 P1-A）**：买抄本准印券的瞬间就创建
     `state.books[custom_id]`（status='copying'）——否则「准印后、首抄前」窗口里书在 BOOKS
     不在 state.books，仍可被白送
  2. `collection.js:67` 图鉴百分比（owned/total）——自定义书稀释 curated 收集率，**两轮评审
     一致推荐不计入**（§七拍板），并需补独立陈列位 UI（工作量入 M1 评估）
  3. 里程碑候选 / 兑换码 / 任务完成检查（book_completed 计数口径）——**统一走 `getBookLicense`
     访问器**（二轮 P1-B）：custom 书读 `customBooks[id].license`，curated 返回
     `{copy:true,lendable:true}`；`getCompletedBooks` 过滤与守卫#3 同用这个访问器，各写各的判据
  4. 商店管线为 SHARED_POOL 驱动（天然安全，但需回归确认）；**耗材 'material' 分类上架前
     先 grep 商店渲染逻辑**（二轮 P1-C：`isItemUsable` 只认 brush/repair/favor/candy，
     材料要确认走的是「可购买不可使用」分支而非被它过滤）
- **⚠️ 云同步孤儿条目 reconcile（二轮 P0-B，真 P0）**：state.books 的 custom_id 进度**会随
  整档上传**（save.js 全量），而 customBooks 内容不上云 → 新设备登录出现「有进度无定义」
  孤儿：书架渲染遍历 `state.library.shelves` 的 id 直接 `BOOKS[bid]` 无守卫会崩/空卡。
  修法：加载时 reconcile——`state.books` 中 custom_id 但 BOOKS/customBooks 无 def 的条目
  干净删除。**v1 显式声明「自定义书设备绑定」**（local 导入 local 玩），跨设备不跟随写成
  已知限制而非静默损坏；V2 刊行后行级同步天然解决

**缮写接入**
- writing.js 的书对象已是标准形状（chapters + unlockAt 推导），custom book 补 quotes=空集即可
- 专注开抄钩子：focus-orchestrator 会话起点校验纸墨 → 扣耗材 → 正常跑；馆藏书零改动

**验收**：导入→买券→供纸墨→开抄→完成上架→藏书数+1→灵感/币按真实流水走通；
防刷清单全过（见 §五）。

## 三、M2：流通准印执照 + 借阅池准入

- 已准印书可加价升流通执照；升后入借阅候选池（与馆藏同 wear/damage/repair 规则）
- 借阅池准入过滤器（单一收口 `visitors.js:851` getCompletedBooks）：
  `status==='completed' 且 license.lendable`——**这是自定义书进流通的唯一闸门**
- 纸墨只在抄写消耗；借阅循环零耗材（磨损是它的成本）

## 四、M3：多卷巨著 → V2：刊行漂流 + 审核

- M3：多卷书导入（卷间手动切分）+ VOLUME_GROUPS **运行时注入**（静态 const 对象可变，
  注入点与 BOOKS 同批；持久化从 state.customBooks 重建——刷新后内存态丢失需重建机制，
  否则集齐联动/典藏合成在自定义组上静默失效——评审 P1-B4）+ 集齐联动（decision 12）。
  **重建顺序（二轮 P1-D）**：BOOKS def → VOLUME_GROUPS 条目 → **典藏版 def 三者缺一不可**，
  一轮评审漏了典藏版注入点
- V2：Supabase `community_books` 表（uploader_id / status: pending→approved / report_count /
  字数与卷数 jsonb）+ RLS 只读已审 + **发布前人工审核队列（图南后台，AI 预审只做辅助）**；
  刊行执照（decision表③）+ 举报/下架 + 上传者权利声明勾选；防刷：pending ≤3/人、上传冷却
  `[PLACEHOLDER]`

## 五、防刷与合规清单（评审逐条过）

- [ ] 执照费 > 单书边际收益回收（M1 抄本券 300+40 对 100 币+氛围：净沉没 ✓）
- [ ] 可借阅全套价（1100+100）≥ 期望借阅生涯回本周期——**M2 按完整借阅公式重测**
  （returnCoins + 时长加成 `visitors.js:1413` + 多本 ×0.6 `visitors.js:1429` + returnAtmo）
- [ ] `isCustom` 守卫清单全落地（tryUnlockNewBook 白送漏洞封死 + 图鉴百分比 + 里程碑/兑换码过滤）
- [ ] **云同步体积（评审 P1-D1）**：sync.js 每 3 秒 debounce 全量 upsert 整个 state——
  customBooks 独立于 state（单独 localStorage key）→ v1 同步**零 payload**；
  V2 刊行走 Supabase 独立行级同步（一书一行），永不进 saves.save_data jsonb
- [ ] **云同步孤儿 reconcile（二轮 P0-B）**：加载时删除 state.books 中无 def 的 custom_id；
  v1 设备绑定声明写进 UI（自出版司页首注明）
- [ ] BOOKS 注入时序：render 前同步注入 + 云档合并（sync 下载覆盖 state.books）后重注入
- [ ] 准印即建条目：买券瞬间创建 state.books[custom_id]，tryUnlockNewBook 白送窗口封死
- [ ] getBookLicense 访问器落地，getCompletedBooks 过滤 + 守卫#3 统一走它
- [ ] 商店渲染路径确认（material 分类不被 isItemUsable 过滤）
- [ ] **保养 +1 氛围农场跨计划约束（二轮 P2）**：自定义书同口径吃古籍保养 +1 氛围——
  须随 book-maintenance-plan 的 P0 修法（那条 +1 无 sink 本是通胀口）一起闸住
- [ ] localStorage 总封顶（二轮 P2）：自定义书总本数/总字数硬上限 `[PLACEHOLDER]`，
  超限引导拆书或等 V2 上云
- [ ] 耗材摩擦：自定义书时段净收益 < 馆藏时段净收益（16 < 48 ✓）
- [ ] ≥5000 字门槛 + 单书 ≤10 万字 + 上架格数占用手稿箱/书架容量（不吃免费格）
- [ ] 自定义书不占访客叙事池；题赠/诗笺/narrative 钩子零触发
- [ ] 磨损/损毁/修复同口径；重抄重新耗纸墨
- [ ] V2 UGC：发布前人工审 + 举报下架 + 上传者声明 + 账号可溯（国内平台内容审核义务）

## 六、测试计划

- test-self-publishing.mjs：导入分章/字数门槛/执照状态机/耗材扣除（按分钟表）/
  BOOKS 注入回退/借阅池过滤（getBookLicense）/叙事钩子不触发/磨损同口径/灵感币流水
- **二轮补漏用例**：云档下载后孤儿 reconcile（state.books 有 custom_id 而 customBooks 空
  → 加载后条目被清、书架不崩）；准印即建条目时机（买券瞬间 state.books 有条目、
  tryUnlockNewBook 不再白送）
- 经济仿真脚本：模拟重度玩家 30 天自出版流，验证总收益 < 同精力 curated 流
  （**按仲裁后数字跑**：一生 100 币 + 4~15 氛围——若用单次 50 币会低估 curated 优势）

## 七、未决与二期坑

- **⚠️ 待图南拍板（两轮评审一致推荐，已标注）**：
  1. 自定义书为主角的还书整单，char 驱动的叙事事件**照发**（推荐：叙事是角色内容与被借书
     无关，suppress = 对自出版玩家额外削一刀，违背「有奖励不隔离」基调）
  2. **图鉴百分比不计入自定义书**（推荐：全收集党不被迫买执照补齐非 curated 项）；连带
     工作量：独立陈列位 UI（collection.js getProgress 改完 + 新展示区块），入 M1 评估
- **M1 前必须定档的 [PLACEHOLDER]**：耗材最小计费门槛/中途放弃退还/扣耗材时机（decision 7）；
  刊行分成比例/日上限/上传冷却（decision ③）；localStorage 自定义书总封顶（本数+总字数）
- 氪金通道（¥6 刊行执照）依赖支付方案选型，V2 前单独立项
- 灵感值若日后开放更多产出，执照灵感分量需按流速再校准
- 竖排支持自定义中文书？与 planner `t_20261030_vertical_writing` 联动评估
- 玩家删除已刊行书的权利（V2 合规）
