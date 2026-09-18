# 归墟图书馆 · 公版书实时对照誊抄模式（草案）

> 目标：让中文公版书在专注誊抄时，页面真正跟随 `copiedWords` 进度显示对应文本段落，而不是重复显示某一章。
> 范围：仅中文公版书（无版权风险）；非公版书保持现有章节循环机制。

---

## 一、问题定义

### 现状
- 每本书按 `chapters` 组织，每章有固定 `words`。
- 专注时累计 `copiedWords`，达到 `unlockAt` 后解锁下一章。
- 渲染层显示「当前章节」的完整 `content`，循环滚动或静止展示。
- 玩家实际看到的文字与 `copiedWords` 的精确位置无关。

### 目标
- 对公版书，把全书内容视为一条连续文本流。
- 根据 `copiedWords` 精确截取「当前正在誊抄的段落」。
- 每次专注完成，进度推进，下次打开时自然显示下一段。
- 章节标题仍可作为里程碑弹出，但不绑定显示内容。

---

## 二、数据方案

### 2.1 新增书籍标记

在 `meta` 中增加字段：

```js
{
  id: 'book_xxx',
  title: '菜根谭',
  // ...
  copyMode: 'linear',   // 'linear' | 'chapter'（默认 chapter）
  isPublicDomain: true  // 可选，用于 UI 标识与版权提示
}
```

- `copyMode: 'chapter'`：现有模式，按章节循环显示。
- `copyMode: 'linear'`：新模式，按字数流精确显示。

### 2.2 内容存储方式

对线性模式书籍，内容不再按 `chapters` 切分，而是存为连续段落数组：

```js
export const segments = [
  { id: 's001', start: 0,    end: 120,  text: '栖守道德者，寂寞一时；依阿权势者，凄凉万古。' },
  { id: 's002', start: 120,  end: 240,  text: '达人观物外之物，思身后之身，宁受一时之寂寞，...' },
  // ...
];
```

或更简单的字符串数组：

```js
export const fullText = `栖守道德者……`;
export const segmentSize = 100; // 每段约 100 字
```

推荐 **segments 数组** 方案：
- 便于按段落渲染；
- 便于做「句读/标点不截断」；
- 便于扩展「段落完成奖励/批注」。

### 2.3 自动分段规则

- 目标段长：80~150 字（可配置 `segmentSize`）。
- 优先在句号、问号、感叹号后切分。
- 避免在引号、括号中间切断。
- 对古文（如菜根谭、道德经）可按条目/章节自然切分。

### 2.4 向后兼容

- 不写 `copyMode` 的书默认走 `chapter`。
- 线性模式书仍需保留 `chapters` 用于里程碑/成就（可空数组，或用 `segments` 自动生成里程碑点）。

---

## 三、状态与进度

### 3.1 复用现有字段

- `copiedWords`：继续作为全局累计字数。
- `unlockedChapters`：可复用为「已解锁段落/章节标记」，或新增 `unlockedSegments`。

### 3.2 新增字段（可选）

```js
state.books[bookId] = {
  // ...
  currentSegmentIndex: 0,  // 当前显示段落索引
  segmentOffsets: []       // 每段起始字数，用于快速定位
}
```

实际可通过 `segments` 数组实时计算，不一定需要持久化。

---

## 四、渲染方案

### 4.1 专注页面改造

新增 `js/render/focus-linear.js` 或改造 `js/render/focus.js`：

```js
function getCurrentSegment(book, bookState) {
  if (book.copyMode !== 'linear') return null;
  const progress = bookState.copiedWords % book.totalWords;
  return book.segments.find(s => progress < s.end) || book.segments[book.segments.length - 1];
}
```

显示：
- 当前段：大字、居中、清晰可读；
- 上一段/下一段：浅灰色小字预览（可选）；
- 进度条：显示在全书中的百分比位置。

### 4.2 完成一本书后的行为

- `copiedWords % totalWords === 0` 时触发 `completeBook()`。
- 重置 `currentSegmentIndex` 到 0，显示第一段，便于下一轮继续。
- 重抄（熟练度）模式同样适用：再次从第 0 段开始。

### 4.3 章节里程碑（可选）

- 线性模式书可以没有传统章节，但可以在特定进度点弹出「卷/篇完成」提示。
- 例如《菜根谭》每 10 条弹出一次小总结。

---

## 五、奖励与成就

### 5.1 奖励不变

- `completeBook()` 仍按 `totalWords` 档次发奖励。
- 里程碑奖励仍按累计字数触发。

### 5.2 成就适配

- 现有按「完成书籍数」统计的成就无需改动。
- 若新增「连续誊抄公版书 X 段」成就，需要补充逻辑。

---

## 六、第一批候选书目

建议先做短篇/中篇公版书验证机制：

| 书目 | 字数 | 分段特点 | 备注 |
|---|---|---|---|
| 菜根谭 | ~2 万 | 条目共 360 则，天然小段 | 最佳试点 |
| 道德经 | ~5 千 | 81 章，每章短 | 试点 |
| 飞鸟集（已有） | ~1.8 万 | 短诗，天然分段 | 已是短章节模式 |
| 红楼梦 | ~73 万 | 长篇章回，需按回目切分 | 第二阶段 |
| 庄子 | ~3 万 | 内/外/杂篇 | 第二阶段 |

---

## 七、实施步骤

1. **Step 1：数据格式扩展**
   - 在 `data/books/*.js` 中支持 `copyMode: 'linear'` 和 `segments`。
   - 更新书籍数据校验脚本（如有）。

2. **Step 2：数据迁移**
   - 选 1~2 本公版书（菜根谭、道德经）改写成 `segments` 格式。
   - 保留原有 `chapters` 作为里程碑点或清空。

3. **Step 3：核心逻辑**
   - 在 `js/core/book-utils.js` 新增 `getCurrentSegment(book, bookState)`。
   - 在 `js/core/focus-session.js` 或 `js/render/focus.js` 中根据 `copyMode` 选择显示逻辑。

4. **Step 4：UI 适配**
   - 线性模式显示当前段 + 上下预览 + 全书进度。
   - 章节模式保持现有 UI。

5. **Step 5：测试**
   - 验证短书快速完成时的段落切换。
   - 验证长书跨会话后进度定位正确。
   - 验证旧存档兼容。

---

## 八、风险与注意事项

1. **性能**：若全书 73 万字（红楼梦）一次加载，内存和查找都不是问题；但分段预生成可加速定位。
2. **标点截断**：分段算法需保证不在引号/括号中间切断，否则阅读体验差。
3. **版权**：仅限公版书。建议在 UI 中加「公版书」标识。
4. **旧存档**：已存在的 `copiedWords` 需映射到新 `segments`，建议按 `copiedWords % totalWords` 重新定位。

---

## 九、决策点（需图南拍板）

1. 第一批试点选哪几本？（我推荐菜根谭 + 道德经）
2. 每段显示字数固定（如 100 字）还是按自然句/条目切分？
3. 是否保留「章节里程碑」提示？
4. 线性模式书是否也需要封面和证书？（建议 yes）
