# Catálogo público no build — Etapa 10

O site continua com `output: "export"`. Não há consultas Supabase no browser,
API Routes, Auth, Storage, gravações ou acesso privilegiado nesta integração.

## Seleção e segurança

- `SITE_DATA_SOURCE` ausente ou `static`: adapter de `src/lib/data.ts`.
- `SITE_DATA_SOURCE=supabase`: leitura pública via `@supabase/supabase-js` 2.117.1.
- Outro valor, configuração incompleta, falha de rede ou snapshot inconsistente:
  erro explícito; nunca retorna silenciosamente ao static.

Use as [publishable keys atuais do Supabase](https://supabase.com/docs/guides/getting-started/api-keys).
`SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` são variáveis somente do ambiente de
build, sem prefixo `NEXT_PUBLIC_`. O cliente rejeita formatos diferentes de
`sb_publishable_…`, incluindo chaves legadas/privilegiadas. Nenhuma chave real é
versionada. `.env.local` continua ignorado pelo Git.

As consultas usam a Data API com publishable key, sem sessão/JWT de usuário:
comportamento de `anon`, sujeito aos grants e à RLS existentes. Auth não persiste
sessão, não detecta login na URL e não renova tokens. Não há canais ou conexões
Realtime. O transporte aceita somente GET, com timeout e sem persistir cache
HTTP entre builds. Erros não imprimem headers/chaves ou dumps da SDK.
O transporte usa `node:https`, disponível no Node, pois o fetch global sem cache
do Next 16 é tratado como I/O de runtime durante o prerender de metadata routes
(sitemap). Assim a SDK continua cuidando de PostgREST, com HTTPS somente no build,
sem adicionar biblioteca de transporte ou cache persistente. Apenas a origem
configurada e caminhos `/rest/v1/` são aceitos; redirecionamentos são rejeitados.

## Arquitetura

`getPublicCatalogSnapshot()` em `src/lib/data-source/index.ts` seleciona o adapter,
valida e compartilha a mesma Promise durante a execução do worker/processo.
`React.cache()` também deduplica o contexto de renderização. Workers diferentes
do Next podem carregar seu próprio snapshot; não existe promessa de transação
atômica entre workers/tabelas. Evite alterações editoriais durante um build.
Nenhum cache externo/disco é usado e novos builds carregam novamente os dados.
No desenvolvimento, reinicie `npm run dev` para atualizar o snapshot em memória.

Os dois adapters retornam a mesma interface em `types.ts`: categorias, produtos,
coleções, conteúdos e configurações públicas. UUIDs, FKs, timestamps, preços e
rascunhos não chegam aos componentes. `presentation.ts` preserva apenas as cores
e ilustrações atuais por slug; não contém links ou conteúdo editorial.

O adapter Supabase pagina as dez tabelas públicas com ordenação estável, aplica
filtros explícitos além da RLS e resolve relações internamente. A ordem de produtos
por conteúdo/coleção vem de `sort_order`; o destaque vem exclusivamente de
`site_settings.featured_content_id`. A RLS pode ocultar linhas que não são públicas;
o adapter não tenta contorná-la para inspecionar rascunhos.

Publicações sem link primário ativo, imagem principal, categoria ou relações
válidas interrompem o build. Settings ausente/destaque inacessível e conteúdo
sem produtos também falham. Campos textuais opcionais nulos viram texto vazio,
sem inventar descrição. Imagens/variantes são caminhos locais em `public/`, com
validação de existência e rejeição de path traversal. Assets sociais referenciados
também precisam existir. Nenhum bucket foi criado.

Os módulos de leitura usam `server-only`; componentes client recebem DTOs via
props. Busca/favoritos e `AffiliateLink` permanecem client-side, sem SDK ou fetch
de catálogo. GA4, links diretos, atributos de segurança e eventos não mudam.

Os tipos `src/lib/supabase/database.types.ts` foram gerados pela CLI vinculada,
com `supabase gen types typescript --linked --schema public`, sem dados/chaves.
Os scripts locais usam o suporte nativo a TypeScript do Node 24, sem transpiler
adicional; `allowImportingTsExtensions` permite compartilhar os mesmos adapters.

## Validação local

Cadastre URL e publishable key localmente em `.env.local` sem colar chaves no chat.
Não é necessário fornecer variáveis Supabase para o modo static ou para o CI.

```powershell
npm ci
npm run check:social
npm run test:data-source
npm run lint
$env:NEXT_PUBLIC_SITE_URL="https://issofacilita.app.br"
$env:SITE_DATA_SOURCE="static"
npm run build
$env:SITE_DATA_SOURCE="supabase"
npm run build
npm run check:data-parity
```

A paridade compara semanticamente o snapshot completo das fontes, incluindo nomes,
descrições, categorias, links reais, caminhos de imagens/variantes, coleções,
conteúdo #001, ordem dos produtos, Instagram/TikTok e destaque. UUIDs e timestamps
não fazem parte desse contrato; o snapshot static exclui rascunhos e preços.
O comando usa apenas a publishable key e não deve entrar obrigatoriamente no CI.

Os testes locais de validação não usam rede nem chaves. São distintos do teste
SQL privilegiado da Etapa 9, que não é usado pela aplicação nem por esta integração.

Validação inicial em 23/09/2026: `npm ci`, `check:social`, lint, 13 testes locais,
paridade e builds static/Supabase aprovados. A primeira tentativa de `npm ci`
encontrou o SWC bloqueado pelo servidor dev no Windows; a instalação passou após
interromper os processos desse projeto. As exportações foram comparadas por rotas,
HTML normalizado (sem scripts/hashes de build), metadados e links: equivalentes,
com 14 URLs no sitemap. A leitura pública retornou 5 produtos, 3 coleções e
somente #001, também usado como destaque por settings. A auditoria de HTML,
payloads e JavaScript exportados não encontrou key, SDK ou endpoint Supabase.

## Produção e rollback

Configurar **manualmente** no ambiente Production da Vercel:

```dotenv
SITE_DATA_SOURCE=supabase
SUPABASE_URL=https://ijdkjnpfcabivotllngy.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable key do projeto>
```

Preservar `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_GA_MEASUREMENT_ID` existentes.
O valor real da key não faz parte desta documentação. Nenhuma configuração da
Vercel foi alterada automaticamente nesta etapa.

Banco alterado → novo build/deploy Vercel → HTML atualizado. Não há atualização
imediata, revalidação em runtime ou Deploy Hook. Para rollback, definir
`SITE_DATA_SOURCE=static` e gerar novo build; não é necessário apagar banco ou código.

## Antes do futuro Auth/Admin

O gerador de assets sociais ainda lê o snapshot editorial static. Antes de o
admin ser a fonte exclusiva, adaptar o gerador para o mesmo snapshot Supabase
ou um derivado; alterações de nome/capa/produto devem atualizar os JPGs no próximo
deploy. A existência dos arquivos é validada agora, mas mudanças editoriais não
atualizam automaticamente seu conteúdo. Até essa migração, manter paridade com
`data.ts` e regenerar/versionar imagens sociais após alterações.

Automatizar build/deploy após mudanças editoriais pertence à etapa administrativa,
antes de considerar CRUD completo. Esta etapa não implementa login, usuários,
perfis, admin, uploads, Storage, escrita no banco, cliques próprios ou `/go`.
