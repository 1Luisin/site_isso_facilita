# Imagens de produtos — Etapa 14

O `/admin/produtos/[id]` recebe uma imagem, mostra a prévia processada e salva duas
variantes no Supabase Storage. Criar um produto continua criando um rascunho; upload
nunca publica automaticamente. Salve alterações do formulário antes de editar mídia.

## Bucket e modelo

`catalog-media` é público: qualquer pessoa que possua uma URL pode baixar o arquivo,
inclusive mídia de rascunho. Use somente mídia editorial não sensível. RLS não permite
ao público listar o bucket nem ler associações de produtos rascunho no catálogo.
O bucket aceita JPEG, PNG e WebP, até 6 MiB (6 × 1024 × 1024 bytes). A aplicação envia
somente WebP reprocessado; não guarda o original. Nenhuma variável nova foi criada.

Configuração reproduzível em `20260928000100_product_storage.sql`; a migration
`20260928000200_storage_product_scope.sql` qualifica a coluna externa `storage.objects.name`
na policy para evitar confusão com `products.name`. `20260928000300_image_origin_constraint.sql`
elimina a possibilidade de SQL NULL mascarar um path local inválido no CHECK e limita
alt a 300 caracteres. As três foram aplicadas pela CLI e registradas no histórico.
Migrations anteriores permanecem intactas.

`product_images.storage_bucket` é nullable:

- NULL: `storage_path` e `mobile_storage_path` continuam sendo caminhos locais.
- `catalog-media`: os campos contêm object keys, nunca URL temporária/signed URL.

Formato: `products/<product-uuid>/<asset-version-uuid>/main.webp` e `mobile.webp`.
O adapter deriva a URL pública a partir da origem configurada. Imagens locais
continuam validadas contra o manifesto `public/`. Nenhuma migração em massa ou
exclusão de arquivos do Git ocorreu. `next/image` permite somente o host do projeto
e o prefixo público de produtos desse bucket; picture/sizes/lazy loading permanecem.

## Processamento e upload

Antes de decodificar, valida MIME, limite, assinatura raster e dimensões do cabeçalho.
Rejeita SVG disfarçado, GIF, HEIC/HEIF, WebP animado e dimensões acima de 40 megapixels
ou 12.000 pixels por lado. A decodificação efetiva é feita por `createImageBitmap`.
Canvas gera WebP (qualidade 0,86), até 900 × 900 e 480 × 480, mantendo proporção,
sem cortes, sem ampliar imagens pequenas, sem fundo branco e preservando alpha.
A recodificação remove EXIF do original. Navegador sem codificação WebP recebe erro.

A prévia usa object URL revogada quando substituída/desmontada. O picker tem label,
alt, mensagens aria-live e controles desabilitados durante processamento/envio.
O texto alternativo vazio usa o nome atual do produto (limite de 300 caracteres).

Upload direto com sessão administrativa, `upsert: false`, paths aleatórios e
`cacheControl: 31536000`. Nova versão implica nova URL; não se depende de purgar
cache do browser/CDN. Remover o objeto na origem não revoga cópias já armazenadas
em caches; este é outro motivo para não enviar mídia sensível.

## Segurança e associação

Browser confirma sessão, perfil ativo owner/editor e produto. Storage RLS é a
barreira de escrita: INSERT apenas em prefixo de produto existente, SELECT
administrativo, nenhum UPDATE e DELETE somente de objetos sem associação.
Anon, perfil inativo e authenticated sem perfil não podem enviar arquivos.
DELETE permite limpar órfãos mesmo após exclusão do produto, mas somente paths
válidos desse bucket e admins ativos. Nenhuma policy ampla `FOR ALL` foi criada.

`setProductImage` e `removeProductImage` verificam JWT com `auth.getUser()` novamente.
Usam URL/publishable key e JWT do usuário, nunca credencial privilegiada. A associação
confere bucket, produto, versão, par de paths, existência/tamanho/MIME via Storage
API e cabeçalhos/dimensões dos bytes WebP enviados. O banco confere também metadata
dos dois objetos e constraints de origem/path; isso não pretende ser um antivírus.

RPCs SECURITY INVOKER respeitam RLS, serializam operações editoriais e verificam
`expected_updated_at` sob lock do produto. Atualizam a única imagem principal,
preservam sua posição, ou criam a primeira. Triggers impedem remoção da imagem
principal de produto publicado, inclusive por escrita direta. Editor pode editar
mídia/remover imagem de rascunho; exclusão de produto continua exclusiva do owner.
`database.types.ts` foi regenerado (mantida a anotação nullable dos argumentos
de criação de produto que o gerador não infere).

## Consistência, limpeza e cache

Storage e banco não são uma transação única:

1. Falha parcial de upload: tenta remover os paths novos.
2. Falha da associação: tenta remover os dois objetos novos.
3. Commit confirmado: `updateTag(public-catalog)` e limpeza do par antigo.
4. Falha da limpeza após commit: informa aviso; a nova imagem continua associada.

Resposta perdida pode tornar o resultado ambíguo: a compensação tenta limpar,
mas RLS bloqueia a exclusão de arquivos que já estejam associados. A mensagem
orienta reabrir o produto. Interrupção abrupta do browser/rede ainda pode deixar
objetos órfãos; não há job automático de limpeza nesta etapa.

Remover imagem exige rascunho: primeiro remove a associação, depois os objetos.
Imagem legada local só perde associação; não há remoção de `public/`. Excluir o
produto via owner também tenta limpar seus arquivos Storage após commit.
Upload ainda não associado não invalida cache; cleanup não invalida novamente.
Uma aba pública já aberta precisa atualizar/navegar para buscar a nova versão.

## Testes e limites

`npm run test:admin` inclui validação de MIME/tamanho, dimensões, paths, alt,
compensação parcial, erro de associação e resposta ambígua. `test:data-source`
continua offline. CI usa fonte static e não exige Storage/Auth reais.

`supabase/tests/product-storage.sql` usa transação com ROLLBACK para simular RLS
owner/editor/inactive/sem perfil/anon, paths inválidos, produto inexistente,
publicação, substituição e remoção. Só cria metadata sintética nessa transação;
simula o flag de DELETE da Storage API para esses registros de teste. Não usar
DELETE SQL como ferramenta de limpeza real: arquivos reais sempre usam Storage API.

O teste real no browser usa apenas produto descartável: upload de main/mobile,
publicação sem rebuild, substituição com nova URL, limpeza anterior, despublicação
e remoção. Nenhum produto real ou link afiliado existente é alterado.

OG continua usando arte específica existente ou fallback genérico. Não foi criada
arte OG automática a partir do upload. Sem galeria, vídeo, upload de capas, CRUD de
conteúdos ou tracking. O futuro prefixo `contents/<uuid>/...` exigirá novas policies;
ele não está liberado agora. As variáveis existentes de servidor/browser são suficientes.

Referências: [criação de buckets](https://supabase.com/docs/guides/storage/buckets/creating-buckets),
[RLS do Storage](https://supabase.com/docs/guides/storage/security/access-control).

## Resultado da validação real

Em 28/09/2026, owner enviou e substituiu uma imagem em produto descartável,
publicou sem rebuild e confirmou a nova URL na página pública local do Next.
O par anterior desapareceu de storage.objects; a remoção de imagem de rascunho
limpou associação e objetos. Um terceiro upload PNG de 320 × 320 gerou ambos
os WebP de 320 × 320 com alpha, 17.230 bytes cada e cache público de 31.536.000 s.
A exclusão final do produto também limpou seu par. Estado final: 13 produtos,
10 publicados, 3 rascunhos, zero fixtures, zero objetos no bucket e zero cliques.
Um owner ativo preservado. RLS editor/inactive/sem perfil/anon foi validada por
transação reversível; a interface real foi testada com o owner já autenticado.
360/390/430 px e desktop sem overflow. Não houve alteração em produtos reais.
