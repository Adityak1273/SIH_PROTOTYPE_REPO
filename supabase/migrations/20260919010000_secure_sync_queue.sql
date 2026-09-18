create table if not exists public.sync_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_event_id text not null,
  entity_type text not null,
  operation text not null,
  payload jsonb not null default '{}'::jsonb,
  client_created_at timestamptz not null default now(),
  synced_at timestamptz,
  attempts integer not null default 0,
  last_error text,
  processed_at timestamptz,
  processing_error text,
  unique(user_id, client_event_id)
);
create index if not exists sync_queue_user_created_idx on public.sync_queue(user_id, client_created_at desc);
alter table public.sync_queue enable row level security;
revoke all on public.sync_queue from anon;
grant select, insert, update, delete on public.sync_queue to authenticated;
drop policy if exists sync_queue_select_own on public.sync_queue;
drop policy if exists sync_queue_insert_own on public.sync_queue;
drop policy if exists sync_queue_update_own on public.sync_queue;
drop policy if exists sync_queue_delete_own on public.sync_queue;
create policy sync_queue_select_own on public.sync_queue for select to authenticated using ((select auth.uid()) = user_id);
create policy sync_queue_insert_own on public.sync_queue for insert to authenticated with check ((select auth.uid()) = user_id);
create policy sync_queue_update_own on public.sync_queue for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy sync_queue_delete_own on public.sync_queue for delete to authenticated using ((select auth.uid()) = user_id);