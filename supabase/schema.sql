-- ==============================================================================
-- 1. Profiles Table (Linked with Supabase Auth users)
-- ==============================================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  email text,
  avatar_url text,
  phone text,
  location text,
  headline text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  target_roles text[] default '{}',
  skills text[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS Policies for profiles (Using cached (select auth.uid()) for performance)
create policy "Users can view own profile" 
  on public.profiles for select 
  using ((select auth.uid()) = id);

create policy "Users can update own profile" 
  on public.profiles for update 
  using ((select auth.uid()) = id);

create policy "Users can insert own profile" 
  on public.profiles for insert 
  with check ((select auth.uid()) = id);

-- ==============================================================================
-- 2. Automatic Profile Creation on User Signup (Trigger Function)
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  );
  return new;
end;
$$;

-- Revoke execute from public/anon/authenticated roles for security
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Drop trigger if already exists then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==============================================================================
-- 3. Resumes Table
-- ==============================================================================
create table if not exists public.resumes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  file_name text not null,
  file_url text,
  file_size integer,
  parsed_content jsonb default '{}'::jsonb,
  is_primary boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.resumes enable row level security;

-- Covering Index for user foreign key
create index if not exists idx_resumes_user_id on public.resumes(user_id);

create policy "Users can view own resumes" 
  on public.resumes for select 
  using ((select auth.uid()) = user_id);

create policy "Users can insert own resumes" 
  on public.resumes for insert 
  with check ((select auth.uid()) = user_id);

create policy "Users can update own resumes" 
  on public.resumes for update 
  using ((select auth.uid()) = user_id);

create policy "Users can delete own resumes" 
  on public.resumes for delete 
  using ((select auth.uid()) = user_id);

-- ==============================================================================
-- 4. Job Applications & Pipeline Table
-- ==============================================================================
create table if not exists public.job_applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  company_name text not null,
  job_title text not null,
  job_url text,
  job_description text,
  location text,
  salary_range text,
  status text not null default 'wishlist' check (status in ('wishlist', 'applied', 'interviewing', 'offer', 'rejected')),
  applied_at timestamptz,
  tailored_resume_id uuid references public.resumes(id) on delete set null,
  cover_letter text,
  notes text,
  match_score numeric check (match_score >= 0 and match_score <= 100),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.job_applications enable row level security;

-- Covering Indexes
create index if not exists idx_job_applications_user_id on public.job_applications(user_id);
create index if not exists idx_job_applications_user_status on public.job_applications(user_id, status);
create index if not exists idx_job_applications_tailored_resume_id on public.job_applications(tailored_resume_id);

create policy "Users can view own applications" 
  on public.job_applications for select 
  using ((select auth.uid()) = user_id);

create policy "Users can insert own applications" 
  on public.job_applications for insert 
  with check ((select auth.uid()) = user_id);

create policy "Users can update own applications" 
  on public.job_applications for update 
  using ((select auth.uid()) = user_id);

create policy "Users can delete own applications" 
  on public.job_applications for delete 
  using ((select auth.uid()) = user_id);

-- ==============================================================================
-- 5. Updated At Trigger Function
-- ==============================================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.handle_updated_at() from public, anon, authenticated;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_resumes_updated_at on public.resumes;
create trigger set_resumes_updated_at
  before update on public.resumes
  for each row execute function public.handle_updated_at();

drop trigger if exists set_job_applications_updated_at on public.job_applications;
create trigger set_job_applications_updated_at
  before update on public.job_applications
  for each row execute function public.handle_updated_at();
