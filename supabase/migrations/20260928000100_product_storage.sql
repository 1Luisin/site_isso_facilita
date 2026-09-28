begin;
-- Bucket configuration is supported SQL; object bytes/deletion always use Storage API.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('catalog-media','catalog-media',true,6291456,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

alter table public.product_images add column storage_bucket text;
alter table public.product_images add constraint product_image_origin check (
  (storage_bucket is null and storage_path ~ '^/products/[a-zA-Z0-9_-]+\.(webp|png|jpe?g)$'
    and (mobile_storage_path is null or mobile_storage_path ~ '^/products/[a-zA-Z0-9_-]+\.(webp|png|jpe?g)$'))
  or (storage_bucket='catalog-media' and mobile_storage_path is not null
    and storage_path ~ ('^products/' || product_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/main\.webp$')
    and mobile_storage_path=replace(storage_path,'/main.webp','/mobile.webp'))
);

create function private.valid_product_object(p_name text) returns boolean
language sql stable security invoker set search_path='' as $$
  select p_name ~ '^products/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/(main|mobile)\.webp$'
$$;
revoke all on function private.valid_product_object(text) from public;
grant execute on function private.valid_product_object(text) to authenticated;

create policy catalog_media_admin_read on storage.objects for select to authenticated
using (bucket_id='catalog-media' and private.valid_product_object(name) and (select private.current_admin_role()) in ('owner','editor'));
create policy catalog_media_admin_insert on storage.objects for insert to authenticated
with check (bucket_id='catalog-media' and private.valid_product_object(name)
  and (select private.current_admin_role()) in ('owner','editor')
  and exists(select 1 from public.products p where p.id::text=split_part(name,'/',2)));
-- No UPDATE/upsert policy. Referenced files cannot be removed, including drafts.
create policy catalog_media_admin_delete on storage.objects for delete to authenticated
using (bucket_id='catalog-media' and private.valid_product_object(name)
  and (select private.current_admin_role()) in ('owner','editor')
  and not exists(select 1 from public.product_images i where i.storage_bucket='catalog-media'
    and (i.storage_path=name or i.mobile_storage_path=name)));

alter policy product_images_admin_delete on public.product_images
using ((select private.current_admin_role()) in ('owner','editor')
  and not exists(select 1 from public.products p where p.id=product_id and p.published));

-- Also protect direct Data API writes; the UI is not the security boundary.
create function private.guard_product_image() returns trigger language plpgsql security invoker set search_path='' as $$
declare v_published boolean; v_count integer;
begin
  if tg_op='DELETE' then
    select published into v_published from public.products where id=old.product_id for update;
    if v_published and old.is_primary then raise exception using errcode='22023',message='unpublish_before_image_removal'; end if;
    return old;
  end if;
  if tg_op='UPDATE' and (new.product_id<>old.product_id or (old.is_primary and not new.is_primary)) then
    raise exception using errcode='22023',message='invalid_image_change';
  end if;
  if new.storage_bucket is not null then
    select count(*) into v_count from storage.objects where bucket_id=new.storage_bucket
      and name in (new.storage_path,new.mobile_storage_path)
      and metadata->>'mimetype'='image/webp'
      and (metadata->>'size')::bigint between 1 and 6291456;
    if v_count<>2 then raise exception using errcode='22023',message='image_upload_incomplete'; end if;
  end if;
  return new;
end $$;
revoke all on function private.guard_product_image() from public;
create trigger product_image_guard before insert or update or delete on public.product_images
for each row execute function private.guard_product_image();

create function public.admin_set_product_image(p_id uuid,p_bucket text,p_main text,p_mobile text,p_alt text,p_expected_updated_at timestamptz)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_product public.products%rowtype; v_old public.product_images%rowtype;
begin
  if coalesce(private.current_admin_role(),'') not in ('owner','editor') then raise exception using errcode='42501',message='admin_required'; end if;
  perform pg_advisory_xact_lock(130013);
  select * into v_product from public.products where id=p_id for update;
  if not found then raise exception using errcode='P0002',message='product_missing'; end if;
  if p_expected_updated_at is null or v_product.updated_at<>p_expected_updated_at then raise exception using errcode='40001',message='product_changed'; end if;
  if p_bucket is distinct from 'catalog-media' or p_main is null or p_mobile is null
    or not private.valid_product_object(p_main) or split_part(p_main,'/',2)<>p_id::text
    or right(p_main,10)<>'/main.webp' or p_mobile<>replace(p_main,'/main.webp','/mobile.webp')
    or char_length(coalesce(p_alt,''))>300 then raise exception using errcode='22023',message='invalid_image_change'; end if;
  select * into v_old from public.product_images where product_id=p_id and is_primary for update;
  if found then
    update public.product_images set storage_bucket=p_bucket,storage_path=p_main,mobile_storage_path=p_mobile,
      alt_text=coalesce(nullif(btrim(p_alt),''),v_product.name) where id=v_old.id;
  else
    insert into public.product_images(product_id,storage_bucket,storage_path,mobile_storage_path,alt_text,is_primary)
      values(p_id,p_bucket,p_main,p_mobile,coalesce(nullif(btrim(p_alt),''),v_product.name),true);
  end if;
  update public.products set updated_at=clock_timestamp() where id=p_id;
  return jsonb_build_object('bucket',v_old.storage_bucket,'main',v_old.storage_path,'mobile',v_old.mobile_storage_path);
end $$;

create function public.admin_remove_product_image(p_id uuid,p_expected_updated_at timestamptz)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_product public.products%rowtype; v_old public.product_images%rowtype;
begin
  if coalesce(private.current_admin_role(),'') not in ('owner','editor') then raise exception using errcode='42501',message='admin_required'; end if;
  perform pg_advisory_xact_lock(130013);
  select * into v_product from public.products where id=p_id for update;
  if not found then raise exception using errcode='P0002',message='product_missing'; end if;
  if p_expected_updated_at is null or v_product.updated_at<>p_expected_updated_at then raise exception using errcode='40001',message='product_changed'; end if;
  if v_product.published then raise exception using errcode='22023',message='unpublish_before_image_removal'; end if;
  select * into v_old from public.product_images where product_id=p_id and is_primary for update;
  delete from public.product_images where id=v_old.id;
  update public.products set updated_at=clock_timestamp() where id=p_id;
  return jsonb_build_object('bucket',v_old.storage_bucket,'main',v_old.storage_path,'mobile',v_old.mobile_storage_path);
end $$;
revoke all on function public.admin_set_product_image(uuid,text,text,text,text,timestamptz) from public,anon,authenticated;
revoke all on function public.admin_remove_product_image(uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.admin_set_product_image(uuid,text,text,text,text,timestamptz) to authenticated;
grant execute on function public.admin_remove_product_image(uuid,timestamptz) to authenticated;
commit;
