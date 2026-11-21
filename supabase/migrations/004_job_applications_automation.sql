-- ==============================================================================
-- 004_job_applications_automation.sql
-- Extend public.job_applications and public.profiles for automated & manual applications
-- ==============================================================================

-- 1. Extend profiles table with additional candidate application fields
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists work_authorization text default 'Authorized to work in US/Country of application';
alter table public.profiles add column if not exists requires_sponsorship boolean default false;
alter table public.profiles add column if not exists salary_expectation text;
alter table public.profiles add column if not exists notice_period text;

-- 2. Extend job_applications table for automation support
alter table public.job_applications add column if not exists job_id uuid references public.jobs(id) on delete set null;
alter table public.job_applications add column if not exists platform text default 'generic';
alter table public.job_applications add column if not exists application_mode text default 'manual' check (application_mode in ('manual', 'automated'));
alter table public.job_applications add column if not exists application_status text default 'Pending';
alter table public.job_applications add column if not exists missing_fields jsonb default '[]'::jsonb;
alter table public.job_applications add column if not exists browser_session_id text;
alter table public.job_applications add column if not exists live_debug_url text;
alter table public.job_applications add column if not exists current_step text;
alter table public.job_applications add column if not exists form_data jsonb default '{}'::jsonb;
alter table public.job_applications add column if not exists error_message text;

-- 3. Create index for fast sequential concurrency checking (checking if user has active automation)
create index if not exists idx_job_applications_active_user
  on public.job_applications(user_id, application_status)
  where application_status in ('Preparing', 'In Progress', 'Missing Profile Data', 'Resume Required');

create index if not exists idx_job_applications_job_id
  on public.job_applications(job_id);
