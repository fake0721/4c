WITH incoming AS (
    SELECT 'Nginx rewrite or internal redirection cycle' AS title, 'nginx_request_rejected' AS category, 'nginx, rewrite or internal redirection cycle, redirect loop, internal redirect cycle' AS keywords, '日志出现 rewrite or internal redirection cycle while internally redirecting，请求在 nginx 内部反复跳转，最终失败。' AS symptom, 'rewrite 规则互相跳转、error_page 与 location 配置形成环路、try_files 配置不当，或应用与网关共同制造了重定向循环。' AS possible_cause, '先定位进入循环的 location 和 rewrite 链路，再检查 error_page、try_files 和应用重定向逻辑；这类问题通常是多层配置叠加出来的。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Nginx upstream sent no valid HTTP header' AS title, 'nginx_header_error' AS category, 'nginx, upstream sent no valid http/1.0 header, invalid upstream response, bad header' AS keywords, '日志出现 upstream sent no valid HTTP/1.0 header from upstream，nginx 无法把上游响应识别为合法 HTTP 响应。' AS symptom, '上游进程返回了非 HTTP 数据、TLS 与明文协议配错、上游程序崩溃输出了异常内容，或代理目标端口配错。' AS possible_cause, '先确认 nginx 代理到的协议和端口是否正确，再抓取上游原始返回内容；如果是应用异常输出，需要从上游日志继续追。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL role does not exist' AS title, 'database_auth' AS category, 'postgresql, role does not exist, user missing, database role error' AS keywords, '日志出现 role does not exist，数据库连接或授权依赖的角色不存在。' AS symptom, '用户尚未创建、环境切换后角色未同步、迁移脚本漏执行，或应用配置指向了错误用户名。' AS possible_cause, '先确认当前连接用户和目标环境，再检查角色创建脚本、权限同步和密钥配置；如果是切环境导致，先统一账号口径。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL cannot execute in read only transaction' AS title, 'database_transaction_error' AS category, 'postgresql, cannot execute insert in a read-only transaction, read only transaction, standby write' AS keywords, '日志出现 cannot execute ... in a read-only transaction，写操作在只读事务或只读实例上被拒绝。' AS symptom, '应用写流量误打到从库、事务被设置为只读、连接池路由错误，或发布后读写分离配置异常。' AS possible_cause, '先确认当前连接到底连的是主库还是从库，再检查事务属性和读写路由；如果是代理层错配，优先修路由而不是在应用侧绕过。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL could not extend file' AS title, 'database_disk_error' AS category, 'postgresql, could not extend file, extend relation file failed, relation file growth failed' AS keywords, '日志出现 could not extend file，数据库无法继续扩展表、索引或临时文件。' AS symptom, '磁盘空间不足、文件系统限制、卷扩容异常、inode 紧张，或底层存储性能和稳定性出现问题。' AS possible_cause, '先确认是数据目录、临时目录还是表空间出问题，再结合磁盘、inode 和卷状态定位；文件扩展失败常常是更大存储故障的前兆。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Redis MISCONF snapshot write blocked' AS title, 'cache_write_error' AS category, 'redis, misconf, stop-writes-on-bgsave-error, write blocked due to snapshot error' AS keywords, 'Redis 返回 MISCONF 并拒绝写入，提示持久化或快照失败后停止了写操作。' AS symptom, 'RDB 持久化失败、磁盘空间不足、权限错误、后台保存进程异常，或底层卷不可写。' AS possible_cause, '先确认最近一次 bgsave 失败原因，再检查磁盘、权限和持久化目录；修复前不要简单关闭保护开关掩盖数据安全问题。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Redis BUSY running script' AS title, 'cache_runtime_error' AS category, 'redis, busy redis is busy running a script, lua script busy, script timeout' AS keywords, 'Redis 返回 BUSY Redis is busy running a script，说明 Lua 脚本执行时间过长，阻塞了实例。' AS symptom, 'Lua 脚本逻辑过重、遍历大 key、脚本死循环，或高并发下脚本执行排队严重。' AS possible_cause, '先定位正在执行的脚本和相关 key，再评估脚本复杂度和数据量；脚本阻塞是 Redis 单线程模型下的高风险事件。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Redis cluster down or moved response' AS title, 'cache_cluster_error' AS category, 'redis, clusterdown, moved, ask, redis cluster routing error' AS keywords, '应用日志出现 CLUSTERDOWN、MOVED 或 ASK，Redis 集群路由或状态异常导致访问失败。' AS symptom, '集群分片重平衡、客户端路由缓存过期、节点失联，或集群状态本身不健康。' AS possible_cause, '先确认 Redis 集群是否正在迁移槽位或发生故障，再检查客户端是否支持集群重定向；路由错误不应只靠无限重试处理。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Kafka record too large' AS title, 'message_queue_error' AS category, 'kafka, record too large, message too large, recordtoolargeexception' AS keywords, '生产者日志出现 RecordTooLargeException，单条消息超过 Broker 或主题允许大小。' AS symptom, '消息体设计过大、批量聚合过度、压缩未生效，或 broker 与客户端的大小限制配置不一致。' AS possible_cause, '先确认是业务消息异常膨胀还是阈值配置过小，再检查 broker、topic 和 producer 的消息大小设置；大消息问题最好回到消息设计本身处理。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Kafka unknown topic or partition' AS title, 'message_queue_error' AS category, 'kafka, unknown topic or partition, topic missing, invalid partition' AS keywords, '客户端日志出现 UnknownTopicOrPartition，目标主题或分区当前不可用。' AS symptom, '主题未创建、元数据尚未同步、主题被删除、分区编号错误，或新环境初始化步骤遗漏。' AS possible_cause, '先确认主题名、环境和分区数量是否一致，再检查元数据刷新和自动建主题策略；发布脚本如果漏建主题会直接放大这类问题。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Kafka not enough replicas after append' AS title, 'message_queue_error' AS category, 'kafka, not enough replicas, not enough replicas after append, isr insufficient' AS keywords, '生产者日志出现 NotEnoughReplicas 或 NotEnoughReplicasAfterAppend，消息可靠写入失败。' AS symptom, 'ISR 数量不足、Broker 故障、跨机房网络抖动、min.insync.replicas 过高，或集群正在恢复。' AS possible_cause, '先确认当前 ISR 和 broker 健康，再结合 acks、min.insync.replicas 与网络状态分析；这类错误意味着可靠性已经受损，不能只降级重试。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Elasticsearch cluster health red' AS title, 'search_cluster_error' AS category, 'elasticsearch, cluster red, cluster health red, shard unavailable' AS keywords, 'Elasticsearch 集群状态变为 red，部分主分片不可用，搜索或写入开始失败。' AS symptom, '节点宕机、磁盘水位过高、主分片丢失、恢复未完成，或集群资源长期不足。' AS possible_cause, '先确认缺失的是哪些主分片和节点，再检查磁盘水位、节点健康和最近变更；red 状态要优先保护数据和恢复可用分片。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Elasticsearch master not discovered' AS title, 'search_cluster_error' AS category, 'elasticsearch, master not discovered, no master, cluster formation failed' AS keywords, '日志出现 master not discovered 或 cluster formation failed，集群无法完成主节点选举。' AS symptom, '发现配置错误、网络分区、法定人数不足、节点名称不一致，或版本和配置不兼容。' AS possible_cause, '先检查 discovery 配置、投票节点数量和网络连通性，再确认节点名称与集群 UUID 是否一致；选主失败通常是配置和网络共同作用的结果。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Elasticsearch circuit breaking exception' AS title, 'search_resource_error' AS category, 'elasticsearch, circuit_breaking_exception, data too large, memory circuit breaker' AS keywords, '查询或写入日志出现 circuit_breaking_exception，Elasticsearch 为保护内存主动拒绝请求。' AS symptom, '查询聚合过大、批量请求过重、字段爆炸、堆内存不足，或缓存与 fielddata 占用异常。' AS possible_cause, '先确认是哪类 breaker 触发，再检查大查询、大批次写入和字段设计；这类问题往往需要同时改查询和集群容量。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'RabbitMQ memory or disk alarm blocked connection' AS title, 'message_queue_error' AS category, 'rabbitmq, connection blocked, memory alarm, disk alarm, broker flow control' AS keywords, 'RabbitMQ 出现 memory alarm 或 disk alarm，连接被 broker 阻塞，消息吞吐明显下降。' AS symptom, '节点内存紧张、磁盘空间不足、积压过多，或消费者跟不上导致 broker 触发保护机制。' AS possible_cause, '先看内存、磁盘和队列积压，再判断是消费变慢还是流量突增；broker 报警意味着不能只盯客户端超时。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'RabbitMQ precondition failed inequivalent arg' AS title, 'message_queue_error' AS category, 'rabbitmq, precondition failed, inequivalent arg, queue declare mismatch' AS keywords, '队列声明时报 precondition failed 或 inequivalent arg，说明当前定义与已存在队列属性不一致。' AS symptom, '新旧服务对同一队列的 durable、ttl、dead-letter 等属性定义不同，或回滚后配置没有统一。' AS possible_cause, '先确认现存队列属性，再统一生产者和消费者的声明参数；队列属性冲突通常是发布一致性问题，不是 broker 随机故障。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Kubernetes readiness probe failed' AS title, 'container_runtime_error' AS category, 'readiness probe failed, pod not ready, kubelet readiness failed' AS keywords, '容器频繁出现 Readiness probe failed，实例虽然还活着，但持续无法接收业务流量。' AS symptom, '依赖未就绪、探针路径错误、启动缓慢、瞬时抖动被放大，或应用健康检查本身依赖了脆弱下游。' AS possible_cause, '先看是启动期长期不 ready 还是运行期波动，再检查探针逻辑、依赖项和超时阈值；ready 探针不应比业务本身更脆弱。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Kubernetes container OOMKilled' AS title, 'container_runtime_error' AS category, 'oomkilled, container killed due to memory, kubernetes oom, exit code 137' AS keywords, '容器状态显示 OOMKilled 或退出码 137，实例因内存超限被平台杀掉。' AS symptom, '内存 limit 过小、流量突增、大对象或缓存失控，或运行时参数没有根据容器限制调整。' AS possible_cause, '先确认是容器 limit 命中还是宿主机级 OOM，再结合内存曲线、GC 和请求峰值定位；容器 OOM 要和应用参数一起看。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Kubernetes pod pending insufficient resources' AS title, 'container_runtime_error' AS category, 'pod pending, insufficient cpu, insufficient memory, failed scheduling' AS keywords, 'Pod 长时间处于 Pending，调度器提示资源不足，实例无法落到节点。' AS symptom, '集群容量不足、requests 设置过高、节点被污点隔离、亲和性限制过严，或资源碎片严重。' AS possible_cause, '先看调度事件里的直接拒绝原因，再检查 requests、taints、affinity 和集群剩余容量；Pending 不是应用本身故障，但会直接放大可用性问题。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Kubernetes node not ready' AS title, 'container_runtime_error' AS category, 'node not ready, kubelet not ready, node unavailable, node pressure' AS keywords, '节点状态变为 NotReady，运行在该节点上的实例会陆续受影响或被迁移。' AS symptom, 'kubelet 异常、容器运行时故障、网络中断、磁盘或内存压力过高，或节点系统本身异常。' AS possible_cause, '先确认是单节点问题还是节点池级问题，再检查 kubelet、容器运行时、网络和节点资源；节点 NotReady 往往是更底层故障的外在表现。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Application bean creation or dependency injection failed' AS title, 'application_deploy_error' AS category, 'beancreationexception, unsatisfieddependencyexception, dependency injection failed, spring bean init error' AS keywords, 'Java 应用启动时出现 BeanCreationException 或 UnsatisfiedDependencyException，容器无法完成依赖注入。' AS symptom, '配置缺失、循环依赖、条件装配不满足、类路径冲突，或环境变量和密钥没有正确注入。' AS possible_cause, '先看最里层 cause 和具体 bean 名称，再检查配置、扫描范围和环境注入；Bean 初始化失败通常只是更深层配置问题的入口。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Application class not found or no such method after deploy' AS title, 'application_deploy_error' AS category, 'classnotfoundexception, nosuchmethoderror, noclassdeffounderror, dependency mismatch' AS keywords, '发布后日志出现 ClassNotFoundException、NoClassDefFoundError 或 NoSuchMethodError，说明运行时代码与依赖不一致。' AS symptom, '依赖版本冲突、打包不完整、灰度节点版本不一致、类加载顺序异常，或旧插件残留。' AS possible_cause, '先确认出错类和方法来自哪个依赖，再检查构建产物、依赖树和灰度节点版本；这类错误通常是发布制品一致性问题。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Application SSL handshake or PKIX validation failed' AS title, 'application_ssl_error' AS category, 'sslhandshakeexception, pkix path building failed, certificate unknown, tls validation error' AS keywords, '应用日志出现 SSLHandshakeException、PKIX path building failed 或证书校验失败，TLS 连接在握手阶段被拒绝。' AS symptom, '证书链不完整、根证书不受信、服务端证书轮换未同步、系统时间异常，或 TLS 协议配置不兼容。' AS possible_cause, '先区分是证书信任问题还是协议握手问题，再检查证书链、truststore、系统时间和 TLS 版本；这类问题常见于依赖切换或证书更新后。' AS solution, 'internal_runbook' AS source
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
