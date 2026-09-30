import {Suspense} from "react";
import {AdminGroupEditor} from "@/components/admin/group-editor";
async function Editor({params}:{params:Promise<{id:string}>}){const {id}=await params;return <AdminGroupEditor kind="category" id={id}/>;}
export default function Page({params}:{params:Promise<{id:string}>}){return <Suspense fallback={<p role="status">Carregando…</p>}><Editor params={params}/></Suspense>;}
