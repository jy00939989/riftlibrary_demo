// 视频动画叠加层 —— Seedance 生成动画的统一播放组件
// 清单与素材约定见 docs/plans/animation-suite-seedance-2.5.md §3
//
// 降级链（任何一环失败都走 onFail，调用方回退现有 CSS 动画，现有逻辑原样保留）：
//   manifest.json 无该 key → 文件 404 → <video> 加载 error → onFail
// 跳过重复动画：设置开启且该 key 已播过时，不播放、不算降级，直接走 onDone 继续后续流程。
import { t } from '../../i18n/terms.js';
import { getSettings } from '../../settings.js';
import { load, save, STORAGE_KEYS } from '../../persistence.js';

let manifestPromise = null;

function loadManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch('visual/animations/manifest.json')
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  return manifestPromise;
}

function getSeenSet() {
  const list = load(STORAGE_KEYS.SEEN_ANIMATIONS, []);
  return new Set(Array.isArray(list) ? list : []);
}

/** 查询某动画是否已播放过（「跳过重复动画」设置用） */
export function hasSeenAnimation(key) {
  return getSeenSet().has(key);
}

function markAnimationSeen(key) {
  const seen = getSeenSet();
  if (seen.has(key)) return;
  seen.add(key);
  save(STORAGE_KEYS.SEEN_ANIMATIONS, Array.from(seen));
}

/**
 * 全屏暗化遮罩 + 居中播放动画视频。
 * @param {string} key — manifest.json 中的键
 * @param {Object} opts
 * @param {Function} [opts.onDone]  — 播完正常关闭后回调（含「已看过被跳过」的场景）
 * @param {Function} [opts.onSkip]  — 用户点击跳过后回调
 * @param {Function} [opts.onFail]  — 任一降级链环节失败时回调；缺省则等同播完，直接走 onDone
 * @returns {Promise<boolean>} true=实际播放了视频，false=降级或未播（已看过/设置跳过）
 */
export async function playVideoOverlay(key, { onDone, onSkip, onFail } = {}) {
  const manifest = await loadManifest();
  const entry = manifest && manifest[key];
  const fail = () => {
    if (onFail) onFail();
    else if (onDone) onDone();
    return false;
  };
  if (!entry || !entry.file) return fail();

  // 跳过重复动画：已播过 → 不播，直接继续后续流程（不走 onFail，避免误触发 CSS 降级）
  if (getSettings().skipSeenAnimations && hasSeenAnimation(key)) {
    if (onDone) onDone();
    return false;
  }

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/85 z-[160] flex items-center justify-center';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';

    const video = document.createElement('video');
    video.src = entry.file;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.className = 'max-h-[80vh] max-w-[92vw] rounded-xl shadow-2xl';

    const hint = document.createElement('div');
    hint.className = 'absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-xs pointer-events-none';
    hint.textContent = t('animTapToSkip');

    overlay.appendChild(video);
    overlay.appendChild(hint);

    let closed = false;
    const close = (skipped) => {
      if (closed) return;
      closed = true;
      markAnimationSeen(key);
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 300);
      if (skipped && onSkip) onSkip();
      else if (onDone) onDone();
      resolve(true);
    };

    video.addEventListener('ended', () => close(false));
    video.addEventListener('error', () => {
      overlay.remove();
      resolve(fail());
    });
    overlay.addEventListener('click', () => close(true));

    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });
  });
}
