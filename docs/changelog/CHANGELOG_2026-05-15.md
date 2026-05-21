# 2026-05-15 迭代交付 · 新手引导系统重设计

> 状态：已交付

---

## 概述

将原有"一次性 4 步卡片"升级为 **"开场引导 + 情境触发 + FAQ 馆长手册"** 三层引导体系。同时为氛围升级、缮写室升级、借阅区升级增加金边大卡片 + 美术图 + 叙事文本的庆祝弹窗。

---

## 新增文件

| 文件 | 说明 |
|------|------|
| `js/tutorial.js` | 情境触发逻辑引擎：`checkAndShowTutorial()` 检测触发条件，`markTutorialSeen()` 标记已读，纯逻辑不碰 DOM |
| `js/intro.js` | 5 步开场引导：欢迎→缮写室→计时与收获→大书库→访客与位面商店，从 app.js 提取 |
| `js/render/tutorial-ui.js` | 引导 UI 渲染：情境引导卡片 ×4 + 氛围升级弹窗 + 缮写室升级弹窗 + 借阅区升级弹窗 |
| `js/render/certificate.js` | 典藏证书：首次完成书籍时弹出羊皮纸证书，支持 html2canvas 导出图片 |

---

## 修改文件

| 文件 | 变更 |
|------|------|
| `js/app.js` | 提取 `showIntro()` → `intro.js`（~180行移除）；接入 6 个情境触发检测点（专注完成/访客/氛围/商店/馆长办公室/书籍完成）；升级弹窗接入（借阅区升级后弹出）；`switchTab` 触发商店/馆长办公室引导 |
| `js/state.js` | 新增 `tutorialFlags` 对象（maxAtmoStageSeen + 5 个首次标记）+ 旧档迁移自动补全 |
| `js/storage.js` | `addAtmosphere()` 返回 `prevLevel` 供调用方检测阶段跨越，保持 storage.js 纯净 |
| `js/render/shop.js` | 缮写室升级成功后接入 `showFocusRoomUpgrade()` 弹窗 |
| `js/render/library.js` | 新增"📖 馆长手册"子标签（第 5 个），含功能介绍 + 核心循环 + 6 FAQ |
| `css/style.css` | 新增 `.certificate-card`、`.atmo-stage-overlay`、`.tutorial-card` 样式 |
| `index.html` | 新增 html2canvas CDN 引用 |

---

## 三层引导体系

### 第一层：开场引导（5 步）

PV 开场 → 5 张居中卡片，每步切换对应背景标签页：
1. **欢迎** — 废墟叙事
2. **缮写室** — 解释专注誊抄 = 修复图书馆
3. **计时与收获** — 三种模式、智慧之光、氛围进度
4. **大书库** — 书架、章节、mastery、完成书籍后上架供访客借阅
5. **访客与位面商店** — 简述两大系统

### 第二层：情境触发（6 个触发点）

| 触发事件 | 引导内容 | 触发位置 |
|----------|----------|----------|
| 首次专注完成 | 解释智慧之光 + 氛围 + 连续专注 | 结算卡片关闭后 |
| 首次访客到来 | 解释访客借阅/还书/事件，按钮跳转读者沙龙 | 访客到来卡片展示后 |
| 首次打开商店 | 解释四大区域（借阅区/缮写室/装潢/新书） | switchTab('shop') |
| 首次打开馆长办公室 | 解释 5 个子标签 | switchTab('library') |
| 氛围阶段升级 (2~5) | 金边大卡片：阶段美术图 + 叙事 | addAtmosphere 跨越阈值 |
| 首次完成书籍 | 典藏证书（html2canvas 导出） | 书籍完成结算 |

### 第三层：馆长手册

馆长办公室 → 📖 馆长手册子标签：功能介绍 + 核心循环 + 6 个 FAQ

---

## 升级庆祝弹窗

三个升级系统使用共享 `showUpgradeCard()` 模板：白色卡片 + 金边 + 顶部美术大图 + 叙事文字 + "继续→" 按钮。

### 氛围阶段升级（Stage 2~5）

- 图片：`visual/background/library_bg_02~05.jpg`
- 每阶段独立叙事文本（~150字），强调图书馆从废墟到星辰的情感弧线

### 缮写室升级（Lv1~6）

- 图片：`visual/focusroom/focusroom_lv1~6_*.jpg`
- 等级名：残破 → 陋室 → 整洁 → 明亮 → 静雅 → 华美 → 缮写圣堂
- 每级独立叙事，底部显示誊抄速度百分比

### 借阅区升级（Lv1~7）

- 图片：`visual/library_readingarea/library_reading_01~07_*.jpg`
- 等级名：陋室 → 整洁 → 开放 → 舒适 → 精致 → 优雅 → 圣所
- 每级独立叙事，底部显示容量提升

---

## 设计决策

- **`maxAtmoStageSeen: number`** 代替 4 个 boolean，减少状态字段
- **`addAtmosphere()` 返回 `prevLevel`**，调用方自行检测跨越，保持 storage.js 无 DOM/UI 依赖
- **`checkAndShowTutorial()` → `dispatchTutorialUI()`** 分发模式，tutorial.js 只返回 trigger 对象，tutorial-ui.js 负责渲染
- **升级弹窗不强制阻断**：用户可点击遮罩关闭，所有弹窗标记已读后不再弹出
- **html2canvas** 用于证书导出，fallback 到剪贴板文字复制

---

## 已知限制

- 情境引导卡片为居中弹窗，不指向具体 DOM 元素（避免屏幕尺寸适配问题）
- 典藏证书目前仅首次完成书籍时弹出，重复完成不触发
- 馆长手册为静态 FAQ，不含动态数据
