alter table public.knowledge_base enable row level security;

drop policy if exists "knowledge_base_insert_authenticated" on public.knowledge_base;
drop policy if exists "knowledge_base_update_authenticated" on public.knowledge_base;

create policy "knowledge_base_insert_authenticated"
on public.knowledge_base
for insert
to authenticated
with check (true);

create policy "knowledge_base_update_authenticated"
on public.knowledge_base
for update
to authenticated
using (true)
with check (true);
