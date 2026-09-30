# Categorias e coleções no admin

Rotas: `/admin/categorias`, `/novo`, `/<uuid>` e `/admin/colecoes`, `/novo`, `/<uuid>`. O menu habilita todos os quatro módulos editoriais. Listagens têm busca, filtro, contagens reais e ordenação por botões com labels acessíveis. O Dashboard relê as contagens ao voltar.

## Campos e publicação

Categorias: nome e slug obrigatórios, descrição opcional (até 4.000 caracteres), símbolo opcional (até 12 pontos de código Unicode), `active`, `sort_order`. Nome/slug têm limite de 160 caracteres. Slug é lowercase com números/hífens. Sugestão pelo nome pode ser editada. Novas categorias são inativas.

Categoria ativa sem produtos públicos tem rota, mas não aparece na faixa da Home nem no sitemap. Desativar exige não haver produtos publicados; mover/despublicar esses produtos primeiro. Excluir exige owner e ausência de **qualquer** produto; FK `ON DELETE RESTRICT` preservada.

Coleções: nome, slug, descrição, estilo 0–3, posição, publicação e lista ordenada de produtos. Estilos correspondem às quatro classes existentes (`collection-0` até `collection-3`), sem redesign. Novas coleções são rascunho. Publicação exige ao menos um produto publicado em categoria ativa. Rascunhos associados são permitidos, mas RLS/adapter os escondem do visitante. Primeira publicação define `published_at`; despublicar/republicar preserva a data.

Checks diferidos verificam o estado final da transação e impedem deixar coleção publicada sem produto visível, inclusive por remoção de membership, despublicação ou exclusão do último produto público. Nesses casos adicione outro produto publicado ou despublique a coleção primeiro. As regras existentes de conteúdos continuam valendo.

## Transações, ordem e concorrência

RPCs `SECURITY INVOKER`, `search_path=''`, EXECUTE apenas para authenticated:

- `admin_save_category`: campos/ativação/posição.
- `admin_save_collection`: campos, publicação, memberships e ordem dos produtos atomicamente.
- `admin_reorder_editorial_groups`: recebe tipo restrito a category/collection, lista completa de UUIDs e seus `updated_at`; rejeita lista parcial, duplicada ou desatualizada.
- `admin_delete_editorial_group`: owner, controle de versão e FKs.

Não há SQL dinâmico. As operações usam o advisory lock editorial compartilhado com produtos/conteúdos. `updated_at` impede sobrescrever outra aba; reorder também confere inclusão/remoção concorrente de registros.

Posição é baseada em zero; valores acima do tamanho da lista significam final. Salvar posição desloca outros registros e normaliza a sequência, em uma transação. Constraints UNIQUE de `sort_order` são diferidas para permitir trocas sem duplicidade ao commit. Exclusão pode deixar lacuna numérica até a próxima ordenação, sem empates ou ordem indefinida. Para ordenar pela listagem, limpe busca/filtros. Produtos de coleção têm sua própria ordem `collection_products.sort_order`.

## Segurança e atualização pública

Leitura administrativa usa o cliente browser autenticado. Server Actions revalidam JWT com `auth.getUser`, perfil ativo e owner/editor, usam cliente com JWT e deixam RLS decidir. Roles do frontend não autorizam operações. Editor cria/edita/ordena/ativa/publica; apenas owner exclui fisicamente, com confirmação EXCLUIR na ação. Nenhuma gestão de admins ou site_settings foi adicionada.

Somente depois do commit ocorre `updateTag(public-catalog)`. Falha de escrita não invalida. Falha pós-commit de invalidação retorna sucesso com aviso, evitando afirmar rollback inexistente. Snapshot público permanece no servidor, e categorias/coleções respeitam `sort_order`. Home, sitemap e metadata compartilham esse cache.

Rotas públicas continuam `/categoria/<slug>` e `/colecao/<slug>`, com parâmetros novos em runtime. Alteração de slug invalida o anterior; nenhum redirect automático. Descrição editorial da coleção é usada também na página pública. Fonte `static`/data.ts permanece para CI e rollback, sem sincronização reversa do banco.

## Validação e limites

`npm run test:admin` inclui campos, UUIDs, ordem, publicação, mensagens e invalidação. `supabase/tests/admin-groups.sql` usa ROLLBACK para testar owner/editor, inactive/sem perfil/anon, FK, ativação, publicação, ordem, concorrência e último produto público. Fixtures não devem permanecer após testes reais.

Interface limita a seleção a 100 produtos; leitura administrativa atual está adequada ao catálogo pequeno (limite padrão do Data API). Paginação administrativa deverá ser adicionada antes de crescer além desse limite. Não há redirects de slug, imagens novas, tracking, /go, gestão de usuários ou OG dinâmico nesta etapa. Slugs devem ser escolhidos antes de divulgar links externos.

Validação local em 30/09/2026: criação/ativação/edição de slug/desativação/exclusão de categoria e criação/ordenação de produtos/publicação/edição de slug/despublicação/exclusão de coleção foram exercitadas pelo navegador com fixtures descartáveis. Home, sitemap, canonical e título refletiram a coleção sem rebuild. As URLs antigas retornaram o estado `notFound` (em resposta transmitida por streaming, o Next pode manter HTTP 200 e incluir a sinalização 404/noindex). Nenhuma fixture permaneceu: 4 categorias, 4 coleções, 13 produtos, 4 conteúdos e zero cliques; destaque #002 preservado, conforme estado real consultado.

As seis telas foram verificadas em 360, 390, 430 e 1280 px, sem overflow horizontal. O seletor de produtos usa linhas com altura conforme o conteúdo para evitar sobreposição de nomes longos. Coleções legadas podem ter `published_at` nulo: a UI informa data não registrada, sem inventar data histórica.
