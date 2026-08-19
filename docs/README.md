# 归墟图书馆 · 文档目录说明

> 整理日期：2026-08-19
> 原则：活跃文档按性质分目录；已实施 / 已修复 / 过时的文档移入 `archive/`

---

## 目录结构

```
docs/
├── README.md                          # 本说明
│
├── aigc/                              # AIGC 大赛与外部评审材料
│   ├── FABLE5_PROJECT_BRIEF.md
│   ├── FABLE5_ROUND1_DIAGNOSIS.md
│   ├── FABLE5_ROUND2_XIACHAN.md
│   ├── AI工具使用清单_提交版.md
│   ├── aigc-pitch-deck.html
│   └── aigc-demo-video-script.md
│
├── guides/                            # 项目规范与写作指南
│   ├── glossary.md                    # 项目术语表
│   └── visitor-voice-guide.md         # 10 位访客声音锚点与写作规范
│
├── reference/                         # 数据整理与参考文档
│   └── economy-balance-reference.md   # 经济系统整理（平衡用）
│
├── archive/                           # 归档区：已实施、已修复、过时
│   ├── bugs/                          # 已修复 bug 的评审与记录
│   ├── changelogs/                    # 旧版变更日志
│   ├── plans/                         # 已实施的设计方案
│   └── fable5/                        # （预留）较早的 Fable 5 资料
│
├── bugs/                              # 当前待修复 / 待评审的 bug
├── changelogs/                        # 当前版本变更日志
├── diary/                             # 克克日记（跨项目）
├── plans/                             # 当前待实施 / 进行中的方案
├── prompts/                           # AI 生图 / 生视频 / 生音乐提示词
├── tech-debt/                         # 技术债记录
└── writing/                           # 访客叙事文案重写案例
```

---

## 各目录用途

| 目录 | 内容 | 维护频率 |
|---|---|---|
| `aigc/` | AIGC 大赛材料、Fable 5 诊断、pitch deck、视频脚本、AI 工具声明 | 赛前/评审前 |
| `guides/` | 项目术语、叙事写作规范等长期参考 | 按需 |
| `reference/` | 经济系统、数据盘点等整理型文档 | 版本迭代时 |
| `plans/` | 当前进行中的设计方案 | 持续 |
| `bugs/` | 当前待修复 / 待评审的 bug | 持续 |
| `changelogs/` | 当前版本变更日志 | 每次发布 |
| `tech-debt/` | 已知技术债 | 持续 |
| `writing/` | 访客叙事文案改写案例 | 持续 |
| `prompts/` | AI 生成提示词资产 | 随美术/音乐/视频需求 |
| `archive/` | 已落地、已修复、已过时文档 | 定期整理 |

---

## 归档规则

移入 `archive/` 的文档满足以下任一条件：

1. **已实现**：设计方案已落地到代码（如 localStorage 统一方案、访客纪念收集方案）
2. **已修复**：bug 已修复且评审结论已无行动项（如 Smart Quote 语法错误、音频开关问题）
3. **已过时**：决策已变更或被新方案取代（如 Godot 转向暂停前的 focus-room-scene 方案）
4. **纯历史记录**：旧版 changelog 等

---

## 新增文档时

1. 先判断文档性质（aigc / guide / plan / bug / tech-debt / writing / prompts / reference）
2. 放入对应活跃目录
3. 如果是临时草案且很快会过时，可直接放入 `archive/drafts/`（如需要可建）
4. 文档落地或过期后，及时移入 `archive/`

---

*整理：克克 | 2026-08-19*
