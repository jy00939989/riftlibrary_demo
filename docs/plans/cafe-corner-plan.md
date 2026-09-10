---
status: backlog
importance: 3
scheduledDate:
anchors:
  - { type: file, path: "docs/plans/cafe-corner-plan.md", weight: 0.1 }
  - { type: file, path: "js/render/shop/library-upgrades.js", weight: 0.1 }
  - { type: file, path: "js/visitors.js", weight: 0.1 }
  - { type: file, path: "js/capacity.js", weight: 0.1 }
  - { type: file, path: "data/plants.js", weight: 0.1 }
  - { type: file, path: "data/atmosphere.js", weight: 0.1 }
  - { type: file, path: "js/state/state.js", weight: 0.1 }
  - { type: file, path: "js/state/migrations.js", weight: 0.1 }
  - { type: file, path: "js/i18n/terms.js", weight: 0.1 }
  - { type: file, path: "js/core/visitor-lookup.js", weight: 0.1 }
  - { type: file, path: "scripts/verify-atmosphere-narrowing.js", weight: 0.1 }
---

# 咖啡角计划（cafe-corner-plan）

> 立项：2026-09-10。所属：氛围系统重设计 v4.3 **Phase 4 场馆房间** 第一批（房间定版：咖啡角 / 温室 / 展览厅；天文台、印刷坊否决，庭院缓做）。
> 上游文档：`atmosphere-system-redesign-plan.md` §四（venue 方案 v4 形态）、`atmosphere-venue-map-design.md`（v3 旧案，经济层已死、玩法层参考）。
> 本文档供架构师评审；评审通过前不动代码。

---

## 一、定位与决策来源

**咖啡角 = 商店占位卡转正的场馆房间**：访客招待空间 + 植物产出的消费口 + 金币建造/升级消费口。

图南决策（2026-09-10，口头锁定）：

| # | 决策点 | 结论 |
|---|---|---|
| 1 | 茶室去留 | **茶室被咖啡角吸收，只留咖啡角**（原商店「☕ 咖啡角 · 延长访客停留时间」占位卡转正，占位文案并进正式收益） |
| 2 | 访客进店方式 | **自动**——不做手动邀约/请客 |
| 3 | 玩法形态 | **食谱制作 + 客人自动取用**：玩家用植物材料制作饮品点心入库存，浏览中的访客自动消费 |
| 4 | 等级 | **要升级**——等级影响座位数/食谱解锁/收益 |

连锁价值：咖啡角吃种子 → 温室有动力加种植物 → 接住「5 颗种子兑换完限定书后种植意义」开放项（plants-after-seed-exchange-meaning）。

## 二、系统设计

### 2.1 状态结构

```js
state.cafe = {
  unlocked: false,
  level: 0,                        // 1-5，0 = 未建造
  stock: { vanilla_tea: 3, ... },  // 库存：recipeId -> 件数
  totalServed: 0,                  // 累计招待（统计/成就用）
  lastServeDay: null               // 末次营业日（日结/防刷可选）
}
```

迁移：`js/state/migrations.js` 新 migrate 版本，`state.cafe ||= 默认值`，老档零破坏。

### 2.2 建造与升级

| 项 | 值 | 说明 |
|---|---|---|
| 建造门槛 | **图书馆 ≥ 2 阶** + 💰1500 | 2 阶=破败（有缮写室+借阅区），小馆配咖啡角的叙事节点 |
| 等级上限 | **level ≤ stage + 1**（复用 D22 设施门槛模式，`data/atmosphere.js` 同款语义） | 5 级满级需 4 阶；与设施/升阶系统同一正循环 |
| 升级费 | 600 × 1.6ⁿ（n=当前等级） | 对齐借阅区 500×1.5ⁿ / 缮写室 400×1.45ⁿ 的量级家族 |
| 每级收益 | +1 座位（同时招待访客数）+ 新食谱解锁（见 2.3） | Lv1 开局 1 座位 |

金币出口定位：建造 1500 + 升满约 600×(1.6+1.6²+1.6³+1.6⁴)≈10400，对照仿真「硬核年结余 ~4 万 vs 消耗 ~2.1 万」的通胀缺口，咖啡角是消费口之一（非唯一，展览厅后续分担）。

### 2.3 食谱表（`data/cafe.js` 单一真源）

| 食谱 | 材料 | 售价 | 好感 | 解锁等级 |
|---|---|---|---|---|
| 🍵 香草茶 | 2 鹤望兰种子 | 15💰 | +4 | Lv1 |
| 🌹 玫瑰露 | 2 魔法玫瑰种子 | 20💰 | +6 | Lv1 |
| ✨ 星蕨特调 | 3 星光蕨种子 | 35💰 | +10 | Lv3 |

- 材料 = **种子**（植物收获 60% 掉落，现有 `seedType/seedDropRate` 字段不动）。
- 制作不花金币，只花种子——金币 sink 由建造/升级独立承担，材料 sink 由种子承担。
- 食谱可扩展：温室批次加新植物时同步加食谱（开放项，见 §六）。

### 2.4 自动营业规则

挂在现有 `tickVisitorBrowsing`（`js/visitors.js`）同 tick 内，借阅判定之前：

1. 访客状态 browsing + 咖啡角已建 + 库存非空 + 当前在店访客数 < 座位数 → 以概率 **25%/tick** 进店。
2. 进店即取一件库存（按库存加权随机 or 优先高价值？**默认：均匀随机**，保持简单）。
3. 结算：玩家得食谱售价智慧之光（访客付账）、访客好感 +食谱值、**该访客本次停留时长延长**（原咖啡角占位功能并入：+N tick 或等效 browseTime 延长 → 更多浏览 tick = 更多借阅机会与好感 tick）。
4. 产出**不加氛围**：EXP 获取速率是仿真定版锚点（硬核 166 天首通），不开新 EXP faucet。
5. 每次招待写 history（低频事件，不刷屏——同访客同次进店只记一次）。

并发与边界：同一 tick 多访客进店受座位数硬限；库存为 0 自然停摆（不提示轰炸，UI 面板可见空库存状态）。

### 2.5 与现有系统的关系

- **占位卡转正**：`js/render/shop/library-upgrades.js:367` 的 coffeeCorner 占位卡改为真卡（建造/已建状态 + 打开咖啡角面板）。
- **访客 tick 接入**：`js/visitors.js tickVisitorBrowsing` 加 cafe 分支，注意与借阅判定/光环的先后顺序（先进店判定还是借阅判定，见 §五决策点）。
- **阶段门槛复用**：`data/atmosphere.js` 的 `getFacilityLevelCap(stage)` / `getFacilityRequiredStage(level)` 模式照抄，不做特例。
- **留声阁/收藏不受影响**；温室改动不在本文档范围（独立计划）。

## 三、UI 设计（无美术依赖，纯组件）

- **商店咖啡角卡**：未建=建造按钮（门槛/价格 + 🔒阶段提示，D22 同款门条）；已建=等级徽章 +「进入咖啡角」按钮。
- **咖啡角面板**（模态或子页）：
  - 头部：等级、座位数、今日/累计招待数
  - 食谱区：每张食谱卡=图标/名/材料消耗/售价/好感/当前库存/「制作」按钮（材料不足置灰）
  - 库存总览条
  - 升级按钮（价格 + 门槛提示）
- **招待反馈**：floating toast（`+15💰 香草茶被取用了`）+ history 记录；不弹窗打断。

## 四、实施步骤

1. **数据层**：`data/cafe.js`（食谱表/常量）+ `state.cafe` schema + migrations。
2. **核心层**：建造/升级/制作/自动营业逻辑（visitors.js 或新 `js/core/cafe.js`，遵循神模块拆分后的 core 层约定）。
3. **UI 层**：商店卡转正 + 咖啡角面板 + toast/history。
4. **校验**：verify 脚本加第 8 节（食谱材料/售价数值、等级上限×阶段、营业结算数学）；check:imports。
5. **i18n**：全部新词条中英双语。

## 五、风险与 trade-off（请架构师重点审）

1. **EXP 纪律**：产出严格限币+好感+停留延长，**禁氛围**——若后续想加氛围产出，必须重跑仿真。
2. **tick 顺序**：进店判定与借阅判定同 tick 竞争——先进店会延长停留从而间接触发更多借阅（正反馈有意保留？），还是先借阅判定（咖啡角不干扰借阅主链）？**默认：先借阅判定，后咖啡角**（借阅是主玩法，咖啡角是增益层）。
3. **好感通胀**：+4~+10/次 vs 还书 +5~ 基础，咖啡角好感产出效率偏高？需按浏览 tick 频率核算每日好感上限（开放项，实现时实测）。
4. **种子双出口竞争**：种子同时是兑换货币与食材，食谱定价（2-3 颗/份）相对兑换表是否失衡？请对照 `data/plants.js` 种子兑换表审计。
5. **离线/加速**：tick 基于现实时间还是游戏内时间？沿用现有 tickVisitorBrowsing 的机制，不新建时钟。
6. **暂暗机制不做**：咖啡角无维持费（那是全局待定决策，图南尚未拍板每日金币维持费是否适用于房间）；咖啡角停摆条件只有库存空。

## 六、开放项（不阻塞本计划）

- 温室新植物批次 + 对应新食谱（下一批）。
- 房间每日金币维持费的全局机制（如启用，咖啡角补暂暗逻辑）。
- 咖啡角小剧情/常客系统（未来增强）。
- 展览厅计划（同批次另立文档）。

## 七、验收标准

1. 老档加载零破坏，`state.cafe` 正确迁移。
2. 未达 2 阶时商店卡显示 🔒 门条，不可建造。
3. 制作消耗种子入库存；库存 0 时访客不进店、按钮置灰。
4. 自动营业结算正确：币入账、好感增加、停留延长生效（可用 dev-console 驱动 tick 验证）。
5. 升级受 stage+1 上限约束，越级按钮置灰并提示。
6. 全程无氛围产出（grep addAtmosphere 确认咖啡角链路零调用）。
7. verify 脚本新增节全过；check:imports 过；drift 榜 0。

## 八、相关文件

- `js/render/shop/library-upgrades.js`（占位卡转正）、`js/visitors.js`（tick 接入）
- `js/state/state.js` / `js/state/migrations.js`（schema + 迁移）
- `data/cafe.js`（新建，食谱真源）、`data/plants.js`（种子字段只读引用）
- `data/atmosphere.js`（D22 门槛模式复用）、`js/i18n/terms.js`（中英词条）
- `scripts/verify-atmosphere-narrowing.js`（数值校验）
