// 双节活动核心：登录自动领（图南 B+C 方案之 B——活动窗内首次启动入账，按设备存档幂等，
// claim 标记随云存档同步，换设备不重复）
import { state, saveState } from '../state.js';
import { FESTIVALS, isFestivalActive } from '../../data/festival.js';
import { applyRedeemRewards } from './redeem.js';
import { addDiaryEntry } from '../diary.js';
import { addHistory } from '../storage.js';
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
    // 2026-10-27 万圣笔（图南拍板：窗口内自动免费、已得终身、不上架）。
    // ⚠️ 必须独立于礼物 claim 幂等：存量玩家 eventClaims 已有本节日标记
    // （礼在笔机制上线前领过），放 claim 检查之后这批玩家永远拿不到笔。
    // includes 判断自身即幂等键，窗口内每次启动都会兜到。
    if (fest.penStyle) {
      if (!state.unlockedPenStyles) state.unlockedPenStyles = [];
      if (!state.unlockedPenStyles.includes(fest.penStyle)) {
        state.unlockedPenStyles.push(fest.penStyle);
        addHistory('event', `🖋 ${t('penUnlockHistoryTitle')}`, t('penUnlockHistoryDesc'));
      }
    }
    if (state.eventClaims[key]) continue; // 已领（幂等）

    applyRedeemRewards(fest.giftRewards, 'festival');
    state.eventClaims[key] = now;
    addDiaryEntry('special_event', {
      detail: t(fest.diaryKey || 'diaryFestivalGift').replace('{title}', t(fest.titleKey))
    });
    saveState();
    granted.push(fest);
  }
  return granted;
}

/**
 * 活动开幕大图弹窗的幂等标记（2026-10-27 图南：万圣节开幕怼脸弹窗，每人一次）。
 * 与礼物 claim 独立：看过弹窗不影响领礼，反之亦然。
 * @returns {boolean} 本次是否应弹出（true = 首次进入窗口）
 */
export function markEventSplash(key, now = (typeof window !== 'undefined' && window.__dev?.getNow?.()) || Date.now()) {
  if (!isFestivalActive(key, now)) return false;
  if (!state.eventSplash) state.eventSplash = {};
  if (state.eventSplash[key]) return false;
  state.eventSplash[key] = now;
  saveState();
  return true;
}
