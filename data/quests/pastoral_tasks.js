// 田园瘟疫纪事 — 任务静态数据
// 每角色 5 阶段，每阶段 ≥4 任务
// 当前 Phase 1：仅包含小艾拉 stage 1 的 4 条任务

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
      body: '上次玛格丽特阿姨给我讲了一个小王子和小狐狸的故事，我好想自己也读一遍。可是书太厚了，我认得的字还不够多……你能帮我誊抄第三章吗？读到小王子遇见他的那朵花，是我每天最期待的事。',
      closing: '— 小艾拉（纸上画了一朵歪歪扭扭的玫瑰）'
    },
    letterComplete: {
      body: '我读完了！原来那朵花那么骄傲，又那么脆弱。我把她画下来了，虽然画得不好看。谢谢你，馆长。',
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
      body: '村里好多人都咳嗽了。玛格丽特阿姨每天都在熬药，她的手都起泡了。我问她能不能教我认一种草药，她指着一本好大好大的书说："从这里开始。"可是那本书太难了……你能不能帮我读第一章，然后讲给我听？',
      closing: '— 小艾拉'
    },
    letterComplete: {
      body: '我认出了甘草！玛格丽特阿姨煮的咳嗽药里就有它。她很高兴，说下次带我去山上认真的草药。馆长，原来书里的东西真的能救命。',
      closing: '— 小艾拉（画了一株辨认了很久的甘草）'
    },
    reward: { coins: 30, atmo: 1 }
  }
];
