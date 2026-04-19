# 安全知识库 DOCX 接入规范

## 背景

当前系统主知识库 `knowledge_base` 已经围绕异常诊断场景统一到了 8 大异常类与三层 RAG 结构。

你提供的 [知识库.docx](/c:/Users/lankunling/Desktop/知识库.docx) 虽然结构化程度较高，但它的主分类是安全事件分类，例如：

- `入侵攻击`
- `权限提升`
- `凭据访问`
- `防御规避`
- `Web 攻击`
- `横向移动`

这套分类与当前系统的异常诊断分类不是一个维度。

如果直接把整份文档原样导入 `knowledge_base`，会带来三个问题：

1. `error_type` 口径冲突，主知识库会出现大量不兼容分类
2. `source_type` 在文档中基本恒为 `规则/Rule`，无法直接参与现有元数据过滤
3. 大量安全检测案例会把当前故障诊断型 RAG 检索结果冲淡

## 目标

1. 让这份 `.docx` 可以被结构化利用
2. 不污染现有异常知识库与主 RAG 检索结果
3. 为后续“人工筛选后晋升到主知识库”保留通道
4. 保留原始安全分类，同时补充兼容当前系统的映射字段

## 方案

采用“两段式接入”：

1. 先进入安全知识候选池 `security_knowledge_candidates`
2. 再按映射结果和人工确认决定是否晋升到主知识库

## 候选池表设计

候选池保留两套字段：

### 1. 原始字段

- `title`
- `raw_error_type`
- `raw_sub_type`
- `keywords`
- `log_excerpt`
- `root_cause`
- `solution`
- `raw_severity`
- `raw_source_type`
- `verified`
- `updated_at`

### 2. 映射字段

- `mapped_error_type`
- `mapped_source_type`
- `mapping_confidence`
- `target_knowledge_layer`
- `promotion_status`
- `promotion_notes`
- `cluster_key`
- `import_source`
- `import_batch`

## 为什么不用直接导入主知识库

主知识库当前服务的是“日志异常诊断”。

而这份 `.docx` 更接近：

- 安全检测案例库
- 攻击行为模式库
- 安全运维响应素材库

其中一部分条目可以转成故障诊断知识，但不是全部。

所以正确做法不是“全量直灌”，而是：

- 先保留原始安全语义
- 再补充兼容异常诊断的映射字段
- 最后只把高价值、可复用、与日志诊断强相关的条目晋升进主知识库

## 映射原则

### `raw_error_type` -> `mapped_error_type`

优先按以下原则映射：

- `数据库异常`、`数据库攻击` -> `database_error`
- `网络异常`、`网络攻击`、`侦察探测`、`信息收集` -> `network_error`
- `权限提升`、`凭据访问` -> `permission_error`
- `系统异常`、`Windows异常`、`应用异常`、`Web服务异常` -> `service_error`

再按内容关键词修正：

- 含 `timeout` -> `timeout`
- 含 `config/yaml/env/property` -> `configuration_error`
- 含 `oom/disk/no space/open files/resource` -> `resource_exhaustion`
- 无法稳定映射的保留为 `unknown_error`

### `raw_source_type` / 内容特征 -> `mapped_source_type`

因为文档中的 `source_type` 几乎恒为 `规则`，所以实际映射主要依赖内容特征：

- 含 `nginx/apache/http/upstream/waf` -> `nginx`
- 含 `postgres/mysql/oracle/sql` -> `postgres`
- 含 `java/node/spring/django/application` -> `application`
- 含 `ssh/sshd/rdp/smb/ftp/system/windows/linux` -> `system`
- 无法识别的回退 `custom`

## 晋升策略

默认不直接参与主 RAG。

只有满足以下条件的候选条目才建议晋升：

1. 与日志异常诊断直接相关
2. `mapped_error_type` 不是低可信的兜底值
3. `log_excerpt + root_cause + solution` 信息完整
4. 与现有主知识库相比有新增价值

## 导入方式

新增脚本：

- [scripts/import-security-knowledge-docx.ps1](/c:/智能日志分析系统/next-app/scripts/import-security-knowledge-docx.ps1)

脚本职责：

1. 读取结构化 `.docx`
2. 按 `---` 分块
3. 提取字段
4. 自动补映射字段
5. 输出 JSON 或 SQL

## 本轮范围

- 新增安全知识候选池表
- 新增 `.docx` 解析与映射脚本
- 不改现有主知识库页面
- 不把 311 条内容直接灌入主 RAG

## 验收标准

1. `.docx` 可被结构化解析
2. 安全知识与主知识库隔离存放
3. 每条安全知识保留原始字段和兼容映射字段
4. 后续可按批次筛选并晋升到主知识库
