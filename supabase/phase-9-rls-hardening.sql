-- Phase 9: RLS hardening for knowledge base and rule library operations.
-- Goal:
-- 1) Keep knowledge base readable for authenticated users.
-- 2) Restrict knowledge base write operations to admin-like roles only.
-- 3) Align detection_rules with API behavior by adding delete policy for owner.

-- ---------- detection_rules ----------
alter table public.detection_rules enable row level security;

drop policy if exists "detection_rules_delete_authenticated" on public.detection_rules;

create policy "detection_rules_delete_authenticated"
on public.detection_rules
for delete
to authenticated
using (auth.uid() = created_by);

-- ---------- knowledge_base ----------
alter table public.knowledge_base enable row level security;

drop policy if exists "knowledge_base_select_authenticated" on public.knowledge_base;
drop policy if exists "knowledge_base_insert_authenticated" on public.knowledge_base;
drop policy if exists "knowledge_base_update_authenticated" on public.knowledge_base;
drop policy if exists "knowledge_base_insert_admin" on public.knowledge_base;
drop policy if exists "knowledge_base_update_admin" on public.knowledge_base;
drop policy if exists "knowledge_base_delete_admin" on public.knowledge_base;

create policy "knowledge_base_select_authenticated"
on public.knowledge_base
for select
to authenticated
using (true);

create policy "knowledge_base_insert_admin"
on public.knowledge_base
for insert
to authenticated
with check (
  coalesce(
    nullif(lower(auth.jwt() -> 'app_metadata' ->> 'role'), ''),
    nullif(lower(auth.jwt() -> 'user_metadata' ->> 'role'), ''),
    nullif(lower(auth.jwt() -> 'app_metadata' ->> 'user_role'), ''),
    nullif(lower(auth.jwt() -> 'user_metadata' ->> 'user_role'), '')
  ) in ('admin', 'owner', 'super_admin')
);

create policy "knowledge_base_update_admin"
on public.knowledge_base
for update
to authenticated
using (
  coalesce(
    nullif(lower(auth.jwt() -> 'app_metadata' ->> 'role'), ''),
    nullif(lower(auth.jwt() -> 'user_metadata' ->> 'role'), ''),
    nullif(lower(auth.jwt() -> 'app_metadata' ->> 'user_role'), ''),
    nullif(lower(auth.jwt() -> 'user_metadata' ->> 'user_role'), '')
  ) in ('admin', 'owner', 'super_admin')
)
with check (
  coalesce(
    nullif(lower(auth.jwt() -> 'app_metadata' ->> 'role'), ''),
    nullif(lower(auth.jwt() -> 'user_metadata' ->> 'role'), ''),
    nullif(lower(auth.jwt() -> 'app_metadata' ->> 'user_role'), ''),
    nullif(lower(auth.jwt() -> 'user_metadata' ->> 'user_role'), '')
  ) in ('admin', 'owner', 'super_admin')
);

create policy "knowledge_base_delete_admin"
on public.knowledge_base
for delete
to authenticated
using (
  coalesce(
    nullif(lower(auth.jwt() -> 'app_metadata' ->> 'role'), ''),
    nullif(lower(auth.jwt() -> 'user_metadata' ->> 'role'), ''),
    nullif(lower(auth.jwt() -> 'app_metadata' ->> 'user_role'), ''),
    nullif(lower(auth.jwt() -> 'user_metadata' ->> 'user_role'), '')
  ) in ('admin', 'owner', 'super_admin')
);
