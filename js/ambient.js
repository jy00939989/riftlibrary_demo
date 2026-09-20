// 环境音（白噪音）模块 —— 数据定义、购买、播放控制
import { state, saveState } from './state.js';
import { spendCoins } from './storage.js';
import { t } from './i18n/terms.js';
import { getSettings, setSetting } from './settings.js';
import { isDlcPackUnlocked } from './shop.js';
import { getMusicSalePrice } from '../data/music.js';

export const AMBIENT_DEFS = [
  { id: 'victorian_study', name: t('ambientName_victorian_study'), emoji: '🕯️', price: 500, file: 'audio/ambient/victorian_study.mp3' },
  {
    id: 'medieval_monastery',
    name: t('ambientName_medieval_monastery'),
    emoji: '⛪',
    price: 800,
    file: 'audio/ambient/中世纪修道院氛围音_25分钟循环.mp3',
    dlcPackId: 'pack_british_legends'
  }
];

let currentAudio = null;
let currentId = null;

/** 初始化环境音状态 */
export function initAmbient() {
  if (!state.ambientSounds) {
    state.ambientSounds = { unlocked: [], current: null };
  }
  // 旧版 enabled/volume 已迁移到 settings
  if ('enabled' in state.ambientSounds) {
    setSetting('ambientEnabled', state.ambientSounds.enabled);
    delete state.ambientSounds.enabled;
  }
  if ('volume' in state.ambientSounds) {
    setSetting('ambientVolume', state.ambientSounds.volume);
    delete state.ambientSounds.volume;
  }
  // 不在这里自动播放：浏览器通常会阻止自动播放，首次交互由 ensureAudioContext 统一初始化音效
}

/** 获取所有环境音定义（含解锁状态） */
export function getAmbientDefs() {
  const unlocked = getUnlockedAmbientIds();
  return AMBIENT_DEFS.map(def => ({
    ...def,
    unlocked: unlocked.includes(def.id)
  }));
}

/** 获取已解锁环境音 ID 列表 */
export function getUnlockedAmbientIds() {
  return (state.ambientSounds?.unlocked) || [];
}

/** 购买环境音（音乐节日半价日按折后价结算，与唱片同一口径 getMusicSalePrice） */
export function buyAmbient(id) {
  const def = AMBIENT_DEFS.find(d => d.id === id);
  if (!def) return { ok: false, reason: 'not_found' };
  const unlocked = getUnlockedAmbientIds();
  if (unlocked.includes(id)) return { ok: false, reason: 'already_owned' };
  if (def.dlcPackId && !isDlcPackUnlocked(def.dlcPackId)) {
    return { ok: false, reason: 'dlc_locked', dlcPackId: def.dlcPackId };
  }
  const sale = getMusicSalePrice(def.price);
  if (!spendCoins(sale.price)) return { ok: false, reason: 'no_coins' };

  if (!state.ambientSounds) {
    state.ambientSounds = { unlocked: [], current: null };
  }
  state.ambientSounds.unlocked.push(id);
  saveState();
  return { ok: true, def, paid: sale.price, original: sale.original };
}

/** 选择并播放指定环境音，传 null 则停止 */
export function selectAmbient(id) {
  if (!state.ambientSounds) {
    state.ambientSounds = { unlocked: [], current: null };
  }
  if (id && !getUnlockedAmbientIds().includes(id)) return false;
  state.ambientSounds.current = id || null;
  saveState();
  playAmbient(id);
  return true;
}

/** 播放/停止环境音 */
export function playAmbient(id, immediate = false) {
  if (!isAmbientEnabled()) return;
  // 同曲已在播：不重建 Audio 对象，避免重复/中断
  if (id && id === currentId && currentAudio && !currentAudio.paused) return;

  if (currentAudio) {
    try { currentAudio.pause(); currentAudio.src = ''; } catch (e) {}
    currentAudio = null;
  }
  if (!id) {
    stopAmbient();
    return;
  }
  const def = AMBIENT_DEFS.find(d => d.id === id);
  if (!def) return;

  const audio = new Audio(encodeURI(def.file));
  audio.loop = true;
  audio.volume = immediate ? getAmbientVolume() : 0;
  // 供 audio.js 的本地调试探针读取（仅 localhost 使用）
  if (typeof window !== 'undefined') {
    window.__riftAmbientDebug = () => currentAudio
      ? { tag: 'ambient:' + currentId, src: (currentAudio.src || '').split('/').pop(), paused: currentAudio.paused, volume: currentAudio.volume, time: Math.round(currentAudio.currentTime || 0) }
      : null;
  }
  audio.onerror = () => {
    // 仅当出错的是当前在播实例才清状态（同 audio.js：清理旧实例 src 置空触发异步 error，
    // 无条件清空会误杀正在播的新实例）
    if (currentAudio === audio) {
      currentAudio = null;
      currentId = null;
    }
  };

  currentAudio = audio;
  currentId = id;

  audio.play().then(() => {
    if (!immediate) {
      // 播放成功后淡入
      let step = 0;
      const target = getAmbientVolume();
      const timer = setInterval(() => {
        step++;
        if (!currentAudio || currentAudio !== audio) {
          clearInterval(timer);
          return;
        }
        currentAudio.volume = Math.min(target, step * 0.05);
        if (currentAudio.volume >= target) clearInterval(timer);
      }, 100);
    }
  }).catch(() => {
    // 自动播放被阻止或加载失败
    if (currentAudio === audio) {
      currentAudio = null;
      currentId = null;
    }
  });
}

/** 停止环境音 */
export function stopAmbient() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  currentId = null;
}

/** 开关环境音 */
export function setAmbientEnabled(value) {
  const enabled = !!value;
  setSetting('ambientEnabled', enabled);
  if (enabled) {
    let id = state.ambientSounds?.current;
    if (!id) {
      const unlocked = getUnlockedAmbientIds();
      if (unlocked.length > 0) {
        id = unlocked[0];
        state.ambientSounds.current = id;
        saveState();
      }
    }
    playAmbient(id);
  } else {
    stopAmbient();
  }
}

export function isAmbientEnabled() {
  return getSettings().ambientEnabled !== false;
}

/** 设置音量 0-1 */
export function setAmbientVolume(value) {
  const v = Math.max(0, Math.min(1, value));
  setSetting('ambientVolume', v);
  if (currentAudio) currentAudio.volume = v;
}

export function getAmbientVolume() {
  return getSettings().ambientVolume ?? 0.5;
}

/** 获取当前播放的环境音 ID */
export function getCurrentAmbientId() {
  return currentId || state.ambientSounds?.current || null;
}
