import { Suspense } from "react";
import { AdminProductEditor } from "@/components/admin/product-editor";
async function Editor({params}:{params:Promise<{id:string}>}){const {id}=await params;return <AdminProductEditor id={id}/>;}
export default function EditProductPage({params}:{params:Promise<{id:string}>}){return <Suspense fallback={<p role="status">Carregando…</p>}><Editor params={params}/></Suspense>;}
