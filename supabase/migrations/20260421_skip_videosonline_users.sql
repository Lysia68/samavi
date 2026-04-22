-- Modifier le trigger handle_new_user pour qu'il ignore les inscriptions VideosOnline
-- (le projet parallèle utilise le même Supabase mais ne doit pas polluer la table profiles Fydelys)
-- Les inscriptions VideosOnline passent source='videosonline' dans raw_user_meta_data.

create or replace function handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  -- Skip si l'utilisateur vient de VideosOnline (projet parallèle)
  if new.raw_user_meta_data->>'source' = 'videosonline' then
    return new;
  end if;

  insert into public.profiles (id, first_name, last_name)
  values (new.id,
          new.raw_user_meta_data->>'first_name',
          new.raw_user_meta_data->>'last_name');
  return new;
end;
$$;
