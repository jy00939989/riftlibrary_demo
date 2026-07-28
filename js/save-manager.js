// 存档管理器 —— 导出/导入/剪贴板
import { state, saveState } from './state.js';
import { t } from './i18n/terms.js';

const SAVE_VERSION = 1;

function buildSavePayload() {
  // 不含运行时字段
  const { currentSession, ...clean } = state;
  return {
    version: SAVE_VERSION,
    exportedAt: new Date().toISOString(),
    libraryName: state.library?.name || t('libraryName'),
    atmosphere: state.library?.atmosphere || 0,
    totalWords: state.focus?.totalWords || 0,
    state: clean
  };
}

/** 导出为 JSON 文件下载 */
function exportToFile() {
  const payload = buildSavePayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ts = new Date().toISOString().slice(0, 10);
  const name = payload.libraryName || t('libraryName');
  a.href = url;
  a.download = `${name}_${t('saveFileSuffix')}_${ts}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return payload;
}

/** 复制存档码到剪贴板（压缩 JSON） */
async function copyToClipboard() {
  const payload = buildSavePayload();
  const json = JSON.stringify(payload);
  try {
    await navigator.clipboard.writeText(json);
    return { ok: true, size: json.length };
  } catch {
    return { ok: false, error: t('clipboardUnavailable') };
  }
}

/** 验证导入的存档数据 */
function validatePayload(data) {
  if (!data || typeof data !== 'object') return t('invalidSaveFile');
  if (!data.state) return t('saveFormatIncorrect');
  if (!data.state.library || !data.state.focus || !data.state.books) return t('saveMissingRequiredFields');
  return null;
}

/** 从 JSON 字符串导入存档 */
function importFromJSON(jsonStr) {
  let data;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    return { ok: false, error: t('saveJsonParseFailed') };
  }

  const validationError = validatePayload(data);
  if (validationError) return { ok: false, error: validationError };

  // 备份当前存档
  const backup = localStorage.getItem('library_state');
  if (backup) {
    try {
      localStorage.setItem('library_state_backup', backup);
    } catch { /* storage full, skip backup */ }
  }

  // 写入新存档
  const clean = { ...data.state };
  clean.currentSession = {
    active: false,
    mode: 'pomodoro',
    bookId: null,
    targetMinutes: 25,
    elapsedSeconds: 0,
    paused: false,
    intervalId: null,
    quoteIndex: 0
  };
  localStorage.setItem('library_state', JSON.stringify(clean));

  return {
    ok: true,
    details: {
      libraryName: data.libraryName || '?',
      atmosphere: data.atmosphere || 0,
      totalWords: data.totalWords || 0,
      exportedAt: data.exportedAt || t('unknown'),
      hasBackup: !!backup
    }
  };
}

/** 从文件读取导入 */
function importFromFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = importFromJSON(reader.result);
      resolve(result);
    };
    reader.onerror = () => {
      resolve({ ok: false, error: t('saveFileReadFailed') });
    };
    reader.readAsText(file);
  });
}

// ========== UI ==========

function showSaveManager() {
  const existing = document.getElementById('save-manager-modal');
  if (existing) { existing.remove(); return; }

  const overlay = document.createElement('div');
  overlay.id = 'save-manager-modal';
  overlay.className = 'fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4';
  overlay.innerHTML = `
    <div class="parchment-bg rounded-2xl p-6 max-w-sm w-full magic-glow animate-scale-in">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-display text-lg font-bold">${t('saveManagerTitle')}</h3>
        <button id="save-mgr-close" class="text-ink-light/50 hover:text-ink text-xl leading-none">&times;</button>
      </div>

      <p class="text-xs text-ink-light mb-4">
        ${t('saveLocalWarning')}
      </p>

      <div class="space-y-3">
        <button id="save-export-file" class="w-full px-4 py-3 bg-magic-gold text-white rounded-lg font-bold hover:shadow-lg transition-all text-sm">
          ${t('exportSaveFile')}
        </button>

        <button id="save-copy-clipboard" class="w-full px-4 py-3 bg-wood/15 text-ink rounded-lg font-bold hover:bg-wood/25 transition-all text-sm">
          ${t('copySaveCode')}
        </button>

        <div class="border-t border-wood/15 pt-3">
          <p class="text-xs text-ink-light mb-2">${t('restoreFromBackup')}</p>
          <button id="save-import-file" class="w-full px-4 py-3 bg-wood/15 text-ink rounded-lg font-bold hover:bg-wood/25 transition-all text-sm mb-2">
            ${t('selectSaveFileImport')}
          </button>
          <input type="file" id="save-import-input" accept=".json" class="hidden">

          <details class="text-xs">
            <summary class="text-ink-light cursor-pointer hover:text-ink">${t('orPasteSaveCode')}</summary>
            <textarea id="save-paste-area" class="w-full h-20 mt-2 p-2 border border-wood/30 rounded-lg text-xs font-mono resize-none" placeholder="${t('pasteSaveCodeHere')}"></textarea>
            <button id="save-paste-import" class="mt-2 px-4 py-1.5 bg-magic-blue text-white rounded-lg text-xs font-bold hover:shadow transition-all">${t('importPastedSave')}</button>
          </details>
        </div>

        ${localStorage.getItem('library_state_backup') ? `
          <div class="border-t border-wood/15 pt-3">
            <button id="save-restore-backup" class="w-full px-4 py-3 bg-red-100 text-red-700 rounded-lg font-bold hover:bg-red-200 transition-all text-sm">
              ${t('restorePreviousBackup')}
            </button>
          </div>
        ` : ''}
      </div>

      <p id="save-msg" class="text-xs text-center mt-3 min-h-[1rem]"></p>
    </div>
  `;

  document.body.appendChild(overlay);

  const msg = (text, isError) => {
    const el = document.getElementById('save-msg');
    if (el) {
      el.textContent = text;
      el.className = `text-xs text-center mt-3 min-h-[1rem] ${isError ? 'text-red-500' : 'text-green-600'}`;
    }
  };

  const close = () => overlay.remove();
  overlay.querySelector('#save-mgr-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // 导出文件
  overlay.querySelector('#save-export-file').addEventListener('click', () => {
    const p = exportToFile();
    msg(t('exportSuccessDetail')
      .replace('{libraryName}', p.libraryName)
      .replace('{atmosphere}', p.atmosphere)
      .replace('{words}', p.totalWords.toLocaleString()));
  });

  // 复制到剪贴板
  overlay.querySelector('#save-copy-clipboard').addEventListener('click', async () => {
    const result = await copyToClipboard();
    if (result.ok) {
      msg(t('copySaveCodeSuccess').replace('{size}', (result.size / 1024).toFixed(1)));
    } else {
      msg(result.error, true);
    }
  });

  // 导入文件
  const fileInput = overlay.querySelector('#save-import-input');
  overlay.querySelector('#save-import-file').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const result = await importFromFile(file);
    if (result.ok) {
      msg(t('importSuccessDetail').replace('{libraryName}', result.details.libraryName));
      setTimeout(() => location.reload(), 1500);
    } else {
      msg(result.error, true);
    }
    fileInput.value = '';
  });

  // 粘贴导入
  overlay.querySelector('#save-paste-import').addEventListener('click', () => {
    const text = overlay.querySelector('#save-paste-area').value.trim();
    if (!text) { msg(t('pasteSaveCodeFirst'), true); return; }
    const result = importFromJSON(text);
    if (result.ok) {
      msg(t('importSuccessDetail').replace('{libraryName}', result.details.libraryName));
      setTimeout(() => location.reload(), 1500);
    } else {
      msg(result.error, true);
    }
  });

  // 恢复备份
  const restoreBtn = overlay.querySelector('#save-restore-backup');
  if (restoreBtn) {
    restoreBtn.addEventListener('click', () => {
      const backup = localStorage.getItem('library_state_backup');
      if (!backup) { msg(t('noBackupToRestore'), true); return; }
      if (!confirm(t('confirmRestoreBackup'))) return;
      localStorage.setItem('library_state', backup);
      localStorage.removeItem('library_state_backup');
      msg(t('backupRestoredRefreshing'));
      setTimeout(() => location.reload(), 1000);
    });
  }
}

// ========== 初始化 ==========

function init() {
  const btn = document.getElementById('save-mgr-btn');
  if (btn) {
    btn.addEventListener('click', showSaveManager);
  }
}

// DOM ready 后绑定按钮
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
