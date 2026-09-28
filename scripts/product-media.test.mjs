import test from 'node:test';
import assert from 'node:assert/strict';
import {mediaKeys,validateMediaPair,mediaUrl,isMediaUrl,validateImageFile,fitImage,imageAlt,MAX_IMAGE_BYTES} from '../src/lib/product-media/paths.ts';
import {rasterDimensions} from '../src/lib/product-media/process.ts';
import {uploadPair} from '../src/lib/product-media/upload.ts';
import sharp from 'sharp';
const id='10000000-0000-4000-8000-000000000001', version='20000000-0000-4000-8000-000000000002';
const keys=mediaKeys(id,version), blobs={main:new Blob(['main']),mobile:new Blob(['mobile'])};
test('paths imutáveis por produto/versão, rejeita outro produto/bucket/traversal',()=>{
  validateMediaPair(id,'catalog-media',keys.main,keys.mobile);
  for(const [p,b,m,n] of [[version,'catalog-media',keys.main,keys.mobile],[id,'other',keys.main,keys.mobile],[id,'catalog-media','../main.webp',keys.mobile],[id,'catalog-media',keys.mobile,keys.mobile]])assert.throws(()=>validateMediaPair(p,b,m,n));
  assert.notEqual(keys.main,mediaKeys(id,id).main);
});
test('URL pública controlada e legado local',()=>{
  assert.equal(mediaUrl('',null,'/products/test.webp'),'/products/test.webp');
  const url=mediaUrl('https://example.com','catalog-media',keys.main);
  assert.ok(isMediaUrl(url,'https://example.com'));assert.ok(!isMediaUrl(url,'https://other.example.com'));
  assert.throws(()=>mediaUrl('https://example.com','catalog-media','../a'));
});
test('MIME e limite',()=>{
  for(const type of ['image/jpeg','image/png','image/webp'])validateImageFile({type,size:MAX_IMAGE_BYTES});
  for(const type of ['image/svg+xml','image/gif','image/heic','text/html'])assert.throws(()=>validateImageFile({type,size:100}));
  assert.throws(()=>validateImageFile({type:'image/png',size:MAX_IMAGE_BYTES+1}));
});
test('dimensões mantêm proporção sem ampliar',()=>{
  assert.deepEqual(fitImage(1800,900,900),{width:900,height:450});
  assert.deepEqual(fitImage(200,300,480),{width:200,height:300});
  assert.throws(()=>fitImage(20000,20000,900));
});
test('SVG disfarçado e cabeçalho inválido são rejeitados antes de decodificar',()=>{
  assert.throws(()=>rasterDimensions(new TextEncoder().encode('<svg width="900"></svg>'),'image/png'));
});
test('cabeçalhos reais JPEG, PNG e WebP informam dimensões',async()=>{
  for(const format of ['jpeg','png','webp']){
    const bytes=await sharp({create:{width:600,height:300,channels:4,background:{r:200,g:100,b:150,alpha:0.5}}}).toFormat(format).toBuffer();
    assert.deepEqual(rasterDimensions(bytes,`image/${format}`),{width:600,height:300});
  }
});
test('alt padrão e limite',()=>{assert.equal(imageAlt(' ','Produto'),'Produto');assert.throws(()=>imageAlt('a'.repeat(301),'Produto'));});
test('upload parcial compensa main/mobile sem associar',async()=>{
  const calls=[];
  const result=await uploadPair(keys,blobs,{upload:async p=>{calls.push(p);if(p===keys.mobile)throw Error();},cleanup:async p=>calls.push(p),associate:async()=>{throw Error('never');}});
  assert.equal(result.ok,false);assert.deepEqual(calls.at(-1),[keys.main,keys.mobile]);
});
test('falha de associação limpa par; sucesso com aviso nunca compensa',async()=>{
  let removed=0;
  const base={upload:async()=>{},cleanup:async()=>{removed++;}};
  assert.equal((await uploadPair(keys,blobs,{...base,associate:async()=>({ok:false,message:'Conflito'})})).ok,false);
  assert.equal(removed,1);
  assert.equal((await uploadPair(keys,blobs,{...base,associate:async()=>({ok:true,warning:'Cleanup antigo pendente'})})).ok,true);
  assert.equal(removed,1);
});
test('resposta ambígua tenta compensação e comunica falha sem afirmar rollback',async()=>{
  const result=await uploadPair(keys,blobs,{upload:async()=>{},associate:async()=>{throw Error();},cleanup:async()=>{throw Error();}});
  assert.equal(result.ok,false);assert.match(result.message,/verificar se a imagem foi salva/);
});
