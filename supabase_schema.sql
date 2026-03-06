-- Next.js AI Bug Reporter Supabase Schema

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. Users table (Extends Supabase Auth profiles)
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  role text check (role in ('tester', 'qa_lead', 'admin')) default 'tester',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.users enable row level security;

-- Users can read their own profile
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- Function to handle new user signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'tester');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Projects table
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  created_by uuid references public.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.projects enable row level security;

-- View projects (everyone for now, can restrict later)
create policy "Anyone can view projects" on public.projects for select using (true);
create policy "Authenticated users can create projects" on public.projects for insert with check (auth.role() = 'authenticated');

-- 3. Bugs table
create table public.bugs (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  reporter_id uuid references public.users(id),
  summary text not null,
  severity text check (severity in ('low', 'medium', 'high', 'critical')) not null,
  status text check (status in ('open', 'in_progress', 'resolved', 'closed')) default 'open',
  
  -- AI Generated fields
  description text,
  steps_to_reproduce text,
  expected_result text,
  actual_result text,
  root_cause text,
  
  -- Automatically captured metadata
  environment_info jsonb, -- { os, browser, resolution, url, timestamp }
  console_logs jsonb,
  network_logs jsonb,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.bugs enable row level security;

create policy "Anyone can view bugs" on public.bugs for select using (true);
create policy "Authenticated users can create bugs" on public.bugs for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update bugs" on public.bugs for update using (auth.role() = 'authenticated');

-- 4. Attachments table
create table public.attachments (
  id uuid default uuid_generate_v4() primary key,
  bug_id uuid references public.bugs(id) on delete cascade not null,
  file_url text not null,
  file_path text not null,
  attachment_type text check (attachment_type in ('screenshot', 'replay_log', 'other')) default 'screenshot',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.attachments enable row level security;
create policy "Anyone can view attachments" on public.attachments for select using (true);
create policy "Authenticated users can create attachments" on public.attachments for insert with check (auth.role() = 'authenticated');


-- 5. Integrations table
create table public.integrations (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  provider text check (provider in ('jira', 'azure', 'slack', 'teams')) not null,
  config jsonb not null, -- Stores webhook URLs, API keys etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (project_id, provider)
);

alter table public.integrations enable row level security;
create policy "Anyone can view integrations" on public.integrations for select using (true);
create policy "Authenticated users can configure integrations" on public.integrations for all using (auth.role() = 'authenticated');


-- Storage Bucket setup
insert into storage.buckets (id, name, public) values ('bug-attachments', 'bug-attachments', true)
on conflict do nothing;

create policy "Attachments are publicly accessible" on storage.objects for select using (bucket_id = 'bug-attachments');
create policy "Anyone can upload attachments" on storage.objects for insert with check (bucket_id = 'bug-attachments');
