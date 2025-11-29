
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Users)
create table profiles (
  id uuid references auth.users not null,
  email text,
  full_name text,
  primary key (id)
);

-- 2. PROJECTS (Tabs/Workspaces)
create table projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  title text,
  mode text,
  section text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. GENERATIONS (History/Images)
create table generations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  project_id uuid references projects(id),
  image_url text not null,
  prompt text,
  mode text,
  section text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Set up Storage Policies (Example for public read, authenticated upload)
-- You need to create a bucket named 'generated-images' in the Storage dashboard first.
