#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.argv[2] || '.';
const SCAN_PATH = path.join(PROJECT_ROOT, '.understand-anything/intermediate/scan-result.json');
const OUT_PATH = path.join(PROJECT_ROOT, '.understand-anything/intermediate/assembled-graph.json');

const scan = JSON.parse(fs.readFileSync(SCAN_PATH, 'utf8'));

// Manual import map extracted from the actual code
const IMPORTS = {
  'js/app.js': ['js/state.js','js/storage.js','js/actioncards.js','js/timer.js','js/visitors.js','js/capacity.js','js/shop.js','js/curation.js','js/achievements.js','js/plants.js','js/diary.js','js/quests.js','js/audio.js','js/intro.js','js/tutorial.js','js/dailytasks.js','js/guidequests.js','js/render/achievements.js','js/render/animations.js','js/render/tutorial-ui.js','js/render/certificate.js','js/render/index.js','js/render/momo-suggestion.js','data/books.js','data/tiergoals.js'],
  'js/state.js': [],
  'js/storage.js': ['js/state.js'],
  'js/timer.js': ['js/state.js'],
  'js/audio.js': ['js/state.js'],
  'js/curation.js': ['js/state.js','data/books.js','data/curation_pairs.js'],
  'js/capacity.js': ['js/state.js','js/storage.js'],
  'js/shop.js': ['js/state.js','js/storage.js','js/capacity.js','data/books.js','data/signboards.js','data/planes.js'],
  'js/books.js': ['js/state.js','js/storage.js','js/capacity.js','data/books.js','js/render/index.js'],
  'js/visitors.js': ['js/state.js','js/storage.js','js/capacity.js','js/shop.js','js/curation.js','js/diary.js','js/plants.js','js/quests.js','data/visitor-events.js','data/curation_pairs.js','js/i18n/terms.js'],
  'js/achievements.js': ['js/state.js','data/books.js'],
  'js/actioncards.js': ['js/state.js','js/storage.js','data/books.js'],
  'js/plants.js': ['js/state.js','js/storage.js','data/plants.js'],
  'js/diary.js': ['js/state.js','js/storage.js'],
  'js/quests.js': ['js/state.js','js/storage.js','data/planes.js','data/quests/pastoral_tasks.js','data/tiergoals.js'],
  'js/dailytasks.js': ['js/state.js','js/storage.js'],
  'js/guidequests.js': ['js/state.js','js/storage.js'],
  'js/collection.js': ['js/state.js','data/books.js','data/planes.js'],
  'js/atmosphere.js': ['js/state.js','data/atmosphere.js'],
  'js/intro.js': [],
  'js/tutorial.js': ['js/state.js'],
  'js/render/index.js': ['js/render/common.js'],
  'js/render/common.js': ['js/state.js','js/storage.js','js/timer.js'],
  'js/render/focus.js': ['js/state.js','js/storage.js','js/timer.js','js/books.js','js/capacity.js','js/render/common.js','js/render/writing.js','data/books.js','js/audio.js'],
  'js/render/bookshelf.js': ['js/state.js','js/storage.js','js/capacity.js','js/books.js','js/collection.js','js/curation.js','js/render/common.js','js/render/collection.js','data/books.js','data/curation_pairs.js'],
  'js/render/shop.js': ['js/state.js','js/storage.js','js/shop.js','js/capacity.js','js/render/common.js','data/books.js','data/planes.js','data/signboards.js','data/tiergoals.js'],
  'js/render/visitors.js': ['js/state.js','js/storage.js','js/visitors.js','js/capacity.js','js/render/common.js','js/i18n/terms.js'],
  'js/render/library.js': ['js/state.js','js/storage.js','js/capacity.js','js/shop.js','js/plants.js','js/render/common.js','js/render/plants.js','js/render/plane.js','js/render/quests.js','data/plants.js','data/signboards.js'],
  'js/render/archive.js': ['js/state.js','js/storage.js','js/capacity.js','js/books.js','js/timer.js','js/shop.js','js/curation.js','js/render/common.js'],
  'js/render/achievements.js': ['js/achievements.js','js/render/common.js'],
  'js/render/animations.js': ['js/state.js','js/render/common.js','js/capacity.js'],
  'js/render/collection.js': ['js/collection.js','js/state.js','js/render/common.js'],
  'js/render/certificate.js': ['js/state.js','js/capacity.js','js/render/common.js'],
  'js/render/writing.js': ['js/state.js','js/storage.js','js/timer.js'],
  'js/render/plants.js': ['js/state.js','js/plants.js','js/render/common.js','data/plants.js'],
  'js/render/plane.js': ['js/state.js','js/quests.js','js/render/common.js'],
  'js/render/quests.js': ['js/state.js','js/quests.js','js/render/common.js','data/quests/pastoral_tasks.js'],
  'js/render/tutorial-ui.js': ['js/state.js','js/storage.js','js/render/common.js','js/tutorial.js'],
  'js/render/guidequests.js': ['js/guidequests.js','js/render/common.js'],
  'js/render/momo-suggestion.js': ['js/state.js','js/capacity.js','js/render/common.js'],
  'js/i18n/terms.js': [],
};

const LAYER_DEFINITIONS = [
  { id: 'layer:entry-point', name: '应用入口', description: 'HTML 入口和主应用启动模块', nodeIds: ['file:index.html','file:js/app.js','file:package.json'] },
  { id: 'layer:state-storage', name: '状态与持久化', description: '全局状态管理、localStorage 持久化、核心数据层', nodeIds: ['file:js/state.js','file:js/storage.js','file:data/atmosphere.js','file:data/book_pool.js','file:data/books.js','file:data/planes.js'] },
  { id: 'layer:game-systems', name: '游戏系统', description: '访客、书籍、成就、商店、策展、植物等核心游戏机制', nodeIds: ['file:js/visitors.js','file:js/books.js','file:js/achievements.js','file:js/shop.js','file:js/capacity.js','file:js/curation.js','file:js/plants.js','file:js/diary.js','file:js/quests.js','file:js/actioncards.js','file:js/dailytasks.js','file:js/guidequests.js','file:js/collection.js','file:js/atmosphere.js','file:js/timer.js','file:js/tutorial.js'] },
  { id: 'layer:interaction', name: '交互层', description: '音频、引导、i18n、入场动画', nodeIds: ['file:js/audio.js','file:js/intro.js','file:js/i18n/terms.js'] },
  { id: 'layer:render', name: '渲染层', description: '所有页面的 UI 渲染和动画', nodeIds: ['file:js/render/index.js','file:js/render/common.js','file:js/render/focus.js','file:js/render/bookshelf.js','file:js/render/shop.js','file:js/render/visitors.js','file:js/render/library.js','file:js/render/archive.js','file:js/render/achievements.js','file:js/render/animations.js','file:js/render/collection.js','file:js/render/certificate.js','file:js/render/writing.js','file:js/render/plants.js','file:js/render/plane.js','file:js/render/quests.js','file:js/render/tutorial-ui.js','file:js/render/guidequests.js','file:js/render/momo-suggestion.js'] },
  { id: 'layer:game-data', name: '游戏数据', description: '书籍内容、访客叙事、任务、位面、植物等静态数据', nodeIds: scan.files.filter(f => f.path.startsWith('data/books/')).map(f => 'file:'+f.path) },
  { id: 'layer:assets', name: '静态资源', description: 'CSS 样式和音效文件', nodeIds: ['file:css/style.css','file:audio/effect/achievement_unlock.wav','file:audio/effect/book_return.wav','file:audio/effect/button_click.wav','file:audio/effect/buy_success.wav','file:audio/effect/focus_complete.wav','file:audio/effect/visitor_arrive.wav'] },
  { id: 'layer:docs-config', name: '文档与配置', description: '项目文档、变更日志、部署配置', nodeIds: scan.files.filter(f => f.fileCategory === 'docs' || f.fileCategory === 'config' || f.path.endsWith('.md')).map(f => {
    const prefix = f.fileCategory === 'config' ? 'config:' : 'document:';
    return prefix + f.path;
  }) },
];

// Build nodes
const nodes = [];
const nodeIdSet = new Set();

scan.files.forEach(f => {
  let type, id;
  if (f.fileCategory === 'docs') {
    type = 'document';
    id = 'document:' + f.path;
  } else if (f.fileCategory === 'config') {
    type = 'config';
    id = 'config:' + f.path;
  } else if (f.fileCategory === 'markup') {
    type = 'file';
    id = 'file:' + f.path;
  } else {
    type = 'file';
    id = 'file:' + f.path;
  }

  const name = path.basename(f.path);
  const summaries = {
    'index.html': '应用主入口 HTML，定义导航栏、标签切换结构、所有页面容器',
    'js/app.js': '应用核心主控制器，初始化和编排所有子系统',
    'js/state.js': '全局状态管理，定义初始状态和保存逻辑',
    'js/storage.js': '持久化存储层，管理金币/灵感/氛围/连胜等',
    'js/visitors.js': '访客系统核心，管理出生/浏览/灵气/叙事',
    'js/shop.js': '位面商店系统，书籍购买/借阅升级/位面传送门',
    'js/capacity.js': '书库容量管理，书架放置/手稿箱/扩容',
    'js/books.js': '书籍解锁和进度系统',
    'js/curation.js': '书架策展系统，相邻书籍增益计算',
    'js/achievements.js': '成就系统，触发检测和奖励发放',
    'js/plants.js': '植物养成系统，浇水/施肥/收获',
    'js/diary.js': '日记系统，每日摘要生成',
    'js/quests.js': '位面任务系统',
    'js/timer.js': '番茄钟计时器',
    'js/audio.js': '音效和背景音乐管理',
    'js/actioncards.js': '专注完成后行动卡抽牌系统',
    'js/dailytasks.js': '每日任务系统',
    'js/guidequests.js': '引导任务系统',
    'js/collection.js': '藏书收藏进度系统',
    'js/atmosphere.js': '氛围阶段文字描述',
    'js/intro.js': '首次进入开场介绍',
    'js/tutorial.js': '教程弹窗管理',
    'js/i18n/terms.js': '国际化术语表',
    'css/style.css': '全局样式，包含动画和响应式适配',
    'data/visitor-events.js': '访客叙事事件文本数据',
    'data/tiergoals.js': '阶段目标定义',
    'package.json': '项目配置，包含依赖和 dev 脚本',
  };
  const summary = summaries[name] || (
    f.path.startsWith('data/books/') ? '书籍数据：' + name.replace(/\.js$/,'').replace(/^book_\d+_/,'') :
    f.path.startsWith('js/render/') ? name.replace('.js','') + ' 页面渲染模块' :
    f.fileCategory === 'docs' ? '项目文档' :
    '项目文件'
  );

  nodes.push({
    id, type, name,
    filePath: f.path,
    summary,
    tags: [f.language || 'unknown', f.fileCategory || 'code'],
    complexity: f.sizeLines > 500 ? 'moderate' : f.sizeLines > 200 ? 'simple' : 'trivial',
  });
  nodeIdSet.add(id);
});

// Build edges from imports
const edges = [];
const edgeSeen = new Set();

Object.entries(IMPORTS).forEach(([file, imports]) => {
  const sourceId = 'file:' + file;
  imports.forEach(imp => {
    const targetId = 'file:' + imp;
    if (nodeIdSet.has(targetId)) {
      const key = sourceId + '|imports|' + targetId;
      if (!edgeSeen.has(key)) {
        edges.push({ source: sourceId, target: targetId, type: 'imports', weight: 0.7 });
        edgeSeen.add(key);
      }
    }
  });
});

// Add data edges (books.js -> individual book files)
scan.files.filter(f => f.path.startsWith('data/books/book_')).forEach(f => {
  const targetId = 'file:' + f.path;
  if (nodeIdSet.has(targetId)) {
    edges.push({ source: 'file:data/books.js', target: targetId, type: 'contains', weight: 1.0 });
  }
});

const graph = {
  version: '1.0.0',
  project: {
    name: '归墟图书馆',
    languages: ['javascript', 'html', 'css', 'markdown', 'json'],
    frameworks: ['tailwindcss'],
    description: '纯前端Web游戏 — 番茄钟专注计时 + 经典书籍收集 + NPC访客模拟 + 位面探索系统',
  },
  nodes,
  edges,
  layers: LAYER_DEFINITIONS,
  tour: [
    { order: 1, title: '项目概览', description: '从 README 和入口文件了解项目整体架构', nodeIds: ['file:index.html', 'file:package.json'] },
    { order: 2, title: '应用启动', description: '主控制器 js/app.js 是大脑，初始化所有子系统', nodeIds: ['file:js/app.js'] },
    { order: 3, title: '状态与持久化', description: '理解全局状态结构和数据流转', nodeIds: ['file:js/state.js', 'file:js/storage.js'] },
    { order: 4, title: '游戏核心系统', description: '访客、书籍、成就、商店等核心玩法', nodeIds: ['file:js/visitors.js', 'file:js/books.js', 'file:js/achievements.js', 'file:js/shop.js'] },
    { order: 5, title: '渲染层', description: '所有页面的 UI 渲染模块', nodeIds: ['file:js/render/index.js', 'file:js/render/focus.js', 'file:js/render/bookshelf.js'] },
    { order: 6, title: '游戏数据', description: '庞大的经典书籍内容库和访客叙事数据', nodeIds: ['file:data/books.js', 'file:data/visitor-events.js', 'file:data/tiergoals.js'] },
  ],
};

fs.writeFileSync(OUT_PATH, JSON.stringify(graph, null, 2));
console.log(`Knowledge graph: ${nodes.length} nodes, ${edges.length} edges, ${graph.layers.length} layers, ${graph.tour.length} tour steps`);
