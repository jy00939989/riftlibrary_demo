// Plane Shop page rendering — pure rendering, no state ownership
import { state, saveState } from '../state.js';
import { BOOKS } from '../../data/books.js';
import { SHARED_POOL } from '../../data/book_pool.js';
import { el, h, actions, updateStatusBar, getBookTitle, showImagePreview } from './common.js';
import { playSfx } from '../audio.js';
import { ensureShopState, getShopState, purchaseBook, getBookActualPrice, getBorrowLevelPrice, upgradeBorrowLevel, getFocusLevelPrice, upgradeFocusLevel, purchaseSignboard, purchasePlanePortal, getPlanePortalPrice, getActivePeizhouRec } from '../shop.js';
import { getManuscriptSlots, getManuscriptBoxCount, isRestorationUnlocked, unlockRestorationRoom, getRestorationUnlockPrice, getRestorationLevel, getRestorationUpgradePrice, upgradeRestorationLevel } from '../capacity.js';
import { PLANES, canUnlockPlane } from '../../data/planes.js';
import { showFocusRoomUpgrade, showBorrowAreaUpgrade, showRestorationUpgrade } from './tutorial-ui.js';
import { getBorrowLevelConfig } from '../visitors.js';
import { PLANT_TYPES } from '../../data/plants.js';
import { checkAchievements } from '../achievements.js';
import { showAchievementToast } from './achievements.js';
import { checkAndShowTutorial } from '../tutorial.js';
import { dispatchTutorialUI } from './tutorial-ui.js';
import { SIGNBOARDS } from '../../data/signboards.js';
import { plantSeed, canFertilize, fertilizePlant, canWater, waterPlant, canHarvest, harvestPlant, abandonPlant } from '../plants.js';
import { showPlantMaturityToast, showPlantHarvestPopup, renderPlantArt } from './plants.js';
import { getAmbientDefs, buyAmbient } from '../ambient.js';
import { getDlcPack, isDlcPackUnlocked } from '../shop.js';
import { t, getLocale, getPageName, getBorrowLevelName, getRestorationLevelName, getFocusRoomLevelName, getVisitorName } from '../i18n/terms.js';
import { renderDlcPacksSection } from './dlc-packs.js';

let countdownInterval = null;

function formatDiscount(discount) {
  const value = getLocale() === 'en'
    ? Math.round((1 - discount) * 100)
    : Math.round(discount * 10);
  return t('discountLabel').replace('{value}', value);
}

function showLimitedSignboardPopup(signboard) {
  const modal = el('div', 'fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4');
  const content = el('div', 'parchment-bg rounded-2xl p-6 max-w-sm w-full text-center magic-glow relative overflow-hidden');
  const hasImage = signboard.image;
  const serial = state.signboardSerials?.[signboard.id];
  const serialText = serial !== undefined ? `NO.${serial} / ${signboard.maxCount || 10}` : '';

  content.innerHTML = `
    <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-magic-gold via-amber-300 to-magic-gold"></div>
    <div class="mb-4 mt-2">
      ${hasImage
        ? `<img src="${signboard.image}" alt="${signboard.name}" class="w-28 h-28 object-contain mx-auto drop-shadow-lg">`
        : `<span class="text-5xl inline-block">${signboard.emoji || '🏛️'}</span>`}
    </div>
    <h2 class="font-display text-lg font-bold text-ink mb-1">${t('limitedSignboardTitle')}</h2>
    <div class="text-base text-magic-gold font-bold mb-1">${signboard.name}</div>
    ${serialText ? `<div class="text-xs text-ink-light mb-2 font-mono tracking-wider">${serialText}</div>` : ''}
    <p class="text-xs text-ink-light leading-relaxed mb-4">${signboard.description}</p>
    <div class="bg-amber-50/50 rounded-lg p-3 mb-5 border border-amber-100">
      <p class="text-sm text-ink italic leading-relaxed">“${t('limitedSignboardThanks')}”</p>
    </div>
    <button class="close-modal px-6 py-2 bg-magic-gold text-white rounded-full font-bold text-sm hover:shadow-lg transition-all">
      ${t('continue')}
    </button>
  `;

  modal.appendChild(content);
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('close-modal')) {
      modal.remove();
    }
  });
  document.body.appendChild(modal);
}

export function renderShopPage() {
  cleanupTimer();
  ensureShopState();
  const shopState = getShopState();

  const container = document.getElementById('page-shop');
  if (!container) return;
  container.innerHTML = '';

  const wrapper = el('div', 'space-y-6');

  // ========== DLC Packs ==========
  renderDlcPacksSection(wrapper);

  // ========== Library Upgrades ==========
  wrapper.appendChild(renderLibraryUpgrades());

  // ========== New Books ==========
  wrapper.appendChild(renderBookSection(`📚 ${t('newBooksInStock')}`, shopState.fixed, false));
  wrapper.appendChild(renderBookSection(`🔥 ${t('limitedTimeOffer')}`, shopState.rotating, true));

  // ========== Ambient Sounds ==========
  wrapper.appendChild(renderAmbientShop());

  // ========== Decorations ==========
  wrapper.appendChild(renderDecorationShop());

  container.appendChild(wrapper);

  // Start countdown timer (updates text only, does not rebuild DOM)
  const hasCountdown = [...shopState.fixed, ...shopState.rotating].some(s => s.soldAt);
  if (hasCountdown) {
    countdownInterval = setInterval(updateCountdowns, 1000);
  }
}

// ========== Library Upgrades ==========

function renderLibraryUpgrades() {
  const section = el('div', 'parchment-bg rounded-2xl p-6 magic-glow');

  section.innerHTML = `<h2 class="font-display text-xl font-bold mb-4">🏛️ ${t('libraryUpgrade')}</h2>`;

  const grid = el('div', 'grid grid-cols-1 md:grid-cols-2 gap-3');

  // === Reading Area upgrade ===
  const lv = state.library.borrowLevel || 0;
  const price = getBorrowLevelPrice();
  const maxed = lv >= 7;

  const readingCard = el('div', 'bg-white rounded-xl p-4 border-2 border-magic-gold/30 flex gap-4 items-center');
  const imgNum = String(lv === 0 ? 1 : lv).padStart(2, '0');

  // Show art asset if available
  const imgSrc = lv > 0
    ? `visual/library_readingarea/library_reading_${imgNum}_${['', 'shell','tidy','open','comfy','refined','elegant','sanctum'][lv]}.jpg`
    : '';

  const borrowStats = lv === 0
    ? t('borrowAreaStatsNotBuilt')
    : (() => {
        const c = getBorrowLevelConfig();
        return t('borrowAreaStats')
          .replace('{cap}', c.cap)
          .replace('{returnCoins}', c.returnCoins)
          .replace('{favorBonus}', c.favorBonus)
          .replace('{returnAtmo}', c.returnAtmo);
      })();

  readingCard.innerHTML = `
    <div class="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-wood/10 flex items-center justify-center">
      ${imgSrc
        ? `<img src="${imgSrc}" alt="Lv${lv}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<span class=text-3xl>📚</span>'">`
        : '<span class="text-3xl">📚</span>'}
    </div>
    <div class="flex-1">
      <div class="flex items-center gap-2 mb-1">
        <span class="font-bold">📚 ${t('readingArea')}</span>
        <span class="text-xs bg-magic-gold/20 text-magic-gold px-2 py-0.5 rounded-full">Lv.${lv} · ${getBorrowLevelName(lv)}</span>
      </div>
      <p class="text-xs text-ink-light mb-2">${borrowStats}</p>
      ${maxed
        ? `<span class="text-sm text-magic-gold font-bold">${t('maxLevel')} ✨</span>`
        : `<button class="upgrade-borrow-btn px-4 py-1.5 bg-magic-gold text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all">${t('upgrade')} 💰${price.toLocaleString()}</button>`
      }
    </div>
  `;

  const upgradeBtn = readingCard.querySelector('.upgrade-borrow-btn');
  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', () => {
      if (upgradeBorrowLevel()) {
        updateStatusBar();
        playSfx('buy_success');
        renderShopPage();
        showBorrowAreaUpgrade(state.library.borrowLevel);
      } else {
        window.showToast(`${t('insufficientCoins')} 💰`, 'error');
      }
    });
  }

  grid.appendChild(readingCard);

  // === Scriptorium upgrade ===
  const flv = state.library.focusLevel || 0;
  const fprice = getFocusLevelPrice();
  const fmaxed = flv >= 6;

  const focusCard = el('div', 'bg-white rounded-xl p-4 border-2 border-magic-gold/30 flex gap-4 items-center');

  // Scriptorium art filename mapping (lv0~lv6, one each)
  const fimgNames = [
    'focusroom_lv0_final_0.jpg',
    'focusroom_lv1_no_text_0.jpg',
    'focusroom_lv2_final_0.jpg',
    'focusroom_lv3_final_1.jpg',
    'focusroom_lv4_final_0.jpg',
    'focusroom_lv5_final_1.jpg',
    'focusroom_lv6_sanctuary_16x9_1.jpg'
  ];
  const fimgActualSrc = flv >= 0 ? `visual/focusroom/${fimgNames[flv]}` : '';

  const focusStats = flv === 0
    ? t('focusRoomStatsNotBuilt')
    : t('focusRoomStats').replace('{value}', flv * 5);

  focusCard.innerHTML = `
    <div class="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-wood/10 flex items-center justify-center">
      ${fimgActualSrc
        ? `<img src="${fimgActualSrc}" alt="${t('tabScriptorium')} Lv${flv}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<span class=text-3xl>🖋️</span>'">`
        : '<span class="text-3xl">🖋️</span>'}
    </div>
    <div class="flex-1">
      <div class="flex items-center gap-2 mb-1">
        <span class="font-bold">🖋️ ${t('tabScriptorium')}</span>
        <span class="text-xs bg-magic-gold/20 text-magic-gold px-2 py-0.5 rounded-full">Lv.${flv} · ${getFocusRoomLevelName(flv)}</span>
      </div>
      <p class="text-xs text-ink-light mb-2">${focusStats}</p>
      ${fmaxed
        ? `<span class="text-sm text-magic-gold font-bold">${t('maxLevel')} ✨</span>`
        : `<button class="upgrade-focus-btn px-4 py-1.5 bg-magic-gold text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all">${t('upgrade')} 💰${fprice.toLocaleString()}</button>`
      }
    </div>
  `;

  const fUpgradeBtn = focusCard.querySelector('.upgrade-focus-btn');
  if (fUpgradeBtn) {
    fUpgradeBtn.addEventListener('click', () => {
      if (upgradeFocusLevel()) {
        updateStatusBar();
        playSfx('buy_success');
        renderShopPage();
        showFocusRoomUpgrade(state.library.focusLevel);
      } else {
        window.showToast(`${t('insufficientCoins')} 💰`, 'error');
      }
    });
  }

  grid.appendChild(focusCard);

  // === Plane Portal ===
  const pastoral = PLANES.pastoral;
  if (pastoral && pastoral.unlock) {
    const portalKey = pastoral.unlock.shopUpgrade;
    const portalPurchased = state.library.planePortals && state.library.planePortals[portalKey];
    const canPurchase = canUnlockPlane('pastoral', state) && !portalPurchased;
    const meetsReqs = (state.library.atmosphere || 0) >= pastoral.unlock.atmo
      && Object.values(state.books || {}).filter(b => b && b.status !== 'locked').length >= pastoral.unlock.books;

    if (!portalPurchased || canPurchase) {
      const portalCard = el('div', `bg-white rounded-xl p-4 border-2 flex gap-4 items-center ${
        canPurchase ? 'border-magic-gold/50 hover:shadow-lg transition-all cursor-pointer' : 'border-dashed border-gray-300 opacity-70'
      }`);
      const price = getPlanePortalPrice('pastoral');

      const portalStatus = portalPurchased
        ? `<span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">${t('unlocked')}</span>`
        : meetsReqs
          ? `<span class="text-xs bg-magic-gold/20 text-magic-gold px-2 py-0.5 rounded-full">${t('availableToBuild')}</span>`
          : `<span class="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">${t('conditionsNotMet')}</span>`;

      portalCard.innerHTML = `
        <span class="text-3xl">${pastoral.emoji}</span>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-bold">${pastoral.name}</span>
            ${portalStatus}
          </div>
          <p class="text-xs text-ink-light mb-2">${pastoral.desc}</p>
          ${!meetsReqs
            ? `<p class="text-xs text-ink-light/60">${t('requirements')
                .replace('{atmo}', pastoral.unlock.atmo)
                .replace('{books}', pastoral.unlock.books)}</p>`
            : canPurchase
              ? `<button class="portal-purchase-btn px-4 py-1.5 bg-magic-gold text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all">${t('openPortal')} 💰${price.toLocaleString()}</button>`
              : ''
          }
        </div>
      `;

      const purchaseBtn = portalCard.querySelector('.portal-purchase-btn');
      if (purchaseBtn) {
        purchaseBtn.addEventListener('click', () => {
          if (purchasePlanePortal('pastoral')) {
            playSfx('buy_success');
            updateStatusBar();
            renderShopPage();
          } else {
            window.showToast(`${t('insufficientCoins')} 💰`, 'error');
          }
        });
      }

      grid.appendChild(portalCard);
    }
  }

  // === Blank Name Plaque (available when atmosphere ≥ 80) ===
  const atmo = state.library.atmosphere || 0;
  const showPlaque = atmo >= 80 && !state.library.nameLocked;

  if (showPlaque) {
    const plaqueCard = el('div', 'bg-white rounded-xl p-4 border-2 border-magic-gold/50 flex gap-4 items-center cursor-pointer hover:shadow-lg transition-all');
    plaqueCard.innerHTML = `
      <span class="text-3xl">🏷️</span>
      <div class="flex-1">
        <span class="font-bold text-sm">${t('blankNamePlaque')}</span>
        <p class="text-xs text-ink-light mt-1">${t('nameTheLibrary')}</p>
      </div>
      <span class="text-magic-gold text-sm font-bold">${t('free')}</span>
    `;
    plaqueCard.addEventListener('click', showNamingModal);
    grid.appendChild(plaqueCard);
  }

  // === Restoration Room ===
  const restorationUnlocked = isRestorationUnlocked();
  const restorationLevel = getRestorationLevel();
  const restorationMaxed = restorationLevel >= 5;
  const restorationUpgradePrice = getRestorationUpgradePrice();
  const restorationUnlockPrice = getRestorationUnlockPrice();
  const restorationImgNames = [
    'restoration_lv0_ruins.jpg',
    'restoration_lv1_shelter.jpg',
    'restoration_lv2_tidy.jpg',
    'restoration_lv3_bright.jpg',
    'restoration_lv4_elegant.jpg',
    'restoration_lv5_sanctum.jpg'
  ];
  const restorationImgSrc = `visual/restoration/${restorationImgNames[restorationLevel]}`;

  let restorationStats;
  if (!restorationUnlocked) {
    restorationStats = t('restorationRoomStatsNotBuilt');
  } else if (restorationLevel === 0) {
    restorationStats = t('restorationRoomStatsUnlockedLevel0');
  } else {
    restorationStats = t('restorationRoomStats').replace('{value}', restorationLevel * 5);
  }

  const restorationCard = el('div', 'bg-white rounded-xl p-4 border-2 border-magic-gold/30 flex gap-4 items-center');
  restorationCard.innerHTML = `
    <div class="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-wood/10 flex items-center justify-center">
      ${restorationUnlocked
        ? `<img src="${restorationImgSrc}" alt="${t('restorationRoom')} Lv${restorationLevel}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<span class=text-3xl>📜</span>'">`
        : '<span class="text-3xl">🔒</span>'}
    </div>
    <div class="flex-1">
      <div class="flex items-center gap-2 mb-1">
        <span class="font-bold">📜 ${t('restorationRoom')}</span>
        ${restorationUnlocked
          ? `<span class="text-xs bg-magic-gold/20 text-magic-gold px-2 py-0.5 rounded-full">Lv.${restorationLevel} · ${getRestorationLevelName(restorationLevel)}</span>`
          : `<span class="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">${t('locked')}</span>`}
      </div>
      <p class="text-xs text-ink-light mb-2">${restorationStats}</p>
      ${!restorationUnlocked
        ? `<button class="buy-restoration-btn px-4 py-1.5 bg-magic-gold text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all">${t('unlock')} 💰${restorationUnlockPrice.toLocaleString()}</button>`
        : restorationMaxed
          ? `<span class="text-sm text-magic-gold font-bold">${t('maxLevel')} ✨</span>`
          : `<button class="upgrade-restoration-btn px-4 py-1.5 bg-magic-gold text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all">${t('upgrade')} 💰${restorationUpgradePrice.toLocaleString()}</button>`
      }
    </div>
  `;

  const buyRestorationBtn = restorationCard.querySelector('.buy-restoration-btn');
  if (buyRestorationBtn) {
    buyRestorationBtn.addEventListener('click', () => {
      if (unlockRestorationRoom()) {
        playSfx('buy_success');
        updateStatusBar();
        const trigger = checkAndShowTutorial('restoration_unlock');
        if (trigger) dispatchTutorialUI(trigger);
        renderShopPage();
        showRestorationUpgrade(0);
      } else {
        window.showToast(`${t('insufficientCoins')} 💰`, 'error');
      }
    });
  }

  const upgradeRestorationBtn = restorationCard.querySelector('.upgrade-restoration-btn');
  if (upgradeRestorationBtn) {
    upgradeRestorationBtn.addEventListener('click', () => {
      if (upgradeRestorationLevel()) {
        playSfx('buy_success');
        updateStatusBar();
        renderShopPage();
        showRestorationUpgrade(state.restorationLevel);
      } else {
        window.showToast(`${t('insufficientCoins')} 💰`, 'error');
      }
    });
  }
  grid.appendChild(restorationCard);

  // === Other placeholders ===
  const placeholders = [
    { icon: '☕', nameKey: 'coffeeCorner', descKey: 'coffeeCornerDesc' },
    { icon: '🔬', nameKey: 'researchArea', descKey: 'researchAreaDesc' },
    { icon: '🚪', nameKey: 'planeVisiting', descKey: 'planeVisitingDesc' },
    { icon: '📨', nameKey: 'bookDrift', descKey: 'bookDriftDesc' },
    { icon: '🌟', nameKey: 'jointRestoration', descKey: 'jointRestorationDesc' }
  ];

  placeholders.forEach(p => {
    const card = el('div', 'bg-gray-100 rounded-xl p-4 border-2 border-dashed border-gray-300 flex items-center gap-3 opacity-70');
    card.innerHTML = `
      <span class="text-2xl">${p.icon}</span>
      <div class="flex-1">
        <span class="font-bold text-sm">${t(p.nameKey)}</span>
        <span class="text-xs text-ink-light ml-2">${t(p.descKey)}</span>
      </div>
      <span class="text-xs text-ink-light bg-gray-200 px-2 py-0.5 rounded">🏗️ ${t('inPlanning')}</span>
    `;
    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}

// ========== New Books ==========

function renderBookSection(title, slots, isRotating) {
  const section = el('div', 'parchment-bg rounded-2xl p-6 magic-glow');
  section.innerHTML = `<h2 class="font-display text-xl font-bold mb-4">${title}</h2>`;

  const grid = el('div', 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3');

  slots.forEach(slot => {
    if (!slot || !slot.bookId) {
      // Empty slot
      const empty = el('div', 'bg-wood/5 rounded-xl p-4 border-2 border-dashed border-wood/20 flex items-center justify-center min-h-[180px]');
      empty.innerHTML = `<span class="text-wood/30 text-sm text-center">${t('newBooksRestocking')}</span>`;
      grid.appendChild(empty);
      return;
    }

    const poolEntry = SHARED_POOL.find(b => b.bookId === slot.bookId);
    if (!poolEntry) return;

    const owned = state.books[slot.bookId] && state.books[slot.bookId].status !== 'locked';
    const mBoxFull = getManuscriptBoxCount() >= getManuscriptSlots();

    grid.appendChild(renderBookCard(slot, poolEntry, owned, isRotating, mBoxFull));
  });

  section.appendChild(grid);
  return section;
}

function renderShopBookCover(poolEntry, sizeClass = 'w-16 h-24') {
  const bookDef = BOOKS[poolEntry.bookId];
  const cover = bookDef?.cover;
  const title = getBookTitle(poolEntry);
  if (cover) {
    return `
      <img src="${cover}" alt="${title}" class="${sizeClass} object-cover mx-auto rounded shadow-sm mb-2" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div class="hidden flex-col items-center justify-center ${sizeClass} mx-auto mb-2"><span class="text-3xl">${poolEntry.emoji}</span></div>
    `;
  }
  return `<div class="text-3xl mb-2">${poolEntry.emoji}</div>`;
}

function renderBookCard(slot, poolEntry, owned, isRotating, mBoxFull) {
  const disabled = owned || (mBoxFull && !owned);
  let disabledReason = '';
  if (owned) disabledReason = `✅ ${t('owned')}`;
  else if (mBoxFull) disabledReason = `📦 ${t('manuscriptBoxFull')}`;

  const displayTitle = getBookTitle(poolEntry);
  const volumeBadge = poolEntry.type === 'volume'
    ? `<div class="absolute top-2 right-2 text-[10px] bg-magic-blue/10 text-magic-blue px-1.5 py-0.5 rounded font-bold">${poolEntry.subtitle || ''}</div>`
    : '';

  const card = el('div', `book-card rounded-xl p-4 border-2 transition-all relative ${
    disabled ? 'bg-gray-100 border-gray-200 opacity-50' : 'bg-white border-wood/20 hover:border-magic-gold/50 hover:shadow-lg cursor-pointer'
  }`);

  if (disabled) {
    card.innerHTML = `
      ${volumeBadge}
      <div class="text-center">
        ${renderShopBookCover(poolEntry)}
        <div class="font-bold text-sm mb-1">${displayTitle}</div>
        <div class="text-xs text-ink-light mb-2">${poolEntry.author} · ${poolEntry.category}</div>
        <div class="text-xs text-magic-gold font-bold">${disabledReason}</div>
      </div>
    `;
    return card;
  }

  const discountText = isRotating ? formatDiscount(slot.discount) : '';
  const priceDisplay = isRotating
    ? `<div class="text-sm"><span class="text-gray-400 line-through text-xs">💰${slot.originalPrice}</span> <span class="text-magic-gold font-bold">💰${slot.price}</span></div>
       <div class="text-xs text-red-500 font-bold">${discountText}</div>`
    : `<div class="text-sm text-magic-gold font-bold">💰${slot.price}</div>`;

  const soldText = slot.soldAt ? formatCountdown(slot.soldAt) : '';

  if (soldText) {
    card.innerHTML = `
      ${volumeBadge}
      <div class="text-center">
        ${renderShopBookCover(poolEntry)}
        <div class="font-bold text-sm mb-1">${displayTitle}</div>
        <div class="text-xs text-ink-light mb-2">${poolEntry.author}</div>
        <div class="text-xs text-magic-blue shop-countdown" data-soldat="${slot.soldAt}">⏰ ${soldText}</div>
      </div>
    `;
    return card;
  }

  const peizhouRec = getActivePeizhouRec();
  const isPeizhouPick = peizhouRec && peizhouRec.bookId === slot.bookId;
  const { actualPrice } = getBookActualPrice(slot.bookId, slot.price);
  const peizhouName = getVisitorName('peizhou');
  const peizhouBadge = isPeizhouPick
    ? `<div class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full inline-block mb-1 font-bold">${t('recommendedBy').replace('{name}', peizhouName).replace('{value}', formatDiscount(0.7).replace(/[^0-9]/g, ''))}</div>`
    : '';
  const peizhouPriceLine = isPeizhouPick
    ? `<div class="text-xs text-amber-600 mt-1">${t('recommendedPrice')
        .replace('{original}', slot.price.toLocaleString())
        .replace('{name}', peizhouName)
        .replace('{price}', actualPrice.toLocaleString())}</div>`
    : '';

  card.innerHTML = `
    ${volumeBadge}
    <div class="text-center">
      ${poolEntry.starter ? `<div class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full inline-block mb-1 font-bold">${t('starterRecommended')}</div>` : ''}
      ${peizhouBadge}
      ${renderShopBookCover(poolEntry)}
      <div class="font-bold text-sm mb-1">${displayTitle}</div>
      <div class="text-xs text-ink-light mb-1">${poolEntry.author}</div>
      <div class="text-xs text-ink-light mb-2">${poolEntry.category} · ${poolEntry.totalWords.toLocaleString()}${t('wordsUnit')}</div>
      ${priceDisplay}
      ${peizhouPriceLine}
    </div>
  `;

  if (!disabled) {
    card.addEventListener('click', () => {
      showPurchaseModal(poolEntry, actualPrice, isRotating ? slot.originalPrice : null, isRotating ? slot.discount : null);
    });
  }

  return card;
}

// ========== Purchase Modal ==========

function showPurchaseModal(poolEntry, price, originalPrice, discount) {
  const overlay = el('div', 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4');

  const desc = poolEntry.description || '';
  const shortDesc = desc.length > 60 ? desc.slice(0, 60) + '…' : desc;

  const discountText = discount ? formatDiscount(discount) : '';
  const priceLine = discount
    ? `<span class="text-gray-400 line-through mr-2">💰${originalPrice}</span><span class="text-magic-gold font-bold text-lg">💰${price}</span> <span class="text-xs text-red-500">${discountText}</span>`
    : `<span class="text-magic-gold font-bold text-lg">💰${price}</span>`;

  const displayTitle = getBookTitle(poolEntry);
  const volumeSubtitle = poolEntry.type === 'volume'
    ? `<p class="text-xs text-magic-blue font-bold mb-1">${poolEntry.subtitle || ''}</p>`
    : '';
  const bookDef = BOOKS[poolEntry.bookId];
  const chapterCount = bookDef?.chapters?.length || poolEntry.chapterCount || 0;

  const content = el('div', 'parchment-bg rounded-2xl p-6 max-w-sm w-full magic-glow animate-scale-in');
  content.innerHTML = `
    <div class="text-center mb-4">
      ${renderShopBookCover(poolEntry, 'w-20 h-30')}
      ${volumeSubtitle}
      <h3 class="font-display text-xl font-bold mb-1">${displayTitle}</h3>
      <p class="text-sm text-ink-light">${poolEntry.author} · ${poolEntry.category}</p>
      <p class="text-xs text-ink-light mt-1">${poolEntry.totalWords.toLocaleString()}${t('wordsUnit')} · ${t('chapterCount').replace('{n}', chapterCount)}</p>
    </div>
    <div class="bg-white/60 rounded-lg p-3 mb-4">
      <p class="text-sm text-ink-light">${shortDesc}</p>
    </div>
    <div class="text-center mb-4">${priceLine}</div>
    <div class="flex justify-center gap-3">
      <button class="cancel-btn px-6 py-2.5 bg-wood/20 text-ink-light rounded-lg font-bold hover:bg-wood/30 transition-all">${t('cancel')}</button>
      <button class="confirm-btn px-6 py-2.5 bg-magic-gold text-white rounded-lg font-bold hover:shadow-lg transition-all ${state.coins < price ? 'opacity-50 cursor-not-allowed' : ''}">${t('confirmPurchase')}</button>
    </div>
    ${state.coins < price ? `<p class="text-xs text-red-500 text-center mt-2">${t('insufficientCoins')} 💰</p>` : ''}
  `;

  overlay.appendChild(content);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();

  content.querySelector('.cancel-btn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const confirmBtn = content.querySelector('.confirm-btn');
  confirmBtn.addEventListener('click', () => {
    const result = purchaseBook(poolEntry.bookId, price);
    if (result.ok) {
      updateStatusBar();
      playSfx('buy_success');
      overlay.remove();
      renderShopPage();
      const bookAch = checkAchievements('purchase_book');
      bookAch.forEach(a => showAchievementToast(a));
    } else {
      switch (result.reason) {
        case 'insufficient_coins':
          window.showToast(`${t('insufficientCoinsExclamation')} ${t('purchaseNeedsCoins').replace('{actual}', result.actualPrice).replace('{price}', price)}`, 'error');
          break;
        case 'already_owned':
          window.showToast(t('youAlreadyOwnThisBook'), 'error');
          break;
        case 'manuscript_box_full': {
          const mSlots = getManuscriptSlots();
          const mCount = getManuscriptBoxCount();
          window.showToast(`${t('manuscriptBoxFull')}（${mCount}/${mSlots}${t('slots')}）！${t('expandManuscriptBoxFirst')}`, 'error');
          break;
        }
        default:
          window.showToast(t('purchaseFailed'), 'error');
      }
    }
  });
}

// ========== Naming Modal ==========

function showNamingModal() {
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

    if (finalName.length > 12) {
      hint.textContent = t('nameTooLong');
      hint.className = 'text-xs text-center mt-2 text-red-500';
      return;
    }

    state.library.name = finalName;
    state.library.nameLocked = true;
    saveState();
    // Refresh top navigation name
    const nameEl = document.getElementById('nav-library-name');
    if (nameEl) nameEl.textContent = finalName;
    overlay.remove();
    renderShopPage();
    // Refresh curator office if visible
    if (typeof window.renderLibraryPage === 'function') {
      window.renderLibraryPage();
    }
  }

  content.querySelector('.confirm-name-btn').addEventListener('click', confirmName);

  // Auto-focus input
  setTimeout(() => input.focus(), 100);
}

// ========== Utilities ==========

function formatCountdown(soldAt) {
  const now = Date.now();
  const remaining = 24 * 3600 * 1000 - (now - soldAt);
  if (remaining <= 0) return '';
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return t('countdownRestocking').replace('{time}', `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
}

// ========== Ambient Sounds Shop ==========

function renderAmbientShop() {
  const section = el('div', 'parchment-bg rounded-2xl p-6 magic-glow');
  section.innerHTML = `<h2 class="font-display text-xl font-bold mb-4">🎧 ${t('ambientSounds')}</h2>
    <p class="text-xs text-ink-light mb-4">${t('ambientDescription')}</p>`;

  const grid = el('div', 'grid grid-cols-1 md:grid-cols-2 gap-3');
  const ambients = getAmbientDefs();

  ambients.forEach(a => {
    const packLocked = a.dlcPackId && !isDlcPackUnlocked(a.dlcPackId);
    const pack = packLocked ? getDlcPack(a.dlcPackId) : null;
    const card = el('div', `bg-white rounded-xl p-4 border-2 ${a.unlocked ? 'border-wood/20' : 'border-wood/10 opacity-80'} flex items-center gap-3`);
    card.innerHTML = `
      <span class="text-3xl flex-shrink-0">${a.emoji}</span>
      <div class="flex-1 min-w-0">
        <div class="font-bold text-sm text-ink">${a.name}</div>
        <div class="text-xs text-ink-light truncate">${a.unlocked ? t('ambientOwnedHint') : (packLocked ? t('ambientLockedByPackHint').replace('{pack}', pack?.title || '') : t('ambientLockedHint'))}</div>
      </div>
      ${a.unlocked
        ? `<span class="text-xs text-magic-gold font-bold">${t('ambientOwnedLabel')}</span>`
        : packLocked
          ? `<span class="text-xs text-ink-light/60 font-bold">🔒 ${t('locked')}</span>`
          : `<button class="buy-ambient-btn px-3 py-1.5 bg-magic-gold text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all" data-id="${a.id}">
              💰${a.price.toLocaleString()}
             </button>`}
    `;

    const buyBtn = card.querySelector('.buy-ambient-btn');
    if (buyBtn) {
      buyBtn.addEventListener('click', () => {
        const result = buyAmbient(buyBtn.dataset.id);
        if (result.ok) {
          playSfx('buy_success');
          updateStatusBar();
          renderShopPage();
        } else if (result.reason === 'no_coins') {
          window.showToast(`${t('insufficientCoins')} 💰`, 'error');
        } else if (result.reason === 'dlc_locked') {
          window.showToast(t('ambientLockedByPackHint').replace('{pack}', pack?.title || ''), 'error');
        }
      });
    }

    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}

// ========== Decorations ==========

function renderDecorationShop() {
  const section = el('div', 'parchment-bg rounded-2xl p-6 magic-glow');
  section.innerHTML = `<h2 class="font-display text-xl font-bold mb-4">🏺 ${t('decoration')}</h2>`;

  const grid = el('div', 'grid grid-cols-1 md:grid-cols-2 gap-3');
  const plant = state.plant;

  // === Plant Pot ===
  if (!plant.activeType || plant.level === 0) {
    // Empty pot — show purchasable plant types
    Object.values(PLANT_TYPES).forEach(pt => {
      const card = el('div', 'bg-white rounded-xl p-4 border-2 border-green-200 flex gap-4 items-center hover:shadow-lg transition-all cursor-pointer');
      const cost = pt.fertilizeCosts[1];
      const canAfford = state.coins >= cost;

      const artWrap = document.createElement('div');
      artWrap.className = 'flex-shrink-0';
      artWrap.appendChild(renderPlantArt(pt, 1, 64));

      const info = el('div', 'flex-1');
      info.innerHTML = `
        <div class="font-bold">${t(pt.nameKey)}</div>
        <p class="text-xs text-ink-light mt-1">${t(pt.descKey)}</p>
        <div class="flex items-center gap-2 mt-2">
          <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">${t('plantGrowLevels')}</span>
          <span class="text-xs text-ink-light">${t('waterAndFertilize')}</span>
        </div>
      `;

      const btnWrap = document.createElement('div');
      btnWrap.className = 'flex-shrink-0';
      const btn = document.createElement('button');
      btn.className = `plant-buy-btn px-4 py-1.5 ${canAfford ? 'bg-green-600 text-white hover:shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'} rounded-lg text-sm font-bold transition-all`;
      btn.disabled = !canAfford;
      btn.innerHTML = `💰${cost.toLocaleString()}`;
      btnWrap.appendChild(btn);

      card.appendChild(artWrap);
      card.appendChild(info);
      card.appendChild(btnWrap);

      if (canAfford) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (plantSeed(pt.id)) {
            playSfx('buy_success');
            updateStatusAndRefresh();
            if (typeof window.renderLibraryPage === 'function') window.renderLibraryPage();
          } else {
            window.showToast(t('purchaseFailed'), 'error');
          }
        });
      }
      grid.appendChild(card);
    });
  } else {
    // Planted — show current plant status
    const def = PLANT_TYPES[plant.activeType];
    if (def) {
      const plantCard = renderActivePlantCard(def, plant);
      grid.appendChild(plantCard);
    }
  }

  // === Signboards ===
  Object.values(SIGNBOARDS).forEach(sb => {
    const owned = state.signboards.includes(sb.id);
    const serial = state.signboardSerials?.[sb.id];
    const isLimited = sb.price === 0 && sb.image;
    const serialBadge = owned && serial !== undefined
      ? `<span class="text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded" title="限量编号">NO.${serial}</span>`
      : '';
    const ownedBadge = owned
      ? `<span class="text-xs bg-green-200 text-green-700 px-1.5 py-0.5 rounded">✅ ${t('owned')}</span>${serialBadge}`
      : '';
    const actionBadge = !owned
      ? (isLimited
        ? `<span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold">${t('limitedSignboardLabel') || '兑换码获取'}</span>`
        : `<button class="signboard-buy-btn px-3 py-1.5 ${state.coins >= sb.price ? 'bg-magic-gold text-white hover:shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'} rounded-lg text-sm font-bold transition-all"
            ${state.coins < sb.price ? 'disabled' : ''}>
            💰${sb.price}
           </button>`)
      : '';
    const card = el('div', `rounded-xl p-4 border-2 flex gap-3 items-center ${owned ? 'bg-green-50 border-green-200 opacity-80' : 'bg-white border-wood/20 hover:border-magic-gold/50 hover:shadow-lg transition-all'}`);
    card.innerHTML = `
      ${renderSignboardIcon(sb)}
      <div class="flex-1">
        <div class="font-bold text-sm flex items-center gap-2">
          ${sb.name}
          ${ownedBadge}
        </div>
        <p class="text-xs text-ink-light">${sb.description}</p>
        <p class="text-xs text-ink-light mt-0.5">${t('hungOnPage').replace('{page}', getPageName(sb.page))}</p>
      </div>
      ${actionBadge}
    `;

    const iconImg = card.querySelector('img');
    if (iconImg && sb.image) {
      iconImg.classList.add('cursor-pointer');
      iconImg.title = '点击看大图';
      iconImg.addEventListener('click', () => showImagePreview(sb.image, sb.name));
    }

    const buyBtn = card.querySelector('.signboard-buy-btn');
    if (buyBtn && !owned && !isLimited && state.coins >= sb.price) {
      buyBtn.addEventListener('click', () => {
        if (purchaseSignboard(sb.id)) {
          playSfx('buy_success');
          updateStatusAndRefresh();
          if (typeof window.renderLibraryPage === 'function') window.renderLibraryPage();
        } else {
          window.showToast(`${t('insufficientCoins')} 💰`, 'error');
        }
      });
    }
    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}

function renderActivePlantCard(def, plant) {
  const card = el('div', 'bg-white rounded-xl p-4 border-2 border-green-300 flex gap-4 items-start');
  const progressPercent = Math.min(100, Math.round((plant.growthProgress / def.growthPerLevel) * 100));
  const levelName = def.levelNames[plant.level] || '';
  const canHarvestNow = canHarvest();
  const canWaterNow = canWater();
  const canFertNow = canFertilize();

  const nextFertCost = def.fertilizeCosts[plant.level + 1] || def.fertilizeCosts[5] || 0;
  const footerText = plant.level < 5
    ? t('nextLevelFertilizerCost').replace('{cost}', nextFertCost)
    : t('maxLevelHarvestHint');

  const artWrap = document.createElement('div');
  artWrap.className = 'flex-shrink-0';
  artWrap.appendChild(renderPlantArt(def, plant.level, 80));

  const info = el('div', 'flex-1 min-w-0');
  info.innerHTML = `
    <div class="flex items-center gap-2 mb-1">
      <span class="font-bold">${t(def.nameKey)}</span>
      <span class="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">Lv.${plant.level} · ${levelName}</span>
    </div>
    <div class="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
      <div class="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all" style="width:${progressPercent}%"></div>
    </div>
    <div class="text-xs text-ink-light mb-2">
      ${t('growthProgress').replace('{value}', progressPercent)} · ${t('waterAvailableCount').replace('{n}', plant.waterAvailable)}
    </div>
    <div class="flex gap-2 flex-wrap" id="shop-plant-actions">
      ${canHarvestNow
        ? `<button class="harvest-btn px-4 py-1.5 bg-yellow-500 text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all">${t('harvest')}</button>`
        : `
          <button class="water-btn px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all ${!canWaterNow ? 'opacity-50 cursor-not-allowed' : ''}"
            ${!canWaterNow ? 'disabled' : ''}>${t('water')} ${t('waterGrowth').replace('{value}', def.waterGrowth)}</button>
          <button class="fertilize-btn px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all ${!canFertNow ? 'opacity-50 cursor-not-allowed' : ''}"
            ${!canFertNow ? 'disabled' : ''}>
            ${t('fertilize')} ${t('fertilizeCost').replace('{value}', def.fertilizeGrowth).replace('{cost}', def.fertilizeCosts[plant.level + 1] || 0)}
          </button>
        `}
    </div>
    ${canHarvestNow ? `<p class="text-xs text-yellow-600 mt-2">${t('canHarvestHint')}</p>` : ''}
    <p class="text-xs text-ink-light mt-1">${footerText}</p>
  `;

  card.appendChild(artWrap);
  card.appendChild(info);

  const actions = info.querySelector('#shop-plant-actions');

  // 铲除按钮
  const abandonBtn = document.createElement('button');
  abandonBtn.className = 'px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:shadow-lg transition-all';
  abandonBtn.innerHTML = `🗑️ ${t('plantAbandon')}`;
  abandonBtn.addEventListener('click', () => {
    if (confirm(t('plantAbandonConfirm').replace('{name}', t(def.nameKey)))) {
      abandonPlant();
      updateStatusAndRefresh();
      if (typeof window.renderLibraryPage === 'function') window.renderLibraryPage();
    }
  });
  actions.appendChild(abandonBtn);

  // Water button
  const waterBtn = card.querySelector('.water-btn');
  if (waterBtn && canWaterNow) {
    waterBtn.addEventListener('click', () => {
      const result = waterPlant();
      if (result.ok && result.justMatured) {
        showPlantMaturityToast(def);
      }
      renderShopPage();
    });
  }

  // Fertilize button
  const fertBtn = card.querySelector('.fertilize-btn');
  if (fertBtn && canFertNow) {
    fertBtn.addEventListener('click', () => {
      const result = fertilizePlant();
      if (result.ok && result.justMatured) {
        showPlantMaturityToast(def);
      }
      renderShopPage();
    });
  }

  // Harvest button
  const harvestBtn = card.querySelector('.harvest-btn');
  if (harvestBtn) {
    harvestBtn.addEventListener('click', () => {
      const result = harvestPlant();
      if (result) {
        showPlantHarvestPopup(def, result);
        updateStatusAndRefresh();
        if (typeof window.renderLibraryPage === 'function') window.renderLibraryPage();
      }
    });
  }

  return card;
}

function updateStatusAndRefresh() {
  updateStatusBar();
  renderShopPage();
}

// Update countdown text only; avoid rebuilding the whole shop DOM every second
function updateCountdowns() {
  const els = document.querySelectorAll('.shop-countdown');
  if (els.length === 0) {
    cleanupTimer();
    return;
  }
  let anyExpired = false;
  els.forEach(el => {
    const soldAt = parseInt(el.dataset.soldat, 10);
    if (!soldAt) return;
    const remaining = 24 * 3600 * 1000 - (Date.now() - soldAt);
    if (remaining <= 0) {
      anyExpired = true;
    } else {
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      el.textContent = `⏰ ${t('countdownRestocking').replace('{time}', `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)}`;
    }
  });
  // Trigger a full refresh when a countdown hits zero (restock logic lives in ensureShopState)
  if (anyExpired) {
    cleanupTimer();
    renderShopPage();
  }
}

function cleanupTimer() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

window.renderShopPage = renderShopPage;

/** 渲染标志牌图标：优先使用图片，否则回退 emoji */
function renderSignboardIcon(sb) {
  if (sb.image) {
    return `<img src="${sb.image}" alt="${sb.name}" class="w-10 h-10 object-contain flex-shrink-0" />`;
  }
  return `<span class="text-3xl">${sb.emoji}</span>`;
}
