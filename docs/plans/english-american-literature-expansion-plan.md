---
anchors:
  - { type: file, path: "data/books.js", weight: 0.1 }
  - { type: file, path: "data/book_pool.js", weight: 0.1 }
  - { type: file, path: "data/volume_groups.js", weight: 0.1 }
  - { type: file, path: "data/dlc_packs.js", weight: 0.1 }
  - { type: file, path: "data/music.js", weight: 0.1 }
  - { type: file, path: "js/ambient.js", weight: 0.1 }
  - { type: file, path: "data/event_calendar.js", weight: 0.1 }
  - { type: file, path: "js/i18n/terms.js", weight: 0.1 }
  - { type: file, path: "docs/plans/english-american-literature-expansion-plan.md", weight: 0.1 }
---

# 归墟图书馆 · 「英美文学选读」扩列计划

> 目标：以自考《英美文学选读》（黄必康版，2023 大纲）为蓝本，为书库新增一波英美文学书目，
> 分三条入库线：**普通商店直购**（6 部）、**DLC 补充包**（2 个 pack）、**特殊活动**（3+1 场）。
> 图南 2026-10-22 拍板：全量都做；附赠音轨继续做（规格见 §四）。
>
> 蓝本来源：`~/Desktop/英美文学选读_总库/01_教材大纲/教材/英美文学选读大纲和题型_*.docx`
> （十章：英国早期/十六/十七/十八/十九/二十世纪、美国殖民地/十八/十九/二十世纪）。
>
> 与现有库存的衔接：傲慢与偏见（005）、鲁滨逊漂流记（017）、老人与海（003）、坎特伯雷故事集（032）、
> 十四行诗集（033）已入库，**不重复收录**；英吉利教会史+亚瑟王之死（中世纪 DLC pack_british_legends）
> 即大纲第一章选篇，本计划从第二章起扩。

---

## 一、普通商店直购（6 部，零门槛，plane: 'astral'）

| ID | 书名 | 作者 | 考纲 | 分类 | 规格 | 字数 | 单卷价 |
|---|---|---|---|---|---|---|---|
| book_035 | 简·爱 | 夏洛蒂·勃朗特 | 五章·小说 | 小说 | 2 卷+典藏版（group book_035） | 380,000（19万/卷） | 350 |
| book_036 | 呼啸山庄 | 艾米莉·勃朗特 | 五章·小说 | 小说 | 2 卷+典藏版（group book_036） | 300,000（15万/卷） | 350 |
| book_037 | 雾都孤儿 | 狄更斯 | 五章·小说 | 小说 | 2 卷+典藏版（group book_037） | 380,000（19万/卷） | 350 |
| book_038 | 格列佛游记 | 斯威夫特 | 四章·小说 | 小说 | 单本 | 240,000 | 450 |
| book_039 | 西风颂·夜莺颂：浪漫主义诗歌选 | 雪莱/济慈/华兹华斯/拜伦 | 五章·诗歌 | 诗歌 | 单本 | 80,000 | 400 |
| book_040 | 富兰克林自传 | 富兰克林 | 八章·散文 | 传记 | 单本 | 180,000 | 450 |

设计要点：
- **勃朗特姊妹成双**（035/036）同期上架，商店刷出时可做「姊妹双璧」小横幅（可选）。
- 039 直接对标 033《十四行诗集》的诗歌单本形态：组诗小章 + unlockAt 阶梯。
- 040 是「自助者天助」的美国精神读本，与誊抄成长线气质最合。
- 单本篇幅参照：038 仅次于纯粹理性批判（225k），在单本先例范围内；040 取节选规模。

## 二、DLC 补充包（2 个新 pack）

延续 pack_british_legends 规格：灵感解锁（首包特惠 60 已用则不重复，后续按原价 120）、
可配兑换码、附赠音轨（§四）、books 走 plane: 'astral' + dlcPackId 门控。

### Pack 2「文艺复兴的回声」 📜（pack_renaissance_echoes，sortOrder: 2）

| ID | 书名 | 作者 | 考纲 | 分类 | 规格 | 字数 |
|---|---|---|---|---|---|---|
| book_041 | 乌托邦 | 托马斯·莫尔 | 二章·散文 | 哲学 | 单本 | 120,000 |
| book_042 | 为诗辩护 | 菲利普·锡德尼 | 二章·散文 | 散文 | 单本 | 60,000 |
| book_043 | 论说文集 | 弗朗西斯·培根 | 三章·散文 | 散文 | 单本 | 80,000 |

- 选篇锚点：乌托邦「羊吃人」（考纲选篇 2）、为诗辩护选篇 6、培根「论结婚与单身」。
- 定位：思想/散文三件套，考纲必读但偏门，正是 DLC 门槛的恰当内容。

### Pack 3「意识的暗流」 🌊（pack_consciousness_currents，sortOrder: 3）

| ID | 书名 | 作者 | 考纲 | 分类 | 规格 | 字数 |
|---|---|---|---|---|---|---|
| book_044 | 尤利西斯 | 詹姆斯·乔伊斯 | 六章·小说 | 小说 | 3 卷+典藏版（group book_044） | 450,000（15万/卷） |
| book_045 | 黑暗之心 | 约瑟夫·康拉德 | 六章·小说 | 小说 | 单本 | 100,000 |
| book_046 | 飞蛾之死 | 弗吉尼亚·伍尔夫 | 六章·散文 | 散文 | 单本 | 40,000 |

- 选篇锚点：尤利西斯「夜幕降临时的意识流」「睡梦」、黑暗之心选篇 5。
- 定位：现代主义三件套，艰深小众——「普通书店买不到的书」，DLC 高门槛的内容 justified。

## 三、特殊活动（3+1 场）

机制复用现状：event_calendar.js 区间横幅 + 限时上架 / 兑换码赠送（中秋礼物窗口链路）+ 限量纪念牌。

| 活动 | 时间锚点 | 书目 | 形式 |
|---|---|---|---|
| 哥特之夜 | 万圣周（10-28 ~ 11-03） | book_047 红字（霍桑，小说，2卷+典藏，36万）+ book_048 阿芒提拉多的酒桶（爱伦·坡，志怪，单本 3万） | 区间横幅 + 限时上架（商店 gating，见 §六实施线 D）+ 「红字」主题纪念牌 |
| 雪夜林边 | 冬至（12-20 ~ 12-26） | book_049 雪夜林边驻足：弗罗斯特诗选（诗歌，单本 2万） | 兑换码赠送小册（复用中秋礼物窗口自动领），诗名与冬至雪景严丝合缝 |
| 自由之路 | 6 月（Juneteenth 6-19 前后一周） | book_050 汤姆叔叔的小屋（斯托夫人，小说，2卷+典藏，40万）+ book_051 哈克贝利·费恩历险记（马克·吐温，小说，单本 20万节选） | 区间横幅 + 限时上架 + 「自由之路」纪念牌 |
| 草叶与信封（可选第四场） | 4 月诗歌月（4-01 ~ 4-30） | book_052 自我之歌：惠特曼诗选（诗歌，单本 6万）+ book_053 狄金森诗选（诗歌，单本 3万） | 区间横幅 + 限时上架；两本均为考纲九章选篇 |

- 048 阿芒提拉多的酒桶走「志怪」分类（现有分类有先例：神话/志怪），短篇体量小、价格 200，做哥特周的入门钩子。
- 活动时间全部写入 event_calendar.js，与音乐节日半价日同机制自然共存。

## 四、附赠音轨制作策划（DLC pack 配套）

接线现状（中世纪包先例）：
- BGM → `data/music.js` TRACK_DEFS，tier 'any'，定价 800💰，`requiresBook: '<pack 内某书 id>'`
  （先例：湖边临终的亚瑟王 requiresBook book_031）
- 白噪音 → `js/ambient.js` AMBIENT_DEFS，挂 `dlcPackId`（先例：medieval_monastery）

| 轨 | 归属 | 曲名 | 风格/参考 | 文件（英文化命名） | 时长 |
|---|---|---|---|---|---|
| BGM | Pack 2 | 佛罗伦萨的鲁特琴 | 文艺复兴鲁特琴 + 维奥尔琴，温暖室内乐，无打击乐；Suno prompt: "Renaissance lute and viola da gamba consort, warm intimate chamber music, modal melodies, no percussion, gentle and scholarly, instrumental" | audio/music/florentine-lute.mp3 | 2-3min 循环 |
| 环境音 | Pack 2 | 十六世纪书房 | 鹅毛笔沙沙 + 壁炉 + 远处鲁特琴；与 blizzard_fireplace 同规格 25 分钟循环 | audio/ambient/renaissance-study.mp3 | 25min 循环 |
| BGM | Pack 3 | 都柏林的雨 | 现代主义极简钢琴 + 雨声底，稀疏、冥想；Suno prompt: "Minimalist modernist piano with soft rain ambience, sparse contemplative notes, misty Dublin evening, instrumental, melancholic" | audio/music/dublin-rain.mp3 | 2-3min 循环 |
| 环境音 | Pack 3 | 二十世纪的雨夜 | 城市夜雨 + 远处电车 + 翻书声，25 分钟循环 | audio/ambient/modernist-rain.mp3 | 25min 循环 |

制作路线（按优先级）：
1. **图南供曲**（先例：暴雪天壁炉）——有现成素材直接走 图南供曲 路线
2. **Suno 生成**——沿用 library-music-expansion-plan.md 的 prompt 策略；环境音若 Suno 不出纯环境轨，可用「生成音乐底 + 素材站雨声」混
3. 文件名一律英文化入库（避免中世纪包的中文文件名债）

活动音轨钩子（可选）：冬至「雪夜林边」活动日可让 winter-reverie（维瓦尔第·冬）自动半价——
音乐节日系统已支持按日折扣，仅需在 event_calendar.js 加一条 type:'music' 节日，零新代码。

## 五、内容来源与考纲彩蛋

- **章节正文来源**：现有书籍的章节是节选/梗概体（单章 2-5k 字），不是全译文。
  新书沿用此形态：以公版原文（Project Gutenberg 等）与通行中译为底，自拟节选梗概。
  ⚠️ 不直接搬运黄必康教材译文（外研社版权）；教材 docx 仅作选篇范围与考点核对用
  （`英美文学选读_总库/01_教材大纲/教材/` 下有两册，其中 301-536 已有 .parsed.md，
  1-300 需补一次解析）。
- **📌 考纲选篇角标（推荐做）**：凡对应考纲选篇的章节，预览处加「📌 考纲选篇」小标。
  玩家在归墟图书馆读的每章 = 图南在灰烬学院要考的篇目，两个项目体验握手。
  实现：章节数据加 `syllabus: true` 标记，渲染层角标，i18n 两条词条。
- **作者小传/轶事/书评**：books.js def 三件套照常填（典藏版合成与 mastery 展示依赖）。

## 六、实施线拆分

**A. 数据层**
1. `data/books.js`：book_035~053 defs（含 volume 与 collected 形态、chapters 节选正文、📌 标记）
2. `data/volume_groups.js`：新增 5 个卷组（035/036/037/044/047/050 中的双卷+三卷者——
   实为 简·爱/呼啸山庄/雾都孤儿/尤利西斯/红字/汤姆叔叔的小屋 六组）
3. `data/book_pool.js`：普通 6 部 + 活动书池条目

**B. DLC 层**
4. `data/dlc_packs.js`：两个新 pack（bookIds/inspirationCost:120/codes 待定/sortOrder）
5. 兑换码：新码写入 REDEEM_CODES（码名实施时定，如 RENAISSANCE26 / DUBLIN26）

**C. 音频层**
6. `data/music.js` + `js/ambient.js`：四条音轨接线（§四）
7. 素材制作/供曲（图南供曲 or Suno）

**D. 活动层**
8. `data/event_calendar.js`：四个活动区间（哥特之夜/雪夜林边/自由之路/草叶与信封）
9. 商店限时 gating：书池条目加 `eventId` 字段，book-shop 刷池时按 event_calendar 过滤
   ~~（新逻辑，约 20 行；若图南批「不做 gating 就全用兑换码」，此条可省，改走赠送链路）~~
   **✅ 2026-10-22 已落地**：`EVENT_WINDOWS` + `isEventWindowActive()`（event_calendar.js），
   book-shop 三处接线（候选过滤/保底过滤/过期槽位清理）+ purchaseBook 兜底拦截；
   哥特之夜（10/28–11/3）为首例，红字两卷 + 酒桶已入库书池**
10. 礼物窗口自动领：雪夜林边小册（复用 10 月礼物窗口补偿链路）
11. 纪念牌：哥特之夜「红字」+ 自由之路「自由之路」两枚限量牌

**E. 表现层**
12. `js/i18n/terms.js`：新书名/活动/角标词条（中英）
13. 封面：13 部新书封面生成提示词（沿用分级图提示词 v3 管线）
14. `npm run check:imports` + 数据校验脚本（ID 唯一/卷组和/字数对账）

## 七、验收清单

- [ ] 6 部普通书可在商店刷出并购买，📌 角标正确
- [ ] 2 个 DLC pack 灵感解锁/兑换码双通路，附赠 BGM+环境音随之解锁
- [ ] 六组卷组可合成典藏版，典藏版可阅读（拼合路径，2026-10-22 已修的 getReadableChapters 直接生效，含卷分隔条）
- [ ] 活动期间限时书只在其窗口出现；雪夜林边小册登录自动领
- [ ] 纪念牌限量计数正确
- [ ] check:imports 通过、无空章节、字数对账平

## 八、批次建议

- **第一批**（可先玩起来）：A 线 6 部普通书 + 044 尤利西斯之外的全部数据 → 商店立刻有新货
- **第二批**：B+C 线两个 DLC pack（等音轨素材到位再发，或先发 pack 后补音轨——中世纪包是同步发的，建议同步）
- **第三批**：D 线活动（下一个时间锚点是冬至 12-20，倒排即可；哥特之夜 10-28 最紧，如赶得上可插队）
