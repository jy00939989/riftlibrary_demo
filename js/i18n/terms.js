// 核心术语常量 —— 中英双语，供全项目引用
// 兼容旧用法：import { T } from '../i18n/terms.js'; → T.library（中文）
// 新用法：import { t, setLocale, getLocale } from '../i18n/terms.js'; → t('library')

import { getSettings, setSetting } from '../settings.js';

// ========== 双语术语表 ==========
const TERM_DATA = Object.freeze({
  // ========== 系统名称 ==========
  gameTitle: { zh: '异世界图书馆', en: 'Rift Library' },
  libraryName: { zh: '归墟图书馆', en: 'The Gui Xu Collection' },
  librarySubtitle: { zh: '夹缝中的归墟 · 位面枢纽', en: 'A Rift Between Worlds · A Nexus of Realms' },
  unknown: { zh: '未知', en: 'Unknown' },

  // ========== 存档管理 ==========
  saveManagerTitle: { zh: '💾 存档管理', en: '💾 Save Manager' },
  saveLocalWarning: { zh: '你的游戏数据保存在浏览器本地。更换设备或清理缓存后数据会丢失。<br>建议定期导出备份。', en: 'Your game data is saved locally in the browser. It will be lost if you switch devices or clear cache.<br>Regular exports are recommended.' },
  exportSaveFile: { zh: '📥 导出存档文件 (.json)', en: '📥 Export Save File (.json)' },
  copySaveCode: { zh: '📋 复制存档码到剪贴板', en: '📋 Copy Save Code to Clipboard' },
  restoreFromBackup: { zh: '从备份恢复：', en: 'Restore from Backup:' },
  selectSaveFileImport: { zh: '📂 选择存档文件导入', en: '📂 Select Save File to Import' },
  orPasteSaveCode: { zh: '或粘贴存档码', en: 'Or Paste Save Code' },
  pasteSaveCodeHere: { zh: '在此粘贴存档码...', en: 'Paste save code here...' },
  importPastedSave: { zh: '导入粘贴的存档', en: 'Import Pasted Save' },
  restorePreviousBackup: { zh: '🔄 恢复上次导入前的备份', en: '🔄 Restore Pre-Import Backup' },
  saveFileSuffix: { zh: '存档', en: 'save' },
  exportSuccessDetail: { zh: '已导出：{libraryName} · 氛围{atmosphere} · {words}字', en: 'Exported: {libraryName} · Atmosphere {atmosphere} · {words} words' },
  copySaveCodeSuccess: { zh: '存档码已复制 ({size}KB)', en: 'Save code copied ({size}KB)' },
  importSuccessDetail: { zh: '导入成功！{libraryName} · 即将刷新页面...', en: 'Import successful! {libraryName} · Refreshing page...' },
  pasteSaveCodeFirst: { zh: '请先粘贴存档码', en: 'Please paste a save code first' },
  noBackupToRestore: { zh: '没有可恢复的备份', en: 'No backup available to restore' },
  confirmRestoreBackup: { zh: '确定要恢复到上次导入前的存档吗？当前进度将丢失。', en: 'Restore the pre-import save? Current progress will be lost.' },
  backupRestoredRefreshing: { zh: '已恢复备份，即将刷新页面...', en: 'Backup restored. Refreshing page...' },
  clipboardUnavailable: { zh: '剪贴板不可用，请改用下载文件', en: 'Clipboard unavailable. Please use file download instead.' },
  invalidSaveFile: { zh: '无效的存档文件', en: 'Invalid save file' },
  saveFormatIncorrect: { zh: '存档格式不正确', en: 'Save format incorrect' },
  saveMissingRequiredFields: { zh: '存档缺少必要字段', en: 'Save is missing required fields' },
  saveJsonParseFailed: { zh: 'JSON 解析失败，请检查存档内容', en: 'JSON parse failed. Please check the save content' },
  saveFileReadFailed: { zh: '文件读取失败', en: 'File read failed' },

  // ========== 页面标签 ==========
  tabScriptorium: { zh: '缮写室', en: 'Scriptorium' },
  tabGrandLibrary: { zh: '大书库', en: 'Hall of Books' },
  tabCuratorOffice: { zh: '馆长办公室', en: "Curator's Office" },
  tabReaderSalon: { zh: '读者沙龙', en: 'Reader Salon' },
  tabArchive: { zh: '馆史档案', en: 'Archive' },
  tabPlaneShop: { zh: '位面商店', en: 'Plane Shop' },

  // ========== 馆长办公室子标签 ==========
  subtabOverview: { zh: '概况', en: 'Overview' },
  subtabAchievements: { zh: '成就柜', en: 'Achievements' },
  subtabCollection: { zh: '收藏室', en: 'Collection' },
  subtabDecoration: { zh: '布置', en: 'Decor' },
  subtabGuide: { zh: '馆长手册', en: "Curator's Guide" },
  subtabRestoration: { zh: '古籍修复室', en: 'Restoration Room' },

  // ========== 馆长办公室 / 概况 ==========
  curatorGoalTitle: { zh: '🏛️ 馆长目标 · 复兴之路', en: '🏛️ Curator Goals · Path of Renewal' },
  completedStage: { zh: '✅ 已完成的阶段', en: '✅ Completed Stages' },
  inProgress: { zh: '进行中', en: 'In Progress' },
  goalProgress: { zh: '目标进度：{current}/{total}', en: 'Goal Progress: {current}/{total}' },
  nextTierPreview: { zh: '🔜 下一阶段「{emoji} {name}」—— 氛围达到 {atmosphere} 解锁', en: '🔜 Next Stage: {emoji} {name} — unlock at {atmosphere} Atmosphere' },
  stageLevel: { zh: '阶段 {level}/5', en: 'Stage {level}/5' },
  libraryStageAlt: { zh: '图书馆 · {stage}', en: 'Library · {stage}' },
  libraryStageOverlay: { zh: '{stage} · {name}', en: '{stage} · {name}' },
  atmosphereLevelLabel: { zh: '氛围等级：{stage} Lv.{level}', en: 'Atmosphere: {stage} Lv.{level}' },
  needMoreAtmosphere: { zh: '还需 {n} 点氛围升级至下一阶段', en: 'Need {n} more Atmosphere to reach the next stage' },
  libraryFullyRestored: { zh: '图书馆已完全复苏！', en: 'The library has fully recovered!' },
  todayLibrary: { zh: '今日图书馆', en: 'Library Today' },
  transcribeSpeedLabel: { zh: '誊抄速度', en: 'Copy Speed' },
  coinsGainLabel: { zh: '智慧之光获取', en: 'Wisdom Light Gain' },
  visitorFavorLabel: { zh: '访客好感', en: 'Visitor Favor' },
  baseline: { zh: '基准', en: 'Baseline' },

  // ========== 馆史档案子标签 ==========
  subtabHistory: { zh: '馆史档案', en: 'History' },
  subtabDiary: { zh: '墨墨日志', en: "Momo's Diary" },
  subtabPlanes: { zh: '位面', en: 'Planes' },

  // ========== 馆史档案 / 统计 ==========
  totalFocusMinutes: { zh: '总专注分钟', en: 'Total Focus Minutes' },
  completedBooks: { zh: '完成书籍', en: 'Books Completed' },
  consecutiveFocusDays: { zh: '连续专注天数', en: 'Consecutive Focus Days' },
  totalCoinsLabel: { zh: '累计智慧之光', en: 'Total Wisdom Light' },
  eventHistory: { zh: '事件历史', en: 'Event History' },
  noHistoryRecords: { zh: '暂无记录，开始你的第一次专注吧 ✨', en: 'No records yet. Begin your first focus ✨' },

  // ========== 馆史档案 / 日志回顾 ==========
  focusAbandoned: { zh: '专注中断', en: 'Focus Abandoned' },
  visitorArrived: { zh: '访客到来', en: 'Visitor Arrived' },
  visitorBorrowed: { zh: '访客借书', en: 'Visitor Borrowed' },
  visitorReturned: { zh: '访客还书', en: 'Visitor Returned' },
  bookCompleted: { zh: '书籍完成', en: 'Book Completed' },
  specialEvent: { zh: '特殊事件', en: 'Special Event' },
  dailyReview: { zh: '每日回顾', en: 'Daily Review' },
  bookMentionCount: { zh: '《{name}》— {count}次提及', en: '“{name}” — {count} mentions' },
  visitorAppearanceCount: { zh: '{name} — {count}次出现', en: '{name} — {count} appearances' },
  diaryReviewTitle: { zh: '📖 日志回顾', en: '📖 Diary Review' },
  diaryReviewSummary: { zh: '墨墨翻阅了共 <b>{count}</b> 页日志，总结如下：', en: 'Momo looked through <b>{count}</b> diary pages and summarized:' },
  eventTypes: { zh: '📊 事件类型', en: '📊 Event Types' },
  mostMentionedBooks: { zh: '📚 最常提及的书', en: '📚 Most Mentioned Books' },
  mostFrequentVisitors: { zh: '👥 最常出现的访客', en: '👥 Most Frequent Visitors' },
  earliestRecords: { zh: '📝 最早记录', en: '📜 Earliest Records' },
  diaryBindingProgress: { zh: '已记录 {count} 页 · 距下一级还差 {remaining} 页', en: '{count} pages recorded · {remaining} pages to next level' },
  diaryBindingMax: { zh: '墨墨的日志已臻至化境 ✨', en: "Momo's diary has reached perfection ✨" },
  review: { zh: '📖 回顾', en: '📖 Review' },
  diaryEmptyTitle: { zh: '墨墨还没有开始写日志……', en: "Momo hasn't started writing diary entries yet…" },
  diaryEmptyHint: { zh: '完成一次专注后，墨墨会在日志里记录下今天的故事。', en: 'After a focus session, Momo will record the story of the day.' },

  // ========== 馆史档案 / 位面 ==========
  planesDescription: { zh: '归墟图书馆连接的诸世界。开启传送门，迎接来自其他位面的访客。', en: 'The many worlds connected to the Gui Xu Collection. Open portals and welcome visitors from other planes.' },
  actNumber: { zh: '第{n}幕', en: 'Act {n}' },
  canUnlock: { zh: '可开启', en: 'Can Unlock' },
  pendingReplies: { zh: '{n}封待回信', en: '{n} replies pending' },
  charactersVisited: { zh: '角色 {met}/{total} 已到访', en: '{met}/{total} characters visited' },
  mementosCollected: { zh: '信物 {n} 件', en: '{n} mementos' },
  planeUnlockRequirements: { zh: '需要：氛围 ≥{atmo} · 拥有 ≥{books} 本书 · 购买传送门', en: 'Requires: Atmosphere ≥{atmo} · ≥{books} books · purchase a Portal' },
  unknownPlane: { zh: '？？？', en: '???' },
  placeholderPlaneDesc: { zh: '新的传送门尚未开启……裂隙的另一侧传来隐约的回声。', en: 'No new portal has opened yet... Faint echoes drift from the other side of the rift.' },
  placeholderPlaneWhisper: { zh: '“麦浪翻涌……有人在歌唱……”', en: '“Waves of wheat... someone is singing...”' },

  // ========== 加载提示 ==========
  loadingText: { zh: '正在推开馆门...', en: 'Opening the library doors...' },

  // ========== 开场引导 ==========
  introWelcomeTitle: { zh: '欢迎来到异世界图书馆', en: 'Welcome to Rift Library' },
  introWelcomeText: { zh: '你推开沉重的橡木门，灰尘在从破洞屋顶洒下的光柱中飞舞。曾经辉煌的大厅如今只剩断壁残垣，书架倒塌如墓碑，破损的书籍散落一地。但空气中残留着某种古老魔法的气息——这里曾经有人守护，而那个人，现在是你。', en: 'You push open the heavy oak door. Dust dances in the light pouring through holes in the roof. The once-magnificent hall is now broken walls and fallen shelves, damaged books scattered like tombstones. Yet something ancient and magical lingers in the air—someone once guarded this place, and that someone is now you.' },
  introScriptoriumTitle: { zh: '缮写室 · 誊抄修复', en: 'Scriptorium · Copy & Restore' },
  introScriptoriumText: { zh: '在缮写室中选择一本初始书籍，点击 {startFocus}。每一次专注誊抄，都是对图书馆的修复——破损的书架会被修补，蒙尘的角落重见光明。你誊抄的每一个字，都在让这座废墟重新呼吸。', en: 'Pick a starter book in the Scriptorium and tap {startFocus}. Every focused copy restores the library—broken shelves are mended, dust-choked corners see light again. Every word you copy helps these ruins breathe once more.' },
  introTimerTitle: { zh: '计时与收获', en: 'Timer & Rewards' },
  introTimerText: { zh: '三种专注模式供你选择：🍅 {pomodoro}（{pomodoroDuration}）、⏲️ {countdown}（自定义时长）、⏱️ {stopwatch}（{noLimit}）。专注结束后会获得誊抄字数和 {coins}（顶部 💰），完成整本书籍、达成里程碑、访客还书等事件会提升 {atmosphere}——{atmosphere} 积累到一定程度，图书馆会发生可见的变化。', en: 'Three focus modes await: 🍅 {pomodoro} ({pomodoroDuration}), ⏲️ {countdown} (custom length), ⏱️ {stopwatch} ({noLimit}). After each focus, you earn copied words and {coins} (top 💰). Completing books, hitting milestones, and visitor returns raise {atmosphere}—and as {atmosphere} grows, the library visibly changes.' },
  introSkip: { zh: '跳过 →', en: 'Skip →' },
  introTapToPlayVideo: { zh: '点击观看开场动画', en: 'Tap to Watch Intro' },
  introDoubleTapToSkip: { zh: '双击可跳过', en: 'Double-Tap to Skip' },
  introStartAdventure: { zh: '✨ 开始冒险', en: '✨ Start Adventure' },
  introExploreHint: { zh: '{grandLibrary}、{readerSalon}、{planeShop}——其余的角落，等你慢慢发现。', en: '{grandLibrary}, {readerSalon}, {planeShop}—the other corners await your discovery.' },

  // ========== 引导弹窗 ==========
  tutorialFocusCompleteTitle: { zh: '专注完成！', en: 'Focus Complete!' },
  tutorialFocusCompleteDesc: { zh: `每次专注誊抄都会获得<strong class="text-magic-gold">{coins}</strong>——这座图书馆的通用货币，用来买书、升级设施。<br>完成整本书籍、达成里程碑、访客还书等成就会积累<strong class="text-magic-blue">{atmosphere}</strong>——代表图书馆的复苏程度。{atmosphere}达到一定阶段，图书馆会发生可见的变化。`, en: `Every focused copy earns you <strong class="text-magic-gold">{coins}</strong>—the library’s universal currency for buying books and upgrading facilities.<br>Completing books, hitting milestones, and visitor returns build <strong class="text-magic-blue">{atmosphere}</strong>—a measure of the library’s recovery. Once {atmosphere} reaches certain thresholds, the library will visibly change.` },
  tutorialStreakHint: { zh: '✨ 连续专注天数越多，成就和惊喜越多', en: '✨ The longer your streak, the more achievements and surprises await' },
  tutorialGotIt: { zh: '知道了 →', en: 'Got it →' },
  tutorialVisitorTitle: { zh: '第一位访客来了！', en: 'Your first visitor has arrived!' },
  tutorialVisitorDesc: { zh: `访客会在图书馆里<strong>浏览书架</strong>，借走你已完成的书。<br>还书时他们会带来<strong class="text-magic-gold">{coins}</strong>、<strong class="text-magic-blue">{atmosphere}</strong>，还可能触发<strong>特殊事件</strong>——赠书、藏宝图、诗篇……`, en: `Visitors <strong>browse the shelves</strong> and borrow books you have completed.<br>When they return them, they bring <strong class="text-magic-gold">{coins}</strong>, <strong class="text-magic-blue">{atmosphere}</strong>, and may trigger <strong>special events</strong>—gift books, treasure maps, poems…` },
  tutorialVisitorHint: { zh: '☕ 在「{readerSalon}」查看访客状态，及时收取归还的书籍', en: '☕ Check visitor status in the {readerSalon} and collect returned books in time' },
  tutorialGoSee: { zh: '去看看 →', en: 'Go see →' },
  tutorialShopDesc: { zh: `在这里你可以用{coins}<strong>升级图书馆设施</strong>：`, en: `Spend {coins} here to <strong>upgrade library facilities</strong>:` },
  tutorialShopReadingAreaUpgrade: { zh: `🏛️ {readingArea}{upgrade} — 增加访客容量，提升还书收益`, en: `🏛️ {readingArea} {upgrade} — increase visitor capacity and return rewards` },
  tutorialShopScriptoriumUpgrade: { zh: `🖋️ {scriptorium}{upgrade} — 提升誊抄速度`, en: `🖋️ {scriptorium} {upgrade} — boost copy speed` },
  tutorialShopDecor: { zh: `🏺 {decor} — 植物盆栽、标志牌`, en: `🏺 {decor} — plants, signboards` },
  tutorialShopNewBooks: { zh: `📚 {newBooks} — 解锁更多书籍`, en: `📚 {newBooks} — unlock more books` },
  tutorialExplore: { zh: '开始探索 →', en: 'Start exploring →' },
  tutorialOfficeDesc: { zh: '这里是你的管理中枢，顶部有 5 个子标签：', en: 'This is your command center. It has 5 sub-tabs at the top:' },
  tutorialOfficeOverview: { zh: `📊 {overview} — 图书馆数据总览，氛围进度，修改馆名`, en: `📊 {overview} — library stats, atmosphere progress, rename your library` },
  tutorialOfficeAchievements: { zh: `🏆 {achievements} — 查看已解锁成就和未达成条件`, en: `🏆 {achievements} — view unlocked and pending achievements` },
  tutorialOfficeCollection: { zh: `📦 {collection} — 浏览收集品进度`, en: `📦 {collection} — browse collection progress` },
  tutorialOfficeDecoration: { zh: `🏺 {decoration} — 植物盆栽、种子库存、标志牌`, en: `🏺 {decoration} — plants, seeds, signboards` },
  tutorialOfficeGuide: { zh: `📖 {guide} — 随时查阅攻略和常见问题`, en: `📖 {guide} — browse tips and FAQs anytime` },
  tutorialRestorationTitle: { zh: '古籍修复室已开放', en: 'Restoration Room Opened' },
  tutorialRestorationDesc: { zh: `这里专门管理<strong>长书分卷</strong>：那些太过厚重、必须拆成多卷誊抄的典籍。`, en: `This room manages <strong>long-book volumes</strong>: tomes so heavy they must be copied in separate volumes.` },
  tutorialRestorationVolumeProgress: { zh: `🧩 卷组进度 — 查看每套长书的已抄分卷`, en: `🧩 Volume progress — see copied volumes for each long book` },
  tutorialRestorationCraft: { zh: `✨ 合成典藏版 — 集齐某套长书全部分卷后，可合成完整典藏版`, en: `✨ Craft Collector Edition — combine all volumes of a long book into a complete collector edition` },
  tutorialRestorationBox: { zh: `🔒 修缮箱 — 锁入珍贵单卷，防止被访客借出或损坏`, en: `🔒 Restoration Box — lock away precious volumes so visitors cannot borrow or damage them` },
  tutorialRestorationUpgrade: { zh: `📈 升级修复室 — 提升修复损坏书籍的速度`, en: `📈 Upgrade Restoration Room — speed up repairing damaged books` },
  libraryRevival: { zh: '图书馆复苏', en: 'Library Revival' },
  scriptoriumUpgrade: { zh: '缮写室升级', en: 'Scriptorium Upgraded' },
  readingAreaUpgrade: { zh: '借阅区升级', en: 'Reading Area Upgraded' },
  borrowAreaCapacityBoost: { zh: '容量提升', en: 'Capacity increased' },
  atmosphereStageFooter: { zh: '氛围阶段 {stage}/5 · {stageName}', en: 'Atmosphere Stage {stage}/5 · {stageName}' },
  atmosphereStageNarrative2: { zh: `你合上抄完的最后一页，抬头环顾四周。最大的那个破洞已经被你用旧木板补上了，风不再呼啸着贯穿大厅。你扶正了第三排书架——它虽然漆面斑驳，但至少能站稳了。散落的书籍被归拢、分类，虽然稀疏，但已经是一个像样的书架。黄昏的光从补丁之间漏进来，不再凄惨，反而有点温柔。<br><br><strong>这里不再是被遗忘的废墟，而是一个被守护的地方。</strong>`, en: `You close the last copied page and look around. The largest hole in the roof is patched with old planks, and the wind no longer howls through the hall. You straighten the third shelf—its paint is peeling, but it stands firm. Scattered books are gathered and sorted; sparse, but already a real bookshelf. Twilight slips through the patches, no longer miserable, almost gentle.<br><br><strong>This is no longer a forgotten ruin, but a place that is guarded.</strong>` },
  atmosphereStageNarrative3: { zh: `今天你修补好了最后一片漏雨的瓦。屋顶完整了，雨水不再滴落在书页上。西侧的窗户被重新装上玻璃，光线变得柔软可控。你发现了一间藏在倒塌书架后面的小阅读室——它曾属于某位老馆员，现在它是你的。书架上现在有了七十七本书，每一本你都记得来历。那个流浪诗人第二次来的时候说："这里变了，有了……气息。"<br><br><strong>破败已经退去，尊严正在回来。</strong>`, en: `Today you patched the last leaking tile. The roof is whole; rain no longer falls on the pages. The west window has glass again, and the light is soft and controllable. You discovered a small reading room hidden behind collapsed shelves—it once belonged to an old curator, and now it is yours. There are seventy-seven books on the shelves, and you remember where each came from. When the wandering poet visited a second time, he said, "This place has changed. It has… an atmosphere."<br><br><strong>Dilapidation has faded; dignity is returning.</strong>` },
  atmosphereStageNarrative4: { zh: `黄铜吊灯终于修好了，温暖的光洒满整个大厅，书架投下的影子不再是恐怖形状，而是沉静的陪伴。地毯换成了干净的编织毯，壁炉里噼啪作响。访客们不再只是借了书就走——他们坐下来，在窗边的老扶手椅上，一读就是一个下午。那只从前避雨的流浪猫现在有了名字，叫"墨水"。<br><br><strong>这里不再只是一个建筑，它成了有人等待、有人归来的地方。</strong>`, en: `The brass chandelier is finally repaired, casting warm light across the hall. The shadows of the shelves are no longer frightening shapes, but calm companions. The carpet has been replaced with a clean woven rug, and the fireplace crackles. Visitors no longer just borrow and leave—they sit in the old armchair by the window and read the whole afternoon away. The stray cat that once sheltered from the rain now has a name: "Ink."<br><br><strong>This is no longer just a building; it is a place where people wait and return.</strong>` },
  atmosphereStageNarrative5: { zh: `你几乎认不出这是最初那个废墟了。高耸的书架直达穹顶，螺旋楼梯连接着不同楼层，每个角落都有阅读的空间。访客络绎不绝，却从不喧闹——这里有一种不言而喻的默契，对知识和安静的尊重。有时深夜，当最后一位访客离开，你独自坐在大厅中央，听见书页在轻轻呼吸。<br><br><strong>你守护的东西，如今已能守护更多人。</strong>`, en: `You can barely recognize the original ruin. Towering shelves reach the dome, spiral stairs connect different floors, and every corner holds a place to read. Visitors come and go, yet never noisy—there is an unspoken pact here, a respect for knowledge and quiet. Sometimes late at night, when the last visitor leaves, you sit alone in the center of the hall and hear the pages breathing softly.<br><br><strong>What you guarded can now guard many more.</strong>` },
  focusRoomNarrativeDefault: { zh: '缮写室变得更加舒适了。', en: 'The Scriptorium has become more comfortable.' },
  focusRoomNarrative1: { zh: `你清理出一张旧书桌，摆上一盏蜡烛。虽然桌面坑洼不平，但至少能写字了。窗外依然有风灌进来，但烛火不再摇曳——它稳稳地燃烧着，像一个小小的承诺。从这里开始，每一个字都会被认真对待。`, en: `You clear an old desk and place a candle on it. The surface is pitted, but you can write. Wind still seeps through the window, yet the flame no longer flickers—it burns steadily, like a small promise. From here on, every word will be taken seriously.` },
  focusRoomNarrative2: { zh: `书桌被换成了更宽大的橡木桌，抽屉里整整齐齐地放着羽毛笔、墨水瓶和替换用的羊皮纸。窗户修好了，光线柔和地洒在桌面上，不再刺眼也不再昏暗。这是一个真正的缮写角落了。`, en: `The desk is replaced with a wider oak table; the drawers hold quills, ink bottles, and spare parchment in neat rows. The window is repaired, and soft light falls on the desk—neither glaring nor dim. This is a true copying corner now.` },
  focusRoomNarrative3: { zh: `缮写室明亮起来。墙上挂着你誊抄过的书籍封面拓印，书架上的参考书随时待命。空气中有淡淡的墨香和旧书的气味——这两种味道混合在一起，构成了"专注"的嗅觉定义。`, en: `The Scriptorium brightens. The walls display rubbings of covers from books you have copied, and reference books stand ready on the shelves. The air carries a faint scent of ink and old books—the olfactory definition of "focus."` },
  focusRoomNarrative4: { zh: `这里变得安静而庄重。每一样工具都有固定的位置，每一盏灯的亮度都刚好合适。你发现自己在缮写时不自觉地放轻了呼吸——不是紧张，而是因为这里太适合专注了，连呼吸都怕打扰。`, en: `The room has grown quiet and solemn. Every tool has its place, and every lamp is set just right. You find yourself breathing more softly while copying—not from tension, but because the space is so suited to focus that even breathing feels like a disturbance.` },
  focusRoomNarrative5: { zh: `缮写室现在是一间艺术品。高窗透进柔和的自然光，藤蔓从窗外垂下，在地板上投下摇曳的影子。来访的客人会在这里驻足，轻声感叹——而你知道，最好的作品还没诞生。`, en: `The Scriptorium is now a work of art. Tall windows let in soft natural light, vines hang outside and cast swaying shadows on the floor. Visiting guests pause and sigh softly—and you know the best work is yet to be born.` },
  focusRoomNarrative6: { zh: `这里不再是缮写室，而是一座缮写圣堂。穹顶上描绘着书卷与星辰的壁画，巨大的圆窗将日月之光引入室内。每一本在这里完成的书，都会在书脊上浮现一道金色纹路——那是圣堂的祝福。`, en: `This is no longer a scriptorium, but a Scriptorium Sanctuary. The dome bears a mural of scrolls and stars, and a great round window draws sunlight and moonlight inside. Every book completed here gains a golden vein along its spine—the sanctuary’s blessing.` },
  borrowAreaNarrativeDefault: { zh: '借阅区变得更加舒适了。', en: 'The Reading Area has become more comfortable.' },
  borrowAreaNarrative1: { zh: `你在东侧角落清出一小片区域，放上两把旧椅子和一个矮书架。虽然简陋，但这是图书馆第一次有了"可以坐下来看书"的地方。来访的人终于不用站着翻书了。`, en: `You clear a small corner on the east side, set out two old chairs and a low bookshelf. It is humble, but it is the first place in the library where one can "sit down and read." Visitors no longer have to stand and flip through pages.` },
  borrowAreaNarrative2: { zh: `书架被重新排列，围出一个半开放的小隔间。你铺上了一块旧地毯，放了几个靠垫。虽然还是很朴素，但已经有"阅读角落"的雏形了——有人在这里坐了一整个下午。`, en: `The shelves are rearranged into a semi-open nook. You lay down an old rug and a few cushions. Still modest, but the embryo of a "reading corner" is here—someone sat for a whole afternoon.` },
  borrowAreaNarrative3: { zh: `借阅区大幅扩建！你打通了一堵非承重墙，将隔壁的空房间纳入。现在这里能容纳六位读者同时阅览，阳光从新开的窗户洒进来，照亮了书架上的烫金书脊。`, en: `The Reading Area expands greatly! You remove a non-load-bearing wall and bring in the adjacent empty room. Now six readers can browse at once; sunlight pours through the new window, illuminating the gilt spines.` },
  borrowAreaNarrative4: { zh: `舒适的扶手椅替换了硬木凳，每张椅子旁边都有一盏小台灯。角落里多了一台饮水机和一盆绿植。来这里的人越来越多，但空间依然宽裕——布局是花了心思的。`, en: `Comfortable armchairs replace the hard wooden stools, each with a small lamp beside it. A water dispenser and a potted plant appear in the corner. More people come, yet the space remains ample—the layout was planned with care.` },
  borrowAreaNarrative5: { zh: `借阅区现在精致得像一间私人书房。书架是定制的深色橡木，窗帘是厚实的天鹅绒，地毯柔软无声。有人在留言簿上写道："这是我待过最舒服的图书馆。"`, en: `The Reading Area is now as refined as a private study. The shelves are custom dark oak, the curtains thick velvet, the carpet soft and silent. Someone wrote in the guestbook, "This is the most comfortable library I have ever been in."` },
  borrowAreaNarrative6: { zh: `借阅区变得优雅而从容。高高的拱形窗户让整个空间充满自然光，书架之间的间距足够让人从容穿行。每个座位都是一个小世界——安静、独立、被书籍温柔包围。`, en: `The Reading Area has become elegant and unhurried. Tall arched windows fill the space with natural light, and the aisles are wide enough to move through with ease. Every seat is a small world—quiet, independent, gently surrounded by books.` },
  borrowAreaNarrative7: { zh: `借阅区如今被称为"阅读圣所"。两层的挑高空间，穹顶壁画描绘着古代学者和神话场景。螺旋楼梯通往二层的私人阅读隔间。来访者进门时会下意识地放轻脚步——这是对知识的本能尊重。`, en: `The Reading Area is now called the "Reading Sanctum." A double-height space, its dome mural depicts ancient scholars and mythic scenes. A spiral stair leads to private reading alcoves on the second floor. Visitors instinctively soften their footsteps upon entering—a primal respect for knowledge.` },

  // ========== 资源 ==========
  coins: { zh: '智慧之光', en: 'Wisdom Light' },
  inspiration: { zh: '灵感', en: 'Inspiration' },
  atmosphere: { zh: '氛围', en: 'Atmosphere' },

  // ========== 设施 ==========
  readingArea: { zh: '借阅区', en: 'Reading Area' },
  shelf: { zh: '书架', en: 'Bookshelf' },
  manuscriptBox: { zh: '手稿箱', en: 'Manuscript Box' },
  portal: { zh: '传送门', en: 'Portal' },
  signboard: { zh: '标志牌', en: 'Signboard' },
  plant: { zh: '盆栽', en: 'Plant' },

  // ========== 访客 ==========
  visitor: { zh: '访客', en: 'Visitor' },
  favorability: { zh: '好感度', en: 'Favor' },
  browsing: { zh: '浏览中', en: 'Browsing' },
  borrowed: { zh: '已借出', en: 'Borrowed' },
  due: { zh: '待归还', en: 'Due' },
  stickyNote: { zh: '便签', en: 'Note' },
  aura: { zh: '光环', en: 'Aura' },

  // ========== 书籍 ==========
  transcribe: { zh: '誊抄', en: 'Transcribe' },
  mastery: { zh: '熟练度', en: 'Mastery' },
  chapter: { zh: '章节', en: 'Chapter' },
  reCopy: { zh: '重抄', en: 'Recopy' },
  damaged: { zh: '损毁', en: 'Damaged' },
  shelve: { zh: '上架', en: 'Shelve' },
  curation: { zh: '策展', en: 'Curation' },

  // ========== 书架 ==========
  myBookshelf: { zh: '我的书架', en: 'My Bookshelf' },
  bookCount: { zh: '{n}本', en: '{n} books' },
  purchaseNewShelf: { zh: '+ 购买新书架 💰{price}', en: '+ Purchase New Bookshelf 💰{price}' },
  slotsStatus: { zh: '{current}/{total} 格', en: '{current}/{total} slots' },
  maxSlotsReached: { zh: '已满 {n} 格 ✨', en: 'Max {n} slots ✨' },
  expand: { zh: '扩容', en: 'Expand' },
  completedPendingShelve: { zh: '✅ 已誊抄 · 待上架', en: '✅ Copied · Awaiting shelving' },
  pendingTranscription: { zh: '📝 待誊抄', en: '📝 Awaiting copy' },
  shelfLabel: { zh: '📚 书架 {n}', en: '📚 Bookshelf {n}' },
  clickToStart: { zh: '点击开始', en: 'Tap to start' },
  completed: { zh: '已完成', en: 'Completed' },
  copying: { zh: '誊抄中', en: 'Copying' },
  all: { zh: '全部', en: 'All' },
  starred: { zh: '⭐收藏', en: '⭐ Starred' },
  allCategories: { zh: '全部分类', en: 'All Categories' },
  sortDefault: { zh: '默认排序', en: 'Default' },
  sortWordsAsc: { zh: '字数 ↑', en: 'Words ↑' },
  sortWordsDesc: { zh: '字数 ↓', en: 'Words ↓' },

  // ========== 熟练度等级 ==========
  masteryName1: { zh: '初识', en: 'Familiar' },
  masteryName2: { zh: '熟悉', en: 'Adept' },
  masteryName3: { zh: '精通', en: 'Proficient' },
  masteryName4: { zh: '大师', en: 'Master' },
  masteryName5: { zh: '传承', en: 'Legacy' },

  // ========== 策展共鸣 ==========
  categoryResonance: { zh: '分类共鸣', en: 'Category Resonance' },
  eraResonance: { zh: '时代共鸣', en: 'Era Resonance' },
  resonanceTierSmall: { zh: '小成', en: 'Minor' },
  resonanceTierLarge: { zh: '大成', en: 'Major' },
  resonanceTierPerfect: { zh: '圆满', en: 'Perfect' },
  authorDialogue: { zh: '作者对话', en: 'Author Dialogue' },

  // ========== 章节/阅读弹窗 ==========
  masteryLevelLabel: { zh: '✦ 熟练度 Lv{level} · 已抄 {count} 次', en: '✦ Mastery Lv{level} · Copied {count} times' },
  reCopyCost: { zh: '🔮 花费灵感重抄 · {cost} 💡', en: '🔮 Spend Inspiration to Recopy · {cost} 💡' },
  currentInspiration: { zh: '当前灵感：{n} 💡', en: 'Current Inspiration: {n} 💡' },
  startTranscribeThisBook: { zh: '📝 开始誊抄此书', en: '📝 Start Copying This Book' },
  statusRead: { zh: '已读', en: 'Read' },
  statusUnlocked: { zh: '已解锁', en: 'Unlocked' },
  needTranscribeWords: { zh: '需誊抄 {words} 字', en: 'Copy {words} words to unlock' },
  pageIndicator: { zh: '第 {current}/{total} 页', en: 'Page {current}/{total}' },
  collectorArchive: { zh: '典藏档案', en: 'Collector Archive' },
  totalCopies: { zh: '共 {n} 次誊抄', en: '{n} copies made' },
  currentLabel: { zh: '← 当前', en: '← Current' },
  unlockAfterCopies: { zh: '再抄 {n} 次解锁', en: 'Copy {n} more times to unlock' },
  readChapters: { zh: '📖 阅读章节', en: '📖 Read Chapters' },
  bookShelvedAvailable: { zh: '书籍上架 · 可供访客借阅', en: 'Book shelved · available for visitors to borrow' },
  authorBioMissing: { zh: '作者小传待发现', en: 'Author bio yet to be discovered' },
  anecdotesMissing: { zh: '创作轶闻待发现', en: 'Anecdotes yet to be discovered' },
  reviewsMissing: { zh: '名家书评待发现', en: 'Critical reviews yet to be discovered' },
  collectorCoverEffect: { zh: '典藏封面 · 金光特效 · {cover}', en: 'Collector cover · golden glow · {cover}' },
  insufficientInspiration: { zh: '灵感不足！需要 {cost} 💡，当前拥有 {current} 💡', en: 'Not enough Inspiration! Need {cost} 💡, currently have {current} 💡' },

  // ========== 书籍分类 ==========
  categoryFairyTale: { zh: '童话', en: 'Fairy Tale' },
  categoryFable: { zh: '寓言', en: 'Fable' },
  categoryNovel: { zh: '小说', en: 'Novel' },
  categoryPoetry: { zh: '诗歌', en: 'Poetry' },
  categoryDrama: { zh: '戏剧', en: 'Drama' },
  categoryProse: { zh: '散文', en: 'Prose' },
  categoryPhilosophy: { zh: '哲学', en: 'Philosophy' },
  categoryBiography: { zh: '传记', en: 'Biography' },
  categoryHistory: { zh: '历史', en: 'History' },
  categoryScience: { zh: '科学', en: 'Science' },
  categoryMythology: { zh: '神话', en: 'Mythology' },
  categoryZhiguai: { zh: '志怪', en: 'Zhiguai' },

  // ========== 统计文案 ==========
  bookWordCount: { zh: '本书 {book} 字 · 累计 {total} 字', en: '{book} words · {total} total' },

  // ========== 进度 ==========
  focus: { zh: '专注', en: 'Focus' },
  streak: { zh: '连续专注', en: 'Streak' },
  atmosphereStage: { zh: '氛围阶段', en: 'Atmosphere Stage' },
  tierGoal: { zh: '阶位目标', en: 'Tier Goal' },
  achievement: { zh: '成就', en: 'Achievement' },
  guideQuest: { zh: '引导任务', en: 'Guide Quest' },
  milestone: { zh: '里程碑', en: 'Milestone' },
  dailyTask: { zh: '每日馆务', en: 'Daily Tasks' },
  plane: { zh: '位面', en: 'Plane' },
  memento: { zh: '信物', en: 'Memento' },
  replyLetter: { zh: '回信', en: 'Reply' },

  // ========== 任务系统 ==========
  planeQuest: { zh: '位面任务', en: 'Plane Quest' },
  questStage: { zh: '任务阶段', en: 'Quest Stage' },
  questObjective: { zh: '任务目标', en: 'Quest Objective' },
  questReward: { zh: '任务奖励', en: 'Quest Reward' },
  submitReply: { zh: '提交回信', en: 'Submit Reply' },
  unlockRequirements: { zh: '解锁条件', en: 'Unlock Requirements' },
  characterVisited: { zh: '角色到访', en: 'Character Visited' },
  questActiveTitle: { zh: '📨 进行中的任务', en: '📨 Active Quests' },
  questPendingTitle: { zh: '✉️ 等待回信', en: '✉️ Awaiting Reply' },
  questEmptyHint: { zh: '暂无任务。等待角色下次到访时带来新的委托。', en: 'No quests yet. Wait for the character to visit again with a new commission.' },
  questCompleted: { zh: '任务完成', en: 'Quest Completed' },
  questAutoAccepted: { zh: '此任务已自动接受。完成条件后将可回信提交。', en: 'This quest is automatically accepted. You may submit a reply once the condition is met.' },
  viewLetter: { zh: '查看来信', en: 'View Letter' },
  sendReply: { zh: '发送回信', en: 'Send Reply' },
  later: { zh: '稍后再说', en: 'Later' },
  gotIt: { zh: '知道了', en: 'Got it' },
  commissionContent: { zh: '📋 委托内容', en: '📋 Commission' },
  rewardLabel: { zh: '报酬：{reward}', en: 'Reward: {reward}' },
  none: { zh: '无', en: 'None' },
  backToPlane: { zh: '← 返回位面', en: '← Back to Plane' },
  characterNotVisited: { zh: '这位角色尚未到访图书馆。', en: 'This character has not visited the library yet.' },
  characterHeaderInfo: { zh: '{role} · 好感度 {favor}', en: '{role} · Favor {favor}' },
  letterFromName: { zh: '{name}的来信', en: 'Letter from {name}' },
  replyToName: { zh: '回信给{name}', en: 'Reply to {name}' },
  submissionFailed: { zh: '提交失败，请重试', en: 'Submission failed. Please try again.' },
  clickToViewDetails: { zh: '点击查看详情', en: 'Click to view details' },
  guidePhase1: { zh: '初入图书馆', en: 'Into the Library' },
  guidePhase2: { zh: '筑巢引凤', en: 'Building a Nest' },
  guidePhase3: { zh: '渐入佳境', en: 'Finding Rhythm' },
  rewardAtmosphere: { zh: '✨{n} 氛围', en: '✨{n} Atmosphere' },
  rewardCoins: { zh: '💰{n}', en: '💰{n}' },
  planeFirstVisit: { zh: '🌾 {name} 第一次到访', en: '🌾 {name} first visit' },
  planeFirstVisitorDetail: { zh: '{plane} · 第一位访客', en: '{plane} · First Visitor' },
  taskCompletedHistory: { zh: '📝 任务完成：{summary}', en: '📝 Task completed: {summary}' },
  taskConditionMetDetail: { zh: '条件已满足，可直接回信', en: 'Condition met; submit reply now' },
  taskReadyToSubmit: { zh: '准备回信提交', en: 'Ready to submit reply' },
  planeStageName1: { zh: '第一章：求救之声', en: 'Chapter One: The Cry for Help' },
  planeStageName2: { zh: '第二章：草药与祈祷', en: 'Chapter Two: Herbs and Prayers' },
  planeStageName3: { zh: '第三章：禁忌之书', en: 'Chapter Three: The Forbidden Book' },
  planeStageName4: { zh: '第四章：领主之责', en: "Chapter Four: The Lord's Duty" },
  planeStageName5: { zh: '第五章：黎明的山谷', en: 'Chapter Five: Valley of Dawn' },
  planeStageNarrative: { zh: '{plane}的故事推进到了新的阶段。', en: 'The story of {plane} advances to a new stage.' },
  planeAdvancedHistory: { zh: '🌾 位面推进：{label}', en: '🌾 Plane advanced: {label}' },
  planeStageDetail: { zh: '{plane} stage {stage}', en: '{plane} Stage {stage}' },
  questType_copy_chapter: { zh: '📝 誊抄章节', en: '📝 Copy Chapter' },
  questType_copy_book: { zh: '📖 誊抄完整书籍', en: '📖 Copy Complete Book' },
  questType_read_chapter: { zh: '👁️ 阅读章节', en: '👁️ Read Chapter' },
  questType_collect_seed: { zh: '🌱 收集种子', en: '🌱 Collect Seeds' },
  questType_deliver_item: { zh: '📦 传递信物', en: '📦 Deliver Memento' },
  questRewardLabel: { zh: '奖励：{reward}', en: 'Reward: {reward}' },

  // ========== 引导任务 ==========
  gqTitle_q01: { zh: '推开馆门', en: 'Open the Door' },
  gqDesc_q01: { zh: '你站在门外太久了。门缝里漏出的光浮动着灰尘和某种古老的回响。它已经等了很久——推门进去吧。这座图书馆，现在是你的了。', en: 'You have stood outside the door too long. Light and dust float through the crack, along with an ancient echo. It has waited long enough—push it open. This library is yours now.' },
  gqTitle_q02: { zh: '初试缮写', en: 'First Copy' },
  gqDesc_q02: { zh: '缮写室的旧书桌上，一支羽笔静静地躺着。墨水在玻璃瓶里微微反光，像在等什么人。选一本书，落下第一笔——这是你与这座图书馆之间的第一份契约。', en: 'An old quill lies quietly on the Scriptorium desk. Ink glints in the glass bottle, as if waiting for someone. Choose a book and set down the first stroke—this is your first pact with the library.' },
  gqTitle_q03: { zh: '誊抄初成', en: 'First Copy Complete' },
  gqDesc_q03: { zh: '搁下笔的瞬间，指尖还残留着微微的震颤。书页上的墨迹未干，但空气里已经浮起细碎的金色光点。那是图书馆的回赠——它记得每一个认真誊抄的人。', en: 'The moment you set down the pen, your fingertips still tremble. The ink is not yet dry, but golden motes already drift in the air. That is the library’s gift—it remembers everyone who copies with care.' },
  gqTitle_q04: { zh: '书库探秘', en: 'Explore the Hall of Books' },
  gqDesc_q04: { zh: '大书库里，有三本书在手稿箱里等你。童话、寓言——还有一本《图书馆指南》。建议先从誊抄《图书馆指南》开始，它会告诉你这个地方怎么运转。一座图书馆的故事，是从认出第一本书脊的颜色开始的。', en: 'In the Hall of Books, three books wait in the Manuscript Box: a fairy tale, a fable, and A Library Guide. Start by copying A Library Guide; it will tell you how this place works. A library’s story begins with recognizing the color of its first spine.' },
  gqTitle_q05: { zh: '商店初访', en: 'First Visit to the Shop' },
  gqDesc_q05: { zh: '墨墨把你领到了商店。书架上空着的位置还很多，缮写室和借阅区也等着修缮——用誊抄换来的智慧之光，可以买下新书、升级设施。这是馆长才有的权力：决定图书馆接下来变成什么样子。', en: 'Momo leads you to the shop. Many shelves are still empty, and the Scriptorium and Reading Area await restoration. The Wisdom Light earned through copying can buy new books and upgrade facilities. This is the curator’s power: deciding what the library will become next.' },
  gqTitle_q06: { zh: '借阅开张', en: 'Open the Reading Area' },
  gqDesc_q06: { zh: '书有了，缮写室有了——现在缺的是坐下来读它们的人。买下借阅区，把空置的旧房间变成一个可以阅读的角落。放上椅子，点亮灯，等某个推门而入的身影。', en: 'You have books and a scriptorium—now you need people to sit down and read them. Buy the Reading Area and turn the empty old room into a corner for reading. Add chairs, light the lamp, and wait for someone to push open the door.' },
  gqTitle_q07: { zh: '初成之书', en: 'A Completed Book' },
  gqDesc_q07: { zh: '最后一个句号落笔。书脊上浮现出极淡的金色纹路——那是一本书被真正拥有的印记。不是占有，而是守护。从今往后，它有资格被传递到另一个人手中了。', en: 'The final period is set. A faint golden vein appears on the spine—the mark of a book truly owned. Not possession, but guardianship. From now on, it is worthy of being passed into another’s hands.' },
  gqTitle_q08: { zh: '墨香来客', en: 'An Ink-Scented Guest' },
  gqDesc_q08: { zh: '门被推开了。有人走了进来，带着外面世界的风和好奇，在你的书架前停下。这是第一位读者。记住这个声音——你守护的东西，开始有人来寻了。', en: 'The door is pushed open. Someone enters, carrying the wind and curiosity of the outside world, and stops before your shelves. This is your first reader. Remember this sound—the things you guard have begun to be sought.' },
  gqTitle_q09: { zh: '墨墨相伴', en: "Momo's Company" },
  gqDesc_q09: { zh: '你在缮写室累计专注了整整一个小时的时光。墨墨不知道什么时候养成了假装睡觉、其实是偷看你的习惯。有时候它会伸个懒腰，尾巴轻轻扫过你正在誊抄的那一页——像是在检查进度。', en: 'You have focused for a whole hour in the Scriptorium. Momo has developed the habit of pretending to sleep while secretly watching you. Sometimes it stretches, its tail brushing lightly across the page you are copying—as if checking your progress.' },
  gqTitle_q10: { zh: '图南寄语', en: 'Words from Tunan' },
  gqDesc_q10: { zh: '你不是新人了。从倒塌的书架和漏雨的屋顶，到如今有人愿意穿越大半个城市来寻访的地方——每一个专注的深夜、每一次落笔、每一本被借走的书，都是证据。接下来，故事继续。欢迎来到这座图书馆的深处。', en: 'You are no longer a newcomer. From collapsed shelves and leaking roofs to a place people are willing to cross half the city to find—every late night of focus, every stroke, every borrowed book is proof. The story continues. Welcome to the depths of this library.' },

  // ========== 成就系统 ==========
  achievementLoading: { zh: '成就系统加载中…', en: 'Achievement system loading…' },
  achievementEmpty: { zh: '成就列表为空，请检查数据。', en: 'Achievement list is empty. Please check the data.' },
  achievementUnlockedCount: { zh: '已解锁 {unlocked}/{total}', en: 'Unlocked {unlocked}/{total}' },
  achievementLockedName: { zh: '???', en: '???' },
  achievementUnlocked: { zh: '成就解锁', en: 'Achievement Unlocked' },
  effectLabel: { zh: '效果：', en: 'Effect: ' },
  achievementCategory_restoration: { zh: '修复启蒙', en: 'Restoration' },
  achievementCategory_wisdom: { zh: '智慧之光', en: 'Wisdom' },
  achievementCategory_collection: { zh: '书籍收集', en: 'Collection' },
  achievementCategory_reconstruction: { zh: '图书馆重建', en: 'Reconstruction' },
  achievementCategory_visitors: { zh: '访客', en: 'Visitors' },
  achievementCategory_secrets: { zh: '彩蛋', en: 'Secrets' },
  rarity_bronze: { zh: '青铜', en: 'Bronze' },
  rarity_silver: { zh: '白银', en: 'Silver' },
  rarity_gold: { zh: '黄金', en: 'Gold' },
  rarity_platinum: { zh: '铂金', en: 'Platinum' },

  // 成就名称
  achName_F01: { zh: '图书馆之门', en: 'Gate of the Library' },
  achName_F02: { zh: '智慧初光', en: 'First Light of Wisdom' },
  achName_F03: { zh: '首卷修复', en: 'First Volume Restored' },
  achName_F04: { zh: '借阅初启', en: 'First Borrowing' },
  achName_W01: { zh: '晨读半小时', en: 'Half-Hour Morning Reading' },
  achName_W02: { zh: '夜读一小时', en: 'One-Hour Night Reading' },
  achName_W03: { zh: '万字千言', en: 'Ten Thousand Words' },
  achName_W04: { zh: '三日不辍', en: 'Three Days Unbroken' },
  achName_W05: { zh: '八小时修行', en: 'Eight Hours of Practice' },
  achName_W06: { zh: '七日不绝', en: 'Seven Days Unbroken' },
  achName_W07: { zh: '十万字匠', en: 'Master of Hundred Thousand Words' },
  achName_W08: { zh: '三十日之约', en: 'Thirty-Day Promise' },
  achName_B01: { zh: '开卷有益', en: 'Opening a Book Brings Benefit' },
  achName_B02: { zh: '十卷初成', en: 'Ten Volumes Formed' },
  achName_B03: { zh: '小说世界', en: 'World of Novels' },
  achName_B04: { zh: '史海钩沉', en: 'Fishing History from the Sea' },
  achName_B05: { zh: '格物致知', en: 'Investigating Things to Gain Knowledge' },
  achName_B06: { zh: '哲思之路', en: 'Path of Philosophical Thought' },
  achName_B07: { zh: '五书精通', en: 'Mastery of Five Books' },
  achName_B08: { zh: '典藏大师', en: 'Master Collector' },
  achName_B09: { zh: '卷轴收藏家', en: 'Scroll Collector' },
  achName_L01: { zh: '初见光明', en: 'First Light' },
  achName_L02: { zh: '书架添丁', en: 'New Bookshelf' },
  achName_L02b: { zh: '墨香初遇', en: 'First Encounter with Ink' },
  achName_L03: { zh: '书香满架', en: 'Shelves Full of Books' },
  achName_L04: { zh: '借阅进阶', en: 'Borrowing Advanced' },
  achName_L05: { zh: '温暖殿堂', en: 'Warm Hall' },
  achName_L06: { zh: '借阅殿堂', en: 'Hall of Borrowing' },
  achName_L07: { zh: '星辰图书馆', en: 'Starlight Library' },
  achName_V03: { zh: '墨香来客', en: 'Ink-Scented Visitor' },
  achName_V01: { zh: '门庭若市', en: 'A Crowded Doorway' },
  achName_V02: { zh: '四海皆知', en: 'Known Across the Four Seas' },
  achName_H01: { zh: '午夜访客', en: 'Midnight Visitor' },
  achName_H02: { zh: '书虫之友', en: 'Friend of Bookworms' },

  // 成就描述
  achDesc_F01: { zh: '完成新手引导，正式接手这座破败的图书馆', en: 'Complete the tutorial and officially take over this ruined library' },
  achDesc_F02: { zh: '第一次完成专注模式', en: 'Complete Focus Mode for the first time' },
  achDesc_F03: { zh: '完整誊抄完成第一本书并上架', en: 'Fully transcribe and shelve your first book' },
  achDesc_F04: { zh: '迎来第一位访客并完成借阅归还', en: 'Welcome your first visitor and complete a borrow-return cycle' },
  achDesc_W01: { zh: '累计专注时长达到30分钟', en: 'Accumulate 30 minutes of focus time' },
  achDesc_W02: { zh: '累计专注时长达到1小时', en: 'Accumulate 1 hour of focus time' },
  achDesc_W03: { zh: '累计誊抄1万字', en: 'Accumulate 10,000 copied words' },
  achDesc_W04: { zh: '连续3天专注', en: 'Focus for 3 consecutive days' },
  achDesc_W05: { zh: '累计专注时长达到8小时', en: 'Accumulate 8 hours of focus time' },
  achDesc_W06: { zh: '连续7天专注', en: 'Focus for 7 consecutive days' },
  achDesc_W07: { zh: '累计誊抄10万字', en: 'Accumulate 100,000 copied words' },
  achDesc_W08: { zh: '累计30天有专注记录（可不连续）', en: 'Have focus records on 30 days (need not be consecutive)' },
  achDesc_B01: { zh: '第一次开始誊抄一本书', en: 'Start transcribing a book for the first time' },
  achDesc_B02: { zh: '拥有10本不同的书籍', en: 'Own 10 different books' },
  achDesc_B03: { zh: '小说类书籍收集达到5本', en: 'Collect 5 Novel-category books' },
  achDesc_B04: { zh: '历史类书籍收集达到5本', en: 'Collect 5 History-category books' },
  achDesc_B05: { zh: '科学类书籍收集达到3本', en: 'Collect 3 Science-category books' },
  achDesc_B06: { zh: '哲学类书籍收集达到3本', en: 'Collect 3 Philosophy-category books' },
  achDesc_B07: { zh: '5本书达到mastery Lv3以上', en: 'Reach mastery Lv.3 or above on 5 books' },
  achDesc_B08: { zh: '3本书达到mastery Lv5', en: 'Reach mastery Lv.5 on 3 books' },
  achDesc_B09: { zh: '在古籍修复室首次合成一本典藏版', en: 'Craft your first Collector Edition in the Restoration Room' },
  achDesc_L01: { zh: '氛围脱离废墟阶段（>30）', en: 'Atmosphere rises above the ruins stage (>30)' },
  achDesc_L02: { zh: '购买第一个新书架', en: 'Purchase your first new bookshelf' },
  achDesc_L02b: { zh: '购买第一本书', en: 'Purchase your first book' },
  achDesc_L03: { zh: '氛围达到陈旧阶段（>80）', en: 'Atmosphere reaches the Weathered stage (>80)' },
  achDesc_L04: { zh: '借阅区升至Lv3', en: 'Reading Area reaches Lv.3' },
  achDesc_L05: { zh: '氛围达到温暖阶段（>160）', en: 'Atmosphere reaches the Warm stage (>160)' },
  achDesc_L06: { zh: '借阅区升至Lv7', en: 'Reading Area reaches Lv.7' },
  achDesc_L07: { zh: '氛围达到星辰阶段（>300）', en: 'Atmosphere reaches the Starlight stage (>300)' },
  achDesc_V03: { zh: '第一位访客来到图书馆', en: 'The first visitor arrives at the library' },
  achDesc_V01: { zh: '累计迎接20位访客', en: 'Welcome 20 visitors in total' },
  achDesc_V02: { zh: '4位访客各触发过至少一次事件', en: '4 visitors have each triggered at least one event' },
  achDesc_H01: { zh: '在凌晨0:00-2:00间收取一位访客的还书', en: 'Collect a returned book from a visitor between 0:00 and 2:00' },
  achDesc_H02: { zh: '在专注页累计点击书籍emoji 30次', en: 'Click the book emoji on the focus page 30 times' },

  // 成就加成说明
  achBonus_W06: { zh: '⚡ 连击加成 3%/天', en: '⚡ Streak bonus 3%/day' },
  achBonus_L04: { zh: '⚡ 缮写室升级 7%/级', en: '⚡ Scriptorium upgrade 7%/level' },
  achBonus_B07: { zh: '📝 誊抄速度 +5%', en: '📝 Copy speed +5%' },
  achBonus_V02: { zh: '💰 智慧之光 +10%', en: '💰 Wisdom Light +10%' },
  achBonus_W07: { zh: '✨ 每次专注 +1 灵感', en: '✨ +1 Inspiration per focus' },
  achBonus_B08: { zh: '✨ 每次专注 +2 灵感', en: '✨ +2 Inspiration per focus' },

  // 墨墨成就点评
  momoComment_restoration_0: { zh: '墨墨记得，很久以前这座图书馆也有过这样的时刻……', en: 'Momo remembers, long ago, this library also had moments like this…' },
  momoComment_restoration_1: { zh: '每一块砖、每一页纸，都在记得你的努力。', en: 'Every brick, every page, remembers your effort.' },
  momoComment_restoration_2: { zh: '修复的不是墙，是这座图书馆的心跳。', en: "What you restore is not the wall, but the heartbeat of this library." },
  momoComment_restoration_3: { zh: '墨墨在横梁上看着——这里越来越像从前了。', en: 'Momo watches from the beam—this place looks more like the old days.' },
  momoComment_wisdom_0: { zh: '墨墨在横梁上偷偷数着你专注的分钟数呢。', en: 'Momo secretly counts your focused minutes from the beam.' },
  momoComment_wisdom_1: { zh: '这只猫头鹰见证了你的每一次落笔。', en: 'This owl has witnessed every stroke of your pen.' },
  momoComment_wisdom_2: { zh: '专注的时候，墨墨觉得你的羽毛笔在发光。', en: 'When you focus, Momo thinks your quill is glowing.' },
  momoComment_wisdom_3: { zh: '墨墨给你泡的茶都凉了，你都没注意到。', en: "The tea Momo brewed for you has gone cold, and you didn't even notice." },
  momoComment_collection_0: { zh: '书架上又多了一个新朋友！墨墨已经和它打过招呼了。', en: 'Another new friend on the shelf! Momo has already greeted it.' },
  momoComment_collection_1: { zh: '墨墨最喜欢给新书整理位置了——虽然它只能用翅膀。', en: 'Momo loves organizing new books—though it can only use wings.' },
  momoComment_collection_2: { zh: '每一本书来到这座图书馆，都是命运的安排。', en: "Every book that comes to this library is fate's arrangement." },
  momoComment_collection_3: { zh: '墨墨给每本新书都留了一根羽毛做书签。', en: 'Momo leaves a feather in every new book as a bookmark.' },
  momoComment_reconstruction_0: { zh: '墨墨看着这座图书馆一天天变好，眼眶有点湿……', en: 'Momo watches this library get better day by day, eyes a little wet…' },
  momoComment_reconstruction_1: { zh: '很久很久以前，图书馆也是这么漂亮。但你让它更好了。', en: 'Long, long ago, the library was also this beautiful. But you made it better.' },
  momoComment_reconstruction_2: { zh: '墨墨的祖先也在这座图书馆里住过。它会为你骄傲的。', en: "Momo's ancestors also lived in this library. It would be proud of you." },
  momoComment_reconstruction_3: { zh: '这不是原来的图书馆——这是你和墨墨的图书馆。', en: "This is not the original library—this is your and Momo's library." },
  momoComment_visitors_0: { zh: '有人来了！墨墨躲到横梁后面偷偷观察……', en: "Someone's here! Momo hides behind the beam to peek…" },
  momoComment_visitors_1: { zh: '每一个推门进来的人，都让墨墨开心一整天。', en: 'Every person who pushes open the door makes Momo happy all day.' },
  momoComment_visitors_2: { zh: '读者是最珍贵的宝藏——墨墨一直这么认为。', en: 'Readers are the most precious treasure—Momo has always thought so.' },
  momoComment_visitors_3: { zh: '墨墨数过了，今天的脚步声比昨天多。', en: "Momo counted—today's footsteps are more than yesterday's." },
  momoComment_secrets_0: { zh: '这个秘密连墨墨都不知道！', en: "Even Momo didn't know this secret!" },
  momoComment_secrets_1: { zh: '墨墨歪着头看了好久……馆长，你是怎么做到的？', en: 'Momo tilts its head for a long time… Curator, how did you do it?' },
  momoComment_secrets_2: { zh: '嘘——墨墨把这个秘密记在日志的最后一页了。', en: 'Shh—Momo wrote this secret on the last page of the log.' },
  momoComment_secrets_3: { zh: '墨墨的眼镜都惊掉了！', en: "Momo's glasses fell off in surprise!" },

  // ========== 馆长目标阶梯 ==========
  tierGoalName1: { zh: '推开馆门', en: 'Opening the Door' },
  tierGoalName2: { zh: '烛火初明', en: 'First Candlelight' },
  tierGoalName3: { zh: '典籍渐满', en: 'Shelves Filling' },
  tierGoalName4: { zh: '登堂入室', en: 'A True Haven' },
  tierGoalName5: { zh: '星辰之境', en: 'Realm of Stars' },
  tierGoalSubtitle1: { zh: '废墟中的第一道门', en: 'The first door in the ruins' },
  tierGoalSubtitle2: { zh: '第一簇烛光亮起', en: 'The first candle is lit' },
  tierGoalSubtitle3: { zh: '书香渐浓，秩序初成', en: 'The scent of books, the first order' },
  tierGoalSubtitle4: { zh: '不只是建筑，而是庇护所', en: 'Not just a building, but a haven' },
  tierGoalSubtitle5: { zh: '奇迹在此栖息', en: 'Where miracles dwell' },
  tierGoalFlavor1: { zh: '你站在门外太久了。门缝里漏出的光浮动着灰尘和某种古老的回响。推门进去——这座图书馆，现在是你的了。在缮写室落下第一笔，然后去大书库看看手稿箱里有什么。', en: 'You have stood outside the door too long. Light and ancient echoes slip through the crack. Push it open—this library is yours now. Begin in the Scriptorium, then visit the Hall of Books to check the Manuscript Box.' },
  tierGoalFlavor2: { zh: '你费力地扶正第三排书架——它不再摇晃了。第一本书被誊抄完成，烛光照亮了整个东厅。你还不太熟悉这里，但图书馆已经开始记得你的温度。', en: 'You right the third shelf—it no longer sways. The first book is copied; candlelight fills the east hall. You are still a stranger here, but the library is beginning to remember your warmth.' },
  tierGoalFlavor3: { zh: '现在走进图书馆，首先注意到的不再是破败，而是安静——一种被妥善维护的、有尊严的安静。书架站稳了，书脊整齐排列。角落里那株植物见证了这一切。', en: 'Now when you enter, you notice not ruin but quiet—a dignified, well-kept stillness. Shelves stand firm; spines line up. The plant in the corner has witnessed it all.' },
  tierGoalFlavor4: { zh: '图书馆有了一种特别的温度——不是壁炉的温度，而是被许多人触碰过的温度。访客们开始在这里停留，不只是借书，而是坐下阅读。异世界的门扉也悄然开启。', en: 'The library has a special warmth—not the hearth, but the warmth of many hands. Visitors linger not just to borrow, but to sit and read. Doors to other worlds quietly open.' },
  tierGoalFlavor5: { zh: '某个深夜，你誊抄完最后一页。抬起头，发现图书馆的穹顶变成了星空——那是所有被誊抄过的文字，在天花板上化为了光点。你已经把一座废墟，变成了一方世界。', en: 'Late one night, you copy the last page. You look up and the dome has become a starry sky—every copied word turned to light. You have made a world from a ruin.' },

  // Tier goals
  t1g1: { zh: '完成新手引导', en: 'Complete the tutorial' },
  t1g2: { zh: '开始第一次专注', en: 'Start your first focus' },
  t1g3: { zh: '完成第一次誊抄', en: 'Complete your first copy' },
  t1g4: { zh: '打开大书库查看手稿箱', en: 'Open the Hall of Books and check the Manuscript Box' },
  t2g1: { zh: '誊抄完成第一本书', en: 'Complete your first book' },
  t2g2: { zh: '在商店购买新书', en: 'Buy a new book in the shop' },
  t2g3: { zh: '升级借阅区至 Lv.1', en: 'Upgrade Reading Area to Lv.1' },
  t2g4: { zh: '迎来第一位访客', en: 'Welcome your first visitor' },
  t3g1: { zh: '完成 5 本书', en: 'Complete 5 books' },
  t3g2: { zh: '累计专注 120 分钟', en: 'Focus for 120 minutes total' },
  t3g3: { zh: '吸引 3 位不同访客', en: 'Attract 3 different visitors' },
  t3g4: { zh: '拥有一株植物', en: 'Own a plant' },
  t4g1: { zh: '完成 10 本书', en: 'Complete 10 books' },
  t4g2: { zh: '解锁一个位面', en: 'Unlock a plane' },
  t4g3: { zh: '吸引 6 位不同访客', en: 'Attract 6 different visitors' },
  t4g4: { zh: '购买一个标志牌', en: 'Buy a signboard' },
  t5g1: { zh: '完成 15 本书', en: 'Complete 15 books' },
  t5g2: { zh: '吸引全部 10 位访客', en: 'Attract all 10 visitors' },
  t5g3: { zh: '解锁 15 个成就', en: 'Unlock 15 achievements' },
  t5g4: { zh: '氛围达到 500', en: 'Reach 500 Atmosphere' },

  // ========== 专注 / 缮写室 ==========
  transcribeSpeed: { zh: '誊抄速度 {value}%', en: 'Transcribe Speed {value}%' },
  selectFocusMode: { zh: '选择专注模式', en: 'Select Focus Mode' },
  focusModePomodoro: { zh: '番茄钟', en: 'Pomodoro' },
  focusModeCountdown: { zh: '倒计时', en: 'Countdown' },
  focusModeStopwatch: { zh: '正计时', en: 'Stopwatch' },
  noLimit: { zh: '无限制', en: 'No limit' },
  durationMinutes: { zh: '{n}分钟', en: '{n} min' },
  setTime: { zh: '设定时间：', en: 'Set time:' },
  minutesSuffix: { zh: '分钟', en: 'min' },
  selectBookToTranscribe: { zh: '选择誊抄书籍', en: 'Select Book to Copy' },
  goToShelfSelectBook: { zh: '去书架选一本书开始誊抄吧 📚', en: 'Go to the shelf and pick a book to copy 📚' },
  repairing: { zh: '🔧 修复中 {pct}%', en: '🔧 Repairing {pct}%' },
  dailyFocus25Min: { zh: '专注 25 分钟', en: 'Focus 25 min' },
  dailyReturnBook: { zh: '收取一本还书', en: 'Collect a returned book' },
  dailyWaterPlant: { zh: '给植物浇水', en: 'Water the plant' },
  allDoneText: { zh: '✦ 全数了却', en: '✦ All Done' },
  claimAllDoneReward: { zh: '🎁 领取全勤奖励 · 💰20 + ✨3 + 💡3', en: '🎁 Claim full-attendance reward · 💰20 + ✨3 + 💡3' },
  rewardClaimed: { zh: '✓ 已获得 💰20 + ✨3 + 💡3', en: '✓ Claimed 💰20 + ✨3 + 💡3' },
  dailyTasksAllCompleted: { zh: '✦ 今日馆务已悉数完成 · 全勤奖励已领取 ✦', en: '✦ Daily tasks completed · reward claimed ✦' },
  startFocus: { zh: '✨ 开始专注', en: '✨ Start Focus' },
  pause: { zh: '⏸️ 暂停', en: '⏸️ Pause' },
  resume: { zh: '▶️ 继续', en: '▶️ Resume' },
  complete: { zh: '✅ 完成', en: '✅ Complete' },
  confirmAbandonFocus: { zh: '确定要放弃本次专注吗？已完成时间将计入{pct}%。', en: 'Abandon this focus? Completed time counts at {pct}%.' },
  chapterUnlockedPrompt: { zh: '第{n}章「{title}」已解锁！去{link}回信提交吧', en: 'Chapter {n}「{title}」unlocked! Submit your reply on the {link}.' },
  planePage: { zh: '位面页面', en: 'Plane Page' },
  copyingChapterFor: { zh: '正在为 {character} 誊抄第{n}章「{title}」 · 还需约 {words} 字解锁', en: 'Copying Chapter {n}「{title}」for {character} · about {words} words left to unlock' },
  repairProgress: { zh: '🔧 修复进度', en: '🔧 Repair Progress' },
  repairCompleteTitle: { zh: '🩹 书籍修复完成', en: '🩹 Book Restored' },
  repairCompleteRewardCoins: { zh: '+{n} 智慧之光', en: '+{n} Wisdom Light' },
  repairCompleteRewardInspiration: { zh: '+{n}✨ 灵感', en: '+{n}✨ Inspiration' },
  repairCompleteRewardAtmosphere: { zh: '+{n} 氛围', en: '+{n} Atmosphere' },
  repairCompleteRewardCoinsLabel: { zh: '智慧之光', en: 'Wisdom Light' },
  repairCompleteRewardInspirationLabel: { zh: '灵感', en: 'Inspiration' },
  repairCompleteRewardAtmosphereLabel: { zh: '氛围', en: 'Atmosphere' },
  repairCompleteFlavour: { zh: '损毁的页面已经补好了，墨迹新鲜，羊皮纸平整——你比上一任守护者用心。', en: 'The damaged pages are mended, the ink fresh, the parchment smooth—you care more than the last keeper.' },
  repairCompleteMomoTip: { zh: '🦉 墨墨的小贴士：把珍贵的书放进修缮箱，访客就借不走了；挂上「爱惜书籍」标志牌，也能减少粗心造成的损坏。', en: "🦉 Momo's tip: Keep precious books in the restoration box so visitors can't borrow them; hang the 'Care for Books' sign to reduce careless damage." },
  wordsUnit: { zh: '字', en: 'words' },
  wordsCount: { zh: '{n}字', en: '{n} words' },
  copyProgressLabel: { zh: '《{title}》誊抄进度', en: '{title} — Copy Progress' },
  repairSpeedBoost: { zh: '{pct}% · 修书中速度 +{n}%', en: '{pct}% · +{n}% repair speed' },
  writingStatus: { zh: '🖋️ 缮写中… 第{n}页', en: '🖋️ Writing… Page {n}' },
  momoMagicAccelerating: { zh: '✨ 墨墨的魔法加速中……', en: "✨ Momo's magic acceleration…" },
  thisBook: { zh: '本书', en: 'Book' },
  copyBookLabel: { zh: '缮写《{title}》', en: 'Copying {title}' },
  repairingTitle: { zh: '正在修复中…', en: 'Repairing…' },
  repairFlavourText: { zh: '上次访客还书时这本书有些损坏。专注誊抄就是在修复它——你之前抄过的内容已经在你心里了，再来一遍会更快。', en: 'A visitor returned this book damaged. Focused copying is how you repair it—what you copied before is already in your heart, so the next pass will be faster.' },
  repairRemaining: { zh: '还剩 {words} 字待修复', en: '{words} words remaining to repair' },
  bookSource: { zh: '——《{title}》', en: '— {title}' },
  takeABreakChooseAction: { zh: '☕ 休息一下，选一件事做吧', en: '☕ Take a break, choose an action' },

  // ========== 行动卡 ==========
  actionWaterPlant: { zh: '给植物浇水', en: 'Water the Plant' },
  actionWaterPlantDesc: { zh: '不消耗浇水次数 · +{value} 进度', en: 'Does not consume daily water · +{value} growth' },
  actionWaterPlantHistory: { zh: '🌱 给植物浇了水', en: '🌱 Watered the plant' },
  actionPlantGrowthPlus: { zh: '盆栽进度 +{value}', en: 'Plant growth +{value}' },

  actionChatVisitor: { zh: '和在馆访客聊天', en: 'Chat with a Visitor' },
  actionChatVisitorDesc: { zh: '随机访客好感 +{min}~{max}', en: 'Random visitor favor +{min}~{max}' },
  actionChatVisitorHistory: { zh: '💬 和{emoji} {name}聊了一会', en: '💬 Chatted with {emoji} {name}' },
  actionFavorPlusN: { zh: '好感 +{n}', en: 'Favor +{n}' },

  actionOrganizeShelf: { zh: '整理书架', en: 'Tidy the Shelves' },
  actionOrganizeShelfDesc: { zh: '+{min}~{max} 智慧之光 · +1 氛围', en: '+{min}~{max} Wisdom Light · +1 Atmosphere' },
  actionOrganizeShelfHistory: { zh: '📋 整理了书架', en: '📋 Tidied the shelves' },
  actionCoinsAndAtmosphere: { zh: '+{coins} 智慧之光 · +1 氛围', en: '+{coins} Wisdom Light · +1 Atmosphere' },

  actionBrewTea: { zh: '泡杯热茶', en: 'Brew Tea' },
  actionBrewTeaDesc: { zh: '下次专注前5分钟速度 +{pct}%', en: 'Focus speed +{pct}% for the first 5 min next time' },
  actionBrewTeaHistory: { zh: '🍵 泡了一杯热茶', en: '🍵 Brewed a cup of tea' },
  actionBrewTeaEffect: { zh: '下次专注前5分钟速度+{pct}%', en: 'Focus speed +{pct}% for the first 5 min' },

  actionOldNotes: { zh: '翻翻旧笔记', en: 'Review Old Notes' },
  actionOldNotesDesc: { zh: '随机已完成书 誊抄进度 +{pct}%', en: 'Random completed book copy progress +{pct}%' },
  actionOldNotesHistory: { zh: '📝 翻看了《{title}》的旧笔记', en: '📝 Reviewed notes on “{title}”' },
  actionCopyProgressPlusWords: { zh: '誊抄进度 +{words} 字', en: 'Copy progress +{words} words' },

  actionOpenWindow: { zh: '开窗通风', en: 'Open the Window' },
  actionOpenWindowDesc: { zh: '+1 氛围 · +{min}~{max} 智慧之光', en: '+1 Atmosphere · +{min}~{max} Wisdom Light' },
  actionOpenWindowHistory: { zh: '🪟 开了窗通风', en: '🪟 Opened the window' },
  actionAtmosphereAndCoins: { zh: '+1 氛围 · +{coins} 智慧之光', en: '+1 Atmosphere · +{coins} Wisdom Light' },

  actionLightCandle: { zh: '点燃烛台', en: 'Light a Candle' },
  actionLightCandleDesc: { zh: '下次专注完成额外 +{n} 灵感', en: 'Extra +{n} Inspiration next focus completion' },
  actionLightCandleHistory: { zh: '🕯️ 点燃了烛台', en: '🕯️ Lit a candle' },
  actionLightCandleEffect: { zh: '下次专注完成额外+{n}灵感', en: 'Extra +{n} Inspiration next focus' },

  actionSweepDust: { zh: '拂去灰尘', en: 'Dust the Shelves' },
  actionSweepDustDesc: { zh: '+{n} 氛围', en: '+{n} Atmosphere' },
  actionSweepDustHistory: { zh: '🧹 拂去了书架上的灰尘', en: '🧹 Dusted the shelves' },

  actionSortManuscripts: { zh: '整理手稿', en: 'Sort Manuscripts' },
  actionSortManuscriptsDesc: { zh: '+{min}~{max} 智慧之光', en: '+{min}~{max} Wisdom Light' },
  actionSortManuscriptsHistory: { zh: '🗺️ 整理了散落的手稿', en: '🗺️ Sorted scattered manuscripts' },
  actionCoinsPlusN: { zh: '+{n} 智慧之光', en: '+{n} Wisdom Light' },

  actionHumTune: { zh: '轻哼调子', en: 'Hum a Tune' },
  actionHumTuneDesc: { zh: '在馆访客各 +{n} 好感', en: 'All in-library visitors +{n} Favor' },
  actionHumTuneHistory: { zh: '🎵 轻轻哼了一首歌', en: '🎵 Hummed a soft tune' },
  actionVisitorsFavorPlusN: { zh: '在馆访客好感各 +{n}', en: 'All visitors Favor +{n}' },

  activeAurasCount: { zh: '🛋️ 在馆光环（{n}）', en: '🛋️ In-Library Auras ({n})' },
  focusCompleted: { zh: '专注完成', en: 'Focus Complete' },
  unitMinutes: { zh: '分钟', en: 'min' },
  copiedWordsLabel: { zh: '誊抄字', en: 'words copied' },
  streakDays: { zh: '连续专注 {n} 天', en: '{n}-day streak' },
  totalWordsLabel: { zh: '累计 {n} 字', en: '{n} total' },
  nextMilestoneLabel: { zh: '🎯 下一里程碑：{n} 字', en: '🎯 Next milestone: {n} words' },
  progressPct: { zh: '进度 {n}%', en: 'Progress {n}%' },
  chapterProgress: { zh: '第 {current}/{total} 章', en: 'Ch. {current}/{total}' },
  copiedPct: { zh: '已抄 {n}%', en: 'Copied {n}%' },
  remainingMinutes: { zh: '还需约 {n} 分钟', en: '~{n} min left' },
  justCopiedSentence: { zh: '🖋️ 刚抄完的句子', en: '🖋️ Just copied' },
  nextChapterQuotePreview: { zh: '📮 下一章引文预告', en: '📮 Next chapter preview' },
  momosBookReview: { zh: '墨墨的书评', en: "Momo's Review" },
  continueText: { zh: '继续 →', en: 'Continue →' },
  completionQuote1: { zh: '每一页抄写都是对知识的致敬。', en: 'Every page copied is a tribute to knowledge.' },
  completionQuote2: { zh: '持之以恒，终有回响。', en: 'Persistence, in time, echoes back.' },
  completionQuote3: { zh: '文字因你的笔触而重生。', en: 'Words are reborn through your hand.' },
  momoReviewGeneric0: { zh: '墨墨觉得作者写到这一段的时候，窗外一定下着雨。', en: 'Momo thinks it must have been raining outside when the author wrote this passage.' },
  momoReviewGeneric1: { zh: '有些句子像被遗忘在旧书页里的珍珠，等着人来发现。', en: 'Some sentences are like pearls forgotten in old pages, waiting to be found.' },
  momoReviewGeneric2: { zh: '读完这一章，墨墨在书架间沉默了很久。好书就是这样，让人不想说话。', en: 'After finishing this chapter, Momo stayed silent among the shelves for a long time. Good books do that—they leave you speechless.' },
  momoReviewGeneric3: { zh: '这一章的节奏真好，像一首渐入佳境的曲子。', en: 'The pacing of this chapter is wonderful, like a melody that keeps getting better.' },
  momoReviewGeneric4: { zh: '墨墨偷偷在这一页角上画了一颗小星星。值得的。', en: 'Momo secretly drew a little star in the corner of this page. It deserved it.' },
  momoReviewGeneric5: { zh: '文字是有温度的——这一章的温度大概是一杯热茶，不烫嘴，刚好。', en: 'Words have a temperature—this chapter feels like a cup of hot tea, warm but not scalding.' },
  momoReviewGeneric6: { zh: '墨墨蹲在横梁上看完了这一章。差点掉下来。', en: 'Momo crouched on a beam to finish this chapter. Almost fell off.' },
  momoReviewGeneric7: { zh: '如果每一本书都是一扇门，这一章就是刚推开时漏出来的那道光。', en: 'If every book is a door, this chapter is the light that slips through the moment you push it open.' },
  momoReviewBook001_0: { zh: '小王子说重要的东西用眼睛是看不见的。墨墨说重要的书用字数也衡量不了。', en: 'The Little Prince says what is essential is invisible to the eye. Momo says important books cannot be measured by word count either.' },
  momoReviewBook001_1: { zh: '玫瑰和小王子的对话让墨墨想起了图书馆刚有第一位访客的时候。', en: 'The conversation between the rose and the Little Prince reminds Momo of when the library had its very first visitor.' },
  momoReviewBook016_0: { zh: '孙悟空被压了五百年才等到唐僧。你抄这一章才用了几十分钟，效率高多了。', en: 'Sun Wukong waited five hundred years for Tang Monk. You copied this chapter in just a few dozen minutes—much more efficient.' },
  momoReviewBook016_1: { zh: '墨墨觉得菩提祖师的教学方法有问题——七十二变和筋斗云是体育课，不是文化课。', en: "Momo thinks the Patriarch Puti's teaching method is questionable—the seventy-two transformations and cloud-somersault are PE classes, not literature." },
  momoReviewBook017_0: { zh: '鲁滨逊一个人在岛上待了二十八年。你有整个图书馆陪着，不算孤独。', en: 'Robinson spent twenty-eight years alone on the island. You have the whole library for company, so you are not lonely.' },
  momoReviewBook017_1: { zh: '星期五出现的时候墨墨差点鼓掌。一个人住太久了，连脚印都是好消息。', en: 'Momo almost applauded when Friday appeared. When you live alone too long, even a footprint is good news.' },
  momoReviewBook023_0: { zh: '多萝西走了那么远的路才发现，回家的能力一直都在自己脚上。', en: 'Dorothy walked so far only to discover that the way home had always been on her own feet.' },
  momoReviewBook023_1: { zh: '铁皮人想要一颗心，稻草人想要脑子，狮子想要勇气。墨墨觉得他们本来就都有。', en: 'The Tin Man wanted a heart, the Scarecrow a brain, the Lion courage. Momo thinks they already had them all along.' },
  momoReviewBook024_0: { zh: '爱丽丝掉进兔子洞的时候一定没想到这会是一本流传百年的书。', en: 'Alice never imagined, falling down the rabbit hole, that this would become a book read for centuries.' },
  momoReviewBook024_1: { zh: '柴郡猫的笑脸让墨墨想起了图书馆里那些会发光的书脊。', en: "The Cheshire Cat's grin reminds Momo of the glowing spines on the library shelves." },
  momoReviewBook027_0: { zh: '三百多首短诗，像三百多只鸟停在窗台上。墨墨数了数，一只都没飞走。', en: 'More than three hundred short poems, like more than three hundred birds perched on a windowsill. Momo counted—none flew away.' },
  momoReviewBook027_1: { zh: '泰戈尔说生如夏花之绚烂，墨墨觉得抄书的人比夏花还安静。', en: 'Tagore says let life be beautiful like summer flowers. Momo thinks those who copy books are even quieter than summer flowers.' },
  momoReviewBook028_0: { zh: '狐狸、乌鸦、乌龟轮番登场。墨墨看完觉得自己也变聪明了一点。', en: 'The fox, the crow, and the turtle take turns on stage. After reading, Momo feels a little cleverer too.' },
  momoReviewBook028_1: { zh: '两千年前的故事到现在还是灵的。人性这东西，比龟兔赛跑的路线还稳定。', en: 'Stories from two thousand years ago still ring true. Human nature is steadier than the route of the hare-and-tortoise race.' },
  momoReviewBook029_0: { zh: '咬得菜根则百事可做。墨墨觉得抄这本书的人，心里一定很安静。', en: 'Those who can chew vegetable roots can do anything. Momo thinks whoever copies this book must have a very quiet heart.' },
  momoReviewBook029_1: { zh: '儒释道三家煮成一锅汤，墨墨喝了一口，觉得人生通透了不少。', en: 'Confucianism, Buddhism, and Daoism simmered into one soup. Momo took a sip and felt life become much clearer.' },

  // ========== 墨墨建议 ==========
  momoSuggestionHide: { zh: '暂时隐藏', en: 'Temporarily hide' },
  momoEncouragement0: { zh: '墨墨在横梁上看着你呢——一切都在慢慢变好。', en: 'Momo is watching from the beam—everything is slowly getting better.' },
  momoEncouragement1: { zh: '今天也是适合抄书的一天。墨墨感觉得到。', en: 'Today is another good day for copying. Momo can feel it.' },
  momoEncouragement2: { zh: '馆长，要不要休息一下？泡杯茶也不错。', en: 'Curator, would you like to take a break? A cup of tea would be nice too.' },
  momoEncouragement3: { zh: '墨墨最喜欢黄昏时分的图书馆，光线正好。', en: 'Momo loves the library at dusk; the light is just right.' },
  momoEncouragement4: { zh: '每一本被抄完的书，都会在书脊上轻轻叹一口气。', en: 'Every completed book lets out a soft sigh along its spine.' },
  momoEncouragement5: { zh: '墨墨数过了——书架上的灰尘又少了一些。', en: 'Momo counted—there is a little less dust on the shelves.' },
  momoEncouragement6: { zh: '有你在，这座图书馆在一点一点活过来。', en: 'With you here, this library is slowly coming back to life.' },
  momoEncouragement7: { zh: '墨墨觉得今天会有好事发生。', en: 'Momo feels something good will happen today.' },
  momoEncouragement8: { zh: '羽毛笔还够用吗？墨墨可以帮你找一支新的。', en: 'Do you still have enough quills? Momo can help you find a new one.' },
  momoEncouragement9: { zh: '夜深了，但缮写室的灯还亮着——墨墨很安心。', en: 'It is late, but the Scriptorium lamp is still on—Momo feels at ease.' },
  momoSuggestionGuideIncomplete: { zh: '馆长，任务清单上还有未完成的事项哦——打开看看？', en: 'Curator, there are still unfinished items on the task list—open it and see?' },
  momoSuggestionAtmoLow: { zh: '图书馆还是太破旧了……多抄几本书，氛围会好起来的！', en: 'The library is still too shabby… Copy a few more books and the atmosphere will improve!' },
  momoSuggestionNoCompleted: { zh: '缮写室里还有书等着被抄完呢——完成第一本书就能上架了。', en: 'There are books in the Scriptorium waiting to be copied—complete the first one to shelve it.' },
  momoSuggestionNoBorrow: { zh: '没有借阅区，访客来了也没地方坐……去商店建造一间吧！', en: 'Without a Reading Area, visitors have nowhere to sit… Go build one in the shop!' },
  momoSuggestionNoVisitors: { zh: '一次专注完成后，会有访客推门进来的——墨墨在横梁上看着呢。', en: 'After a focus session, visitors will push open the door—Momo is watching from the beam.' },
  momoSuggestionNoPlant: { zh: '缮写室窗台上的花盆还空着……要不要去商店买颗种子？', en: 'The flowerpot on the Scriptorium windowsill is still empty… Want to buy a seed in the shop?' },
  momoSuggestionBorrowEmpty: { zh: '有访客在馆里呢！他们可以借书了——大书库里有已完成的书籍就能出借。', en: 'There are visitors in the library! They can borrow books now—completed books in the Hall of Books can be lent out.' },

  // ========== 角色 ==========
  curator: { zh: '馆长', en: 'Curator' },
  momo: { zh: '墨墨', en: 'Momo' },

  // ========== 常驻按钮 ==========
  unlock: { zh: '解锁', en: 'Unlock' },
  upgrade: { zh: '升级', en: 'Upgrade' },
  purchase: { zh: '购买', en: 'Purchase' },
  collect: { zh: '收取', en: 'Collect' },
  build: { zh: '建造', en: 'Build' },
  restore: { zh: '修缮', en: 'Restore' },
  abandon: { zh: '放弃', en: 'Abandon' },
  confirm: { zh: '确定', en: 'Confirm' },
  cancel: { zh: '取消', en: 'Cancel' },
  close: { zh: '关闭', en: 'Close' },

  // ========== 商店 ==========
  libraryUpgrade: { zh: '图书馆升级', en: 'Library Upgrades' },
  newBooksInStock: { zh: '新书上架', en: 'New Books' },
  limitedTimeOffer: { zh: '限时特惠', en: 'Limited Offer' },
  ambientSounds: { zh: '环境音', en: 'Ambient Sounds' },
  ambientDescription: { zh: '专注时播放的白噪音与氛围音，可与背景音乐同时开启。', en: 'White noise and ambience for focus; can play alongside BGM.' },
  decoration: { zh: '馆内装潢', en: 'Decor' },
  maxLevel: { zh: '已满级', en: 'Max Level' },
  notBuilt: { zh: '未建造', en: 'Not Built' },
  locked: { zh: '未解锁', en: 'Locked' },
  unlocked: { zh: '已解锁', en: 'Unlocked' },
  owned: { zh: '已拥有', en: 'Owned' },
  availableToBuild: { zh: '可建造', en: 'Can Build' },
  conditionsNotMet: { zh: '条件不足', en: 'Requirements not met' },
  requirements: { zh: '需要：氛围 ≥{atmo} · 拥有 ≥{books} 本书', en: 'Requires: Atmosphere ≥{atmo} · ≥{books} books' },
  openPortal: { zh: '开启传送门', en: 'Open Portal' },
  inPlanning: { zh: '规划中…', en: 'Coming soon…' },
  newBooksRestocking: { zh: '新书上架中…', en: 'Restocking…' },
  free: { zh: '免费', en: 'Free' },
  confirmPurchase: { zh: '确认购买', en: 'Confirm Purchase' },
  purchaseFailed: { zh: '购买失败，请稍后再试。', en: 'Purchase failed. Please try again later.' },
  youAlreadyOwnThisBook: { zh: '你已经拥有这本书了！', en: 'You already own this book!' },
  manuscriptBoxFull: { zh: '手稿箱已满', en: 'Manuscript Box full' },
  expandManuscriptBoxFirst: { zh: '请先扩容手稿箱再购买。', en: 'Please expand your Manuscript Box first.' },
  slots: { zh: '格', en: 'slots' },
  insufficientCoins: { zh: '智慧之光不足', en: 'Not enough Wisdom Light' },
  insufficientCoinsExclamation: { zh: '智慧之光不足！', en: 'Not enough Wisdom Light!' },
  purchaseNeedsCoins: { zh: '需要 {actual} 💡（原价 {price}，折扣后）', en: 'Need {actual} 💡 (discounted from {price})' },
  discountLabel: { zh: '{value}折', en: '{value}% off' },
  starterRecommended: { zh: '🌱 新手推荐', en: '🌱 Starter Pick' },
  recommendedBy: { zh: '📚 {name}推荐 · {value}折', en: '📚 {name} Pick · {value}% off' },
  recommendedPrice: { zh: '原价 💰{original} → {name}价 💰{price}', en: 'Was 💰{original} · {name} price 💰{price}' },
  countdownRestocking: { zh: '补货中 {time}', en: 'Restocking {time}' },
  libraryNaming: { zh: '为图书馆命名', en: 'Name Your Library' },
  blankNamePlaque: { zh: '空白铭牌', en: 'Blank Plaque' },
  nameTheLibrary: { zh: '为这座图书馆赋予真正的名字', en: 'Give this library its true name' },
  maybeLater: { zh: '再说吧', en: 'Maybe Later' },
  inscribeThisName: { zh: '铭刻此名', en: 'Inscribe This Name' },
  nameTooLong: { zh: '名称过长，请精简到12字以内', en: 'Name too long. Please keep it under 12 characters.' },
  maxNCharacters: { zh: '最多{n}个字', en: 'Max {n} characters' },
  charsRemaining: { zh: '最多{n}字', en: '{n} left' },
  charsOver: { zh: '已超出 {n} 字', en: '{n} characters over' },
  restorationRoom: { zh: '古籍修复室', en: 'Restoration Room' },
  borrowAreaStatsNotBuilt: { zh: '在馆1人 · 购买升级以容纳更多访客', en: 'Capacity 1 · Upgrade to host more visitors' },
  borrowAreaStats: { zh: '在馆{cap}人 · 还书+{returnCoins}💰 · 好感+{favorBonus}% · 氛围+{returnAtmo}', en: 'Capacity {cap} · Return +{returnCoins} 💰 · Favor +{favorBonus}% · Atmosphere +{returnAtmo}' },
  focusRoomStatsNotBuilt: { zh: '残破的缮写室，修缮可提升誊抄速度', en: 'A ruined scriptorium; restore it to boost copy speed' },
  focusRoomStats: { zh: '誊抄速度 +{value}%', en: 'Transcribe speed +{value}%' },
  restorationRoomStatsNotBuilt: { zh: '残破的修复室堆满灰尘，修缮后可修复损毁珍本、合成典藏版', en: 'A dusty ruined room; restore it to repair damaged books and craft collector editions' },
  restorationRoomStatsUnlockedLevel0: { zh: '已可修复损毁书籍，升级提升修复速度', en: 'Can now repair damaged books; upgrade to boost repair speed' },
  restorationRoomStats: { zh: '修复速度 +{value}%', en: 'Repair speed +{value}%' },
  ambientOwnedHint: { zh: '已解锁 · 可在音乐选择器中切换', en: 'Unlocked · switch in the music selector' },
  ambientLockedHint: { zh: '解锁后可在专注时播放', en: 'Unlock to play during focus' },
  ambientOwnedLabel: { zh: '已拥有 ✓', en: 'Owned ✓' },

  // ========== 音乐 / 环境音选择器 ==========
  music: { zh: '音乐', en: 'Music' },
  backgroundMusic: { zh: '背景音乐', en: 'Background Music' },
  musicAndAmbient: { zh: '音乐与环境音', en: 'Music & Ambient' },
  musicAutoMode: { zh: '随氛围自动', en: 'Auto by Atmosphere' },
  nowPlaying: { zh: '正在播放', en: 'Now Playing' },
  clickToPlay: { zh: '点击播放', en: 'Click to Play' },
  playing: { zh: '播放中', en: 'Playing' },
  enabled: { zh: '已开启', en: 'On' },
  disabled: { zh: '已关闭', en: 'Off' },
  unlockForCoins: { zh: '💰{price} 解锁', en: '💰{price} Unlock' },
  unlockAtNextStage: { zh: '氛围达到下一阶段解锁', en: 'Unlock at next atmosphere stage' },
  ambientName_victorian_study: { zh: '维多利亚书房', en: 'Victorian Study' },
  musicVolume: { zh: '音乐音量', en: 'Music Volume' },
  ambientVolume: { zh: '环境音音量', en: 'Ambient Volume' },
  sfxVolume: { zh: '音效音量', en: 'SFX Volume' },
  musicTrack_theme: { zh: '图书馆主题曲', en: 'Library Theme' },
  musicTrack_ruin_a: { zh: '荒废图书馆', en: 'Ruined Library' },
  musicTrack_ruin_b: { zh: '荒废·长夜变奏', en: 'Ruined Library · Long Night Variation' },
  musicTrack_cozy_a: { zh: '城镇漫步', en: 'Town Stroll' },
  musicTrack_cozy_b: { zh: '城镇·午后变奏', en: 'Town · Afternoon Variation' },
  musicTrack_star_a: { zh: '星辰图书馆', en: 'Starlight Library' },
  musicTrack_star_b: { zh: '星辰·圣堂咏叹', en: 'Starlight · Sanctum Hymn' },

  plantGrowLevels: { zh: '🌱 Lv1~5 成长', en: '🌱 Lv 1–5 Growth' },
  waterAndFertilize: { zh: '浇水+施肥培育', en: 'Water and fertilize to grow' },
  growthProgress: { zh: '成长进度 {value}%', en: 'Growth {value}%' },
  waterAvailableCount: { zh: '💧浇水 {n}次可用', en: '💧 Water available {n}×' },
  harvest: { zh: '🌾 收获', en: '🌾 Harvest' },
  water: { zh: '💧 浇水', en: '💧 Water' },
  fertilize: { zh: '🧪 施肥', en: '🧪 Fertilize' },
  waterGrowth: { zh: '(+{value}进度)', en: '(+{value} growth)' },
  fertilizeCost: { zh: '(+{value}进度 · 💰{cost})', en: '(+{value} growth · 💰{cost})' },
  canHarvestHint: { zh: '✨ 可以收获了！将获得氛围 + 智慧之光，概率掉落种子', en: '✨ Ready to harvest! Gain Atmosphere + Wisdom Light; chance for seeds' },
  nextLevelFertilizerCost: { zh: '下一级施肥花费 💰{cost}', en: 'Next level fertilizer costs 💰{cost}' },
  maxLevelHarvestHint: { zh: '已满级，成长满后可收获', en: 'Max level; harvest when growth is full' },
  plantMatured: { zh: '植物成熟了', en: 'Plant Matured' },
  plantMaturedHint: { zh: '{name} 已到达 Lv.5，可以收获了！', en: '{name} has reached Lv.5 and can be harvested!' },
  plantHarvested: { zh: '收获成功', en: 'Harvested' },
  seedObtained: { zh: '额外获得 {name} 种子 ×1', en: 'Extra {name} seed ×1 obtained' },
  plantHarvestEmptyPot: { zh: '花盆已空，可以种植新的植物了。', en: 'The pot is empty and ready for a new plant.' },
  continueBtn: { zh: '继续 →', en: 'Continue →' },
  hungOnPage: { zh: '📌 挂在{page}页面', en: '📌 Hung on {page}' },
  chapterCount: { zh: '{n}章', en: '{n} chapters' },

  // ========== 馆长办公室 / 指南 ==========
  curatorOfficeGuide: { zh: '🏛️ 馆长办公室指南', en: "🏛️ Curator's Office Guide" },
  guideOverviewDesc: { zh: '概况 — 图书馆数据总览、氛围进度条、修改馆名', en: 'Overview — library stats, atmosphere progress, rename your library' },
  guideAchievementsDesc: { zh: '成就柜 — 查看已解锁成就和未达成条件', en: 'Achievements — view unlocked and pending achievements' },
  guideCollectionDesc: { zh: '收藏室 — 浏览收集品进度', en: 'Collection — browse collection progress' },
  guideDecorationDesc: { zh: '布置 — 植物盆栽、种子库存、标志牌', en: 'Decor — plants, seeds, signboards' },
  guideGuideDesc: { zh: '馆长手册 — 你正在看这里', en: "Curator's Guide — you are reading it" },
  coreLoopDesc: { zh: '🖋️ 专注誊抄 → 💰 赚智慧之光 → 🏛️ 升级设施 → 👥 吸引访客 → 📚 解锁更多书籍', en: '🖋️ Focus copy → 💰 Earn Wisdom Light → 🏛️ Upgrade facilities → 👥 Attract visitors → 📚 Unlock more books' },
  coreLoopDetail: { zh: '这是图书馆复苏的核心循环，一切操作都围绕它展开。', en: "This is the core loop of the library's revival; everything revolves around it." },
  faq: { zh: '❓ 常见问题', en: '❓ FAQ' },
  faqQ1: { zh: 'Q: 忘了收归还的书怎么办？', en: 'Q: What if I forget to collect a returned book?' },
  faqA1: { zh: '不会有损失。访客会一直等待，直到你去收取。', en: 'No loss. Visitors will keep waiting until you collect it.' },
  faqQ2: { zh: 'Q: 氛围怎么涨？', en: 'Q: How do I raise Atmosphere?' },
  faqA2: { zh: '完成书籍、访客还书、里程碑和成就奖励都会提升氛围。', en: 'Completing books, visitor returns, milestones, and achievement rewards all raise Atmosphere.' },
  faqQ3: { zh: 'Q: 智慧之光怎么赚？', en: 'Q: How do I earn Wisdom Light?' },
  faqA3: { zh: '专注结算（每分钟 0.8）、访客还书、成就奖励、连续 7 天专注奖励。', en: 'Focus settlement (0.8 per minute), visitor returns, achievement rewards, and a 7-day streak bonus.' },
  faqQ4: { zh: 'Q: 如何修改图书馆名字？', en: 'Q: How do I rename the library?' },
  faqA4: { zh: '馆长办公室 → 概况页，点击馆名即可修改。', en: "Curator's Office → Overview, tap the library name to edit." },
  faqQ5: { zh: 'Q: 存档在哪里？', en: 'Q: Where is my save?' },
  faqA5: { zh: '保存在浏览器的 localStorage 中，清除浏览器数据会导致存档丢失。', en: 'Saved in browser localStorage; clearing browser data will erase it.' },
  faqQ6: { zh: 'Q: 怎么关背景音乐？', en: 'Q: How do I turn off the BGM?' },
  faqA6: { zh: '点击顶部导航栏右侧的 🔈 按钮即可。', en: 'Tap the 🔈 button on the right side of the top navigation bar.' },

  decorationPageLoadFailed: { zh: '布置页面加载失败', en: 'Decor page failed to load' },
  collectionLoadFailed: { zh: '收藏室加载失败', en: 'Collection failed to load' },

  // ========== 收藏室 ==========
  collectionLoading: { zh: '收集系统加载中…', en: 'Collection system loading…' },
  collectionEmpty: { zh: '暂无收集数据', en: 'No collection data yet' },
  collectionCategoryBooks: { zh: '书籍收集', en: 'Book Collection' },
  collectionCategoryMilestones: { zh: '图书馆里程碑', en: 'Library Milestones' },
  collectionCategoryPlaneArchive: { zh: '位面档案', en: 'Plane Archive' },
  collectionCategoryFutureRelease: { zh: '该收集品类将在后续版本中开放。', en: 'This collection category will open in a future update.' },
  collectionInPlanning: { zh: '规划中', en: 'In Planning' },
  portalOpened: { zh: '传送门已开启', en: 'Portal Opened' },
  collectionBooksOwned: { zh: '已入库 {n} 本', en: '{n} books archived' },
  collectionBooksShelved: { zh: '已上架 {n} 本', en: '{n} books shelved' },
  collectionPlanesOpened: { zh: '{current}/{total} 已开启', en: '{current}/{total} opened' },
  collectionNewPortalHint: { zh: '新的传送门尚未开启…', en: 'No new portal has opened yet…' },
  collectionMilestoneAtmosphere: { zh: '氛围阶段', en: 'Atmosphere Stage' },
  collectionMilestoneShelfCount: { zh: '书架数量', en: 'Bookshelves' },
  collectionMilestoneBorrowLevel: { zh: '借阅区等级', en: 'Reading Area Level' },
  collectionMilestoneFocusDays: { zh: '累计专注天数', en: 'Total Focus Days' },
  collectionMilestoneVisitors: { zh: '访客接待数', en: 'Visitors Hosted' },
  collectionShelfCountValue: { zh: '{n} 个', en: '{n} shelves' },
  levelShort: { zh: 'Lv.{n}', en: 'Lv.{n}' },
  daysCount: { zh: '{n} 天', en: '{n} days' },
  peopleCount: { zh: '{n} 人', en: '{n} people' },
  planeName_astral: { zh: '星界·归墟', en: 'Astral · Gui Xu' },
  planeName_pastoral: { zh: '田园瘟疫纪事', en: 'Pastoral Plague Chronicles' },
  planeName_placeholder: { zh: '？？？', en: '???' },

  // ========== 古籍修复室 / 卷组 ==========
  restorationRoomLocked: { zh: '古籍修复室尚未开放', en: 'Restoration Room not yet open' },
  restorationRoomLockedDesc: { zh: '残破的修复室堆满灰尘，需要先修缮才能使用。', en: 'The ruined restoration room is covered in dust; restore it before use.' },
  gotoShopUnlock: { zh: '前往位面商店解锁 💰{price}', en: 'Go to Plane Shop to unlock 💰{price}' },
  restorationRoomLevelTitle: { zh: '古籍修复室 Lv.{level}', en: 'Restoration Room Lv.{level}' },
  restorationRepairSpeedDesc: { zh: '修复时额外速度 +{bonus}%（Lv0 解锁修复功能，升级后每级 +5%）', en: 'Extra repair speed +{bonus}% (repair unlocks at Lv0, +5% per level after upgrade)' },
  volumeGroupsTitle: { zh: '📜 长书卷组', en: '📜 Long-Book Volume Groups' },
  volumesCopied: { zh: '{current}/{total} 卷已抄完', en: '{current}/{total} volumes copied' },
  craftCollectorEdition: { zh: '合成典藏版', en: 'Craft Collector Edition' },
  restorationBoxTitle: { zh: '🧰 修缮箱', en: '🧰 Restoration Box' },
  restorationBoxDesc: { zh: '锁入修缮箱的单卷不会被访客借出、不会损坏，仍可参与合成典藏版。', en: 'Volumes stored in the box cannot be borrowed or damaged, and still count toward crafting collector editions.' },
  restorationBoxEmpty: { zh: '修缮箱为空。', en: 'The restoration box is empty.' },
  expandSlotsTo: { zh: '+ 扩容至 {n} 格', en: '+ Expand to {n} slots' },
  protectableVolumes: { zh: '🔒 可保护的单卷', en: '🔒 Protectable Volumes' },
  noProtectableVolumes: { zh: '没有可锁入的单卷。', en: 'No volumes can be stored.' },
  storeInRestorationBoxLabel: { zh: '锁入修缮箱', en: 'Store in Box' },
  takeOut: { zh: '取出', en: 'Take Out' },
  restorationBoxFullOrInvalid: { zh: '修缮箱已满或该卷无法锁入', en: 'Restoration box full or volume cannot be stored' },
  notObtained: { zh: '未获得', en: 'Not obtained' },
  damagedPendingRepair: { zh: '损坏待修', en: 'Damaged, awaiting repair' },
  onLoan: { zh: '外借中', en: 'On loan' },
  copiedCompleted: { zh: '已抄完', en: 'Copied' },

  // Volume group titles
  volumeGroupTitle_book_007: { zh: '本草纲目·草部', en: 'Compendium of Materia Medica · Herbs' },
  volumeGroupTitle_book_008: { zh: '物种起源', en: 'On the Origin of Species' },
  volumeGroupTitle_book_009: { zh: '红楼梦', en: 'Dream of the Red Chamber' },
  volumeGroupTitle_book_014: { zh: '史记', en: 'Records of the Grand Historian' },
  volumeGroupTitle_book_016: { zh: '西游记', en: 'Journey to the West' },
  volumeGroupTitle_book_018: { zh: '几何原本', en: 'Elements' },
  volumeGroupTitle_book_019: { zh: '卡拉马佐夫兄弟', en: 'The Brothers Karamazov' },

  // ========== 墨墨日志 ==========
  diaryMaster: { zh: '主人', en: 'Master' },
  library: { zh: '图书馆', en: 'library' },
  diaryDateFormat: { zh: '{year}年{month}月{day}日', en: '{month}/{day}/{year}' },
  diaryWeatherOptions: {
    zh: '窗外下着小雨。|阳光从高窗斜照进来。|风轻轻吹动着窗帘。|天气有点凉，但馆里很暖和。|今天的天空是淡金色的。|空气里有旧书页和墨水的气味。|午后阳光正好。|黄昏的光线很美。',
    en: "A light rain falls outside the window.|Sunlight slants in through the high window.|A gentle breeze stirs the curtains.|The air is cool, but the library is warm.|Today's sky is pale gold.|The air smells of old pages and ink.|The afternoon light is perfect.|The evening light is beautiful."
  },
  diaryLogHeader: { zh: '📜 {momo}的日志 · 第{page}页', en: "📜 {momo}'s Diary · Page {page}" },
  diary_opening_focus_complete_0: { zh: '今天{master}专注抄写了《{title}》，整整{minutes}分钟。', en: 'Today {master} focused on copying “{title}” for {minutes} minutes.' },
  diary_opening_focus_complete_1: { zh: '缮写室的灯亮了起来，{master}安静地坐了{minutes}分钟。', en: 'The Scriptorium lamp lit up, and {master} sat quietly for {minutes} minutes.' },
  diary_opening_focus_complete_2: { zh: '{momo}在一旁看着，{master}的羽毛笔在《{title}》上沙沙响了{minutes}分钟。', en: '{momo} watched from the side as {master}’s quill rustled over “{title}” for {minutes} minutes.' },
  diary_opening_focus_complete_3: { zh: '傍晚时分，{master}翻开《{title}》，专注了{minutes}分钟。', en: 'At dusk, {master} opened “{title}” and focused for {minutes} minutes.' },
  diary_opening_focus_complete_4: { zh: '窗外有风声，但{master}专注在《{title}》上，{minutes}分钟一动没动。', en: 'Wind whispered outside, but {master} stayed focused on “{title}”, motionless for {minutes} minutes.' },
  diary_opening_focus_abandon_0: { zh: '{master}写到一半被叫走了，{momo}把半干的书页小心收好了。', en: '{master} was called away halfway through; {momo} carefully put away the half-dry pages.' },
  diary_opening_focus_abandon_1: { zh: '今天专注了{minutes}分钟就被打断了，不过没关系，{momo}等你回来。', en: "Today's focus was interrupted after {minutes} minutes, but that's all right—{momo} is waiting for your return." },
  diary_opening_focus_abandon_2: { zh: '羽毛笔还蘸着墨，{master}匆匆离开了。{momo}把笔洗干净放好了。', en: 'The quill was still inked when {master} left in a hurry. {momo} cleaned it and put it away.' },
  diary_opening_visitor_arrive_0: { zh: '{emoji}{name}今天推门进来了，{title}。', en: '{emoji}{name} pushed open the door today; {title}.' },
  diary_opening_visitor_arrive_1: { zh: '门上铃铛响了——{emoji}{name}来了。{title}。', en: 'The doorbell rang—{emoji}{name} has arrived. {title}.' },
  diary_opening_visitor_arrive_2: { zh: '一阵脚步声，{emoji}{name}轻手轻脚地走进了{library}。', en: 'A footfall—{emoji}{name} tiptoed into the {library}.' },
  diary_opening_visitor_borrow_0: { zh: '{emoji}{name}在书架前站了好久，最后借走了《{bookTitle}》。', en: '{emoji}{name} stood before the shelves for a long time, then borrowed “{bookTitle}”.' },
  diary_opening_visitor_borrow_1: { zh: '{momo}看着{emoji}{name}小心翼翼地把《{bookTitle}》装进包里。', en: '{momo} watched as {emoji}{name} carefully tucked “{bookTitle}” into their bag.' },
  diary_opening_visitor_borrow_2: { zh: '“{bookTitle}”——{emoji}{name}说这本书正是他们一直在找的。', en: '“{bookTitle}”—{emoji}{name} said this was the book they had been searching for.' },
  diary_opening_visitor_return_0: { zh: '{emoji}{name}来还书了，《{bookTitle}》被保护得很好。', en: '{emoji}{name} returned a book. “{bookTitle}” was well kept.' },
  diary_opening_visitor_return_1: { zh: '《{bookTitle}》回来了，{emoji}{name}还附了一张便签。', en: '“{bookTitle}” is back, with a note from {emoji}{name}.' },
  diary_opening_visitor_return_2: { zh: '{emoji}{name}把《{bookTitle}》轻轻放回柜台，说了声谢谢。', en: '{emoji}{name} gently placed “{bookTitle}” on the counter and said thank you.' },
  diary_opening_book_complete_0: { zh: '最后一页抄完，《{title}》的书脊上浮现出金色的书名。{momo}歪着头看了好一会儿。', en: 'The last page copied, the golden title of “{title}” appeared on its spine. {momo} tilted their head and gazed for a long while.' },
  diary_opening_book_complete_1: { zh: '当{master}落下最后一笔，《{title}》发出了一阵柔和的微光——这是它被遗忘后第一次被人完整记住。', en: 'As {master} set down the last stroke, “{title}” gave off a soft glow—the first time it had been fully remembered since it was forgotten.' },
  diary_opening_book_complete_2: { zh: '{momo}鼓起掌来——《{title}》完整地立在书架上了！一只猫头鹰的掌声很轻，但很认真。', en: '{momo} clapped—“{title}” now stands complete on the shelf! An owl’s applause is faint, but earnest.' },
  diary_opening_book_complete_3: { zh: '{master}第二遍抄完《{title}》，书页间的墨迹比第一遍更深了。{momo}觉得这本书正在从沉睡里醒来。', en: 'The second copy of “{title}” finished; the ink between the pages runs deeper than the first. {momo} feels the book waking from its slumber.' },
  diary_opening_book_complete_4: { zh: '《{title}》的第二次誊抄完成了。这次的字迹比上次更稳——{momo}偷偷对比过了。', en: 'The second transcription of “{title}” is complete. This handwriting is steadier than last time—{momo} secretly compared them.' },
  diary_opening_book_complete_5: { zh: '第三遍《{title}》抄完的时候，书页自动翻到了扉页——像在和{master}打招呼。{momo}从横梁上飞下来看了一眼。', en: 'When the third copy of “{title}” was done, the pages turned to the title page on their own—as if greeting {master}. {momo} flew down from the beam for a look.' },
  diary_opening_book_complete_6: { zh: '当{master}合上《{title}》的第三遍誊抄，书脊上的金色不再是浮现——是停留。它已经不只是一本书了。', en: 'As {master} closed the third copy of “{title}”, the gold on its spine no longer flickered into being—it stayed. It is more than a book now.' },
  diary_opening_book_complete_7: { zh: '第四遍《{title}》。{momo}不再鼓掌了——它在书旁边蹲下来，用翅膀尖碰了碰书脊。这本书已经是{library}的一部分了。', en: 'The fourth copy of “{title}”. {momo} no longer clapped—{momo} crouched beside the book and brushed its spine with a wingtip. This book is now part of the {library}.' },
  diary_opening_book_complete_8: { zh: '{master}第四遍打开《{title}》的最后一页时，{momo}已经在旁边等着了。它说这本书“闻起来像家了”。', en: 'When {master} opened the last page of the fourth copy of “{title}”, {momo} was already waiting nearby. {momo} said the book “smells like home.”' },
  diary_opening_book_complete_9: { zh: '第五遍《{title}》誊抄完成。书自己在缮写室里发出了一声叹息——不是累，是满足。{momo}说这就是书的“够了”。', en: 'The fifth copy of “{title}” is complete. The book itself let out a sigh in the Scriptorium—not tired, but content. {momo} says this is a book’s “enough.”' },
  diary_opening_book_complete_10: { zh: '最后一笔落下时，整座{library}的蜡烛都跳了一下。《{title}》的书脊上浮现的不是金色书名——是一道很细很轻的、像呼吸一样的纹路。{momo}在日志上写：今日，一本书活了过来。', en: 'As the last stroke fell, every candle in the {library} flickered. What appeared on the spine of “{title}” was not a golden title, but a thin, gentle vein like a breath. {momo} wrote in the diary: Today, a book came alive.' },
  diary_opening_milestone_0: { zh: '书架修复度又前进了一大步。{momo}偷偷在{master}的桌上放了一颗糖。', en: 'The shelf restoration took another great step forward. {momo} secretly left a candy on {master}’s desk.' },
  diary_opening_milestone_1: { zh: '今天是个值得记录的日子——累计誊抄突破了{words}字。', en: 'Today is worth recording—total copied words have passed {words}.' },
  diary_opening_milestone_2: { zh: '看着越来越多的书重新苏醒，{momo}想起很久以前这里曾经的样子。', en: 'Watching more and more books awaken, {momo} remembers what this place was like long ago.' },
  diary_opening_special_event_0: { zh: '今天发生了一件特别的事：{detail}', en: 'Something special happened today: {detail}' },
  diary_opening_special_event_1: { zh: '{momo}赶紧记下来——{detail}', en: '{momo} hurried to write it down—{detail}' },
  diary_opening_special_event_2: { zh: '值得记一笔：{detail}', en: 'Worth noting: {detail}' },
  diary_middle_focus_0: { zh: '连茶凉了都没注意。', en: 'Even the tea going cold went unnoticed.' },
  diary_middle_focus_1: { zh: '羽毛笔写秃了两根。', en: 'Two quills were worn down to stubs.' },
  diary_middle_focus_2: { zh: '窗外有只猫盯着看了好一会。', en: 'A cat outside stared for quite a while.' },
  diary_middle_focus_3: { zh: '壁炉里的火焰安安静静地跳动着。', en: 'The fireplace flames danced quietly.' },
  diary_middle_focus_4: { zh: '月光从破洞的屋顶洒下来，正好照在书页上。', en: 'Moonlight poured through the hole in the roof, landing right on the page.' },
  diary_middle_focus_5: { zh: '{momo}踮着脚尖在书架间巡视了一圈。', en: '{momo} tiptoed between the shelves on a patrol.' },
  diary_middle_focus_6: { zh: '时间过得很慢，又好像很快。', en: 'Time passed slowly, yet also quickly.' },
  diary_middle_visitor_0: { zh: '他们在角落里找了个位置，安安静静地看了起来。', en: 'They found a corner seat and read quietly.' },
  diary_middle_visitor_1: { zh: '临走前，他们回头看了书架一眼才离开。', en: 'Before leaving, they glanced back at the shelves.' },
  diary_middle_visitor_2: { zh: '{momo}给他们端了一杯看不见的茶。', en: '{momo} served them an invisible cup of tea.' },
  diary_middle_visitor_3: { zh: '他们和{momo}聊了几句，说这里让他们感觉很安心。', en: 'They chatted with {momo} for a moment, saying this place put them at ease.' },
  diary_middle_general_0: { zh: '一切都在慢慢变好。', en: 'Everything is slowly getting better.' },
  diary_middle_general_1: { zh: '藏书又多了起来。', en: 'The collection has grown again.' },
  diary_middle_general_2: { zh: '{momo}感到这座{library}正在呼吸。', en: '{momo} feels the {library} breathing.' },
  diary_daily_opening_0: { zh: '{momo}翻开日志，补记了昨天的馆内活动：', en: "{momo} opened the diary and added yesterday's library activities:" },
  diary_daily_opening_1: { zh: '{momo}在烛光下回顾了昨天：', en: '{momo} looked back on yesterday by candlelight:' },
  diary_daily_opening_2: { zh: '昨天{library}里发生了这些事，{momo}记下来了：', en: 'These things happened in the {library} yesterday; {momo} wrote them down:' },
  diary_daily_opening_3: { zh: '{momo}整理了一下昨天的记录：', en: "{momo} organized yesterday's records:" },
  diary_ending_0: { zh: '{momo}写于{library}打烊后。', en: '{momo} wrote this after the {library} closed.' },
  diary_ending_1: { zh: '{momo}合上日志，满意地拍了拍封面。', en: '{momo} closed the diary and patted the cover contentedly.' },
  diary_ending_2: { zh: '{momo}把日志放回抽屉，明天再来写。', en: '{momo} put the diary back in the drawer; tomorrow, more pages await.' },
  diary_ending_3: { zh: '夜深了，{momo}最后检查了一遍书架才离开。', en: 'Late at night, {momo} made a final round of the shelves before leaving.' },
  diary_ending_4: { zh: '{momo}觉得今天是很好的一天。', en: '{momo} thinks today was a very good day.' },
  diary_ending_5: { zh: '{momo}偷偷在日志角上画了一颗小星星。', en: '{momo} secretly drew a little star in the corner of the page.' },
  diarySummaryFocusBase: { zh: '{master}专注了{count}次，一共{minutes}分钟', en: '{master} focused {count} times, for a total of {minutes} minutes' },
  diarySummaryFocusWords: { zh: '，誊抄了{words}字', en: ', copying {words} words' },
  diaryPeriod: { zh: '。', en: '.' },
  diarySummaryBookComplete: { zh: '✨ 《{title}》完成了誊抄，书脊上浮现出金色的书名。', en: '✨ “{title}” has been copied; its golden title now appears on the spine.' },
  diaryLevelSpeech2: { zh: '{momo}的日志有了个像样的封面！虽然还是布面的，但已经很不错了~', en: "{momo}'s diary now has a proper cover! It's still clothbound, but already quite nice~" },
  diaryLevelSpeech3: { zh: '皮面精装！{momo}可以挺起胸脯说：这是一本真正的日志了。', en: '{momo} can finally say with pride: this is a real diary.' },
  diaryLevelSpeech4: { zh: '魔法装帧……连{momo}都没想到能到这一步。谢谢你，{curator}。', en: "Enchanted binding… even {momo} never thought we'd get this far. Thank you, {curator}." },

  // ========== 占位功能 ==========
  coffeeCorner: { zh: '咖啡角', en: 'Coffee Corner' },
  coffeeCornerDesc: { zh: '延长访客停留时间', en: 'Extend visitor stay time' },
  researchArea: { zh: '研究区', en: 'Research Area' },
  researchAreaDesc: { zh: '深度研究书籍获得加成', en: 'Gain bonuses from deep book study' },
  planeVisiting: { zh: '位面串门', en: 'Plane Hopping' },
  planeVisitingDesc: { zh: '参观其他馆长的图书馆', en: 'Visit other curators’ libraries' },
  bookDrift: { zh: '书籍漂流', en: 'Book Drift' },
  bookDriftDesc: { zh: '将誊抄的书复印赠予友人', en: 'Gift copied books to friends' },
  jointRestoration: { zh: '联合修复', en: 'Joint Restoration' },
  jointRestorationDesc: { zh: '全服馆长协力解锁限定书籍', en: 'Cooperate server-wide to unlock limited books' },
});

// ========== 语言切换 ==========

export function getLocale() {
  const locale = getSettings().locale;
  if (locale === 'en' || locale === 'zh') return locale;
  return 'zh';
}

export function setLocale(locale) {
  const normalized = locale === 'en' ? 'en' : 'zh';
  setSetting('locale', normalized);
}

export function t(key) {
  const term = TERM_DATA[key];
  if (!term) {
    // 开发期提示，方便补漏
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(`[i18n] missing term: ${key}`);
    }
    return key;
  }
  return getLocale() === 'en' ? term.en : term.zh;
}

// ========== 兼容旧用法：T.xxx 始终返回中文 ==========
export const T = Object.freeze(
  Object.fromEntries(Object.entries(TERM_DATA).map(([k, v]) => [k, v.zh]))
);

// ========== 英文常量表（备用） ==========
export const EN = Object.freeze(
  Object.fromEntries(Object.entries(TERM_DATA).map(([k, v]) => [k, v.en]))
);

// ========== 氛围阶段名 ==========
export const ATMOSPHERE_STAGES = Object.freeze([
  '',
  { zh: '废墟', en: 'Ruins' },
  { zh: '破败', en: 'Dilapidated' },
  { zh: '陈旧', en: 'Weathered' },
  { zh: '温暖', en: 'Warm' },
  { zh: '星辰', en: 'Starlight' },
]);

export function getAtmosphereStageName(level) {
  const entry = ATMOSPHERE_STAGES[level];
  if (!entry) return '';
  return typeof entry === 'string' ? entry : (getLocale() === 'en' ? entry.en : entry.zh);
}

// ========== 缮写室等级名 ==========
export const FOCUS_ROOM_LEVELS = Object.freeze([
  '',
  { zh: '残破', en: 'Ruined' },
  { zh: '陋室', en: 'Humble' },
  { zh: '整洁', en: 'Tidy' },
  { zh: '明亮', en: 'Bright' },
  { zh: '静雅', en: 'Serene' },
  { zh: '华美', en: 'Splendid' },
  { zh: '缮写圣堂', en: 'Scriptorium Sanctuary' },
]);

export function getFocusRoomLevelName(level) {
  const entry = FOCUS_ROOM_LEVELS[level];
  if (!entry) return '';
  return typeof entry === 'string' ? entry : (getLocale() === 'en' ? entry.en : entry.zh);
}

// ========== 访客角色名 ==========
export const VISITOR_NAMES = Object.freeze({
  shenmingyuan: { zh: '沈明远', en: 'Shen Mingyuan' },
  chengyuan: { zh: '程远', en: 'Cheng Yuan' },
  peizhou: { zh: '裴舟', en: 'Pei Zhou' },
  jianan: { zh: '简安', en: 'Jian An' },
  jiangyoushu: { zh: '江有树', en: 'Jiang Youshu' },
  guyu: { zh: '谷雨', en: 'Gu Yu' },
  qiaoyiyi: { zh: '乔一一', en: 'Qiao Yiyi' },
  xierugui: { zh: '谢如归', en: 'Xie Rugui' },
  xiachan: { zh: '夏蝉', en: 'Xia Chan' },
  wangxiaolei: { zh: '王小磊', en: 'Wang Xiaolei' },
});

export function getVisitorName(id) {
  const entry = VISITOR_NAMES[id];
  if (!entry) return id;
  return getLocale() === 'en' ? entry.en : entry.zh;
}

// ========== 成就分类 ==========
export const ACHIEVEMENT_CATEGORIES = Object.freeze([
  { zh: '修复启蒙', en: 'Restoration' },
  { zh: '智慧之光', en: 'Wisdom' },
  { zh: '书籍收集', en: 'Collection' },
  { zh: '图书馆重建', en: 'Reconstruction' },
  { zh: '访客', en: 'Visitors' },
  { zh: '彩蛋', en: 'Secrets' },
]);

export function getAchievementCategory(index) {
  const entry = ACHIEVEMENT_CATEGORIES[index];
  if (!entry) return '';
  return typeof entry === 'string' ? entry : (getLocale() === 'en' ? entry.en : entry.zh);
}

// ========== 成就稀有度 ==========
export const ACHIEVEMENT_RARITIES = Object.freeze([
  { zh: '青铜', en: 'Bronze' },
  { zh: '白银', en: 'Silver' },
  { zh: '黄金', en: 'Gold' },
  { zh: '铂金', en: 'Platinum' },
]);

export function getAchievementRarity(index) {
  const entry = ACHIEVEMENT_RARITIES[index];
  if (!entry) return '';
  return typeof entry === 'string' ? entry : (getLocale() === 'en' ? entry.en : entry.zh);
}

// ========== 日志装帧等级 ==========
export const DIARY_BINDING_NAMES = Object.freeze([
  '',
  { zh: '简装手记', en: 'Simple Journal' },
  { zh: '线装布封', en: 'Thread-Bound Cloth' },
  { zh: '皮面精装', en: 'Leatherbound' },
  { zh: '魔法装帧', en: 'Enchanted Binding' },
]);

export function getDiaryBindingName(level) {
  const entry = DIARY_BINDING_NAMES[level];
  if (!entry) return '';
  return typeof entry === 'string' ? entry : (getLocale() === 'en' ? entry.en : entry.zh);
}

// ========== 借阅区等级名 ==========
export const BORROW_AREA_LEVELS = Object.freeze([
  { zh: '未建造', en: 'Not Built' },
  { zh: '陋室', en: 'Humble' },
  { zh: '整洁', en: 'Tidy' },
  { zh: '开放', en: 'Open' },
  { zh: '舒适', en: 'Cozy' },
  { zh: '精致', en: 'Refined' },
  { zh: '优雅', en: 'Elegant' },
  { zh: '圣所', en: 'Sanctum' },
]);

export function getBorrowLevelName(level) {
  const entry = BORROW_AREA_LEVELS[level];
  if (!entry) return '';
  return typeof entry === 'string' ? entry : (getLocale() === 'en' ? entry.en : entry.zh);
}

// ========== 古籍修复室等级名 ==========
export const RESTORATION_ROOM_LEVELS = Object.freeze([
  { zh: '残破', en: 'Ruined' },
  { zh: '陋室', en: 'Humble' },
  { zh: '整洁', en: 'Tidy' },
  { zh: '明亮', en: 'Bright' },
  { zh: '静雅', en: 'Serene' },
  { zh: '修复圣堂', en: 'Restoration Sanctuary' },
]);

export function getRestorationLevelName(level) {
  const entry = RESTORATION_ROOM_LEVELS[level];
  if (!entry) return '';
  return typeof entry === 'string' ? entry : (getLocale() === 'en' ? entry.en : entry.zh);
}

// ========== 页面名（标志牌悬挂目标） ==========
const PAGE_NAME_DATA = Object.freeze({
  focus: { zh: '缮写室', en: 'Scriptorium' },
  visitors: { zh: '读者沙龙', en: 'Reader Salon' },
  bookshelf: { zh: '大书库', en: 'Hall of Books' },
  shop: { zh: '位面商店', en: 'Plane Shop' },
  library: { zh: '馆长办公室', en: "Curator's Office" },
  archive: { zh: '馆史档案', en: 'Archive' },
});

export function getPageName(page) {
  const entry = PAGE_NAME_DATA[page];
  if (!entry) return page;
  return getLocale() === 'en' ? entry.en : entry.zh;
}
