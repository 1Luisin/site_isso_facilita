begin;
alter table public.contents add column cover_storage_bucket text;
alter table public.contents add constraint content_cover_origin check ((case when cover_storage_bucket is null then
  (cover_path is null or cover_path ~ '^/videos/[a-zA-Z0-9_-]+\.(webp|png|jpe?g)$') and
  (mobile_cover_path is null or mobile_cover_path ~ '^/videos/[a-zA-Z0-9_-]+\.(webp|png|jpe?g)$')
else cover_storage_bucket='catalog-media' and cover_path is not null and mobile_cover_path is not null
  and cover_path ~ ('^contents/'||id::text||'/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/cover\.webp$')
  and mobile_cover_path=replace(cover_path,'/cover.webp','/mobile.webp') end) is true);
alter policy content_products_admin_delete on public.content_products using ((select private.current_admin_role()) in ('owner','editor'));
alter policy content_links_admin_delete on public.content_links using ((select private.current_admin_role()) in ('owner','editor'));

create function private.valid_content_object(p_name text) returns boolean language sql stable security invoker set search_path='' as $$
select p_name ~ '^contents/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/(cover|mobile)\.webp$'
$$;
revoke all on function private.valid_content_object(text) from public;
grant execute on function private.valid_content_object(text) to authenticated;
create policy content_media_admin_read on storage.objects for select to authenticated using
(bucket_id='catalog-media' and private.valid_content_object(name) and (select private.current_admin_role()) in ('owner','editor'));
create policy content_media_admin_insert on storage.objects for insert to authenticated with check
(bucket_id='catalog-media' and private.valid_content_object(name) and (select private.current_admin_role()) in ('owner','editor')
 and exists(select 1 from public.contents c where c.id::text=split_part(storage.objects.name,'/',2)));
create policy content_media_admin_delete on storage.objects for delete to authenticated using
(bucket_id='catalog-media' and private.valid_content_object(name) and (select private.current_admin_role()) in ('owner','editor')
 and not exists(select 1 from public.contents c where c.cover_storage_bucket='catalog-media' and (c.cover_path=storage.objects.name or c.mobile_cover_path=storage.objects.name)));

-- The guard also protects direct Data API writes, not only the administrative RPCs.
create function private.guard_content() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  perform pg_advisory_xact_lock(130013);
  if tg_op='DELETE' or (tg_op='UPDATE' and not new.published) then
    if exists(select 1 from public.site_settings where featured_content_id=old.id) then
      raise exception using errcode='22023',message='featured_content_protected'; end if;
  end if;
  if tg_op='DELETE' then return old; end if;
  if new.published and new.cover_path is null then raise exception using errcode='22023',message='cover_required'; end if;
  if new.cover_storage_bucket is not null and (select count(*) from storage.objects where bucket_id=new.cover_storage_bucket
    and name in(new.cover_path,new.mobile_cover_path) and metadata->>'mimetype'='image/webp' and (metadata->>'size')::bigint between 1 and 6291456)<>2 then
    raise exception using errcode='22023',message='cover_upload_incomplete'; end if;
  if tg_op='UPDATE' then new.published_at:=coalesce(old.published_at,case when new.published then now() end);
  elsif new.published then raise exception using errcode='22023',message='create_draft_first'; end if;
  return new;
end $$;
revoke all on function private.guard_content() from public;
create trigger content_guard before insert or update or delete on public.contents for each row execute function private.guard_content();

create function public.admin_save_content(p_id uuid,p_code text,p_type text,p_title text,p_description text,p_published boolean,p_products uuid[],p_links jsonb,p_expected_updated_at timestamptz)
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid:=p_id; v_old public.contents%rowtype; v_platform text; v_url text;
begin
  if coalesce(private.current_admin_role(),'') not in ('owner','editor') then raise exception using errcode='42501',message='admin_required'; end if;
  perform pg_advisory_xact_lock(130013);
  if p_code is null or p_code !~ '^[0-9]{3,}$' or length(p_code)>20 or p_type is null or p_type not in ('carousel','video','post','short')
    or p_title is null or length(btrim(p_title)) not between 1 and 200 or length(coalesce(p_description,''))>4000 or p_published is null
    or p_products is null or cardinality(p_products)>100 or array_position(p_products,null) is not null
    or cardinality(p_products)<>(select count(distinct x) from unnest(p_products) x)
    or p_links is null or jsonb_typeof(p_links)<>'object' then raise exception using errcode='22023',message='invalid_content'; end if;
  if exists(select 1 from unnest(p_products) x where not exists(select 1 from public.products where id=x)) then raise exception using errcode='22023',message='content_product_missing'; end if;
  for v_platform,v_url in select key,value from jsonb_each_text(p_links) loop
    if v_platform not in ('instagram','tiktok','youtube') or v_url is null or length(v_url)>2048 or
      v_url !~ (case v_platform when 'instagram' then '^https://(www\.)?instagram\.com(/[^[:space:]]*)?$'
        when 'tiktok' then '^https://((www|vm|vt)\.)?tiktok\.com(/[^[:space:]]*)?$'
        else '^https://((www\.)?youtube\.com|youtu\.be)(/[^[:space:]]*)?$' end)
      then raise exception using errcode='22023',message='invalid_content_link'; end if;
  end loop;
  if v_id is null then
    if p_published then raise exception using errcode='22023',message='create_draft_first'; end if;
    insert into public.contents(code,content_type,title) values(p_code,p_type,btrim(p_title)) returning id into v_id;
  else
    select * into v_old from public.contents where id=v_id for update;
    if not found then raise exception using errcode='P0002',message='content_missing'; end if;
    if p_expected_updated_at is null or v_old.updated_at<>p_expected_updated_at then raise exception using errcode='40001',message='content_changed'; end if;
  end if;
  -- Same advisory lock as product mutations, plus locks on selected products.
  perform id from public.products where id=any(p_products) order by id for share;
  if p_published then
    if cardinality(p_products)=0 then raise exception using errcode='22023',message='content_products_required'; end if;
    if exists(select 1 from public.products p join public.categories c on c.id=p.category_id where p.id=any(p_products) and (not p.published or not c.active)) then
      raise exception using errcode='22023',message='content_products_unpublished'; end if;
    if v_old.cover_path is null then raise exception using errcode='22023',message='cover_required'; end if;
  end if;
  delete from public.content_products where content_id=v_id;
  insert into public.content_products(content_id,product_id,sort_order) select v_id,x,(n-1)::integer from unnest(p_products) with ordinality as ids(x,n);
  -- Preserve future platforms that this form does not manage.
  delete from public.content_links where content_id=v_id and platform in ('instagram','tiktok','youtube') and not(p_links ? platform);
  insert into public.content_links(content_id,platform,url) select v_id,key,value from jsonb_each_text(p_links)
    on conflict(content_id,platform) do update set url=excluded.url;
  update public.contents set code=p_code,content_type=p_type,title=btrim(p_title),description=nullif(btrim(p_description),''),published=p_published where id=v_id;
  return v_id;
end $$;

create function public.admin_delete_content(p_id uuid,p_expected_updated_at timestamptz) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_old public.contents%rowtype;
begin
  if coalesce(private.current_admin_role(),'')<>'owner' then raise exception using errcode='42501',message='owner_required'; end if;
  perform pg_advisory_xact_lock(130013);
  select * into v_old from public.contents where id=p_id for update;
  if not found then raise exception using errcode='P0002',message='content_missing'; end if;
  if p_expected_updated_at is null or v_old.updated_at<>p_expected_updated_at then raise exception using errcode='40001',message='content_changed'; end if;
  delete from public.contents where id=p_id;
  return jsonb_build_object('bucket',v_old.cover_storage_bucket,'main',v_old.cover_path,'mobile',v_old.mobile_cover_path);
end $$;

create function public.admin_feature_content(p_id uuid,p_expected_updated_at timestamptz,p_expected_featured_id uuid) returns uuid language plpgsql security invoker set search_path='' as $$
declare v_old public.contents%rowtype; v_settings public.site_settings%rowtype;
begin
  if coalesce(private.current_admin_role(),'')<>'owner' then raise exception using errcode='42501',message='owner_required'; end if;
  perform pg_advisory_xact_lock(130013);
  select * into v_old from public.contents where id=p_id for update;
  if not found or not v_old.published then raise exception using errcode='22023',message='feature_published_only'; end if;
  if p_expected_updated_at is null or v_old.updated_at<>p_expected_updated_at then raise exception using errcode='40001',message='content_changed'; end if;
  select * into v_settings from public.site_settings for update;
  if not found then raise exception using errcode='22023',message='settings_missing'; end if;
  if v_settings.featured_content_id is distinct from p_expected_featured_id then raise exception using errcode='40001',message='feature_changed'; end if;
  update public.site_settings set featured_content_id=p_id where id=v_settings.id;
  return p_id;
end $$;

create function public.admin_set_content_cover(p_id uuid,p_bucket text,p_main text,p_mobile text,p_expected_updated_at timestamptz) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_old public.contents%rowtype;
begin
  if coalesce(private.current_admin_role(),'') not in ('owner','editor') then raise exception using errcode='42501',message='admin_required'; end if;
  perform pg_advisory_xact_lock(130013);
  select * into v_old from public.contents where id=p_id for update;
  if not found then raise exception using errcode='P0002',message='content_missing'; end if;
  if p_expected_updated_at is null or v_old.updated_at<>p_expected_updated_at then raise exception using errcode='40001',message='content_changed'; end if;
  if p_bucket is distinct from 'catalog-media' or p_main is null or p_mobile is null or not private.valid_content_object(p_main)
    or split_part(p_main,'/',2)<>p_id::text or right(p_main,11)<>'/cover.webp' or p_mobile<>replace(p_main,'/cover.webp','/mobile.webp') then raise exception using errcode='22023',message='invalid_cover'; end if;
  update public.contents set cover_storage_bucket=p_bucket,cover_path=p_main,mobile_cover_path=p_mobile where id=p_id;
  return jsonb_build_object('bucket',v_old.cover_storage_bucket,'main',v_old.cover_path,'mobile',v_old.mobile_cover_path);
end $$;
create function public.admin_remove_content_cover(p_id uuid,p_expected_updated_at timestamptz) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_old public.contents%rowtype;
begin
  if coalesce(private.current_admin_role(),'') not in ('owner','editor') then raise exception using errcode='42501',message='admin_required'; end if;
  perform pg_advisory_xact_lock(130013);
  select * into v_old from public.contents where id=p_id for update;
  if not found then raise exception using errcode='P0002',message='content_missing'; end if;
  if p_expected_updated_at is null or v_old.updated_at<>p_expected_updated_at then raise exception using errcode='40001',message='content_changed'; end if;
  if v_old.published then raise exception using errcode='22023',message='unpublish_before_cover_removal'; end if;
  update public.contents set cover_storage_bucket=null,cover_path=null,mobile_cover_path=null where id=p_id;
  return jsonb_build_object('bucket',v_old.cover_storage_bucket,'main',v_old.cover_path,'mobile',v_old.mobile_cover_path);
end $$;

revoke all on function public.admin_save_content(uuid,text,text,text,text,boolean,uuid[],jsonb,timestamptz),public.admin_delete_content(uuid,timestamptz),public.admin_feature_content(uuid,timestamptz,uuid),public.admin_set_content_cover(uuid,text,text,text,timestamptz),public.admin_remove_content_cover(uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.admin_save_content(uuid,text,text,text,text,boolean,uuid[],jsonb,timestamptz),public.admin_delete_content(uuid,timestamptz),public.admin_feature_content(uuid,timestamptz,uuid),public.admin_set_content_cover(uuid,text,text,text,timestamptz),public.admin_remove_content_cover(uuid,timestamptz) to authenticated;
commit;
