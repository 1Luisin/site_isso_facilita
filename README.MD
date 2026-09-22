# Isso Facilita!

MVP estático em Next.js App Router + TypeScript, com CSS global e ilustrações SVG próprias. Sem backend ou banco de dados.

## Executar

Requer Node.js 20.9 ou superior e npm.

```powershell
cd C:\Users\Trabalho\Documents\site_isso_facilita
npm install
npm run dev
```

Abra http://localhost:3000. Se a porta estiver ocupada, confira a porta alternativa no terminal.

```powershell
npm run lint
npm run build
```

O build exporta o site estático em `out/`. Para produção, sirva essa pasta com um servidor de arquivos estáticos. `next start` não é compatível com `output: 'export'`.

## Páginas

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

Para trocar ilustrações por fotos, coloque os arquivos em `public/products/` e defina `image: '/products/nome.jpg'` no produto. Atualize `affiliateUrl` com o link real e revise os preços antes de publicar. Todas as URLs atuais abrem apenas a página inicial da Shopee; os preços são fictícios e apresentados como “a partir de”.

Busca ignora acentos e diferenças entre maiúsculas/minúsculas. Categorias e coleções podem ser combinadas. Favoritos são apenas estado temporário do componente, sem conta ou armazenamento. Cliques no admin são simulados; não existe rastreamento. O admin não permite editar dados e não contém informações privadas.

Nenhum backend, banco, autenticação, analytics ou redirecionamento `/go` foi implementado. Não publicar dados sensíveis no painel público.
