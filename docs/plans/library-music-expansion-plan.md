---
anchors:
  - { type: file, path: "audio/music/theme.mp3", weight: 0.1 }
# 历史路径：覆盖 2026-09-03 提交 8aca59b8，30 天窗口后删除下一行
  - { type: file, path: "audio/湖边早春.mp3", weight: 0.1 }
  - { type: file, path: "audio/music/winter-reverie.mp3", weight: 0.1 }
  - { type: file, path: "audio/music/spring-reverie.mp3", weight: 0.1 }
  - { type: file, path: "audio/music/rhapsody-jazz.mp3", weight: 0.1 }
  - { type: file, path: "audio/music/lakeside-spring.mp3", weight: 0.1 }
  - { type: file, path: "audio/music/arthur-lakeside.mp3", weight: 0.1 }
  - { type: file, path: "data/music.js", weight: 0.1 }
  - { type: file, path: "docs/plans/library-music-expansion-plan.md", weight: 0.1 }
  - { type: file, path: "index.html", weight: 0.1 }
  - { type: file, path: "js/app.js", weight: 0.1 }
  - { type: file, path: "js/audio.js", weight: 0.1 }
  - { type: file, path: "js/core/shop/library-upgrades.js", weight: 0.1 }
  - { type: file, path: "js/i18n/terms.js", weight: 0.1 }
  - { type: file, path: "js/render/index.js", weight: 0.1 }
  - { type: file, path: "js/render/music-room.js", weight: 0.1 }
  - { type: file, path: "js/render/music-selector.js", weight: 0.1 }
  - { type: file, path: "js/render/navigation.js", weight: 0.1 }
  - { type: file, path: "js/render/shop/ambient-shop.js", weight: 0.1 }
  - { type: file, path: "js/render/shop/library-upgrades.js", weight: 0.1 }
  - { type: file, path: "js/render/shop/page.js", weight: 0.1 }
  - { type: file, path: "js/shop.js", weight: 0.1 }
  - { type: file, path: "js/state/migrations.js", weight: 0.1 }
  - { type: file, path: "js/state/state.js", weight: 0.1 }
---

# 归墟图书馆 · BGM 扩展计划（古典打底 + Suno 改编）

> 目标：以古典名曲为底，用 Suno 做风格化改编，为图书馆补充氛围音乐。
> 基调：温暖、安静、略带奇幻，适配 parchment/wood 视觉与专注/探索两种场景。
>
> **时效注记（2026-09-04 对账）**：本方案写于 2026-08-20，此后「留声阁唱片系统」已落地（2026-09-03，亚瑟王之死典藏联动 + 环境音并入独家购买入口）。**本方案只管新曲目制作与选曲**；播放通路、环境音售卖、唱片载体一律以留声阁现状为准，场景分配表中涉及「环境音」的条目按留声阁实际执行。
> **落地注记（2026-09-04 对账，47235db / 8aca59b）**：首期落地推荐中**维瓦尔第《春》《冬》、格什温《蓝色狂想曲》三首意象曲已于 2026-08-28 入库**并在留声阁接线（`data/music.js`，各档定价 400–800💰，「湖边临终的亚瑟王」需 `book_031`）；另有 6 首场馆 tier 演示 BGM（荒废/城镇/星辰 × 基准 + 变奏）同批入库。原 `Suno 音乐生成 4.5_...mp3` 脏文件名已于 8aca59b 改名「湖边早春」。候选表只剩**德沃夏克《自新大陆·第二乐章》**未制作。
> **联动注记（2026-09-20）**：音乐节日半价日系统已上线（`data/event_calendar.js`，6 个 type:'music' 节日，留音阁全场 shopDiscount 0.5 自动生效）——本计划 §八 的作曲家改编曲天然与节日联动：**作曲家诞辰当天，其曲目自动半价**。制作排期可参考节日日历倒排。

---

## 一、曲目候选与场景分配

| 原曲 | 作曲家 | 推荐改编方向 | 适用场景 | 备注 |
|---|---|---|---|---|
| 《四季》 | 维瓦尔第（Vivaldi） | 春/夏做明快专注 BGM；秋做收获/归档；冬做深夜/静谧 | 专注模式、馆内探索、季节活动 | 四首可拆成四条独立轨道 |
| 《第九交响曲「自新大陆」》 | 德沃夏克（Dvořák） | 第二乐章（Largo）改编为治愈/思乡主题 | 深夜独处、玩家下线前、低氛围时 | 用户提到"蓝色狂想曲"，但德沃夏克代表作是《自新大陆》，此处按后者规划 |
| 《蓝色狂想曲》 | 格什温（Gershwin） | 爵士+管弦混编，现代奇幻感 | 特殊事件、灰烬学院联动、非图书馆场景 | 若用户确实想要这首，可单独加一条 |
| 《月光奏鸣曲》第一乐章 | 贝多芬 | 极静、冥想 | 极低氛围、深夜闭馆 | 可选，避免过于沉重 |
| 《牧神午后前奏曲》 | 德彪西 | 朦胧、梦幻 | 星光蕨区域、梦境/灵感事件 | 可选 |

**首期落地推荐**：
1. 维瓦尔第《四季·春》—— 专注 BGM
2. 维瓦尔第《四季·冬》—— 深夜 BGM
3. 德沃夏克《自新大陆·第二乐章》—— 治愈/思乡 BGM
4. （可选）格什温《蓝色狂想曲》片段 —— 事件/联动 BGM

---

## 二、Suno 改编 Prompt 策略

### 通用公式

```
A [mood] reinterpretation of [classical piece] for a cozy fantasy library game.
[Instrumentation]. [Tempo]. [Texture].
Ethereal but grounded, warm wood and parchment atmosphere, no vocals, loop-friendly, 1-minute intro then steady body.
```

### 各曲目 Prompt

#### 1. 维瓦尔第《四季·春》

```
A gentle, sunlit reimagining of Vivaldi's "Spring" for a cozy fantasy library.
Solo violin lead, baroque strings, soft harp arpeggios, warm lute accents.
Moderate tempo, 4/4, light and breathable.
Ethereal but grounded, like morning light through dusty library windows.
No vocals, loop-friendly, 1-minute intro then steady body.
```

#### 2. 维瓦尔第《四季·冬》

```
A quiet, contemplative reinterpretation of Vivaldi's "Winter" for a late-night library.
Solo violin, muted strings, distant bells, soft piano.
Slow tempo, 3/4 feel, sparse and airy.
Cold but safe, like snow outside a warm reading room.
No vocals, loop-friendly, 1-minute intro then steady body.
```

#### 3. 德沃夏克《自新大陆·第二乐章》

```
A warm, nostalgic adaptation of Dvořák's "New World Symphony" 2nd movement.
English horn melody, gentle strings, soft choir pad, distant piano.
Slow and flowing, 4/4, expansive but intimate.
Healing, homesick, hopeful — like closing a good book at midnight.
No vocals, loop-friendly, 1-minute intro then steady body.
```

#### 4. 格什温《蓝色狂想曲》（可选）

```
A magical, slightly jazz-tinged reimagining of Gershwin's "Rhapsody in Blue".
Piano glissandos, clarinet solo, soft brass, modern strings.
Mid-tempo, shifting meters, playful and mysterious.
For special events or a more modern fantasy area.
No vocals, loop-friendly, 1-minute intro then steady body.
```

---

## 三、文件与数据规划

### 文件目录

```
assets/audio/bgm/
  spring_vivaldi.mp3
  winter_vivaldi.mp3
  largo_dvorak.mp3
  rhapsody_gershwin.mp3   # 可选
```

### 数据注册

在 `data/music.js` 或现有 BGM 配置中新增：

```js
export const BGM_TRACKS = {
  spring_vivaldi: {
    id: 'spring_vivaldi',
    nameKey: 'bgm.springVivaldi.name',
    composerKey: 'bgm.springVivaldi.composer',
    src: 'assets/audio/bgm/spring_vivaldi.mp3',
    loop: true,
    scenes: ['focus', 'explore'],
    intensity: 'medium'
  },
  winter_vivaldi: {
    id: 'winter_vivaldi',
    nameKey: 'bgm.winterVivaldi.name',
    composerKey: 'bgm.winterVivaldi.composer',
    src: 'assets/audio/bgm/winter_vivaldi.mp3',
    loop: true,
    scenes: ['night', 'quiet'],
    intensity: 'low'
  },
  largo_dvorak: {
    id: 'largo_dvorak',
    nameKey: 'bgm.largoDvorak.name',
    composerKey: 'bgm.largoDvorak.composer',
    src: 'assets/audio/bgm/largo_dvorak.mp3',
    loop: true,
    scenes: ['heal', 'farewell'],
    intensity: 'low'
  }
};
```

---

## 四、i18n 文案

```js
// zh
'springVivaldi.name': '春·维瓦尔第',
'springVivaldi.composer': '改编自维瓦尔第《四季·春》',
'winterVivaldi.name': '冬·维瓦尔第',
'winterVivaldi.composer': '改编自维瓦尔第《四季·冬》',
'largoDvorak.name': '自新大陆·慢板',
'largoDvorak.composer': '改编自德沃夏克《第九交响曲·第二乐章》',

// en
'springVivaldi.name': 'Spring · Vivaldi',
'springVivaldi.composer': 'Adapted from Vivaldi\'s The Four Seasons: Spring',
'winterVivaldi.name': 'Winter · Vivaldi',
'winterVivaldi.composer': 'Adapted from Vivaldi\'s The Four Seasons: Winter',
'largoDvorak.name': 'Largo · New World',
'largoDvorak.composer': 'Adapted from Dvořák\'s Symphony No. 9 "From the New World"'
```

---

## 五、实现步骤

1. **确定曲目清单**：图南确认是否加入《蓝色狂想曲》/《月光》/《牧神午后》。
2. **生成音频**：用 Suno 按上方 prompt 生成，导出 2~3 分钟 MP3，确保可循环。
3. **压缩与格式**：统一转 MP3 128kbps，控制单首 < 3MB；若浏览器兼容性要求高，可补 OGG。
4. **放入项目**：复制到 `assets/audio/bgm/`，按命名规范重命名。
5. **数据注册**：在 BGM 配置中注册 track，绑定场景与名称 key。
6. **场景切换逻辑**：
   - 专注模式默认播放 `spring_vivaldi`；
   - 21:00~06:00 或低氛围时切换 `winter_vivaldi`/`largo_dvorak`；
   - 保留用户手动切换入口。
7. **i18n 文案**：补中英 track 名称与作曲家说明。
8. **验收**：
   - 切换场景时 BGM 平滑过渡；
   - 英文语言下曲目标题显示英文；
   - 循环无卡顿。

---

## 六、备注

- 古典作品本身已进入公有领域，但 Suno 生成的改编版版权归属需确认；建议保留生成记录与 prompt，避免平台版权争议。
- 若 Suno 生成效果不理想，可改用 Udio / Stable Audio / 本地 LoRA 模型做备选。
- 不部署，等用户后续指令。

---

## 七、图南原创曲 · 「馆长的私人唱片」解锁方案

> 来源：图南自己创作的几首新曲。
> 定位：与现有氛围 BGM（ruined/cozy/stellar）分离，作为「奖励曲/主题变奏」单独成组。
> 目标：让曲子有叙事意义上的获取方式，而不是一上来就躺在列表里。

### 7.1 分类概念

把新曲子归到 **「馆长的私人唱片」**（Curator's Private Collection）分类下：

- 现有 `ruined / cozy / stellar` 是「环境氛围音乐」，随氛围自动切换。
- 新曲子是「奖励曲 / 角色曲 / 主题乐章」，默认不参与自动轮播，解锁后玩家可在音乐选择器里手动点选。

### 7.2 解锁方式

| 解锁方式 | 对应系统 | 适合什么曲风 | 叙事包装 |
|---|---|---|---|
| **植物种子兑换** | `data/plants.js` 的 `SEED_EXCHANGE` 新增 `type: 'music'` | 轻松、日常、循环感强的短曲 | 「某株植物在绽放时，叶脉间漏出了一段旋律」 |
| **访客赠送** | `data/visitor-events.js` 的 `reward` 字段扩展 | 有角色记忆、故事感的曲子 | 「XX 把一张泛黄的唱片放在了缮写室桌上」 |
| **某本书满级** | 书籍 `masteryLevel === 5` 时检测 | 厚重、有终章感的主题乐章 | 「这本书的最后一页夹着一张乐谱」 |

#### 植物兑换

- 放在 `starlight_fern` / `magic_rose` 等高阶种子兑换里。
- 建议成本：**5 颗种子** 换一首循环短曲。
- 命名示例：《浇水时》《午后窗台》《星蕨摇曳》。

#### 访客赠送

- 绑定到对应角色的 **偶层/稀层/终局事件**。
- 如果某首曲子一听就想到某个访客，就让它成为该角色好感度事件的最高奖励。
- 示例：沈明远终局事件赠送一首「牛津记忆」变奏。

#### 书籍满级

- 挑 1~2 本代表性大书（如《亚瑟王之死》《神曲》《庄子》）。
- 当该书 `masteryLevel === 5` 时触发解锁。
- 适合有起承转合、不适合当背景循环的「主题曲」。

### 7.3 数据与实现

在 `js/audio.js` 的 `TRACK_DEFS` 中新增 `tier: 'special'` 曲目：

```js
{ id: 'curator_melody_1', name: '浇水时', emoji: '🌿', tier: 'special', file: 'audio/curator_melody_1.mp3', unlockType: 'seed_exchange', unlockData: { seedType: 'starlight_fern', required: 5 } },
{ id: 'curator_melody_2', name: '牛津记忆', emoji: '📜', tier: 'special', file: 'audio/curator_melody_2.mp3', unlockType: 'visitor_event', unlockData: { visitorId: 'shenmingyuan', eventType: 'rare' } },
{ id: 'curator_melody_3', name: '亚瑟王终章', emoji: '⚔️', tier: 'special', file: 'audio/curator_melody_3.mp3', unlockType: 'book_mastery', unlockData: { bookId: 'book_031', masteryLevel: 5 } }
```

state 中新增：

```js
unlockedTracks: []
```

改动点：
1. `js/audio.js`：扩展 `TRACK_DEFS` 解锁元数据；`getAllTrackDefs()` 返回锁定状态。
2. `js/render/music-selector.js`：`special` 曲目单独分组渲染，显示解锁条件。
3. `data/plants.js`：`SEED_EXCHANGE` 支持 `type: 'music'`。
4. `data/visitor-events.js`：`reward` 支持 `music: 'trackId'`。
5. `js/core/book-progress.js`：书籍满级时检测并解锁对应曲目。
6. 解锁时弹出轻提示：「解锁新曲目：《XX》」。

### 7.4 待图南确认

- [ ] 新曲总数与文件名
- [ ] 每首曲子的大致情绪/风格
- [ ] 是否有明确对应的访客或书籍
- [ ] 是否参与自动 BGM 轮播（默认不建议）

---

## 八、音乐节日联动 · 作曲家诞辰改编队列（2026-09-20 新增）

> 来源：音乐节日半价日上线（6 节日：莫扎特 1/27 · 维瓦尔第 3/4 · 巴赫 3/21 · 爵士日 4/30 · 国际音乐日 10/1 · 贝多芬 12/16）。
> 定位：**「作曲家诞辰系列」改编唱片**——每位作曲家 1-2 首意象曲，走 §二 既有 Suno 管线；节日当天该作曲家曲目自动半价（shopDiscount 乘区已对全部标价曲目生效，零额外代码）。
> 节奏：图南慢慢做，按节日日历倒排优先。做完一首走既有入库链路（`data/music.js` 注册 + 中英曲名 + visit 半价日自动联动）。

### 8.1 节日-作曲家-曲目映射

| 节日 | 日期 | 作曲家/主题 | 已有曲目 | 推荐改编（新） | 优先级 |
|---|---|---|---|---|---|
| 莫扎特诞辰 | 1/27 | 莫扎特 | — | 《小夜曲 K.525》意象曲（明亮专注） | P1 |
| 维瓦尔第诞辰 | 3/4 | 维瓦尔第 | ✅ 冬/春意象曲 | 《四季·秋》意象曲（**凑齐四季**，收获/归档感） | P1 |
| 巴赫诞辰 | 3/21 | 巴赫 | — | **《G 弦上的咏叹调》意象曲**（全馆气质最合）＋备选《郭德堡变奏曲·主题》（深度专注） | **P0** |
| 国际爵士乐日 | 4/30 | 爵士（格什温血统） | ✅ 蓝色狂想曲 | 原创《闭馆后爵士》环境曲（萨克斯慢摇，**避开版权曲目**） | P2 |
| 国际音乐日 | 10/1 | 综合庆典 | — | 《欢乐颂》庆典意象曲（贝九终章改编，全馆暖意） | P2 |
| 贝多芬诞辰 | 12/16 | 贝多芬（与奥斯汀同日，双活动并存） | — | **《月光·第一乐章》意象曲**（深夜闭馆）＋备选《悲怆·第二乐章》 | **P0** |
| （无节日绑定） | — | 德沃夏克 | — | 《自新大陆·第二乐章》（§一遗留候选，深夜治愈常规上架） | P2 |

### 8.2 Suno Prompt（§二 公式体）

**巴赫·G 弦上的咏叹调**（P0，3/21 前出）：
```
A hushed, luminous reimagining of Bach's "Air on the G String" for a cozy fantasy library.
Solo cello over soft synth pads, gentle harpsichord, warm string ensemble.
Slow 4/4, smooth and breathing, like dusk light on old book spines.
No vocals, loop-friendly, 1-minute intro then steady body.
```

**贝多芬·月光第一乐章**（P0，12/16 前出）：
```
A soft, contemplative adaptation of Beethoven's "Moonlight Sonata" 1st movement for a library at closing time.
Felt piano arpeggios, muted pads, distant cello swells.
Very slow, sparse, meditative — candlelight on empty reading desks.
No vocals, loop-friendly, 1-minute intro then steady body.
```

**莫扎特·小夜曲**（P1，1/27 前出）：
```
A light-hearted, sunlit reimagining of Mozart's "Eine kleine Nachtmusik" for a cozy fantasy library.
Strings with music-box accents, playful harp, bright but gentle.
Moderate 4/4, airy and cheerful, like opening the curtains on a good morning.
No vocals, loop-friendly, 1-minute intro then steady body.
```

**维瓦尔第·四季·秋**（P1，凑齐四季）：
```
A rustic, warm reimagining of Vivaldi's "Autumn" for a cozy fantasy library.
Solo violin and lute, light percussion, harvest-dance energy softened for reading.
Moderate tempo, golden and content, like shelved preserves and dried flowers.
No vocals, loop-friendly, 1-minute intro then steady body.
```

**闭馆后爵士**（P2 原创，避开版权）：
```
An original slow jazz nocturne for a fantasy library's after-hours corner.
Smoky saxophone, muted trumpet, brushed drums, upright bass.
Late-night, candlelit, a little sleepy — last cup of tea music.
Instrumental, loop-friendly, 1-minute intro then steady body.
```

**欢乐颂庆典**（P2，10/1 前出）：
```
A warm, celebratory reimagining of Beethoven's "Ode to Joy" for a library festival day.
String ensemble with soft brass, gentle tympani, wordless choir pad.
Stately 4/4, glowing and communal, like the whole hall raising a lamp together.
Instrumental (or wordless choir), loop-friendly, 1-minute intro then steady body.
```

### 8.3 入库规格（沿用既有链路）

- 命名：`bach-air.mp3` / `beethoven-moonlight.mp3` / `mozart-nachtmusik.mp3` / `vivaldi-autumn.mp3` / `after-hours-jazz.mp3` / `ode-to-joy.mp3`
- 注册：`data/music.js` 追加 `tier: 'any'` 条目，定价沿用 400–800 档（P0 两首 600，秋/小夜曲/爵士 500，欢乐颂 700）
- 曲名走 `musicTrack_*` i18n 词条（zh「巴赫·G弦咏叹」/en「Air on the G String · Bach」体例，对齐现有 winter/spring-reverie 格式）
- 验收：节日当天该曲目半价自动生效（shopDiscount 乘区已覆盖，测试断言见 test-music-festival-sale.mjs）；墨墨日记可在节日当天提一句（P3 可选，非本期）

### 8.4 制作队列（todo 同步）

- [ ] P0 巴赫·G 弦（3/21 前）　- [ ] P0 月光（12/16 前）　- [ ] P1 小夜曲（1/27 前）
- [ ] P1 四季·秋（凑齐）　- [ ] P2 自新大陆（遗留候选）　- [ ] P2 闭馆后爵士　- [ ] P2 欢乐颂（10/1 前）
