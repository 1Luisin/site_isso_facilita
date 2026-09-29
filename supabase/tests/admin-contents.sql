-- Synthetic metadata only, always rolled back; real bytes use the Storage API.
begin;
set local storage.allow_delete_query='true';
create function pg_temp.check_content(ok boolean,label text) returns void language plpgsql as $$ begin
if ok is distinct from true then raise exception 'Content test failed: %',label; end if; end $$;
do $$ begin
execute format('grant usage on schema %I to authenticated,anon',pg_my_temp_schema()::regnamespace);
if (select count(*) from public.admin_profiles where role='owner' and active)<>1 then raise exception 'Expected one owner'; end if;
perform set_config('request.jwt.claim.sub',(select user_id::text from public.admin_profiles where role='owner' and active),true);
end $$;
create function pg_temp.exercise_content(is_owner boolean) returns void language plpgsql security invoker as $$
declare c uuid; p uuid[]; stamp timestamptz; pubstamp timestamptz; main text; mobile text; original uuid; draft uuid; n integer;
begin
select array_agg(id order by id) into p from (select id from public.products where published order by id limit 2) x;
select id into draft from public.products where not published limit 1;
select featured_content_id into original from public.site_settings;
c:=public.admin_save_content(null,case when is_owner then '99999001' else '99999002' end,'short','Fixture content','',false,p,'{"youtube":"https://youtu.be/test"}',null);
perform pg_temp.check_content((select not published from public.contents where id=c),'draft creation');
select updated_at into stamp from public.contents where id=c;
begin perform public.admin_save_content(c,'99999000','short','Fixture','',true,p,'{}',stamp);raise exception 'Published without cover';exception when invalid_parameter_value then null;end;
main:='contents/'||c||'/'||gen_random_uuid()||'/cover.webp';mobile:=replace(main,'/cover.webp','/mobile.webp');
insert into storage.objects(bucket_id,name,metadata) values('catalog-media',main,'{"mimetype":"image/webp","size":100}'),('catalog-media',mobile,'{"mimetype":"image/webp","size":100}');
perform public.admin_set_content_cover(c,'catalog-media',main,mobile,stamp);
select updated_at into stamp from public.contents where id=c;
begin perform public.admin_save_content(c,'99999000','short','Fixture','',true,array[draft],'{}',stamp);raise exception 'Published draft product';exception when invalid_parameter_value then null;end;
perform public.admin_save_content(c,case when is_owner then '99999001' else '99999002' end,'short','Fixture','',true,array[p[2],p[1]],'{"instagram":"https://www.instagram.com/p/test/"}',stamp);
perform pg_temp.check_content((select product_id=p[2] from public.content_products where content_id=c and sort_order=0),'ordering');
perform pg_temp.check_content((select count(*)=1 from public.content_links where content_id=c and platform='instagram'),'links replaced');
set constraints all immediate;
set constraints all deferred;
begin
 delete from public.content_products where content_id=c;
 set constraints all immediate;
 raise exception 'Direct empty published relationship accepted';
exception when invalid_parameter_value then null; end;
set constraints all deferred;
select updated_at,published_at into stamp,pubstamp from public.contents where id=c;
begin perform public.admin_save_content(c,'99999000','short','Fixture','',false,p,'{}',stamp-interval '1 minute');raise exception 'Stale accepted';exception when serialization_failure then null;end;
begin perform public.admin_remove_content_cover(c,stamp);raise exception 'Published cover removed';exception when invalid_parameter_value then null;end;
if is_owner then
 perform public.admin_feature_content(c,stamp,original);
 begin perform public.admin_save_content(c,'99999001','short','Fixture','',false,p,'{}',stamp);raise exception 'Featured unpublished';exception when invalid_parameter_value then null;end;
 begin perform public.admin_delete_content(c,stamp);raise exception 'Featured deleted';exception when invalid_parameter_value then null;end;
 perform public.admin_feature_content(original,(select updated_at from public.contents where id=original),c);
else
 begin perform public.admin_feature_content(c,stamp,original);raise exception 'Editor featured';exception when insufficient_privilege then null;end;
 begin perform public.admin_delete_content(c,stamp);raise exception 'Editor deleted';exception when insufficient_privilege then null;end;
 delete from public.contents where id=c;get diagnostics n=row_count;perform pg_temp.check_content(n=0,'editor direct delete denied');
end if;
perform public.admin_save_content(c,case when is_owner then '99999001' else '99999002' end,'post','Fixture changed','',false,array[p[1]],'{}',stamp);
perform pg_temp.check_content((select published_at=pubstamp from public.contents where id=c),'publication date preserved');
perform pg_temp.check_content((select count(*)=1 from public.content_products where content_id=c),'membership removal');
perform pg_temp.check_content((select count(*)=0 from public.content_links where content_id=c),'link removal');
select updated_at into stamp from public.contents where id=c;
perform public.admin_remove_content_cover(c,stamp);
delete from storage.objects where bucket_id='catalog-media' and name in(main,mobile);get diagnostics n=row_count;perform pg_temp.check_content(n=2,'cleanup');
if is_owner then perform public.admin_delete_content(c,(select updated_at from public.contents where id=c));end if;
begin insert into storage.objects(bucket_id,name) values('catalog-media','contents/'||gen_random_uuid()||'/'||gen_random_uuid()||'/cover.webp');raise exception 'Missing content accepted';exception when insufficient_privilege then null;end;
begin insert into storage.objects(bucket_id,name) values('catalog-media','contents/'||c||'/../cover.webp');raise exception 'Traversal accepted';exception when insufficient_privilege then null;end;
begin insert into storage.objects(bucket_id,name) values('another-bucket','contents/'||c||'/'||gen_random_uuid()||'/cover.webp');raise exception 'Other bucket accepted';exception when insufficient_privilege then null;end;
begin insert into storage.objects(bucket_id,name) values('catalog-media','random/file.webp');raise exception 'Bad prefix accepted';exception when insufficient_privilege then null;end;
end $$;
set local role authenticated;
select pg_temp.exercise_content(true);
reset role;
savepoint editor_case;
update public.admin_profiles set role='editor' where user_id=auth.uid();
set local role authenticated;
select pg_temp.exercise_content(false);
reset role;
rollback to editor_case;
create function pg_temp.denied_content() returns void language plpgsql security invoker as $$
declare c uuid;begin
begin perform public.admin_save_content(null,'99999003','short','Denied','',false,array[]::uuid[],'{}',null);raise exception 'Unauthorized write';exception when insufficient_privilege then null;end;
select id into c from public.contents where published limit 1;
begin insert into storage.objects(bucket_id,name) values('catalog-media','contents/'||c||'/'||gen_random_uuid()||'/cover.webp');raise exception 'Unauthorized upload';exception when insufficient_privilege then null;end;
end $$;
savepoint inactive_case;
update public.admin_profiles set active=false where user_id=auth.uid();
set local role authenticated;select pg_temp.denied_content();reset role;
rollback to inactive_case;
savepoint no_profile_case;
delete from public.admin_profiles where user_id=auth.uid();
set local role authenticated;select pg_temp.denied_content();reset role;
rollback to no_profile_case;
set local role anon;select pg_temp.denied_content();reset role;
select pg_temp.check_content((select count(*)=1 from public.admin_profiles where role='owner' and active),'owner restored');
set constraints all immediate;
rollback;
