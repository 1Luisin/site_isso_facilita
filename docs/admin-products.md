> Atualização Etapa 14: upload, substituição e remoção de imagens agora estão disponíveis. Veja [product-storage.md](product-storage.md). Os limites de Storage descritos abaixo registram o estado histórico da Etapa 13.

# Produtos administrativos — Etapa 13

## Rotas e acesso

`/admin/produtos` lista publicados e rascunhos, com busca e filtro.
`/admin/produtos/novo` cria somente rascunhos; `/admin/produtos/[id]` edita por UUID.
URLs públicas continuam usando slugs. Todas as rotas admin herdam noindex/nofollow,
ficam fora do sitemap e não pré-renderizam dados administrativos.

Leituras usam o cliente browser existente com sessão e RLS. A navegação Produtos
está habilitada; conteúdos, categorias e coleções permanecem em breve. O dashboard
consulta contagens novamente ao ser aberto, sem cache público de dados admin.

## Escrita e segurança

Componentes não fazem INSERT/UPDATE/DELETE. As Server Actions `saveProduct` e
`deleteProduct` recebem o access token da sessão de forma programática e temporária.
Não existe hidden input de JWT, log, cookie server-side ou persistência manual.
`authenticatedAdmin` valida `auth.getUser(jwt)` contra Auth e consulta o próprio
perfil via JWT, exigindo active e owner/editor. Não confia em metadata/role do browser.
O cliente Data API usa publishable key e o JWT do usuário, sem persistir/renovar sessão.
Timeout de 20s, fetch sem cache, mesma origem e redirects bloqueados.

Não há secret/service key nem nova variável. Preservar SUPABASE_URL/key no servidor
e NEXT_PUBLIC_SUPABASE_URL/key no browser. As variáveis reais continuam fora do Git.
A publicação pública exige `SITE_DATA_SOURCE=supabase`; static continua uma fonte
local independente, útil para CI/rollback, e não reflete edição do banco.

## Transação e permissões

Migration `20260927000100_admin_products.sql`: duas RPCs específicas,
`admin_save_product` e `admin_delete_product`, SECURITY INVOKER, search_path vazio,
EXECUTE somente authenticated. Nenhuma função de SQL genérico ou bypass de RLS.
Produto, link e vínculos são salvos numa única transação. Falha reverte tudo.
Um advisory lock transacional serializa essas pequenas operações; coleções também
são bloqueadas em ordem antes de calcular max(sort_order)+1. Vínculos mantidos
preservam a ordem; vínculos novos são anexados deterministicamente.
`updated_at` esperado impede sobrescrever silenciosamente uma edição concorrente.

Owner/editor criam, editam, publicam, despublicam e alteram vínculos. Apenas a policy
DELETE de collection_products foi ampliada para editor: remover vínculo é edição.
DELETE de products/collections/contents/categories continua owner-only. Perfis,
settings e cliques mantêm suas permissões anteriores. Exclusão exige owner na Action
e RPC, além de RLS, e confirmação EXCLUIR na interface. FKs de histórico são respeitadas.

## Regras editoriais

Nome obrigatório (até 160), slug lowercase com hífens (até 160), descrição até 4000,
UUIDs de categoria/coleções existentes, boolean real e URL HTTPS específica Shopee.
Não aceita URL genérica da loja. Validação acontece no servidor e novamente na RPC.
A RPC não publica um produto na criação. Publicação exige categoria ativa, imagem
principal e afiliado primário ativo. A Action também confere imagens no manifesto
local. Upload e edição de caminhos técnicos não estão disponíveis.

Na troca de URL, o link anterior fica inativo e deixa de ser primário; um novo link
Shopee é criado, preservando histórico. Não há alteração de links reais em testes.
`published_at` recebe now somente na primeira publicação e permanece ao despublicar.
Remover/despublicar o último produto público de um conteúdo publicado é bloqueado:
isso evita quebrar o snapshot público, que exige conteúdos com produtos.

## Cache e UI

Após sucesso confirmado da RPC (commit), a Action chama
`updateTag(PUBLIC_CATALOG_TAG)`. Falha da mutation não invalida o cache.
O próximo acesso ao servidor espera o snapshot atualizado, incluindo metadata e
sitemap. Uma aba pública já aberta não recebe push; precisa navegar/atualizar.
Após salvar, o admin relê os dados e updated_at e mostra feedback.
Se a invalidação falhar após commit, informa que o produto foi salvo, mas a atualização
pública não foi confirmada. Não afirma que o banco foi revertido nesse caso.

Troca de slug não cria redirecionamento: endereço antigo retorna notFound e o novo
funciona em runtime. OG usa fallback genérico quando falta arquivo específico;
um arquivo específico existente pode continuar com texto antigo. OG dinâmico fica
para etapa própria. Novos produtos sem imagem permanecem rascunhos até a etapa Storage.

## Validação

`npm run test:admin` cobre autorização, validação e invalidação após sucesso/falha.
`supabase/tests/admin-products.sql` testa owner/editor/inactive/sem perfil, publicação,
histórico de links, remoção de vínculo e proibição de DELETE para editor. Executar
manualmente pela CLI ligada ao projeto; todas as fixtures e alterações de perfil são
revertidas por ROLLBACK. Nenhum e-mail ou UUID pessoal fica no script.

`node --conditions=react-server scripts/test-products-runtime.mjs` exige um build
Supabase prévio e executa Server Actions reais num servidor local com Auth/Data API
simulados por preload de teste. Confere nome, descrição, slug, CTA, fallback OG,
falha de mutation e despublicação imediata sem esperar o TTL. Não acessa banco real.
Depois desse teste, gere um novo build antes de publicar: não publique seu cache de fixture.

As tipagens foram geradas pela CLI; p_id/p_expected_updated_at de criação possuem
anotação nullable explícita, pois o gerador não representa NULL em argumentos RPC.
A migration inicial aplicada nas etapas anteriores não foi modificada.

Nenhum CRUD de conteúdos/categorias/coleções, Storage, upload, /go, tracking, gestão
de admins ou cadastro público faz parte desta etapa.

## Evidências da implantação

Migration aplicada pela CLI 2.117.0 ao projeto vinculado e registrada no histórico.
Antes da aplicação, estrutura + testes rodaram na mesma transação com rollback.
Depois da aplicação, o teste SQL foi repetido: owner/editor, inactive/sem perfil,
atomicidade, histórico do afiliado, publicação/despublicação e vínculos aprovados.
Banco após rollback: 13 produtos (10 públicos), 2 conteúdos públicos, 1 owner ativo,
0 cliques e 0 produtos com o prefixo reservado às fixtures SQL.
O CI agora também executa testes de dados e admin, sem conexão remota ou usuário real.

No navegador, o owner carregou a lista real e a luminária com seus dados intactos.
Criação de rascunho, edição de nome/link e remoção de vínculo foram exercitadas com
uma fixture descartável, sem publicar nem modificar produto real. Publicação ficou
bloqueada por ausência de imagem. Lista, criação e edição foram verificadas em
360/390/430 px e desktop, sem overflow horizontal. A checagem periódica de perfil
mantém o formulário montado durante a consulta para preservar edição não salva;
expiração/troca de sessão ainda suspende acesso e perfil negado remove a tela.

Teste manual final: a fixture foi excluída pela Server Action de owner após confirmação
EXCLUIR, com retorno à listagem. Contagem voltou a 13 produtos (10 publicados e 3
rascunhos), sem fixture, com 1 owner ativo e zero cliques. Nenhum produto real foi
editado. O teste de invalidação com mocks não deixou arquivos/dados no banco real.
