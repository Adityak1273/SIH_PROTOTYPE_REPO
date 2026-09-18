create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'patient',
  locale text not null default 'en-IN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.caregiver_links (
  id uuid primary key default gen_random_uuid(),
  patient_user_id uuid not null references auth.users(id) on delete cascade,
  caregiver_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','pending','revoked')),
  created_at timestamptz not null default now(),
  unique(patient_user_id, caregiver_user_id)
);
create table if not exists public.cognitive_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_session_id text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'completed' check (status in ('in_progress','completed','abandoned')),
  score numeric not null default 0 check (score >= 0 and score <= 100),
  accuracy numeric not null default 0 check (accuracy >= 0 and accuracy <= 1),
  avg_response_seconds numeric not null default 0 check (avg_response_seconds >= 0),
  level integer not null default 1 check (level between 1 and 10),
  created_at timestamptz not null default now(),
  unique(user_id, client_session_id)
);
create table if not exists public.game_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.cognitive_sessions(id) on delete cascade,
  game_key text not null,
  score numeric not null default 0 check (score >= 0 and score <= 100),
  accuracy numeric not null default 0 check (accuracy >= 0 and accuracy <= 1),
  response_time_seconds numeric not null default 0 check (response_time_seconds >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  task_date date not null default current_date,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  time text,
  repeat text not null default 'once',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists caregiver_links_patient_idx on public.caregiver_links(patient_user_id);
create index if not exists caregiver_links_caregiver_idx on public.caregiver_links(caregiver_user_id);
create index if not exists sessions_user_completed_idx on public.cognitive_sessions(user_id, completed_at desc);
create index if not exists results_user_created_idx on public.game_results(user_id, created_at desc);
create index if not exists results_session_idx on public.game_results(session_id);
create index if not exists tasks_user_date_idx on public.daily_tasks(user_id, task_date desc);
create index if not exists reminders_user_created_idx on public.reminders(user_id, created_at desc);
create index if not exists audit_user_created_idx on public.audit_log(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.caregiver_links enable row level security;
alter table public.cognitive_sessions enable row level security;
alter table public.game_results enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.reminders enable row level security;
alter table public.audit_log enable row level security;
revoke all on public.profiles, public.caregiver_links, public.cognitive_sessions, public.game_results, public.daily_tasks, public.reminders, public.audit_log from anon;
grant select, insert, update, delete on public.profiles, public.caregiver_links, public.cognitive_sessions, public.game_results, public.daily_tasks, public.reminders to authenticated;
grant select, insert on public.audit_log to authenticated;

create policy profiles_own_select on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy profiles_own_insert on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy profiles_own_update on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy profiles_own_delete on public.profiles for delete to authenticated using ((select auth.uid()) = user_id);

create policy caregiver_links_participant_select on public.caregiver_links for select to authenticated using ((select auth.uid()) = patient_user_id or (select auth.uid()) = caregiver_user_id);
create policy caregiver_links_participant_insert on public.caregiver_links for insert to authenticated with check ((select auth.uid()) = patient_user_id or (select auth.uid()) = caregiver_user_id);
create policy caregiver_links_participant_update on public.caregiver_links for update to authenticated using ((select auth.uid()) = patient_user_id or (select auth.uid()) = caregiver_user_id) with check ((select auth.uid()) = patient_user_id or (select auth.uid()) = caregiver_user_id);

create policy sessions_owner_select on public.cognitive_sessions for select to authenticated using ((select auth.uid()) = user_id or exists (select 1 from public.caregiver_links cl where cl.patient_user_id = cognitive_sessions.user_id and cl.caregiver_user_id = (select auth.uid()) and cl.status='active'));
create policy sessions_owner_insert on public.cognitive_sessions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy sessions_owner_update on public.cognitive_sessions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy sessions_owner_delete on public.cognitive_sessions for delete to authenticated using ((select auth.uid()) = user_id);

create policy results_owner_select on public.game_results for select to authenticated using ((select auth.uid()) = user_id or exists (select 1 from public.caregiver_links cl where cl.patient_user_id = game_results.user_id and cl.caregiver_user_id = (select auth.uid()) and cl.status='active'));
create policy results_owner_insert on public.game_results for insert to authenticated with check ((select auth.uid()) = user_id);
create policy results_owner_update on public.game_results for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy results_owner_delete on public.game_results for delete to authenticated using ((select auth.uid()) = user_id);

create policy tasks_owner_select on public.daily_tasks for select to authenticated using ((select auth.uid()) = user_id or exists (select 1 from public.caregiver_links cl where cl.patient_user_id = daily_tasks.user_id and cl.caregiver_user_id = (select auth.uid()) and cl.status='active'));
create policy tasks_owner_insert on public.daily_tasks for insert to authenticated with check ((select auth.uid()) = user_id);
create policy tasks_owner_update on public.daily_tasks for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy tasks_owner_delete on public.daily_tasks for delete to authenticated using ((select auth.uid()) = user_id);

create policy reminders_owner_select on public.reminders for select to authenticated using ((select auth.uid()) = user_id or exists (select 1 from public.caregiver_links cl where cl.patient_user_id = reminders.user_id and cl.caregiver_user_id = (select auth.uid()) and cl.status='active'));
create policy reminders_owner_insert on public.reminders for insert to authenticated with check ((select auth.uid()) = user_id);
create policy reminders_owner_update on public.reminders for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy reminders_owner_delete on public.reminders for delete to authenticated using ((select auth.uid()) = user_id);

create policy audit_log_own_select_base on public.audit_log for select to authenticated using ((select auth.uid()) = user_id);
create policy audit_log_own_insert_base on public.audit_log for insert to authenticated with check ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name, role, locale)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'patient', coalesce(new.raw_user_meta_data->>'locale','en-IN'))
  on conflict (user_id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
revoke execute on function public.handle_new_user() from public, anon, authenticated;