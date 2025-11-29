-- 1. Create Trigger to automatically create a profile when a user signs up
-- This is CRITICAL for the foreign key constraints to work.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

-- Drop the trigger if it exists to avoid errors on re-run
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Enable Row Level Security (RLS) on all tables
alter table profiles enable row level security;
alter table projects enable row level security;
alter table generations enable row level security;

-- 3. Create Policies

-- PROFILES
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- PROJECTS
create policy "Users can view own projects."
  on projects for select
  using ( auth.uid() = user_id );

create policy "Users can insert own projects."
  on projects for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete own projects."
  on projects for delete
  using ( auth.uid() = user_id );

-- GENERATIONS
create policy "Users can view own generations."
  on generations for select
  using ( auth.uid() = user_id );

create policy "Users can insert own generations."
  on generations for insert
  with check ( auth.uid() = user_id );

-- 4. Backfill existing users (Run this just in case you already have users without profiles)
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;
