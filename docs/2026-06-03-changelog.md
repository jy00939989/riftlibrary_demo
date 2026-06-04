# 2026-06-03 开发日志

## 完成的功能

### UI-02 · 墨墨持久建议气泡
- **新文件**: `js/render/momo-suggestion.js`
- 右下角固定气泡，8 种情境优先级建议 + 10 条随机鼓励语
- 5 分钟暂隐、切标签刷新、点击换一条
- 接入 `app.js` 的 `renderCurrentTab()` 和 `switchTab()`

### UI-05 · 成就墨墨点评
- **修改**: `js/render/achievements.js`
- 6 大成就类别各 4 条墨墨风格点评
- 每日不重复追踪（`state.momoCommentUsedToday`）
- 成就 Toast 中新增 `🦉 墨墨说：……` 行

### 访客好感条
- **修改**: `js/render/visitors.js`
- 访客卡片中"好感 N"文字 → 爱心 + 进度条 + 数值 + 本次增量
- 颜色四档：灰(<30) → 蓝(30-59) → 金(60-99) → 紫 💖(100+)
- 使用全局 `state.visitorFavors[charId]` 持久值

### 墨墨日志升级（三合一）
- **4A 视觉**: 装帧卡四级 CSS 样式（虚线缝边 → 皮面金角 → 流光呼吸光晕）
- **4B 功能**: Lv3+ 显示"📖 回顾"按钮，弹窗汇总事件类型/高频书籍/访客；Lv4 书籍完成和里程碑条目加 ✨
- **4C 奖励**: 30/60/90 页触发，墨墨说话 + 智慧之光 + 氛围
- 涉及 `js/diary.js`、`js/render/archive.js`、`js/render/animations.js`、`js/state.js`、`css/style.css`

### 访客便签样式（纯 CSS）
- **修改**: `js/render/visitors.js` + `css/style.css`
- 10 位访客各不同纸纹：象牙稿纸/便利贴黄/旧收据/公文网格/横线笔记本/撕边纸/水彩渐变/高级奶白/闪光粉/牛皮纸板
- 应用于还书弹窗中的常层便签和终局后消息

### 访客立绘槽位
- **新目录**: `visual/visitors/`
- `getVisitorPortrait()` 函数：`<img>` 加载 PNG 立绘，`onerror` 自动回退 emoji
- 应用于读者沙龙卡片（sm）和还书弹窗（lg）
- README 含 10 位角色的 AI 生图 prompt 建议

## 新增 i18n 基础

- `docs/glossary.md` — 中英名词对照表（~60 个术语，9 大类）
- `js/i18n/terms.js` — 核心术语常量模块（`T` 对象 + 5 个分组常量）

## 状态新增字段

```javascript
momoCommentUsedToday: { date: '', comments: [] }  // 成就点评今日已用
diaryLevelRewardsClaimed: []                       // 日志装帧升级奖励领取记录
```

## 修改的文件清单

| 文件 | 操作 |
|------|------|
| `js/render/momo-suggestion.js` | **新建** |
| `js/i18n/terms.js` | **新建** |
| `docs/glossary.md` | **新建** |
| `docs/2026-06-03-changelog.md` | **新建** |
| `visual/visitors/.gitkeep` | **新建** |
| `visual/visitors/README.md` | **新建** |
| `js/app.js` | 修改（Momo 建议接入） |
| `js/state.js` | 修改（新字段 + 迁移） |
| `js/render/achievements.js` | 修改（墨墨成就点评） |
| `js/render/visitors.js` | 修改（好感条 + 便签样式 + 立绘） |
| `js/render/archive.js` | 修改（日志升级视觉 + 回顾 + 火花） |
| `js/render/animations.js` | 修改（新增 `showDiaryLevelUpPopup`） |
| `js/render/index.js` | 修改（导出新函数） |
| `js/diary.js` | 修改（装帧升级检测 + 奖励） |
| `css/style.css` | 修改（建议气泡 + 好感条 + 装帧样式 + 便签样式 + 立绘） |

## 未完成 / 明天继续

- 访客好感度系统深度整合（讨论已做，实现待排期）
- 克克小手机项目（方案已写，新建独立仓库开始实现）
