# 归墟图书馆 · 文档目录说明

> 整理日期：2026-09-18（对 08-19 版全面刷新）
> 原则：活跃文档按性质分目录；已实施 / 已修复 / 过时的文档移入 `archive/`

---

## 目录结构

```
docs/
├── README.md                          # 本说明
│
├── aigc/                              # AIGC 大赛与外部评审材料
│   ├── FABLE5_PROJECT_BRIEF.md / ROUND1_DIAGNOSIS / ROUND2_XIACHAN
│   ├── AI工具使用清单_提交版.md
│   ├── aigc-pitch-deck.html
│   ├── aigc-demo-video-script.md / shooting-guide
│   └── competition-shanghai-aigc-2026/    # 报名表/玩法描述/AI 声明/提交清单
│
├── marketing/                         # 玩家向：更新预告、小红书文案
│
├── plans/                             # 当前待实施 / 进行中的方案（~25 份）
│   ├── _todo-index.md                 # 全 plan 待办总索引 + drift 记录（先进这个）
│   ├── sink-ledger.md                 # 经济 faucet/sink 台账（纪律文档，与 plans 平级）
│   ├── reconciliation/                # 对账 manifest 与批次 ledger（17 份）
│   └── reviews/                       # 各 plan 的架构评审记录（12 份）
│
├── prompts/                           # AI 生图 / 生视频 / 生音乐提示词
│
├── reference/                         # 数据整理与参考文档
│   ├── economy-balance-reference.md   # 经济系统整理（平衡用）
│   └── favor-balance-montecarlo.py    # 好感度蒙特卡洛仿真
│
├── tech-debt/                         # 技术债记录
│
├── updates/                           # 发布向：部署准备清单
│
├── writing/                           # 内容生产：访客叙事改写 + 书籍文案计划
│   ├── *_rewrite.md ×10               # 10 位访客声音重写案例
│   ├── fulltext-books-batch1.md       # 全文入库批次（自 plans/ 移入）
│   ├── public-domain-linear-copy-plan.md
│   └── xiachan-text-rewrite-plan.md
│
└── archive/                           # 归档区：已实施、已修复、过时
    ├── bugs/                          # 已修复 bug 的评审与记录
    ├── changelogs/                    # 旧版变更日志
    ├── guides/                        # 术语表/访客声音/后端 FAQ——仍被活跃引用（写作、后端 plan 锚点）
    └── plans/                         # 已落地的设计方案（含 -completed 续档与对应 review）
```

---

## 各目录用途

| 目录 | 内容 | 维护频率 |
|---|---|---|
| `aigc/` | 大赛材料、Fable 5 诊断、pitch deck、视频脚本、AI 工具声明 | 赛前/评审前 |
| `marketing/` | 玩家向更新预告、小红书文案 | 每次发布 |
| `plans/` | 当前进行中的设计方案；`_todo-index.md` 为总入口 | 持续 |
| `plans/reconciliation/` | 对账 manifest / 批次 ledger（历史记录，只追加不改写） | 每次批次对账 |
| `plans/reviews/` | plan 的架构评审记录（评审对象移档时评审留原地） | 每次评审 |
| `prompts/` | AI 生成提示词资产 | 随美术/音乐/视频需求 |
| `reference/` | 经济整理、仿真脚本等参考 | 版本迭代时 |
| `tech-debt/` | 已知技术债 | 持续 |
| `updates/` | 部署准备清单 | 每次发布 |
| `writing/` | 访客叙事改写、书籍文案/入库计划等内容生产文档 | 持续 |
| `archive/` | 已落地、已修复、已过时文档 | 定期整理 |

---

## 归档规则

移入 `archive/` 的文档满足以下任一条件：

1. **已实现**：设计方案已落地到代码（如 localStorage 统一方案、日界重构）
2. **已修复**：bug 已修复且评审结论已无行动项
3. **已过时**：决策已变更或被新方案取代（归档时挂「被××吸收/取代」注记，如 visitor-borrow-duration）
4. **纯历史记录**：旧版 changelog、对账 manifest 快照

---

## 移档纪律（2026-09-18 整理后补充）

1. **用 `git mv`** 保留历史；移动后立即全文 grep 旧路径，修引用者（锚点、`_todo-index.md`、相关 plan 正文）
2. 文档 frontmatter 里的**自指锚点路径**随手更新到新位置
3. 被移 plan 在 `_todo-index.md` 的节标题挂「已归档/已移档 + 日期」标记
4. `reconciliation/` 下的历史 manifest 快照**不追改**——它们是时点记录
5. `archive/guides/` 三件套（术语表/访客声音/后端 FAQ）仍被活跃引用，移档时引用改指 archive 路径，**不要**因为进了 archive 就当死档

---

## 新增文档时

1. 先判断文档性质（aigc / marketing / plan / prompt / reference / tech-debt / update / writing）
2. 放入对应活跃目录；内容生产类（书籍文案、访客改写）进 `writing/` 而非 `plans/`
3. plan 类文档建 frontmatter 锚点（`status` / `importance` / `anchors`），并登记 `_todo-index.md`
4. 文档落地或过期后按归档规则移入 `archive/`，同步走移档纪律

---

*整理：克克 | 2026-09-18（基于 2026-08-19 版刷新）*
