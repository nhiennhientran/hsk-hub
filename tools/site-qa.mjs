import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import vm from 'node:vm';

const root=process.cwd();
const errors=[],warnings=[];
const ok=(cond,msg)=>{if(!cond)errors.push(msg)};
const warn=(cond,msg)=>{if(!cond)warnings.push(msg)};
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>fs.existsSync(path.join(root,p));

function runClassic(code,context,name){vm.runInNewContext(code,context,{filename:name,timeout:3000})}
function decodePackedJS(file){
  const code=read(file);const m=code.match(/atob\(['"]([A-Za-z0-9+/=\s]+)['"]\)/s);
  if(!m)throw new Error(`${file}: packed base64 not found`);
  return JSON.parse(zlib.gunzipSync(Buffer.from(m[1].replace(/\s/g,''),'base64')).toString('utf8'));
}
function loadHSK1(){
  const context={window:{},console};context.window.window=context.window;
  for(let i=1;i<=5;i++)runClassic(read(`hsk1/data-${i}.js`),context,`hsk1/data-${i}.js`);
  runClassic(read('hsk1/corrections.js'),context,'hsk1/corrections.js');
  return context.window.HSK1_LESSONS;
}
function loadHSK2(){
  const context={window:{},console};context.window.window=context.window;
  for(let i=1;i<=8;i++)runClassic(read(`data/v7-${i}.js`),context,`data/v7-${i}.js`);
  const b64=context.window.__HSK2_V7;
  if(!b64)throw new Error('HSK2 packed chunks missing');
  return JSON.parse(zlib.gunzipSync(Buffer.from(b64,'base64')).toString('utf8'));
}
function loadHSK3(){
  const data=decodePackedJS('hsk3/data.js');
  const context={window:{HSK3_LESSONS:data},console};context.window.window=context.window;
  runClassic(read('hsk3/corrections.js'),context,'hsk3/corrections.js');
  runClassic(read('hsk3/textbook-baseline.js'),context,'hsk3/textbook-baseline.js');
  return context.window.HSK3_LESSONS;
}
function loadHSK4Lower(){
  const context={window:{},console};context.window.window=context.window;
  runClassic(read('hsk4/data.js'),context,'hsk4/data.js');
  for(let i=11;i<=20;i++)runClassic(read(`hsk4/data/${i}.js`),context,`hsk4/data/${i}.js`);
  return context.window.HSK4_LOWER_LESSONS;
}

const official1=['你好！','谢谢你！','你叫什么名字？','她是我的汉语老师。','她女儿今年二十岁。','我会说汉语。','今天几号？','我想喝茶。','你儿子在哪儿工作？','我能坐这儿吗？','现在几点？','明天天气怎么样？','他在学做中国菜呢。','她买了不少衣服。','我是坐飞机来的。'];
const official3=['周末你有什么打算？','他什么时候回来？','桌子上放着很多饮料。','她总是笑着跟客人说话。','我最近越来越胖了。','怎么突然找不到了？','我跟她都认识五年了。','你去哪儿我就去哪儿。','她的汉语说得跟中国人一样好。','数学比历史难多了。','别忘了把空调关了。','把重要的东西放在我这儿吧。','我是走回来的。','你把水果拿过来。','其他都没什么问题。','我现在累得下了班就想睡觉。','谁都有办法看好你的“病”。','我相信他们会同意的。','你没看出来吗？','我被他影响了。'];
const official4Lower=['读书好，读好书，好读书','用心发现世界','喝着茶看京剧','保护地球母亲','教育孩子的艺术','生活可以更美好。','人与自然','科技与世界','生活的味道','路上的风景'];
const official4Grammar={
11:['连','否则','无论','然而','同时'],12:['并且','再……也……','对于','名量词重叠','相反'],13:['大概','偶尔','由','进行','随着'],14:['够','以','既然','于是','什么的'],15:['想起来','弄','千万','来','左右'],16:['可','恐怕','到底','拿……来说','敢'],17:['倒','干','趟','为了……而……','仍然'],18:['是否','受不了','接着','除此以外','把……叫作……'],19:['疑问代词活用表示任指','上','出来','总的来说','在于'],20:['动词+着+动词+着','一……就……','究竟','起来','动词+起']};

let h1,h2,h3,h4;
try{h1=loadHSK1()}catch(e){errors.push(`HSK1 load failed: ${e.message}`)}
try{h2=loadHSK2()}catch(e){errors.push(`HSK2 load failed: ${e.message}`)}
try{h3=loadHSK3()}catch(e){errors.push(`HSK3 load failed: ${e.message}`)}
try{h4=loadHSK4Lower()}catch(e){errors.push(`HSK4 Lower load failed: ${e.message}`)}

function validateLessons(data,total,label,officialTitles,startId=1){
  ok(Array.isArray(data),`${label}: lessons is not an array`);if(!Array.isArray(data))return;
  ok(data.length===total,`${label}: expected ${total} lessons, got ${data.length}`);
  const ids=data.map(x=>Number(x.id));ok(new Set(ids).size===data.length,`${label}: duplicate lesson IDs`);
  for(let n=startId;n<startId+total;n++)ok(ids.includes(n),`${label}: lesson ${n} missing`);
  data.forEach((L,i)=>{
    ok(String(L.title||'').trim(),`${label} lesson ${L.id}: title missing`);
    ok(String(L.vn_title||'').trim(),`${label} lesson ${L.id}: Vietnamese title missing`);
    ok(Array.isArray(L.vocab)&&L.vocab.length>0,`${label} lesson ${L.id}: vocab missing`);
    if(Array.isArray(L.vocab)){
      const zs=L.vocab.map(v=>String(v.zh||'').trim()).filter(Boolean);
      ok(zs.length===L.vocab.length,`${label} lesson ${L.id}: vocab item without Chinese headword`);
      const dup=[...new Set(zs.filter((z,j)=>zs.indexOf(z)!==j))];
      ok(!dup.length,`${label} lesson ${L.id}: duplicate vocab ${dup.join(', ')}`);
      L.vocab.forEach(v=>warn(String(v.vn||'').trim(),`${label} lesson ${L.id}: ${v.zh} has no Vietnamese meaning`));
    }
    warn(Array.isArray(L.grammar)&&L.grammar.length>0,`${label} lesson ${L.id}: grammar array empty`);
    warn(Array.isArray(L.scenes)&&L.scenes.length>0,`${label} lesson ${L.id}: scenes array empty`);
    if(officialTitles?.[i])ok(L.title===officialTitles[i],`${label} lesson ${L.id}: title mismatch “${L.title}”`);
  });
}
validateLessons(h1,15,'HSK1',official1);
validateLessons(h2,15,'HSK2');
validateLessons(h3,20,'HSK3',official3);
validateLessons(h4,10,'HSK4 Lower',official4Lower,11);

if(Array.isArray(h3))h3.forEach(L=>{
  ok((L.textbookVocabCount||0)>0,`HSK3 lesson ${L.id}: textbook vocabulary baseline missing`);
  ok((L.textbookGrammarCount||0)>0,`HSK3 lesson ${L.id}: textbook grammar baseline missing`);
  const added=L.vocab.filter(v=>v.textbookAdded);
  if(added.length)warnings.push(`HSK3 lesson ${L.id}: baseline restored ${added.length} missing textbook word(s): ${added.map(v=>v.zh).join(', ')}`);
});
if(Array.isArray(h4))h4.forEach(L=>{
  ok(L.vocab.length>=29,`HSK4 Lower lesson ${L.id}: expected about 30 vocab items, got ${L.vocab.length}`);
  ok(Array.isArray(L.grammar)&&L.grammar.length===5,`HSK4 Lower lesson ${L.id}: expected 5 language points`);
  ok(Array.isArray(L.scenes)&&L.scenes.length===5,`HSK4 Lower lesson ${L.id}: expected 5 text units`);
  ok(L.compare?.title,`HSK4 Lower lesson ${L.id}: 比一比 missing`);
  ok(L.expansion?.char,`HSK4 Lower lesson ${L.id}: 同字词 expansion missing`);
  ok(L.culture?.title,`HSK4 Lower lesson ${L.id}: culture missing`);
  ok(JSON.stringify(L.grammar.map(g=>g.title))===JSON.stringify(official4Grammar[L.id]),`HSK4 Lower lesson ${L.id}: language-point baseline mismatch`);
});

// Validate local src/href references in every HTML file.
const htmlFiles=[];
(function walk(dir='.'){
  for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
    if(['.git','node_modules'].includes(e.name))continue;
    const rel=path.posix.join(dir==='.'?'':dir,e.name);
    if(e.isDirectory())walk(rel);else if(e.name.endsWith('.html'))htmlFiles.push(rel);
  }
})();
for(const file of htmlFiles){
  const code=read(file),base=path.posix.dirname(file);
  for(const m of code.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
    let ref=m[1];if(!ref||/^(https?:|mailto:|tel:|data:|javascript:|#)/i.test(ref))continue;
    ref=ref.split(/[?#]/)[0];if(!ref)continue;
    const resolved=path.posix.normalize(path.posix.join(base,ref));
    ok(exists(resolved),`${file}: broken local reference -> ${ref} (${resolved})`);
  }
}

// Product-level invariants.
const portal=read('index.html');
ok(/hsk1\/index\.html/.test(portal),'Portal: HSK1 link missing');
ok(/hsk2\.html/.test(portal),'Portal: HSK2 link missing');
ok(/hsk3\/index\.html/.test(portal),'Portal: HSK3 link missing');
ok(/hsk4\/index\.html/.test(portal),'Portal: HSK4 Lower link missing');
const sessionKey='hsk_portal_unlocked_v2';
for(const file of ['assets/session-auth.js','hsk1/auth-patch.js','assets/app.js'])ok(read(file).includes(sessionKey),`${file}: session-only one-password key missing`);
ok(portal.includes('assets/session-auth.js'),'index.html: shared session auth missing');
ok(read('hsk3/runtime-loader-core.js').includes('../assets/session-auth.js'),'hsk3/runtime-loader-core.js: shared session auth missing');
ok(read('hsk4up/app-practice.js').includes('../assets/session-auth.js'),'hsk4up/app-practice.js: shared session auth missing');
ok(read('hsk4/practice.js').includes('../assets/session-auth.js'),'hsk4/practice.js: shared session auth missing');
ok(!portal.includes("localStorage.setItem('hsk_site_unlocked_v1'"),'index.html: persistent password unlock must not be restored');

// HSK1 keeps parity assets as direct tags.
{
  const c=read('hsk1/lesson.html');
  ok(c.includes('hsk2-parity.js'),'hsk1/lesson.html: HSK2 parity layer missing');
  ok(c.includes('hanzi-curriculum.js'),'hsk1/lesson.html: textbook Hanzi curriculum missing');
  ok(c.includes('lesson-menu-parity.js'),'hsk1/lesson.html: HSK2-style lesson menu missing');
  ok(c.includes('hanzi-visibility-fix.js'),'hsk1/lesson.html: Hanzi visible-layout fix missing');
}
// HSK3 now uses a validated dynamic bootstrap; check that chain rather than obsolete direct tags.
for(const file of ['hsk3/index.html','hsk3/lesson.html'])ok(read(file).includes('runtime-loader.js'),`${file}: HSK3 runtime loader missing`);
{
  const loader=read('hsk3/runtime-loader-core.js');
  for(const asset of ['corrections.js','textbook-baseline.js','app-core.js','app-practice.js','hsk2-parity.js','lesson-menu-parity.js','hanzi-curriculum.js','session-auth.js'])ok(loader.includes(asset),`hsk3/runtime-loader-core.js: ${asset} missing from bootstrap chain`);
}
// HSK4 Lower core files and data coverage.
for(const file of ['hsk4/index.html','hsk4/lesson.html','hsk4/runtime.js','hsk4/modules.js','hsk4/practice.js','hsk4/data.js'])ok(exists(file),`${file}: missing`);
for(let i=11;i<=20;i++)ok(exists(`hsk4/data/${i}.js`),`hsk4/data/${i}.js: missing`);

const report={passed:errors.length===0,errors,warnings,summary:{hsk1:Array.isArray(h1)?h1.length:0,hsk2:Array.isArray(h2)?h2.length:0,hsk3:Array.isArray(h3)?h3.length:0,hsk4Lower:Array.isArray(h4)?h4.length:0,htmlFiles:htmlFiles.length}};
fs.mkdirSync(path.join(root,'qa'),{recursive:true});
fs.writeFileSync(path.join(root,'qa','site-qa-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(errors.length)process.exit(1);
