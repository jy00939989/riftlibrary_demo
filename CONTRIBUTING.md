# 贡献指南 · 异世界图书馆

欢迎来到夹缝中的归墟。这份指南帮助你在图书馆里找到第一本书的位置。

---

## 项目概述

异世界图书馆是一款**纯前端 Web 游戏**，核心循环是：

```
番茄钟专注誊抄 → 获得智慧之光 + 氛围 → 解锁/购买新书 → 吸引访客 → 升级设施 → 循环
```

当前已迭代七期，包含：缮写室、大书库、读者沙龙、馆长办公室、馆史档案、位面商店 6 个模块，以及位面系统（Phase 1 框架）。

**线上地址**：`https://riftlib.com`

---

## 5 分钟快速启动

### 你需要的

- 任何现代浏览器（Chrome / Edge / Firefox）
- Python 3（用于本地开发服务器）
- Git（用于提交改动）

### 跑起来

```bash
# 克隆仓库
git clone https://gitee.com/sallyshen1987/library_demo.git
cd library_demo
git checkout refactor-book-system

# 启动开发服务器
python3 -m http.server 8080
# 或者
npm run dev
```

浏览器打开 `http://localhost:8080`，完成。

**没有构建步骤**。项目是原生 JS ES Modules，浏览器直接运行。

---

## 技术栈

| 层 | 技术 |
|---|------|
| 页面结构 | HTML5 + Tailwind CSS CDN |
| 样式 | 自定义 CSS (`css/style.css`) + Tailwind 主题色 |
| 逻辑 | 原生 JavaScript ES Modules（`js/` 目录） |
| 数据 | 静态 JS 对象（`data/` 目录） |
| 持久化 | localStorage（3 个 key） |
| 字体 | Google Fonts CDN 镜像（`fonts.loli.net`） |
| 部署 | 腾讯云 EdgeOne Pages 静态托管 |

**关键约束**：
- 无框架、无构建工具、无 TypeScript
- 所有依赖通过 CDN 引入，不经过 npm
- 不支持 IE 浏览器（需要 ES Modules）

---

## 文件结构（核心部分）

```
index.html              ← 页面入口，改动标签结构时改这里
css/style.css           ← 自定义样式
data/                   ← 静态数据：书籍、氛围阶段、植物、位面定义等
  books.js              ← 书籍注册入口
  books/book_*.js       ← 每本书的元数据（不要手写，用模板）
js/                     ← 逻辑层
  app.js                ← 入口：初始化 / 页面切换 / 全局编排
  state.js              ← 全局状态 + localStorage 序列化 + 存档迁移
  storage.js            ← 代币/氛围/历史 原子读写
  timer.js              ← 番茄钟计时器（25min 专注 + 倒计时）
  visitors.js           ← 访客逻辑（纯逻辑，不碰 DOM）
  shop.js               ← 商店逻辑：升级 + 购买
  books.js              ← 书籍解锁 / 进度
  achievements.js       ← 成就引擎（31 个成就）
  quests.js             ← 位面任务引擎
  diary.js              ← 墨墨日志
  tutorial.js           ← 情境触发器
  audio.js              ← 3 层 BGM + 交叉淡入淡出
  plants.js             ← 植物盆栽系统
  dev.js                ← Dev 面板（Ctrl+Shift+D）
  render/               ← **唯一操作 DOM 的模块**
    index.js            ← 统一导出
    focus.js            ← 缮写室页面 + 结算卡片
    bookshelf.js        ← 大书库 + 筛选
    visitors.js         ← 读者沙龙
    library.js          ← 馆长办公室（概况 / 成就 / 收藏 / 布置 / 手册）
    shop.js             ← 位面商店
    plane.js            ← 位面详情页
    quests.js           ← 任务角色卡片 + 信函弹窗
    archive.js          ← 馆史档案 + 墨墨日志 + 位面入口
    achievements.js     ← 成就柜 UI + toast
    collection.js       ← 收藏室 UI
    tutorial-ui.js      ← 教程引导卡片
    certificate.js      ← 典藏证书（html2canvas）
    writing.js          ← 缮写动画 Canvas 引擎
    animations.js       ← 弹窗动画
```

---

## 核心数据流原则

```
state.js (单一数据源) → app.js (编排层) → render/ (DOM 层)
                            ↑
          visitors.js / shop.js / achievements.js
          (纯逻辑模块，不操作 DOM)
```

- `render/` 是**唯一**操作 DOM 的目录
- `app.js` 通过 `setActions()` 注入回调
- 逻辑模块只通过 `state` + `saveState()` 通信

**不遵守这条规则是新 PR 最常见被拒的原因。**

---

## 如何贡献

### 第一步：选择任务

从 [ISSUES.md](./ISSUES.md) 中选一个你感兴趣的任务，在对应 Issue 下留言认领。

### 第二步：开分支

```bash
git checkout refactor-book-system
git pull origin refactor-book-system
git checkout -b feature/你的任务简称
```

分支命名：
- `feature/xxx` — 新功能
- `fix/xxx` — Bug 修复
- `polish/xxx` — UI / 体验打磨
- `docs/xxx` — 纯文档

### 第三步：开发

- 修改前先跑一遍主干，确认当前功能正常
- 修改内容聚焦在任务范围内，不要顺手重构无关代码
- 新增书籍使用 `data/BOOK_TEMPLATE.md` 模板

### 第四步：提交

```bash
git add <具体文件>
git commit -m "类型: 简述（不超过 50 字）"
```

Commit 类型：
- `feat:` 新功能
- `fix:` 修复
- `polish:` 打磨 / 样式调整
- `docs:` 文档

### 第五步：发起 PR

- 推到 Gitee 仓库，发起 Pull Request 到 `refactor-book-system` 分支
- PR 标题写清楚**改了什么**
- 描述里写清楚**为什么这么改**和**怎么验证**

---

## 代码风格速查

- 缩进：2 空格（遵循现有代码即可）
- 引号：单引号（JS），双引号（HTML）
- 分号：不强制，但同一文件内保持一致
- 函数：箭头函数优先，但顶层函数用 `function`
- DOM 操作：**只在 `js/render/` 目录下操作 DOM**
- 状态修改：通过 `state.js` 的 `saveState()` 写入
- 货币操作：用 `addCoins(n)` / `spendCoins(n)`，不要直接改 state
- 氛围操作：用 `addAtmosphere(n)`，上限 500

---

## localStorage Key 清单

修改存档相关逻辑时，注意这几个 key：

| Key | 内容 |
|-----|------|
| `library_state` | 核心存档 |
| `library_achievements` | 成就状态 |
| `library_collection` | 收集品 |
| `library_music` | 音乐开关 |

**存档向前兼容**：新增 state 字段时，必须在 `state.js` 的迁移逻辑中补充默认值，否则旧用户数据会报错。

---

## 数据安全注意事项

- 永远不要直接修改 localStorage，通过 state.js 提供的函数操作
- 新增字段必须补迁移逻辑
- 不要删除或重命名已有字段（会破坏现有用户的存档）
- 测试时使用 Dev 面板（Ctrl+Shift+D）重置数据，不要手动清 localStorage

---

## 问题沟通

- 优先在 Issue 下讨论，方便其他人跟帖
- 如果拿不准实现方案，先发 Issue 描述你的思路，等反馈后再写代码
- 不要自己一个人闷头做了一个大功能再交 PR —— 小步快跑
