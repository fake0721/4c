# Dashboard 去 iframe 第一阶段实施规划

## 目标

- 在不改变现有米色系 UI 样式、布局外观、文案层级的前提下，开始执行 dashboard 去 iframe 改造。
- 第一阶段只做两件事：
  1. 建立真实的 `app/dashboard/layout.tsx`
  2. 完成 `工作台` 页面脱 iframe 试点

## 当前代码现状

### 现有路由状态

- `app/dashboard/page.tsx` 仍然直接返回 `StaticInnerPage`
- `app/dashboard/reviews/page.tsx`、`app/dashboard/high-risk/page.tsx` 等同样如此
- `components/dashboard/static-inner-page.tsx` 负责加载 iframe，并在 `onLoad` 后做头像同步补丁
- `app/dashboard/layout.tsx` 当前不存在

### 现有静态页状态

- `public/inner-pages/工作台/code.html` 包含：
  - 左侧栏
  - 顶部栏
  - 统计卡片
  - 趋势图
  - 类型分布
  - 最近分析记录
  - 待办事项
  - 头像菜单 / 通知角标
- 页面内同时包含：
  - Tailwind CDN
  - 字体引入
  - 页面脚本
  - `/api/inner-data?view=dashboard` 请求

### 现有可复用资产

- 可以复用：
  - `app/api/inner-data/route.ts` 中 `view=dashboard` 的数据结构
  - `app/auth/actions.ts`
  - `app/logs/actions.ts`
  - `app/layout.tsx` 中的全局字体接入方式
- 不建议直接复用：
  - `components/dashboard/dashboard-shell.tsx`
  - `components/dashboard/dashboard-overview.tsx`
  - `components/dashboard/overview-charts.tsx`

原因：
- 这些组件已经是一套独立的深色风格控制台，不是当前静态页的视觉体系。
- 直接复用会破坏“样式完全不变”的要求。

## 第一阶段边界

### 本阶段允许改动

- `app/dashboard/layout.tsx`
- `app/dashboard/page.tsx`
- `components/dashboard/shell/*`
- `components/dashboard/pages/workbench/*`
- `lib/dashboard/workbench.ts`
- `styles/dashboard-theme.css` 或 `app/globals.css` 中 dashboard 相关样式收口

### 本阶段不改动

- `reviews`
- `high-risk`
- `account`
- `tasks`
- `rules`
- `incidents`
- 模型、规则、RAG 逻辑
- `review_cases` / `analysis_results` 字段结构

## 文件级实施清单

### 一、建立公共壳

#### 1. 新增 `app/dashboard/layout.tsx`

职责：
- 承载 dashboard 统一布局
- 渲染米色背景和页面容器
- 引入新的 dashboard shell

输出：
- 所有 `app/dashboard/*` 页面共享一套公共壳

#### 2. 新增 `components/dashboard/shell/dashboard-layout.tsx`

职责：
- 组合侧栏、顶栏、页面内容区
- 控制外层 padding、容器宽度、滚动行为

#### 3. 新增 `components/dashboard/shell/dashboard-sidebar.tsx`

职责：
- 复刻 `工作台/code.html` 当前左侧栏
- 保留：
  - 系统标题
  - 工作台 / 日志分析 / 问题处理 / 历史与知识 / 系统管理
  - 帮助中心 / 技术文档
  - 开始新分析

注意：
- 链接全部替换为真实 Next 路由
- 不再使用 `../xx/code.html`

#### 4. 新增 `components/dashboard/shell/dashboard-topbar.tsx`

职责：
- 复刻当前顶部栏
- 保留：
  - 面包屑文字
  - 搜索框
  - widgets 按钮
  - 通知按钮
  - 头像入口

#### 5. 新增 `components/dashboard/shell/dashboard-user-menu.tsx`

职责：
- 复刻静态页右上角头像下拉菜单
- 保留：
  - 个人页面
  - 退出登录

### 二、迁移工作台页面

#### 6. 新增 `lib/dashboard/workbench.ts`

职责：
- 从 `app/api/inner-data/route.ts` 中抽出 `view=dashboard` 所需查询逻辑
- 输出结构与当前静态页消费结构保持一致：
  - `metrics`
  - `trend`
  - `typeBreakdown`
  - `recentLogs`
  - `pendingTodos`
  - `pendingReviewCount`

要求：
- 首轮可直接复制接口分支逻辑，再抽函数
- 不改字段名

#### 7. 新增 `components/dashboard/pages/workbench/workbench-page.tsx`

职责：
- 复刻 `工作台/code.html` 主内容 DOM
- 不包含侧栏和顶栏
- 只保留内容区

#### 8. 新增拆分组件

- `workbench-metrics.tsx`
- `workbench-trend.tsx`
- `workbench-type-breakdown.tsx`
- `workbench-recent-logs.tsx`
- `workbench-pending-todos.tsx`

原则：
- 组件拆分只为了可维护
- 视觉必须以静态页为准

#### 9. 修改 `app/dashboard/page.tsx`

从：
- `StaticInnerPage src="/inner-pages/工作台/code.html"`

改为：
- 直接渲染新 `workbench-page`

### 三、样式收口

#### 10. 新增 `styles/dashboard-theme.css`

职责：
- 收纳 `工作台/code.html` 中的 dashboard token：
  - 颜色
  - 字体别名
  - 圆角
  - 阴影
  - 玻璃面板类

要求：
- 不把整页 `body, h1, p, span` 这种强覆盖直接搬过去
- 统一限制在 dashboard 容器内

#### 11. 在 `app/layout.tsx` 或 `app/dashboard/layout.tsx` 引入 theme

职责：
- 让 dashboard 页面使用同一套主题，不再依赖每个 `code.html` 的内联 `<style>`

## 实施顺序

1. 先抽样式 token，不抽业务逻辑
2. 再建 shell
3. 再迁工作台内容区
4. 再把工作台数据逻辑抽到 `lib/dashboard/workbench.ts`
5. 最后切路由入口

## 验收标准

### 第一阶段验收

1. `/dashboard` 不再经过 iframe
2. 页面视觉与当前 `工作台/code.html` 基本一致
3. 左侧栏和顶部栏只渲染一次
4. 页面切换到工作台时，体感明显优于当前方案
5. 未迁移页面仍然可以继续走 `StaticInnerPage`

## 风险点

1. 当前静态页含有大量页面级全局样式，直接搬运容易污染其它页面
2. 当前静态页顶部栏与侧栏写死在页面内，拆壳时容易遗漏边距和层级
3. `view=dashboard` 查询逻辑目前全部堆在接口里，首轮抽取要保证字段兼容
4. 现有 `components/dashboard/*.tsx` 是另一套深色 UI，不能误复用

## 第二阶段入口条件

在以下条件都满足后，才进入 `人工复核` 页面迁移：

1. 工作台已脱 iframe
2. 公共壳已经稳定
3. dashboard theme 已固定
4. 视觉验收通过
