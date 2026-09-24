-- Teste manual do primeiro owner. Requer exatamente um perfil owner ativo.
-- Nunca executado pelo CI; nenhuma identidade é fixada neste arquivo.
-- Todas as alterações, inclusive a simulação de editor/inactive/sem perfil, são revertidas.
begin;
create temporary table admin_test_marker(id integer) on commit drop;
create function pg_temp.assert_ok(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'Falhou: %', label; end if; end $$;
create function pg_temp.expect_denied(statement text) returns void language plpgsql as $$
begin
 begin execute statement;
 exception when insufficient_privilege then return;
 end;
 raise exception 'Escrita inesperadamente permitida';
end $$;
do $$ begin
 execute format('grant usage on schema %I to authenticated',pg_my_temp_schema()::regnamespace);
 perform pg_temp.assert_ok((select count(*)=1 from admin_profiles where role='owner' and active), 'um owner ativo');
 perform set_config('request.jwt.claim.sub',(select user_id::text from admin_profiles where role='owner' and active),true);
end $$;
-- Fixture não visível a outras sessões; removida pelo ROLLBACK final.
insert into outbound_clicks(product_id,page_type) select id,'other' from products order by slug limit 1;
set local role authenticated;
select pg_temp.assert_ok(private.current_admin_role()='owner','papel owner');
select pg_temp.assert_ok((select count(*)=8 from products),'owner vê públicos e rascunhos');
select pg_temp.assert_ok((select count(*)=3 from products where not published),'owner vê 3 rascunhos');
select pg_temp.assert_ok((select count(*)=1 from admin_profiles),'owner lê perfis');
select pg_temp.assert_ok((select count(*)=1 from outbound_clicks),'owner consulta fixture reversível');
select pg_temp.expect_denied('update admin_profiles set role=''editor''');
select pg_temp.expect_denied('delete from admin_profiles');
select pg_temp.expect_denied('insert into admin_profiles(user_id,role) values(auth.uid(),''owner'')');

do $$
declare cat uuid; prod uuid; col uuid; content uuid; affected integer; suffix text := gen_random_uuid()::text;
begin
 insert into categories(slug,name) values('validation-'||suffix,'Teste reversível') returning id into cat;
 insert into products(slug,name,category_id) values('validation-'||suffix,'Teste reversível',cat) returning id into prod;
 insert into collections(slug,name) values('validation-'||suffix,'Teste reversível') returning id into col;
 insert into contents(code,content_type,title) values('99999999911','post','Teste reversível') returning id into content;
 insert into product_affiliate_links(product_id,platform,url) values(prod,'other','https://example.com');
 insert into product_images(product_id,storage_path) values(prod,'/products/validation.webp');
 insert into collection_products(collection_id,product_id) values(col,prod);
 insert into content_products(content_id,product_id) values(content,prod);
 insert into content_links(content_id,platform,url) values(content,'other','https://example.com');
 update products set name='Teste atualizado' where id=prod;
 get diagnostics affected = row_count;
 perform pg_temp.assert_ok(affected=1,'UPDATE editorial');
 update categories set name=name where id=cat;
 update collections set name=name where id=col;
 update contents set title=title where id=content;
 update product_affiliate_links set url=url where product_id=prod;
 update product_images set alt_text='Teste' where product_id=prod;
 update collection_products set sort_order=1 where product_id=prod;
 update content_products set sort_order=1 where product_id=prod;
 update content_links set url=url where content_id=content;
 update site_settings set site_name=site_name;
 get diagnostics affected = row_count;
 perform pg_temp.assert_ok(affected=1,'UPDATE settings');
 delete from products where id=prod;
 get diagnostics affected = row_count;
 perform pg_temp.assert_ok(affected=1,'DELETE editorial');
 delete from collections where id=col; delete from contents where id=content; delete from categories where id=cat;
end $$;

reset role;
savepoint editor_test;
update admin_profiles set role='editor' where user_id=auth.uid();
set local role authenticated;
select pg_temp.assert_ok(private.current_admin_role()='editor','papel editor');
select pg_temp.assert_ok((select count(*)=8 from products),'editor vê rascunhos');
select pg_temp.assert_ok((select count(*)=0 from outbound_clicks),'editor não vê cliques');
select pg_temp.expect_denied('update admin_profiles set role=''owner''');
select pg_temp.expect_denied('delete from admin_profiles');
select pg_temp.expect_denied('insert into admin_profiles(user_id,role) values(auth.uid(),''owner'')');

do $$
declare cat uuid; prod uuid; col uuid; content uuid; affected integer; suffix text := gen_random_uuid()::text;
begin
 insert into categories(slug,name) values('validation-'||suffix,'Teste reversível') returning id into cat;
 insert into products(slug,name,category_id) values('validation-'||suffix,'Teste reversível',cat) returning id into prod;
 insert into collections(slug,name) values('validation-'||suffix,'Teste reversível') returning id into col;
 insert into contents(code,content_type,title) values('99999999911','post','Teste reversível') returning id into content;
 insert into product_affiliate_links(product_id,platform,url) values(prod,'other','https://example.com');
 insert into product_images(product_id,storage_path) values(prod,'/products/validation.webp');
 insert into collection_products(collection_id,product_id) values(col,prod);
 insert into content_products(content_id,product_id) values(content,prod);
 insert into content_links(content_id,platform,url) values(content,'other','https://example.com');
 update products set name='Teste atualizado' where id=prod;
 get diagnostics affected = row_count;
 perform pg_temp.assert_ok(affected=1,'UPDATE editorial');
 update categories set name=name where id=cat;
 update collections set name=name where id=col;
 update contents set title=title where id=content;
 update product_affiliate_links set url=url where product_id=prod;
 update product_images set alt_text='Teste' where product_id=prod;
 update collection_products set sort_order=1 where product_id=prod;
 update content_products set sort_order=1 where product_id=prod;
 update content_links set url=url where content_id=content;
 update site_settings set site_name=site_name;
 get diagnostics affected = row_count;
 perform pg_temp.assert_ok(affected=0,'UPDATE settings');
 delete from products where id=prod;
 get diagnostics affected = row_count;
 perform pg_temp.assert_ok(affected=0,'DELETE editorial');

end $$;

reset role;
rollback to savepoint editor_test;
savepoint inactive_test;
update admin_profiles set active=false where user_id=auth.uid();
set local role authenticated;
select pg_temp.assert_ok(private.current_admin_role() is null,'inactive não é admin');
select pg_temp.assert_ok((select count(*)=5 from products),'inactive vê só públicos');
select pg_temp.expect_denied('insert into categories(slug,name) values(''forbidden'',''Forbidden'')');
with changed as (update products set name=name returning 1) select pg_temp.assert_ok((select count(*)=0 from changed),'inactive sem UPDATE');
reset role;
rollback to savepoint inactive_test;
savepoint missing_profile_test;
delete from admin_profiles where user_id=auth.uid();
set local role authenticated;
select pg_temp.assert_ok(private.current_admin_role() is null,'sem perfil não é admin');
select pg_temp.assert_ok((select count(*)=5 from products),'sem perfil vê só públicos');
select pg_temp.assert_ok((select count(*)=0 from admin_profiles),'sem perfil');
select pg_temp.expect_denied('insert into categories(slug,name) values(''forbidden'',''Forbidden'')');
with changed as (update products set name=name returning 1) select pg_temp.assert_ok((select count(*)=0 from changed),'sem perfil sem UPDATE');
with changed as (delete from products returning 1) select pg_temp.assert_ok((select count(*)=0 from changed),'sem perfil sem DELETE');
reset role;
rollback to savepoint missing_profile_test;
select 'PASS: owner/editor/inactive/sem perfil; todas as alterações serão revertidas' as result;
rollback;
