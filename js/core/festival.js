// 双节活动核心：登录自动领（图南 B+C 方案之 B——活动窗内首次启动入账，按设备存档幂等，
// claim 标记随云存档同步，换设备不重复）
import { state, saveState } from '../state.js';
import { FESTIVALS, isFestivalActive } from '../../data/festival.js';
import { applyRedeemRewards } from './redeem.js';
import { addDiaryEntry } from '../diary.js';
import { t } from '../i18n/terms.js';

/**
 * 检查并发放活动窗内未领取的节日礼
 * @param {number} [now] - 测试可注入（默认 __dev.getNow 或真实时间）
 * @returns {Array} 本次新发放的活动列表（空数组 = 无发放）
 */
export function checkFestivalGifts(now = (typeof window !== 'undefined' && window.__dev?.getNow?.()) || Date.now()) {
  const granted = [];
  for (const key of Object.keys(FESTIVALS)) {
    const fest = FESTIVALS[key];
    if (!isFestivalActive(key, now)) continue;
    if (!state.eventClaims) state.eventClaims = {};
    if (state.eventClaims[key]) continue; // 已领（幂等）

    applyRedeemRewards(fest.giftRewards, 'festival');
    state.eventClaims[key] = now;
    addDiaryEntry('special_event', {
      detail: t('diaryFestivalGift').replace('{title}', t(fest.titleKey))
    });
    saveState();
    granted.push(fest);
  }
  return granted;
}
