create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name, role, preferred_language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'patient',
    coalesce(new.raw_user_meta_data->>'preferred_language', new.raw_user_meta_data->>'locale', 'en-IN')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
revoke execute on function public.handle_new_user() from public, anon, authenticated;