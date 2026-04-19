# 知识库与 RAG 运行指南 Refactor Notes

## 本轮目标

把“知识库怎么建、RAG 怎么用、候选知识怎么晋升”从口头说明变成可执行的维护规范。

## 本轮新增

- [docs/knowledge-rag-operating-guide.md](/c:/智能日志分析系统/next-app/docs/knowledge-rag-operating-guide.md)

## 解决的问题

1. 规则库、知识库、RAG、人工复核职责不清
2. 主知识库、漏报库、运维经验库、候选池边界容易混淆
3. 候选池已有数据，但缺少晋升和维护标准

## 结果

现在已经形成一套可执行的使用口径：

- 规则先发现
- RAG 再解释
- 人工复核负责纠偏
- 候选池只做素材池，不直接等于主知识库

同时明确了：

- 哪些知识应该进 `knowledge_base`
- 哪些应该进 `historical_missed_cases`
- 哪些应该进 `ops_experience_library`
- 哪些只留在 `security_knowledge_candidates`
