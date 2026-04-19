WITH incoming AS (
    SELECT 'Nginx worker connections exhausted' AS title, 'nginx_resource_limit' AS category, 'nginx, worker_connections are not enough, worker connections exhausted, connection limit' AS keywords, '日志出现 worker_connections are not enough，nginx 已达到可接受连接上限，新请求开始排队、失败或被拒绝。' AS symptom, 'worker_connections 配置过小、短连接过多、keepalive 使用不当、上游响应过慢导致连接占用时间过长，或突发流量超出预期。' AS possible_cause, '先看活跃连接数、上游耗时和 keepalive 策略，再结合 worker_processes、worker_connections 和系统 fd 上限一起调整；如果是流量峰值异常，先限流再扩容。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Nginx no resolver defined' AS title, 'nginx_dns_error' AS category, 'nginx, no resolver defined, resolver not configured, dynamic upstream dns' AS keywords, '日志出现 no resolver defined to resolve，请求依赖动态域名解析时直接失败。' AS symptom, 'nginx 配置中使用了变量或需要动态解析的 upstream，但没有显式配置 resolver，或 resolver 配置在当前上下文未生效。' AS possible_cause, '先确认报错位置是否使用了变量域名，再检查 nginx resolver 配置、作用域和 DNS 可用性；如果域名固定，可改成静态解析以减少复杂度。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Nginx upstream sent invalid header' AS title, 'nginx_header_error' AS category, 'nginx, upstream sent invalid header, malformed header, bad gateway header' AS keywords, '日志出现 upstream sent invalid header while reading response header from upstream，网关在解析上游响应头时失败。' AS symptom, '上游返回了格式错误的 HTTP 头、应用框架写出了非法字符、代理链重复改写头部，或上游程序异常截断响应。' AS possible_cause, '先抓取异常请求的原始响应头，再检查上游框架、中间件和最近发布变更；如果是代理链问题，逐层比对头部改写逻辑。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Nginx upstream response buffered to temporary file' AS title, 'nginx_buffering' AS category, 'nginx, upstream response is buffered to a temporary file, proxy temp file, buffering' AS keywords, '日志出现 an upstream response is buffered to a temporary file，表示响应体过大，已经落到临时文件。' AS symptom, '上游返回体过大、proxy_buffers 配置偏小、下载或导出接口集中访问，或响应流式处理策略不合理。' AS possible_cause, '先确认是否是预期的大响应场景，再检查 proxy buffer、临时目录磁盘和下载接口设计；必要时改为流式下载或对象存储直出。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Nginx client request body buffered to temporary file' AS title, 'nginx_buffering' AS category, 'nginx, request body buffered to a temporary file, client body temp, upload buffering' AS keywords, '日志提示 client request body is buffered to a temporary file，上传请求体已经落盘到临时目录。' AS symptom, '上传文件较大、client_body_buffer_size 偏小、并发上传过多，或临时目录所在磁盘性能不足。' AS possible_cause, '先判断这是不是业务预期的上传流量，再检查 client_body_buffer_size、临时目录容量和磁盘 IO；如果上传频繁，优先优化上传链路和临时目录规划。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Nginx directory index forbidden' AS title, 'nginx_request_rejected' AS category, 'nginx, directory index of is forbidden, index forbidden, static file listing' AS keywords, '日志出现 directory index of ... is forbidden，客户端访问目录时被 nginx 拒绝。' AS symptom, '目录下没有 index 文件、autoindex 未开启、静态资源路径映射错误，或发布漏传了首页文件。' AS possible_cause, '先确认访问路径是否应当暴露目录，再检查 root、alias、index 配置和发布产物；如果只是路径配置错误，修正映射即可。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL statement timeout exceeded' AS title, 'database_timeout' AS category, 'postgresql, canceling statement due to statement timeout, statement timeout' AS keywords, '日志出现 canceling statement due to statement timeout，SQL 执行时间超过阈值后被取消。' AS symptom, '慢查询未优化、索引缺失、锁等待被算入执行时间、批量任务过重，或 statement_timeout 设得过短。' AS possible_cause, '先定位超时 SQL 和执行计划，再检查索引、锁等待和批量任务；不要先盲目放大超时时间，先找慢的根因。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL duplicate key violation' AS title, 'database_constraint_error' AS category, 'postgresql, duplicate key value violates unique constraint, unique violation' AS keywords, '日志出现 duplicate key value violates unique constraint，写入违反唯一约束。' AS symptom, '幂等控制缺失、重复消费消息、并发插入同一业务键，或历史脏数据与新约束冲突。' AS possible_cause, '先确认重复键是业务允许的重试还是异常写入，再检查唯一键设计、消费幂等和并发插入逻辑；必要时补偿历史数据。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL out of shared memory' AS title, 'database_memory_error' AS category, 'postgresql, out of shared memory, max_locks_per_transaction, shared memory' AS keywords, '日志出现 out of shared memory，数据库无法为当前事务分配足够的共享内存或锁结构。' AS symptom, '单事务涉及对象过多、批量 DDL 或大事务占用了大量锁，max_locks_per_transaction 偏小，或数据库整体内存压力过大。' AS possible_cause, '先看是否存在超大事务或批量 DDL，再评估 max_locks_per_transaction 与共享内存配置；如果是业务设计问题，优先拆分事务。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL SSL SYSCALL error or unexpected EOF' AS title, 'database_connection' AS category, 'postgresql, ssl syscall error, unexpected eof on client connection, connection closed unexpectedly' AS keywords, '日志出现 SSL SYSCALL error 或 unexpected EOF on client connection，数据库连接在传输过程中异常中断。' AS symptom, '客户端进程崩溃、网络抖动、负载均衡空闲超时、TLS 代理异常，或连接池主动丢弃了连接。' AS possible_cause, '先区分是单个客户端还是普遍断链，再检查网络、负载均衡、连接池和 TLS 代理配置；如果集中发生在发布窗口，重点看客户端重启行为。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL archive command failed' AS title, 'database_archive_error' AS category, 'postgresql, archive command failed, wal archive failed, archive_status' AS keywords, '日志出现 archive command failed，WAL 归档命令执行失败。' AS symptom, '归档目标不可达、磁盘满、权限错误、归档脚本异常，或对象存储凭据失效。' AS possible_cause, '先确认归档目标和网络是否可达，再检查归档脚本、权限、凭据和目标容量；归档失败会持续堆积 WAL，不能长期忽略。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL no pg_hba.conf entry' AS title, 'database_auth' AS category, 'postgresql, no pg_hba.conf entry, pg_hba reject, host-based authentication' AS keywords, '日志明确出现 no pg_hba.conf entry，客户端来源或用户未被当前认证规则允许。' AS symptom, '新实例来源 IP 未纳入白名单、环境切换后地址段变化、用户或数据库名不匹配，或 SSL 要求与连接方式不一致。' AS possible_cause, '先确认来源地址、数据库名、用户名和 SSL 要求，再检查 pg_hba.conf 的匹配顺序；修复后记得重载配置并回归测试。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'System fork failed resource temporarily unavailable' AS title, 'system_process_limit' AS category, 'fork failed, resource temporarily unavailable, cannot fork, process limit' AS keywords, '系统或应用日志出现 fork failed: Resource temporarily unavailable，进程无法再创建子进程。' AS symptom, '进程数达到上限、内存不足、cgroup pids.limit 触顶，或某类任务异常拉起了大量子进程。' AS possible_cause, '先看系统总进程数、用户级限制和容器 pids.limit，再检查是否存在进程泄漏或任务风暴；不要只靠调大上限掩盖问题。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'System inode exhausted' AS title, 'system_disk' AS category, 'no space left on device, inode exhausted, df -i, inode full' AS keywords, '磁盘容量看起来仍有空间，但日志持续出现 no space left on device，最终定位为 inode 已耗尽。' AS symptom, '小文件数量暴涨、日志分片过多、缓存目录未清理，或容器临时文件堆积。' AS possible_cause, '先确认是容量还是 inode 耗尽，再统计目录中文件数最多的位置；修复时既要清理小文件，也要补日志归档和目录治理。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'System watchdog timeout' AS title, 'system_service_failure' AS category, 'watchdog timeout, watchdog did not stop, service watchdog, hung service' AS keywords, '日志出现 watchdog timeout 或服务看门狗超时，说明进程长时间无响应。' AS symptom, '服务卡死在 IO、死锁、外部依赖阻塞、GC 暂停过长，或健康检查线程本身失效。' AS possible_cause, '先保留卡死时的线程栈和资源使用情况，再判断是业务线程阻塞还是系统资源问题；不要只通过增加 watchdog 时间掩盖卡顿。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'System no route to host' AS title, 'system_network_error' AS category, 'no route to host, network unreachable, route missing, host unreachable' AS keywords, '系统或应用日志出现 No route to host，目标地址在当前节点没有可用路由。' AS symptom, '路由配置错误、网关异常、网络策略阻断、容器网络失效，或目标网段本身不可达。' AS possible_cause, '先区分是单节点问题还是全局网络问题，再检查路由表、网关、容器网络插件和安全策略；不要把路由问题误判成应用超时。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'System hung task blocked for too long' AS title, 'system_kernel_failure' AS category, 'hung task blocked for more than, kernel hung task, task blocked' AS keywords, '内核日志出现 task blocked for more than ... seconds，说明某些任务长时间处于不可中断阻塞。' AS symptom, '磁盘 IO 卡死、NFS 或远端存储异常、内核锁竞争、设备驱动问题，或文件系统故障导致线程无法返回。' AS possible_cause, '先结合 dmesg 看阻塞任务涉及的设备和调用栈，再检查存储、文件系统和内核版本；这类问题通常不是简单重启就能解释清楚。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'System cgroup memory limit exceeded' AS title, 'system_memory' AS category, 'cgroup out of memory, memory cgroup out of memory, container memory limit exceeded' AS keywords, '容器或节点日志出现 memory cgroup out of memory，说明进程触发了 cgroup 级内存限制。' AS symptom, '容器 limit 设置过小、内存突增超出预期、堆配置没有跟随容器限制调整，或同 Pod 内多个进程争用内存。' AS possible_cause, '先确认触发的是宿主机 OOM 还是 cgroup OOM，再核对容器 limits、JVM 或运行时参数和流量峰值；容器内存治理要和应用参数一起看。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Application JSON parse or deserialization error' AS title, 'application_data_error' AS category, 'json parse error, deserialization failed, malformed json, http message not readable' AS keywords, '应用日志出现 JSON parse error、deserialization failed 或 malformed JSON，入参在解析阶段就失败。' AS symptom, '客户端传了非法 JSON、字段类型不匹配、接口契约变更未同步，或序列化框架配置不兼容。' AS possible_cause, '先抓取失败请求样本和具体字段，再检查接口契约、版本兼容和前端请求构造；如果是灰度期间出现，重点看新旧版本兼容。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Redis connection timeout or unavailable' AS title, 'cache_connection_error' AS category, 'redis, connection timeout, timeout connecting to server, cache unavailable' AS keywords, '应用或 Redis 客户端日志出现 connection timeout、timeout connecting to server 或 cache unavailable，缓存连接不可用。' AS symptom, 'Redis 实例不可达、网络抖动、连接池打满、主从切换窗口中断，或 DNS/服务发现异常。' AS possible_cause, '先确认 Redis 实例健康和端口连通性，再检查连接池、主从切换、代理层和超时配置；缓存问题不要只在应用侧重试放大流量。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Redis authentication failed' AS title, 'cache_auth_error' AS category, 'redis, noauth authentication required, wrongpass, auth failed' AS keywords, '日志出现 NOAUTH Authentication required、WRONGPASS 或类似认证失败信息，应用无法使用 Redis。' AS symptom, '密码错误、ACL 用户权限变化、秘钥轮换未同步、环境变量注入失败，或连接到了错误实例。' AS possible_cause, '先核对 Redis 用户、密码和 ACL，再检查秘钥轮换、配置下发和连接目标；如果是集群切换后出现，重点看实例地址是否正确。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Kafka leader not available' AS title, 'message_queue_error' AS category, 'kafka, leader not available, not leader for partition, broker unavailable' AS keywords, '生产者或消费者日志出现 Leader not available、Not leader for partition，消息读写暂时失败。' AS symptom, 'Broker 重启、分区 leader 切换中、控制器抖动、ISR 不稳定，或网络导致元数据过期。' AS possible_cause, '先确认集群是否在重平衡或 leader 切换，再检查 broker 健康、网络和分区副本状态；客户端也要刷新元数据并控制重试节奏。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Application consumer lag or queue backlog' AS title, 'application_queue_backlog' AS category, 'consumer lag, queue backlog, message backlog, processing delay' AS keywords, '监控或日志显示 consumer lag 持续升高、队列积压加重，异步处理明显落后于生产速度。' AS symptom, '消费者实例不足、下游依赖变慢、单条消息处理过重、重试风暴，或分区分布不均导致热点积压。' AS possible_cause, '先判断是生产突增还是消费变慢，再检查消费者并发、失败重试、分区热点和下游依赖；必要时临时扩消费并暂停非关键任务。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'gRPC deadline exceeded or unavailable' AS title, 'application_rpc_error' AS category, 'grpc, deadline exceeded, rpc unavailable, unavailable desc, upstream rpc timeout' AS keywords, '应用日志出现 gRPC DeadlineExceeded 或 Unavailable，远程调用在超时或连接阶段失败。' AS symptom, '下游服务响应慢、连接中断、负载均衡抖动、证书或 DNS 问题，或客户端 deadline 配置过短。' AS possible_cause, '先区分是连接建立失败还是调用超时，再检查 gRPC 连接复用、负载均衡、TLS 和下游耗时；必要时按链路拆分超时设置。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Webhook signature verification failed' AS title, 'application_auth' AS category, 'signature verification failed, webhook signature invalid, hmac mismatch, invalid signature' AS keywords, '日志出现 signature verification failed 或 invalid webhook signature，回调请求在验签阶段被拒绝。' AS symptom, '共享密钥不一致、请求体被代理改写、时间窗口校验失败，或第三方切换了签名算法但本地未同步。' AS possible_cause, '先确认原始请求体是否被中间件修改，再核对密钥、签名算法和时间窗口；验签问题通常不是简单的 401，需要对照第三方文档逐项排查。' AS solution, 'internal_runbook' AS source
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
