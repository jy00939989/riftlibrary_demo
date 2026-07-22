// 引导 UI 渲染 —— 情境引导卡片 + 氛围升级弹窗
import { state } from '../state.js';
import { el } from './common.js';
import { markTutorialSeen } from '../tutorial.js';
import { ATMOSPHERE_STAGES } from '../../data/atmosphere.js';

// 氛围阶段背景图
const STAGE_BG = {
  2: 'visual/background/library_bg_02_ruined.jpg',
  3: 'visual/background/library_bg_03_cozy.jpg',
  4: 'visual/background/library_bg_04_gorgeous.jpg',
  5: 'visual/background/library_bg_05_magnificent.jpg'
};

// 氛围升级叙事文本
const STAGE_NARRATIVES = {
  2: `你合上抄完的最后一页，抬头环顾四周。最大的那个破洞已经被你用旧木板补上了，风不再呼啸着贯穿大厅。你扶正了第三排书架——它虽然漆面斑驳，但至少能站稳了。散落的书籍被归拢、分类，虽然稀疏，但已经是一个像样的书架。黄昏的光从补丁之间漏进来，不再凄惨，反而有点温柔。<br><br><strong>这里不再是被遗忘的废墟，而是一个被守护的地方。</strong>`,
  3: `今天你修补好了最后一片漏雨的瓦。屋顶完整了，雨水不再滴落在书页上。西侧的窗户被重新装上玻璃，光线变得柔软可控。你发现了一间藏在倒塌书架后面的小阅读室——它曾属于某位老馆员，现在它是你的。书架上现在有了七十七本书，每一本你都记得来历。那个流浪诗人第二次来的时候说："这里变了，有了……气息。"<br><br><strong>破败已经退去，尊严正在回来。</strong>`,
  4: `黄铜吊灯终于修好了，温暖的光洒满整个大厅，书架投下的影子不再是恐怖形状，而是沉静的陪伴。地毯换成了干净的编织毯，壁炉里噼啪作响。访客们不再只是借了书就走——他们坐下来，在窗边的老扶手椅上，一读就是一个下午。那只从前避雨的流浪猫现在有了名字，叫"墨水"。<br><br><strong>这里不再只是一个建筑，它成了有人等待、有人归来的地方。</strong>`,
  5: `你几乎认不出这是最初那个废墟了。高耸的书架直达穹顶，螺旋楼梯连接着不同楼层，每个角落都有阅读的空间。访客络绎不绝，却从不喧闹——这里有一种不言而喻的默契，对知识和安静的尊重。有时深夜，当最后一位访客离开，你独自坐在大厅中央，听见书页在轻轻呼吸。<br><br><strong>你守护的东西，如今已能守护更多人。</strong>`
};

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
    <h3 class="font-display text-2xl font-bold mb-2">专注完成！</h3>
    <p class="text-ink-light leading-relaxed mb-3 text-base">
      每次专注誊抄都会获得<strong class="text-magic-gold">智慧之光</strong>——这座图书馆的通用货币，
      用来买书、升级设施。<br>
      完成整本书籍、达成里程碑、访客还书等成就会积累
      <strong class="text-magic-blue">氛围值</strong>——代表图书馆的复苏程度。
      氛围达到一定阶段，图书馆会<strong>发生可见的变化</strong>。
    </p>
    <p class="text-sm text-ink-light mb-4">✨ 连续专注天数越多，成就和惊喜越多</p>
    <button class="px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">知道了 →</button>
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
    <h3 class="font-display text-2xl font-bold mb-2">第一位访客来了！</h3>
    <p class="text-ink-light leading-relaxed mb-3 text-base">
      访客会在图书馆里<strong>浏览书架</strong>，借走你已完成的书。<br>
      还书时他们会带来<strong class="text-magic-gold">智慧之光</strong>、
      <strong class="text-magic-blue">氛围值</strong>，
      还可能触发<strong>特殊事件</strong>——赠书、藏宝图、诗篇……
    </p>
    <p class="text-sm text-ink-light mb-4">☕ 在「读者沙龙」查看访客状态，及时收取归还的书籍</p>
    <button class="px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">去看看 →</button>
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
    <h3 class="font-display text-2xl font-bold mb-2">位面商店</h3>
    <p class="text-ink-light leading-relaxed mb-3 text-base">
      在这里你可以用智慧之光<strong>升级图书馆设施</strong>：
    </p>
    <div class="text-left text-base text-ink-light mb-3 space-y-1">
      <div>🏛️ <strong>借阅区升级</strong> — 增加访客容量，提升还书收益</div>
      <div>🖋️ <strong>缮写室升级</strong> — 提升誊抄速度</div>
      <div>🏺 <strong>馆内装潢</strong> — 植物盆栽、标志牌</div>
      <div>📚 <strong>新书购买</strong> — 解锁更多书籍</div>
    </div>
    <button class="px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">开始探索 →</button>
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
    <h3 class="font-display text-2xl font-bold mb-2">馆长办公室</h3>
    <p class="text-ink-light leading-relaxed mb-3 text-base">
      这里是你的管理中枢，顶部有 5 个子标签：
    </p>
    <div class="text-left text-base text-ink-light mb-3 space-y-1.5">
      <div>📊 <strong>概况</strong> — 图书馆数据总览，氛围进度，修改馆名</div>
      <div>🏆 <strong>成就柜</strong> — 查看已解锁成就和未达成条件</div>
      <div>📦 <strong>收藏室</strong> — 浏览收集品进度</div>
      <div>🏺 <strong>布置</strong> — 植物盆栽、种子库存、标志牌</div>
      <div>📖 <strong>馆长手册</strong> — 随时查阅攻略和常见问题</div>
    </div>
    <button class="px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">知道了 →</button>
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
    <h3 class="font-display text-2xl font-bold mb-2">古籍修复室已开放</h3>
    <p class="text-ink-light leading-relaxed mb-3 text-base">
      这里专门管理<strong>长书分卷</strong>：那些太过厚重、必须拆成多卷誊抄的典籍。
    </p>
    <div class="text-left text-base text-ink-light mb-3 space-y-1.5">
      <div>🧩 <strong>卷组进度</strong> — 查看每套长书的已抄分卷</div>
      <div>✨ <strong>合成典藏版</strong> — 集齐某套长书全部分卷后，可合成完整典藏版</div>
      <div>🔒 <strong>修缮箱</strong> — 锁入珍贵单卷，防止被访客借出或损坏</div>
      <div>📈 <strong>升级修复室</strong> — 提升修复损坏书籍的速度</div>
    </div>
    <button class="px-6 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">去看看 →</button>
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
      <button class="px-8 py-3 bg-magic-gold text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all text-base">继续 →</button>
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
  const stageDef = ATMOSPHERE_STAGES.find(s => s.level === stage);
  const stageName = stageDef ? stageDef.name : '';
  const bgUrl = STAGE_BG[stage];
  const narrative = STAGE_NARRATIVES[stage] || '';

  showUpgradeCard({
    imageUrl: bgUrl,
    badge: '图书馆复苏',
    title: stageName,
    narrative,
    footer: `氛围阶段 ${stage}/5 · ${stageName}`,
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
const FOCUS_LV_NAMES = ['残破', '陋室', '整洁', '明亮', '静雅', '华美', '缮写圣堂'];
const FOCUS_NARRATIVES = {
  1: `你清理出一张旧书桌，摆上一盏蜡烛。虽然桌面坑洼不平，但至少能写字了。窗外依然有风灌进来，但烛火不再摇曳——它稳稳地燃烧着，像一个小小的承诺。从这里开始，每一个字都会被认真对待。`,
  2: `书桌被换成了更宽大的橡木桌，抽屉里整整齐齐地放着羽毛笔、墨水瓶和替换用的羊皮纸。窗户修好了，光线柔和地洒在桌面上，不再刺眼也不再昏暗。这是一个真正的缮写角落了。`,
  3: `缮写室明亮起来。墙上挂着你誊抄过的书籍封面拓印，书架上的参考书随时待命。空气中有淡淡的墨香和旧书的气味——这两种味道混合在一起，构成了"专注"的嗅觉定义。`,
  4: `这里变得安静而庄重。每一样工具都有固定的位置，每一盏灯的亮度都刚好合适。你发现自己在缮写时不自觉地放轻了呼吸——不是紧张，而是因为这里太适合专注了，连呼吸都怕打扰。`,
  5: `缮写室现在是一间艺术品。高窗透进柔和的自然光，藤蔓从窗外垂下，在地板上投下摇曳的影子。来访的客人会在这里驻足，轻声感叹——而你知道，最好的作品还没诞生。`,
  6: `这里不再是缮写室，而是一座缮写圣堂。穹顶上描绘着书卷与星辰的壁画，巨大的圆窗将日月之光引入室内。每一本在这里完成的书，都会在书脊上浮现一道金色纹路——那是圣堂的祝福。`
};

export function showFocusRoomUpgrade(newLevel) {
  const imageUrl = `visual/focusroom/${FOCUS_IMG_NAMES[newLevel]}`;
  const name = FOCUS_LV_NAMES[newLevel] || '';
  const narrative = FOCUS_NARRATIVES[newLevel] || '缮写室变得更加舒适了。';

  showUpgradeCard({
    imageUrl,
    badge: '缮写室升级',
    title: `缮写室 · ${name}`,
    narrative,
    footer: `缮写室 Lv.${newLevel} · 誊抄速度 ${Math.round((1 + newLevel * 0.05) * 100)}%`
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
const READING_LV_NAMES = ['', '陋室', '整洁', '开放', '舒适', '精致', '优雅', '圣所'];
const BORROW_NARRATIVES = {
  1: `你在东侧角落清出一小片区域，放上两把旧椅子和一个矮书架。虽然简陋，但这是图书馆第一次有了"可以坐下来看书"的地方。来访的人终于不用站着翻书了。`,
  2: `书架被重新排列，围出一个半开放的小隔间。你铺上了一块旧地毯，放了几个靠垫。虽然还是很朴素，但已经有"阅读角落"的雏形了——有人在这里坐了一整个下午。`,
  3: `借阅区大幅扩建！你打通了一堵非承重墙，将隔壁的空房间纳入。现在这里能容纳六位读者同时阅览，阳光从新开的窗户洒进来，照亮了书架上的烫金书脊。`,
  4: `舒适的扶手椅替换了硬木凳，每张椅子旁边都有一盏小台灯。角落里多了一台饮水机和一盆绿植。来这里的人越来越多，但空间依然宽裕——布局是花了心思的。`,
  5: `借阅区现在精致得像一间私人书房。书架是定制的深色橡木，窗帘是厚实的天鹅绒，地毯柔软无声。有人在留言簿上写道："这是我待过最舒服的图书馆。"`,
  6: `借阅区变得优雅而从容。高高的拱形窗户让整个空间充满自然光，书架之间的间距足够让人从容穿行。每个座位都是一个小世界——安静、独立、被书籍温柔包围。`,
  7: `借阅区如今被称为"阅读圣所"。两层的挑高空间，穹顶壁画描绘着古代学者和神话场景。螺旋楼梯通往二层的私人阅读隔间。来访者进门时会下意识地放轻脚步——这是对知识的本能尊重。`
};

export function showBorrowAreaUpgrade(newLevel) {
  const imageUrl = `visual/library_readingarea/${READING_IMG_NAMES[newLevel - 1]}`;
  const name = READING_LV_NAMES[newLevel] || '';
  const narrative = BORROW_NARRATIVES[newLevel] || '借阅区变得更加舒适了。';

  showUpgradeCard({
    imageUrl,
    badge: '借阅区升级',
    title: `借阅区 · ${name}`,
    narrative,
    footer: `借阅区 Lv.${newLevel} · 容量提升`
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
