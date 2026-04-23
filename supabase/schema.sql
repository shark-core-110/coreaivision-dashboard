-- Core AI Vision Dashboard — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query

-- ── TEAM MEMBERS ──────────────────────────────────────────
create table if not exists team_members (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  name       text not null,
  role       text not null,
  initials   text not null,
  email      text unique not null,
  status     text not null default 'active', -- active | inactive | contractor
  created_at timestamptz default now()
);

-- ── WEEKLY UPDATES ────────────────────────────────────────
create table if not exists weekly_updates (
  id             uuid primary key default gen_random_uuid(),
  member_id      uuid references team_members(id) on delete cascade,
  week_date      date not null,        -- Monday of the week
  tasks_done     text,
  tasks_planned  text,
  blockers       text,
  status         text default 'submitted', -- submitted | reviewed
  created_at     timestamptz default now(),
  unique (member_id, week_date)
);

-- ── CLIENTS ───────────────────────────────────────────────
create table if not exists clients (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  type             text,
  status           text default 'active', -- active | inactive | prospecting
  reels_target     int default 0,
  reels_delivered  int default 0,
  reach_guarantee  text,
  notes            text,
  created_at       timestamptz default now()
);

-- ── CONTENT TRACKER ───────────────────────────────────────
create table if not exists content_tracker (
  id             uuid primary key default gen_random_uuid(),
  week_date      date not null,
  reels_planned  int default 0,
  reels_done     int default 0,
  platform       text default 'instagram',
  notes          text,
  created_at     timestamptz default now(),
  unique (week_date, platform)
);

-- ── INVOICES ──────────────────────────────────────────────
create table if not exists invoices (
  id             uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  client_id      uuid references clients(id) on delete set null,
  amount         numeric(10,2) not null,
  currency       text default 'USD',
  status         text default 'pending', -- pending | paid | overdue
  due_date       date,
  created_at     timestamptz default now()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────
alter table team_members    enable row level security;
alter table weekly_updates  enable row level security;
alter table clients         enable row level security;
alter table content_tracker enable row level security;
alter table invoices        enable row level security;

-- Admin (Shariq) reads everything — match by email
create policy "admin_all" on team_members
  for all using (
    auth.jwt()->>'email' = 'shark@coreaivision.com'
  );

create policy "admin_all" on weekly_updates
  for all using (
    auth.jwt()->>'email' = 'shark@coreaivision.com'
  );

create policy "admin_all" on clients
  for all using (
    auth.jwt()->>'email' = 'shark@coreaivision.com'
  );

create policy "admin_all" on content_tracker
  for all using (
    auth.jwt()->>'email' = 'shark@coreaivision.com'
  );

create policy "admin_all" on invoices
  for all using (
    auth.jwt()->>'email' = 'shark@coreaivision.com'
  );

-- Team members read/write their own weekly update
create policy "member_own_updates" on weekly_updates
  for all using (
    member_id = (
      select id from team_members
      where user_id = auth.uid()
      limit 1
    )
  );

-- Team members read their own profile
create policy "member_own_profile" on team_members
  for select using (user_id = auth.uid());

-- ── SEED DATA ─────────────────────────────────────────────
insert into team_members (name, role, initials, email, status) values
  ('Pushkar',   'AI Video Creator',         'PK', 'pushkar@coreaivision.com',   'active'),
  ('Krishanu',  'AI Visual Artist',         'KR', 'krishanu@coreaivision.com',  'active'),
  ('Yash',      'Strategy & Claude Ops',    'YA', 'yash@coreaivision.com',      'active'),
  ('Akib',      'In-House Video Editor',    'AK', 'akib@coreaivision.com',      'active'),
  ('Padmanav',  'Cinematic Video Editor',   'PA', 'padmanav@coreaivision.com',  'active'),
  ('Niraj',     'AI Vibe Coder',            'NI', 'niraj@coreaivision.com',     'active'),
  ('Sanjukta',  'AI Influencer & Lyra',     'SJ', 'sanjukta@coreaivision.com',  'active'),
  ('Joyeeta',   'LinkedIn Strategist',      'JO', 'joyeeta@coreaivision.com',   'contractor'),
  ('Smit',      'AI Creator',               'SM', 'smit@coreaivision.com',      'inactive')
on conflict (email) do nothing;

insert into clients (name, type, status, reels_target, reels_delivered) values
  ('Arcads AI',         'AI SaaS — Ad creative generation',          'active',     2,  0),
  ('TapNow',            'AI SaaS — Prompt engine & content libraries','active',     3,  0),
  ('Syntx.ai',          'AI SaaS — All-in-one creative workspace',   'active',     12, 0),
  ('Vailo.AI',          'AI SaaS — Video & avatar generation',       'active',     0,  0),
  ('Atlabs.ai',         'AI SaaS — Studio & production tools',       'active',     0,  0),
  ('AI eCommerce SaaS', 'eCommerce + AI',                            'prospecting',0,  0)
on conflict do nothing;
