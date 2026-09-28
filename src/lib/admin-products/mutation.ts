import { PUBLIC_CATALOG_TAG } from "../data-source/cache-policy.ts";
import { productErrorMessage } from "./validation.ts";
export type MutationResult = { ok: true; id: string } | { ok: false; message: string };
// Only a committed mutation reaches invalidation. Dependency is injected for offline tests.
export async function runProductMutation(write: () => Promise<string>, invalidate: (tag: string) => void): Promise<MutationResult> {
  let id: string;
  try { id = await write(); } catch (error) { return { ok:false, message:productErrorMessage(error) }; }
  try { invalidate(PUBLIC_CATALOG_TAG); }
  catch { return { ok:false, message:"Produto salvo, mas a atualização pública não foi confirmada. Salve novamente para tentar atualizar o site." }; }
  return { ok:true,id };
}
