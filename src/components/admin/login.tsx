"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "./auth-provider";
import { AccessState } from "./access-state";
export function AdminLogin() {
  const { access, signIn } = useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (access.status === "authorized") router.replace("/admin"); }, [access.status, router]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const message = await signIn(email.trim(), password);
    setPassword("");
    setBusy(false);
    if (message) setError(message);
    else setEmail("");
  };
  if (access.status !== "anonymous") return <AccessState />;
  return <section className="admin-card admin-login">
    <span className="eyebrow">ISSO FACILITA! · ADMIN</span>
    <h1>Bem-vindo ao seu cantinho</h1>
    <p>Entre para acompanhar a sua curadoria.</p>
    <form onSubmit={submit}>
      <label htmlFor="admin-email">E-mail</label>
      <input id="admin-email" name="email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} disabled={busy} />
      <label htmlFor="admin-password">Senha</label>
      <input id="admin-password" name="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} disabled={busy} />
      {error && <p role="alert" className="admin-error">{error}</p>}
      <button className="primary-button" type="submit" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
    </form>
  </section>;
}
