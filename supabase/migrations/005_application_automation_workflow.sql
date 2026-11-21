-- ==============================================================================
-- 005_application_automation_workflow.sql
-- Persist form fields, normalize automation statuses, sequential lock, retries
-- ==============================================================================

alter table public.profiles alter column work_authorization drop default;
alter table public.profiles alter column requires_sponsorship drop default;

alter table public.job_applications
  add column if not exists confirmation_details text,
  add column if not exists retry_count integer default 0 not null,
  add column if not exists last_retry_at timestamptz,
  add column if not exists processing_started_at timestamptz,
  add column if not exists submission_confirmed_at timestamptz;

update public.job_applications
set application_status = case application_status
  when 'Pending' then 'PENDING'
  when 'pending' then 'PENDING'
  when 'Preparing' then 'IN_PROGRESS'
  when 'In Progress' then 'IN_PROGRESS'
  when 'in_progress' then 'IN_PROGRESS'
  when 'Missing Profile Info' then 'MISSING_PROFILE_INFO'
  when 'Missing Profile Data' then 'MISSING_PROFILE_INFO'
  when 'Resume Required' then 'MISSING_PROFILE_INFO'
  when 'needs_user_input' then 'NEEDS_USER_ACTION'
  when 'Ready for Review' then 'NEEDS_USER_ACTION'
  when 'Submitted' then 'SUBMITTED'
  when 'submitted' then 'SUBMITTED'
  when 'Failed' then 'FAILED'
  when 'failed' then 'FAILED'
  else coalesce(application_status, 'PENDING')
end
where application_status is not null;

drop index if exists idx_job_applications_active_user;

create index if not exists idx_job_applications_active_user
  on public.job_applications (user_id, application_status)
  where application_status in (
    'PENDING',
    'IN_PROGRESS',
    'MISSING_PROFILE_INFO',
    'NEEDS_USER_ACTION'
  );

create unique index if not exists idx_job_applications_one_active_automated
  on public.job_applications (user_id)
  where application_mode = 'automated'
    and application_status in (
      'PENDING',
      'IN_PROGRESS',
      'MISSING_PROFILE_INFO',
      'NEEDS_USER_ACTION'
    );

drop policy if exists "Users can update own applications" on public.job_applications;
create policy "Users can update own applications"
  on public.job_applications
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

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

drop trigger if exists set_application_form_fields_updated_at on public.application_form_fields;
create trigger set_application_form_fields_updated_at
  before update on public.application_form_fields
  for each row execute function public.handle_updated_at();

create policy "Users can view own application form fields"
  on public.application_form_fields
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.job_applications a
      where a.id = application_form_fields.application_id
        and a.user_id = (select auth.uid())
    )
  );

create policy "Users can insert own application form fields"
  on public.application_form_fields
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.job_applications a
      where a.id = application_form_fields.application_id
        and a.user_id = (select auth.uid())
    )
  );

create policy "Users can update own application form fields"
  on public.application_form_fields
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.job_applications a
      where a.id = application_form_fields.application_id
        and a.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.job_applications a
      where a.id = application_form_fields.application_id
        and a.user_id = (select auth.uid())
    )
  );

create policy "Users can delete own application form fields"
  on public.application_form_fields
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.job_applications a
      where a.id = application_form_fields.application_id
        and a.user_id = (select auth.uid())
    )
  );

grant select, insert, update, delete on public.application_form_fields to authenticated;
grant all on public.application_form_fields to service_role;
