# P0-02：大书库/缮写室书籍分离

## Context

当前大书库默认展示所有已解锁的书籍（不论完成状态），导致未抄完的书和已完成的书混在一起。用户明确指出"没抄完的书不该出现在大书库，只能出现在缮写室或待抄写区"。这本质上是模拟经营框架中**加工区（缮写室）与成品展示区（大书库）的混淆**。

## 目标

- **大书库**：只展示已完成的书籍（`status === 'completed'`），作为成果展示和策展空间
- **缮写室**：继续展示已解锁 + 抄写中 + 已完成但可重抄（mastery < 5）的书籍，作为工作区
- 书籍完成后通过已有的上架动画（`showBookShelvingAnimation`）从缮写室"搬家"到大书库

## 改动范围

### 1. `js/render/bookshelf.js` — 唯一需要改的文件

**改动 1：基底数据过滤（第 18 行）**

```js
// 当前
let books = Object.values(BOOKS).filter(b => state.books[b.id]);
// 改为
let books = Object.values(BOOKS).filter(b => state.books[b.id]?.status === 'completed');
```

**改动 2：简化筛选标签（第 60-65 行）**

移除已无意义的 `all` 和 `copying` 标签，保留两个：
```js
const tabs = [
  { id: 'all', label: '全部' },
  { id: 'starred', label: '⭐收藏' }
];
```

**改动 3：简化 applyFilters（第 107-116 行）**

移除 `copying` 和 `completed` 分支（所有书籍已是 completed）：
```js
if (currentFilter === 'starred') {
  result = result.filter(b => state.books[b.id]?.starred);
}
```
`all` 和 `starred` 之外的分支直接移除。

**改动 4：默认筛选值（第 8 行）**

`currentFilter = 'all'` 保持不变，但现在 `'all'` 只包含已完成的书籍。

### 2. 不需要改的文件

- `js/render/focus.js` — 缮写室筛选逻辑已正确：排除 locked，包含 unlocked/copying/completed-with-mastery<5。无需改动
- `css/style.css` — 书籍卡片样式保留，`.book-spine.completed` 样式全部书籍都会用到
- `js/state.js` / `data/books.js` — 数据模型无需变化
- `js/app.js` — 上架动画已有（`showBookShelvingAnimation`），无需新增

## 预期效果

- 新用户打开大书库 → 空的（或仅《图书馆指南》若已抄完），书架上的空槽位清晰可见
- 每完成一本书 → 上架动画飞向大书库标签 → 大书库里多了一本书
- 缮写室仍可选择已完成但未满 mastery 的书进行重抄
- 分类下拉和字数排序保持正常
- 空书架槽位逻辑不变（`totalSlots - books.length`），槽位数 = 书架层数 × 5

## 验证

1. 打开新存档 → 大书库为空（只有空槽位虚线框）
2. 第一次专注抄完《图书馆指南》→ 上架动画 → 大书库出现第一本书
3. 缮写室中选择一本已完成的短书 → 可正常重抄提升 mastery
4. 切换分类/排序 → 筛选正常
5. 收藏某本书 → 切换到"收藏"标签 → 只显示收藏的已完成书籍
