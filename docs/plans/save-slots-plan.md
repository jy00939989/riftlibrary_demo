---
anchors:
  - { type: file, path: "js/persistence.js", weight: 0.1 }
  - { type: file, path: "js/state.js", weight: 0.1 }
  - { type: file, path: "js/save-manager.js", weight: 0.1 }
  - { type: file, path: "js/backend/sync.js", weight: 0.1 }
  - { type: file, path: "js/backend/account-ui.js", weight: 0.1 }
  - { type: file, path: "js/settings.js", weight: 0.1 }
  - { type: file, path: "supabase/migrations", weight: 0.1 }
  - { type: file, path: "docs/plans/save-slots-plan.md", weight: 0.1 }
---

# 归墟图书馆 · 三存档位计划

> 目标：从单存档扩展为 3 个存档位，让玩家可以并行经营多座图书馆
> （如：一座主馆、一座实验馆、一座送朋友的馆）。
> 图南 2026-10-23 立项。可行性已勘察：本地存储是单一网关结构，槽位化改动面集中，**可做**。

---

## 一、现状勘察（2026-10-23 克克摸底）

| 层 | 现状 | 槽位化改法 |
|---|---|---|
| 本地存档 | `js/persistence.js` 是唯一 localStorage 网关；主存档 `riftlib_state_v2`，崩溃备份 `riftlib_state_backup` | 存档类 key 加槽位后缀 + `riftlib_active_slot` 指针；改动集中在 persistence 路由 |
| 状态装载 | `js/state.js` 一处 `load(STORAGE_KEYS.STATE)`；`account-ui.js` 云端拉回一处 | 两处调用点改走「当前槽 key」 |
| 云存档 | Supabase `saves` 表每账号一行（`user_id` 唯一），`save_data` 整个 JSON | 加 `slot` 列，唯一约束改 `(user_id, slot)`；存量行 = 槽 1 |
| 导出/导入 | `save-manager.js` 导出全 keys bundle | 按当前槽走，天然兼容；需加「指定槽导入」选项 |
| 成就/设置 | `riftlib_achievements` / `riftlib_settings` 独立 key | 见 §二决策 1：账户级共享，不动 |

**关键事实**：`state.dlcPacks.redeemedCodes`（兑换码核销记录）与 `state.dlcPacks.unlocked`（DLC 解锁）
**目前存在存档 state 里**——这是决策 1 的核心张力，见下。

## 二、待拍板决策（按依赖顺序）

### 决策 1：槽位间共享边界（最大决策，决定重构面）

| 数据 | 建议归属 | 理由 |
|---|---|---|
| 设置（音量/语言/跳过动画等） | **账户级** | 纯粹玩家偏好，多槽各自维护是负担 |
| 成就柜 | **账户级** | 成就语义是「玩家做到过」，不是「某座馆做到过」 |
| DLC pack 解锁（灵感购买） | **账户级**（需抬出 state） | 防「三槽各买一遍」的重复消费；也需防灵感跨槽刷 |
| 兑换码核销记录 | **账户级**（需抬出 state） | 不抬出 = 三槽各兑一次码，资源复制漏洞 |
| 纪念牌 | **账户级** | 限量纪念，跨槽复制同样稀释稀缺性 |
| 图书馆全部进度（书/金币/灵感/访客/植物/氛围/任务） | **槽位级** | 槽位的全部意义所在 |

**若拍板「全部槽位级共享」**：实现最省（零抬出重构），但兑换码×3、DLC×3 的经济漏洞需要
图南显式接受。克克建议：共享层抬出，一次做对。

**抬出方案**：`state.dlcPacks` 拆为——
- `riftlib_account` 新 key（账户级）：`{ dlcPacks: { unlocked: [], redeemedCodes: [] }, plaques: [...] }`
- 存档内 `state.dlcPacks` 保留但改为**读账户层的镜像**（兼容旧档：首次启动迁移进账户层）
- 灵感、金币保持槽位级（在 state 内不动）

### 决策 2：切槽体验

克克建议：
- 设置页（或馆名旁）加「存档位」卡片：三格，各显示**馆名 + 总字数 + 书目数 + 氛围等级**概要
- 操作：切换 / 新建（起名+起始书三选一）/ 删除（需二次确认+输入馆名）
- **切换 = 整页刷新**（`location.reload()`）——不留半初始化状态，最稳
- 专注计时进行中：切换与删除按钮禁用
- 现档自动成为槽 1，零迁移损失

### 决策 3：云端三槽合并策略

登录时逐槽比对本地/云端 `updated_at`：
- 云新 → 弹选择（复用现有单槽同步弹窗组件，逐槽跑三遍）
- 本地新或无云档 → 静默上传
- 只在登录时询问；游戏中切槽即用该槽本地档，后台各槽独立防抖上传

## 三、实施线拆分

**A. 本地槽位层**
1. `persistence.js`：存档类 key（STATE / STATE_BACKUP）路由加槽位后缀；
   新增 `getActiveSlot() / setActiveSlot() / listSlotKeys()`；active_slot 指针自身不走槽位
2. `state.js`：装载点改走槽位 key
3. 崩溃备份链路随槽位走（每槽独立 backup）
4. 校验：三槽并行读写互不污染

**B. 账户共享层（依赖决策 1）**
5. `riftlib_account` 新 key + 首次启动迁移（旧 state.dlcPacks → 账户层）
6. `dlc-packs.js` / `redeem-code.js` 改读账户层；存档内镜像字段保留只读
7. 成就/设置维持现状（本就独立 key）

**C. 云层**
8. Supabase 迁移：`saves` 表加 `slot int default 1`，唯一索引改 `(user_id, slot)`
9. `sync.js` upload/download 带 slot 参数
10. `account-ui.js` 登录拉取改为逐槽三问（复用现有弹窗）

**D. UI 层**
11. 存档位卡片（设置页）：三格概要 + 切换/新建/删除
12. 新建槽流程：起名 → 起始书三选一（复用现开局流程）
13. `save-manager.js`：导出按当前槽；导入可选槽位
14. i18n 词条（中英）

**E. 边界与防御**
15. 专注中禁切/禁删；删除槽需输入馆名确认
16. purchaseBook / 兑换码等入口的账户层校验（防 stale state）
17. `npm run check:imports` + 槽位切换冒烟脚本

## 四、风险与对策

| 风险 | 对策 |
|---|---|
| 迁移期旧档读丢 | 迁移只写不删，旧 key 保留一个版本周期；persistence 已有 legacy 备份先例 |
| 云 schema 变更期间旧客户端上线 | `slot` 列 default 1，旧行语义不变；新旧客户端过渡期云数据兼容 |
| 三槽同步弹窗连弹三次烦人 | 仅登录时触发；三槽都有冲突才逐槽问，无冲突槽静默 |
| 切槽后教程/引导状态串槽 | 引导进度在 state 内（槽位级），天然隔离；设置里的「跳过教程」是账户级偏好，OK |
| 多槽同时上传竞态 | 各槽防抖独立；upsert onConflict (user_id, slot) 幂等 |

## 五、验收清单

- [ ] 三槽独立进度：A 槽买书不影响 B 槽
- [ ] 切槽整页刷新后进度正确；专注中切换被禁
- [ ] 兑换码在 A 槽使用后，B/C 槽不可再兑（决策 1 拍板后）
- [ ] DLC 解锁三槽共享（决策 1 拍板后）
- [ ] 云端逐槽同步：A 槽云新本地旧时正确询问，B 槽无冲突静默
- [ ] 删除槽需输入馆名确认；删除后空间可复用
- [ ] 导出/导入按槽进行；旧版单档导出文件可导入任意槽
- [ ] 存量玩家零感知迁移（自动变槽 1）
- [ ] check:imports 通过 + 槽位冒烟脚本绿

## 六、排期建议

- 决策 1 拍板后 A 线可独立开工（本地槽位不依赖云）
- C 线需 Supabase 迁移窗口，建议在低活跃时段执行
- 整体约一个实施批次，小于田园位面重建一个数量级
