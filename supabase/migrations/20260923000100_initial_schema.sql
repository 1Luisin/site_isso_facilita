-- PROPOSTA PARA REVISÃO. Não aplicada. Requer Supabase Auth e seus roles.
-- Executar futuramente como postgres/migration owner, nunca pelo navegador.
-- Nenhum usuário, bucket, segredo ou dado editorial é criado aqui.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (btrim(name) <> ''),
  symbol text,
  description text,
  active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (btrim(name) <> ''),
  description text,
  category_id uuid not null references public.categories(id) on delete restrict,
  published boolean not null default false,
  published_at timestamptz,
  -- Preserva a ordem atual do catálogo, sem depender de UUID ou nome.
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products(category_id);

create table public.product_affiliate_links (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  platform text not null check (platform ~ '^[a-z][a-z0-9_]*$'),
  url text not null check (url ~ '^https://[^[:space:]]+$'),
  is_primary boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, url),
  -- Alvo da FK composta de outbound_clicks: link precisa pertencer ao produto.
  unique (id, product_id)
);
create unique index product_affiliate_one_active_primary
  on public.product_affiliate_links(product_id) where is_primary and active;

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null check (btrim(storage_path) <> ''),
  -- Variante da mesma imagem; não é uma segunda foto da galeria.
  mobile_storage_path text check (btrim(mobile_storage_path) <> ''),
  alt_text text,
  is_primary boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, storage_path)
);
create unique index product_images_one_primary
  on public.product_images(product_id) where is_primary;

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (btrim(name) <> ''),
  description text,
  style_index integer check (style_index >= 0),
  published boolean not null default false,
  published_at timestamptz,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collection_products (
  collection_id uuid not null references public.collections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0 check (sort_order >= 0),
  primary key (collection_id, product_id),
  unique (collection_id, sort_order) deferrable initially immediate
);
create index collection_products_product_idx on public.collection_products(product_id);

create table public.contents (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[0-9]{3,}$'),
  content_type text not null check (content_type in ('carousel', 'video', 'post', 'short')),
  title text not null check (btrim(title) <> ''),
  description text,
  cover_path text check (btrim(cover_path) <> ''),
  mobile_cover_path text check (btrim(mobile_cover_path) <> ''),
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_products (
  content_id uuid not null references public.contents(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0 check (sort_order >= 0),
  primary key (content_id, product_id),
  unique (content_id, sort_order) deferrable initially immediate
);
create index content_products_product_idx on public.content_products(product_id);

create table public.content_links (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents(id) on delete cascade,
  platform text not null check (platform ~ '^[a-z][a-z0-9_]*$'),
  url text not null check (url ~ '^https://[^[:space:]]+$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_id, platform)
);

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  -- UNIQUE + CHECK permitem no máximo uma linha, sem PK sequencial.
  singleton boolean not null default true unique check (singleton),
  site_name text not null check (btrim(site_name) <> ''),
  tagline text,
  instagram_url text check (instagram_url ~ '^https://[^[:space:]]+$'),
  tiktok_url text check (tiktok_url ~ '^https://[^[:space:]]+$'),
  youtube_url text check (youtube_url ~ '^https://[^[:space:]]+$'),
  footer_text text,
  featured_content_id uuid references public.contents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null check (role in ('owner', 'editor')),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.outbound_clicks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  content_id uuid references public.contents(id) on delete restrict,
  affiliate_link_id uuid,
  page_type text not null check (page_type in ('home', 'product', 'content', 'category', 'collection', 'other')),
  utm_source text check (char_length(utm_source) <= 100),
  utm_medium text check (char_length(utm_medium) <= 100),
  utm_campaign text check (char_length(utm_campaign) <= 200),
  created_at timestamptz not null default now(),
  foreign key (affiliate_link_id, product_id)
    references public.product_affiliate_links(id, product_id) on delete restrict
);
create index outbound_clicks_product_time_idx on public.outbound_clicks(product_id, created_at desc);
create index outbound_clicks_content_time_idx on public.outbound_clicks(content_id, created_at desc)
  where content_id is not null;
create index outbound_clicks_link_idx on public.outbound_clicks(affiliate_link_id, product_id)
  where affiliate_link_id is not null;
create index outbound_clicks_time_idx on public.outbound_clicks(created_at);

create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.touch_updated_at() from public, anon, authenticated;

-- Lê somente o papel do chamador. Não recebe user_id arbitrário.
-- Owner da função deve ser postgres; schema private não deve ser exposto na API.
create function private.current_admin_role() returns text
language sql stable security definer set search_path = '' as $$
  select p.role from public.admin_profiles p
  where p.user_id = (select auth.uid()) and p.active;
$$;
revoke all on function private.current_admin_role() from public, anon, authenticated;
grant execute on function private.current_admin_role() to authenticated;

-- As políticas e grants abaixo são a proposta inicial; nada é aplicado pelo CI.

create trigger categories_updated_at before update on public.categories
  for each row execute function private.touch_updated_at();
create trigger products_updated_at before update on public.products
  for each row execute function private.touch_updated_at();
create trigger product_affiliate_links_updated_at before update on public.product_affiliate_links
  for each row execute function private.touch_updated_at();
create trigger product_images_updated_at before update on public.product_images
  for each row execute function private.touch_updated_at();
create trigger collections_updated_at before update on public.collections
  for each row execute function private.touch_updated_at();
create trigger contents_updated_at before update on public.contents
  for each row execute function private.touch_updated_at();
create trigger content_links_updated_at before update on public.content_links
  for each row execute function private.touch_updated_at();
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function private.touch_updated_at();
create trigger admin_profiles_updated_at before update on public.admin_profiles
  for each row execute function private.touch_updated_at();

alter table public.categories enable row level security;
revoke all on public.categories from public, anon, authenticated, service_role;

alter table public.products enable row level security;
revoke all on public.products from public, anon, authenticated, service_role;

alter table public.product_affiliate_links enable row level security;
revoke all on public.product_affiliate_links from public, anon, authenticated, service_role;

alter table public.product_images enable row level security;
revoke all on public.product_images from public, anon, authenticated, service_role;

alter table public.collections enable row level security;
revoke all on public.collections from public, anon, authenticated, service_role;

alter table public.collection_products enable row level security;
revoke all on public.collection_products from public, anon, authenticated, service_role;

alter table public.contents enable row level security;
revoke all on public.contents from public, anon, authenticated, service_role;

alter table public.content_products enable row level security;
revoke all on public.content_products from public, anon, authenticated, service_role;

alter table public.content_links enable row level security;
revoke all on public.content_links from public, anon, authenticated, service_role;

alter table public.site_settings enable row level security;
revoke all on public.site_settings from public, anon, authenticated, service_role;

alter table public.admin_profiles enable row level security;
revoke all on public.admin_profiles from public, anon, authenticated, service_role;

alter table public.outbound_clicks enable row level security;
revoke all on public.outbound_clicks from public, anon, authenticated, service_role;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.categories to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.product_affiliate_links to anon, authenticated;
grant select on public.product_images to anon, authenticated;
grant select on public.collections to anon, authenticated;
grant select on public.collection_products to anon, authenticated;
grant select on public.contents to anon, authenticated;
grant select on public.content_products to anon, authenticated;
grant select on public.content_links to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
create policy categories_admin_select on public.categories for select to authenticated
  using ((select private.current_admin_role()) in ('owner', 'editor'));
create policy categories_admin_insert on public.categories for insert to authenticated
  with check ((select private.current_admin_role()) in ('owner', 'editor'));
create policy categories_admin_update on public.categories for update to authenticated
  using ((select private.current_admin_role()) in ('owner', 'editor')) with check ((select private.current_admin_role()) in ('owner', 'editor'));
create policy categories_admin_delete on public.categories for delete to authenticated
  using ((select private.current_admin_role()) = 'owner');
grant insert, update, delete on public.products to authenticated;
create policy products_admin_select on public.products for select to authenticated
  using ((select private.current_admin_role()) in ('owner', 'editor'));
create policy products_admin_insert on public.products for insert to authenticated
  with check ((select private.current_admin_role()) in ('owner', 'editor'));
create policy products_admin_update on public.products for update to authenticated
  using ((select private.current_admin_role()) in ('owner', 'editor')) with check ((select private.current_admin_role()) in ('owner', 'editor'));
create policy products_admin_delete on public.products for delete to authenticated
  using ((select private.current_admin_role()) = 'owner');
grant insert, update, delete on public.product_affiliate_links to authenticated;
create policy product_affiliate_links_admin_select on public.product_affiliate_links for select to authenticated
  using ((select private.current_admin_role()) in ('owner', 'editor'));
create policy product_affiliate_links_admin_insert on public.product_affiliate_links for insert to authenticated
  with check ((select private.current_admin_role()) in ('owner', 'editor'));
create policy product_affiliate_links_admin_update on public.product_affiliate_links for update to authenticated
  using ((select private.current_admin_role()) in ('owner', 'editor')) with check ((select private.current_admin_role()) in ('owner', 'editor'));
create policy product_affiliate_links_admin_delete on public.product_affiliate_links for delete to authenticated
  using ((select private.current_admin_role()) = 'owner');
grant insert, update, delete on public.product_images to authenticated;
create policy product_images_admin_select on public.product_images for select to authenticated
  using ((select private.current_admin_role()) in ('owner', 'editor'));
create policy product_images_admin_insert on public.product_images for insert to authenticated
  with check ((select private.current_admin_role()) in ('owner', 'editor'));
create policy product_images_admin_update on public.product_images for update to authenticated
  using ((select private.current_admin_role()) in ('owner', 'editor')) with check ((select private.current_admin_role()) in ('owner', 'editor'));
create policy product_images_admin_delete on public.product_images for delete to authenticated
  using ((select private.current_admin_role()) = 'owner');
grant insert, update, delete on public.collections to authenticated;
create policy collections_admin_select on public.collections for select to authenticated
  using ((select private.current_admin_role()) in ('owner', 'editor'));
create policy collections_admin_insert on public.collections for insert to authenticated
  with check ((select private.current_admin_role()) in ('owner', 'editor'));
create policy collections_admin_update on public.collections for update to authenticated
  using ((select private.current_admin_role()) in ('owner', 'editor')) with check ((select private.current_admin_role()) in ('owner', 'editor'));
create policy collections_admin_delete on public.collections for delete to authenticated
  using ((select private.current_admin_role()) = 'owner');
grant insert, update, delete on public.collection_products to authenticated;
create policy collection_products_admin_select on public.collection_products for select to authenticated
  using ((select private.current_admin_role()) in ('owner', 'editor'));
create policy collection_products_admin_insert on public.collection_products for insert to authenticated
  with check ((select private.current_admin_role()) in ('owner', 'editor'));
create policy collection_products_admin_update on public.collection_products for update to authenticated
  using ((select private.current_admin_role()) in ('owner', 'editor')) with check ((select private.current_admin_role()) in ('owner', 'editor'));
create policy collection_products_admin_delete on public.collection_products for delete to authenticated
  using ((select private.current_admin_role()) = 'owner');
grant insert, update, delete on public.contents to authenticated;
create policy contents_admin_select on public.contents for select to authenticated
  using ((select private.current_admin_role()) in ('owner', 'editor'));
create policy contents_admin_insert on public.contents for insert to authenticated
  with check ((select private.current_admin_role()) in ('owner', 'editor'));
create policy contents_admin_update on public.contents for update to authenticated
  using ((select private.current_admin_role()) in ('owner', 'editor')) with check ((select private.current_admin_role()) in ('owner', 'editor'));
create policy contents_admin_delete on public.contents for delete to authenticated
  using ((select private.current_admin_role()) = 'owner');
grant insert, update, delete on public.content_products to authenticated;
create policy content_products_admin_select on public.content_products for select to authenticated
  using ((select private.current_admin_role()) in ('owner', 'editor'));
create policy content_products_admin_insert on public.content_products for insert to authenticated
  with check ((select private.current_admin_role()) in ('owner', 'editor'));
create policy content_products_admin_update on public.content_products for update to authenticated
  using ((select private.current_admin_role()) in ('owner', 'editor')) with check ((select private.current_admin_role()) in ('owner', 'editor'));
create policy content_products_admin_delete on public.content_products for delete to authenticated
  using ((select private.current_admin_role()) = 'owner');
grant insert, update, delete on public.content_links to authenticated;
create policy content_links_admin_select on public.content_links for select to authenticated
  using ((select private.current_admin_role()) in ('owner', 'editor'));
create policy content_links_admin_insert on public.content_links for insert to authenticated
  with check ((select private.current_admin_role()) in ('owner', 'editor'));
create policy content_links_admin_update on public.content_links for update to authenticated
  using ((select private.current_admin_role()) in ('owner', 'editor')) with check ((select private.current_admin_role()) in ('owner', 'editor'));
create policy content_links_admin_delete on public.content_links for delete to authenticated
  using ((select private.current_admin_role()) = 'owner');

create policy categories_public_read on public.categories for select to anon, authenticated
  using (active);

create policy products_public_read on public.products for select to anon, authenticated
  using (published and exists (select 1 from public.categories c where c.id = products.category_id and c.active));

create policy collections_public_read on public.collections for select to anon, authenticated
  using (published);

create policy contents_public_read on public.contents for select to anon, authenticated
  using (published);

create policy product_affiliate_links_public_read on public.product_affiliate_links for select to anon, authenticated
  using (active and exists (select 1 from public.products p where p.id = product_affiliate_links.product_id and p.published));

create policy product_images_public_read on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_images.product_id and p.published));

create policy collection_products_public_read on public.collection_products for select to anon, authenticated
  using (exists (select 1 from public.collections c where c.id = collection_products.collection_id and c.published) and exists (select 1 from public.products p where p.id = collection_products.product_id and p.published));

create policy content_products_public_read on public.content_products for select to anon, authenticated
  using (exists (select 1 from public.contents c where c.id = content_products.content_id and c.published) and exists (select 1 from public.products p where p.id = content_products.product_id and p.published));

create policy content_links_public_read on public.content_links for select to anon, authenticated
  using (exists (select 1 from public.contents c where c.id = content_links.content_id and c.published));

create policy site_settings_public_read on public.site_settings for select to anon, authenticated
  using (featured_content_id is null or exists (select 1 from public.contents c where c.id = site_settings.featured_content_id and c.published));

-- Somente owner edita configurações. Dados públicos, nunca guardar segredos aqui.
grant insert, update, delete on public.site_settings to authenticated;
create policy site_settings_owner_all on public.site_settings for all to authenticated
  using ((select private.current_admin_role()) = 'owner')
  with check ((select private.current_admin_role()) = 'owner');

-- Nenhum INSERT/UPDATE/DELETE de perfis via browser: impede autoelevação de papel.
-- Primeiro owner e mudanças de papel exigem operação privilegiada separada/revisada.
grant select on public.admin_profiles to authenticated;
create policy admin_profiles_read on public.admin_profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select private.current_admin_role()) = 'owner');

-- Cliques: browser não insere, edita nem apaga. Somente owner consulta.
-- API futura deverá validar origem/contexto/UTMs antes de usar service_role.
grant select on public.outbound_clicks to authenticated;
create policy outbound_clicks_owner_read on public.outbound_clicks for select to authenticated
  using ((select private.current_admin_role()) = 'owner');
grant insert on public.outbound_clicks to service_role;
-- Não há policy INSERT para anon/authenticated. service_role possui BYPASSRLS.
-- Retenção/expurgo: operação privilegiada específica, ainda não implementada.

commit;
