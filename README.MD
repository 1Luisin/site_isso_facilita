# Isso Facilita!

Catálogo estático em Next.js App Router + TypeScript, com CSS global e imagens otimizadas. Sem backend ou banco de dados. Publicados atualmente: carrossel #001 e seus cinco produtos. Os demais produtos e vídeos #002/#003 são rascunhos internos, ausentes do catálogo e das páginas públicas de produtos/vídeos.

## Executar

Use Node.js 24.14.1 LTS (fixado em `.nvmrc`, também usado no CI) e npm. O campo `engines` aceita atualizações da série 24 a partir dessa versão, compatível com os requisitos locais do Next.js e do Sharp (Node >=20.9).

```powershell
cd C:\Users\Trabalho\Documents\site_isso_facilita
npm install
npm run dev
```

Abra http://localhost:3000. Se a porta estiver ocupada, confira a porta alternativa no terminal.

```powershell
npm run lint
$env:NEXT_PUBLIC_SITE_URL="https://isso-facilita-ci.example.com"
npm run build
Remove-Item Env:NEXT_PUBLIC_SITE_URL
```

O build exporta o site estático em `out/`. Para produção, sirva essa pasta com um servidor de arquivos estáticos. `next start` não é compatível com `output: 'export'`.

## Configuração da URL pública

A URL usa, nesta ordem: `NEXT_PUBLIC_SITE_URL` explícita; `https://` + `VERCEL_PROJECT_PRODUCTION_URL` fornecida pela Vercel; `http://localhost:3000` somente em desenvolvimento. Sem URL no build de produção, ocorre erro. A origem deve ser HTTPS em produção, sem credenciais, caminho, query ou fragmento; localhost é rejeitado. `VERCEL_URL` não é utilizada. Um futuro domínio próprio em `NEXT_PUBLIC_SITE_URL` terá prioridade completa. Nenhum domínio definitivo está cadastrado.

Essa URL determina canonical, sitemap, robots e URLs das imagens sociais. Ao definir ou trocar o domínio, execute o build novamente. O exemplo de build acima usa uma origem reservada sob `example.com` exclusivamente para validação: não é o endereço público e essa saída não deve ser usada no deploy. O domínio real será definido apenas na etapa de deploy.

## CI e assets sociais

A workflow `.github/workflows/ci.yml` roda em pull requests e pushes para `main`: instala com `npm ci`, executa lint, regenera e verifica os assets sociais e valida o build estático. Usa cache npm, permissão somente de leitura e cancela execuções anteriores da mesma branch/PR. Não faz deploy, upload de `out/` nem commits; não precisa de secrets. `.next/` e `out/` continuam ignorados.

Ao publicar ou alterar produtos, vídeos ou suas imagens, execute `npm run generate:social` e versione os assets gerados junto com os dados. `npm run check:social` regenera e usa `git diff --exit-code HEAD` para detectar diferenças, inclusive staged, além de detectar arquivos novos não versionados. Uma diferença faz o CI falhar com instruções de correção. `npm run check` executa lint e build (requer a variável de URL).

O gerador usa Sharp e OpenType.js como dependências explícitas de desenvolvimento. As fontes livres Gelasio e Arimo, com licenças em `scripts/fonts/`, viram contornos vetoriais antes da rasterização: não depende de fontes instaladas no Windows/Linux, caminhos externos ou downloads durante a geração. Isso não altera as fontes do site.

Para repetir a validação local: `npm ci`, `npm run generate:social`, `npm run lint` e o build PowerShell acima. Em Bash: `NEXT_PUBLIC_SITE_URL=https://isso-facilita-ci.example.com npm run build`. O CI usa essa mesma URL reservada apenas para canonical/sitemap da validação; a regra que rejeita localhost em produção permanece intacta.

## Rotas

- `/`: catálogo, busca, filtros e seleções.
- `/produto/[slug]`: detalhes de cada produto.
- `/categoria/[slug]`: categoria com busca e filtros.
- `/v/[codigo]`: produtos do conteúdo publicado `001`.
- `/colecao/[slug]`: coleções navegáveis.
- `/admin`: painel demonstrativo sem autenticação, fora da navegação e do sitemap, com noindex/nofollow e bloqueio no robots.

## Onde editar

- `src/lib/data.ts`: dados publicados e rascunhos; `publishedProducts`, `publishedVideos` e `publishedCollections` controlam a seleção pública. `categoriesWithPublishedProducts` filtra categorias da Home e do sitemap; categorias vazias continuam com rota própria.
- `src/components/art.tsx`: ilustrações próprias usadas como placeholders.
- `src/components/catalog.tsx`: cards, busca, filtros e favoritos temporários.
- `src/app/globals.css`: cores, tipografia, layout e responsividade.
- `src/app/layout.tsx`: header, navegação, metadados e aviso de afiliado.
- `src/app/**/page.tsx`: páginas e geração estática das rotas.

Os cinco produtos públicos usam imagens WebP em `public/products/` e links reais de afiliado. Preços internos demonstrativos não são exibidos: o visitante consulta o preço na loja. Ao alterar imagens, preserve as variantes responsivas e regenere os assets sociais. Rascunhos permanecem em `data.ts`, sem preencher o catálogo público.

Busca ignora acentos e diferenças entre maiúsculas/minúsculas. Categorias e coleções podem ser combinadas. Favoritos são apenas estado temporário do componente, sem conta ou armazenamento. Cliques no admin são simulados; não existe rastreamento. O admin não permite editar dados e não contém informações privadas.

Nenhum backend, banco, autenticação, analytics ou redirecionamento `/go` foi implementado. Não publicar dados sensíveis no painel público.

## Primeiro deploy manual na Vercel

Importe `1Luisin/site_isso_facilita` pelo dashboard, com Framework Preset **Next.js**, raiz do repositório e Node **24.x**. Preserve os comandos/diretório de saída detectados automaticamente; não é necessário `vercel.json`. A Vercel gerencia os patches da série 24; `.nvmrc` continua fixando 24.14.1 localmente e no CI.

Habilite **Enable access to System Environment Variables** na área **Environment Variables** do projeto. No primeiro deploy, deixe `NEXT_PUBLIC_SITE_URL` sem cadastro: a URL estável de produção será fornecida pela Vercel. Não copie a URL de validação do CI para a Vercel. Faça o deploy manualmente e copie o domínio de produção `.vercel.app`.

Confira Home, cinco produtos, #001, favicon, imagens, links de afiliado, páginas de produto/vídeo, robots e sitemap. No HTML, canonical e og:image devem usar a origem de produção. O admin permanece fora da navegação e do sitemap. Domínio próprio e analytics ficam para etapas posteriores.
