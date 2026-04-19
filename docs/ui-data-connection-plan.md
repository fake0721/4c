# UI 真实数据接线计划（保持现有样式）

## 目标

- 不改现有 `public/inner-pages/**/code.html` 的布局、配色和组件层级。
- 仅通过脚本替换静态文案/表格数据来源，将页面接到 Supabase 真实数据。
- 一次只处理 UI 模块，不改 Rule / RAG / Model 算法与字段。

## 数据来源

- `logs`
- `log_errors`
- `analysis_results`
- `review_cases`
- `detection_rules`
- `profiles`

## 接口策略

- 新增统一只读接口：`GET /api/inner-data?view=<name>`。
- `view` 范围：
  - `dashboard`
  - `analyses`
  - `incidents`
  - `history-logs`
  - `history-cases`
  - `rules`
  - `reviews`
  - `account`
- 所有返回都按当前登录用户 `user_id` 过滤（规则列表除外，规则为系统共享）。

## 页面挂点

- `工作台/code.html`
  - 顶部 4 个指标卡
  - 最近分析结果列表
  - 待办条数
- `分析记录/code.html`
  - 分析记录主表
- `问题中心/code.html`
  - 问题列表主表
- `历史日志存档/code.html`
  - 历史日志主表
- `历史问题库/code.html`
  - 已复核/归档问题表
- `规则配置管理/code.html`
  - 统计卡 + 规则表
- `人工复核/code.html`
  - 左侧待复核队列 + 右侧详情联动
- `个人页面/code.html`
  - 个人资料读取和保存
- `性能分析/code.html`
  - 顶部 3 个性能指标卡（准确率/召回率/处理速度）
  - 三模式对比柱图（准确率/召回率/吞吐量/资源消耗）
  - 实验详细指标表（Rule Only / Model Only / Hybrid）
  - 智能洞察文案（基于当前窗口期实时生成）

## 性能分析接口约定

- `GET /api/inner-data?view=performance&days=7|30`
- `GET /api/inner-data?view=performance&days=7|30&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- 返回字段：
  - `metrics`
    - `accuracy` / `accuracyDelta`
    - `recall` / `recallDelta`
    - `speedEps` / `speedDelta`
  - `chart`
    - `label`
    - `ruleOnly`
    - `modelOnly`
    - `hybrid`
  - `modes[]`
    - `modeLabel`
    - `accuracy`
    - `recall`
    - `f1`
    - `latencyMs`
    - `status`
  - `insights[]`
  - `pendingReviewCount`
  - `range`
    - `startDate`
    - `endDate`
    - `isCustom`

## 字段兼容原则

- 前端展示字段继续使用现有中文文案，不改视觉。
- 风险等级统一映射：`low|medium|high` -> `低风险|中风险|高风险`。
- 状态统一映射：`processing|completed|failed` -> `分析中|已完成|已失败`。
- 缺失字段使用安全兜底值，避免页面空白。

## 回退策略

- 任意接口失败时，页面保留原静态内容，不破坏当前样式。
- 所有接线逻辑置于页面底部脚本，失败仅 `console.error`。
