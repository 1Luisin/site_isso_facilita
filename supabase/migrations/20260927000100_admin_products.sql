begin;
-- Removing membership is editorial editing, not deleting the collection/product.
alter policy collection_products_admin_delete on public.collection_products
  using ((select private.current_admin_role()) in ('owner','editor'));

create function public.admin_save_product(
  p_id uuid, p_name text, p_slug text, p_description text,
  p_category_id uuid, p_published boolean, p_affiliate_url text,
  p_collection_ids uuid[], p_expected_updated_at timestamptz
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid := p_id;
  v_old public.products%rowtype;
  v_link public.product_affiliate_links%rowtype;
  v_collection uuid;
  v_order integer;
begin
  if coalesce(private.current_admin_role(),'') not in ('owner','editor') then
    raise exception using errcode='42501', message='admin_required';
  end if;
  -- Serialize this small editorial operation, including membership ordering.
  perform pg_advisory_xact_lock(130013);
  if p_name is null or char_length(btrim(p_name)) not between 1 and 160
    or p_slug is null or char_length(p_slug) > 160 or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    or char_length(coalesce(p_description,'')) > 4000 or p_published is null
    or p_category_id is null or p_collection_ids is null
    or cardinality(p_collection_ids) > 100 or array_position(p_collection_ids,null) is not null then
    raise exception using errcode='22023', message='invalid_fields';
  end if;
  if not exists(select 1 from public.categories where id=p_category_id) then
    raise exception using errcode='22023', message='category_missing';
  end if;
  if exists(select 1 from unnest(p_collection_ids) c where not exists(select 1 from public.collections where id=c)) then
    raise exception using errcode='22023', message='collection_missing';
  end if;
  p_affiliate_url := nullif(btrim(p_affiliate_url),'');
  if p_affiliate_url is not null and (
    char_length(p_affiliate_url)>2048 or p_affiliate_url !~ '^https://(s\.)?shopee\.com\.br/[^[:space:]?#][^[:space:]]*$'
  ) then raise exception using errcode='22023', message='invalid_affiliate'; end if;
  if v_id is null then
    if p_published then raise exception using errcode='22023', message='create_draft_first'; end if;
    insert into public.products(name,slug,description,category_id,published)
      values(btrim(p_name),p_slug,nullif(btrim(p_description),''),p_category_id,false) returning id into v_id;
  else
    select * into v_old from public.products where id=v_id for update;
    if not found then raise exception using errcode='P0002', message='product_missing'; end if;
    if p_expected_updated_at is null or v_old.updated_at <> p_expected_updated_at then
      raise exception using errcode='40001', message='product_changed';
    end if;
  end if;
  -- Do not leave a published content with no public products (snapshot invariant).
  if not p_published and exists (
    select 1 from public.content_products cp join public.contents c on c.id=cp.content_id
    where cp.product_id=v_id and c.published and not exists (
      select 1 from public.content_products other join public.products p on p.id=other.product_id
      join public.categories cat on cat.id=p.category_id
      where other.content_id=c.id and p.id<>v_id and p.published and cat.active
    )
  ) then raise exception using errcode='22023', message='last_content_product'; end if;
  select * into v_link from public.product_affiliate_links where product_id=v_id and active and is_primary for update;
  if v_link.url is distinct from p_affiliate_url then
    update public.product_affiliate_links set active=false,is_primary=false where product_id=v_id and active and is_primary;
    if p_affiliate_url is not null then
      insert into public.product_affiliate_links(product_id,platform,url,active,is_primary)
        values(v_id,'shopee',p_affiliate_url,true,true);
    end if;
  end if;
  if p_published then
    if not exists(select 1 from public.categories where id=p_category_id and active) then
      raise exception using errcode='22023', message='category_inactive'; end if;
    if not exists(select 1 from public.product_images where product_id=v_id and is_primary) then
      raise exception using errcode='22023', message='image_required'; end if;
    if not exists(select 1 from public.product_affiliate_links where product_id=v_id and is_primary and active) then
      raise exception using errcode='22023', message='affiliate_required'; end if;
  end if;
  -- Lock collections consistently before allocating append positions.
  perform id from public.collections where id=any(p_collection_ids) order by id for update;
  delete from public.collection_products where product_id=v_id and not(collection_id=any(p_collection_ids));
  for v_collection in select distinct unnest(p_collection_ids) order by 1 loop
    if not exists(select 1 from public.collection_products where product_id=v_id and collection_id=v_collection) then
      select coalesce(max(sort_order),-1)+1 into v_order from public.collection_products where collection_id=v_collection;
      insert into public.collection_products(collection_id,product_id,sort_order) values(v_collection,v_id,v_order);
    end if;
  end loop;
  update public.products set name=btrim(p_name),slug=p_slug,description=nullif(btrim(p_description),''),
    category_id=p_category_id,published=p_published,
    published_at=case when p_published then coalesce(published_at,now()) else published_at end
    where id=v_id;
  return v_id;
end $$;
revoke all on function public.admin_save_product(uuid,text,text,text,uuid,boolean,text,uuid[],timestamptz) from public,anon,authenticated;
grant execute on function public.admin_save_product(uuid,text,text,text,uuid,boolean,text,uuid[],timestamptz) to authenticated;

create function public.admin_delete_product(p_id uuid, p_expected_updated_at timestamptz)
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_old public.products%rowtype;
begin
  if coalesce(private.current_admin_role(),'') <> 'owner' then
    raise exception using errcode='42501', message='owner_required'; end if;
  perform pg_advisory_xact_lock(130013);
  select * into v_old from public.products where id=p_id for update;
  if not found then raise exception using errcode='P0002', message='product_missing'; end if;
  if p_expected_updated_at is null or v_old.updated_at<>p_expected_updated_at then
    raise exception using errcode='40001', message='product_changed'; end if;
  if exists(select 1 from public.content_products cp join public.contents c on c.id=cp.content_id
    where cp.product_id=p_id and c.published and not exists(
      select 1 from public.content_products o join public.products p on p.id=o.product_id
      join public.categories cat on cat.id=p.category_id
      where o.content_id=c.id and p.id<>p_id and p.published and cat.active
    )) then raise exception using errcode='22023', message='last_content_product'; end if;
  delete from public.products where id=p_id;
  return p_id;
end $$;
revoke all on function public.admin_delete_product(uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.admin_delete_product(uuid,timestamptz) to authenticated;
commit;
