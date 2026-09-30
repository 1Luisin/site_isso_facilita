"use server";
import {updateTag} from "next/cache";
import {authenticatedAdmin} from "@/lib/supabase/admin-server";
import {runGroupMutation} from "@/lib/admin-groups/mutation";
import {validateGroupInput,validateGroupVersion,validateGroupOrder,validateKind,GroupError,type GroupKind} from "@/lib/admin-groups/validation";
export async function saveGroup(jwt:string,kind:GroupKind,raw:unknown){return runGroupMutation(async()=>{
 const client=await authenticatedAdmin(jwt),v=validateGroupInput(kind,raw);
 const result=kind==="category"?await client.rpc("admin_save_category",{p_id:v.id,p_name:v.name,p_slug:v.slug,p_symbol:v.symbol,p_description:v.description,p_active:v.active,p_sort_order:v.sort_order,p_expected_updated_at:v.expected_updated_at}):await client.rpc("admin_save_collection",{p_id:v.id,p_name:v.name,p_slug:v.slug,p_description:v.description,p_style:v.style_index,p_sort_order:v.sort_order,p_published:v.published,p_products:v.product_ids,p_expected_updated_at:v.expected_updated_at});
 if(result.error)throw result.error;if(!result.data)throw new GroupError("Salvamento não confirmado.");return result.data;
},updateTag);}
export async function deleteGroup(jwt:string,kind:GroupKind,id:string,version:string,confirmation:string){return runGroupMutation(async()=>{
 const client=await authenticatedAdmin(jwt,true);validateKind(kind);validateGroupVersion(id,version);
 if(confirmation!=="EXCLUIR")throw new GroupError("Confirme a exclusão digitando EXCLUIR.");
 const {data,error}=await client.rpc("admin_delete_editorial_group",{p_kind:kind,p_id:id,p_expected_updated_at:version});if(error)throw error;return data;
},updateTag);}
export async function reorderGroups(jwt:string,kind:GroupKind,items:unknown){return runGroupMutation(async()=>{
 const client=await authenticatedAdmin(jwt),order=validateGroupOrder(kind,items);
 const {error}=await client.rpc("admin_reorder_editorial_groups",{p_kind:kind,p_ids:order.map(i=>i.id),p_versions:order.map(i=>i.updated_at)});if(error)throw error;return kind;
},updateTag);}
