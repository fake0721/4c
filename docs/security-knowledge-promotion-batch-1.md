# 安全候选池首批晋升方案

## 目标

从 `security_knowledge_candidates` 中挑出一批适合进入主知识库 `knowledge_base` 的高频异常案例。

本批次只处理：

- 能直接解释日志的条目
- 适合作为中文诊断别名的条目
- 能稳定映射到当前 8 大异常类的条目

本批次不处理：

- 纯攻防侦察类素材
- 主要用于安全分析而非故障诊断的条目
- 与现有主知识库高度重复且没有中文补充价值的条目

## 选入原则

1. 优先补中文高频异常别名，提升中文日志和中文提问下的召回率
2. 允许与现有英文规范案例语义相近，但必须带来中文检索价值
3. 对候选池中映射明显偏差的条目，在晋升时显式纠偏
4. 晋升后同步回写候选池状态，避免后续重复处理

## 首批晋升条目

- `51` 磁盘空间100%耗尽
- `52` 系统inode资源耗尽
- `54` 文件句柄数超限
- `56` 系统负载load过高
- `57` 网络连接超时
- `58` 连接被对端重置
- `59` DNS解析失败
- `60` 端口无法连接拒绝
- `61` Java堆内存溢出
- `62` Java空指针异常
- `63` 数据库连接池耗尽
- `65` HTTP 504网关超时
- `66` MySQL死锁异常
- `67` MySQL慢查询阻塞
- `69` Nginx配置重载失败

## 分类纠偏

候选池导入阶段为了保守起见，部分条目被映射到较宽的类别。本批次晋升时按主知识库口径做以下纠偏：

- `磁盘空间100%耗尽` -> `resource_exhaustion`
- `系统inode资源耗尽` -> `resource_exhaustion`
- `文件句柄数超限` -> `resource_exhaustion`
- `系统负载load过高` -> `resource_exhaustion`
- `Java堆内存溢出` -> `resource_exhaustion`
- `数据库连接池耗尽` -> `resource_exhaustion`
- `Nginx配置重载失败` -> `configuration_error`

其余条目保持为更贴近主知识库的 `network_error / timeout / service_error / database_error` 分类。

## 落库策略

- 主表：`knowledge_base`
- 层级：`knowledge_layer = exception_case`
- 来源：`source = security_candidate_promoted_batch_1`
- 候选池回写：`promotion_status = promoted`

## 验收标准

1. 主知识库新增首批中文高频异常案例
2. 候选池对应条目标记为已晋升
3. 新条目可参与当前关键词召回链路
4. 不把安全攻防素材整批灌入主知识库
