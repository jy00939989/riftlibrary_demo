// 用户偏好设置层 —— 音乐/音效/环境音/语言等用户偏好集中管理
// 不依赖任何业务模块，只通过 persistence.js 读写。

import { load, save, STORAGE_KEYS } from './persistence.js';

export const DEFAULT_SETTINGS = {
  musicEnabled: true,
  musicVolume: 0.7,
  sfxEnabled: true,
  sfxVolume: 0.5,
  ambientEnabled: true,
  ambientVolume: 0.5,
  locale: 'zh',
};

// 旧版设置类 key → 新 settings 字段映射
// 注意：map 必须对脏值兜底，否则 parseFloat('off'/'') 会写出 NaN，污染音量（P2-3）
const LEGACY_SETTINGS = {
  'library_music': { target: 'musicEnabled', map: v => v !== 'off' },
  'library_music_volume': {
    target: 'musicVolume',
    map: v => { const n = parseFloat(v); return Number.isFinite(n) ? n : DEFAULT_SETTINGS.musicVolume; }
  },
  'library_sfx': { target: 'sfxEnabled', map: v => v !== 'off' },
  'library_sfx_volume': {
    target: 'sfxVolume',
    map: v => { const n = parseFloat(v); return Number.isFinite(n) ? n : DEFAULT_SETTINGS.sfxVolume; }
  },
  'rift_library_locale': { target: 'locale', map: v => v },
};

const LEGACY_BACKUP_NS = 'riftlib_legacy_backup_';

let cache = null;

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function backupLegacySettings() {
  Object.keys(LEGACY_SETTINGS).forEach(oldKey => {
    const v = localStorage.getItem(oldKey);
    if (v !== null) {
      localStorage.setItem(LEGACY_BACKUP_NS + oldKey, v);
    }
  });
}

/** 初始化设置：读取新设置 + 迁移旧设置 key */
export function initSettings() {
  const settings = { ...DEFAULT_SETTINGS, ...(load(STORAGE_KEYS.SETTINGS) || {}) };

  backupLegacySettings();

  let changed = false;
  Object.entries(LEGACY_SETTINGS).forEach(([oldKey, cfg]) => {
    const oldValue = localStorage.getItem(oldKey);
    if (oldValue !== null) {
      const parsed = safeParse(oldValue);
      // 旧 key 存在即以旧值为准（用户真实存过的偏好）
      if (parsed !== undefined) {
        settings[cfg.target] = cfg.map(parsed);
      } else {
        // 非 JSON 字符串（如 'off' / '0.7'）直接用原始值
        settings[cfg.target] = cfg.map(oldValue);
      }
      changed = true;
      localStorage.removeItem(oldKey);
    }
  });

  if (changed) {
    save(STORAGE_KEYS.SETTINGS, settings);
  }

  cache = settings;
  return settings;
}

/** 获取当前设置（返回副本，防止外部直接改缓存） */
export function getSettings() {
  if (!cache) cache = load(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  return { ...cache };
}

/** 更新单个设置项 */
export function setSetting(key, value) {
  cache = { ...getSettings(), [key]: value };
  save(STORAGE_KEYS.SETTINGS, cache);
  return cache;
}

/** 批量更新设置 */
export function setSettings(partial) {
  cache = { ...getSettings(), ...partial };
  save(STORAGE_KEYS.SETTINGS, cache);
  return cache;
}

