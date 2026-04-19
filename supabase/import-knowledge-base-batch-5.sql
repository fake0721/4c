WITH incoming AS (
    SELECT 'Nginx upstream server temporarily disabled' AS title, 'nginx_upstream_connection' AS category, 'nginx, upstream server temporarily disabled, upstream failed, temporarily disabled' AS keywords, '日志出现 upstream server temporarily disabled，某个上游节点因连续失败被 nginx 暂时摘除。' AS symptom, '上游实例连续超时、连接拒绝、健康检查过严，或发布抖动导致短时间内连续失败。' AS possible_cause, '先看被摘除节点的失败模式和持续时间，再检查 fail_timeout、max_fails、健康检查和发布节奏；避免把瞬时抖动放大成整批摘除。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Nginx limiting requests excess burst' AS title, 'nginx_request_rejected' AS category, 'nginx, limiting requests, excess burst, rate limiting, request delayed' AS keywords, '日志出现 limiting requests, excess，说明请求触发了 nginx 的频率限制。' AS symptom, '单 IP 或单接口流量突增、限流阈值过低、突发流量超过 burst，或异常刷接口行为被拦截。' AS possible_cause, '先区分是真实业务高峰还是异常流量，再检查 limit_req 配置、burst 和延迟策略；如果是核心接口误伤，需要按业务维度重新分桶。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Nginx limiting connections excess' AS title, 'nginx_resource_limit' AS category, 'nginx, limiting connections, connection limit, excess connections' AS keywords, '日志出现 limiting connections by zone，说明并发连接数达到限制。' AS symptom, '同一来源连接过多、长连接释放不及时、连接限制策略过严，或异常连接占满配额。' AS possible_cause, '先确认是否集中在单来源或单业务，再检查 limit_conn 配置、keepalive 策略和连接生命周期；必要时分业务调整连接限额。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL connection slots exhausted by non superuser clients' AS title, 'database_connection' AS category, 'postgresql, sorry too many clients already, too many clients, connection slots exhausted' AS keywords, '日志出现 sorry, too many clients already，数据库普通连接槽位已耗尽。' AS symptom, '连接池过大、连接泄漏、批量任务并发过高，或业务重试风暴短时间打爆连接数。' AS possible_cause, '先看活跃连接来源和连接池配置，再定位是否有连接泄漏或异常重试；如果是瞬时洪峰，先止血再处理池配置。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL too many dead tuples or vacuum lag' AS title, 'database_maintenance' AS category, 'postgresql, dead tuples, vacuum lag, autovacuum not keeping up, table bloat' AS keywords, '监控或日志显示 dead tuples 持续堆积、autovacuum 跟不上，表膨胀开始影响读写性能。' AS symptom, '高频更新删除、autovacuum 参数偏保守、长事务阻塞回收，或磁盘 IO 不足导致清理跟不上。' AS possible_cause, '先看膨胀最严重的表和长事务，再检查 autovacuum、IO 和写入模式；必要时安排手工 vacuum 或重整表。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL prepared transaction left open' AS title, 'database_transaction_error' AS category, 'postgresql, prepared transaction, two-phase commit, transaction left open' AS keywords, '数据库中存在长时间未提交的 prepared transaction，锁和资源被持续占用。' AS symptom, '两阶段提交未清理、协调器异常退出、业务补偿缺失，或人工测试遗留了 prepared transaction。' AS possible_cause, '先确认是否真的在使用两阶段提交，再清点 prepared transactions 来源和影响范围；如果不是必需能力，尽量关闭或收敛使用面。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL could not obtain lock on relation' AS title, 'database_lock_timeout' AS category, 'postgresql, could not obtain lock on relation, lock not available, relation lock' AS keywords, '日志出现 could not obtain lock on relation，当前会话无法获取目标对象锁。' AS symptom, 'DDL 与 DML 冲突、批量变更撞上业务高峰、锁等待超时过短，或长事务一直占着对象锁。' AS possible_cause, '先定位占锁会话和锁类型，再决定等待、终止还是调整执行窗口；涉及 DDL 时尽量避开业务高峰。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Redis read only replica write rejected' AS title, 'cache_write_error' AS category, 'redis, read only replica, readonly you cant write against a read only replica, replica write rejected' AS keywords, '应用对 Redis 写入时收到 READONLY 错误，请求被只读副本拒绝。' AS symptom, '主从切换后客户端仍连着旧副本、连接配置错误、Sentinel 或代理路由异常，或人为把写流量打到了只读节点。' AS possible_cause, '先确认当前连接目标是否真的是主节点，再检查 Sentinel、代理、DNS 和客户端缓存；不要只在应用侧无限重试写请求。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Redis maxmemory reached write denied' AS title, 'cache_resource_limit' AS category, 'redis, oom command not allowed, maxmemory reached, memory limit hit' AS keywords, 'Redis 返回 OOM command not allowed，缓存实例已达到 maxmemory 策略边界。' AS symptom, '缓存淘汰策略不合理、热点 key 占用过大、过期策略失效，或实例容量明显不足。' AS possible_cause, '先看内存使用、热点 key 和淘汰策略，再判断是数据异常增长还是容量不够；必要时扩容并清理异常大 key。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Redis loading dataset in memory' AS title, 'cache_unavailable' AS category, 'redis, loading redis is loading the dataset in memory, startup loading, cache warming' AS keywords, '应用访问 Redis 时收到 LOADING Redis is loading the dataset in memory，实例尚未完成启动加载。' AS symptom, 'Redis 刚重启、RDB 或 AOF 文件过大、磁盘读取慢，或实例恢复过程过长。' AS possible_cause, '先确认 Redis 是否处于启动恢复阶段，再看数据集大小、磁盘性能和最近重启事件；恢复期内要避免无节制重试。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Kafka request timed out' AS title, 'message_queue_error' AS category, 'kafka, request timed out, topic metadata timeout, producer timeout' AS keywords, 'Kafka 客户端日志出现 Request timed out，元数据获取、发送或拉取请求在超时前未完成。' AS symptom, 'Broker 响应慢、网络抖动、分区 leader 切换、主题不存在，或客户端 timeout 设置过短。' AS possible_cause, '先区分是元数据请求还是消息发送超时，再检查 broker 健康、网络和主题配置；如果是集群抖动，先稳定 broker 再调客户端参数。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Kafka offset out of range' AS title, 'message_queue_error' AS category, 'kafka, offset out of range, invalid offset, consumer offset expired' AS keywords, '消费者日志出现 Offset out of range，当前消费位点已经无效。' AS symptom, '消息保留时间过短、消费者长时间停摆、位点提交错误，或新旧消费组切换策略不一致。' AS possible_cause, '先确认保留策略和消费者停摆时长，再决定从 earliest 还是 latest 恢复；位点问题要和业务补数策略一起设计。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Kafka group rebalance in progress' AS title, 'message_queue_error' AS category, 'kafka, rebalance in progress, consumer group rebalancing, generation changed' AS keywords, '消费者频繁出现 rebalance in progress，消费组不断重平衡，吞吐明显下降。' AS symptom, '实例频繁上下线、处理过慢导致心跳丢失、分区数与实例数不匹配，或客户端版本兼容性问题。' AS possible_cause, '先确认是否有实例抖动或长处理阻塞心跳，再检查 session timeout、max poll interval 和部署节奏；频繁 rebalance 往往是更深层稳定性问题。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Container image pull backoff' AS title, 'container_runtime_error' AS category, 'image pull backoff, errimagepull, failed to pull image, registry unavailable' AS keywords, '容器平台出现 ImagePullBackOff 或 ErrImagePull，实例无法正常拉起。' AS symptom, '镜像地址错误、仓库认证失败、镜像不存在、网络受限，或仓库服务本身不可用。' AS possible_cause, '先确认镜像名、tag 和仓库凭据，再检查节点网络和镜像仓库可达性；如果是发布后集中爆发，先核对 CI 推送产物。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Container crash loop backoff' AS title, 'container_runtime_error' AS category, 'crashloopbackoff, crash loop, container restarts, pod restart backoff' AS keywords, '容器平台出现 CrashLoopBackOff，实例启动后很快退出并反复重启。' AS symptom, '应用启动即崩溃、配置缺失、依赖未就绪、健康检查过严，或命令行参数错误。' AS possible_cause, '先看容器第一次退出时的标准输出和退出码，再检查配置、依赖和探针设置；不要只盯着平台层的 BackOff 状态。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Container failed mount volume' AS title, 'container_runtime_error' AS category, 'failed mount, unable to attach or mount volumes, volume mount error' AS keywords, '容器平台日志出现 Unable to attach or mount volumes，实例因卷挂载失败无法启动。' AS symptom, '存储类配置错误、底层卷不可达、权限不足、节点插件异常，或同名卷被占用。' AS possible_cause, '先确认失败卷类型和节点范围，再检查 CSI 插件、存储后端和访问模式；卷问题通常需要平台和存储一起排查。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Kubernetes liveness probe failed' AS title, 'container_runtime_error' AS category, 'liveness probe failed, kubelet probe failed, container unhealthy' AS keywords, '容器频繁出现 Liveness probe failed，实例被平台判定为不健康并重启。' AS symptom, '探针路径不对、启动时间过长、依赖未就绪、GC 或 IO 抖动导致短时无响应，或探针阈值过严。' AS possible_cause, '先确认失败发生在启动期还是运行期，再检查探针路径、超时、initialDelay 和应用耗时；探针应反映真实健康，而不是制造抖动。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Application thread pool rejected execution' AS title, 'application_resource_limit' AS category, 'rejected execution, thread pool rejected, task rejected, executor saturated' AS keywords, '应用日志出现 RejectedExecution 或任务被线程池拒绝，说明执行池已饱和。' AS symptom, '线程池容量过小、下游依赖变慢、任务堆积、异步调用失控，或突发流量超出处理能力。' AS possible_cause, '先看线程池活跃数、队列长度和最慢任务，再区分是容量不足还是依赖变慢；拒绝策略要和业务降级一起设计。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Application database migration failed' AS title, 'application_deploy_error' AS category, 'migration failed, flyway failed, liquibase failed, schema migration error' AS keywords, '发布或启动阶段出现 migration failed，应用无法完成数据库结构迁移。' AS symptom, '迁移脚本语法错误、目标库状态不符合预期、权限不足、锁冲突，或多实例并发跑迁移。' AS possible_cause, '先确认失败迁移编号和数据库当前状态，再检查发布顺序、迁移锁和执行权限；迁移失败时要先保护数据一致性，不要急着重跑。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Application idempotency conflict' AS title, 'application_data_error' AS category, 'idempotency conflict, duplicate request, replay detected, duplicate operation' AS keywords, '日志显示请求因幂等冲突被拒绝，同一业务操作被重复提交或重复消费。' AS symptom, '客户端重复提交、重试策略不当、消息重复投递、幂等键设计不合理，或幂等记录过早过期。' AS possible_cause, '先确认重复操作的来源和时序，再检查幂等键、过期时间和重试机制；幂等冲突不能只靠前端防抖解决。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Application feature flag service unavailable' AS title, 'application_dependency_error' AS category, 'feature flag unavailable, config service unavailable, toggle fetch failed, remote config error' AS keywords, '应用在启动或运行时拉取 feature flag 或远程配置失败，功能开关状态不确定。' AS symptom, '配置中心不可用、网络抖动、鉴权失败、本地缓存失效，或 SDK 与服务端版本不兼容。' AS possible_cause, '先确认是否存在本地兜底配置，再检查配置中心健康、网络、鉴权和 SDK 版本；配置依赖故障时要保证默认策略可控。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Application email or SMTP authentication failed' AS title, 'application_dependency_error' AS category, 'smtp authentication failed, mail send failed, email auth error, smtp connect failed' AS keywords, '应用发信链路出现 SMTP authentication failed 或 send mail failed，通知邮件无法发送。' AS symptom, 'SMTP 用户密码错误、发信通道限流、TLS 配置不兼容、来源 IP 未授权，或邮箱服务本身不可用。' AS possible_cause, '先确认 SMTP 配置、凭据和 TLS 要求，再检查发信服务状态、配额和退信日志；如果是批量失败，优先保护主业务流程。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Application external API quota exceeded' AS title, 'application_dependency_error' AS category, 'quota exceeded, api rate limit reached, external api limit, billing quota exceeded' AS keywords, '应用调用外部 API 时收到 quota exceeded 或配额不足错误，功能部分失效。' AS symptom, '调用量超配额、限额策略变更、计费异常、重试放大请求量，或新版本误增了调用次数。' AS possible_cause, '先确认是硬配额耗尽还是瞬时速率限额，再检查调用量变化、缓存命中和重试策略；对外部配额依赖要有降级预案。' AS solution, 'internal_runbook' AS source
)
INSERT INTO public.knowledge_base (
  title,
  category,
  keywords,
  symptom,
  possible_cause,
  solution,
  source
)
SELECT
  incoming.title,
  incoming.category,
  incoming.keywords,
  incoming.symptom,
  incoming.possible_cause,
  incoming.solution,
  incoming.source
FROM incoming
WHERE NOT EXISTS (
  SELECT 1
  FROM public.knowledge_base existing
  WHERE lower(existing.title) = lower(incoming.title)
    AND lower(coalesce(existing.symptom, '')) = lower(coalesce(incoming.symptom, ''))
    AND lower(coalesce(existing.solution, '')) = lower(coalesce(incoming.solution, ''))
);
