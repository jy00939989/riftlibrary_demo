---
status: done
importance: 2
anchors:
  - { type: file, path: "docs/plans/reconciliation/copy-eta-minutes.md", weight: 0.1 }
  - { type: file, path: "js/render/focus/progress-bar.js", weight: 0.1 }
  - { type: file, path: "scripts/test-copy-remaining.mjs", weight: 0.1 }
---

# 对账补录：誊抄室显示剩余分钟（copy-eta-minutes）

> 2026-09-14 落地（`df1d11f`），2026-09-16 对账锚定。
> 原始诉求见 `_todo-index.md` 「copy-eta-minutes（誊抄室显示剩余分钟，2026-09-11 图南提）」。

## 落地内容

- 新增纯函数 `estimateRemainingMinutes`，公式与 tick 结算严格对齐（100 字/分 × 倍率 / 冲刺 1.2 / 墨墨首会 ×10），进度条旁实时显示剩余分钟
- 渲染点：`js/render/focus/progress-bar.js`
- 测试：`scripts/test-copy-remaining.mjs`（21 项纯函数断言 + 全量回归零漂移）
