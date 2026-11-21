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
  )
  on conflict (id) do nothing;
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
  job_id uuid references public.jobs(id) on delete set null,
  platform text default 'generic',
  application_mode text default 'manual' check (application_mode in ('manual', 'automated')),
  application_status text default 'PENDING',
  missing_fields jsonb default '[]'::jsonb,
  browser_session_id text,
  live_debug_url text,
  current_step text,
  form_data jsonb default '{}'::jsonb,
  error_message text,
  confirmation_details text,
  retry_count integer default 0 not null,
  last_retry_at timestamptz,
  processing_started_at timestamptz,
  submission_confirmed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.job_applications enable row level security;

-- Covering Indexes
create index if not exists idx_job_applications_user_id on public.job_applications(user_id);
create index if not exists idx_job_applications_user_status on public.job_applications(user_id, status);
create index if not exists idx_job_applications_tailored_resume_id on public.job_applications(tailored_resume_id);
create index if not exists idx_job_applications_job_id on public.job_applications(job_id);

-- Sequential concurrency lock index (ensures 1 active automated application per user)
create unique index if not exists idx_job_applications_one_active_automated
  on public.job_applications (user_id)
  where application_mode = 'automated'
    and application_status in (
      'PENDING',
      'IN_PROGRESS',
      'MISSING_PROFILE_INFO',
      'NEEDS_USER_ACTION'
    );

create policy "Users can view own applications" 
  on public.job_applications for select 
  using ((select auth.uid()) = user_id);

create policy "Users can insert own applications" 
  on public.job_applications for insert 
  with check ((select auth.uid()) = user_id);

create policy "Users can update own applications" 
  on public.job_applications for update 
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own applications" 
  on public.job_applications for delete 
  using ((select auth.uid()) = user_id);

-- ==============================================================================
-- 5. Application Form Fields Table (Detected form fields per application)
-- ==============================================================================
create table if not exists public.application_form_fields (
  id uuid default gen_random_uuid() primary key,
  application_id uuid references public.job_applications(id) on delete cascade not null,
  field_key text not null,
  label text not null,
  field_type text not null,
  required boolean not null default false,
  options jsonb default '[]'::jsonb,
  profile_mapping text,
  selector text,
  platform text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (application_id, field_key)
);

alter table public.application_form_fields enable row level security;

create index if not exists idx_application_form_fields_application_id
  on public.application_form_fields (application_id);

create policy "Users can view own application form fields"
  on public.application_form_fields for select to authenticated
  using (
    exists (
      select 1 from public.job_applications a
      where a.id = application_form_fields.application_id
        and a.user_id = (select auth.uid())
    )
  );

create policy "Users can insert own application form fields"
  on public.application_form_fields for insert to authenticated
  with check (
    exists (
      select 1 from public.job_applications a
      where a.id = application_form_fields.application_id
        and a.user_id = (select auth.uid())
    )
  );

create policy "Users can update own application form fields"
  on public.application_form_fields for update to authenticated
  using (
    exists (
      select 1 from public.job_applications a
      where a.id = application_form_fields.application_id
        and a.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.job_applications a
      where a.id = application_form_fields.application_id
        and a.user_id = (select auth.uid())
    )
  );

create policy "Users can delete own application form fields"
  on public.application_form_fields for delete to authenticated
  using (
    exists (
      select 1 from public.job_applications a
      where a.id = application_form_fields.application_id
        and a.user_id = (select auth.uid())
    )
  );

grant select, insert, update, delete on public.application_form_fields to authenticated;
grant all on public.application_form_fields to service_role;

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
