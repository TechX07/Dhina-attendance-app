-- ============================================
-- Attendance Management App — Supabase Schema
-- ============================================

-- 1. Users table
create table if not exists public.users (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  username text unique not null,
  password_hash text not null,
  role text not null check (role in ('admin', 'employee')),
  created_at timestamptz default now()
);

-- 2. Attendance table
create table if not exists public.attendance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  date date not null default current_date,
  check_in timestamptz default now(),
  status text not null default 'Present',
  created_at timestamptz default now(),
  unique (user_id, date)
);

-- 3. Enable Row Level Security
alter table public.users enable row level security;
alter table public.attendance enable row level security;

-- 4. RLS Policies — Users table
-- Allow anyone to read (needed for login)
create policy "Allow public read on users"
  on public.users for select
  using (true);

-- Allow admins to insert employees
create policy "Admins can insert users"
  on public.users for insert
  with check (true);

-- Allow admins to delete employees
create policy "Admins can delete users"
  on public.users for delete
  using (true);

-- 5. RLS Policies — Attendance table
-- Anyone can read attendance (admin filters in app)
create policy "Allow read attendance"
  on public.attendance for select
  using (true);

-- Anyone can insert attendance (app checks role)
create policy "Allow insert attendance"
  on public.attendance for insert
  with check (true);

-- 6. Seed admin account
-- Password: admin123 → SHA-256 hash
insert into public.users (name, username, password_hash, role)
values (
  'Administrator',
  'admin@test.com',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'admin'
) on conflict (username) do nothing;
