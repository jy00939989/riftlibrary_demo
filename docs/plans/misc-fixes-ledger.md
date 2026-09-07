---
status: done
importance: 2
scheduledDate:
anchors:
  - { type: file, path: ".gitignore", weight: 0.1 }
  - { type: file, path: "data/music.js", weight: 0.1 }
  - { type: file, path: "docs/marketing/2026-09-03-update-preview.md", weight: 0.1 }
  - { type: file, path: "js/render/common.js", weight: 0.1 }
  - { type: file, path: "js/render/dlc-packs.js", weight: 0.1 }
  - { type: file, path: "js/render/focus.js", weight: 0.1 }
  - { type: file, path: "js/render/music-selector.js", weight: 0.1 }
  - { type: file, path: "server.log", weight: 0.1 }
---

# misc fixes ledger

> 本文档为**事后补录**（2026-09-07），drift 文件级锚点清单。
> 杂项小修：server.log 移除入 .gitignore（af955ee）、dlc-packs.js 错误导入热修（a3ad51a）、音频英文 slug 改名+gitignore（3c51ac2）、9 月更新预告 marketing 文档（9c2a7e2）。

## 覆盖提交
- `af955ee`（2026-08-20）chore: 移除 server.log 并加入 .gitignore
- `a3ad51a`（2026-08-18）fix(dlc-packs): 从common.js错误导入t导致模块加载失败
- `3c51ac2`（2026-09-07）chore: 音频英文 slug 改名（6 demo 曲入 audio/music/）+ temple/ raw PNG 与 temp/ 下架出 git
- `9c2a7e2`（2026-09-03）docs: 9月上旬更新预告
