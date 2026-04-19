WITH incoming AS (
    SELECT 'Nginx Upstream Connection Refused' AS name, '检测 nginx 连接上游时被拒绝。' AS description, 'connect\(\) failed \(111: Connection refused\) while connecting to upstream|connection refused while connecting to upstream' AS pattern, 'regex' AS match_type, 'i' AS flags, 'connection_refused' AS error_type, 'high' AS risk_level, ARRAY['nginx']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Nginx No Live Upstreams' AS name, '检测 nginx 找不到可用上游节点。' AS description, 'no live upstreams while connecting to upstream' AS pattern, 'regex' AS match_type, 'i' AS flags, 'upstream_unavailable' AS error_type, 'high' AS risk_level, ARRAY['nginx']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Nginx Host Not Found In Upstream' AS name, '检测 upstream 主机解析失败。' AS description, 'host not found in upstream' AS pattern, 'regex' AS match_type, 'i' AS flags, 'dns_error' AS error_type, 'high' AS risk_level, ARRAY['nginx']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Nginx Upstream Prematurely Closed' AS name, '检测 upstream 在响应头返回前主动断开。' AS description, 'upstream prematurely closed connection while reading response header from upstream' AS pattern, 'regex' AS match_type, 'i' AS flags, 'upstream_connection_error' AS error_type, 'high' AS risk_level, ARRAY['nginx']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Nginx Upstream Connection Reset' AS name, '检测上游连接被重置。' AS description, 'recv\(\) failed \(104: Connection reset by peer\) while reading response header from upstream|connection reset by peer.*upstream' AS pattern, 'regex' AS match_type, 'i' AS flags, 'upstream_connection_error' AS error_type, 'high' AS risk_level, ARRAY['nginx']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Nginx Request Body Too Large' AS name, '检测客户端请求体超过 nginx 限制。' AS description, 'client intended to send too large body' AS pattern, 'regex' AS match_type, 'i' AS flags, 'request_rejected' AS error_type, 'medium' AS risk_level, ARRAY['nginx']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Nginx SSL Handshake Failed' AS name, '检测 nginx TLS 握手失败。' AS description, 'SSL_do_handshake\(\) failed|tlsv1 alert|ssl handshake failed' AS pattern, 'regex' AS match_type, 'i' AS flags, 'ssl_error' AS error_type, 'medium' AS risk_level, ARRAY['nginx']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Nginx Too Many Open Files' AS name, '检测 nginx 文件描述符耗尽。' AS description, 'too many open files' AS pattern, 'regex' AS match_type, 'i' AS flags, 'resource_limit' AS error_type, 'high' AS risk_level, ARRAY['nginx', 'system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Postgres Lock Timeout' AS name, '检测 PostgreSQL 锁等待超时。' AS description, 'canceling statement due to lock timeout|lock timeout' AS pattern, 'regex' AS match_type, 'i' AS flags, 'database_lock_timeout' AS error_type, 'high' AS risk_level, ARRAY['postgres', 'application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Postgres Serialization Failure' AS name, '检测 PostgreSQL 并发更新导致的串行化失败。' AS description, 'could not serialize access due to concurrent update|serialization failure' AS pattern, 'regex' AS match_type, 'i' AS flags, 'database_concurrency_error' AS error_type, 'medium' AS risk_level, ARRAY['postgres', 'application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Postgres Startup Refusal' AS name, '检测数据库仍处于启动或恢复阶段。' AS description, 'the database system is starting up' AS pattern, 'regex' AS match_type, 'i' AS flags, 'database_unavailable' AS error_type, 'high' AS risk_level, ARRAY['postgres', 'application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Postgres Disk Full Write Failure' AS name, '检测 PostgreSQL 因磁盘满导致写入失败。' AS description, 'could not write to file|no space left on device' AS pattern, 'regex' AS match_type, 'i' AS flags, 'database_disk_error' AS error_type, 'high' AS risk_level, ARRAY['postgres', 'system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Postgres Connection Terminated By Admin' AS name, '检测连接被管理员命令终止。' AS description, 'terminating connection due to administrator command' AS pattern, 'regex' AS match_type, 'i' AS flags, 'database_session_termination' AS error_type, 'medium' AS risk_level, ARRAY['postgres', 'application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Postgres Replication Lag Warning' AS name, '检测复制延迟相关异常。' AS description, 'replication lag|standby delay|recovery conflict' AS pattern, 'regex' AS match_type, 'i' AS flags, 'database_replication_error' AS error_type, 'medium' AS risk_level, ARRAY['postgres', 'system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'System Too Many Open Files' AS name, '检测系统文件描述符耗尽。' AS description, 'too many open files' AS pattern, 'regex' AS match_type, 'i' AS flags, 'resource_limit' AS error_type, 'high' AS risk_level, ARRAY['system', 'application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'System Read Only File System' AS name, '检测文件系统被重新挂载为只读。' AS description, 'read-only file system|remount-ro' AS pattern, 'regex' AS match_type, 'i' AS flags, 'filesystem_error' AS error_type, 'high' AS risk_level, ARRAY['system', 'application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'System Device Busy' AS name, '检测设备或资源忙导致操作失败。' AS description, 'device or resource busy' AS pattern, 'regex' AS match_type, 'i' AS flags, 'resource_busy' AS error_type, 'medium' AS risk_level, ARRAY['system', 'application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'System Cannot Allocate Memory' AS name, '检测内存申请失败。' AS description, 'cannot allocate memory' AS pattern, 'regex' AS match_type, 'i' AS flags, 'memory_error' AS error_type, 'high' AS risk_level, ARRAY['system', 'application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'System Restart Loop Detected' AS name, '检测服务频繁拉起后被 systemd 停止。' AS description, 'start request repeated too quickly' AS pattern, 'regex' AS match_type, 'i' AS flags, 'service_restart_loop' AS error_type, 'high' AS risk_level, ARRAY['system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'System Service Failed To Start' AS name, '检测服务启动失败。' AS description, 'failed to start|unit entered failed state' AS pattern, 'regex' AS match_type, 'i' AS flags, 'service_start_failure' AS error_type, 'high' AS risk_level, ARRAY['system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'System Segmentation Fault' AS name, '检测系统或进程段错误崩溃。' AS description, 'segmentation fault|core dumped' AS pattern, 'regex' AS match_type, 'i' AS flags, 'process_crash' AS error_type, 'high' AS risk_level, ARRAY['system', 'application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Application Broken Pipe' AS name, '检测应用写响应时对端提前断开。' AS description, 'broken pipe' AS pattern, 'regex' AS match_type, 'i' AS flags, 'connection_reset' AS error_type, 'medium' AS risk_level, ARRAY['application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Application Token Invalid Or Expired' AS name, '检测鉴权 token 无效、过期或权限不足。' AS description, 'invalid token|token expired|unauthorized|forbidden|\b401\b|\b403\b' AS pattern, 'regex' AS match_type, 'i' AS flags, 'authentication_failure' AS error_type, 'medium' AS risk_level, ARRAY['application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Application Circuit Breaker Open' AS name, '检测熔断器开启或 fallback 执行。' AS description, 'circuit breaker open|fallback executed|bulkhead full' AS pattern, 'regex' AS match_type, 'i' AS flags, 'resilience_event' AS error_type, 'medium' AS risk_level, ARRAY['application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Application Retry Exhausted' AS name, '检测重试耗尽。' AS description, 'retry exhausted|max retries exceeded|retry attempts exhausted' AS pattern, 'regex' AS match_type, 'i' AS flags, 'retry_failure' AS error_type, 'medium' AS risk_level, ARRAY['application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Application Rate Limit Exceeded' AS name, '检测限流命中或 429。' AS description, 'rate limit exceeded|too many requests|\b429\b|throttl' AS pattern, 'regex' AS match_type, 'i' AS flags, 'rate_limit' AS error_type, 'medium' AS risk_level, ARRAY['application', 'nginx']::text[] AS source_types, true AS enabled
)
INSERT INTO public.detection_rules (
  name,
  description,
  pattern,
  match_type,
  flags,
  error_type,
  risk_level,
  source_types,
  enabled,
  created_by
)
SELECT
  incoming.name,
  incoming.description,
  incoming.pattern,
  incoming.match_type,
  incoming.flags,
  incoming.error_type,
  incoming.risk_level,
  incoming.source_types,
  incoming.enabled,
  null
FROM incoming
WHERE NOT EXISTS (
  SELECT 1
  FROM public.detection_rules existing
  WHERE lower(existing.name) = lower(incoming.name)
    AND lower(existing.pattern) = lower(incoming.pattern)
    AND lower(existing.error_type) = lower(incoming.error_type)
);
