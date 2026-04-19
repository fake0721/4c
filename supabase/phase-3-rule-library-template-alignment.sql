alter table public.detection_rules
  add column if not exists template_rule_id text,
  add column if not exists rule_category text not null default 'detection',
  add column if not exists sub_tags text[] not null default '{}',
  add column if not exists source text,
  add column if not exists scenario text,
  add column if not exists example_log text,
  add column if not exists notes text;

create index if not exists detection_rules_template_rule_id_idx
on public.detection_rules (template_rule_id);

update public.detection_rules
set rule_category = coalesce(nullif(rule_category, ''), 'detection')
where rule_category is null or rule_category = '';

update public.detection_rules
set sub_tags = coalesce(sub_tags, '{}'::text[])
where sub_tags is null;

update public.detection_rules
set source = coalesce(nullif(source, ''), '历史规则整理')
where source is null or source = '';

with normalized as (
  select
    id,
    lower(coalesce(error_type, '')) as legacy_error_type,
    case
      when lower(coalesce(error_type, '')) in ('database_error', 'database_concurrency_error', 'database_replication_error', 'database_session_termination', 'database_unavailable') then 'database_error'
      when lower(coalesce(error_type, '')) in ('timeout', 'database_lock_timeout') then 'timeout'
      when lower(coalesce(error_type, '')) in ('authentication_failure', 'network_auth_failure', 'database_auth_failure', 'permission_denied', 'request_rejected') then 'permission_error'
      when lower(coalesce(error_type, '')) in ('connection_refused', 'connection_reset', 'upstream_connection_error', 'dns_service_error', 'dns_error', 'ssl_error') then 'network_error'
      when lower(coalesce(error_type, '')) in ('resource_limit', 'database_disk_error', 'filesystem_error', 'memory_error', 'resource_busy') then 'resource_exhaustion'
      when lower(coalesce(error_type, '')) in ('package_signing_failure') then 'configuration_error'
      when lower(coalesce(error_type, '')) in (
        'framework_exception',
        'service_start_failure',
        'app_runtime_error',
        'http_5xx',
        'security_engine_crash',
        'security_service_error',
        'service_plugin_load_failure',
        'web_server_crash',
        'critical_process_crash',
        'critical_service_termination',
        'critical_service_unexpected_termination',
        'fatal_error',
        'firewall_service_error',
        'ftp_service_error',
        'process_crash',
        'rate_limit',
        'resilience_event',
        'retry_failure',
        'security_service_crash',
        'service_component_failure',
        'service_restart_loop',
        'service_termination_error',
        'ssh_service_error',
        'system_crash_dump',
        'system_update_error',
        'template_engine_exception',
        'upstream_unavailable',
        'web_server_error'
      ) then 'service_error'
      when lower(coalesce(error_type, '')) in ('exception', 'generic_error') then 'unknown_error'
      else 'unknown_error'
    end as normalized_error_type
  from public.detection_rules
)
update public.detection_rules as dr
set
  error_type = normalized.normalized_error_type,
  sub_tags = coalesce((
    select array_agg(distinct tag order by tag)
    from unnest(
      coalesce(dr.sub_tags, '{}'::text[])
      || case
        when normalized.legacy_error_type <> '' and normalized.legacy_error_type <> normalized.normalized_error_type
          then array[normalized.legacy_error_type]
        else '{}'::text[]
      end
    ) as tag
    where tag is not null and btrim(tag) <> ''
  ), '{}'::text[])
from normalized
where dr.id = normalized.id;
