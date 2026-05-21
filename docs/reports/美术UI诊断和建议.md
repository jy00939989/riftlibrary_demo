# 异世界图书馆 · UI 美学审查与改进建议

> 文档日期：2026-05-15
> 审查范围：全站 UI 视觉、交互与美术资产使用情况

---

## 一、现有视觉语言分析

**美术风格定位：水彩奇幻·从废墟到圣殿的复苏叙事**

| 维度 | 现状 | 评价 |
|------|------|------|
| 色调 | 羊皮纸暖棕 + 墨色 + 魔法金/蓝 | ✅ 统一且符合调性 |
| 字体 | 思源宋体(正文) + Cinzel(标题) + 手写体(缮写动画) | ✅ 层次清晰 |
| 背景 | body 渐变（深棕色）+ 各页面内卡片羊皮纸纹理 | ⚠️ 浪费了精美素材 |
| 美术资产 | 5张氛围阶段背景图 + 7张借阅区图 + 7张缮写室图 | ⭐ 高质量水彩风，但**使用率极低** |
| 动画 | 缮写动画（羽毛笔+墨迹+粒子+翻页）是**全项目视觉巅峰** | 其他页面完全跟不上这个水准 |

---

## 二、核心问题诊断

### 🔴 问题一：顶级背景浪费——5 张氛围大图只在一个子页面出现

`visual/background/` 有从"废弃废墟"→"恢弘圣殿"的五阶段背景图，质量极高（水彩风、有叙事感）。但目前**只在馆长办公室→概况页面以一个小缩略图形式展示**。

**建议方案：**
- body 背景根据当前氛围阶段动态切换为对应背景图（低透明度叠加）
- 效果：整个页面的"空气感"随玩家进度变化
  - Lv1 废弃 → 暗沉、蛛网隐约可见
  - Lv5 恢弘 → 明亮、星光点点的神圣感

**实现方式（CSS）：**

```css
body {
  /* 当前：固定渐变 */
  background: linear-gradient(135deg, #2c2419 0%, #3d3224 50%, #2c2419 100%);
  
  /* 改进：动态背景图 + 遮罩 */
  background-image: 
    linear-gradient(rgba(44,36,25,0.85), rgba(44,36,25,0.85)),
    url('visual/background/library_bg_01_abandoned.jpg');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}
```

通过 JS 在 state 变更时动态替换 `document.body.style.backgroundImage`。

---

### 🔴 问题二：选项卡导航缺乏仪式感

6 个 Tab 按钮目前是纯色矩形 + emoji，没有任何装饰性元素。对于一个"异世界图书馆"来说，导航栏应该像**古籍的章节标签**或者**魔法书的书脊**。

**当前状态 vs 建议：**

| | 现在 | 建议 |
|--|------|------|
| 形状 | 圆角矩形 (`rounded-lg`) | 单侧装饰角 / 书签造型 |
| 选中态 | 金色填充 | 金色底 + 左侧金色竖线 + 微光 |
| 未选中 | 灰色半透明 | 羊皮纸色 + hover 时浮现文字 |
| 过渡 | 无 | 切换时底部横条滑动动画 |
| 间距 | `gap-2` 紧凑 | 加大间距，给每个 Tab 更多呼吸空间 |

**快速改进方案（最小代码量）：**

```css
.nav-btn {
  position: relative;
  padding-left: 1.25rem;  /* 给左侧装饰线留空间 */
}

/* 选中态：金色左边框 */
#tab-focus.active,
.nav-btn.active {
  border-left: 3px solid var(--magic-gold);
  background: linear-gradient(135deg, var(--parchment), var(--parchment-dark));
  box-shadow: 0 2px 12px rgba(201,162,39,0.2);
}
```

---

### 🟡 问题三：各页面视觉权重失衡

| 页面 | 视觉丰富度 | 差距 |
|------|-----------|------|
| ✍️ 缮写室 | ⭐⭐⭐⭐⭐ 3D 书本 + 羽毛笔 + 墨迹 + 粒子 + 翻页 | **标杆** |
| 🏛️ 馆长办公室 | ⭐⭐⭐ 背景图 + 进度条 + 数据卡 | 还行 |
| 📖 大书架 | ⭐⭐ 白色小卡片网格 | 太素 |
| ☕ 读者沙龙 | ⭐⭐ 文字列表行 | 太素 |
| 🌌 位面商店 | ⭐⭐ 商品卡片网格 | 太素 |
| 📜 馆史档案 | ⭐⭐ 数据方块 + 时间轴 | 一般 |

**问题本质：** 除了缮写室花了心思做沉浸式体验外，其他 5 个页面都是"数据填表式"UI——白底卡片 + 文字排列。

---

### 🟡 问题四：访客系统没有角色感

读者沙龙是整个游戏最有故事性的模块（NPC 访客、随机事件、好感度），但 UI 上只是：

```
😊 沈明远  正在浏览书架...
🧚 小萤    正在浏览书架...
```

一行 emoji + 名字 + 状态文字，完全没有"人"的存在感。

**建议：**
1. 给每个访客一个**小型头像/立绘区域**（哪怕用色块+emoji 组合）
2. 好感度用**心形进度条**而非纯数字
3. 借阅中的书籍显示**迷你封面**
4. 事件弹窗已经有图标了，但可以加上**角色表情变化**

---

### 🟡 问题五：空状态和过渡态缺失

以下场景缺少精心设计的空状态：
- 书架无书时：只有一个 "+" 占位符
- 读者沙龙 Lv0：✅ 已有空状态设计（不错！）
- 商店售罄时："新书上架中…" 文字太干巴
- 档案无记录时：一句话带过

**建议方向：** 每个空状态都应该是一幅**微型插画级场景**，配合叙事文案。参考 Lv0 读者沙龙的做法——emoji 大图标 + 意境文字 + 引导按钮。

---

### 🟢 问题六：细节打磨机会

| 区域 | 现状 | 改进 |
|------|------|------|
| 顶部金币/氛围 | 小字 + 圆角胶囊 | 金币用动画闪光；氛围条做成迷你进度环 |
| 按钮 | 统一 `bg-magic-gold` | 主要操作保持金色，次要操作用羊纸色边框，危险操作用暗红 |
| 分割线 | 几乎没有 | 页面各区块之间加细微装饰分隔线（CSS 伪元素画线） |
| 卡片阴影 | 统一 `shadow` / `shadow-lg` | 根据层级用不同深度，hover 时加深 |
| 滚动条 | 已自定义（木色） | ✅ 这点做得好 |
| 数字字体 | 默认等宽 | 金币和数值可以用 `font-variant-numeric: tabular-nums` 防止跳动 |

---

## 三、优先级排序的实施路线图

### Phase 1：氛围提升（改动少、效果显著）

| 改动 | 文件 | 效果 |
|------|------|------|
| **动态 body 背景图** | `style.css` + `app.js`（约 20 行） | 全站"空气感"质变 |
| **Tab 导航美化** | `style.css`（约 30 行） | 导航区更有仪式感 |
| **卡片统一微光 hover** | `style.css`（约 10 行） | 交互反馈增强 |

### Phase 2：页面质感拉齐（核心页面逐一升级）

| 改动 | 文件 | 效果 |
|------|------|------|
| **书架卡片重设计** | `render/bookshelf.js` + `style.css` | 书籍封面化，增加书脊视觉效果 |
| **商店商品卡片升级** | `render/shop.js` | 增加悬浮预览、更好的价格呈现 |
| **访客列表角色化** | `render/visitors.js` | 访客卡片含头像区、好感度可视化 |

### Phase 3：润色与惊喜

| 改动 | 效果 |
|------|------|
| 空状态插画化 | 每个空状态都是一幅小场景 |
| 页面切入动画 | 每个 Tab 切换时有淡入+微微上移 |
| 氛围里程碑达成时的全屏特效 | 对标缮写完成结算卡的精致程度 |

---

## 四、具体 CSS 改进示例

如果只想做一件事来最大幅度提升观感，推荐先做**动态背景 + Tab 重构**：

```css
/* ========== 改进：动态氛围背景 ========== */
body {
  font-family: 'Noto Serif SC', serif;
  color: #2c2419;
  min-height: 100vh;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  transition: background-image 2s ease;
}

/* 默认 Lv1 废弃 */
body.stage-1 { background-image: linear-gradient(rgba(44,36,25,0.88), rgba(44,36,25,0.88)), url('visual/background/library_bg_01_abandoned.jpg'); }
body.stage-2 { background-image: linear-gradient(rgba(44,36,25,0.85), rgba(44,36,25,0.85)), url('visual/background/library_bg_02_ruined.jpg'); }
body.stage-3 { background-image: linear-gradient(rgba(44,36,25,0.80), rgba(44,36,25,0.80)), url('visual/background/library_bg_03_cozy.jpg'); }
body.stage-4 { background-image: linear-gradient(rgba(44,36,25,0.75), rgba(44,36,25,0.75)), url('visual/background/library_bg_04_gorgeous.jpg'); }
body.stage-5 { background-image: linear-gradient(rgba(44,36,25,0.70), rgba(44,36,25,0.70)), url('visual/background/library_bg_05_magnificent.jpg'); }

/* ========== 改进：Tab 导航重构 ========== */
.nav-btn {
  position: relative;
  padding: 0.6rem 1.2rem;
  border-radius: 0.5rem 0.5rem 0 0;
  transition: all 0.25s ease;
  border-bottom: 3px solid transparent;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.nav-btn:hover:not(.active) {
  transform: translateY(-2px);
  background: rgba(245,230,200,0.6);
}

.nav-btn.active {
  background: linear-gradient(180deg, #f5e6c8 0%, #ede0c1 100%);
  border-bottom: 3px solid #c9a227;
  box-shadow: 0 -4px 16px rgba(201,162,39,0.15);
  color: #2c2419;
}

/* ========== 改进：全局卡片升级 ========== */
.parchment-bg {
  background: linear-gradient(180deg, #f5e6c8 0%, #e8d5a8 100%);
  box-shadow: 
    inset 0 0 60px rgba(139,105,20,0.15),
    0 4px 24px rgba(0,0,0,0.2),
    0 0 0 1px rgba(139,105,20,0.1);
  position: relative;
  overflow: hidden;
}

/* 卡片顶部装饰线 */
.parchment-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, rgba(201,162,39,0.4), transparent);
}
```

---

## 五、总结判断

你的项目有一个巨大的优势：**美术资产质量极高且风格高度统一**（水彩奇幻风），但目前的 UI 没有把这些资产的力量释放出来。缮写室的动画证明了你有能力做出惊艳的效果——现在需要把这个标准扩散到其余 80% 的界面。

**最高 ROI 的单一改动：** 把 5 张氛围背景图设为 body 的动态背景。一行 CSS 类切换就能让整个网站从一个"带颜色的网页"变成一个"有世界的入口"。
