alter table public.profiles
  add column if not exists username text,
  add column if not exists avatar_url text,
  add column if not exists bio text;

update public.profiles
set username = coalesce(username, display_name)
where username is null
  and display_name is not null;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null;