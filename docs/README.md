# 归墟图书馆 · 文档目录说明

> 整理日期：2026-08-10  
> 原则：活跃文档留在当前位置，已实施 / 已修复 / 过时的文档移入 `archive/`

---

## 目录结构

```
docs/
├── README.md                          # 本说明
├── glossary.md                        # 项目术语表
├── visitor-voice-guide.md             # 10 位访客声音锚点与写作规范
├── FABLE5_PROJECT_BRIEF.md            # Fable 5 项目诊断输入文档
├── FABLE5_ROUND1_DIAGNOSIS.md         # Fable 5 第一轮诊断结果
├── FABLE5_ROUND2_XIACHAN.md           # 夏蝉叙事重写案例
├── AI工具使用清单_提交版.md            # AIGC 大赛 AI 工具使用声明
├── aigc-pitch-deck.html               # AIGC 大赛 pitch deck
├── aigc-demo-video-script.md          # AIGC 大赛演示视频脚本
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
├── prompts/                           # AI 生图 / 生视频提示词
├── tech-debt/                         # 技术债记录
└── writing/                           # 访客叙事文案重写案例
```

---

## 归档规则

移入 `archive/` 的文档满足以下任一条件：

1. **已实现**：设计方案已落地到代码（如 localStorage 统一方案、访客纪念收集方案）
2. **已修复**：bug 已修复且评审结论已无行动项（如 Smart Quote 语法错误、音频开关问题）
3. **已过时**：决策已变更或被新方案取代（如 Godot 转向暂停前的 focus-room-scene 方案）
4. **纯历史记录**：旧版 changelog 等

---

## 活跃文档使用说明

| 文档 | 用途 | 维护频率 |
|---|---|---|
| `glossary.md` | 统一项目术语 | 按需 |
| `visitor-voice-guide.md` | 访客叙事写作参考 | 叙事重写时 |
| `FABLE5_PROJECT_BRIEF.md` | 给外部评审/AI 的项目说明书 | 大版本更新时 |
| `aigc-pitch-deck.html` | AIGC 大赛 pitch deck | 赛前 |
| `aigc-demo-video-script.md` | AIGC 大赛视频脚本 | 赛前 |
| `plans/*` | 当前进行中的设计 | 持续 |
| `tech-debt/*` | 已知技术债 | 持续 |
| `writing/*` | 叙事文案改写案例 | 持续 |

---

## 新增文档时

1. 先判断文档性质（bug / plan / tech-debt / writing / submission）
2. 放入对应活跃目录
3. 如果是临时草案且很快会过时，可直接放入 `archive/drafts/`（如需要可建）
4. 文档落地或过期后，及时移入 `archive/`

---

*整理：克克 | 2026-08-10*
