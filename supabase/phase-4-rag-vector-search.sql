create extension if not exists vector;

alter table public.knowledge_base
  add column if not exists embedding vector(1536);

create index if not exists knowledge_base_embedding_idx
  on public.knowledge_base
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create or replace function public.match_knowledge_base(
  query_embedding vector(1536),
  match_count integer default 8
)
returns table (
  title text,
  category text,
  keywords text,
  symptom text,
  possible_cause text,
  solution text,
  source text,
  similarity double precision
)
language sql
stable
as $$
  select
    kb.title,
    kb.category,
    kb.keywords,
    kb.symptom,
    kb.possible_cause,
    kb.solution,
    kb.source,
    1 - (kb.embedding <=> query_embedding) as similarity
  from public.knowledge_base kb
  where kb.embedding is not null
  order by kb.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

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

create index if not exists historical_missed_cases_embedding_idx
  on public.historical_missed_cases
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create or replace function public.match_historical_missed_cases(
  query_embedding vector(1536),
  match_count integer default 8,
  source_type_filter text default null
)
returns table (
  title text,
  error_type text,
  source_type text,
  root_cause text,
  repair_suggestion text,
  source text,
  similarity double precision
)
language sql
stable
as $$
  select
    mc.title,
    mc.error_type,
    mc.source_type,
    mc.root_cause,
    mc.repair_suggestion,
    mc.source,
    1 - (mc.embedding <=> query_embedding) as similarity
  from public.historical_missed_cases mc
  where mc.embedding is not null
    and (source_type_filter is null or mc.source_type = source_type_filter)
  order by mc.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;
