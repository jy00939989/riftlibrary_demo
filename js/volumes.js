// 长书卷组逻辑 —— 合成典藏版
// 纯状态操作封装，不碰 DOM

import { state, saveState } from './state.js';
import { addAtmosphere, addCoins, addHistory } from './storage.js';
import { placeOnShelf, addToManuscriptBox, createBookRecord } from './capacity.js';
import { getVolumeGroupByCollectedId } from '../data/volume_groups.js';
import { BOOKS } from '../data/books.js';

/** 该单卷是否"可被合成"（完成、未损坏、未借出，或已锁入修缮箱） */
function isVolumeCollectable(volId) {
  const bs = state.books[volId];
  if (!bs || bs.status !== 'completed' || bs.damaged) return false;
  // 锁入修缮箱的卷可直接参与合成
  if ((state.restorationBox || []).includes(volId)) return true;
  // 借出中（修复 P0-②）
  const borrowed = (state.visitors || []).some(v =>
    v.bookId === volId && (v.status === 'borrowed' || v.status === 'due'));
  return !borrowed;
}

export function canCollectVolumeGroup(group) {
  return group.volumeIds.every(id => isVolumeCollectable(id));
}

export function collectVolumeGroup(group) {
  if (!canCollectVolumeGroup(group)) {
    return { ok: false, reason: 'not_ready' };
  }

  // 从书架移除所有单卷
  state.library.shelves.forEach(shelf => {
    shelf.forEach((slot, idx) => {
      if (group.volumeIds.includes(slot)) shelf[idx] = null;
    });
  });

  // 从手稿箱移除所有单卷
  state.manuscriptBox = state.manuscriptBox.filter(id => !group.volumeIds.includes(id));

  // 从修缮箱移除所有单卷
  state.restorationBox = (state.restorationBox || []).filter(id => !group.volumeIds.includes(id));

  // 创建典藏版记录
  const collectedDef = BOOKS[group.collectedBookId];
  state.books[group.collectedBookId] = createBookRecord({
    status: 'completed',
    masteryLevel: 5,
    copyCount: 1,
    copiedWords: collectedDef ? collectedDef.totalWords : 0
  });

  // 单卷已完成使命，锁定避免继续出现在借阅候选池
  group.volumeIds.forEach(id => {
    state.books[id] = createBookRecord({ status: 'locked' });
  });

  // 典藏版上架；满架则回退到手稿箱
  const placed = placeOnShelf(group.collectedBookId);
  if (!placed) {
    const ok = addToManuscriptBox(group.collectedBookId);
    if (!ok) {
      console.warn('[volumes] 典藏版上架失败且手稿箱已满：', group.collectedBookId);
    }
  }

  // 奖励
  addAtmosphere(10);
  addCoins(100);
  addHistory('event', `📜 在古籍修复室合成《${group.title}》典藏版`, '全卷合璧，永驻书架');
  saveState();

  return { ok: true, collectedBookId: group.collectedBookId };
}

/** 按典藏版 ID 合成（便捷入口） */
export function collectVolumeGroupById(collectedBookId) {
  const group = getVolumeGroupByCollectedId(collectedBookId);
  if (!group) return { ok: false, reason: 'no_group' };
  return collectVolumeGroup(group);
}
