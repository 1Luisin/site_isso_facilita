begin;
alter table public.categories alter column active set default false;
alter table public.categories add constraint categories_order_unique unique(sort_order) deferrable initially deferred;
alter table public.collections add constraint collections_order_unique unique(sort_order) deferrable initially deferred;
alter table public.collections add constraint collection_style_supported check(style_index between 0 and 3 and style_index is not null);
alter table public.collections alter column style_index set default 0;

create function private.guard_category_active() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if not new.active and exists(select 1 from public.products where category_id=new.id and published) then
  raise exception using errcode='22023',message='category_has_published_products'; end if;
 return new;
end $$;
revoke all on function private.guard_category_active() from public;
create trigger category_active_guard before update on public.categories for each row execute function private.guard_category_active();

-- Final transaction state: covers collection edits and later product unpublication/deletion.
create function private.check_collection_visibility() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if exists(select 1 from public.collections c where c.published and not exists(
   select 1 from public.collection_products cp join public.products p on p.id=cp.product_id
   join public.categories cat on cat.id=p.category_id where cp.collection_id=c.id and p.published and cat.active)) then
  raise exception using errcode='22023',message='collection_public_product_required'; end if;
 return null;
end $$;
revoke all on function private.check_collection_visibility() from public;
create constraint trigger collection_visibility after insert or update on public.collections deferrable initially deferred for each row execute function private.check_collection_visibility();
create constraint trigger collection_membership_visibility after insert or update or delete on public.collection_products deferrable initially deferred for each row execute function private.check_collection_visibility();
create constraint trigger collection_product_visibility after update or delete on public.products deferrable initially deferred for each row execute function private.check_collection_visibility();

create function private.place_editorial_group(p_kind text,p_id uuid,p_position integer) returns void language plpgsql security invoker set search_path='' as $$
declare v_ids uuid[];
begin
 if coalesce(private.current_admin_role(),'') not in ('owner','editor') then raise exception using errcode='42501',message='admin_required'; end if;
 if p_position is null or p_position<0 or p_kind not in ('category','collection') or p_kind is null then raise exception using errcode='22023',message='invalid_order'; end if;
 perform pg_advisory_xact_lock(130013);
 if p_kind='category' then select coalesce(array_agg(id order by sort_order,id),'{}') into v_ids from public.categories where id<>p_id;
 else select coalesce(array_agg(id order by sort_order,id),'{}') into v_ids from public.collections where id<>p_id; end if;
 p_position:=least(p_position,cardinality(v_ids));
 v_ids:=coalesce(v_ids[1:p_position],'{}')||array[p_id]||coalesce(v_ids[p_position+1:cardinality(v_ids)],'{}');
 if p_kind='category' then update public.categories c set sort_order=(x.n-1)::integer from unnest(v_ids) with ordinality x(id,n) where c.id=x.id and c.sort_order<>(x.n-1);
 else update public.collections c set sort_order=(x.n-1)::integer from unnest(v_ids) with ordinality x(id,n) where c.id=x.id and c.sort_order<>(x.n-1); end if;
end $$;
revoke all on function private.place_editorial_group(text,uuid,integer) from public;
grant execute on function private.place_editorial_group(text,uuid,integer) to authenticated;

create function public.admin_save_category(p_id uuid,p_name text,p_slug text,p_symbol text,p_description text,p_active boolean,p_sort_order integer,p_expected_updated_at timestamptz)
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid:=p_id; v_old public.categories%rowtype;
begin
 if coalesce(private.current_admin_role(),'') not in ('owner','editor') then raise exception using errcode='42501',message='admin_required'; end if;
 perform pg_advisory_xact_lock(130013);
 if p_name is null or length(btrim(p_name)) not between 1 and 160 or p_slug is null or length(p_slug)>160 or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  or length(coalesce(p_symbol,''))>12 or length(coalesce(p_description,''))>4000 or p_active is null or p_sort_order is null or p_sort_order<0 then
  raise exception using errcode='22023',message='invalid_category'; end if;
 if v_id is null then
  if p_active then raise exception using errcode='22023',message='create_inactive_first'; end if;
  insert into public.categories(name,slug,symbol,description,active,sort_order) values(btrim(p_name),p_slug,nullif(btrim(p_symbol),''),nullif(btrim(p_description),''),false,p_sort_order) returning id into v_id;
 else
  select * into v_old from public.categories where id=v_id for update;
  if not found then raise exception using errcode='P0002',message='group_missing'; end if;
  if p_expected_updated_at is null or v_old.updated_at<>p_expected_updated_at then raise exception using errcode='40001',message='group_changed'; end if;
  update public.categories set name=btrim(p_name),slug=p_slug,symbol=nullif(btrim(p_symbol),''),description=nullif(btrim(p_description),''),active=p_active where id=v_id;
 end if;
 perform private.place_editorial_group('category',v_id,p_sort_order);
 return v_id;
end $$;

create function public.admin_save_collection(p_id uuid,p_name text,p_slug text,p_description text,p_style integer,p_sort_order integer,p_published boolean,p_products uuid[],p_expected_updated_at timestamptz)
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid:=p_id;v_old public.collections%rowtype;
begin
 if coalesce(private.current_admin_role(),'') not in ('owner','editor') then raise exception using errcode='42501',message='admin_required'; end if;
 perform pg_advisory_xact_lock(130013);
 if p_name is null or length(btrim(p_name)) not between 1 and 160 or p_slug is null or length(p_slug)>160 or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  or length(coalesce(p_description,''))>4000 or p_style is null or p_style not between 0 and 3 or p_sort_order is null or p_sort_order<0 or p_published is null
  or p_products is null or cardinality(p_products)>100 or array_position(p_products,null) is not null or cardinality(p_products)<>(select count(distinct id) from unnest(p_products) id) then
  raise exception using errcode='22023',message='invalid_collection'; end if;
 if exists(select 1 from unnest(p_products) ids(product_id) where not exists(select 1 from public.products p where p.id=ids.product_id)) then raise exception using errcode='22023',message='group_product_missing'; end if;
 if v_id is null then
  if p_published then raise exception using errcode='22023',message='create_draft_first'; end if;
  insert into public.collections(name,slug,description,style_index,sort_order,published) values(btrim(p_name),p_slug,nullif(btrim(p_description),''),p_style,p_sort_order,false) returning id into v_id;
 else
  select * into v_old from public.collections where id=v_id for update;
  if not found then raise exception using errcode='P0002',message='group_missing'; end if;
  if p_expected_updated_at is null or v_old.updated_at<>p_expected_updated_at then raise exception using errcode='40001',message='group_changed'; end if;
 end if;
 perform id from public.products where id=any(p_products) order by id for share;
 if p_published and not exists(select 1 from public.products p join public.categories c on c.id=p.category_id where p.id=any(p_products) and p.published and c.active) then
  raise exception using errcode='22023',message='collection_public_product_required'; end if;
 delete from public.collection_products where collection_id=v_id;
 insert into public.collection_products(collection_id,product_id,sort_order) select v_id,x,(n-1)::integer from unnest(p_products) with ordinality a(x,n);
 update public.collections set name=btrim(p_name),slug=p_slug,description=nullif(btrim(p_description),''),style_index=p_style,published=p_published,
  published_at=case when p_published then coalesce(published_at,now()) else published_at end where id=v_id;
 perform private.place_editorial_group('collection',v_id,p_sort_order);
 return v_id;
end $$;

create function public.admin_delete_editorial_group(p_kind text,p_id uuid,p_expected_updated_at timestamptz) returns uuid language plpgsql security invoker set search_path='' as $$
declare v_stamp timestamptz;
begin
 if coalesce(private.current_admin_role(),'')<>'owner' then raise exception using errcode='42501',message='owner_required'; end if;
 perform pg_advisory_xact_lock(130013);
 if p_kind='category' then select updated_at into v_stamp from public.categories where id=p_id for update;
 elsif p_kind='collection' then select updated_at into v_stamp from public.collections where id=p_id for update;
 else raise exception using errcode='22023',message='invalid_group'; end if;
 if v_stamp is null then raise exception using errcode='P0002',message='group_missing'; end if;
 if p_expected_updated_at is null or v_stamp<>p_expected_updated_at then raise exception using errcode='40001',message='group_changed'; end if;
 if p_kind='category' then
  if exists(select 1 from public.products where category_id=p_id) then raise exception using errcode='23503',message='category_has_products'; end if;
  delete from public.categories where id=p_id;
 else delete from public.collections where id=p_id; end if;
 return p_id;
end $$;

create function public.admin_reorder_editorial_groups(p_kind text,p_ids uuid[],p_versions timestamptz[]) returns boolean language plpgsql security invoker set search_path='' as $$
declare v_count integer;
begin
 if coalesce(private.current_admin_role(),'') not in ('owner','editor') then raise exception using errcode='42501',message='admin_required'; end if;
 perform pg_advisory_xact_lock(130013);
 if p_ids is null or p_versions is null or cardinality(p_ids)<>cardinality(p_versions) or cardinality(p_ids)<>(select count(distinct id) from unnest(p_ids) id)
  or array_position(p_ids,null) is not null or array_position(p_versions,null) is not null then raise exception using errcode='22023',message='invalid_order'; end if;
 if p_kind='category' then
  perform id from public.categories order by id for update;
  select count(*) into v_count from public.categories;
  if v_count<>cardinality(p_ids) or exists(select 1 from unnest(p_ids,p_versions) x(id,stamp) left join public.categories c on c.id=x.id where c.id is null or c.updated_at<>x.stamp) then raise exception using errcode='40001',message='group_changed'; end if;
  update public.categories c set sort_order=(x.n-1)::integer from unnest(p_ids) with ordinality x(id,n) where c.id=x.id and c.sort_order<>x.n-1;
 elsif p_kind='collection' then
  perform id from public.collections order by id for update;
  select count(*) into v_count from public.collections;
  if v_count<>cardinality(p_ids) or exists(select 1 from unnest(p_ids,p_versions) x(id,stamp) left join public.collections c on c.id=x.id where c.id is null or c.updated_at<>x.stamp) then raise exception using errcode='40001',message='group_changed'; end if;
  update public.collections c set sort_order=(x.n-1)::integer from unnest(p_ids) with ordinality x(id,n) where c.id=x.id and c.sort_order<>x.n-1;
 else raise exception using errcode='22023',message='invalid_group'; end if;
 return true;
end $$;
revoke all on function public.admin_save_category(uuid,text,text,text,text,boolean,integer,timestamptz),public.admin_save_collection(uuid,text,text,text,integer,integer,boolean,uuid[],timestamptz),public.admin_delete_editorial_group(text,uuid,timestamptz),public.admin_reorder_editorial_groups(text,uuid[],timestamptz[]) from public,anon,authenticated;
grant execute on function public.admin_save_category(uuid,text,text,text,text,boolean,integer,timestamptz),public.admin_save_collection(uuid,text,text,text,integer,integer,boolean,uuid[],timestamptz),public.admin_delete_editorial_group(text,uuid,timestamptz),public.admin_reorder_editorial_groups(text,uuid[],timestamptz[]) to authenticated;
commit;
