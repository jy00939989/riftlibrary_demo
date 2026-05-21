# 音效系统设计规划

**文件状态**：规划中，待审核
**最后更新**：2026-05-15
**作者**：WorkBuddy AI

---

## 一、现状分析

### 现有音频架构

`js/audio.js` 只负责一件事：**氛围 BGM**（三层曲目 × 2变奏 + 交叉淡入淡出）。

```
audio/
├── 图书馆 demo 荒废图书馆 2.mp3
├── 图书馆 demo 荒废图书馆 2 (1).mp3
├── 图书馆 demo2 城镇风格.mp3
├── 图书馆 demo2 城镇风格 (1).mp3
├── 图书馆 demo 星辰图书馆.mp3
├── 图书馆 demo 星辰图书馆 (1).mp3
└── 异世界图书馆宣传PV.mp4
```

**问题**：完全没有音效（SFX），所有重要时刻都"静悄悄"的。

---

## 二、设计目标

> **让每一次交互都有声音回应，让重要时刻有情感共鸣。**

### 音效风格定位

与现有视觉风格（羊皮纸/魔法/古风书馆）匹配，**古典书卷、古典图书馆气息**为主调：

| 属性 | 定位 |
|------|------|
| 音色 | 古典书卷、羽毛笔翻页、墨水封印、壁炉书斋，偶尔带魔法微光 |
| 时长 | 短音效 0.3~1.5s，长音效 1~3s |
| 响度 | 适中偏轻，不抢 BGM 风头（主音量 30~50%） |
| 类型 | 自然拟音为主，魔法感点缀 |
| 素材来源 | 免费素材站为主 + 少量付费商用素材补充 |

### 音效总线设计（音量架构）

```
┌─────────────────────────────────────┐
│        总输出音量 (masterVol)        │  ← 用户可调，范围 0~1，默认 0.6
├─────────────────────────────────────┤
│  BGM Bus    (权重 50%)  ← 氛围音乐   │
│  SFX Bus    (权重 80%)  ← 游戏音效   │
│  UI Bus     (权重 60%)  ← 界面反馈   │
└─────────────────────────────────────┘
```

---

## 三、音效事件清单（8个场景）

### 🔊 SFX-01：成就解锁
| 属性 | 说明 |
|------|------|
| 触发时机 | `checkAchievements()` 检测到新成就时 |
| 调用位置 | `showAchievementBatch()` / `showAchievementToast()` |
| 音效描述 | 古籍封印解除的清脆声 + 羽毛笔落定的高音（如卷轴展开、魔法印章激活） |
| 情绪 | 喜悦、认可、正向激励 |
| 备选名 | achievement_unlock.mp3 |

### 🔊 SFX-02：书籍完成（誊抄完毕）
| 属性 | 说明 |
|------|------|
| 触发时机 | 专注完成后，`bookState.status === 'completed'` 时 |
| 调用位置 | `handleCompleteFocus()` → `handlePostFocusEffects()` → `showBookCompleteAnimation()` |
| 音效描述 | 翻页结束的落定声 + 书页合上的厚重感 + 魔法光效的细碎高音 |
| 情绪 | 成就感、满足感、阶段里程碑 |
| 备选名 | book_complete.mp3 |

### 🔊 SFX-03：章节解锁
| 属性 | 说明 |
|------|------|
| 触发时机 | 章节解锁动画 `showUnlockAnimation()` 触发时 |
| 调用位置 | `handlePostFocusEffects()` 章节解锁分支 |
| 音效描述 | 羽毛笔落定 + 墨水滴落的清脆声（轻微） |
| 情绪 | 递进的愉悦，比书籍完成轻一点 |
| 备选名 | chapter_unlock.mp3 |

### 🔊 SFX-04：访客到来
| 属性 | 说明 |
|------|------|
| 触发时机 | `spawnVisitor()` 成功创建访客时 |
| 调用位置 | `handleCompleteFocus()` 访客生成分支，或访客循环 tick |
| 音效描述 | 古书翻动声 + 轻微的风铃声（书斋气质，不要真的门铃） |
| 情绪 | 好奇、期待、意外惊喜 |
| 备选名 | visitor_arrive.mp3 |

### 🔊 SFX-05：购买装潢/升级
| 属性 | 说明 |
|------|------|
| 触发时机 | 借阅区升级 / 缮写室升级 / 购买书架 / 购买书籍 成功后 |
| 调用位置 | `upgradeBorrowLevel()` / `upgradeFocusLevel()` / `handleBuyShelf()` / `purchaseBook()` |
| 音效描述 | 金币落入钱袋的清脆声 + 古老装置（书架、滑轨）激活的嘎吱声 |
| 情绪 | 投入有回报、升级的满足感 |
| 备选名 | purchase_success.mp3 |

### 🔊 SFX-06：氛围阶段升级
| 属性 | 说明 |
|------|------|
| 触发时机 | `addAtmosphere()` 导致氛围值跨越阶段阈值时（废墟→破败→陈旧→温暖→星辰） |
| 调用位置 | `app.js` 中氛围阶段变化检测后触发（不在 storage.js 中直接触发） |
| 音效描述 | 空灵的风铃声 + 魔法封印渐次解除的层次音（略庄重，1~2s） |
| 情绪 | 里程碑式的庄重感，标志着图书馆进入新阶段 |
| 备选名 | atmosphere_level_up.mp3 |

### 🔊 SFX-07：访客还书（含事件）
| 属性 | 说明 |
|------|------|
| 触发时机 | `collectReturn()` 收取还书时 |
| 调用位置 | `handleCollectReturn()` |
| 音效描述 | 书页翻动 + 羽毛笔沙沙声（如果触发了访客事件则附加墨水封印声） |
| 情绪 | 平和的满足，事件奖励时的附加喜悦 |
| 备选名 | visitor_return.mp3 |

### 🔊 SFX-08：按钮点击（UI反馈）
| 属性 | 说明 |
|------|------|
| 触发时机 | 关键操作按钮点击（开始专注、完成、购买确认等） |
| 调用位置 | 统一在 `render/common.js` 的 `setActions()` 或各渲染模块的按钮事件中注入 |
| 音效描述 | 极轻的羽毛笔点击声或墨水滴（古典书斋触感，不能抢戏） |
| 情绪 | 轻量反馈，让交互有触感 |
| 备选名 | ui_click.mp3 |

---

## 四、架构设计

### 文件结构

```
audio/
├── 氛围BGM/                    ← 现有文件，保持不动
│   ├── 图书馆 demo 荒废图书馆 2.mp3
│   └── ...
├── sfx/                        ← 新增音效目录
│   ├── achievement_unlock.mp3
│   ├── book_complete.mp3
│   ├── chapter_unlock.mp3
│   ├── visitor_arrive.mp3
│   ├── purchase_success.mp3
│   ├── atmosphere_level_up.mp3
│   ├── visitor_return.mp3
│   └── ui_click.mp3
└── ...                         ← 现有文件

js/
├── audio.js                    ← 改造：保留 BGM，新增 SFX 引擎
└── sfx.js                      ← 新增：音效播放模块（如果 audio.js 改造较大则独立）
```

### 两种方案对比

#### 方案 A：改造现有 `audio.js`（推荐）

```
audio.js 改造成：

// === BGM 部分（保留）===
function playCurrentTier() { ... }
export function refreshBGM() { ... }
export function toggleMusic() { ... }

// === SFX 部分（新增）===
const SFX_VOLUME = 0.7; // 音效默认音量

const SFX = {
  achievement: 'audio/sfx/achievement_unlock.mp3',
  bookComplete: 'audio/sfx/book_complete.mp3',
  chapterUnlock: 'audio/sfx/chapter_unlock.mp3',
  visitorArrive: 'audio/sfx/visitor_arrive.mp3',
  purchase: 'audio/sfx/purchase_success.mp3',
  atmosphereUp: 'audio/sfx/atmosphere_level_up.mp3',
  visitorReturn: 'audio/sfx/visitor_return.mp3',
  uiClick: 'audio/sfx/ui_click.mp3'
};

export function playSFX(key) {
  if (!sfxEnabled) return;
  const audio = new Audio(SFX[key]);
  audio.volume = SFX_VOLUME * masterVolume;
  audio.play().catch(() => {}); // 静默失败
}

export function toggleSFX() { ... }  // 可选：音效开关
```

**优点**：一个模块管所有音频，与现有架构一致
**缺点**：文件略增长（约 +50 行）

#### 方案 B：新建 `js/sfx.js`（独立）

将所有 SFX 相关逻辑拆分到独立文件，`audio.js` 保持纯净。

**优点**：职责更分离
**缺点**：引入新的模块依赖，需要在 `app.js` 中同时引入两个音频模块

### 推荐方案 A，原因：
1. `audio.js` 当前只有 104 行，改造后约 150 行，完全可控
2. 不增加新文件，符合项目"够用就好"的原则
3. SFX 和 BGM 共用音量控制逻辑，放一起更合理

---

## 五、集成接入点（代码修改位置）

### SFX-01 成就解锁
**文件**：`js/achievements.js` 或 `js/render/achievements.js`

在 `showAchievementToast()` 或 `showAchievementBatch()` 调用时触发：

```js
// achievements.js 顶部
import { playSFX } from './audio.js';

// 在检测到新成就时（约 line 214）
if (unlock(ach.id)) {
  playSFX('achievement');
  newlyUnlocked.push(ach);
}
```

### SFX-02 书籍完成
**文件**：`js/app.js` → `handlePostFocusEffects()`

```js
// 书籍完成动画前（约 line 249）
if (bookCompleted) {
  playSFX('bookComplete');
  // ... showBookCompleteAnimation ...
}
```

### SFX-03 章节解锁
**文件**：`js/app.js` → `handlePostFocusEffects()`

```js
// 章节解锁动画前（约 line 238）
if (unlockedChapter) {
  playSFX('chapterUnlock');
  // ... showUnlockAnimation ...
}
```

### SFX-04 访客到来
**文件**：`js/visitors.js` → `spawnVisitor()`，或 `js/app.js` → `handleCompleteFocus()`

在访客卡片展示时触发（`showVisitorArrivalCard()`）：

```js
// app.js showVisitorArrivalCard 函数末尾
playSFX('visitorArrive');
```

### SFX-05 购买装潢
**文件**：`js/shop.js`

```js
import { playSFX } from './audio.js';

// upgradeBorrowLevel() 成功后（约 line 161）
playSFX('purchase');

// upgradeFocusLevel() 成功后（约 line 184）
playSFX('purchase');
```

### SFX-06 氛围升级
**文件**：`js/storage.js` → `addAtmosphere()`

```js
import { playSFX, checkAtmosphereTransition } from './audio.js';

// 在 addAtmosphere() 中
// 比较变化前后的阶段，触发升级音效
```

> ⚠️ **注意**：`addAtmosphere()` 是纯数据操作函数，不应依赖 DOM 或其他副作用。
> 建议在 `app.js` 中做氛围阶段变化的检测（检测新旧 atmosphere 值是否跨越阈值），而不是在 `storage.js` 中。

**更好的方案**：在 `handleCompleteFocus()`、`upgradeBorrowLevel()`、`upgradeFocusLevel()` 等所有调用 `addAtmosphere()` 的地方，传入 prevAtmosphere，由调用方判断是否触发音效。

### SFX-07 访客还书
**文件**：`js/app.js` → `handleCollectReturn()`

```js
// collectReturn() 成功后
playSFX('visitorReturn');
```

### SFX-08 UI 点击
**文件**：`js/render/common.js`

在关键按钮事件中注入，或直接在 `app.js` 的 actions 入口统一处理。

---

## 六、音效素材来源建议

### 免费音效素材站（需联网下载到本地）

| 站点 | 说明 |
|------|------|
| [Freesound](https://freesound.org) | 社区驱动，免费，可商用需注明作者 |
| [Pixabay 音效](https://pixabay.com/sound-effects/) | 免费可商用，无需注册 |
| [Mixkit](https://mixkit.co/free-sound-effects/) | 免费，无需署名 |

### 关键词建议

| 音效 | 英文关键词 |
|------|-----------|
| 成就 | game achievement, success chime, coin collect |
| 书籍完成 | book close, page flip, book magic |
| 章节解锁 | quill write, ink drop, magic sparkle |
| 访客 | page turn, bell soft, book open |
| 购买 | coin drop, purchase success |
| 氛围升级 | magic portal, wind chime, level up fanfare |
| 还书 | page rustle, book settle |
| UI点击 | soft click, pen tap |

### 如果需要定制（推荐方向）

> 由于游戏风格偏古风/魔法书卷，建议音效也要有统一风格。如果找不到现成素材，可以用 **bfxr.net**（在线 8-bit 音效生成器）做原型，或找懂音频的朋友录制羽毛笔/翻书/墨水等拟音。

---

## 七、附加建议：音效开关

与 BGM 开关类似，在右上角增加一个音效图标按钮：

```
当前：🔈 / 🔇  控制 BGM
建议：增加一个 🔔 / 🔕  控制 SFX
```

**实现**：在 `audio.js` 中新增 `sfxEnabled` 状态（默认 true），持久化到 `localStorage`。

---

## 八、里程碑与优先级

| 优先级 | 阶段 | 内容 | 工作量 |
|--------|------|------|--------|
| P0 | 核心集成 | 改造 `audio.js`，接入所有触发点 | ~2小时 |
| P0 | 音效素材 | 下载/录制 8 个音效文件 | ~1小时 |
| P1 | 细节打磨 | 音效开关 UI、音量平衡调优 | ~30分钟 |
| P2 | 进阶音效 | 背景白噪音（翻书声、风声）循环 | 可选 |

---

## 九、架构合理性评估

### ✅ 合理的部分

- **与现有架构完全一致**：遵循"纯逻辑模块不碰 DOM"原则，SFX 触发在逻辑层，播放由 `audio.js` 统一管理
- **复用现有模式**：参考 `toggleMusic()` 的开关 + 持久化模式
- **低侵入性**：每个触发点改动不超过 2 行代码
- **失效安全**：`audio.play().catch(() => {})` 确保音效失败不影响游戏流程

### ⚠️ 需要注意的地方

1. **音效与 BGM 音量平衡**：需要在实际游戏中反复调校 SFX_VOLUME 初始值（建议从 0.5 开始）
2. **移动端兼容性**：移动端 Safari 对自动播放音频有限制，建议 SFX 也在用户首次点击后解锁（与 BGM 同样逻辑）
3. **不要在同一次专注结算中同时触发太多音效**：`bookComplete` + `chapterUnlock` + `achievement` + `atmosphereUp` 可能挤在一起，建议音效队列错开 200~500ms
4. **SFX-06 氛围升级的触发时机**：建议在 `addAtmosphere()` 调用方（app.js / shop.js）中做阶段变化检测，而不是在数据层直接触发播放

---

## 十、用户确认事项（✓ 已确认）

- ✅ **风格偏好**：古典书卷、古典图书馆气息为主（羽毛笔、墨水、古籍、壁炉、书斋感）
- ✅ **音效开关**：需要独立音效开关（🔔/🔕），可与BGM开关（🔈/🔇）分开控制
- ✅ **素材来源**：免费素材站为主 + 少量付费商用素材补充
- ✅ **时间要求**：无时间压力，项目owner按自己节奏推进即可

## 十一、最终确认（✓ 已确认）

- **氛围音 AMB-01（羽毛笔/抄书声）**：免费，默认开启，每次专注自动播放
- **氛围音 AMB-02~08**：在位面商店中购买解锁，解锁后永久使用

> 💡 **设计意图**：氛围音购买机制本身是一种留存激励——玩家为了解锁壁炉火声、图书馆寂静等新声音而持续专注，与现有的书籍购买、设施升级形成互补的经济循环。

---

*以下为可直接执行的代码指令文件（`MODIFY_AUDIO_SYSTEM.md`），包含完整的文件变更清单和代码片段。*

---

# 附录：沉浸式白噪音系统（专注氛围音）

## 定位

与前述 8 个短音效（SFX）完全不同的另一条音频线——**长循环沉浸背景音**。专注时播放，专注结束淡出停止。与BGM形成有趣的互动：可选择"BGM降为背景+白噪音主导"，或"BGM静音+白噪音独奏"。

---

## 场景定位

| 属性 | 说明 |
|------|------|
| 时长 | 3~10分钟无缝循环（用户感觉不到断点） |
| 音量 | 低于BGM（白噪音为主，BGM为辅） |
| 播放时机 | 仅专注期间 |
| 切换方式 | 专注开始时启动 / 专注结束或切换时淡出 |
| 用户控制 | 专注页可选白噪音类型（默认关闭） |

---

## 音效类型清单

| # | 类型 | 英文关键词 | 氛围描述 | 文件名建议 |
|---|------|-----------|----------|-----------|
| AMB-01 | 🖋️ **羽毛笔/抄书声** | quill pen scratching, paper rustling | 古典书卷气息，抄书感最强 | ambient_writing.mp3 |
| AMB-02 | 🔥 **壁炉火声** | fireplace crackling | 温暖、安全感、冬夜氛围 | ambient_fireplace.mp3 |
| AMB-03 | 🌧️ **雨声（轻）** | gentle rain on window | 宁静、专注、沉思感 | ambient_rain_light.mp3 |
| AMB-04 | ⛈️ **雷雨声** | thunderstorm, rain and thunder | 紧张感、戏剧性，适合有挑战的任务 | ambient_thunderstorm.mp3 |
| AMB-05 | 🐦 **鸟叫声** | forest birds singing, morning birds | 明亮、户外、春天感 | ambient_birds.mp3 |
| AMB-06 | ☕ **咖啡馆白噪音** | coffee shop ambient, cafe murmur | 轻微人声+咖啡馆背景，适合创意工作 | ambient_cafe.mp3 |
| AMB-07 | 🌊 **海浪声** | ocean waves, seaside | 空旷、放松，适合休息性专注 | ambient_ocean.mp3 |
| AMB-08 | 📚 **图书馆寂静** | library ambience, quiet book | 翻书声+轻微脚步，极度专注感 | ambient_library_silent.mp3 |

> **推荐优先级**（基于游戏风格匹配度）：
> 🔥 壁炉火声 > 🖋️ 羽毛笔 > 📚 图书馆寂静 > 🌧️ 轻雨声 > ⛈️ 雷雨声
> 鸟叫声和咖啡馆人声偏现代，与古风书馆氛围稍远，建议作为进阶补充。

---

## 架构设计

### 文件结构

```
audio/
├── sfx/                           ← 短音效（SFX）
│   ├── achievement_unlock.mp3
│   └── ...
├── ambient/                       ← 新增长循环氛围音
│   ├── ambient_writing.mp3        ← 羽毛笔/抄书声
│   ├── ambient_fireplace.mp3      ← 壁炉火声
│   ├── ambient_rain_light.mp3     ← 轻雨声
│   ├── ambient_thunderstorm.mp3   ← 雷雨声
│   ├── ambient_birds.mp3          ← 鸟叫声
│   ├── ambient_cafe.mp3           ← 咖啡馆
│   ├── ambient_ocean.mp3          ← 海浪声
│   └── ambient_library_silent.mp3 ← 图书馆寂静
└── ...                            ← 现有BGM不动
```

### 音频总线（完整版）

```
┌─────────────────────────────────────────────┐
│          总输出音量 (masterVol)               │
├──────────────┬──────────────┬────────────────┤
│  BGM Bus     │  Ambient Bus │  SFX Bus       │
│  权重 50%    │  权重 70%    │  权重 80%      │
│  （始终循环） │  （专注时播放）│  （事件触发）  │
└──────────────┴──────────────┴────────────────┘

专注时两种模式：
  模式 A（叠加）：BGM音量降至30%，Ambient音量50%，两者同时播放
  模式 B（独奏）：BGM静音，Ambient音量60%独自播放
```

### 切换逻辑

```
专注开始 (startTimer)
  ↓
读取用户设置：ambientType（null = 关闭）
  ↓ 有设置
启动 ambientAudio（淡入 1s，音量 = ambientVol × masterVol）
  ↓ BGM设置
若 mode === 'overlay'：BGM 音量降至 30%
若 mode === 'solo'：BGM 暂停，Ambient 独立播放
  ↓
专注中（持续循环）
  ↓
暂停专注 (togglePauseTimer)
  ↓
Ambient 淡出至 30%，保持低音量背景（恢复时快速淡回）
  ↓
专注结束 (stopTimer)
  ↓
Ambient 淡出停止（1s），BGM 音量恢复
```

---

## 与BGM/专注的协同关系

| 场景 | BGM | Ambient | 说明 |
|------|-----|---------|------|
| 非专注状态 | ✅ 正常播放 | ❌ | 正常氛围音乐 |
| 专注-叠加模式 | ✅ 降至30% | ✅ 50% | 最推荐的沉浸方案 |
| 专注-独奏模式 | ❌ 静音 | ✅ 60% | 追求纯粹抄书感 |
| 专注-关闭 | ✅ 正常播放 | ❌ | 保留BGM体验 |
| 暂停专注 | ✅ 恢复100% | ✅ 淡至10% | 轻微背景，提示专注被暂停 |

---

## 专注页UI设计建议

在 `render/focus.js` 的模式选择器旁边，添加"氛围音"选择器：

```
┌─────────────────────────────────────────────┐
│ 选择氛围音                                    │
├─────────────────────────────────────────────┤
│ 🔇 关闭  │ 🔥 壁炉  │ 🖋️ 抄书  │ 🌧️ 轻雨     │
│ ⛈️ 雷雨  │ 🐦 鸟鸣  │ ☕ 咖啡馆 │ 🌊 海浪     │
└─────────────────────────────────────────────┘
```

选中的类型保存在 `state.focus.ambientType`（持久化），下次专注自动恢复。

---

## 集成接入点

| 操作 | 文件 | 代码位置 |
|------|------|----------|
| 专注开始启动 | `js/timer.js` → `startTimer()` | 函数末尾调用 `startAmbient()` |
| 专注结束停止 | `js/timer.js` → `stopTimer()` | 函数内调用 `stopAmbient()` |
| 暂停/继续切换 | `js/timer.js` → `togglePauseTimer()` | 调用 `pauseAmbient()` / `resumeAmbient()` |
| UI选择器渲染 | `js/render/focus.js` | 新增 `renderAmbientSelector()` |

### timer.js 接入示例

```js
// timer.js
import { startAmbient, stopAmbient, pauseAmbient, resumeAmbient } from './audio.js';

export function startTimer() {
  // ... 现有逻辑 ...
  startAmbient(state.focus.ambientType);
}

export function togglePauseTimer() {
  // ... 现有逻辑 ...
  if (state.currentSession.paused) {
    pauseAmbient();
  } else {
    resumeAmbient();
  }
}

function stopTimer() {
  // ... 现有逻辑 ...
  stopAmbient();
}
```

---

## 素材获取建议

### 免费素材站（支持CC0/免费商用）

| 站点 | 特点 | 推荐搜索词 |
|------|------|-----------|
| [Pixabay 音效](https://pixabay.com/sound-effects/) | 免费可商用，无需署名 | fireplace, rain loop, birds forest |
| [Freesound](https://freesound.org) | 社区素材，需查看CC许可 | quill writing, thunderstorm loop |
| [Mixkit](https://mixkit.co/free-sound-effects/) | 免费，无需署名 | rain, thunder, cafe |
| [Zapsplat](https://zapsplat.com) | 部分免费，需注册 | 需筛选免费标签 |

### 素材处理要点

1. **无缝循环**：下载后需用 Audacity 或在线工具裁剪，确保结尾与开头电平一致，拼接不断点
2. **音量归一化**：所有 ambient 文件统一调整到 -3dB 左右，避免大小不一
3. **时长**：3~5分钟最佳（用户体验不到循环节点，又不会太长导致文件过大）
4. **格式**：统一转为 MP3 192kbps，兼容性好且文件适中

### 无缝循环处理工具

- **Audacity**（免费）：选结尾1秒 → 选开头1秒 → 交叉淡化（Ctrl+Shift+M）
- **mp3wrap**（命令行）：合并多个mp3为无缝循环
- **在线工具**：audiotrimmer.com、clideo.com

---

## 进阶功能（可选）

| 功能 | 说明 |
|------|------|
| Ambient + BGM 混合强度 | 用户可调节专注时BGM降到多少%（10%~50%） |
| 定时切换 | 专注超过30分钟后，自动从"轻雨"切换为"雨停+鸟鸣" |
| 随机变化 | 同一ambient有2个变奏（如2个不同壁炉音效），每天随机切换 |
| 环境音效叠加 | 用户可同时开壁炉+轻雨（两个ambient混合播放） |

---

## 与主音效系统（SFX-01~08）的关系

```
┌──────────────────────────────────────────────────┐
│                    audio.js                       │
│  ┌─────────────────┐  ┌────────────────────────┐  │
│  │ BGM 引擎         │  │ SFX 引擎               │  │
│  │ (已有)           │  │ playSFX(key)          │  │
│  │ playCurrentTier  │  │ 8个短音效              │  │
│  └─────────────────┘  └────────────────────────┘  │
│                    ┌────────────────────────────┐  │
│                    │ Ambient 引擎（新增）       │  │
│                    │ startAmbient(type)         │  │
│                    │ stopAmbient()             │  │
│                    │ pauseAmbient()            │  │
│                    │ 8个长循环氛围音            │  │
│                    └────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

三者完全独立播放，互不干扰：
- BGM：始终循环（氛围音乐）
- Ambient：专注时播放（沉浸背景音）
- SFX：事件触发（短音效）

---

*本规划待用户确认后，可生成具体的代码修改指令文件（类似 CHANGELOG_2026-05-15.md 的 `MODIFY_AUDIO_SYSTEM.md`）供执行。*
