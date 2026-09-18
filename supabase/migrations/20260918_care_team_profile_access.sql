-- Care-team profile visibility for active patient relationships.
-- Authorization remains enforced by caregiver_links plus the existing RLS policies.
create policy if not exists "profiles_select_linked_care_team"
  on public.profiles
  for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.caregiver_links cl
      where cl.patient_user_id = profiles.user_id
        and cl.caregiver_user_id = (select auth.uid())
        and cl.status = 'active'
    )
  );
