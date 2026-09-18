# Plan: 专注后项目标注（Focus Session Label）

## Context

有用户提出：希望每次专注结束后能输入"这次专注做了什么项目"，以便后续做统计和可视化（月度统计、热力表等）。该功能需：
- 输入框**不必填**
- 输入内容**长期保留**
- 会出现在**墨墨日志**里
- 数据结构设计要便于后期做统计/可视化
- 不需要和外部 planner/todo 联动

## Goal

在专注完成后的结算弹窗中增加一个可选的文本输入框，让玩家记录本次专注的项目/标签；输入内容持久化到存档，并同步进入馆史档案与墨墨日志，为后续热力图、月度统计等功能预留结构化数据。

## Recommended Approach

### 数据层：新增 `state.focus.sessions` 数组

在 `state.focus` 下新增 `sessions` 数组，作为专注记录的独立数据源。每条记录包含：

```javascript
{
  id: string,           // 唯一标识（时间戳+随机数）
  date: string,         // ISO 日期字符串，便于按天分组
  timestamp: number,    // Date.now()，精确时间
  minutes: number,      // 专注分钟数
  words: number,        // 誊抄字数
  coins: number,        // 获得智慧之光
  label: string,        // 用户输入的项目/标签（可能为空）
  bookId: string|null,  // 本次专注的书籍
  bookTitle: string,    // 书籍标题（冗余，便于后期离线统计）
  mode: string          // pomodoro / countdown / stopwatch
}
```

保留策略：限制数组长度（建议 **100 条**），超出时移除最旧记录。这个量级足够做月度统计，同时避免存档膨胀。

### UI 层：在结算弹窗加输入框

修改 `js/render/focus.js::showCompletionCard()`，在"继续"按钮上方插入一个可选输入框：

```html
<div class="bg-white/60 rounded-lg p-3 mb-3 text-left">
  <label class="text-xs text-ink-light block mb-1" for="focus-session-label">${t('focusSessionLabelPrompt')}</label>
  <input type="text" id="focus-session-label"
    class="w-full px-3 py-2 bg-white border border-wood rounded-lg text-sm text-ink focus:outline-none focus:border-magic-gold"
    placeholder="${t('focusSessionLabelPlaceholder')}" maxlength="40">
</div>
```

文案建议（符合缮写室调性）：
- 提示：`这笔抄写，是为哪一段时光留的痕？`
- placeholder：`写个项目名或留空……`

样式可参考 `js/render/dlc-packs.js` 中的兑换码输入框。

点击"继续"时读取输入框值，通过 callback 链向上传递。

### 流程层：把 label 传到 orchestrator

当前流程：
```
timer.js onComplete → app.js handleCompleteFocus → focus-session.js completeFocus → focus-orchestrator.js runFocusOrchestration → showCompletionCard
```

需要让 label 从弹窗逆流回 orchestrator，再写入 sessions/history/diary。推荐做法：

1. `showCompletionCard` 接收一个可选的 `onSubmit(label)` 回调，替代原来的无参 `callback`（或同时保留）。
2. 玩家点击"继续"时调用 `onSubmit(labelValue)`。
3. `runFocusOrchestration` 在显示结算卡时传入 `onSubmit`，收到 label 后再写历史、写日志、写 `focus.sessions`。

### 历史与日志

**馆史档案（history）**：
在 `js/core/focus-orchestrator.js` 的 `addHistory('focus', ...)` 处，如果 label 非空，把 label 拼入 `title`：

```javascript
const labelText = label ? ` · ${label}` : '';
addHistory('focus', `专注 ${minutes} 分钟${labelText}`, `誊抄 ${wordsGained.toLocaleString()} 字 · +${coinsEarned}智慧之光`);
```

这样玩家在档案馆里无需进入日记也能快速浏览每次专注的项目。

**墨墨日志（diary）**：
当前 focus 完成后**没有**写入墨墨日记。本期需要新增一次 `addDiaryEntry('focus_complete', vars)` 调用。

在 `js/diary.js` 的 `generateDiaryEntry('focus_complete', vars)` 中，如果传入 `label`，在 opening 后追加一句：

```javascript
const labelSentence = label ? `\n（这次是为「${label}」而写。）` : '';
```

需要新增对应的 i18n 模板键 `diaryFocusLabelSuffix`。

写入时机：在 `runFocusOrchestration` 收到 `label` 后、显示 action cards 之前，与 `addHistory('focus', ...)` 一起执行。

### Schema 同步

新增 `focus.sessions` 字段需要在以下文件同步：
- `js/state/state.js`：默认值 `sessions: []`
- `js/state/save.js`：`toSave.focus.sessions` 保留
- `js/state/migrations.js`：迁移时如果旧存档没有 `focus.sessions` 则补空数组
- `js/save-manager.js`：导入旧存档时同样补空数组

### 后续统计/可视化预留

`focus.sessions` 的结构已经为后续功能预留：
- 按 `date` 分组做每日/每月统计
- 按 `label` 分组做项目维度统计
- 按 `minutes` 做热力图（周几/时段分布）
- 按 `bookId` / `bookTitle` 做书籍维度统计

本期不实现可视化，但数据结构不再依赖解析 `state.history` 文本。

## Files to Modify

| 文件 | 改动内容 |
|---|---|
| `js/state/state.js` | `state.focus` 新增 `sessions: []` |
| `js/state/save.js` | 保存时保留 `focus.sessions` |
| `js/state/migrations.js` | 旧存档迁移时补 `focus.sessions: []` |
| `js/save-manager.js` | 导入旧存档时补 `focus.sessions: []` |
| `js/render/focus.js` | `showCompletionCard()` 添加输入框，callback 改为提交 label，弹窗宽度从 `max-w-sm` 加宽 |
| `js/core/focus-orchestrator.js` | 接收 label，写入 `focus.sessions`、history、diary |
| `js/diary.js` | `generateDiaryEntry()` 支持 focus label 后缀 |
| `js/i18n/terms.js` | 添加输入框提示、placeholder、日记后缀等文案 |
| `js/storage.js` | 新增 `addFocusSession(session)` 辅助函数 |

## Edge Cases

| 场景 | 处理 |
|---|---|
| 用户不填 label | 正常完成，label 为空字符串，不写入 history/diary 的 label 部分 |
| 输入超长 | input 设置 `maxlength="40"`，前端截断 |
| 输入特殊字符 | 使用 `textContent`/模板转义，避免 XSS；不解析为 HTML |
| 弹窗被外部点击关闭 | 当前结算卡没有外部关闭逻辑，保持原行为 |
| 旧存档无 sessions | migrations.js / save-manager.js 补空数组 |
| sessions 超过 100 条 | 新增时 `unshift` 并截断到 100 条 |
| 手动完成 vs 自动完成 | 自动完成也会弹出结算卡，玩家仍可输入 label |

## Verification Steps

1. 本地启动：`npm run dev`
2. 完成一次专注，结算弹窗出现输入框
3. 不填 label 点击继续：历史记录和日记保持原格式
4. 填写 label（如"写论文"）点击继续：
   - 历史记录显示 `专注 25 分钟 · 写论文`
   - 墨墨日志中出现 `（这次是为「写论文」而写。）`
   - `state.focus.sessions` 新增一条记录
5. 档案馆 → 馆史档案：能看到带 label 的历史条目
6. 档案馆 → 墨墨日志：能看到带 label 后缀的日记
7. 刷新页面：`state.focus.sessions` 持久化存在
8. 导入旧存档：`focus.sessions` 被补为空数组，不报错

## Risks & Fallbacks

| 风险 | 应对 |
|---|---|
| 弹窗 callback 链改动影响其他 popup | 仅修改 `showCompletionCard` 的 callback 签名，确保 orchestrator 传入正确回调；其他调用点没有 |
| 输入框破坏结算卡视觉 | 弹窗加宽到 `max-w-md`，统计块与输入框压缩纵向间距 |
| 存档体积增长 | 限制 100 条，单条约 150 字节，最大增量 ~15KB |
| 日记模板多语言 | 新增 i18n 键，英文版同步补充 |

## Out of Scope

- 本期不做月度统计/热力图等可视化
- 不与 riftplanner 或外部 todo 联动
- 不做标签自动补全/历史标签建议
- 不做多标签（tag）系统，只支持单条文本 label

## Implementation Notes

- `showCompletionCard` 当前签名：
  ```javascript
  showCompletionCard({ minutes, words, coins, book, streak, totalWords, nextMilestone, chapterInfo, nextPreview }, callback)
  ```
  建议改为：
  ```javascript
  showCompletionCard({ ... }, (label) => { ... })
  ```
  其中 `label` 为玩家输入字符串（可能为空）。

- 写入 `focus.sessions` 的时机应在收到 label 之后、但**在**显示 action cards / 后续弹窗之前，避免被其他弹窗打断导致 label 丢失。
