WITH incoming AS (
    SELECT 'Nginx upstream connection refused' AS title, 'nginx_upstream_connection' AS category, 'nginx, connect() failed, connection refused, upstream, 111' AS keywords, '日志出现 connect() failed (111: Connection refused) while connecting to upstream，请求通常直接返回 502。' AS symptom, '上游服务未启动、目标端口未监听、服务注册信息失效、容器尚未就绪，或防火墙规则阻断了连接。' AS possible_cause, '先确认上游实例是否存活并监听正确端口，再检查服务发现、容器编排、健康检查和网络策略；如果是发布窗口问题，先恢复可用实例。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Nginx no live upstreams' AS title, 'nginx_upstream_connection' AS category, 'nginx, no live upstreams, upstream unavailable, load balancer' AS keywords, '日志出现 no live upstreams while connecting to upstream，nginx 找不到可用上游节点。' AS symptom, '所有上游实例都被健康检查摘除、配置中的 upstream 节点不可达，或发布过程中实例同时下线。' AS possible_cause, '先看 upstream 健康状态和最近发布记录，再确认负载均衡配置、健康检查阈值和实例数量；避免同一时刻全部摘除。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Nginx host not found in upstream' AS title, 'nginx_dns_error' AS category, 'nginx, host not found in upstream, dns, upstream resolve' AS keywords, '日志出现 host not found in upstream，请求转发前的主机解析失败。' AS symptom, 'upstream 域名写错、DNS 记录缺失、容器内部 DNS 不可用，或解析缓存未刷新。' AS possible_cause, '先核对 upstream 域名和解析结果，再检查容器或主机的 DNS 配置、CoreDNS 状态和服务注册情况；必要时改为稳定的服务名或固定解析策略。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Nginx upstream prematurely closed connection' AS title, 'nginx_upstream_connection' AS category, 'nginx, upstream prematurely closed connection, upstream closed' AS keywords, '日志出现 upstream prematurely closed connection while reading response header from upstream，上游在响应头返回前就断开连接。' AS symptom, '上游应用崩溃、线程池阻塞、连接池异常、请求被中间件提前终止，或超时后主动断开。' AS possible_cause, '先检查上游应用日志和崩溃信息，再看线程池、连接池、代理超时和请求大小；必要时对异常请求做限流并稳定上游服务。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Nginx connection reset by peer from upstream' AS title, 'nginx_upstream_connection' AS category, 'nginx, connection reset by peer, upstream reset, 104' AS keywords, '日志出现 recv() failed (104: Connection reset by peer) while reading response header from upstream，请求中途被上游重置。' AS symptom, '上游进程异常退出、负载过高主动断链、网络抖动、TLS 中断，或代理层与应用层连接参数不兼容。' AS possible_cause, '先确认上游服务稳定性和连接数曲线，再看网络质量、TLS 配置和发布变更；重点排查是否是上游重启或异常流量造成。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Nginx client intended to send too large body' AS title, 'nginx_request_limit' AS category, 'nginx, client intended to send too large body, request body, upload limit' AS keywords, '日志出现 client intended to send too large body，客户端上传体超过限制。' AS symptom, 'client_max_body_size 配置过小、客户端上传文件过大，或接口未区分普通请求和大文件上传场景。' AS possible_cause, '先确认请求体大小和业务预期，再调整 nginx 上传限制、应用侧校验和分片上传策略；不要一味全局放大限制。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Nginx SSL handshake failed' AS title, 'nginx_ssl_error' AS category, 'nginx, ssl_do_handshake failed, tls, certificate, handshake' AS keywords, '日志出现 SSL_do_handshake() failed 或 TLS 握手错误，客户端无法建立 HTTPS 连接。' AS symptom, '证书链不完整、协议版本不兼容、SNI 配置错误、加密套件不匹配，或异常客户端持续探测。' AS possible_cause, '先检查证书链、域名和协议配置，再确认客户端版本和 TLS 策略；如果来源异常，结合访问日志判断是否为扫描或攻击。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Nginx too many open files' AS title, 'nginx_resource_limit' AS category, 'nginx, too many open files, file descriptor, worker_rlimit_nofile' AS keywords, '日志出现 too many open files，nginx 无法继续打开连接、文件或 socket。' AS symptom, '系统文件描述符上限过低、连接数激增、日志文件过多或进程泄漏 fd。' AS possible_cause, '先检查进程 fd 使用量和系统 limits，再调整 worker_rlimit_nofile、systemd LimitNOFILE 和连接治理策略；同时排查 fd 泄漏。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL lock timeout' AS title, 'database_lock_timeout' AS category, 'postgresql, lock timeout, canceling statement due to lock timeout' AS keywords, '日志出现 canceling statement due to lock timeout，SQL 因等待锁过久被取消。' AS symptom, '热点行或热点表竞争严重、长事务持锁过久、批量更新范围过大，或锁顺序不一致。' AS possible_cause, '先定位阻塞链和持锁 SQL，再优化事务长度和加锁顺序；必要时拆分批量任务并降低锁粒度。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL serialization failure' AS title, 'database_concurrency' AS category, 'postgresql, could not serialize access, concurrent update, serialization failure' AS keywords, '日志出现 could not serialize access due to concurrent update，事务在高并发下无法完成串行化提交。' AS symptom, '并发更新同一资源、隔离级别较高、重试机制缺失，或事务逻辑过大导致冲突概率上升。' AS possible_cause, '先确认是否使用了 serializable 或 repeatable read，再为相关事务补充幂等重试机制，缩小事务范围并减少热点更新。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL database system is starting up' AS title, 'database_startup' AS category, 'postgresql, the database system is starting up, startup, recovery' AS keywords, '日志出现 FATAL: the database system is starting up，业务连接在数据库恢复或启动阶段被拒绝。' AS symptom, '数据库刚启动、崩溃恢复未完成、主从切换窗口中，或存储恢复过慢导致启动时间变长。' AS possible_cause, '先确认实例是否处于启动或恢复阶段，再看最近重启、崩溃、主从切换和磁盘性能；应用侧应避免无节制重试。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL could not write due to disk full' AS title, 'database_disk_error' AS category, 'postgresql, could not write to file, no space left on device, disk full' AS keywords, '日志出现 could not write to file 或 no space left on device，数据库落盘失败。' AS symptom, '数据盘或 WAL 盘空间耗尽、临时文件激增、归档积压，或宿主机磁盘告警未及时处理。' AS possible_cause, '立即确认是数据目录、WAL 目录还是临时目录打满，再清理归档、扩容磁盘并处理异常大查询；恢复前避免继续压测。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL terminating connection due to administrator command' AS title, 'database_session_termination' AS category, 'postgresql, terminating connection due to administrator command, session killed' AS keywords, '日志出现 terminating connection due to administrator command，业务连接被管理员操作或系统维护主动终止。' AS symptom, 'DBA 手动终止会话、维护脚本清理连接、故障切换过程关闭旧连接，或自动治理任务杀掉了异常连接。' AS possible_cause, '先确认是否存在人工维护、自动任务或切换事件，再判断是否误杀业务连接；必要时优化运维窗口和连接驱逐策略。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL replication lag high' AS title, 'database_replication' AS category, 'postgresql, replication lag, standby delay, wal apply lag' AS keywords, '日志或监控显示复制延迟升高，从库数据明显滞后。' AS symptom, '从库负载过高、网络抖动、WAL 生成过快、磁盘性能不足，或长查询阻塞了 WAL 回放。' AS possible_cause, '先看主从网络、磁盘 IO 和回放进度，再检查从库上的长查询和资源占用；必要时扩容从库或调整只读流量。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'System too many open files' AS title, 'system_resource_limit' AS category, 'system, too many open files, file descriptor, ulimit' AS keywords, '系统日志出现 too many open files，进程无法再打开文件、连接或 socket。' AS symptom, '进程 fd 泄漏、连接数异常增长、系统 limits 配置过低，或同机多个高并发服务共享资源。' AS possible_cause, '先定位 fd 占用最高的进程，再看系统 limits、连接治理和日志文件数量；修复泄漏后再提升上限，避免只靠扩容掩盖问题。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'System read-only file system' AS title, 'system_filesystem' AS category, 'read-only file system, remount ro, filesystem error' AS keywords, '日志出现 read-only file system，业务写入突然全部失败。' AS symptom, '磁盘或文件系统出现错误后被内核重新挂载为只读、底层存储异常，或容器挂载策略限制了写入。' AS possible_cause, '先确认是宿主机文件系统异常还是容器挂载问题，再查看内核日志和存储健康；必要时切换实例并安排文件系统检查。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'System device or resource busy' AS title, 'system_resource_busy' AS category, 'device or resource busy, mount busy, file busy, lock' AS keywords, '日志出现 device or resource busy，卸载、删除、重命名或挂载操作失败。' AS symptom, '目标文件或目录仍被进程占用、挂载点未释放，或系统锁与并发操作冲突。' AS possible_cause, '先确认哪个进程占用了资源，再决定平滑释放还是强制终止；如果涉及挂载点，先清理工作目录和后台任务。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'System cannot allocate memory' AS title, 'system_memory' AS category, 'cannot allocate memory, memory exhausted, allocation failure' AS keywords, '日志出现 cannot allocate memory，进程在申请内存时直接失败。' AS symptom, '系统剩余内存不足、地址空间受限、容器 memory limit 太小，或大对象分配异常。' AS possible_cause, '先区分是物理内存不足还是容器限制，再看是否存在大对象分配和内存碎片；必要时优化内存模型并提高资源上限。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'System service start request repeated too quickly' AS title, 'system_service_failure' AS category, 'start request repeated too quickly, systemd, service restart loop' AS keywords, 'systemd 日志出现 start request repeated too quickly，服务连续重启后被停止拉起。' AS symptom, '服务启动即崩溃、配置错误、依赖未就绪、端口占用，或健康检查脚本本身异常。' AS possible_cause, '先看服务第一次失败的根因日志，不要只盯着 systemd 的最终报错；修正配置、依赖和端口冲突后，再恢复自动拉起策略。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'System service failed to start' AS title, 'system_service_failure' AS category, 'failed to start, service failed, unit entered failed state' AS keywords, '日志出现 Failed to start 或 unit entered failed state，服务无法正常进入运行状态。' AS symptom, '配置错误、依赖缺失、权限问题、端口被占用、二进制损坏，或运行用户环境异常。' AS possible_cause, '先检查服务配置、依赖资源和启动命令，再确认运行用户权限、环境变量和端口；必要时回滚最近变更。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'System segmentation fault' AS title, 'system_process_crash' AS category, 'segmentation fault, core dumped, process crash' AS keywords, '日志出现 segmentation fault 或 core dumped，进程发生段错误崩溃。' AS symptom, '本地代码缺陷、第三方库冲突、非法内存访问、硬件问题，或异常输入触发边界条件。' AS possible_cause, '先保留 core 与崩溃栈，再结合最近发布、依赖升级和请求样本定位问题；不要直接重启了事。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Application broken pipe' AS title, 'application_connection' AS category, 'broken pipe, write failed, client disconnected' AS keywords, '应用日志出现 broken pipe，通常表示在写响应时对端已经断开连接。' AS symptom, '客户端超时取消、下游代理提前关闭、网络中断，或服务端响应过慢导致连接被释放。' AS possible_cause, '先确认是客户端主动断开还是代理层超时，再检查接口耗时、响应体大小和超时配置；必要时优化慢接口并降低无效重试。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Application unauthorized or token expired' AS title, 'application_auth' AS category, 'unauthorized, forbidden, invalid token, token expired, 401, 403' AS keywords, '应用日志持续出现 unauthorized、forbidden、invalid token 或 token expired，请求鉴权失败。' AS symptom, '令牌过期、签名密钥不一致、网关和应用时间不同步、权限映射错误，或异常请求使用失效凭据。' AS possible_cause, '先区分是用户侧凭据过期还是系统配置问题，再检查签名密钥、时间同步、权限缓存和网关透传；必要时强制刷新令牌。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Application circuit breaker open' AS title, 'application_resilience' AS category, 'circuit breaker open, fallback, resilience, downstream unavailable' AS keywords, '日志出现 circuit breaker open、fallback executed 或类似熔断信息，系统主动拒绝继续调用下游。' AS symptom, '下游失败率持续过高、超时堆积、线程池被耗尽，或熔断阈值配置过于敏感。' AS possible_cause, '先看下游可用性和失败率，再检查熔断阈值、恢复时间窗和线程池配置；熔断不是根因，根因通常在下游或资源瓶颈。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Application retry exhausted' AS title, 'application_resilience' AS category, 'retry exhausted, max retries exceeded, backoff' AS keywords, '日志出现 retry exhausted、max retries exceeded，说明应用多次重试后仍失败。' AS symptom, '下游长时间不可用、超时配置不合理、重试策略过于激进，或请求本身不可重试。' AS possible_cause, '先判断重试对象是否适合重试，再检查退避策略、最大重试次数和幂等性；避免错误重试放大故障。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Application rate limit exceeded' AS title, 'application_limit' AS category, 'rate limit exceeded, too many requests, throttling, 429' AS keywords, '日志出现 rate limit exceeded、too many requests 或 429，请求被限流。' AS symptom, '流量突增、单用户或单 IP 行为异常、限流阈值偏低，或下游保护机制触发。' AS possible_cause, '先区分是真实业务高峰还是异常刷流量，再调整限流阈值、分桶策略和缓存；必要时扩容并补充更细粒度限流。' AS solution, 'internal_runbook' AS source
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
