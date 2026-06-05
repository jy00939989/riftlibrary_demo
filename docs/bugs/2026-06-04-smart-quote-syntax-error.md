# Smart Quote 语法错误 · 2026-06-04

## 现象

Netlify 部署后页面白屏，控制台报错：

```
Uncaught SyntaxError: Invalid or unexpected token
```

Node 本地 `--check` 语法检查**全部通过**，但浏览器和 `--input-type=module` 加载失败。

## 定位

二分排查定位到 `data/visitor-events.js` 第 860 行：

```js
id: 'xc_o01',   // ← 开头引号是 Unicode U+2018，不是 ASCII '
title: '第三次试镜——被刷！！',
```

Node `--check` 在 CommonJS 模式会跳过模板字符串内部语法，但 **ESM 加载器**在 `id:` `title:` 这些 JS 语法位置遇到 smart quotes 时直接报 `Invalid token`。

## 根因

Agent 批量改写访客叙事文本时，将 JS 代码中的普通单引号 `'`（U+0027）替换成了 smart quotes `'`（U+2018）/ `'`（U+2019）。

## 影响范围

- 172 处 smart quotes
- ~30 处在 JS 语法位置（`id:` `title:` `text:` 等属性名值分隔符）
- 其余在模板字符串内部（安全但不符合规范）

## 修复步骤

1. 全局替换 `'` `'` → `'`
2. 10 行 `text: '...'` 内部含中文对话单引号造成分隔符冲突 → 改为反引号 `text: `...``
3. 用 `.mjs` 扩展名验证 ESM 加载：

```bash
cp data/visitor-events.js /tmp/test.mjs && node /tmp/test.mjs
# 无输出 = 通过
```

4. 确认 `node --input-type=module -e "import('./js/app.js')"` 正常

## 教训

| # | 教训 |
|---|------|
| 1 | Agent 改写文本时必须指定「use ASCII single quotes (U+0027), never smart/curly quotes」 |
| 2 | `node --check` 在 CommonJS 模式下**不可靠**，必须用 `--input-type=module` 或 `.mjs` 验证 ESM |
| 3 | 部署前应跑一次完整 ESM import chain 测试 |
| 4 | Smart quote 类 bug 的特点是：语法检查不报错，但 ESM 加载失败——表象完全误导 |
