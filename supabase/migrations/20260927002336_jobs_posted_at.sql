alter table public.jobs
	add column if not exists posted_at timestamptz;
