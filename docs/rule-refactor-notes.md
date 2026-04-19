# Rule Agent Refactor Notes

## 本轮目标

本轮只处理 Rule Agent，目标是让规则层输出具备 `RuleDetectionResult` 语义，同时保持现有业务结果和调用方行为不变。

约束：

- 不修改 `app/`
- 不修改 `components/`
- 不修改 `rag.ts`
- 不修改 `openai-compatible-provider.ts`
- 不修改 `orchestrator.ts`

## 实际修改文件

- [lib/rules/engine.ts](/c:/智能日志分析系统/next-app/lib/rules/engine.ts)
- [docs/rule-refactor-notes.md](/c:/智能日志分析系统/next-app/docs/rule-refactor-notes.md)

本轮未修改：

- [lib/rules/default-rules.ts](/c:/智能日志分析系统/next-app/lib/rules/default-rules.ts)
- [lib/rules/db-rules.ts](/c:/智能日志分析系统/next-app/lib/rules/db-rules.ts)

原因：这两处现有能力已满足本轮要求，且不需要改动即可保持字段兼容和业务稳定。

## 兼容策略

`detectLogIncidents()` 仍然返回数组，但数组元素已升级为兼容结构：

- 同时包含新字段 `RuleDetectionResult`
- 同时保留旧字段 `DetectedIncident`

因此，现有调用方仍可继续读取：

- `ruleId`
- `ruleName`
- `riskLevel`
- `lineNumber`
- `rawText`

同时规则层内部已经具备新字段：

- `incidentId`
- `logId`
- `sourceType`
- `severity`
- `matchedLines`
- `matchedKeywords`
- `snippet`
- `sourceRuleIds`
- `detectedBy`

## 新旧字段映射

| 新字段 | 旧字段或来源 | 本轮取值 |
| --- | --- | --- |
| `incidentId` | 临时稳定占位 | `rule:${ruleId}:${lineNumber}` |
| `logId` | 暂无 | `""` |
| `sourceType` | `detectLogIncidents()` 入参 | 规范化后的 `sourceType` |
| `errorType` | `matchedRule.errorType` | 原值保留 |
| `severity` | `riskLevel` | `matchedRule.riskLevel` |
| `matchedLines` | `lineNumber` | `[lineNumber]` |
| `matchedKeywords` | 暂无 | `[]` |
| `snippet` | `rawText` | `normalizedLine` |
| `sourceRuleIds` | `ruleId` | `[matchedRule.id]` |
| `detectedBy` | 固定值 | `"rule"` |

旧字段保持不变：

| 旧字段 | 当前行为 |
| --- | --- |
| `ruleId` | 保留 |
| `ruleName` | 保留 |
| `riskLevel` | 保留 |
| `lineNumber` | 保留 |
| `rawText` | 保留 |

## 未处理项

- `incidentId` 目前不是最终的 `log_errors.id`，只是规则层临时稳定占位
- `logId` 目前无法在 Rule 层真实赋值，暂时保留空字符串
- `matchedKeywords` 本轮未做真实提取，统一返回空数组
- `lib/rules/types.ts` 仍然没有升级为正式的 `RuleDetectionResult` 类型真源
- 上层 `app/logs/actions.ts` 仍然使用旧字段消费规则结果

## 对业务结果的影响

本轮不应改变以下行为：

- 默认规则内容和顺序
- 动态规则读取逻辑
- 规则启停逻辑
- 每行只取第一个命中规则
- 堆栈噪音过滤逻辑
- 返回顺序

换句话说，本轮只扩展输出结构，不改变匹配结果。

## 验证情况

本轮计划执行静态检查，确认：

- `detectLogIncidents()` 返回结果同时具备新旧字段
- 旧字段值保持不变
- 新字段值符合映射规则

如果未运行完整检查，应在后续提交前补一次类型检查。

## 下一轮对 Model 层的影响

下一轮进入 Model 层时，可以基于本轮兼容输出继续推进：

- 让 `IncidentAnalysisInput.incident` 逐步从 `DetectedIncident` 迁移到兼容结构
- 把 `severity` / `matchedLines` / `sourceRuleIds` 接入模型侧输入
- 在上层落库后，把临时 `incidentId` 替换为正式 `log_errors.id`

建议顺序仍然是：

1. 先让 Model 层接受兼容结构
2. 再下沉 `needsReview`
3. 最后清理旧字段依赖
