# 评审：音乐 / 音效 / 环境音 播放链路（开关与音量调整异常）

> 状态：**待开发二审（v1.1 修订版）**
> 版本：v1.1（2026-08-01，采纳克克复核 + 架构师补充修正）
> 评审人：架构师（初评） / 克克（复核）
> 适用范围：异世界图书馆 / 归墟图书馆
> 评审依据：用户反馈"音乐的开关和调整总是有问题"
> 涉及文件：`js/audio.js`、`js/ambient.js`、`js/render/music-selector.js`、`js/settings.js`、`js/storage.js`、`js/app.js`

---

## 一、综述

核心模块职责清晰（`audio.js` 管 BGM+SFX、`ambient.js` 管环境音、`music-selector.js` 管 UI、`settings.js`/`storage.js` 管持久化与氛围），**单个函数没有写错**。用户感知的"开关坏了 / 调不动"，根因在**跨模块触发逻辑互相打架** + **淡入淡出状态的共享变量管理脆弱**，而不是某个算法错误。

把"开关"和"调整"两条线分开看：

- **开关异常** ≈ `P0-1`（氛围一变动 → 自动模式随机重播）+ `P1-1`（回头客首点按钮反而关掉音乐）。
- **调整异常** ≈ `P1-2`（淡入期 1.2s 内拖音量被定时器覆写）。

最该先修的是 `P0-1`——它是高频触发（每次还书、每次专注完成都会加氛围）的硬伤，体感上就是"音乐自己乱跳/重启"。

---

## 二、问题清单（按严重度）

### 🔴 P0 — 高频触发，直接造成"开关坏了"的体感

#### P0-1：氛围一变，自动模式下 BGM 随机重播

**位置**
- `js/storage.js:51` `addAtmosphere()` 每次氛围变动都调 `refreshBGM()`
- `js/audio.js:170-177` `refreshBGM()` 自动分支走 `playTrack(null)`
- `js/audio.js:118` `playTrack(null)` 内部 `pick(getAvailableTracks())` **随机选一首**
- `js/audio.js:121` `playTrack` 的防重播守卫只在"随机恰好选中当前曲"时跳过，概率约 1/N

**问题**
还书、专注完成等都会 `addAtmosphere`（app.js:274/328/692/742/1364），每次氛围变动都触发 `refreshBGM()`。自动模式下它重新随机选曲并淡入——守卫只在"恰好选中同一首"时才跳过，所以**大概率切到另一首并重新淡入**。玩家体感：音乐自己乱跳、重启 = "开关有问题"。

**修法（`refreshBGM` 自动分支，已合并 P2-2 的"暂停后恢复"语义）**

> 初版评审的修法用了 `!currentAudio.paused` 判断"当前是否仍在播放"，但专注完成后 `app.js:170` 会调用 `pauseMusic()` 使 `currentAudio.paused === true`，于是后续任何 `addAtmosphere` 触发的 `refreshBGM` 都会因"不打断条件不成立"而重新随机切歌——正好和 P2-2 的诉求相反。下方合并修法改用 `currentTrackId` 判定有效性，暂停时恢复而非重选，一次解决两个问题（采纳克克复核点 2）。

```javascript
export function refreshBGM() {
  if (!isMusicOn()) return;
  const manualId = state.musicManualTrack;
  if (manualId) {
    playTrack(manualId);                 // 手动模式：已设守卫，不改
  } else {
    // 自动模式：当前曲目仍有效就不打断；若处于暂停则恢复，而非重选
    const stillValid = currentTrackId && getAvailableTracks().some(t => t.id === currentTrackId);
    if (stillValid) {
      if (currentAudio && currentAudio.paused) resumeMusic();
      return;
    }
    playTrack(null);
  }
}
```
> 手动模式（`musicManualTrack` 已设）本就有守卫，不受影响。此修法只约束自动模式的"无谓重播 + 暂停后乱切"。

---

### 🟠 P1 — 特定玩家 / 特定操作下的开关与音量异常

#### P1-1：回头客第一次点音乐按钮，反而把音乐关了

**位置**
- `js/app.js:1327-1330` 初始化阶段对 `totalMinutes > 0` 的回头客调用 `onFirstInteraction()`（**没有任何用户手势**）
- `js/audio.js:237-249` `onFirstInteraction` 内部 `next.play().catch(...)`（audio.js:154-160）被浏览器自动播放策略拦截 → 清空 `currentAudio`/`currentTrackId`，但 `musicEnabled` 仍为 `true`
- `js/app.js:1212-1216` 全局 `document` 点击监听器 `activateAudio` 会在首次点击时调 `onFirstInteraction()`
- `js/app.js:1310` 音乐按钮 `musicBtn` 的 click 绑定 `toggleMusic`

**问题**
初始化阶段那次 `onFirstInteraction()` 因无手势被浏览器拦截（audio.js:154-160 的 `.catch` 清空 `currentAudio`/`currentTrackId`，但 `musicEnabled` 仍为 `true`），留下"设置里是开、实际没声音"的幽灵开启态。但**单纯删除这段并不能完全修好**，因为还有第二层冲突：

- `toggleMusic`（audio.js:199）用 `const wasOn = isMusicOn();` 判定——它读的是持久化的 `musicEnabled`（回头客为真），**不是"此刻是否真在播"**。
- `app.js:1212-1216` 在 `document` 上挂了 `activateAudio` 监听器：任意首次点击都会冒泡到它并调 `onFirstInteraction()` 来播 BGM。
- 事件冒泡顺序：点 `musicBtn` 时，**按钮自身的 click 先于 document 冒泡触发**。于是回头客第一次点音乐按钮的完整时序是：

```
1. musicBtn click → toggleMusic：wasOn = isMusicOn() = true → nowOn = false
   → setSetting('musicEnabled', false) → 进入"关闭"分支，暂停（当前无音频，空操作）
2. 同一事件冒泡到 document → activateAudio → onFirstInteraction()
   → 此刻 isMusicOn() 已是 false → playTrack 直接 return
3. 最终：点一下，音乐从"幽灵开启"变成"真的关闭"，需再点一下才开。
```

注意：若回头客的**第一次手势落在别处**（不是音乐按钮），`activateAudio` 会正常播起音乐，之后音乐按钮当普通开关用没问题。所以 bug 的精确触发条件是"**回头客、且其首个手势恰好点在音乐按钮上**"——这是完全正常的玩家路径，必须修。

**修法（两步，缺一不可）**

① 删除初始化期那段幽灵开启（必要但不充分）：
```javascript
  // 删掉 js/app.js:1327-1330
  // 回头客自动播放BGM+SFX，新用户等首次专注完成后触发
  // if (state.focus.totalMinutes > 0) { onFirstInteraction(); }
```

② **关键修复**：`toggleMusic` 应基于"此刻是否真在播"而非持久化的 `musicEnabled` 来判定 `wasOn`。这样幽灵开启态（enabled 但没在播）会被当成"关"，首点即开启：
```javascript
export function toggleMusic() {
  // 以"实际播放状态"判定，而非持久化的 musicEnabled
  // （否则 enabled 但被浏览器拦截未播放的幽灵态，首点会被误判为"要关"）
  const wasOn = !!(isMusicOn() && currentAudio && !currentAudio.paused);
  const nowOn = !wasOn;
  setSetting('musicEnabled', nowOn);
  updateToggleIcon();
  updateNowPlayingUI();
  if (nowOn) {
    const manualId = state.musicManualTrack;
    playTrack(manualId || null);     // 此刻是用户手势，play() 可成功
  } else {
    /* 现有关闭逻辑不变 */
  }
}
```
配合 ① 后，回头客首点音乐按钮：toggleMusic 见 `currentAudio` 为空 → `wasOn=false` → `nowOn=true` → `playTrack` 成功播起；随后冒泡的 `activateAudio` 调 `onFirstInteraction` → `playTrack` 被 `currentTrackId===actualDef && !paused` 守卫跳过，不会双播。**一次点击即开启**。

> 采纳克克复核点 5/6 的事件链描述，但其"删除 1327-1330 即可"的修法判断**不充分**——本修正补上了 `toggleMusic` 这层才是根治。

#### P1-2：拖动音量时，淡入期 1.2s 内调不动

**位置**
- `js/audio.js:116` `playTrack` 在淡入开始时**一次性捕获** `const musicVolume = getMusicVolume()`
- `js/audio.js:139-149` 淡入定时器每步朝这个**旧值**逼近（line 141-142）
- `js/audio.js:77-82` `setMusicVolume` 把 `currentAudio.volume` 改为新值

**问题**
淡入进行中（约 1.2s）你拖音量滑块 → `setMusicVolume` 改了 `currentAudio.volume`，但下一帧定时器又把它覆写回开头捕获的旧值，直到淡入结束。玩家体感："音量滑块不听使唤 / 有延迟"。

**修法（淡入定时器每步读实时音量）**
```javascript
fadeTimer = setInterval(() => {
  step++;
  const v = getMusicVolume();                       // 每步读实时值
  old.volume   = Math.max(0, v - step * (v / 10));
  next.volume  = Math.min(v, step * (v / 10));
  if (step >= 10) {
    clearInterval(fadeTimer);
    old.pause();
    old.src = '';
    if (fadingAudio === old) fadingAudio = null;
  }
}, 120);
```

---

### 🟡 P2 — 健壮性（迟早会咬人，建议一并修）

#### P2-1：淡入重叠会泄漏音频对象

**位置** `js/audio.js:21` `let fadeTimer = null`（全局单变量）；`js/audio.js:138` 再次 `playTrack` 时只 `clearInterval(fadeTimer)` 停掉旧定时器。

**问题**
若 1.2s 内又触发一次 `playTrack`（氛围连变 / 连点曲目），`clearInterval(fadeTimer)` 停下旧定时器，但旧 `old` 音频的 `old.pause()/old.src=''`（audio.js:145-146）**再也不会执行**——它静音（音量已到 0）却没释放，长期累积占用 AudioContext。

**修法（`playTrack` 开头强制释放上一轮 fading 音频）**
```javascript
export function playTrack(trackId) {
  if (!isMusicOn()) { /* ... */ return; }
  // 释放上一轮尚未结束的淡出音频，避免泄漏
  if (fadingAudio) {
    try { fadingAudio.pause(); fadingAudio.src = ''; } catch (e) {}
    fadingAudio = null;
  }
  clearInterval(fadeTimer);
  fadeTimer = null;
  // ... 既有逻辑
}
```

#### P2-2：`playTrack` 守卫依赖 `!currentAudio.paused`，暂停后会被误判 —— **已并入 P0-1**

> 本问题在 v1.1 中已与上方的 `refreshBGM` 修法合并解决（改用 `currentTrackId` 判定有效性 + 暂停时 `resumeMusic()`）。原 `js/audio.js:121` 的守卫 `if (actualDef.id === currentTrackId && currentAudio && !currentAudio.paused) return;` 仍保留用于"同曲已在播"的快速跳过，不改动。

**位置** `js/audio.js:121` `if (actualDef.id === currentTrackId && currentAudio && !currentAudio.paused) return;`
`js/audio.js:220-223` `pauseMusic()` 只 `currentAudio.pause()`（保留对象，不置空）

**问题（归档说明）**
专注完成后 `pauseMusic()`（app.js:170）暂停但保留 `currentAudio`。原 `refreshBGM` 自动分支用 `!currentAudio.paused` 判断是否"仍在播放"，导致 `paused === true` 时误判为"需重选"，从暂停曲淡出、重新随机播一首。合并修法已消除此路径。

#### P2-3：音量迁移可能产生 NaN（采纳克克复核点 1，修正原归因）

**位置** `js/render/music-selector.js:45-47` `Math.round(getMusicVolume() * 100)` 等
`js/settings.js:53-66` `LEGACY_SETTINGS` 迁移解析

**原文档归因有误（已修正）**
初版称"若 `getSettings()` 在 `initSettings()` 之前被调用，`musicVolume` 为 `undefined`"——**这是错的**。`getSettings()`（settings.js:78-81）内部已有 `load(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)` 兜底，且 `load` 在解析失败或 key 缺失时返回默认值，正常流程下不会产出 `undefined`。

**真正的 NaN 来源（克克复核点 1）**
`initSettings` 中遍历 `LEGACY_SETTINGS`（settings.js:53-66），对旧版音量 key（如 `library_music_volume`）取值后 `cfg.map(parsed)`。若旧存档里该值是非法字符串（非合法 JSON 数字），`safeParse` 失败或 `parseFloat` 得到 `NaN`，会**直接把 `NaN` 写进新 settings**，污染后续所有音量读取。

**修法（优先改迁移解析，兜底加在 UI）**
```javascript
// settings.js 迁移处
Object.entries(LEGACY_SETTINGS).forEach(([oldKey, cfg]) => {
  const oldValue = localStorage.getItem(oldKey);
  if (oldValue !== null) {
    const parsed = safeParse(oldValue);
    let value = parsed !== undefined ? parsed : oldValue;
    if (cfg.target.includes('Volume')) {
      value = parseFloat(value);
      if (!Number.isFinite(value)) value = DEFAULT_SETTINGS[cfg.target];  // 拦截 NaN
    }
    settings[cfg.target] = cfg.map(value);
    localStorage.removeItem(oldKey);
  }
});
```
`music-selector.js` 再补一层兜底作为第二道防线：`const musicVol = Math.round((getMusicVolume() || 0) * 100);`（此处 `(x || 0)` 仅防 undefined，拦不住已写入 settings 的 NaN，故主修复必须在 migration 层）。

#### P2-4：`playTrack` 入口过多，行为难推理

**位置** `playTrack` 被 `refreshBGM`（audio.js:174/176）、`selectTrack`、`setAutoMode`、`onFirstInteraction`（audio.js:243）、`toggleMusic`（开分支，约 audio.js:207）五处直接调用。

**问题**
多个入口各自带不同语义（随机 / 指定 / 恢复），且共享 `fadeTimer`/`fadingAudio`/`currentAudio` 等模块级状态，出 bug 时很难追溯是哪条路径触发的。

**修法（收口为一个 facade）**
新增 `startBgm(trackId?)` 作为唯一对外入口，内部统一处理"打断判定 + 淡入 + 状态清理"，其余调用点改为 `startBgm(...)`。这能把 `P0-1`/`P2-1`/`P2-2` 的修复收敛到一处，降低回归风险。

#### P2-5：环境音链路在初版评审中完全缺失（采纳克克复核点 4）

**位置** `js/ambient.js:74-79` `playAmbient`；`js/ambient.js:133-150` `setAmbientEnabled`

**问题（标题承诺了"环境音"但初版正文未审，此为补齐）**
- `playAmbient`（ambient.js:76-79）切换环境音时只 `currentAudio.pause(); currentAudio = null;`，**未清 `src`**。旧音频对象被暂停但未释放，长期切换会累积 `Audio` 实例（与 BGM 侧 P2-1 同源的泄漏）。
- `setAmbientEnabled(true)`（ambient.js:136-146）会**自动播放** `state.ambientSounds.current` 或第一个已解锁环境音。这与 BGM 侧"开始专注不自动播放、由用户手势激活"的设计方向是否一致，**需确认**（疑似不一致，环境音在用户未显式操作时也会响）。

**修法**
- `playAmbient` 切换分支补 `currentAudio.src = '';`：`if (currentAudio) { try { currentAudio.pause(); currentAudio.src = ''; } catch (e) {} currentAudio = null; }`。
- `setAmbientEnabled(true)` 的自动播放行为：若确认应"与 BGM 一致、需用户手势后才播放"，则改为只记录 `ambientEnabled` 状态、不立即 `playAmbient`，直到首个用户手势（可复用 `activateAudio` 同一激活时机）再播。

> 此节的发现直接支持克克复核点 4 的主张：标题写"环境音"就应当审环境音，否则架构师会误以为该链路已被覆盖。后续若做 P2-4 的 `startBgm` 收口，建议把环境音也纳入同一套"音频对象生命周期"治理。

---

## 三、修复优先级与建议落地顺序

| 优先级 | 项 | 性质 | 落地成本 |
|---|---|---|---|
| **P0** | P0-1 自动模式不打断重播（已并入 P2-2 暂停后恢复） | 开关体感硬伤 | 低（改 `refreshBGM` 一段） |
| **P1** | P1-1 两步修：删初始化 `onFirstInteraction` **+** `toggleMusic` 改按实际播放态判定 | 回头客首点按钮反关 | 低（删 4 行 + 改 1 行） |
| **P1** | P1-2 淡入读实时音量 | 调不动体感 | 低（改定时器取值） |
| **P2** | P2-1 强制释放 fading 音频 | 防泄漏 | 低 |
| **P2** | P2-3 音量迁移 `Number.isFinite` 拦截 NaN（修正原归因） | 防脆弱 | 极低 |
| **P2** | P2-4 入口收口 `startBgm` | 可维护性 | 中（推荐，可顺带收 P0-1/P2-1/P2-2） |
| **P2** | P2-5 环境音 `playAmbient` 释放 + `setAmbientEnabled` 自动播放一致性 | 防泄漏 / 设计一致性 | 低 |

**建议顺序**：先 P0-1(合P2-2) + P1-1(两步) + P1-2（直接消除你描述的两类体感），再顺手做 P2-1/P2-3/P2-5（低成本健壮项），P2-4 的 `startBgm` 收口可在"音频模块整理"迭代一并做（做了它，P0-1/P2-1/P2-2 的修复自然收敛到一处）。

---

## 四、验收标准

- [ ] 还书 / 专注完成时，若自动模式且当前曲仍在可选集内，BGM **不切换、不重启淡入**
- [ ] 氛围档位下降（当前曲掉出可选集）时，自动模式应平滑切到新档位曲目
- [ ] 专注完成 `pauseMusic()` 后，再次 `addAtmosphere` 触发 `refreshBGM`：**恢复刚才那首**（而非从暂停曲淡出重随机）
- [ ] 回头客进入游戏后，**首次点击音乐按钮 = 打开**（而非先关再开）——需同时落实"删初始化 `onFirstInteraction`"与"`toggleMusic` 按实际播放态判定"两步
- [ ] 音乐按钮开关状态与"是否真在播"一致；幽灵开启态（enabled 但无音频）首点即开启，不翻转
- [ ] 淡入进行中拖动音量滑块，音量**立即跟随**、不被定时器覆写
- [ ] 连续多次切歌 / 连续加氛围（1.2s 内）后，BGM 与**环境音**的 AudioContext 中**无静音残留音频对象**（可用 DevTools 观察 `Audio` 实例数）
- [ ] 切换环境音时不残留未释放的 `Audio` 实例（`playAmbient` 切换分支已清 `src`）
- [ ] 音量滑块初始值不为 NaN，且在 `initSettings` 前被调用也不崩

---

## 五、ADR 草案：BGM 播放控制应单一入口、状态变更可观测

**背景**：当前 `playTrack` 被 5 处调用，共享 `fadeTimer`/`fadingAudio`/`currentAudio` 三块模块级状态，且各入口语义不同（随机/指定/恢复），导致"开关乱跳""淡入泄漏"等问题难以定位。

**决策**：
1. 新增唯一对外入口 `startBgm(trackId?)`，所有播放需求经此函数；`playTrack` 降级为内部实现。
2. `startBgm` 内部统一处理：① 是否需要打断当前曲（基于"当前曲是否仍有效"而非"是否 paused"）；② 清理上一轮 fading 音频；③ 淡入每步读实时音量。
3. 自动模式语义锁定为"不打断当前有效曲"，手动模式语义锁定为"切到指定曲"。

**后果**：
- 正面：修复收敛到一处，后续改播放行为只动一个函数；可观测性增强。
- 负面：需改写 5 处调用点（一次性成本）；`P2-2` 的"暂停后语义"需在此明确（见 §二 P2-2）。

---

## 六、待确认项

1. ~~**暂停后氛围变动的行为**~~：v1.1 已采纳"恢复刚才那首"语义，并入 `refreshBGM` 修法（见上方 P0-1 / 原 P2-2）。
2. **是否纳入 `startBgm` 收口重构**（P2-4）：本次只修 bug，还是顺带做入口整理？（推荐做，可一并收敛 P0-1/P2-1/P2-2 修复）
3. **资产核对**：`TRACK_DEFS` 引用的 `audio/*.mp3` 等文件是否真实存在（属资产问题，非代码问题，本次未核查；若缺失会造成"开关开了却没声音"的误判）。
4. **环境音自动播放一致性**（P2-5）：`setAmbientEnabled(true)` 自动播环境音是否与 BGM"需用户手势才播"的设计方向一致？若需一致，改为记录状态、首个手势后再播。

---

## 七、克克复核补充意见

> 复核范围：对照 `js/audio.js`、`js/app.js`、`js/storage.js`、`js/settings.js`、`js/persistence.js`、`js/render/music-selector.js`、`js/ambient.js` 当前代码逐条验证。
> 结论：原评审对根因（跨模块触发打架 + 淡入状态管理脆弱）判断准确，P0/P1 问题定位可靠；但以下 5 处建议修正或补充，避免按此文档落地后留下二次 bug 或认知缺口。

### 1. P2-3「NaN 兜底」的真实风险点不在 `getSettings()` 本身

**原描述问题**：文档称"若 `getSettings()` 在 `initSettings()` 之前被调用，`musicVolume` 为 `undefined`"。

**实际代码**：`getSettings()` 内部已有 `load(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)` 兜底（`js/settings.js:78-81`），且 `load` 在解析失败或 key 不存在时返回默认值。因此正常流程下 `musicVolume` 不会是 `undefined`。

**真正的 NaN 来源**：`js/settings.js:53-63` 对旧版 key `library_music_volume` 做 `parseFloat(oldValue)`，如果旧存档里的值是非法字符串，会直接把 `NaN` 写进新 settings。

**建议修法（优先修改 settings.js 的迁移解析）**：
```javascript
const parsed = safeParse(oldValue);
let value = parsed !== undefined ? parsed : oldValue;
if (cfg.target.includes('Volume')) {
  value = parseFloat(value);
  if (!Number.isFinite(value)) value = DEFAULT_SETTINGS[cfg.target];
}
settings[cfg.target] = cfg.map(value);
```
在 `music-selector.js` 加 `(getMusicVolume() || 0)` 兜底仍可作为第二道防线，但不应把它当成主因。

---

### 2. P0-1 修法与 P2-2 会再次打架，建议合并处理

**原 P0-1 修法问题**：用 `!currentAudio.paused` 来判断"当前是否仍在播放"。专注完成后 `app.js:170` 会调用 `pauseMusic()`，此时 `currentAudio` 被 pause 但对象和 `currentTrackId` 都保留。之后任何 `addAtmosphere`（还书、完成专注、里程碑奖励等）都会触发 `refreshBGM()`，按原修法会因 `paused === true` 而判定为"不打断"条件不成立，从而重新随机切歌。

这正好和 P2-2 的诉求相反：P2-2 希望暂停后氛围变动能"恢复刚才那首"。

**建议合并后的 P0-1/P2-2 修法**：
```javascript
export function refreshBGM() {
  if (!isMusicOn()) return;
  const manualId = state.musicManualTrack;
  if (manualId) {
    playTrack(manualId);
  } else {
    // 自动模式：当前曲目仍有效就不打断；若处于暂停则恢复，而非重选
    const stillValid = currentTrackId && getAvailableTracks().some(t => t.id === currentTrackId);
    if (stillValid) {
      if (currentAudio && currentAudio.paused) resumeMusic();
      return;
    }
    playTrack(null);
  }
}
```
这样"氛围一变就随机重播"和"暂停后不该乱切"两个问题一次解决。

---

### 3. P2-1「强制释放 fading 音频」只清 `fadingAudio` 不够完整

**场景**：第一次 `playTrack` 正在淡入（`currentAudio` 是新音频，尚未进入 `fadingAudio`），1.2s 内第二次 `playTrack` 进来。此时第一次的 `currentAudio` 会被赋给 `old` 开始淡出；如果 1.2s 内又来第三次调用，第二次的 `old` 就永远等不到定时器结束时的 `pause()`/`src=''`，造成泄漏。

**建议**：P2-1 和 P2-4 应该一起落地。与其在 `playTrack` 里不断打补丁，不如按文档 ADR 草案封装一个 `startBgm(trackId?)` 内部状态机：
- 维护「当前播放音频」「正在淡出音频」两个独立引用；
- 每次调用先强制清理上一轮 fading 和 current；
- 淡入定时器每步读取实时音量（P1-2）。

如果本次坚持只改 `playTrack`，则开头应同时处理 `currentAudio`：
```javascript
if (fadingAudio && fadingAudio !== currentAudio) {
  try { fadingAudio.pause(); fadingAudio.src = ''; } catch (e) {}
  fadingAudio = null;
}
if (currentAudio) {
  const old = currentAudio;
  try { old.pause(); old.src = ''; } catch (e) {}
  if (fadingAudio === old) fadingAudio = null;
  currentAudio = null;
}
clearInterval(fadeTimer);
fadeTimer = null;
```
> 注意：这样改会退化成硬切，不再保留交叉淡入效果。因此更推荐直接做 P2-4 的 `startBgm` 封装。

---

### 4. 标题包含「环境音」，但正文未审 `js/ambient.js`

文档标题为"音乐 / 音效 / 环境音 播放链路"，但实际只分析了 BGM 模块，`js/ambient.js` 未被提及，存在认知缺口。

`js/ambient.js` 中至少有两处同类隐患：
- **切换环境音时只 `pause()` 不释放对象**（line 76-78）：`playAmbient` 切换旧音频时仅 `currentAudio.pause(); currentAudio = null;`，未清 `src`，长期切换会累积 Audio 实例。
- **环境音开启时可能自动播放**：`setAmbientEnabled(true)` 会自动播 `state.ambientSounds.current` 或第一个已解锁环境音，与 BGM "开始专注不自动播放"的最新设计方向不完全一致（需确认是否有意为之）。

**建议**：要么把标题收窄为"音乐 / 音效 播放链路"，要么补一节"环境音健壮性"，避免架构师以为环境音链路已审过。

---

### 5. P1-1 可补充更精确的事件时序

原描述结论正确（回头客首次点音乐按钮会关掉音乐），但可以补充事件链，方便后续开发者理解为什么不是 `toggleMusic` 本身写错了：

1. 初始化 `onFirstInteraction()` 无手势 → 被浏览器拦截 → `currentAudio/currentTrackId` 被清空，但 `musicEnabled` 仍为 true；
2. 用户点击 `musicBtn` → `toggleMusic` 先把 `musicEnabled` true → false，并更新 UI；
3. 同一 click 事件冒泡到 `document` 的 `activateAudio` → 调用 `onFirstInteraction()` → 此时 `isMusicOn()` 已为 false，`playTrack` 直接 return；
4. 最终效果：用户点一下，音乐从"幽灵开启"变成关闭，需再点一下才开。

修法（删除 `app.js:1327-1330`）不变。

---

### 6. 验收标准可补充一条可操作的回头客用例

建议将抽象条目：
> 音乐按钮开关状态与 `musicEnabled` 持久化值始终一致

补充为具体行为：
> 回头客进入游戏后，首次点击音乐按钮：
> - 点击前 `musicEnabled` 应为 false（因初始化期 `onFirstInteraction` 被浏览器拦截未真正播放，应视为未开启）；
> - 点击后 `musicEnabled` 应为 true，BGM 开始播放；
> - 再次点击后才为 false。

---

### 复核落地建议

**最小改动（只消除体感 bug）**：
1. 修 P0-1（合并 P2-2 的 paused 恢复语义）；
2. 删 P1-1 的初始化 `onFirstInteraction()`；
3. 修 P1-2（淡入定时器每步读实时音量）；
4. 在 `settings.js` 迁移处加 `Number.isFinite` 校验（替代 P2-3 原描述）。

**更稳的改法（推荐）**：
- 把 P0-1/P2-2 合并为"自动模式不打断 + 暂停后恢复"；
- 把 P2-1/P2-4 合并为"封装 `startBgm` + 统一音频对象生命周期"；
- 顺手补 `ambient.js` 的释放逻辑，让"音乐 / 音效 / 环境音"三个链路的健壮性对齐。

**不建议的做法**：单独按原文档落地 P0-1 和 P2-2，因为二者在 paused 判定上会互相抵消；也不建议单独落地 P2-1 而不动 P2-4，容易在快速切歌场景再次泄漏。

---

## 八、架构师对克克复核的回应（v1.1 采纳说明）

> 本节记录架构师（初评者）对克克复核意见的逐条裁定，便于后续开发者理解文档演变。

**完全采纳**
- **点 1（P2-3 归因）**：初版把 NaN 来源错归为 `getSettings()` 无兜底——已核实 `getSettings()`（settings.js:78-81）确有默认兜底，真实来源是 `LEGACY_SETTINGS` 迁移解析（settings.js:53-66）对非法旧值写出 `NaN`。已修正主文档 P2-3，主修复改在 migration 层。
- **点 2（P0-1 与 P2-2 冲突）**：初版 `refreshBGM` 自动分支用 `!currentAudio.paused` 判定，专注后 `pauseMusic()` 使 `paused===true` 会误重选——克克合并修法（改用 `currentTrackId` 有效性 + 暂停时 `resumeMusic`）正确且优雅。已把 P0-1 与 P2-2 合并为同一修法。
- **点 4（环境音未审）**：标题承诺"环境音"但初版只审了 BGM，确属认知缺口。已补 P2-5 小节（含克克发现的两处：`playAmbient` 未清 `src`、`setAmbientEnabled` 自动播放一致性待确认）。
- **点 5 / 6（事件链与验收用例）**：事件链描述准确、验收用例具体，已采纳为 P1-1 的补充说明（见下）。

**部分采纳 / 修正**
- **点 3（P2-1 泄漏）**：`startBgm` 收口的方向正确、推荐；但"最小补丁仍会泄漏"的说法略夸大——主文档的 P2-1 最小补丁在每次 `playTrack` 开头都会 `fadingAudio.pause(); fadingAudio.src=''; fadingAudio=null`，已覆盖快速重入的常见情形。结论：最小补丁可接受，但 `startBgm`  facade 是更优的长期解（已列入 P2-4）。

**关键补充（克克也未察觉）**
- **P1-1 的修法仍不充分**：克克点 5/6 沿用了初版"删除 app.js:1327-1330"的修法，但其"删除即可"判断**不成立**。核实 `toggleMusic`（audio.js:199）发现它用 `isMusicOn()`（= 持久化 `musicEnabled`，回头客为真）而非"实际播放态"判定 `wasOn`；叠加 `document` 上的 `activateAudio` 监听器（app.js:1212-1216）在**同一点击冒泡阶段后于按钮触发**，导致回头客首点音乐按钮仍会 `true→false` 关掉。
  - **完整修法 = 删 1327-1330（必要） + 改 `toggleMusic` 以 `!!(isMusicOn() && currentAudio && !currentAudio.paused)` 判定 `wasOn`（关键）**。此修正已写入主文档 P1-1。
  - 因此克克"复核落地建议"的最小改动第 2 条应升级为"P1-1 两步修"，否则回头客首点音乐按钮的 bug 仍残留。

**待用户拍板**
- P2-4 `startBgm` 是否本次就做（推荐，可一并收敛 P0-1/P2-1/P2-2）；
- P2-5 中环境音自动播放是否与 BGM 设计方向一致；
- 资产文件（`audio/*.mp3` 等）是否真实存在（本次未核查）。
