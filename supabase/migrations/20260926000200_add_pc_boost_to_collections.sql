begin;

insert into public.collection_products (collection_id, product_id, sort_order) values
  ((select id from public.collections where slug = 'setup-rosa'), (select id from public.products where slug = 'keycap-patinha-de-gato'), 4),
  ((select id from public.collections where slug = 'setup-rosa'), (select id from public.products where slug = 'headset-gamer-rosa'), 5),
  ((select id from public.collections where slug = 'setup-minimalista'), (select id from public.products where slug = 'soundbar-gamer-rgb'), 4),
  ((select id from public.collections where slug = 'setup-minimalista'), (select id from public.products where slug = 'mouse-sem-fio-attack-shark'), 5),
  ((select id from public.collections where slug = 'setup-minimalista'), (select id from public.products where slug = 'teclado-mecanico-rgb-branco'), 6),
  ((select id from public.collections where slug = 'home-office-feminino'), (select id from public.products where slug = 'keycap-patinha-de-gato'), 4),
  ((select id from public.collections where slug = 'home-office-feminino'), (select id from public.products where slug = 'headset-gamer-rosa'), 5),
  ((select id from public.collections where slug = 'home-office-feminino'), (select id from public.products where slug = 'mouse-sem-fio-attack-shark'), 6),
  ((select id from public.collections where slug = 'home-office-feminino'), (select id from public.products where slug = 'teclado-mecanico-rgb-branco'), 7)
on conflict (collection_id, product_id) do update set sort_order = excluded.sort_order;

commit;
