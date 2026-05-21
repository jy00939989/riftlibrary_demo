# 音效系统实施指令

**文件状态**：可执行
**基于设计**：`AUDIO_SYSTEM_DESIGN.md`
**最后更新**：2026-05-15

---

## 实施概览

```
工作量估算：
  - audio.js 改造：约 2 小时
  - 音效素材准备（下载/购买）：约 1~2 小时
  - 各模块接入点改动：约 1 小时
  - UI 和商店集成：约 1 小时
  - 细节调优（音量平衡）：30 分钟
```

---

## 阶段一：素材准备

### 目录结构

```
audio/
├── sfx/                          ← 新建
│   ├── achievement_unlock.mp3    ← 0.8~1.5s，古典封印解除音
│   ├── book_complete.mp3         ← 1~2s，翻页合本+魔法光效
│   ├── chapter_unlock.mp3        ← 0.5~1s，羽笔落定
│   ├── visitor_arrive.mp3        ← 0.8~1.2s，古书翻动+轻风铃
│   ├── purchase_success.mp3      ← 0.8~1.5s，金币落入+书架激活
│   ├── atmosphere_level_up.mp3   ← 1.5~2.5s，风铃层次渐强
│   ├── visitor_return.mp3        ← 0.6~1.2s，书页翻动
│   └── ui_click.mp3              ← 0.2~0.4s，羽笔轻点
└── ambient/                       ← 新建
    ├── ambient_writing.mp3       ← AMB-01，免费，默认开启，3~5min循环
    ├── ambient_fireplace.mp3     ← AMB-02，商店购买
    ├── ambient_rain_light.mp3   ← AMB-03，商店购买
    ├── ambient_thunderstorm.mp3  ← AMB-04，商店购买
    ├── ambient_birds.mp3         ← AMB-05，商店购买
    ├── ambient_cafe.mp3          ← AMB-06，商店购买
    ├── ambient_ocean.mp3         ← AMB-07，商店购买
    └── ambient_library_silent.mp3← AMB-08，商店购买
```

### 素材搜索关键词（古典书卷风格）

| 音效 | 英文搜索关键词 |
|------|---------------|
| 成就解锁 | quill pen, magic seal, scroll unfurl, achievement chime |
| 书籍完成 | book close, book magic sparkle, ancient tome |
| 章节解锁 | feather quill scratch, ink drop |
| 访客到来 | book page turn, soft bell chime, wind chime |
| 购买成功 | coin drop, coin collect, wooden creak |
| 氛围升级 | magic portal open, wind chime cascade, level up fantasy |
| 访客还书 | book rustle, page settle |
| UI点击 | feather pen tap, ink tap |
| 抄书声 | quill writing, pen scratching paper |
| 壁炉 | fireplace crackling, log fire |
| 轻雨 | gentle rain, rain on window |
| 雷雨 | thunderstorm, rain and thunder |
| 鸟鸣 | forest birds, morning birds singing |
| 咖啡馆 | coffee shop ambient, cafe background murmur |
| 海浪 | ocean waves seaside |
| 图书馆 | library ambience, quiet book rustle |

### 氛围音商店定价建议

| 编号 | 类型 | 建议价格（智慧之光）| 备注 |
|------|------|-------------------|------|
| AMB-01 | 🖋️ 羽毛笔/抄书声 | 免费（默认）| 不可购买 |
| AMB-02 | 🔥 壁炉火声 | 800 | 温暖感，强烈推荐 |
| AMB-03 | 📚 图书馆寂静 | 1,000 | 翻书声+脚步 |
| AMB-04 | 🌧️ 轻雨声 | 600 | 沉思感 |
| AMB-05 | ⛈️ 雷雨声 | 800 | 戏剧张力 |
| AMB-06 | 🐦 鸟叫声 | 500 | 户外感 |
| AMB-07 | ☕ 咖啡馆 | 600 | 现代感 |
| AMB-08 | 🌊 海浪声 | 500 | 放松感 |

---

## 阶段二：核心代码改造

### 文件变更清单

```
js/audio.js              ← 改造：新增 SFX 引擎 + Ambient 引擎 + 音效开关
js/timer.js              ← 改造：专注开始/暂停/结束时调用 ambient
js/achievements.js       ← 改造：成就解锁时触发 SFX
js/app.js                ← 改造：书籍完成/章节解锁/访客到来/购买成功/还书 触发 SFX
js/shop.js               ← 改造：购买氛围音时解锁
js/render/focus.js       ← 改造：专注页氛围音选择器
js/render/shop.js        ← 改造：商店氛围音购买区
js/state.js              ← 改造：新增 unlockedAmbients / 默认 ambientType
index.html               ← 改造：右上角新增音效开关按钮 🔔/🔕
data/ambient.js          ← 新建：氛围音定义（名称/文件/价格/解锁条件）
```

---

### MOD-01：js/state.js — 新增氛围音状态

**改动位置**：约 line 99，`introCompleted` 之后

```js
// 音效系统
focus: {
  // ... 现有字段 ...
  ambientType: 'writing',    // 当前选择的氛围音类型，null=关闭
},

// 氛围音解锁状态（持久化到独立 localStorage）
// 存储在 'library_ambients'，格式：{ unlockedAmbients: ['fireplace', 'rain'] }
// AMB-01 writing 默认解锁，无需存储
unlockedAmbients: ['writing'],  // 当前拥有的氛围音
```

**注意**：建议将 `unlockedAmbients` 存到独立 localStorage key（参考 achievements.js 的做法），
因为它是独立于核心存档的购锁状态。

---

### MOD-02：js/audio.js — 核心改造（完整代码）

将现有 `audio.js` 的全部内容替换为以下代码：

```js
// audio.js —— 统一音频引擎：BGM + SFX + Ambient
import { state } from './state.js';

// ============================================================
// BGM 部分（保留原逻辑）
// ============================================================

const TRACKS = {
  ruined: [
    'audio/图书馆 demo 荒废图书馆 2.mp3',
    'audio/图书馆 demo 荒废图书馆 2 (1).mp3'
  ],
  cozy: [
    'audio/图书馆 demo2 城镇风格.mp3',
    'audio/图书馆 demo2 城镇风格 (1).mp3'
  ],
  stellar: [
    'audio/图书馆 demo 星辰图书馆.mp3',
    'audio/图书馆 demo 星辰图书馆 (1).mp3'
  ]
};

let bgmAudio = null;
let currentTier = null;
let musicEnabled = true;
let bgmFadeTimer = null;

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function updateMusicToggleIcon() {
  const btn = document.getElementById('music-toggle');
  if (btn) btn.textContent = musicEnabled ? '🔈' : '🔇';
}

export function isMusicOn() { return musicEnabled; }

export function initAudio() {
  musicEnabled = localStorage.getItem('library_music') !== 'off';
  sfxEnabled = localStorage.getItem('library_sfx') !== 'off';
  updateMusicToggleIcon();
  updateSfxToggleIcon();
}

function tierForAtmo(v) {
  if (v > 300) return 'stellar';
  if (v > 80) return 'cozy';
  return 'ruined';
}

function playCurrentTier() {
  if (!musicEnabled) return;
  const tier = tierForAtmo(state.library.atmosphere);
  if (tier === currentTier) return;
  currentTier = tier;

  const src = encodeURI(pick(TRACKS[tier]));
  const next = new Audio(src);
  next.loop = true;
  next.volume = 0;

  if (bgmAudio) {
    const old = bgmAudio;
    let step = 0;
    clearInterval(bgmFadeTimer);
    bgmFadeTimer = setInterval(() => {
      step++;
      old.volume = Math.max(0, 0.5 - step * 0.05);
      next.volume = Math.min(0.5, step * 0.05);
      if (step >= 10) {
        clearInterval(bgmFadeTimer);
        old.pause();
        old.src = '';
      }
    }, 120);
  } else {
    next.volume = 0.5;
  }

  next.play().catch(() => {});
  bgmAudio = next;
}

export function refreshBGM() {
  if (!musicEnabled) return;
  playCurrentTier();
}

export function toggleMusic() {
  musicEnabled = !musicEnabled;
  localStorage.setItem('library_music', musicEnabled ? 'on' : 'off');
  updateMusicToggleIcon();

  if (musicEnabled) {
    currentTier = null;
    playCurrentTier();
  } else {
    if (bgmAudio) { bgmAudio.pause(); bgmAudio = null; }
    currentTier = null;
  }
}

export function onFirstInteraction() {
  if (musicEnabled) playCurrentTier();
}

// ============================================================
// SFX 部分（短音效）
// ============================================================

let sfxEnabled = true;
let sfxFadeTimer = null;

const SFX_VOLUME = 0.5;   // 音效默认音量（可按需调低至 0.3）

const SFX = {
  achievement:    'audio/sfx/achievement_unlock.mp3',
  bookComplete:   'audio/sfx/book_complete.mp3',
  chapterUnlock:  'audio/sfx/chapter_unlock.mp3',
  visitorArrive:  'audio/sfx/visitor_arrive.mp3',
  purchase:       'audio/sfx/purchase_success.mp3',
  atmosphereUp:   'audio/sfx/atmosphere_level_up.mp3',
  visitorReturn:  'audio/sfx/visitor_return.mp3',
  uiClick:        'audio/sfx/ui_click.mp3'
};

function updateSfxToggleIcon() {
  const btn = document.getElementById('sfx-toggle');
  if (btn) btn.textContent = sfxEnabled ? '🔔' : '🔕';
}

export function isSfxOn() { return sfxEnabled; }

export function toggleSFX() {
  sfxEnabled = !sfxEnabled;
  localStorage.setItem('library_sfx', sfxEnabled ? 'on' : 'off');
  updateSfxToggleIcon();
}

/**
 * 播放短音效
 * @param {string} key - SFX 对象中的键名
 */
export function playSFX(key) {
  if (!sfxEnabled) return;
  const path = SFX[key];
  if (!path) return;
  const audio = new Audio(path);
  audio.volume = SFX_VOLUME;
  audio.play().catch(() => {});
}

// ============================================================
// Ambient 部分（沉浸长循环氛围音）
// ============================================================

let ambientAudio = null;
let ambientType = null;
let ambientFadeTimer = null;
const AMBIENT_VOLUME = 0.6;
const AMBIENT_FADE_STEPS = 20;   // 20步淡入/淡出
const AMBIENT_FADE_MS = 50;      // 每步50ms，总淡入1s

// 氛围音定义（名称/文件路径/商店价格）
export const AMBIENT_DEFS = {
  writing:    { name: '🖋️ 羽毛笔',   file: 'audio/ambient/ambient_writing.mp3',     price: 0, defaultUnlock: true },
  fireplace:  { name: '🔥 壁炉火',    file: 'audio/ambient/ambient_fireplace.mp3',    price: 800 },
  library:    { name: '📚 图书馆',   file: 'audio/ambient/ambient_library_silent.mp3', price: 1000 },
  rain_light: { name: '🌧️ 轻雨',     file: 'audio/ambient/ambient_rain_light.mp3',    price: 600 },
  thunder:    { name: '⛈️ 雷雨',     file: 'audio/ambient/ambient_thunderstorm.mp3',   price: 800 },
  birds:      { name: '🐦 鸟鸣',      file: 'audio/ambient/ambient_birds.mp3',         price: 500 },
  cafe:       { name: '☕ 咖啡馆',    file: 'audio/ambient/ambient_cafe.mp3',           price: 600 },
  ocean:      { name: '🌊 海浪',      file: 'audio/ambient/ambient_ocean.mp3',          price: 500 }
};

// 加载已解锁的氛围音列表（从独立 localStorage 读取）
export function loadUnlockedAmbients() {
  try {
    const raw = localStorage.getItem('library_ambients');
    const data = raw ? JSON.parse(raw) : {};
    // 默认解锁 writing
    const unlocked = data.unlocked || [];
    if (!unlocked.includes('writing')) unlocked.push('writing');
    return unlocked;
  } catch { return ['writing']; }
}

export function saveUnlockedAmbients(unlocked) {
  localStorage.setItem('library_ambients', JSON.stringify({ unlocked }));
}

export function unlockAmbient(key) {
  const unlocked = loadUnlockedAmbients();
  if (!unlocked.includes(key)) {
    unlocked.push(key);
    saveUnlockedAmbients(unlocked);
  }
}

export function isAmbientUnlocked(key) {
  return loadUnlockedAmbients().includes(key);
}

/**
 * 开始播放氛围音
 * @param {string} type - 氛围音类型键名，null=停止
 * @param {object} options
 *   - fadeIn: 是否淡入，默认true
 *   - bgmMode: 'overlay'（BGM降30%）或 'solo'（BGM静音）
 */
export function startAmbient(type, { fadeIn = true, bgmMode = 'overlay' } = {}) {
  if (!type) { stopAmbient(); return; }

  const def = AMBIENT_DEFS[type];
  if (!def) return;
  if (!isAmbientUnlocked(type)) return;

  // 停止旧的
  if (ambientAudio) {
    ambientAudio.pause();
    ambientAudio.src = '';
    ambientAudio = null;
  }

  ambientType = type;
  ambientAudio = new Audio(def.file);
  ambientAudio.loop = true;
  ambientAudio.volume = 0;

  if (fadeIn) {
    fadeAmbientTo(AMBIENT_VOLUME);
  } else {
    ambientAudio.volume = AMBIENT_VOLUME;
  }

  // BGM 配合处理
  if (bgmAudio) {
    if (bgmMode === 'solo') {
      bgmAudio.volume = 0;
    } else {
      // overlay: 降至30%
      bgmAudio.volume = 0.15;
    }
  }

  ambientAudio.play().catch(() => {});
}

/**
 * 停止氛围音
 * @param {boolean} fadeOut - 是否淡出，默认true
 */
export function stopAmbient({ fadeOut = true } = {}) {
  if (ambientAudio) {
    if (fadeOut) {
      fadeAmbientTo(0, () => {
        ambientAudio.pause();
        ambientAudio.src = '';
        ambientAudio = null;
        ambientType = null;
      });
    } else {
      ambientAudio.pause();
      ambientAudio.src = '';
      ambientAudio = null;
      ambientType = null;
    }
  }
  // BGM 恢复
  if (bgmAudio) bgmAudio.volume = 0.5;
}

/**
 * 暂停氛围音（专注暂停时）
 */
export function pauseAmbient() {
  if (ambientAudio) {
    // 淡至 10%
    fadeAmbientTo(0.08);
  }
  if (bgmAudio) bgmAudio.volume = 0.5;
}

/**
 * 恢复氛围音
 */
export function resumeAmbient() {
  if (ambientAudio && ambientType) {
    fadeAmbientTo(AMBIENT_VOLUME);
  }
}

/**
 * 淡入淡出辅助
 */
function fadeAmbientTo(targetVolume, onComplete) {
  if (!ambientAudio) { if (onComplete) onComplete(); return; }
  clearInterval(ambientFadeTimer);
  const current = ambientAudio.volume;
  const steps = AMBIENT_FADE_STEPS;
  const stepSize = (targetVolume - current) / steps;
  let step = 0;

  ambientFadeTimer = setInterval(() => {
    step++;
    ambientAudio.volume = Math.max(0, Math.min(1, current + stepSize * step));
    if (step >= steps) {
      clearInterval(ambientFadeTimer);
      if (onComplete) onComplete();
    }
  }, AMBIENT_FADE_MS);
}

/**
 * 获取当前氛围音类型
 */
export function getCurrentAmbientType() {
  return ambientType;
}
```

---

### MOD-03：js/timer.js — 接入氛围音

**改动**：在 `startTimer()` / `stopTimer()` / `togglePauseTimer()` 中调用 `startAmbient()` / `stopAmbient()` / `pauseAmbient()` / `resumeAmbient()`。

**改动位置**：`startTimer()` 函数末尾（约 line 33）：

```js
// timer.js 顶部新增 import
import { startAmbient, stopAmbient, pauseAmbient, resumeAmbient } from './audio.js';
import { AMBIENT_DEFS, loadUnlockedAmbients } from './audio.js';

export function startTimer() {
  const sess = state.currentSession;
  if (sess.active) return;

  sess.active = true;
  sess.elapsedSeconds = 0;
  sess.paused = false;
  sess.quoteIndex = 0;
  sess.startTime = Date.now();

  // 首次专注：墨墨的魔法加速（10倍速）
  momoAccelerating = state.focus.totalMinutes === 0;
  const interval = momoAccelerating ? 100 : 1000;
  timerInterval = setInterval(() => tick(), interval);
  sess.intervalId = timerInterval;
  saveState();

  // ★ 新增：启动氛围音（默认开启 writing）
  const ambientType = state.focus.ambientType || 'writing';
  const unlocked = loadUnlockedAmbients();
  if (unlocked.includes(ambientType)) {
    startAmbient(ambientType, { bgmMode: 'overlay' });
  } else if (unlocked.includes('writing')) {
    // 如果当前选中的不可用，降级到默认
    startAmbient('writing', { bgmMode: 'overlay' });
    state.focus.ambientType = 'writing';
  }

  renderFocusPage();
}
```

**改动位置**：`togglePauseTimer()` 函数内（约 line 37~41）：

```js
export function togglePauseTimer() {
  state.currentSession.paused = !state.currentSession.paused;
  saveState();
  if (state.currentSession.paused) {
    pauseAmbient();      // ★ 新增
  } else {
    resumeAmbient();     // ★ 新增
  }
  renderFocusPage();
}
```

**改动位置**：`stopTimer()` 函数内（约 line 76~82）：

```js
function stopTimer() {
  momoAccelerating = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  stopAmbient({ fadeOut: true });   // ★ 新增：淡出氛围音
}
```

**改动位置**：`abandonTimer()` 函数内（约 line 84~103）：

```js
export function abandonTimer() {
  // ... 现有逻辑 ...
  stopAmbient({ fadeOut: true });   // ★ 新增：中断专注也要停止氛围音
  // ... 后续逻辑不变 ...
}
```

---

### MOD-04：js/achievements.js — 成就解锁音效

**改动位置**：约 line 140，`unlock(id)` 函数内

```js
// achievements.js 顶部新增 import
import { playSFX } from './audio.js';

function unlock(id) {
  const u = loadUnlocked();
  if (u[id]) return false;
  u[id] = { unlockedAt: Date.now() };
  saveUnlocked(u);
  playSFX('achievement');    // ★ 新增：成就解锁音效
  return true;
}
```

---

### MOD-05：js/app.js — 事件音效接入

**改动 1**：`handleCompleteFocus()` 函数内，书籍完成触发点（约 line 148）

```js
// app.js 顶部已 import { onFirstInteraction } from './audio.js'
// 新增 import
import { playSFX } from './audio.js';

// handlePostFocusEffects() 中，书籍完成动画前（约 line 249）
if (bookCompleted) {
  playSFX('bookComplete');   // ★ 新增
  // showBookCompleteAnimation ...
}
```

**改动 2**：`handlePostFocusEffects()` 中章节解锁触发点（约 line 239）

```js
if (unlockedChapter) {
  playSFX('chapterUnlock');  // ★ 新增
  // showUnlockAnimation ...
}
```

**改动 3**：`showVisitorArrivalCard()` 函数末尾（约 line 430，`document.body.appendChild(overlay)` 之后）

```js
document.body.appendChild(overlay);
playSFX('visitorArrive');   // ★ 新增：访客到来音效
```

**改动 4**：`handleCollectReturn()` 成功收取后（约 line 363~373）

```js
function handleCollectReturn(visitorId) {
  const result = collectReturn(visitorId);
  if (result) {
    const hour = new Date(getNow()).getHours();
    const achResults = [];
    achResults.push(...checkAchievements('visitor_return', { hour }));
    achResults.push(...checkAchievements('visitor'));
    showAchievementBatch(achResults);
    playSFX('visitorReturn');  // ★ 新增：还书音效
    updateStatusBar();
    saveState();
  }
  return result;
}
```

**改动 5**：`showCompletionCard()` 完成后音效（在弹窗按钮点击回调中，不影响原有流程时附加）

```js
// showCompletionCard() 的按钮点击回调中（约 line 362）
btn.addEventListener('click', () => {
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.3s';
  setTimeout(() => {
    overlay.remove();
    if (callback) callback();
  }, 300);
});
// 注意：结算卡片不强制触发音效（已有 bookComplete/achievement 在前面）
```

**改动 6**（可选）：氛围阶段升级检测，在 `handleCompleteFocus()` 专注完成时：

```js
// handleCompleteFocus() 末尾，在 sess.active = false 之前（约 line 167）
// 检测氛围阶段是否升级
const prevAtmosphere = state.library.atmosphere - (bookCompleted
  ? (book.totalWords < 30000 ? 3 : book.totalWords < 100000 ? 6 : 10)
  : 1);
const ATMOSPHERE_THRESHOLDS = [30, 80, 160, 300];
for (const th of ATMOSPHERE_THRESHOLDS) {
  if (prevAtmosphere < th && state.library.atmosphere >= th) {
    setTimeout(() => playSFX('atmosphereUp'), 800);  // ★ 延迟0.8s，在结算动画之后
    break;
  }
}
```

> ⚠️ 氛围升级音效要延迟 0.5~1s 播放，避免和书籍完成音效挤在一起。

---

### MOD-06：js/shop.js — 购买装潢触发音效 + 氛围音购买

**改动 1**：升级购买成功后触发音效

```js
// shop.js 顶部新增 import
import { playSFX } from './audio.js';

// upgradeBorrowLevel() 成功后（约 line 161）
export function upgradeBorrowLevel() {
  const price = getBorrowLevelPrice();
  if (state.library.borrowLevel >= 7) return false;
  if (!spendCoins(price)) return false;

  state.library.borrowLevel += 1;
  addAtmosphere(15);
  addHistory('purchase', `借阅区升至 Lv.${state.library.borrowLevel}`, `花费${price}智慧之光 · +15氛围`);
  saveState();
  playSFX('purchase');   // ★ 新增：购买成功音效
  return true;
}

// upgradeFocusLevel() 成功后（约 line 184）
export function upgradeFocusLevel() {
  const price = getFocusLevelPrice();
  if (state.library.focusLevel >= 6) return false;
  if (!spendCoins(price)) return false;

  state.library.focusLevel += 1;
  addAtmosphere(15);
  addHistory('purchase', `缮写室升至 Lv.${state.library.focusLevel}`, `花费${price}智慧之光 · +15氛围`);
  saveState();
  playSFX('purchase');   // ★ 新增：购买成功音效
  return true;
}

// purchaseSignboard() 成功后（约 line 198）
export function purchaseSignboard(signboardId) {
  // ...
  saveState();
  playSFX('purchase');   // ★ 新增：购买成功音效
  return true;
}
```

**改动 2**：`purchaseBook()` 成功后触发音效

```js
// purchaseBook() 函数内（约 line 142，saveState() 之后）
export function purchaseBook(bookId, price) {
  // ... 现有逻辑 ...
  saveState();
  playSFX('purchase');   // ★ 新增：购买书籍音效
  return true;
}
```

**改动 3**：新增氛围音购买函数（参考现有借阅区升级模式）

```js
// shop.js 新增
import { unlockAmbient, isAmbientUnlocked, AMBIENT_DEFS } from './audio.js';

export function purchaseAmbient(ambientKey) {
  const def = AMBIENT_DEFS[ambientKey];
  if (!def) return false;
  if (def.price === 0) return false;  // 免费的不需要购买
  if (isAmbientUnlocked(ambientKey)) return false;  // 已解锁

  if (!spendCoins(def.price)) {
    alert('智慧之光不足 💰');
    return false;
  }

  unlockAmbient(ambientKey);
  addHistory('purchase', `解锁氛围音「${def.name}」`, `花费${def.price}智慧之光`);
  saveState();
  playSFX('purchase');
  return true;
}

export function getAmbientShopItems() {
  return Object.entries(AMBIENT_DEFS)
    .filter(([key, def]) => def.price > 0)  // 排除免费的 writing
    .map(([key, def]) => ({
      key,
      name: def.name,
      price: def.price,
      unlocked: isAmbientUnlocked(key)
    }));
}
```

---

### MOD-07：js/render/focus.js — 氛围音选择器

**新增函数**：`renderAmbientSelector()`

在 `renderModeSelector()` 或 `renderControls()` 旁边新增：

```js
import { AMBIENT_DEFS, loadUnlockedAmbients, isAmbientUnlocked } from '../audio.js';

function renderAmbientSelector() {
  const unlocked = loadUnlockedAmbients();
  const current = state.focus.ambientType || 'writing';

  const container = el('div', 'mb-4');
  container.appendChild(el('div', 'font-display text-sm font-bold mb-2 text-ink-light', {
    text: '🎵 专注氛围音'
  }));

  const grid = el('div', 'flex flex-wrap gap-2 justify-center');

  Object.entries(AMBIENT_DEFS).forEach(([key, def]) => {
    const isUnlocked = unlocked.includes(key);
    const isActive = current === key && isUnlocked;

    const btn = el('button', `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
      isActive
        ? 'bg-magic-gold text-white shadow-lg'
        : isUnlocked
        ? 'bg-wood/20 text-ink hover:bg-wood/40 border border-wood/30'
        : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60'
    }`);

    btn.innerHTML = isUnlocked ? def.name : `🔒 ${def.name}`;

    if (isUnlocked) {
      btn.addEventListener('click', () => {
        state.focus.ambientType = key;
        saveState();
        renderAmbientSelector(); // 重新渲染以更新选中状态
      });
    } else {
      btn.title = `在位面商店花费 ${def.price} 智慧之光解锁`;
      btn.addEventListener('click', () => {
        // 提示去商店购买
        if (confirm(`${def.name} 需要在位面商店购买解锁。\n是否前往商店？`)) {
          window.switchTab('shop');
        }
      });
    }

    grid.appendChild(btn);
  });

  container.appendChild(grid);
  return container;
}
```

**改动**：`renderFocusPage()` 函数中，在 `renderModeSelector()` 之后、`renderBookSelector()` 之前插入调用：

```js
// renderFocusPage() 中（约 line 56，在 renderModeSelector 之后）
card.appendChild(renderModeSelector(sess));
// ★ 新增
card.appendChild(renderAmbientSelector());
```

---

### MOD-08：js/render/shop.js — 商店氛围音购买区

**新增函数**：`renderAmbientShopSection()`

在位面商店的适当位置（借阅区/缮写室升级卡片之后）插入：

```js
import { getAmbientShopItems } from '../shop.js';
import { playSFX } from '../audio.js';

function renderAmbientShopSection() {
  const items = getAmbientShopItems();
  const container = el('div', 'mt-6');

  container.innerHTML = `
    <h3 class="font-display text-lg font-bold mb-3 flex items-center gap-2">
      🎵 氛围音商店
    </h3>
    <p class="text-xs text-ink-light mb-3">在专注时播放沉浸式背景音，每种声音都经过精心挑选，与图书馆氛围完美融合。</p>
  `;

  const grid = el('div', 'grid grid-cols-2 md:grid-cols-4 gap-3');

  items.forEach(item => {
    const card = el('div', `rounded-xl p-4 text-center border-2 transition-all ${
      item.unlocked
        ? 'bg-green-50 border-green-300 opacity-75'
        : 'parchment-bg border-wood/30 hover:border-magic-gold cursor-pointer'
    }`);

    card.innerHTML = `
      <div class="text-2xl mb-1">${item.name}</div>
      <div class="text-xs text-ink-light mb-2">${item.unlocked ? '已解锁 ✅' : `${item.price} 智慧之光`}</div>
      <div class="text-xs font-bold ${item.unlocked ? 'text-green-600' : 'text-magic-gold'}">
        ${item.unlocked ? '已拥有' : '点击购买'}
      </div>
    `;

    if (!item.unlocked) {
      card.addEventListener('click', () => {
        // 调用商店购买（需要在 shop.js 暴露此接口）
        import('../shop.js').then(({ purchaseAmbient }) => {
          if (purchaseAmbient(item.key)) {
            renderShopPage(); // 重新渲染商店
          }
        });
      });
    }

    grid.appendChild(card);
  });

  container.appendChild(grid);
  return container;
}
```

**注意**：`renderShopPage()` 函数中，在借阅区升级区/缮写室升级区渲染完毕后插入调用此函数。

---

### MOD-09：index.html — 音效开关按钮

**改动位置**：右上角音乐开关按钮旁边（约 id="music-toggle" 的位置）

```html
<!-- 现有 -->
<button id="music-toggle" class="text-lg" title="音乐开关">🔈</button>

<!-- 新增音效开关 -->
<button id="sfx-toggle" class="text-lg" title="音效开关">🔔</button>
```

**改动**：`app.js` 的 `init()` 函数中，为新按钮绑定事件：

```js
// app.js init() 函数内（约 line 709，音乐开关之后）
const sfxBtn = document.getElementById('sfx-toggle');
if (sfxBtn) sfxBtn.addEventListener('click', () => {
  import('./audio.js').then(({ toggleSFX }) => toggleSFX());
});
```

---

### MOD-10：data/ambient.js（可选）— 氛围音数据定义

如果项目希望将氛围音定义放在数据层而非硬编码在 audio.js 中：

```js
// data/ambient.js —— 氛围音定义数据（可被外部引用）
export const AMBIENT_POOL = [
  { key: 'writing',    name: '🖋️ 羽毛笔',   price: 0,   defaultUnlock: true },
  { key: 'fireplace',  name: '🔥 壁炉火',    price: 800 },
  { key: 'library',    name: '📚 图书馆',   price: 1000 },
  { key: 'rain_light', name: '🌧️ 轻雨',     price: 600 },
  { key: 'thunder',    name: '⛈️ 雷雨',     price: 800 },
  { key: 'birds',      name: '🐦 鸟鸣',      price: 500 },
  { key: 'cafe',       name: '☕ 咖啡馆',    price: 600 },
  { key: 'ocean',      name: '🌊 海浪',      price: 500 }
];

export const AMBIENT_FILE_MAP = {
  writing:    'audio/ambient/ambient_writing.mp3',
  fireplace:  'audio/ambient/ambient_fireplace.mp3',
  library:    'audio/ambient/ambient_library_silent.mp3',
  rain_light: 'audio/ambient/ambient_rain_light.mp3',
  thunder:    'audio/ambient/ambient_thunderstorm.mp3',
  birds:      'audio/ambient/ambient_birds.mp3',
  cafe:       'audio/ambient/ambient_cafe.mp3',
  ocean:      'audio/ambient/ambient_ocean.mp3'
};
```

> ⚠️ 此文件为可选项。如果 `audio.js` 中的 `AMBIENT_DEFS` 已足够满足需求，可跳过此文件。

---

## 阶段三：实施顺序建议

```
第一步（独立工作，无需其他改动）：
  1. 创建 audio/sfx/ 目录，准备 8 个短音效文件
  2. 创建 audio/ambient/ 目录，准备 AMB-01（writing）文件
  3. 改造 audio.js（完全替换）

第二步（基于 audio.js 完成）：
  4. 修改 state.js（新增 ambientType + unlockedAmbients）
  5. 修改 achievements.js（接入 playSFX）
  6. 修改 app.js（接入所有事件音效）
  7. 修改 shop.js（接入 purchase 音效 + 新增 purchaseAmbient）

第三步（基于逻辑层完成）：
  8. 修改 timer.js（接入 start/stop/pause/resumeAmbient）
  9. 修改 index.html（新增 sfx-toggle 按钮）
  10. 修改 render/focus.js（新增氛围音选择器）
  11. 修改 render/shop.js（新增氛围音商店区）

第四步（素材补充）：
  12. 下载/购买 AMB-02~08 氛围音文件，放入 audio/ambient/
  13. 音量平衡调优（SFX_VOLUME、AMBIENT_VOLUME 数值微调）
```

---

## 附录：调试检查清单

完成实施后，逐一验证以下场景：

- [ ] 专注开始 → 氛围音（壁炉声）是否自动响起？
- [ ] 专注结束 → 氛围音是否淡出停止？
- [ ] 专注暂停 → 氛围音是否淡至低音量？
- [ ] 专注继续 → 氛围音是否快速淡回？
- [ ] 完成一本书 → 书籍完成音效是否响起？
- [ ] 解锁新章节 → 章节解锁音效是否响起？
- [ ] 解锁新成就 → 成就音效是否响起？
- [ ] 访客到来 → 访客到来音效是否响起？
- [ ] 购买升级 → 购买成功音效是否响起？
- [ ] 氛围阶段升级 → 氛围升级音效（延迟0.8s后）是否响起？
- [ ] 音效开关 🔔/🔕 → 音效是否正常切换？
- [ ] 音乐开关 🔈/🔇 → 音乐是否正常切换？
- [ ] 两个开关独立工作，互不影响
- [ ] 音效/音乐状态在页面刷新后保持正确
- [ ] 移动端 Safari：首次点击后音效是否正常播放
