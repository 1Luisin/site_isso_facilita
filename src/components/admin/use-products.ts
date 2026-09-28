"use client";
import { useEffect,useState } from "react";
import { readAdminProducts,type AdminProductData } from "@/lib/admin-products/browser";
export function useProducts() {
  const [data,setData]=useState<AdminProductData|null>(null),[error,setError]=useState(false),[revision,setRevision]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    void readAdminProducts(controller.signal).then(d=>{if(!controller.signal.aborted){setData(d);setError(false);}}).catch(()=>{if(!controller.signal.aborted)setError(true);});
    return ()=>controller.abort();
  },[revision]);
  return {data,error,reload:()=>setRevision(r=>r+1)};
}
