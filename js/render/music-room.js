// 留声阁 —— 馆主的唱片陈列室：浏览、购买、播放全部曲目
import { state } from '../state.js';
import { el, updateStatusBar } from './common.js';
import { t } from '../i18n/terms.js';
import { MUSIC_ROOM_UNLOCK_PRICE, getMusicSalePrice } from '../../data/music.js';
import { getEventsOnDate, getEventEffectMults, fmtZhe, fmtOff } from '../../data/event_calendar.js';
import { playSfx } from '../audio.js';
import {
  getAllTrackDefs, getCurrentTrackId, isBgmPlaying,
  selectTrack, purchaseTrack, toggleMusic, isMusicOn, updateToggleIcon
} from '../audio.js';
import {
  getAmbientDefs, buyAmbient, selectAmbient,
  getCurrentAmbientId, isAmbientEnabled, setAmbientEnabled
} from '../ambient.js';
import { isDlcPackUnlocked, getDlcPack } from '../shop.js';

function getTrackDisplayName(track) {
  const key = 'musicTrack_' + track.id;
  const localized = t(key);
  return localized === key ? track.name : localized;
}

// 渲染目标容器：顶栏独立页时代已结束（2026-09-20 图南拍板并入展览厅），
// 现由展览厅热点内嵌调用；容器记忆保证页内交互（购买/切换）后重渲染不丢位置。
let currentContainer = null;
export function renderMusicRoomPage(container = null) {
  const target = container || currentContainer || document.getElementById('exhibition-musicroom-slot');
  if (!target) return;
  currentContainer = target;
  const isInline = target.id === 'exhibition-musicroom-slot';

  target.innerHTML = '';
  const container = target;

  // 内嵌模式的收起条（展览厅热点展开后用）
  if (isInline) {
    const collapse = el('button', 'w-full mb-4 px-3 py-1.5 rounded-lg bg-wood/10 text-ink-light text-xs font-bold hover:bg-wood/20 transition-all');
    collapse.textContent = '▲ 收起唱片架';
    collapse.addEventListener('click', () => { target.innerHTML = ''; });
    container.appendChild(collapse);
  }

  // 未解锁：引导去商店
  if (!state.musicRoom?.unlocked) {
    const lockedCard = el('div', 'bg-amber-50/80 rounded-xl p-6 border-2 border-amber-200 text-center max-w-md mx-auto mt-8');
    lockedCard.innerHTML = `
      <div class="text-4xl mb-3">🔒</div>
      <h3 class="font-display text-lg font-bold mb-2">${t('musicRoomLocked')}</h3>
      <p class="text-sm text-ink-light mb-4">${t('musicRoomLockedDesc')}</p>
      <button class="goto-shop-music-room-btn px-5 py-2 bg-magic-gold text-white text-sm font-bold rounded-lg hover:shadow-lg transition-all">
        ${t('gotoShopUnlock').replace('{price}', MUSIC_ROOM_UNLOCK_PRICE.toLocaleString())}
      </button>
    `;
    lockedCard.querySelector('.goto-shop-music-room-btn').addEventListener('click', () => {
      if (window.switchTab) window.switchTab('shop');
    });
    container.appendChild(lockedCard);
    return;
  }

  const tracks = getAllTrackDefs();
  const currentId = getCurrentTrackId();
  const playing = isBgmPlaying();
  const musicOn = isMusicOn();
  const collected = tracks.filter(tr => tr.unlocked).length;

  // 页头
  const header = el('div', 'mb-6 text-center');
  header.innerHTML = `
    <h2 class="font-display text-2xl font-bold mb-1">🎵 ${t('tabMusicRoom')}</h2>
    <p class="text-sm text-ink-light">${t('musicRoomCollected').replace('{n}', collected).replace('{total}', tracks.length)}</p>
  `;
  container.appendChild(header);

  // 音乐节日横幅（2026-09-20 半价日活动，单日等值；命中即两架同折）
  const musicEvents = getEventsOnDate(new Date()).filter(e => e.type === 'music');
  if (musicEvents.length > 0) {
    const mult = getEventEffectMults(new Date()).shopDiscount;
    const names = musicEvents.map(e => t(e.nameKey)).join(' · ');
    const banner = el('div', 'rounded-xl px-4 py-3 mb-5 text-center text-sm font-bold border-2 border-magic-gold/60 bg-magic-gold/10 text-magic-gold');
    banner.innerHTML = t('musicSaleBanner')
      .replace('{events}', ' ' + names)
      .replace('{pct}', fmtZhe(mult))
      .replace('{off}', fmtOff(mult));
    container.appendChild(banner);
  }

  // 正在播放栏
  const currentTrack = tracks.find(tr => tr.id === currentId);
  const nowBar = el('div', 'parchment-bg rounded-2xl p-4 magic-glow mb-6 flex items-center gap-4');
  nowBar.innerHTML = `
    <span class="text-3xl flex-shrink-0">${currentTrack ? currentTrack.emoji : '🎼'}</span>
    <div class="flex-1 min-w-0">
      <div class="text-xs text-ink-light mb-0.5">${t('nowPlaying')}</div>
      <div class="font-bold text-ink truncate">${currentTrack ? getTrackDisplayName(currentTrack) : t('musicNothingPlaying')}</div>
    </div>
    <button id="mr-music-toggle" class="text-xs px-3 py-1.5 rounded-full border transition-all ${musicOn ? 'border-magic-gold bg-magic-gold/10 text-magic-gold' : 'border-wood/30 bg-white/50 text-ink-light'}">
      ${musicOn ? t('enabled') : t('disabled')}
    </button>
  `;
  nowBar.querySelector('#mr-music-toggle').addEventListener('click', () => {
    toggleMusic();
    renderMusicRoomPage();
  });
  container.appendChild(nowBar);

  // 唱片架
  const shelf = el('div', 'grid grid-cols-1 sm:grid-cols-2 gap-3');
  tracks.forEach(track => {
    const isCurrent = track.id === currentId;
    const isPlaying = isCurrent && playing;
    const card = el('button', 'w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all');

    let subText;
    let badge = '';
    if (track.unlocked) {
      card.className += isCurrent
        ? ' border-magic-gold bg-magic-gold/10 ring-1 ring-magic-gold'
        : ' border-wood/20 bg-white/50 hover:border-magic-gold/40';
      subText = isPlaying ? t('nowPlaying') : isCurrent ? t('paused') : t('clickToPlay');
      if (isPlaying) badge = `<span class="text-magic-gold text-xs font-bold flex-shrink-0">▶ ${t('playing')}</span>`;
      else if (isCurrent) badge = `<span class="text-ink-light text-xs font-bold flex-shrink-0">⏸ ${t('paused')}</span>`;
    } else if (track.purchasable) {
      card.className += ' border-magic-blue/40 bg-white/50 hover:border-magic-blue';
      const sale = getMusicSalePrice(track.purchasePrice);
      if (sale.onSale) {
        const mult = getEventEffectMults(new Date()).shopDiscount;
        const tag = t('musicSaleTag').replace('{pct}', fmtZhe(mult)).replace('{off}', fmtOff(mult));
        subText = `${t('clickToBuy')} <s class="opacity-60">💰${sale.original.toLocaleString()}</s> 💰${sale.price.toLocaleString()}`;
        badge = `<span class="text-magic-gold text-xs font-bold flex-shrink-0">🏷${tag} 💰${sale.price.toLocaleString()}</span>`;
      } else {
        subText = `${t('clickToBuy')} 💰${track.purchasePrice.toLocaleString()}`;
        badge = `<span class="text-magic-blue text-xs font-bold flex-shrink-0">💰${track.purchasePrice.toLocaleString()}</span>`;
      }
    } else {
      card.className += ' border-wood/10 bg-stone-100/50 opacity-50';
      subText = track.lockedReason === 'requiresBook' ? t('trackRequiresBook') : t('unlockAtNextStage');
      badge = '<span class="text-lg flex-shrink-0">🔒</span>';
    }

    card.innerHTML = `
      <span class="text-2xl flex-shrink-0">${track.emoji}</span>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-bold text-ink truncate">${getTrackDisplayName(track)}</div>
        <div class="text-[10px] text-ink-light">${subText}</div>
      </div>
      ${badge}
    `;

    card.addEventListener('click', () => {
      if (track.unlocked) {
        if (!isCurrent) {
          selectTrack(track.id);
          playSfx('button_click');
        }
        renderMusicRoomPage();
      } else if (track.purchasable) {
        const result = purchaseTrack(track.id);
        if (result.ok) {
          playSfx('buy_success');
          if (window.showToast) window.showToast(t('trackPurchaseSuccess'), 'success');
          selectTrack(track.id);
        } else if (result.reason === 'no_coins' && window.showToast) {
          window.showToast(`${t('insufficientCoins')} 💰`, 'error');
        }
        renderMusicRoomPage();
      }
    });

    shelf.appendChild(card);
  });
  container.appendChild(shelf);

  // 环境音陈列架
  const ambients = getAmbientDefs();
  const currentAmbientId = getCurrentAmbientId();
  const ambientOn = isAmbientEnabled();

  const ambientHeader = el('div', 'flex items-center justify-between mt-8 mb-3');
  ambientHeader.innerHTML = `
    <h3 class="font-display text-lg font-bold">🎧 ${t('ambientSounds')}
      <span class="text-xs font-normal text-ink-light ml-1">${t('musicRoomCollected').replace('{n}', ambients.filter(a => a.unlocked).length).replace('{total}', ambients.length)}</span>
    </h3>
    <button id="mr-ambient-toggle" class="text-xs px-3 py-1.5 rounded-full border transition-all ${ambientOn ? 'border-magic-gold bg-magic-gold/10 text-magic-gold' : 'border-wood/30 bg-white/50 text-ink-light'}">
      ${ambientOn ? t('enabled') : t('disabled')}
    </button>
  `;
  ambientHeader.querySelector('#mr-ambient-toggle').addEventListener('click', () => {
    setAmbientEnabled(!isAmbientEnabled());
    updateToggleIcon();
    renderMusicRoomPage();
  });
  container.appendChild(ambientHeader);

  const ambientShelf = el('div', 'grid grid-cols-1 sm:grid-cols-2 gap-3');
  ambients.forEach(a => {
    const packLocked = a.dlcPackId && !isDlcPackUnlocked(a.dlcPackId);
    const pack = packLocked ? getDlcPack(a.dlcPackId) : null;
    const isCurrent = a.id === currentAmbientId;
    const card = el('button', 'w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all');

    let subText;
    let badge = '';
    if (a.unlocked) {
      card.className += isCurrent
        ? ' border-magic-gold bg-magic-gold/10 ring-1 ring-magic-gold'
        : ' border-wood/20 bg-white/50 hover:border-magic-gold/40';
      subText = isCurrent ? t('nowPlaying') : t('clickToPlay');
      if (isCurrent) badge = `<span class="text-magic-gold text-xs font-bold flex-shrink-0">▶ ${t('playing')}</span>`;
    } else if (packLocked) {
      card.className += ' border-wood/10 bg-stone-100/50 opacity-50 cursor-not-allowed';
      subText = t('ambientLockedByPackHint').replace('{pack}', pack?.title || '');
      badge = '<span class="text-lg flex-shrink-0">🔒</span>';
    } else {
      card.className += ' border-magic-blue/40 bg-white/50 hover:border-magic-blue';
      const sale = getMusicSalePrice(a.price);
      if (sale.onSale) {
        const mult = getEventEffectMults(new Date()).shopDiscount;
        const tag = t('musicSaleTag').replace('{pct}', fmtZhe(mult)).replace('{off}', fmtOff(mult));
        subText = `${t('clickToBuy')} <s class="opacity-60">💰${sale.original.toLocaleString()}</s> 💰${sale.price.toLocaleString()}`;
        badge = `<span class="text-magic-gold text-xs font-bold flex-shrink-0">🏷${tag} 💰${sale.price.toLocaleString()}</span>`;
      } else {
        subText = `${t('clickToBuy')} 💰${a.price.toLocaleString()}`;
        badge = `<span class="text-magic-blue text-xs font-bold flex-shrink-0">💰${a.price.toLocaleString()}</span>`;
      }
    }

    card.innerHTML = `
      <span class="text-2xl flex-shrink-0">${a.emoji}</span>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-bold text-ink truncate">${a.name}</div>
        <div class="text-[10px] text-ink-light">${subText}</div>
      </div>
      ${badge}
    `;

    card.addEventListener('click', () => {
      if (a.unlocked) {
        // 再次点击当前曲 = 停止
        selectAmbient(isCurrent ? null : a.id);
        playSfx('button_click');
        renderMusicRoomPage();
      } else if (!packLocked) {
        const result = buyAmbient(a.id);
        if (result.ok) {
          playSfx('buy_success');
          if (window.showToast) window.showToast(t('trackPurchaseSuccess'), 'success');
          updateStatusBar();
          selectAmbient(a.id);
        } else if (result.reason === 'no_coins' && window.showToast) {
          window.showToast(`${t('insufficientCoins')} 💰`, 'error');
        }
        renderMusicRoomPage();
      }
    });

    ambientShelf.appendChild(card);
  });
  container.appendChild(ambientShelf);
}
