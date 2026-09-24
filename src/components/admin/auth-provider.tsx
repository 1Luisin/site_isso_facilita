"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { isActiveAdmin, type AdminProfile } from "@/lib/admin-access";

type Access = { status: "loading" | "unconfigured" | "anonymous" | "denied" | "error" } | { status: "authorized"; profile: AdminProfile };
type AuthContext = {
  access: Access;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  retry: () => void;
};
const Context = createContext<AuthContext | null>(null);
export function useAdminAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AdminAuthProvider ausente.");
  return value;
}
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<Access>({ status: "loading" });
  const revision = useRef(0);
  const refresh = useRef<() => void>(() => {});
  const router = useRouter();
  useEffect(() => {
    const client = getBrowserSupabase();
    if (!client) {
      const task = setTimeout(() => setAccess({ status: "unconfigured" }), 0);
      return () => clearTimeout(task);
    }
    let disposed = false;
    let queued: ReturnType<typeof setTimeout> | undefined;
    let expiry: ReturnType<typeof setTimeout> | undefined;
    const validate = async (ticket: number) => {
      try {
        // getUser verifies with Auth; no authorization from user_metadata/local claims.
        const { data, error } = await client.auth.getUser();
        if (disposed || ticket !== revision.current) return;
        if (error || !data.user) {
          setAccess({ status: !data.user && (!error || error.name === "AuthSessionMissingError" || error.status === 400 || error.status === 401 || error.status === 403) ? "anonymous" : "error" });
          return;
        }
        const { data: profile, error: profileError } = await client.from("admin_profiles")
          .select("role,active,display_name").eq("user_id", data.user.id).maybeSingle();
        if (disposed || ticket !== revision.current) return;
        if (profileError) setAccess({ status: "error" });
        else if (!isActiveAdmin(profile)) setAccess({ status: "denied" });
        else setAccess({ status: "authorized", profile });
      } catch {
        if (!disposed && ticket === revision.current) setAccess({ status: "error" });
      }
    };
    const schedule = () => {
      const ticket = ++revision.current;
      setAccess({ status: "loading" });
      clearTimeout(queued);
      // Defer outside the Auth callback to avoid SDK session-lock deadlocks.
      queued = setTimeout(() => { void validate(ticket); }, 0);
    };
    refresh.current = schedule;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      clearTimeout(expiry);
      if (!session) {
        ++revision.current;
        clearTimeout(queued);
        setAccess({ status: "anonymous" });
        return;
      }
      schedule();
      if (session.expires_at) {
        expiry = setTimeout(schedule, Math.max(0, Math.min(session.expires_at * 1000 - Date.now(), 2_147_483_647)));
      }
    });
    const onVisible = () => { if (document.visibilityState === "visible") schedule(); };
    window.addEventListener("focus", schedule);
    document.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(onVisible, 60_000);
    // INITIAL_SESSION from the single listener handles initial validation.
    return () => {
      disposed = true;
      refresh.current = () => {};
      clearTimeout(queued);
      clearTimeout(expiry);
      clearInterval(interval);
      subscription.unsubscribe();
      window.removeEventListener("focus", schedule);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  const signIn = async (email: string, password: string) => {
    const client = getBrowserSupabase();
    if (!client) return "Auth não configurado neste build.";
    try {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) return "Não foi possível entrar. Confira suas credenciais e tente novamente.";
      refresh.current();
      return null;
    } catch { return "Não foi possível entrar. Tente novamente."; }
  };
  const signOut = async () => {
    ++revision.current;
    setAccess({ status: "loading" });
    try {
      const client = getBrowserSupabase();
      if (client) {
        const { error } = await client.auth.signOut({ scope: "local" });
        if (error) { setAccess({ status: "error" }); return; }
      }
      setAccess({ status: "anonymous" });
      router.replace("/admin/login");
    } catch { setAccess({ status: "error" }); }
  };
  return <Context.Provider value={{ access, signIn, signOut, retry: () => refresh.current() }}>{children}</Context.Provider>;
}
