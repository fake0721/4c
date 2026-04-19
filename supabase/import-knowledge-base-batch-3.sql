WITH incoming AS (
    SELECT 'Nginx upstream connect timeout' AS title, 'nginx_timeout' AS category, 'nginx, upstream connect timeout, connect timed out, upstream timeout' AS keywords, '日志出现 upstream timed out while connecting to upstream 或 connect timed out，请求在建立上游连接阶段超时。' AS symptom, '上游服务响应过慢、网络链路抖动、服务发现地址失效、SYN 积压，或连接超时配置过短。' AS possible_cause, '先确认上游服务实例是否可达，再检查网络延迟、容器健康状态和超时配置；必要时扩容上游并优化连接复用。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Nginx upstream sent too big header' AS title, 'nginx_header_error' AS category, 'nginx, upstream sent too big header, header too large, proxy buffer' AS keywords, '日志出现 upstream sent too big header while reading response header from upstream，响应头过大导致代理失败。' AS symptom, '上游返回了过长的 cookie、token 或自定义响应头，proxy_buffer_size 与相关缓冲配置过小。' AS possible_cause, '先检查上游返回头大小和最近发布变更，再适当调整 nginx proxy buffer 配置；如果头部过大本身不合理，应收敛业务设计。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Nginx client closed request 499' AS title, 'nginx_client_disconnect' AS category, 'nginx, 499, client closed request, client disconnect' AS keywords, '访问日志大量出现 499，表示客户端在服务端响应前就断开了连接。' AS symptom, '接口响应时间过长、前端或网关超时过短、客户端主动取消请求，或异常刷流量导致连接被提前释放。' AS possible_cause, '先确认 499 是否集中在特定接口，再看接口耗时、客户端超时配置和上游依赖健康；必要时优化慢接口并校正超时链路。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Nginx upstream keepalive exhausted' AS title, 'nginx_upstream_connection' AS category, 'nginx, upstream keepalive, connection reuse, keepalive exhausted' AS keywords, 'nginx 与上游服务的长连接复用效果变差，出现大量新建连接或连接耗尽现象。' AS symptom, 'upstream keepalive 配置不合理、上游主动关闭长连接、实例数变化频繁，或短时间高并发压垮连接池。' AS possible_cause, '先看 nginx keepalive 配置和上游服务的连接关闭策略，再检查实例伸缩和并发峰值；必要时调整连接池和长连接参数。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'PostgreSQL checkpoint too frequent' AS title, 'database_checkpoint' AS category, 'postgresql, checkpoints are occurring too frequently, checkpoint warning' AS keywords, '日志提示 checkpoints are occurring too frequently，数据库 checkpoint 过于频繁。' AS symptom, 'WAL 生成速度过快、checkpoint_timeout 或 max_wal_size 配置过小、磁盘性能不足，或批量写入突增。' AS possible_cause, '先看写入高峰、WAL 增长速度和磁盘 IO，再调整 checkpoint 相关参数；如果是业务写入模式异常，需要一起优化。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL relation does not exist' AS title, 'database_schema_error' AS category, 'postgresql, relation does not exist, table missing, schema migration' AS keywords, '日志出现 relation does not exist，SQL 访问了不存在的表、视图或索引。' AS symptom, '数据库迁移未执行、schema 名称不一致、回滚后代码未同步，或查询拼写错误。' AS possible_cause, '先核对当前库结构与发布版本，再检查迁移执行记录和 schema 前缀；必要时回滚代码或补执行迁移。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL invalid input syntax' AS title, 'database_input_error' AS category, 'postgresql, invalid input syntax, malformed value, type conversion' AS keywords, '日志出现 invalid input syntax for type，说明写入或查询参数的类型与数据库字段不匹配。' AS symptom, '应用参数校验缺失、前端上传非法值、字段类型变更未同步，或时区/格式转换错误。' AS possible_cause, '先定位具体字段和值，再补齐应用入参校验和类型转换；如果是 schema 变更导致，确保上下游版本一致。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL connection refused from application' AS title, 'database_connection' AS category, 'postgresql, connection refused, could not connect to server, tcp connect failed' AS keywords, '应用日志出现 could not connect to server: Connection refused，应用无法建立数据库 TCP 连接。' AS symptom, '数据库未启动、监听地址错误、防火墙阻断、服务发现配置失效，或代理层未就绪。' AS possible_cause, '先确认数据库实例和监听端口，再检查网络连通性、容器服务名、代理配置和安全组规则。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'PostgreSQL recovery conflict on standby' AS title, 'database_replication' AS category, 'postgresql, canceling statement due to conflict with recovery, standby conflict' AS keywords, '从库日志出现 canceling statement due to conflict with recovery，只读查询被恢复流程打断。' AS symptom, '从库长查询阻塞了 WAL 回放、主从延迟升高，或报表查询与复制恢复冲突。' AS possible_cause, '先看从库长查询和复制延迟，再判断是否需要将重查询流量迁出从库，或调高冲突容忍窗口。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'System kernel panic' AS title, 'system_kernel_failure' AS category, 'kernel panic, not syncing, fatal kernel error' AS keywords, '系统出现 kernel panic，整机可能直接重启或完全失去服务能力。' AS symptom, '内核缺陷、驱动冲突、硬件故障、文件系统严重错误，或内核参数调整不当。' AS possible_cause, '优先保留 crash 信息和串口或控制台日志，排查最近内核、驱动和底层硬件变更；必要时立即切流并更换节点。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'System filesystem corruption detected' AS title, 'system_filesystem' AS category, 'filesystem corruption, ext4 error, xfs corruption, superblock' AS keywords, '日志出现文件系统损坏或 superblock 错误，读写稳定性明显下降。' AS symptom, '磁盘介质异常、异常断电、强制重启、底层存储故障，或文件系统元数据受损。' AS possible_cause, '先停止高风险写入并保留现场，再根据文件系统类型安排 fsck 或更换卷；生产环境优先迁移业务后再修复。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'System mount failure' AS title, 'system_mount_error' AS category, 'mount failure, failed to mount, mount point unavailable' AS keywords, '系统启动或运行中出现 failed to mount，导致目录、卷或持久化存储不可用。' AS symptom, 'fstab 配置错误、远端存储不可达、权限问题、设备名称变化，或挂载参数不兼容。' AS possible_cause, '先确认目标块设备或远端存储是否存在，再核对 fstab、systemd mount unit 和挂载参数；不要反复强挂造成更多损坏。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'System DNS resolution failure' AS title, 'system_dns_error' AS category, 'temporary failure in name resolution, dns lookup failed, resolver' AS keywords, '系统或应用日志出现 Temporary failure in name resolution、lookup failed 等解析失败信息。' AS symptom, 'DNS 服务不可用、配置错误、CoreDNS 异常、网络抖动，或上游域名本身不存在。' AS possible_cause, '先确认是局部节点还是全局解析失败，再检查 resolv.conf、集群 DNS、宿主机网络和域名配置。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'System time drift or clock skew' AS title, 'system_time_error' AS category, 'clock skew, time drift, ntp offset, certificate time invalid' AS keywords, '系统时间明显漂移，可能伴随证书校验失败、token 校验失败或分布式协调异常。' AS symptom, 'NTP 未同步、宿主机时间源异常、虚拟化环境漂移，或手工调整系统时间。' AS possible_cause, '先检查 NTP 或 chrony 状态和时间偏移，再确认宿主机时间源；时间问题会级联影响认证、TLS 和分布式系统。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Java NullPointerException' AS title, 'application_exception' AS category, 'java, nullpointerexception, npe, null reference' AS keywords, '应用日志出现 NullPointerException，说明代码在访问空对象时失败。' AS symptom, '参数校验缺失、依赖对象注入失败、返回值未判空，或异常分支未覆盖。' AS possible_cause, '先定位异常栈最上层的业务代码，再检查最近发布和空值来源；补齐判空、默认值与异常保护。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Java IllegalStateException' AS title, 'application_exception' AS category, 'java, illegalstateexception, invalid state' AS keywords, '应用日志出现 IllegalStateException，当前对象或流程状态不符合调用预期。' AS symptom, '初始化顺序错误、幂等控制缺失、状态机流转异常，或并发下状态被重复消费。' AS possible_cause, '先判断异常是否由状态不一致引起，再检查初始化、事务边界和并发保护；必要时增加状态校验和幂等控制。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Java OutOfMemoryError' AS title, 'application_memory_error' AS category, 'java, outofmemoryerror, heap space, metaspace, gc overhead' AS keywords, '应用日志出现 OutOfMemoryError，JVM 无法再分配堆、元空间或直接内存。' AS symptom, '内存泄漏、堆配置过小、大对象突增、缓存无上限，或 GC 长时间无法回收。' AS possible_cause, '先区分 heap、metaspace 还是 direct memory，再结合 dump、GC 日志和最近发布分析；必要时扩内存并修复泄漏点。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Python traceback most recent call last' AS title, 'application_exception' AS category, 'python, traceback, most recent call last, stack trace' AS keywords, '日志出现 Traceback (most recent call last)，Python 服务抛出了未捕获异常。' AS symptom, '业务分支未处理、第三方库抛错、输入不合法，或底层依赖不可用。' AS possible_cause, '先看 Traceback 最后一段异常类型和首个业务文件位置，再结合入参和上下游状态定位；不要只看最外层包装异常。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Python KeyError or ValueError' AS title, 'application_exception' AS category, 'python, keyerror, valueerror, invalid value, missing key' AS keywords, '日志出现 KeyError、ValueError，通常表示输入结构或业务数据不符合预期。' AS symptom, '上游字段缺失、数据清洗不完整、接口协议变更未同步，或用户输入格式非法。' AS possible_cause, '先定位异常字段和值来源，再补齐参数校验、默认值和协议兼容；如果是上游变更，及时同步接口契约。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Application dependency unavailable' AS title, 'application_dependency_error' AS category, 'dependency unavailable, downstream unavailable, service unavailable, dependency failed' AS keywords, '应用日志明确提示 dependency unavailable 或 service unavailable，下游依赖当前不可用。' AS symptom, '下游服务宕机、发布中断、健康检查误摘除、连接池打满，或网络链路异常。' AS possible_cause, '先确认是哪个依赖不可用，再看依赖服务健康、网络和限流状态；必要时启用降级、旁路或只读模式。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Application TLS certificate expired' AS title, 'application_ssl_error' AS category, 'certificate expired, x509, tls certificate, ssl verify failed' AS keywords, '日志出现 certificate expired、x509 相关校验失败，TLS 连接无法建立。' AS symptom, '证书过期、证书链未更新、系统时间异常，或客户端信任链不完整。' AS possible_cause, '先核对证书有效期和时间同步，再检查证书链和部署范围；如果是批量过期，要同步更新全部实例和代理层。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Application DNS lookup failed' AS title, 'application_dns_error' AS category, 'lookup failed, no such host, temporary failure in name resolution, dns lookup' AS keywords, '应用日志出现 no such host 或 lookup failed，下游域名在应用侧解析失败。' AS symptom, '服务名写错、DNS 服务异常、容器网络异常，或跨环境配置错误。' AS possible_cause, '先确认失败域名和环境配置，再检查容器 DNS、服务注册和网络连通性；避免把环境专属域名带到生产。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Application pool exhausted' AS title, 'application_resource_limit' AS category, 'pool exhausted, thread pool exhausted, connection pool exhausted, rejected execution' AS keywords, '日志出现线程池、连接池或对象池耗尽，请求开始排队、拒绝或超时。' AS symptom, '突发流量、慢依赖导致资源回收变慢、池大小设置过小，或某类请求泄漏资源。' AS possible_cause, '先看池使用率和等待队列，再区分是容量不足还是资源泄漏；必要时临时扩池，同时修复慢依赖或泄漏问题。' AS solution, 'internal_runbook' AS source
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
