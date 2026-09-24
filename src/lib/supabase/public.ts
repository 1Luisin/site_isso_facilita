import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";
import { createBuildFetch } from "./build-fetch.ts";

export function publicSupabaseConfig() {
  const value = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!value || !key) throw new Error("Catálogo Supabase: defina SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY no ambiente de build.");
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("Catálogo Supabase: SUPABASE_URL inválida."); }
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash)
    throw new Error("Catálogo Supabase: SUPABASE_URL deve ser uma origem HTTPS, sem caminho ou credenciais.");
  if (!/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key))
    throw new Error("Catálogo Supabase: use uma SUPABASE_PUBLISHABLE_KEY válida (sb_publishable_…). Chaves legadas ou privilegiadas não são aceitas.");
  return { url: url.origin, key };
}

export function createPublicBuildClient() {
  const { url, key } = publicSupabaseConfig();
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    // No session/JWT. No auth calls, channels or realtime subscriptions.
    accessToken: async () => null,
    global: { fetch: createBuildFetch(url) },
  });
}
