// 墨墨建议气泡 —— 持久化右下角提示，根据游戏状态给出情境建议
import { state } from '../state.js';

// ========== 建议池（按优先级排序，首个命中即显示） ==========

const RANDOM_ENCOURAGEMENTS = [
  '墨墨在横梁上看着你呢——一切都在慢慢变好。',
  '今天也是适合抄书的一天。墨墨感觉得到。',
  '馆长，要不要休息一下？泡杯茶也不错。',
  '墨墨最喜欢黄昏时分的图书馆，光线正好。',
  '每一本被抄完的书，都会在书脊上轻轻叹一口气。',
  '墨墨数过了——书架上的灰尘又少了一些。',
  '有你在，这座图书馆在一点一点活过来。',
  '墨墨觉得今天会有好事发生。',
  '羽毛笔还够用吗？墨墨可以帮你找一支新的。',
  '夜深了，但缮写室的灯还亮着——墨墨很安心。',
];

const MOMO_SUGGESTIONS = [
  // 1. 引导任务未完成
  {
    id: 'guide_incomplete',
    condition: (s) => !s.guideQuests?.allCompleted,
    getText: () => '馆长，任务清单上还有未完成的事项哦——打开看看？',
    emoji: '📋',
  },
  // 2. 氛围极低
  {
    id: 'atmo_low',
    condition: (s) => s.library.atmosphere < 50,
    getText: () => '图书馆还是太破旧了……多抄几本书，氛围会好起来的！',
    emoji: '🏚️',
  },
  // 3. 没有已完成的书籍
  {
    id: 'no_completed',
    condition: (s) => !Object.values(s.books).some(b => b.status === 'completed'),
    getText: () => '缮写室里还有书等着被抄完呢——完成第一本书就能上架了。',
    emoji: '📝',
  },
  // 4. 借阅区未建造
  {
    id: 'no_borrow',
    condition: (s) => s.library.borrowLevel === 0,
    getText: () => '没有借阅区，访客来了也没地方坐……去商店建造一间吧！',
    emoji: '🪑',
  },
  // 5. 从未有过访客
  {
    id: 'no_visitors',
    condition: (s) => s.visitors.length === 0 && (s.borrowRecords || []).length === 0,
    getText: () => '一次专注完成后，会有访客推门进来的——墨墨在横梁上看着呢。',
    emoji: '🚪',
  },
  // 6. 没有种植植物
  {
    id: 'no_plant',
    condition: (s) => !s.plant || !s.plant.activeType,
    getText: () => '缮写室窗台上的花盆还空着……要不要去商店买颗种子？',
    emoji: '🪴',
  },
  // 7. 借阅区建好了但没有借出记录
  {
    id: 'borrow_empty',
    condition: (s) => s.library.borrowLevel > 0 && (s.borrowRecords || []).filter(r => r.status === 'active').length === 0 && s.visitors.some(v => v.status === 'browsing'),
    getText: () => '有访客在馆里呢！他们可以借书了——大书库里有已完成的书籍就能出借。',
    emoji: '📤',
  },
  // 8. 默认：随机鼓励
  {
    id: 'random',
    condition: () => true,
    getText: () => RANDOM_ENCOURAGEMENTS[Math.floor(Math.random() * RANDOM_ENCOURAGEMENTS.length)],
    emoji: '🦉',
  },
];

// ========== 模块状态 ==========

let dismissedUntil = 0;
let currentBubbleEl = null;
let lastSuggestionId = '';

// ========== 核心函数 ==========

export function getMomoSuggestion() {
  if (Date.now() < dismissedUntil) return null;

  for (const sug of MOMO_SUGGESTIONS) {
    if (sug.condition(state)) {
      return {
        id: sug.id,
        text: typeof sug.getText === 'function' ? sug.getText() : sug.text,
        emoji: sug.emoji,
      };
    }
  }
  return null;
}

export function renderMomoSuggestion() {
  const suggestion = getMomoSuggestion();

  // 无建议或建议未变化 → 不重建 DOM
  if (!suggestion) {
    if (currentBubbleEl) {
      currentBubbleEl.remove();
      currentBubbleEl = null;
      lastSuggestionId = '';
    }
    return;
  }

  // 建议 ID 相同且 DOM 存在 → 不重复渲染
  if (suggestion.id === lastSuggestionId && currentBubbleEl) return;

  // 移除旧气泡
  if (currentBubbleEl) {
    currentBubbleEl.remove();
    currentBubbleEl = null;
  }

  lastSuggestionId = suggestion.id;

  const bubble = document.createElement('div');
  bubble.className = 'momo-suggestion-bubble';
  bubble.innerHTML = `
    <div class="momo-suggestion-header">
      <span class="momo-suggestion-emoji">${suggestion.emoji}</span>
      <span class="momo-suggestion-label">墨墨</span>
      <button class="momo-suggestion-close" title="暂时隐藏">✕</button>
    </div>
    <p class="momo-suggestion-text">${suggestion.text}</p>
  `;

  // 关闭按钮
  const closeBtn = bubble.querySelector('.momo-suggestion-close');
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dismissMomoSuggestion();
  });

  // 点击气泡本身 → 刷新一条随机鼓励
  bubble.addEventListener('click', () => {
    const randomText = RANDOM_ENCOURAGEMENTS[Math.floor(Math.random() * RANDOM_ENCOURAGEMENTS.length)];
    const textEl = bubble.querySelector('.momo-suggestion-text');
    if (textEl) textEl.textContent = randomText;
  });

  document.body.appendChild(bubble);
  currentBubbleEl = bubble;
}

export function dismissMomoSuggestion() {
  dismissedUntil = Date.now() + 5 * 60 * 1000; // 5 分钟后恢复
  if (currentBubbleEl) {
    currentBubbleEl.style.opacity = '0';
    currentBubbleEl.style.transform = 'translateY(10px) scale(0.95)';
    setTimeout(() => {
      if (currentBubbleEl) {
        currentBubbleEl.remove();
        currentBubbleEl = null;
        lastSuggestionId = '';
      }
    }, 300);
  }
}

export function resetMomoSuggestion() {
  dismissedUntil = 0;
  lastSuggestionId = '';
  renderMomoSuggestion();
}
