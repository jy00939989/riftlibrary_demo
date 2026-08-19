# 归墟图书馆 · 书籍封面批量生成提示词（Sprite Sheet 版）

> 目标：为全部 71 本书（33 本主书 + 38 个分卷单元）生成统一风格封面。
> 策略：**每 4 本书生成一张图**，2×2 网格排列，每个格子 512×768px，总画布 1024×1536px。
> 优点：大幅减少 token 消耗和生成次数，同时保持同一分类/风格的系列感。

---

## 零、通用前缀（每次生成前复制）

```text
Generate a sprite sheet of 4 vertical book covers arranged in a 2×2 grid on a single canvas.

Canvas: 1024×1536 pixels total. Each cell is 512×768 pixels (2:3 vertical book cover ratio).
Style: warm hand-painted watercolor, parchment and old leather tones, muted palette, classical book-cover illustration.
Each cover must have a subtle decorative border with gold-foil corner accents and a dark leather spine strip, giving a unified series feel.
No text, no letters, no modern elements.
High detail, centered composition within each cell, consistent warm lighting across all four covers.
```

---

## 历史 · 第 1 组

**Cover 1 (top-left):** 《东京梦华录》 by 孟元老
- Imagery: A bustling Northern Song dynasty street market with lantern-lit wine shops, pagodas, and crowds in misty evening light

**Cover 2 (top-right):** 《史记》 by 司马迁
- Imagery: An ancient bamboo scroll unfurling across a map of empires, bronze vessels, and calligraphy brushes

**Cover 3 (bottom-left):** 《史记》 by 司马迁
- Imagery: An ancient bamboo scroll unfurling across a map of empires, bronze vessels, and calligraphy brushes. This volume focuses on ancient emperors and founding myths

**Cover 4 (bottom-right):** 《史记》 by 司马迁
- Imagery: An ancient bamboo scroll unfurling across a map of empires, bronze vessels, and calligraphy brushes. This volume focuses on Warring States strategists and battles

```text
历史 book covers (2×2 grid):
1. 东京梦华录 by 孟元老: A bustling Northern Song dynasty street market with lantern-lit wine shops, pagodas, and crowds in misty evening light
2. Records of the Grand Historian by 司马迁: An ancient bamboo scroll unfurling across a map of empires, bronze vessels, and calligraphy brushes
3. Records of the Grand Historian by 司马迁: An ancient bamboo scroll unfurling across a map of empires, bronze vessels, and calligraphy brushes. This volume focuses on ancient emperors and founding myths
4. Records of the Grand Historian by 司马迁: An ancient bamboo scroll unfurling across a map of empires, bronze vessels, and calligraphy brushes. This volume focuses on Warring States strategists and battles

Unified style: warm watercolor, parchment/leather tones, gold-foil border accents, no text, 2:3 vertical format, 1024×1536px canvas.
```

---

## 历史 · 第 2 组

**Cover 1 (top-left):** 《史记》 by 司马迁
- Imagery: An ancient bamboo scroll unfurling across a map of empires, bronze vessels, and calligraphy brushes. This volume focuses on Han dynasty splendor and Silk Road

**Cover 2 (top-right):** 《史记》 by 司马迁
- Imagery: An ancient bamboo scroll unfurling across a map of empires, bronze vessels, and calligraphy brushes. This volume focuses on later dynasties and historians

**Cover 3 (bottom-left):** 《英吉利教会史》 by 比德
- Imagery: A medieval English monastery with monks illuminating manuscripts, a stone cross, and Celtic knot borders

**Cover 4 (bottom-right):** 《英吉利教会史》 by 比德
- Imagery: A medieval English monastery with monks illuminating manuscripts, a stone cross, and Celtic knot borders. This volume focuses on ancient Britons and Augustine's mission

```text
历史 book covers (2×2 grid):
1. Records of the Grand Historian by 司马迁: An ancient bamboo scroll unfurling across a map of empires, bronze vessels, and calligraphy brushes. This volume focuses on Han dynasty splendor and Silk Road
2. Records of the Grand Historian by 司马迁: An ancient bamboo scroll unfurling across a map of empires, bronze vessels, and calligraphy brushes. This volume focuses on later dynasties and historians
3. Ecclesiastical History of the English People by 比德: A medieval English monastery with monks illuminating manuscripts, a stone cross, and Celtic knot borders
4. Ecclesiastical History of the English People by 比德: A medieval English monastery with monks illuminating manuscripts, a stone cross, and Celtic knot borders. This volume focuses on ancient Britons and Augustine's mission

Unified style: warm watercolor, parchment/leather tones, gold-foil border accents, no text, 2:3 vertical format, 1024×1536px canvas.
```

---

## 历史 · 第 3 组

**Cover 1 (top-left):** 《英吉利教会史》 by 比德
- Imagery: A medieval English monastery with monks illuminating manuscripts, a stone cross, and Celtic knot borders. This volume focuses on Northumbrian conversion and Christian kings

**Cover 2 (top-right):** 《英吉利教会史》 by 比德
- Imagery: A medieval English monastery with monks illuminating manuscripts, a stone cross, and Celtic knot borders. This volume focuses on saints, poets, and unified church

```text
历史 book covers (2×2 grid):
1. Ecclesiastical History of the English People by 比德: A medieval English monastery with monks illuminating manuscripts, a stone cross, and Celtic knot borders. This volume focuses on Northumbrian conversion and Christian kings
2. Ecclesiastical History of the English People by 比德: A medieval English monastery with monks illuminating manuscripts, a stone cross, and Celtic knot borders. This volume focuses on saints, poets, and unified church

Unified style: warm watercolor, parchment/leather tones, gold-foil border accents, no text, 2:3 vertical format, 1024×1536px canvas.
```

---

## 哲学 · 第 1 组

**Cover 1 (top-left):** 《庄子》 by 庄周
- Imagery: A giant butterfly soaring over misty mountains, a gnarled pine tree, an ancient scholar in flowing robes

**Cover 2 (top-right):** 《纯粹理性批判》 by 康德
- Imagery: A starry night sky above an 18th-century study with an open book, compass, and candlelight

**Cover 3 (bottom-left):** 《道德经》 by 老子
- Imagery: An old sage riding an ox through mountain mist, a simple scroll, yin-yang symbol subtly in the clouds

**Cover 4 (bottom-right):** 《沉思录》 by 马可·奥勒留
- Imagery: A Roman emperor in armor writing by lamplight, marble columns, a stoic laurel wreath, warm golden tones

```text
哲学 book covers (2×2 grid):
1. 庄子 by 庄周: A giant butterfly soaring over misty mountains, a gnarled pine tree, an ancient scholar in flowing robes
2. Critique of Pure Reason by 康德: A starry night sky above an 18th-century study with an open book, compass, and candlelight
3. Tao Te Ching by 老子: An old sage riding an ox through mountain mist, a simple scroll, yin-yang symbol subtly in the clouds
4. Meditations by 马可·奥勒留: A Roman emperor in armor writing by lamplight, marble columns, a stoic laurel wreath, warm golden tones

Unified style: warm watercolor, parchment/leather tones, gold-foil border accents, no text, 2:3 vertical format, 1024×1536px canvas.
```

---

## 哲学 · 第 2 组

**Cover 1 (top-left):** 《理想国》 by 柏拉图
- Imagery: A classical Greek cave with prisoners watching shadows on a wall, sunlight above, ideal city in the distance

**Cover 2 (top-right):** 《理想国》 by 柏拉图
- Imagery: A classical Greek cave with prisoners watching shadows on a wall, sunlight above, ideal city in the distance. This volume focuses on Socrates debating in the agora

**Cover 3 (bottom-left):** 《理想国》 by 柏拉图
- Imagery: A classical Greek cave with prisoners watching shadows on a wall, sunlight above, ideal city in the distance. This volume focuses on the allegory of the cave and the ideal city

**Cover 4 (bottom-right):** 《卡拉马佐夫兄弟》 by 陀思妥耶夫斯基
- Imagery: A Russian Orthodox church with candlelit windows, a family gathered around an old table, dark emotional atmosphere

```text
哲学 book covers (2×2 grid):
1. The Republic by 柏拉图: A classical Greek cave with prisoners watching shadows on a wall, sunlight above, ideal city in the distance
2. The Republic by 柏拉图: A classical Greek cave with prisoners watching shadows on a wall, sunlight above, ideal city in the distance. This volume focuses on Socrates debating in the agora
3. The Republic by 柏拉图: A classical Greek cave with prisoners watching shadows on a wall, sunlight above, ideal city in the distance. This volume focuses on the allegory of the cave and the ideal city
4. The Brothers Karamazov by 陀思妥耶夫斯基: A Russian Orthodox church with candlelit windows, a family gathered around an old table, dark emotional atmosphere

Unified style: warm watercolor, parchment/leather tones, gold-foil border accents, no text, 2:3 vertical format, 1024×1536px canvas.
```

---

## 哲学 · 第 3 组

**Cover 1 (top-left):** 《卡拉马佐夫兄弟》 by 陀思妥耶夫斯基
- Imagery: A Russian Orthodox church with candlelit windows, a family gathered around an old table, dark emotional atmosphere. This volume focuses on the Karamazov family gathered

**Cover 2 (top-right):** 《卡拉马佐夫兄弟》 by 陀思妥耶夫斯基
- Imagery: A Russian Orthodox church with candlelit windows, a family gathered around an old table, dark emotional atmosphere. This volume focuses on faith and doubt in the monastery

**Cover 3 (bottom-left):** 《卡拉马佐夫兄弟》 by 陀思妥耶夫斯基
- Imagery: A Russian Orthodox church with candlelit windows, a family gathered around an old table, dark emotional atmosphere. This volume focuses on the trial and the brothers' fates

**Cover 4 (bottom-right):** 《社会契约论》 by 卢梭
- Imagery: A quill signing a social contract on a wooden table, chains breaking, a rising sun over a free city

```text
哲学 book covers (2×2 grid):
1. The Brothers Karamazov by 陀思妥耶夫斯基: A Russian Orthodox church with candlelit windows, a family gathered around an old table, dark emotional atmosphere. This volume focuses on the Karamazov family gathered
2. The Brothers Karamazov by 陀思妥耶夫斯基: A Russian Orthodox church with candlelit windows, a family gathered around an old table, dark emotional atmosphere. This volume focuses on faith and doubt in the monastery
3. The Brothers Karamazov by 陀思妥耶夫斯基: A Russian Orthodox church with candlelit windows, a family gathered around an old table, dark emotional atmosphere. This volume focuses on the trial and the brothers' fates
4. The Social Contract by 卢梭: A quill signing a social contract on a wooden table, chains breaking, a rising sun over a free city

Unified style: warm watercolor, parchment/leather tones, gold-foil border accents, no text, 2:3 vertical format, 1024×1536px canvas.
```

---

## 哲学 · 第 4 组

**Cover 1 (top-left):** 《第一哲学沉思集》 by 笛卡尔
- Imagery: A candlelit study with a figure at a desk, a wax seal, a melting candle, the phrase "I think therefore I am" implied

**Cover 2 (top-right):** 《传习录》 by 王阳明
- Imagery: A Ming dynasty scholar standing by a mountain stream, plum blossoms, a heart-shaped moon reflection in water

**Cover 3 (bottom-left):** 《菜根谭选》 by 洪应明
- Imagery: A simple porcelain teacup, a gnarled pine branch, misty mountains, ink-wash texture with gold seal accents

```text
哲学 book covers (2×2 grid):
1. Meditations on First Philosophy by 笛卡尔: A candlelit study with a figure at a desk, a wax seal, a melting candle, the phrase "I think therefore I am" implied
2. Instructions for Practical Living by 王阳明: A Ming dynasty scholar standing by a mountain stream, plum blossoms, a heart-shaped moon reflection in water
3. Selected Vegetable Roots Discourse by 洪应明: A simple porcelain teacup, a gnarled pine branch, misty mountains, ink-wash texture with gold seal accents

Unified style: warm watercolor, parchment/leather tones, gold-foil border accents, no text, 2:3 vertical format, 1024×1536px canvas.
```

---

## 寓言 · 第 1 组

**Cover 1 (top-left):** 《动物农场》 by 乔治·奥威尔
- Imagery: A farmyard with a pig and a horse standing before a weathered barn, a green flag with hoof and horn, stormy sky

**Cover 2 (top-right):** 《伊索寓言选》 by 伊索
- Imagery: A fox and a crow beneath a grape vine, a tortoise and hare on a country road, classical Greek pottery style

```text
寓言 book covers (2×2 grid):
1. Animal Farm by 乔治·奥威尔: A farmyard with a pig and a horse standing before a weathered barn, a green flag with hoof and horn, stormy sky
2. Selected Aesop\ by 伊索: A fox and a crow beneath a grape vine, a tortoise and hare on a country road, classical Greek pottery style

Unified style: warm watercolor, parchment/leather tones, gold-foil border accents, no text, 2:3 vertical format, 1024×1536px canvas.
```

---

## 小说 · 第 1 组

**Cover 1 (top-left):** 《老人与海》 by 海明威
- Imagery: A small weathered skiff on a vast grey-blue ocean, a giant marlin skeleton beneath the surface, distant clouds

**Cover 2 (top-right):** 《傲慢与偏见》 by 简·奥斯汀
- Imagery: A Regency-era English manor with a woman in a long dress reading a letter, a feather quill, and rose gardens

**Cover 3 (bottom-left):** 《红楼梦》 by 曹雪芹
- Imagery: A traditional Chinese garden pavilion with red lanterns, blooming crabapple, jade hairpins, and falling petals

**Cover 4 (bottom-right):** 《红楼梦》 by 曹雪芹
- Imagery: A traditional Chinese garden pavilion with red lanterns, blooming crabapple, jade hairpins, and falling petals. This volume focuses on Daguan Garden entrance and Daiyu burying flowers

```text
小说 book covers (2×2 grid):
1. 老人与海 by 海明威: A small weathered skiff on a vast grey-blue ocean, a giant marlin skeleton beneath the surface, distant clouds
2. 傲慢与偏见 by 简·奥斯汀: A Regency-era English manor with a woman in a long dress reading a letter, a feather quill, and rose gardens
3. Dream of the Red Chamber by 曹雪芹: A traditional Chinese garden pavilion with red lanterns, blooming crabapple, jade hairpins, and falling petals
4. Dream of the Red Chamber by 曹雪芹: A traditional Chinese garden pavilion with red lanterns, blooming crabapple, jade hairpins, and falling petals. This volume focuses on Daguan Garden entrance and Daiyu burying flowers

Unified style: warm watercolor, parchment/leather tones, gold-foil border accents, no text, 2:3 vertical format, 1024×1536px canvas.
```

---

## 小说 · 第 2 组

**Cover 1 (top-left):** 《红楼梦》 by 曹雪芹
- Imagery: A traditional Chinese garden pavilion with red lanterns, blooming crabapple, jade hairpins, and falling petals. This volume focuses on poetry club and Baoyu's jade

**Cover 2 (top-right):** 《红楼梦》 by 曹雪芹
- Imagery: A traditional Chinese garden pavilion with red lanterns, blooming crabapple, jade hairpins, and falling petals. This volume focuses on Jia family decline and monk's departure

**Cover 3 (bottom-left):** 《西游记》 by 吴承恩
- Imagery: A monkey king wielding a staff standing on a cloud, celestial palace gates, peaches of immortality

**Cover 4 (bottom-right):** 《西游记》 by 吴承恩
- Imagery: A monkey king wielding a staff standing on a cloud, celestial palace gates, peaches of immortality. This volume focuses on Monkey King born from stone and havoc in heaven

```text
小说 book covers (2×2 grid):
1. Dream of the Red Chamber by 曹雪芹: A traditional Chinese garden pavilion with red lanterns, blooming crabapple, jade hairpins, and falling petals. This volume focuses on poetry club and Baoyu's jade
2. Dream of the Red Chamber by 曹雪芹: A traditional Chinese garden pavilion with red lanterns, blooming crabapple, jade hairpins, and falling petals. This volume focuses on Jia family decline and monk's departure
3. Journey to the West by 吴承恩: A monkey king wielding a staff standing on a cloud, celestial palace gates, peaches of immortality
4. Journey to the West by 吴承恩: A monkey king wielding a staff standing on a cloud, celestial palace gates, peaches of immortality. This volume focuses on Monkey King born from stone and havoc in heaven

Unified style: warm watercolor, parchment/leather tones, gold-foil border accents, no text, 2:3 vertical format, 1024×1536px canvas.
```

---

## 小说 · 第 3 组

**Cover 1 (top-left):** 《西游记》 by 吴承恩
- Imagery: A monkey king wielding a staff standing on a cloud, celestial palace gates, peaches of immortality. This volume focuses on journey begins and three disciples gather

**Cover 2 (top-right):** 《西游记》 by 吴承恩
- Imagery: A monkey king wielding a staff standing on a cloud, celestial palace gates, peaches of immortality. This volume focuses on demons and trials on the road west

**Cover 3 (bottom-left):** 《西游记》 by 吴承恩
- Imagery: A monkey king wielding a staff standing on a cloud, celestial palace gates, peaches of immortality. This volume focuses on kingdom of women and flaming mountain

**Cover 4 (bottom-right):** 《西游记》 by 吴承恩
- Imagery: A monkey king wielding a staff standing on a cloud, celestial palace gates, peaches of immortality. This volume focuses on battles with bull demon and heavenly help

```text
小说 book covers (2×2 grid):
1. Journey to the West by 吴承恩: A monkey king wielding a staff standing on a cloud, celestial palace gates, peaches of immortality. This volume focuses on journey begins and three disciples gather
2. Journey to the West by 吴承恩: A monkey king wielding a staff standing on a cloud, celestial palace gates, peaches of immortality. This volume focuses on demons and trials on the road west
3. Journey to the West by 吴承恩: A monkey king wielding a staff standing on a cloud, celestial palace gates, peaches of immortality. This volume focuses on kingdom of women and flaming mountain
4. Journey to the West by 吴承恩: A monkey king wielding a staff standing on a cloud, celestial palace gates, peaches of immortality. This volume focuses on battles with bull demon and heavenly help

Unified style: warm watercolor, parchment/leather tones, gold-foil border accents, no text, 2:3 vertical format, 1024×1536px canvas.
```

---

## 小说 · 第 4 组

**Cover 1 (top-left):** 《西游记》 by 吴承恩
- Imagery: A monkey king wielding a staff standing on a cloud, celestial palace gates, peaches of immortality. This volume focuses on reaching the West and attaining Buddhahood

**Cover 2 (top-right):** 《鲁滨逊漂流记》 by 丹尼尔·笛福
- Imagery: A lone figure standing on a tropical beach with a crude shelter, palm trees, and a footprint in the sand

**Cover 3 (bottom-left):** 《亚瑟王之死》 by 托马斯·马洛礼
- Imagery: A sword in a stone, a round table with knights, a grail glowing with golden light, misty Camelot castle

**Cover 4 (bottom-right):** 《亚瑟王之死》 by 托马斯·马洛礼
- Imagery: A sword in a stone, a round table with knights, a grail glowing with golden light, misty Camelot castle. This volume focuses on the sword in the stone and Round Table founding

```text
小说 book covers (2×2 grid):
1. Journey to the West by 吴承恩: A monkey king wielding a staff standing on a cloud, celestial palace gates, peaches of immortality. This volume focuses on reaching the West and attaining Buddhahood
2. Robinson Crusoe by 丹尼尔·笛福: A lone figure standing on a tropical beach with a crude shelter, palm trees, and a footprint in the sand
3. Le Morte d by 托马斯·马洛礼: A sword in a stone, a round table with knights, a grail glowing with golden light, misty Camelot castle
4. Le Morte d by 托马斯·马洛礼: A sword in a stone, a round table with knights, a grail glowing with golden light, misty Camelot castle. This volume focuses on the sword in the stone and Round Table founding

Unified style: warm watercolor, parchment/leather tones, gold-foil border accents, no text, 2:3 vertical format, 1024×1536px canvas.
```

---

## 小说 · 第 5 组

**Cover 1 (top-left):** 《亚瑟王之死》 by 托马斯·马洛礼
- Imagery: A sword in a stone, a round table with knights, a grail glowing with golden light, misty Camelot castle. This volume focuses on knightly adventures and forbidden love

**Cover 2 (top-right):** 《亚瑟王之死》 by 托马斯·马洛礼
- Imagery: A sword in a stone, a round table with knights, a grail glowing with golden light, misty Camelot castle. This volume focuses on the Holy Grail quest

**Cover 3 (bottom-left):** 《亚瑟王之死》 by 托马斯·马洛礼
- Imagery: A sword in a stone, a round table with knights, a grail glowing with golden light, misty Camelot castle. This volume focuses on civil war and Arthur's final battle

**Cover 4 (bottom-right):** 《秘密花园》 by 弗朗西丝·霍奇森·伯内特
- Imagery: An old stone wall covered with ivy and climbing roses, a weathered wooden door slightly ajar, a robin perched on the handle

```text
小说 book covers (2×2 grid):
1. Le Morte d by 托马斯·马洛礼: A sword in a stone, a round table with knights, a grail glowing with golden light, misty Camelot castle. This volume focuses on knightly adventures and forbidden love
2. Le Morte d by 托马斯·马洛礼: A sword in a stone, a round table with knights, a grail glowing with golden light, misty Camelot castle. This volume focuses on the Holy Grail quest
3. Le Morte d by 托马斯·马洛礼: A sword in a stone, a round table with knights, a grail glowing with golden light, misty Camelot castle. This volume focuses on civil war and Arthur's final battle
4. The Secret Garden by 弗朗西丝·霍奇森·伯内特: An old stone wall covered with ivy and climbing roses, a weathered wooden door slightly ajar, a robin perched on the handle

Unified style: warm watercolor, parchment/leather tones, gold-foil border accents, no text, 2:3 vertical format, 1024×1536px canvas.
```

---

## 小说 · 第 6 组

**Cover 1 (top-left):** 《秘密花园》 by 弗朗西丝·霍奇森·伯内特
- Imagery: An old stone wall covered with ivy and climbing roses, a weathered wooden door slightly ajar, a robin perched on the handle. This volume focuses on the locked garden gate and hidden key

**Cover 2 (top-right):** 《秘密花园》 by 弗朗西丝·霍奇森·伯内特
- Imagery: An old stone wall covered with ivy and climbing roses, a weathered wooden door slightly ajar, a robin perched on the handle. This volume focuses on spring blooming and children laughing in the garden

```text
小说 book covers (2×2 grid):
1. The Secret Garden by 弗朗西丝·霍奇森·伯内特: An old stone wall covered with ivy and climbing roses, a weathered wooden door slightly ajar, a robin perched on the handle. This volume focuses on the locked garden gate and hidden key
2. The Secret Garden by 弗朗西丝·霍奇森·伯内特: An old stone wall covered with ivy and climbing roses, a weathered wooden door slightly ajar, a robin perched on the handle. This volume focuses on spring blooming and children laughing in the garden

Unified style: warm watercolor, parchment/leather tones, gold-foil border accents, no text, 2:3 vertical format, 1024×1536px canvas.
```

---

## 散文 · 第 1 组

**Cover 1 (top-left):** 《图书馆指南》 by 墨墨
- Imagery: An owl perched on a bookshelf in a cozy library, an open guidebook, ink bottle, and warm candlelight

```text
散文 book covers (2×2 grid):
1. A Guide to the Library by 墨墨: An owl perched on a bookshelf in a cozy library, an open guidebook, ink bottle, and warm candlelight

Unified style: warm watercolor, parchment/leather tones, gold-foil border accents, no text, 2:3 vertical format, 1024×1536px canvas.
```

---

## 科学 · 第 1 组

**Cover 1 (top-left):** 《本草纲目·草部》 by 李时珍
- Imagery: An ornate herbal medicine cabinet with dried herbs, porcelain jars, mountain scrolls, and gold seal accents

**Cover 2 (top-right):** 《本草纲目·草部》 by 李时珍
- Imagery: An ornate herbal medicine cabinet with dried herbs, porcelain jars, mountain scrolls, and gold seal accents. This volume focuses on wild mountain herbs and ginseng roots

**Cover 3 (bottom-left):** 《本草纲目·草部》 by 李时珍
- Imagery: An ornate herbal medicine cabinet with dried herbs, porcelain jars, mountain scrolls, and gold seal accents. This volume focuses on collected dried herbs in porcelain jars

**Cover 4 (bottom-right):** 《物种起源》 by 达尔文
- Imagery: A branching tree of life illustration with finches, tortoises, and tropical plants, vintage naturalist style

```text
科学 book covers (2×2 grid):
1. 本草纲目·草部 by 李时珍: An ornate herbal medicine cabinet with dried herbs, porcelain jars, mountain scrolls, and gold seal accents
2. 本草纲目·草部 by 李时珍: An ornate herbal medicine cabinet with dried herbs, porcelain jars, mountain scrolls, and gold seal accents. This volume focuses on wild mountain herbs and ginseng roots
3. 本草纲目·草部 by 李时珍: An ornate herbal medicine cabinet with dried herbs, porcelain jars, mountain scrolls, and gold seal accents. This volume focuses on collected dried herbs in porcelain jars
4. 物种起源 by 达尔文: A branching tree of life illustration with finches, tortoises, and tropical plants, vintage naturalist style

Unified style: warm watercolor, parchment/leather tones, gold-foil border accents, no text, 2:3 vertical format, 1024×1536px canvas.
```

---

## 科学 · 第 2 组

**Cover 1 (top-left):** 《物种起源》 by 达尔文
- Imagery: A branching tree of life illustration with finches, tortoises, and tropical plants, vintage naturalist style. This volume focuses on Galapagos finches and volcanic islands

**Cover 2 (top-right):** 《物种起源》 by 达尔文
- Imagery: A branching tree of life illustration with finches, tortoises, and tropical plants, vintage naturalist style. This volume focuses on diverse tropical species and evolutionary tree

**Cover 3 (bottom-left):** 《几何原本》 by 欧几里得
- Imagery: An open ancient geometry book with compass, straightedge, intersecting circles, and constellation patterns

**Cover 4 (bottom-right):** 《几何原本》 by 欧几里得
- Imagery: An open ancient geometry book with compass, straightedge, intersecting circles, and constellation patterns. This volume focuses on triangles and parallel lines

```text
科学 book covers (2×2 grid):
1. 物种起源 by 达尔文: A branching tree of life illustration with finches, tortoises, and tropical plants, vintage naturalist style. This volume focuses on Galapagos finches and volcanic islands
2. 物种起源 by 达尔文: A branching tree of life illustration with finches, tortoises, and tropical plants, vintage naturalist style. This volume focuses on diverse tropical species and evolutionary tree
3. Elements by 欧几里得: An open ancient geometry book with compass, straightedge, intersecting circles, and constellation patterns
4. Elements by 欧几里得: An open ancient geometry book with compass, straightedge, intersecting circles, and constellation patterns. This volume focuses on triangles and parallel lines

Unified style: warm watercolor, parchment/leather tones, gold-foil border accents, no text, 2:3 vertical format, 1024×1536px canvas.
```

---

## 科学 · 第 3 组

**Cover 1 (top-left):** 《几何原本》 by 欧几里得
- Imagery: An open ancient geometry book with compass, straightedge, intersecting circles, and constellation patterns. This volume focuses on circles and proportions

**Cover 2 (top-right):** 《几何原本》 by 欧几里得
- Imagery: An open ancient geometry book with compass, straightedge, intersecting circles, and constellation patterns. This volume focuses on golden ratio and prime numbers

**Cover 3 (bottom-left):** 《几何原本》 by 欧几里得
- Imagery: An open ancient geometry book with compass, straightedge, intersecting circles, and constellation patterns. This volume focuses on solid geometry and cosmic solids

```text
科学 book covers (2×2 grid):
1. Elements by 欧几里得: An open ancient geometry book with compass, straightedge, intersecting circles, and constellation patterns. This volume focuses on circles and proportions
2. Elements by 欧几里得: An open ancient geometry book with compass, straightedge, intersecting circles, and constellation patterns. This volume focuses on golden ratio and prime numbers
3. Elements by 欧几里得: An open ancient geometry book with compass, straightedge, intersecting circles, and constellation patterns. This volume focuses on solid geometry and cosmic solids

Unified style: warm watercolor, parchment/leather tones, gold-foil border accents, no text, 2:3 vertical format, 1024×1536px canvas.
```

---

## 童话 · 第 1 组

**Cover 1 (top-left):** 《小王子》 by 安托万·德·圣-埃克苏佩里
- Imagery: A small golden-haired prince standing on a tiny asteroid with a rose under a glass dome, stars and comets in the background

**Cover 2 (top-right):** 《绿野仙踪》 by 莱曼·弗兰克·鲍姆
- Imagery: A yellow brick road winding through a fantastical landscape with a scarecrow, tin man, and lion walking together

**Cover 3 (bottom-left):** 《爱丽丝梦游奇境》 by 刘易斯·卡罗尔
- Imagery: A white rabbit with a pocket watch running down a rabbit hole, oversized mushrooms, teacups floating

```text
童话 book covers (2×2 grid):
1. The Little Prince by 安托万·德·圣-埃克苏佩里: A small golden-haired prince standing on a tiny asteroid with a rose under a glass dome, stars and comets in the background
2. The Wonderful Wizard of Oz by 莱曼·弗兰克·鲍姆: A yellow brick road winding through a fantastical landscape with a scarecrow, tin man, and lion walking together
3. Alice by 刘易斯·卡罗尔: A white rabbit with a pocket watch running down a rabbit hole, oversized mushrooms, teacups floating

Unified style: warm watercolor, parchment/leather tones, gold-foil border accents, no text, 2:3 vertical format, 1024×1536px canvas.
```

---

## 诗歌 · 第 1 组

**Cover 1 (top-left):** 《诗经》 by 孔子编订
- Imagery: A field of millet and wildflowers with a bamboo flute, a moon over a river, classical Chinese poetry atmosphere

**Cover 2 (top-right):** 《飞鸟集》 by 拉宾德拉纳特·泰戈尔
- Imagery: A flock of birds flying across a sunset sky over a calm river, delicate flowers, and distant mountains

**Cover 3 (bottom-left):** 《坎特伯雷故事集》 by 杰弗里·乔叟
- Imagery: A group of medieval pilgrims riding horses along a country road toward Canterbury Cathedral, spring flowers

**Cover 4 (bottom-right):** 《坎特伯雷故事集》 by 杰弗里·乔叟
- Imagery: A group of medieval pilgrims riding horses along a country road toward Canterbury Cathedral, spring flowers. This volume focuses on knight, miller, and steward tales

```text
诗歌 book covers (2×2 grid):
1. The Book of Songs by 孔子编订: A field of millet and wildflowers with a bamboo flute, a moon over a river, classical Chinese poetry atmosphere
2. Stray Birds by 拉宾德拉纳特·泰戈尔: A flock of birds flying across a sunset sky over a calm river, delicate flowers, and distant mountains
3. The Canterbury Tales by 杰弗里·乔叟: A group of medieval pilgrims riding horses along a country road toward Canterbury Cathedral, spring flowers
4. The Canterbury Tales by 杰弗里·乔叟: A group of medieval pilgrims riding horses along a country road toward Canterbury Cathedral, spring flowers. This volume focuses on knight, miller, and steward tales

Unified style: warm watercolor, parchment/leather tones, gold-foil border accents, no text, 2:3 vertical format, 1024×1536px canvas.
```

---

## 诗歌 · 第 2 组

**Cover 1 (top-left):** 《坎特伯雷故事集》 by 杰弗里·乔叟
- Imagery: A group of medieval pilgrims riding horses along a country road toward Canterbury Cathedral, spring flowers. This volume focuses on scholar, merchant, and squire stories

**Cover 2 (top-right):** 《坎特伯雷故事集》 by 杰弗里·乔叟
- Imagery: A group of medieval pilgrims riding horses along a country road toward Canterbury Cathedral, spring flowers. This volume focuses on clerk, nun, and parson pilgrims

**Cover 3 (bottom-left):** 《十四行诗集》 by 莎士比亚
- Imagery: A red rose and a single sonnet scroll, a quill pen, warm Renaissance light, delicate gold filigree

```text
诗歌 book covers (2×2 grid):
1. The Canterbury Tales by 杰弗里·乔叟: A group of medieval pilgrims riding horses along a country road toward Canterbury Cathedral, spring flowers. This volume focuses on scholar, merchant, and squire stories
2. The Canterbury Tales by 杰弗里·乔叟: A group of medieval pilgrims riding horses along a country road toward Canterbury Cathedral, spring flowers. This volume focuses on clerk, nun, and parson pilgrims
3. Shakespeare by 莎士比亚: A red rose and a single sonnet scroll, a quill pen, warm Renaissance light, delicate gold filigree

Unified style: warm watercolor, parchment/leather tones, gold-foil border accents, no text, 2:3 vertical format, 1024×1536px canvas.
```

---

## 文件命名规范

生成后切图保存为：

```
visual/books/book_001.png
visual/books/book_002.png
...
visual/books/book_034_vol1.png
visual/books/book_034_vol2.png
```

- 主书：`{bookId}.png`
- 分卷：`{bookId}_vol{n}.png`
- 切图尺寸：512×768px

---

## 生成优先级建议

1. **第一批**：童话/寓言（小王子、绿野仙踪、爱丽丝、动物农场、伊索寓言）
2. **第二批**：小说（老人与海、傲慢与偏见、鲁滨逊漂流记、秘密花园）
3. **第三批**：哲学（道德经、庄子、沉思录、菜根谭、传习录）
4. **第四批**：诗歌（诗经、飞鸟集、十四行诗、坎特伯雷故事集）
5. **第五批**：历史/科学（东京梦华录、史记、本草纲目、物种起源、几何原本）
6. **第六批**：长书分卷 + 典藏版（红楼梦、西游记、理想国、卡拉马佐夫兄弟、亚瑟王之死、英吉利教会史）
7. **最后**：图书馆指南（单独一本，可与其他散文类合并）
