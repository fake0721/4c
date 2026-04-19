# 主知识库 unknown_error 首批纠偏方案

## 目标

治理 `knowledge_base` 中历史遗留的 `unknown_error` 条目，把其中已经具备明确归类依据的案例重新映射到当前主知识库的 8 大异常类。

本批只处理：

- 标题、症状、根因足够明确的老条目
- 能稳定归类到现有异常分类的条目
- 纠偏后能直接提升 `error_type` 元数据过滤质量的条目

本批不处理：

- 语义仍然偏宽、无法稳定落类的条目
- 介于配置、资源、运行时之间的边界型场景

## 背景

当前主知识库里仍有一批早期沉淀的 `unknown_error` 条目。

这类条目虽然内容本身可用，但会带来两个直接问题：

1. RAG 的 `error_type` 元数据过滤无法充分利用这些条目
2. 同类中英文案例已经存在，但英文旧条目仍停留在 `unknown_error`

## 本批纠偏范围

本批次共纠偏 `41` 条，主要覆盖：

- Java / Python / Velocity 运行时异常
- Nginx 常见网关与代理异常
- Kafka / RabbitMQ / Redis / Elasticsearch 运行时异常
- 系统资源与文件系统异常
- 应用配置与依赖装配异常

## 典型纠偏

### 运行时异常

- `Java NullPointerException` -> `service_error`
- `Java OutOfMemoryError` -> `resource_exhaustion`
- `Python traceback most recent call last` -> `service_error`
- `Velocity template engine exception` -> `service_error`

### 配置异常

- `Application bean creation or dependency injection failed` -> `configuration_error`
- `Kafka unknown topic or partition` -> `configuration_error`
- `Nginx rewrite or internal redirection cycle` -> `configuration_error`
- `RabbitMQ precondition failed inequivalent arg` -> `configuration_error`

### 网络 / 超时 / 资源异常

- `Application broken pipe` -> `network_error`
- `Application retry exhausted` -> `timeout`
- `Nginx client closed request 499` -> `timeout`
- `Nginx upstream keepalive exhausted` -> `resource_exhaustion`
- `RabbitMQ memory or disk alarm blocked connection` -> `resource_exhaustion`

## 同步修正

本批次除了更新 `error_type`，还同步做三件事：

1. 兼容旧字段，把 `category` 更新为同口径值
2. 对明显错误的 `source_type` 做小范围修正
3. 重算 `cluster_key`，保证后续聚类和去重一致

## 暂不处理的条目

首批先保留以下 `unknown_error`，后续再单独评估：

- `Application idempotency conflict`
- `Nginx client request body buffered to temporary file`
- `Nginx upstream response buffered to temporary file`
- `Redis MISCONF snapshot write blocked`
- `System mount failure`

## 验收标准

1. 主知识库中 `unknown_error` 数量明显下降
2. 纠偏条目进入更准确的 `error_type` 过滤链路
3. 不为了降低数量而强行归类边界模糊条目
