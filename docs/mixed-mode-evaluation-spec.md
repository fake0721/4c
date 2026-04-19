# 混合模式效果评估规范

## 目标

- 将 `性能分析` 页面收敛为对外可理解的 `模式效果对比` 页面。
- 页面核心任务不是展示学术实验，而是用当前系统已有真实运行数据，说明 `Hybrid` 相比 `Rule Only` 和 `Model Only` 更适合作为默认分析方案。
- 不新增高成本全量重跑，不把页面访问变成三模式实时 benchmark。

## 范围

- `app/api/inner-data/route.ts`
  - `view=performance`
- `public/inner-pages/性能分析/code.html`
- `docs/refactor-notes/*`

## 页面命名

- 页面标题：`模式效果对比`
- 页面副标题：强调“基于当前窗口期真实运行数据聚合”，不是独立实验室压测。
- 避免继续使用 `算法性能对比实验` 这类容易被理解为严格离线实验的命名。

## 表达原则

- 先给结论，再给证据。
- 结论层明确表达：`混合模式是默认推荐方案`
- 证据层只展示最能说明价值的三类信息：
  - 准确性
  - 覆盖率
  - 延迟/开销
- 说明层明确写出：
  - 数据来源于当前窗口期真实日志与分析结果聚合
  - 页面展示不触发三模式重跑
  - 结果用于产品说明，不直接作为发布门槛

## 低资源实现

- 继续复用现有 `logs` 与 `analysis_results` 聚合结果。
- 页面只读取 `view=performance` 返回的窗口期汇总数据。
- 不新增全量历史回放。
- 不在页面访问时重新执行 `Rule Only / Model Only / Hybrid` 三套分析。

## 指标口径

- `混合模式准确性`
  - 继续沿用当前页面的置信度折算口径
  - 页面必须明确它是“窗口期平均判断质量”，不是人工标注集 accuracy
- `混合模式覆盖率`
  - 继续沿用 `findings / tasks` 的窗口期覆盖口径
- `混合模式平均延迟`
  - 继续沿用 `analysis_results.latency_ms` 的均值

## 对比方式

- 与 `Rule Only` 对比：
  - 混合模式准确性差值
  - 混合模式覆盖率差值
- 与 `Model Only` 对比：
  - 混合模式平均延迟差值

## 接口输出扩展

- 保持现有 `metrics / chart / modes / insights` 字段兼容。
- 允许在 `view=performance` 中新增：
  - `focusMetrics`
  - `recommendation`

### focusMetrics

- `accuracy`
  - `label`
  - `value`
  - `compareDelta`
  - `compareLabel`
  - `note`
- `recall`
  - 同上
- `latency`
  - 同上

### recommendation

- `title`
- `summary`
- `evidence[]`
- `footnote`

## UI 规则

- 顶部标题区直接说明：当前默认推荐混合模式。
- 三张指标卡改成“混合模式证据卡”，不再展示过于泛化的全局指标标题。
- 智能洞察区保留，但文案应围绕“为什么混合模式更适合作为默认方案”。
- 表格区标题从 `实验详细指标` 改成 `模式明细`。

## 非目标

- 本次不实现严格离线标注集 benchmark。
- 本次不新增规则层、模型层、RAG 层的大规模重跑能力。
- 本次不修改发布门槛逻辑。
