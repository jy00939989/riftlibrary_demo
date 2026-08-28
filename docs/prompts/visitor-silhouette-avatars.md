# 访客剪影头像 · 生成提示词

> 用途：为 10 位访客制作统一风格的剪影头像。
> 风格：纯剪影、高辨识度、侧脸或 3/4 视角、图书馆奇幻氛围。

---

## 通用风格公式

```
[角色主体描述], side profile silhouette, solid black silhouette, clean crisp edges,
minimalist avatar, elegant outline, subtle rim light, warm amber background gradient,
library atmosphere, parchment texture, no facial details, no internal lines, high contrast,
square composition, centered, 512x512, illustration, vector-like, fantasy library aesthetic
```

---

## 逐角色提示词

### 1. 沈明远 · 退休文学教授

```
Elderly retired literature professor silhouette, side profile, white hair, round glasses,
holding a book, bow tie, scholarly posture, solid black silhouette, clean edges,
warm amber rim light, parchment background, minimalist avatar, no facial details,
high contrast, square composition, 512x512
```

### 2. 程远 · 焦虑程序员

```
Middle-aged anxious programmer silhouette, side profile, short hair, hoodie or casual shirt,
slightly hunched shoulders, holding a notebook, solid black silhouette, clean edges,
cool blue-grey rim light, subtle digital particles, minimalist avatar, no facial details,
high contrast, square composition, 512x512
```

### 3. 裴舟 · 前独立书店老板

```
Former independent bookstore owner silhouette, side profile, wearing a flat cap or beanie,
carrying a stack of books, apron silhouette, solid black silhouette, clean edges,
warm amber rim light, old paper background, minimalist avatar, no facial details,
high contrast, square composition, 512x512
```

### 4. 简安 · 基层公务员

```
Young civil servant silhouette, side profile, neat short hair, collared shirt, holding a folder,
quiet thoughtful posture, solid black silhouette, clean edges, soft grey rim light,
minimalist avatar, no facial details, high contrast, square composition, 512x512
```

### 5. 江有树 · 待业大学生

```
Young unemployed college graduate silhouette, side profile, hoodie, backpack,
looking downward thoughtfully, solid black silhouette, clean edges, muted green rim light,
minimalist avatar, no facial details, high contrast, square composition, 512x512
```

### 6. 谷雨 · 农村初中女孩

```
Young rural middle school girl silhouette, side profile, braided hair, holding wildflowers,
wearing simple dress, solid black silhouette, clean edges, warm golden rim light,
nature particles, minimalist avatar, no facial details, high contrast,
square composition, 512x512
```

### 7. 乔一一 · 叛逆富家少女

```
Rebellious wealthy teenage girl silhouette, side profile, bob or dyed hair with hairpin,
confident chin-up posture, wearing jacket, solid black silhouette, clean edges,
sparkling magenta rim light, minimalist avatar, no facial details, high contrast,
square composition, 512x512
```

### 8. 谢如归 · I人富二代

```
Introverted young heir silhouette, side profile, neat formal hair, suit jacket,
looking away reserved, hands in pockets, solid black silhouette, clean edges,
cool silver rim light, minimalist avatar, no facial details, high contrast,
square composition, 512x512
```

### 9. 夏蝉 · 大龄练习生

```
Aspiring idol trainee silhouette, side profile, long hair with subtle wave,
dynamic pose with one hand raised gracefully, stage presence, solid black silhouette,
clean edges, spotlight rim light, subtle glitter particles, minimalist avatar,
no facial details, high contrast, square composition, 512x512
```

### 10. 王小磊 · 快递员诗人

```
Courier poet silhouette, side profile, cap, delivery bag strap across shoulder,
holding a folded poem note, solid black silhouette, clean edges, warm orange rim light,
rain or city subtle background, minimalist avatar, no facial details, high contrast,
square composition, 512x512
```

---

## 输出规范

| 项目 | 建议 |
|---|---|
| **尺寸** | 512×512 px |
| **格式** | PNG（透明背景）或带纯色背景 |
| **主色** | 纯黑剪影 `#000000` |
| **背景** | 半透明或统一用游戏 UI 背景色 |
| **裁切** | 头部占画面 70%~80%，头顶留少量空间 |
| **命名** | `visitor_{id}_silhouette.png`，如 `visitor_shenmingyuan_silhouette.png` |

---

## 批量生成建议

如果你用 Midjourney / Nano Banana / GPT Image，可以在通用公式后接「--style raw」或「minimalist, flat design」来避免生成写实细节。

如果剪影内部出现不必要的线条，可以用后期工具（Photoshop / Photopea）手动涂黑，保留外轮廓即可。
