create or replace function public.assign_owner_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(new.email) = 'bolokartel821@gmail.com' and new.email_confirmed_at is not null then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.assign_owner_admin() from public, anon, authenticated;

create trigger assign_owner_admin_on_confirm
after insert or update of email_confirmed_at on auth.users
for each row execute function public.assign_owner_admin();