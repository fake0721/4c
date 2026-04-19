create table if not exists public.security_knowledge_candidates (
  id bigserial primary key,
  title text not null,
  raw_error_type text,
  raw_sub_type text,
  keywords text,
  log_excerpt text,
  root_cause text,
  solution text,
  raw_severity text,
  raw_source_type text,
  verified boolean not null default true,
  updated_at timestamptz not null default now(),
  mapped_error_type text,
  mapped_source_type text,
  mapping_confidence text not null default 'low',
  target_knowledge_layer text not null default 'security_candidate',
  promotion_status text not null default 'staged',
  promotion_notes text,
  import_source text,
  import_batch text,
  cluster_key text,
  created_at timestamptz not null default now()
);

create unique index if not exists security_knowledge_candidates_cluster_key_uidx
  on public.security_knowledge_candidates (cluster_key)
  where cluster_key is not null;

create index if not exists security_knowledge_candidates_mapped_error_type_idx
  on public.security_knowledge_candidates (mapped_error_type);

create index if not exists security_knowledge_candidates_mapped_source_type_idx
  on public.security_knowledge_candidates (mapped_source_type);

create index if not exists security_knowledge_candidates_promotion_status_idx
  on public.security_knowledge_candidates (promotion_status);

create index if not exists security_knowledge_candidates_import_batch_idx
  on public.security_knowledge_candidates (import_batch);

alter table public.security_knowledge_candidates enable row level security;

drop policy if exists "security_knowledge_candidates_select_authenticated" on public.security_knowledge_candidates;
drop policy if exists "security_knowledge_candidates_insert_authenticated" on public.security_knowledge_candidates;
drop policy if exists "security_knowledge_candidates_update_authenticated" on public.security_knowledge_candidates;

create policy "security_knowledge_candidates_select_authenticated"
on public.security_knowledge_candidates
for select
to authenticated
using (true);

create policy "security_knowledge_candidates_insert_authenticated"
on public.security_knowledge_candidates
for insert
to authenticated
with check (true);

create policy "security_knowledge_candidates_update_authenticated"
on public.security_knowledge_candidates
for update
to authenticated
using (true)
with check (true);
