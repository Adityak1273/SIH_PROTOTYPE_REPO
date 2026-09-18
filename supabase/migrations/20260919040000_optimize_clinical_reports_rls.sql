drop policy if exists clinical_reports_self_select on public.clinical_reports;
drop policy if exists clinical_reports_linked_select on public.clinical_reports;
drop policy if exists clinical_reports_self_insert on public.clinical_reports;
drop policy if exists clinical_reports_self_update on public.clinical_reports;
drop policy if exists clinical_reports_self_delete on public.clinical_reports;
create policy clinical_reports_select on public.clinical_reports for select to authenticated using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.caregiver_links cl
    where cl.patient_user_id = clinical_reports.user_id
      and cl.caregiver_user_id = (select auth.uid())
      and cl.status = 'active'
  )
);
create policy clinical_reports_insert on public.clinical_reports for insert to authenticated with check (user_id = (select auth.uid()));
create policy clinical_reports_update on public.clinical_reports for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy clinical_reports_delete on public.clinical_reports for delete to authenticated using (user_id = (select auth.uid()));