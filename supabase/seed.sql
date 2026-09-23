-- PROPOSTA DE SEED MANUAL, não executada. Estado de src/lib/data.ts em 2026-09-23.
-- Apenas para banco novo/repetição controlada; não é sincronizador de produção.
-- Não altera linhas existentes. Um conflito de ordem após edição aborta a transação.
-- published_at NULL significa data histórica desconhecida (não a data do seed).
-- Sem preços, links placeholder, usuários, cliques simulados ou credenciais.
begin;

insert into public.categories (slug, name, symbol, description, active, sort_order) values
  ('setup', 'Setup', '⌘', 'Um cantinho com a sua personalidade.', true, 0),
  ('eletronicos', 'Eletrônicos', 'ϟ', 'Pequenas tecnologias, grandes facilidades.', true, 1),
  ('decoracao', 'Decoração', '✿', 'Detalhes que fazem a casa sorrir.', true, 2),
  ('utilidades', 'Utilidades', '◇', 'Mais praticidade para os seus dias.', true, 3)
on conflict (slug) do nothing;

insert into public.products (slug, name, description, category_id, published, published_at, sort_order) values
  ('luminaria-de-mesa', 'Luminária Hello Kitty', 'Uma luminária decorativa da Hello Kitty para deixar o seu cantinho mais aconchegante.', (select id from public.categories where slug = 'decoracao'), true, null, 0),
  ('mousepad', 'Mousepad xadrez com flores', 'Mousepad com estampa xadrez e flores para dar um toque de cor à sua mesa.', (select id from public.categories where slug = 'setup'), true, null, 1),
  ('fita-led', 'Fita LED RGB HiGooGoo com app e controle', 'Fita LED RGB com ajuste de cores, brilho e efeitos pelo aplicativo ou controle remoto. Possui verso adesivo e opções de comprimento. Confira no anúncio o tamanho e a alimentação da versão escolhida.', (select id from public.categories where slug = 'eletronicos'), true, null, 2),
  ('bonequinho-decorativo', 'Bonequinho decorativo Kuromi', 'Bonequinho da Kuromi em estilo de blocos para decorar a mesa ou a estante.', (select id from public.categories where slug = 'decoracao'), true, null, 3),
  ('suporte-de-fone', 'Suporte para fone Hello Kitty', 'Suporte com visual da Hello Kitty para organizar seu fone e decorar a mesa. Confira os itens incluídos no anúncio.', (select id from public.categories where slug = 'setup'), true, null, 4),
  ('organizador-de-cabos', 'Organizador de cabos', 'Pequenos organizadores para manter cada cabo no seu lugar e simplificar o dia.', (select id from public.categories where slug = 'utilidades'), false, null, 5),
  ('suporte-para-notebook', 'Suporte para notebook', 'Eleve seu notebook e organize o espaço de trabalho com um apoio discreto.', (select id from public.categories where slug = 'setup'), false, null, 6),
  ('hub-usb', 'Hub USB compacto', 'Mais conexões em um acessório compacto para acompanhar sua rotina.', (select id from public.categories where slug = 'eletronicos'), false, null, 7)
on conflict (slug) do nothing;

insert into public.collections (slug, name, style_index, published, sort_order) values
  ('setup-rosa', 'Setup rosa', 0, true, 0),
  ('setup-minimalista', 'Setup minimalista', 1, true, 1),
  ('achadinhos-ate-30', 'Achadinhos até R$30', 2, false, 2),
  ('home-office-feminino', 'Home office feminino', 3, true, 3)
on conflict (slug) do nothing;

insert into public.collection_products (collection_id, product_id, sort_order) values
  ((select id from public.collections where slug = 'setup-rosa'), (select id from public.products where slug = 'luminaria-de-mesa'), 0),
  ((select id from public.collections where slug = 'setup-rosa'), (select id from public.products where slug = 'mousepad'), 1),
  ((select id from public.collections where slug = 'setup-rosa'), (select id from public.products where slug = 'fita-led'), 2),
  ((select id from public.collections where slug = 'setup-rosa'), (select id from public.products where slug = 'bonequinho-decorativo'), 3),
  ((select id from public.collections where slug = 'setup-minimalista'), (select id from public.products where slug = 'suporte-de-fone'), 0),
  ((select id from public.collections where slug = 'setup-minimalista'), (select id from public.products where slug = 'organizador-de-cabos'), 1),
  ((select id from public.collections where slug = 'setup-minimalista'), (select id from public.products where slug = 'suporte-para-notebook'), 2),
  ((select id from public.collections where slug = 'setup-minimalista'), (select id from public.products where slug = 'hub-usb'), 3),
  ((select id from public.collections where slug = 'achadinhos-ate-30'), (select id from public.products where slug = 'mousepad'), 0),
  ((select id from public.collections where slug = 'achadinhos-ate-30'), (select id from public.products where slug = 'fita-led'), 1),
  ((select id from public.collections where slug = 'achadinhos-ate-30'), (select id from public.products where slug = 'bonequinho-decorativo'), 2),
  ((select id from public.collections where slug = 'achadinhos-ate-30'), (select id from public.products where slug = 'suporte-de-fone'), 3),
  ((select id from public.collections where slug = 'achadinhos-ate-30'), (select id from public.products where slug = 'organizador-de-cabos'), 4),
  ((select id from public.collections where slug = 'achadinhos-ate-30'), (select id from public.products where slug = 'hub-usb'), 5),
  ((select id from public.collections where slug = 'home-office-feminino'), (select id from public.products where slug = 'luminaria-de-mesa'), 0),
  ((select id from public.collections where slug = 'home-office-feminino'), (select id from public.products where slug = 'mousepad'), 1),
  ((select id from public.collections where slug = 'home-office-feminino'), (select id from public.products where slug = 'organizador-de-cabos'), 2),
  ((select id from public.collections where slug = 'home-office-feminino'), (select id from public.products where slug = 'suporte-para-notebook'), 3)
on conflict (collection_id, product_id) do nothing;

-- #002/#003 usam post como classificação genérica provisória, a revisar antes de publicar.
insert into public.contents (code, content_type, title, description, cover_path, mobile_cover_path, published, published_at) values
  ('001', 'carousel', 'Um setup rosa para chamar de seu', 'Os detalhes fofos do nosso primeiro carrossel, reunidos em um só lugar.', '/videos/carrossel-001.webp', '/videos/carrossel-001-540.webp', true, null),
  ('002', 'post', 'Mesa organizada, mente leve', 'Pequenas facilidades para um home office mais gostoso.', null, null, false, null),
  ('003', 'post', 'Pequenos mimos para o seu setup', 'Uma seleção de achadinhos para renovar os detalhes.', null, null, false, null)
on conflict (code) do nothing;

insert into public.content_products (content_id, product_id, sort_order) values
  ((select id from public.contents where code = '001'), (select id from public.products where slug = 'luminaria-de-mesa'), 0),
  ((select id from public.contents where code = '001'), (select id from public.products where slug = 'mousepad'), 1),
  ((select id from public.contents where code = '001'), (select id from public.products where slug = 'fita-led'), 2),
  ((select id from public.contents where code = '001'), (select id from public.products where slug = 'bonequinho-decorativo'), 3),
  ((select id from public.contents where code = '001'), (select id from public.products where slug = 'suporte-de-fone'), 4),
  ((select id from public.contents where code = '002'), (select id from public.products where slug = 'organizador-de-cabos'), 0),
  ((select id from public.contents where code = '002'), (select id from public.products where slug = 'suporte-para-notebook'), 1),
  ((select id from public.contents where code = '002'), (select id from public.products where slug = 'hub-usb'), 2),
  ((select id from public.contents where code = '003'), (select id from public.products where slug = 'mousepad'), 0),
  ((select id from public.contents where code = '003'), (select id from public.products where slug = 'bonequinho-decorativo'), 1),
  ((select id from public.contents where code = '003'), (select id from public.products where slug = 'luminaria-de-mesa'), 2),
  ((select id from public.contents where code = '003'), (select id from public.products where slug = 'fita-led'), 3)
on conflict (content_id, product_id) do nothing;

insert into public.content_links (content_id, platform, url) values
  ((select id from public.contents where code = '001'), 'instagram', 'https://www.instagram.com/p/Ddcj01vGOxd/?img_index=1'),
  ((select id from public.contents where code = '001'), 'tiktok', 'https://www.tiktok.com/@issofacilita1/photo/7687007054258539783')
on conflict (content_id, platform) do nothing;

insert into public.product_affiliate_links (product_id, platform, url, is_primary, active) values
  ((select id from public.products where slug = 'luminaria-de-mesa'), 'shopee', 'https://s.shopee.com.br/20vXQYrNiT', true, true),
  ((select id from public.products where slug = 'mousepad'), 'shopee', 'https://s.shopee.com.br/5LBzOi4p9L', true, true),
  ((select id from public.products where slug = 'fita-led'), 'shopee', 'https://s.shopee.com.br/20vXQWWKS1', true, true),
  ((select id from public.products where slug = 'bonequinho-decorativo'), 'shopee', 'https://s.shopee.com.br/8Kpb1u6gr7', true, true),
  ((select id from public.products where slug = 'suporte-de-fone'), 'shopee', 'https://s.shopee.com.br/1130EnJyH0', true, true)
on conflict (product_id, url) do nothing;

insert into public.product_images (product_id, storage_path, mobile_storage_path, alt_text, is_primary, sort_order) values
  ((select id from public.products where slug = 'luminaria-de-mesa'), '/products/luminaria-de-mesa.webp', '/products/luminaria-de-mesa-480.webp', 'Luminária Hello Kitty', true, 0),
  ((select id from public.products where slug = 'mousepad'), '/products/mousepad.webp', '/products/mousepad-480.webp', 'Mousepad xadrez com flores', true, 0),
  ((select id from public.products where slug = 'fita-led'), '/products/fita-led.webp', '/products/fita-led-480.webp', 'Fita LED RGB HiGooGoo com app e controle', true, 0),
  ((select id from public.products where slug = 'bonequinho-decorativo'), '/products/bonequinho-decorativo.webp', '/products/bonequinho-decorativo-480.webp', 'Bonequinho decorativo Kuromi', true, 0),
  ((select id from public.products where slug = 'suporte-de-fone'), '/products/suporte-de-fone.webp', '/products/suporte-de-fone-480.webp', 'Suporte para fone Hello Kitty', true, 0)
on conflict (product_id, storage_path) do nothing;

insert into public.site_settings (singleton, site_name, tagline, footer_text, featured_content_id) values
  (true, 'Isso Facilita!', 'achadinhos que abraçam a rotina', 'Alguns links podem ser de afiliado e podemos receber comissão pela compra, sem custo adicional para você.', (select id from public.contents where code = '001'))
on conflict (singleton) do nothing;

commit;
