# Administração de conteúdos

`/admin/conteudos`, `/admin/conteudos/novo` e `/admin/conteudos/<uuid>` usam a sessão Auth e as mesmas regras de perfil ativo do admin. A URL pública continua `/v/<codigo>`. Código único de 3 a 20 dígitos; a sugestão do próximo número pode ser editada e conflitos não sobrescrevem registros.

Tipos: `carousel` = Carrossel, `video` = Vídeo, `post` = Post, `short` = Reel / Short. Reels não possuem um quinto tipo. **Não há upload MP4, streaming ou hospedagem de vídeos**; os vídeos sociais continuam nas plataformas externas.

## Escrita e autorização

Leitura administrativa pelo browser autenticado; Server Actions verificam JWT com `auth.getUser()`, perfil ativo e role. Todas usam somente a publishable key. As RPCs são `SECURITY INVOKER`, com EXECUTE apenas para authenticated e RLS preservada:

- `admin_save_content`: dados, produtos ordenados e links em uma transação; criação obrigatoriamente rascunho.
- `admin_delete_content`: owner, confirmação EXCLUIR na ação, respeita FKs/histórico.
- `admin_feature_content`: owner, conteúdo publicado, verifica também o destaque anterior para evitar sobrescrita concorrente.
- `admin_set_content_cover` / `admin_remove_content_cover`: owner/editor, paths exatos e objetos existentes.

`updated_at` controla concorrência otimista. RPCs usam o mesmo advisory lock das mutações de produtos. Primeira publicação define `published_at`; despublicar/republicar preserva a data. Trigger protege destaque também contra escrita direta; checks diferidos validam o estado final das relações de conteúdo publicado.

Owner/editor podem criar/editar/publicar/despublicar e remover relações/links como edição editorial. Editor não pode excluir contents nem mudar site_settings. Inactive, sem perfil e anon não escrevem. Gestão de administradores permanece fora do escopo.

## Produtos e links

Seleção mostra nome, slug, miniatura e status; botões subir/descer persistem `sort_order`. Rascunhos podem incluir outros rascunhos. Publicar exige ao menos um produto, todos publicados, capa válida, código/título/tipo válidos. Categorias dos produtos devem estar ativas. Mensagens identificam produtos que precisam ser publicados/removidos.

Instagram, TikTok e YouTube são opcionais e validados por HTTPS e hostname exato (inclui www, vm/vt.tiktok.com e youtu.be). Remover o campo remove o link. Plataformas futuras que o formulário não gerencia são preservadas.

## Capas

Reutiliza `catalog-media`, público para download: mídia de rascunho com URL conhecida também pode ser acessada; nunca enviar conteúdo sensível. Storage RLS autoriza uploads somente de owner/editor ativos, com conteúdo existente, no prefixo `contents/<uuid>/<asset-version>/cover.webp` e `mobile.webp`. O prefixo de produtos mantém suas policies. Não há UPDATE/upsert; objetos referenciados não podem ser apagados.

`cover_storage_bucket IS NULL` significa arquivo local legado `/videos/...`. `catalog-media` significa object keys, convertidas em URL pública pelo adapter. Nenhum signed URL é salvo. Arquivos locais não são removidos do Git ao substituir a associação.

JPG/PNG/WebP, original até 6 MB, verificação de cabeçalho e decodificação, limite de 40 MP/12.000px por lado. O processador compartilhado recodifica WebP com transparência, sem corte/ampliação: principal dentro de 1080×1350, mobile 540×675. Preview libera object URLs. Servidor também verifica MIME/tamanho e cabeçalho/dimensões dos objetos enviados.

Upload direto autenticado, paths versionados, `cacheControl=31536000`. Falha parcial/associação falha tenta apagar novos objetos. Após commit, falha de limpeza nunca reverte a capa: retorna aviso. Resposta de rede perdida pode deixar objeto órfão; RLS impede compensação de apagar arquivos já associados. Limpeza usa Storage API. Remover capa exige rascunho; conteúdo publicado precisa ser despublicado primeiro.

## Publicação e cache

Após commit, todas as ações executam `updateTag(public-catalog)`. Upload não associado não invalida. Home, lista de conteúdos, metadata, `/v/<codigo>` e sitemap consomem o snapshot cacheado e podem refletir códigos desconhecidos no build, sem Git/deploy/rebuild. Destaque vem de `site_settings.featured_content_id`; é obrigatório definir outro antes de excluir/despublicar o destaque atual.

`SITE_DATA_SOURCE=static` continua usando data.ts, sem sincronização reversa. Produção usa Supabase. OG usa arte local específica quando existente ou fallback genérico; OG editorial dinâmico fica para outra etapa. Categorias/coleções não ganharam CRUD.

## Validação reproduzível

`npm run test:admin` inclui validação de campos, URLs, ordem, capas, compensação e invalidação. `supabase/tests/admin-contents.sql` testa owner/editor, destaque, concorrência, publicação, datas, links/relações, Storage e perfis negados com ROLLBACK. Metadados Storage sintéticos desse teste nunca representam arquivos reais; testes de arquivos usam a API e limpeza explícita. O CI continua independente do banco remoto.

Validação inicial: testes unitários, SQL com rollback, regressão Storage de produtos, paridade, lint e builds static/Supabase passaram. **Pendente:** exercício completo pelo navegador com upload real, publicação de uma nova `/v/<codigo>`, Home/sitemap/destaque sem rebuild e inspeção mobile. A execução do servidor local foi bloqueada pela ferramenta de comandos; não considerar esse fluxo ponta a ponta validado até executá-lo e remover a fixture, restaurando o destaque original.
