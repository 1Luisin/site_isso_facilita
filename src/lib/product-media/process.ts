import { fitImage, MAX_IMAGE_BYTES, validateImageFile } from "./paths.ts";

// Inspect raster headers before allocating a decoded bitmap (including disguised SVG).
export function rasterDimensions(bytes: Uint8Array, type: string) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (a: number, b: number) => String.fromCharCode(...bytes.slice(a,b));
  let width = 0, height = 0;
  if (type === "image/png" && bytes.length >= 24 && bytes[0] === 137 && ascii(1,4) === "PNG" && ascii(12,16) === "IHDR") {
    width=view.getUint32(16); height=view.getUint32(20);
  } else if (type === "image/jpeg" && bytes[0]===255 && bytes[1]===216) {
    for(let i=2;i+9<bytes.length;) {
      if(bytes[i++]!==255) break;
      while(bytes[i]===255)i++;
      const marker=bytes[i++];
      if(marker===218 || marker===217)break;
      if(marker===1 || (marker>=208 && marker<=215))continue;
      const length=view.getUint16(i);
      if(length<2 || i+length>bytes.length)break;
      if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)) {
        height=view.getUint16(i+3); width=view.getUint16(i+5); break;
      }
      i+=length;
    }
  } else if(type==="image/webp" && bytes.length>=30 && ascii(0,4)==="RIFF" && ascii(8,12)==="WEBP") {
    const kind=ascii(12,16);
    if(kind==="VP8X") {
      if(bytes[20]&2)throw new Error("Selecione uma imagem sem animação.");
      width=1+bytes[24]+(bytes[25]<<8)+(bytes[26]<<16); height=1+bytes[27]+(bytes[28]<<8)+(bytes[29]<<16);
    } else if(kind==="VP8 " && bytes[23]===157 && bytes[24]===1 && bytes[25]===42) {
      width=view.getUint16(26,true)&16383; height=view.getUint16(28,true)&16383;
    } else if(kind==="VP8L" && bytes[20]===47) {
      const bits=view.getUint32(21,true); width=1+(bits&16383); height=1+((bits>>>14)&16383);
    }
  }
  fitImage(width,height,900);
  return {width,height};
}

export async function processProductImage(file: File) {
  validateImageFile(file);
  const bytes=new Uint8Array(await file.arrayBuffer());
  rasterDimensions(bytes,file.type);
  let bitmap: ImageBitmap;
  try { bitmap=await createImageBitmap(file, {imageOrientation:"from-image"}); }
  catch { throw new Error("Não foi possível processar esta imagem."); }
  try {
    const encode=async(limit:number)=>{
      const {width,height}=fitImage(bitmap.width,bitmap.height,limit);
      const canvas=document.createElement("canvas"); canvas.width=width; canvas.height=height;
      try {
        const context=canvas.getContext("2d",{alpha:true});
        if(!context)throw new Error("Não foi possível processar esta imagem.");
        context.drawImage(bitmap,0,0,width,height);
        const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/webp",0.86));
        if(!blob || blob.type!=="image/webp" || blob.size>MAX_IMAGE_BYTES)throw new Error("Não foi possível gerar uma imagem WebP de até 6 MB neste navegador.");
        return blob;
      } finally {canvas.width=0;canvas.height=0;}
    };
    return {main:await encode(900),mobile:await encode(480)};
  } finally {bitmap.close();}
}
