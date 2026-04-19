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
      (43, 'configuration_error', 'custom', 72, '批次2晋升：中间件未授权暴露案例'),
      (44, 'configuration_error', 'custom', 72, '批次2晋升：中间件未授权暴露案例'),
      (45, 'configuration_error', 'custom', 72, '批次2晋升：中间件未授权暴露案例'),
      (53, 'resource_exhaustion', 'system', 70, '批次2晋升：中文运行时资源异常别名'),
      (55, 'resource_exhaustion', 'system', 68, '批次2晋升：中文运行时资源异常别名'),
      (64, 'service_error', 'nginx', 70, '批次2晋升：中文网关错误别名'),
      (169, 'service_error', 'system', 68, '批次2晋升：系统磁盘与文件系统故障案例'),
      (170, 'service_error', 'system', 68, '批次2晋升：系统磁盘与文件系统故障案例'),
      (177, 'database_error', 'postgres', 70, '批次2晋升：数据库连接数耗尽案例'),
      (185, 'service_error', 'nginx', 66, '批次2晋升：通用HTTP 500故障案例')
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
    'security_candidate_promoted_batch_2',
    coalesce(sc.updated_at, now()),
    'exception_case',
    sc.error_type,
    sc.log_excerpt,
    sc.root_cause,
    sc.source_type,
    coalesce(sc.verified, true),
    'security_candidate_promoted_batch_2::' || sc.candidate_id::text,
    sc.priority
  from selected_candidates sc
  where not exists (
    select 1
    from public.knowledge_base kb
    where kb.cluster_key = 'security_candidate_promoted_batch_2::' || sc.candidate_id::text
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
