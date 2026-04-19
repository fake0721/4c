update public.detection_rules as dr
set
  error_type = 'resource_exhaustion',
  sub_tags = coalesce((
    select array_agg(distinct tag order by tag)
    from unnest(coalesce(dr.sub_tags, '{}'::text[]) || array['oom']) as tag
    where tag is not null and btrim(tag) <> ''
  ), '{}'::text[])
where
  dr.name ilike '%out of memory%'
  or dr.name ilike '%cannot allocate memory%'
  or dr.pattern ilike '%out of memory%'
  or dr.pattern ilike '%oom-killer%'
  or dr.pattern ilike '%cannot allocate memory%';

update public.detection_rules as dr
set
  error_type = 'resource_exhaustion',
  sub_tags = coalesce((
    select array_agg(distinct tag order by tag)
    from unnest(coalesce(dr.sub_tags, '{}'::text[]) || array['disk_full']) as tag
    where tag is not null and btrim(tag) <> ''
  ), '{}'::text[])
where
  dr.name ilike '%disk full%'
  or dr.pattern ilike '%no space left on device%'
  or dr.pattern ilike '%disk full%';

update public.detection_rules as dr
set
  error_type = 'permission_error',
  sub_tags = coalesce((
    select array_agg(distinct tag order by tag)
    from unnest(coalesce(dr.sub_tags, '{}'::text[]) || array['authentication_failure']) as tag
    where tag is not null and btrim(tag) <> ''
  ), '{}'::text[])
where
  dr.name ilike '%authentication%'
  or dr.pattern ilike '%authentication failed%'
  or dr.pattern ilike '%invalid token%'
  or dr.pattern ilike '%unauthorized%';

update public.detection_rules as dr
set
  error_type = 'service_error',
  sub_tags = coalesce((
    select array_agg(distinct tag order by tag)
    from unnest(coalesce(dr.sub_tags, '{}'::text[]) || array['circuit_breaker_open']) as tag
    where tag is not null and btrim(tag) <> ''
  ), '{}'::text[])
where
  dr.name ilike '%circuit breaker%'
  or dr.pattern ilike '%circuit breaker%'
  or dr.pattern ilike '%fallback executed%'
  or dr.pattern ilike '%bulkhead full%';
