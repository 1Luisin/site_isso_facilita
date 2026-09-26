begin;

insert into public.products
  (slug, name, description, category_id, published, published_at, sort_order)
values
  ('keycap-patinha-de-gato', 'Keycap patinha de gato', 'Keycap decorativa em formato de patinha de gato para deixar o teclado mais fofo e com a sua personalidade. Confira no anúncio as opções e a compatibilidade.', (select id from public.categories where slug = 'setup'), true, now(), 8),
  ('headset-gamer-rosa', 'Headset gamer rosa', 'Headset gamer rosa com microfone e iluminação para completar o setup. Consulte no anúncio as conexões e os recursos da versão escolhida.', (select id from public.categories where slug = 'eletronicos'), true, now(), 9),
  ('soundbar-gamer-rgb', 'Soundbar gamer RGB', 'Soundbar compacta com iluminação RGB para levar som e cor ao setup sem ocupar muito espaço. Confira no anúncio as formas de conexão.', (select id from public.categories where slug = 'eletronicos'), true, now(), 10),
  ('mouse-sem-fio-attack-shark', 'Mouse sem fio Attack Shark com dock', 'Mouse sem fio branco da Attack Shark com base de carregamento iluminada. Consulte no anúncio as especificações e os itens incluídos.', (select id from public.categories where slug = 'setup'), true, now(), 11),
  ('teclado-mecanico-rgb-branco', 'Teclado mecânico RGB branco', 'Teclado mecânico branco com iluminação RGB e controle giratório para dar um toque colorido ao setup. Confira no anúncio o layout e as opções disponíveis.', (select id from public.categories where slug = 'setup'), true, now(), 12)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  category_id = excluded.category_id,
  published = excluded.published,
  published_at = coalesce(public.products.published_at, excluded.published_at),
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.product_affiliate_links
  (product_id, platform, url, is_primary, active)
values
  ((select id from public.products where slug = 'keycap-patinha-de-gato'), 'shopee', 'https://s.shopee.com.br/1Lfyc905mR', true, true),
  ((select id from public.products where slug = 'headset-gamer-rosa'), 'shopee', 'https://s.shopee.com.br/5LC7NqOqaS', true, true),
  ((select id from public.products where slug = 'soundbar-gamer-rgb'), 'shopee', 'https://s.shopee.com.br/905Pl37pvZ', true, true),
  ((select id from public.products where slug = 'mouse-sem-fio-attack-shark'), 'shopee', 'https://s.shopee.com.br/2LYVpWoAQt', true, true),
  ((select id from public.products where slug = 'teclado-mecanico-rgb-branco'), 'shopee', 'https://s.shopee.com.br/8V99CNFFu1', true, true)
on conflict (product_id, url) do update set
  is_primary = excluded.is_primary,
  active = excluded.active,
  updated_at = now();

insert into public.product_images
  (product_id, storage_path, mobile_storage_path, alt_text, is_primary, sort_order)
values
  ((select id from public.products where slug = 'keycap-patinha-de-gato'), '/products/keycap-patinha-de-gato.webp', '/products/keycap-patinha-de-gato-480.webp', 'Keycap patinha de gato', true, 0),
  ((select id from public.products where slug = 'headset-gamer-rosa'), '/products/headset-gamer-rosa.webp', '/products/headset-gamer-rosa-480.webp', 'Headset gamer rosa', true, 0),
  ((select id from public.products where slug = 'soundbar-gamer-rgb'), '/products/soundbar-gamer-rgb.webp', '/products/soundbar-gamer-rgb-480.webp', 'Soundbar gamer RGB', true, 0),
  ((select id from public.products where slug = 'mouse-sem-fio-attack-shark'), '/products/mouse-sem-fio-attack-shark.webp', '/products/mouse-sem-fio-attack-shark-480.webp', 'Mouse sem fio Attack Shark com dock', true, 0),
  ((select id from public.products where slug = 'teclado-mecanico-rgb-branco'), '/products/teclado-mecanico-rgb-branco.webp', '/products/teclado-mecanico-rgb-branco-480.webp', 'Teclado mecânico RGB branco', true, 0)
on conflict (product_id, storage_path) do update set
  mobile_storage_path = excluded.mobile_storage_path,
  alt_text = excluded.alt_text,
  is_primary = excluded.is_primary,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.contents
  (code, content_type, title, description, cover_path, mobile_cover_path, published, published_at)
values
  ('004', 'video', '5 achados pra dar um boost no seu PC', 'Cinco achadinhos para deixar o seu setup mais bonito, divertido e completo.', '/videos/video-004.webp', '/videos/video-004-540.webp', true, now())
on conflict (code) do update set
  content_type = excluded.content_type,
  title = excluded.title,
  description = excluded.description,
  cover_path = excluded.cover_path,
  mobile_cover_path = excluded.mobile_cover_path,
  published = excluded.published,
  published_at = coalesce(public.contents.published_at, excluded.published_at),
  updated_at = now();

insert into public.content_products (content_id, product_id, sort_order) values
  ((select id from public.contents where code = '004'), (select id from public.products where slug = 'keycap-patinha-de-gato'), 0),
  ((select id from public.contents where code = '004'), (select id from public.products where slug = 'headset-gamer-rosa'), 1),
  ((select id from public.contents where code = '004'), (select id from public.products where slug = 'soundbar-gamer-rgb'), 2),
  ((select id from public.contents where code = '004'), (select id from public.products where slug = 'mouse-sem-fio-attack-shark'), 3),
  ((select id from public.contents where code = '004'), (select id from public.products where slug = 'teclado-mecanico-rgb-branco'), 4)
on conflict (content_id, product_id) do update set sort_order = excluded.sort_order;

insert into public.content_links (content_id, platform, url) values
  ((select id from public.contents where code = '004'), 'instagram', 'https://www.instagram.com/p/DdxMO4YmLGs/?utm_source=ig_web_copy_link&stkn=MzRlODBiNWFlZA==')
on conflict (content_id, platform) do update set url = excluded.url, updated_at = now();

update public.site_settings
set featured_content_id = (select id from public.contents where code = '004'),
    updated_at = now()
where singleton;

commit;
