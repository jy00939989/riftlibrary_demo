# 技术债修复方案 #1：本地存储统一化（localStorage Unification）

> 针对当前代码库中 `localStorage` key 分散、命名混乱、读写入口不统一的问题，提出集中式持久化层改造方案。

---

## 1. 当前问题

目前 `localStorage` 的读写散落在多个模块，key 命名不统一：

| Key | 用途 | 所在模块 |
|-----|------|----------|
| `library_state` | 主游戏存档 | `js/state.js`, `js/save-manager.js` |
| `library_state_backup` | 崩溃备份存档 | `js/save-manager.js`, `js/app.js` |
| `library_music` | BGM 开关 | `js/audio.js` |
| `library_music_volume` | BGM 音量 | `js/audio.js` |
| `library_sfx` | 音效开关 | `js/audio.js` |
| `library_sfx_volume` | 音效音量 | `js/audio.js` |
| `rift_library_locale` | 语言设置 | `js/i18n/terms.js` |
| `lib_emoji_clicks` | emoji 点击计数（成就） | `js/achievements.js` |
| `achievements` | 成就解锁状态 | `js/achievements.js` |

### 主要风险
1. **命名空间冲突**：`library_*` 前缀不够独特，未来如果同一域名下出现其他项目容易冲突。
2. **读写入口分散**：任何模块都可以直接改 `localStorage`，排查存档问题时要全文搜索。
3. **迁移困难**：若未来切到后端存档、IndexedDB 或 File System API，需要改 N 个文件。
4. **备份/导出不完整**：`save-manager.js` 只备份 `library_state`，用户的音乐偏好、语言设置、成就在导出时可能遗漏。
5. **重复存储**：语言设置同时存在 `state.locale`（在主存档里）和独立的 `rift_library_locale`。

---

## 2. 优化目标

1. **单一真相源**：所有持久化读写只通过 `js/persistence.js` 进行。
2. **统一命名空间**：所有 key 统一前缀 `riftlib_`，并按用途分组。
3. **向后兼容**：旧 key 自动迁移到新 key，用户无感知。
4. **状态与设置分离**：游戏进度（state）和用户偏好设置（settings）分开存储。
5. **为云存档留接口**：持久化层提供 `exportAll()` / `importAll()`，方便后续接入后端。

---

## 3. 具体方案

### 3.1 新增 `js/persistence.js`（持久化层）

职责：唯一允许直接访问 `localStorage` 的模块。其他模块全部通过它读写。

```js
// js/persistence.js
const PREFIX = 'riftlib_';

export const STORAGE_KEYS = {
  STATE: 'state_v2',           // 主存档
  STATE_BACKUP: 'state_backup', // 崩溃备份
  SETTINGS: 'settings',         // 用户偏好设置（JSON）
  ACHIEVEMENTS: 'achievements', // 成就数据
  META: 'meta',                 // 运行元数据（如 emoji 点击计数）
};

function fullKey(key) { return PREFIX + key; }

export function load(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(fullKey(key));
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    console.error(`[persistence] load ${key} failed`, e);
    return defaultValue;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(fullKey(key), JSON.stringify(value));
  } catch (e) {
    console.error(`[persistence] save ${key} failed`, e);
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(fullKey(key));
  } catch (e) { /* ignore */ }
}

/** 导出所有本地数据，用于备份/云同步 */
export function exportAll() {
  return {
    version: 1,
    keys: Object.values(STORAGE_KEYS).reduce((acc, k) => {
      acc[k] = load(k);
      return acc;
    }, {})
  };
}

/** 导入完整数据，用于恢复/云同步 */
export function importAll(bundle) {
  if (!bundle || !bundle.keys) return false;
  Object.entries(bundle.keys).forEach(([key, value]) => {
    if (value !== null && value !== undefined) save(key, value);
  });
  return true;
}
```

### 3.2 新增 `js/settings.js`（用户偏好设置层）

把音乐、音效、语言等用户偏好从 `state` 和各个模块中抽出来，集中管理。

```js
// js/settings.js
import { load, save, STORAGE_KEYS } from './persistence.js';

const DEFAULT_SETTINGS = {
  musicEnabled: true,
  musicVolume: 0.7,
  sfxEnabled: true,
  sfxVolume: 0.5,
  ambientEnabled: true,
  ambientVolume: 0.5,
  locale: 'zh',
};

let cache = null;

export function getSettings() {
  if (!cache) cache = load(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  return cache;
}

export function setSetting(key, value) {
  cache = { ...getSettings(), [key]: value };
  save(STORAGE_KEYS.SETTINGS, cache);
  return cache;
}
```

### 3.3 统一后的 key 映射

| 新 Key | 旧 Key | 说明 |
|--------|--------|------|
| `riftlib_state_v2` | `library_state` | 主存档 |
| `riftlib_state_backup` | `library_state_backup` | 崩溃备份 |
| `riftlib_settings` | `library_music`, `library_music_volume`, `library_sfx`, `library_sfx_volume`, `rift_library_locale` | 所有设置合并为一个 JSON |
| `riftlib_achievements` | `achievements` | 成就解锁 |
| `riftlib_meta` | `lib_emoji_clicks` | 运行元数据 |

### 3.4 旧 key 迁移策略

在 `js/persistence.js` 初始化时执行一次性迁移：

```js
const LEGACY_KEYS = {
  'library_state': STORAGE_KEYS.STATE,
  'library_state_backup': STORAGE_KEYS.STATE_BACKUP,
  'achievements': STORAGE_KEYS.ACHIEVEMENTS,
  'lib_emoji_clicks': STORAGE_KEYS.META,
};

const LEGACY_SETTINGS = {
  'library_music': { target: 'musicEnabled', map: v => v !== 'off' },
  'library_music_volume': { target: 'musicVolume', map: v => parseFloat(v) },
  'library_sfx': { target: 'sfxEnabled', map: v => v !== 'off' },
  'library_sfx_volume': { target: 'sfxVolume', map: v => parseFloat(v) },
  'rift_library_locale': { target: 'locale', map: v => v },
};

export function runLegacyMigration() {
  // 迁移独立旧 key
  Object.entries(LEGACY_KEYS).forEach(([oldKey, newKey]) => {
    const oldValue = localStorage.getItem(oldKey);
    if (oldValue !== null && load(newKey) === null) {
      save(newKey, JSON.parse(oldValue));
      localStorage.removeItem(oldKey);
    }
  });

  // 迁移设置类旧 key，合并到 riftlib_settings
  const settings = getSettings();
  let changed = false;
  Object.entries(LEGACY_SETTINGS).forEach(([oldKey, cfg]) => {
    const oldValue = localStorage.getItem(oldKey);
    if (oldValue !== null && settings[cfg.target] === DEFAULT_SETTINGS[cfg.target]) {
      settings[cfg.target] = cfg.map(oldValue);
      changed = true;
    }
    localStorage.removeItem(oldKey);
  });
  if (changed) save(STORAGE_KEYS.SETTINGS, settings);
}
```

### 3.5 各模块改造点

| 模块 | 改造内容 |
|------|----------|
| `js/state.js` | `initState()` / `saveState()` 改走 `persistence.load/save(STORAGE_KEYS.STATE)`；删除直接 `localStorage` 调用 |
| `js/audio.js` | 音乐/音效设置改走 `settings.getSettings()` / `setSetting()`；删除 `localStorage` 调用 |
| `js/ambient.js` | 环境音开关/音量从 `settings` 读取，不再和 `state.ambientSounds` 混用（或保留 state 但持久化走 settings） |
| `js/i18n/terms.js` | `getLocale()` / `setLocale()` 改走 `settings`；删除独立的 `rift_library_locale` |
| `js/achievements.js` | 成就存储走 `persistence.load/save(STORAGE_KEYS.ACHIEVEMENTS)` |
| `js/save-manager.js` | 备份/恢复/导出全部走 `persistence` 的 `exportAll` / `importAll` |
| `js/app.js` | 崩溃恢复面板的导出/重置操作改走 `persistence` |

### 3.6 关于 `state.locale` 重复存储

当前 `state.locale` 会被 `saveState()` 写入 `library_state`，同时 `terms.js` 单独存 `rift_library_locale`。**方案**：
- 以 `settings.locale` 为唯一真相源
- `state.locale` 在运行时可以存在（用于启动时读取），但保存时不同步到主存档
- 或者完全移除 `state.locale`，所有地方读 `getLocale()`

建议采用后者，减少一处重复。

---

## 4. 实施步骤

1. **新增 `js/persistence.js`**：定义 key、load/save/export/import/migrate
2. **新增 `js/settings.js`**：封装用户偏好
3. **修改 `js/state.js`**：主存档走 persistence；保留迁移逻辑但迁移到 persistence
4. **修改 `js/audio.js`**：音乐/音效设置走 settings
5. **修改 `js/i18n/terms.js`**：locale 走 settings
6. **修改 `js/achievements.js`**：成就存储走 persistence
7. **修改 `js/save-manager.js`**：备份导出走 persistence.exportAll/importAll
8. **修改 `js/app.js`**：崩溃面板操作走 persistence
9. **QA**：测试旧存档打开后数据不丢失、设置保留、导出备份完整

---

## 5. 风险与回滚

| 风险 | 缓解措施 |
|------|----------|
| 迁移失败导致用户存档丢失 | 迁移前先把旧 key 备份到 `riftlib_state_backup_legacy`；迁移逻辑加 try-catch |
| 某些模块仍直接访问旧 key | 全局搜索 `localStorage` 确保只剩 `persistence.js` 一处 |
| 设置项合并后格式不兼容 | `settings` 读取时做 schema 校验，缺字段用默认值补全 |
| 第三方脚本或用户脚本依赖旧 key | 迁移后保留旧 key 一个版本（可配置是否删除） |

---

## 6. 预期收益

1. 排查存档问题只需看一个模块
2. 新增持久化字段成本极低：改 `STORAGE_KEYS` 即可
3. 导出/导入/云同步天然支持，不需要逐个 key 处理
4. 项目命名空间清晰，避免冲突
5. 为后续接入后端存档、多端同步打下接口基础

---

## 7. 不做的范围

- 本次不改存储介质（仍用 localStorage），IndexedDB 升级另开方案
- 不改动游戏状态结构 `state` 内部的业务字段
- 不改动现有成就/音乐/语言的业务逻辑，只改读写入口
