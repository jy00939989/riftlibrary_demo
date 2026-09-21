// 渲染模块统一入口
export { setActions, updateStatusBar, getBookTitle, getChapterTitle, getBookAuthorBio, getBookAnecdotes, getBookReviews } from './common.js';
export { formatTime, updateTimerDisplay } from './common.js';
export { renderFocusPage, showCompletionCard, showActionCards } from './focus.js';
export { renderBookshelfPage, showMasteryDetail } from './bookshelf.js';
export { renderVisitorsPage, showVisitorEventModal } from './visitors.js';
export { renderLibraryPage } from './library.js';
export { renderArchivePage } from './archive.js';
export { renderExhibitionPage } from './exhibition.js';
export { renderMusicRoomPage } from './music-room.js';
export { renderShopPage } from './shop.js';
export { showUnlockAnimation, showBookCompleteAnimation, showBookShelvingAnimation, showDiaryLevelUpPopup } from './animations.js';
export { playVideoOverlay, hasSeenAnimation } from './shared/video-overlay.js';
export { renderAchievements, showAchievementToast, showAchievementBatch } from './achievements.js';
export { renderGuideQuestWidget, showQuestCompleteToast } from './guidequests.js';
export { renderMomoSuggestion, resetMomoSuggestion } from './momo-suggestion.js';
export { showBagPanel, hideBagPanel, initBagEntry, updateBagBadge } from './bag.js';
export { showPlantLossPopup, renderGreenhousePage } from './plants.js';
