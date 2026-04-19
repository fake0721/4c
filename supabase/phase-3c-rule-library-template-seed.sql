insert into public.detection_rules (
  template_rule_id,
  name,
  description,
  rule_category,
  pattern,
  match_type,
  flags,
  error_type,
  risk_level,
  source_types,
  sub_tags,
  source,
  scenario,
  example_log,
  enabled,
  notes
)
select * from (
  values
    ('RULE_KEY_001','关键词-通用Error异常','模板示例规则：通用 Error 入口。','detection','Error','keyword',null,'unknown_error','medium',array['application','system','custom']::text[],array['error','generic']::text[],'规则库模板示例','通用应用/系统日志','2025-03-01 10:20:11 ERROR service failed',true,'通用异常入口，建议后续结合上下文判定'),
    ('RULE_KEY_002','关键词-OOM内存溢出','模板示例规则：OOM 与堆内存溢出。','detection','OOM','keyword',null,'resource_exhaustion','high',array['application','system','custom']::text[],array['oom','memory']::text[],'规则库模板示例','Java应用日志','OOM: Java heap space',true,'直接影响服务稳定性'),
    ('RULE_KEY_003','关键词-通用Timeout超时','模板示例规则：超时相关关键词。','detection','Timeout','keyword',null,'timeout','medium',array['application','postgres','custom']::text[],array['timeout']::text[],'规则库模板示例','接口/微服务/数据库日志','Request Timeout while calling downstream service',true,'若能识别来源，可补 db_timeout 等标签'),
    ('RULE_KEY_004','关键词-连接拒绝','模板示例规则：连接被拒绝。','detection','Connection refused','keyword',null,'network_error','high',array['application','postgres','custom']::text[],array['connection_refused','db_or_service_call']::text[],'规则库模板示例','数据库/服务调用日志','java.net.ConnectException: Connection refused',true,'主类型只保留网络异常'),
    ('RULE_KEY_005','关键词-权限拒绝','模板示例规则：权限拒绝。','detection','Permission denied','keyword',null,'permission_error','medium',array['system','application','custom']::text[],array['permission']::text[],'规则库模板示例','系统/应用日志','Permission denied: /var/app/config',true,'适合和 401/403 一起统计'),
    ('RULE_KEY_006','关键词-通用Exception异常','模板示例规则：Exception 入口。','detection','Exception','keyword',null,'unknown_error','medium',array['application','custom']::text[],array['exception','runtime']::text[],'规则库模板示例','应用日志','Unhandled Exception occurred in request pipeline',true,'通用异常入口'),
    ('RULE_KEY_007','关键词-通用Failed失败','模板示例规则：失败类关键词。','detection','Failed','keyword',null,'service_error','medium',array['application','system','custom']::text[],array['failed']::text[],'规则库模板示例','服务/工具执行日志','Failed to initialize worker pool',true,'需结合上下文进一步细分'),
    ('RULE_KEY_008','关键词-致命Fatal异常','模板示例规则：Fatal 关键词。','detection','Fatal','keyword',null,'service_error','high',array['application','system','custom']::text[],array['fatal']::text[],'规则库模板示例','核心服务日志','Fatal error: service shutdown',true,'高优先级异常'),
    ('RULE_KEY_009','关键词-服务端口被占用','模板示例规则：端口占用。','detection','Address already in use','keyword',null,'service_error','high',array['system','application','custom']::text[],array['port_conflict']::text[],'规则库模板示例','服务启动日志','Bind failed: Address already in use',true,'典型启动故障'),
    ('RULE_KEY_010','关键词-磁盘空间不足','模板示例规则：磁盘空间不足。','detection','No space left on device','keyword',null,'resource_exhaustion','high',array['system','application','custom']::text[],array['disk_full']::text[],'规则库模板示例','服务器系统日志','write failed: No space left on device',true,'高风险资源问题'),
    ('RULE_REG_001','正则-HTTP5XX服务端错误','模板示例规则：HTTP 5XX。','detection','\m5\d{2}\M','regex',null,'service_error','high',array['nginx','application','custom']::text[],array['http_5xx','server_error']::text[],'规则库模板示例','Nginx/Apache/网关日志','GET /api/order 500 32ms',true,'如仅有状态码，建议结合请求上下文'),
    ('RULE_REG_002','正则-HTTP4XX客户端错误','模板示例规则：HTTP 4XX。','detection','\m4\d{2}\M','regex',null,'permission_error','low',array['nginx','application','custom']::text[],array['http_4xx','client_error']::text[],'规则库模板示例','Nginx/Apache/网关日志','POST /api/user 403 18ms',true,'若 403 大量激增，应由时序规则提级'),
    ('RULE_REG_003','正则-IP端口提取','模板示例规则：提取 IP:端口。','extraction','\m(?:\d{1,3}\.){3}\d{1,3}:\d{1,5}\M','regex',null,'unknown_error','low',array['network','application','custom']::text[],array['ip_port','extraction']::text[],'规则库模板示例','网络/服务调用日志','connect to 10.2.3.4:5432 failed',true,'辅助提取，不直接代表异常'),
    ('RULE_REG_004','正则-数据库错误码','模板示例规则：数据库错误码。','detection','ERROR\s*\d{3,5}','regex',null,'database_error','medium',array['postgres','application','custom']::text[],array['db_error_code']::text[],'规则库模板示例','MySQL/Oracle/PostgreSQL 日志','ERROR 1045: Access denied for user',true,'结合 DB 上下文效果更好'),
    ('RULE_REG_005','正则-Java异常根因','模板示例规则：Java 根因异常。','detection','Caused by:\s*[\w.$]+(?:Exception|Error)','regex',null,'service_error','medium',array['application','custom']::text[],array['java_root_cause']::text[],'规则库模板示例','Java应用日志','Caused by: java.lang.NullPointerException',true,'用于定位根因'),
    ('RULE_REG_006','正则-TraceId链路标识','模板示例规则：提取 TraceId。','extraction','TraceId[:=]\s*[A-Za-z0-9-]{16,32}','regex',null,'unknown_error','low',array['application','nginx','custom']::text[],array['trace_id','linking']::text[],'规则库模板示例','微服务/网关日志','TraceId=7f8c2c9a-1234-abcd-5678-ef9012345678',true,'仅提取，不直接判异常'),
    ('RULE_STA_001','时序-1分钟Timeout激增','模板示例规则：超时激增阈值。','aggregation','1分钟内 Timeout 相关日志条数 >= 10','threshold',null,'timeout','high',array['application','postgres','custom']::text[],array['timeout_spike','burst']::text[],'规则库模板示例','接口/微服务/数据库调用日志','1分钟窗口内 Timeout 匹配数达到 12 次',true,'依赖 RULE_KEY_003'),
    ('RULE_STA_002','时序-30秒内重试超限','模板示例规则：请求重试突增。','aggregation','30秒内同一 RequestId/TraceId 的重试次数 >= 5','threshold',null,'service_error','medium',array['application','custom']::text[],array['retry_burst','request_repeated']::text[],'规则库模板示例','服务调用/接口日志','RequestId=abc retry=5 within 30s',true,'也可在 sub_tags 中补 network_related'),
    ('RULE_STA_003','统计-CPU占用持续高位','模板示例规则：CPU 持续高位。','aggregation','5分钟内连续检测到 CPU >= 90%','threshold',null,'resource_exhaustion','high',array['system','custom']::text[],array['cpu_high']::text[],'规则库模板示例','服务器监控/资源日志','CPU usage=96% maintained for 5m',true,'适合搭配资源告警'),
    ('RULE_WEAK_001','弱异常-服务降级/高延迟','模板示例规则：降级与高延迟弱信号。','weak_signal','Degraded / High latency / Slow response','keyword',null,'timeout','low',array['application','nginx','custom']::text[],array['degraded_service','latency']::text[],'规则库模板示例','微服务/接口日志','Service degraded due to high latency',true,'弱信号，建议结合统计规则或上下文二次判断'),
    ('RULE_CFG_001','配置异常-环境变量缺失','补充规则：环境变量缺失。','detection','Environment variable not set','keyword',null,'configuration_error','high',array['application','system','custom']::text[],array['env_missing','configuration']::text[],'异常分类补充','应用启动/系统日志','Environment variable not set: DATABASE_URL',true,'补齐配置异常大类的直接检测规则'),
    ('RULE_CFG_002','配置异常-配置项缺失','补充规则：必填配置缺失。','detection','Missing required property','keyword',null,'configuration_error','high',array['application','custom']::text[],array['missing_property','configuration']::text[],'异常分类补充','应用配置/启动日志','Missing required property: spring.datasource.url',true,'补齐配置异常大类的直接检测规则'),
    ('RULE_CFG_003','配置异常-配置解析失败','补充规则：配置解析失败。','detection','Config parse error|Invalid configuration|YAML parse exception','regex','i','configuration_error','high',array['application','system','custom']::text[],array['config_parse_error','invalid_configuration']::text[],'异常分类补充','配置文件解析日志','YAML parse exception near line 18',true,'覆盖配置格式错误和非法配置值')
) as v(template_rule_id,name,description,rule_category,pattern,match_type,flags,error_type,risk_level,source_types,sub_tags,source,scenario,example_log,enabled,notes)
where not exists (
  select 1
  from public.detection_rules dr
  where dr.template_rule_id = v.template_rule_id
     or (
       lower(dr.name) = lower(v.name)
       and lower(dr.pattern) = lower(v.pattern)
       and dr.rule_category = v.rule_category
     )
);
