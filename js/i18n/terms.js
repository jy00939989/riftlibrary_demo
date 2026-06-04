// 核心术语常量 —— 供全项目引用，便于未来国际化替换
// 使用方式：import { T } from '../i18n/terms.js'; → T.library

export const T = Object.freeze({
  // ========== 系统名称 ==========
  gameTitle: '异世界图书馆',
  libraryName: '归墟图书馆',
  librarySubtitle: '夹缝中的归墟 · 位面枢纽',

  // ========== 页面标签 ==========
  tabScriptorium: '缮写室',
  tabGrandLibrary: '大书库',
  tabCuratorOffice: '馆长办公室',
  tabReaderSalon: '读者沙龙',
  tabArchive: '馆史档案',
  tabPlaneShop: '位面商店',

  // ========== 馆长办公室子标签 ==========
  subtabOverview: '概况',
  subtabAchievements: '成就柜',
  subtabCollection: '收藏室',
  subtabDecoration: '布置',
  subtabGuide: '馆长手册',

  // ========== 馆史档案子标签 ==========
  subtabHistory: '馆史档案',
  subtabDiary: '墨墨日志',
  subtabPlanes: '位面',

  // ========== 资源 ==========
  coins: '智慧之光',
  inspiration: '灵感',
  atmosphere: '氛围',

  // ========== 设施 ==========
  readingArea: '借阅区',
  shelf: '书架',
  manuscriptBox: '手稿箱',
  portal: '传送门',
  signboard: '标志牌',
  plant: '盆栽',

  // ========== 访客 ==========
  visitor: '访客',
  favorability: '好感度',
  browsing: '浏览中',
  borrowed: '已借出',
  due: '待归还',
  stickyNote: '便签',
  aura: '光环',

  // ========== 书籍 ==========
  transcribe: '誊抄',
  mastery: '熟练度',
  chapter: '章节',
  reCopy: '重抄',
  damaged: '损毁',
  shelve: '上架',
  curation: '策展',

  // ========== 进度 ==========
  focus: '专注',
  streak: '连续专注',
  atmosphereStage: '氛围阶段',
  tierGoal: '阶位目标',
  achievement: '成就',
  guideQuest: '引导任务',
  milestone: '里程碑',
  dailyTask: '每日馆务',
  plane: '位面',
  memento: '信物',
  replyLetter: '回信',

  // ========== 角色 ==========
  curator: '馆长',
  momo: '墨墨',

  // ========== 常驻按钮 ==========
  unlock: '解锁',
  upgrade: '升级',
  purchase: '购买',
  collect: '收取',
  build: '建造',
  restore: '修缮',
  abandon: '放弃',
  confirm: '确定',
  cancel: '取消',
  close: '关闭',
});

// ========== 氛围阶段名 ==========
export const ATMOSPHERE_STAGES = Object.freeze([
  '',
  '废墟',
  '破败',
  '陈旧',
  '温暖',
  '星辰',
]);

// ========== 访客角色名 ==========
export const VISITOR_NAMES = Object.freeze({
  shenmingyuan: '沈明远',
  chengyuan: '程远',
  peizhou: '裴舟',
  jianan: '简安',
  jiangyoushu: '江有树',
  guyu: '谷雨',
  qiaoyiyi: '乔一一',
  xierugui: '谢如归',
  xiachan: '夏蝉',
  wangxiaolei: '王小磊',
});

// ========== 成就分类 ==========
export const ACHIEVEMENT_CATEGORIES = Object.freeze([
  '修复启蒙',
  '智慧之光',
  '书籍收集',
  '图书馆重建',
  '访客',
  '彩蛋',
]);

// ========== 成就稀有度 ==========
export const ACHIEVEMENT_RARITIES = Object.freeze([
  '青铜',
  '白银',
  '黄金',
  '铂金',
]);

// ========== 日志装帧等级 ==========
export const DIARY_BINDING_NAMES = Object.freeze([
  '',
  '简装手记',
  '线装布封',
  '皮面精装',
  '魔法装帧',
]);
