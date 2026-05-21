# ADR-2026-05-15: 新手引导系统重设计 · 架构审核报告

> 审核人：软件架构师 Agent  
> 日期：2026-05-15  
> 状态：**待决策**

---

## 一、审核范围

基于 `CHANGELOG_2026-05-15.md`（新手引导系统三层架构重设计），结合项目整体代码库，对本次迭代的文件变更、模块划分、依赖方向、技术债风险进行审核。

---

## 二、现有架构健康度总评

### ✅ 做得好的地方

| 维度 | 评价 |
|------|------|
| **分层清晰** | `state.js`(数据) → `app.js`(编排) → `render/`(DOM) 严格单向，逻辑模块(visitors/shop/achievements)不碰DOM |
| **ES Modules** | 无框架、无构建，适合当前项目体量和部署方式 |
| **迁移模式成熟** | `initState()` 的旧档迁移写得很稳——逐字段检查 + Object.assign 合并 + 立即 saveState |
| **Render 层隔离** | `setActions()` 注入回调机制避免了 render → logic 的反向依赖 |
| **子标签页模式** | library.js 的 sub-tab 架构（概况/成就柜/收藏室/布置）已形成可复用范式，新增「攻略」标签只需追加一个 case |

### ⚠️ 需要关注的风险

| 维度 | 风险等级 | 说明 |
|------|---------|------|
| **app.js 膨胀** | 🔴 高 | 当前 765 行，本次迭代后预计突破 1000 行 |
| **弹窗代码分散** | 🟡 中 | overlay 创建逻辑散布在 app.js(3处) / focus.js(1处) / animations.js(2处) / visitors.js(1处)，无统一弹窗管理器 |
| **storage.js 职责 creep** | 🟡 中 | 原本是"原子读写工具"，现在承载了 BGM 切换 + 背景图切换等副作用 |

---

## 三、逐项审核 CHANGELOG 变更

### 3.1 新建 `js/tutorial.js`（情境触发逻辑）

**CHANGELOG 设计：**
```
tutorialFlags 标记检测、标记更新、触发判定
```

**审核结论：✅ 合理，建议微调**

这个文件的定位是纯逻辑层——判断"是否应该弹出引导"。它不碰 DOM，只读 state + 写 tutorialFlags，完全符合现有架构的分层原则。

**建议补充的接口设计：**

```javascript
// js/tutorial.js — 建议导出接口
export function checkTutorialTrigger(triggerKey) {
  // 返回 null 或 { type: 'context-card' | 'atmosphere-popup' | 'certificate', data: {...} }
}

export function markTutorialSeen(triggerKey) {
  // 写 state.tutorialFlags[triggerKey] = true; saveState();
}

export function getTutorialFlags() {
  // 只读返回当前标记状态
}
```

**关键设计决策：采用「调用方驱动」而非「事件驱动」**

CHANGELOG 的方案是在 app.js 的各处（handleCompleteFocus 末尾、switchTab 内部、spawnVisitor 后）手动插入 `checkTutorialTrigger('xxx')` 调用。对于当前项目规模，这是**正确选择**——引入事件总线或观察者模式对这个体量来说是过度工程。但建议：

> **将所有触发点集中到一个函数中**，避免 app.js 里散落 6+ 处独立的 if 判断。

```javascript
// app.js 中的推荐做法：
function handlePostTutorialTriggers(context) {
  // context = { event: 'focus_complete' | 'visitor_arrive' | ... }
  const result = checkTutorialTrigger(context.event);
  if (result) showTutorialUI(result); // 调 render/tutorial.js
}
```

---

### 3.2 新建 `js/render/tutorial.js`（引导 UI 渲染）

**CHANGELOG 设计：**
```
情境引导卡片 / 氛围升级弹窗 / 典藏证书 / FAQ 页渲染
```

**审核结论：⚠️ 建议拆分**

这个文件要负责 **4 种不同形态的 UI**：

| 组件 | 类型 | 复杂度 | 类比现有组件 |
|------|------|--------|------------|
| 情境引导卡片 | 小型半屏卡片 | 低 | 访客到来卡片(app.js `showVisitorArrivalCard`) |
| 氛围升级弹窗 | 全屏遮罩+叙事 | 中 | 开场引导步骤卡片(app.js `showIntro`) |
| 典藏证书 | 全屏证书+分享 | **高** | 书籍完成动画(`animations.js` `showBookCompleteAnimation`) |
| FAQ 攻略页 | 子标签页内容 | 中 | 概况页(`library.js` `renderOverview`) |

**问题：典藏证书和氛围升级弹窗本质上是动画/仪式感组件，与 FAQ 攻略页这种静态内容页面性质完全不同。** 把它们塞进同一个文件会违反单一职责。

**建议拆分方案：**

```
js/render/
├── tutorial.js          ← 情境引导卡片（6个触发点的小卡片）
├── atmosphere-stage.js  ← 氛围升级全屏弹窗（4个阶段的叙事弹窗，可复用）
├── certificate.js       ← 典藏证书（替代/增强 showBookCompleteAnimation）
└── guide.js             ← FAQ 攻略页（馆长手册，纯静态内容渲染）
```

如果觉得 4 个文件太多（确实有道理），至少拆成 **2 个**：

| 文件 | 包含 |
|------|------|
| `tutorial-ui.js` | 情境引导卡片 + 氛围升级弹窗（都是"教学/叙事类弹窗"，交互模式类似） |
| `guide.js` | 典藏证书 + FAQ 攻略页 |

**理由：** 典藏证书是 `showBookCompleteAnimation` 的增强版，放在 `animations.js` 旁边更合理；FAQ 是 library.js 的第 5 个子标签，和 `renderOverview` 放一起也合理。

---

### 3.3 修改 `js/state.js` — 新增 `tutorialFlags`

**CHANGELOG 设计：**
```javascript
tutorialFlags: {
  firstFocusComplete: false,
  firstVisitorArrive: false,
  firstAtmoStage2/3/4/5: false,
  firstShopOpen: false,
  firstBookComplete: false
}
```

**审核结论：✅ 完全符合现有模式**

这与已有的 `introCompleted`、`diaryFirsts` 结构一致。迁移处理也简单——旧存档默认全部 `false`。

**一个小建议：** 4 个氛围阶段标记可以压缩为一个字段：

```javascript
// 当前方案（8个布尔值）:
firstAtmoStage2: false, firstAtmoStage3: false, 
firstAtmoStage4: false, firstAtmoStage5: false

// 替代方案（1个数字）:
maxAtmoStageSeen: 1  // 已见过的最高阶段，默认1
// 触发时：if (newStage > state.tutorialFlags.maxAtmoStageSeen) → 弹出
```

好处是将来加第 6、7 个氛围阶段时不用改 state 结构。不过当前固定 5 阶段的情况下两种都行。

---

### 3.4 修改 `js/storage.js` — `addAtmosphere()` 阶段跨越检测

**CHANGELOG 设计：**
> 在 `addAtmosphere()` 内对比更新前后的阶段，触发 tutorial 回调

**审核结论：⚠️ 有耦合风险，建议改用调用方检测**

当前 `storage.js` 是一个**纯工具层**——addCoins/addAtmosphere/addHistory 都是原子操作。在里面注入 tutorial 回调会打破这个纯净性。

**推荐方案：让调用方（通常是 app.js 的 handleCompleteFocus 或其他地方）在调用 addAtmosphere 之后自行检测：**

```javascript
// storage.js — 保持纯净，不加回调
export function addAtmosphere(points) {
  const oldLevel = getAtmosphereLevel().level;
  state.library.atmosphere = Math.min(500, state.library.atmosphere + points);
  updateBodyBackground();  // 这行已有，是展示层副作用（已有技术债）
  refreshBGM();           // 同上
  saveState();
  return oldLevel;  // ← 新增：返回变化前的阶段值，供调用方判断
}

// app.js / tutorial.js — 在调用点检测
const prevLevel = addAtmosphere(amount);
const newLevel = getAtmosphereLevel().level;
if (newLevel > prevLevel) {
  handlePostTutorialTriggers({ event: `atmosphere_stage_${newLevel}` });
}
```

这样 storage.js 不需要知道 tutorial 的存在，保持了工具层的纯粹性。而且 `getAtmosphereLevel()` 已经有了，零成本。

---

### 3.5 修改 `js/app.js` — 重写 showIntro() + 接入情境触发

**审核结论：🔴 这是本次迭代最大的架构风险点**

**问题分析：**

当前 app.js 已经承担了以下职责：

```
app.js (765行) =
├── 初始化流程 (init(), ~60行)
├── 页面路由 (switchTab, ~20行)
├── 专注生命周期 (start/pause/complete/abandon, ~120行)
├── 弹窗链编排 (handlePostFocusEffects, ~55行)
├── 里程碑系统 (checkMilestones/showMilestoneReward, ~75行)
├── 商店操作 (buyShelf/handleUpgradeBorrowLevel, ~30行)
├── 访客操作 (collectReturn/buySalesBook, ~30行)
├── 成就批处理 (showAchievementBatch, ~15行)
├── 访客到来卡片 (showVisitorArrivalCard, ~25行)
├── 墨墨出场 (showMomoIntro, ~30行)
├── 新手引导 (showIntro, ~180行) ← 要重写为5步
├── 6个情境触发接入点 (~40行预估)
└── setActions 注入 (~10行)
```

重写 showIntro 为 5 步（每步带页面跳转逻辑）会让这个函数更长。再加上 6 个情境触发检测点散落在 handleCompleteFocus / switchTab / spawnVisitor 等函数中，app.js 会轻松突破 **900-1000 行**。

**这不是"这次迭代的问题"而是"这次迭代会暴露的已有问题"。** app.js 从一开始就是"方便的垃圾抽屉"——什么新功能都往里塞。

**建议：本次迭代同步做一次最小拆分**

不需要大重构，只需要把**专注生命周期相关代码**提取出来：

```
js/
├── app.js              ← 精简为：init() + switchTab + showIntro() + 全局初始化 (~400行)
├── focus-orchestrator.js  ← 新增：handleStart/Complete/Abandon + 弹窗链 + 里程碑 + 触发检测 (~300行)
└── （其余不变）
```

`focus-orchestrator.js` 导出一个 `setupFocusHandlers(setActions)` 函数，app.js 在 init() 中调用一次即可。

这样做的好处：
1. **本次迭代的 3 个触发点**（首次专注完成、首次完成书籍）都在 focus-orchestrator.js 里，天然内聚
2. app.js 的 showIntro 重写不会和专注逻辑互相干扰
3. 将来调整专注流程时只改一个文件

**如果觉得拆分工作量太大**，至少把 showIntro() 提取到单独文件：

```
js/
├── intro.js            ← showIntro() 5步引导 (~200行)
├── app.js              ← 其余保持不动
```

这个改动 10 分钟就能完成（剪切 + 调整 import），但对可维护性帮助很大。

---

### 3.6 修改 `js/render/library.js` — 新增攻略子标签

**审核结论：✅ 完美契合现有模式**

library.js 已有的 sub-tab 架构：
```javascript
case 'overview': renderOverview(...);
case 'achievements': renderAchievementsTab(...);
case 'collection': renderCollectionTab(...);
case 'decoration': renderDecorationTab(...);
// 新增：
case 'guide': renderGuideTab(...);
```

加上 HTML 模板里的 button 和 switch case 即可，改动量极小且完全可预测。

---

### 3.7 修改 `js/render/focus.js` — 典藏证书

**审核结论：⚠️ 注意与 animations.js 的关系**

当前 `showBookCompleteAnimation()` 在 `animations.js` 中。CHANGELOG 说要用"典藏证书替代/增强"它。

**两种做法：**

| 方案 | 做法 | 利弊 |
|------|------|------|
| A. 替换 | 在 focus.js 或 certificate.js 写新的 `showCertificate()`，animations.js 中的旧函数废弃 | 干净，但丢失了 animations.js 作为"仪式感动画统一入口"的定位 |
| B. 增强 | 在 animations.js 中直接改造 `showBookCompleteAnimation()`，增加证书样式和数据 | 保持统一入口，但 animations.js 会变更大 |

**推荐方案 A**，因为证书的数据结构（阅读统计、引言、分享按钮）和现有的完成动画差异很大，强行合并只会两边都不舒服。旧的 `showBookCompleteAnimation` 可以保留作为 fallback 或删除。

---

## 四、实施顺序评估

CHANGELOG 给出的顺序：
```
1. state.js → 2. tutorial.js → 3. storage.js → 4. render/tutorial.js 
→ 5. app.js → 6. render/library.js → 7. render/focus.js → 8. style.css
```

**审核意见：顺序基本合理，有一处建议调整**

| 步骤 | 评价 | 建议 |
|------|------|------|
| ① state.js tutorialFlags | ✅ 最先做，其他所有文件依赖它 | — |
| ② tutorial.js 逻辑 | ✅ 先有逻辑再有 UI | — |
| ③ storage.js 氛围检测 | ⚠️ 见上文，建议改为"返回 prevLevel" | 移到 ⑤ 之后，由调用方检测 |
| ④ render/tutorial.js | ✅ UI 与逻辑分离 | — |
| ⑤ app.js 接入 | 🔴 最大改动，建议同时拆分 showIntro | **核心风险集中点** |
| ⑥ render/library.js | ✅ 小改动 | 可提前做，不依赖⑤ |
| ⑦ render/focus.js | ✅ 证书实现 | — |
| ⑧ style.css | ✅ 最后收尾 | — |

**建议调整为：**
```
1. state.js — tutorialFlags + 迁移
2. tutorial.js — 触发逻辑引擎
3. render/tutorial.js — 所有引导 UI（或拆分的子文件组）
4. render/library.js — 攻略子标签（独立，可并行）
5. render/focus.js — 典藏证书（独立，可并行）
6. style.css — 新增样式（可与4/5并行）
7. app.js — 接入所有触发点 + 重写 showIntro（最后做，因为最危险）
8. storage.js — 如果采用"返回 prevLevel"方案，这里只是小改
```

**核心思路：先把所有"零件"做好，最后再组装到 app.js。** 这样 app.js 的改动是一次性的集成操作，而不是边做边改。

---

## 五、不被采纳项确认

CHANGELOG 第六节列出了不在本次范围内的事项：
- ❌ 借阅区 Lv0 访客容量修复
- ❌ 动态 body 背景图（已有基础实现）
- ❌ Tab 导航美化
- ❌ 结算卡强化
- ❌ 各页面卡片视觉升级

**审核意见：✅ 范围控制合理。** 这些都是 UI/数值层面的优化，不影响教程系统的架构。特别是动态背景图——storage.js 里的 `updateBodyBackground()` 其实已经在工作了（我在源码中看到了），只是需要 CSS 层加强。

---

## 六、总结与优先行动项

### 必须做（影响交付质量）

| # | 行动 | 影响 |
|---|------|------|
| 1 | **将 showIntro() 提取到 `js/intro.js`** | 防止 app.js 突破 1000 行，10分钟工作量 |
| 2 | **storage.js 不注入 tutorial 回调，改为返回 prevLevel** | 保持工具层纯净，避免循环依赖风险 |
| 3 | **tutorial.js 提供统一的 `fireTrigger(event)` 入口** | 避免 app.js 散落 6+ 处独立的 if 判断 |

### 建议做（提升长期可维护性）

| # | 行动 | 影响 |
|---|------|------|
| 4 | 将 `render/tutorial.js` 至少拆为 2 个文件 | 证书/FAQ 与情境卡片性质不同 |
| 5 | 4 个氛围 stage 标记合并为 `maxAtmoStageSeen: number` | 未来扩展友好 |
| 6 | 考虑建立统一的弹窗管理器（可选，非本次必须） | 目前 overlay 创建/销毁模式重复度高 |

### 可以不做（不过度工程）

| # | 舍弃的理由 |
|---|-----------|
| 引入事件总线 | 项目规模不需要 |
| 状态管理库（如 Zustand） | localStorage 单一状态源足够 |
| 组件化框架（React/Vue） | 缮写动画等深度自定义 DOM 操作用框架反而受限 |

---

## 七、架构决策记录

### 决策 ADR-T-001：showIntro() 是否提取为独立文件？

**选项：**
- A. 保持 in-app.js（现状）
- B. 提取为 `js/intro.js`

**建议选 B**。理由：showIntro() 约 180 行且有独立的生命周期（loading → video → active → dismiss），与 app.js 的其他职责（路由/专注/商店）无数据耦合，仅共享 `state.introCompleted` 一个布尔值。提取成本极低，收益是 app.js 减少 25% 代码量。

### 决策 ADR-T-002：storage.js 是否承载氛围阶段跨越检测？

**选项：**
- A. 在 addAtmosphere() 内加回调（CHANGELOG 原方案）
- B. addAtmosphere() 返回 prevLevel，由调用方检测（本文建议）

**建议选 B**。理由：storage.js 定位是原子工具层。BGM 切换和背景图更新已经是历史遗留的副作用（acceptable debt），再加 tutorial 回调会进一步模糊边界。返回 prevLevel 是零成本的纯函数式扩展。

---

*审核完毕。以上意见供参考，最终决策由项目负责人做出。*
