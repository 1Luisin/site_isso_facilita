begin;
-- Qualify the outer object name: products also has a column named name.
alter policy catalog_media_admin_insert on storage.objects
with check (bucket_id='catalog-media' and private.valid_product_object(name)
  and (select private.current_admin_role()) in ('owner','editor')
  and exists(select 1 from public.products p where p.id::text=split_part(storage.objects.name,'/',2)));
commit;
