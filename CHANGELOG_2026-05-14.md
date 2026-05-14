# 修改日志

## 2026-05-14

### 音频系统

- 新建 `js/audio.js`：三层氛围 BGM 引擎
  - 废墟/破败/陈旧（0-160）：荒废图书馆 ×2 变奏
  - 温暖（161-300）：城镇风格 ×2 变奏
  - 星辰（301-500）：星辰图书馆 ×2 变奏
  - 交叉淡入淡出：10步音量渐变（0.05/步，120ms/步），总过渡1.2s
  - 音乐开关持久化到 `library_music`（localStorage）
- `index.html` 导航栏新增音乐开关按钮 🔈/🔇
- `js/storage.js`：`addAtmosphere()` 联调 `refreshBGM()`，氛围变化自动切换曲目
- `js/app.js`：BGM 首次专注完成后激活（新用户），回头客页面加载即播
- 音频文件上传至 `audio/` 目录（7首 MP3 + 1部 MP4，总计 ~40MB）

### PV 开场动画

- `js/app.js`：`showIntro()` 引入 PV 视频阶段
  - 三阶段流程：loading（纯图3s）→ video（PV播放）→ active（引导卡片）
  - 播放提示覆盖层：`▶️ 点击观看开场动画` + 双击跳过
  - 视频结束后自动进入引导卡片
- 修复：视频阶段"跳过"按钮双 handler 冲突（`addEventListener` + `onclick` 同时触发）改用 `cloneNode` 清除旧监听
- 修复：视频阶段跳过改为进入引导卡片（而非直接关闭 intro）

### 墨墨日志系统

- 新建 `js/diary.js`：墨墨（书架精灵）日记
  - `tryGenerateDailySummary()`：每日回顾，扫描昨日 history，统计专注/字数/完成/访客，三段式模板拼装
  - `addDiaryEntry(type, payload)`：特殊事件实时记录
  - 访客日志规则：首次来访/首次借书/首次还书各记一篇 + 每次特殊事件记一篇
- `js/state.js`：新增 `diary`、`diaryFirsts`、`diaryLastSummaryDate` 字段 + 旧档迁移
- `js/render/archive.js`：重写馆史档案页，新增「📊 馆史档案」和「📜 墨墨日志」子标签
  - 墨墨日志子标签：魔法羁绊等级卡片 + 日志条目列表

### 访客系统优化

- 专注完成后概率吸引访客：30%（氛围 0）→ 50%（氛围 500），不依赖完成整本书
- 完成整本书仍固定吸引一位访客
- Lv0 借阅区容量为 0（需先购买升级）
- 访客到来时右下角卡片提醒（8秒自动消失）
- 新增成就 V03「墨香来客」：第一位访客来到图书馆（青铜）
- 借阅区/缮写室升级各 +15 氛围，书架购买 +5 氛围
- 新增成就 L02b「墨香初遇」：购买第一本书（青铜）

### 专注模块

- 倒计时支持自定义分钟（1-180，步长5）
- 墨墨首次出场叙事：首次专注弹出对话 overlay，加速计时（100ms→1000ms）
- 结算卡片新增留存钩子：连续天数 / 累计字数 / 里程碑进度条
- book_001（小王子）初始进度调整为 95%（26,600/28,000字）

### 读者沙龙

- 开放借阅区后显示等级横幅大图（与缮写室一致的设计模式）
- Lv0 不显示图片，Lv1~Lv7 各对应专属插画

### 部署

- **平台**：腾讯云 EdgeOne Pages（`riftlibdemo-5tyvfdz4.edgeone.cool`）
- **代码托管**：Gitee（`sallyshen1987/library_demo`，分支 `refactor-book-system`）
- **域名**：`riftlib.com` + `riftlib.cn` + `riftlib.cloud`（已注册，待 ICP 备案）
- **服务器**：腾讯云轻量应用服务器 2核2GB TencentOS（用于备案接入）
- 推送代码自动触发 EdgeOne Pages 部署

### 文档维护

- 更新 `ARCHITECTURE.md`：文件结构 / 音频引擎 / 日志系统 / 访客机制 / 氛围来源 / 部署 / state 字段
- 更新 `CLAUDE.md`：文件结构 / localStorage / 核心数值 / 函数速查 / 部署 / 四期增量
- 新建 `CHANGELOG_2026-05-14.md`（本文件）
