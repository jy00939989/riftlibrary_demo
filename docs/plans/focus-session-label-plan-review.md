# 专注后项目标注（Focus Session Label）— 评审

> 评审对象：`rustling-painting-bumblebee.md`（草稿）+ `focus-session-label-plan.md`（定稿）
> 评审时间：2026-09-01
> 评审方式：读两份 plan → 核对代码锚点（`js/render/focus.js`、`js/core/focus-orchestrator.js`、`js/state/state.js`、`js/storage.js`、`js/state/save.js`、`js/state/migrations.js`、`js/save-manager.js`、`js/diary.js`、`js/i18n/terms.js`、`js/render/archive.js`）

---

## 结论先行（3 句话）

1. **这两份 plan 描述的功能已经在代码里完整实现了**——`focus-session-label-plan.md` 与线上实现逐字对应；`rustling-painting-bumblebee.md` 是已被取代的早期草稿（缺 `for`、多了一段重复 input、把 `addFocusSession` 标成"可选"）。**建议删/归档草稿**，否则后人会以为还要做。
2. 实现质量整体达标：schema 字段自动补全、100 截断、存档持久化、migrations/save-manager、i18n 三键、UI 回调流全部就位。
3. **一个真实残留问题：XSS**——label 经 `innerHTML` 未转义注入档案馆（history title + diary text），plan 的 edge case 自己写了"要转义"但实现没做；外加两个设计层待决项（100 上限 rationale、label 无激励导致数据稀疏）。

---

## 一、两份 plan 的关系

| 差异点 | `rustling-painting-bumblebee.md`（草稿） | `focus-session-label-plan.md`（定稿） | 线上代码 |
|---|---|---|---|
| `<label>` 的 `for` | 无 | 有 `for="focus-session-label"` | **有**（focus.js:909） |
| 重复 input 代码块 | 多一段 dlc-packs 参考块 | 已删 | 单 input |
| `addFocusSession` | "可新增（可选）" | "新增（必加）" | **已实现并调用**（storage.js:114 / orchestrator:230） |
| 弹窗宽度 | 未提 | `max-w-sm` 加宽到 `max-w-md` | `max-w-md`（focus.js:876） |

→ 线上实现 = 定稿。草稿是 AI 生成时的中间态，**无独立审阅价值**，直接归档即可。

---

## 二、代码锚点核实（全绿，功能已落地）

| plan 引用 | 实际位置 | 状态 |
|---|---|---|
| `state.focus.sessions` 新增数组 | `state.js:14` 已存在 | ✓（plan 称"新增"，实为已建，无冲突） |
| `showCompletionCard` 签名 `{...}, callback` | `focus.js:775` | ✓ 完全一致 |
| 输入框 + `callback(label)` | `focus.js:908-935`（读 `.value.trim().slice(0,40)`） | ✓ |
| orchestrator 接 label → 写 history/sessions/diary | `focus-orchestrator.js:219-247` | ✓ |
| `addFocusSession` 补 id/date/timestamp + 截断 100 | `storage.js:114-132` | ✓ schema 完全达标 |
| diary 支持 `focus_complete` + `diaryFocusLabelSuffix` | `diary.js:171`（已处理 label 后缀） | ✓ |
| i18n 三键 | `terms.js:669/670/1047` | ✓ |
| migrations 补 `focus.sessions` | `migrations.js:142-143` | ✓ |
| save-manager 导入补 `focus.sessions` | `save-manager.js:105` | ✓ |
| save.js 持久化 | `save.js:9` `{...state}` 整体序列化 | ✓（plan 说"保留 focus.sessions"，被 spread 自动覆盖，无需专项改） |

**唯一前提偏差**：plan 称"当前 focus 完成后没有写入墨墨日记，本期需新增 addDiaryEntry"。线上 `focus-orchestrator.js:241` 确实调了 `addDiaryEntry('focus_complete', {label})`，而 `diary.js` 早有 `focus_complete` 开场键脚手架——说明日记能力是既有底座，本期只是接上 label 与触发调用。非 bug，仅 plan 背景描述略旧。

---

## 三、P0 — XSS：label 未转义进 innerHTML（必改）

**链路**：玩家输入 label（如 `<img src=x onerror=alert(1)>`）→
- `focus-orchestrator.js:229` 拼进 history title：`专注 ${minutes} 分钟 · ${label}`
- `diary.js:171` 拼进日记：`fill(t('diaryFocusLabelSuffix'), {label})`
- `archive.js:87` `${h.title}` 与 `archive.js:225` `${entry.text}` 经模板字符串 → `div.innerHTML`（:95 / :231）**原样注入**

**后果**：单玩家本地是自 XSS（危害低）；但游戏支持存档**导入**（save-manager），一份含恶意 label 的存档被他人导入即触发——这是真实投递载体。plan 的 Edge Cases 明确写了"使用 textContent/模板转义，避免 XSS；不解析为 HTML"，**实现未遵守**。

**修复（二选一）**：
- 渲染侧兜底（推荐，顺带覆盖书名等动态字段）：在 `archive.js:87`、`:225` 注入前过 `escapeHtml()`；
- 或源头转义：orchestrator 拼 title、diary 拼 suffix 时对 label 先做 `escapeHtml()`。

`escapeHtml` 项目里若没有，加一个最小实现：
```js
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c =>
  ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
```

---

## 四、P1 — 设计层两个待决项

### 4.1 100 条上限的 rationale 缺失
plan 写"建议 100 条……足够做月度统计"，但没给为什么是 100 不是 200/365。按 ~1-2 次专注/天：
- 100 条 ≈ 50-100 天，**够看"近一两月"**，但撑不起 plan 自己许诺的"热力图（周几/时段分布）"跨年对比，也撑不起"月度统计"做多月环比。
- 单条约 150 字节，365 条 ≈ 55KB，存档增量可忽略。

**建议**：要么把上限提到 365（保留一整年，直接服务热力图），要么在 UI/文档里明说"仅保留最近 100 次"避免玩家误以为全量都在。`addFocusSession`（storage.js:130）改一个数字即可。

### 4.2 label 完全可选 + 零激励 → 未来统计可能数据稀疏
这个功能的**全部价值**在于"后期统计/可视化"，而统计质量取决于玩家愿不愿意填 label。现状：label 可选、填不填无任何反馈/奖励/成就，且结算卡主按钮是"继续"而非"保存标注"。

设计师视角的张力：**"不必填"保护了体验，但也掐灭了功能赖以存在的燃料。** 预期采纳率低 → 未来热力图大片空白。这不违背"不必填"约束，但应在 plan 里正视：要不要给一点轻推？
- 低侵入选项：结算卡显示"你已为 N 次专注留下注脚"（社交/成就感）；
- 或首个 label 触发一句墨墨日记彩蛋；
- 或"连续标注 N 次"进成就系统。

不强制，但**不设计任何 pull，就等于默认这个功能的数据层会偏空**。请在定稿里补一句设计判断。

---

## 五、P2 — 小 UX / 草稿冗余

| 项 | 说明 |
|---|---|
| 回车不提交 | input 无 `keydown` 监听，玩家输完按 Enter 无反应，必须点"继续"。建议 `labelInput.addEventListener('keydown', e => { if (e.key==='Enter') btn.click(); })`（focus.js:926 后） |
| 草稿冗余 | `rustling-painting-bumblebee.md` 多了 dlc-packs 参考块那段重复 input，定稿已删，归档草稿即可消除混淆 |
| 输入特殊字符 | 已 `slice(0,40)` 限长，但**未转义**（见 P0），限长 ≠ 安全 |

---

## 六、决策清单（待拍板）

| # | 事项 | 建议 | 必改？ |
|---|---|---|---|
| 1 | XSS：archive.js:87 / :225 注入前 escapeHtml | 渲染侧兜底 | **必改** |
| 2 | 100 上限 → 365 或明文告知截断窗口 | 看是否真要做跨年热力图 | 待定 |
| 3 | label 零激励 → 补一个轻推（注脚计数/首标彩蛋） | 否则统计层偏空 | 待定 |
| 4 | 回车提交 | focus.js 加 keydown | 建议改 |
| 5 | 删除/归档 `rustling-painting-bumblebee.md` | 避免误判"还要做" | 建议 |

**一句话收尾**：这是一份"已被自己实现追上的 plan"——定稿与代码一致、质量过关，唯一要补的是 XSS 转义；草稿无价值直接归档。设计上别忽略"可选+无激励"会让统计燃料不足这件小事。
