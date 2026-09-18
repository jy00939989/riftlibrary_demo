---
status: backlog
importance: 4
anchors:
  - { type: file, path: "docs/plans/curator-goals-renewal-plan.md", weight: 0.1 }
  - { type: file, path: "data/tiergoals.js", weight: 0.1 }
  - { type: file, path: "js/render/library.js", weight: 0.1 }
---

# 复兴之路重做：主线章节系统（curator-goals-renewal）

> 2026-09-16 图南 grill-me 九问全锁。前身待办：`_todo-index.md` curator-goals-renewal-optimize（2026-09-11 图南提）。
> **分工注记（2026-09-18）**：本文=战略层（方向与九问锁定）；实施细节以 `main-quest-chapter-system-plan.md` v3 为准（两者互挂，不 reopen）。
> 现行实现：`data/tiergoals.js` TIER_GOALS 五阶纯计数目标，挂氛围阶段，完成弹窗搭 D24 升阶仪式（tierPopupsShown 去重），奖励一次性金币+氛围。

## 锁定决策（grill-me 2026-09-16）

| # | 决策点 | 锁定 |
|---|---|---|
| 1 | 痛点 | 四个全中：子目标太被动 / 节奏失控 / 奖励太弱 / 系统边界模糊 → **重做非修补** |
| 2 | 定位 | **主线章节系统**——回答「我接下来该做什么」；成就=记录（做到了什么），升阶仪式=蜕变（馆何时变） |
| 3 | 形态 | **章-节混合**：每章 = 1 复合门槛（这座馆恢复到什么程度：计数+氛围/设施/仪式）+ 3~4 行为型小节（馆长亲自做的事） |
| 4 | 节奏 | **行为驱动 + 复合门**：小节完成驱动章节推进；章门含氛围/仪式条件但不再被 EXP 单独卡死 |
| 5 | 奖励 | **双层**：节完成=金币/灵感小奖（即时反馈）；章完成=铭牌（挂铭牌墙）+ 专属叙事回忆页（**展览厅成就柜陈列**——与成就柜咬合就此解决） |
| 6 | 章节数 | **扩到 7 章**：原 5 章 + 第 6 章「位面行者」（位面/展览厅/留声阁）+ 第 7 章「星辰守护者」（收藏/灾难/全员访客/大成），每章 3~4 节，共 22~28 节 |
| 7 | 追踪 | **轻量进度表** `state.questProgress`（每节一计数器）+ 既有事件回调处一行埋点；不吃现有痕迹（表达不了连续/同一对象），不依赖 backend track（离线不可用） |
| 8 | 仪式 | **解耦·双庆典**：章节完成自带庆祝（墨墨致辞+光扫，复用 witness toast 模式），不等升阶仪式；仪式仍是馆蜕变的独立庆典；章门含仪式条件时先仪式后章成，两者可同日叠加 |
| 9 | 引导 | **独立保留**：guideQuests 仍是新手前菜（5-15 分钟），第一章从引导完成后起算，不复用 q04/q05 |
| 10 | 迁移 | **幂等全量映射**：已完成的章→节全亮 + 铭牌补发 + 回忆页解锁；当前章按现有痕迹推算节进度；新章从现状继续 |

## 实施骨架（待出详细 plan 过架构评审）

1. 数据层：`data/questline.js` 七章节定义（门槛 check 纯函数 + 节事件契约 `{event, count}`），复用 tiergoals 的 i18n 模式（terms 键 + getTierTerm 式取词）
2. 进度层：`state.questProgress` + `incrementQuestEvent(event, n)` 单入口；埋点清单盘点（visitor return / repair / water / focus complete / exhibition room open / record buy …）
3. 迁移：老档按 tierPopupsShown + 痕迹幂等映射（决策 10）
4. 渲染：馆长办公室章节卡（替代现行 renderTierGoals 整卡）+ 章节庆祝（witness toast 模式）+ 铭牌墙挂章铭牌 + 成就柜陈列回忆页
5. 呈现细节（执行项，不另占决策）：专注完成时若有节进度则 toast 一句；下一章预告保留一行式
6. 验收：新档七章走通 / 老档映射 / 中途断线进度不丢 / 22-28 节埋点全覆盖测试
