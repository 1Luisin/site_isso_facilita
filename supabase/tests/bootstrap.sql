-- Validação manual do bootstrap; nunca executada pelo CI.
-- Requer conexão privilegiada. Todas as mutações são revertidas.
begin;
create temporary table bootstrap_validation_marker (id integer) on commit drop;
create function pg_temp.assert_ok(ok boolean, label text) returns void
language plpgsql as $$
begin
  if ok is distinct from true then raise exception 'Falhou: %', label; end if;
end;
$$;
create function pg_temp.expect_error(statement text, expected text) returns void
language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if sqlstate = expected then return; end if;
    raise;
  end;
  raise exception 'Era esperado SQLSTATE %: %', expected, statement;
end;
$$;
do $$ begin execute format('grant usage on schema %I to anon, authenticated', pg_my_temp_schema()::regnamespace); end $$;
select pg_temp.assert_ok((select count(*) = 4 from public.categories), 'categories: 4');
select pg_temp.assert_ok((select count(*) = 8 from public.products), 'products: 8');
select pg_temp.assert_ok((select count(*) = 4 from public.collections), 'collections: 4');
select pg_temp.assert_ok((select count(*) = 3 from public.contents), 'contents: 3');
select pg_temp.assert_ok((select count(*) = 18 from public.collection_products), 'collection_products: 18');
select pg_temp.assert_ok((select count(*) = 12 from public.content_products), 'content_products: 12');
select pg_temp.assert_ok((select count(*) = 5 from public.product_affiliate_links), 'product_affiliate_links: 5');
select pg_temp.assert_ok((select count(*) = 5 from public.product_images), 'product_images: 5');
select pg_temp.assert_ok((select count(*) = 2 from public.content_links), 'content_links: 2');
select pg_temp.assert_ok((select count(*) = 1 from public.site_settings), 'site_settings: 1');
select pg_temp.assert_ok((select count(*) = 0 from public.admin_profiles), 'admin_profiles: 0');
select pg_temp.assert_ok((select count(*) = 0 from public.outbound_clicks), 'outbound_clicks: 0');
select pg_temp.assert_ok((select count(*) = 12 from pg_class where relnamespace='public'::regnamespace and relkind='r' and relrowsecurity), 'RLS nas 12 tabelas');
select pg_temp.assert_ok((select count(*) = 9 from pg_trigger where not tgisinternal and tgfoid='private.touch_updated_at()'::regprocedure), '9 triggers');
select pg_temp.assert_ok((select count(*) = 49 from pg_policies where schemaname='public'), '49 policies');
select pg_temp.assert_ok(not exists(select 1 from information_schema.columns where table_schema='public' and column_name like '%price%'), 'sem campos de preço');
select pg_temp.assert_ok((select count(*)=5 from product_affiliate_links where platform='shopee' and url like 'https://s.shopee.com.br/%'), '5 links reais');
select pg_temp.assert_ok(not exists(select 1 from product_affiliate_links l join products p on p.id=l.product_id where not p.published or l.url='https://shopee.com.br/'), 'sem links placeholder/rascunho');

set local role anon;
select pg_temp.assert_ok((select count(*)=4 from public.categories), 'anon: categories');
select pg_temp.assert_ok((select count(*)=5 from public.products), 'anon: products');
select pg_temp.assert_ok((select count(*)=3 from public.collections), 'anon: collections');
select pg_temp.assert_ok((select count(*)=1 from public.contents), 'anon: contents');
select pg_temp.assert_ok((select count(*)=7 from public.collection_products), 'anon: collection_products');
select pg_temp.assert_ok((select count(*)=5 from public.content_products), 'anon: content_products');
select pg_temp.assert_ok((select count(*)=5 from public.product_affiliate_links), 'anon: product_affiliate_links');
select pg_temp.assert_ok((select count(*)=5 from public.product_images), 'anon: product_images');
select pg_temp.assert_ok((select count(*)=2 from public.content_links), 'anon: content_links');
select pg_temp.assert_ok((select count(*)=1 from public.site_settings), 'anon: site_settings');
select pg_temp.expect_error('select * from public.admin_profiles', '42501');
select pg_temp.expect_error('select * from public.outbound_clicks', '42501');
select pg_temp.expect_error('insert into public.categories select (jsonb_populate_record(null::public.categories, to_jsonb(t) || jsonb_build_object(''id'',gen_random_uuid()))).* from public.categories t limit 1', '42501');
select pg_temp.expect_error('update public.categories set name=name', '42501');
select pg_temp.expect_error('delete from public.categories', '42501');
select pg_temp.expect_error('insert into public.products select (jsonb_populate_record(null::public.products, to_jsonb(t) || jsonb_build_object(''id'',gen_random_uuid()))).* from public.products t limit 1', '42501');
select pg_temp.expect_error('update public.products set name=name', '42501');
select pg_temp.expect_error('delete from public.products', '42501');
select pg_temp.expect_error('insert into public.collections select (jsonb_populate_record(null::public.collections, to_jsonb(t) || jsonb_build_object(''id'',gen_random_uuid()))).* from public.collections t limit 1', '42501');
select pg_temp.expect_error('update public.collections set name=name', '42501');
select pg_temp.expect_error('delete from public.collections', '42501');
select pg_temp.expect_error('insert into public.contents select (jsonb_populate_record(null::public.contents, to_jsonb(t) || jsonb_build_object(''id'',gen_random_uuid()))).* from public.contents t limit 1', '42501');
select pg_temp.expect_error('update public.contents set title=title', '42501');
select pg_temp.expect_error('delete from public.contents', '42501');
select pg_temp.expect_error('insert into public.collection_products select (jsonb_populate_record(null::public.collection_products, to_jsonb(t) || jsonb_build_object(''id'',gen_random_uuid()))).* from public.collection_products t limit 1', '42501');
select pg_temp.expect_error('update public.collection_products set sort_order=sort_order', '42501');
select pg_temp.expect_error('delete from public.collection_products', '42501');
select pg_temp.expect_error('insert into public.content_products select (jsonb_populate_record(null::public.content_products, to_jsonb(t) || jsonb_build_object(''id'',gen_random_uuid()))).* from public.content_products t limit 1', '42501');
select pg_temp.expect_error('update public.content_products set sort_order=sort_order', '42501');
select pg_temp.expect_error('delete from public.content_products', '42501');
select pg_temp.expect_error('insert into public.product_affiliate_links select (jsonb_populate_record(null::public.product_affiliate_links, to_jsonb(t) || jsonb_build_object(''id'',gen_random_uuid()))).* from public.product_affiliate_links t limit 1', '42501');
select pg_temp.expect_error('update public.product_affiliate_links set url=url', '42501');
select pg_temp.expect_error('delete from public.product_affiliate_links', '42501');
select pg_temp.expect_error('insert into public.product_images select (jsonb_populate_record(null::public.product_images, to_jsonb(t) || jsonb_build_object(''id'',gen_random_uuid()))).* from public.product_images t limit 1', '42501');
select pg_temp.expect_error('update public.product_images set alt_text=alt_text', '42501');
select pg_temp.expect_error('delete from public.product_images', '42501');
select pg_temp.expect_error('insert into public.content_links select (jsonb_populate_record(null::public.content_links, to_jsonb(t) || jsonb_build_object(''id'',gen_random_uuid()))).* from public.content_links t limit 1', '42501');
select pg_temp.expect_error('update public.content_links set url=url', '42501');
select pg_temp.expect_error('delete from public.content_links', '42501');
select pg_temp.expect_error('insert into public.site_settings select (jsonb_populate_record(null::public.site_settings, to_jsonb(t) || jsonb_build_object(''id'',gen_random_uuid()))).* from public.site_settings t limit 1', '42501');
select pg_temp.expect_error('update public.site_settings set site_name=site_name', '42501');
select pg_temp.expect_error('delete from public.site_settings', '42501');
reset role;

set local role authenticated;
-- Subject temporário de JWT, sem inserir usuário ou perfil.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
select pg_temp.assert_ok(private.current_admin_role() is null, 'sem perfil não é admin');
select pg_temp.assert_ok((select count(*)=4 from public.categories), 'authenticated: categories');
select pg_temp.assert_ok((select count(*)=5 from public.products), 'authenticated: products');
select pg_temp.assert_ok((select count(*)=3 from public.collections), 'authenticated: collections');
select pg_temp.assert_ok((select count(*)=1 from public.contents), 'authenticated: contents');
select pg_temp.assert_ok((select count(*)=7 from public.collection_products), 'authenticated: collection_products');
select pg_temp.assert_ok((select count(*)=5 from public.content_products), 'authenticated: content_products');
select pg_temp.assert_ok((select count(*)=5 from public.product_affiliate_links), 'authenticated: product_affiliate_links');
select pg_temp.assert_ok((select count(*)=5 from public.product_images), 'authenticated: product_images');
select pg_temp.assert_ok((select count(*)=2 from public.content_links), 'authenticated: content_links');
select pg_temp.assert_ok((select count(*)=1 from public.site_settings), 'authenticated: site_settings');
select pg_temp.assert_ok((select count(*)=0 from public.admin_profiles), 'authenticated: admin_profiles oculto');
select pg_temp.assert_ok((select count(*)=0 from public.outbound_clicks), 'authenticated: outbound_clicks oculto');
select pg_temp.expect_error('insert into public.categories select (jsonb_populate_record(null::public.categories, to_jsonb(t) || jsonb_build_object(''id'',gen_random_uuid()))).* from public.categories t limit 1', '42501');
with changed as (update public.categories set name=name returning 1) select pg_temp.assert_ok((select count(*)=0 from changed), 'sem perfil: update categories bloqueado');
with changed as (delete from public.categories returning 1) select pg_temp.assert_ok((select count(*)=0 from changed), 'sem perfil: delete categories bloqueado');
select pg_temp.expect_error('insert into public.products select (jsonb_populate_record(null::public.products, to_jsonb(t) || jsonb_build_object(''id'',gen_random_uuid()))).* from public.products t limit 1', '42501');
with changed as (update public.products set name=name returning 1) select pg_temp.assert_ok((select count(*)=0 from changed), 'sem perfil: update products bloqueado');
with changed as (delete from public.products returning 1) select pg_temp.assert_ok((select count(*)=0 from changed), 'sem perfil: delete products bloqueado');
select pg_temp.expect_error('insert into public.collections select (jsonb_populate_record(null::public.collections, to_jsonb(t) || jsonb_build_object(''id'',gen_random_uuid()))).* from public.collections t limit 1', '42501');
with changed as (update public.collections set name=name returning 1) select pg_temp.assert_ok((select count(*)=0 from changed), 'sem perfil: update collections bloqueado');
with changed as (delete from public.collections returning 1) select pg_temp.assert_ok((select count(*)=0 from changed), 'sem perfil: delete collections bloqueado');
select pg_temp.expect_error('insert into public.contents select (jsonb_populate_record(null::public.contents, to_jsonb(t) || jsonb_build_object(''id'',gen_random_uuid()))).* from public.contents t limit 1', '42501');
with changed as (update public.contents set title=title returning 1) select pg_temp.assert_ok((select count(*)=0 from changed), 'sem perfil: update contents bloqueado');
with changed as (delete from public.contents returning 1) select pg_temp.assert_ok((select count(*)=0 from changed), 'sem perfil: delete contents bloqueado');
select pg_temp.expect_error('insert into public.collection_products select (jsonb_populate_record(null::public.collection_products, to_jsonb(t) || jsonb_build_object(''id'',gen_random_uuid()))).* from public.collection_products t limit 1', '42501');
with changed as (update public.collection_products set sort_order=sort_order returning 1) select pg_temp.assert_ok((select count(*)=0 from changed), 'sem perfil: update collection_products bloqueado');
with changed as (delete from public.collection_products returning 1) select pg_temp.assert_ok((select count(*)=0 from changed), 'sem perfil: delete collection_products bloqueado');
select pg_temp.expect_error('insert into public.content_products select (jsonb_populate_record(null::public.content_products, to_jsonb(t) || jsonb_build_object(''id'',gen_random_uuid()))).* from public.content_products t limit 1', '42501');
with changed as (update public.content_products set sort_order=sort_order returning 1) select pg_temp.assert_ok((select count(*)=0 from changed), 'sem perfil: update content_products bloqueado');
with changed as (delete from public.content_products returning 1) select pg_temp.assert_ok((select count(*)=0 from changed), 'sem perfil: delete content_products bloqueado');
select pg_temp.expect_error('insert into public.product_affiliate_links select (jsonb_populate_record(null::public.product_affiliate_links, to_jsonb(t) || jsonb_build_object(''id'',gen_random_uuid()))).* from public.product_affiliate_links t limit 1', '42501');
with changed as (update public.product_affiliate_links set url=url returning 1) select pg_temp.assert_ok((select count(*)=0 from changed), 'sem perfil: update product_affiliate_links bloqueado');
with changed as (delete from public.product_affiliate_links returning 1) select pg_temp.assert_ok((select count(*)=0 from changed), 'sem perfil: delete product_affiliate_links bloqueado');
select pg_temp.expect_error('insert into public.product_images select (jsonb_populate_record(null::public.product_images, to_jsonb(t) || jsonb_build_object(''id'',gen_random_uuid()))).* from public.product_images t limit 1', '42501');
with changed as (update public.product_images set alt_text=alt_text returning 1) select pg_temp.assert_ok((select count(*)=0 from changed), 'sem perfil: update product_images bloqueado');
with changed as (delete from public.product_images returning 1) select pg_temp.assert_ok((select count(*)=0 from changed), 'sem perfil: delete product_images bloqueado');
select pg_temp.expect_error('insert into public.content_links select (jsonb_populate_record(null::public.content_links, to_jsonb(t) || jsonb_build_object(''id'',gen_random_uuid()))).* from public.content_links t limit 1', '42501');
with changed as (update public.content_links set url=url returning 1) select pg_temp.assert_ok((select count(*)=0 from changed), 'sem perfil: update content_links bloqueado');
with changed as (delete from public.content_links returning 1) select pg_temp.assert_ok((select count(*)=0 from changed), 'sem perfil: delete content_links bloqueado');
select pg_temp.expect_error('insert into public.site_settings select (jsonb_populate_record(null::public.site_settings, to_jsonb(t) || jsonb_build_object(''id'',gen_random_uuid()))).* from public.site_settings t limit 1', '42501');
with changed as (update public.site_settings set site_name=site_name returning 1) select pg_temp.assert_ok((select count(*)=0 from changed), 'sem perfil: update site_settings bloqueado');
with changed as (delete from public.site_settings returning 1) select pg_temp.assert_ok((select count(*)=0 from changed), 'sem perfil: delete site_settings bloqueado');
reset role;

-- Constraints e efeitos reais de DELETE, sempre desfeitos no ROLLBACK.
select pg_temp.expect_error($q$delete from categories where slug='setup'$q$, '23503');
select pg_temp.expect_error($q$insert into product_affiliate_links(product_id,platform,url,is_primary) select product_id,'shopee','https://example.com/validation',true from product_affiliate_links limit 1$q$, '23505');
select pg_temp.expect_error($q$insert into product_images(product_id,storage_path,is_primary) select product_id,'/validation.webp',true from product_images limit 1$q$, '23505');
select pg_temp.expect_error($q$update collection_products set sort_order=0 where sort_order=1$q$, '23505');
select pg_temp.expect_error($q$update content_products set sort_order=0 where sort_order=1$q$, '23505');
select pg_temp.expect_error($q$insert into site_settings(site_name) values('validation')$q$, '23505');
do $$
declare old_time timestamptz; new_time timestamptz;
begin
 select updated_at into old_time from products where slug='luminaria-de-mesa';
 update products set name=name where slug='luminaria-de-mesa' returning updated_at into new_time;
 perform pg_temp.assert_ok(new_time > old_time, 'updated_at atualizado de verdade');
end;
$$;
savepoint clicks_test;
insert into outbound_clicks(product_id,content_id,affiliate_link_id,page_type)
select l.product_id,c.id,l.id,'content' from product_affiliate_links l cross join contents c
where c.code='001' limit 1;
select pg_temp.expect_error($q$delete from products where id=(select product_id from outbound_clicks limit 1)$q$, '23503');
select pg_temp.expect_error($q$delete from contents where code='001'$q$, '23503');
select pg_temp.expect_error($q$delete from product_affiliate_links where id=(select affiliate_link_id from outbound_clicks limit 1)$q$, '23503');
select pg_temp.expect_error($q$insert into outbound_clicks(product_id,affiliate_link_id,page_type) select p.id,l.id,'home' from products p cross join product_affiliate_links l where p.id<>l.product_id limit 1$q$, '23503');
rollback to savepoint clicks_test;
savepoint cascades_test;
delete from collections where slug='setup-rosa';
select pg_temp.assert_ok((select count(*)=14 from collection_products), 'cascade coleção');
delete from contents where code='001';
select pg_temp.assert_ok((select count(*)=7 from content_products), 'cascade conteúdo produtos');
select pg_temp.assert_ok((select count(*)=0 from content_links), 'cascade conteúdo links');
select pg_temp.assert_ok((select featured_content_id is null from site_settings), 'SET NULL destaque');
rollback to savepoint cascades_test;
savepoint product_delete;
delete from products where slug='luminaria-de-mesa';
select pg_temp.assert_ok((select count(*)=4 from product_images), 'cascade imagens');
select pg_temp.assert_ok((select count(*)=4 from product_affiliate_links), 'cascade links afiliados');
select pg_temp.assert_ok((select count(*)=16 from collection_products), 'cascade relações coleção');
select pg_temp.assert_ok((select count(*)=10 from content_products), 'cascade relações conteúdo');
rollback to savepoint product_delete;
select 'PASS: contagens, RLS anon/authenticated, constraints, cascades, histórico e updated_at; alterações revertidas' as result;
rollback;
