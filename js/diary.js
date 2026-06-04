// 墨墨日志模块 —— 纯前端模板拼接，不依赖后端
import { state, saveState } from './state.js';
import { BOOKS } from '../data/books.js';
import { addCoins, addAtmosphere } from './storage.js';

// ========== 三段模板池 ==========

const OPENINGS = {
  focus_complete: [
    '今天主人专注抄写了《{title}》，整整{minutes}分钟。',
    '缮写室的灯亮了起来，主人安静地坐了{minutes}分钟。',
    '墨墨在一旁看着，主人的羽毛笔在《{title}》上沙沙响了{minutes}分钟。',
    '傍晚时分，主人翻开《{title}》，专注了{minutes}分钟。',
    '窗外有风声，但主人专注在《{title}》上，{minutes}分钟一动没动。'
  ],
  focus_abandon: [
    '主人写到一半被叫走了，墨墨把半干的书页小心收好了。',
    '今天专注了{minutes}分钟就被打断了，不过没关系，墨墨等你回来。',
    '羽毛笔还蘸着墨，主人匆匆离开了。墨墨把笔洗干净放好了。'
  ],
  visitor_arrive: [
    '{emoji}{name}今天推门进来了，{title}。',
    '门上铃铛响了——{emoji}{name}来了。{title}。',
    '一阵脚步声，{emoji}{name}轻手轻脚地走进了图书馆。'
  ],
  visitor_borrow: [
    '{emoji}{name}在书架前站了好久，最后借走了《{bookTitle}》。',
    '墨墨看着{emoji}{name}小心翼翼地把《{bookTitle}》装进包里。',
    '"{bookTitle}"——{emoji}{name}说这本书正是她一直在找的。'
  ],
  visitor_return: [
    '{emoji}{name}来还书了，《{bookTitle}》被保护得很好。',
    '《{bookTitle}》回来了，{emoji}{name}还附了一张便签。',
    '{emoji}{name}把《{bookTitle}》轻轻放回柜台，说了声谢谢。'
  ],
  book_complete: [
    // Lv2（首次完成）—— 书脊显名
    '最后一页抄完，《{title}》的书脊上浮现出金色的书名。墨墨歪着头看了好一会儿。',
    '当主人落下最后一笔，《{title}》发出了一阵柔和的微光——这是它被遗忘后第一次被人完整记住。',
    '墨墨鼓起掌来——《{title}》完整地立在书架上了！一只猫头鹰的掌声很轻，但很认真。',
    // Lv3（第二次完成）—— 墨迹加深
    '主人第二遍抄完《{title}》，书页间的墨迹比第一遍更深了。墨墨觉得这本书正在从沉睡里醒来。',
    '《{title}》的第二次誊抄完成了。这次的字迹比上次更稳——墨墨偷偷对比过了。',
    // Lv4（第三次完成）—— 书本回应
    '第三遍《{title}》抄完的时候，书页自动翻到了扉页——像在和主人打招呼。墨墨从横梁上飞下来看了一眼。',
    '当主人合上《{title}》的第三遍誊抄，书脊上的金色不再是浮现——是停留。它已经不只是一本书了。',
    // Lv5（第四次完成）—— 书本成为伙伴
    '第四遍《{title}》。墨墨不再鼓掌了——它在书旁边蹲下来，用翅膀尖碰了碰书脊。这本书已经是图书馆的一部分了。',
    '主人第四遍打开《{title}》的最后一页时，墨墨已经在旁边等着了。它说这本书"闻起来像家了"。',
    // Lv6（第五次完成，满熟练）—— 书本拥有灵魂
    '第五遍《{title}》誊抄完成。书自己在缮写室里发出了一声叹息——不是累，是满足。墨墨说这就是书的"够了"。',
    '最后一笔落下时，整座图书馆的蜡烛都跳了一下。《{title}》的书脊上浮现的不是金色书名——是一道很细很轻的、像呼吸一样的纹路。墨墨在日志上写：今日，一本书活了过来。'
  ],
  milestone: [
    '书架修复度又前进了一大步。墨墨偷偷在主人的桌上放了一颗糖。',
    '今天是个值得记录的日子——累计誊抄突破了{words}字。',
    '看着越来越多的书重新苏醒，墨墨想起很久以前这里曾经的样子。'
  ],
  special_event: [
    '今天发生了一件特别的事：{detail}',
    '墨墨赶紧记下来——{detail}',
    '值得记一笔：{detail}'
  ]
};

const MIDDLES = {
  focus: [
    '连茶凉了都没注意。',
    '羽毛笔写秃了两根。',
    '窗外有只猫盯着看了好一会。',
    '壁炉里的火焰安安静静地跳动着。',
    '月光从破洞的屋顶洒下来，正好照在书页上。',
    '墨墨踮着脚尖在书架间巡视了一圈。',
    '时间过得很慢，又好像很快。'
  ],
  visitor: [
    '她在角落里找了个位置，安安静静地看了起来。',
    '临走前，她回头看了书架一眼才离开。',
    '墨墨给她端了一杯看不见的茶。',
    '她和墨墨聊了几句，说这里让她感觉很安心。'
  ],
  general: [
    '一切都在慢慢变好。',
    '藏书又多了起来。',
    '墨墨感到这座图书馆正在呼吸。'
  ]
};

const DAILY_OPENINGS = [
  '墨墨翻开日志，补记了昨天的馆内活动：',
  '墨墨在烛光下回顾了昨天：',
  '昨天图书馆里发生了这些事，墨墨记下来了：',
  '墨墨整理了一下昨天的记录：'
];

const ENDINGS = [
  '墨墨写于图书馆打烊后。',
  '墨墨合上日志，满意地拍了拍封面。',
  '墨墨把日志放回抽屉，明天再来写。',
  '夜深了，墨墨最后检查了一遍书架才离开。',
  '墨墨觉得今天是很好的一天。',
  '墨墨偷偷在日志角上画了一颗小星星。'
];

// ========== 工具 ==========

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function fill(template, vars) {
  let s = template;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return s;
}

function getDateStr() {
  const now = new Date();
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
}

function getWeather() {
  const weathers = [
    '窗外下着小雨。', '阳光从高窗斜照进来。', '风轻轻吹动着窗帘。',
    '天气有点凉，但馆里很暖和。', '今天的天空是淡金色的。',
    '空气里有旧书页和墨水的气味。', '午后阳光正好。', '黄昏的光线很美。'
  ];
  return pick(weathers);
}

// ========== 日志生成 ==========

export function generateDiaryEntry(type, vars = {}) {
  let openingTemplate;
  if (type === 'book_complete' && vars.mastery) {
    const pool = OPENINGS[type];
    if (!pool) { openingTemplate = pick(OPENINGS.focus_complete); }
    else {
      const lv = Math.min(vars.mastery, 5);
      // Lv2=首次(0-1), Lv3=二次(2-3), Lv4=三次(4-5), Lv5=四次(6-7), Lv6=五次(8-9)
      const tierMap = { 1: [0,1], 2: [0,1], 3: [2,3], 4: [4,5], 5: [6,7], 6: [8,9] };
      const [a, b] = tierMap[lv] || [0,1];
      openingTemplate = pool[Math.floor(Math.random() * (b - a + 1)) + a];
    }
  } else {
    openingTemplate = pick(OPENINGS[type] || OPENINGS.focus_complete);
  }
  const opening = fill(openingTemplate, vars);

  let middleCategory = 'general';
  if (type === 'focus_complete' || type === 'focus_abandon') middleCategory = 'focus';
  else if (type.includes('visitor')) middleCategory = 'visitor';

  const middle = pick(MIDDLES[middleCategory] || MIDDLES.general);
  const ending = pick(ENDINGS);

  const weather = getWeather();
  const date = getDateStr();

  const logNumber = (state.diaryLogs ? state.diaryLogs.length : 0) + 1;
  const log = `📜 墨墨的日志 · 第${logNumber}页\n${date}\n${weather}\n\n${opening}\n${middle}\n\n${ending}`;

  return log;
}

// ========== 存储 ==========

export function addDiaryEntry(type, vars = {}) {
  if (!state.diaryLogs) state.diaryLogs = [];
  const log = generateDiaryEntry(type, vars);
  state.diaryLogs.unshift({
    type,
    text: log,
    time: Date.now()
  });
  // 保留最近 30 条
  if (state.diaryLogs.length > 30) state.diaryLogs.length = 30;

  // 检测装帧升级
  const levelUp = checkDiaryLevelUp();
  if (levelUp) {
    // 延迟显示弹窗，避免与其他 UI 冲突
    setTimeout(() => {
      import('./render/animations.js').then(mod => {
        mod.showDiaryLevelUpPopup(levelUp);
      });
    }, 800);
  }

  return levelUp;
}

export function getDiaryEntries() {
  return state.diaryLogs || [];
}

// ========== 每日回顾 ==========

function addRawEntry(text, type) {
  if (!state.diaryLogs) state.diaryLogs = [];
  state.diaryLogs.unshift({
    type: type || 'daily',
    text,
    time: Date.now()
  });
  if (state.diaryLogs.length > 30) state.diaryLogs.length = 30;
}

export function tryGenerateDailySummary() {
  const now = new Date();
  const today = now.toDateString();

  if (!state.diaryLastSummaryDate) state.diaryLastSummaryDate = '';
  if (state.diaryLastSummaryDate === today) return;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const yesterdayEntries = (state.history || []).filter(h => {
    return new Date(h.time).toDateString() === yesterdayStr;
  });
  if (yesterdayEntries.length === 0) return;

  let focusCount = 0, focusMinutes = 0, focusWords = 0;
  const completedBooks = [];
  const milestones = [];
  const visitorLines = [];

  yesterdayEntries.forEach(h => {
    if (h.type === 'focus') {
      focusCount++;
      const minMatch = h.title.match(/(\d+)\s*分钟/);
      if (minMatch) focusMinutes += parseInt(minMatch[1]);
      const wordMatch = h.detail.match(/([\d,]+)\s*字/);
      if (wordMatch) focusWords += parseInt(wordMatch[1].replace(/,/g, ''));
    } else if (h.type === 'achievement' && h.title.includes('完成')) {
      const titleMatch = h.title.match(/《(.+)》/);
      if (titleMatch) completedBooks.push(titleMatch[1]);
    } else if (h.type === 'milestone') {
      milestones.push(h.title);
    } else if (h.type === 'visitor') {
      visitorLines.push(h.title);
    }
  });

  if (focusCount === 0 && completedBooks.length === 0) return;

  // 组装文本
  const dateStr = `${yesterday.getFullYear()}年${yesterday.getMonth() + 1}月${yesterday.getDate()}日`;
  const weather = getWeather();
  const opening = pick(DAILY_OPENINGS);
  const ending = pick(ENDINGS);
  const logNumber = (state.diaryLogs ? state.diaryLogs.length : 0) + 1;

  let body = `📜 墨墨的日志 · 第${logNumber}页\n${dateStr}\n${weather}\n\n${opening}\n`;

  if (focusCount > 0) {
    body += `\n主人专注了${focusCount}次，一共${focusMinutes}分钟`;
    if (focusWords > 0) body += `，誊抄了${focusWords.toLocaleString()}字`;
    body += '。';
  }

  completedBooks.forEach(title => {
    body += `\n✨ 《${title}》完成了誊抄，书脊上浮现出金色的书名。`;
  });

  milestones.forEach(m => {
    body += `\n${m}`;
  });

  visitorLines.forEach(v => {
    body += `\n${v}`;
  });

  body += `\n\n${ending}`;

  addRawEntry(body, 'daily');
  state.diaryLastSummaryDate = today;
  saveState();
}

// 日志集满30页后的装帧等级
export function getDiaryBindingLevel() {
  const count = (state.diaryLogs || []).length;
  if (count >= 90) return { level: 4, name: '魔法装帧', icon: '✨' };
  if (count >= 60) return { level: 3, name: '皮面精装', icon: '📔' };
  if (count >= 30) return { level: 2, name: '线装布封', icon: '📒' };
  return { level: 1, name: '简装手记', icon: '📓' };
}

// ========== 装帧升级奖励 ==========

const DIARY_LEVEL_REWARDS = {
  2: { coins: 50, atmo: 3 },
  3: { coins: 100, atmo: 5 },
  4: { coins: 200, atmo: 10 },
};

const DIARY_LEVEL_MOMO_SPEECH = {
  2: '墨墨的日志有了个像样的封面！虽然还是布面的，但已经很不错了~',
  3: '皮面精装！墨墨可以挺起胸脯说：这是一本真正的日志了。',
  4: '魔法装帧……连墨墨都没想到能到这一步。谢谢你，馆长。',
};

export function checkDiaryLevelUp() {
  if (!state.diaryLevelRewardsClaimed) state.diaryLevelRewardsClaimed = [];
  const currentLevel = getDiaryBindingLevel().level;
  if (currentLevel > 1 && !state.diaryLevelRewardsClaimed.includes(currentLevel)) {
    state.diaryLevelRewardsClaimed.push(currentLevel);
    const rewards = DIARY_LEVEL_REWARDS[currentLevel];
    if (rewards) {
      addCoins(rewards.coins);
      addAtmosphere(rewards.atmo);
    }
    saveState();
    return {
      level: currentLevel,
      name: getDiaryBindingLevel().name,
      icon: getDiaryBindingLevel().icon,
      rewards: rewards || { coins: 0, atmo: 0 },
      momoSpeech: DIARY_LEVEL_MOMO_SPEECH[currentLevel] || '',
    };
  }
  return null;
}
