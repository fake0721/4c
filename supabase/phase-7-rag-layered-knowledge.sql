create extension if not exists vector;

alter table public.knowledge_base
  add column if not exists knowledge_layer text not null default 'exception_case',
  add column if not exists error_type text,
  add column if not exists log_excerpt text,
  add column if not exists root_cause text,
  add column if not exists source_type text,
  add column if not exists verified boolean not null default true,
  add column if not exists archived_at timestamptz,
  add column if not exists cluster_key text,
  add column if not exists priority integer not null default 60;

update public.knowledge_base
set
  knowledge_layer = coalesce(nullif(knowledge_layer, ''), 'exception_case'),
  log_excerpt = coalesce(log_excerpt, symptom),
  root_cause = coalesce(root_cause, possible_cause),
  source_type = coalesce(
    nullif(source_type, ''),
    case
      when lower(concat_ws(' ', title, category, keywords, symptom, possible_cause, solution, source)) similar to '%(nginx|apache|gateway|upstream|http)%' then 'nginx'
      when lower(concat_ws(' ', title, category, keywords, symptom, possible_cause, solution, source)) similar to '%(postgres|postgresql|mysql|oracle|database|sql)%' then 'postgres'
      when lower(concat_ws(' ', title, category, keywords, symptom, possible_cause, solution, source)) similar to '%(spring|django|java|python|node|application|runtime)%' then 'application'
      when lower(concat_ws(' ', title, category, keywords, symptom, possible_cause, solution, source)) similar to '%(system|linux|kernel|service|ssh|dns|firewall)%' then 'system'
      else 'custom'
    end
  ),
  error_type = coalesce(
    nullif(error_type, ''),
    case
      when lower(concat_ws(' ', title, category, keywords, symptom, possible_cause, solution)) similar to '%(timeout|timed out|gateway timeout|read timeout|connect timeout)%' then 'timeout'
      when lower(concat_ws(' ', title, category, keywords, symptom, possible_cause, solution)) similar to '%(permission|unauthorized|forbidden|token|auth)%' then 'permission_error'
      when lower(concat_ws(' ', title, category, keywords, symptom, possible_cause, solution)) similar to '%(database|postgres|mysql|oracle|sql|deadlock|transaction)%' then 'database_error'
      when lower(concat_ws(' ', title, category, keywords, symptom, possible_cause, solution)) similar to '%(connection refused|connection reset|dns|host unreachable|ssl|network|route)%' then 'network_error'
      when lower(concat_ws(' ', title, category, keywords, symptom, possible_cause, solution)) similar to '%(out of memory|oom|disk full|no space left|open files|resource|cpu)%' then 'resource_exhaustion'
      when lower(concat_ws(' ', title, category, keywords, symptom, possible_cause, solution)) similar to '%(config|configuration|yaml|property|env)%' then 'configuration_error'
      when lower(concat_ws(' ', title, category, keywords, symptom, possible_cause, solution)) similar to '%(service unavailable|crash|fatal|panic|process|restart|component|framework|runtime)%' then 'service_error'
      else 'unknown_error'
    end
  ),
  cluster_key = coalesce(cluster_key, md5(lower(concat_ws('::', title, coalesce(error_type, ''), coalesce(source_type, ''))))),
  updated_at = coalesce(updated_at, now());

create index if not exists knowledge_base_error_type_idx on public.knowledge_base (error_type);
create index if not exists knowledge_base_source_type_idx on public.knowledge_base (source_type);
create index if not exists knowledge_base_verified_idx on public.knowledge_base (verified);
create index if not exists knowledge_base_archived_at_idx on public.knowledge_base (archived_at);
create index if not exists knowledge_base_cluster_key_idx on public.knowledge_base (cluster_key);
create index if not exists knowledge_base_embedding_idx
  on public.knowledge_base
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create table if not exists public.historical_missed_cases (
  id bigserial primary key,
  title text not null,
  error_type text,
  source_type text,
  symptom text,
  root_cause text,
  repair_suggestion text,
  source text,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

alter table public.historical_missed_cases
  add column if not exists keywords text,
  add column if not exists log_excerpt text,
  add column if not exists solution text,
  add column if not exists verified boolean not null default true,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists archived_at timestamptz,
  add column if not exists cluster_key text,
  add column if not exists priority integer not null default 120;

update public.historical_missed_cases
set
  keywords = coalesce(keywords, error_type),
  log_excerpt = coalesce(log_excerpt, symptom),
  solution = coalesce(solution, repair_suggestion),
  verified = coalesce(verified, true),
  updated_at = coalesce(updated_at, created_at, now()),
  cluster_key = coalesce(cluster_key, md5(lower(concat_ws('::', title, coalesce(error_type, ''), coalesce(source_type, ''), coalesce(root_cause, '')))));

create unique index if not exists historical_missed_cases_cluster_key_uidx
  on public.historical_missed_cases (cluster_key)
  where cluster_key is not null;
create index if not exists historical_missed_cases_error_type_idx on public.historical_missed_cases (error_type);
create index if not exists historical_missed_cases_source_type_idx on public.historical_missed_cases (source_type);
create index if not exists historical_missed_cases_verified_idx on public.historical_missed_cases (verified);
create index if not exists historical_missed_cases_archived_at_idx on public.historical_missed_cases (archived_at);
create index if not exists historical_missed_cases_embedding_idx
  on public.historical_missed_cases
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

alter table public.historical_missed_cases enable row level security;
drop policy if exists "historical_missed_cases_select_authenticated" on public.historical_missed_cases;
drop policy if exists "historical_missed_cases_insert_authenticated" on public.historical_missed_cases;
drop policy if exists "historical_missed_cases_update_authenticated" on public.historical_missed_cases;
create policy "historical_missed_cases_select_authenticated"
on public.historical_missed_cases
for select
to authenticated
using (true);
create policy "historical_missed_cases_insert_authenticated"
on public.historical_missed_cases
for insert
to authenticated
with check (true);
create policy "historical_missed_cases_update_authenticated"
on public.historical_missed_cases
for update
to authenticated
using (true)
with check (true);

create table if not exists public.ops_experience_library (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  error_type text,
  keywords text,
  log_excerpt text,
  root_cause text,
  solution text,
  source_type text,
  verified boolean not null default true,
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  cluster_key text,
  priority integer not null default 40,
  source_label text,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create unique index if not exists ops_experience_library_cluster_key_uidx
  on public.ops_experience_library (cluster_key)
  where cluster_key is not null;
create index if not exists ops_experience_library_error_type_idx on public.ops_experience_library (error_type);
create index if not exists ops_experience_library_source_type_idx on public.ops_experience_library (source_type);
create index if not exists ops_experience_library_verified_idx on public.ops_experience_library (verified);
create index if not exists ops_experience_library_archived_at_idx on public.ops_experience_library (archived_at);
create index if not exists ops_experience_library_embedding_idx
  on public.ops_experience_library
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

alter table public.ops_experience_library enable row level security;
drop policy if exists "ops_experience_library_select_authenticated" on public.ops_experience_library;
drop policy if exists "ops_experience_library_insert_authenticated" on public.ops_experience_library;
drop policy if exists "ops_experience_library_update_authenticated" on public.ops_experience_library;
create policy "ops_experience_library_select_authenticated"
on public.ops_experience_library
for select
to authenticated
using (true);
create policy "ops_experience_library_insert_authenticated"
on public.ops_experience_library
for insert
to authenticated
with check (true);
create policy "ops_experience_library_update_authenticated"
on public.ops_experience_library
for update
to authenticated
using (true)
with check (true);

insert into public.ops_experience_library (
  title,
  error_type,
  keywords,
  log_excerpt,
  root_cause,
  solution,
  source_type,
  verified,
  updated_at,
  cluster_key,
  priority,
  source_label
)
select * from (
  values
    (
      '运维经验-Timeout排查路径',
      'timeout',
      'timeout,read timeout,connect timeout,gateway timeout,db_timeout',
      'Request Timeout while calling downstream service',
      '超时问题通常由下游依赖抖动、线程池阻塞、连接池耗尽或慢查询引起。',
      '先确认请求链路与耗时分布，再检查线程池、连接池、数据库慢查询和下游可用性；必要时对 timeout 来源做子标签细分。',
      'application',
      true,
      now(),
      'ops::timeout::application::troubleshooting',
      45,
      '运维经验库'
    ),
    (
      '运维经验-连接拒绝排查路径',
      'network_error',
      'connection refused,port unavailable,db_or_service_call,upstream unavailable',
      'java.net.ConnectException: Connection refused',
      '连接拒绝通常意味着目标服务未监听、端口被防火墙拦截、容器未就绪或服务注册信息失效。',
      '优先确认目标端口监听状态、服务实例健康、网络策略和服务发现配置；若是数据库连接，再检查白名单和连接上限。',
      'custom',
      true,
      now(),
      'ops::network_error::custom::connection_refused',
      45,
      '运维经验库'
    ),
    (
      '运维经验-磁盘与文件句柄耗尽处置',
      'resource_exhaustion',
      'disk_full,no space left,on device,too many open files,resource',
      'write failed: No space left on device',
      '资源耗尽通常由磁盘占满、日志未轮转、句柄泄漏或突发流量引起。',
      '先止损清理空间和句柄，再定位增长来源；检查日志轮转、临时文件、core dump 和长期未释放连接。',
      'system',
      true,
      now(),
      'ops::resource_exhaustion::system::disk_and_fd',
      45,
      '运维经验库'
    ),
    (
      '运维经验-配置缺失与解析失败排查',
      'configuration_error',
      'environment variable missing,invalid configuration,config parse error,yaml parse exception',
      'Environment variable not set: DATABASE_URL',
      '配置异常通常来自环境变量缺失、配置中心未下发、YAML/JSON 格式错误或版本不兼容。',
      '对照部署清单逐项检查必填配置，确认环境变量、配置文件和模板版本；必要时回滚最近一次配置变更。',
      'application',
      true,
      now(),
      'ops::configuration_error::application::config_validation',
      45,
      '运维经验库'
    ),
    (
      '运维经验-认证失败排查',
      'permission_error',
      'authentication failed,invalid token,401,403,permission denied',
      '401 Unauthorized / Permission denied',
      '权限异常常见于凭证失效、权限变更未同步、Token 过期或访问控制策略误配。',
      '先确认账号、Token、密钥和权限策略是否变化，再核对目标资源 ACL、鉴权中间件和时间同步。',
      'application',
      true,
      now(),
      'ops::permission_error::application::auth_failure',
      45,
      '运维经验库'
    )
) as v(title,error_type,keywords,log_excerpt,root_cause,solution,source_type,verified,updated_at,cluster_key,priority,source_label)
where not exists (
  select 1 from public.ops_experience_library existing where existing.cluster_key = v.cluster_key
);

create or replace view public.rag_knowledge_entries as
  select
    'exception_case'::text as knowledge_layer,
    'knowledge_base'::text as source_table,
    kb.id::text as source_id,
    kb.title,
    kb.error_type,
    kb.keywords,
    kb.log_excerpt,
    kb.root_cause,
    kb.solution,
    kb.source_type,
    kb.verified,
    kb.updated_at,
    kb.source as source_label,
    kb.cluster_key,
    kb.priority,
    kb.embedding
  from public.knowledge_base kb
  where kb.archived_at is null
  union all
  select
    'historical_missed'::text as knowledge_layer,
    'historical_missed_cases'::text as source_table,
    mc.id::text as source_id,
    mc.title,
    mc.error_type,
    mc.keywords,
    mc.log_excerpt,
    mc.root_cause,
    mc.solution,
    mc.source_type,
    mc.verified,
    mc.updated_at,
    mc.source as source_label,
    mc.cluster_key,
    mc.priority,
    mc.embedding
  from public.historical_missed_cases mc
  where mc.archived_at is null
  union all
  select
    'ops_experience'::text as knowledge_layer,
    'ops_experience_library'::text as source_table,
    op.id::text as source_id,
    op.title,
    op.error_type,
    op.keywords,
    op.log_excerpt,
    op.root_cause,
    op.solution,
    op.source_type,
    op.verified,
    op.updated_at,
    op.source_label,
    op.cluster_key,
    op.priority,
    op.embedding
  from public.ops_experience_library op
  where op.archived_at is null;

create or replace function public.match_rag_knowledge_entries(
  query_embedding vector(1536),
  match_count integer default 24,
  knowledge_layers text[] default null,
  source_type_filter text default null,
  error_type_filter text default null,
  verified_only boolean default true
)
returns table (
  knowledge_layer text,
  source_table text,
  source_id text,
  title text,
  error_type text,
  keywords text,
  log_excerpt text,
  root_cause text,
  solution text,
  source_type text,
  verified boolean,
  updated_at timestamptz,
  source_label text,
  cluster_key text,
  priority integer,
  similarity double precision
)
language sql
stable
as $$
  select
    entries.knowledge_layer,
    entries.source_table,
    entries.source_id,
    entries.title,
    entries.error_type,
    entries.keywords,
    entries.log_excerpt,
    entries.root_cause,
    entries.solution,
    entries.source_type,
    entries.verified,
    entries.updated_at,
    entries.source_label,
    entries.cluster_key,
    entries.priority,
    1 - (entries.embedding <=> query_embedding) as similarity
  from public.rag_knowledge_entries entries
  where entries.embedding is not null
    and (knowledge_layers is null or entries.knowledge_layer = any(knowledge_layers))
    and (source_type_filter is null or entries.source_type = source_type_filter)
    and (error_type_filter is null or entries.error_type = error_type_filter)
    and (not verified_only or entries.verified = true)
  order by entries.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;
