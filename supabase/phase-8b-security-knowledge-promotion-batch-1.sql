with selected_candidates as (
  select
    c.id as candidate_id,
    c.title,
    c.keywords,
    c.log_excerpt,
    c.root_cause,
    c.solution,
    c.updated_at,
    c.verified,
    mapping.error_type,
    mapping.source_type,
    mapping.priority,
    mapping.promotion_notes
  from public.security_knowledge_candidates c
  join (
    values
      (51, 'resource_exhaustion', 'system', 70, '批次1晋升：中文高频资源耗尽案例'),
      (52, 'resource_exhaustion', 'system', 70, '批次1晋升：中文高频资源耗尽案例'),
      (54, 'resource_exhaustion', 'system', 70, '批次1晋升：中文高频资源耗尽案例'),
      (56, 'resource_exhaustion', 'system', 68, '批次1晋升：中文高频资源耗尽案例'),
      (57, 'timeout', 'system', 68, '批次1晋升：中文网络超时案例'),
      (58, 'network_error', 'system', 68, '批次1晋升：中文网络连通性案例'),
      (59, 'network_error', 'system', 72, '批次1晋升：中文网络连通性案例'),
      (60, 'network_error', 'system', 72, '批次1晋升：中文网络连通性案例'),
      (61, 'resource_exhaustion', 'application', 72, '批次1晋升：中文 JVM 异常案例'),
      (62, 'service_error', 'application', 68, '批次1晋升：中文 JVM 异常案例'),
      (63, 'resource_exhaustion', 'application', 72, '批次1晋升：中文数据库连接池案例'),
      (65, 'timeout', 'nginx', 70, '批次1晋升：中文网关超时案例'),
      (66, 'database_error', 'postgres', 70, '批次1晋升：中文数据库故障案例'),
      (67, 'database_error', 'postgres', 70, '批次1晋升：中文数据库故障案例'),
      (69, 'configuration_error', 'nginx', 74, '批次1晋升：中文配置异常案例')
  ) as mapping(candidate_id, error_type, source_type, priority, promotion_notes)
    on mapping.candidate_id = c.id
),
inserted_rows as (
  insert into public.knowledge_base (
    title,
    category,
    keywords,
    symptom,
    possible_cause,
    solution,
    source,
    updated_at,
    knowledge_layer,
    error_type,
    log_excerpt,
    root_cause,
    source_type,
    verified,
    cluster_key,
    priority
  )
  select
    sc.title,
    sc.error_type,
    sc.keywords,
    sc.log_excerpt,
    sc.root_cause,
    sc.solution,
    'security_candidate_promoted_batch_1',
    coalesce(sc.updated_at, now()),
    'exception_case',
    sc.error_type,
    sc.log_excerpt,
    sc.root_cause,
    sc.source_type,
    coalesce(sc.verified, true),
    'security_candidate_promoted_batch_1::' || sc.candidate_id::text,
    sc.priority
  from selected_candidates sc
  where not exists (
    select 1
    from public.knowledge_base kb
    where kb.cluster_key = 'security_candidate_promoted_batch_1::' || sc.candidate_id::text
  )
  returning cluster_key
)
update public.security_knowledge_candidates c
set
  mapped_error_type = sc.error_type,
  mapped_source_type = sc.source_type,
  target_knowledge_layer = 'exception_case',
  promotion_status = 'promoted',
  promotion_notes = sc.promotion_notes
from selected_candidates sc
where c.id = sc.candidate_id;
