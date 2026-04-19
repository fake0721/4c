# 安全知识库 DOCX 接入 Refactor Notes

## 本轮目标

把用户提供的结构化安全知识 `.docx` 变成“可用数据源”，但不直接污染当前异常诊断知识库。

## 发现的问题

1. 文档本身是可解析的结构化内容，不是普通说明文档
2. 实际条目数约为 `311`，高于文档标题中的 `100`
3. 主分类是安全事件分类，不是当前系统使用的 8 大异常类
4. `source_type` 基本固定为 `规则/Rule`，不能直接参与现有 RAG 过滤

## 本轮方案

采用“候选池 + 映射字段 + 后续晋升”的方式：

1. 新增 `security_knowledge_candidates`
2. 保留原始安全字段
3. 增加 `mapped_error_type`、`mapped_source_type` 等兼容字段
4. 新增脚本解析这类 `.docx`，输出 JSON 或 SQL

## 本轮新增

### 文档

- [docs/security-knowledge-docx-ingestion-spec.md](/c:/智能日志分析系统/next-app/docs/security-knowledge-docx-ingestion-spec.md)

### SQL

- [supabase/phase-8-security-knowledge-candidates.sql](/c:/智能日志分析系统/next-app/supabase/phase-8-security-knowledge-candidates.sql)

### 脚本

- [scripts/import-security-knowledge-docx.ps1](/c:/智能日志分析系统/next-app/scripts/import-security-knowledge-docx.ps1)

## 为什么这样做

如果直接导入主知识库，当前 RAG 会遇到两个问题：

1. 分类体系被混入大量安全事件口径
2. 检索结果会被安全检测案例稀释

候选池方案更稳妥：

- 文档可以立即被利用
- 原始语义不会丢
- 主知识库仍保持诊断导向
- 后续可以批次筛选高价值条目晋升

## 当前边界

本轮没有把这份文档的全部条目直接写入主知识库。

这是有意保守，不是遗漏。

当前系统已经具备：

- 安全文档结构化解析能力
- 候选池落点
- 自动映射字段

后续如需真正入库，可以直接把解析结果写入候选池，再挑选进入主知识库。
