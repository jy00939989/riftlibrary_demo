# Claude Code 工作日志 · 2026-05-15

## 任务：异世界图书馆新手引导系统重设计

### 需求理解

用户（图南）希望将现有的简单 4 步卡片式开场引导升级为完整的三层引导体系，让新用户在一个 session 内理解所有功能，并感受到图书馆"活过来"的沉浸感。

### 设计阶段（grill-me）

通过逐层深入的问答确认了以下关键决策：
- **三层架构**：开场引导（5步）→ 情境触发（6个触发点）→ FAQ 馆长手册
- **引导形式**：居中卡片弹窗，不做 DOM 元素指向箭头（避免不同屏幕尺寸的适配问题）
- **典藏证书**：内容 A+B（书名+统计+引言），视觉 A（羊皮纸+印章+金边），交互 B（html2canvas 导出 + 继续按钮）
- **FAQ 位置**：馆长办公室子标签，名为"馆长手册"
- **实现策略**：先写代码，用户修改提意见，有"继续"按钮确认后关闭

### 实现过程

1. **state.js** — 新增 `tutorialFlags` 对象 + 旧档迁移自动补全（包括缺失整个 tutorialFlags 和缺失单个字段两种情况）

2. **tutorial.js** — 纯逻辑触发引擎：TRIGGERS 配置映射事件名→标记名→弹窗类型，`checkAndShowTutorial()` 检测并返回 trigger，`markTutorialSeen()` 标记已读。氛围阶段事件通过 `atmosphere_stage_N` 模式解析。

3. **storage.js** — 最小化改动：`addAtmosphere()` 返回 `prevLevel`，让调用方自行检测阶段跨越，不注入任何回调。

4. **tutorial-ui.js** — 所有引导/升级 UI：4 个情境引导卡片（专注完成/访客/商店/馆长办公室）+ 氛围升级弹窗（stage 2~5）+ 缮写室升级弹窗（Lv1~6）+ 借阅区升级弹窗（Lv1~7）。共享 `showUpgradeCard()` 模板。

5. **certificate.js** — 典藏证书：羊皮纸卡片 + 金边 + html2canvas 导出图片 + 剪贴板 fallback。

6. **intro.js** — 从 app.js 提取 `showIntro()`，扩展为 5 步，每步切换对应标签页。

7. **app.js** — 大规模编排改造：移除 intro 函数（~180行）、接入 6 个情境触发检测点、结算后链式调用教程检测、访客引导卡片带跳转功能、升级弹窗接入。

8. **library.js** — 新增第 5 个子标签"馆长手册"，含功能介绍 + 核心循环 + 6 FAQ。

9. **shop.js (render)** — 缮写室升级成功后弹出升级弹窗。

10. **css/style.css** — 新增证书卡片、引导卡片、升级弹窗样式。

### 用户反馈修正

- **计时与收获文案错误**：原稿说"+1 氛围 per minute"，用户指出不正确。核实 `timer.js` 后确认氛围不按分钟增长，已修正 intro.js 和 library.js FAQ。
- **大书库步骤文案**：用户要求明确"完成书籍后可上架供访客借阅"，已补充。
- **缺少馆长办公室引导**：用户指出首次打开馆长办公室也需要引导卡片解释子标签，新增 `firstLibraryOpen` 触发点。
- **"攻略"命名**：用户觉得太冷硬，改为"馆长手册"。
- **馆长手册内容**：用户觉得太硬核，简化为功能介绍 + 核心循环 + 6 FAQ。
- **氛围升级弹窗冲击力**：最初设计是全屏遮罩+背景图，用户说"图一开始就蒙板了，就没有冲击性"。重新设计为金边白色卡片 + 顶部干净美术图 + 下方叙事文字。
- **缮写室和借阅区升级弹窗**：用户确认需要，补充了两套完整的升级弹窗系统。

### 文件变更统计

- 新建：4 个文件（tutorial.js, intro.js, tutorial-ui.js, certificate.js）
- 修改：7 个文件（app.js, state.js, storage.js, library.js, shop.js, style.css, index.html）
- 文档更新：ARCHITECTURE.md, CLAUDE.md, CHANGELOG_2026-05-15.md

### 关键设计原则执行

- `tutorial.js` 纯逻辑不碰 DOM，`tutorial-ui.js` 渲染层负责所有 UI ✓
- `maxAtmoStageSeen: number` 代替多个 boolean ✓
- `addAtmosphere()` 返回 prevLevel，保持 storage.js 无 DOM 依赖 ✓
- `checkAndShowTutorial()` → `dispatchTutorialUI()` 分发模式 ✓
- 升级弹窗非强制阻断，可点击遮罩关闭 ✓
