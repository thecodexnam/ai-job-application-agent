-- ==============================================================================
-- 1. Extend profiles and resumes tables
-- ==============================================================================
alter table public.profiles add column if not exists summary text;
alter table public.profiles add column if not exists additional_links jsonb default '[]'::jsonb;

alter table public.resumes add column if not exists file_type text;
alter table public.resumes add column if not exists storage_path text;
alter table public.resumes add column if not exists parsing_status text default 'processing';
alter table public.resumes add column if not exists error_message text;

-- ==============================================================================
-- 2. Skills Table (Categorized profile skills)
-- ==============================================================================
create table if not exists public.profile_skills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  category text not null default 'Technical Skills',
  level text,
  order_index integer default 0,
  created_at timestamptz default now() not null
);
alter table public.profile_skills enable row level security;
create index if not exists idx_profile_skills_user_id on public.profile_skills(user_id);

drop policy if exists "Users can view own skills" on public.profile_skills;
create policy "Users can view own skills" on public.profile_skills for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own skills" on public.profile_skills;
create policy "Users can insert own skills" on public.profile_skills for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own skills" on public.profile_skills;
create policy "Users can update own skills" on public.profile_skills for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own skills" on public.profile_skills;
create policy "Users can delete own skills" on public.profile_skills for delete to authenticated using ((select auth.uid()) = user_id);

-- ==============================================================================
-- 3. Work Experiences Table
-- ==============================================================================
create table if not exists public.work_experiences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  company_name text not null,
  position text not null,
  employment_type text,
  location text,
  start_date text,
  end_date text,
  is_current boolean default false,
  description text,
  highlights text[] default '{}',
  order_index integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
alter table public.work_experiences enable row level security;
create index if not exists idx_work_experiences_user_id on public.work_experiences(user_id);

drop policy if exists "Users can view own work experiences" on public.work_experiences;
create policy "Users can view own work experiences" on public.work_experiences for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own work experiences" on public.work_experiences;
create policy "Users can insert own work experiences" on public.work_experiences for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own work experiences" on public.work_experiences;
create policy "Users can update own work experiences" on public.work_experiences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own work experiences" on public.work_experiences;
create policy "Users can delete own work experiences" on public.work_experiences for delete to authenticated using ((select auth.uid()) = user_id);

drop trigger if exists set_work_experiences_updated_at on public.work_experiences;
create trigger set_work_experiences_updated_at before update on public.work_experiences for each row execute function public.handle_updated_at();

-- ==============================================================================
-- 4. Education Table
-- ==============================================================================
create table if not exists public.educations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  institution text not null,
  degree text not null,
  field_of_study text,
  location text,
  start_date text,
  end_date text,
  grade text,
  description text,
  order_index integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
alter table public.educations enable row level security;
create index if not exists idx_educations_user_id on public.educations(user_id);

drop policy if exists "Users can view own educations" on public.educations;
create policy "Users can view own educations" on public.educations for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own educations" on public.educations;
create policy "Users can insert own educations" on public.educations for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own educations" on public.educations;
create policy "Users can update own educations" on public.educations for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own educations" on public.educations;
create policy "Users can delete own educations" on public.educations for delete to authenticated using ((select auth.uid()) = user_id);

drop trigger if exists set_educations_updated_at on public.educations;
create trigger set_educations_updated_at before update on public.educations for each row execute function public.handle_updated_at();

-- ==============================================================================
-- 5. Projects Table
-- ==============================================================================
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  technologies text[] default '{}',
  github_url text,
  live_url text,
  highlights text[] default '{}',
  order_index integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
alter table public.projects enable row level security;
create index if not exists idx_projects_user_id on public.projects(user_id);

drop policy if exists "Users can view own projects" on public.projects;
create policy "Users can view own projects" on public.projects for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own projects" on public.projects;
create policy "Users can insert own projects" on public.projects for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own projects" on public.projects;
create policy "Users can update own projects" on public.projects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own projects" on public.projects;
create policy "Users can delete own projects" on public.projects for delete to authenticated using ((select auth.uid()) = user_id);

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at before update on public.projects for each row execute function public.handle_updated_at();

-- ==============================================================================
-- 6. Certifications Table
-- ==============================================================================
create table if not exists public.certifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  issuing_organization text not null,
  issue_date text,
  expiration_date text,
  credential_id text,
  credential_url text,
  order_index integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
alter table public.certifications enable row level security;
create index if not exists idx_certifications_user_id on public.certifications(user_id);

drop policy if exists "Users can view own certifications" on public.certifications;
create policy "Users can view own certifications" on public.certifications for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own certifications" on public.certifications;
create policy "Users can insert own certifications" on public.certifications for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own certifications" on public.certifications;
create policy "Users can update own certifications" on public.certifications for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own certifications" on public.certifications;
create policy "Users can delete own certifications" on public.certifications for delete to authenticated using ((select auth.uid()) = user_id);

drop trigger if exists set_certifications_updated_at on public.certifications;
create trigger set_certifications_updated_at before update on public.certifications for each row execute function public.handle_updated_at();

-- ==============================================================================
-- 7. Additional Resume Information Table (Awards, Publications, Languages, etc.)
-- ==============================================================================
create table if not exists public.additional_info (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category text not null,
  title text not null,
  description text,
  date text,
  url text,
  order_index integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
alter table public.additional_info enable row level security;
create index if not exists idx_additional_info_user_id on public.additional_info(user_id);

drop policy if exists "Users can view own additional info" on public.additional_info;
create policy "Users can view own additional info" on public.additional_info for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own additional info" on public.additional_info;
create policy "Users can insert own additional info" on public.additional_info for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own additional info" on public.additional_info;
create policy "Users can update own additional info" on public.additional_info for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own additional info" on public.additional_info;
create policy "Users can delete own additional info" on public.additional_info for delete to authenticated using ((select auth.uid()) = user_id);

drop trigger if exists set_additional_info_updated_at on public.additional_info;
create trigger set_additional_info_updated_at before update on public.additional_info for each row execute function public.handle_updated_at();

-- ==============================================================================
-- 8. Storage Bucket and Policies for Resumes
-- ==============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  10485760,
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/octet-stream']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/octet-stream'];

drop policy if exists "Users can view own resumes files" on storage.objects;
create policy "Users can view own resumes files"
on storage.objects for select to authenticated
using (
  bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users can upload own resumes files" on storage.objects;
create policy "Users can upload own resumes files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users can update own resumes files" on storage.objects;
create policy "Users can update own resumes files"
on storage.objects for update to authenticated
using (
  bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users can delete own resumes files" on storage.objects;
create policy "Users can delete own resumes files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid()::text)
);
