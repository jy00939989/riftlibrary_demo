---
status: done
importance: 2
scheduledDate:
anchors:
  - { type: file, path: "data/plants.js", weight: 0.1 }
  - { type: file, path: "data/visitor-events.js", weight: 0.1 }
  - { type: file, path: "docs/marketing/2026-09-03-update-preview.md", weight: 0.1 }
  - { type: file, path: "docs/tech-debt/borrow-level-damage-reduction.md", weight: 0.1 }
  - { type: file, path: "js/backend/account-ui.js", weight: 0.1 }
  - { type: file, path: "js/core/book-progress.js", weight: 0.1 }
  - { type: file, path: "js/core/focus-session.js", weight: 0.1 }
  - { type: file, path: "js/i18n/terms.js", weight: 0.1 }
  - { type: file, path: "js/render/certificate.js", weight: 0.1 }
  - { type: file, path: "js/render/shop/library-upgrades.js", weight: 0.1 }
  - { type: file, path: "js/render/visitors.js", weight: 0.1 }
  - { type: file, path: "js/visitors.js", weight: 0.1 }
  - { type: file, path: "docs/plans/balance-tweaks-ledger.md", weight: 0.1 }
---

# balance tweaks ledger

> 本文档为**事后补录**（2026-09-07），drift 文件级锚点清单。
> 数值平衡微调链：氛围来源收窄落地（de9e33a）、借阅等级降损毁率+UI 展示（d37776a，09-07 核验沙龙横幅与升级弹窗均展示损毁率）、借阅时长收益（4f700d9）、浇水/谷雨/便签掉率（453691f、58b3d5b）、星光蕨掉率+修改密码+证书封面（9ec9d51）。

## 覆盖提交
- `de9e33a`（2026-08-19）balance: 氛围来源收窄落地（重抄×0.5/稀层10-15/Lv7还书5/植物10-15）
- `d37776a`（2026-09-03）feat: 借阅区等级降低还书损毁概率，沙龙/商店展示当前损毁率
- `4f700d9`（2026-09-03）balance: 借阅时长收益改为每6小时+3智慧之光
- `453691f`（2026-09-03）fix: 浇水机会扩展到正计时/倒计时；降低谷雨照料概率；降低便签掉落概率
- `58b3d5b`（2026-09-04）balance: 访客还书便签掉率 60%→40%（常层与终局后常层）
- `9ec9d51`（2026-08-25）feat: 星光蕨掉率60% + 已登录用户修改密码 + 证书封面强化
