---
status: done
importance: 2
scheduledDate:
anchors:
  - { type: file, path: "js/audio.js", weight: 0.1 }
  - { type: file, path: "js/app.js", weight: 0.1 }
  - { type: file, path: "js/ambient.js", weight: 0.1 }
  - { type: file, path: "js/render/music-selector.js", weight: 0.1 }
  - { type: file, path: "js/i18n/terms.js", weight: 0.1 }
---

# 音频逻辑重塑 · 对账补录（audio-logic-reshape）

> 本文档为**事后补录**（对账发现 c750b43 音频行为改动无方案锚点，2026-09-04 补写）。
> 实现已完成并入库且**至今仍是现行设计**；动机为对账重构，**待图南确认是否符合当时真实意图**。
> 注：c750b43 是四合一复合提交（音频重塑 + docs 归档整理 + AIGC 材料 + 新建后端/神模块两份计划），本文档只锚音频部分，docs 部分自解释。

---

## 决策摘要

| 项 | 结论 |
|---|---|
| 打开页面 | **不自动播放**任何 BGM/环境音（浏览器自动播放政策合规） |
| BGM/环境音启动 | 必须由**显式触发器**启动：专注开始、音符面板选曲、小喇叭 |
| 小喇叭（music-toggle） | 一键全静音 / 再按恢复（music/sfx/ambient 三路聚合判断） |
| 音频上下文 | `ensureAudioContext()` 替代 `onFirstInteraction`，只管解锁，不管播放 |

## 实现现状（c750b43 落地，2026-09-04 复核仍在现行）

- `js/audio.js`：`ensureAudioContext()`（:326 注释明确「不再自动播放，必须由专注开始、音符面板、小喇叭等显式触发器启动」）；`updateToggleIcon()` 按 `musicEnabled || sfxEnabled || ambientEnabled` 聚合切换 🔈/🔇
- `js/app.js`（20 行）：启动流程接入新音频上下文时序
- `js/ambient.js`（5 行）：环境音状态与 UI 同步
- `js/render/music-selector.js`（17 行）：面板状态同步
- `js/i18n/terms.js`（+1 词条）

## 后续演变（勿当成漂移）

1. **TRACK_DEFS 已迁出**：`js/audio.js` → `data/music.js`（留声阁唱片系统，2026-08-26/09-03）；`library-music-expansion-plan.md` 中「`js/audio.js` 的 TRACK_DEFS」字样按现状理解为 `data/music.js`。
2. **音量分路方案**（`docs/archive/plans/volume-split-plan.md`）在同提交归档，独立音量控制后续已另落地（2026-07-28 会话）。
3. 2026-09-04 「跳过重复动画」设置开关挂在 🎼 面板底部（`js/render/music-selector.js` +22），属动画接入，与本方案无关。

## 边界与待确认

1. 「打开不自动播放」与 8-01「专注 BGM 移除」的关系：当前设计是**专注开始时才触发** BGM+环境音（不是常驻 BGM），两者方向一致，但当时是否一次决策分两步落地，待确认。
2. 小喇叭恢复时恢复的是「静音前三路开关状态」还是「全开」，按 `settings` 布尔值语义即前者，未做迁移补偿。

## 相关文件

- `js/audio.js`、`js/app.js`、`js/ambient.js`、`js/render/music-selector.js`、`js/i18n/terms.js`
- 对账提交：`c750b43`（2026-08-11）
