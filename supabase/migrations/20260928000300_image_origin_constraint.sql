begin;
-- CHECK accepts SQL NULL: choose the origin branch explicitly so a NULL bucket
-- cannot mask an invalid legacy path through three-valued OR logic.
alter table public.product_images drop constraint product_image_origin;
alter table public.product_images add constraint product_image_origin check ((case
  when storage_bucket is null then
    storage_path ~ '^/products/[a-zA-Z0-9_-]+\.(webp|png|jpe?g)$'
    and (mobile_storage_path is null or mobile_storage_path ~ '^/products/[a-zA-Z0-9_-]+\.(webp|png|jpe?g)$')
  else storage_bucket='catalog-media' and mobile_storage_path is not null
    and storage_path ~ ('^products/' || product_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/main\.webp$')
    and mobile_storage_path=replace(storage_path,'/main.webp','/mobile.webp')
  end) is true);
alter table public.product_images add constraint product_image_alt_length check (char_length(alt_text)<=300);
commit;
