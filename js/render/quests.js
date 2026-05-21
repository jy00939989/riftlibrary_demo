// 角色卡片 + 信函 UI 渲染
import { state, saveState } from '../state.js';
import { PLANES } from '../../data/planes.js';
import { getCharacterTasks, submitTask, getPlaneQuestState, getAllTasks } from '../quests.js';
import { renderPlaneDetail } from './plane.js';

// ========== 角色卡片 ==========

export function renderCharacterCard(planeId, charId) {
  const plane = PLANES[planeId];
  if (!plane) return;

  const char = plane.characters.find(c => c.id === charId);
  if (!char) return;

  const pq = getPlaneQuestState(planeId);
  if (!pq) return;

  const cd = pq.characters[charId];
  if (!cd) return;

  const { active, pending, completed } = getCharacterTasks(planeId, charId);

  const container = document.getElementById('page-archive');
  if (!container) return;
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'space-y-6';

  // 返回按钮 + 角色头部
  const header = document.createElement('div');
  header.className = 'flex items-center gap-3 mb-2';
  header.innerHTML = `
    <button class="char-back-btn px-3 py-2 bg-wood/10 hover:bg-wood/20 rounded-lg text-sm font-bold transition-all">← 返回位面</button>
    <span class="text-4xl">${char.emoji}</span>
    <div>
      <h2 class="font-display text-xl font-bold">${char.name}</h2>
      <p class="text-xs text-ink-light">${char.role} · 好感度 ${cd.favor || 0}</p>
    </div>
  `;
  header.querySelector('.char-back-btn').addEventListener('click', () => {
    renderPlaneDetail(planeId);
  });
  wrapper.appendChild(header);

  // 角色简介
  const intro = document.createElement('div');
  intro.className = 'parchment-bg rounded-2xl p-5 magic-glow';
  intro.innerHTML = `
    <p class="text-sm text-ink leading-relaxed">"${char.desc}"</p>
    ${!cd.met ? '<p class="text-xs text-ink-light mt-2">这位角色尚未到访图书馆。</p>' : ''}
  `;
  wrapper.appendChild(intro);

  // 活跃任务（有新信函的）
  if (active.length > 0) {
    wrapper.appendChild(renderTaskSection('📨 进行中的任务', active, 'active', planeId, charId, char));
  }

  // 待回信提交
  if (pending.length > 0) {
    wrapper.appendChild(renderTaskSection('✉️ 等待回信', pending, 'pending', planeId, charId, char));
  }

  // 已完成
  if (completed.length > 0) {
    wrapper.appendChild(renderTaskSection('✅ 已完成', completed, 'completed', planeId, charId, char));
  }

  // 如果没有任何任务
  if (active.length === 0 && pending.length === 0 && completed.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'parchment-bg rounded-2xl p-8 text-center magic-glow';
    empty.innerHTML = `
      <div class="text-4xl mb-3">📭</div>
      <p class="text-ink-light">暂无任务。等待角色下次到访时带来新的委托。</p>
    `;
    wrapper.appendChild(empty);
  }

  container.appendChild(wrapper);
}

function renderTaskSection(title, tasks, status, planeId, charId, char) {
  const div = document.createElement('div');
  div.className = 'parchment-bg rounded-2xl p-5 magic-glow';

  let html = `<h3 class="font-bold mb-3">${title}</h3><div class="space-y-3">`;

  tasks.forEach(task => {
    const typeLabels = {
      copy_chapter: '📝 誊抄章节',
      copy_book: '📖 誊抄完整书籍',
      read_chapter: '👁️ 阅读章节',
      collect_seed: '🌱 收集种子',
      deliver_item: '📦 传递信物'
    };
    const typeLabel = typeLabels[task.type] || task.type;

    if (status === 'active') {
      html += `
        <div class="bg-white rounded-xl p-4 border-2 border-magic-gold/30">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="text-xs text-magic-gold font-bold mb-1">${typeLabel}</div>
              <div class="font-bold text-sm">${task.summary}</div>
              <div class="text-xs text-ink-light mt-1">奖励：${formatReward(task.reward)}</div>
            </div>
            <button class="view-letter-btn px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-sm font-bold hover:bg-amber-200 transition-all"
              data-task-id="${task.id}" data-plane="${planeId}" data-char="${charId}">
              📧 查看来信
            </button>
          </div>
        </div>
      `;
    } else if (status === 'pending') {
      html += `
        <div class="bg-green-50 rounded-xl p-4 border-2 border-green-300">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="text-xs text-green-600 font-bold mb-1">${typeLabel} · 已完成</div>
              <div class="font-bold text-sm">${task.summary}</div>
              <div class="text-xs text-ink-light mt-1">奖励：${formatReward(task.reward)}</div>
            </div>
            <button class="submit-letter-btn px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all"
              data-task-id="${task.id}" data-plane="${planeId}" data-char="${charId}">
              ✉️ 回信提交
            </button>
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 opacity-70">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="text-xs text-ink-light mb-1">${typeLabel}</div>
              <div class="font-bold text-sm line-through">${task.summary}</div>
            </div>
            <span class="text-green-600 text-sm font-bold">✓</span>
          </div>
        </div>
      `;
    }
  });

  html += '</div>';
  div.innerHTML = html;

  // 绑定来信查看
  div.querySelectorAll('.view-letter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showLetterModal(btn.dataset.taskId, 'offer', planeId, charId, char);
    });
  });

  // 绑定回信提交
  div.querySelectorAll('.submit-letter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showLetterModal(btn.dataset.taskId, 'complete', planeId, charId, char);
    });
  });

  return div;
}

// ========== 信函弹窗 ==========

function showLetterModal(taskId, mode, planeId, charId, char) {
  const tasks = getAllTasks(planeId);
  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    console.warn('任务数据未找到:', taskId);
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/60 z-[140] flex items-center justify-center p-4';

  const content = document.createElement('div');
  content.className = 'parchment-bg rounded-2xl p-6 max-w-md w-full magic-glow animate-scale-in';

  if (mode === 'offer') {
    // 查看来信 — 可接受任务
    const letter = task.letterOffer;
    content.innerHTML = `
      <div class="text-center mb-4">
        <span class="text-4xl">${char.emoji}</span>
        <h3 class="font-display text-lg font-bold mt-2">${char.name}的来信</h3>
      </div>
      <div class="bg-white/60 rounded-xl p-4 mb-4 italic text-sm text-ink leading-relaxed">
        <p class="mb-3">${letter.greeting}</p>
        <p class="mb-3">${letter.body}</p>
        <p class="text-right">${letter.closing}</p>
      </div>
      <div class="bg-amber-50 rounded-lg p-3 mb-4">
        <div class="text-xs text-ink-light mb-1">📋 委托内容</div>
        <div class="font-bold text-sm">${task.summary}</div>
        <div class="text-xs text-magic-gold mt-1">报酬：${formatReward(task.reward)}</div>
      </div>
      <div class="text-center text-xs text-ink-light mb-4">
        此任务已自动接受。完成条件后将可回信提交。
      </div>
      <div class="text-center">
        <button class="close-letter-btn px-6 py-2.5 bg-magic-gold text-white rounded-lg font-bold hover:shadow-lg transition-all">知道了</button>
      </div>
    `;
  } else {
    // 回信提交 — 确认提交
    const letter = task.letterComplete;
    content.innerHTML = `
      <div class="text-center mb-4">
        <span class="text-4xl">${char.emoji}</span>
        <h3 class="font-display text-lg font-bold mt-2">回信给${char.name}</h3>
      </div>
      <div class="bg-white/60 rounded-xl p-4 mb-4 italic text-sm text-ink leading-relaxed">
        <p class="mb-3">${letter.body}</p>
        <p class="text-right">${letter.closing}</p>
      </div>
      <div class="bg-green-50 rounded-lg p-3 mb-4">
        <div class="text-xs text-green-600 mb-1">✅ 任务完成</div>
        <div class="font-bold text-sm">${task.summary}</div>
        <div class="text-xs text-magic-gold mt-1">报酬：${formatReward(task.reward)}</div>
      </div>
      <div class="flex justify-center gap-3">
        <button class="cancel-submit-btn px-5 py-2.5 bg-wood/20 text-ink-light rounded-lg font-bold hover:bg-wood/30 transition-all">稍后再说</button>
        <button class="confirm-submit-btn px-5 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:shadow-lg transition-all">📮 发送回信</button>
      </div>
    `;
  }

  overlay.appendChild(content);
  document.body.appendChild(overlay);

  const close = () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => overlay.remove(), 300);
  };

  content.querySelector('.close-letter-btn')?.addEventListener('click', close);
  content.querySelector('.cancel-submit-btn')?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // 回信提交确认
  const confirmBtn = content.querySelector('.confirm-submit-btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const result = submitTask(planeId, charId, taskId);
      if (result) {
        close();
        // 刷新角色卡片
        setTimeout(() => {
          renderCharacterCard(planeId, charId);
        }, 350);
      } else {
        alert('提交失败，请重试');
      }
    });
  }
}

// ========== 工具 ==========

function formatReward(reward) {
  const parts = [];
  if (reward.coins) parts.push(`💰${reward.coins}`);
  if (reward.atmo) parts.push(`✨${reward.atmo}氛围`);
  if (reward.memento) parts.push('🏛️信物');
  if (reward.letter) parts.push('📜信件');
  return parts.join(' · ') || '无';
}
