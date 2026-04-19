WITH incoming AS (
    SELECT 'Nginx upstream timed out' AS title, 'nginx_timeout' AS category, 'nginx, upstream timed out, gateway timeout, 504, reverse proxy' AS keywords, '日志出现 upstream timed out、gateway timeout 或请求长时间无响应，客户端通常收到 504 或上游超时错误。' AS symptom, '上游应用响应过慢、数据库慢查询、连接池耗尽、线程池阻塞、DNS 解析异常，或 nginx/read timeout 配置过小。' AS possible_cause, '先检查上游服务健康状态和响应时间，再看应用线程池、数据库慢查询和连接池占用情况；必要时扩容上游服务，并调整 nginx 与应用两侧的超时配置。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Nginx 502 bad gateway' AS title, 'nginx_5xx' AS category, 'nginx, 502, bad gateway, upstream, reverse proxy' AS keywords, '日志出现 502 或 bad gateway，前端请求被网关拒绝或转发失败。' AS symptom, '上游服务未启动、端口未监听、容器重启中、代理目标配置错误，或上游进程崩溃导致网关无法建立连接。' AS possible_cause, '先确认上游服务实例和监听端口是否正常，再检查 nginx upstream 配置、容器编排状态和应用日志；如果是重启抖动，先稳定上游服务再恢复流量。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Nginx 503 service unavailable' AS title, 'nginx_5xx' AS category, 'nginx, 503, service unavailable, overload, maintenance' AS keywords, '日志出现 503 或 service unavailable，请求到达网关但服务不可用。' AS symptom, '应用实例不可用、限流或熔断生效、上游全部摘除、发布维护窗口，或连接数达到上限。' AS possible_cause, '先看上游实例健康检查和负载均衡摘除情况，再看限流、熔断和发布策略；若为容量问题，优先扩实例或恢复可用节点。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Nginx worker process core dumped' AS title, 'nginx_crash' AS category, 'nginx, core dumped, worker process, signal 6, crash' AS keywords, '日志出现 worker process exited on signal 6 (core dumped) 或类似崩溃信息。' AS symptom, '模块兼容问题、非法内存访问、第三方动态模块缺陷、配置异常触发崩溃，或底层库冲突。' AS possible_cause, '先保留 core 文件并定位崩溃点，回溯最近的 nginx 配置和模块变更；必要时回滚第三方模块、升级稳定版本并在测试环境复现。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL too many connections' AS title, 'database_connection' AS category, 'postgresql, too many connections, max_connections, connection pool' AS keywords, '日志出现 too many connections，应用侧可能伴随数据库连接建立失败。' AS symptom, '连接池泄漏、空闲连接未回收、瞬时并发激增、长事务占用连接过久，或 max_connections 设置过低。' AS possible_cause, '先检查连接池配置、活跃连接数和长事务，再排查应用是否存在连接泄漏；必要时临时提升 max_connections，并同步优化池大小和释放策略。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL remaining connection slots are reserved' AS title, 'database_connection' AS category, 'postgresql, remaining connection slots are reserved, reserved slots' AS keywords, '日志出现 remaining connection slots are reserved for non-replication superuser connections，业务连接继续失败。' AS symptom, '数据库连接已逼近上限，保留连接槽仅剩给超级用户或特殊角色，普通业务连接无法再建立。' AS possible_cause, '优先释放异常连接和空闲连接，检查连接池是否回收失效；必要时用管理员连接排查 pg_stat_activity，并限制无效业务重试。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL deadlock detected' AS title, 'database_deadlock' AS category, 'postgresql, deadlock detected, lock timeout, transaction' AS keywords, '日志出现 deadlock detected，部分事务被数据库回滚，业务请求可能随机失败。' AS symptom, '多个事务以不同顺序争抢相同资源、事务持续时间过长，或批量更新导致锁范围扩大。' AS possible_cause, '先分析死锁涉及的 SQL 和事务顺序，统一加锁顺序并缩短事务生命周期；必要时拆分批量操作，降低单次锁持有时间。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'PostgreSQL password authentication failed' AS title, 'database_auth' AS category, 'postgresql, password authentication failed, pg_hba.conf, auth' AS keywords, '日志出现 password authentication failed 或 no pg_hba.conf entry，应用无法连接数据库。' AS symptom, '用户名密码错误、密钥轮换后配置未更新、连接来源不在 pg_hba.conf 白名单内，或认证方式不匹配。' AS possible_cause, '先核对应用配置中的用户名和密码，再检查 pg_hba.conf、来源 IP 和认证方法；如果是秘钥轮换，确保所有实例同步更新后再重启连接池。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'System out of memory or OOM killer' AS title, 'system_memory' AS category, 'oom, out of memory, oom-killer, killed process, linux memory' AS keywords, '系统日志出现 out of memory、oom-killer 或 killed process，服务进程被操作系统强制终止。' AS symptom, '应用内存泄漏、突发流量导致内存打满、缓存配置过高、容器 limits 设置过小，或同机资源争抢严重。' AS possible_cause, '先确认被杀进程和内存占用曲线，再看应用堆内存、容器限制和同机进程占用；必要时扩内存、降并发、优化缓存并排查泄漏。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'System no space left on device' AS title, 'system_disk' AS category, 'no space left on device, disk full, inode, filesystem' AS keywords, '日志出现 no space left on device，文件写入、上传、数据库落盘或容器启动失败。' AS symptom, '磁盘容量耗尽、inode 用尽、日志未轮转、临时目录堆积，或备份文件未清理。' AS possible_cause, '先确认是磁盘空间还是 inode 耗尽，再清理日志、临时文件和历史包；同时补充日志轮转、归档和磁盘容量告警。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'System permission denied or operation not permitted' AS title, 'system_permission' AS category, 'permission denied, operation not permitted, chmod, ownership, selinux' AS keywords, '日志出现 permission denied 或 operation not permitted，服务在访问文件、端口或目录时失败。' AS symptom, '文件属主属组错误、目录权限不足、容器安全上下文限制、SELinux 或 AppArmor 拦截，或非特权端口配置错误。' AS possible_cause, '先核对目标文件和目录权限、运行用户与挂载点，再检查 SELinux/AppArmor 和容器安全策略；不要直接给过宽权限，优先最小权限修复。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'OpenSSH daemon internal error' AS title, 'ssh_service_error' AS category, 'sshd, unexpected internal error, libcrypto, corrupted mac, key type' AS keywords, '日志出现 unexpected internal error、error in libcrypto、Corrupted MAC on input 或证书、密钥相关异常。' AS symptom, '客户端握手异常、密钥算法不兼容、损坏的报文、加密库异常，或存在利用探测行为。' AS possible_cause, '先确认是否来自单一来源 IP 的探测流量，再检查 OpenSSH 与底层加密库版本、密钥算法配置和审计日志；必要时限制来源并升级组件。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'DNS zone transfer failed' AS title, 'dns_service_error' AS category, 'dns, zone transfer failed, AXFR, authoritative zone' AS keywords, '日志出现 zone transfer failed、denied AXFR from 或 non-authoritative zone 等错误。' AS symptom, '主从 DNS 配置不一致、授权列表错误、目标区域不存在、网络 ACL 阻断，或插件加载异常。' AS possible_cause, '先核对主从区域配置、传送授权 IP 和网络连通性，再检查 zone 文件和 DNS 插件加载情况；必要时重载 DNS 并验证同步状态。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Spring Security access denied or CSRF exception' AS title, 'application_auth' AS category, 'spring, accessdeniedexception, csrfeception, invalidcsrftokenexception, requestrejectedexception' AS keywords, '应用日志出现 AccessDeniedException、CsrfException、InvalidCsrfTokenException 或 RequestRejectedException，用户请求被拒绝。' AS symptom, '权限控制不足、CSRF token 失效、跨站请求被拦截、代理头异常，或恶意请求触发框架保护逻辑。' AS possible_cause, '先区分是真实用户失败还是异常探测流量，再检查安全配置、token 生命周期、反向代理头透传和路径放行规则；必要时补充白名单或修正前端 token 刷新逻辑。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Django SuspiciousOperation or DisallowedHost' AS title, 'application_auth' AS category, 'django, suspiciousoperation, disallowedhost, permissiondenied, invalidsessionkey' AS keywords, '日志出现 SuspiciousOperation、DisallowedHost、InvalidSessionKey 或 PermissionDenied，框架主动拒绝请求。' AS symptom, 'ALLOWED_HOSTS 配置不完整、请求头伪造、会话异常、上传数据过大，或扫描器探测非法路径。' AS possible_cause, '先看失败请求来源和 Host 头内容，再检查 Django 的 ALLOWED_HOSTS、代理转发配置、会话存储和上传限制；如果是探测流量，补防护规则并保留审计记录。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'SQL syntax or injection style error message' AS title, 'database_error' AS category, 'sql syntax error, unclosed quotation mark, union, quoted string not properly terminated' AS keywords, '应用日志出现 quoted string not properly terminated、You have an error in your SQL syntax、Unclosed quotation mark 或 UNION 相关错误。' AS symptom, '动态 SQL 拼接错误、参数未转义、ORM 使用方式错误，或外部请求在探测 SQL 注入漏洞。' AS possible_cause, '优先改为参数化查询，排查相关接口是否直接拼接输入；同时结合来源 IP、请求参数和 WAF 日志判断是否存在注入探测行为。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Java process execution error' AS title, 'app_runtime_error' AS category, 'java, cannot run program, processbuilder, processimpl' AS keywords, '日志出现 Cannot run program、ProcessBuilder 或 ProcessImpl 相关异常，应用在执行外部命令时失败。' AS symptom, '目标命令不存在、PATH 环境缺失、权限不足、工作目录错误，或异常请求触发了危险命令执行路径。' AS possible_cause, '先确认业务是否真的需要执行外部命令，再检查运行账户权限、命令路径和容器镜像内容；如果是异常调用链，立即收敛入口并审计参数来源。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Node.js child_process execution error' AS title, 'app_runtime_error' AS category, 'nodejs, child_process, exec, spawn, fork' AS keywords, '日志出现 node:child_process 或相关执行错误，Node.js 服务在调用外部进程时失败。' AS symptom, '命令不存在、参数非法、权限不足、工作目录异常，或外部输入触发潜在命令执行风险。' AS possible_cause, '优先检查 child_process 的调用点和入参来源，避免直接拼接用户输入；再检查运行环境、镜像内工具、权限和资源限制。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Velocity template engine exception' AS title, 'template_engine_exception' AS category, 'velocity, parseerrorexception, velocityexception, templateinitexception' AS keywords, '日志出现 ParseErrorException、VelocityException 或 TemplateInitException，模板渲染失败。' AS symptom, '模板语法错误、模板变量为空、模板文件损坏，或异常输入触发模板注入相关问题。' AS possible_cause, '先核对出错模板和传入上下文，再检查最近模板发布和渲染参数；如果模板内容可被外部输入影响，应尽快收敛模板来源并加白名单。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Application connection refused' AS title, 'application_connection' AS category, 'connection refused, connectexception, downstream service unavailable' AS keywords, '应用日志出现 connection refused、ConnectException 或 dial tcp ... connection refused，调用下游服务失败。' AS symptom, '下游服务未启动、监听端口错误、服务注册信息过期、网络策略阻断，或目标实例重启中。' AS possible_cause, '先确认下游服务进程、监听端口和注册发现状态，再检查网络连通性、容器编排和防火墙规则；若为重启抖动，优先稳定实例和重试策略。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Application read timeout' AS title, 'application_timeout' AS category, 'read timeout, socket timeout, request timed out, downstream latency' AS keywords, '应用日志出现 read timeout、socket timeout 或 request timed out，下游调用超时。' AS symptom, '下游接口慢、网络抖动、线程池阻塞、数据库慢查询，或客户端超时配置过短。' AS possible_cause, '先定位超时发生在哪一跳，再对照上游、下游、数据库和网络指标；必要时优化慢接口、扩容服务并调整超时与重试策略。' AS solution, 'internal_runbook' AS source
    UNION ALL
    SELECT 'Bitbucket login failure' AS title, 'authentication_failure' AS category, 'bitbucket, authentication, user login failed, ssh login failed' AS keywords, '审计日志出现 User login failed 或 User login failed(SSH)，账户认证失败次数升高。' AS symptom, '用户名密码错误、SSH key 配置错误、凭据过期、来源异常，或存在暴力破解尝试。' AS possible_cause, '先确认失败用户和来源 IP 是否异常，再核对凭据、SSH key 和权限变更记录；对短时间高频失败源启用限流、封禁或额外认证。' AS solution, 'official_doc' AS source
    UNION ALL
    SELECT 'Apache worker segmentation fault' AS title, 'web_server_crash' AS category, 'apache, segmentation fault, worker crash, signal' AS keywords, '日志出现 exit signal Segmentation Fault 或工作进程段错误崩溃。' AS symptom, '模块冲突、内存破坏、第三方扩展缺陷、底层库不兼容，或恶意输入触发边界条件。' AS possible_cause, '先保留 core 和崩溃前请求特征，再回顾最近模块和配置变更；必要时回滚风险模块、升级稳定版本并在隔离环境复现。' AS solution, 'official_doc' AS source
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
