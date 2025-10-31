-- Run this in Supabase SQL Editor

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  created_at timestamp with time zone default now()
);

-- If the table already exists from a previous run, ensure email column exists
alter table public.profiles add column if not exists email text;
create index if not exists profiles_email_idx on public.profiles (email);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  image text,
  tags text[] default '{}',
  ingredients jsonb default '[]',
  steps jsonb default '[]',
  nutrition jsonb,
  calories integer,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.recipes enable row level security;

-- Profiles policies
create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_self_upsert" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

-- Recipes policies
create policy "recipes_owner_crud" on public.recipes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "recipes_read_public" on public.recipes
  for select using (true);

-- Storage: create a bucket named 'recipe-images' (do this in Storage UI)
-- Then add policies to allow authenticated users to upload and read

-- Auto-create a profile row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email
  )
  on conflict (id) do update set name = excluded.name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();


