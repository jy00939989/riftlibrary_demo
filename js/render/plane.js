// 位面详情页渲染（发展手册）—— 时间线 + 角色 + 信物 + 墨墨评论
import { state } from '../state.js';
import { PLANES } from '../../data/planes.js';
import { getPlaneQuestState, getPlaneCharacters } from '../quests.js';
import { renderCharacterCard } from './quests.js';

export function renderPlaneDetail(planeId) {
  const plane = PLANES[planeId];
  if (!plane || plane.isPlaceholder) return renderPlaceholderPlane();

  const pq = getPlaneQuestState(planeId);
  const unlocked = pq && pq.unlocked;
  const stage = pq ? pq.stage : 0;
  const stagesCompleted = pq ? pq.stagesCompleted : [];
  const mementos = pq ? pq.mementos : [];
  const storyLog = pq ? pq.storyLog : [];

  const container = document.getElementById('page-archive');
  if (!container) return;
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'space-y-6';

  // 顶部导航
  wrapper.appendChild(renderPlaneHeader(plane, stage));

  if (!unlocked) {
    wrapper.appendChild(renderLockedState(plane));
    container.appendChild(wrapper);
    return;
  }

  // 概念图占位
  wrapper.appendChild(renderConceptArt(plane));

  // 时间线
  wrapper.appendChild(renderTimeline(plane, stage, stagesCompleted, storyLog));

  // 角色列表
  wrapper.appendChild(renderCharacterList(planeId, plane));

  // 信物收集
  if (plane.mementos && plane.mementos.length > 0) {
    wrapper.appendChild(renderMementos(plane, mementos));
  }

  // 墨墨的评论
  wrapper.appendChild(renderMomoCommentary(plane, stage));

  container.appendChild(wrapper);
}

// ========== 顶部导航 ==========

function renderPlaneHeader(plane, stage) {
  const div = document.createElement('div');
  div.className = 'flex items-center gap-3 mb-2';
  div.innerHTML = `
    <button class="plane-back-btn px-3 py-2 bg-wood/10 hover:bg-wood/20 rounded-lg text-sm font-bold transition-all">← 返回档案</button>
    <span class="text-3xl">${plane.emoji}</span>
    <div>
      <h2 class="font-display text-xl font-bold">${plane.name}</h2>
      <p class="text-xs text-ink-light">第${stage}幕 · ${plane.theme ? plane.theme.mood : ''}</p>
    </div>
  `;
  div.querySelector('.plane-back-btn').addEventListener('click', () => {
    if (window.__renderArchivePage) window.__renderArchivePage();
  });
  return div;
}

// ========== 未解锁状态 ==========

function renderLockedState(plane) {
  const div = document.createElement('div');
  div.className = 'parchment-bg rounded-2xl p-8 text-center magic-glow';
  const { atmo, books } = plane.unlock || {};
  const currentAtmo = state.library.atmosphere || 0;
  const currentBooks = Object.values(state.books || {}).filter(b => b && b.status !== 'locked').length;

  div.innerHTML = `
    <div class="text-6xl mb-4">🔒</div>
    <h3 class="font-display text-lg font-bold mb-2">传送门尚未开启</h3>
    <p class="text-ink-light mb-4">${plane.desc}</p>
    <div class="inline-block bg-white/60 rounded-xl p-4 text-left">
      <p class="text-sm font-bold mb-2">开启条件：</p>
      <p class="text-sm ${currentAtmo >= atmo ? 'text-green-600' : 'text-ink-light'}">
        ${currentAtmo >= atmo ? '✅' : '⬜'} 氛围值 ≥ ${atmo}（当前 ${currentAtmo}）
      </p>
      <p class="text-sm ${currentBooks >= books ? 'text-green-600' : 'text-ink-light'}">
        ${currentBooks >= books ? '✅' : '⬜'} 拥有 ≥ ${books} 本书（当前 ${currentBooks}）
      </p>
      <p class="text-sm text-ink-light">⬜ 在位面商店购买传送门</p>
    </div>
    <p class="text-xs text-ink-light mt-4">前往 <button class="goto-shop-btn text-magic-gold underline font-bold">位面商店</button> 购买传送门</p>
  `;

  div.querySelector('.goto-shop-btn').addEventListener('click', () => {
    window.switchTab('shop');
  });
  return div;
}

// ========== 概念图 ==========

function renderConceptArt(plane) {
  const div = document.createElement('div');
  div.className = 'parchment-bg rounded-2xl p-6 magic-glow';
  div.innerHTML = `
    <div class="rounded-xl bg-wood/10 h-48 flex items-center justify-center border-2 border-dashed border-wood/30 mb-3">
      <div class="text-center">
        <div class="text-4xl mb-2">${plane.emoji}</div>
        <p class="text-sm text-ink-light">${plane.name} · 概念图</p>
        <p class="text-xs text-ink-light/60">（美术素材待制作）</p>
      </div>
    </div>
    <p class="text-sm text-ink leading-relaxed">${plane.desc}</p>
    ${plane.theme ? `<p class="text-xs text-ink-light mt-2">色调：${plane.theme.colors} · 氛围：${plane.theme.mood}</p>` : ''}
  `;
  return div;
}

// ========== 时间线 ==========

function renderTimeline(plane, stage, stagesCompleted, storyLog) {
  const div = document.createElement('div');
  div.className = 'parchment-bg rounded-2xl p-6 magic-glow';

  const stageLabels = ['', '第一章：求救之声', '第二章：草药与祈祷', '第三章：禁忌之书', '第四章：领主之责', '第五章：黎明的山谷'];
  const stageDescs = [
    '',
    '第一位访客到来，来自田园的求救传入图书馆',
    '草药与信仰各自寻找答案，裂痕在村庄蔓延',
    '禁书中的真相浮出水面，知识成为双刃剑',
    '领主面对自己制造的灾难，权力向真相低头',
    '五条命运之线于此交汇，山谷迎来新的黎明'
  ];

  let timelineHtml = '<h3 class="font-bold mb-4">⏳ 时间线</h3><div class="space-y-3">';

  for (let s = 1; s <= 5; s++) {
    const done = stagesCompleted.includes(s) || s < stage;
    const current = s === stage;
    const logEntry = storyLog.find(l => l.stage === s);

    timelineHtml += `
      <div class="flex items-start gap-3 ${s > stage ? 'opacity-50' : ''}">
        <div class="flex flex-col items-center">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${done ? 'bg-green-500 text-white' : current ? 'bg-magic-gold text-white' : 'bg-gray-300 text-gray-500'}">
            ${done ? '✓' : s}
          </div>
          ${s < 5 ? '<div class="w-0.5 h-6 bg-wood/20"></div>' : ''}
        </div>
        <div class="pb-2">
          <div class="font-bold text-sm ${current ? 'text-magic-gold' : ''}">${stageLabels[s]}</div>
          <div class="text-xs text-ink-light">${stageDescs[s]}</div>
          ${logEntry ? `<div class="text-xs text-magic-blue mt-1">📜 ${logEntry.title} — ${new Date(logEntry.ts).toLocaleDateString('zh-CN')}</div>` : ''}
        </div>
      </div>
    `;
  }

  timelineHtml += '</div>';
  div.innerHTML = timelineHtml;
  return div;
}

// ========== 角色列表 ==========

function renderCharacterList(planeId, plane) {
  const div = document.createElement('div');
  div.className = 'parchment-bg rounded-2xl p-6 magic-glow';

  const characters = getPlaneCharacters(planeId);

  let html = '<h3 class="font-bold mb-4">👥 角色</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-3">';

  characters.forEach(char => {
    const met = char.questState && char.questState.met;
    const hasPending = char.questState && char.questState.pendingComplete && char.questState.pendingComplete.length > 0;
    const hasActive = char.questState && char.questState.activeTasks && char.questState.activeTasks.length > 0;
    const unlocked = char.unlocked;

    html += `
      <div class="bg-white rounded-xl p-4 border-2 cursor-pointer hover:shadow-lg transition-all char-card ${unlocked ? 'border-wood/20 hover:border-magic-gold/50' : 'border-gray-200 opacity-50'}"
           data-plane-id="${planeId}" data-char-id="${char.id}">
        <div class="flex items-start gap-3">
          <div class="relative">
            <span class="text-3xl">${unlocked ? char.emoji : '❓'}</span>
            ${hasPending ? '<span class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" title="有待回信"></span>' : ''}
            ${hasActive && !hasPending ? '<span class="absolute -top-1 -right-1 w-4 h-4 bg-magic-gold rounded-full border-2 border-white" title="有进行中任务"></span>' : ''}
          </div>
          <div class="flex-1">
            <div class="font-bold text-sm">${unlocked ? char.name : '？？？'}</div>
            <div class="text-xs text-ink-light">${unlocked ? char.role : '尚未到访'}</div>
            ${unlocked ? `<div class="text-xs text-ink-light mt-1 line-clamp-2">${char.desc}</div>` : ''}
            ${hasPending ? '<div class="text-xs text-red-500 font-bold mt-1">✉️ 有待回信</div>' : ''}
            ${hasActive && !hasPending ? '<div class="text-xs text-magic-gold font-bold mt-1">📝 任务进行中</div>' : ''}
            ${met && !hasActive && !hasPending ? '<div class="text-xs text-green-600 mt-1">✓ 当前阶段完成</div>' : ''}
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  div.innerHTML = html;

  // 绑定点击事件
  div.querySelectorAll('.char-card').forEach(card => {
    card.addEventListener('click', () => {
      const pid = card.dataset.planeId;
      const cid = card.dataset.charId;
      renderCharacterCard(pid, cid);
    });
  });

  return div;
}

// ========== 信物收集 ==========

function renderMementos(plane, collected) {
  const div = document.createElement('div');
  div.className = 'parchment-bg rounded-2xl p-6 magic-glow';

  let html = '<h3 class="font-bold mb-4">🏛️ 信物收集</h3><div class="flex gap-3 flex-wrap">';

  plane.mementos.forEach(m => {
    const owned = collected.includes(m.id);
    html += `
      <div class="bg-white rounded-xl p-3 border-2 text-center w-24 ${owned ? 'border-magic-gold/50' : 'border-gray-200 opacity-40'}">
        <div class="text-2xl mb-1">${owned ? m.emoji : '❓'}</div>
        <div class="text-xs ${owned ? 'font-bold' : 'text-ink-light'}">${owned ? m.name : '???'}</div>
        ${!owned ? '<div class="text-xs text-ink-light/60">第' + m.unlockStage + '幕解锁</div>' : ''}
      </div>
    `;
  });

  html += '</div>';
  div.innerHTML = html;
  return div;
}

// ========== 墨墨评论 ==========

function renderMomoCommentary(plane, stage) {
  const commentaries = {
    0: '传送门已经开启……我能感觉到那边的风，带着麦子和草药的气味。五个人的命运正在交织，而这座图书馆，将成为他们的信使。',
    1: '第一个孩子已经来了。她在书架上找到了一本童话，眼睛里闪着光。记住，馆长——每一封信，都是一个人在用文字呼救。',
    2: '草药与祈祷，知识与信仰。这个位面的人们在用自己的方式对抗瘟疫。而我们能做的，是把正确的书，递到正确的人手中。',
    3: '真相是一把刀。艾德里安在禁书中找到了它，但握住刀柄的手还在颤抖。接下来，要看领主如何选择了。',
    4: '杜兰伯爵终于低下了头。权力在真相面前不堪一击——但承认错误，需要另一种勇气。最后一幕要来了。',
    5: '黎明降临在山谷。五个人的故事在这里交汇，而我们——只是为他们誊抄了几本书而已。不，不只是几本书。是几座桥。'
  };

  const text = commentaries[stage] || commentaries[0];

  const div = document.createElement('div');
  div.className = 'bg-amber-50 border-l-4 border-magic-gold rounded-r-xl p-4';
  div.innerHTML = `
    <div class="flex items-start gap-3">
      <span class="text-2xl">📚</span>
      <div>
        <div class="text-xs text-magic-gold font-bold mb-1">墨墨的评论</div>
        <p class="text-sm text-ink leading-relaxed">${text}</p>
      </div>
    </div>
  `;
  return div;
}

// ========== 占位位面 ==========

function renderPlaceholderPlane() {
  const container = document.getElementById('page-archive');
  if (!container) return;
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'space-y-6';

  wrapper.innerHTML = `
    <div class="flex items-center gap-3 mb-2">
      <button class="plane-back-btn px-3 py-2 bg-wood/10 hover:bg-wood/20 rounded-lg text-sm font-bold transition-all">← 返回档案</button>
      <span class="text-3xl">🔒</span>
      <h2 class="font-display text-xl font-bold">未发现的位面</h2>
    </div>
    <div class="parchment-bg rounded-2xl p-8 text-center magic-glow">
      <div class="text-6xl mb-4">🌌</div>
      <h3 class="font-display text-lg font-bold mb-2">裂隙的另一侧</h3>
      <p class="text-ink-light">新的位面尚未被发现。继续誊抄，提升图书馆的氛围，未来会有更多的世界向你敞开大门。</p>
    </div>
  `;

  wrapper.querySelector('.plane-back-btn').addEventListener('click', () => {
    if (window.__renderArchivePage) window.__renderArchivePage();
  });

  container.appendChild(wrapper);
}

