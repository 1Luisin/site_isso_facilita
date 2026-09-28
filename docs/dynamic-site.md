> Atualização Etapa 13: as Server Actions do CRUD de produtos já invalidam public-catalog após commit; veja [admin-products.md](admin-products.md). Os itens de invalidação futura abaixo registram a decisão da Etapa 12.

# Catálogo dinâmico/cacheado — Etapa 12

Antes: Supabase → build → HTML exportado → usuário.
Agora: Supabase → servidor Next.js → cache editorial → usuário.

## Cache e fonte

`output: "export"` foi removido. `cacheComponents: true` habilita o modelo Next 16.
`getPublicCatalogSnapshot()` usa `"use cache"`, `cacheLife("catalog")` e
`cacheTag(PUBLIC_CATALOG_TAG)` (`public-catalog`). O loader seleciona o adapter e
valida o snapshot a cada recarga. Não existe Promise global ou memoização permanente.
Home, layout/settings, páginas, metadata e sitemap compartilham esse snapshot.

Perfil em segundos: `stale: 30`, `revalidate: 300`, `expire: 86400`.
Stale controla o cache de navegação do cliente. Após 300 segundos, uma solicitação
pode servir a versão anterior enquanto renova em segundo plano; não é um cron.
Após a expiração, a leitura precisa aguardar dados novos. O cache padrão é gerido
pelo Next/plataforma, sem Redis ou garantia de persistência entre instâncias/deploys.
Falhas não mudam de fonte silenciosamente; erros públicos são seguros e não imprimem
headers/keys. Conteúdo válido anterior pode continuar servido conforme o cache Next.

`SITE_DATA_SOURCE=static` (padrão/CI) significa dados editoriais locais de `data.ts`,
não exportação estática. `supabase` utiliza `SUPABASE_URL` e
`SUPABASE_PUBLISHABLE_KEY` no servidor, no build e runtime. O transporte nativo fetch
usa `cache: "no-store"` internamente para não criar um segundo cache HTTP independente
da tag editorial. Aceita somente GET na origem configurada, com timeout de 20s e redirects bloqueados.
Sem sessão administrativa, as consultas continuam sujeitas à RLS anon. Nenhuma
secret/service key é aceita. O catálogo não consulta Supabase no browser; Auth/admin
continuam usando seu cliente separado e as duas variáveis `NEXT_PUBLIC_SUPABASE_*`.

## Rotas e metadata

`generateStaticParams` apenas pré-renderiza os itens conhecidos. Não existe
`dynamicParams=false`. Loading boundaries permitem resolver parâmetros desconhecidos
no servidor sem rebuild. Produto, conteúdo ou coleção ausente/não publicado chama
`notFound()`. Em respostas já transmitidas, Next pode sinalizar notFound via streaming
com noindex, em vez de alterar o status HTTP já enviado.
Categorias ativas vazias mantêm rota e estado vazio, mas não entram na Home/sitemap.
O sitemap usa o mesmo cache e hoje tem 20 URLs; admin permanece fora.

As descrições, canonical e cards sociais vêm dos mesmos dados. Assets específicos
são usados quando presentes no manifesto `src/lib/public-assets.json`; caso contrário,
OG usa `/social/isso-facilita.jpg`. `prebuild` regenera o manifesto a partir de public/.
Isso evita depender da disponibilidade física de public/ dentro da função serverless.
Imagens principais/mobile continuam obrigatórias e precisam estar no manifesto.
Novos arquivos locais ainda exigem deploy; reutilizar imagens existentes não exige.
O gerador social ainda usa data.ts: OG editorial totalmente dinâmico deve ser tratado
antes de concluir CRUD. Um asset específico existente também pode ficar editorialmente
desatualizado após edição; o fallback protege contra arquivo inexistente, não esse caso.

## Próxima etapa: invalidação autenticada

Após INSERT/UPDATE/DELETE/publicar/despublicar, o futuro código administrativo deve
validar usuário/perfil, escrever sob RLS e só então invalidar `PUBLIC_CATALOG_TAG`.
Para leitura imediata após escrita em Server Function, usar `updateTag`; `revalidateTag`
com perfil SWR permite conteúdo antigo durante atualização e não é equivalente.
Também será necessário atualizar a navegação do cliente que fez a mutação.
Nenhuma mutation, Server Action, webhook, Route Handler de revalidação ou Deploy Hook
foi criado nesta etapa. Sem esse fluxo futuro, vale somente o fallback temporal.
Um produto despublicado pode permanecer no cache até revalidação; urgência de remoção
exigirá invalidação imediata autenticada na etapa de escrita.

## Validação e operação

`npm ci`, `npm run test:data-source`, `npm run test:admin`, `npm run lint`,
`npm run build` com cada fonte. `npm run start` inicia o runtime de produção.
`npm run test:runtime` exige build Supabase prévio e usa uma fixture Data API local,
via preload Node apenas no processo de teste, sem tocar no banco real. Nenhum código
de fixture é importado pela aplicação. Novos parâmetros não constam do manifesto do
build; as rotas precisam ser resolvidas pelo servidor usando o adapter Supabase real.

Preservar todas as variáveis atuais na Vercel; preset Next.js, diretório de saída
automático (não out/). Não houve alteração remota na Vercel/DNS. CI continua sem
banco remoto e sem credenciais Supabase. Diretórios .next/ e out/ seguem ignorados.

O teste de runtime também verifica atualização do sitemap (contagem calculada a partir do catálogo + quatro rotas novas) e
remoção pública após despublicar na fixture. Usa o perfil real de 300s, portanto
pode levar cerca de 10–15 minutos. Para a validação local de despublicação, também
foi usado um build de teste com revalidação acelerada (30/1/86400s), restaurando o perfil de
produção 30/300/86400s e fazendo novos builds ao final. Não execute builds
concorrentes durante o teste.
O diretório .next/ usado no teste deve ser regenerado com a fonte desejada antes de
qualquer publicação; nunca publicar a saída de testes ou o antigo out/.

### Evidências desta etapa

- Paridade com Supabase real: 4 categorias, 10 produtos, 3 coleções, 2 conteúdos, #004 destacado.
- Sitemap de produção: 20 URLs, header de cache inclui public-catalog.
- 20 URLs públicas verificadas por HTTP após #004, além de admin/login, admin, robots e sitemap.
- Produto rascunho, conteúdo #002 e coleção inexistente acionam notFound.
- Comparação antes/depois: Home mobile com texto/geometria equivalentes; página da
  luminária desktop com texto/geometria equivalentes. CSS público não foi alterado.
- Login manual do owner no runtime normal confirmou as contagens reais da data do teste;
  nenhuma senha foi recebida, armazenada ou versionada para testar.
- Fixture runtime: quatro URLs inéditas resolvidas com canonical e fallback OG;
  sitemap ganhou quatro URLs (24 na fixture atual); despublicação retirou produto com notFound, sem rebuild.
- npm ci sem vulnerabilidades; 15 testes de dados, 7 de admin, lint e assets sociais
  aprovados. Builds static e Supabase preservam os mesmos dados públicos.
