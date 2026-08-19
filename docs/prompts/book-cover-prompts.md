# 归墟图书馆 · 书籍封面制作指南

> 目标：为每本书生成统一风格的封面图，替换书架卡片上的 emoji，增强视觉识别与收藏感。
> 范围：先覆盖核心/高频书籍，再逐步补全全部书目。

---

## 一、文件规范

### 1.1 存放路径

```
visual/books/
  book_001.png
  book_002.png
  book_003.png
  ...
  book_034.png
  book_034_vol1.png
  book_034_vol2.png
```

- 典藏版：`{bookId}.png`
- 单卷书：`{bookId}_vol{n}.png`
- 若某本书暂无封面，渲染层自动回退到 `book.emoji`。

### 1.2 图片规格

| 项目 | 建议值 | 说明 |
|---|---|---|
| 尺寸 | 512×768 像素 | 竖版书封比例 2:3 |
| 格式 | PNG | 支持透明或实底 |
| 风格 | 暖调手绘插画 | 与图书馆 parchment/wood 氛围协调 |
| 背景 | 实色或浅纹理 | 避免透明导致书架背景干扰 |
| 标题文字 | 可带可不帶 | 若带文字，需保证小尺寸下可辨；建议由游戏 UI 层显示书名，封面以意象为主 |

### 1.3 显示尺寸

书架卡片上的封面显示区域约为 **120×180px**，证书/详情页可显示更大。生成 512×768 可保证缩放清晰。

---

## 二、风格指南

### 2.1 整体调性

- **时代感**：古典但不陈旧，像一本被精心修复过的旧书。
- **色彩**：暖棕、暗金、深绿、赭石、旧纸黄为主；避免荧光色和过高饱和。
- **笔触**：水彩、木刻、铜版画质感均可；保持系列感，建议同一批用同一模型/画师风格。
- **元素**：每本书取 1~2 个核心意象，不堆砌。例如：
  - 《老人与海》→ 独木舟、大鱼骨架、灰蓝海面
  - 《傲慢与偏见》→ 摄政-era 庄园、羽毛笔、书信
  - 《秘密花园》→ 锁住的园门、玫瑰、知更鸟

### 2.2 统一边框（可选）

可为所有封面加统一的装饰边框：
- 深棕色皮革纹理书脊
- 四角烫金花纹
- 顶部/底部细线装饰

这样即使内容各异，并排放置时也有系列感。

---

## 三、AI 生成 Prompt 模板

### 3.1 通用公式

```
A vertical book cover illustration for "{title}" by {author}.
{core imagery}.
Warm, muted palette of {colors}, parchment and old leather tones.
{classical / whimsical / mysterious} atmosphere.
Hand-painted watercolor with subtle gold foil accents on the border.
No modern elements, no text, no letters.
Centered composition, vertical 2:3 format, 512x768, high detail.
```

### 3.2 分书 Prompt 示例

#### 《老人与海》（book_003）

```
A vertical book cover illustration for "The Old Man and the Sea" by Ernest Hemingway.
A small weathered skiff on a vast grey-blue ocean, a giant marlin skeleton floating beneath the surface, distant clouds.
Warm, muted palette of sea grey, deep blue, weathered wood, and old paper.
Quiet, solitary, epic atmosphere.
Hand-painted watercolor with subtle gold foil border accents.
No modern elements, no text.
Centered composition, vertical 2:3 format, 512x768, high detail.
```

#### 《秘密花园》（book_034）

```
A vertical book cover illustration for "The Secret Garden" by Frances Hodgson Burnett.
An old stone wall covered with ivy and climbing roses, a weathered wooden door slightly ajar, a robin perched on the handle, soft golden light spilling through.
Warm, muted palette of rose pink, moss green, sun gold, and old stone grey.
Whimsical, mysterious, spring-like atmosphere.
Hand-painted watercolor with subtle gold foil border accents.
No modern elements, no text.
Centered composition, vertical 2:3 format, 512x768, high detail.
```

#### 《菜根谭》（book_029）

```
A vertical book cover illustration for a classical Chinese wisdom book.
A small porcelain teacup, a gnarled pine branch, misty mountains in the distance, ink-wash texture.
Warm, muted palette of ink black, parchment beige, pine green, and terracotta.
Serene, contemplative, classical Chinese atmosphere.
Traditional Chinese ink and watercolor style with subtle gold seal accents.
No modern elements, no text.
Centered composition, vertical 2:3 format, 512x768, high detail.
```

---

## 四、接入游戏的步骤

### 4.1 在书籍数据中加 `cover` 字段

以 `data/books/book_034.js` 为例：

```js
export const meta = {
  id: 'book_034',
  title: '秘密花园（典藏版）',
  // ...
  cover: 'visual/books/book_034.png',
  emoji: '🌳'
};
```

单卷书同样：

```js
export const meta = {
  id: 'book_034_vol1',
  // ...
  cover: 'visual/books/book_034_vol1.png',
  emoji: '🌳'
};
```

### 4.2 渲染层读取封面

书架卡片 `js/render/bookshelf.js` 的 `renderBookCard` 中，把封面区从 emoji 改为图片：

```js
const coverSrc = book.cover || null;
const coverHtml = coverSrc
  ? `<img src="${coverSrc}" alt="${getBookTitle(book)}" class="w-full h-full object-cover rounded" onerror="this.style.display='none';this.parentElement.querySelector('.fallback').style.display='flex'">`
  : '';

cardDiv.innerHTML = `
  ...
  <div class="book-cover flex-1 flex flex-col items-center justify-center p-4 relative min-h-[130px]">
    <div class="fallback ${coverSrc ? 'hidden' : 'flex'} flex-col items-center justify-center">
      <div class="text-5xl mb-2 drop-shadow-sm">${book.emoji}</div>
      <div class="font-bold text-sm text-center text-ink leading-tight">${getBookTitle(book)}</div>
      <div class="text-[10px] text-ink-light/60 mt-1">${book.author}</div>
    </div>
    ${coverHtml}
    ${isCompleted ? '<div class="absolute top-2 left-2 text-xs">🏆</div>' : ''}
  </div>
  ...
`;
```

### 4.3 证书/详情页（可选）

- 证书 `js/render/certificate.js` 可把中间的大 emoji 换成封面图。
- 书籍详情弹窗 `js/render/bookshelf.js` 顶部也可加封面图。

---

## 五、批量生产流程

1. **列出优先级**：先覆盖当前商店在售/常见书籍（约 30 本），再补长书分卷和 DLC。
2. **统一跑图**：用同一套 prompt 结构批量生成，保持风格一致。
3. **命名归档**：生成后按 `visual/books/{bookId}.png` 重命名。
4. **批量加字段**：在 `data/books/*.js` 中统一添加 `cover` 字段。
5. **游戏中验证**：打开大书库，检查封面显示、fallback、证书效果。

---

## 六、注意事项

1. **fallback**：所有封面路径都必须有 emoji 回退，避免图没出时书架空白。
2. **文件大小**：512×768 PNG 单张约 200~500KB，70 本书约 20~35MB，需监控总资源体积。
3. **一致性**：建议先定 3~5 本风格样稿，确认后再批量生成。
4. **单卷与典藏**：单卷封面可共享元素但有所区分（如卷一偏「开端/门锁」，卷二偏「盛放/团聚」，典藏版融合两者）。

---

## 七、首批建议书目（按优先级）

1. 新手三本书：飞鸟集、伊索寓言、菜根谭
2. 高频短书：老人与海、傲慢与偏见、鲁滨逊漂流记
3. 经典长书：红楼梦、西游记、本草纲目、史记
4. 新植物兑换书：绿野仙踪、爱丽丝梦游奇境、秘密花园
5. 其余按商店出现频率补齐
