// Library naming modal
import { state } from '../../state.js';
import { el, actions } from '../common.js';
import { setLibraryName } from '../../core/library.js';
import { t } from '../../i18n/terms.js';

export function showNamingModal() {
  const overlay = el('div', 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4');

  const content = el('div', 'parchment-bg rounded-2xl p-6 max-w-md w-full magic-glow animate-scale-in');
  content.innerHTML = `
    <div class="text-center mb-6">
      <div class="text-5xl mb-3">🏷️</div>
      <h3 class="font-display text-xl font-bold mb-2">${t('libraryNaming')}</h3>
      <p class="text-sm text-ink-light">${t('nameTheLibrary')}</p>
    </div>
    <div class="mb-4">
      <input id="naming-input" type="text" maxlength="12"
        class="w-full px-4 py-3 rounded-lg border-2 border-wood/30 bg-white text-center font-display text-lg focus:border-magic-gold focus:outline-none transition-all"
        placeholder="${state.library.name}" value="">
      <p class="text-xs text-ink-light text-center mt-2" id="naming-hint">${t('maxNCharacters').replace('{n}', 12)}</p>
    </div>
    <div class="flex justify-center gap-3">
      <button class="cancel-name-btn px-6 py-2.5 bg-wood/20 text-ink-light rounded-lg font-bold hover:bg-wood/30 transition-all">${t('maybeLater')}</button>
      <button class="confirm-name-btn px-6 py-2.5 bg-magic-gold text-white rounded-lg font-bold hover:shadow-lg transition-all">${t('inscribeThisName')}</button>
    </div>
  `;

  overlay.appendChild(content);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  const input = content.querySelector('#naming-input');
  const hint = content.querySelector('#naming-hint');

  // Live character hint
  input.addEventListener('input', () => {
    const len = input.value.length;
    hint.textContent = len > 12
      ? t('charsOver').replace('{n}', len - 12)
      : t('charsRemaining').replace('{n}', 12 - len);
    hint.className = `text-xs text-center mt-2 ${len > 12 ? 'text-red-500' : 'text-ink-light'}`;
  });

  // Enter to confirm
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmName();
  });

  content.querySelector('.cancel-name-btn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  function confirmName() {
    const rawName = input.value.trim();
    const finalName = rawName || state.library.name; // keep default if empty

    const result = setLibraryName(finalName);
    if (!result.ok) {
      hint.textContent = t('nameTooLong');
      hint.className = 'text-xs text-center mt-2 text-red-500';
      return;
    }

    // Refresh top navigation name
    const nameEl = document.getElementById('nav-library-name');
    if (nameEl) nameEl.textContent = result.name;
    overlay.remove();
    if (actions.renderShopPage) {
      actions.renderShopPage();
    }
    // Refresh curator office if visible
    if (typeof window.renderLibraryPage === 'function') {
      window.renderLibraryPage();
    }
  }

  content.querySelector('.confirm-name-btn').addEventListener('click', confirmName);

  // Auto-focus input
  setTimeout(() => input.focus(), 100);
}
