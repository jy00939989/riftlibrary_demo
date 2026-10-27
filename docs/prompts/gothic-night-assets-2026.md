# 哥特之夜 2026 · 素材总包 v4.2（封面 35 + 美术 4 + 音轨 2 + 限时内容包）

> **实施状态（2026-10-27）：素材全部入库、内容包代码全部落地，23 测试套件全绿（新增 test-gothic-event 33 项）。**
> **窗口拍板：10-27 ~ 11-13（起止日都含，共 18 天）**——起点 10-27（当天开测当天玩）、终点 11-13 两次图南拍板；三处定义已同步（EVENT_WINDOWS / MONTH_BANNERS / FESTIVALS.gothicNight2026），书池门控走 EVENT_WINDOWS 单源自动跟随。
> v4.3（10-27 晚图南拍板）：任务链改**领取制**——完成不开弹窗，展览厅面板手动领：开卷=猩红血夜BGM（任务专属奖励，图南拍板不上架售卖）· 执灯=魔法南瓜种子×3 · 种瓜=南瓜糖×3（新 consumable：+3 浇水机会）· 待客=2026 纪念牌。兑换券结算弹窗双按钮（用券免费/花币留券）已落。
> 已落地：35 封面入 `visual/books/` + 32 本 meta 补 cover 字段 · 横幅/2026 牌/饮品/甜品入盘并接线 ·
> 魔法南瓜（全株限时/不掉种子/不可嫁接/窗口回收）· 四任务链 event-tasks.js · 兑换券（登录发券+purchaseBook 抵扣）·
> cafe/温室 festivalKey 门控。剩：音轨（等 Suno 成品，TRACK_DEFS 加 festivalKey 同款即可）、书店兑换券角标、任务进度 UI 条（计划内可节后补）。

> 2026-10-26 v4（图南加项）：① 纪念牌铸 **2026 年份字样**（与以后年份区分；「红字 A」仍由 HTML 盖）；② 徽章改为**任务链获得**，不再登录即送；③ 咖啡角**限时饮品 + 限时甜品**各一；④ **魔法南瓜种子**限时上架，可种出魔法南瓜——新增美术：饮品/甜品/魔法南瓜生长图。
> v4.1（图南修订）：南瓜定为**魔法南瓜**（异世界品种，带幽蓝魔法光）；**全株限时**——种子窗口内售卖、**窗口关闭未收获的植株由系统回收**、收获不掉种子（一颗种子一次收成）；**不进种子兑换表、不加嫁接/升级**（§三.1）。
> v4.2（图南加项）：万圣窗口内**登录即送万圣节书籍兑换券**——可兑换任意一本可购买的书，每人 1 张（§三.5）。
> 封面系统（v3）：**出版社装帧设计**语言——企鹅布纹经典（≤2 色单一母题烫印）、企鹅 Great Ideas（字排式）、上海译文窗帘布（满版纹）、中华书局古籍（竖题签+朱文印）；封面画入中文书名 + 「归墟藏书」印章；不凑格，风格相近才同版。
> 窗口：哥特之夜 10-28 ~ 11-03（EVENT_WINDOWS 首例，代码已上线）

## 〇、总清单

| # | 素材 | 数量 | 落盘 | 状态 |
|---|---|---|---|---|
| 1 | 书封面（11 版 sprite sheet，2–4 张/版） | 35 张 | `visual/books/book_{id}.png`（512×768） | 提示词 §一 |
| 2 | 节日横幅 + 2026 纪念牌 + 限定饮品 + 限定甜品（§十九 切片制 1 张母版出 4 件） | 4 件 | 见 §二 切片表 | 提示词 §二 |
| 3 | 魔法南瓜生长图（5 阶段立绘） | 5 张 | `visual/plants/plant_17~21_magicpumpkin*.png` | 提示词 §三.3 |
| 4 | 三条音轨（猩红血夜=任务专属 / 海妖吟唱 700 / 死神邀舞 800）+ 环境音万圣夜书房 500 | 4 轨 | audio/music + audio/ambient | 已落盘 ✅ |
| 5 | 限时白噪音《万圣夜书房》 | 1 轨 | `audio/ambient/halloween-night.mp3` | 方案 §四 |

**出图后的接线：**
- 封面：※ 书（32 本）meta 补 `cover` 字段；book_034/047/048 已声明只缺图
- 横幅：`data/event_calendar.js:68 MONTH_BANNERS` 照中秋条目加一条
- 纪念牌：`data/signboards.js` 仿 `mid_autumn_plaque` 加 `gothic_night_plaque`（**giftOnly 但走任务链发放**，见 §三.4）
- 饮品/甜品：`data/cafe.js CAFE_RECIPES` +2（需 eventId gating 小代码，§三.5）
- 魔法南瓜：`data/plants.js` +1 植物定义（含 art 5 张立绘路径）+ 种子限时上架 + 节后全株回收（§三.1，eventId gating，§三.5）
- 音轨：`data/music.js TRACK_DEFS` +1、环境音数据 +1（eventId gating，§三.5）

---

## 一、书封面 ×35（11 版 · 装帧设计语言分组 · 不凑格）

> 规格沿用 `book-cover-prompts-batch.md`：**每格 512×768（2:3），几张书就几格**——2 张=2×1（1024×768），3 张=2×2 留空格，4 张=2×2（1024×1536）。
> 切图落 `visual/books/book_{id}.png`。※ = 需补 meta cover 字段；未标 = 已声明只缺图。

### 通用前缀（每版生成前复制）

```text
Generate a sprite sheet of PUBLISHER-GRADE BOOK COVER DESIGNS (book binding design, NOT illustrations, NO painted scenes), one cover per cell, each cell 512×768 pixels (2:3 vertical).

Every cover is a DESIGNED OBJECT with fixed layout zones:
1. Material base filling the whole cover: fine cloth weave / textured specialty paper / silk, visible tactile texture.
2. A thin decorative border frame with gold-foil corner accents, and a dark leather spine strip along the left edge (series identity).
3. Chinese book title as elegant TYPOGRAPHY in its own reserved zone (vertical traditional layout preferred, era-appropriate lettering style) — the title is part of the design, never overlaid on the motif.
4. A red square seal stamped at the bottom-right corner, seal script "归墟藏书".
5. The book's motif rendered as EMBLEM or REPEATING PATTERN only — foil-stamped, debossed, or embroidered-thread look; centered single emblem or all-over small repeat.

Strict discipline: maximum TWO print colors per cover plus the material base; embossed/debossed texture visible; generous margins; flat graphic design. NO full scenes, NO landscape paintings, NO illustrated vignettes, no photorealism.
```

### 封面负向提示词

```text
场景插画, 全幅风景, 叙事画面, 绘画感, 照片写实, 英文, 拼音, 乱码文字, 错别字, 现代字体, 书名与指定不符, 额外文字, 水印, 元素越出格子, 元素互相重叠, 网格线, 裁切线
```

> **备选流程 B**（模型中文渲染不稳时）：把通用前缀第 3、4 条改为「封面无任何文字」，负向加回「文字, 字母」，先出无字装帧，书名与「归墟藏书」印章后期统一压（PS/美图），参照已就位 26 张封面的流程。

---

### 版 1 · 哥特之夜（万圣活动主打 · 2 张 · 2×1）

**装帧语言**：哥特布纹经典——深色细布面 + 单一母题刺绣/烫印反复纹，严格双色，维多利亚装帧的阴郁庄重。

| 格 | 书 | 设计规格 |
|---|---|---|
| L | book_047 《红字》（典藏版） | 炭黑细布面；中央一枚猩红线绣感字母 A 徽章（荆棘野玫瑰缠绕），深灰玫瑰藤蔓压纹打底；竖排题签 |
| R | book_048 《阿芒提拉多的酒桶》 | 玄黑布面；烫金酒桶弧线与烛焰几何连续纹，中央徽章=酒桶与狂欢面具纹章；竖排题签 |

```text
Design language: Gothic clothbound in the Penguin Clothbound tradition — dark fine-weave cloth, one motif rendered as embroidered-thread or gold-foil repeat, strict two colors, brooding Victorian dignity.
2×1 grid:
1. 《红字》: charcoal-black fine cloth, a single scarlet-thread-embroidered letter A wreathed in thorned wild roses as the central emblem, faint dark-grey rose-vine debossed repeat in the ground, vertical title strip
2. 《阿芒提拉多的酒桶》: jet-black cloth, gold-foil repeat of wine-cask arcs and candle flames, centered crest emblem of a cask with a carnival mask, vertical title strip
```

### 版 2 · 志怪幽玄（4 张 · 2×2）

**装帧语言**：玄色绫面/绢面 + 烫银母题，幽光冷色，≤2 色（银 + 一点朱）。

| 格 | 书 | 设计规格 |
|---|---|---|
| TL | book_077 《楚辞（选）》※ | 玄青暗花绫面；烫银兰草与水波连续纹，中央单徽章=一叶扁舟压浪；竖排题签 |
| TR | book_058 《搜神记（选）》※ | 黛蓝细布面；烫银狐影与长剑几何连续纹，中央山形徽章；竖排题签 |
| BL | book_062 《聊斋志异（选）》※ | 墨黑绢面；压纹卷轴中探出狐首（单徽章），朱红细线灯笼纹点缀；竖排题签 |
| BR | book_079 《野草》※ | 铁灰粗布面；压纹野草连理枝满版，中央一点猩红种子头徽章；横排题签 |

```text
Design language: dark Chinese supernatural — black-blue silk/cloth covers, silver foil motifs with a single touch of cinnabar red.
2×2 grid:
1. 《楚辞（选）》: dark teal silk, all-over silver orchid-and-ripple repeat pattern, centered single emblem of a small boat pressing through waves, vertical title strip
2. 《搜神记（选）》: indigo-blue fine cloth, silver fox-and-sword geometric repeat, centered mountain-shaped emblem, vertical title strip
3. 《聊斋志异（选）》: black silk, debossed single emblem of a fox head emerging from an unrolled scroll, thin cinnabar lantern-line accents, vertical title strip
4. 《野草》: iron-grey rough linen, debossed tangled-weeds repeat, one centered scarlet seed-head emblem, horizontal title
```

### 版 3 · 明清笔记小品（4 张 · 2×2）

**装帧语言**：米白宣纸纹纸面 + 浅绛/灰青单色印花（窗帘布式满版小纹，克制淡雅）。

| 格 | 书 | 设计规格 |
|---|---|---|
| TL | book_056 《浮生六记》※ | 米白细布面；浅绛兰花与茶具满版小纹；横排题签 |
| TR | book_057 《陶庵梦忆》※ | 灰白宣纸纹；残灯彩与雪片满版小纹，中央留白竖题 |
| BL | book_059 《人间词话》※ | 月白缎面；三段远山近水织锦纹（上中下排布），竖排题签 |
| BR | book_061 《荆楚岁时记》※ | 米色布面；艾草、粽叶、小龙舟节令纹满版，朱色细点；横排题签 |

```text
Design language: Ming-Qing literati — rice-white paper/cloth, single muted print color (pale crimson, grey-blue), all-over small repeat patterns in the spirit of decorated book cloth.
2×2 grid:
1. 《浮生六记》: cream fine cloth, pale-crimson orchid-and-teaware small repeat, horizontal title
2. 《陶庵梦忆》: grey-white xuan paper texture, broken-festival-lantern and snowflake small repeat with generous empty center, vertical title
3. 《人间词话》: moon-white satin, woven-brocade strip of three tiny landscapes stacked (tower dusk, wilting willow, snowfield moon), vertical title strip
4. 《荆楚岁时记》: beige cloth, mugwort-leaf-and-mini-dragon-boat festive small repeat, fine cinnabar dots, horizontal title
```

### 版 4 · 中国诗歌清逸（3 张 · 2×2 留一空）

**装帧语言**：月白绢面 + 单徽章（烫金或水墨淡彩一枚），大面积留白。

| 格 | 书 | 设计规格 |
|---|---|---|
| TL | book_065 《声律启蒙》※ | 月白绢面；成对织纹小徽章（云/雨、雪/风对仗成排）；竖排题签 |
| TR | book_068 《唐诗三百首》※ | 月白绢面；烫金梅枝单徽章，砚台水印暗纹；竖排题签 |
| BL | book_078 《王维诗选》※ | 月白绢面；水墨雪山远鸟单徽章，大量留白；竖排题签 |
| BR | （空） | — |

```text
Design language: clear Chinese poetry — moon-white silk, ONE centered emblem per cover with generous empty space.
Grid: 3 cells (2×2 with bottom-right empty):
1. 《声律启蒙》: moon-white silk, a neat paired row of tiny emblems (cloud/rain, snow/wind in facing pairs), vertical title strip
2. 《唐诗三百首》: moon-white silk, single gold-foil plum-branch emblem, faint inkstone watermark texture, vertical title strip
3. 《王维诗选》: moon-white silk, single ink-wash emblem of snowy mountain and one returning bird, vast empty space, vertical title strip
```

### 版 5 · 典籍庄重（4 张 · 2×2）

**装帧语言**：中华书局式古籍装帧——绢面/布面，竖排题签，简帛暗纹压底，烫金/烫银。

| 格 | 书 | 设计规格 |
|---|---|---|
| TL | book_063 《坛经》※ | 赭黄绢面；菩提叶简帛暗纹压底，烫金；竖排题签 |
| TR | book_064 《论语》※ | 藏青布面；杏坛竹简织纹，烫金；竖排题签 |
| BL | book_072 《曾国藩家书（选）》※ | 黛色布面；信札红线捆扎纹暗纹，烫银；竖排题签 |
| BR | book_073 《贞观政要（选）》※ | 绛紫绢面；宫阙几何纹，烫金；竖排题签 |

```text
Design language: Chinese classical canon — silk/cloth in deep ceremonial colors, vertical title strips, subtle bamboo-slip or brocade ground patterns, gold or silver foil, dignified and restrained.
2×2 grid:
1. 《坛经》: ochre-yellow silk, debossed bodhi-leaf and bamboo-slip ground, gold foil, vertical title strip
2. 《论语》: navy cloth, apricot-altar and bamboo-slip woven pattern, gold foil, vertical title strip
3. 《曾国藩家书（选）》: slate-blue cloth, debossed letters-bound-with-red-string ground, silver foil, vertical title strip
4. 《贞观政要（选）》: deep violet silk, palace-architecture geometric pattern, gold foil, vertical title strip
```

### 版 6 · 西方哲思（4 张 · 2×2）

**装帧语言**：企鹅 Great Ideas 字排式——奶油纸面，严格双色（黑+深蓝/酒红/金），细线几何压纹，书名本身就是设计主体。

| 格 | 书 | 设计规格 |
|---|---|---|
| TL | book_010 《纯粹理性批判》※ | 奶油纸面；深蓝烫印星图细线纹；黑体横排书名居中，字排即主角 |
| TR | book_020 《社会契约论》※ | 奶油纸面；酒红断链线条连续纹；黑体横排书名居中 |
| BL | book_021 《第一哲学沉思集》※ | 奶油纸面；烛火与蜡封金线小徽章一枚；竖排题签 |
| BR | book_054 《手册》※ | 大理石纹纸面；双色圆环（控制二分）线刻徽章；横排书名 |

```text
Design language: Penguin Great Ideas typography-led — creamy uncoated paper, strict two-color discipline (black plus deep blue / burgundy / gold), fine line geometric patterns, the title typography IS the hero.
2×2 grid:
1. 《纯粹理性批判》: cream paper, deep-blue fine-line star-chart pattern, bold centered horizontal title, typography as hero
2. 《社会契约论》: cream paper, burgundy broken-chain line repeat, bold centered horizontal title
3. 《第一哲学沉思集》: cream paper, single small gold-line emblem of candle and wax seal, vertical title strip
4. 《手册》: marbled paper, two-color engraved emblem of interlocking circles (dichotomy of control), horizontal title
```

### 版 7 · 自然观察（2 张 · 2×1）

**装帧语言**：19 世纪博物学布纹——厚实布面 + 烫金博物图谱纹样。

| 格 | 书 | 设计规格 |
|---|---|---|
| L | book_055 《瓦尔登湖（节选）》※ | 松绿粗布面；烫金小木屋与湖波涟漪满版纹；竖排题签 |
| R | book_067 《昆虫记（选）》※ | 麦色布面；烫铜甲虫与螳螂博物学图谱纹满版；横排题签 |

```text
Design language: 19th-century naturalist book cloth — sturdy cloth, gold/copper foil natural-history engraving patterns.
2×1 grid:
1. 《瓦尔登湖（节选）》: pine-green rough cloth, gold-foil cabin-and-ripple repeat, vertical title strip
2. 《昆虫记（选）}: wheat-colored cloth, copper-foil beetle-and-mantis naturalist engraving repeat, horizontal title
```

### 版 8 · 维多利亚童书（4 张 · 2×2）

**装帧语言**：企鹅布纹经典童书式——鲜亮布面双色，单一母题反复烫印（童趣几何化，不画场景）。

| 格 | 书 | 设计规格 |
|---|---|---|
| TL | book_023 《绿野仙踪》※ | 草绿布面；烫金黄砖路螺旋连续纹 + 稻草人小徽章；竖排题签 |
| TR | book_024 《爱丽丝梦游奇境》※ | 湖蓝布面；白兔怀表与扑克花色压纹满版；横排题签 |
| BL | book_034 《秘密花园》（典藏版） | 玫瑰粉布面；烫金蔷薇藤蔓连续纹 + 知更鸟徽章；竖排题签 |
| BR | book_066 《安徒生童话选》※ | 深红布面；烫银剪纸士兵与美人鱼剪影连续纹；横排题签 |

```text
Design language: Victorian children's clothbound — bright cloth, single motif foil-stamped as playful geometric repeat.
2×2 grid:
1. 《绿野仙踪}: grass-green cloth, gold yellow-brick-road spiral repeat with small scarecrow emblem, vertical title strip
2. 《爱丽丝梦游奇境》: lake-blue cloth, all-over debossed white-rabbit pocket-watch and playing-suit pattern, horizontal title
3. 《秘密花园}: rose-pink cloth, gold rose-vine repeat with robin emblem, vertical title strip
4. 《安徒生童话选}: deep-red cloth, silver paper-soldier and mermaid-silhouette repeat, horizontal title
```

### 版 9 · 抒情浪漫（4 张 · 2×2）

**装帧语言**：柔色布面 + 单徽章烫印，色调温暖诗意。

| 格 | 书 | 设计规格 |
|---|---|---|
| TL | book_001 《小王子》※ | 星夜蓝布面；烫金小行星与玻璃罩玫瑰徽章；竖排题签 |
| TR | book_070 《少年维特之烦恼》※ | 秋黄布面；烫褐椴树叶与信札纹满版；竖排题签 |
| BL | book_071 《新月集》※ | 暖白纸面；烫金新月与纸船小徽章；横排题签 |
| BR | book_075 《裴多菲诗选》※ | 茜红布面；烫金玫瑰与三色绶带纹；竖排题签 |

```text
Design language: lyrical romantic — soft-colored cloth, single centered foil emblem, warm poetic palette.
2×2 grid:
1. 《小王子}: starry-night-blue cloth, gold emblem of a tiny asteroid with a rose under a glass dome, vertical title strip
2. 《少年维特之烦恼}: autumn-yellow cloth, brown-foil linden-leaf and letter-sheet repeat, vertical title strip
3. 《新月集》: warm-white paper, small gold crescent-moon and paper-boat emblem, horizontal title
4. 《裴多菲诗选}: madder-red cloth, gold rose and tricolor-sash repeat, vertical title strip
```

### 版 10 · 古歌史诗（2 张 · 2×1）

**装帧语言**：青铜/大漠色布面 + 图腾式烫印，厚重苍茫。

| 格 | 书 | 设计规格 |
|---|---|---|
| L | book_074 《乐府诗集（选）》※ | 沙金布面；烫褐烽燧与折柳图腾连续纹；竖排题签 |
| R | book_076 《奥德赛（史诗选）》※ | 深海蓝布面；烫金桅杆与海妖琴弦图腾连续纹；竖排题签 |

```text
Design language: ancient ballad-epic — bronze/desert-toned cloth, totemic repeat patterns, weighty and windswept.
2×1 grid:
1. 《乐府诗集（选）}: sand-gold cloth, brown-foil beacon-tower and broken-willow totem repeat, vertical title strip
2. 《奥德赛（史诗选）}: deep-sea-blue cloth, gold mast and siren-string totem repeat, vertical title strip
```

### 版 11 · 明清叙事（2 张 · 2×1）

**装帧语言**：织锦缎面，金线纹样，一冷一暖对照。

| 格 | 书 | 设计规格 |
|---|---|---|
| L | book_060 《儒林外史（选）》※ | 靛青缎面；考棚窗格与纸鹤织纹，银线；竖排题签 |
| R | book_069 《牡丹亭（选）》※ | 藕粉缎面；金线牡丹与柳枝织纹满版；竖排题签 |

```text
Design language: Ming-Qing narrative brocade — satin covers with woven thread patterns; cool silver vs warm gold contrast.
2×1 grid:
1. 《儒林外史（选）}: indigo satin, silver examination-hall lattice and paper-crane woven pattern, vertical title strip
2. 《牡丹亭（选）}: lotus-pink satin, gold peony-and-willow woven repeat, vertical title strip
```

---

## 二、哥特美术素材（§十九 切片制 · 1 张母版出 4 件）

> 母版 **1254×1254**（与中秋母版同尺寸，10-26 实测）；切片规格：横幅 <300KB jpg，纪念牌/饮品/甜品 <80KB png。
> **文字纪律（图南 2026-10-26 修订）**：铭牌藏名纪律仍成立——「红字 A」由游戏内 HTML 盖；**但年份铸在牌上**——铜牌角落铸「2026」数字字样，与以后年份区分（四位数字生成稳定，可入图）。

### 整版正向提示词

```text
一张游戏 UI 素材整版，画布 1254×1254 像素（与中秋素材母版同尺寸），均匀网格排版在深色羊皮纸背景上，中世纪手抄本插画风格，冷银蓝与烛火金的暗色调，无文字、无字母、无人物、无水印。

【元素尺寸纪律（与中秋板对齐，出图即按此比例排布）】
A 区·顶部横幅：全宽横带，宽高比约 3.6:1（宽约 1190、高约 330），占整版顶部约四分之一高。
B 区·纪念牌：竖构图、含完整挂链，宽高比约 3:4（约 360×480），高度约为横幅的 1.5 倍。
C 区·饮品/甜品：小物件各居一格，每个宽高比约 5:4（约 270×230），单个宽约整版的五分之一。
每个元素主体占各自格子的 70–85%，居中不顶格、互不重叠，元素间留白充足。

【A 区内容】缮写室节日横幅：归墟图书馆的哥特式尖拱长窗在万圣夜敞开，一轮巨大的猩红满月悬于拱顶之间，月光照亮窗台上摊开的羊皮卷、墨水瓶与羽毛笔，枯枝从画面两侧探入，几只烛台上的蓝白烛火静静摇曳，远处书架影影绰绰浮起微尘与幽蓝光点，氛围静谧神秘而不恐怖。

【B 区内容】纪念牌：一块长方形黑胡桃木牌，黄铜包角，右上角铜牌铸「2026」字样，牌面中央是野玫瑰与荆棘缠绕的浮雕花环，花心处留空，丝线般的猩红与暗金交织，牌顶有完整挂链，风格古朴精致。

【C 区内容，从左到右】
1. 猩红月夜特饮：高脚玻璃杯，深红宝石色饮品，杯底沉着几颗黑加仑，杯口插一小枝迷迭香与卷曲橙皮，杯壁挂细小水珠；
2. 南瓜灯挞：小南瓜造型的焦糖挞，表面以糖霜勾出笑脸纹路（杰克灯式），旁置一小枝肉桂棒与两片枫叶。

透视轻微俯视，细节丰富。
```

### 负向提示词

```text
文字, 字母, 数字（2026 除外）, 招牌, 水印, 人物, 手, 骷髅, 白骨, 血腥, 恐怖鬼脸, 元素越出格子, 元素互相重叠, 元素过小（低于格内 60%）, 元素顶格不留边, 背景花纹干扰, 网格线, 裁切线, 现代塑料感, 霓虹色, 明亮卡通
```

### 切片表（母版 1254×1254；出图后以实际格位重测微调）

| 文件 | 区域 | 参考裁切框 (x, y, w, h) | 压缩 |
|---|---|---|---|
| `banner_gothic2026.jpg` | A 顶部横幅 | (0, 0, 1254, 345) | ≈1190×330，<300KB jpg |
| `sign_gothic_night.png` | B 纪念牌 | (70, 400, 360, 480) | ≈360×480（含挂链），<80KB png |
| `drink_gothic_moon.png` | C1 限定饮品 | (640, 900, 270, 230) | <80KB png |
| `dessert_pumpkin_tart.png` | C2 限定甜品 | (950, 900, 270, 230) | <80KB png |

### 接线字段模板

```js
// data/event_calendar.js MONTH_BANNERS（照 banner_midautumn2026 条目抄，窗口改 10-28~11-03）
{ id: 'gothic_night', image: 'visual/festival/banner_gothic2026.jpg', start: '10-28', end: '11-03' /* 以现有条目字段为准 */ }

// data/signboards.js（照 mid_autumn_plaque 抄；giftOnly 保留，但发放走任务链，见 §三.4）
gothic_night_plaque: { id: 'gothic_night_plaque', name: '哥特之夜 2026', emoji: '🥀', image: 'visual/signboards/sign_gothic_night.png', price: 0, giftOnly: true, /* buff 字段照抄 */, grantBy: 'event_tasks' /* 新：任务链发放 */ }

// data/cafe.js CAFE_RECIPES +2（材料用魔法南瓜种子，把种瓜→待客串成一条 loop）
{ id: 'gothic_moon_drink', emoji: '🍷', image: 'visual/cafe/drink_gothic_moon.png', nameKey: 'cafeRecipeGothicMoon', material: { seedType: 'magic_pumpkin', count: 2 }, price: 88, favor: 6, unlockLevel: 1, eventId: 'gothic_night' }
{ id: 'pumpkin_tart', emoji: '🥧', image: 'visual/cafe/dessert_pumpkin_tart.png', nameKey: 'cafeRecipePumpkinTart', material: { seedType: 'magic_pumpkin', count: 3 }, price: 96, favor: 7, unlockLevel: 1, eventId: 'gothic_night' }
```

---

## 三、限时内容包（魔法南瓜 / 徽章任务链 / 书籍兑换券）

### 1. 魔法南瓜种子（限时 · 全株限时）

- `data/plants.js` 新增植物 `magic_pumpkin`（见 §2），种子在温室「购买种子」区上架
- **限时规则（v4.1 图南拍板）**：
  - 种子只在窗口内（10-28~11-03）售卖，窗口外下架；**一颗种子一次收成，收获不掉种子**
  - **窗口关闭时，地里未收获的魔法南瓜由系统回收**（History 一条：万圣夜落幕，魔法南瓜化作光尘回位面去了）——节后不留植株、不再获得
  - **不进种子兑换表（SEED_EXCHANGE）、不加嫁接/升级**——独立一次性作物，与常驻植物体系完全隔离
- 定时回收挂点：day-boundary 或登录初始化链检查窗口过期 + 盆内有 magic_pumpkin → 回收（代码缺口入 §5 表）

### 2. 魔法南瓜植物定义（data 草案）

```js
magic_pumpkin: {
  id: 'magic_pumpkin', nameKey: 'plant.magicPumpkin.name', emoji: '🎃',
  art: { 0: 'visual/plants/plant_16_empty_pot.png', 1: 'visual/plants/plant_17_magicpumpkin_sprout.png', 2: 'visual/plants/plant_18_magicpumpkin_vine.png', 3: 'visual/plants/plant_19_magicpumpkin_leafy.png', 4: 'visual/plants/plant_20_magicpumpkin_flower.png', 5: 'visual/plants/plant_21_magicpumpkin_fruit.png' },
  levelNames: ['', '魔芽', '藤蔓', '茂叶', '星花', '魔法南瓜'],
  growthPerLevel: 90,
  harvestAtmosphere: 6, harvestCoins: 80,
  seedCost: 4, eventId: 'gothic_night',
  noSeedDrop: true, // 收获不掉种子（一颗一次；不进 SEED_EXCHANGE、不可嫁接）
  // 以上数值照现有植物表平衡，实施时对齐
}
```

### 3. 魔法南瓜生长图 ×5（立绘 · 单独出图，不进 §二 整版）

> 温室立绘是写实系盆栽摄影感（参考 visual/plants/plant_01~15 风格），与手抄本风的 §二 整版不同，**单独出 5 张**。
> **魔法感处理**：幽蓝微光贯穿五阶段——叶脉透光、藤蔓星点萤光，果实期南瓜带柔和蓝光符文纹（归墟 magic-blue 色系），橙与蓝对照，温馨不阴森。

```text
A potted MAGIC pumpkin plant growth stage sheet, 5 square cells in a row (each cell about 250×250 pixels, matching the existing plant art grid), consistent terracotta pot, camera angle and lighting across all cells, cozy warm greenhouse light with faint arcane blue glow, soft storybook-realistic illustration style. The pot occupies about 60-70% of each cell's width, plant height progresses evenly left to right.

1. Sprout: a small pumpkin sprout with two rounded cotyledon leaves, leaf veins glowing faint arcane blue, in a terracotta pot
2. Vine: a trailing vine with small lobed leaves spilling over the pot's edge, tiny blue firefly-like sparkles along the vine
3. Leafy: a full bushy pumpkin plant with large lobed leaves climbing a small wooden stake, leaves backlit with soft blue glow
4. Flower: the same plant with one large star-shaped golden blossom whose center glows blue
5. Fruit: the same plant carrying one small round orange pumpkin with subtle ribbing and softly glowing arcane blue rune-like markings, leaves slightly autumn-tinted

No text, no watermark, consistent scale progression left to right, magical-but-cozy not spooky.
```

负向：`文字, 水印, 人物, 写实照片感, 背景杂乱, 恐怖阴森, 盆的尺寸不一致`
切 5 张 ≈250×250（与 plant_01~15 对齐），命名 plant_17~21_magicpumpkin_*.png。
切 5 张 400×400（或沿用现有 plant 立绘尺寸），命名 plant_17~21_pumpkin_*.png。

### 4. 徽章任务链（拍板建议 · 图南核心诉求：不再登录即送）

**四任务链「万圣巡馆」**，活动期间（10-28~11-03）全部完成 → 徽章自动挂上展览厅标志牌墙：

| # | 任务 | 口径 |
|---|---|---|
| 1 | 开卷 | 窗口内新获得任意一本哥特之书（红字任一卷 / 酒桶） |
| 2 | 执灯 | 完成 3 次 ≥25 分钟专注 |
| 3 | 种瓜 | 种出魔法南瓜并在窗口内收获 1 次 |
| 4 | 待客 | 售出 1 杯猩红月夜特饮 + 1 份南瓜灯挞 |

设计意图：四条任务正好串起整个活动——买书（商店）、专注（核心玩法）、种瓜（温室新内容）、待客（咖啡角新内容），每条都教玩家玩一块新东西。

**代码缺口（新小模块 `js/core/event-tasks.js`，估 40–60 行）**：
1. 任务定义表（挂 eventId）+ 进度累计挂点（purchaseBook / completeFocus / harvest / cafe 售出四处 +1）
2. 完成后发放徽章（复用 giftOnly 发放链路）
3. 温室页/咖啡角入口挂任务进度小条（可节后补，先 History 记录不挡上线）

### 5. 万圣书籍兑换券（登录即得 · 图南 10-26 加项）

- **发放**：万圣窗口内首次登录自动获得 1 张「万圣节书籍兑换券」（复用中秋礼物窗口/10 月礼物窗口的自动领链路，零新机制）
- **用法**：商店内**兑换任意一本可购买的书**（直购书/DLC 书均可；典藏版、不可购买书天然排除）——购买时抵扣，券即消耗，每人 1 张
- **UI**：持有券时书店出现「🎃 兑换券可用」标记；使用后消失
- **代码缺口**：礼物窗口 +1 条目（发券）、purchaseBook 抵扣钩子（有券则本次价格 0 并销券）、书店标记（3 处小改，入 §6 表）

### 6. ⚠️ 统一 gating 缺口汇总（本次新增的 eventId 消费点）

| 消费点 | 现状 | 做法 |
|---|---|---|
| 咖啡角食谱 | 无 eventId | CAFE_RECIPES 加字段 + 咖啡角渲染过滤（窗口外不显示该食谱） |
| 温室种子 | 无 eventId | 植物定义加字段 + 购买种子区过滤；窗口过期回收盆内魔法南瓜（§3.1） |
| 留声阁音轨 | 无 eventId | TRACK_DEFS 加字段 + 购买列表过滤（§四） |
| 环境音 | 无 eventId | 同上加字段 + 过滤 |
| 徽章发放 | giftOnly 登录发放 | 改任务链判定（§3.4 新模块） |
| 书籍兑换券 | 无 | 礼物窗口发券 + purchaseBook 抵扣（§3.5） |

全部照 `isEventWindowActive()`（event_calendar.js 已导出）一个函数过滤，语义统一：**窗口内可见可买，窗口外隐藏，已购/已获得保留**。

---

## 四、音轨方案（限时 BGM + 限时白噪音）

### 1. 限时 BGM《猩红月夜》（Suno）

```text
A brooding nocturne for a haunted fantasy library on All Hallows' Eve.
Low pipe organ drones, a melancholic solo cello, distant wordless choir pads, a slow ticking clock woven into the rhythm, occasional music-box figures.
Slow tempo, 3/4, spacious and candlelit.
Ethereal but grounded, cold moonlight on old wood and parchment, no vocals, loop-friendly, 1-minute intro then steady body.
```

- 导出 2–3 分钟 mp3 → `audio/music/gothic-moon.mp3`
- `data/music.js TRACK_DEFS` +1：`{ id: 'gothic_moon', name: '猩红月夜', emoji: '🌘', tier: 'any', price: 600, file: 'audio/music/gothic-moon.mp3', festivalKey: 'gothicNight2026' }`

### 2. 限时白噪音《万圣夜书房》

**方案 A（先试 Suno）：**

```text
A seamless dark ambient soundscape of an old library on Halloween night.
Rain against tall arched windows, a low fire crackling in a grate, distant church bells every few minutes, pages turning by themselves now and then, candle wax softly hissing.
No music, no melody, no vocals, continuous texture, loop-friendly.
```

**方案 B（Suno 出不了纯环境轨时）：** 素材站取雨声/壁炉/远钟采样，Audacity 混 2–3 分钟无缝循环（先例：扩列 plan 103 行「生成底 + 素材站雨声」混）。

- 落盘 `audio/ambient/halloween-night.mp3`；环境音数据 +1：`{ id: 'halloween_night', name: '万圣夜书房', emoji: '🕯️', file: 'audio/ambient/halloween-night.mp3', festivalKey: 'gothicNight2026' }`

### 2.5 限时人声曲《死神邀舞》（哥特摇滚音乐剧 · 德语 · 图南 10-27 拍板：语言德语、定价 800）

**风格提示词（Suno）：**

```text
A gothic rock musical number in German — Death personified as a seductive ballroom guest, in the vein of European dark musical theatre.
Male baritone lead vocal in German, smooth and dangerous, theatrical and close-mic; backing choir swells on the chorus.
Pipe organ riffs, electric guitar power chords, cinematic strings, waltz rhythm in rock 3/4, driving drums.
Elegant and seductive rather than brutal — a dance with Death under a scarlet moon.
Clear verse-chorus structure, ~2-3 minutes, ending that fades loop-friendly.
No screaming, no metal growls.
```

**歌词（德语，死亡邀舞 × 图书馆意象；Eselsohr=dog-ear 折角双关保留）：**

```text
[Strophe 1]
Die Kerzen flackern blässer als zuvor,
der Mond hat seine rote Seite gewandt.
Ich hab die Sense hinter'm Regal versteckt —
ein Tanz, Bibliothekar, bevor dein Kapitel end't.

[Pre-Chorus]
Du hörst mein'n Schritt im Regalreihen-Klang,
Walzertakt in Dreiviertelzeit,
ein Blatt, das sich von selber wendet...

[Refrain]
Nimm meine Hand — der letzte Tanz ist der feinste,
wir dreh'n uns durch das blutrote Licht.
Jedes Buch, das du je geliebt, wird nur der kleinste
Schatten neben einer leeren Seite.

[Strophe 2]
Ich tanzte schon mit Königen und Dichtern,
mit Fürstinnen, die vor dem letzten Ton erbebten.
Doch du — du knickst die Ecke deiner eigenen Geschichte,
und das, mein Lieber, lieb' ich über alles — eben.

[Bridge]
(Halbzeit, Orgel schwillt an)
Die Kerzen neigen sich nach vorne,
das Pergament hält seinen Atem fest...
kein Lesezeichen rettet den Moment,
in dem der Tanz das Ende überlebt.

[Letzter Refrain]
Nimm meine Hand — der letzte Tanz ist der feinste,
spür den Dreivierteltakt im alten Holzboden.
Wenn die Musik verstummt, vermisst du dieses Dreh'n —
meine Karte steckt in deinem Codex... geh'n wir?

[Outro]
(geflüstert, Musikkiste verklingt)
Das Licht erlischt... der Walzer bleibt...
Eins... zwei... drei... eins... zwei... drei...
```

- 导出 2–3 分钟 mp3 → `audio/music/death-waltz.mp3`
- `data/music.js TRACK_DEFS` +1：`{ id: 'death_waltz', name: '死神邀舞', emoji: '💀', tier: 'any', price: 800, file: 'audio/music/death-waltz.mp3', festivalKey: 'gothicNight2026' }`
- **接线注记**：TRACK_DEFS 尚无 festivalKey 门控——落轨时给留声阁购买列表渲染加 3 行过滤（照 cafe-panel.js:82 同款），三条音轨一次接完

### 3. gating 语义（拍板建议）

**限时上架 = 限时购买，不是限时收听/食用/种植**：窗口内出现在商店可购买；窗口外下架隐藏，已购保留可听可用。照抄书的 EVENT_WINDOWS 语义，玩家不吃亏、不留遗憾。

---

## 五、制作顺序建议（10-28 倒排）

1. **§二 美术整版**（1 张母版出 4 件：横幅/2026 牌/饮品/甜品）——图到了节日就能挂
2. **南瓜 5 张立绘 + 音轨**（Suno 要试几轮）
3. 封面 11 版节后慢慢补（不挡节日；版 1 哥特两本和版 2 志怪幽玄想蹭氛围可提前）
4. 代码侧（gating 统一接线 + 任务链小模块）可与出图并行，图到即显
