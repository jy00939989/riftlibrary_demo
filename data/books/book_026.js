// 《图书馆指南》—— 墨墨写给新馆长的入门手册
export const meta = {
  id: 'book_026',
  plane: 'astral',
  title: '图书馆指南',
  titleEn: 'A Guide to the Library',
  author: '墨墨',
  category: '散文',
  era: 'ERA_009',
  totalWords: 2388,
  description: '归墟图书馆的守护精灵墨墨为新任馆长撰写的入门指南，介绍了图书馆的历史、誊抄之法以及馆长的职责。',
  descriptionEn: "The Gui Xu Collection's guardian spirit, Momo, wrote this beginner's guide for the new curator, introducing the library's history, the art of transcription, and the curator's duties.",
  emoji: '📖',
  cover: 'visual/book_covers/book_026.png',
  certMessage: '你已正式成为归墟图书馆的守护者。墨墨在你肩头轻轻蹭了蹭。',
  certMessageEn: 'You are now an official guardian of the Gui Xu Collection. Momo gently nudges your shoulder.',
  authorBio: '墨墨，归墟图书馆的守护精灵，一只热爱书籍的猫头鹰。没人知道它在图书馆里待了多久——也许是几百年，也许是更久。它自称"见过这座图书馆最辉煌的时刻，也见证了它最漫长的沉睡"。',
  authorBioEn: 'Momo, the guardian spirit of the Gui Xu Collection, is an owl who loves books. No one knows how long it has lived here—perhaps centuries, perhaps longer. It claims to have "seen the library at its most glorious and witnessed its longest slumber."',
  anecdotes: '这本指南是墨墨在你到来的第一个夜晚写下的。用的是它自己掉的羽毛削成的笔，墨水来自壁炉里未燃尽的灰烬与水混合——墨墨说这叫"废墟墨水"，写出来的字有一种特别的温度。',
  anecdotesEn: 'Momo wrote this guide on your very first night. It used a quill carved from one of its own fallen feathers, and ink mixed from half-burnt ashes in the fireplace and water—Momo calls it "ruin ink," and the words written with it carry a special warmth.',
  reviews: '墨墨：「这是我写过最短的书。但馆长，它可能是我写过最重要的一本。因为读完它，你就知道——你不是一个人在守护这个地方。」',
  reviewsEn: 'Momo: "This is the shortest book I have ever written. But Curator, it may be the most important one. Because once you finish it, you will know—you are not alone in guarding this place."',
  collectorCover: '🦉',
  noMastery: true
};

export const chapters = [
  {
    id: 'ch1', title: '第一章：你推开了一扇门', titleEn: 'Chapter One: You Pushed Open a Door', unlockAt: 0, words: 799,
    preview: '亲爱的馆长，当你读到这行字的时候，你已经推开了归墟图书馆的门...',
    previewEn: 'Dear Curator, by the time you read this line, you have already pushed open the door of the Gui Xu Collection...',
    content: `亲爱的馆长：

当你读到这行字的时候，你已经推开了归墟图书馆的门。

我叫墨墨，是这里的守护精灵。不要四处张望——我大多数时候蹲在东侧第三根横梁上，那里能看到整个大厅。你暂时还看不到我，但没关系。等你抄完第一本书，我就会正式出现在你面前。（是的，猫头鹰也是会紧张的。）

关于这座图书馆的来历，说实话，我也不完全记得了。时间在这里以奇怪的方式流动——有时候一个下午像一整年那么长，有时候一百年像一眨眼。我只知道，这里曾经非常辉煌：高耸的书架一眼望不到头，来自无数世界的读者穿梭其间，书籍在架子上低声交谈，空气中飘着羊皮纸、旧木头和魔法残留的混合气味。

后来发生了什么，我选择不去细说。总之，图书馆沉睡了。书架倒塌了。书籍散落了。我也在横梁上打了一个很长的盹。

那一下睡了多久，我说不准。中间醒过几次——有一次屋顶塌了半边，有一次藤蔓爬进了大厅，还有一次，一只和我长得很像的猫头鹰落在我旁边，盯着我看了很久，又飞走了。我把它当成一个梦。在这座图书馆里，梦和现实的分界本来就很模糊。

还有一件事，你应该知道这座图书馆坐落在哪里。

它不在任何一个世界里，而是在所有世界的夹缝中。归墟——万物归流之处，诸界交汇的深渊。这里的每一本书都来自不同的世界：有的来自某个过去的地球，有的来自一颗从未存在过的星球，还有的来自连我飞上三天三夜也到不了的远方。

正因为它在夹缝中，门才会为你打开。你在外面推开这扇门的时候，其实同时也推开了无数扇别的门。这就是归墟图书馆的规矩：它需要一位馆长，而馆长需要找到一扇门。你找到了它，它也就找到了你。

等你抄完第一本书，我还有很多故事可以讲给你听。不过现在，先把这份指南读完——它虽然短，但每一句都不是废话。至少我是这么认为的。写书的人，多少都有点偏心。

然后你推开了门。

灰尘在光柱中飞舞，地板在你的脚步下吱呀作响——这些声音唤醒了我。我看着你在废墟中站了很久，没有转身离开。那一刻我就知道：你是新馆长。
`,
    contentEn: `Dear Curator:

By the time you read this line, you have already pushed open the door of the Gui Xu Collection.

My name is Momo, the guardian spirit here. Do not look around for me—I usually perch on the third beam on the east side, where I can see the whole hall. You cannot see me yet, but that is all right. I will formally appear once you finish copying your first book. (Yes, even owls get nervous.)

As for the history of this library, honestly, I do not remember it all. Time flows strangely here—sometimes an afternoon stretches as long as a whole year, and sometimes a century passes in the blink of an eye. I only know that this place was once glorious: towering shelves vanished into the distance, readers from countless worlds moved among them, books whispered to one another on the shelves, and the air carried a mingled scent of parchment, old wood, and lingering magic.

What happened afterward, I choose not to describe in detail. In short, the library fell asleep. Shelves collapsed. Books scattered. And I took a very long nap on my beam.

How long that nap lasted, I cannot say. I woke a few times along the way—once when half the roof caved in, once when vines crept into the hall, and once when an owl who looked very much like myself landed beside me, stared at me for a long while, and flew off. I took it for a dream. In this library, the line between dream and reality has always been blurry.

There is one more thing you should know: where this library stands.

It is not in any single world, but in the seam between all of them. Gui Xu—the place where all streams return, the abyss where countless worlds meet. Every book here comes from a different world: some from an Earth of the past, some from a planet that never existed, and some from places so far that even three days and three nights of flying would not get me there.

Because it rests in the seam, the door could open for you. When you pushed open that door out there, you were really pushing open countless other doors at the same time. That is the rule of the Gui Xu Collection: it needs a curator, and a curator needs to find the door. You found it—and so it found you.

Once you finish copying your first book, I will have many more stories to tell you. For now, finish reading this guide—it is short, but not a single line is filler. At least, that is what I believe. Writers are always a little biased toward their own books.

Then you pushed open the door.

Dust danced in the columns of light, and the floor creaked beneath your steps—those sounds woke me. I watched you stand among the ruins for a long time, without turning to leave. In that moment, I knew: you are the new curator.
`
  },
  {
    id: 'ch2', title: '第二章：誊抄的艺术', titleEn: 'Chapter Two: The Art of Transcription', unlockAt: 799, words: 709,
    preview: '图书馆的核心魔法叫作"誊抄"——用你的专注，让散佚的文字重新凝聚...',
    previewEn: 'The library\'s core magic is called "transcription"—using your focus to gather scattered words back into form...',
    content: `现在说说最重要的事情：怎么让这座图书馆活过来。

图书馆的核心魔法叫作"誊抄"。原理很简单：曾经存在于这里的书籍，虽然纸张已经化为尘埃，但文字并没有真正消失。它们以某种微妙的方式飘浮在空气中，等待一个专注的心灵将它们重新凝聚。

你就是那个心灵。

每次你坐在缮写室里开始一段专注时光，你的注意力就像一根无形的线，把散落的文字一针一针缝回纸面。你的羽毛笔会自己动起来——不用惊讶，它比你有经验。你只需要保持专注，剩下的交给我和笔。

具体来说，流程是这样的：

1. 在缮写室选择一本你想抄的书。
2. 点击"开始专注"，设定你想专注的时间（25分钟番茄钟、45分钟深度专注，或者不限时自由模式——看你今天的状态）。
3. 专注期间不要切换页面，让羽毛笔完成它的工作。我会在旁边安静地陪着。
4. 专注结束后，你誊抄的字数会被记录下来。每解锁一个新章节，你会收到提示。

最后补充几条经验，都是我蹲在这根横梁上，看着一任任馆长摸索出来的：

- 访客借出去的书，有时会带着伤痕还回来。别生气——书被读过，才会有破损。把破损的书带回缮写室修复就好，修复本身就是一种誊抄。
- 同一本书值得抄不止一遍。抄到熟练的书会显露额外的内容：作者的故事、成书的掌故、还有前人的批注。大书库里那些泛着金光的书，都是这样来的。
- 每次专注都会为图书馆积攒氛围。别小看这一点一滴——氛围到了阈值、设施准备妥当，你就可以举行「升阶仪式」，整座馆会焕然一新。那是我在横梁上最喜欢看的时刻。
- 如果哪天觉得累了，就抄短一点。羽毛笔不会怪你，我也不会。

抄完一整本书的那天，是一个值得庆祝的日子。那本书会从缮写室的待抄区搬到大书库的书架上——你的第一件藏品。之后访客可以借阅它，而你，可以开始下一本。
`,
    contentEn: `Now, the most important thing: how to bring this library back to life.

The library's core magic is called "transcription." The principle is simple: the books that once existed here may have crumbled to dust, but the words themselves did not truly vanish. They drift through the air in some subtle way, waiting for a focused mind to gather them back into form.

You are that mind.

Each time you sit in the Scriptorium and begin a focus session, your attention becomes an invisible thread, stitching scattered words back onto the page one stitch at a time. Your quill will move on its own—do not be surprised; it has more experience than you. All you need to do is stay focused. Leave the rest to me and the pen.

Here is how it works in practice:

1. Choose a book you want to copy in the Scriptorium.
2. Tap "Start Focus" and set the length of your session (a 25-minute pomodoro, a 45-minute deep-focus stretch, or open-ended free mode—whatever suits your state today).
3. Do not switch away during the session. Let the quill do its work. I will keep you quiet company.
4. After the session, the number of words you copied will be recorded. You will receive a notice each time a new chapter unlocks.

A few final tips, gathered from watching curator after curator figure things out while I perched on this beam:

- Visitors sometimes return borrowed books with scars. Do not be angry—a book that has been read is a book that has been worn. Bring damaged books back to the Scriptorium for repair; mending is itself a form of transcription.
- The same book is worth copying more than once. A book copied to mastery reveals extra contents: the author's story, the tale of its making, and notes left by readers before you. All the gold-gleaming volumes in the Hall of Books came to be this way.
- Every focus session builds up the library's atmosphere. Do not underestimate these drops in the bucket—once the atmosphere crosses its threshold and the facilities are ready, you may hold the Ascension Ceremony, and the whole library will be reborn. It is my favorite thing to watch from the beam.
- And if you ever feel tired, copy for a shorter while. The quill will not blame you. Neither will I.

The day you finish copying an entire book is a day worth celebrating. That book will move from the Scriptorium's waiting area to a shelf in the Hall of Books—your first collection. After that, visitors may borrow it, and you may begin the next one.
`
  },
  {
    id: 'ch3', title: '第三章：馆长的日常', titleEn: "Chapter Three: A Curator's Daily Life", unlockAt: 1508, words: 880,
    preview: '抄书不是你来这里的唯一原因。作为馆长，你还有很多事情可以做...',
    previewEn: 'Copying books is not the only reason you are here. As curator, there is much more you can do...',
    content: `抄书是你最重要的职责，但不是唯一的。

随着你誊抄的书籍越来越多，图书馆的氛围会慢慢变化。一开始这里只是废墟——漏雨的屋顶、倒塌的书架、散落一地的书页。但随着你的每一次专注，魔法会一点一点修复这个地方。氛围值会从"废墟"慢慢升到"破败"、"陈旧"、"温暖"，最终抵达"星辰"——到那时候，这座图书馆会比它过去任何时候都更美。

你抄完的书放在大书库里，有时会吸引访客。是的，这个世界里还有其他人在寻找这座图书馆——他们会在不同的时间推开不同的门，走进来。有人想来借书，有人只是想找个安静的地方坐坐，有人会留下便签甚至长信。对他们好一点，他们也会对你好的。

访客们借走的书，是这座馆与外面世界之间来往的信件。有的人读完会留下一张便签，有的人还书时会多坐一会儿，讲讲他们自己世界里的故事。这些我都知道——横梁是观察这一切最好的位置。

这座馆比看上去要大得多。书抄得多了，你可以在展览厅为它们开辟展厅；留声阁里能收集唱片，让图书馆在不同的时刻配上不同的曲子；温室和咖啡角是留给访客、也留给你的角落；馆长办公室的铭牌墙上，会挂起你一路走来的纪念。

也难免会有小麻烦：偶尔有老鼠光顾，雨季的墙角会泛起霉斑。提前挂好预防的牌子，或者养一只猫——虽然我一只猫头鹰说这种话，好像哪里不太对。

缮写室和借阅区可以通过位面商店升级。缮写室升级会让你誊抄得更快，借阅区升级能容纳更多访客同时在场。智慧之光是这里的通用货币，每次专注都能获得。还有灵感——一种更稀有的东西，只在连续专注时出现，以后你会知道它的用途。

馆长办公室里可以看到你的成就、收藏和统计数据。植物盆栽在"布置"页——浇水、施肥、看着它们长大，是专注之间很好的休息方式。

对了，我每天都会在馆长日志里记几笔。不是什么大事——今天谁来过、哪本书被翻旧了、窗台上的光好不好。你随时可以翻看。那里面也藏着一些小秘密，比如你一直坚持的天数。

最后说一句：不要着急。

这座图书馆沉睡了那么久，不差这几天。每天来专注一小会儿，抄几页书，和访客聊两句，给植物浇点水。不需要一天就把一切都做完。我来这里不是为了监督你，我来这里是为了陪你。

你的守护精灵，
墨墨
`,
    contentEn: `Copying is your most important duty, but it is not your only one.

As you copy more and more books, the atmosphere of the library will gradually change. At first it is only ruins—a leaking roof, collapsed shelves, pages scattered across the floor. But with every session of focus, the magic mends this place a little more. The atmosphere value will rise from "Ruins" through "Dilapidated," "Weathered," and "Warm," all the way to "Starlight"—and by then, this library will be more beautiful than it ever was in the past.

The books you finish will rest in the Hall of Books, and sometimes they will attract visitors. Yes, there are others in this world searching for this library—they will enter through different doors at different times. Some come to borrow books, some only want a quiet place to sit, and some will leave notes or even long letters. Be kind to them, and they will be kind to you in return.

The books visitors borrow are letters exchanged between this library and the world outside. Some readers leave a note when they finish; some stay a little longer when they return a book, telling stories of their own worlds. I know all of this—the beam is the best place from which to watch it all.

This library is far bigger than it looks. Once you have copied enough books, you can open exhibition halls for them in the Gallery; in the Music Room you can collect records, so the library can wear different melodies at different hours; the greenhouse and the coffee corner are corners for the visitors, and for you; and on the plaque wall of the Curator's Office, mementos of your journey will hang one by one.

There will be small troubles, of course. Mice drop by now and then, and in the rainy season mold creeps up the corners. Hang preventive signs early, or keep a cat—though for an owl like me to suggest that, something feels a little off.

You can upgrade the Scriptorium and the Reading Area through the Plane Shop. Upgrading the Scriptorium lets you copy faster; upgrading the Reading Area lets more visitors stay at once. Wisdom Light is the common currency here, earned with every focus session. Then there is Inspiration—a rarer thing that only appears when you focus consistently. You will learn its uses in time.

The Curator's Office shows your achievements, collection, and statistics. Potted plants live on the "Decor" page—watering, fertilizing, and watching them grow are lovely breaks between sessions.

Oh, and I jot down a few lines in the curator's log every day. Nothing grand—who came by, which book's spine got a little more worn, how the light fell on the windowsill. You are welcome to read it anytime. It also hides a few small secrets, like the number of days you have kept going.

One last thing: do not hurry.

This library has slept for so long; it can wait a few more days. Come each day for a short while of focus, copy a few pages, chat with a visitor, water a plant. You do not need to finish everything in one day. I am not here to supervise you. I am here to keep you company.

Your guardian spirit,
Momo
`
  }
];

export const quotes = {
  15: '"我叫墨墨，是这里的守护精灵。不要四处张望——我大多数时候蹲在东侧第三根横梁上。"',
  35: '"时间在这里以奇怪的方式流动——有时候一个下午像一整年那么长，有时候一百年像一眨眼。"',
  55: '"你的羽毛笔会自己动起来——不用惊讶，它比你有经验。你只需要保持专注，剩下的交给我和笔。"',
  75: '"抄完一整本书的那天，是一个值得庆祝的日子。"',
  95: '"这座图书馆沉睡了那么久，不差这几天。每天来专注一小会儿就好。"'
};

export const quotesEn = {
  15: '"My name is Momo, the guardian spirit here. Do not look around for me—I usually perch on the third beam on the east side."',
  35: '"Time flows strangely here—sometimes an afternoon stretches as long as a whole year, and sometimes a century passes in the blink of an eye."',
  55: '"Your quill will move on its own—do not be surprised; it has more experience than you. All you need to do is stay focused. Leave the rest to me and the pen."',
  75: '"The day you finish copying an entire book is a day worth celebrating."',
  95: '"This library has slept for so long; it can wait a few more days. Just come for a little while each day."'
};
