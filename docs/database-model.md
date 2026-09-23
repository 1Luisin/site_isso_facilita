# Modelo relacional proposto — Isso Facilita!

**Etapa 8: somente arquivos para revisão. Nenhum banco foi criado ou conectado e nenhum SQL foi aplicado.** O site continua lendo `src/lib/data.ts`, com exportação estática, GA4 opcional e sem admin/API. A migration e o seed não estão ligados ao CI nem a scripts de instalação/build. Não há SDK, CLI, credencial ou configuração Supabase no projeto.

Arquivos:

- `supabase/migrations/20260923000100_initial_schema.sql`: estrutura, constraints, grants, RLS e triggers, em uma transação.
- `supabase/seed.sql`: snapshot editorial manual, separado da estrutura, em uma transação.

O nome da migration segue a convenção temporal `<timestamp>_nome.sql` do Supabase; o timestamp ordena o arquivo e **não registra aplicação nem publicação**. Em PostgreSQL sem Supabase, os roles `anon`, `authenticated`, `service_role`, a tabela `auth.users` e `auth.uid()` não existem: o arquivo requer esse ambiente, não os cria nem os simula.

## Entidades e cardinalidades

```text
Category 1 ── N Product
Product N ── N Collection     [collection_products, com ordem]
Content N ── N Product        [content_products, com ordem]
Content 1 ── N ContentLink
Product 1 ── N ProductAffiliateLink
Product 1 ── N ProductImage
AuthUser 1 ── 0..1 AdminProfile
SiteSettings 0..1 ── 0..1 Content destacado
Product 1 ── N OutboundClick
Content 0..1 ── N OutboundClick
ProductAffiliateLink 0..1 ── N OutboundClick
```

| Tabela | Responsabilidade |
| --- | --- |
| `categories` | Slug, nome, símbolo, descrição, ativação e ordem. Categoria vazia pode continuar existindo. |
| `products` | Identidade/editorial, categoria por UUID, publicação e ordem do catálogo. Não contém preço nem URL de afiliado. |
| `product_affiliate_links` | Vários destinos por produto, plataforma extensível, ativação e primário. |
| `product_images` | Caminhos de uma foto e de sua variante mobile, alt, ordem e imagem principal. Sem bytes. |
| `collections` | Coleções editoriais publicadas/rascunhos, estilo visual e ordem. |
| `collection_products` | Relação N:N e ordem dos produtos na coleção. |
| `contents` | Carrossel, vídeo, post ou short; código público textual, capa, descrição e publicação. |
| `content_products` | Relação N:N e ordem de apresentação por conteúdo. |
| `content_links` | Endereço de cada plataforma para o conteúdo. |
| `site_settings` | No máximo uma linha de campos conhecidos, exclusivamente públicos. |
| `admin_profiles` | Papel/ativação associado ao UUID de `auth.users`; nenhuma senha ou e-mail. |
| `outbound_clicks` | Eventos futuros sem identidade persistente do visitante. Sem conexão com o site nesta etapa. |

Entidades usam UUID com `gen_random_uuid()`. Exceções justificadas: PK composta nas duas relações N:N; `admin_profiles.user_id` reutiliza o UUID de Auth, sem gerar outro. Slugs são únicos, minúsculos e com hífen; códigos são texto numérico com ao menos três caracteres, preservando `001`. Datas usam `timestamptz`; exibir no fuso desejado é responsabilidade da interface.

## Publicação, ordem e preços

- Apenas `published`, sem `status` redundante. Produtos, coleções e conteúdos começam em rascunho. `active` em categoria e link representa disponibilidade, não uma segunda máquina de estados editorial.
- `published_at` registra a primeira publicação conhecida; não é apagado ao despublicar. Não foi criado trigger de publicação: o futuro fluxo administrativo deve definir a data ao publicar pela primeira vez. Nos dados legados a data não é conhecida e fica **NULL**, mesmo nas linhas publicadas. `created_at`/`updated_at` no seed são datas de importação, não datas históricas.
- Desativar categoria oculta seus produtos e dependências do público via RLS. Despublicar conteúdo/coleção não despublica o produto, apenas suas relações naquele contexto. Conteúdos publicados podem ter produtos em rascunho; o público vê somente os produtos publicados.
- `products.sort_order` preserva a ordem do array atual. Nas relações, ordem começa em zero, é não negativa e única por pai. Para reordenar posições, usar transação com `SET CONSTRAINTS ALL DEFERRED` (ou os nomes das constraints específicas); o estado final precisa ser único. O futuro CRUD deve fornecer a posição, não repetir o default 0. Lacunas após remoção são permitidas.
- Não há campos de preço nesta primeira versão: os oito valores atuais são fictícios e serão descartados. Preço real exige uma decisão futura sobre fonte, validade e moeda; só então criar campos opcionais verificados e `show_price` desligado por padrão. Não migrar o preço atual para esses campos.
- A coleção “Achadinhos até R$30” permanece rascunho. Suas relações são referências editoriais legadas, **não comprovam preço**.

## Afiliados e imagens

`platform` é texto com formato de código (`shopee`, `mercado_livre`, `amazon`, etc.), sem enum/lista fechada. Um produto aceita vários links; `(product_id, url)` evita duplicata exata. Índice único parcial garante **no máximo um primário ativo por produto**, não exige que haja um. Publicação futura deverá validar a existência de destino primário ativo e imagem adequada; essa validação ainda não é um trigger do banco.

Na troca do primário, desativar/desmarcar o atual e ativar o novo dentro de uma transação. Um link pode ser editado sem recriar o produto. Após existir histórico, prefira desativar o link antigo e inserir outro: editar sua URL faz os cliques antigos referenciarem o cadastro atualizado, pois não armazenamos cópia da URL de destino no evento. O CHECK de URL exige HTTPS/ausência de espaços, mas não substitui validação de URL, host/plataforma, credenciais e segurança pelo futuro CRUD/API.

`product_images` tem um índice parcial para no máximo uma imagem principal e unicidade de caminho por produto. `mobile_storage_path` guarda a variante da mesma foto para não perder o `srcset` atual. A capa do conteúdo também tem variante mobile. Campos opcionais não recebem caminhos inventados.

Bucket futuro sugerido: **`product-images`**, não criado. Começar privado para proteger uploads de rascunhos; a forma de entregar/copiar somente imagens aprovadas para o site estático e as políticas de `storage.objects` deverão ser projetadas na integração. RLS de uma tabela **não protege** um arquivo de bucket público. Não persistir URLs assinadas que expiram como caminho definitivo.

O seed mantém os caminhos locais `/products/...webp` e `/videos/...webp` exatamente como estão: são referências ao diretório `public`, **não uploads já existentes no Storage**. Na migração futura: copiar os arquivos e variantes, conferir dimensões/alt, registrar os object keys estáveis e só então trocar o adaptador. As imagens sociais JPG continuam sendo artefatos derivados, regenerados e verificados pelo fluxo atual.

## Configurações

`site_settings` usa campos conhecidos e uma restrição `singleton` (boolean sempre verdadeiro e único), mantendo PK UUID. A tabela admite zero ou uma linha; o seed fornece uma. É mais simples de validar que um documento JSON arbitrário. Nome, tagline, três perfis sociais opcionais, texto do footer e FK do conteúdo destacado são públicos. Não armazenar tokens, consentimentos, domínios/credenciais de infraestrutura ou Measurement ID aqui; a configuração por ambiente permanece separada.

O conteúdo destacado será `001`, preservando a escolha explícita de `currentVideoCode`, sem depender de posição do array ou de datas desconhecidas. Antes de despublicar o destacado, trocar/limpar a referência na mesma operação. A policy pública de settings não expõe a linha se ela apontar para um conteúdo em rascunho; o futuro adaptador deve tratar a ausência de configuração. Exclusão física do conteúdo limpa a FK.

## Conteúdos multiplataforma

`content_type` é `text` com CHECK (`carousel`, `video`, `post`, `short`): legível, validado, sem manter um tipo ENUM separado. Um novo tipo exige migration curta do CHECK; **plataformas** não exigem migration. `content_links` permite um endereço por `(content_id, platform)`, suficiente para a situação atual. Múltiplas contas/posts da mesma plataforma exigirão rever essa unicidade e acrescentar identificação/ordem.

`001` é `carousel`. O formato de `002`/`003` não é confirmado: recebem `post` como classificação genérica **provisória**, continuam rascunhos e precisam de revisão antes de qualquer publicação. Seus títulos/descrições são mantidos como material de rascunho, não como conteúdo já publicado.

## DELETE e histórico

| Exclusão | Regra e motivo |
| --- | --- |
| Categoria com produtos | `RESTRICT`: recategorizar antes; preferir `active=false`. |
| Produto | `CASCADE` apenas para imagens, links e relações N:N. Cliques vinculados impedem a exclusão (`RESTRICT`), inclusive via FK composta do link. A transação inteira falha, sem remoção parcial. Preferir despublicar. |
| Coleção | `CASCADE` em `collection_products`; produtos continuam existindo. |
| Conteúdo | `CASCADE` nas relações/links, `SET NULL` no destaque. Se tiver cliques, `RESTRICT` bloqueia tudo; preferir despublicar. |
| Link afiliado | Clique histórico usa `RESTRICT`; preferir desativar. |
| Usuário Auth | `CASCADE` somente no perfil administrativo; não apaga catálogo nem cliques. |
| Cliques | Nenhum direito de apagar/alterar no browser. Expurgo futuro requer política de retenção e operação privilegiada própria. |

Não há soft-delete genérico nem cascata de dados editoriais para histórico. Despublicação preserva IDs e referências. A proteção impede apagar entidades já usadas; um pedido futuro de expurgo deverá tratar essas dependências explicitamente.

## Auth, permissões e RLS

Todas as 12 tabelas habilitam RLS. A migration revoga privilégios implícitos de `PUBLIC`, `anon`, `authenticated` e `service_role` nas novas tabelas antes de conceder somente os necessários. Não há políticas de escrita `USING (true)` ou `WITH CHECK (true)`.

| Ator | Permissões propostas |
| --- | --- |
| Anônimo / autenticado sem perfil ativo | SELECT de categorias ativas, produtos publicados em categoria ativa, coleções/conteúdos publicados e dependências cujos pais sejam públicos. Links afiliados precisam estar ativos. Settings são públicos sob a regra do destaque. Sem escrita, perfis alheios ou cliques. |
| Editor ativo | SELECT (incluindo rascunhos), INSERT e UPDATE nas nove tabelas editoriais. Sem DELETE, edição de settings, gestão de perfis ou consulta de cliques. |
| Owner ativo | CRUD editorial/settings e SELECT de cliques e perfis. Não altera papéis pelo browser. |
| Service role | Nesta migration recebe apenas INSERT em cliques; como tem BYPASSRLS, não depende de policy de INSERT. Sem integração, endpoint ou chave nesta etapa. Novos privilégios futuros exigem revisão. |
| Postgres/migration owner | Aplica estrutura/seed e, futuramente, faz o bootstrap controlado do primeiro owner. Não é identidade do frontend. |

`private.current_admin_role()` é uma função `SECURITY DEFINER` com `search_path=''`, nomes qualificados e filtro pelo próprio `auth.uid()`. Deve pertencer ao migration owner `postgres`, que pode ler perfis sem recursão de RLS. A função só retorna o papel ativo do chamador; EXECUTE somente para `authenticated`. Não expor o schema `private` na Data API. Não usar `FORCE ROW LEVEL SECURITY` nessa tabela sem redesenhar/testar o helper.

`admin_profiles` referencia `auth.users.id`; nenhum usuário é criado automaticamente nem por trigger de signup. Autenticados podem consultar o próprio perfil (mesmo inativo), mas **não têm INSERT/UPDATE/DELETE** nessa tabela. Assim, signup não concede privilégio e editor não pode se promover. Bootstrap/mudanças de papel serão operação privilegiada revisada, não endpoint pronto. A proteção contra remover/desativar o último owner deverá fazer parte desse procedimento futuro; ainda não há trigger que a garanta.

Apenas autenticar não torna alguém administrador. As políticas consultam o perfil a cada operação e não confiam em metadados editáveis pelo visitante. O seed não contém perfis, e-mails nem senhas. Sem bootstrap, nenhum autenticado consegue escrever como admin.

**`SUPABASE_SERVICE_ROLE_KEY` nunca deve ir para `NEXT_PUBLIC_*`, browser, frontend, GitHub ou arquivos versionados.** Nenhuma key foi adicionada. No futuro, somente ambiente confiável de servidor, separado da chave pública e com escopo mínimo. RLS não limita uma service role comprometida: grants, validação e proteção da API continuam necessários.

## Cliques futuros e privacidade

`outbound_clicks` é somente preparação. Nada recebe GA4, nem reconcilia os eventos existentes. Campos: UUID, produto obrigatório, conteúdo/link opcionais, tipo de página, três UTMs limitadas e timestamp. A FK composta `(affiliate_link_id, product_id)` impede associar ao clique um link pertencente a outro produto. Na API futura, validar que o contexto conteúdo/produto faz sentido e resolver o link ativo antes de registrar/redirecionar; o histórico não exige que a relação N:N continue existindo para sempre.

Não há IP bruto, e-mail, CPF, nome, user-agent completo, fingerprint, ID GA, cookie ou identificador persistente. Nem URL completa de origem/destino é guardada. UTMs também podem conter dados pessoais inseridos por terceiros: o servidor futuro precisará de normalização/allowlist e descarte de valores inesperados, não apenas limite de tamanho. Um identificador de sessão, retenção, consentimento e eventual `/go` exigem decisões de privacidade separadas. Sem inserção por anon/authenticated, para evitar spam direto pela Data API.

Índices de cliques atendem consultas por produto/período, conteúdo/período, referência ao link e retenção por data. Demais índices derivam de PK/UNIQUE, procura por FK e relações reversas. Não há índices isolados em booleans de baixa seletividade. Uma única função `private.touch_updated_at()` serve às nove tabelas editáveis; relações N:N e eventos não precisam de timestamps/trigger redundantes.

## Mapeamento de `data.ts` e seed

Todos os UUIDs são gerados no destino; FKs são resolvidas por slug/código único. Nenhuma FK utiliza nome da categoria/coleção. Slugs atuais permanecem, sem mudar URLs públicas.

| Produto (slug) | Categoria | Publicado | Coleções (abreviações abaixo) |
| --- | --- | --- | --- |
| `luminaria-de-mesa` | decoracao | sim | rosa, feminino |
| `mousepad` | setup | sim | rosa, até30, feminino |
| `fita-led` | eletronicos | sim | rosa, até30 |
| `bonequinho-decorativo` | decoracao | sim | rosa, até30 |
| `suporte-de-fone` | setup | sim | minimalista, até30 |
| `organizador-de-cabos` | utilidades | não | minimalista, até30, feminino |
| `suporte-para-notebook` | setup | não | minimalista, feminino |
| `hub-usb` | eletronicos | não | minimalista, até30 |

- **4 categorias:** `setup`, `eletronicos`, `decoracao`, `utilidades`, com textos/símbolos atuais e ordem 0–3. Utilidades continua ativa/vazia no catálogo publicado; sitemap deve continuar usando o filtro de produtos publicados.
- **8 produtos:** nomes/descrições, categoria, publicação, ordem do array. Cinco publicados, três rascunhos. Descrições de rascunho deverão ser conferidas antes de publicar.
- **4 coleções:** `setup-rosa` (rosa, estilo 0), `setup-minimalista` (minimalista, 1), `home-office-feminino` (feminino, 3), todas publicadas; a quarta conceitual, `achadinhos-ate-30` (até30, 2), é proposta como rascunho. São **18 relações**, incluindo as de rascunhos. Descrições ausentes ficam NULL.
- **3 conteúdos / 12 relações:** `001` publicado com ordem luminária, mousepad, fita LED, bonequinho, suporte de fone; `002` rascunho com organizador, suporte de notebook, hub; `003` rascunho com mousepad, bonequinho, luminária, fita LED. Mantidos códigos, títulos e descrições. `001` possui capa local e variante 540px.
- **2 content_links:** Instagram e TikTok de `001`, copiados literalmente, inclusive query string do Instagram. Não inferir links de perfil a partir deles.
- **5 links afiliados:** URLs curtas reais da Shopee dos cinco publicados, cada um ativo/primário. Os três produtos rascunho ficam sem link cadastrado.
- **5 product_images:** arquivos WebP principais, variantes `-480.webp`, alt baseado no nome existente. Nenhum arquivo placeholder vira imagem cadastrada.
- **1 site_settings:** nome/tagline/aviso de afiliado atuais e destaque `001`. Perfis sociais ficam NULL, pois não estão cadastrados como configuração global confirmada.
- **0 admins / 0 cliques.** Não importar simulações do admin removido nem eventos do GA4.

Não entram: oito preços fictícios; `https://shopee.com.br/` genérico; `art`/`color` (tokens de apresentação atuais, a manter no adaptador ou revisar antes da integração visual); funções/helpers TypeScript; datas históricas inventadas; imagens sociais derivadas; ID GA/domínio/secrets; usuários reais ou cliques simulados. As variantes mobile foram explicitamente preservadas para não perder otimização na integração futura.

### Estratégia de execução do seed (somente após autorização)

O seed faz INSERT com `ON CONFLICT` nas chaves naturais/compostas e **DO NOTHING**, dentro de transação. Repetir sobre o mesmo estado inicial não duplica nem sobrescreve linhas/datas existentes. Não usa TRUNCATE, DELETE ou UPDATE. Não é ferramenta de atualização de um catálogo administrado: uma nova execução poderia repor rascunhos/relações removidas intencionalmente. Rodar apenas em destino novo ou repetição controlada; não configurar execução automática em produção. Conflitos de posição ou primário após edições abortam, exigindo revisão, em vez de reorganizar dados silenciosamente.

## Validação e próxima integração

A revisão abrange ordem das FKs, tipos, CHECKs, grants, RLS de pais/filhos, helper sem recursão, unicidade parcial, reordenação e DELETE. A sintaxe pode ser verificada com parser PostgreSQL local **sem executar SQL ou criar um banco**. Isso não comprova o comportamento de RLS/triggers no Supabase; essa etapa exige teste posterior em ambiente isolado autorizado.

Validação desta proposta: parser PostgreSQL local (`pglast`, instalado apenas em diretório temporário fora do projeto) aceitou as 137 instruções da migration, as 12 do seed e os corpos das funções SQL/PLpgSQL. As linhas do seed foram comparadas com `data.ts`: contagens, publicação, nomes/descrições, relações, ordem, URLs literais e arquivos locais de imagens conferidos. Nenhum teste de execução de RLS, FK, DELETE ou idempotência contra um banco foi realizado; esses comportamentos foram revisados estaticamente e ainda precisam dos testes abaixo.

Antes de aplicar, aprovar: matriz owner/editor; bootstrap/gestão do último owner; classificação provisória de #002/#003; rascunho da coleção por preço; nulidade das datas históricas; bloqueio de exclusão por cliques; fluxo de publicação e bucket privado; retenção/validação de UTMs.

Ordem futura:

1. Revisar/aprovar os arquivos e criar manualmente o projeto Supabase. Nenhuma dessas ações foi feita agora.
2. Em ambiente de teste autorizado, aplicar migration como owner e testar grants/RLS com anon, usuário comum, editor, owner e perfil inativo; testar tentativas de autoelevação.
3. Executar seed controlado; conferir contagens, URLs literais, ordem, exclusão bloqueada por clique e ausência de leitura de rascunhos, links inativos e perfis alheios.
4. Configurar Auth/bootstrap e Storage/políticas próprios; testar publicação/despublicação e acesso aos arquivos antes de escrever um admin.
5. Criar adaptador e comparar sua saída com `data.ts`, preservando catálogo, assets e SEO. **Com static export, editar banco não atualiza HTML sozinho:** será necessário um processo de rebuild/publicação, a definir separadamente. Não adicionar chave service role ao bundle.
6. Só após equivalência e autorização, integrar admin/CRUD e depois tracking próprio. `data.ts` permanece a fonte atual até essa transição; `/go`, API, integração e autenticação não fazem parte desta etapa.

Referências de revisão: [migrations](https://supabase.com/docs/guides/deployment/database-migrations), [seed](https://supabase.com/docs/guides/local-development/seeding-your-database), [RLS e funções privadas](https://supabase.com/docs/guides/database/postgres/row-level-security), [Auth e perfis](https://supabase.com/docs/guides/auth/managing-user-data).
