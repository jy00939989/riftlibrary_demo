# 项目状态 · 2026-05-22

## 上次做了什么

- **协作基础设施**：创建 package.json / CONTRIBUTING.md / ISSUES.md（21个悬赏任务）
- **新手引导任务链**：10步线性任务（js/guidequests.js + render/guidequests.js），右下角挂件 + 6个集成触发点
- **360浏览器修复**：meta X-UA-Compatible + Google Fonts → fonts.loli.net
- **grill-me 访客重设计**：10位主位面访客全部定稿，包括人物背景、书籍偏好、三层还书事件（文档在 docs/discussion/VISITOR_REDESIGN_2026-05-22.md）
- **文档机制确立**：discussion/ 记录设计讨论，changelog/ 记录代码变更，diary/ 记录开发日记，STATUS.md 记录当前状态

## 接下来重点

### 优先
1. **访客系统重构** — 将 4 个 hardcode 角色替换为 10 个数据驱动访客
   - `js/visitors.js` 重构：事件层级系统（常/偶/稀）+ 好感度等级 + 书信收集
   - `state.js` 迁移：新的 visitor 数据结构
   - `render/visitors.js` 更新：10 位角色的 UI 展示
2. **书信/便签系统** — 双层设计（短便签 + 长信），待详细设计

### 后续
3. 位面系统后续内容（田园瘟疫纪事全角色全阶段）
4. 阿九推销书池改造
5. 古籍修复机制接入
6. 氛围升级全屏特效

## 当前阻塞

- Gitee Issues 推送（token 权限不足，需重新生成）
