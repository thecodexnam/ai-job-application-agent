-- ==============================================================================
-- 003_jobs_table.sql
-- Create jobs table for AI Job Application Agent with Brave Search integration
-- ==============================================================================

create table if not exists public.jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  platform text not null, -- 'greenhouse' | 'lever' | 'workable' | 'wellfound'
  title text not null,
  company text not null,
  company_logo text,
  location text,
  salary text,
  job_type text default 'Full-time', -- 'Full-time' | 'Contract' | 'Remote' | 'Hybrid' | 'Part-time'
  experience_level text default 'Mid Level', -- 'Entry Level' | 'Mid Level' | 'Senior' | 'Lead'
  description text,
  tags text[] default '{}',
  match_score integer default 85,
  job_url text not null,
  source_url text,
  application_status text default 'not_applied',
  saved_status boolean default false,
  fetched_at timestamptz default now() not null,
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.jobs enable row level security;

-- Indexes for optimal query performance
create index if not exists idx_jobs_user_id on public.jobs(user_id);
create index if not exists idx_jobs_user_platform on public.jobs(user_id, platform);
create index if not exists idx_jobs_user_fetched on public.jobs(user_id, fetched_at desc);
create index if not exists idx_jobs_user_saved on public.jobs(user_id, saved_status) where saved_status = true;

-- RLS Policies
drop policy if exists "Users can view own jobs" on public.jobs;
create policy "Users can view own jobs" 
  on public.jobs 
  for select 
  to authenticated 
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own jobs" on public.jobs;
create policy "Users can insert own jobs" 
  on public.jobs 
  for insert 
  to authenticated 
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own jobs" on public.jobs;
create policy "Users can update own jobs" 
  on public.jobs 
  for update 
  to authenticated 
  using ((select auth.uid()) = user_id) 
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own jobs" on public.jobs;
create policy "Users can delete own jobs" 
  on public.jobs 
  for delete 
  to authenticated 
  using ((select auth.uid()) = user_id);
