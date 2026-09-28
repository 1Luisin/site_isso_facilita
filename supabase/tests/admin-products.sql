-- Manual linked-database test. All fixtures/profile changes are rolled back.
begin;
create function pg_temp.check_ok(ok boolean,label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'Failed: %',label; end if; end $$;
do $$ begin
 execute format('grant usage on schema %I to authenticated',pg_my_temp_schema()::regnamespace);
 if (select count(*) from public.admin_profiles where active and role='owner')<>1 then raise exception 'Expected one active owner'; end if;
 perform set_config('request.jwt.claim.sub',(select user_id::text from public.admin_profiles where active and role='owner'),true);
end $$;
create function pg_temp.exercise_product(can_delete boolean) returns void language plpgsql security invoker as $$
declare p uuid; cat uuid; col uuid; stamp timestamptz; published_stamp timestamptz; n integer; suffix text:=gen_random_uuid()::text;
begin
 select id into cat from public.categories where active limit 1;
 select id into col from public.collections order by id limit 1;
 p:=public.admin_save_product(null,'Fixture','fixture-'||suffix,'Description',cat,false,'https://s.shopee.com.br/test-fixture',array[col],null);
 select updated_at into stamp from public.products where id=p;
 perform pg_temp.check_ok((select not published from public.products where id=p),'created draft');
 begin
  perform public.admin_save_product(p,'Partial update','fixture-'||suffix,'',cat,true,'https://s.shopee.com.br/changed',array[col],stamp);
  raise exception 'Publication without image accepted';
 exception when invalid_parameter_value then null; end;
 perform pg_temp.check_ok((select name='Fixture' from public.products where id=p),'failed save rollback');
 perform pg_temp.check_ok((select count(*)=1 from public.product_affiliate_links where product_id=p),'link rollback');
 insert into public.product_images(product_id,storage_path,is_primary) values(p,'/products/luminaria-de-mesa.webp',true);
 perform public.admin_save_product(p,'Changed','fixture-'||suffix,'New description',cat,true,'https://s.shopee.com.br/changed',array[col],stamp);
 select updated_at,published_at into stamp,published_stamp from public.products where id=p;
 perform pg_temp.check_ok((select published and published_at is not null from public.products where id=p),'published');
 perform pg_temp.check_ok((select count(*)=2 from public.product_affiliate_links where product_id=p),'affiliate history');
 perform pg_temp.check_ok((select count(*)=1 from public.product_affiliate_links where product_id=p and active and is_primary),'one primary');
 perform public.admin_save_product(p,'Changed','fixture-new-'||suffix,'New description',cat,false,'https://s.shopee.com.br/changed',array[]::uuid[],stamp);
 select updated_at into stamp from public.products where id=p;
 perform pg_temp.check_ok((select not published and published_at=published_stamp from public.products where id=p),'unpublished timestamp preserved');
 perform pg_temp.check_ok((select count(*)=0 from public.collection_products where product_id=p),'membership removed');
 if can_delete then
  perform public.admin_delete_product(p,stamp);
  perform pg_temp.check_ok((select count(*)=0 from public.products where id=p),'owner delete');
 else
  begin perform public.admin_delete_product(p,stamp); raise exception 'Editor RPC delete accepted'; exception when insufficient_privilege then null; end;
  delete from public.products where id=p; get diagnostics n=row_count;
  perform pg_temp.check_ok(n=0,'editor direct product delete denied');
  delete from public.collections where id=col; get diagnostics n=row_count;
  perform pg_temp.check_ok(n=0,'editor collection delete denied');
 end if;
end $$;
set local role authenticated;
select pg_temp.check_ok(private.current_admin_role()='owner','owner');
select pg_temp.exercise_product(true);
reset role;
savepoint editor_test;
update public.admin_profiles set role='editor' where user_id=auth.uid();
set local role authenticated;
select pg_temp.check_ok(private.current_admin_role()='editor','editor');
select pg_temp.exercise_product(false);
reset role;
rollback to editor_test;
savepoint inactive_test;
update public.admin_profiles set active=false where user_id=auth.uid();
set local role authenticated;
do $$ declare cat uuid; begin
 select id into cat from public.categories where active limit 1;
 begin perform public.admin_save_product(null,'Denied','denied',null,cat,false,null,array[]::uuid[],null); raise exception 'Inactive write allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback to inactive_test;
savepoint no_profile_test;
delete from public.admin_profiles where user_id=auth.uid();
set local role authenticated;
do $$ declare cat uuid; begin
 select id into cat from public.categories where active limit 1;
 begin perform public.admin_save_product(null,'Denied','denied',null,cat,false,null,array[]::uuid[],null); raise exception 'No-profile write allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback to no_profile_test;
select pg_temp.check_ok((select count(*)=1 from public.admin_profiles where active and role='owner'),'owner restored');
rollback;
