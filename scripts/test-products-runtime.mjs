import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import path from 'node:path';import {pathToFileURL} from 'node:url';import {spawn} from 'node:child_process';import {setTimeout as delay} from 'node:timers/promises';
import {getStaticSnapshot} from '../src/lib/data-source/static.ts';
const s=getStaticSnapshot(),id='10000000-0000-4000-8000-000000000001',cat='10000000-0000-4000-8000-000000000002';
const tables={
 categories:s.categories.map((c,i)=>({...c,id:i===0?cat:c.slug,active:true})),
 products:s.products.map((p,i)=>({...p,id:i===0?id:p.slug,category_id:s.categories[0].slug===p.category?cat:p.category,published:true})),
 collections:s.collections.map(c=>({...c,id:c.slug,style_index:c.styleIndex,published:true})),
 contents:s.contents.map(c=>({...c,id:c.code,content_type:c.contentType,cover_path:c.cover,mobile_cover_path:c.mobileCover,published:true})),
 site_settings:[{site_name:s.settings.name,tagline:s.settings.tagline,footer_text:s.settings.footerText,featured_content_id:s.settings.featuredContentCode,instagram_url:null,tiktok_url:null,youtube_url:null}],
 content_links:s.contents.flatMap(c=>Object.entries(c.links).map(([platform,url])=>({content_id:c.code,platform,url}))),
};
const pid=slug=>slug===s.products[0].slug?id:slug;
tables.product_images=s.products.map(p=>({product_id:pid(p.slug),storage_path:p.image,mobile_storage_path:p.mobileImage,is_primary:true}));
tables.product_affiliate_links=s.products.map(p=>({product_id:pid(p.slug),url:p.affiliateUrl,is_primary:true,active:true}));
tables.collection_products=s.collections.flatMap(c=>c.slugs.map((slug,sort_order)=>({collection_id:c.slug,product_id:pid(slug),sort_order})));
tables.content_products=s.contents.flatMap(c=>c.slugs.map((slug,sort_order)=>({content_id:c.code,product_id:pid(slug),sort_order})));
const temp=await mkdtemp(path.join(tmpdir(),'isso-product-action-')),file=path.join(temp,'tables.json');await writeFile(file,JSON.stringify(tables));
const actions=JSON.parse(await readFile('.next/server/server-reference-manifest.json','utf8')).node;
const actionId=Object.entries(actions).find(([,v])=>v.exportedName==='saveProduct')?.[0];assert.ok(actionId);
const base='http://127.0.0.1:3017';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3017'],{env:{...process.env,SITE_DATA_SOURCE:'supabase',SUPABASE_URL:'https://catalog-test.example.com',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_runtime_fixture_only',NEXT_PUBLIC_SITE_URL:'https://isso-facilita-ci.example.com',CATALOG_TEST_FIXTURE:file,NODE_OPTIONS:`--import=${pathToFileURL(path.resolve('scripts/products-runtime-fetch.mjs'))}`},stdio:['ignore','pipe','pipe']});
let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
const form={id,name:'Produto alterado no teste',slug:'produto-action-fixture',description:'Descrição nova do teste',category_id:cat,published:true,affiliate_url:'https://s.shopee.com.br/action-fixture',collection_ids:[],expected_updated_at:new Date().toISOString()};
const call=async(token,input)=>{
 const response=await fetch(base+'/admin/produtos/novo',{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8','Next-Action':actionId,Origin:base},body:JSON.stringify([token,input])});
 return await response.text();
};
try{
 for(let i=0;i<60&&!output.includes('Ready');i++){if(child.exitCode!==null)throw Error(output);await delay(500);}
 assert.match(await call('invalid',form),/Sessão inválida/);
 const success=await call('fixture.owner.token',form);assert.ok(success.includes('"ok":true'),success.slice(0,200));
 const html=await(await fetch(base+'/produto/'+form.slug)).text();
 assert.ok(html.includes(form.name+'</h1>'));assert.ok(html.includes(form.description));assert.ok(html.includes(form.affiliate_url));assert.ok(html.includes('/social/isso-facilita.jpg'));
 const old=await(await fetch(base+'/produto/'+s.products[0].slug)).text();assert.ok(old.includes('NEXT_HTTP_ERROR_FALLBACK;404')||old.includes('não encontrado'));
 console.log('Server Action real: JWT validado por Auth mock; nome, descrição, slug, CTA e OG atualizados sem rebuild.');
 const failed=await call('fixture.owner.token',{...form,name:'fail-mutation'});assert.ok(failed.includes('"ok":false'));
 const still=await(await fetch(base+'/produto/'+form.slug)).text();assert.ok(still.includes(form.name+'</h1>'));
 const unpublished=await call('fixture.owner.token',{...form,published:false});assert.ok(unpublished.includes('"ok":true'));
 const gone=await(await fetch(base+'/produto/'+form.slug)).text();assert.ok(gone.includes('NEXT_HTTP_ERROR_FALLBACK;404')||gone.includes('não encontrado'));
 console.log('Falha preserva página válida; despublicação remove rota imediatamente com updateTag, sem esperar 300s.');
}finally{
 if(child.exitCode===null){const done=new Promise(resolve=>child.once('exit',resolve));child.kill();await done;}
 assert.equal(path.dirname(path.resolve(temp)),path.resolve(tmpdir()));assert.ok(path.basename(temp).startsWith('isso-product-action-'));await rm(temp,{recursive:true,force:true});
}
