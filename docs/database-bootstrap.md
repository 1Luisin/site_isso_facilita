# Bootstrap do banco — Etapa 9

Aplicação em 23/09/2026 no projeto existente `isso-facilita`, ref público
`ijdkjnpfcabivotllngy`, região `sa-east-1` (São Paulo), PostgreSQL 17.6.
O projeto foi criado pelo responsável. Nenhuma integração do site foi alterada:
`src/lib/data.ts` continua sendo a fonte de dados da exportação estática.

## Ferramentas e aplicação

Supabase CLI **2.117.0**, fixada em devDependency e package-lock. Após `npm ci`,
use `npx --no-install supabase`. Não foi adicionado o SDK JavaScript.
O login foi concluído pelo responsável no fluxo interativo oficial; nenhuma
credencial foi enviada por chat ou escrita no repositório.

Fluxo executado:

1. `supabase init`, preservando migration e seed existentes.
2. `supabase link --project-ref ijdkjnpfcabivotllngy`.
3. Inspeção remota: schema público sem tabelas; dry-run com uma migration pendente.
4. Validação da estrutura completa em transação com `ROLLBACK`, no próprio
   PostgreSQL do Supabase, antes da aplicação definitiva.
5. `supabase db push --linked --skip-vault --yes`.
6. `supabase migration list --linked`: versão **20260923000100** presente local
   e remotamente (`20260923000100_initial_schema.sql`).
7. `supabase db query --linked --file supabase/seed.sql`, separado da estrutura.

`db query --linked` é o comando oficial desta versão da CLI, via Management API.
Não foi utilizado SQL Editor, senha em argumentos nem chave service role.
A migration original não precisou de correção e foi preservada integralmente;
seu comentário de proposta registra o estado em que foi criada na Etapa 8.

Não executar `db reset --linked`. O seed é bootstrap manual, não sincronização:
não deve ser repetido após começar a administrar conteúdo. Não existe hook de
deploy/build/CI que execute SQL. `config.toml` contém defaults **locais**, inclusive
Auth/Storage; não foi executado `config push` nem configurado serviço remoto.
`.temp/`, `.branches/`, `.env` e `.env.local` permanecem ignorados pelo Git.

## Contagens verificadas após o bootstrap e os rollbacks

| Tabela | Total | Publicação |
| --- | ---: | --- |
| categories | 4 | 4 ativas |
| products | 8 | 5 publicados, 3 rascunhos |
| collections | 4 | 3 publicadas, 1 rascunho |
| contents | 3 | #001 publicado, #002/#003 rascunhos |
| collection_products | 18 | |
| content_products | 12 | |
| product_affiliate_links | 5 | Links reais Shopee, ativos e primários |
| product_images | 5 | Assets locais, com variantes mobile |
| content_links | 2 | Instagram e TikTok do #001 |
| site_settings | 1 | Destaque #001 |
| admin_profiles | 0 | Nenhum administrador criado |
| outbound_clicks | 0 | Nenhum clique persistido |

Não existem campos de preço no schema nem preços fictícios importados. Os três
produtos rascunho não têm links afiliados. Não há URL genérica `https://shopee.com.br/`.

## Validações executadas

`supabase/tests/bootstrap.sql` é uma verificação **manual e privilegiada**, específica
para o snapshot inicial. Todas as mutações estão dentro de transação com rollback.
Não deve ser anexada ao CI nem usada contra um catálogo já administrado sem revisão.

```powershell
npx --no-install supabase db query --linked --file supabase/tests/bootstrap.sql
```

Resultado: passou. Foram verificados:

- 12 tabelas com RLS, 49 policies e 9 triggers compartilhando `touch_updated_at`.
- Funções em `private`, `search_path` vazio; `current_admin_role` com
  `SECURITY DEFINER` e owner `postgres`, evitando recursão de RLS.
- `SET LOCAL ROLE anon`: 4 categorias, 5 produtos, 3 coleções, 1 conteúdo,
  7 relações de coleções públicas, 5 relações de conteúdo, 5 links afiliados,
  5 imagens, 2 links sociais e 1 configuração. Perfis/cliques sem acesso.
- `authenticated` com subject de JWT temporário e sem perfil: papel admin nulo,
  os mesmos dados públicos, zero perfis/cliques visíveis. Nenhum usuário ou perfil
  foi inserido para esse teste.
- INSERT/UPDATE/DELETE negados ao anon nas dez tabelas editoriais/configuração.
  Sem perfil, INSERT falha por RLS e UPDATE/DELETE não afetam nenhuma linha.
- Categoria com produtos não pode ser apagada; exclusões de coleção, conteúdo e
  produto removem as relações corretas. Exclusão de conteúdo limpa o destaque.
- Um clique temporário protege produto, conteúdo e link contra exclusão; a FK
  composta impede associar link ao produto errado. Esse clique foi revertido.
- Unicidade de link primário ativo, imagem principal, ordem por coleção/conteúdo
  e linha única de configurações.
- UPDATE real altera `updated_at`, depois revertido.
- Segunda execução do seed em transação reversível: comparação integral das 12
  tabelas antes/depois, incluindo UUIDs e timestamps, sem qualquer diferença.

## Limitações e próximos passos

Docker não está disponível neste ambiente. Não foi instalado e não foi executado
`supabase start`/`db reset` local. A execução real no Supabase e os testes reversíveis
cobriram schema, seed, RLS e constraints, mas não substituem todos os testes futuros
de integração HTTP/JWT do aplicativo.

Policies owner/editor foram revisadas, mas não exercitadas com perfis reais:
nenhum usuário administrativo foi criado. Na etapa Auth/Admin, validar esses papéis
em ambiente isolado e realizar o bootstrap privilegiado do primeiro owner.
Não foram configurados providers, redirect URLs, buckets, Storage, Auth/Admin,
CRUD, tracking, `/go` ou variáveis Supabase na aplicação/Vercel.

Nunca colocar `SUPABASE_SERVICE_ROLE_KEY` em `NEXT_PUBLIC_*`, frontend, Git ou logs.
Autenticação CLI permanece local. Project Ref e região acima não são credenciais.

Validação do site: `npm run lint` e build com
`NEXT_PUBLIC_SITE_URL=https://issofacilita.app.br`; nenhuma variável Supabase é
necessária. O GitHub Actions continua independente do banco remoto.
