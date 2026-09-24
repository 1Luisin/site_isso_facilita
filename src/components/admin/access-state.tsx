"use client";
import { useAdminAuth } from "./auth-provider";
export function AccessState() {
  const { access, signOut, retry } = useAdminAuth();
  return <section className="admin-card admin-state" aria-live="polite">
    <span aria-hidden="true">✿</span>
    {access.status === "unconfigured" ? <><h1>Auth não configurado</h1><p>A autenticação administrativa não está disponível neste build.</p></> :
      access.status === "denied" ? <><h1>Acesso não autorizado</h1><p>Esta conta não possui um perfil administrativo ativo.</p><button className="primary-button" onClick={() => void signOut()}>Sair</button></> :
      access.status === "error" ? <><h1>Não foi possível verificar o acesso</h1><p>Confira sua conexão e tente novamente.</p><div className="admin-actions"><button className="primary-button" onClick={retry}>Tentar novamente</button><button className="text-button" onClick={() => void signOut()}>Sair</button></div></> :
      <><h1>Verificando acesso</h1><p>Aguarde um instante…</p></>}
  </section>;
}
