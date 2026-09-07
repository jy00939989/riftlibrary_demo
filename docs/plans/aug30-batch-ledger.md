---
status: done
importance: 2
scheduledDate:
anchors:
  - { type: file, path: ".gitignore", weight: 0.1 }
  - { type: file, path: "data/books/book_034_vol1.js", weight: 0.1 }
  - { type: file, path: "data/books/book_034_vol2.js", weight: 0.1 }
  - { type: file, path: "data/borrow-levels.js", weight: 0.1 }
  - { type: file, path: "data/items.js", weight: 0.1 }
  - { type: file, path: "data/signboards.js", weight: 0.1 }
  - { type: file, path: "docs/plans/_todo-index.md", weight: 0.1 }
  - { type: file, path: "js/app.js", weight: 0.1 }
  - { type: file, path: "js/backend/redeem-code.js", weight: 0.1 }
  - { type: file, path: "js/core/economy.js", weight: 0.1 }
  - { type: file, path: "js/core/redeem.js", weight: 0.1 }
  - { type: file, path: "js/core/visitor-lookup.js", weight: 0.1 }
  - { type: file, path: "js/i18n/terms.js", weight: 0.1 }
  - { type: file, path: "js/render/library.js", weight: 0.1 }
  - { type: file, path: "js/render/shop.js", weight: 0.1 }
  - { type: file, path: "js/state/migrations.js", weight: 0.1 }
  - { type: file, path: "js/state/state.js", weight: 0.1 }
  - { type: file, path: "js/visitors.js", weight: 0.1 }
  - { type: file, path: "scripts/generate-redeem-codes.js", weight: 0.1 }
  - { type: file, path: "scripts/insert-no0-test-code.sql", weight: 0.1 }
  - { type: file, path: "scripts/verify-atmosphere-narrowing.js", weight: 0.1 }
  - { type: file, path: "supabase/functions/redeem-code/index.ts", weight: 0.1 }
  - { type: file, path: "supabase/migrations/20260827000000_redeem_code_system.sql", weight: 0.1 }
  - { type: file, path: "supabase/migrations/20260830000000_add_signboard_serial_number.sql", weight: 0.1 }
  - { type: file, path: "docs/plans/aug30-batch-ledger.md", weight: 0.1 }
---

# aug30 batch ledger

> 本文档为**事后补录**（2026-09-07），drift 文件级锚点清单。
> 8.30 批量：限量纪念牌序列号 + 借阅区配置真源（data/borrow-levels.js）+ 氛围来源收窄校验脚本 + book_034 分卷。语义分别见 _todo-index 道具节与 atmosphere-source-narrowing（已归档）。

## 覆盖提交
- `d1ba238`（2026-08-30）feat: 8.30 限量纪念牌编号、借阅区配置真源与氛围来源收窄校验
