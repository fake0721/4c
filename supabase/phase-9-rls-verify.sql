-- Phase 9 verification: confirm RLS hardening is in effect.
-- Run this AFTER phase-9-rls-hardening.sql in Supabase SQL Editor.
-- If any required policy is missing, this script raises an exception.

-- 1) Quick policy overview.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('knowledge_base', 'detection_rules')
order by tablename, policyname;

-- 2) Assert required knowledge_base policies exist.
do $$
declare
  required_count integer;
  found_count integer;
begin
  required_count := 4;

  select count(*)
    into found_count
  from pg_policies
  where schemaname = 'public'
    and tablename = 'knowledge_base'
    and policyname in (
      'knowledge_base_select_authenticated',
      'knowledge_base_insert_admin',
      'knowledge_base_update_admin',
      'knowledge_base_delete_admin'
    );

  if found_count <> required_count then
    raise exception 'knowledge_base required policy count mismatch: expected %, got %', required_count, found_count;
  end if;
end $$;

-- 3) Assert old permissive write policies are removed.
do $$
declare
  legacy_count integer;
begin
  select count(*)
    into legacy_count
  from pg_policies
  where schemaname = 'public'
    and tablename = 'knowledge_base'
    and policyname in (
      'knowledge_base_insert_authenticated',
      'knowledge_base_update_authenticated'
    );

  if legacy_count > 0 then
    raise exception 'legacy permissive knowledge_base write policies still exist: %', legacy_count;
  end if;
end $$;

-- 4) Assert detection_rules delete policy exists.
do $$
declare
  found_count integer;
begin
  select count(*)
    into found_count
  from pg_policies
  where schemaname = 'public'
    and tablename = 'detection_rules'
    and policyname = 'detection_rules_delete_authenticated';

  if found_count <> 1 then
    raise exception 'missing detection_rules_delete_authenticated policy';
  end if;
end $$;

-- 5) Optional sanity checks: RLS enabled flags.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('knowledge_base', 'detection_rules');
