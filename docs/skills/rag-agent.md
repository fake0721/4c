# RAG Agent

职责：
- 维护知识库结构
- 维护漏报库
- 负责混合检索与重排

输入：
- Rule Agent 输出
- knowledge_base
- embeddings
- rag.ts

输出：
- incidentId
- querySummary
- retrievedCases[]
- title
- errorType
- similarityScore
- rootCause
- repairSuggestion
- sourceType

边界：
- 不修改规则检测逻辑
- 不直接改模型输出 schema
- 不改前端页面