"use client";
import { useEffect,useState } from "react";
import { readAdminContents,type AdminContentData } from "@/lib/admin-contents/browser";
export function useContents() {
  const [data,setData]=useState<AdminContentData|null>(null),[error,setError]=useState(false),[revision,setRevision]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    void readAdminContents(controller.signal).then(d=>{if(!controller.signal.aborted){setData(d);setError(false);}}).catch(()=>{if(!controller.signal.aborted)setError(true);});
    return ()=>controller.abort();
  },[revision]);
  return {data,error,reload:()=>setRevision(r=>r+1)};
}
