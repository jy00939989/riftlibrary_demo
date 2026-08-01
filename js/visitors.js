// 访客系统 —— 纯逻辑模块，不碰 DOM
import { state, saveState } from './state.js';
import { addCoins, addAtmosphere, addHistory } from './storage.js';
import { BOOKS } from '../data/books.js';
import { addDiaryEntry } from './diary.js';
import { isBookCapacityFull, addToManuscriptBox, createBookRecord, unlockBook } from './capacity.js';
import { getCurationBorrowBonus } from './curation.js';
import { VISITOR_NARRATIVES } from '../data/visitor-events.js';
import { SIGNBOARDS } from '../data/signboards.js';
import { SHARED_POOL } from '../data/book_pool.js';
import { VOLUME_GROUPS, getIncompleteVolumeGroups, isVolumeBookId } from '../data/volume_groups.js';

// ========== 访客角色定义（10位，2026-05-27 重构） ==========

export const VISITOR_DEFS = {
  shenmingyuan: {
    id: 'shenmingyuan',
    name: '沈明远',
    emoji: '👨‍🏫',
    title: '退休文学教授 · 白发圆框眼镜',
    category: ['哲学', '历史', '诗歌'],
    events: ['gift_book'],
    firstImpression: '这里……曾经是一座很好的图书馆。但现在连一张像样的书桌都没有，真是可惜。',
    aura: { name: '学者之风', desc: '哲学/历史/诗歌类誊抄速度 +10%', type: 'speed', category: ['哲学', '历史', '诗歌'], value: 0.10 }
  },
  chengyuan: {
    id: 'chengyuan',
    name: '程远',
    emoji: '💻',
    title: '焦虑程序员 · 中年危机',
    category: ['哲学', '科学', '小说'],
    events: ['anxiety_boost'],
    firstImpression: '这里……比我想象的安静。外面的世界太快了，快得让人喘不过气。',
    aura: { name: '焦虑解药', desc: '连续专注(streak≥2)时誊抄速度 +10%', type: 'streak_speed', value: 0.10 }
  },
  peizhou: {
    id: 'peizhou',
    name: '裴舟',
    emoji: '📚',
    title: '前独立书店老板 · 旧书摊主',
    category: ['小说', '诗歌', '散文'],
    events: ['peizhou_action'],
    firstImpression: '这地方……让我想起我那家关掉的书店。书是好书，但缺了点人气。',
    aura: { name: '书商嗅觉', desc: '商店买书 9 折', type: 'shop_discount', value: 0.10 }
  },
  jianan: {
    id: 'jianan',
    name: '简安',
    emoji: '📋',
    title: '基层公务员 · 公文背面写小说',
    category: ['小说', '历史', '散文'],
    events: ['novel_draft'],
    firstImpression: '原来公文背面还可以写小说……这里让我想起大学时通宵读书的日子。',
    aura: { name: '公文背面', desc: '每次专注智慧之光 +15%', type: 'focus_coins', value: 0.15 }
  },
  jiangyoushu: {
    id: 'jiangyoushu',
    name: '江有树',
    emoji: '🎓',
    title: '待业大学生 · 全职儿女',
    category: ['哲学', '小说', '诗歌'],
    events: ['resume_boost'],
    firstImpression: '比学校图书馆破多了……但书比学校多了几百万字的沉默。',
    aura: { name: '年轻气盛', desc: '缮写室升级消耗 -5%', type: 'focus_discount', value: 0.05 }
  },
  guyu: {
    id: 'guyu',
    name: '谷雨',
    emoji: '🌾',
    title: '农村初中女孩 · 野花标本收藏家',
    category: ['童话', '寓言', '诗歌'],
    events: ['wildflower_gift'],
    firstImpression: '这里的书比我村小的多好多……我可以每天都来吗？',
    aura: { name: '野花的力量', desc: '植物成长速度 +30%（技术债：植物系统待改）', type: 'plant_growth', value: 0.30 }
  },
  qiaoyiyi: {
    id: 'qiaoyiyi',
    name: '乔一一',
    emoji: '🎨',
    title: '叛逆富家少女 · 自绘藏书票',
    category: ['小说', '诗歌', '戏剧'],
    events: ['bookplate'],
    firstImpression: '切，比我家的书房破多了……不过比我家有人味。',
    aura: { name: '叛逆灵感', desc: '还书好感度 +30%', type: 'return_favor', value: 0.30 }
  },
  xierugui: {
    id: 'xierugui',
    name: '谢如归',
    emoji: '🏭',
    title: 'I人富二代 · 家族工厂继承人',
    category: ['历史', '传记', '哲学'],
    events: ['reading_note'],
    firstImpression: '这里……很安静。比工厂的办公室舒服多了。',
    aura: { name: '继承者', desc: '访客容量临时 +1', type: 'visitor_cap', value: 1 }
  },
  xiachan: {
    id: 'xiachan',
    name: '夏蝉',
    emoji: '💃',
    title: '大龄练习生 · 追梦第十年',
    category: ['诗歌', '小说', '散文'],
    events: ['lyric_drop'],
    firstImpression: '哇，这个灯光好有氛围！像我们排练室的后台——不过是书版的。',
    aura: { name: '舞台之光', desc: '专注中随机飘歌词 + 访客到来概率 +15%', type: 'visual_spawn', value: 0.15 }
  },
  wangxiaolei: {
    id: 'wangxiaolei',
    name: '王小磊',
    emoji: '📦',
    title: '快递员诗人 · 波浪线诗笺',
    category: ['诗歌', '小说', '散文'],
    events: ['wave_poem'],
    firstImpression: '这地方好……等红灯的时候我总想找地方写东西，这里刚好。',
    aura: { name: '波浪诗笺', desc: '还书获得诗笺，集齐10张解锁王小磊诗集', type: 'poem_collect', value: 10 }
  }
};

// ========== 还书语录池 ==========

const RETURN_QUOTES = {
  shenmingyuan: {
    book: [
      '《{book}》……好书。我教了四十年文学，这本书每年重读都有新的感悟。',
      '这本《{book}》的批注我写了三页纸。有些句子值得反复咀嚼。',
      '《{book}》让我想起在牛津访学的日子。那图书馆的穹顶很高，但灵魂是一样的。'
    ],
    library: [
      '这图书馆越来越有样子了——虽然离它全盛时期还差得远，但灵魂已经回来了。',
      '废墟不可怕，可怕的是无人问津。有人翻书的地方，就是圣殿。'
    ],
    personal: [
      '退休那天，学生们送了我一本手抄的诗集。那是我这辈子收到的最珍贵的礼物。',
      '哲学不是用来学的，是用来活的。我花了六十年才明白这个道理。'
    ]
  },
  chengyuan: {
    book: [
      '《{book}》让我在深夜找到了比刷手机更好的逃避方式。',
      '读这本《{book}》的时候，我第一次觉得慢下来不是犯罪。'
    ],
    library: [
      '这里的安静和公司的安静不一样——公司的安静里有恐惧，这里没有。',
      '如果办公室有这里一半的氛围，我的焦虑症可能早就好了。'
    ],
    personal: [
      '亲眼看到两轮AI裁员之后，我开始读斯多葛哲学。控制能控制的，接受不能控制的。',
      '35岁之后投简历，回复率不到十分之一。但读书不会拒绝你。'
    ]
  },
  peizhou: {
    book: [
      '《{book}》——品相不错。好书应该去有人的地方，这是我最深的信念。',
      '这本《{book}》让我想起我书店里最后一本卖掉的书。那个顾客是个教书的。'
    ],
    library: [
      '你这儿比我那家书店有前途——书店要租金，图书馆只需要书和人气。',
      '书脊朝外摆，别堆着。我在书店行业学的唯一真理：书要能被看见。'
    ],
    personal: [
      '关店那天我没哭。但看到最后一箱书被拉走的时候，我在路边站了很久。',
      '电商可以卖书，但它卖不了你从书架上拿起一本书时的那种偶然。'
    ]
  },
  jianan: {
    book: [
      '《{book}》——我在公文背面记了两页笔记。正面是会议纪要，背面才是我自己。',
      '这本《{book}》让我想起大学时通宵读书的日子。那时候觉得未来什么都有可能。'
    ],
    library: [
      '如果能在这里办公就好了——我是说，如果公文也能在这样的地方写。',
      '图书馆比办公室安静，但比家里热闹。恰恰好的程度。'
    ],
    personal: [
      '基层八年，写过的公文能装满一面墙。但背面写的小说和剧本只有我自己记得。',
      '有时候我觉得，公文背面的那几行字，才是我真正想说的——不是诗，是我虚构的另一些人生。',
        '别人以为我喜欢的是这份铁饭碗。我很感恩——但铁饭碗端久了手会麻。背面写故事的时候，手不麻。'
    ]
  },
  jiangyoushu: {
    book: [
      '《{book}》比我想象的好看。学校没教过这本，我自己也不会去找。',
      '我在《{book}》里划了好多线——比刷短视频有用多了。'
    ],
    library: [
      '这里比学校图书馆舒服。学校图书馆有deadline的味道，这里没有。',
      '如果可以在这里投简历就好了——至少被拒的时候旁边有本书可以翻。'
    ],
    personal: [
      '每次亲戚问"找到工作了吗"，我就想躲到这里来。书不会问这种问题。',
      '专科的简历很多公司看都不看。但读了《庄子》之后，我觉得他们错过的是个人才。'
    ]
  },
  guyu: {
    book: [
      '《{book}》太好看了！！我给我们班同学讲了里面的故事，他们都说好！！',
      '这本《{book}》里夹了一朵野花——是我从村口采的！紫色的那种！不知道叫什么名字但很好看！！'
    ],
    library: [
      '这里的书比我村小的书架多了好多好多倍！！好多好多！！我可以每天都来吗？',
      '墙上那些画真好看！！我以后也想学画画，给我们村小画一个图书馆——墙要刷成黄色的！！'
    ],
    personal: [
      '我弟弟不用读书，家里说男娃以后出去打工就行。但我觉得他也应该看看这些书！！奶奶说她年轻的时候也喜欢看书——后来没书看了。现在又有了！！',
      '老师说女孩子读太多书没用。但我在书上读到了好多好多人——她们都是女孩子！！有一个还骑着马自己走了！！不用王子！！'
    ]
  },
  qiaoyiyi: {
    book: [
      '《{book}》——我画了张藏书票塞在书里了。原封面丑得我手痒，但书没得罪我，所以只动了张纸。不用谢。',
      '这本《{book}》让我哭了一整晚。不是因为有人死了——是因为终于有人把我说不出来的话说出来了。算了，太矫情了，当我没说。'
    ],
    library: [
      '比我家书房破多了——但至少在这里看书不会被问"你在读什么没用的东西"。切。',
      '这里没有监控吧？我在家的时候我妈会用iPad看我在房间干什么。这里连WiFi都没有——反而挺好的。随便坐哪儿都行。'
    ],
    personal: [
      '我妈说"为你好"——这三个字是我这辈子听过最多的废话。她从来没问过我在读什么书。算了。反正她也不会看。',
      '染头发不是因为叛逆——是因为我不想看起来像个可以被随便安排的洋娃娃。蓝头发就是我的"别碰我"标签。'
    ]
  },
  xierugui: {
    book: [
      '《{book}》——战略纵深远超预期。已纳入个人阅读组合的"核心持仓"。建议与《孙子兵法》做交叉分析。谢如归',
      '对《{book}》完成了SWOT初步分析。结论：此书在"思想密度"维度显著优于同类读物。推荐指数：A。谢如归'
    ],
    library: [
      '环境变量评估：噪音≈0，光照适宜，桌椅高度比办公室合理。推荐缮写室靠窗位置——阅读效率提升约40%。谢如归',
      '如果董事会的座位按这里排列——每人一把旧椅子，没有主位——决议质量可能提升。待观察。谢如归'
    ],
    personal: [
      '父亲认为"温和"是负资产。我的数据分析不支持这个结论。历史上最有效的领导者中，温和型占比高于强硬型。结论：数据比父亲对。谢如归',
      '继承不是复制。我对我爸说：我不会成为你——但我可以不成为你，同时也不成为一个废物。这是我能给出的最优解。谢如归'
    ]
  },
  xiachan: {
    book: [
      '《{book}》——有一页我读了三遍。不是没看懂，是不想让它结束。今天练到第十三遍，读这段的时候，和跳到第十四遍同一个动作的感觉是一样的。',
      '给《{book}》找了段副歌。第三遍的时候对了。前面两遍不是白费——第一遍告诉我调太高，第二遍告诉我词太密。第三遍，刚刚好。'
    ],
    library: [
      '缮写室穹顶下面我偷偷试过音。回声大概1.8秒。练功房的回声是0.6秒。专业数据。这意味着在这里唱长音，尾音会比练功房多飘一秒多。一秒多，够一个音找到家了。',
      '练功房关了之后我就来这里。书的陪伴和镜子的陪伴不一样——镜子只给你自己，书给你所有人。所有人的意思不是热闹，是你翻开任何一页都有人在。'
    ],
    personal: [
      '二十三岁。练习生行业的标准答案是"老了"。我给自己的答案是：刚好。刚好够成熟，刚好够勇敢。刚好够把"老了"翻译成"出道第一年"。',
      '换过三家公司，参加了两档选秀。同期姐妹有的转了幕后，有的去了直播。第十二次想过放弃。第十三次没有。不是因为坚持——是因为第十二次之后的那天早上，闹钟响了，身体自己去了练功房。歌已经不需要脑子决定继不继续了。'
    ]
  },
  wangxiaolei: {
    book: [
      '《{book}》——我在等红灯的时候读了三页。后面的车按喇叭，我没理。',
      '我把《{book}》里最喜欢的那句话抄在了便签纸上。署名画了一道波浪线。'
    ],
    library: [
      '送快递的时候我经过了十七家书店。但只有这家图书馆的门是对我开着的。',
      '这座图书馆的风里有纸的味道——不是快递单的纸，是老书的纸。'
    ],
    personal: [
      '我的便签上从不写名字，只画一道波浪线。有人在读者群里叫我"波浪先生"。',
      '一天跑80单，爬楼梯的时候改句子。腿在送快递，脑子在写诗。'
    ]
  }
};

// ========== 氛围阶段突破见证文案 ==========

export const STAGE_WITNESS = {
  shenmingyuan: {
    2: '总算不漏风了。我在牛津访学时认识的老馆长说过：一座图书馆的起点，不是第一本书，是第一个愿意修补它的人。',
    3: '这些老书架比我在大学时用的还结实。裂纹是岁月的签名，不是缺陷。',
    4: '壁炉里的火自己燃起来了……有意思。真正的学问就是这样——积累到一定程度，就会产生自己的温度。',
    5: '我用了四十年才明白：图书馆不是用来存放书的，是用来存放人的。你看这些星光——每一颗都是一个曾经在这里读过书的人留下的。'
  },
  chengyuan: {
    2: '代码重构第一个阶段也是这样的——把最烂的部分修到能跑。你们的进度比我们公司快多了。',
    3: '这个安静的程度……如果在办公室能有这一半就好了。不是噪音的问题，是恐惧的问题。',
    4: '火生起来的时候，人会比较容易觉得自己不是废物。我不知道为什么，但就是这样的。',
    5: '这星光比任何IDE的暗色主题都好看。真的。我可能该少说点丧气话了。'
  },
  peizhou: {
    2: '书架站起来了！我那时候关店的前一晚，一个人在空书架中间站了很久。没等到今天这种好事。',
    3: '书脊朝外摆，别堆着。你这儿比我有前途——书店要交租金，图书馆只需要书和人气。',
    4: '暖了。书和读者之间最好的距离就是这种温度——不冷不热，刚好翻开。',
    5: '我开书店的时候一直想象不到天堂长什么样。现在我大概知道了。就是有星光从书架间漏下来的样子。'
  },
  jianan: {
    2: '比我们单位刚搬进临时办公室的时候好多了。那次连天花板都没有，头顶就是通风管。',
    3: '这里的桌子比我办公桌舒服。不是木头的问题——是我那张桌子压了太多不会有人看的报告。',
    4: '公文背面的小说，在这里——应该能摊在正面写了吧。',
    5: '如果有一天我辞了职，就天天来这里抄书。星光下的缮写室，比任何一个会议室都像办公室。'
  },
  jiangyoushu: {
    2: '至少不塌了。比我投出去的简历回复率高多了——我是说，至少有变化。',
    3: '我已经在图书馆待了……算了不数了。这里比学校图书馆舒服，没有deadline的味道。',
    4: '暖和了。我在出租房里开着电热毯改简历的时候也是这个温度，但没有书架。',
    5: '投出去的简历石沉大海。但看着这星光，我忽然觉得——也不是非要一份工作才能证明自己。'
  },
  guyu: {
    2: '哇！！那个大洞补上了！！我们村小的教室也有洞，下雨天要挪桌子——这里补得比我们学校快！！好厉害！！',
    3: '墙上有颜色了！！像彩虹但又不是彩虹——哦对，是彩色玻璃映的！！我从没见过真的彩色玻璃！！太好看了！！',
    4: '好暖和！！像烧炕但不呛人！奶奶说冬天烧炕的时候要把脚放在最热的地方——这里到处都是最热的地方！！',
    5: '老师说女孩子读太多书没用。但你看——读过的书变成了星星！！老师没说对！！星星就是有用的！！'
  },
  qiaoyiyi: {
    2: '哼哼，开始有点像样了。不过比我家书房还差得远——当然，你家没有我妈在旁边问"你在读什么没用的东西"。切。',
    3: '彩色玻璃……啧。我终于知道为什么教堂要用这种东西了。不是为了神，是为了让人觉得自己可以不那么渺小。好了不说了，太矫情了。',
    4: '壁炉自己点着了。比我家的新风系统有温度——那个只会吹干我的画。这里不会。随便吧，还行。',
    5: '染头发不是因为叛逆，是因为我不想看起来像个可以被随便安排的洋娃娃。这星光也是——每一颗颜色都不一样。谁也不安排谁。哼，挺好的。'
  },
  xierugui: {
    2: '结构稳定性达标。工厂的厂房加固报告我看过很多份——这是第一份我愿意在"结论"栏写"满意"的。谢如归',
    3: '环境评估：噪音≈0，光照适宜，座椅舒适度良好。如果董事会会议室能达到同等隔音水平，决议通过率预计提升15%-20%。谢如归',
    4: '壁炉自燃现象值得记录。不需外部触发，不需维护干预——可持续运转。如果企业也能达到这个自动化程度……结论：目前还不能。但值得参考。谢如归',
    5: '横向对比：商学院提供的案例研究，没有一个能复现这座图书馆的成长曲线。变量太多，但结果正确。结论：有些东西不适用SWOT——但不等于不值得投资。谢如归'
  },
  xiachan: {
    2: '补洞的速度比我学一支新舞还快。不过也对——修房子不用压腿。第六支舞我压了三个月才过。这个洞，三天。',
    3: '灯光。凌晨五点的练功房也是这个光——不是舞台光，是清洁工还没关的走廊灯透过门缝漏进来的那种。在这里，它从门缝变成了穹顶。',
    4: '暖了。以前只有练功房的把杆是暖的——手汗捂热的。现在整个缮写室都是暖的。姐妹们问我还在这行干嘛。她们不知道，能让人暖起来的地方，歌就不会死。',
    5: '二十三岁在练习生行业算老。但二十三岁在星光下跳舞——"老"是个计时方式，不是个形容词。我用"刚好"。刚好够成熟，刚好够勇敢。'
  },
  wangxiaolei: {
    2: '嗯。我送快递的时候见过很多被遗忘的角落。能被人修起来的，不多。',
    3: '安静。比我等红灯的时候还安静——但那种安静里有后面的车在按喇叭，这里没有。',
    4: '暖和了。我把便签纸放在壁炉旁边烤了烤。字写在热纸上，有一种特别的快感。',
    5: '一天跑80单，爬楼梯的时候改句子。现在不用爬楼梯了，星光会把句子送到纸上。我只需要坐下来。'
  }
};

// ========== 内部工具 ==========

export function pickReturnQuote(charId, bookTitle, atmosphere) {
  const pool = RETURN_QUOTES[charId];
  if (!pool) return '谢谢。';

  // 选择语录类型：40% 聊书 / 30% 聊图书馆 / 30% 聊自己
  const roll = Math.random();
  let type = 'book';
  if (roll > 0.7) type = 'personal';
  else if (roll > 0.4) type = 'library';

  const quotes = pool[type] || pool.book;
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  return quote.replace('{book}', bookTitle || '这本书');
}

const POEMS = [
  '风从远方来，翻开书中某一页，像你的手拂过我的眉间。',
  '书架之间的光柱中，尘埃舞蹈。每一粒都是被遗忘的故事。',
  '墨水在黄纸上晕开，如同夜雾笼罩湖面。这本书记录了谁的梦？',
  '月光斜照进窗棂，照亮旧书上褪色的烫金。古老的字迹低声诉说。',
  '时间是一条河，书籍是漂在河上的纸船，不知会停在谁的手中。',
  '翻书的声音是世上最美妙的音乐，每一页都在等待知音。'
];

// ========== 神秘书籍池（沈明远专属） ==========

// 沈明远专属书池 —— 全是真实可抄的书
const SHENMINGYUAN_BOOKS = ['book_010', 'book_021', 'book_022'];

// ========== 借阅区等级配置表 ==========

export const BORROW_LEVEL_TABLE = [
  null, // 索引0占位(Lv0)
  { cap:2, returnCoins:30, favorBonus:0,  returnAtmo:1, spawnBonus:0.05 },  // Lv1 陋室
  { cap:3, returnCoins:35, favorBonus:10, returnAtmo:1, spawnBonus:0.08 },  // Lv2 整洁
  { cap:6, returnCoins:40, favorBonus:20, returnAtmo:3, spawnBonus:0.12 },  // Lv3 开放
  { cap:7, returnCoins:45, favorBonus:30, returnAtmo:3, spawnBonus:0.16 },  // Lv4 舒适
  { cap:8, returnCoins:50, favorBonus:40, returnAtmo:5, spawnBonus:0.20 },  // Lv5 精致
  { cap:9, returnCoins:55, favorBonus:50, returnAtmo:5, spawnBonus:0.25 },  // Lv6 优雅
  { cap:10,returnCoins:60, favorBonus:60, returnAtmo:8, spawnBonus:0.30 }   // Lv7 圣所
];

export function getBorrowLevelConfig() {
  const lv = state.library.borrowLevel || 0;
  return BORROW_LEVEL_TABLE[lv] || { cap:1, returnCoins:30, favorBonus:0, returnAtmo:0 };
}

export function getVisitorCap() {
  return getBorrowLevelConfig().cap + getAuraVisitorCapBonus();
}

export function getBorrowSpawnBonus() {
  return getBorrowLevelConfig().spawnBonus || 0;
}

// ========== 光环引擎 ==========

export function getActiveBrowsingVisitors() {
  return state.visitors.filter(v => v.status === 'browsing');
}

export function getActiveAuras() {
  return getActiveBrowsingVisitors()
    .map(v => VISITOR_DEFS[v.charId])
    .filter(def => def && def.aura)
    .map(def => def.aura);
}

export function getAuraSpeedBonus(bookCategory) {
  let bonus = 0;
  const visitors = getActiveBrowsingVisitors();
  for (const v of visitors) {
    const def = VISITOR_DEFS[v.charId];
    if (!def || !def.aura) continue;
    const a = def.aura;
    // 沈明远：分类匹配速度加成
    if (a.type === 'speed' && a.category && bookCategory && a.category.includes(bookCategory)) {
      bonus += a.value;
    }
    // 程远：连续专注加成
    if (a.type === 'streak_speed' && (state.focus.streak || 0) >= 2) {
      bonus += a.value;
    }
  }
  return bonus;
}

export function getAuraCoinsMultiplier() {
  const visitors = getActiveBrowsingVisitors();
  for (const v of visitors) {
    const def = VISITOR_DEFS[v.charId];
    if (def && def.aura && def.aura.type === 'focus_coins') return def.aura.value;
  }
  return 0;
}

export function getAuraShopDiscount() {
  const visitors = getActiveBrowsingVisitors();
  for (const v of visitors) {
    const def = VISITOR_DEFS[v.charId];
    if (def && def.aura && def.aura.type === 'shop_discount') return def.aura.value;
  }
  return 0;
}

export function getAuraFocusUpgradeDiscount() {
  const visitors = getActiveBrowsingVisitors();
  for (const v of visitors) {
    const def = VISITOR_DEFS[v.charId];
    if (def && def.aura && def.aura.type === 'focus_discount') return def.aura.value;
  }
  return 0;
}

export function getAuraVisitorCapBonus() {
  const visitors = getActiveBrowsingVisitors();
  for (const v of visitors) {
    const def = VISITOR_DEFS[v.charId];
    if (def && def.aura && def.aura.type === 'visitor_cap') return def.aura.value;
  }
  return 0;
}

export function getAuraSpawnBonus() {
  const visitors = getActiveBrowsingVisitors();
  for (const v of visitors) {
    const def = VISITOR_DEFS[v.charId];
    if (def && def.aura && def.aura.type === 'visual_spawn') return def.aura.value;
  }
  return 0;
}

export function getAuraPoemCollect() {
  const visitors = getActiveBrowsingVisitors();
  for (const v of visitors) {
    const def = VISITOR_DEFS[v.charId];
    if (def && def.aura && def.aura.type === 'poem_collect') return true;
  }
  return false;
}

export function getAuraPlantGrowth() {
  const visitors = getActiveBrowsingVisitors();
  for (const v of visitors) {
    const def = VISITOR_DEFS[v.charId];
    if (def && def.aura && def.aura.type === 'plant_growth') return def.aura.value;
  }
  return 0;
}

export function getAuraReturnFavorBonus() {
  const visitors = getActiveBrowsingVisitors();
  for (const v of visitors) {
    const def = VISITOR_DEFS[v.charId];
    if (def && def.aura && def.aura.type === 'return_favor') return def.aura.value;
  }
  return 0;
}

// ========== 裴舟推销书籍池 ==========

// ========== 内部工具 ==========

let visitorIdCounter = Date.now();
function nextVisitorId() { return 'v_' + (visitorIdCounter++).toString(36); }
function nextBorrowId() { return 'br_' + (visitorIdCounter++).toString(36); }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getNow() {
  return window.__dev && window.__dev.getNow ? window.__dev.getNow() : Date.now();
}

const ALL_VISITOR_IDS = Object.keys(VISITOR_DEFS);

// 好感度上限与叙事阈值（ADR-FAVOR-001）
const FAVOR_CAP = 600;
export const FAVOR_THRESHOLDS = {
  OCCASIONAL: 120,
  RARE: 280,
  POST_RARE: 560
};

function addVisitorFavor(charId, amount) {
  if (!state.visitorFavors) {
    state.visitorFavors = {};
    ALL_VISITOR_IDS.forEach(id => { state.visitorFavors[id] = 0; });
  }
  if (state.visitorFavors[charId] !== undefined) {
    state.visitorFavors[charId] = Math.min(FAVOR_CAP, state.visitorFavors[charId] + amount);
  }
}

// ========== 访客刷新加权（ADR-FAVOR-001） ==========

const SPAWN_WEIGHT = {
  NEVER_SEEN: 8,   // 从未见过的访客强推倍率
  BASE: 1,
  K: 120,          // 软衰减常数，对齐偶层阈值
  FLOOR: 0.1       // 已建立访客的最低权重
};

function getSpawnWeight(charId) {
  const favor = state.visitorFavors?.[charId] || 0;
  if (favor <= 0) return SPAWN_WEIGHT.NEVER_SEEN;
  return Math.max(SPAWN_WEIGHT.FLOOR,
                  SPAWN_WEIGHT.BASE / (1 + favor / SPAWN_WEIGHT.K));
}

function weightedPick(ids, weightFn) {
  let total = 0;
  const weights = ids.map(id => { const w = weightFn(id); total += w; return w; });
  if (total <= 0 || !Number.isFinite(total)) return pick(ids);
  let r = Math.random() * total;
  for (let i = 0; i < ids.length; i++) {
    r -= weights[i];
    if (r <= 0) return ids[i];
  }
  return ids[ids.length - 1];
}

// ========== 访客刷新 ==========

export function spawnVisitor(targetCharId) {
  const browsing = state.visitors.filter(v => v.status === 'browsing');
  if (browsing.length >= getVisitorCap()) return null;

  let charId = targetCharId;
  if (!charId || !VISITOR_DEFS[charId]) {
    // 避免同一角色已在馆时重复生成，导致多个光环叠加
    const presentCharIds = new Set(state.visitors.map(v => v.charId));
    const charIds = Object.keys(VISITOR_DEFS).filter(id => !presentCharIds.has(id));
    if (charIds.length === 0) return null;
    charId = weightedPick(charIds, getSpawnWeight);
  }
  const def = VISITOR_DEFS[charId];

  const visitor = {
    id: nextVisitorId(),
    charId,
    name: def.name,
    emoji: def.emoji,
    title: def.title,
    status: 'browsing',
    bookId: null,
    bookTitle: null,
    arriveTime: getNow(),
    borrowTime: null,
    dueTime: null,
    eventTriggered: false,
    favorability: 0
  };

  state.visitors.push(visitor);
  saveState();
  addHistory('visitor', `${def.emoji} ${def.name} 来到图书馆`, def.title);
  if (!state.diaryFirsts.visitorArrive) {
    state.diaryFirsts.visitorArrive = true;
    addDiaryEntry('visitor_arrive', { emoji: def.emoji, name: def.name, title: def.title });
  }
  return visitor;
}

export function removeVisitor(visitorId) {
  const idx = state.visitors.findIndex(v => v.id === visitorId);
  if (idx === -1) return false;
  state.visitors.splice(idx, 1);
  saveState();
  return true;
}

export function getVisitorDef(charId) {
  return VISITOR_DEFS[charId] || null;
}

// ========== 借书逻辑 ==========

export function tickVisitorBrowsing(now) {
  const blvCfg = getBorrowLevelConfig();
  const cap = Math.max(blvCfg.cap, 1); // Lv0 保底 1 人容量

  state.visitors.forEach(visitor => {
    if (visitor.status !== 'browsing') return;

    // 浏览中缓慢增加好感度（含等级加成）
    const browseFavor = Math.round(1 * (1 + blvCfg.favorBonus / 100));
    visitor.favorability = (visitor.favorability || 0) + browseFavor;
    addVisitorFavor(visitor.charId, browseFavor);

    // 每次 tick 实时计算可用书籍（避免同一 tick 内多个访客借走同一本书）
    const completedBooks = getCompletedBooks();
    if (completedBooks.length === 0) return;

    // 浏览随机时长后尝试借书（简化：每次 tick 有 40% 概率借书 + 策展加成）
    const borrowChance = 0.4 + getCurationBorrowBonus();
    if (Math.random() > borrowChance) return;

    attemptBorrow(visitor, completedBooks, now);
  });
}

function getCompletedBooks() {
  return Object.values(BOOKS).filter(book => {
    const bs = state.books[book.id];
    const inRestoration = (state.restorationBox || []).includes(book.id);
    return bs && bs.status === 'completed' && !bs.damaged && !inRestoration &&
           !state.visitors.some(v => v.bookId === book.id && (v.status === 'borrowed' || v.status === 'due'));
  });
}

function attemptBorrow(visitor, completedBooks, now) {
  const def = VISITOR_DEFS[visitor.charId];

  // 偏好匹配优先
  let candidates = completedBooks;
  if (def.category && def.category.length > 0) {
    const preferred = completedBooks.filter(b => def.category.includes(b.category));
    if (preferred.length > 0) {
      candidates = preferred;
    }
  }

  const book = pick(candidates);
  if (!book) return;

  const bookWords = book.totalWords || 28000;
  // 还书时间：3小时 ~ 120小时（5天），每2500字=1小时，大部头拉出层次
  const borrowHours = Math.max(3, Math.min(120, Math.round(bookWords / 2500)));
  const dueTime = now + borrowHours * 3600000;

  visitor.status = 'borrowed';
  visitor.bookId = book.id;
  visitor.bookTitle = book.volumeTitle || book.title;
  visitor.borrowTime = now;
  visitor.dueTime = dueTime;
  const borrowFavor = Math.round(3 * (1 + getBorrowLevelConfig().favorBonus / 100));
  visitor.favorability = (visitor.favorability || 0) + borrowFavor;
  addVisitorFavor(visitor.charId, borrowFavor);

  const displayTitle = book.volumeTitle || book.title;
  addHistory('visitor', `${visitor.emoji} ${visitor.name} 借走了《${displayTitle}》`,
    `${borrowHours}小时后归还 · 好感+3`);
  if (!state.diaryFirsts.visitorBorrow) {
    state.diaryFirsts.visitorBorrow = true;
    addDiaryEntry('visitor_borrow', { emoji: visitor.emoji, name: visitor.name, bookTitle: displayTitle });
  }
  saveState();
}

// ========== 还书到期检查 ==========

export function checkDueVisitors(now) {
  const dueList = [];
  state.visitors.forEach(visitor => {
    if (visitor.status === 'borrowed' && visitor.dueTime && now >= visitor.dueTime) {
      visitor.status = 'due';
      dueList.push(visitor);
      addHistory('visitor', `${visitor.emoji} ${visitor.name} 已读完《${visitor.bookTitle}》`, '等待收取');
    }
  });
  if (dueList.length > 0) saveState();
  return dueList;
}

// ========== 访客叙事引擎（三层递进） ==========

export function getNarrativeState(charId) {
  if (!state.visitorNarratives) {
    state.visitorNarratives = {};
  }
  if (!state.visitorNarratives[charId]) {
    state.visitorNarratives[charId] = {
      commonTriggered: [],
      occasionalCompleted: [],
      rareTriggered: false,
      rareEligibleCount: 0,
      postRareTriggered: false,
      postRareCommonTriggered: [],
      postRareOccasionalCompleted: [],
      expansionLevel: 0
    };
  }
  return state.visitorNarratives[charId];
}

function getAvailableCommonEvents(charId) {
  const narrative = VISITOR_NARRATIVES[charId];
  if (!narrative || !narrative.common) return [];
  const ns = getNarrativeState(charId);
  let pool = [...narrative.common.base];
  if (ns.expansionLevel >= 1) pool.push(...(narrative.common.expand1 || []));
  if (ns.expansionLevel >= 2) pool.push(...(narrative.common.expand2 || []));
  return pool;
}

function pickCommonEvent(charId) {
  const pool = getAvailableCommonEvents(charId);
  if (pool.length === 0) return null;
  const ns = getNarrativeState(charId);
  // 避开最近 3 条已触发的，保证轮换新鲜感
  const recent = ns.commonTriggered.slice(-3);
  const candidates = pool.filter(e => !recent.includes(e.id));
  const chosen = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : pool[Math.floor(Math.random() * pool.length)];
  ns.commonTriggered.push(chosen.id);
  // 只保留最近 20 条记录，防止数组膨胀
  if (ns.commonTriggered.length > 20) {
    ns.commonTriggered = ns.commonTriggered.slice(-20);
  }
  return chosen;
}

function pickOccasionalEvent(charId) {
  const narrative = VISITOR_NARRATIVES[charId];
  if (!narrative || !narrative.occasional) return null;
  const ns = getNarrativeState(charId);
  const next = narrative.occasional.find(o => !ns.occasionalCompleted.includes(o.id));
  if (!next) return null;
  ns.occasionalCompleted.push(next.id);
  // 首次偶层解锁 → 常层扩容
  if (ns.occasionalCompleted.length === 1 && ns.expansionLevel < 1) {
    ns.expansionLevel = 1;
  }
  return next;
}

function triggerNarrative(charId) {
  const narrative = VISITOR_NARRATIVES[charId];
  if (!narrative) return null;

  const ns = getNarrativeState(charId);
  const result = { common: null, occasional: null, rare: null, postRare: null, postRareCommon: null, postRareOccasional: null };
  const favor = state.visitorFavors?.[charId] || 0;

  // 1. 常层：每次还书必然触发
  result.common = pickCommonEvent(charId);

  // 2. 偶层：好感≥FAVOR_THRESHOLDS.OCCASIONAL 且 有未完成的偶层事件 → 30% 概率
  const allOccDone = narrative.occasional
    ? ns.occasionalCompleted.length >= narrative.occasional.length
    : true;
  if (favor >= FAVOR_THRESHOLDS.OCCASIONAL && !allOccDone && Math.random() < 0.30) {
    result.occasional = pickOccasionalEvent(charId);
    if (result.occasional) {
      // 发放偶层奖励
      const r = result.occasional.reward;
      if (r) {
        if (r.coins) addCoins(r.coins);
        if (r.atmosphere) addAtmosphere(r.atmosphere);
      }
      addHistory('event', `🌸 ${result.occasional.title}`,
        `${VISITOR_DEFS[charId]?.emoji || ''} ${VISITOR_DEFS[charId]?.name || charId}在还书中留下了一份特别的礼物`);
      addDiaryEntry('special_event', { detail: `${result.occasional.title} —— ${result.occasional.text}` });
    }
  }

  // 3. 稀层：偶层全完成 + 好感≥FAVOR_THRESHOLDS.RARE + 稀层未触发 → 10% 概率（保底：第5次必定触发）
  if (allOccDone && !ns.rareTriggered && favor >= FAVOR_THRESHOLDS.RARE && narrative.rare) {
    ns.rareEligibleCount = (ns.rareEligibleCount || 0) + 1;
    const rareChance = ns.rareEligibleCount >= 5 ? 1.0 : 0.10;
    if (Math.random() < rareChance) {
    ns.rareTriggered = true;
    result.rare = narrative.rare;
    // 常层再次扩容
    if (ns.expansionLevel < 2) ns.expansionLevel = 2;
    // 发放稀层奖励
    const r = narrative.rare.reward;
    if (r) {
      if (r.coins) addCoins(r.coins);
      if (r.atmosphere) addAtmosphere(r.atmosphere);
    }
    // 稀层永久效果
    if (narrative.rare.permanentEffect) {
      const pe = narrative.rare.permanentEffect;
      if (pe.type === 'unlock_book' && pe.bookId) {
        if (!state.books[pe.bookId] || state.books[pe.bookId].status === 'locked') {
          unlockBook(pe.bookId);
        }
      } else if (pe.type === 'signboard_active' && pe.signboardId) {
        if (!state.signboards.includes(pe.signboardId)) {
          state.signboards.push(pe.signboardId);
          addHistory('event', `🪧 获得标志牌「${SIGNBOARDS[pe.signboardId]?.name || pe.signboardId}」`, pe.message || '');
        }
      }
    }
    addHistory('event', `✨ 稀层事件：${narrative.rare.title}`,
      `${VISITOR_DEFS[charId]?.emoji || ''} ${VISITOR_DEFS[charId]?.name || charId} 的故事展开新的一章`);
    addDiaryEntry('special_event', {
      detail: `${narrative.rare.title} —— ${narrative.rare.text}\n\n附信：${narrative.rare.letter?.title || ''}`
    });
    }
  }

  // 4. 稀层后终局：稀层已触发 + 终局未触发 → 100%
  if (ns.rareTriggered && !ns.postRareTriggered && narrative.postRare) {
    ns.postRareTriggered = true;
    result.postRare = narrative.postRare;
    const r = narrative.postRare.reward;
    if (r) {
      if (r.coins) addCoins(r.coins);
      if (r.atmosphere) addAtmosphere(r.atmosphere);
    }
    addHistory('event', `🎉 终局事件：${narrative.postRare.title}`,
      `${VISITOR_DEFS[charId]?.emoji || ''} ${VISITOR_DEFS[charId]?.name || charId} 的故事迎来了圆满的篇章`);
    addDiaryEntry('special_event', { detail: `${narrative.postRare.title} —— ${narrative.postRare.text}` });
  }

  // 5. 终局后常层：终局已触发后，每次还书可能触发终局后常层事件（可重复）
  if (ns.postRareTriggered && narrative.postRareCommon && narrative.postRareCommon.length > 0) {
    const pool = narrative.postRareCommon;
    const recent = ns.postRareCommonTriggered.slice(-2);
    const candidates = pool.filter(e => !recent.includes(e.id));
    const chosen = candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : pool[Math.floor(Math.random() * pool.length)];
    ns.postRareCommonTriggered.push(chosen.id);
    if (ns.postRareCommonTriggered.length > 10) {
      ns.postRareCommonTriggered = ns.postRareCommonTriggered.slice(-10);
    }
    result.postRareCommon = chosen;
  }

  // 6. 终局后偶层：终局已触发 + 好感≥FAVOR_THRESHOLDS.POST_RARE + 有未完成的终局后偶层 → 30%概率
  if (ns.postRareTriggered && narrative.postRareOccasional && narrative.postRareOccasional.length > 0) {
    const allPostRareOccDone = ns.postRareOccasionalCompleted.length >= narrative.postRareOccasional.length;
    if (favor >= FAVOR_THRESHOLDS.POST_RARE && !allPostRareOccDone && Math.random() < 0.30) {
      const next = narrative.postRareOccasional.find(o => !ns.postRareOccasionalCompleted.includes(o.id));
      if (next) {
        ns.postRareOccasionalCompleted.push(next.id);
        result.postRareOccasional = next;
        if (next.reward) {
          if (next.reward.coins) addCoins(next.reward.coins);
          if (next.reward.atmosphere) addAtmosphere(next.reward.atmosphere);
        }
        addHistory('event', `🌟 ${next.title}`,
          `${VISITOR_DEFS[charId]?.emoji || ''} ${VISITOR_DEFS[charId]?.name || charId} 的故事仍在继续`);
        addDiaryEntry('special_event', { detail: `${next.title} —— ${next.text}` });
      }
    }
  }

  saveState();
  return result;
}

// 导出叙事进度查询（给渲染层用）
export function getNarrativeProgress(charId) {
  const ns = getNarrativeState(charId);
  const narrative = VISITOR_NARRATIVES[charId];
  if (!narrative) return null;
  return {
    charId,
    favor: state.visitorFavors?.[charId] || 0,
    commonTotal: getAvailableCommonEvents(charId).length,
    occasionalDone: ns.occasionalCompleted.length,
    occasionalTotal: narrative.occasional?.length || 0,
    rareTriggered: ns.rareTriggered,
    postRareTriggered: ns.postRareTriggered,
    postRareCommonTotal: narrative.postRareCommon?.length || 0,
    postRareOccasionalDone: ns.postRareOccasionalCompleted?.length || 0,
    postRareOccasionalTotal: narrative.postRareOccasional?.length || 0,
    expansionLevel: ns.expansionLevel
  };
}

// ========== 收取还书 + 事件触发 ==========

export function collectReturn(visitorId) {
  const idx = state.visitors.findIndex(v => v.id === visitorId);
  if (idx === -1) return null;

  const visitor = state.visitors[idx];
  if (visitor.status !== 'due') return null;

  const bookId = visitor.bookId;
  const bookTitle = visitor.bookTitle;
  const charId = visitor.charId;
  const def = VISITOR_DEFS[charId];

  // 基础收益（按借阅区等级）
  const retCfg = getBorrowLevelConfig();
  addCoins(retCfg.returnCoins);
  if (retCfg.returnAtmo > 0) addAtmosphere(retCfg.returnAtmo);

  // 乔一一光环：还书好感度加成
  const favorBonus = getAuraReturnFavorBonus();
  const baseFavor = Math.round(5 * (1 + retCfg.favorBonus / 100));
  const returnFavor = Math.round(baseFavor * (1 + favorBonus));
  visitor.favorability = (visitor.favorability || 0) + returnFavor;
  addVisitorFavor(charId, returnFavor);

  // 王小磊光环：每次还书获得诗笺
  let wavePoem = null;
  if (charId === 'wangxiaolei' || (getAuraPoemCollect() && charId !== 'wangxiaolei')) {
    // 王小磊本人还书必然触发诗笺；其他访客还书时若王小磊在馆也可能触发
    if (charId === 'wangxiaolei' || Math.random() < 0.3) {
      const poem = pick(POEMS);
      if (!state.collection) state.collection = {};
      if (!state.collection.wavePoems) state.collection.wavePoems = [];
      state.collection.wavePoems.push({ text: poem, date: getNow(), from: visitor.name });
      wavePoem = { text: poem, count: state.collection.wavePoems.length };
    }
  }

  addHistory('visitor', `${visitor.emoji} ${visitor.name} 归还了《${bookTitle}》`,
    `${retCfg.returnCoins}智慧之光 +${retCfg.returnAtmo}氛围 · 好感+${returnFavor}`);
  if (!state.diaryFirsts.visitorReturn) {
    state.diaryFirsts.visitorReturn = true;
    addDiaryEntry('visitor_return', { emoji: visitor.emoji, name: visitor.name, bookTitle });
  }

  // 记录借阅历史
  state.borrowRecords.unshift({
    id: nextBorrowId(),
    charId,
    charName: visitor.name,
    bookId,
    bookTitle,
    borrowTime: visitor.borrowTime,
    returnTime: getNow(),
    event: null,
    status: 'returned'
  });

  // 还书语录
  const quote = pickReturnQuote(charId, bookTitle, state.library.atmosphere);

  // 判定 1：损毁（基础 ~3%），典藏版与修缮箱中的卷不会损坏
  // TODO-tech-debt: 借阅区等级应降低损毁概率（Lv1→Lv7 每级 -0.2%~-0.4%），当前未实现
  let damaged = false;
  const book = bookId ? BOOKS[bookId] : null;
  const bs = bookId ? state.books[bookId] : null;
  const inRestoration = (state.restorationBox || []).includes(bookId);
  const hasCareBooksSignboard = (state.signboards || []).includes('care_for_books');
  const damageBaseChance = hasCareBooksSignboard ? 0.02 : 0.03;
  if (Math.random() < damageBaseChance && bookId && bs && !book?.indestructible && !inRestoration) {
    bs.damaged = true;
    bs.repairWords = Math.round(bs.copiedWords * 0.15);
    bs.repairProgress = 0;
    if (bs.repairWords > 0) {
      bs.copiedWords = Math.max(0, bs.copiedWords - bs.repairWords);
      if (bs.status === 'completed' && book && bs.copiedWords < book.totalWords) {
        bs.status = 'copying';
      }
    }
    addHistory('damage', `⚠️ 《${bookTitle}》在归还时发现损毁`, `损失${bs.repairWords.toLocaleString()}字，需专注修复`);
    damaged = true;
  }

  // 判定 2：访客叙事事件（三层递进：常层→偶层→稀层→终局）
  const narrativeResult = triggerNarrative(charId);

  // 判定 3：旧版角色事件（~60%，保留赠书/推销/诗笺等玩法效果）
  let eventResult = null;
  if (Math.random() < 0.6 && !visitor.eventTriggered) {
    eventResult = triggerEvent(charId, visitor);
    visitor.eventTriggered = true;
  }

  // 移出访客列表
  state.visitors.splice(idx, 1);
  saveState();

  return {
    damaged, event: eventResult, narrative: narrativeResult, bookId, bookTitle, charId, wavePoem,
    visitorName: visitor.name, visitorEmoji: visitor.emoji,
    coins: retCfg.returnCoins, atmosphere: retCfg.returnAtmo, favor: returnFavor,
    quote
  };
}

// ========== 随机事件 ==========

function triggerEvent(charId, visitor) {
  const def = VISITOR_DEFS[charId];
  if (!def || !def.events) return null;
  const eventType = def.events[0]; // 每人目前只有一个事件类型

  switch (eventType) {
    case 'gift_book':      return eventGiftBook(visitor);
    case 'peizhou_action': return eventPeizhouAction(visitor);
    case 'wave_poem':      return eventWavePoem(visitor);
    default:               return eventGeneric(charId, visitor);
  }
}

// --- 沈明远：赠书 ---

function eventGiftBook(visitor) {
  const available = SHENMINGYUAN_BOOKS.filter(id => !state.books[id] || state.books[id].status === 'locked');
  if (available.length === 0) {
    addCoins(50);
    addHistory('event', '📝 沈明远在书中留下了新的批注卡片', '三本专属书均已赠予');
    saveState();
    return { type: 'annotation', coins: 50 };
  }
  const bookId = pick(available);
  const book = BOOKS[bookId];
  if (!unlockBook(bookId)) {
    addCoins(50);
    addHistory('event', '📝 沈明远留下批注但手稿箱已满', '手稿箱无空位，书籍暂存于借阅区');
    saveState();
    return { type: 'annotation', coins: 50 };
  }
  addHistory('event', `📦 沈明远赠送了一本《${book.title}》`, `${(book.totalWords || 0).toLocaleString()}字 · ${book.author}`);
  addDiaryEntry('special_event', { detail: `沈明远赠送了一本《${book.title}》，说是自己珍藏多年的版本。` });
  saveState();
  return { type: 'gift_book', bookId, mysteryTitle: book.title, emoji: book.emoji };
}

// --- 裴舟：荐书折扣 / 赠阅残章 ---

function eventPeizhouAction(visitor) {
  const unowned = SHARED_POOL.filter(b => {
    const bs = state.books[b.bookId];
    return !bs || bs.status === 'locked';
  });
  if (unowned.length === 0) return null;

  // 50% 荐书折扣 / 50% 赠阅残章
  if (Math.random() < 0.5) {
    return eventPeizhouRecommend(unowned);
  } else {
    return eventPeizhouPreview(unowned);
  }
}

function eventPeizhouRecommend(pool) {
  // 优先推荐"已拥有部分卷但未集齐"卷组中的缺失单卷
  const incompleteGroups = getIncompleteVolumeGroups(state.books);
  const missingGroupIds = new Set(incompleteGroups.map(g => g.collectedBookId));
  const missingVolumes = pool.filter(b =>
    b.type === 'volume' && missingGroupIds.has(b.volumeGroupId)
  );

  const entry = missingVolumes.length > 0 ? pick(missingVolumes) : pick(pool);
  const book = BOOKS[entry.bookId];
  const discount = 0.30; // 商店价额外7折
  const expiresAt = Date.now() + 24 * 3600 * 1000;

  state.peizhouRec = { bookId: entry.bookId, discount, expiresAt };

  addHistory('event', `📚 裴舟推荐《${book.title}》`, `24h内在商店购买享额外7折`);
  addDiaryEntry('special_event', { detail: `裴舟推荐了《${book.title}》，说"这本在我书店里摆了好久，一直没人带走。"24小时内购买享额外折扣。` });
  saveState();
  return { type: 'peizhou_recommend', bookId: entry.bookId, title: book.title, emoji: book.emoji, discount };
}

function eventPeizhouPreview(pool) {
  const entry = pick(pool);

  // 从手稿箱里随机挑一本没抄完的，加 3% 进度
  let boosted = false;
  const mBox = state.manuscriptBox || [];
  const unfinished = mBox.filter(id => {
    const bs = state.books[id];
    return bs && bs.status !== 'completed' && bs.status !== 'locked';
  });
  if (unfinished.length > 0) {
    const targetId = pick(unfinished);
    const bs = state.books[targetId];
    const book = BOOKS[targetId];
    if (book && book.totalWords) {
      const bonus = Math.round(book.totalWords * 0.03);
      bs.copiedWords += bonus;
      if (bs.status === 'unlocked') bs.status = 'copying';
      addHistory('event', `📖 裴舟帮你补了几笔《${book.title}》`, `誊抄进度 +${bonus.toLocaleString()}字（3%）`);
      boosted = true;
    }
  }

  if (!boosted) {
    addHistory('event', `📖 裴舟聊起《${entry.title || '一本书'}》`, `"这本在我旧书摊上放过一阵子，没等到对的人。"`);
  }

  addDiaryEntry('special_event', { detail: `裴舟翻了翻你的手稿箱，挑出一本没抄完的。"这段我熟——以前书店里有这本书，我帮人补过好几页。给你添几笔。"` });
  saveState();
  return { type: 'peizhou_preview', boosted };
}

// --- 王小磊：波浪诗笺 ---

function eventWavePoem(visitor) {
  const poem = pick(POEMS);
  addCoins(15);
  if (!state.collection) state.collection = {};
  if (!state.collection.wavePoems) state.collection.wavePoems = [];
  state.collection.wavePoems.push({ text: poem, date: getNow() });
  addHistory('event', '📝 王小磊留下了一张波浪诗笺', `"${poem}"`);
  addDiaryEntry('special_event', { detail: `王小磊在还书时夹了一张诗笺："${poem}"` });
  saveState();
  return { type: 'wave_poem', poem, count: state.collection.wavePoems.length };
}

// --- 通用事件（其他 6 位访客） ---

const GENERIC_EVENTS = {
  chengyuan:    { emoji: '💻', text: '程远分享了他的调试笔记', msg: '把代码调试和文本校对做了类比，附赠智慧之光。' },
  jianan:       { emoji: '📋', text: '简安留下了一页公文背面手稿', msg: '正面是汇报材料，背面是一段小说开头。' },
  jiangyoushu:  { emoji: '🎓', text: '江有树分享了一份修改后的简历', msg: '在图书馆里改的版本，措辞自信了很多。' },
  guyu:         { emoji: '🌾', text: '谷雨夹了一朵野花在书里', msg: '村口采的野花，被她仔细压成了标本。' },
  qiaoyiyi:     { emoji: '🎨', text: '乔一一画了一张手绘藏书票', msg: '原书封底已经破损，她用自己画的藏书票修补了上去。' },
  xierugui:     { emoji: '🏭', text: '谢如归留了一份SWOT笔记', msg: '对《史记》做了商业分析，视角清奇但颇有见地。' },
  xiachan:      { emoji: '💃', text: '夏蝉写了一小段歌词', msg: '第四遍的时候哼出来的。前三遍镜子都说不对。' }
};

function eventGeneric(charId, visitor) {
  const evt = GENERIC_EVENTS[charId];
  if (!evt) return null;
  const reward = rand(10, 30);
  addCoins(reward);
  addHistory('event', `${evt.emoji} ${evt.text}`, `${evt.msg} +${reward}智慧之光`);
  addDiaryEntry('special_event', { detail: `${evt.text}——${evt.msg}` });
  saveState();
  return { type: 'generic', charId, coins: reward, text: evt.text };
}

// ========== Dev 面板对接 ==========

export function getStageWitnesses(stage) {
  const witnesses = [];
  const browsing = state.visitors.filter(v => v.status === 'browsing');
  for (const v of browsing) {
    const text = STAGE_WITNESS[v.charId]?.[stage];
    if (text) {
      witnesses.push({ visitor: v, text });
    }
  }
  return witnesses;
}

export function onTimeSkip(hours, now) {
  // 每跳过 0.5 小时，尝试刷新一位访客
  const spawns = Math.floor(hours / 0.5);
  for (let i = 0; i < spawns; i++) {
    spawnVisitor();
  }

  // 对已在馆的访客推进借书
  tickVisitorBrowsing(now);

  // 检查到期
  return checkDueVisitors(now);
}

export function visitorForceReturn(visitorId) {
  const visitor = state.visitors.find(v => v.id === visitorId);
  if (visitor && visitor.status === 'borrowed') {
    visitor.status = 'due';
    visitor.dueTime = getNow();
    saveState();
    return true;
  }
  return false;
}

export function visitorReset() {
  state.visitors = [];
  state.borrowRecords = [];
  saveState();
}
