# 书籍数据模板 · 给 Agent 使用

## 输出格式

每本书输出为一个 JS module 文件，命名：`book_xxx.js`

## 模板

```js
// 书名
export const meta = {
  id: 'book_XXX',              // 唯一ID，格式 book_编号
  title: '书名',
  titleEn: 'English Title',    // 可选
  author: '作者名',
  category: '分类',            // 必须从枚举中选择：童话 | 寓言 | 小说 | 诗歌 | 戏剧 | 散文 | 哲学 | 传记 | 历史 | 科学 | 神话 | 志怪
  totalWords: 25000,           // 全书总字数（数字）
  description: '一句话简介，不超过50字。',
  emoji: '📖',                 // 单emoji代表书籍
  // mastery 解锁内容（以下全部可选，没有的填空字符串）
  authorBio: '作者生平介绍，50-100字。',
  anecdotes: '创作背景/轶闻，50-100字。',
  reviews: '名家书评/评语，50-100字。',
  collectorCover: '🌟'         // 单emoji，典藏封面用
};

// 章节列表
export const chapters = [
  {
    id: 'ch1',
    title: '章节标题',
    unlockAt: 0,               // 解锁所需誊抄字数（第一章固定为0）
    words: 5000,               // 本章字数
    preview: '一句话内容预告，不超过30字。',
    content: `章节正文内容。
保持原文风格，适合在网页上阅读。

每段之间用空行分隔。`
  },
  // ... 更多章节，unlockAt 依次递增（上一章 unlockAt + 上一章 words）
];

// 名言警句
export const quotes = {
  10: '"名言一。"',
  25: '"名言二。"',
  40: '"名言三。"',
  55: '"名言四。"',
  70: '"名言五。"',
  85: '"名言六。"'
};
```

## 规则

1. **章节 unlockAt 计算**：第N章的 unlockAt = 前N-1章 words 之和。第一章固定为 0。
2. **totalWords** = 所有章节 words 之和。
3. **category 枚举限定**：`童话 | 寓言 | 小说 | 诗歌 | 戏剧 | 散文 | 哲学 | 传记 | 历史 | 科学 | 神话 | 志怪`
4. **quotes 的 key**：用 10, 25, 40, 55, 70, 85 六个进度百分比作为 key，表示誊抄到不同阶段时随机展示的名言。
5. **不要**在 meta 中包含：rarity（稀有度）、specialEffect（特殊效果/属性加成）——这些字段已废弃。
6. **content 字段**：使用反引号模板字符串（`` ` ``），保留自然段落。每段之间加空行。
7. **字数控制**：每章 words 建议在 2000-8000 字之间，总字数不限。

## 示例

见 `data/books/book_001.js`（《小王子》）和 `data/books/book_002.js`（《动物农场》）。
