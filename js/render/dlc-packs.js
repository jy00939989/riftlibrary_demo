// 补充包（DLC Pack）商店渲染

import { state } from '../state.js';
import { BOOKS } from '../../data/books.js';
import { SHARED_POOL } from '../../data/book_pool.js';
import { el, t, updateStatusBar, getBookTitle, actions } from './common.js';
import { playSfx } from '../audio.js';
import {
  getDlcPacks, isDlcPackUnlocked, purchaseDlcPack, redeemDlcCode
} from '../shop.js';

export function renderDlcPacksSection(container) {
  const packs = getDlcPacks();
  if (packs.length === 0) return;

  const section = el('div', 'parchment-bg rounded-2xl p-6 magic-glow mb-6');
  section.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-display text-xl font-bold">📦 ${t('dlcPackTitle')}</h2>
      <button id="dlc-redeem-code-btn" class="text-xs text-magic-blue hover:text-magic-gold underline">${t('dlcPackRedeemCode')}</button>
    </div>
  `;

  const grid = el('div', 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3');
  packs.forEach(pack => {
    grid.appendChild(renderDlcPackCard(pack));
  });
  section.appendChild(grid);

  const redeemBtn = section.querySelector('#dlc-redeem-code-btn');
  if (redeemBtn) {
    redeemBtn.addEventListener('click', () => showRedeemCodeModal());
  }

  container.appendChild(section);
}

function renderDlcPackCard(pack) {
  const unlocked = isDlcPackUnlocked(pack.id);
  const bookCount = pack.bookIds.length;
  const totalWords = pack.bookIds.reduce((sum, id) => {
    const book = BOOKS[id];
    return sum + (book?.totalWords || 0);
  }, 0);

  const card = el('div', `rounded-xl p-4 border-2 transition-all ${
    unlocked ? 'bg-gray-100 border-gray-200 opacity-70' : 'bg-white border-wood/20 hover:border-magic-gold/50 hover:shadow-lg cursor-pointer'
  }`);

  card.innerHTML = `
    <div class="flex items-start gap-3 mb-3">
      <span class="text-4xl">${pack.emoji}</span>
      <div class="flex-1 min-w-0">
        <div class="font-bold text-sm truncate">${pack.title}</div>
        <div class="text-xs text-ink-light mt-0.5">${t('dlcPackContainsBooks').replace('{n}', bookCount)} · ${totalWords.toLocaleString()}${t('wordsUnit')}</div>
      </div>
    </div>
    <p class="text-xs text-ink-light mb-3 line-clamp-2">${pack.description}</p>
    <div class="flex items-center justify-between">
      ${unlocked
        ? `<span class="text-xs font-bold text-green-600">${t('dlcPackUnlocked')}</span>`
        : `<span class="text-sm text-magic-gold font-bold">💰${pack.price.toLocaleString()}</span>`
      }
      ${unlocked
        ? ''
        : `<button class="dlc-unlock-btn px-3 py-1.5 bg-magic-gold text-white rounded-lg text-xs font-bold hover:shadow transition-all" data-pack-id="${pack.id}">${t('dlcPackUnlock')}</button>`
      }
    </div>
  `;

  if (!unlocked) {
    const unlockBtn = card.querySelector('.dlc-unlock-btn');
    if (unlockBtn) {
      unlockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showDlcPackModal(pack);
      });
    }
    card.addEventListener('click', () => showDlcPackModal(pack));
  }

  return card;
}

function showDlcPackModal(pack) {
  const unlocked = isDlcPackUnlocked(pack.id);
  const overlay = el('div', 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4');

  const bookListHtml = pack.bookIds.map(id => {
    const book = BOOKS[id];
    const poolEntry = SHARED_POOL.find(b => b.bookId === id);
    const title = getBookTitle(poolEntry || book);
    const price = poolEntry?.price || 0;
    return `
      <div class="flex items-center justify-between text-xs py-1.5 border-b border-wood/10 last:border-0">
        <span>${book?.emoji || '📖'} ${title}</span>
        <span class="text-magic-gold">💰${price.toLocaleString()}</span>
      </div>
    `;
  }).join('');

  const canAfford = (state.coins || 0) >= pack.price;

  const content = el('div', 'parchment-bg rounded-2xl p-6 max-w-sm w-full magic-glow animate-scale-in');
  content.innerHTML = `
    <div class="text-center mb-4">
      <div class="text-5xl mb-3">${pack.emoji}</div>
      <h3 class="font-display text-xl font-bold mb-1">${pack.title}</h3>
      <p class="text-sm text-ink-light">${pack.description}</p>
    </div>
    <div class="bg-white/60 rounded-lg p-3 mb-4 max-h-48 overflow-y-auto">
      <div class="text-xs font-bold text-ink-light mb-2">${t('dlcPackContainsBooks').replace('{n}', pack.bookIds.length)}</div>
      ${bookListHtml}
    </div>
    <div class="text-center mb-4">
      <span class="text-magic-gold font-bold text-lg">💰${pack.price.toLocaleString()}</span>
      <span class="text-xs text-ink-light ml-2">${t('dlcPackPrice')}</span>
    </div>
    <div class="flex justify-center gap-3">
      <button class="cancel-btn px-6 py-2.5 bg-wood/20 text-ink-light rounded-lg font-bold hover:bg-wood/30 transition-all">${t('cancel')}</button>
      ${unlocked
        ? `<button class="confirm-btn px-6 py-2.5 bg-gray-400 text-white rounded-lg font-bold cursor-not-allowed" disabled>${t('dlcPackUnlocked')}</button>`
        : `<button class="confirm-btn px-6 py-2.5 bg-magic-gold text-white rounded-lg font-bold hover:shadow-lg transition-all ${!canAfford ? 'opacity-50 cursor-not-allowed' : ''}">${t('dlcPackUnlock')}</button>`
      }
    </div>
    ${!unlocked && !canAfford ? `<p class="text-xs text-red-500 text-center mt-2">${t('dlcPackInsufficientCoins')}</p>` : ''}
  `;

  overlay.appendChild(content);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  content.querySelector('.cancel-btn')?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const confirmBtn = content.querySelector('.confirm-btn');
  if (confirmBtn && !unlocked) {
    confirmBtn.addEventListener('click', () => {
      const result = purchaseDlcPack(pack.id);
      if (result.ok) {
        playSfx('buy_success');
        updateStatusBar();
        close();
        // 通知外部刷新商店页
        if (actions.renderShopPage) actions.renderShopPage();
      } else {
        let msg = t('dlcPackUnlockFailed');
        if (result.reason === 'insufficient_coins') msg = t('dlcPackInsufficientCoins');
        alert(msg);
      }
    });
  }
}

function showRedeemCodeModal() {
  const overlay = el('div', 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4');

  const content = el('div', 'parchment-bg rounded-2xl p-6 max-w-sm w-full magic-glow animate-scale-in');
  content.innerHTML = `
    <div class="text-center mb-4">
      <div class="text-4xl mb-3">🎟️</div>
      <h3 class="font-display text-lg font-bold mb-1">${t('dlcPackRedeemCode')}</h3>
      <p class="text-xs text-ink-light">${t('dlcPackRedeemDesc')}</p>
    </div>
    <div class="mb-4">
      <input id="dlc-redeem-input" type="text" class="w-full px-3 py-2 border border-wood/30 rounded-lg text-sm text-center uppercase" placeholder="${t('dlcPackRedeemPlaceholder')}" />
    </div>
    <p id="dlc-redeem-msg" class="text-xs text-center min-h-[1rem] mb-3"></p>
    <div class="flex justify-center gap-3">
      <button class="cancel-btn px-6 py-2.5 bg-wood/20 text-ink-light rounded-lg font-bold hover:bg-wood/30 transition-all">${t('cancel')}</button>
      <button class="confirm-btn px-6 py-2.5 bg-magic-gold text-white rounded-lg font-bold hover:shadow-lg transition-all">${t('dlcPackRedeemSubmit')}</button>
    </div>
  `;

  overlay.appendChild(content);
  document.body.appendChild(overlay);

  const msgEl = content.querySelector('#dlc-redeem-msg');
  const input = content.querySelector('#dlc-redeem-input');

  const msg = (text, isError) => {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.className = `text-xs text-center min-h-[1rem] mb-3 ${isError ? 'text-red-500' : 'text-green-600'}`;
  };

  const close = () => overlay.remove();
  content.querySelector('.cancel-btn')?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  content.querySelector('.confirm-btn')?.addEventListener('click', async () => {
    const code = input?.value || '';
    const result = redeemDlcCode(code);
    if (result.ok) {
      playSfx('buy_success');
      msg(t('dlcPackRedeemSuccess').replace('{n}', result.unlockedPacks.length), false);
      updateStatusBar();
      setTimeout(() => {
        close();
        if (actions.renderShopPage) actions.renderShopPage();
      }, 800);
    } else {
      const key = result.error === 'already_redeemed' ? 'dlcPackAlreadyRedeemed'
        : result.error === 'empty_code' ? 'dlcPackInvalidCode'
        : 'dlcPackInvalidCode';
      msg(t(key), true);
    }
  });
}
