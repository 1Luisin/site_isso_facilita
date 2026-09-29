import { Suspense } from "react";
import { AdminContentEditor } from "@/components/admin/content-editor";
async function Editor({params}:{params:Promise<{id:string}>}){const {id}=await params;return <AdminContentEditor id={id}/>;}
export default function EditContentPage({params}:{params:Promise<{id:string}>}){return <Suspense fallback={<p role="status">Carregando…</p>}><Editor params={params}/></Suspense>;}
