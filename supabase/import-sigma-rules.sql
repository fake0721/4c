WITH incoming AS (
    SELECT 'Sysmon Configuration Error' AS name, '检测 Sysmon 配置更新阶段的关键错误消息，可能导致日志能力受影响。' AS description, 'Failed to open service configuration with error|Failed to connect to the driver to update configuration' AS pattern, 'regex' AS match_type, 'i' AS flags, 'security_service_error' AS error_type, 'high' AS risk_level, ARRAY['system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Windows Service Terminated With Error' AS name, '检测 Service Control Manager 记录的服务错误终止事件。' AS description, 'Provider_Name\s*[:=]\sService Control Manager.*EventID\s*[:=]\s7023|EventID\s*[:=]\s7023' AS pattern, 'regex' AS match_type, 'i' AS flags, 'service_termination_error' AS error_type, 'medium' AS risk_level, ARRAY['system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Important Windows Service Terminated With Error' AS name, '检测关键安全相关服务错误终止。' AS description, 'EventID\s*[:=]\s7023.*(Antivirus|Firewall|Application Guard|BitLocker Drive Encryption Service|Encrypting File System|Microsoft Defender|Threat Protection|Windows Event Log|windefend|mpssvc|Sense|EventLog|BDESVC|EFS)' AS pattern, 'regex' AS match_type, 'i' AS flags, 'critical_service_termination' AS error_type, 'high' AS risk_level, ARRAY['system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Important Windows Service Terminated Unexpectedly' AS name, '检测关键服务意外终止，当前规则重点是 Message Queuing / MSMQ。' AS description, 'EventID\s*[:=]\s7034.*(Message Queuing|MSMQ|msmq)' AS pattern, 'regex' AS match_type, 'i' AS flags, 'critical_service_unexpected_termination' AS error_type, 'high' AS risk_level, ARRAY['system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Windows Update Error' AS name, '检测 Windows 更新相关错误。' AS description, 'Provider_Name\s*[:=]\sMicrosoft-Windows-WindowsUpdateClient.*EventID\s*[:=]\s(16|20|24|213|217)|EventID\s*[:=]\s(16|20|24|213|217)' AS pattern, 'regex' AS match_type, 'i' AS flags, 'system_update_error' AS error_type, 'medium' AS risk_level, ARRAY['system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Crash Dump Created By Operating System' AS name, '检测系统级崩溃后生成 dump 的事件。' AS description, 'Provider_Name\s*[:=]\sMicrosoft-Windows-WER-SystemErrorReporting.*EventID\s*[:=]\s1001|BugCheck|dump' AS pattern, 'regex' AS match_type, 'i' AS flags, 'system_crash_dump' AS error_type, 'high' AS risk_level, ARRAY['system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Sysmon Application Crashed' AS name, '检测 Sysmon 进程崩溃提示。' AS description, 'Provider_Name\s*[:=]\sApplication Popup.*EventID\s*[:=]\s26.*(sysmon64\.exe - Application Error|sysmon\.exe - Application Error)|sysmon(64)?\.exe - Application Error' AS pattern, 'regex' AS match_type, 'i' AS flags, 'security_service_crash' AS error_type, 'high' AS risk_level, ARRAY['system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'DHCP Server Failed Loading CallOut DLL' AS name, '检测 DHCP 服务加载 CallOut DLL 失败。' AS description, 'Provider_Name\s*[:=]\sMicrosoft-Windows-DHCP-Server.*EventID\s*[:=]\s(1031|1032|1034)|EventID\s*[:=]\s(1031|1032|1034)' AS pattern, 'regex' AS match_type, 'i' AS flags, 'service_plugin_load_failure' AS error_type, 'high' AS risk_level, ARRAY['system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'DNS Server Failed Loading ServerLevelPluginDLL' AS name, '检测 DNS 服务器插件 DLL 加载失败。' AS description, 'EventID\s*[:=]\s(150|770|771)|ServerLevelPluginDLL|plugin DLL.*could not be loaded' AS pattern, 'regex' AS match_type, 'i' AS flags, 'service_plugin_load_failure' AS error_type, 'high' AS risk_level, ARRAY['system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Failed DNS Zone Transfer' AS name, '检测 DNS 区域传送失败。' AS description, 'EventID\s*[:=]\s6004|zone transfer failed|non-existent or non-authoritative zone' AS pattern, 'regex' AS match_type, 'i' AS flags, 'dns_service_error' AS error_type, 'medium' AS risk_level, ARRAY['system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Windows Defender Firewall Failed To Load Group Policy' AS name, '检测 Windows Defender Firewall 服务加载组策略失败。' AS description, 'EventID\s*[:=]\s2009|Windows Defender Firewall service failed to load Group Policy' AS pattern, 'regex' AS match_type, 'i' AS flags, 'firewall_service_error' AS error_type, 'medium' AS risk_level, ARRAY['system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Windows Defender Real-Time Protection Failure Restart' AS name, '检测 Defender 实时防护错误或异常重启。' AS description, 'EventID\s*[:=]\s(3002|3007)|Real-Time Protection feature has encountered an error and failed|Real-time Protection feature has restarted' AS pattern, 'regex' AS match_type, 'i' AS flags, 'security_service_error' AS error_type, 'medium' AS risk_level, ARRAY['system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Microsoft Malware Protection Engine Crash' AS name, '检测 MsMpEng.exe 与 mpengine.dll 相关的应用崩溃。' AS description, 'Provider_Name\s*[:=]\sApplication Error.*EventID\s*[:=]\s1000.*MsMpEng\.exe.*mpengine\.dll|MsMpEng\.exe.*mpengine\.dll' AS pattern, 'regex' AS match_type, 'i' AS flags, 'security_engine_crash' AS error_type, 'high' AS risk_level, ARRAY['system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Microsoft Malware Protection Engine Crash WER' AS name, '检测 WER 侧记录的 MsMpEng / mpengine 崩溃事件。' AS description, 'Provider_Name\s*[:=]\sWindows Error Reporting.*EventID\s*[:=]\s1001.*MsMpEng\.exe.*mpengine\.dll|MsMpEng\.exe.*mpengine\.dll' AS pattern, 'regex' AS match_type, 'i' AS flags, 'security_engine_crash' AS error_type, 'high' AS risk_level, ARRAY['system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'LSASS Process Crashed Application' AS name, '检测 LSASS 崩溃事件。' AS description, 'Provider_Name\s*[:=]\sApplication Error.*EventID\s*[:=]\s1000.*AppName\s*[:=]\slsass\.exe.*ExceptionCode\s*[:=]\sc0000001|lsass\.exe.*c0000001' AS pattern, 'regex' AS match_type, 'i' AS flags, 'critical_process_crash' AS error_type, 'high' AS risk_level, ARRAY['system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Suspicious OpenSSH Daemon Error' AS name, '检测 SSHD 中典型致命错误模式。' AS description, 'unexpected internal error|unknown or unsupported key type|invalid certificate signing key|invalid elliptic curve value|incorrect signature|error in libcrypto|unexpected bytes remain after decoding|fatal: buffer_get_string: bad string|Local: crc32 compensation attack|bad client public DH value|Corrupted MAC on input' AS pattern, 'regex' AS match_type, 'i' AS flags, 'ssh_service_error' AS error_type, 'medium' AS risk_level, ARRAY['system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Suspicious VSFTPD Error Messages' AS name, '检测 VSFTPD 的异常或致命错误模式。' AS description, 'Connection refused: too many sessions for this address\.|Connection refused: tcp_wrappers denial\.|Bad HTTP verb\.|port and pasv both active|pasv and port both active|Transfer done \(but failed to open directory\)\.|Could not set file modification time\.|bug: pid active in ptrace_sandbox_free|PTRACE_SETOPTIONS failure|weird status:|couldn''t handle sandbox event|syscall .* out of bounds|syscall not permitted:|syscall validate failed:|Input line too long\.|poor buffer accounting in str_netfd_alloc|vsf_sysutil_read_loop' AS pattern, 'regex' AS match_type, 'i' AS flags, 'ftp_service_error' AS error_type, 'medium' AS risk_level, ARRAY['system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Suspicious Named Error' AS name, '检测 named DNS 服务中的关键错误模式。' AS description, 'dropping source port zero packet from|denied AXFR from|exiting \(due to fatal error\)' AS pattern, 'regex' AS match_type, 'i' AS flags, 'dns_service_error' AS error_type, 'high' AS risk_level, ARRAY['system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Spring Framework Exceptions' AS name, '检测 Spring 安全相关异常，常见于恶意请求触发的框架异常路径。' AS description, 'AccessDeniedException|CsrfException|InvalidCsrfTokenException|MissingCsrfTokenException|CookieTheftException|InvalidCookieException|RequestRejectedException' AS pattern, 'regex' AS match_type, 'i' AS flags, 'framework_exception' AS error_type, 'medium' AS risk_level, ARRAY['application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Django Framework Exceptions' AS name, '检测 Django 的安全相关异常，如 SuspiciousOperation 及其子类。' AS description, 'SuspiciousOperation|DisallowedHost|DisallowedModelAdminLookup|DisallowedModelAdminToField|DisallowedRedirect|InvalidSessionKey|RequestDataTooBig|SuspiciousFileOperation|SuspiciousMultipartForm|SuspiciousSession|TooManyFieldsSent|PermissionDenied' AS pattern, 'regex' AS match_type, 'i' AS flags, 'framework_exception' AS error_type, 'medium' AS risk_level, ARRAY['application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Ruby on Rails Framework Exceptions' AS name, '检测 Ruby on Rails 控制器层异常，常用于识别异常输入或利用探测。' AS description, 'ActionController::InvalidAuthenticityToken|ActionController::InvalidCrossOriginRequest|ActionController::MethodNotAllowed|ActionController::BadRequest|ActionController::ParameterMissing' AS pattern, 'regex' AS match_type, 'i' AS flags, 'framework_exception' AS error_type, 'medium' AS risk_level, ARRAY['application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Python SQL Exceptions' AS name, '检测 Python DB-API 常见 SQL 异常类型。' AS description, 'DataError|IntegrityError|ProgrammingError|OperationalError' AS pattern, 'regex' AS match_type, 'i' AS flags, 'database_error' AS error_type, 'medium' AS risk_level, ARRAY['application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Suspicious SQL Error Messages' AS name, '检测 SQL 注入探测常见错误信息。' AS description, 'quoted string not properly terminated|You have an error in your SQL syntax|Unclosed quotation mark|near \".*\": syntax error|SELECTs to the left and right of UNION do not have the same number of result columns' AS pattern, 'regex' AS match_type, 'i' AS flags, 'database_error' AS error_type, 'high' AS risk_level, ARRAY['application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'JVM Process Execution Error' AS name, '检测 JVM 应用中与进程执行相关的异常，可能关联命令执行风险。' AS description, 'Cannot run program|java\.lang\.ProcessImpl|java\.lang\.ProcessBuilder' AS pattern, 'regex' AS match_type, 'i' AS flags, 'app_runtime_error' AS error_type, 'high' AS risk_level, ARRAY['application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'NodeJS Child Process Execution Error' AS name, '检测 NodeJS child_process 相关错误，可能指向 RCE 触发路径。' AS description, 'node:child_process' AS pattern, 'regex' AS match_type, 'i' AS flags, 'app_runtime_error' AS error_type, 'high' AS risk_level, ARRAY['application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Velocity Template Renderer Exceptions' AS name, '检测 Velocity 模板引擎异常，可能与服务端模板注入相关。' AS description, 'ParseErrorException|VelocityException|TemplateInitException' AS pattern, 'regex' AS match_type, 'i' AS flags, 'template_engine_exception' AS error_type, 'high' AS risk_level, ARRAY['application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Bitbucket User Login Failure' AS name, '检测 Bitbucket 审计日志中的用户登录失败事件。' AS description, 'Authentication\.User login failed|auditType\.category\s*[:=]\sAuthentication.*auditType\.action\s*[:=]\sUser login failed' AS pattern, 'regex' AS match_type, 'i' AS flags, 'authentication_failure' AS error_type, 'medium' AS risk_level, ARRAY['application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Bitbucket User Login Failure Via SSH' AS name, '检测 Bitbucket 审计日志中的 SSH 登录失败事件。' AS description, 'Authentication\.User login failed\(SSH\)|auditType\.category\s*[:=]\sAuthentication.*auditType\.action\s*[:=]\sUser login failed\(SSH\)' AS pattern, 'regex' AS match_type, 'i' AS flags, 'authentication_failure' AS error_type, 'medium' AS risk_level, ARRAY['application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Nginx Worker Process Core Dump' AS name, '检测 Nginx 工作进程崩溃并生成 core dump。' AS description, 'exited on signal 6 \(core dumped\)' AS pattern, 'regex' AS match_type, 'i' AS flags, 'web_server_crash' AS error_type, 'high' AS risk_level, ARRAY['nginx']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Apache Threading Error' AS name, '检测 Apache 日志中出现线程优先级相关断言错误。' AS description, '__pthread_tpp_change_priority: Assertion `new_prio == -1 \|\| \(new_prio >= fifo_min_prio && new_prio <= fifo_max_prio\)' AS pattern, 'regex' AS match_type, 'i' AS flags, 'web_server_error' AS error_type, 'medium' AS risk_level, ARRAY['application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Apache Worker Process Segmentation Fault' AS name, '检测 Apache 工作进程因段错误崩溃。' AS description, 'exit signal Segmentation Fault' AS pattern, 'regex' AS match_type, 'i' AS flags, 'web_server_crash' AS error_type, 'high' AS risk_level, ARRAY['application']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'MSSQL Server Failed Logon' AS name, '检测客户端连接 MSSQL 服务器时的认证失败事件。' AS description, 'EventID.*18456|Login failed for user|18456' AS pattern, 'regex' AS match_type, 'i' AS flags, 'database_auth_failure' AS error_type, 'low' AS risk_level, ARRAY['application', 'system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'MSSQL Server Failed Logon From External Network' AS name, '检测来自外部网络 IP 对 MSSQL 服务器的认证失败。' AS description, 'EventID.*18456|Login failed for user.*CLIENT:' AS pattern, 'regex' AS match_type, 'i' AS flags, 'database_auth_failure' AS error_type, 'medium' AS risk_level, ARRAY['application', 'system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Failed MSExchange Transport Agent Installation' AS name, '检测 Microsoft Exchange Transport Agent 安装失败事件。' AS description, 'Install-TransportAgent' AS pattern, 'regex' AS match_type, 'i' AS flags, 'service_component_failure' AS error_type, 'high' AS risk_level, ARRAY['system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'AppX Package Deployment Failed Signing Requirements' AS name, '检测 AppX 包因不满足签名要求而部署失败。' AS description, '0x80073cff|EventID.*401' AS pattern, 'regex' AS match_type, 'i' AS flags, 'package_signing_failure' AS error_type, 'medium' AS risk_level, ARRAY['system']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Cisco BGP MD5 Authentication Failures' AS name, '检测 Cisco 设备的 BGP MD5 认证失败日志，当前系统尚未提供 network 来源，先暂缓导入。' AS description, ':179.*IP-TCP-3-BADAUTH|IP-TCP-3-BADAUTH.*:179' AS pattern, 'regex' AS match_type, 'i' AS flags, 'network_auth_failure' AS error_type, 'low' AS risk_level, ARRAY['network', 'cisco', 'bgp']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Cisco LDP MD5 Authentication Failures' AS name, '检测 Cisco 设备的 LDP MD5 认证失败日志，当前系统尚未提供 network 来源，先暂缓导入。' AS description, 'LDP.*(SOCKET_TCP_PACKET_MD5_AUTHEN_FAIL|TCPMD5AuthenFail)' AS pattern, 'regex' AS match_type, 'i' AS flags, 'network_auth_failure' AS error_type, 'low' AS risk_level, ARRAY['network', 'cisco', 'ldp']::text[] AS source_types, true AS enabled
    UNION ALL
    SELECT 'Huawei BGP MD5 Authentication Failures' AS name, '检测华为设备的 BGP MD5 认证失败日志，当前系统尚未提供 network 来源，先暂缓导入。' AS description, ':179.*BGP_AUTH_FAILED|BGP_AUTH_FAILED.*:179' AS pattern, 'regex' AS match_type, 'i' AS flags, 'network_auth_failure' AS error_type, 'low' AS risk_level, ARRAY['network', 'huawei', 'bgp']::text[] AS source_types, true AS enabled
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