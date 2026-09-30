"use client";
import { useEffect,useState } from "react";
import { readGroups,type GroupData } from "@/lib/admin-groups/browser";
export function useGroups() {
  const [data,setData]=useState<GroupData|null>(null),[error,setError]=useState(false),[revision,setRevision]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    void readGroups(controller.signal).then(d=>{if(!controller.signal.aborted){setData(d);setError(false);}}).catch(()=>{if(!controller.signal.aborted)setError(true);});
    return ()=>controller.abort();
  },[revision]);
  return {data,error,reload:()=>setRevision(r=>r+1)};
}
