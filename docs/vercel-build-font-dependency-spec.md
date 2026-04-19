# Vercel Build Font Dependency Spec

## 背景
- 当前根布局在 `app/layout.tsx` 中通过 `next/font/google` 引入 `Manrope`、`Inter`、`Space_Grotesk`。
- 该实现会让构建阶段依赖外部字体资源可访问性，一旦字体下载失败，`next build` 会直接失败。

## 问题定义
- 部署平台构建时不应依赖 Google Fonts 在线拉取成功。
- 现有 UI 仅通过 `--font-manrope`、`--font-inter`、`--font-space-grotesk` 三个变量消费字体，不需要保留 `next/font/google` 的运行时行为。

## 约束
- 仅处理 UI 壳层，不改规则层、模型层、RAG 层。
- 保持现有 `.font-headline`、`.font-body`、`.font-label` 类名和字段兼容。
- 采用外包裹式修复，避免大面积重写页面。

## 方案
1. 移除 `app/layout.tsx` 中 `next/font/google` 依赖。
2. 在 `app/globals.css` 的 `:root` 中直接定义三组字体变量的本地回退栈。
3. 保持现有字体类引用不变，使页面视觉结构不受影响。

## 验证
1. 本地执行 `npm run build`。
2. 确认不再出现 Google Fonts 拉取和 Turbopack 字体模块解析失败。
