# Auth e shell administrativo — Etapa 11

`/admin/login` e `/admin` são exportados estaticamente. O HTML contém somente a
estrutura pública e o estado “Verificando acesso”; nenhum perfil ou contador
administrativo é consultado no build. Ambas as rotas têm `noindex, nofollow`,
estão fora do sitemap e sob `Disallow: /admin`. Não há link na navegação pública.

## Separação dos clientes

O catálogo continua usando `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` somente no
build, com os adapters da Etapa 10. `data.ts`, GA4 e static export permanecem.

Somente o subtree admin importa `src/lib/supabase/browser.ts`, um singleton no
browser com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
Essas variáveis podem ser expostas ao browser: devem conter URL e publishable key
(`sb_publishable_…`), nunca uma chave privilegiada. A configuração é validada antes
de criar o cliente. Sem configuração válida, o build passa e o admin apresenta
“Auth não configurado”. Nenhuma chave real consta nos arquivos versionados.

Persistência de sessão, renovação e detecção de sessão são geridas pela SDK Auth.
Ela armazena a sessão localmente no navegador; a aplicação não implementa seu
próprio armazenamento de tokens ou papéis. Não são abertos canais Realtime.

## Segurança e sessão

A tela protegida não é a barreira de segurança: JWT do Supabase Auth, grants e RLS
continuam protegendo as consultas. Não há middleware, SSR, cookies server-side,
Server Actions ou APIs de autenticação próprias.

O login chama `signInWithPassword`, sem signup, OAuth, magic link ou recuperação
de senha. Falhas recebem mensagem genérica. Antes de mostrar o painel, `getUser()`
valida o usuário com Auth e uma consulta autenticada a `admin_profiles`, filtrada
pelo ID desse usuário, exige `active=true` e `role` owner/editor. Nada é autorizado
por query string, role da interface ou `user_metadata` editável.

Um único `onAuthStateChange` no provider do layout administrativo acompanha as
transições. A subscription e timers são removidos ao desmontar. A validação ocorre
fora do callback para evitar locks da SDK. Revisões de requisição descartam
respostas antigas após logout/troca de sessão. O acesso é revalidado no foco,
visibilidade, renovação, limite de expiração e a cada minuto enquanto visível.
Durante revalidação ou erro, as contagens são desmontadas. Se a sessão não puder
ser validada/renovada, a área protegida volta ao login. Sem perfil ou com perfil
inativo, aparece acesso negado. Falhas de rede não liberam acesso.

“Sair” chama `signOut({ scope: "local" })`, removendo a sessão atual sem desconectar
outros dispositivos, e retorna a `/admin/login`. Em caso de erro no logout, a tela
continua sem dados e oferece nova tentativa. Tokens JWT já emitidos têm sua própria
expiração; a interface não substitui a validação do servidor.

## Primeiro owner

O responsável criou o único usuário Auth manualmente no Dashboard. A operação de
bootstrap consultou primeiro apenas a contagem, exigiu exatamente um usuário e
inseriu seu UUID por subquery em `admin_profiles`, com nome “Administrador”,
`role=owner` e `active=true`. Nenhum usuário/senha foi criado pela aplicação.
UUID, e-mail, senha e credenciais não foram documentados ou versionados. O
bootstrap foi estado específico do ambiente, não uma migration estrutural.

Após criar o owner, manter **Allow new users to sign up = OFF** no Dashboard.
Essa opção não foi alterada por `config push`. A ausência de formulário de cadastro
não substitui desabilitar signup no serviço.

## Papéis e painel

Owner e editor leem públicos/rascunhos e possuem permissões editoriais previstas
no schema. Apenas owner pode DELETE editorial e editar `site_settings`, segundo
as policies atuais. Editor não vê cliques. A consulta ao próprio perfil é permitida
pela RLS, mas ambos ficam sem INSERT/UPDATE/DELETE de `admin_profiles` via browser.
Não existe gestão de usuários nem mecanismo de autoelevação.

Ao criar gestão de administradores no futuro, será obrigatório proteger o último
owner ativo. Nesta etapa, o painel não consegue remover/desativar owners.

A dashboard consulta somente contagens reais autenticadas de produtos, conteúdos,
coleções e categorias, incluindo publicados/rascunhos. Não escreve no banco nem
registra cliques. Produtos/Conteúdos/Coleções/Categorias aparecem como “em breve”;
somente Dashboard está disponível. Nenhum CRUD foi criado.

## Testes e validações

- `npm run test:admin`: sete casos do guard de perfil (owner/editor ativos,
  inativos, papéis não reconhecidos e ausência de perfil).
- `npm run test:data-source`: preserva os 13 testes do catálogo.
- `supabase/tests/admin-auth.sql`: teste manual privilegiado e específico do
  bootstrap, nunca executado no CI. Simula o usuário existente sob `authenticated`,
  testa owner/editor, inativo e sem perfil. Tudo fica em transação com rollback.
- INSERT/UPDATE editorial e DELETE owner testados; editor não consegue DELETE,
  editar settings ou escrever perfis. Uma fixture de clique não commitada permite
  verificar owner vendo a linha e editor não vendo; ela é removida pelo rollback.
- Após os testes, confirmado um owner ativo, oito produtos e zero cliques.
- Build static sem variáveis públicas Auth e build Supabase com variáveis reais
  exportam as duas rotas; sitemap público mantém 14 URLs.
- No browser local: login inválido com erro genérico, login manual válido do owner,
  sessão persistida ao reabrir o painel, contagens reais, logout e redirecionamento
  ao login ao tentar reabrir `/admin` sem sessão foram confirmados.
- Login e dashboard sem overflow horizontal em 360, 390, 430 e 1280 px.
  Expiração natural do token não foi aguardada; inativo/sem perfil/editor foram
  validados por SQL reversível, sem criar outras identidades Auth.

Os testes SQL não criam um segundo usuário permanente. Perfil inativo/sem perfil
são simulados dentro da transação, sem alterar sessões do browser. Nenhuma senha,
JWT ou sessão é fabricada para testar Auth. Testes interativos usam entrada manual
do responsável; expiração natural depende da configuração Auth existente.

## Vercel e limites desta etapa

Cadastrar manualmente em **Production** e executar um novo deploy:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://ijdkjnpfcabivotllngy.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key pública do projeto>
```

Preservar `SITE_DATA_SOURCE=supabase`, `SUPABASE_URL`,
`SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` e
`NEXT_PUBLIC_GA_MEASUREMENT_ID`. O CI continua sem acesso ao Auth remoto e sem
chaves reais. Não foi alterada nenhuma configuração da Vercel nesta etapa.

Não há CRUD, Storage, uploads, gestão de administradores, reset de senha, signup,
`/go`, tracking próprio, Edge Function, API Route ou Deploy Hook. As limitações da
Etapa 10 permanecem: publicação exige novo build/deploy e o gerador social ainda
precisa migrar para a fonte editorial comum antes de o CRUD ser considerado pronto.
