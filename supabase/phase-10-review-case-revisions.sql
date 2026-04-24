create table if not exists public.review_case_revisions (
  id uuid primary key default gen_random_uuid(),
  review_case_id uuid not null references public.review_cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  before_snapshot jsonb not null,
  after_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists review_case_revisions_review_case_id_created_at_idx
on public.review_case_revisions (review_case_id, created_at desc);

alter table public.review_case_revisions enable row level security;

drop policy if exists "review_case_revisions_select_own" on public.review_case_revisions;
drop policy if exists "review_case_revisions_insert_own" on public.review_case_revisions;

create policy "review_case_revisions_select_own"
on public.review_case_revisions
for select
to authenticated
using (auth.uid() = user_id);

create policy "review_case_revisions_insert_own"
on public.review_case_revisions
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.review_cases
    where public.review_cases.id = review_case_revisions.review_case_id
      and public.review_cases.user_id = auth.uid()
  )
);
