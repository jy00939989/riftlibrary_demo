// 田园瘟疫纪事 — 任务静态数据
// 每角色 5 阶段，每阶段 ≥4 任务
// 全角色全阶段完整内容

export const PASTORAL_TASKS = [

  // ======================== 小艾拉 · Stage 1 ========================
  {
    id: 'child_s1_t1',
    characterId: 'pastoral_child',
    stage: 1,
    order: 1,
    type: 'copy_chapter',
    summary: '誊抄《小王子》第三章',
    condition: { bookId: 'book_001', chapterIdx: 2 },
    prereqTasks: [],
    letterOffer: {
      greeting: '亲爱的馆长，',
      body: '我在图书馆的书架上发现了一本书，封面画着一个金色头发的男孩站在一颗小小的星球上。玛格丽特阿姨说这一定是个很好的故事。可是书太厚了，我认得的字还不够多……你能帮我誊抄第三章吗？我想知道那个男孩遇到了谁。',
      closing: '— 小艾拉（纸上画了一朵歪歪扭扭的玫瑰）'
    },
    letterComplete: {
      body: '我读完了！原来那朵花那么骄傲，又那么脆弱。我把她画下来了，虽然画得不好看。玛格丽特阿姨说这本书叫《小王子》，来自一个很远很远的世界——就像你们的图书馆一样远。谢谢你，馆长。',
      closing: '— 小艾拉（纸上画着玫瑰，旁边写着"谢谢"）'
    },
    reward: { coins: 30 }
  },
  {
    id: 'child_s1_t2',
    characterId: 'pastoral_child',
    stage: 1,
    order: 2,
    type: 'copy_chapter',
    summary: '誊抄《动物农场》第一章',
    condition: { bookId: 'book_002', chapterIdx: 0 },
    prereqTasks: ['child_s1_t1'],
    letterOffer: {
      greeting: '馆长馆长，',
      body: '我在书架上找到一本很奇怪的童话，封面上画着猪和狗站在一起开会。玛格丽特阿姨说这不是童话，是"寓言"。什么是寓言呀？你帮我誊抄第一章好不好，我想看看动物们是怎么说话的。',
      closing: '— 小艾拉（旁边画了一只不太像的猪）'
    },
    letterComplete: {
      body: '动物们真的在开会！少校猪好厉害，它说的话我有些还不太懂，但感觉很重要。玛格丽特阿姨说等我长大了就懂了。谢谢你帮我读这一章。',
      closing: '— 小艾拉'
    },
    reward: { coins: 30 }
  },
  {
    id: 'child_s1_t3',
    characterId: 'pastoral_child',
    stage: 1,
    order: 3,
    type: 'copy_book',
    summary: '完成《小王子》整本誊抄',
    condition: { bookId: 'book_001' },
    prereqTasks: ['child_s1_t1'],
    letterOffer: {
      greeting: '馆长，我又来了。',
      body: '上次誊抄的第三章我已经背下来了。可是故事还没完呀——小王子后来怎么样了？他找到朋友了吗？你能帮我把整本书都誊抄完吗？我想知道结局。',
      closing: '— 小艾拉'
    },
    letterComplete: {
      body: '原来小王子最后回到了他的星球。读完的时候我哭了一小会儿，但我没有让玛格丽特阿姨看见。她说，好书都会让人有一点伤心，然后又有一点温暖。这是我看完的第一本完整的书。馆长，谢谢你。',
      closing: '— 小艾拉（泪痕和笑脸画在一起）'
    },
    reward: { coins: 50, atmo: 1 }
  },
  {
    id: 'child_s1_t4',
    characterId: 'pastoral_child',
    stage: 1,
    order: 4,
    type: 'read_chapter',
    summary: '阅读《本草纲目·草部》第一章',
    condition: { bookId: 'book_007', chapterIdx: 0 },
    prereqTasks: ['child_s1_t2'],
    letterOffer: {
      greeting: '亲爱的馆长，',
      body: '村里好多人都咳嗽了。玛格丽特阿姨每天都在熬药，她的手都起泡了。我问她能不能教我认一种草药，她说图书馆里有一本好大好大的书叫《本草纲目》，是馆长从一个很远的世界带来的——"从那本书开始，你会认识世界上所有的草药。"可是那本书太难了……你能不能帮我读第一章，然后讲给我听？',
      closing: '— 小艾拉'
    },
    letterComplete: {
      body: '我认出了甘草！玛格丽特阿姨煮的咳嗽药里就有它。她很高兴，说下次带我去山上认真正的草药。馆长，原来书里的东西真的能救命。',
      closing: '— 小艾拉（画了一株辨认了很久的甘草）'
    },
    reward: { coins: 30, atmo: 1 }
  },

  // ======================== 小艾拉 · Stage 2 ========================
  {
    id: 'child_s2_t1',
    characterId: 'pastoral_child',
    stage: 2,
    order: 1,
    type: 'copy_chapter',
    summary: '誊抄《本草纲目·草部》第二章',
    condition: { bookId: 'book_007', chapterIdx: 1 },
    prereqTasks: [],
    letterOffer: {
      greeting: '馆长馆长，',
      body: '玛格丽特阿姨真的带我去山上了！我看到了好多草药——有的叶子是心形的，有的根闻起来像胡萝卜。阿姨说《本草纲目》第二章里讲的就是这些。你能帮我誊抄这一章吗？我想把每种草药都画下来给阿姨看。',
      closing: '— 小艾拉（信纸边缘贴了一片压干的薄荷叶）'
    },
    letterComplete: {
      body: '我抄完了！薄荷、紫苏、金银花……阿姨说我画得越来越好了。她还说，能认出这些草药的人，在瘟疫来的时候就不会那么害怕了。馆长，我想学更多。',
      closing: '— 小艾拉（画了三株不同形状的草药）'
    },
    reward: { coins: 30 }
  },
  {
    id: 'child_s2_t2',
    characterId: 'pastoral_child',
    stage: 2,
    order: 2,
    type: 'read_chapter',
    summary: '阅读《物种起源》第一章',
    condition: { bookId: 'book_008', chapterIdx: 0 },
    prereqTasks: ['child_s2_t1'],
    letterOffer: {
      greeting: '亲爱的馆长，',
      body: '玛格丽特阿姨上次从图书馆回来特别兴奋——她说她找到了一本叫《物种起源》的书，里面讲了万物是怎么变的。我问她"我也会变吗"，她笑了，说"你每天都在变"。馆长，你能帮我读第一章吗？我想知道万物是怎么开始的。',
      closing: '— 小艾拉'
    },
    letterComplete: {
      body: '原来世界上的动物和植物不是一开始就长这样的！它们花了很长很长的时间才变成今天的样子。阿姨说，瘟疫也在变——所以我们要比它变得更快。馆长，这就是书的力量对不对？',
      closing: '— 小艾拉（画了一只正在变化的蝴蝶）'
    },
    reward: { coins: 35 }
  },
  {
    id: 'child_s2_t3',
    characterId: 'pastoral_child',
    stage: 2,
    order: 3,
    type: 'copy_chapter',
    summary: '誊抄《老人与海》第一章',
    condition: { bookId: 'book_003', chapterIdx: 0 },
    prereqTasks: ['child_s2_t1'],
    letterOffer: {
      greeting: '馆长，',
      body: '昨天村里又有人发烧了。玛格丽特阿姨整夜没睡，早上我去看她的时候，她的眼睛红红的。我想帮她，可是我太小了。阿姨说，有时候坚持本身就是一种力量。她让我找一本关于"不放弃"的书。你能帮我誊抄《老人与海》第一章吗？',
      closing: '— 小艾拉'
    },
    letterComplete: {
      body: '那个老爷爷好厉害！他的手上全是伤，大鱼也比他大那么多，可是他一直没有松手。我把这一章讲给玛格丽特阿姨听了，她摸了摸我的头，说"你也是我的小渔夫"。',
      closing: '— 小艾拉（画了一条很大的鱼）'
    },
    reward: { coins: 35 }
  },
  {
    id: 'child_s2_t4',
    characterId: 'pastoral_child',
    stage: 2,
    order: 4,
    type: 'copy_chapter',
    summary: '誊抄《诗经》第一章',
    condition: { bookId: 'book_015', chapterIdx: 0 },
    prereqTasks: ['child_s2_t2'],
    letterOffer: {
      greeting: '馆长馆长，',
      body: '山谷里的麦子黄了。往年这个时候，大家都会唱歌庆祝——可今年没人唱歌了。阿姨说很久很久以前的人会对着麦田唱歌，那些歌被记在一本叫《诗经》的书里。你帮我誊抄第一章好不好？我想把古老的诗念给麦田听。',
      closing: '— 小艾拉'
    },
    letterComplete: {
      body: '"关关雎鸠，在河之洲"——我念给麦田听的时候，风正好从山谷吹过来，麦浪沙沙响，好像在跟我一起念。阿姨说，这就是诗的力量。即使瘟疫还在，美也不会消失。',
      closing: '— 小艾拉（画了一大片波浪般的麦田）'
    },
    reward: { coins: 30, atmo: 1 }
  },

  // ======================== 小艾拉 · Stage 3 ========================
  {
    id: 'child_s3_t1',
    characterId: 'pastoral_child',
    stage: 3,
    order: 1,
    type: 'copy_chapter',
    summary: '誊抄《鲁滨逊漂流记》第一章',
    condition: { bookId: 'book_017', chapterIdx: 0 },
    prereqTasks: [],
    letterOffer: {
      greeting: '馆长，',
      body: '瘟疫越来越严重了。村口的井被封了，大家都不出门。我一个人坐在阁楼里，看着窗外的雨一直下。上次在图书馆看到一本书叫《鲁滨逊漂流记》，讲一个人被困在孤岛上。我觉得自己也有点像在孤岛上。你能帮我誊抄第一章吗？',
      closing: '— 小艾拉（信纸有点皱，像被雨点打湿过）'
    },
    letterComplete: {
      body: '鲁滨逊一个人在岛上也没有放弃！他用沉船的木板造房子，用种子种粮食。虽然他也很孤独，但他一直在想办法活下去。馆长，我想我也可以——在家里帮玛格丽特阿姨晒草药，照顾更小的孩子们。',
      closing: '— 小艾拉'
    },
    reward: { coins: 35 }
  },
  {
    id: 'child_s3_t2',
    characterId: 'pastoral_child',
    stage: 3,
    order: 2,
    type: 'read_chapter',
    summary: '阅读《本草纲目·草部》第三章',
    condition: { bookId: 'book_007', chapterIdx: 2 },
    prereqTasks: ['child_s3_t1'],
    letterOffer: {
      greeting: '亲爱的馆长，',
      body: '玛格丽特阿姨说，现在瘟疫到了最严重的时候，我们必须知道哪些草药可以退热、哪些可以防传染。《本草纲目》第三章讲的就是这些。可是我读不太懂那些很难的词……你能帮我读这一章吗？我想学怎么保护大家。',
      closing: '— 小艾拉'
    },
    letterComplete: {
      body: '我学会了辨认连翘和黄连！玛格丽特阿姨说，这两个是退热方子里最重要的药。我现在每天帮她把草药分类，虽然手指被磨得有点疼，但看到发烧的人喝了药之后退热，就觉得一切都值得。',
      closing: '— 小艾拉（手指印旁边画了一株连翘）'
    },
    reward: { coins: 35, atmo: 1 }
  },
  {
    id: 'child_s3_t3',
    characterId: 'pastoral_child',
    stage: 3,
    order: 3,
    type: 'copy_chapter',
    summary: '誊抄《动物农场》第二章',
    condition: { bookId: 'book_002', chapterIdx: 1 },
    prereqTasks: ['child_s3_t1'],
    letterOffer: {
      greeting: '馆长馆长，',
      body: '我又想起那本动物们开会的故事了。上次读第一章的时候我还不太懂，但现在村里发生了很多事——伯爵老爷颁布了新规矩，有人说好有人说不好。我想继续读第二章，也许能明白大人们在争论什么。',
      closing: '— 小艾拉'
    },
    letterComplete: {
      body: '动物们把农场夺过来了，可是猪开始变得跟人一样……我不太喜欢这个结局的开头。玛格丽特阿姨说："权力需要智慧才能用好，否则谁掌权都一样。"我还不太懂，但我想以后会懂的。',
      closing: '— 小艾拉'
    },
    reward: { coins: 30 }
  },
  {
    id: 'child_s3_t4',
    characterId: 'pastoral_child',
    stage: 3,
    order: 4,
    type: 'copy_chapter',
    summary: '誊抄《东京梦华录》第一章',
    condition: { bookId: 'book_004', chapterIdx: 0 },
    prereqTasks: ['child_s3_t2'],
    letterOffer: {
      greeting: '馆长，',
      body: '玛格丽特阿姨发烧了。我坐在她床边，握着她的手。为了不让自己哭出来，我开始想象——想象一个没有瘟疫的地方，那里的街上都是人，小贩在叫卖，孩子们在追逐打闹。阿姨说她读过一本书叫《东京梦华录》，讲的就是这样一座城市。你能帮我誊抄第一章吗？我想读给阿姨听。',
      closing: '— 小艾拉（信纸边缘有淡淡的泪痕）'
    },
    letterComplete: {
      body: '我读给阿姨听了。她闭着眼睛，嘴角微微翘着——她笑了！读到"州桥夜市"那段的时候，她轻轻说"等瘟疫过去了，我们也去集市上好好吃一顿"。馆长，瘟疫会过去的，对吧？',
      closing: '— 小艾拉'
    },
    reward: { coins: 35, atmo: 1 }
  },

  // ======================== 小艾拉 · Stage 4 ========================
  {
    id: 'child_s4_t1',
    characterId: 'pastoral_child',
    stage: 4,
    order: 1,
    type: 'copy_chapter',
    summary: '誊抄《傲慢与偏见》第一章',
    condition: { bookId: 'book_005', chapterIdx: 0 },
    prereqTasks: [],
    letterOffer: {
      greeting: '馆长馆长，',
      body: '最近图书馆来了好多人！卡特琳修女在找草药书，艾德里安先生在看一本很大很厚的哲学书，连伯爵老爷都来过一次——虽然他看起来好严肃。玛格丽特阿姨说，人多的地方就有故事。她推荐我看《傲慢与偏见》，说这本书教人怎么看懂别人。你能帮我誊抄第一章吗？',
      closing: '— 小艾拉'
    },
    letterComplete: {
      body: '班纳特太太好好笑！她一心只想着把女儿们嫁出去。可是伊丽莎白不一样——她有主见，不怕别人的眼光。我想成为像伊丽莎白那样的人。不过玛格丽特阿姨说，先别急着长大，"一个会画草药的小孩，她的眼睛本身就是珍宝"。',
      closing: '— 小艾拉（画了一个穿长裙的女孩剪影）'
    },
    reward: { coins: 35 }
  },
  {
    id: 'child_s4_t2',
    characterId: 'pastoral_child',
    stage: 4,
    order: 2,
    type: 'read_chapter',
    summary: '阅读《物种起源》第二章',
    condition: { bookId: 'book_008', chapterIdx: 1 },
    prereqTasks: ['child_s4_t1'],
    letterOffer: {
      greeting: '亲爱的馆长，',
      body: '艾德里安先生说，玛格丽特阿姨的草药之所以有效，是因为"自然选择"让这些植物进化出了药性。他说《物种起源》第二章专门讲这个。我上次读了第一章，好难，但是好有意思。你能帮我读第二章吗？我想听懂艾德里安先生在说什么。',
      closing: '— 小艾拉'
    },
    letterComplete: {
      body: '原来每一种草药能治病，都是千万年来演化的结果！艾德里安先生说我理解得比他想象的要好。他还说，瘟疫也会"演化"，所以我们不能只用老方子，要不断学新的知识。馆长，大人说话的时候，我已经能插上话了！',
      closing: '— 小艾拉'
    },
    reward: { coins: 35 }
  },
  {
    id: 'child_s4_t3',
    characterId: 'pastoral_child',
    stage: 4,
    order: 3,
    type: 'copy_chapter',
    summary: '誊抄《老人与海》第二章',
    condition: { bookId: 'book_003', chapterIdx: 1 },
    prereqTasks: ['child_s4_t1'],
    letterOffer: {
      greeting: '馆长，',
      body: '伯爵老爷终于同意开放草药了！但是村里还是有人不相信玛格丽特阿姨——他们还是叫她"女巫"。我好生气，可是阿姨说"不用争，用结果说话"。我想起《老人与海》里那个老爷爷——他不在乎别人怎么说，只管自己坚持。你能帮我誊抄第二章吗？我想把这份力量分享给阿姨。',
      closing: '— 小艾拉'
    },
    letterComplete: {
      body: '"人可以被毁灭，但不可以被打败。"我把这句话写了三遍，贴在玛格丽特阿姨的药柜上。她看了一眼，转过身去——但我看到她擦了擦眼睛。不是伤心，是感动。阿姨说，她本来以为自己会一直孤独下去……直到图书馆出现在这个世界。',
      closing: '— 小艾拉'
    },
    reward: { coins: 35, atmo: 1 }
  },
  {
    id: 'child_s4_t4',
    characterId: 'pastoral_child',
    stage: 4,
    order: 4,
    type: 'copy_book',
    summary: '完成《鲁滨逊漂流记》整本誊抄',
    condition: { bookId: 'book_017' },
    prereqTasks: ['child_s4_t2'],
    letterOffer: {
      greeting: '亲爱的馆长，',
      body: '我决定了——我要把《鲁滨逊漂流记》整本书誊抄完。这本书陪着我度过了最害怕的日子，我想把它放到玛格丽特阿姨的药房里，让每一个生病的人都能读到——一个人的孤岛和大海，和永不放弃的勇气。你能帮我完成吗？',
      closing: '— 小艾拉'
    },
    letterComplete: {
      body: '鲁滨逊最后获救了。他在岛上待了二十八年，但他从来没放弃过回家的希望。合上书的时候我忽然明白了：图书馆就是我们的"船"——它载着我们，穿越瘟疫的海洋，抵达彼岸。馆长，谢谢你一直开着这艘船。',
      closing: '— 小艾拉（画了一艘在书海上前行的小船）'
    },
    reward: { coins: 50, atmo: 1 }
  },

  // ======================== 小艾拉 · Stage 5 ========================
  {
    id: 'child_s5_t1',
    characterId: 'pastoral_child',
    stage: 5,
    order: 1,
    type: 'copy_book',
    summary: '完成《动物农场》整本誊抄',
    condition: { bookId: 'book_002' },
    prereqTasks: [],
    letterOffer: {
      greeting: '馆长，',
      body: '瘟疫终于平息了。大家在重建村庄，伯爵老爷也变了好多——他居然亲自来帮玛格丽特阿姨搬药材！我想把《动物农场》整本书誊抄完——这个故事从一开始让我困惑，到现在教会了我好多事情。你能帮我完成最后一本书吗？',
      closing: '— 小艾拉'
    },
    letterComplete: {
      body: '动物农场的故事有一个让人难过的结局。但玛格丽特阿姨说，读懂悲剧的人更懂得珍惜美好。我问她"那瘟疫是一个悲剧吗"，她想了想说"是的，但我们从中学到的东西，比金子还珍贵"。',
      closing: '— 小艾拉（画了一排站在一起的动物，从猪到马到羊）'
    },
    reward: { coins: 50, atmo: 1 }
  },
  {
    id: 'child_s5_t2',
    characterId: 'pastoral_child',
    stage: 5,
    order: 2,
    type: 'read_chapter',
    summary: '阅读《诗经》第二章',
    condition: { bookId: 'book_015', chapterIdx: 1 },
    prereqTasks: ['child_s5_t1'],
    letterOffer: {
      greeting: '馆长馆长，',
      body: '春天又来了。山谷里的麦田比去年更绿，村口的集市重新开了起来。卡特琳修女在广场上主持了瘟疫后的第一场弥撒，大家都哭了。我想再读《诗经》——上次读第一章的时候还在害怕，这次我想好好感受那些古老的诗句。你能帮我读第二章吗？',
      closing: '— 小艾拉'
    },
    letterComplete: {
      body: '"桃之夭夭，灼灼其华"——我把这一句写在村口的木牌上。它讲的是桃花盛开的样子，也讲的是新的开始。卡特琳修女看到后说，这比任何祷文都美。馆长，诗歌和祈祷，是不是在做同一件事？',
      closing: '— 小艾拉（画了一树盛开的桃花）'
    },
    reward: { coins: 35, atmo: 1 }
  },
  {
    id: 'child_s5_t3',
    characterId: 'pastoral_child',
    stage: 5,
    order: 3,
    type: 'copy_chapter',
    summary: '誊抄《小王子》第二章',
    condition: { bookId: 'book_001', chapterIdx: 1 },
    prereqTasks: ['child_s5_t1'],
    letterOffer: {
      greeting: '馆长，',
      body: '我想回到最初的地方——《小王子》。我第一次来到图书馆的时候，读的就是小王子在撒哈拉沙漠遇到飞行员的那一章。那时候我觉得自己就像飞行员，在瘟疫的沙漠里迷了路，然后一个来自星星的孩子来敲我的门。你能帮我誊抄第二章吗？我想把这章亲手抄一遍，作为纪念。',
      closing: '— 小艾拉'
    },
    letterComplete: {
      body: '"请你给我画一只羊……"我一边抄一边笑。第一次读这段的时候我还很害怕，现在我可以笑着读了。玛格丽特阿姨说，这就是成长——不是变老了，而是有了更多的故事可以回味。馆长，谢谢你陪我长大。',
      closing: '— 小艾拉（画了一只终于画得比较像的羊）'
    },
    reward: { coins: 35, atmo: 1 }
  },
  {
    id: 'child_s5_t4',
    characterId: 'pastoral_child',
    stage: 5,
    order: 4,
    type: 'copy_chapter',
    summary: '誊抄《老人与海》第三章',
    condition: { bookId: 'book_003', chapterIdx: 2 },
    prereqTasks: ['child_s5_t2'],
    letterOffer: {
      greeting: '亲爱的馆长，',
      body: '这是我在这个位面的最后一个请求了。我想誊抄《老人与海》的最后一章——圣地亚哥带着鱼骨回到港口，虽然大鱼被鲨鱼吃光了，但他没有失败。玛格丽特阿姨说，瘟疫过后的山谷就像圣地亚哥带回的那副鱼骨——看起来损失了很多，但里面有一种谁也夺不走的东西。馆长，你能帮我完成吗？',
      closing: '— 小艾拉'
    },
    letterComplete: {
      body: '抄完了。我哭了，但不是伤心的泪水。老人虽然只带回了一副骨架，但整个渔村的人都因此知道他经历了什么。我们的山谷也是一样——瘟疫留下了很多伤痕，但每个人心里都多了一种东西：在至暗时刻，有人递来了一本书，而书里的光，比任何瘟疫都更顽强。',
      closing: '— 小艾拉（信的最后画了一束光芒穿过图书馆的窗，照在一本书上）'
    },
    reward: { coins: 50, atmo: 2 }
  },

  // ======================== 玛格丽特 · Stage 1 ========================
  {
    id: 'herb_s1_t1',
    characterId: 'pastoral_herbalist',
    stage: 1,
    order: 1,
    type: 'copy_chapter',
    summary: '誊抄《本草纲目·草部》第二章',
    condition: { bookId: 'book_007', chapterIdx: 1 },
    prereqTasks: [],
    letterOffer: {
      greeting: '归墟图书馆馆长台鉴：',
      body: '我叫玛格丽特，是这个山谷里的草药师。最近村里咳嗽和发热的人越来越多，我试了所有知道的方子，效果都不好。一个偶然的机会我走进了贵馆，在书架上发现了一本我从未见过的书——《本草纲目》。这里面记载的草药知识，比我祖传三代的手抄本还要丰富百倍。请帮我誊抄第二章，是关于清热药材的。每多一味药的记载，就多一分救人的把握。',
      closing: '— 玛格丽特（字迹工整如药方，信纸散发着薄荷和甘草的气味）'
    },
    letterComplete: {
      body: '收到了。金银花、连翘、板蓝根——这三味药目前正是最紧缺的。多谢馆长，这篇誊抄我会裱在药柜旁边，每天对照配药。如果方便的话，以后可能还要麻烦贵馆。',
      closing: '— 玛格丽特'
    },
    reward: { coins: 30 }
  },
  {
    id: 'herb_s1_t2',
    characterId: 'pastoral_herbalist',
    stage: 1,
    order: 2,
    type: 'read_chapter',
    summary: '阅读《物种起源》第一章',
    condition: { bookId: 'book_008', chapterIdx: 0 },
    prereqTasks: ['herb_s1_t1'],
    letterOffer: {
      greeting: '馆长台鉴：',
      body: '我用了一辈子的草药，却从未想过一个问题：为什么这些植物会有药性？村里的老牧师说因为"上帝的安排"，但直觉告诉我答案不止于此。我听说馆里有一本《物种起源》，讲的是万物变化的规律。如果我能读懂它，或许能更好地理解疾病与药草之间的关系。请帮我阅读第一章。',
      closing: '— 玛格丽特'
    },
    letterComplete: {
      body: '原来如此——不是一成不变，而是千万年的演变。那么瘟疫也在演变，我的方子也必须跟着变。这本书让我看到了一个更大的世界，比山谷、比村庄、比伯爵的领地都大。虽然村民们叫我"女巫"，但女巫不会读达尔文。',
      closing: '— 玛格丽特'
    },
    reward: { coins: 35 }
  },
  {
    id: 'herb_s1_t3',
    characterId: 'pastoral_herbalist',
    stage: 1,
    order: 3,
    type: 'copy_chapter',
    summary: '誊抄《道德经》第一章',
    condition: { bookId: 'book_011', chapterIdx: 0 },
    prereqTasks: ['herb_s1_t1'],
    letterOffer: {
      greeting: '馆长：',
      body: '昨天有个病人在我面前死了。他的妻子哭喊着说是我害的——因为我没有用她认为"正确"的圣水和祈祷。我沉默地收拾药碗，一句话也说不出来。夜晚一个人坐在药房里，我需要一些东西让我平静下来。听说东方有一本《道德经》，讲的是"道"与"自然"。请帮我誊抄第一章。',
      closing: '— 玛格丽特（字迹比平时更用力，像是在克制着什么）'
    },
    letterComplete: {
      body: '"道可道，非常道。"我反复读了很多遍。也许治病之道也是如此——真正有效的方子不在书本里，而在对自然的观察和尊重之中。今晚我不再那么愤怒了。谢谢馆长，在这样的时候给我一段东方的沉默。',
      closing: '— 玛格丽特'
    },
    reward: { coins: 30 }
  },
  {
    id: 'herb_s1_t4',
    characterId: 'pastoral_herbalist',
    stage: 1,
    order: 4,
    type: 'copy_chapter',
    summary: '誊抄《诗经》第一章',
    condition: { bookId: 'book_015', chapterIdx: 0 },
    prereqTasks: ['herb_s1_t2'],
    letterOffer: {
      greeting: '馆长台鉴：',
      body: '今天上山采药的时候，看到山谷里的麦子黄了。往年麦收是一年中最热闹的日子——孩子们在田埂上跑，老人们坐在树荫下唱古老的歌。但今年田里空荡荡的。我想起世界上最早的诗里，也有麦田、也有歌声。请帮我誊抄《诗经》的第一章。',
      closing: '— 玛格丽特（信纸里夹了一根麦穗）'
    },
    letterComplete: {
      body: '"参差荇菜，左右流之"——原来三千年前的人也在为日常的劳作唱着歌。我把这首诗抄在了药房的墙上。来看病的农妇们会停下来念两句，然后笑着说"跟咱们唱的也差不多嘛"。有时候，一首古老的诗歌比一碗药更能让人好起来。',
      closing: '— 玛格丽特'
    },
    reward: { coins: 30, atmo: 1 }
  },

  // ======================== 玛格丽特 · Stage 2 ========================
  {
    id: 'herb_s2_t1',
    characterId: 'pastoral_herbalist',
    stage: 2,
    order: 1,
    type: 'copy_chapter',
    summary: '誊抄《物种起源》第二章',
    condition: { bookId: 'book_008', chapterIdx: 1 },
    prereqTasks: [],
    letterOffer: {
      greeting: '馆长：',
      body: '瘟疫的症状在变化。最开始只是咳嗽和发热，现在有些人开始起疹子了。这说明病原在变异——就像《物种起源》里说的那样。请帮我誊抄第二章，我需要理解"变异"是怎么发生的，才有可能找到应对的方法。',
      closing: '— 玛格丽特'
    },
    letterComplete: {
      body: '感谢。达尔文说变异是随机的，但自然选择是有方向的。如果我把这个思路用到瘟疫上——不断试新的方子，记录疗效，保留有效的——这不就是医学上的"自然选择"吗？我已经开始在病历上做详细记录了。',
      closing: '— 玛格丽特'
    },
    reward: { coins: 35 }
  },
  {
    id: 'herb_s2_t2',
    characterId: 'pastoral_herbalist',
    stage: 2,
    order: 2,
    type: 'read_chapter',
    summary: '阅读《几何原本》第一章',
    condition: { bookId: 'book_018', chapterIdx: 0 },
    prereqTasks: ['herb_s2_t1'],
    letterOffer: {
      greeting: '馆长台鉴：',
      body: '我的药方越开越多，但有时候连我自己也说不清为什么有些方子有效、有些无效。一位来借书的年轻学者（他叫艾德里安）说，我需要的不是更多草药，而是更严谨的思维方式。他推荐我读《几何原本》——"从公理出发，一步步推导"。听起来很枯燥，但我愿意试试。请帮我阅读第一章。',
      closing: '— 玛格丽特'
    },
    letterComplete: {
      body: '我被震撼了。欧几里得从最简单的公理出发，竟能推演出整个几何世界。如果我把同样的方法用在草药上——从最基本的观察出发，一步步验证、推理——也许我也能建立起一个"草药体系"。艾德里安说得对，我需要的是方法，不是更多的方子。',
      closing: '— 玛格丽特'
    },
    reward: { coins: 35 }
  },
  {
    id: 'herb_s2_t3',
    characterId: 'pastoral_herbalist',
    stage: 2,
    order: 3,
    type: 'copy_chapter',
    summary: '誊抄《本草纲目·草部》第三章',
    condition: { bookId: 'book_007', chapterIdx: 2 },
    prereqTasks: ['herb_s2_t1'],
    letterOffer: {
      greeting: '馆长：',
      body: '一位流浪的修女——卡特琳——今天到我的药房来帮忙。她不懂草药，但她愿意照顾病人。我问她为什么信上帝，她反问我为什么信草药。我们谈了很长时间。她走的时候，我决定把《本草纲目》第三章誊抄一份给她——关于清热和解毒的药材。她一定会回来的。请帮我誊抄。',
      closing: '— 玛格丽特'
    },
    letterComplete: {
      body: '卡特琳来拿手稿的时候，我看到她眼里有一种东西——不是信仰的光，而是求知的光。她问我"黄连为什么能清热"，我给她解释了半个时辰。她说："这比任何神迹都让我信服。因为它是可以被理解的。"馆长，我可能多了一个学生。',
      closing: '— 玛格丽特'
    },
    reward: { coins: 35, atmo: 1 }
  },
  {
    id: 'herb_s2_t4',
    characterId: 'pastoral_herbalist',
    stage: 2,
    order: 4,
    type: 'copy_chapter',
    summary: '誊抄《庄子》第一章',
    condition: { bookId: 'book_006', chapterIdx: 0 },
    prereqTasks: ['herb_s2_t2'],
    letterOffer: {
      greeting: '馆长台鉴：',
      body: '村民们开始聚集在我的药房外面——不是来看病，而是来抗议。他们说我得罪了上帝，说我的草药冒犯了自然的秩序。我站在窗前，看着那些愤怒的脸，忽然感到一种深深的疲惫。艾德里安给我留下一张字条，上面写着一个我没听过的名字："庄子"。请帮我誊抄第一章。',
      closing: '— 玛格丽特（信纸上有草药的汁液印，还有一滴不易察觉的泪痕）'
    },
    letterComplete: {
      body: '"北冥有鱼，其名为鲲。鲲之大，不知其几千里也。"我读了一整夜。庄子说，有用与无用都是相对的——一颗歪脖子树因为不成材而活到了最后。也许我被人称为"女巫"，也是某种意义上的"不成材"？至少在庄子的世界里，不成材不是罪过。',
      closing: '— 玛格丽特'
    },
    reward: { coins: 35, atmo: 1 }
  },

  // ======================== 玛格丽特 · Stage 3 ========================
  {
    id: 'herb_s3_t1',
    characterId: 'pastoral_herbalist',
    stage: 3,
    order: 1,
    type: 'copy_chapter',
    summary: '誊抄《物种起源》第三章',
    condition: { bookId: 'book_008', chapterIdx: 2 },
    prereqTasks: [],
    letterOffer: {
      greeting: '馆长：',
      body: '瘟疫进入了最猛烈的阶段。每天都有新的病人，每天也有人在死去。我需要的不是安慰，而是更深入地理解自然的法则。《物种起源》第三章讲的是生存斗争——此刻，这就是我们正在经历的事。请帮我誊抄。',
      closing: '— 玛格丽特'
    },
    letterComplete: {
      body: '"生存斗争"——达尔文用这三个字概括了自然界最基本的法则。但你知道吗，馆长？在这些斗争中，我看到的不只是残酷。我看到村妇们给邻居送饭，看到卡特琳修女三天没合眼，看到小艾拉那双小手在帮我捣药。也许人类的"生存斗争"里，有一种东西是自然界没有的。',
      closing: '— 玛格丽特'
    },
    reward: { coins: 35 }
  },
  {
    id: 'herb_s3_t2',
    characterId: 'pastoral_herbalist',
    stage: 3,
    order: 2,
    type: 'copy_book',
    summary: '完成《本草纲目·草部》整本誊抄',
    condition: { bookId: 'book_007' },
    prereqTasks: ['herb_s3_t1'],
    letterOffer: {
      greeting: '馆长台鉴：',
      body: '我决定把《本草纲目·草部》完整誊抄一遍。不是为了我自己——我的方子已经记在脑子里了——而是为了这个山谷。如果我死了，至少还会有一本完整的草药书留在这里。请帮我完成这件事。',
      closing: '— 玛格丽特'
    },
    letterComplete: {
      body: '抄完了。我把整本《本草纲目》放在药房最显眼的架子上。卡特琳给它包了油布，艾拉画了封面——一株绿色的人参。我对她们说："如果我明天不在了，这本书就是你们的老师。"她们都没有说话，但我知道她们听懂了。',
      closing: '— 玛格丽特'
    },
    reward: { coins: 50, atmo: 1 }
  },
  {
    id: 'herb_s3_t3',
    characterId: 'pastoral_herbalist',
    stage: 3,
    order: 3,
    type: 'read_chapter',
    summary: '阅读《理想国》第一章',
    condition: { bookId: 'book_013', chapterIdx: 0 },
    prereqTasks: ['herb_s3_t1'],
    letterOffer: {
      greeting: '馆长：',
      body: '伯爵老爷下令封村了——任何人不得出入。他认为这样能阻止瘟疫传播。但我知道这只会让事情更糟：病人被关在家里，药材运不进来，健康的村民被困在疫区。艾德里安说他父亲"需要接受一些教育"。他推荐我读《理想国》——让我理解什么才是好的治理。请帮我阅读第一章。',
      closing: '— 玛格丽特'
    },
    letterComplete: {
      body: '苏格拉底说，正义不是强者的利益。艾德里安一定读过这段话——难怪他会和他父亲争论。我在想，如果柏拉图来治理这个山谷，他会怎么做？大概不会封村吧。也许他会先建一座图书馆。',
      closing: '— 玛格丽特'
    },
    reward: { coins: 35 }
  },
  {
    id: 'herb_s3_t4',
    characterId: 'pastoral_herbalist',
    stage: 3,
    order: 4,
    type: 'copy_chapter',
    summary: '誊抄《社会契约论》第一章',
    condition: { bookId: 'book_020', chapterIdx: 0 },
    prereqTasks: ['herb_s3_t2'],
    letterOffer: {
      greeting: '馆长台鉴：',
      body: '艾德里安又来找我了。这次他带着一本禁书——《社会契约论》。他说这本书在他父亲的禁书名单上，但他在贵馆找到了。"人生而自由，却无往不在枷锁之中"——光听到第一句，我就知道我需要读完它。请帮我誊抄第一章。',
      closing: '— 玛格丽特'
    },
    letterComplete: {
      body: '读完第一章，我明白了为什么伯爵要禁这本书。卢梭问了一个最危险的问题：统治者的权力从哪里来？如果权力不是来自人民的一致同意，那它就是不合法的。我平生第一次开始思考——不只是思考草药，而是思考权力、正义和改变。',
      closing: '— 玛格丽特'
    },
    reward: { coins: 35, atmo: 1 }
  },

  // ======================== 玛格丽特 · Stage 4 ========================
  {
    id: 'herb_s4_t1',
    characterId: 'pastoral_herbalist',
    stage: 4,
    order: 1,
    type: 'copy_chapter',
    summary: '誊抄《物种起源》第四章',
    condition: { bookId: 'book_008', chapterIdx: 3 },
    prereqTasks: [],
    letterOffer: {
      greeting: '馆长：',
      body: '形势终于开始好转了。我的方子在退热上有稳定的效果，卡特琳组织了一群志愿者挨家挨户送药，伯爵也开始松动他的封锁令。我想继续读完《物种起源》——第四章讲的是自然选择在自然界中的具体运作。在一个开始好转的时刻，我需要巩固我所学到的一切。',
      closing: '— 玛格丽特'
    },
    letterComplete: {
      body: '达尔文在这一章中展示了大量实例——岛屿上的雀鸟、大陆上的甲虫——每一样都在讲述同一个道理：适应的留下，不适应的消亡。我想起最初那些死去的病人……如果那时候我们能更早地用对药，是不是有些人就不会死？这个念头一直折磨着我，但它也让我更坚定：不能停下来。',
      closing: '— 玛格丽特'
    },
    reward: { coins: 35 }
  },
  {
    id: 'herb_s4_t2',
    characterId: 'pastoral_herbalist',
    stage: 4,
    order: 2,
    type: 'read_chapter',
    summary: '阅读《史记》第一章',
    condition: { bookId: 'book_014', chapterIdx: 0 },
    prereqTasks: ['herb_s4_t1'],
    letterOffer: {
      greeting: '馆长台鉴：',
      body: '伯爵邀请我去城堡——不是来抓我，而是来请教。他想知道整个瘟疫的经过，说他"需要被记录"。我告诉他，记录是应该的，但以谁的视角记录很重要。推荐我读《史记》的是卡特琳修女——她说"上帝的意旨在历史中显现，而历史是人写的"。请帮我阅读第一章。',
      closing: '— 玛格丽特'
    },
    letterComplete: {
      body: '司马迁写《史记》，不是站在帝王的角度，而是记下了刺客、游侠、商贾——那些通常被历史遗忘的人。我在想，这次瘟疫的"史记"应该怎么写？谁来写那个第一个发烧的佃农？谁来记那个彻夜捣药的小女孩？馆长，也许我应该自己来写。',
      closing: '— 玛格丽特'
    },
    reward: { coins: 35 }
  },
  {
    id: 'herb_s4_t3',
    characterId: 'pastoral_herbalist',
    stage: 4,
    order: 3,
    type: 'copy_chapter',
    summary: '誊抄《庄子》第二章',
    condition: { bookId: 'book_006', chapterIdx: 1 },
    prereqTasks: ['herb_s4_t1'],
    letterOffer: {
      greeting: '馆长：',
      body: '封村的禁令终于解除了。站在村口，看着第一辆从外面来的马车驶入山谷，我以为我会哭——但没有。我只是感觉恍如隔世。庄子说"齐物"——万物本无差别，生和死、悲和喜，都不过是道的不同面相。我想再读读庄子。请帮我誊抄第二章。',
      closing: '— 玛格丽特'
    },
    letterComplete: {
      body: '"天地与我并生，而万物与我为一。"晚上坐在药房里，看着满墙的草药标签——它们来自这座山、那片田、远处的森林——忽然觉得庄子说得对。我不是在"战胜"瘟疫，我只是在帮助自然恢复它本该有的平衡。',
      closing: '— 玛格丽特'
    },
    reward: { coins: 35, atmo: 1 }
  },
  {
    id: 'herb_s4_t4',
    characterId: 'pastoral_herbalist',
    stage: 4,
    order: 4,
    type: 'copy_chapter',
    summary: '誊抄《道德经》第二章',
    condition: { bookId: 'book_011', chapterIdx: 1 },
    prereqTasks: ['herb_s4_t2'],
    letterOffer: {
      greeting: '馆长台鉴：',
      body: '伯爵正式下令：山谷里每一座村庄都必须设立草药站，由受过训练的药师驻守。他让我来负责培训第一批药师。我从来没有当过"老师"——我一直以为我这辈子只会是一个人。小艾拉说《道德经》里有一句话："功成而弗居"。请帮我誊抄第二章，我需要智慧。',
      closing: '— 玛格丽特'
    },
    letterComplete: {
      body: '"是以圣人处无为之事，行不言之教。"我懂了——最好的老师不是叫别人照做，而是让他们自己去看、去摸、去尝、去错。明天开始培训，我不会站在讲台上，我会带着他们上山——就像当初那些老药师带我一样。谢谢你，馆长。',
      closing: '— 玛格丽特'
    },
    reward: { coins: 35, atmo: 1 }
  },

  // ======================== 玛格丽特 · Stage 5 ========================
  {
    id: 'herb_s5_t1',
    characterId: 'pastoral_herbalist',
    stage: 5,
    order: 1,
    type: 'copy_book',
    summary: '完成《物种起源》整本誊抄',
    condition: { bookId: 'book_008' },
    prereqTasks: [],
    letterOffer: {
      greeting: '馆长：',
      body: '我要完成在贵馆的最后一本大书——《物种起源》全书。这本书陪伴了我整个瘟疫岁月，从最初的困惑到如今的理解，它重塑了我看待世界的方式。我想把誊抄完的全书留在药房里，作为这个山谷第一所"草药学堂"的镇堂之宝。请帮我完成。',
      closing: '— 玛格丽特'
    },
    letterComplete: {
      body: '抄完了。我把这本手抄的《物种起源》和先前抄的《本草纲目》放在一起，中间夹了一页——是我自己写的序，里面记录了这次瘟疫中每一种草药的疗效数据。小艾拉说这两本书是药房的"爸爸和妈妈"。她说的也许有道理——一个是自然的法则，一个是自然的素材。',
      closing: '— 玛格丽特（信末附了一行小字：拙著《山谷草药实录》初稿已成，若馆长有兴趣，下次托艾拉带给你看）'
    },
    reward: { coins: 50, atmo: 1 }
  },
  {
    id: 'herb_s5_t2',
    characterId: 'pastoral_herbalist',
    stage: 5,
    order: 2,
    type: 'read_chapter',
    summary: '阅读《几何原本》第二章',
    condition: { bookId: 'book_018', chapterIdx: 1 },
    prereqTasks: ['herb_s5_t1'],
    letterOffer: {
      greeting: '馆长台鉴：',
      body: '草药学堂开学第一天，来了十二个学生——有佃农的孩子、村妇、甚至还有一位以前骂我"女巫"的老太太。我不知道该先教什么。艾德里安说"先教他们怎样思考"。他推荐我再细读《几何原本》，说"带他们用尺规画圆——在圆里，他们能学会平等"。请帮我阅读第二章。',
      closing: '— 玛格丽特'
    },
    letterComplete: {
      body: '我在学堂的第一堂课上，什么药都没讲。我让每个人用圆规画一个圆。"圆上的每一点到中心的距离都相等，"我说，"在草药面前，每个人也都是平等的——不管你以前叫我女巫还是圣徒。"那个老太太第一个哭了，然后她站起来，鞠了一个躬。',
      closing: '— 玛格丽特'
    },
    reward: { coins: 40 }
  },
  {
    id: 'herb_s5_t3',
    characterId: 'pastoral_herbalist',
    stage: 5,
    order: 3,
    type: 'copy_chapter',
    summary: '誊抄《史记》第二章',
    condition: { bookId: 'book_014', chapterIdx: 1 },
    prereqTasks: ['herb_s5_t1'],
    letterOffer: {
      greeting: '馆长：',
      body: '伯爵想在城堡里建一座小图书馆——"让以后的人知道这次瘟疫中发生了什么"。他想让我来选第一批书。我首先想到的不是草药典籍，而是《史记》——因为历史比药方更能教会人如何避免重蹈覆辙。请帮我誊抄第二章，我要把它放在新图书馆的第一排。',
      closing: '— 玛格丽特'
    },
    letterComplete: {
      body: '其实我不确定这些书能改变什么。也许下次瘟疫来的时候，人们还是会先恐慌、先找替罪羊——就像他们曾经对我做的那样。但至少，到那时候书在。有人在。上次是一个人（我），这次是五个人（我们），下次也许是五十个人。历史就是这样往前进的。',
      closing: '— 玛格丽特'
    },
    reward: { coins: 40, atmo: 1 }
  },
  {
    id: 'herb_s5_t4',
    characterId: 'pastoral_herbalist',
    stage: 5,
    order: 4,
    type: 'copy_chapter',
    summary: '誊抄《诗经》第二章',
    condition: { bookId: 'book_015', chapterIdx: 1 },
    prereqTasks: ['herb_s5_t2'],
    letterOffer: {
      greeting: '馆长台鉴：',
      body: '这是我在贵馆的最后一次请求了。瘟疫已经过去六个月了。山谷里的麦子又黄了，而这一次，人们在唱歌——真的在唱，不是想象中的歌。我想誊抄《诗经》第二章，放入草药学堂的藏书室。让以后来学草药的人知道：药可以治身体的病，而诗歌治的是另一种。',
      closing: '— 玛格丽特'
    },
    letterComplete: {
      body: '今天我在学堂的院子里种了一片薄荷。卡特琳修女做了祷告，不是向上帝——而是向所有在这次瘟疫中逝去的人。艾德里安在旁边记笔记，小艾拉在田埂上追蝴蝶。伯爵远远地站在山坡上看着我们，没有走近。风吹过来的时候，薄荷的香气弥漫了整个院子。我们活着。我们在一起。我们还在读书。',
      closing: '— 玛格丽特（信的最后夹了一片整个山谷最绿的薄荷叶）'
    },
    reward: { coins: 50, atmo: 2 }
  },

  // ======================== 卡特琳修女 · Stage 1 ========================
  {
    id: 'nun_s1_t1',
    characterId: 'pastoral_nun',
    stage: 1,
    order: 1,
    type: 'copy_chapter',
    summary: '誊抄《沉思录》第一章',
    condition: { bookId: 'book_012', chapterIdx: 0 },
    prereqTasks: [],
    letterOffer: {
      greeting: '馆长先生/女士：',
      body: '我是一个流浪的修女，从北方的修道院一路向南，躲避的既是瘟疫，也是我自己。在山谷的教堂里落脚的第一夜，我跪在冰冷的石板上，发现自己一个字也祈祷不出来。一位叫玛格丽特的草药师——他们叫她"女巫"——带我走进了贵馆，指着一本叫《沉思录》的书说："也许你需要的是这个，不是十字架。"她说这本书来自一个罗马皇帝，写于一千八百年前的行军帐中。请帮我誊抄第一章。',
      closing: '— 卡特琳（字迹纤细但坚定，像是被风吹了很久的烛火）'
    },
    letterComplete: {
      body: '马可·奥勒留是罗马皇帝，也是斯多葛学派的哲人。他在军帐中写下这些文字——不是在修道院里，而是在战场上。他说："不要让外在的事物支配你的心灵。"我在瘟疫的村庄里读到了这句话，忽然发现：我一直在逃避的不是瘟疫，而是我内心的空洞。也许信仰需要先被剥光，才能重新长出真正的根。',
      closing: '— 卡特琳'
    },
    reward: { coins: 30 }
  },
  {
    id: 'nun_s1_t2',
    characterId: 'pastoral_nun',
    stage: 1,
    order: 2,
    type: 'read_chapter',
    summary: '阅读《道德经》第一章',
    condition: { bookId: 'book_011', chapterIdx: 0 },
    prereqTasks: ['nun_s1_t1'],
    letterOffer: {
      greeting: '馆长：',
      body: '玛格丽特对我说了一句让我彻夜未眠的话："你相信上帝是因为你被这样教育，还是因为你真实地感受到了祂？"我不知道答案。她建议我读一读东方的《道德经》——"道"不是神，法则是它自己的主宰。我从未接触过没有上帝的智慧。请帮我阅读第一章。',
      closing: '— 卡特琳'
    },
    letterComplete: {
      body: '"道可道，非常道"——能用语言描述的，就不是永恒的道。如果这句话刻在修道院的墙上，主教们可能会暴跳如雷。但此刻，在一个被瘟疫撕裂的山谷里，它给了我一种奇怪的安宁。也许真正的道不在教会里，当然也不在书本里——它在这些沉默地忍受苦难的人们的面容之中。',
      closing: '— 卡特琳'
    },
    reward: { coins: 35 }
  },
  {
    id: 'nun_s1_t3',
    characterId: 'pastoral_nun',
    stage: 1,
    order: 3,
    type: 'copy_chapter',
    summary: '誊抄《卡拉马佐夫兄弟》第一章',
    condition: { bookId: 'book_019', chapterIdx: 0 },
    prereqTasks: ['nun_s1_t1'],
    letterOffer: {
      greeting: '馆长先生/女士：',
      body: '玛格丽特昨天问我一个更尖锐的问题："如果你的上帝真的全善全能，为什么会有瘟疫？"我无法回答——神学院的每一个标准答案在真实的苦难面前都显得苍白。她指了指图书馆书架上的另一本书，说这本书里也有人在问同样的问题。那是陀思妥耶夫斯基的《卡拉马佐夫兄弟》。请帮我誊抄第一章。',
      closing: '— 卡特琳（信纸上有深深浅浅的折痕，像是被反复揉捏过）'
    },
    letterComplete: {
      body: '阿廖沙、伊万、德米特里——卡拉马佐夫家的三个兄弟，三种灵魂。伊万说"如果没有上帝，一切都是被允许的"。这句话让我毛骨悚然，却又莫名地感到了自由。如果信仰不是教会的命令，而是我自己的选择——那我还会选择它吗？现在我还不知道答案。请让我继续读下去。',
      closing: '— 卡特琳'
    },
    reward: { coins: 35, atmo: 1 }
  },
  {
    id: 'nun_s1_t4',
    characterId: 'pastoral_nun',
    stage: 1,
    order: 4,
    type: 'copy_chapter',
    summary: '誊抄《诗经》第一章',
    condition: { bookId: 'book_015', chapterIdx: 0 },
    prereqTasks: ['nun_s1_t2'],
    letterOffer: {
      greeting: '馆长：',
      body: '今天我为一个不到十岁的孩子做了临终祈祷。他说他不怕——因为"玛格丽特阿姨说，人会变成星星回到天上"。我的祈祷词和他的"星星"，哪一个更接近真理？我不知道了。晚上我翻开玛格丽特药房里那本《诗经》——没有上帝的诗，只有人在唱歌。请帮我誊抄第一章。我想在诗歌中找一些东西。',
      closing: '— 卡特琳'
    },
    letterComplete: {
      body: '"窈窕淑女，君子好逑"——这是一首情歌。三千年前的人在唱恋爱的歌。他们没有在瘟疫中祈祷，而是在春天里恋爱。读完之后我哭了一场，不是因为悲伤，而是因为意识到了：也许神圣的不是教堂的穹顶，而是人类在苦难中依然爱、依然歌唱的能力。',
      closing: '— 卡特琳'
    },
    reward: { coins: 30, atmo: 1 }
  },

  // ======================== 卡特琳修女 · Stage 2 ========================
  {
    id: 'nun_s2_t1',
    characterId: 'pastoral_nun',
    stage: 2,
    order: 1,
    type: 'copy_chapter',
    summary: '誊抄《庄子》第一章',
    condition: { bookId: 'book_006', chapterIdx: 0 },
    prereqTasks: [],
    letterOffer: {
      greeting: '馆长：',
      body: '玛格丽特的药房被村民围攻的那天晚上，我去看她。她坐在一堆药草中间，安静得像一尊石像。我问她怎么能这么平静，她给我读了一段话："北冥有鱼，其名为鲲。"那是《庄子》。一个两千年前的中国人说，有些鱼可以变成鸟，一飞就是九万里。请帮我誊抄第一章——我想理解那种超越苦难的自由。',
      closing: '— 卡特琳'
    },
    letterComplete: {
      body: '读完庄子，我发现了一个秘密：在基督教传统中，苦难被赋予意义——"上帝的试炼"、"为义受逼迫"。但庄子不说"意义"，他说——鲲可以化鹏，树可以不材而活，人可以不滞于物。这不是教义，这是一种看世界的眼光。我想学会用这种眼光来看这个山谷。',
      closing: '— 卡特琳'
    },
    reward: { coins: 35 }
  },
  {
    id: 'nun_s2_t2',
    characterId: 'pastoral_nun',
    stage: 2,
    order: 2,
    type: 'read_chapter',
    summary: '阅读《卡拉马佐夫兄弟》第二章',
    condition: { bookId: 'book_019', chapterIdx: 1 },
    prereqTasks: ['nun_s2_t1'],
    letterOffer: {
      greeting: '馆长先生/女士：',
      body: '我继续在读陀思妥耶夫斯基。第二章里有一段著名的对话——伊万向阿廖沙讲述"宗教大法官"的故事：基督重返人间，却被教会的主教逮捕，因为祂的存在本身威胁到了教会的权威。我读到这里的时候，从床上坐了起来。请帮我阅读这一章。我需要有人和我一起面对这个问题。',
      closing: '— 卡特琳'
    },
    letterComplete: {
      body: '宗教大法官对基督说："你给了人类自由，但人类不想要自由——他们想要面包，想要奇迹，想要权威来告诉他们该怎么做。"我不禁问自己——我这些年来信仰的，是基督，还是宗教大法官？在瘟疫中，我看到的不是面包和奇迹，而是玛格丽特的草药，和小艾拉画画的手。自由也许很可怕，但它是真的。',
      closing: '— 卡特琳'
    },
    reward: { coins: 40, atmo: 1 }
  },
  {
    id: 'nun_s2_t3',
    characterId: 'pastoral_nun',
    stage: 2,
    order: 3,
    type: 'copy_chapter',
    summary: '誊抄《沉思录》第二章',
    condition: { bookId: 'book_012', chapterIdx: 1 },
    prereqTasks: ['nun_s2_t1'],
    letterOffer: {
      greeting: '馆长：',
      body: '今天有三个病人死去了——从早到晚，我的双手沾满了血和泪水。傍晚的时候，小艾拉跑过来抱住我的腿，不说话，只是抱着。我忽然想到马可·奥勒留，他一生经历了瘟疫、战争、丧子——但他在《沉思录》里从不说"为什么是我"，只说"如何正确地面对"。请帮我誊抄第二章。',
      closing: '— 卡特琳'
    },
    letterComplete: {
      body: '"不要像一个不满的仆人那样抱怨。按照自然赋予你的本性来度过短暂的一生。"我对一个悲痛欲绝的母亲念了这段话，她问我这出自《圣经》的哪一章。我说"不是《圣经》——是一个一千八百年前的罗马人写的"。她愣了一下，然后说："那他也是上帝的孩子。"也许吧。也许所有的智慧都来自同一个源头。',
      closing: '— 卡特琳'
    },
    reward: { coins: 35 }
  },
  {
    id: 'nun_s2_t4',
    characterId: 'pastoral_nun',
    stage: 2,
    order: 4,
    type: 'copy_chapter',
    summary: '誊抄《史记》第一章',
    condition: { bookId: 'book_014', chapterIdx: 0 },
    prereqTasks: ['nun_s2_t2'],
    letterOffer: {
      greeting: '馆长先生/女士：',
      body: '昨晚我站在教堂门口，看着伯爵的士兵在村口竖起了隔离栅栏。他们说是"保护"。但我看到栅栏后面那些无助的脸——那不是保护，是把人关进绝望之中。我忽然想知道，历史上那些掌权者，在面对瘟疫时都做了什么。玛格丽特提到了《史记》。请帮我誊抄第一章。',
      closing: '— 卡特琳'
    },
    letterComplete: {
      body: '《史记》里满是君主、将军、刺客和商人的故事。司马迁记录的每一个朝代都面临过类似的灾难，而每一次，统治者的选择决定了成千上万人的命运。看完第一章我明白了——在瘟疫中保持沉默，本身就是一种罪。作为修女，我可以为自己的灵魂祈祷；但作为人，我必须为这些栅栏后面的人发声。',
      closing: '— 卡特琳'
    },
    reward: { coins: 35, atmo: 1 }
  },

  // ======================== 卡特琳修女 · Stage 3 ========================
  {
    id: 'nun_s3_t1',
    characterId: 'pastoral_nun',
    stage: 3,
    order: 1,
    type: 'copy_chapter',
    summary: '誊抄《卡拉马佐夫兄弟》第三章',
    condition: { bookId: 'book_019', chapterIdx: 2 },
    prereqTasks: [],
    letterOffer: {
      greeting: '馆长：',
      body: '教堂的屋顶漏雨了。我做了一个决定——把教堂改成临时收容所，让那些被隔离的家庭住进来。主教大人如果知道了，一定会震怒。但我脑海中反复回响着阿廖沙的声音——卡拉马佐夫家最小的弟弟，一个决心活在尘世中而非修道院里的天使。请帮我誊抄第三章。我想知道阿廖沙最后选择了什么。',
      closing: '— 卡特琳'
    },
    letterComplete: {
      body: '阿廖沙选择了走出去——走出修道院，走进世界，和罪人在一起。佐西马长老让他这么做。当我把教堂的门打开，让发烧的孩子们躺在长椅上时，我觉得我比任何时候都更像一个基督徒。不是因为我在祈祷，而是因为我在行动。',
      closing: '— 卡特琳'
    },
    reward: { coins: 40, atmo: 1 }
  },
  {
    id: 'nun_s3_t2',
    characterId: 'pastoral_nun',
    stage: 3,
    order: 2,
    type: 'read_chapter',
    summary: '阅读《庄子》第二章',
    condition: { bookId: 'book_006', chapterIdx: 1 },
    prereqTasks: ['nun_s3_t1'],
    letterOffer: {
      greeting: '馆长先生/女士：',
      body: '这几天发生的事情颠覆了我对人世的想象。一个被叫做"女巫"的女人比教会更有疗效。一个十二岁的女孩比牧师更懂得安慰。一个伯爵的儿子在读禁书，然后用来拯救百姓。这世界不是非黑即白的——庄子说万物"齐"，此刻我才真正开始理解。请帮我阅读《庄子》第二章。',
      closing: '— 卡特琳'
    },
    letterComplete: {
      body: '"天下莫大于秋毫之末，而太山为小。"庄子说大和小、贵和贱都是相对的。教会教我说，信徒和异教徒之间有绝对的界限。但在这个山谷里，我看到的是：异教徒在救人，而信徒在逃跑。也许真理不像教义问答那么简单。也许上帝比教会要大得多。',
      closing: '— 卡特琳'
    },
    reward: { coins: 40 }
  },
  {
    id: 'nun_s3_t3',
    characterId: 'pastoral_nun',
    stage: 3,
    order: 3,
    type: 'copy_chapter',
    summary: '誊抄《道德经》第二章',
    condition: { bookId: 'book_011', chapterIdx: 1 },
    prereqTasks: ['nun_s3_t1'],
    letterOffer: {
      greeting: '馆长：',
      body: '玛格丽特今天给我看了一段话："上善若水。水善利万物而不争，处众人之所恶，故几于道。"我在教堂改成的收容所里已经待了七天了。这里没有圣坛，没有管风琴，只有药味、汗味和咳嗽声。但奇怪的是——我感觉自己比在修道院里更接近神。请帮我誊抄《道德经》第二章。',
      closing: '— 卡特琳'
    },
    letterComplete: {
      body: '"天下皆知美之为美，斯恶矣。"美和丑、善和恶、神圣和世俗——都是因为对比才存在。那么也许"信仰"和"怀疑"也不是对立的？也许怀疑本身就是更深信仰的开始？在收容所的第七天，我终于可以祈祷了——不是要求上帝解释瘟疫，而是感恩祂让我们相遇。',
      closing: '— 卡特琳'
    },
    reward: { coins: 35, atmo: 1 }
  },
  {
    id: 'nun_s3_t4',
    characterId: 'pastoral_nun',
    stage: 3,
    order: 4,
    type: 'copy_chapter',
    summary: '誊抄《理想国》第一章',
    condition: { bookId: 'book_013', chapterIdx: 0 },
    prereqTasks: ['nun_s3_t2'],
    letterOffer: {
      greeting: '馆长先生/女士：',
      body: '艾德里安对我说了一句话，让我久久无法入睡："修女，你在做的事情和苏格拉底是一样的——你在洞穴里点了一盏灯。"他还说我应该读一读《理想国》里关于洞穴的比喻。那是柏拉图的书——一个异教徒哲学家。我的整个教育都在告诉我不要读这种东西。但我已经变了。请帮我誊抄第一章。',
      closing: '— 卡特琳'
    },
    letterComplete: {
      body: '那个洞穴的比喻——囚徒们一生只看到墙上的影子，以为那就是真实世界。当其中一个挣脱了锁链，走到阳光下，他回来告诉其他人外面有光——却被嘲笑，甚至被杀。我想起玛格丽特被叫做"女巫"的那个夜晚。她就是那个走出洞穴的人。而我，曾经也是洞穴里的囚徒。',
      closing: '— 卡特琳'
    },
    reward: { coins: 40, atmo: 1 }
  },

  // ======================== 卡特琳修女 · Stage 4 ========================
  {
    id: 'nun_s4_t1',
    characterId: 'pastoral_nun',
    stage: 4,
    order: 1,
    type: 'copy_book',
    summary: '完成《沉思录》整本誊抄',
    condition: { bookId: 'book_012' },
    prereqTasks: [],
    letterOffer: {
      greeting: '馆长：',
      body: '瘟疫终于开始退去。收容所里最后一个病人今天回家了——她走的时候回头看了我一眼，没说谢谢，但她的眼睛说了。我想做一件事来纪念这段日子——把马可·奥勒留的《沉思录》完整誊抄下来，不是留给自己，而是留给这座教堂，这座曾经的收容所，未来的任何避难者。请帮我完成。',
      closing: '— 卡特琳'
    },
    letterComplete: {
      body: '抄完最后一个字的时候天亮了。我把手抄本放在教堂唯一的桌子上——那张桌子曾经是圣餐桌，后来变成了药台，现在两者都是。扉页上我写了一段话："这本书的作者不是基督徒，但他教会了我如何像一个真正的基督徒那样去生活。"主教看到大概会皱眉，但我不在乎了。',
      closing: '— 卡特琳'
    },
    reward: { coins: 50, atmo: 1 }
  },
  {
    id: 'nun_s4_t2',
    characterId: 'pastoral_nun',
    stage: 4,
    order: 2,
    type: 'read_chapter',
    summary: '阅读《诗经》第二章',
    condition: { bookId: 'book_015', chapterIdx: 1 },
    prereqTasks: ['nun_s4_t1'],
    letterOffer: {
      greeting: '馆长先生/女士：',
      body: '伯爵解除了封锁令。今天早上我站在山谷的高处，看到第一辆商人的马车从北边的山口驶入。车夫在唱歌——一首我从未听过的民歌。那一刻我想起《诗经》。古代中国的诗歌不只是诗，它是记录，是庆祝，也是治愈。请帮我阅读第二章。我想为新生的山谷找一首赞美的诗。',
      closing: '— 卡特琳'
    },
    letterComplete: {
      body: '读完《诗经》第二章，我知道该唱什么了。下个星期日——瘟疫后的第一个公共礼拜日——我不会读《圣经》里的诗篇。我会读一段《诗经》。有人会困惑，有人会愤怒，但也会有人听懂。那些在田野里耕作了一辈子的人，他们比主教更理解这些三千年前的诗。',
      closing: '— 卡特琳'
    },
    reward: { coins: 40, atmo: 1 }
  },
  {
    id: 'nun_s4_t3',
    characterId: 'pastoral_nun',
    stage: 4,
    order: 3,
    type: 'copy_chapter',
    summary: '誊抄《史记》第二章',
    condition: { bookId: 'book_014', chapterIdx: 1 },
    prereqTasks: ['nun_s4_t1'],
    letterOffer: {
      greeting: '馆长：',
      body: '伯爵来收容所看我了——以前那个教堂。他站在这间地板上有药渍、长椅上刻着孩子们涂鸦的屋子里，沉默了很久。最后他说："请为我的傲慢祈祷。"我没有祈祷。我给了他一本玛格丽特的草药手册，说"用行动忏悔"。后来艾德里安建议我把这些事记录下来，放进《史记》的体例里。请帮我誊抄第二章。',
      closing: '— 卡特琳'
    },
    letterComplete: {
      body: '我决定为这次瘟疫写一部"小史记"——不写帝王将相，只写这个山谷里的人。第一章：草药师玛格丽特。第二章：女孩小艾拉。第三章：学者艾德里安。第四章：领主杜兰伯爵。第五章……也许留给那个不知姓名的商人车夫，他在封锁解除的第一天，唱着歌驶入了山谷。',
      closing: '— 卡特琳'
    },
    reward: { coins: 40, atmo: 1 }
  },
  {
    id: 'nun_s4_t4',
    characterId: 'pastoral_nun',
    stage: 4,
    order: 4,
    type: 'copy_chapter',
    summary: '誊抄《物种起源》第一章',
    condition: { bookId: 'book_008', chapterIdx: 0 },
    prereqTasks: ['nun_s4_t2'],
    letterOffer: {
      greeting: '馆长先生/女士：',
      body: '玛格丽特嘲笑我："你读了这么多哲学书，却还没读过科学？"她拉着我来到图书馆，指着一本叫《物种起源》的书。作为一个修女，我这辈子都在回避这本书。但现在我不怕了——如果上帝是真实的，祂就应该经得起任何知识的检验。请帮我誊抄第一章。',
      closing: '— 卡特琳'
    },
    letterComplete: {
      body: '读完了。达尔文没有否定上帝——他根本就没有谈论上帝。他描述的是一个自我运转的自然界，其中每一样事物都有其来源和历史。如果上帝存在，祂一定更喜欢这种诚实的研究，而不是盲目的赞美。玛格丽特说："欢迎来到科学的世界，修女。"我想我已经准备好入场了。',
      closing: '— 卡特琳'
    },
    reward: { coins: 40, atmo: 1 }
  },

  // ======================== 卡特琳修女 · Stage 5 ========================
  {
    id: 'nun_s5_t1',
    characterId: 'pastoral_nun',
    stage: 5,
    order: 1,
    type: 'copy_book',
    summary: '完成《卡拉马佐夫兄弟》整本誊抄',
    condition: { bookId: 'book_019' },
    prereqTasks: [],
    letterOffer: {
      greeting: '馆长：',
      body: '我要把《卡拉马佐夫兄弟》整本书誊抄下来。这本书陪我走过了信仰坍塌和重建的全过程——从最初的震撼，到中途的痛苦，再到现在的平和。我想把它放在收容所的书架上，放在《圣经》旁边。如果有人问我为什么，我会说：因为阿廖沙也是圣徒——一个不穿黑袍的圣徒。请帮我完成。',
      closing: '— 卡特琳'
    },
    letterComplete: {
      body: '抄完了。阿廖沙在书的结尾对一群孩子们说："记住这一刻——我们此刻在一起，彼此相爱，这就是永恒。"我把这句话刻在了教堂新换的门楣上。不是拉丁文，不是希腊文，是中文——因为这是归墟图书馆带给我们的。谢谢你，馆长。这个山谷的信仰，因你而不同。',
      closing: '— 卡特琳'
    },
    reward: { coins: 50, atmo: 1 }
  },
  {
    id: 'nun_s5_t2',
    characterId: 'pastoral_nun',
    stage: 5,
    order: 2,
    type: 'read_chapter',
    summary: '阅读《理想国》第二章',
    condition: { bookId: 'book_013', chapterIdx: 1 },
    prereqTasks: ['nun_s5_t1'],
    letterOffer: {
      greeting: '馆长先生/女士：',
      body: '伯爵邀请山谷里的"五位关键人物"到城堡商议重建事宜。我列席其中——一个流浪修女，和一位领主坐在同一张桌子上。我建议在重建的规划中，把药房和图书馆放在村庄的中心位置。伯爵问为什么。我说：因为身体和灵魂都需要医治。艾德里安说我的论点很像柏拉图。请帮我阅读《理想国》第二章。',
      closing: '— 卡特琳'
    },
    letterComplete: {
      body: '柏拉图的"理想国"由一个哲人王统治——但前提是这个哲人真的爱智慧胜过爱权力。我不认为杜兰伯爵能成为哲人王，但我确实看到他在努力。也许在现实世界里，理想国不是一个目的地，而是一个方向——只要我们在朝着它走，就已经在改善了。',
      closing: '— 卡特琳'
    },
    reward: { coins: 40 }
  },
  {
    id: 'nun_s5_t3',
    characterId: 'pastoral_nun',
    stage: 5,
    order: 3,
    type: 'copy_chapter',
    summary: '誊抄《诗经》第三章',
    condition: { bookId: 'book_015', chapterIdx: 2 },
    prereqTasks: ['nun_s5_t1'],
    letterOffer: {
      greeting: '馆长：',
      body: '瘟疫过去整整一年了。今天山谷里举行了一场盛大的麦收庆典。老人们在树下唱古老的歌，孩子们在田埂上追逐，玛格丽特在广场上免费派发草药茶，伯爵坐在一旁——没有椅子，和大家一样坐在地上。我想誊抄《诗经》第三章，作为这一年最好的纪念。请帮我。',
      closing: '— 卡特琳'
    },
    letterComplete: {
      body: '诗抄在庆典上被朗诵了。不是由我——我让小艾拉来念。她站在木箱上，用还有点奶气的声音念着三千年前的句子。全场安静。然后玛格丽特第一个鼓掌，然后是所有人。那一刻我理解了什么是"神圣"——不是教堂里的仪式，而是一群经历了苦难的人，在诗歌中找到共同的呼吸。',
      closing: '— 卡特琳'
    },
    reward: { coins: 40, atmo: 1 }
  },
  {
    id: 'nun_s5_t4',
    characterId: 'pastoral_nun',
    stage: 5,
    order: 4,
    type: 'copy_chapter',
    summary: '誊抄《东京梦华录》第一章',
    condition: { bookId: 'book_004', chapterIdx: 0 },
    prereqTasks: ['nun_s5_t2'],
    letterOffer: {
      greeting: '馆长先生/女士：',
      body: '伯爵的新图书馆落成了。不大——比不上归墟图书馆的一个角落——但在山谷里，这是第一座。艾德里安担任馆长，玛格丽特选了第一批科学书籍，小艾拉用她的画装饰了墙壁。我被邀请为图书馆做开馆祝福。我想把《东京梦华录》第一章誊抄下来作为献礼——因为这座新城邦的繁华，将从今日开始。请帮我完成。',
      closing: '— 卡特琳'
    },
    letterComplete: {
      body: '图书馆开馆那天，我站在门前，没有念祷告词。我念了《东京梦华录》里关于"州桥夜市"的那一段——不是因为它在讲吃食，而是因为它描绘了一个活生生的文明。我说："这就是我们想要的——一个人们可以在夜晚自由行走、买一盏灯笼、吃一碗羹汤的世界。为此，我们需要书。需要很多很多书。"全场静默。然后伯爵站起来，第一个走进了图书馆。',
      closing: '— 卡特琳（信的最后画了一座小小的图书馆，门前站着五个人——一大四小，手牵着手）'
    },
    reward: { coins: 50, atmo: 2 }
  },

  // ======================== 艾德里安 · Stage 1 ========================
  {
    id: 'scholar_s1_t1',
    characterId: 'pastoral_scholar',
    stage: 1,
    order: 1,
    type: 'copy_chapter',
    summary: '誊抄《物种起源》第一章',
    condition: { bookId: 'book_008', chapterIdx: 0 },
    prereqTasks: [],
    letterOffer: {
      greeting: '归墟图书馆馆长阁下：',
      body: '我叫艾德里安·杜兰——你可能不认得我，但你一定知道我父亲：杜兰伯爵，这片山谷的统治者。我和他不一样。我从小被送去王都读书，回来时发现我们家族的图书馆里有一整柜贴了封条的禁书。我撕开了其中一本——《物种起源》的残卷。它震撼了我。然后我听说，在另一个世界里，有一座归墟图书馆，拥有这本书的完整版本。请帮我誊抄第一章。',
      closing: '— 艾德里安·杜兰（字迹带着青年人的急切，墨迹未干就折了起来）'
    },
    letterComplete: {
      body: '收到了。和我在父亲禁书柜里找到的残本对比，贵馆的版本完整得多。第一章里关于家鸽育种的那一段，我在残本中从未读过——原来达尔文用养鸽人的人工选择来类比自然选择。这个类比妙极了。我父亲把这本书列为禁书，大概是因为它暗示了万物皆可变——包括社会秩序。',
      closing: '— 艾德里安'
    },
    reward: { coins: 35 }
  },
  {
    id: 'scholar_s1_t2',
    characterId: 'pastoral_scholar',
    stage: 1,
    order: 2,
    type: 'read_chapter',
    summary: '阅读《理想国》第一章',
    condition: { bookId: 'book_013', chapterIdx: 0 },
    prereqTasks: ['scholar_s1_t1'],
    letterOffer: {
      greeting: '馆长阁下：',
      body: '今天我去山下的村庄视察——这是父亲给我的任务，要我学习"管理领地"。但我看到的是：封村的栅栏、药房外愤怒的村民、还有一位被他们叫做"女巫"的女人，在安静地捣药。回城堡的路上，我一直在想一个问题：什么才是正义的统治？父亲说"秩序就是正义"。但柏拉图可能不这么认为。请帮我阅读《理想国》第一章。',
      closing: '— 艾德里安'
    },
    letterComplete: {
      body: '苏格拉底和色拉叙马霍斯的辩论让我激动得睡不着觉。色拉叙马霍斯说"正义就是强者的利益"——这简直就是我父亲的翻版。但苏格拉底没有简单地否定他，而是一步步地追问，直到色拉叙马霍斯自己露出了矛盾。我在想，如果我用同样的方式和我父亲对话……也许他能被说服？虽然现在的我还不敢。',
      closing: '— 艾德里安'
    },
    reward: { coins: 35 }
  },
  {
    id: 'scholar_s1_t3',
    characterId: 'pastoral_scholar',
    stage: 1,
    order: 3,
    type: 'copy_chapter',
    summary: '誊抄《几何原本》第一章',
    condition: { bookId: 'book_018', chapterIdx: 0 },
    prereqTasks: ['scholar_s1_t1'],
    letterOffer: {
      greeting: '馆长阁下：',
      body: '玛格丽特——那位草药师——在和我争论草药配方的时候忽然说："你说服不了我，因为你的论证没有逻辑。"一个没上过大学的村妇对我说这种话！但她是对的。王都的老师们教我修辞和辩论，但没有教我真正的逻辑。欧几里得从五条公理推导出整个几何体系——这才是我想学的。请帮我誊抄《几何原本》第一章。',
      closing: '— 艾德里安'
    },
    letterComplete: {
      body: '我伏在案头整整两天，用尺规把第一章里的每一个命题都证明了一遍。玛格丽特路过的时候看了一眼，说"画得挺好看的"。她轻描淡写的一句话，却让我觉得比王都教授的所有夸赞都有分量。逻辑不只属于学者——它属于每一个认真思考的人。',
      closing: '— 艾德里安'
    },
    reward: { coins: 35 }
  },
  {
    id: 'scholar_s1_t4',
    characterId: 'pastoral_scholar',
    stage: 1,
    order: 4,
    type: 'copy_chapter',
    summary: '誊抄《社会契约论》第一章',
    condition: { bookId: 'book_020', chapterIdx: 0 },
    prereqTasks: ['scholar_s1_t2'],
    letterOffer: {
      greeting: '馆长阁下：',
      body: '父亲把我叫到书房，说有人告密——告我在读"不合适的书"。他给了我两个选择：要么交出所有禁书，要么被剥夺继承权。我看着他的眼睛，说我需要时间考虑。但心里已经有了答案。我需要尽快读完卢梭的《社会契约论》——因为卢梭将会告诉我，我对这片土地的责任，到底是对父亲负责，还是对人民负责。请帮我誊抄第一章。',
      closing: '— 艾德里安（信纸背面有一行被划掉的字：父王——不——父亲大人）'
    },
    letterComplete: {
      body: '卢梭说："人生而自由，却无往不在枷锁之中。"这句话是对我过去二十年人生的完美总结。我住在城堡里，有最好的衣服、最好的食物、最好的教育——却戴着最重的枷锁。而这个山谷里那些佃农、那位被叫做女巫的草药师、那个在药房里画画的小女孩——他们没有枷锁。他们比我自由。',
      closing: '— 艾德里安'
    },
    reward: { coins: 35, atmo: 1 }
  },

  // ======================== 艾德里安 · Stage 2 ========================
  {
    id: 'scholar_s2_t1',
    characterId: 'pastoral_scholar',
    stage: 2,
    order: 1,
    type: 'copy_chapter',
    summary: '誊抄《物种起源》第二章',
    condition: { bookId: 'book_008', chapterIdx: 1 },
    prereqTasks: [],
    letterOffer: {
      greeting: '馆长阁下：',
      body: '我搬出了城堡。父亲没有阻止——他大概觉得我会在"现实"面前碰壁，然后灰溜溜地回来。我在玛格丽特的药房旁边搭了一间木屋，开始系统地记录瘟疫的传播路径。我需要《物种起源》第二章——关于变异的那一章。因为瘟疫也在"变异"，而我需要科学的方法来追踪它。',
      closing: '— 艾德里安'
    },
    letterComplete: {
      body: '达尔文在第二章中说，变异是自然界中最基本的事实——没有两棵草是完全一样的。我用这个思路重新审视了玛格丽特的病历：同一种草药，对不同病人的效果不同。为什么？因为每个人的体质都在"变异"。我现在开始在病历中加入这些变量——年龄、体重、病史——玛格丽特说我"终于开始像真正的学者了"。',
      closing: '— 艾德里安'
    },
    reward: { coins: 35 }
  },
  {
    id: 'scholar_s2_t2',
    characterId: 'pastoral_scholar',
    stage: 2,
    order: 2,
    type: 'read_chapter',
    summary: '阅读《理想国》第二章',
    condition: { bookId: 'book_013', chapterIdx: 1 },
    prereqTasks: ['scholar_s2_t1'],
    letterOffer: {
      greeting: '馆长阁下：',
      body: '卡特琳修女把教堂改成了收容所。我去送药的时候，看到长椅上躺着发烧的孩子，祭坛上堆满了草药。这个场景让我想起柏拉图在《理想国》中的一句话——"城邦的建立源于我们的相互需要"。瘟疫用一种残酷的方式创造了一个共同体：草药师、修女、学者、孩子、甚至领主。请帮我阅读《理想国》第二章。',
      closing: '— 艾德里安'
    },
    letterComplete: {
      body: '柏拉图把城邦分为三个阶层：统治者、护卫者和生产者。但在瘟疫面前，这种划分毫无意义。玛格丽特既是生产者（草药）又是护卫者（防疫）——在某些时刻，她比父亲更像真正的统治者。卡特琳修女说这是"上帝的逆转"。我说这不关上帝的事——这是卢梭说的"公意"在以最朴素的方式显现。',
      closing: '— 艾德里安'
    },
    reward: { coins: 40 }
  },
  {
    id: 'scholar_s2_t3',
    characterId: 'pastoral_scholar',
    stage: 2,
    order: 3,
    type: 'copy_chapter',
    summary: '誊抄《史记》第一章',
    condition: { bookId: 'book_014', chapterIdx: 0 },
    prereqTasks: ['scholar_s2_t1'],
    letterOffer: {
      greeting: '馆长阁下：',
      body: '今天我和父亲进行了一次正式的争论——在城堡的大厅里，在侍卫和管家面前。他坚持封村的命令是正确的，因为"秩序优先"。我反驳说，历史上每一个"秩序优先"的决策，最终都以灾难收场。我当场引用了几个例子——但都是我从王都课本上学来的。卡特琳修女后来悄悄对我说：你应该读《史记》，里面的教训比课本多得多。请帮我誊抄第一章。',
      closing: '— 艾德里安'
    },
    letterComplete: {
      body: '读完第一章我就后悔了——后悔没有早读。司马迁记录的每一个事件都在问同一个问题：权力如何被使用？为什么有些君主明明有好的意图，却酿成了灾难？我想起父亲——他不是暴君，但他是一个信念错误的人。而这种错误，可能在《史记》的每一页中找到先例。下次和他辩论的时候，我不会只用理论了。',
      closing: '— 艾德里安'
    },
    reward: { coins: 35 }
  },
  {
    id: 'scholar_s2_t4',
    characterId: 'pastoral_scholar',
    stage: 2,
    order: 4,
    type: 'copy_chapter',
    summary: '誊抄《社会契约论》第二章',
    condition: { bookId: 'book_020', chapterIdx: 1 },
    prereqTasks: ['scholar_s2_t2'],
    letterOffer: {
      greeting: '馆长阁下：',
      body: '今天发生了一件改变一切的事：父亲带着卫兵来到玛格丽特的药房，准备以"散布谣言"的罪名逮捕她。我站在药房门口，挡住了他。我对他说："卢梭的《社会契约论》第二章——公意不是一个人的意志，哪怕是伯爵的。"他愣住了。不是因为卢梭——是因为他的儿子居然敢阻挡他。请帮我誊抄第二章。我需要在明天之前把它读完。',
      closing: '— 艾德里安（墨迹很重，几乎穿透了纸背）'
    },
    letterComplete: {
      body: '"公意"——这个词值得我用余生去理解。它不是所有人的意见之和，而是一种超越个人私利的共同利益。父亲认为他的意志就是公意——但封村的决策显然对大多数人不利。玛格丽特的草药对大多数人有利。所以谁更代表"公意"？不是伯爵，是女巫。这个结论让我父亲发抖——也让我的决心前所未有地坚定。',
      closing: '— 艾德里安'
    },
    reward: { coins: 40, atmo: 1 }
  },

  // ======================== 艾德里安 · Stage 3 ========================
  {
    id: 'scholar_s3_t1',
    characterId: 'pastoral_scholar',
    stage: 3,
    order: 1,
    type: 'copy_chapter',
    summary: '誊抄《物种起源》第三章',
    condition: { bookId: 'book_008', chapterIdx: 2 },
    prereqTasks: [],
    letterOffer: {
      greeting: '馆长阁下：',
      body: '我的研究进入关键阶段。通过追踪瘟疫在山谷中的传播路径，我发现了一个规律：靠近水源的村庄最先爆发，靠近药房的村庄死亡率最低。这和达尔文在《物种起源》第三章中描述的"生存斗争"机制完全吻合——问题不在于瘟疫有多强，而在于环境有多有利。我需要第三章来完善我的报告。请帮我誊抄。',
      closing: '— 艾德里安'
    },
    letterComplete: {
      body: '谢谢馆长。第三章关于物种间竞争的描述让我有了新的想法：瘟疫和草药之间也在进行一场"军备竞赛"。瘟疫变异，草药配方就得跟进。而关键在于——信息的传播速度能不能超过瘟疫的传播速度？我决定写一份完整的报告，不光记录数据，还要提出一个方案：在每个村庄设立"信息站"——本质上是小型图书馆。',
      closing: '— 艾德里安'
    },
    reward: { coins: 40 }
  },
  {
    id: 'scholar_s3_t2',
    characterId: 'pastoral_scholar',
    stage: 3,
    order: 2,
    type: 'read_chapter',
    summary: '阅读《几何原本》第二章',
    condition: { bookId: 'book_018', chapterIdx: 1 },
    prereqTasks: ['scholar_s3_t1'],
    letterOffer: {
      greeting: '馆长阁下：',
      body: '玛格丽特给了我一个难题：她已经试了十七种不同的配方组合，想知道哪一种组合对退热最有效。我一开始用枚举法——A+B、A+C、B+C……十七种！玛格丽特笑我："你读了那么多书，连这个都算不出来？"我需要复习欧几里得的逻辑推导——也许几何学能给我一个系统化的分析框架。请帮我阅读《几何原本》第二章。',
      closing: '— 艾德里安'
    },
    letterComplete: {
      body: '我设计了一套分类系统！把草药按属性——清热、解毒、活血、利湿——分成四类，然后系统地测试每一类组合。玛格丽特说"你这套东西，村里老太太们也能看懂"。她也许不知道，她随口说出的正是欧几里得的最高理想：让真理对所有人可见。',
      closing: '— 艾德里安'
    },
    reward: { coins: 40 }
  },
  {
    id: 'scholar_s3_t3',
    characterId: 'pastoral_scholar',
    stage: 3,
    order: 3,
    type: 'copy_chapter',
    summary: '誊抄《理想国》第三章',
    condition: { bookId: 'book_013', chapterIdx: 2 },
    prereqTasks: ['scholar_s3_t1'],
    letterOffer: {
      greeting: '馆长阁下：',
      body: '父亲今天独自来了我的木屋——没有卫兵，没有管家，穿着普通的斗篷。他站在这间逼仄的屋子里，看着满墙的笔记和图表，沉默了好久。最后他说："把你写的东西给我看。"我说"你确定要看？可能颠覆你的世界观。"他说"我是来被颠覆的。"这是我在二十二年的人生中，第一次尊敬我的父亲。请帮我誊抄《理想国》第三章——我需要理解洞穴比喻之后的事。',
      closing: '— 艾德里安'
    },
    letterComplete: {
      body: '父亲读了。整整两个时辰，他坐在木屋唯一的那把椅子上，读完了我的全部报告。他读到玛格丽特的病历对比数据时，手在发抖。最后他合上报告，说了一句话："我的每一个决定都是错的。"我说："不——你只是没有足够的信息。现在你有了。"柏拉图说，哲人王之所以是好的统治者，不是因为他不会犯错，而是因为他知道什么是真。',
      closing: '— 艾德里安'
    },
    reward: { coins: 40, atmo: 1 }
  },
  {
    id: 'scholar_s3_t4',
    characterId: 'pastoral_scholar',
    stage: 3,
    order: 4,
    type: 'copy_book',
    summary: '完成《社会契约论》整本誊抄',
    condition: { bookId: 'book_020' },
    prereqTasks: ['scholar_s3_t2'],
    letterOffer: {
      greeting: '馆长阁下：',
      body: '父亲问我："如果你来做领主，你会怎么治理？"我说我要在每一座村庄建立小图书馆，让信息和知识自由流动。他说"你太理想主义"。我说："你读过卢梭吗？"他摇头。"那我送你一本书。"我想把《社会契约论》完整誊抄下来，亲手交给他。不是以儿子的身份——是以公民的身份。请帮我完成。',
      closing: '— 艾德里安'
    },
    letterComplete: {
      body: '我在手抄本的扉页上写了一句话："父亲：这本书不是在教你如何统治，而是在问你：你统治的权力从何而来？从今天起，我将不再称你为「伯爵」。我将称你为「山谷的第一公民」。如果你感到被冒犯了——那正是这本书存在的理由。你的儿子，艾德里安。"',
      closing: '— 艾德里安'
    },
    reward: { coins: 50, atmo: 1 }
  },

  // ======================== 艾德里安 · Stage 4 ========================
  {
    id: 'scholar_s4_t1',
    characterId: 'pastoral_scholar',
    stage: 4,
    order: 1,
    type: 'copy_chapter',
    summary: '誊抄《物种起源》第四章',
    condition: { bookId: 'book_008', chapterIdx: 3 },
    prereqTasks: [],
    letterOffer: {
      greeting: '馆长阁下：',
      body: '瘟疫消退后，我面临了一个从没想过的问题：然后呢？战胜瘟疫的方法——信息共享、草药分发、社区合作——是否可以用来重建？我想读完《物种起源》第四章，看看达尔文如何描述演化的"长期结果"。这套原理应该也适用于人类社会。请帮我誊抄。',
      closing: '— 艾德里安'
    },
    letterComplete: {
      body: '达尔文在这一章中讨论了地质记录的不完整性——我们看到的演化证据只是冰山一角。这让我思考：我们的瘟疫记录，也只是巨大变革的一小部分可见证据。真正深刻的变化已经发生了——人与人之间的信任、对知识的尊重、跨越阶层的合作。这些都是"演化"的结果，但没有人记录它们。也许我应该来记录。',
      closing: '— 艾德里安'
    },
    reward: { coins: 40 }
  },
  {
    id: 'scholar_s4_t2',
    characterId: 'pastoral_scholar',
    stage: 4,
    order: 2,
    type: 'read_chapter',
    summary: '阅读《史记》第二章',
    condition: { bookId: 'book_014', chapterIdx: 1 },
    prereqTasks: ['scholar_s4_t1'],
    letterOffer: {
      greeting: '馆长阁下：',
      body: '父亲正式宣布：山谷将设立"公民议事会"，由五个村庄各选一名代表，与伯爵共同治理。这是一个革命性的决定——虽然在这山谷之外，也许看起来微不足道。卡特琳修女说我应该为此写一篇赋——像《史记》里的体例那样——记录一个制度的诞生。请帮我阅读《史记》第二章，我需要司马迁的文法。',
      closing: '— 艾德里安'
    },
    letterComplete: {
      body: '我动笔了。标题是"田园公民议事会本纪"。法度体例参照《史记》，内容却是全新的：第一章记瘟疫之始，第二章记五人之盟，第三章记封村之议，第四章记改制之决。小艾拉看了说"比王都那些书好看多了"——我正在把这当成最高评价。',
      closing: '— 艾德里安'
    },
    reward: { coins: 40 }
  },
  {
    id: 'scholar_s4_t3',
    characterId: 'pastoral_scholar',
    stage: 4,
    order: 3,
    type: 'copy_chapter',
    summary: '誊抄《东京梦华录》第一章',
    condition: { bookId: 'book_004', chapterIdx: 0 },
    prereqTasks: ['scholar_s4_t1'],
    letterOffer: {
      greeting: '馆长阁下：',
      body: '小艾拉给了我一幅画——她想象中的"重建后的山谷"。画里有图书馆、有草药园、有市集、有孩子们的学校。她说这幅画的灵感来自一本叫《东京梦华录》的书，讲的是古代中国一座繁华的城市。我被她的想象力震撼了。一座山谷，也能成为"梦华"吗？请帮我誊抄第一章。我想看看这座她梦想中的城市。',
      closing: '— 艾德里安'
    },
    letterComplete: {
      body: '读完孟元老的汴京，我忽然意识到：繁华不是等来的，是建出来的。州桥、夜市、勾栏瓦舍——每一个细节背后都有人在做决定。我们的山谷也可以。不过我们不只要重建城市——我们要重建信任。小艾拉的画已经被我挂在木屋的墙上，成为山谷重建规划的"第一页"。',
      closing: '— 艾德里安'
    },
    reward: { coins: 40, atmo: 1 }
  },
  {
    id: 'scholar_s4_t4',
    characterId: 'pastoral_scholar',
    stage: 4,
    order: 4,
    type: 'copy_chapter',
    summary: '誊抄《道德经》第一章',
    condition: { bookId: 'book_011', chapterIdx: 0 },
    prereqTasks: ['scholar_s4_t2'],
    letterOffer: {
      greeting: '馆长阁下：',
      body: '父亲今早来找我，带着一份手写的文件——他的退位声明。他说他老了，不懂新时代的规则，山谷需要"懂得倾听的人"。我看着他的脸——他眼里有失落，但更多的是解脱。我请他和我一起读完《道德经》——"功成而弗居"。他没有拒绝。请帮我誊抄第一章。',
      closing: '— 艾德里安'
    },
    letterComplete: {
      body: '"道可道，非常道。"我和父亲坐在木屋前的台阶上，一起念了这句话。父亲说他在位的四十年里从来没有读过一本哲学书——"公务太忙"。今天他不忙了。他问我能不能每周给他推荐一本书。我说第一本是《道德经》——不是因为它最正确，而是因为它最安静。在一个安静的午后，和一个安静的父亲一起，读一本安静的书。',
      closing: '— 艾德里安'
    },
    reward: { coins: 40, atmo: 1 }
  },

  // ======================== 艾德里安 · Stage 5 ========================
  {
    id: 'scholar_s5_t1',
    characterId: 'pastoral_scholar',
    stage: 5,
    order: 1,
    type: 'copy_book',
    summary: '完成《物种起源》整本誊抄',
    condition: { bookId: 'book_008' },
    prereqTasks: [],
    letterOffer: {
      greeting: '馆长阁下：',
      body: '新图书馆的基石已经埋下。在那块基石下面，我埋了一个铜盒，里面有五位"第一公民"写下的寄语。我的寄语只有一句话："知识是瘟疫唯一的解药。"我想把《物种起源》整本书誊抄下来，放在新图书馆最中心的位置。不是为了纪念过去——是为了准备下一次。因为下一次瘟疫一定会来，而我们要确保下一次，有人读得懂这本书。请帮我完成。',
      closing: '— 艾德里安'
    },
    letterComplete: {
      body: '抄完了。我把这本手抄的《物种起源》交给了玛格丽特——因为她是山谷里第一个践行了达尔文精神的人：不断地观察、记录、试验、修正。她对我说："这本书我用了两年才读完。但以后的人，可以在图书馆里一个下午就读完。"这就是进步，馆长。这就是你带给我们的东西。',
      closing: '— 艾德里安'
    },
    reward: { coins: 50, atmo: 1 }
  },
  {
    id: 'scholar_s5_t2',
    characterId: 'pastoral_scholar',
    stage: 5,
    order: 2,
    type: 'read_chapter',
    summary: '阅读《理想国》第四章',
    condition: { bookId: 'book_013', chapterIdx: 3 },
    prereqTasks: ['scholar_s5_t1'],
    letterOffer: {
      greeting: '馆长阁下：',
      body: '公民议事会第一次会议，讨论了六个小时。议题从农田分配到草药站扩建，从路灯安装到孩子们的教材选择。没有人摔门、没有人威胁处决——虽然中间吵了三次。散会的时候，窗外在下雨，但我们五个人站在门廊下，谁都没有先走。卡特琳修女轻轻说了一句："这才是地上的国。"请帮我阅读《理想国》第四章。我想在下次会议前重温柏拉图关于正义城邦的最后论述。',
      closing: '— 艾德里安'
    },
    letterComplete: {
      body: '柏拉图说，理想国之所以是"理想"，是因为它永远在到来之中——从不在任何现实的城邦中完全实现。读完第四章我松了一口气：原来连柏拉图都知道自己的蓝图只是一种引导。我们的公民议事会不是理想国——它效率低下，争吵不断，偶尔还有人打瞌睡。但它比理想国好——因为它是真实的。它是我们的。',
      closing: '— 艾德里安'
    },
    reward: { coins: 40 }
  },
  {
    id: 'scholar_s5_t3',
    characterId: 'pastoral_scholar',
    stage: 5,
    order: 3,
    type: 'copy_chapter',
    summary: '誊抄《史记》第三章',
    condition: { bookId: 'book_014', chapterIdx: 2 },
    prereqTasks: ['scholar_s5_t1'],
    letterOffer: {
      greeting: '馆长阁下：',
      body: '我终于完成了《田园公民议事会本纪》的初稿。现在我要为山谷写"列传"——每一个在这场瘟疫中发挥了作用的人，都值得被单独记录。司马迁在《史记》第三章里为刺客、游侠、商人做传——这些人在"正史"中从无地位，但在司马迁笔下，他们是比帝王更真实的历史。请帮我誊抄第三章，作为我写"山谷列传"的体例范本。',
      closing: '— 艾德里安'
    },
    letterComplete: {
      body: '我已经写好了三篇：玛格丽特列传（"少孤，从山中老妪习草药，村民以女巫目之"），卡特琳列传（"北方修道院散修，至山谷，开教堂为收容所"），和小艾拉列传（"以稚龄历瘟疫，每有事，辄以画笔记之"）。小艾拉看到自己的"列传"时笑得在地上打滚，说"我还没死呢怎么写列传"。我说这叫"生传"——司马迁没做过，但归墟图书馆让我敢这么做。',
      closing: '— 艾德里安'
    },
    reward: { coins: 40, atmo: 1 }
  },
  {
    id: 'scholar_s5_t4',
    characterId: 'pastoral_scholar',
    stage: 5,
    order: 4,
    type: 'copy_chapter',
    summary: '誊抄《诗经》第一章',
    condition: { bookId: 'book_015', chapterIdx: 0 },
    prereqTasks: ['scholar_s5_t2'],
    letterOffer: {
      greeting: '馆长阁下：',
      body: '这是我在归墟图书馆的最后一个请求。新图书馆将在下个月落成，届时山谷里的每一个人——无论贫富——都可以自由借阅。小艾拉建议在开馆典礼上朗诵一首诗。我说"《诗经》吧——我们都是从这本书开始的。"她记得玛格丽特第一次帮她读《诗经》的那个夜晚，我记得父亲第一次安静地读《道德经》的那个午后。请帮我誊抄第一章——送给我们的新图书馆。',
      closing: '— 艾德里安（信纸边缘有一行工整的引文：博尔赫斯说，天堂应该是图书馆的模样。我觉得，天堂更像你——归墟图书馆的馆长。）'
    },
    letterComplete: {
      body: '"关关雎鸠，在河之洲。窈窕淑女，君子好逑。"我在开馆典礼上念了这首诗。小艾拉在我旁边画画——画的是山谷的全景，里面有麦田、药房、教堂、城堡，和正中央的图书馆。她把画送给馆长——是你，这个位面之外的身影，你从未踏入山谷一步，却在每一个转角改变了它的命运。谢谢你。我们每一个人都谢谢你。',
      closing: '— 艾德里安·杜兰，山谷新图书馆第一任馆长（不再是"伯爵之子"）'
    },
    reward: { coins: 50, atmo: 2 }
  },

  // ======================== 杜兰伯爵 · Stage 1 ========================
  {
    id: 'lord_s1_t1',
    characterId: 'pastoral_lord',
    stage: 1,
    order: 1,
    type: 'read_chapter',
    summary: '阅读《沉思录》第一章',
    condition: { bookId: 'book_012', chapterIdx: 0 },
    prereqTasks: [],
    letterOffer: {
      greeting: '归墟图书馆馆长：',
      body: '我是杜兰——你大概听过我的名字，多半是不好的评价。我不辩解。在瘟疫最严重的时候，我下令封锁了村庄。我的儿子因此和我决裂，一个草药师比我更受人民尊敬，一个流浪修女把我的教堂变成了收容所。在我统治山谷四十年后，我发现自己成了一个笑话。我的儿子说："读读《沉思录》吧——它的作者也是统治者，但他面对的不是失败，而是自己。"请帮我阅读第一章。',
      closing: '— 杜兰（字迹端正古板，每一个字母都像是用尺子量过的）'
    },
    letterComplete: {
      body: '马可·奥勒留是罗马皇帝。他拥有我不曾拥有的力量，却也面对过我不曾面对的黑暗——战争、瘟疫、背叛、丧子。但他在《沉思录》的第一章中没有写任何关于帝国的事。他写的是他从亲人和老师那里学到了什么：谦逊、勤勉、简朴、节制。一个皇帝，在写一本关于"如何做人"的书。也许我也该从"统治者"的身份里退出来，先学学怎么做一个人。',
      closing: '— 杜兰'
    },
    reward: { coins: 35 }
  },
  {
    id: 'lord_s1_t2',
    characterId: 'pastoral_lord',
    stage: 1,
    order: 2,
    type: 'copy_chapter',
    summary: '誊抄《道德经》第一章',
    condition: { bookId: 'book_011', chapterIdx: 0 },
    prereqTasks: ['lord_s1_t1'],
    letterOffer: {
      greeting: '馆长：',
      body: '我的儿子艾德里安对我说了一句话："治大国若烹小鲜。"他说这不是他的句子，是一个叫老子的东方哲人在两千年前说的。我掌管这片山谷四十年，制定了无数法令，派出了无数士兵。如果"烹小鲜"才是治国的正确方法——那我这四十年都做错了什么？请帮我誊抄《道德经》第一章。',
      closing: '— 杜兰'
    },
    letterComplete: {
      body: '"道可道，非常道。"老子说真正的道是无法言说的——这对我这样的人来说简直是灾难。我喜欢定义、喜欢规则、喜欢一切都能被写在纸上的东西。但这个山谷里真正重要的东西——玛格丽特的草药、卡特琳的慈悲、小艾拉的画——都不是我用命令创造出来的。它们在我所有的法令之外生长出来。也许"无为"不是什么都不做，而是不要妨碍那些比法令更强大的力量。',
      closing: '— 杜兰'
    },
    reward: { coins: 35 }
  },
  {
    id: 'lord_s1_t3',
    characterId: 'pastoral_lord',
    stage: 1,
    order: 3,
    type: 'read_chapter',
    summary: '阅读《史记》第一章',
    condition: { bookId: 'book_014', chapterIdx: 0 },
    prereqTasks: ['lord_s1_t1'],
    letterOffer: {
      greeting: '馆长：',
      body: '卡特琳修女对我说了一句比任何刀剑都锋利的话："伯爵大人，你觉得百年之后，人们会怎样书写你？"我愣住了。我在王都学过编年史——但那是贵族的编年史，胜利者的编年史。卡特琳说东方有一部《史记》，记录的不仅仅是帝王，还有刺客、商贾和失败的将军。请帮我阅读第一章。我想知道我可能被怎样记录。',
      closing: '— 杜兰'
    },
    letterComplete: {
      body: '读完《史记》第一章我就明白了：历史不会记得我的政令，但会记得我的选择。如果我的选择导致了更多人的死亡，那么无论我的初衷是什么，史书上都会写"杜兰伯爵，刚愎自用，瘟疫中封村自守，民多死之"。但艾德里安告诉我，司马迁也记录了那些改变的人——那些在关键时刻选择了不同道路的人。也许我还能选择。',
      closing: '— 杜兰'
    },
    reward: { coins: 35 }
  },
  {
    id: 'lord_s1_t4',
    characterId: 'pastoral_lord',
    stage: 1,
    order: 4,
    type: 'copy_chapter',
    summary: '誊抄《理想国》第一章',
    condition: { bookId: 'book_013', chapterIdx: 0 },
    prereqTasks: ['lord_s1_t2'],
    letterOffer: {
      greeting: '馆长：',
      body: '我的儿子说，柏拉图在《理想国》中定义了他所知道的"正义"——而这个定义和我一生所信奉的截然不同。我一直在告诉自己：封村是为了多数人的利益。但苏格拉底大概会用三个问题就让我哑口无言。我需要亲自面对他。请帮我誊抄《理想国》第一章。',
      closing: '— 杜兰'
    },
    letterComplete: {
      body: '色拉叙马霍斯说"正义是强者的利益"——我读到这里的时候放下了书，在房间里走了很久。因为这就是我四十年来信奉的信条：因为我是强者，所以我定义的正义就是正义。但苏格拉底没有放过他。他一步步逼问，直到色拉叙马霍斯自相矛盾。我出了一身冷汗——因为在苏格拉底的对话中，我看到了我自己。',
      closing: '— 杜兰'
    },
    reward: { coins: 35, atmo: 1 }
  },

  // ======================== 杜兰伯爵 · Stage 2 ========================
  {
    id: 'lord_s2_t1',
    characterId: 'pastoral_lord',
    stage: 2,
    order: 1,
    type: 'copy_chapter',
    summary: '誊抄《社会契约论》第一章',
    condition: { bookId: 'book_020', chapterIdx: 0 },
    prereqTasks: [],
    letterOffer: {
      greeting: '馆长：',
      body: '我解除了封村令。不是因为我确信这是对的——而是因为我终于承认，我不确定。我的儿子给了我卢梭的《社会契约论》，说"这本书会告诉你，为什么你的不确定比你的确定更正确"。我需要从头理解一个问题：统治者凭什么统治？如果答案是"传统"，那我父亲为什么能统治？如果是"武力"，那我算不算暴君？如果是"人民的同意"——那我从未问过他们的同意。请帮我誊抄第一章。',
      closing: '— 杜兰'
    },
    letterComplete: {
      body: '"人生而自由，却无往不在枷锁之中。"卢梭说，合法的政治权威只能来自社会契约——来自人民的一致同意。不是武力，不是世袭，不是传统，甚至不是效率。我坐在空荡荡的城堡大厅里，回想四十年来我做过的每一个重大决定，没有一个是征求过"同意"的。我忽然觉得很冷——不是因为风寒，而是因为我意识到自己统治了四十年，却从来不是一个合法的统治者。',
      closing: '— 杜兰'
    },
    reward: { coins: 40 }
  },
  {
    id: 'lord_s2_t2',
    characterId: 'pastoral_lord',
    stage: 2,
    order: 2,
    type: 'read_chapter',
    summary: '阅读《史记》第二章',
    condition: { bookId: 'book_014', chapterIdx: 1 },
    prereqTasks: ['lord_s2_t1'],
    letterOffer: {
      greeting: '馆长：',
      body: '我决定做一件从未做过的事：巡视每一个村庄，不是以领主视察的姿态，而是——我不知道以什么姿态。一个老农民在田埂上拦住了我，说"伯爵老爷，你终于来了。我儿子三个月前死了——不是死于瘟疫，是死于饥饿。因为你的栅栏把粮食也拦在了外面。"我站在那里，一句话也说不出来。艾德里安说《史记》第二章里有很多这样的故事。请帮我阅读。',
      closing: '— 杜兰'
    },
    letterComplete: {
      body: '读完了。那些农民的名字司马迁都记下来了——虽然他们的名字只有两个字，没有爵位，没有封地。但他们被记住了。我问艾德里安："那个在田埂上拦住我的老农——你记下他的名字了吗？"艾德里安说："记了。他叫班森。他的儿子叫班尼。班尼死的时候九岁。"我一生签过成千上万份文件，但这三个字的名字，比我签过的任何东西都重。',
      closing: '— 杜兰'
    },
    reward: { coins: 40, atmo: 1 }
  },
  {
    id: 'lord_s2_t3',
    characterId: 'pastoral_lord',
    stage: 2,
    order: 3,
    type: 'copy_chapter',
    summary: '誊抄《理想国》第二章',
    condition: { bookId: 'book_013', chapterIdx: 1 },
    prereqTasks: ['lord_s2_t1'],
    letterOffer: {
      greeting: '馆长：',
      body: '我的儿子建议设立"公民议事会"——让每个村庄选出代表，参与山谷的治理。我的第一反应是反对——这是我的山谷！但随后我听到了自己说的话，在空荡荡的书房里回荡——"我的"。这就是问题所在。山谷不是我的。从来就不是。柏拉图在《理想国》里描述了一个由哲人统治的城邦——也许它不存在，但它至少提供了一个方向。请帮我誊抄第二章。',
      closing: '— 杜兰'
    },
    letterComplete: {
      body: '柏拉图说守护者需要接受严格的教育——不光是军事和数学，还有音乐和哲学。我在想，如果四十年前我开始学习治理学——而不是从父亲那里继承"统治手册"——这个山谷会有多不同？但悔恨没有用。我对艾德里安说"我同意设立议事会，但我有一个条件：我也要作为学生旁听——不是作为领主。"他看了我很久，然后说"好。"',
      closing: '— 杜兰'
    },
    reward: { coins: 40 }
  },
  {
    id: 'lord_s2_t4',
    characterId: 'pastoral_lord',
    stage: 2,
    order: 4,
    type: 'copy_chapter',
    summary: '誊抄《东京梦华录》第一章',
    condition: { bookId: 'book_004', chapterIdx: 0 },
    prereqTasks: ['lord_s2_t2'],
    letterOffer: {
      greeting: '馆长：',
      body: '玛格丽特来找我了——我以前叫过她"女巫"。她在我面前放下一本书——《东京梦华录》，说："这是小艾拉最喜欢的书。讲的是很久以前一座城市最繁华时的样子。伯爵大人，你能不能想象一下：一百年后，旅人来到这座山谷的时候，他们会在游记里怎么写？"她不是在挑衅，她是真诚地在问。请帮我誊抄第一章。',
      closing: '— 杜兰'
    },
    letterComplete: {
      body: '孟元老写汴京的时候，是在回忆——那座城市已经毁了。但他笔下的每一座桥、每一盏灯、每一道小吃，都完好地保存在文字里。我在想：也许我的余生只需要做一件事——让这座山谷在未来某个人的回忆录里，是一座值得被回忆的地方。不是我的纪念碑，而是所有人的家。',
      closing: '— 杜兰'
    },
    reward: { coins: 40, atmo: 1 }
  },

  // ======================== 杜兰伯爵 · Stage 3 ========================
  {
    id: 'lord_s3_t1',
    characterId: 'pastoral_lord',
    stage: 3,
    order: 1,
    type: 'copy_book',
    summary: '完成《道德经》整本誊抄',
    condition: { bookId: 'book_011' },
    prereqTasks: [],
    letterOffer: {
      greeting: '馆长：',
      body: '我把伯爵的权杖收进了箱子里。不——不是退位。我还挂着伯爵的名号，但我做了一枚新的印章，上面刻的不是杜兰家徽，而是一行字："治大国若烹小鲜。"我想把《道德经》完整誊抄下来，送给我自己——作为我新的"统治手册"。请帮我完成。',
      closing: '— 杜兰'
    },
    letterComplete: {
      body: '八十一个章节。我一个字一个字地抄完了。抄到"上善若水"的时候，我想起了玛格丽特——她像水一样流过了这座山谷，绕过了我这块顽石，滋养了每一个需要她的人。抄到"功成身退"的时候，我想起了我自己的未来。抄到"信言不美"的时候，我想起了卡特琳——她总是说最难听的话，但每一句都是真的。谢谢馆长。这本书不是结束，是另一个开始。',
      closing: '— 杜兰'
    },
    reward: { coins: 50, atmo: 1 }
  },
  {
    id: 'lord_s3_t2',
    characterId: 'pastoral_lord',
    stage: 3,
    order: 2,
    type: 'read_chapter',
    summary: '阅读《沉思录》第二章',
    condition: { bookId: 'book_012', chapterIdx: 1 },
    prereqTasks: ['lord_s3_t1'],
    letterOffer: {
      greeting: '馆长：',
      body: '今天公民议事会上，一个农夫代表当面对我说："伯爵大人，你的道歉我们收下了，但信任不是用道歉买的，是用做的事。"他说得对。我需要每天提醒自己——马可·奥勒留也是这样做的：他在军帐中每天给自己写信，提醒自己该做什么样的人。我需要继续读《沉思录》。请帮我阅读第二章。',
      closing: '— 杜兰'
    },
    letterComplete: {
      body: '马可·奥勒留说："在清晨告诉自己：今天我会遇到傲慢的人、忘恩负义的人、嫉妒的人。"但他没有说"因此我要远离他们"。他说"我知道这些人都和我一样，有着同样的理性，所以我不能对他们生气。"那个在议事会上指责我的农夫——他不是敌人，他是在告诉我真相。我应该感激他。',
      closing: '— 杜兰'
    },
    reward: { coins: 40 }
  },
  {
    id: 'lord_s3_t3',
    characterId: 'pastoral_lord',
    stage: 3,
    order: 3,
    type: 'copy_chapter',
    summary: '誊抄《史记》第三章',
    condition: { bookId: 'book_014', chapterIdx: 2 },
    prereqTasks: ['lord_s3_t1'],
    letterOffer: {
      greeting: '馆长：',
      body: '艾德里安在编一部"山谷列传"。他给我看了草稿——其中有一篇写的是我。标题是"杜兰伯爵本纪"。我说"本纪是给帝王写的，我不配。"他说"司马迁的本纪不仅写给帝王——也写给了项羽，他失败了，但他改变了历史的方向。"我读了那篇草稿，发现艾德里安没有掩饰我的过错。但他也在最后写了一句话："瘟疫过去一年之后，杜兰伯爵站在新图书馆的工地上，说「这是我此生做过的第一件正确的事。」"请帮我誊抄《史记》第三章。我想看看太史公是怎样用一句话写完一个人的一生的。',
      closing: '— 杜兰'
    },
    letterComplete: {
      body: '读完了。司马迁写项羽："力拔山兮气盖世，时不利兮骓不逝。"英雄末路，悲歌一曲。但司马迁还是没有用最后的失败否定项羽的一生。我在想——如果司马迁来写我，他会怎么写？我希望他能写："杜兰伯爵，初以刚愎闻。中年庚戌，山谷大疫，始改过。晚年设议事会、建图书馆，山谷以宁。"仅此而已，不需要赞美，只需要真实。',
      closing: '— 杜兰'
    },
    reward: { coins: 40, atmo: 1 }
  },
  {
    id: 'lord_s3_t4',
    characterId: 'pastoral_lord',
    stage: 3,
    order: 4,
    type: 'copy_chapter',
    summary: '誊抄《诗经》第一章',
    condition: { bookId: 'book_015', chapterIdx: 0 },
    prereqTasks: ['lord_s3_t2'],
    letterOffer: {
      greeting: '馆长：',
      body: '下个月是山谷的丰收庆典——瘟疫后第一个真正的庆典。艾德里安和卡特琳让我上台讲话。我能说什么？"对不起"已经说过了。"我错了"也说过了。小艾拉递给我一张纸条，上面写着一行字："关关雎鸠，在河之洲。"她说这是《诗经》里的第一句，念给所有人听就对了。一个十二岁的小孩，比我更懂得怎么说"一切都会好起来"。请帮我誊抄第一章。',
      closing: '— 杜兰'
    },
    letterComplete: {
      body: '我站在广场的木台上，面前是整个山谷的人。我拿着《诗经》的手抄本，念了第一句："关关雎鸠，在河之洲。"台下安静了——大概从没人听过伯爵读诗。然后我放下书，说："我不是一个诗人。我做过很多错事。但今天，我想和你们一起重新开始。不是作为伯爵和子民——而是作为人和人。"玛格丽特第一个鼓掌。然后是所有人。',
      closing: '— 杜兰（这封信的墨迹比第一封轻了很多——像是终于卸下了某种重量）'
    },
    reward: { coins: 40, atmo: 1 }
  },

  // ======================== 杜兰伯爵 · Stage 4 ========================
  {
    id: 'lord_s4_t1',
    characterId: 'pastoral_lord',
    stage: 4,
    order: 1,
    type: 'copy_book',
    summary: '完成《理想国》整本誊抄',
    condition: { bookId: 'book_013' },
    prereqTasks: [],
    letterOffer: {
      greeting: '馆长：',
      body: '公民议事会运作一年了。有争吵，有妥协，偶尔还有人在会上打瞌睡。但——它活下来了。我想把《理想国》整本书誊抄下来，不是作为蓝图（我们的小山谷显然不是理想国），而是作为对照——让我们知道自己离真正好的城邦还有多远，也让我们知道自己已经走了多远。请帮我完成。',
      closing: '— 杜兰'
    },
    letterComplete: {
      body: '抄完了。柏拉图花了十卷书构造了一个可能永远无法实现的城邦——但他还是写了。为什么？因为"理想"的意义不在于被实现，而在于被指向。每一代人、每一座山谷，都有自己的理想国要去接近。我们的公民议事会也许只是原野上的一个小火堆，但这个火堆的存在本身，就证明了我们可以选择一种不同的方式活在彼此之间。',
      closing: '— 杜兰'
    },
    reward: { coins: 50, atmo: 1 }
  },
  {
    id: 'lord_s4_t2',
    characterId: 'pastoral_lord',
    stage: 4,
    order: 2,
    type: 'read_chapter',
    summary: '阅读《社会契约论》第二章',
    condition: { bookId: 'book_020', chapterIdx: 1 },
    prereqTasks: ['lord_s4_t1'],
    letterOffer: {
      greeting: '馆长：',
      body: '议事会上有人提议：设立一个正式的"宪法"——将议事会的权责、伯爵的权责、村庄自治的权责都写成文字。这个提议让我敬畏——因为这意味着，就连我的继任者也不能任意推翻。我是最后一个拥有"无限权力"的杜兰伯爵。以后每一任都将受到"宪法"的约束。卢梭的《社会契约论》第二章讲的就是这个。请帮我阅读。',
      closing: '— 杜兰'
    },
    letterComplete: {
      body: '"公意"——卢梭反复强调，公意不是私人意愿的总和。它要求每个人超越自己的利益，看向更大的共同体。我坐在议事会上，听代表们争论，忽然觉得：这，就是"公意"的诞生过程。它不优雅，不整齐，有时荒唐——但它真实。比我的"法令"要真实得多。',
      closing: '— 杜兰'
    },
    reward: { coins: 40 }
  },
  {
    id: 'lord_s4_t3',
    characterId: 'pastoral_lord',
    stage: 4,
    order: 3,
    type: 'copy_chapter',
    summary: '誊抄《物种起源》第一章',
    condition: { bookId: 'book_008', chapterIdx: 0 },
    prereqTasks: ['lord_s4_t1'],
    letterOffer: {
      greeting: '馆长：',
      body: '我的整个通知生涯中，我对"科学"的态度是轻蔑的——那是学者的消遣，与治理无关。但在这一年里，我亲眼看到科学（玛格丽特的草稿统计、艾德里安的传播路径追踪）如何比我的法令更有效地保护了人民的生命。我欠科学一个道歉。也欠自己一个开始。请帮我誊抄《物种起源》第一章——虽然我不确定我能读懂多少。',
      closing: '— 杜兰'
    },
    letterComplete: {
      body: '我读了整整五天——比我读任何法律文件都要慢。但我读完了。达尔文的世界里没有君主意愿，没有神圣计划——只有自然的法则，安静而坚执地运作。这让我感到了一种前所未有的谦卑：在自然面前，所有的权力都是微小的。领主的法令可以改变税收，但改变不了病毒变异的方式。只有科学可以让我们适应它。',
      closing: '— 杜兰'
    },
    reward: { coins: 40, atmo: 1 }
  },
  {
    id: 'lord_s4_t4',
    characterId: 'pastoral_lord',
    stage: 4,
    order: 4,
    type: 'copy_chapter',
    summary: '誊抄《老人与海》第一章',
    condition: { bookId: 'book_003', chapterIdx: 0 },
    prereqTasks: ['lord_s4_t2'],
    letterOffer: {
      greeting: '馆长：',
      body: '小艾拉今天来找我——她从来没有单独来找过我。她在我桌上放了一本书：《老人与海》，说"这是我学会勇敢的书，我觉得你也需要读。"她画了一只大海的鱼在封面内页。她走后我坐了良久——一个十二岁的孩子，来给一个六十岁的伯爵送关于勇敢的书。请帮我誊抄第一章。',
      closing: '— 杜兰'
    },
    letterComplete: {
      body: '圣地亚哥已经八十四天没有捕到鱼了。别的渔夫在笑话他。但他仍然每天出海。不是因为确信自己会捕到鱼——而是因为他是一个渔夫，打鱼是他该做的事。我想起我自己——我不是渔夫，但我曾经是伯爵。做伯爵"该做的事"，以前我觉得是下令。现在我觉得，是让这个山谷变得更好。不管需要多少天。不管别人怎么看我。',
      closing: '— 杜兰'
    },
    reward: { coins: 40, atmo: 1 }
  },

  // ======================== 杜兰伯爵 · Stage 5 ========================
  {
    id: 'lord_s5_t1',
    characterId: 'pastoral_lord',
    stage: 5,
    order: 1,
    type: 'copy_book',
    summary: '完成《史记》整本誊抄',
    condition: { bookId: 'book_014' },
    prereqTasks: [],
    letterOffer: {
      greeting: '馆长：',
      body: '艾德里安的"山谷列传"终于完成了。全书五卷，记载了瘟疫始末和每一个值得纪念的人。他请我写"终章"——不是以伯爵的身份，而是以"第一个读书的杜兰"的身份。我想把《史记》整本书誊抄下来，和这部山谷列传放在一起——一方面是致敬司马迁，另一方面是提醒后人：历史是由人书写的，所以也永远可以被改变。请帮我完成这最后一本大书。',
      closing: '— 杜兰'
    },
    letterComplete: {
      body: '抄完了。一百三十卷——我花了一个月。抄到最后一卷"太史公自序"的时候，我落泪了。司马迁在那篇自序里面说："究天人之际，通古今之变，成一家之言。"我不敢说山谷列传"通古今之变"，但它至少记录了这一次瘟疫中所有人的努力——从草药师到修女，从小女孩到学者。包括我。尤其是我——不是作为完美的统治者，而是作为一个人。',
      closing: '— 杜兰'
    },
    reward: { coins: 50, atmo: 1 }
  },
  {
    id: 'lord_s5_t2',
    characterId: 'pastoral_lord',
    stage: 5,
    order: 2,
    type: 'read_chapter',
    summary: '阅读《东京梦华录》第二章',
    condition: { bookId: 'book_004', chapterIdx: 1 },
    prereqTasks: ['lord_s5_t1'],
    letterOffer: {
      greeting: '馆长：',
      body: '新图书馆开馆典礼即将举行。我在准备演讲稿——这大概是我这辈子最重要的讲话。不是对军队发号施令，也不是发布封锁令，而是——宣布山谷的第一座公共图书馆向所有人开放。孟元老写《东京梦华录》的时候怀着对已毁京城的不舍——而我在写演讲稿的时候，怀着对一个正在重生之地的期待。请帮我阅读第二章。',
      closing: '— 杜兰'
    },
    letterComplete: {
      body: '孟元老写"州桥夜市"的那些段落——种种小吃，道道杂戏——都是在写一样东西：平凡的幸福。瘟疫夺走的就是这个。而我们要重建的，也是这个。在明天的开馆典礼上，我不会谈"治理"或"法令"——我谈街角的灯笼，谈孩子的笑声，谈一个人在图书馆的窗前，安静地翻开一本书。这些，才是我们战胜瘟疫的终极证明。',
      closing: '— 杜兰'
    },
    reward: { coins: 40, atmo: 1 }
  },
  {
    id: 'lord_s5_t3',
    characterId: 'pastoral_lord',
    stage: 5,
    order: 3,
    type: 'copy_chapter',
    summary: '誊抄《道德经》第二章',
    condition: { bookId: 'book_011', chapterIdx: 1 },
    prereqTasks: ['lord_s5_t1'],
    letterOffer: {
      greeting: '馆长：',
      body: '开馆典礼前夜，我又想起了《道德经》。老子说"功成而弗居"——完成了，但不占为己有。当新图书馆明天开馆的时候，功劳应该属于谁？属于玛格丽特的草药手稿、卡特琳的收容所祈祷、小艾拉的画、艾德里安的田野笔记。我只是在最后——在自己的图书馆里放上了第一块砖。请帮我誊抄第二章。',
      closing: '— 杜兰'
    },
    letterComplete: {
      body: '"天下皆知美之为美，斯恶矣。皆知善之为善，斯不善已。"我以前追求的是让别人知道我的"善"——颁发政令、树立纪念碑、让历史记住我。但真正的好事情——草药、祈祷、孩子画的画、儿子对抗父辈的勇气——都不需要被记住才伟大。它们本身就是光。在明天的典礼上，我将把灯光照在这些人身上，而不是自己。',
      closing: '— 杜兰'
    },
    reward: { coins: 40, atmo: 1 }
  },
  {
    id: 'lord_s5_t4',
    characterId: 'pastoral_lord',
    stage: 5,
    order: 4,
    type: 'copy_chapter',
    summary: '誊抄《诗经》第二章',
    condition: { bookId: 'book_015', chapterIdx: 1 },
    prereqTasks: ['lord_s5_t2'],
    letterOffer: {
      greeting: '馆长：',
      body: '这是我在这个位面的最后一项请求了。图书馆开馆典礼将于明日举行，届时全山谷的人都会在场。我需要在典礼上念一段合适的文字——不是法令，不是宣言，而是某种更古老的、关于大地与再生的东西。玛格丽特建议我用《诗经》第二章。她说："这些诗歌曾经在田野上被歌唱——把它们带回田野去吧。"请帮我誊抄——最后一次了。',
      closing: '— 杜兰'
    },
    letterComplete: {
      body: '新图书馆的门开了。我看着乡亲们一个个走进这扇门——大多数人是这辈子第一次踏入图书馆。小艾拉站在门口，给每个人发一朵野花。玛格丽特在阅览区辟出了一个角落，放了她的整套草药手稿。卡特琳在旁边放了一本《圣经》和一本《道德经》——并排，没有高低之分。艾德里安在馆长台上调试他的羽毛笔。我站在门口，没有进去。我在等一个人——在等很久以前的自己，那个坐在空荡荡城堡里、只知道"命令"的年轻人。我想对他说：别担心，图书馆里有你的位置。也有所有人的。',
      closing: '— 杜兰（信末有一行被墨迹润湿的小字：感谢你，馆长。你不在我们的山谷里——但你在每一本改变了我们的书里。）'
    },
    reward: { coins: 50, atmo: 2 }
  }

];
