# Isso Facilita!

MVP estático em Next.js App Router + TypeScript, com CSS global e ilustrações SVG próprias. Sem backend ou banco de dados.

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

Copie `.env.example` para `.env.local` ou configure `NEXT_PUBLIC_SITE_URL` no ambiente de build. Sem valor, `npm run dev` usa `http://localhost:3000`. Para `npm run build`, a variável é obrigatória e deve conter a origem HTTPS pública real, sem caminho, query ou fragmento; localhost é rejeitado em produção. Nenhum domínio definitivo está cadastrado.

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
- `/v/[codigo]`: produtos de um vídeo (`001`, `002`, `003`).
- `/colecao/[slug]`: coleções navegáveis.
- `/admin`: painel público demonstrativo, com produtos, vídeos e cliques fictícios.

## Onde editar

- `src/lib/data.ts`: fonte central dos 8 produtos, 4 categorias, 4 coleções e 3 vídeos. O último vídeo é definido em `latestVideo`.
- `src/components/art.tsx`: ilustrações próprias usadas como placeholders.
- `src/components/catalog.tsx`: cards, busca, filtros e favoritos temporários.
- `src/app/globals.css`: cores, tipografia, layout e responsividade.
- `src/app/layout.tsx`: header, navegação, metadados e aviso de afiliado.
- `src/app/**/page.tsx`: páginas e geração estática das rotas.

Para trocar ilustrações por fotos, coloque os arquivos em `public/products/` e defina `image: '/products/nome.jpg'` no produto. Atualize `affiliateUrl` com o link real e revise os preços antes de publicar. Os cinco produtos do carrossel `001` já têm os links de afiliado fornecidos pelo responsável cadastrados. Os outros três produtos ainda abrem a página inicial da Shopee. Preços, nomes específicos, descrições e ilustrações continuam demonstrativos e precisam ser conferidos com os anúncios reais.

Busca ignora acentos e diferenças entre maiúsculas/minúsculas. Categorias e coleções podem ser combinadas. Favoritos são apenas estado temporário do componente, sem conta ou armazenamento. Cliques no admin são simulados; não existe rastreamento. O admin não permite editar dados e não contém informações privadas.

Nenhum backend, banco, autenticação, analytics ou redirecionamento `/go` foi implementado. Não publicar dados sensíveis no painel público.
