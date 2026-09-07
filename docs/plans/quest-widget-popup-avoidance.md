---
status: done
importance: 2
scheduledDate:
anchors:
  - { type: file, path: "js/render/guidequests.js", weight: 0.1 }
  - { type: file, path: "js/render/plants.js", weight: 0.1 }
  - { type: file, path: "js/render/shared/visitor-cards.js", weight: 0.1 }
  - { type: file, path: "docs/plans/quest-widget-popup-avoidance.md", weight: 0.1 }
---

# quest widget popup avoidance

> 本文档为**事后补录**（2026-09-07），drift 文件级锚点清单。
> 右下角弹窗避让（2026-09-07 用户反馈：引导任务卡被访客卡片/植物成熟提示覆盖）：guidequests.js 新增 suppressGuideWidget 计数器，visitor-cards.js 四处 + plants.js 成熟提示打开期间隐藏任务卡，关闭后恢复。真机验证中。

## 覆盖提交
- `6f3184f`（2026-09-07）fix: 右下角弹窗避让——访客卡片/植物成熟提示打开期间隐藏引导任务卡（suppressGuideWidget 计数器 + 幂等 release）
