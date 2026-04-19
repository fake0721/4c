# Rule Agent

职责：
- 维护异常分类
- 维护默认规则和数据库动态规则
- 输出统一规则检测结果

输入：
- 原始日志文本
- detection_rules
- default-rules.ts / db-rules.ts

输出：
- incidentId
- errorType
- severity
- matchedLines
- matchedKeywords
- snippet
- sourceRuleIds

边界：
- 不修改 RAG 检索逻辑
- 不修改模型 Prompt
- 不修改前端页面