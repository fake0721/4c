# History Case Re-review Design

## Background
- 历史问题库当前仅支持 `查看复盘` 与 `删除`，已完成人工复核的案例无法直接修改。
- 用户希望在历史问题库中增加 `重新复盘` 能力，且要求：
  - 不跳转到人工复核页；
  - 直接在历史问题库中轻量编辑；
  - 保存后更新当前展示内容；
  - 同时保留修改轨迹。

## Goal
- 为 `已复盘` 历史案例提供就地重新复盘能力。
- 保持当前历史问题库的浏览节奏不变，不引入额外长流程。
- 让最新复盘结论成为主展示口径，同时保留可追溯的修改记录。

## Non-goals
- 不把 `已跳过`、`已归档` 或 `待复核` 记录纳入本次重新复盘能力。
- 不重做整套人工复核工作流。
- 不引入完整版本管理系统或独立轨迹页面。
- 不在本次范围内新增知识库回填、规则沉淀等联动动作。

## User Flow
1. 用户进入历史问题库。
2. 对 `已复盘` 记录看到新的 `重新复盘` 操作。
3. 点击后打开轻量编辑弹窗，停留在当前页面上下文。
4. 用户修改异常类型、风险等级、复盘说明。
5. 点击保存后：
   - 当前 `review_cases` 记录被更新；
   - 写入一条复盘修改轨迹；
   - 历史问题库列表中的当前行数据同步刷新；
   - 弹窗内展示最近几条修改轨迹摘要。

## UI Design

### Entry Point
- 文件：[components/dashboard/pages/history-cases/history-cases-page.tsx](D:/智能日志分析/--main/components/dashboard/pages/history-cases/history-cases-page.tsx)
- 在操作列中，对 `reviewStatusLabel === "已复盘"` 的记录新增 `重新复盘` 按钮。
- 操作顺序为：`查看复盘 / 重新复盘 / 删除`。

### Re-review Modal
- 复用当前页面的弹层风格，采用居中弹窗。
- 弹窗顶部展示只读信息：
  - 问题名称
  - 来源日志
  - 最近复盘时间
  - 事件 ID
- 可编辑字段仅保留 3 项：
  - 异常类型
  - 风险等级
  - 复盘说明
- 弹窗底部按钮：
  - `取消`
  - `保存修改`

### Revision Summary
- 在弹窗下半部分增加 `最近修改轨迹` 区块。
- 首版只展示最近数条轨迹摘要，每条包括：
  - 修改时间
  - 异常类型变化摘要
  - 风险等级变化摘要
  - 复盘说明是否更新
- 不提供完整 diff 展开，不单独跳转轨迹详情页。

## Data Design

### Current Review Source
- 当前主数据仍以 `review_cases` 为准。
- 保存重新复盘时，更新以下字段：
  - `final_error_type`
  - `final_risk_level`
  - `review_note`
  - `updated_at`

### Revision Table
- 新增表：`review_case_revisions`
- 建议字段：
  - `id uuid primary key default gen_random_uuid()`
  - `review_case_id uuid not null references public.review_cases(id) on delete cascade`
  - `user_id uuid not null references auth.users(id) on delete cascade`
  - `before_snapshot jsonb not null`
  - `after_snapshot jsonb not null`
  - `created_at timestamptz not null default now()`

### Snapshot Shape
- `before_snapshot` / `after_snapshot` 统一保存：
  - `final_error_type`
  - `final_risk_level`
  - `review_note`
  - `updated_at`
- 采用 `jsonb` 是为了后续若要扩展到 `final_cause`、`resolution`，无需再次调整表结构。

## Read Path Changes

### History Cases Page Data
- 文件：[lib/dashboard/history-cases.ts](D:/智能日志分析/--main/lib/dashboard/history-cases.ts)
- 扩展 `HistoryCaseRow`，补充轻量编辑所需字段：
  - `issueTypeValue`
  - `riskValue`
  - `reviewNote`
- 列表数据继续保留现有展示字段，避免 UI 端二次推断。

### Revision Read
- 历史问题库页面初版不在首屏批量拉取所有轨迹。
- 点击 `重新复盘` 后，再请求当前 `reviewCaseId` 的最近轨迹列表。
- 这样可以避免给列表页首屏增加无关负载。

## Write Path Changes

### API Action
- 文件：[app/api/inner-data/route.ts](D:/智能日志分析/--main/app/api/inner-data/route.ts)
- 新增 action：`history-case-rereview`

### Request Payload
- `reviewCaseId`
- `finalErrorType`
- `finalRiskLevel`
- `reviewNote`

### Write Sequence
1. 校验 `reviewCaseId` 存在且属于当前用户。
2. 校验当前记录状态为 `completed`，否则拒绝写入。
3. 读取当前记录作为 `before_snapshot`。
4. 更新 `review_cases` 当前记录。
5. 写入 `review_case_revisions` 一条轨迹。
6. 返回最新主记录与最近轨迹摘要，供前端就地刷新。

### Validation Rules
- `finalErrorType` 允许为空字符串转为 `null`，但优先保留现有值，避免误清空。
- `finalRiskLevel` 仅允许 `high | medium | low`。
- `reviewNote` 允许为空，但前端需明确提示用户这是在覆盖当前复盘说明。

## Error Handling
- 记录不存在：返回 404。
- 非当前用户记录：返回 403/404 风格的安全响应。
- 当前记录不是 `已复盘`：返回 400，并提示仅允许重新复盘已复盘案例。
- 更新成功但轨迹写入失败：整体按失败处理，避免出现“当前内容已改但无轨迹”的不一致状态。
- 前端保存失败时保留用户输入，不清空弹窗表单。

## Testing Strategy

### Manual Verification
1. 在历史问题库中确认 `已复盘` 记录显示 `重新复盘`。
2. 打开弹窗后确认默认值与当前记录一致。
3. 修改异常类型、风险等级、复盘说明并保存。
4. 确认列表行内容立即同步为最新值。
5. 再次打开弹窗，确认能看到新增的一条轨迹摘要。
6. 对非 `已复盘` 记录确认不显示 `重新复盘`。

### Build / Regression
1. `npm run build`
2. 检查历史问题库现有筛选、分页、删除、查看复盘不回归。
3. 检查 `/dashboard/reviews?reviewCaseId=...` 读取到的同一条记录已同步为最新内容。

## Risks
- 当前仓库里历史问题库与复盘详情页存在两套消费模型，需要保证字段命名一致，避免一处更新一处不更新。
- 如果后续要把 `final_cause`、`resolution` 也纳入轻量编辑，本设计的数据层已经留有扩展空间，但 UI 不在本次范围内。

## Recommendation
- 采用“历史问题库就地轻量编辑 + 独立轨迹表”的最小完整方案。
- 这是当前最符合用户诉求、最容易控制范围、且能兼顾后续扩展的实现路径。
