// 引导 UI 渲染 —— 情境引导卡片 + 氛围升级弹窗
import { state } from '../state.js';
import { el } from './common.js';
import { markTutorialSeen } from '../tutorial.js';
import { t, getAtmosphereStageName, getFocusRoomLevelName, getBorrowLevelName, getRestorationLevelName } from '../i18n/terms.js';

// 氛围阶段背景图
const STAGE_BG = {
  2: 'visual/background/library_bg_02_ruined.jpg',
  3: 'visual/background/library_bg_03_cozy.jpg',
  4: 'visual/background/library_bg_04_gorgeous.jpg',
  5: 'visual/background/library_bg_05_magnificent.jpg'
};

function formatTerm(key, map = {}) {
  return t(key).replace(/\{(\w+)\}/g, (_, k) => (map[k] !== undefined ? map[k] : `{${k}}`));
}

function makeOverlay(innerHTML, opts = {}) {
  const overlay = el('div', 'fixed inset-0 z-[100] flex items-center justify-center p-4');
  overlay.style.background = opts.bg || 'rgba(0,0,0,0.75)';
  overlay.style.transition = 'opacity 0.3s';
  const card = el('div', opts.cardClass || 'parchment-bg rounded-2xl p-6 max-w-md w-full text-center magic-glow animate-scale-in');
  card.innerHTML = innerHTML;
  overlay.appendChild(card);

  const dismiss = (cb) => {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      if (cb) cb();
    }, 300);
  };

  return { overlay, card, dismiss };
}

// ========== 情境引导卡片 ==========

// 首次专注完成：解释结算
export function showFocusCompleteGuide(callback) {
  const { overlay, card, dismiss } = makeOverlay(`
    <div class="text-5xl mb-4">💰</div>
    <h3 class="font-display text-2xl font-bold mb-2">${t('tutorialFocusCompleteTitle')}</h3>
    <p class="text-ink-light leading-relaxed mb-3 text-base">
      ${formatTerm('tutorialFocusCompleteDesc', { coins: t('coins'), atmosphere: t('atmosphere') })}
    </p>
    <p class="text-sm text-ink-light mb-4">${t('tutorialStreakHint')}</p>
    <button class="px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">${t('tutorialGotIt')}</button>
  `);

  card.querySelector('button').addEventListener('click', () => {
    dismiss(() => {
      markTutorialSeen('focus_complete');
      if (callback) callback();
    });
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) card.querySelector('button').click(); });
  document.body.appendChild(overlay);
}

// 首次访客到来：解释访客系统
export function showVisitorArriveGuide(callback) {
  const { overlay, card, dismiss } = makeOverlay(`
    <div class="text-5xl mb-4">👥</div>
    <h3 class="font-display text-2xl font-bold mb-2">${t('tutorialVisitorTitle')}</h3>
    <p class="text-ink-light leading-relaxed mb-3 text-base">
      ${formatTerm('tutorialVisitorDesc', { coins: t('coins'), atmosphere: t('atmosphere') })}
    </p>
    <p class="text-sm text-ink-light mb-4">${formatTerm('tutorialVisitorHint', { readerSalon: t('tabReaderSalon') })}</p>
    <button class="px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">${t('tutorialGoSee')}</button>
  `);

  card.querySelector('button').addEventListener('click', () => {
    dismiss(() => {
      markTutorialSeen('visitor_arrive');
      window.switchTab('visitors');
      if (callback) callback();
    });
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) card.querySelector('button').click(); });
  document.body.appendChild(overlay);
}

// 首次打开位面商店：解释商店
export function showShopOpenGuide(callback) {
  const { overlay, card, dismiss } = makeOverlay(`
    <div class="text-5xl mb-4">🌌</div>
    <h3 class="font-display text-2xl font-bold mb-2">${t('tabPlaneShop')}</h3>
    <p class="text-ink-light leading-relaxed mb-3 text-base">
      ${formatTerm('tutorialShopDesc', { coins: t('coins') })}
    </p>
    <div class="text-left text-base text-ink-light mb-3 space-y-1">
      <div>${formatTerm('tutorialShopReadingAreaUpgrade', { readingArea: t('readingArea'), upgrade: t('upgrade') })}</div>
      <div>${formatTerm('tutorialShopScriptoriumUpgrade', { scriptorium: t('tabScriptorium'), upgrade: t('upgrade') })}</div>
      <div>${formatTerm('tutorialShopDecor', { decor: t('decoration') })}</div>
      <div>${formatTerm('tutorialShopNewBooks', { newBooks: t('newBooksInStock') })}</div>
    </div>
    <button class="px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">${t('tutorialExplore')}</button>
  `);

  card.querySelector('button').addEventListener('click', () => {
    dismiss(() => {
      markTutorialSeen('shop_open');
      if (callback) callback();
    });
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) card.querySelector('button').click(); });
  document.body.appendChild(overlay);
}

// 首次打开馆长办公室：介绍子标签
export function showLibraryOpenGuide(callback) {
  const { overlay, card, dismiss } = makeOverlay(`
    <div class="text-5xl mb-4">🏛️</div>
    <h3 class="font-display text-2xl font-bold mb-2">${t('tabCuratorOffice')}</h3>
    <p class="text-ink-light leading-relaxed mb-3 text-base">
      ${t('tutorialOfficeDesc')}
    </p>
    <div class="text-left text-base text-ink-light mb-3 space-y-1.5">
      <div>${formatTerm('tutorialOfficeOverview', { overview: t('subtabOverview') })}</div>
      <div>${formatTerm('tutorialOfficeAchievements', { achievements: t('subtabAchievements') })}</div>
      <div>${formatTerm('tutorialOfficeCollection', { collection: t('subtabCollection') })}</div>
      <div>${formatTerm('tutorialOfficeDecoration', { decoration: t('subtabDecoration') })}</div>
      <div>${formatTerm('tutorialOfficeGuide', { guide: t('subtabGuide') })}</div>
    </div>
    <button class="px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">${t('tutorialGotIt')}</button>
  `);

  card.querySelector('button').addEventListener('click', () => {
    dismiss(() => {
      markTutorialSeen('library_open');
      if (callback) callback();
    });
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) card.querySelector('button').click(); });
  document.body.appendChild(overlay);
}

// 首次解锁古籍修复室：解释修缮箱 + 卷组合成
export function showRestorationUnlockGuide(callback) {
  const { overlay, card, dismiss } = makeOverlay(`
    <div class="text-5xl mb-4">📜</div>
    <h3 class="font-display text-2xl font-bold mb-2">${t('tutorialRestorationTitle')}</h3>
    <p class="text-ink-light leading-relaxed mb-3 text-base">
      ${t('tutorialRestorationDesc')}
    </p>
    <div class="text-left text-base text-ink-light mb-3 space-y-1.5">
      <div>${t('tutorialRestorationVolumeProgress')}</div>
      <div>${t('tutorialRestorationCraft')}</div>
      <div>${t('tutorialRestorationBox')}</div>
      <div>${t('tutorialRestorationUpgrade')}</div>
    </div>
    <button class="px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">${t('tutorialGoSee')}</button>
  `);

  card.querySelector('button').addEventListener('click', () => {
    dismiss(() => {
      markTutorialSeen('restoration_unlock');
      if (callback) callback();
    });
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) card.querySelector('button').click(); });
  document.body.appendChild(overlay);
}

// 通用升级大卡片：金边 + 大图 + 文字
function showUpgradeCard({ imageUrl, badge, title, narrative, footer, onDismiss }) {
  const overlay = el('div', 'fixed inset-0 z-[150] flex items-center justify-center p-4');
  overlay.style.background = 'rgba(0,0,0,0.80)';
  overlay.style.transition = 'opacity 0.4s';

  const card = el('div', 'bg-white rounded-2xl overflow-hidden max-w-xl w-full animate-scale-in');
  card.style.boxShadow = '0 0 0 4px rgba(201,162,39,0.4), 0 8px 48px rgba(0,0,0,0.5)';

  card.innerHTML = `
    <div class="relative">
      <img src="${imageUrl}" alt="${title}" class="w-full h-56 object-cover">
      <div class="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
      ${badge ? `<div class="absolute top-4 left-4 bg-magic-gold text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">${badge}</div>` : ''}
    </div>
    <div class="px-6 pb-6 pt-2 text-center">
      <h2 class="font-display text-2xl font-bold mb-3">${title}</h2>
      <div class="w-12 h-1 bg-magic-gold mx-auto mb-4 rounded-full"></div>
      <div class="text-ink leading-relaxed mb-5 text-base text-left">${narrative}</div>
      ${footer ? `<div class="text-sm text-ink-light mb-4">${footer}</div>` : ''}
      <button class="px-8 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all text-base">${t('continueText')}</button>
    </div>
  `;

  overlay.appendChild(card);

  const dismiss = (cb) => {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      if (cb) cb();
    }, 400);
  };

  card.querySelector('button').addEventListener('click', () => {
    dismiss(() => {
      if (onDismiss) onDismiss();
    });
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) card.querySelector('button').click(); });
  document.body.appendChild(overlay);
}

// ========== 氛围升级弹窗（重做：金边大卡片 + 清晰大图） ==========

export function showAtmosphereStagePopup(stage, callback) {
  const stageName = getAtmosphereStageName(stage);
  const bgUrl = STAGE_BG[stage];
  const narrative = t(`atmosphereStageNarrative${stage}`) || '';

  showUpgradeCard({
    imageUrl: bgUrl,
    badge: t('libraryRevival'),
    title: stageName,
    narrative,
    footer: formatTerm('atmosphereStageFooter', { stage, stageName }),
    onDismiss: () => {
      markTutorialSeen(`atmosphere_stage_${stage}`);
      if (callback) callback();
    }
  });
}

// ========== 缮写室升级弹窗 ==========

const FOCUS_IMG_NAMES = [
  'focusroom_lv0_final_0.jpg',
  'focusroom_lv1_no_text_0.jpg',
  'focusroom_lv2_final_0.jpg',
  'focusroom_lv3_final_1.jpg',
  'focusroom_lv4_final_0.jpg',
  'focusroom_lv5_final_1.jpg',
  'focusroom_lv6_sanctuary_16x9_1.jpg'
];

export function showFocusRoomUpgrade(newLevel) {
  const imageUrl = `visual/focusroom/${FOCUS_IMG_NAMES[newLevel]}`;
  const name = getFocusRoomLevelName(newLevel);
  const narrative = t(`focusRoomNarrative${newLevel}`) || t('focusRoomNarrativeDefault');
  const speed = Math.round((1 + newLevel * 0.05) * 100);

  showUpgradeCard({
    imageUrl,
    badge: t('scriptoriumUpgrade'),
    title: `${t('tabScriptorium')} · ${name}`,
    narrative,
    footer: `${t('tabScriptorium')} Lv.${newLevel} · ${t('transcribeSpeed').replace('{value}', speed)}`
  });
}

// ========== 借阅区升级弹窗 ==========

const READING_IMG_NAMES = [
  'library_reading_01_shell.jpg',
  'library_reading_02_tidy.jpg',
  'library_reading_03_open.jpg',
  'library_reading_04_comfy.jpg',
  'library_reading_05_refined.jpg',
  'library_reading_06_elegant.jpg',
  'library_reading_07_sanctum.jpg'
];

export function showBorrowAreaUpgrade(newLevel) {
  const imageUrl = `visual/library_readingarea/${READING_IMG_NAMES[newLevel - 1]}`;
  const name = getBorrowLevelName(newLevel);
  const narrative = t(`borrowAreaNarrative${newLevel}`) || t('borrowAreaNarrativeDefault');

  showUpgradeCard({
    imageUrl,
    badge: t('readingAreaUpgrade'),
    title: `${t('readingArea')} · ${name}`,
    narrative,
    footer: `${t('readingArea')} Lv.${newLevel} · ${t('borrowAreaCapacityBoost')}`
  });
}

// ========== 古籍修复室升级弹窗 ==========

const RESTORATION_IMG_NAMES = [
  'restoration_lv0_ruins.jpg',
  'restoration_lv1_shelter.jpg',
  'restoration_lv2_tidy.jpg',
  'restoration_lv3_bright.jpg',
  'restoration_lv4_elegant.jpg',
  'restoration_lv5_sanctum.jpg'
];

export function showRestorationUpgrade(newLevel) {
  const imageUrl = `visual/restoration/${RESTORATION_IMG_NAMES[newLevel]}`;
  const name = getRestorationLevelName(newLevel);
  const narrative = t(`restorationNarrative${newLevel}`) || t('restorationNarrativeDefault');

  showUpgradeCard({
    imageUrl,
    badge: newLevel === 0 ? t('restorationRoomUnlock') : t('restorationRoomUpgrade'),
    title: `${t('restorationRoom')} · ${name}`,
    narrative,
    footer: `${t('restorationRoom')} Lv.${newLevel}`
  });
}

// ========== 统一入口 ==========

export function dispatchTutorialUI(trigger, callback) {
  if (!trigger) return false;

  switch (trigger.type) {
    case 'context-card':
      if (trigger.event === 'focus_complete') {
        showFocusCompleteGuide(callback);
        return true;
      }
      if (trigger.event === 'visitor_arrive') {
        showVisitorArriveGuide(callback);
        return true;
      }
      if (trigger.event === 'shop_open') {
        showShopOpenGuide(callback);
        return true;
      }
      if (trigger.event === 'library_open') {
        showLibraryOpenGuide(callback);
        return true;
      }
      if (trigger.event === 'restoration_unlock') {
        showRestorationUnlockGuide(callback);
        return true;
      }
      return false;
    case 'atmosphere-popup':
      showAtmosphereStagePopup(trigger.stage, callback);
      return true;
    default:
      return false;
  }
}
