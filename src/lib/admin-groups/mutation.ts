import {PUBLIC_CATALOG_TAG} from "../data-source/cache-policy.ts";
import {groupErrorMessage} from "./validation.ts";
export async function runGroupMutation(write:()=>Promise<string>,invalidate:(tag:string)=>void):Promise<{ok:true;id:string;warning?:string}|{ok:false;message:string}>{
 let id:string;try{id=await write();}catch(e){return {ok:false,message:groupErrorMessage(e)};}
 try{invalidate(PUBLIC_CATALOG_TAG);}catch{return {ok:true,id,warning:"Registro salvo, mas a atualização pública não foi confirmada. Recarregue e salve novamente."};}
 return {ok:true,id};
}
