---
status: done
importance: 2
scheduledDate:
anchors:
  - { type: file, path: "docs/AI工具使用清单_提交版.md", weight: 0.1 }
  - { type: file, path: "docs/README.md", weight: 0.1 }
  - { type: file, path: "docs/aigc-demo-video-script.md", weight: 0.1 }
  - { type: file, path: "docs/aigc-pitch-deck.html", weight: 0.1 }
  - { type: file, path: "docs/aigc/AI工具使用清单_提交版.md", weight: 0.1 }
  - { type: file, path: "docs/aigc/aigc-pitch-deck.html", weight: 0.1 }
  - { type: file, path: "docs/archive/bugs/2026-06-04-smart-quote-syntax-error.md", weight: 0.1 }
  - { type: file, path: "docs/archive/bugs/2026-07-29-visitor-favor-balance-issue-review.md", weight: 0.1 }
  - { type: file, path: "docs/archive/bugs/2026-07-29-visitor-favor-balance-issue.md", weight: 0.1 }
  - { type: file, path: "docs/archive/bugs/2026-08-01-audio-music-toggle-issue-review.md", weight: 0.1 }
  - { type: file, path: "docs/archive/changelogs/2026-06-03-changelog.md", weight: 0.1 }
  - { type: file, path: "docs/archive/plans/core-extraction-plan.md", weight: 0.1 }
  - { type: file, path: "docs/archive/plans/focus-room-scene-2026-06-05.md", weight: 0.1 }
  - { type: file, path: "docs/archive/plans/intro-language-god-module-split-plan.md", weight: 0.1 }
  - { type: file, path: "docs/archive/plans/localStorage-unification-plan-review.md", weight: 0.1 }
  - { type: file, path: "docs/archive/plans/localStorage-unification-plan.md", weight: 0.1 }
  - { type: file, path: "docs/archive/plans/visitor-memory-collection-plan.md", weight: 0.1 }
  - { type: file, path: "docs/archive/plans/volume-split-plan.md", weight: 0.1 }
  - { type: file, path: "docs/plans/backend-supabase-implementation-plan.md", weight: 0.1 }
  - { type: file, path: "docs/plans/docs-reorg-and-aigc-materials.md", weight: 0.1 }
  - { type: file, path: "docs/plans/god-module-split-plan.md", weight: 0.1 }
  - { type: file, path: "docs/prompts/book-cover-prompts-batch.md", weight: 0.1 }
  - { type: file, path: "docs/tech-debt/plants-post-reward-and-abandon.md", weight: 0.1 }
  - { type: file, path: "scripts/extract-book-meta.mjs", weight: 0.1 }
  - { type: file, path: "scripts/generate-book-cover-prompts.mjs", weight: 0.1 }
---

# c750b43 剩余部分对账补录——docs 归档整理 + AIGC 材料 + 计划文档入库

> 本文档为**事后补录**（2026-09-07）。c750b43 是四合一复合提交（2026-08-11），音频部分已由
> [audio-logic-reshape.md](audio-logic-reshape.md) 锚定；本文档锚其余三部分，均为**文档侧改动，无代码行为变化**。

---

## 一、docs 归档整理

- 11 份历史文档移入 `docs/archive/`（bugs 4 份、changelogs 1 份、plans 6 份），纯移动零内容改动
- 新增 `docs/README.md` 文档导览页

## 二、AIGC 大赛材料入库（对应 2026-08-10 工作）

- `docs/aigc-pitch-deck.html`：参赛 pitch deck（515 行单文件）
- `docs/aigc-demo-video-script.md`：演示视频脚本
- `docs/AI工具使用清单_提交版.md`：AI 工具使用清单定稿

## 三、三份计划文档入库（文档即交付物）

| 文档 | 后续状态（2026-09-07 注记） |
|---|---|
| `docs/plans/god-module-split-plan.md` | **已全部落地**（2026-09-04 清账，app.js 286 行、shop.js shim 化） |
| `docs/plans/backend-supabase-implementation-plan.md` | Phase 1–2 已落地（Supabase 接入、存档同步），**Phase 3–5 待做**（planner backlog） |
| `docs/tech-debt/plants-post-reward-and-abandon.md` | **仍开放**（planner backlog：后期动力 + 废弃按钮） |
