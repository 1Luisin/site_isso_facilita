// Test-only server fetch fixture. No real Auth or database connections.
import {readFileSync,writeFileSync} from 'node:fs';
const original=globalThis.fetch;
const file=process.env.CATALOG_TEST_FIXTURE;
if(!file)throw Error('Fixture required');
globalThis.fetch=async(input,init)=>{
 const req=new Request(input,init),u=new URL(req.url);
 if(u.origin!=='https://catalog-test.example.com')return original(input,init);
 const db=JSON.parse(readFileSync(file,'utf8'));
 if(u.pathname==='/auth/v1/user')return req.headers.get('authorization')==='Bearer fixture.owner.token'?Response.json({id:'10000000-0000-4000-8000-000000000099',aud:'authenticated',role:'authenticated'}):Response.json({message:'Invalid token'},{status:401});
 if(u.pathname==='/rest/v1/admin_profiles')return Response.json({role:'owner',active:true,display_name:null});
 if(u.pathname==='/rest/v1/rpc/admin_save_product'){
  const p=await req.json();
  if(req.headers.get('authorization')!=='Bearer fixture.owner.token')throw Error('Missing user JWT');
  if(p.p_name==='fail-mutation')return Response.json({code:'23505',message:'conflict'},{status:409});
  const row=db.products.find(r=>r.id===p.p_id);
  Object.assign(row,{name:p.p_name,slug:p.p_slug,description:p.p_description,published:p.p_published});
  db.product_affiliate_links.find(r=>r.product_id===row.id).url=p.p_affiliate_url;
  writeFileSync(file,JSON.stringify(db));return Response.json(row.id);
 }
 const table=u.pathname.replace('/rest/v1/','');
 let rows=db[table];if(!rows)throw Error('Unexpected fixture query');
 if(table==='products')rows=rows.filter(r=>r.published);
 if(['product_affiliate_links','product_images','collection_products','content_products'].includes(table))rows=rows.filter(r=>db.products.some(p=>p.id===r.product_id&&p.published));
 for(const [k,v] of u.searchParams)if(v.startsWith('eq.'))rows=rows.filter(r=>String(r[k])===v.slice(3));
 if(req.headers.get('accept')?.includes('vnd.pgrst.object'))return Response.json(rows[0]??null);
 return Response.json(rows);
};
