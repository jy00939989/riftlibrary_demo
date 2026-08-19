# 归墟图书馆 · BGM 扩展计划（古典打底 + Suno 改编）

> 目标：以古典名曲为底，用 Suno 做风格化改编，为图书馆补充氛围音乐。
> 基调：温暖、安静、略带奇幻，适配 parchment/wood 视觉与专注/探索两种场景。

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
