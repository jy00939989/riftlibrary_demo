// Library upgrades section — reading area, scriptorium, plane portal, name plaque, restoration room
import { state } from '../../state.js';
import { el, actions, updateStatusBar } from '../common.js';
import { playSfx } from '../../audio.js';
import {
  getBorrowLevelPrice, upgradeBorrowLevel,
  getFocusLevelPrice, upgradeFocusLevel,
  getPlanePortalPrice, purchasePlanePortal
} from '../../shop.js';
import {
  isRestorationUnlocked, unlockRestorationRoom,
  getRestorationUnlockPrice, getRestorationLevel,
  getRestorationUpgradePrice, upgradeRestorationLevel
} from '../../capacity.js';
import { PLANES, canUnlockPlane } from '../../../data/planes.js';
import { showFocusRoomUpgrade, showBorrowAreaUpgrade, showRestorationUpgrade, dispatchTutorialUI } from '../tutorial-ui.js';
import { checkAndShowTutorial } from '../../tutorial.js';
import { getBorrowLevelConfig } from '../../visitors.js';
import {
  t, getBorrowLevelName, getRestorationLevelName, getFocusRoomLevelName
} from '../../i18n/terms.js';
import { showNamingModal } from './naming-modal.js';

export function renderLibraryUpgrades() {
  const section = el('div', 'parchment-bg rounded-2xl p-6 magic-glow');

  section.innerHTML = `<h2 class="font-display text-xl font-bold mb-4">🏛️ ${t('libraryUpgrade')}</h2>`;

  const grid = el('div', 'grid grid-cols-1 md:grid-cols-2 gap-3');

  // === Reading Area upgrade ===
  const lv = state.library.borrowLevel || 0;
  const price = getBorrowLevelPrice();
  const maxed = lv >= 7;

  const readingCard = el('div', 'bg-white rounded-xl p-4 border-2 border-magic-gold/30 flex gap-4 items-center');
  const imgNum = String(lv === 0 ? 1 : lv).padStart(2, '0');

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
        if (actions.renderShopPage) {
          actions.renderShopPage();
        }
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
        if (actions.renderShopPage) {
          actions.renderShopPage();
        }
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
            if (actions.renderShopPage) {
              actions.renderShopPage();
            }
          } else {
            window.showToast(`${t('insufficientCoins')} 💰`, 'error');
          }
        });
      }

      grid.appendChild(portalCard);
    }
  }

  // === Blank Name Plaque ===
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
        if (actions.renderShopPage) {
          actions.renderShopPage();
        }
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
        if (actions.renderShopPage) {
          actions.renderShopPage();
        }
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
