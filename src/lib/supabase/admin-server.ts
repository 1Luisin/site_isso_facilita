import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { publicSupabaseConfig } from "./public";
import { isActiveAdmin } from "../admin-access";
import { ProductError } from "../admin-products/validation";
export async function authenticatedAdmin(jwt: unknown, ownerOnly = false) {
  if (typeof jwt !== "string" || jwt.length>8192 || jwt.split(".").length!==3) throw new ProductError("Sessão inválida. Entre novamente.");
  const { url,key } = publicSupabaseConfig();
  const safeFetch: typeof fetch = (input,init) => {
    const request = new Request(input,init);
    if (new URL(request.url).origin!==url) throw new ProductError("Destino administrativo inválido.");
    return fetch(request,{cache:"no-store",redirect:"error",signal:AbortSignal.any([request.signal,AbortSignal.timeout(20000)])});
  };
  // Separate Auth verifier: accessToken-mode clients intentionally disable auth methods.
  const verifier = createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:safeFetch}});
  const { data,error } = await verifier.auth.getUser(jwt);
  if (error || !data.user) throw new ProductError("Sessão expirada ou inválida. Entre novamente.");
  const client = createClient<Database>(url,key,{accessToken:async()=>jwt,auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:safeFetch}});
  const {data:profile,error:profileError} = await client.from("admin_profiles").select("role,active,display_name").eq("user_id",data.user.id).maybeSingle();
  if (profileError || !isActiveAdmin(profile) || (ownerOnly && profile.role!=="owner")) throw new ProductError("Seu perfil não tem permissão para esta operação.");
  return client;
}
