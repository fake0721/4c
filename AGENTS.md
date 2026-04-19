# AGENTS

在本仓库中工作时，必须遵守以下规则：

## 总原则
1. 先阅读 docs/skills/orchestrator-agent.md
2. 再根据任务类型阅读对应技能文档：
   - docs/skills/rule-agent.md
   - docs/skills/rag-agent.md
   - docs/skills/model-agent.md
   - docs/skills/ui-agent.md
3. 不允许未经确认直接大面积重写现有系统
4. 优先复用现有代码，采用“外包裹式重构”
5. 所有模块修改必须保持字段兼容
6. 一次只处理一个模块，不要跨模块同时大改

## 执行顺序
1. 先规则层
2. 再模型层
3. 再 RAG 层
4. 最后 UI 与导出

## 输出要求
1. 先给计划，再改代码
2. 优先生成 docs/*.md 规范文件
3. 修改完成后，生成对应的 refactor-notes 文档
4. 不清楚归属时，采用“主责归属”原则