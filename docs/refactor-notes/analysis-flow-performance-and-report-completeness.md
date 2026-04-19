# 分析链路性能与报告完整性修复说明

## 背景
用户反馈：
- 300~500 行日志分析耗时约 2 分钟
- 分析报告页问题样本展示不全
- 分析完成后页面跳转体验不稳定

## 本次改动

### 1. 编排层性能优化
文件：`lib/analysis/orchestrator.ts`

- 调整 `analyzeIncidents`：当 provider 不存在（rule-only）时，直接返回规则结果，不再触发 `resolveRagContext`。
- 调整 `analyzeRepresentativeGroups`：rule-only 分支调用 `analyzeIncidents` 时不再传入 `resolveRagContext`。

效果：避免规则兜底路径做无意义的知识库检索，减少 RAG 查询开销。

### 2. 上传分析链路 IO 优化
文件：`lib/logs/upload-service.ts`

- 移除“上传后再下载文件用于分析”的二次存储 IO。
- 改为复用上传前已读取的 `fileText` 进行规则检测和后续分析。

效果：减少一次 Supabase Storage 下载开销，缩短端到端等待时间。

### 3. 报告页样本完整性修复
文件：`lib/dashboard/analysis-report.ts`

- 移除 `detailRows` 的 `slice(0, 8)` 截断逻辑。
- 详情行生成改为以 `log_errors` 为基准构建，未匹配到 `analysis_results` 的问题也显示占位文案。

效果：报告页问题样本与检测结果总量对齐，不再只显示前 8 条。

## 兼容性
- 未修改 Rule/RAG/Model 输出字段结构。
- 未修改数据库表结构。
- 保持现有页面路由与查询参数兼容。

## 验证建议
1. 上传 300~500 行日志，记录上传到报告可见的总耗时。
2. 对比 `log_errors` 总条数与报告页“问题样本”数量是否一致。
3. 在网络较慢场景下重复上传，确认是否稳定跳转到 `/dashboard/analyses?logId=...`。
