# UI Refactor Notes

## 本轮目标

- 在不改变 `public/inner-pages/**/code.html` 视觉样式的前提下，接入真实数据。

## 已完成改动

1. 新增统一数据接口
   - `app/api/inner-data/route.ts`
   - 支持 `GET /api/inner-data?view=<...>`
   - 支持 `POST /api/inner-data`：
     - `action=update-profile`
     - `action=update-password`

2. 新增计划文档
   - `docs/ui-data-connection-plan.md`

3. 已接线页面（仅底部脚本数据注入）
   - `public/inner-pages/工作台/code.html`
   - `public/inner-pages/分析记录/code.html`
   - `public/inner-pages/问题中心/code.html`
   - `public/inner-pages/历史日志存档/code.html`
   - `public/inner-pages/规则配置管理/code.html`
   - `public/inner-pages/人工复核/code.html`
   - `public/inner-pages/历史问题库/code.html`
   - `public/inner-pages/个人页面/code.html`

## 兼容性策略

- 保持原有 DOM 结构和样式类名，避免视觉回归。
- 网络失败时不破坏页面：保留静态内容，仅输出控制台错误。
- 风险等级、状态文本统一映射为中文标签。

## 验证结果

- `npm run build` 已通过。

## 增量记录（2026-03-26）

- 工作台页面 `public/inner-pages/工作台/code.html`
   - 问题类型分布支持英文类型到中文展示映射（仅文案映射，不改样式）。
   - 最近分析结果改为始终由真实数据渲染；无数据时显示“暂无分析记录”，避免保留示例假数据。
   - 待处理事项改为由接口返回的 `pendingTodos` 渲染；无数据时显示空状态提示。
- 接口页面 `app/api/inner-data/route.ts`
   - `view=dashboard` 新增 `pendingTodos` 字段（从 `review_cases` 待复核队列聚合，关联 `log_errors/logs` 生成标题与描述）。
   - 保持已有字段兼容，未删除原响应字段。

- 人工复核页面 `public/inner-pages/人工复核/code.html`
   - 待复核列表由 `queue` 真实数据动态渲染，不再保留固定三条静态示例。
   - 详情区（标题、事件 ID、日志片段、根因、建议、置信度）与当前选中任务联动。
   - 当 `queue` 为空时显示空状态与 `0 / 0` 进度，避免回退到假数据。

- 接口页面 `app/api/inner-data/route.ts`
   - `view=reviews` 新增返回字段：`confidence`、`cause`、`suggestion`，用于人工复核详情展示。

- 问题名称中文化（中文优先）
   - 在 `app/api/inner-data/route.ts` 新增统一问题类型名称映射：优先返回中文；对于缩写或术语易歧义项使用中英并列（如 `服务端错误（HTTP 5XX）`）。
   - 应用范围：`view=incidents`、`view=reviews`、`view=dashboard` 的待办标题字段。

- 探索根因知识库页面真实化
   - 新增 `view=knowledge`：从 `public.knowledge_base` 读取知识条目并返回卡片渲染所需字段。
   - `public/inner-pages/探索根因知识库/code.html` 改为动态渲染知识卡片（标题、根因摘要、解决方案预览、来源），去除固定示例依赖。
   - 页面视觉结构、样式类名与交互外观保持不变。

- 探索根因知识库中文命名与可打开详情
   - `app/api/inner-data/route.ts` 增加知识条目标题中文映射（中文优先）与来源中文标签（官方文档/内部手册等）。
   - `public/inner-pages/探索根因知识库/code.html`：分类标签改为中文；点击卡片或箭头可打开详情弹层，展示根因摘要、根因分析与解决方案。

- 探索根因知识库小按钮交互可用化
   - 搜索输入框支持实时筛选。
   - 热门搜索标签支持点击并回填搜索。
   - 高级筛选按钮可展开/收起筛选面板（分类、来源、重置）。
   - 分页按钮（上一页/下一页/页码）按筛选结果动态可用。

- 规则配置管理可用化
   - `view=rules` 增加中文描述生成逻辑，描述列不再直接展示英文正则表达式。
   - `POST /api/inner-data` 新增规则操作动作：启停、重命名、复制、删除。
   - `public/inner-pages/规则配置管理/code.html` 接入右侧操作按钮事件与状态切换，按钮从不可用改为可交互。

- 规则名称中文化与前端文案巡检
   - `view=rules` 增加 `displayName`（规则名称中文优先展示），并在规则页优先渲染该字段。
   - 扫描并替换静态内页高频英文 UI 文案（例如品牌副标题、知识库卡片标签/更新时间/来源前缀等）为中文。
   - 保留必要英文术语与原始日志内容，避免语义失真。

- 性能分析页面真实化
    - `app/api/inner-data/route.ts` 新增 `view=performance`：
       - 支持 `days=7|30` 窗口聚合。
       - 返回顶部指标（准确率/召回率/处理速度）与环比增量。
       - 返回三模式对比图数据（准确率/召回率/吞吐量/资源消耗）。
       - 返回实验明细表数据（Rule Only / Model Only / Hybrid）。
       - 返回智能洞察文案与待复核数量。
    - `public/inner-pages/性能分析/code.html`：
       - 保持原样式与布局，仅新增数据挂点与 hydration 脚本。
       - 顶部指标卡、对比柱图、洞察区、实验明细表改为接口驱动。
       - 时间范围按钮支持 7 天/30 天切换并刷新数据。
      - “自定义”按钮支持输入开始/结束日期（YYYY-MM-DD）并按自定义区间聚合刷新。

- 系统设置页面可用化
    - `app/api/inner-data/route.ts` 新增 `view=settings`，可读取当前用户系统设置。
    - `POST /api/inner-data` 新增 `action=update-system-settings`，可保存模型配置与全局参数。
    - `public/inner-pages/系统设置/code.html`：
       - 接入引擎选择、温度、Token、并发数、保留时长、开关项的交互。
       - 接入“确认并保存设置”与“重置为默认”按钮。
       - 页面样式和布局保持不变，仅补底部脚本与元素绑定 ID。

- 导出模板管理可用化
    - `app/api/inner-data/route.ts`
       - `view=settings` 新增返回 `exportTemplates` 与 `activeExportTemplateId`。
       - `POST /api/inner-data` 新增 `action=update-export-templates`，持久化模板列表和当前激活模板。
    - `public/inner-pages/系统设置/code.html`
       - 默认模板支持点击切换激活态。
       - “创建自定义模板”支持新增模板卡片并持久化。
       - “上传新模板”支持文件选择后新增模板卡片并持久化。
      - 上传文件改为真实落到 Supabase Storage `template-files`，并返回可下载签名链接。

- 历史日志页“知识沉淀/趋势预览”真实化
    - `app/api/inner-data/route.ts` 的 `view=history-logs` 新增 `overview`：
       - `knowledgeTemplateCount`
       - `trend[]`（最近 8 天任务趋势与柱高）
       - `totalStorageGb`
       - `monthTaskCount`
    - `public/inner-pages/历史日志存档/code.html`：
       - 知识沉淀文案改为接口数量驱动。
       - 趋势柱图与时间标签改为接口数据驱动。
       - 总存储容量、本月任务数改为接口数据驱动。

- 历史日志页“关键词检索/分页”可用化
    - `public/inner-pages/历史日志存档/code.html`
       - 关键词检索支持按日志名称与任务 ID 实时筛选。
       - 日期范围筛选支持最近 7 天/30 天/2023Q4 过滤。
       - 分页组件改为真实联动（上下页、页码、显示区间与总数同步）。
       - 修复检索输入在浅色背景下的可读性问题。

- 分析报告页右上角操作按钮可用化
   - `public/inner-pages/分析报告/code.html`
      - “导出 Word”按钮接入真实导出：按当前报告真实数据生成 `.doc` 文件并下载。
      - “导出 PDF”按钮接入打印导出：打开打印视图并支持另存为 PDF。
      - “提交复核”按钮接入跳转：携带 `reportId/logId/fileName` 参数跳转至人工复核页。
      - 保持原有视觉样式，仅新增按钮 ID 与底部脚本事件绑定。

## 后续建议

- 对 `分析报告/code.html` 补充基于 `logId` 的详情 API 与参数化加载。
- 将重复的通知弹窗脚本提取为共享静态脚本，降低多页面维护成本。