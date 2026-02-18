-- ============================================
-- Salary Management — Schema Extension
-- Run this in Supabase SQL Editor
-- ============================================

create table if not exists public.salaries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  month text not null,
  monthly_salary numeric not null default 0,
  daily_salary numeric not null default 0,
  leave_days integer not null default 0,
  final_salary numeric not null default 0,
  created_at timestamptz default now(),
  unique (user_id, month)
);

alter table public.salaries enable row level security;

create policy "Allow read salaries"
  on public.salaries for select
  using (true);

create policy "Allow insert salaries"
  on public.salaries for insert
  with check (true);

create policy "Allow update salaries"
  on public.salaries for update
  using (true);

create policy "Allow delete salaries"
  on public.salaries for delete
  using (true);
