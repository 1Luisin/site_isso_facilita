import {test} from 'node:test';
import assert from 'node:assert/strict';
import {english,translate,localizedPath,findsLabel,contentLabel} from '../src/lib/i18n.ts';
import {categories,publishedProducts,publishedCollections,publishedVideos} from '../src/lib/data.ts';

test('every current static editorial field has a reviewed English translation',()=>{
  const texts=[...categories.flatMap(c=>[c.name,c.description]),...publishedProducts.flatMap(p=>[p.name,p.description]),...publishedCollections.map(c=>c.name),...publishedVideos.flatMap(c=>[c.title,c.description])];
  for(const text of texts) assert.ok(english[text],`Missing English translation: ${text}`);
});
test('Portuguese remains unchanged; unknown editorial text is never invented',()=>{
  assert.equal(translate('pt','Luminária Hello Kitty'),'Luminária Hello Kitty');
  assert.equal(translate('en','Luminária Hello Kitty'),'Hello Kitty lamp');
  assert.equal(translate('en','New editorial text'),'New editorial text');
});
test('language routes preserve entity slugs and anchors',()=>{
  assert.equal(localizedPath('/','en'),'/en');
  assert.equal(localizedPath('/produto/luminaria-de-mesa','en'),'/en/produto/luminaria-de-mesa');
  assert.equal(localizedPath('/#catalogo','en'),'/en#catalogo');
  assert.equal(localizedPath('/v/002','pt'),'/v/002');
});
test('counts and editorial type labels are natural English',()=>{
  assert.equal(findsLabel(1,'en'),'1 find');
  assert.equal(findsLabel(10,'en'),'10 finds');
  assert.equal(contentLabel('carousel','en'),'carousel');
  assert.equal(contentLabel('short','en'),'Reel / Short');
});
