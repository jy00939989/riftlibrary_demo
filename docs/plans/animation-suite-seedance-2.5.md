---
status: in-progress
importance: 4
scheduledDate:
anchors:
  - { type: file, path: "docs/plans/animation-suite-seedance-2.5.md", weight: 0.1 }
  - { type: file, path: "js/render/shared/video-overlay.js", weight: 0.2 }
  - { type: file, path: "visual/animations/manifest.json", weight: 0.2 }
  - { type: file, path: "js/render/animations.js", weight: 0.1 }
  # —— 2026-09-20 drift 对账补锚（音频/动画入库与挂接链，union 增量勿删）——
  - { type: file, path: "audio/music/ruined-library.mp3", weight: 0.1 }
  - { type: file, path: "audio/music/ruined-library-variation.mp3", weight: 0.1 }
  - { type: file, path: "audio/music/starlight-library.mp3", weight: 0.1 }
  - { type: file, path: "audio/music/starlight-library-variation.mp3", weight: 0.1 }
  - { type: file, path: "audio/music/town-stroll.mp3", weight: 0.1 }
  - { type: file, path: "audio/music/town-stroll-variation.mp3", weight: 0.1 }
  - { type: file, path: "visual/animations/book_complete_shelving_480p.mp4", weight: 0.1 }
  - { type: file, path: "visual/animations/borrow_lv0_1_480p.mp4", weight: 0.1 }
  - { type: file, path: "visual/animations/focus_lv0_1_480p.mp4", weight: 0.1 }
  - { type: file, path: "visual/animations/focus_lv1_2_480p.mp4", weight: 0.1 }
  - { type: file, path: "visual/animations/focus_lv2_3_480p.mp4", weight: 0.1 }
  - { type: file, path: "visual/animations/atmo_0_1_480p.mp4", weight: 0.1 }
  - { type: file, path: "visual/animations/atmo_2_3_480p.mp4", weight: 0.1 }
  - { type: file, path: "visual/animations/visitor_first_480p.mp4", weight: 0.1 }
  - { type: file, path: "js/intro.js", weight: 0.1 }
  - { type: file, path: "js/persistence.js", weight: 0.1 }
  - { type: file, path: "js/settings.js", weight: 0.1 }
  - { type: file, path: "visual/animations/_archive/borrow_lv0_1_v1_5s.mp4", weight: 0.1 }
  - { type: file, path: "visual/promo/异世界图书馆宣传PV.mp4", weight: 0.1 }
---

# 归墟图书馆 · 动画计划（animation-suite / Seedance 2.5 视频套案）

> 2026-09-04 与图南共同头脑风暴锁定。开场动画不在本次范围（太长太贵）。
> 目标：用 Seedance 2.5 图生视频替换/新增全部关键动画，统一归墟美学。
> **合并注记（2026-09-18）**：老 `game-animations-plan.md`（Lottie/CSS 路线，已被本文取代）归档，其「8 节点覆盖度表」与「验收标准」的可用残余折入本文 §2.5 / §8.5；其 Lottie-first 技术路线正式作废（现实路线 = 视频 + CSS 降级链）。

## 0. 决策记录

| 决策项 | 结论 |
|---|---|
| 设施升级粒度 | **每等级 1 条**（借阅区 7 + 缮写室 6 + 修复室 5 = 18 条，含 Lv0 解锁） |
| 追加范围 | 访客终局×3、损毁+修复、台风+植物、留声机落针、典藏合成——**全做** |
| 分辨率 | 先 **480p** 试水，风格确认后再议 720p |
| 模型 | Seedance 2.5（300 积分/秒），打样阶段如预算紧可降 2.0（200 积分/秒） |

## 1. 风格锚定（所有提示词共用）

**首帧/首尾帧参考图全部取自 `visual/` 现有资产**，这是整套动画风格统一的根基。
每条提示词末尾追加统一风格块：

```
归墟图书馆场景，羊皮纸暖色调与深棕木质书架，墨色细节，暖金色魔法光尘缓缓漂浮，
幽蓝星光点缀，手绘插画质感，柔和体积光，电影感构图，镜头缓慢运动，
无现代元素，无文字，无水印
```

负向（如出现现代元素/文字/人物崩脸，重抽时追加）：`现代电器、霓虹灯、英文字母、人物面部特写变形`

## 2. 完整清单（30 条）

### 第一批：核心循环（21 条）

| # | key | 时长 | 画幅 | 首帧参考 | 提示词 |
|---|---|---|---|---|---|
| 1 | ✅ `copy_complete`（入库键 `book_complete_shelving`）| 5s | 3:4 | 缮写室当前等级图 | 羽毛笔悬在泛黄书页上落下最后一笔，墨迹泛起暖金光芒沿字迹流动，书册自动合拢，一枚金色印章从空中落下盖在封面上，光尘四散，镜头微推 |
| 2 | `shelving` | 4s | 3:4 | visual/background 书架图 | 一本泛着金光的书从画面下方缓缓飞入，书页微微翻动，稳稳嵌入书架空格，格位亮起暖金符文，周围书脊轻晃，光尘飘散 |
| 3 | `atmo_ruin_to_cozy` | 8s | 4:3 | 废墟图书馆图 | 灰尘在光柱中旋转升起，破洞窗帘被风拂起，熄灭的壁炉自行点燃暖火，倾斜的书架缓缓扶正，阳光从高窗灌入，整体色调从灰蓝转为暖金 |
| 4 | `atmo_cozy_to_stellar` | 8s | 4:3 | 温馨图书馆图 | 屋顶逐片透明化作星空，星光如纱倾泻而下，书页脱离书本缓缓浮空，金色光尘与幽蓝光点交织，书架上的书脊微微发亮，镜头缓升 |

#### 设施升级 ×18（mode=first_last_frame 首尾帧模式）

> **这是本方案的巧思**：首帧=旧等级图，尾帧=新等级图，让模型自己生成两帧之间的「蜕变过程」。
> 提示词统一模板 + 每等级一句变化描述。

统一模板：
```
[旧等级场景] 在暖金色光芒中蜕变升级，[变化描述]，光尘如涟漪扫过房间，镜头缓慢环绕，
最终定格在焕然一新的一角。
```

| # | key | 设施 | 画幅 | 首帧→尾帧 | 变化描述 |
|---|---|---|---|---|---|
| 5 | ✅ `borrow_lv0_1` | 借阅区 | 4:3 | 空角落→Lv1 陋室 | 灰尘散去，简陋桌椅显现，第一盏灯亮起 |
| 6 | `borrow_lv1_2` | 借阅区 | 4:3 | Lv1→Lv2 整洁 | 杂乱的物品归位，窗帘换新，晨光变亮 |
| 7 | `borrow_lv2_3` | 借阅区 | 4:3 | Lv2→Lv3 开放 | 墙壁打开成落地窗，书架扩容，绿植出现 |
| 8 | `borrow_lv3_4` | 借阅区 | 4:3 | Lv3→Lv4 舒适 | 扶手椅翻新，壁炉点燃，地毯铺开 |
| 9 | `borrow_lv4_5` | 借阅区 | 4:3 | Lv4→Lv5 精致 | 铜质灯具悬落，茶具显现，光线变暖金 |
| 10 | `borrow_lv5_6` | 借阅区 | 4:3 | Lv5→Lv6 优雅 | 油画挂上墙面，立柱雕花浮现，光尘成帘 |
| 11 | `borrow_lv6_7` | 借阅区 | 4:3 | Lv6→Lv7 圣所 | 穹顶星光倾泻，半透明光阶浮现，如临圣殿 |
| 12 | ✅ `focus_lv0_1` | 缮写室 | 4:3 | 残破→Lv1 | 瓦砾退去，书桌扶正，烛火点亮 |
| 13 | ✅ `focus_lv1_2` | 缮写室 | 4:3 | Lv1→Lv2 | 窗棂修复，天光洒入，文具有了新家 |
| 14 | ✅ `focus_lv2_3` | 缮写室 | 4:3 | Lv2→Lv3 | 书架沿墙生长，墨水瓶盈满，纸堆整齐 |
| 15 | `focus_lv3_4` | 缮写室 | 4:3 | Lv3→Lv4 | 铜灯悬顶，绿罩台灯显现，暖意弥漫 |
| 16 | `focus_lv4_5` | 缮写室 | 4:3 | Lv4→Lv5 | 挂钟开始走动，地球仪旋转，光影流转 |
| 17 | `focus_lv5_6` | 缮写室 | 4:3 | Lv5→Lv6 圣殿 | 穹顶打开显星空，羽毛笔悬空自书，金辉如雨 |
| 18 | `resto_unlock` | 修复室 | 4:3 | 废墟→Lv0 开放 | 尘封的房门亮起符文打开，工作台显现 |
| 19 | `resto_lv0_1` | 修复室 | 4:3 | Lv0→Lv1 | 工具上架，台灯点亮，卷宗归位 |
| 20 | `resto_lv1_2` | 修复室 | 4:3 | Lv1→Lv2 | 工作台扩展，丝线卷轴排列，炉火转旺 |
| 21 | `resto_lv2_3` | 修复室 | 4:3 | Lv2→Lv3 | 放大镜悬臂显现，药水瓶盈满彩光 |
| 22 | `resto_lv3_4` | 修复室 | 4:3 | Lv3→Lv4 | 古籍陈列架亮起保护光罩 |
| 23 | `resto_lv4_5` | 修复室 | 4:3 | Lv4→Lv5 | 金色修复法阵在地面亮起，书页悬浮自转 |

### 第二批：世界事件（7 条）

| # | key | 时长 | 画幅 | 首帧参考 | 提示词 |
|---|---|---|---|---|---|
| 24 | `ending_xiachan` | 6s | 3:4 | visual/visitors 夏蝉立绘 | 雨夜的窗边剪影，她轻轻合上书回头莞尔，烛火摇曳，身影淡入纷飞书页之间 |
| 25 | `ending_peizhou` | 6s | 3:4 | visual/visitors 裴舟立绘 | 海边崖上衣袂翻飞，他展开诗笺，字句化作海鸟衔着散去，浪花在礁石溅成光点 |
| 26 | `ending_guyu` | 6s | 3:4 | visual/visitors 谷雨立绘 | 温室花海中她俯身触碰花朵，花粉化作光点升起环绕，藤蔓绕梁开花 |
| 27 | `damage` | 4s | 3:4 | 摊开的书页特写（需先生成一张静帧） | 书页边缘突然焦黑卷曲，墨迹晕染扩散，纸面爬出裂痕，暖金光泽黯淡成灰蓝 |
| 28 | `restore` | 4s | 3:4 | 破损书页特写 | 金色光丝如针线穿梭缝合裂痕，焦黑褪去墨迹复艳，书页合拢焕发暖光 |
| 29 | `typhoon` | 5s | 4:3 | 图书馆内景 | 高窗被狂风吹得震颤，烛火剧烈摇晃，书页疯狂翻动窗帘撕扯，幽蓝闪电透过窗照亮书架，一枚镇纸压住飞起的书页 |
| 30 | `plant_bloom` | 4s | 3:4 | visual/plants 对应植物图 | 花盆中嫩芽破土抽枝，叶片舒展，花苞绽放成发光花朵，光尘花粉飘散，镜头微推 |

### 第三批：仪式感（2 条）

| # | key | 时长 | 画幅 | 首帧参考 | 提示词 |
|---|---|---|---|---|---|
| 31 | `gramophone` | 4s | 3:4 | 黄铜留声机静帧（需先生成） | 唱针缓缓落在旋转的黑胶唱片上，沟槽泛起幽蓝与暖金光纹，声波携光尘从喇叭口飘出 |
| 32 | `arthur_synthesis` | 6s | 4:3 | 修复室内景 | 四本古卷悬浮环绕中心旋转，金色光带缠绕合一，光芒凝聚成厚重大书缓缓落下，封面剑纹亮起 |

（清单编号到 32：第一批 23 条 + 第二批 7 条 + 第三批 2 条）

## 2.5 覆盖度对照（2026-09-18 并入老 game-animations-plan 的 8 节点表）

> 老 plan 的节点清单是好用的完备性检查表，逐个对到现状：✓=已覆盖（含降级兜底）／◐=半覆盖／✗=缺口。

| 老 plan 节点（原优先级） | 现状 | 覆盖键 / 缺口 |
|---|---|---|
| 氛围升级（P0） | ✓ | `atmo_{prev}_{new}` 泛化键（`atmo_0_1`/`atmo_2_3` 已入库，manifest 缺失自动降级） |
| 房间解锁（P0） | ✓ | 设施升级 18 条（`borrow_lv*`/`focus_lv*`/`resto_*`），清单外等级走 onFail 降级升级卡（零伤害） |
| 专注完成（P0） | ✓ | `book_complete_shelving`（5s 两段式，誊抄完成链；重抄 copyCount>1 不播直接出卡） |
| 书籍完成（P0） | ✓ | 同上（原 `copy_complete` 已并入，`copyCount===1` 才播） |
| 书籍上架（P1） | ◐ | 已并入完成动画；**商店购买路径仍 CSS**——日后需要再补独立 `shelving` 键（§7 已留口） |
| 访客抵达（P1） | ✓ | `visitor_first`（清单外增补键，focus-orchestrator 首访事件前置播放） |
| 植物成长（P1） | 清单在库 | `plant_bloom`（32 键清单第 30 条，未生成） |
| 成就解锁（P1） | ✗ **缺口** | 32 键无成就键——待补 `achievement_unlock` 或维持 CSS 徽章动画（旧验收标准已满足「有动画」，降级链兜底） |

## 3. 技术接入方案

### 目录与命名
```
visual/animations/
  <key>_480p.mp4        # 统一命名
  manifest.json          # key → { file, duration, loop, fallback }
```

### manifest.json 示例
```json
{
  "copy_complete": { "file": "visual/animations/copy_complete_480p.mp4", "duration": 5, "loop": false },
  "gramophone":    { "file": "visual/animations/gramophone_480p.mp4",    "duration": 4, "loop": true  }
}
```

### 播放组件（新增 js/render/shared/video-overlay.js）
- `playVideoOverlay(key, { onDone, onSkip })`：全屏暗化遮罩 + 居中 <video autoplay muted playsinline>
- **降级链**：manifest 无 key → 文件 404 → 加载 error → 全部回退现有 CSS 动画（现有逻辑原样保留）
- 播完自动关闭并调 onDone（与现有 callback 契约一致）；点击可跳过
- `showUpgradeCard` 增加可选 `videoKey` 参数：有视频则在卡片图区播放

### 挂载点改造（改动很小）
| 现有函数 | 改造 |
|---|---|
| `showBookCompleteAnimation` | 先尝试 `playVideoOverlay('copy_complete')`，失败走原 CSS |
| `showBookShelvingAnimation` | 同上，`shelving` |
| `showAtmosphereStagePopup` | 按阶段选 `atmo_ruin_to_cozy` / `atmo_cozy_to_stellar` |
| `showFocusRoomUpgrade` 等 3 个 | `showUpgradeCard` 传 `videoKey: 'focus_lv' + (lv-1) + '_' + lv` |
| 访客终局叙事 | `ending_<charId>`（无视频则维持现状） |
| 留声阁进入/切歌 | `gramophone`（loop，不阻塞操作，作背景播放） |

## 4. 成本估算

| 批次 | 条数 | 总时长 | 2.5 (300/s) | 2.0 (200/s) |
|---|---|---|---|---|
| 打样（誊抄完成 + 氛围升档 + 借阅区升级各 1） | 3 | ~17s | ~5,100 | ~3,400 |
| 第一批剩余 | 20 | ~95s | ~28,500 | ~19,000 |
| 第二批 | 7 | ~33s | ~9,900 | ~6,600 |
| 第三批 | 2 | ~10s | ~3,000 | ~2,000 |
| **合计** | **32** | **~155s** | **~46,500** | **~31,000** |

> 注：需先生成 2 张静帧（损毁书页特写、黄铜留声机），走图像生成不计入上表。

## 5. 制作 SOP（每条）

1. 定首帧/首尾帧参考图（`visual/` 现有图；无则先生成静帧）
2. `create_video_task`：model=2.5、480p、对应画幅、mode=first_frame（事件类）或 first_last_frame（设施升级类）、时长按表
3. 验收三原则：风格贴合归墟美学 ✓ 无文字乱码 ✓ 首尾帧构图不穿帮 ✓；不过则调提示词重抽
4. 重命名入库 + 登记 manifest.json
5. 接入挂载点，验证降级链（故意删文件测试回退）

## 6. 排期建议

1. **打样 3 条**（誊抄完成 / 氛围升档 / 借阅区 Lv3→4）→ 确认风格方向
2. 第一批剩余 20 条，分 3-4 个批次生成（每次 5-8 条，避免一次性大出血）
3. 接入代码随批次推进，每批做完即测
4. 第二、三批按内容档期穿插

---

## 7. 补充决策（2026-09-04 断网前口头锁定）

> 原 `copy_complete`（5s）+ `shelving`（4s）**合并为一条 5 秒动画**，先打样这条。
> key 改为 `book_complete_shelving`，替代原 1、2 两条（原两条标记作废，如日后商店购买场景需要单独上架动画再重开 `shelving`）。

### 分镜（5 秒内两段式）

| 时间 | 段落 | 内容 |
|---|---|---|
| 0.0–2.2s | 完成 | 羽毛笔落最后一笔 → 墨迹泛金光 → 书册自动合拢 → 金印章落下 |
| 2.2–5.0s | 上架 | 书册泛金光升起 → 镜头跟随飞越书架深处 → 嵌入空格格位 → 暖金符文亮起 |

### 素材选择

| 用途 | 资产 | 理由 |
|---|---|---|
| 首帧 | `visual/focusroom/focusroom_lv5_final_1.jpg` | 缮写室代表帧，仪式感强；对所有等级玩家都是「奖励感」（覆盖原「当前等级图」方案，视频无法按等级动态换帧） |
| 首帧备选 | `visual/focusroom/focusroom_lv3_final_1.jpg` | 若担心低等级玩家出戏，降为中等等级帧 |
| 书架落点参考 | `visual/background/library_bg_04_gorgeous.jpg` | 主馆书架墙视图，暖金华丽，与归墟美学一致 |
| 书架备选 | `visual/background/library_bg_03_cozy.jpg` | 更温馨的低位氛围（尾帧构图更稳妥时换） |

### 完整提示词

```
羽毛笔在泛黄书页上落下最后一笔，墨迹泛起暖金光芒沿字迹流动，书册自动合拢，
一枚金色印章从空中落下盖在封面上，光尘四散；随即合拢的书册泛起金光从桌面缓缓升起，
穿过漂浮的光尘向书架深处飞去，镜头跟随书本飞行，稳稳嵌入一格空书架，
格位亮起暖金符文，周围书脊轻晃，光尘飘散，镜头微推定格。
归墟图书馆场景，羊皮纸暖色调与深棕木质书架，墨色细节，暖金色魔法光尘缓缓漂浮，
幽蓝星光点缀，手绘插画质感，柔和体积光，电影感构图，镜头缓慢运动，
无现代元素，无文字，无水印
```

负向（重抽时追加）：`现代电器、霓虹灯、英文字母、文字、水印、人物面部特写变形`

### 生成参数

- mode = `first_frame`（首帧 = focusroom_lv5_final_1.jpg）
- model = 2.5、480p、画幅 3:4、duration = 5
- 成本：约 1,500 积分（2.5）/ 1,000（2.0），比原两条 9 秒省约 1,200（2.5）
- 验收三原则同 §5，重点看 2.2s 处「完成→起飞」转场是否顺滑、落点书架是否穿帮

### 接入影响

- `showBookCompleteAnimation`：`copyCount === 1` 时播 `book_complete_shelving`（5s），失败回退 CSS；**重抄（copyCount > 1）直接出卡片不播视频**（2026-09-04 修订）
- 馆生首书分支（`isFirstBookComplete`）：证书 → `book_complete_shelving`（2026-09-04 修订，原 emoji 飞书动画 `showBookShelvingAnimation` 在该流程中移除，函数保留待商店购买路径复用）
- `showBookShelvingAnimation`：专注完成流程内不再调用；商店购买路径暂维持 CSS，日后需要再补独立 `shelving`
- **「跳过重复动画」设置**（2026-09-04 新增）：🎼 面板底部开关，开启后已播过的动画 key（存 `riftlib_seen_animations`）不再播放，直接走 onDone 继续流程，不走 CSS 降级

---

## 落地记录（2026-09-11）

**已入库素材（visual/animations/，manifest 已登记）**：`book_complete_shelving`（5s，9-04 已接入誊抄完成链）/ `borrow_lv0_1`（8.1s）/ `focus_lv0_1`（8.1s）/ `focus_lv1_2`（5.1s）/ `atmo_0_1`（5.1s）/ `visitor_first`（10.1s）。

**清单外增补 3 键**（`atmo_2_3` 2026-09-11 图南产，挂升阶仪式泛化键 `atmo_{prev}_{new}`，manifest 缺失自动降级）（源自老 game-animations-plan 的 P0 节点，32 键清单未覆盖）：`atmo_0_1`=氛围首次跨阈（首次升阶仪式前置播放）；`atmo_2_3`=第二次升阶（app.js 泛化键 atmo_{prev}_{new}）；`visitor_first`=首位访客抵达（focus-orchestrator 首访事件前置播放）。后续增补键请沿用 `<scene>_<from>_<to>` 命名并登记本表。

**接入方式**：设施升级走 `tutorial-ui.js` showFocusRoomUpgrade/showBorrowAreaUpgrade 的 `focus_lv{N-1}_{N}` / `borrow_lv{N-1}_{N}` 键——清单外等级自动走 onFail 降级为原升级卡（零伤害）；`借阅区解锁.mp4`（5s 旧版）归档 `_archive/`，PV 移 `visual/promo/`（intro 引用路径已同步）。

## 8.5 验收标准对照（2026-09-18 并入老 game-animations-plan）

| 老 plan 验收项 | 现状 |
|---|---|
| P0 四节点（氛围升级/房间解锁/专注完成/书籍完成）有动画 | ✓ 见 §2.5 覆盖度（6 键已入库挂接） |
| 播放不阻塞核心交互（可跳过） | ✓ `video-overlay` 点击跳过 + onSkip 契约，后台 loop 型（gramophone）不阻塞 |
| 「关闭/减少动画」设置项 | ✓ 🎼 面板「跳过重复动画」开关（`riftlib_seen_animations`，2026-09-04 新增） |
| 移动端流畅、低端可降级 | ✓ 480p + manifest 缺失/404/加载 error 全链回退 CSS（§3 降级链） |
| 动画资源总大小 <1MB（首期） | ◐ 首期 6 条 480p 已入库，未专项核算——下批生成前顺手核一遍 |

老 plan 的 Lottie/SVG 资产规范（<100KB/个、assets/animations/ 目录）随路线作废一并废止；若未来离线/包体需求回摆轻量路线，从 git 历史翻 2026-09-18 归档版取用。
