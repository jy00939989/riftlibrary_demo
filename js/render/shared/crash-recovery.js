// Crash recovery full-screen overlay
import { remove, STORAGE_KEYS, load } from '../../persistence.js';

export function showCrashRecovery(message, file, line) {
  // Prevent recursion
  if (document.getElementById('crash-recovery')) return;

  const overlay = document.createElement('div');
  overlay.id = 'crash-recovery';
  overlay.className = 'fixed inset-0 z-[300] flex items-center justify-center p-4';
  overlay.style.background = 'radial-gradient(ellipse at center, #3d2b1f 0%, #1a1410 100%)';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-2xl p-6 max-w-sm w-full text-center magic-glow">
      <div class="text-5xl mb-3">🦉</div>
      <p class="text-sm text-magic-gold font-bold mb-2">墨墨发现了一些不对劲…</p>
      <p class="text-xs text-ink-light leading-relaxed mb-4">
        图书馆的魔法暂时有些波动。<br>别担心，你的抄写记录都还在。
      </p>
      <details class="text-left mb-4">
        <summary class="text-xs text-ink-light/50 cursor-pointer">错误详情</summary>
        <pre class="text-xs text-red-500 mt-2 p-2 bg-red-50 rounded overflow-x-auto max-h-32">${message}${file ? '\n文件: ' + file + ':' + line : ''}</pre>
      </details>
      <div class="space-y-2">
        <button id="crash-reload" class="w-full px-4 py-2.5 bg-magic-gold text-white rounded-lg font-bold hover:shadow-lg transition-all text-sm">
          🔄 刷新页面
        </button>
        <button id="crash-reset" class="w-full px-4 py-2.5 bg-red-100 text-red-700 rounded-lg font-bold hover:bg-red-200 transition-all text-sm">
          ⚠️ 重置存档重新开始
        </button>
        <button id="crash-export" class="w-full px-4 py-2.5 bg-wood/15 text-ink rounded-lg font-bold hover:bg-wood/25 transition-all text-sm">
          📥 先导出存档备份
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#crash-reload').addEventListener('click', () => location.reload());
  overlay.querySelector('#crash-reset').addEventListener('click', () => {
    if (confirm('确定要清除所有存档数据重新开始吗？此操作不可恢复。')) {
      remove(STORAGE_KEYS.STATE);
      remove(STORAGE_KEYS.STATE_BACKUP);
      remove(STORAGE_KEYS.SETTINGS);
      remove(STORAGE_KEYS.ACHIEVEMENTS);
      remove(STORAGE_KEYS.META);
      location.reload();
    }
  });
  overlay.querySelector('#crash-export').addEventListener('click', () => {
    const payload = load(STORAGE_KEYS.STATE);
    if (!payload || !payload.library) {
      alert('存档数据不可用');
      return;
    }
    const blob = new Blob([JSON.stringify({ version: 1, state: payload }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `归墟图书馆_崩溃备份_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}
