// 新手引导任务链 —— 10 步线性任务，逐级解锁核心玩法
import { state, saveState } from './state.js';
import { addCoins, addAtmosphere, getAtmosphereLevel } from './storage.js';

const QUESTS = [
  {
    id: 'q01',
    title: '推开馆门',
    phase: 1,
    desc: '你站在门外太久了。门缝里漏出的光浮动着灰尘和某种古老的回响。它已经等了很久——推门进去吧。这座图书馆，现在是你的了。',
    trigger: 'intro_complete',
    rewardCoins: 10,
    rewardAtmo: 0
  },
  {
    id: 'q02',
    title: '初试缮写',
    phase: 1,
    desc: '缮写室的旧书桌上，一支羽笔静静地躺着。墨水在玻璃瓶里微微反光，像在等什么人。选一本书，落下第一笔——这是你与这座图书馆之间的第一份契约。',
    trigger: 'focus_start',
    rewardCoins: 20,
    rewardAtmo: 0
  },
  {
    id: 'q03',
    title: '誊抄初成',
    phase: 1,
    desc: '搁下笔的瞬间，指尖还残留着微微的震颤。书页上的墨迹未干，但空气里已经浮起细碎的金色光点。那是图书馆的回赠——它记得每一个认真誊抄的人。',
    trigger: 'focus_complete',
    rewardCoins: 30,
    rewardAtmo: 5
  },
  {
    id: 'q04',
    title: '书库探秘',
    phase: 1,
    desc: '大书库里，有三本书在手稿箱里等你。童话、寓言——还有一本《图书馆指南》。建议先从誊抄《图书馆指南》开始，它会告诉你这个地方怎么运转。一座图书馆的故事，是从认出第一本书脊的颜色开始的。',
    trigger: 'tab_bookshelf',
    rewardCoins: 10,
    rewardAtmo: 0
  },
  {
    id: 'q05',
    title: '商店初访',
    phase: 2,
    desc: '墨墨把你领到了商店。书架上空着的位置还很多，缮写室和借阅区也等着修缮——用誊抄换来的智慧之光，可以买下新书、升级设施。这是馆长才有的权力：决定图书馆接下来变成什么样子。',
    trigger: 'tab_shop',
    rewardCoins: 20,
    rewardAtmo: 0
  },
  {
    id: 'q06',
    title: '借阅开张',
    phase: 2,
    desc: '书有了，缮写室有了——现在缺的是坐下来读它们的人。买下借阅区，把空置的旧房间变成一个可以阅读的角落。放上椅子，点亮灯，等某个推门而入的身影。',
    trigger: 'borrow_upgrade',
    rewardCoins: 40,
    rewardAtmo: 0
  },
  {
    id: 'q07',
    title: '初成之书',
    phase: 2,
    desc: '最后一个句号落笔。书脊上浮现出极淡的金色纹路——那是一本书被真正拥有的印记。不是占有，而是守护。从今往后，它有资格被传递到另一个人手中了。',
    trigger: 'book_complete',
    rewardCoins: 40,
    rewardAtmo: 10
  },
  {
    id: 'q08',
    title: '墨香来客',
    phase: 2,
    desc: '门被推开了。有人走了进来，带着外面世界的风和好奇，在你的书架前停下。这是第一位读者。记住这个声音——你守护的东西，开始有人来寻了。',
    trigger: 'visitor_arrive',
    rewardCoins: 30,
    rewardAtmo: 5
  },
  {
    id: 'q09',
    title: '墨墨相伴',
    phase: 3,
    desc: '你在缮写室累计专注了整整一个小时的时光。墨墨不知道什么时候养成了假装睡觉、其实是偷看你的习惯。有时候它会伸个懒腰，尾巴轻轻扫过你正在誊抄的那一页——像是在检查进度。',
    trigger: 'focus_60min',
    rewardCoins: 0,
    rewardAtmo: 10
  },
  {
    id: 'q10',
    title: '图南寄语',
    phase: 3,
    desc: '你不是新人了。从倒塌的书架和漏雨的屋顶，到如今有人愿意穿越大半个城市来寻访的地方——每一个专注的深夜、每一次落笔、每一本被借走的书，都是证据。接下来，故事继续。欢迎来到这座图书馆的深处。',
    trigger: 'all_done',
    rewardCoins: 50,
    rewardAtmo: 15
  }
];

function getTotalCoinsReward() {
  return QUESTS.reduce((sum, q) => sum + q.rewardCoins, 0);
}
function getTotalAtmoReward() {
  return QUESTS.reduce((sum, q) => sum + q.rewardAtmo, 0);
}

// 初始化/补全引导任务状态
export function ensureGuideQuests() {
  if (!state.guideQuests) {
    state.guideQuests = { completed: [], allCompleted: false };
    saveState();
  }
  // 扫描并补全已满足条件的旧任务（老玩家登录）
  if (!state.guideQuests.allCompleted) {
    retroCheck();
  }
}

// 根据当前状态回溯已完成的任务
function retroCheck() {
  let changed = false;
  const hasIntro = state.introCompleted;
  const hasFocusStart = state.focus.totalMinutes > 0;
  const hasFocusComplete = state.focus.totalMinutes > 0; // 专注开始即完成过
  // 注意：focus_complete 需要更准确的判断，但我们用 streaks 或 history 来推测
  const hasBookComplete = Object.values(state.books).some(b => b.status === 'completed' || b.copyCount > 0);
  const hasVisitor = state.visitors.length > 0 || state.history.some(h => h.type === 'visitor_arrive' || h.type === 'visitor_borrow');
  const hasBorrowLv1 = state.library.borrowLevel >= 1;
  const hasFocus60min = state.focus.totalMinutes >= 60;

  const checks = {
    'q01': hasIntro,
    'q02': hasFocusStart,
    'q03': hasFocusComplete,
    // q04 (tab_bookshelf) and q05 (tab_shop) can't be reliably retro-checked, skip
    'q06': hasBorrowLv1,
    'q07': hasBookComplete,
    'q08': hasVisitor,
    'q09': hasFocus60min
  };

  Object.entries(checks).forEach(([id, ok]) => {
    if (ok && !state.guideQuests.completed.includes(id)) {
      state.guideQuests.completed.push(id);
      changed = true;
    }
  });

  if (changed) {
    // 检查是否全部完成
    if (state.guideQuests.completed.length >= QUESTS.length) {
      state.guideQuests.allCompleted = true;
    }
    saveState();
  }
}

// 获取当前任务（第一个未完成的）
export function getCurrentQuest() {
  ensureGuideQuests();
  if (state.guideQuests.allCompleted) return null;
  for (const q of QUESTS) {
    if (!state.guideQuests.completed.includes(q.id)) {
      return q;
    }
  }
  // 全部完成
  state.guideQuests.allCompleted = true;
  saveState();
  return null;
}

// 获取进度
export function getQuestProgress() {
  ensureGuideQuests();
  return {
    completed: state.guideQuests.completed.length,
    total: QUESTS.length,
    allCompleted: state.guideQuests.allCompleted
  };
}

// 通过事件触发任务完成检测
// 返回 { completed: quest|null, current: quest|null } 如果刚完成了一个任务
export function checkGuideQuest(event) {
  ensureGuideQuests();
  if (state.guideQuests.allCompleted) return null;

  const current = getCurrentQuest();
  if (!current) return null;

  // 映射事件到 trigger
  let matched = false;

  if (current.trigger === event) {
    matched = true;
  }

  // 特殊处理：q09 的 focus_60min 触发
  if (current.trigger === 'focus_60min' && event === 'focus_complete') {
    if (state.focus.totalMinutes >= 60) {
      matched = true;
    }
  }

  // 特殊处理：q03 需要区分 focus_start 和 focus_complete
  // 如果当前任务是 focus_complete, 但事件是 focus_start, 不匹配
  // 这是正常的，由调用方传入正确的事件名

  if (!matched) return null;

  // 完成任务
  state.guideQuests.completed.push(current.id);

  // 发放奖励
  if (current.rewardCoins > 0) {
    addCoins(current.rewardCoins);
  }
  if (current.rewardAtmo > 0) {
    addAtmosphere(current.rewardAtmo);
  }

  // 检查是否全部完成
  if (state.guideQuests.completed.length >= QUESTS.length) {
    state.guideQuests.allCompleted = true;
  }

  saveState();

  const nextQuest = getCurrentQuest();
  return { completed: current, current: nextQuest, progress: getQuestProgress() };
}

// 全部任务完成（用于 q10 的 all_done 触发）
export function tryCompleteAllDone() {
  ensureGuideQuests();
  if (state.guideQuests.allCompleted) return null;
  const completed = state.guideQuests.completed.length;
  if (completed >= QUESTS.length - 1) {
    // q10 是最后一个，前面 9 个都完成了
    const current = getCurrentQuest();
    if (current && current.id === 'q10') {
      return checkGuideQuest('all_done');
    }
  }
  return null;
}

// 获取所有任务定义（用于 debug 或 UI）
export function getAllQuests() {
  return QUESTS;
}

export { QUESTS };
