// 集中式持久化层 —— 唯一允许直接访问 localStorage 的模块
// 其他模块全部通过本模块读写。

const PREFIX = 'riftlib_';

export const STORAGE_KEYS = {
  STATE: 'state_v2',           // 主游戏存档
  STATE_BACKUP: 'state_backup', // 崩溃备份存档
  SETTINGS: 'settings',         // 用户偏好设置（JSON）
  ACHIEVEMENTS: 'achievements', // 成就解锁状态
  META: 'meta',                 // 运行元数据（如 emoji 点击计数）
};

// 旧版独立 key → 新版 key 映射（settings 类旧 key 在 settings.js 自行迁移）
const LEGACY_KEYS = {
  'library_state': STORAGE_KEYS.STATE,
  'library_state_backup': STORAGE_KEYS.STATE_BACKUP,
  'achievements': STORAGE_KEYS.ACHIEVEMENTS,
  'lib_emoji_clicks': STORAGE_KEYS.META,
};

const LEGACY_BACKUP_NS = 'riftlib_legacy_backup_';
const MIGRATED_FLAG = 'migrated_v1';

function fullKey(key) { return PREFIX + key; }

/** 安全解析，解析失败返回 undefined */
function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/** 读取持久化数据 */
export function load(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(fullKey(key));
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    console.error(`[persistence] load ${key} failed`, e);
    return defaultValue;
  }
}

/** 写入持久化数据，返回是否成功 */
export function save(key, value) {
  try {
    localStorage.setItem(fullKey(key), JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`[persistence] save ${key} failed`, e);
    return false;
  }
}

/** 删除持久化数据 */
export function remove(key) {
  try {
    localStorage.removeItem(fullKey(key));
    return true;
  } catch (e) {
    console.error(`[persistence] remove ${key} failed`, e);
    return false;
  }
}

/** 迁移前备份所有旧 key（settings 类旧 key 由 settings.js 自行备份） */
function backupLegacyKeys() {
  Object.keys(LEGACY_KEYS).forEach(oldKey => {
    const v = localStorage.getItem(oldKey);
    if (v !== null) {
      localStorage.setItem(LEGACY_BACKUP_NS + oldKey, v);
    }
  });
}

/**
 * 一次性旧 key 迁移。
 * 必须在 app 启动的最早时刻、任何其他模块 load 之前调用。
 * 幂等：已迁移过则直接返回。
 */
export function runLegacyMigration() {
  if (load(MIGRATED_FLAG)) return;

  try {
    backupLegacyKeys();

    Object.entries(LEGACY_KEYS).forEach(([oldKey, newKey]) => {
      const oldValue = localStorage.getItem(oldKey);
      if (oldValue === null) return;

      // 新 key 已存在则跳过迁移，仅清理旧 key
      if (load(newKey) !== null) {
        localStorage.removeItem(oldKey);
        return;
      }

      const parsed = safeParse(oldValue);
      if (parsed === undefined) {
        console.warn(`[migrate] skip corrupt legacy key ${oldKey}`);
        return; // 不删、不中断，保留现场供排查
      }

      save(newKey, parsed);
      localStorage.removeItem(oldKey);
    });
  } catch (e) {
    console.error('[migrate] legacy migration failed', e);
  } finally {
    // 无论成功与否都标记，避免重启反复重试半成品
    save(MIGRATED_FLAG, true);
  }
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
  if (!bundle || typeof bundle !== 'object' || !bundle.keys) return false;
  if (bundle.version !== 1) {
    console.warn('[import] unsupported version', bundle.version);
    return false;
  }

  // 备份当前，便于回滚
  const prev = exportAll();
  try {
    Object.entries(bundle.keys).forEach(([key, value]) => {
      if (value == null) return;
      const type = typeof value;
      if (type !== 'object' && type !== 'string' && type !== 'number' && type !== 'boolean') return;
      save(key, value);
    });
    return true;
  } catch (e) {
    console.error('[import] import failed, rolling back', e);
    Object.entries(prev.keys).forEach(([k, v]) => save(k, v));
    return false;
  }
}
