# Plan Review：localStorage-unification-plan.md

> **Reviewer**：Software Architect（架构师二审）
> **Date**：2026-07-29
> **Target**：`docs/plans/localStorage-unification-plan.md`（当前版本，无版本号）
> **Verdict**：**方向正确，但迁移段存在 crash 路径与数据丢失路径，需修复 P0/P1 后方可进入实施。**

---

## 一、总体评价

集中式持久化层（`persistence.js`）+ 设置层（`settings.js`）的拆分方向是**对的设计**：单一真相源、统一命名空间、为云存档留 `exportAll/importAll` 接口，都切中要害。问题的集中度不在架构，而在**§3.4 迁移段**——它同时踩了"解析无保护""无调用点""循环依赖""丢失用户自定义偏好""承诺的备份没实现"五个坑。

一句话：**新方案的设计目标（§1 风险清单）里列的每一条，迁移代码都没能足额兑现。** 下面按严重度列出。

---

## 二、🔴 P0 — 迁移时真的会出事（必改）

### P0-1：`JSON.parse(oldValue)` 无 try-catch（L174）

```js
// L171-176
Object.entries(LEGACY_KEYS).forEach(([oldKey, newKey]) => {
  const oldValue = localStorage.getItem(oldKey);
  if (oldValue !== null && load(newKey) === null) {
    save(newKey, JSON.parse(oldValue));   // ← 裸 JSON.parse，抛错即中断整个迁移
    localStorage.removeItem(oldKey);
  }
});
```

`load()` 内部有 try-catch（L66-69），但这里是**直接** `JSON.parse(oldValue)`。只要任意一个旧值损坏（例如 `lib_emoji_clicks` 被写成纯文本，或某个旧存档 blob 截断），`JSON.parse` 抛 `SyntaxError` → 异常向上冒泡：

- 前面已 `save` 过的 key 已 `removeItem` 删除（旧 key 没了）
- 后面尚未处理的 key 原封不动留在旧命名空间
- 进入**半迁移状态**，且没有任何回滚

而 §5 风险表里明明写了"迁移逻辑加 try-catch"（L235），代码里却没有。文档与代码打架。

**修法**：迁移逐 key 隔离失败，并在 `runLegacyMigration` 外层加整体保护。

```js
function safeParse(raw) {
  try { return JSON.parse(raw); } catch { return undefined; }
}

Object.entries(LEGACY_KEYS).forEach(([oldKey, newKey]) => {
  const oldValue = localStorage.getItem(oldKey);
  if (oldValue === null) return;
  if (load(newKey) !== null) { localStorage.removeItem(oldKey); return; } // 新 key 已存在则跳过
  const parsed = safeParse(oldValue);
  if (parsed === undefined) {
    console.warn(`[migrate] skip corrupt legacy key ${oldKey}`);
    return; // 不删、不中断，保留现场供排查
  }
  save(newKey, parsed);
  localStorage.removeItem(oldKey);
});
```

> **取舍**：改为"跳过坏值、保留旧 key"而非"删旧 key 再失败"，牺牲了"旧 key 一定被清理"的洁癖，换来"绝不会因为一个坏值丢全部存档"的健壮性。对单机游戏，后者重要得多。

### P0-2：`runLegacyMigration()` 没有调用点

§3.4 开头（L151）说"在 `js/persistence.js` 初始化时执行一次性迁移"，但 `persistence.js` 是个 ES module，**模块加载不等于"运行时初始化"**。§4 实施步骤（L219-227）只说"定义 key、load/save/export/import/migrate"，**全程没提在哪调用一次 `runLegacyMigration()`**。

后果：若不在 app 启动的**最早时刻、任何 `load` 之前**显式调一次，旧 key 永远留着、新代码读新 key（空）——**用户现有存档像"消失"了一样**。这是比 P0-1 更隐蔽的"软丢失"。

**修法**：在 §4 第 0 步显式声明调用点，且必须幂等（防止重复迁移或二次启动重复跑）。

```js
// js/app.js — bootstrap，第一行
import { runLegacyMigration } from './persistence.js';
runLegacyMigration();   // 必须在任何其他模块 load 之前
// ……之后才允许 any module 调用 load/save
```

`runLegacyMigration` 内部加幂等守卫：

```js
const MIGRATED_FLAG = 'migrated_v1';
export function runLegacyMigration() {
  if (load(MIGRATED_FLAG)) return;       // 已迁移过，跳过
  try {
    // ……迁移逻辑（见 P0-1/P1-3 修正）
  } finally {
    save(MIGRATED_FLAG, true);           // 无论成功与否都标记，避免重启反复重试半成品
  }
}
```

---

## 三、🟠 P1 — 逻辑/架构缺陷（应改）

### P1-1：`persistence.js` ↔ `settings.js` 循环依赖（L113 / L180 / L184）

`settings.js` 已经 `import { load, save, STORAGE_KEYS } from './persistence.js'`（L113）；而 `persistence.js` 的 `runLegacyMigration` 又调用了 `settings.js` 的 `getSettings()`（L180）和 `DEFAULT_SETTINGS`（L184）。这是**环形依赖**。

更致命的是：§3.1 给出的 `persistence.js` 伪代码（L48-105）**从头到尾没有 `import settings`**——照着写会直接 `getSettings is not defined`，跑不起来。

**修法**：`persistence.js` 不依赖 `settings.js`。把"设置类旧 key 迁移"从 `runLegacyMigration` 剥离，挪进 `settings.js` 自己的 `initSettings()`（settings 天然拥有自己的 key，自己管迁移最合理）。`persistence.js` 只负责 `LEGACY_KEYS`（state/achievements/meta）那条，环断。

```js
// js/settings.js
import { load, save, STORAGE_KEYS } from './persistence.js';
const LEGACY_SETTINGS = { /* ……L161-167 原表 …… */ };
export function initSettings() {
  const settings = { ...DEFAULT_SETTINGS, ...(load(STORAGE_KEYS.SETTINGS) || {}) };
  Object.entries(LEGACY_SETTINGS).forEach(([oldKey, cfg]) => {
    const oldValue = localStorage.getItem(oldKey);
    if (oldValue !== null) {
      const parsed = safeParse(oldValue);     // 复用 P0-1 的 safeParse
      if (parsed !== undefined) settings[cfg.target] = cfg.map(parsed);
      localStorage.removeItem(oldKey);
    }
  });
  save(STORAGE_KEYS.SETTINGS, settings);
  cache = settings;
}
```

> **取舍**：迁移逻辑被拆到两侧（state 类在 persistence、settings 类在 settings）。代价是"迁移逻辑不在一处"，换来"零环形依赖 + 每个模块只碰自己的 key"。后者正是本方案§2 目标 #1 的精髓，值得。

### P1-2：设置迁移会丢用户自定义偏好（L182-189）

```js
// L182-189
Object.entries(LEGACY_SETTINGS).forEach(([oldKey, cfg]) => {
  const oldValue = localStorage.getItem(oldKey);
  if (oldValue !== null && settings[cfg.target] === DEFAULT_SETTINGS[cfg.target]) {
    settings[cfg.target] = cfg.map(oldValue);   // 仅当"当前值还等于默认"才应用
    changed = true;
  }
  localStorage.removeItem(oldKey);   // ← 无条件执行
});
```

守卫要求"当前值还等于默认值"才应用旧值，但 `removeItem` **无条件执行**。后果：

- 用户**曾经自定义过**（音量 0.3 ≠ 默认 0.7，或关过音乐）→ 守卫为 false → 旧值不生效
- 但 `removeItem` 照删 → **用户的自定义偏好永久丢失**，回退成默认

首次迁移时 `settings` 是 default，守卫恰好为真，"看似能跑"；但凡用户在旧版本改过偏好，这一版就会静默吞掉。

**修法**：旧 key 存在即以旧值为准（它才是用户真实存过的值），去掉 `=== default` 守卫。

```js
if (oldValue !== null) {
  const parsed = safeParse(oldValue);
  if (parsed !== undefined) { settings[cfg.target] = cfg.map(parsed); changed = true; }
  localStorage.removeItem(oldKey);
}
```

### P1-3：§5 承诺的"迁移前备份旧 key"在代码里没落地（L235 vs L169-191）

§5 风险表第一行（L235）："迁移前先把旧 key 备份到 `riftlib_state_backup_legacy`"。但 §3.4 的 `runLegacyMigration`（L169-191）是**直接 `removeItem`**，从未先备份。安全网只存在于文档。结合 P0-1，一旦中断就是真丢，没有任何兜底。

**修法**：迁移开始前，先把所有旧 key 原样复制进备份命名空间；全部成功后再删旧 key（或永久保留备份）。

```js
const LEGACY_BACKUP_NS = 'riftlib_legacy_backup_';
function backupLegacyKeys() {
  [...Object.keys(LEGACY_KEYS), ...Object.keys(LEGACY_SETTINGS)].forEach(oldKey => {
    const v = localStorage.getItem(oldKey);
    if (v !== null) localStorage.setItem(LEGACY_BACKUP_NS + oldKey, v);
  });
}
// runLegacyMigration 第一行调用 backupLegacyKeys()
```

### P1-4：`state.locale` 重复存储其实没修掉（目标 #5 / §3.6）

这是方案自己立的目标（§1 风险 #5，L28），但落空了：

- §3.4 只迁移了 `terms.js` 的 `rift_library_locale` → `settings.locale`（L166）
- §3.5 的 `state.js` 改造（L198）只说"`saveState()` 改走 `persistence.load/save(STORAGE_KEYS.STATE)；删除直接 localStorage 调用"，**没提移除 `state.locale`**
- 而 §3.6 自己承认（L208）"`state.locale` 会被 `saveState()` 写入 `library_state`"

迁移后命名空间变成 `riftlib_state_v2`，但 `state.js` 的 `saveState()` 仍会把 `state.locale` 写进那个 blob。结果 **locale 同时存在于 `riftlib_state_v2`（blob 内）和 `riftlib_settings` 两处**——单一真相源对 locale 失效，目标 #5 没兑现。

**修法**：§3.5 `state.js` 改造项必须显式写"`saveState()` 不再序列化 `state.locale` 字段"；或 §3.6 直接定为"`initState` 读 `getLocale()` 注入 `state.locale`，`saveState` 用 `omit(state,'locale')`"。现在 §3.6 只给"或"选项（L210-211），没拍板，实施者会二选一漂移。

### P1-5：`importAll` 零校验（L98-104）

```js
export function importAll(bundle) {
  if (!bundle || !bundle.keys) return false;
  Object.entries(bundle.keys).forEach(([key, value]) => {
    if (value !== null && value !== undefined) save(key, value);  // 覆盖式写入，无备份、无校验
  });
  return true;
}
```

§2 目标 #4 说"为云存档留接口"——但云同步/用户粘贴进来的 `bundle` 可能是损坏的、形状错误的、甚至恶意的。直接 `Object.entries` 覆盖 `state`/`settings` = **用坏数据污染存档，且无法回退**。

**修法**：校验 `version`、粗校验形状（至少 `state` 是对象 / `settings` 是对象）、导入前先备份当前 state，失败回滚。

```js
export function importAll(bundle) {
  if (!bundle || typeof bundle !== 'object' || !bundle.keys) return false;
  if (bundle.version !== 1) { console.warn('[import] unsupported version', bundle.version); return false; }
  // 备份当前，便于回滚
  const prev = exportAll();
  try {
    Object.entries(bundle.keys).forEach(([key, value]) => {
      if (value == null) return;
      if (typeof value !== 'object' && typeof value !== 'string') return; // 粗形状拦截
      save(key, value);
    });
    return true;
  } catch (e) {
    Object.entries(prev.keys).forEach(([k, v]) => save(k, v)); // 回滚
    return false;
  }
}
```

---

## 四、🟡 P2 — 健壮性与一致性（建议改）

| 项 | 位置 | 问题 | 建议 |
|----|------|------|------|
| `save()` 配额超限静默失败 | L72-78 | 捕获后只 `console.error`，调用方拿不到失败信号；存档因配额写失败时玩家无感知丢进度 | `save` 返回 `boolean`，`saveState` 关键路径据以提示 |
| `getSettings()` 返回可变 cache 引用 | L127-130 | 调用方 `getSettings().musicVolume = 0.9` 改的是缓存却没持久化，经典隐蔽 bug | 返回副本 `return { ...cache }`，或文档明确"只读，改走 setSetting" |
| 多 tab 的 cache 不失效 | L125 | 模块级 `cache` 在一个 tab 改了，另一个 tab 读旧值 | 加 `window.addEventListener('storage', () => { cache = null; })` 失效化（单机影响小，可选） |
| `exportAll/importAll` 无 version 处理 | L89 vs L99 | `version:1` 导出，但 `importAll` 不校验，将来格式升级会被盲目导入（P1-5 已含修复） | 同 P1-5 |
| §5 "保留旧 key 一个版本"与代码矛盾 | L238 vs L188 | §5 说"可配置是否删除"，代码是无条件 `removeItem` | 二选一：要么实现"可配置保留"，要么把 §5 那行删掉 |
| 命名不一致 | L53-54 | `STATE: 'state_v2'` 带 `_v2`，但 `STATE_BACKUP: 'state_backup'` 没带 | 要么都带版本（`state_v2_backup`），要么都不带，别一个一样 |
| `js/ambient.js` 改造留歧义 | L200 | "（或保留 state 但持久化走 settings）"——实施者二选一，易漂移 | 拍板一种，删掉"或" |

---

## 五、建议落地顺序

1. **P0-1**：迁移逐 key 隔离失败 + `safeParse`（防半迁移崩）
2. **P0-2**：明确 `runLegacyMigration()` 调用点（app 启动首行）+ 幂等守卫
3. **P1-1**：解 `persistence↔settings` 循环依赖（设置迁移挪进 settings.js）
4. **P1-2**：去掉 `=== default` 守卫，旧 key 存在即以旧值为准
5. **P1-3**：迁移前 `backupLegacyKeys()` 落地 §5 承诺
6. **P1-4**：`saveState` 不写 `state.locale`，兑现目标 #5
7. **P1-5**：`importAll` 加 version/形状校验 + 导入前备份 + 回滚
8. **P2**：`save` 返回值、cache 副本、命名一致、删歧义

---

## 六、ADR 草案（供拍板）

> **ADR-LS-001：迁移的幂等与失败隔离策略**
> - **Context**：旧版本 `localStorage` key 分布在 9 个模块，需一次性迁移到 `riftlib_` 命名空间；任何旧值损坏或解析失败都不得中断全局迁移或丢失用户自定义偏好。
> - **Decision**：① 迁移逐 key 隔离（`try/catch` per key，坏值跳过保留现场）；② `runLegacyMigration` 在 app 启动首行调用且仅一次（幂等 flag）；③ `persistence.js` 不依赖 `settings.js`，设置迁移下沉到 `settings.js`；④ 旧 key 存在即以旧值为准，不比对默认值；⑤ 迁移前全量备份旧 key。
> - **Consequences**：+ 永不因单点坏值丢全部存档；+ 零环形依赖；− 旧 key 不一定被即时清理（坏值 key 保留待排查），可接受。

> **待用户拍板项**：
> 1. P1-4 中 `state.locale` 的消除方式（运行时注入 vs 移除字段）
> 2. P2 中 `save()` 是否要返回值（影响 `saveState` 提示逻辑改造量）
> 3. §5 "保留旧 key 一个版本"是否真要做（做则 P2 矛盾消解，不做则删 §5 那行）

---

## 七、结论

方案**设计层是对的**，但**迁移实现层有 2 个必崩/必丢的 P0 + 5 个应改的 P1**。按第五节顺序修完，即可进入实施；P2 项可在实施期顺手收口。当前版本**不建议直接照抄进代码**。
