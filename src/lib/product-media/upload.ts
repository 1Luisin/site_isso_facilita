export type MediaResult = { ok: true; warning?: string } | { ok: false; message: string };
type Transfer = {
  upload: (path: string, body: Blob) => Promise<void>;
  cleanup: (paths: string[]) => Promise<void>;
  associate: () => Promise<MediaResult>;
};
// On an ambiguous network failure, RLS prevents compensation from deleting an
// image that actually committed. Never interpret cleanup failure as a DB rollback.
export async function uploadPair(keys: {main:string;mobile:string}, blobs: {main:Blob;mobile:Blob}, transfer: Transfer): Promise<MediaResult> {
  const attempted: string[]=[];
  try {
    attempted.push(keys.main); await transfer.upload(keys.main,blobs.main);
    attempted.push(keys.mobile); await transfer.upload(keys.mobile,blobs.mobile);
    const result=await transfer.associate();
    if(result.ok)return result;
    try {await transfer.cleanup(attempted);} catch {return {ok:false,message:result.message+" A limpeza não foi confirmada; reabra o item antes de tentar novamente."};}
    return result;
  } catch {
    try {await transfer.cleanup(attempted);} catch {return {ok:false,message:"Operação interrompida. Reabra o item para verificar se a imagem foi salva; a limpeza não foi confirmada."};}
    return {ok:false,message:"Não foi possível enviar a imagem. Confira a conexão e tente novamente."};
  }
}
