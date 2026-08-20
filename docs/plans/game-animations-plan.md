---
status: backlog
importance: 4
scheduledDate:
---

# 游戏动画制作与导入计划

> 目标：为氛围升级、房间解锁、书籍上架、访客抵达、专注完成等关键节点制作轻量动画，并导入游戏，提升反馈感与仪式感。

---

## 需要动画覆盖的节点

| 节点 | 触发时机 | 动画方向 | 优先级 |
|---|---|---|---|
| 氛围升级 | 氛围达到新阶段（ ruined → cozy → stellar 等） | 场景光照/粒子过渡、背景图溶解切换 | P0 |
| 房间解锁 | 缮写室/借阅区/修复室首次升级 | 门打开、灯光亮起、尘埃飞散 | P0 |
| 书籍上架 | 新书购买/解锁后首次放入书架 | 书本飞入书架、书架微光 | P1 |
| 访客抵达 | 新访客首次出现 | 门推开、角色淡入、光环浮现 | P1 |
| 专注完成 | 一次专注结束 | 墨水瓶发光、羽毛笔收起、小庆祝 | P0 |
| 植物成长 | 植物升级/浇水/收获 | 生长缩放、叶子展开、粒子飘落 | P1 |
| 成就解锁 | 新成就达成 | 徽章翻转、光芒爆发 | P1 |
| 书籍完成 | 一本书抄完 | 书闭合、印章落下、章节展开 | P0 |

---

## 技术方案

### 一、优先使用 CSS / SVG / Lottie

1. **CSS 动画**：用于简单位移、缩放、透明度变化（氛围升级光晕、按钮反馈）。
2. **SVG 动画**：用于路径描边、形状变形（书页翻开、羽毛笔移动）。
3. **Lottie (JSON)**：复杂角色/粒子动画，可导出自 After Effects，文件小、性能好。
4. **Canvas 粒子**：仅用于氛围升级、收获等需要大量粒子的场景，且提供开关。

### 二、资源规范

| 项目 | 建议 |
|---|---|
| 格式 | Lottie JSON / SVG / CSS keyframes |
| 帧率 | 30fps 为主，关键动画 60fps |
| 时长 | 0.5~2 秒，不阻塞玩家操作 |
| 文件大小 | 单个 Lottie < 100KB，SVG < 20KB |
| 命名 | `anim_{node}_{variant}.json` / `anim_{node}.css` |
| 目录 | `assets/animations/` |

### 三、导入方式

```js
// data/animations.js
export const ANIMATIONS = {
  atmosphere_upgrade: {
    id: 'atmosphere_upgrade',
    type: 'lottie',
    src: 'assets/animations/anim_atmosphere_upgrade.json',
    trigger: 'atmosphere_stage_change',
    duration: 1200,
    skippable: true
  },
  focus_complete: {
    id: 'focus_complete',
    type: 'css',
    src: 'assets/animations/anim_focus_complete.css',
    trigger: 'focus_complete',
    duration: 800
  },
  // ...
};
```

---

## 制作流程

1. **列出动画清单**：按上表确定首批 P0 动画。
2. **风格定调**：参考 parchment/wood 视觉，确定动画色调（琥珀金、墨黑、暖白）。
3. **原型制作**：用 CSS/SVG 快速做 3 个 P0 动画原型。
4. **玩家测试**：确认动画不拖沓、不刺眼。
5. **批量生产**：剩余 P1 动画。
6. **性能优化**：统一入口管理，提供「减少动画」可访问性选项。

---

## 验收标准

- [ ] 氛围升级、房间解锁、专注完成、书籍完成四个 P0 节点有动画
- [ ] 动画播放期间不阻塞核心交互（可跳过或后台播放）
- [ ] 提供「关闭动画」或「减少动画」设置项
- [ ] 移动端 60fps，低端设备可降级为静态效果
- [ ] 动画资源总大小 < 1MB（首期）

---

## 相关文件

- `js/render/animations.js`（现有弹窗动画可扩展）
- `js/storage.js`（氛围升级触发点）
- `js/core/focus-orchestrator.js`（专注完成触发点）
- `js/render/bookshelf.js`（书籍上架触发点）
- `js/render/focus.js`（房间解锁触发点）
