# 安全候选池第 2 批晋升方案

## 目标

继续从 `security_knowledge_candidates` 中挑选可直接服务主 RAG 的条目，但保持更严格的边界：

- 继续补中文高频运行时异常别名
- 适量补充可运维处置的中间件暴露/误配置案例
- 不把侦察、横向移动、凭据窃取等攻防素材直接推进主知识库

## 第 2 批选入原则

1. 条目必须能直接解释日志或错误页
2. 必须有明确的根因和可执行方案
3. 必须能稳定映射到当前主知识库分类
4. 与已有主知识库相比，要么补中文召回，要么补缺失场景

## 首批晋升条目

- `43` Redis未授权访问
- `44` MongoDB未授权访问
- `45` Elasticsearch未授权访问
- `53` OOM内存溢出杀进程
- `55` CPU占用100%异常
- `64` HTTP 502网关错误
- `169` ET Linux Disk I/O Error
- `170` ET Linux Filesystem Corruption
- `177` ET MySQL Too Many Connections
- `185` ET HTTP 500 Internal Error

## 分类纠偏

本批次继续对候选池的自动映射做显式修正：

- `Redis未授权访问` -> `configuration_error`
- `MongoDB未授权访问` -> `configuration_error`
- `Elasticsearch未授权访问` -> `configuration_error`
- `OOM内存溢出杀进程` -> `resource_exhaustion`
- `CPU占用100%异常` -> `resource_exhaustion`

其余条目保持在更贴近运行时诊断的 `service_error / database_error` 分类。

## 本批价值

### 1. 运行时别名补齐

补充：

- `HTTP 502网关错误`
- `OOM内存溢出杀进程`
- `CPU占用100%异常`
- `磁盘 I/O 故障`
- `文件系统损坏`

这批条目能增强中文日志和中文人工提问下的命中率。

### 2. 可处置配置异常补齐

补充：

- `Redis未授权访问`
- `MongoDB未授权访问`
- `Elasticsearch未授权访问`

这类条目虽然带有安全属性，但根因是中间件配置错误，且日志特征清晰、处置方案明确，适合作为主知识库中的“可运维诊断案例”。

## 落库策略

- 主表：`knowledge_base`
- 层级：`knowledge_layer = exception_case`
- 来源：`source = security_candidate_promoted_batch_2`
- 候选池回写：`promotion_status = promoted`

## 验收标准

1. 第 2 批条目成功进入主知识库
2. 对应候选条目标记为已晋升
3. 新条目完成 embedding 回填
4. 主知识库在 `configuration_error` 和中文运行时别名上继续补齐
