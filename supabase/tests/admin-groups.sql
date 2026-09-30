begin;
create function pg_temp.check_group(ok boolean,label text) returns void language plpgsql as $$ begin
if ok is distinct from true then raise exception 'Group test failed: %',label;end if;end $$;
do $$ begin
execute format('grant usage on schema %I to authenticated,anon',pg_my_temp_schema()::regnamespace);
if (select count(*) from public.admin_profiles where role='owner' and active)<>1 then raise exception 'Expected one owner';end if;
perform set_config('request.jwt.claim.sub',(select user_id::text from public.admin_profiles where role='owner' and active),true);
end $$;
create function pg_temp.exercise_groups(is_owner boolean) returns void language plpgsql security invoker as $$
declare cat uuid; col uuid; prod uuid; visible uuid[]; draft uuid; stamp timestamptz; first_published timestamptz; ids uuid[]; versions timestamptz[]; n integer;
begin
cat:=public.admin_save_category(null,'Fixture categoria','fixture-cat-'||gen_random_uuid(),'✿','',false,0,null);
perform pg_temp.check_group((select not active and sort_order=0 from public.categories where id=cat),'inactive creation and insertion order');
select updated_at into stamp from public.categories where id=cat;
begin perform public.admin_save_category(null,'Duplicada',(select slug from public.categories where id=cat),'','',false,0,null);raise exception 'Duplicate category slug accepted';exception when unique_violation then null;end;
begin perform public.admin_save_category(cat,'Bad','UPPER','','',false,0,stamp);raise exception 'Bad slug allowed';exception when invalid_parameter_value then null;end;
begin perform public.admin_save_category(cat,'Bad','valid','','',false,-1,stamp);raise exception 'Negative order allowed';exception when invalid_parameter_value then null;end;
begin perform public.admin_save_category(cat,'Bad','valid','','',false,0,stamp-interval '1 minute');raise exception 'Stale category allowed';exception when serialization_failure then null;end;
perform public.admin_save_category(cat,'Fixture categoria editada',(select slug from public.categories where id=cat),'♡','Descrição',true,99,stamp);
select array_agg(id order by sort_order desc),array_agg(updated_at order by sort_order desc) into ids,versions from public.categories;
perform public.admin_reorder_editorial_groups('category',ids,versions);
perform pg_temp.check_group((select id=ids[1] from public.categories where sort_order=0),'category reorder');
begin perform public.admin_reorder_editorial_groups('category',ids[1:1],versions[1:1]);raise exception 'Partial order allowed';exception when serialization_failure then null;end;
insert into public.products(name,slug,category_id,published) values('Fixture category dependency','fixture-product-'||gen_random_uuid(),cat,true) returning id into prod;
begin perform public.admin_save_category(cat,'Fixture',(select slug from public.categories where id=cat),'','',false,0,(select updated_at from public.categories where id=cat));raise exception 'Category with published product disabled';exception when invalid_parameter_value then null;end;
if is_owner then begin perform public.admin_delete_editorial_group('category',cat,(select updated_at from public.categories where id=cat));raise exception 'Category dependency deleted';exception when foreign_key_violation then null;end;
else begin perform public.admin_delete_editorial_group('category',cat,(select updated_at from public.categories where id=cat));raise exception 'Editor deleted category';exception when insufficient_privilege then null;end;end if;
update public.products set published=false where id=prod;
perform public.admin_save_category(cat,'Fixture',(select slug from public.categories where id=cat),'','',false,0,(select updated_at from public.categories where id=cat));
select array_agg(id order by id) into visible from (select id from public.products where published limit 2) q;
draft:=prod;
col:=public.admin_save_collection(null,'Fixture coleção','fixture-col-'||gen_random_uuid(),'Descrição',3,0,false,array[visible[1],visible[2],draft],null);
select updated_at into stamp from public.collections where id=col;
begin perform public.admin_save_collection(null,'Duplicada',(select slug from public.collections where id=col),'',0,0,false,array[]::uuid[],null);raise exception 'Duplicate collection slug accepted';exception when unique_violation then null;end;
begin perform public.admin_save_collection(col,'Fixture',(select slug from public.collections where id=col),'',4,0,false,visible,stamp);raise exception 'Bad style allowed';exception when invalid_parameter_value then null;end;
begin perform public.admin_save_collection(col,'Fixture',(select slug from public.collections where id=col),'',0,0,true,array[draft],stamp);raise exception 'Empty published collection';exception when invalid_parameter_value then null;end;
perform public.admin_save_collection(col,'Fixture editada',(select slug from public.collections where id=col),'Nova descrição',1,0,true,array[visible[2],draft,visible[1]],stamp);
set constraints all immediate;set constraints all deferred;
perform pg_temp.check_group((select product_id=visible[2] from public.collection_products where collection_id=col and sort_order=0),'membership ordering');
select published_at into first_published from public.collections where id=col;
begin
 delete from public.collection_products where collection_id=col and product_id=any(visible);
 set constraints all immediate;
 raise exception 'Direct removal left collection empty';
exception when invalid_parameter_value then null;end;
set constraints all deferred;
-- Product unpublication must also respect a collection's last visible product.
perform public.admin_save_collection(col,'Fixture editada',(select slug from public.collections where id=col),'',1,0,true,array[visible[1]],(select updated_at from public.collections where id=col));
begin
 update public.products set published=false where id=visible[1];
 set constraints all immediate;
 raise exception 'Last visible product unpublished';
exception when invalid_parameter_value then null;end;
set constraints all deferred;
select array_agg(id order by sort_order desc),array_agg(updated_at order by sort_order desc) into ids,versions from public.collections;
perform public.admin_reorder_editorial_groups('collection',ids,versions);
perform pg_temp.check_group((select id=ids[1] from public.collections where sort_order=0),'collection reorder');
perform public.admin_save_collection(col,'Fixture editada',(select slug from public.collections where id=col),'',2,0,false,array[]::uuid[],(select updated_at from public.collections where id=col));
perform pg_temp.check_group((select published_at=first_published from public.collections where id=col),'published date retained');
if is_owner then
 perform public.admin_delete_editorial_group('collection',col,(select updated_at from public.collections where id=col));
 delete from public.products where id=prod;
 perform public.admin_delete_editorial_group('category',cat,(select updated_at from public.categories where id=cat));
else
 begin perform public.admin_delete_editorial_group('collection',col,(select updated_at from public.collections where id=col));raise exception 'Editor deleted collection';exception when insufficient_privilege then null;end;
 delete from public.categories where id=cat;get diagnostics n=row_count;perform pg_temp.check_group(n=0,'editor direct category delete denied');
 delete from public.collections where id=col;get diagnostics n=row_count;perform pg_temp.check_group(n=0,'editor direct collection delete denied');
end if;
set constraints all immediate;set constraints all deferred;
end $$;
set local role authenticated;select pg_temp.exercise_groups(true);reset role;
savepoint editor_case;
update public.admin_profiles set role='editor' where user_id=auth.uid();
set local role authenticated;select pg_temp.exercise_groups(false);reset role;
rollback to editor_case;
create function pg_temp.denied_groups() returns void language plpgsql security invoker as $$ begin
begin perform public.admin_save_category(null,'Denied','denied','','',false,0,null);raise exception 'Unauthorized category';exception when insufficient_privilege then null;end;
begin perform public.admin_save_collection(null,'Denied','denied','',0,0,false,array[]::uuid[],null);raise exception 'Unauthorized collection';exception when insufficient_privilege then null;end;
end $$;
savepoint inactive_case;update public.admin_profiles set active=false where user_id=auth.uid();
set local role authenticated;select pg_temp.denied_groups();reset role;rollback to inactive_case;
savepoint missing_case;delete from public.admin_profiles where user_id=auth.uid();
set local role authenticated;select pg_temp.denied_groups();reset role;rollback to missing_case;
set local role anon;select pg_temp.denied_groups();reset role;
set constraints all immediate;
select pg_temp.check_group((select count(*)=1 from public.admin_profiles where role='owner' and active),'owner restored');
rollback;
