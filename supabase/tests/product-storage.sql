-- Transactional policy/constraint test only: synthetic metadata is rolled back.
-- Real file creation/deletion is tested separately through the Storage API.
begin;
-- Simulate the Storage API transaction flag for synthetic metadata only.
-- Every row touched below was created in this transaction; ROLLBACK removes all.
set local storage.allow_delete_query='true';
create function pg_temp.check_media(ok boolean,label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'Storage test failed: %',label; end if; end $$;
do $$ begin
 execute format('grant usage on schema %I to authenticated,anon',pg_my_temp_schema()::regnamespace);
 if (select count(*) from public.admin_profiles where active and role='owner')<>1 then raise exception 'Expected one owner'; end if;
 perform set_config('request.jwt.claim.sub',(select user_id::text from public.admin_profiles where active and role='owner'),true);
end $$;
create function pg_temp.exercise_media() returns void language plpgsql security invoker as $$
declare p uuid; stamp timestamptz; main text; mobile text; second_main text; second_mobile text; n integer;
begin
 p:=public.admin_save_product(null,'Fixture Storage','fixture-storage-'||gen_random_uuid()::text,'',
   (select id from public.categories where active limit 1),false,'https://s.shopee.com.br/test-fixture',array[]::uuid[],null);
 select updated_at into stamp from public.products where id=p;
 begin
  insert into public.product_images(product_id,storage_path,is_primary) values(p,'https://other.example.com/image.webp',true);
  raise exception 'External legacy URL accepted';
 exception when check_violation then null; end;
 insert into public.product_images(product_id,storage_path,is_primary,sort_order)
   values(p,'/products/luminaria-de-mesa.webp',true,7);
 main:='products/'||p||'/'||gen_random_uuid()||'/main.webp'; mobile:=replace(main,'/main.webp','/mobile.webp');
 insert into storage.objects(bucket_id,name,metadata) values('catalog-media',main,'{"mimetype":"image/webp","size":100}');
 update storage.objects set metadata='{"mimetype":"image/webp","size":101}' where bucket_id='catalog-media' and name=main; get diagnostics n=row_count;
 perform pg_temp.check_media(n=0,'overwrite denied');
 begin
  perform public.admin_set_product_image(p,'catalog-media',main,mobile,'',stamp);
  raise exception 'Incomplete upload accepted';
 exception when invalid_parameter_value then null; end;
 perform pg_temp.check_media((select storage_bucket is null from public.product_images where product_id=p),'failed replacement preserves legacy');
 insert into storage.objects(bucket_id,name,metadata) values('catalog-media',mobile,'{"mimetype":"image/webp","size":100}');
 perform public.admin_set_product_image(p,'catalog-media',main,mobile,'',stamp);
 perform pg_temp.check_media((select alt_text='Fixture Storage' from public.product_images where product_id=p),'alt defaults to product name');
 begin
  perform public.admin_set_product_image(p,'catalog-media',main,mobile,'Alt',stamp-interval '1 minute');
  raise exception 'Stale association accepted';
 exception when serialization_failure then null; end;
 perform pg_temp.check_media((select count(*)=1 from public.product_images where product_id=p and is_primary),'one primary');
 perform pg_temp.check_media((select sort_order=7 from public.product_images where product_id=p),'legacy ordering preserved');
 delete from storage.objects where bucket_id='catalog-media' and name=main; get diagnostics n=row_count;
 perform pg_temp.check_media(n=0,'referenced object deletion blocked');
 second_main:='products/'||p||'/'||gen_random_uuid()||'/main.webp'; second_mobile:=replace(second_main,'/main.webp','/mobile.webp');
 insert into storage.objects(bucket_id,name,metadata) values('catalog-media',second_main,'{"mimetype":"image/webp","size":100}'),('catalog-media',second_mobile,'{"mimetype":"image/webp","size":100}');
 select updated_at into stamp from public.products where id=p;
 perform public.admin_set_product_image(p,'catalog-media',second_main,second_mobile,'Alt test',stamp);
 delete from storage.objects where bucket_id='catalog-media' and name in(main,mobile); get diagnostics n=row_count;
 perform pg_temp.check_media(n=2,'old pair cleanup');
 select updated_at into stamp from public.products where id=p;
 perform public.admin_save_product(p,'Fixture Storage',(select slug from public.products where id=p),'',
   (select category_id from public.products where id=p),true,'https://s.shopee.com.br/test-fixture',array[]::uuid[],stamp);
 select updated_at into stamp from public.products where id=p;
 begin perform public.admin_remove_product_image(p,stamp); raise exception 'Published removal allowed'; exception when invalid_parameter_value then null; end;
 delete from public.product_images where product_id=p; get diagnostics n=row_count;
 perform pg_temp.check_media(n=0,'direct removal of published image denied');
 perform public.admin_save_product(p,'Fixture Storage',(select slug from public.products where id=p),'',
   (select category_id from public.products where id=p),false,'https://s.shopee.com.br/test-fixture',array[]::uuid[],stamp);
 select updated_at into stamp from public.products where id=p;
 perform public.admin_remove_product_image(p,stamp);
 delete from storage.objects where bucket_id='catalog-media' and name in(second_main,second_mobile); get diagnostics n=row_count;
 perform pg_temp.check_media(n=2,'draft image cleanup');
 begin insert into storage.objects(bucket_id,name) values('catalog-media','contents/'||p||'/main.webp'); raise exception 'Invalid prefix accepted'; exception when insufficient_privilege then null; end;
 begin insert into storage.objects(bucket_id,name) values('catalog-media','products/'||gen_random_uuid()||'/'||gen_random_uuid()||'/main.webp'); raise exception 'Missing product accepted'; exception when insufficient_privilege then null; end;
end $$;
set local role authenticated;
select pg_temp.exercise_media();
reset role;
savepoint editor_case;
update public.admin_profiles set role='editor' where user_id=auth.uid();
set local role authenticated;
select pg_temp.exercise_media();
reset role;
rollback to editor_case;
create function pg_temp.denied_media() returns void language plpgsql security invoker as $$
declare p uuid; begin
 select id into p from public.products where published limit 1;
 begin insert into storage.objects(bucket_id,name) values('catalog-media','products/'||p||'/'||gen_random_uuid()||'/main.webp'); raise exception 'Unauthorized upload accepted'; exception when insufficient_privilege then null; end;
end $$;
savepoint inactive_case;
update public.admin_profiles set active=false where user_id=auth.uid();
set local role authenticated;
select pg_temp.denied_media();
reset role;
rollback to inactive_case;
savepoint missing_profile_case;
delete from public.admin_profiles where user_id=auth.uid();
set local role authenticated;
select pg_temp.denied_media();
reset role;
rollback to missing_profile_case;
set local role anon;
select pg_temp.denied_media();
reset role;
select pg_temp.check_media((select count(*)=1 from public.admin_profiles where role='owner' and active),'owner restored');
rollback;
