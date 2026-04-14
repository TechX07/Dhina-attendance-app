-- ============================================
-- Salary Management — Schema Extension
-- Run this in Supabase SQL Editor
-- ============================================

alter table public.users
  add column if not exists employee_type text not null default 'full_time';

alter table public.users
  drop constraint if exists users_employee_type_check;

alter table public.users
  add constraint users_employee_type_check
  check (employee_type in ('full_time', 'part_time'));

create table if not exists public.app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

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

drop policy if exists "Allow read salaries" on public.salaries;
drop policy if exists "Allow insert salaries" on public.salaries;
drop policy if exists "Allow update salaries" on public.salaries;
drop policy if exists "Allow delete salaries" on public.salaries;

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

alter table public.app_settings enable row level security;

drop policy if exists "Allow read app settings" on public.app_settings;
drop policy if exists "Allow insert app settings" on public.app_settings;
drop policy if exists "Allow update app settings" on public.app_settings;

create policy "Allow read app settings"
  on public.app_settings for select
  using (true);

create policy "Allow insert app settings"
  on public.app_settings for insert
  with check (true);

create policy "Allow update app settings"
  on public.app_settings for update
  using (true);

insert into public.app_settings (key, value)
values ('location_restriction_enabled', 'true')
on conflict (key) do nothing;
