drop policy if exists admin_allowlist_deny_all on public.admin_allowlist;
create policy admin_allowlist_deny_all on public.admin_allowlist
for all to authenticated
using (false)
with check (false);