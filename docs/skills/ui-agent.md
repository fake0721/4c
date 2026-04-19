# UI Agent

职责：
- 维护五大模块 UI
- 维护报告页
- 维护问题处理页
- 维护导出 Word/PDF 模板

输入：
- analysis_results
- review_cases
- Rule Agent 展示字段
- RAG Agent 展示字段
- Model Agent 输出字段

输出：
- 工作台页面结构
- 分析报告页结构
- 问题处理页结构
- 历史与知识页面结构
- Word/PDF 报告模板

边界：
- 不改规则算法
- 不改 RAG 检索算法
- 不改模型 Prompt