begin;
-- Validate the final transaction state, so replacing ordered relationships is atomic
-- while direct Data API writes cannot publish an empty/partially hidden content.
create function private.check_content_publication() returns trigger language plpgsql security invoker set search_path='' as $$
declare v_id uuid; v_other uuid;
begin
 if tg_table_name='contents' then v_id:=new.id;
 elsif tg_op='DELETE' then v_id:=old.content_id;
 else v_id:=new.content_id; if tg_op='UPDATE' then v_other:=old.content_id; end if; end if;
 if exists(select 1 from public.contents c where c.id in(v_id,v_other) and c.published and
   (not exists(select 1 from public.content_products cp where cp.content_id=c.id)
    or exists(select 1 from public.content_products cp join public.products p on p.id=cp.product_id
      where cp.content_id=c.id and not p.published))) then
   raise exception using errcode='22023',message='content_products_unpublished'; end if;
 return null;
end $$;
revoke all on function private.check_content_publication() from public;
create constraint trigger content_publication_check after insert or update on public.contents
deferrable initially deferred for each row execute function private.check_content_publication();
create constraint trigger content_relationship_check after insert or update or delete on public.content_products
deferrable initially deferred for each row execute function private.check_content_publication();
commit;
