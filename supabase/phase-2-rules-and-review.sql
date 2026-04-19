create table if not exists public.detection_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  pattern text not null,
  match_type text not null default 'keyword',
  flags text,
  error_type text not null,
  risk_level text not null default 'medium',
  source_types text[] default '{}',
  enabled boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rule_candidates (
  id uuid primary key default gen_random_uuid(),
  source_log_error_id uuid references public.log_errors(id) on delete set null,
  source_log_id uuid references public.logs(id) on delete set null,
  raw_text text not null,
  suggested_pattern text not null,
  suggested_match_type text not null default 'keyword',
  suggested_error_type text,
  suggested_risk_level text,
  source_type text,
  occurrence_count integer not null default 1,
  status text not null default 'pending',
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.review_cases (
  id uuid primary key default gen_random_uuid(),
  log_error_id uuid references public.log_errors(id) on delete cascade,
  log_id uuid references public.logs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reviewer_id uuid references auth.users(id) on delete set null,
  final_error_type text,
  final_cause text,
  final_risk_level text,
  resolution text,
  should_create_rule boolean not null default false,
  should_add_to_kb boolean not null default false,
  review_status text not null default 'pending',
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.detection_rules enable row level security;
alter table public.rule_candidates enable row level security;
alter table public.review_cases enable row level security;

drop policy if exists "detection_rules_select_authenticated" on public.detection_rules;
drop policy if exists "detection_rules_insert_authenticated" on public.detection_rules;
drop policy if exists "detection_rules_update_authenticated" on public.detection_rules;

create policy "detection_rules_select_authenticated"
on public.detection_rules
for select
to authenticated
using (enabled = true or auth.uid() = created_by);

create policy "detection_rules_insert_authenticated"
on public.detection_rules
for insert
to authenticated
with check (auth.uid() = created_by);

create policy "detection_rules_update_authenticated"
on public.detection_rules
for update
to authenticated
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

drop policy if exists "rule_candidates_select_own" on public.rule_candidates;
drop policy if exists "rule_candidates_insert_own" on public.rule_candidates;
drop policy if exists "rule_candidates_update_own" on public.rule_candidates;

create policy "rule_candidates_select_own"
on public.rule_candidates
for select
to authenticated
using (auth.uid() = created_by or auth.uid() = reviewed_by);

create policy "rule_candidates_insert_own"
on public.rule_candidates
for insert
to authenticated
with check (auth.uid() = created_by);

create policy "rule_candidates_update_own"
on public.rule_candidates
for update
to authenticated
using (auth.uid() = created_by or auth.uid() = reviewed_by)
with check (auth.uid() = created_by or auth.uid() = reviewed_by);

drop policy if exists "review_cases_select_own" on public.review_cases;
drop policy if exists "review_cases_insert_own" on public.review_cases;
drop policy if exists "review_cases_update_own" on public.review_cases;

create policy "review_cases_select_own"
on public.review_cases
for select
to authenticated
using (auth.uid() = user_id or auth.uid() = reviewer_id);

create policy "review_cases_insert_own"
on public.review_cases
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "review_cases_update_own"
on public.review_cases
for update
to authenticated
using (auth.uid() = user_id or auth.uid() = reviewer_id)
with check (auth.uid() = user_id or auth.uid() = reviewer_id);
