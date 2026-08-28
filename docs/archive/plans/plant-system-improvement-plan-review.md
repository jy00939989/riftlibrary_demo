# 架构评审：《归墟图书馆 · 植物系统改进实施计划（方案 B）》

> 评审对象：`.claude/plans/dreamy-cooking-riddle.md`（方案 B）
> 评审基线：当前代码库实测（2026-08-18 状态）
> 评审风格：已核实事实 + 严重度分级 + ADR 草案 + 决策清单（对齐此前 review）

---

## 〇、总评

方案 B 的痛点判断准确（无铲除按钮、种子后期无消费口），决策表清晰，"铲除不返还金币"的理由站得住（防刷浇水），迁移思路"迭代 `PLANT_TYPES` 补全种子"正确，`book_023/024` 内容资产也确实在。整体方向可执行。

但计划写于 god-module-split 之后、**没完全吸收新文件布局**：两处 `import` 路径写错（照抄会模块加载失败），且有一个 **i18n 架构缺口**（数据层写死中文，却要求 Verification #9 出英文）会让该验收项落空。下面按严重度排。

---

## 一、已核实事实（代码实测，非空谈）

| 断言 | 实测结果 |
|---|---|
| `saveState` 真实位置 | **`js/state/save.js:7`**，非计划写的 `js/state.js`（`js/state.js` 只是 `export { state, DEFAULT_BOOKS } from './state/state.js'` 的薄壳，不含 saveState） |
| `createBookRecord` 真实位置 | **`js/core/book-utils.js:19`**，非计划写的 `js/capacity.js`（capacity.js 只有 `isManuscriptBoxFull`/`addToManuscriptBox`） |
| `canExchangeSeed`/`exchangeSeed` 是否已在 | **已在** `js/plants.js:205/214`，当前签名无 `index`、读 `SEED_EXCHANGE[seedType]` 单对象 |
| `SEED_EXCHANGE` 当前形状 | `data/plants.js:58` 为**对象**：每 seedType→单本书 `{required, rewardBookId, rewardTitle}`（**不是数组**） |
| `SEED_EXCHANGE` 消费点 | 仅 **2 处**：`js/plants.js:206/218`（逻辑）+ `js/render/plants.js:123/127/142`（UI） |
| `seeds`/`plant` 初始化 | 在 `js/state/migrations.js:109-120`（plant 默认形状含 `plantedAt:0` 等；seeds 默认 `{bird_of_paradise:0, magic_rose:0}` 硬编码） |
| `book_023/024` 内容资产 | 存在：`data/books/book_023.js`、`data/books/book_024.js`，并被 `data/books.js` 导入；但计划引用的 `DEFAULT_BOOKS`（`js/state/state.js:232`）是否含这两项**需再确认** |
| 现有植物 name/description 渲染 | 直接 `def.name`（字面中文，`js/render/plants.js:70/247/277`），**未走 `t()`** |
| 渲染函数落点 | `renderPlantArea`(render/plants.js:32)、`renderSeedInventory`(112)、`renderDecorationShop`(shop.js:713)、`renderActivePlantCard`(shop.js:804) 均存在 |

---

## 二、问题分级

### 🔴 P1 — 两处 import 路径写错，照抄会模块加载失败

- 计划「Reuse」写 `saveState from js/state.js` → 实际在 `js/state/save.js`。`js/state.js` 只 re-export `state`/`DEFAULT_BOOKS`，不含 `saveState`，import 会直接抛 *"does not provide an export named 'saveState'"*。
- 计划写 `createBookRecord from js/capacity.js` → 实际在 `js/core/book-utils.js`。capacity.js 无此函数。
- **修订**：改为 `import { saveState } from '../state/save.js'`（渲染层注意是 `../../state/save.js`）、`import { createBookRecord } from '../core/book-utils.js'`。

> 这是"照计划抄 → 直接 broken"的硬错误，不是风格问题。建议在计划顶部加一节"真实 import 路径对照表"，因为 god-split 后很多路径都变了。

### 🟠 P1 — i18n 架构缺口：数据写死中文，却要求英文（Verification #9 会落空）

- 现状：`data/plants.js` 的 `name`/`description`/`rewardTitle` 全是字面中文，`render/plants.js` 用 `def.name` 直接渲染，**没有 `t()` 封装**。
- 计划 Step 7 加 terms，且 Verification #9 要"切换英文，确认新植物名称/描述有英文"——但数据层是字面中文、渲染层不调 `t()`，**两者没接起来**。
- **修订（二选一，必须写清）**：
  - **(A) 数据存 i18n key**：`nameKey:'plant.starlight_fern.name'`，渲染层改 `t(def.nameKey)`；`terms.js` 补中英。改动面较大（render/plants.js、render/shop.js 多处 `def.name`）。
  - **(B) 接受植物名/描述/奖励标题仅中文**，把 Verification #9 的英文 expectation 收窄为"按钮/提示文案有英文，植物名保持中文"。最简单，但和"全 i18n"目标不一致。
- **推荐 (A)**（长期一致），但需把 Step 3 的渲染改动一并纳入；若赶时间先 (B) 并在计划中明示"植物名不做 i18n"。

### 🟠 P1 — 种子兑换「可重复 vs 一次性」未定义，奖励类型分发缺 default

- `SEED_EXCHANGE` 改为数组后每项 `type` ∈ {book, coins, atmosphere, inspiration, seed}。计划只说"已兑换过的书不再显示按钮"（books 一次性，靠 `state.books[id].status` 判断），但：
  - **`type:'seed'`**（如 鹤望兰→魔法玫瑰种子）是一次性还是可重复？若可重复，玩家可无限把普通种子转成稀有种子，破坏稀缺。必须明确定义。
  - **`type:'decoration'`**（决策表列入、但"本次不做"）未来加时，`exchangeSeed` 的分发需有 **`default` 分支** 优雅跳过/告警，否则新类型直接炸。
- **修订**：Data Schema 给每项加 `repeatable: boolean`（book/seed 默认 `false`，coins/atmosphere/inspiration 默认 `true`）；`exchangeSeed` 的 dispatch 加 `default: console.warn('未实现的奖励类型', type)`。

### 🟡 P2 — abandonPlant「清空 state.plant」应重置为规范空盆形状

- 计划写"清空 state.plant"。但 `migrations.js:110-116` 把 plant 初始化成含 `activeType/level/growthProgress/waterAvailable/harvested/plantedAt` 等的规范对象。若 abandon 设成 `null` 或 `{}`，后续 `getActivePlantDef()`/`canWater()` 读 `state.plant.activeType` 会 `undefined`，重种/渲染易出 bug。
- **修订**：`abandonPlant` 把 `state.plant` 重置为与 migrations 一致的**空盆常量**（如 `EMPTY_PLANT`），不要 `= null`。

### 🟡 P2 — 美术 fallback 机制未具体化（vanilla 下 img onerror 易碎）

- 计划 "Art Plan" 只说"加载失败 fallback：emoji"，但 `renderPlantArt` 在模板字符串里拼 `<img>`，行内 `onerror` 脆弱且不便单测。
- **修订**：用预加载 `new Image()` 探测（`img.onerror` → 返回 emoji `<span>`），或渲染层统一一个 `imgWithFallback(src, emoji)` 助手；明确 `visual/plants/` 目录需新建且路径相对站点根。

### 🟡 P2 — 种子变动散落多处，建议集中 helper

- 现有 `harvestPlant` 用 `state.seeds[def.seedType] = (...||0)+1` 裸赋值（`js/plants.js:140`），计划 `exchangeSeed` 也用 `state.seeds[seedType] += count`。迁移也碰 `state.seeds`。多处裸赋值易漏。
- **修订**：加 `addSeed(seedType, n)` / `spendSeed(seedType, n)` 集中在 `js/plants.js`，迁移与 exchange 都走它。

### 🟡 P2 — book_023/024 是否在 DEFAULT_BOOKS 需确认

- 计划说"在 `js/state/state.js` 的 DEFAULT_BOOKS 中确认 book_023/024 存在（已存在）"。实测 `DEFAULT_BOOKS` 在 `state/state.js:232`，但 book_023/024 的**内容模块**在 `data/books/book_023.js`（已被 `data/books.js` 导入）。若 `DEFAULT_BOOKS` 不含这两项，`exchangeSeed` 的 book 分支必须依赖 `createBookRecord` 正确建记录。
- **修订**：核实 `DEFAULT_BOOKS` 是否含 023/024；若不含，明确 book 分支走 `createBookRecord`（路径修正后可用），不依赖预登记。

### 🟢 战略层 — 范围合理，但与 god-split「render 不直接改 state」红线需对齐

- 计划 render 层直接调 `abandonPlant()` 后 `renderPlantArea()` 重渲染，符合现有命令式渲染（harvestPlant→render 同款），OK。
- 但 god-split 目标是 render 纯渲染；本计划未触碰该红线，属增量功能，可接受。仅提醒：若后续 god-split 收尾引入"re-render 触发机制"，本计划的"调完逻辑后显式 `renderXxx()`"写法要一并迁移。

---

## 三、ADR 草案

### ADR-PLANT-1：种子兑换奖励类型扩展方式
- **状态**：待定
- **上下文**：`SEED_EXCHANGE` 原每种子单本书；需扩展到金币/氛围/灵感/种子/装饰。
- **决策**：`SEED_EXCHANGE[seedType]` 改为**数组**，每项显式 `type` + `repeatable`；dispatch 加 `default` 跳过未实现类型。
- **后果**：每加一种奖励只改 data + dispatch 一分支；向后兼容（静态数据，无存档迁移）。

### ADR-PLANT-2：植物显示文案 i18n 策略
- **状态**：待定
- **上下文**：`name`/`description`/`rewardTitle` 当前字面中文，计划要英文。
- **决策**：(A) 数据存 key + `t()`，或 (B) 植物名仅中文。
- **后果**：(A) 一致但改动面大；(B) 快但部分字段不翻译。

### ADR-PLANT-3：植物立绘 fallback 策略
- **状态**：建议
- **上下文**：无构建、静态资源可能缺失。
- **决策**：预加载 `Image()` 探测，失败回退 emoji。
- **后果**：不阻塞功能开发；缺失图片不白图。

---

## 四、决策清单（需图南/克克拍板）

1. i18n 走 (A) 数据 key+`t()` 还是 (B) 植物名仅中文？——**我推 A（长期一致）**
2. `type:'seed'` 兑换一次性还是可重复？——**需拍板（我推一次性，保稀缺）**
3. 美术 fallback 用预加载探测还是行内 `onerror`？——**我推预加载**
4. 是否顺手加 `addSeed`/`spendSeed` helper？——**我推加（小成本）**

---

## 五、建议修订后顺序

1. **先修两处错误 import**（`saveState`→`js/state/save.js`、`createBookRecord`→`js/core/book-utils.js`），并在计划顶部加"真实 import 路径对照表"。
2. 定 ADR-PLANT-1/2（奖励类型 + i18n）。
3. Step 1 `data/plants.js`：`art` 字段 + `starlight_fern` + `SEED_EXCHANGE` 数组化（每项加 `repeatable`）。
4. Step 2 `js/plants.js`：`abandonPlant` 重置空盆（非 `null`）、`exchangeSeed` 按 `type` 分发 + `default`、`canExchangeSeed(index)`、`addSeed` helper。
5. Step 3/4 渲染：`renderPlantArt` 预加载 fallback、铲除按钮、种子卡片多兑换项、i18n 接入。
6. Step 6 迁移：`PLANT_TYPES` 循环补全 `seeds`；确认 book 分支建记录路径。
7. Step 7 i18n 文案；Step 5 美术资源。

---

## 六、验收补强

- 原 Verification（10 条）已较全；补一条：**兑换 `type:'seed'` 项后**，确认该种子计数扣减且（若一次性）按钮消失 /（若可重复）仍可用——取决于决策 2。
- 补一条：**模拟英文语言**，确认植物名/描述按决策 1 的结果正确显示或明确无英文。
- 原有「本次不部署」与你的 Netlify 免费额度纪律一致，保留即可。
