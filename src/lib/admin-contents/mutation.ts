import { PUBLIC_CATALOG_TAG } from "../data-source/cache-policy.ts";
import { contentErrorMessage } from "./validation.ts";
export type ContentResult={ok:true;id:string;warning?:string}|{ok:false;message:string};
export async function runContentMutation(write:()=>Promise<{id:string;warning?:string}>,invalidate:(tag:string)=>void):Promise<ContentResult>{
  let result:{id:string;warning?:string};
  try{result=await write();}catch(e){return {ok:false,message:contentErrorMessage(e)};}
  try{invalidate(PUBLIC_CATALOG_TAG);}catch{return {ok:true,...result,warning:"Alteração salva, mas a atualização pública não foi confirmada. Reabra e salve novamente."};}
  return {ok:true,...result};
}
