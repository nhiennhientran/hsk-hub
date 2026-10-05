import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {parseSync} from '../../../node_modules/rolldown/dist/utils-index.mjs';
import {scanRuntimeSVG} from './supplement-svg-scan.mjs';

// New version: writes only this evidence directory; source bytes are an exact
// Git input snapshot. It never overwrites the historical B10 evidence.
const output=path.dirname(fileURLToPath(import.meta.url));
const gitRoot=path.resolve(output,'../../../..');
const root=process.env.VI_INPUT_ROOT?path.resolve(process.env.VI_INPUT_ROOT):path.join(output,'input-snapshot');
const sourceRef=process.env.VI_SOURCE_REF??'1874b4a42ed0bb5afa6a0ed1d17bd882ed85d36b';
const requestedHead=execFileSync('git',['rev-parse',sourceRef],{cwd:gitRoot,encoding:'utf8'}).trim();
const requestedTree=execFileSync('git',['rev-parse',sourceRef+'^{tree}'],{cwd:gitRoot,encoding:'utf8'}).trim();
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
const load=f=>fs.readFileSync(path.join(root,f),'utf8');
const json=f=>JSON.parse(load(f));
const files=[],records=[],failures=[],legacyLayers=[];
const viet=/[áàãéèíìóòõúùýỳÁÀÃÉÈÍÌÓÒÕÚÙÝỲđĐăĂâÂêÊôÔơƠưƯạảấầẩẫậắằẳẵặẹẻẽếềểễệỉĩịọỏốồổỗộớờởỡợụủũứừửữựỵỷỹẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂỄỆỈĨỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦŨỨỪỬỮỰỴỶỸ]/u;
const asciiViet=/\b(?:Nghe|Chọn|Chon|Bạn|Ban|Tôi|Toi|Bài|Bai|Câu|Cau|Xin|Khong|không|Danh|danh|nghĩa|cảm|là|của|và|theo|từ|trợ|động|như|một|này|học|Vào|Hãy|đúng|sai|biết|Nói|Lưu|viết|nào|tốt|vui)\b/u;
const chinese=/[\u3400-\u9fff]/u;
const viKey=k=>/^(?:vi|vn|vn_title|title_vi|titleVi|promptVi|explanationVi|place_vn|meaning_vi|goal_vi|scope_note_vi|labelVi|label_vn)$/i.test(k)||/(?:_vi|_vn|Vi|Vn)$/.test(k);
const likelyVi=(s,k='')=>typeof s==='string'&&!!s.trim()&&(viKey(k)||(!/^(?:py|pinyin|title_py|fingerprint|sha256|id|file|path|edition|sourceText|reason|reviewStatus|editorialStatus)$/i.test(k)&&(viet.test(s)||asciiViet.test(s))));
const ptr=parts=>'/'+parts.map(p=>String(p).replaceAll('~','~0').replaceAll('/','~1')).join('/');
function nearestZH(o,parents){
 for(const v of [o,...parents].filter(v=>v&&typeof v==='object'&&!Array.isArray(v))){
  for(const k of ['zh','senseZh','cueZh','stem','title','title_zh','goal_zh','q','s','speaker'])if(typeof v[k]==='string'&&chinese.test(v[k]))return v[k];
  if(v.title?.zh)return v.title.zh;
  if(v.prompt?.zh)return v.prompt.zh;
  for(const k of ['options','tokens','answers','stems'])if(Array.isArray(v[k])&&v[k].some(x=>typeof x==='string'&&chinese.test(x)))return v[k].filter(x=>typeof x==='string'&&chinese.test(x)).join('；');
  if(typeof v.skill==='string'&&chinese.test(v.skill))return v.skill;
 }
 return null;
}
function lessonFor(file,objects){
 const match=file.match(/\/lesson-(\d+)(?:-current)?\.json$/);if(match)return Number(match[1]);
 for(const o of objects){if(o&&Number.isInteger(o.lesson))return o.lesson;if(o&&Number.isInteger(o.lesson_id))return o.lesson_id;const m=typeof o?.id==='string'?o.id.match(/(?:^|[-:])l(\d{2})(?:[-:]|$)/i):null;if(m)return Number(m[1]);}
 for(const o of [...objects].reverse())if(o&&Number.isInteger(o.id)&&(Array.isArray(o.vocab)||Array.isArray(o.scenes)))return o.id;
 for(const o of [...objects].reverse())if(o&&o.courseId&&Number.isInteger(o.number))return o.number;
 return null;
}
function objectID(o,previous){
 if(o&&typeof o==='object'&&!Array.isArray(o)){
  for(const k of ['id','senseId','target','wordId','authorityId','activityId'])if(typeof o[k]==='string')return previous+'>'+o[k];
  if(Number.isInteger(o.id))return previous+':lesson'+o.id;
  if(Number.isInteger(o.lesson))return previous+':lesson'+o.lesson;
 }
 return previous;
}
function walkJSON(value,file,policy,parts=[],parents=[],identity=policy.component,ownerPath=[],source=null,rootObj=value){
 if(typeof value==='string'){
  const k=String([...parts].reverse().find(p=>typeof p==='string')??'');
  const forced=policy.component==='hsk1-stage3'&&parts.includes('listening')&&['options','optionFeedback'].includes(k);
  const knownVietnamese=policy.knownVietnameseLeaves?.has(ptr(parts))??false;
  if(likelyVi(value,k)||forced||knownVietnamese){
   const pointer=ptr(parts),key=identity+':'+ptr(parts.slice(ownerPath.length));
   const metadata=parts.some(p=>['coverageReview','reviewStatus','textbookCorrections','displayRequirements','constraints','sameFormDecisions','merges','source','appendixMetadata','additionalSourceEvidence','appendixSource','sourceNumberPosSource','qa','design_notes','basis'].includes(p));
   records.push({recordId:sha(file+'\0'+pointer+'\0'+policy.state+'\0'+policy.component).slice(0,24),semanticKey:policy.component+':'+file+':'+key,component:policy.component,itemId:identity.split('>').at(-1),ownerKey:identity,file,pointer,value,chineseContext:nearestZH(null,parents),source,lesson:lessonFor(file,parents),visibility:metadata?'loaded-metadata-not-confirmed-visible':policy.state,sourceKind:forced?'schema-declared-vietnamese-array':knownVietnamese?'schema-declared-vietnamese-legacy-truth-choice':'unlabelled-vietnamese-string',frozen:!!policy.frozen,activityVersion:parents.find(p=>p?.version&&Array.isArray(p.fields))?.version,revisionService:policy.service,consumers:policy.consumers,confidence:forced||knownVietnamese?'schema-explicit':'language-detection-candidate'});
  }
  return;
 }
 if(value&&typeof value==='object'){
  const next=objectID(value,identity),base=next!==identity?parts:ownerPath;
  const inherited=value.source??source;
  if(Array.isArray(value)){value.forEach((v,i)=>walkJSON(v,file,policy,[...parts,i],[value,...parents],next,base,inherited,rootObj));return;}
  for(const[k,v]of Object.entries(value)){
   const knownVietnamese=policy.knownVietnameseLeaves?.has(ptr([...parts,k]))??false;
   if(typeof v==='string'&&(likelyVi(v,k)||knownVietnamese)){
    const pointer=ptr([...parts,k]),key=next+':'+ptr([...parts,k].slice(base.length));
    const metadata=[...parts,k].some(p=>['coverageReview','reviewStatus','textbookCorrections','displayRequirements','constraints','sameFormDecisions','merges','source','appendixMetadata','additionalSourceEvidence','appendixSource','sourceNumberPosSource','qa','design_notes','basis'].includes(p));
    records.push({recordId:sha(file+'\0'+pointer+'\0'+policy.state+'\0'+policy.component).slice(0,24),semanticKey:policy.component+':'+file+':'+key,component:policy.component,itemId:next.split('>').at(-1),ownerKey:next,file,pointer,value:v,chineseContext:nearestZH(value,parents),source:inherited,lesson:lessonFor(file,[value,...parents]),visibility:metadata?'loaded-metadata-not-confirmed-visible':policy.state,sourceKind:viKey(k)?'explicit-language-field':knownVietnamese?'schema-declared-vietnamese-legacy-truth-choice':'unlabelled-vietnamese-string',frozen:!!policy.frozen,activityVersion:parents.find(p=>p?.version&&Array.isArray(p.fields))?.version,revisionService:policy.service,consumers:policy.consumers,confidence:viKey(k)?'explicit':knownVietnamese?'schema-explicit':'language-detection-candidate'});
   }else if(v&&typeof v==='object')walkJSON(v,file,policy,[...parts,k],[value,...parents],next,base,inherited,rootObj);
  }
 }
}
function addJSON(f,policy,value=json(f)){
 files.push({file:f,sha256:sha(load(f)),format:'json',...policy});walkJSON(value,f,policy);
}
function addReplayInput(f,component){if(!files.some(x=>x.file===f))files.push({file:f,sha256:sha(load(f)),format:'compressed-content-input',component,state:'legacy-content-layer-input',service:'known content-only replay',consumers:['legacy effective JSON replay']});}
const frozen=['textbook.json','homework30-bank.json','stage2-bank.json','stage3-catalog.json','legacy-exercises.json'];
const policies={
 'textbook.json':{component:'hsk1-textbook',state:'active-current-display',frozen:true,service:'textbook.ts + textbook-display-revisions.ts',consumers:['standalone textbook','shared HSK1 bridge textbook','active textbook vocabulary detail uses revised scene lines','examplesForSense is API-only; current vocabulary/review card renderer does not display it']},
 'homework30-bank.json':{component:'hsk1-homework30',state:'active-frozen-bank',frozen:true,service:'homework30.ts; presentation-only overlay required',consumers:['homework30','saved homework30 receipt review']},
 'stage2-bank.json':{component:'hsk1-stage2',state:'active-legacy-bank',frozen:true,service:'homework.ts; presentation-only overlay required',consumers:['legacy homework','exercise catalogue stage2 aliases','saved receipt review']},
 'stage3-catalog.json':{component:'hsk1-stage3',state:'active-frozen-bank',frozen:true,service:'listening.ts + vocabulary.ts; presentation-only overlay required',consumers:['listening bank75','vocabulary344 senses','mixed cards','scheduled review','textbook vocabulary catalogSources']},
 'legacy-exercises.json':{component:'hsk1-legacy-exercises',state:'active-archive-catalogue',frozen:true,service:'exercises.ts + catalogue.ts; presentation-only overlay required',consumers:['exercise archive tasks315','entries330 aliases','oral','legacy saved receipt display']},
 'course-index.json':{component:'hsk1-summary',state:'active',service:'content/index.ts',consumers:['HSK1 home cards','shared bridge home']},
 'textbook-restored-targets.json':{component:'hsk1-restoration-index',state:'loaded-validation-metadata',service:'textbook.ts',consumers:['book source restoration validation']},
 'media-references.json':{component:'hsk1-media',state:'loaded-validation-metadata',service:'textbook.ts + listening.ts',consumers:['validated audio bindings']},
};
for(const[f,p]of Object.entries(policies))addJSON('hsk1-app/content/'+f,p);
// Display revision values are applied to a clone; every current VI row points to its actual producer.
const revisions=json('hsk1-app/content/textbook-display-revisions.json'),book=structuredClone(json('hsk1-app/content/textbook.json'));
const targets=new Map();
for(const l of book.lessons){targets.set(`textbook-l${String(l.id).padStart(2,'0')}-title`,l);for(const v of l.vocab)targets.set(v.id,v);for(const s of l.scenes){targets.set(s.id,s);for(const line of s.lines)targets.set(line.id,line);}for(const g of [...l.grammar,...l.phonetics,...l.xiaoyuTips])targets.set(g.id,g);}
for(const c of revisions.changes){const target=targets.get(c.target);if(!target||JSON.stringify(target[c.field])!==JSON.stringify(c.expected))throw Error('Stale display overlay '+c.target+':'+c.field);target[c.field]=structuredClone(c.value);}
const rawBookRecords=records.filter(r=>r.file==='hsk1-app/content/textbook.json');
const effective=[];const previousRecords=records.length;
walkJSON(book,'hsk1-app/content/textbook.json',{...policies['textbook.json'],component:'hsk1-textbook-effective'});
effective.push(...records.splice(previousRecords));
for(const r of effective){r.effectiveOnly=true;const original=rawBookRecords.find(x=>x.pointer===r.pointer);r.rawRecordId=original?.recordId??null;r.changedFromFrozen=original?.value!==r.value;
 if(r.changedFromFrozen){r.producerFile='hsk1-app/content/textbook-display-revisions.json';r.displayRevision=revisions.revision;}else r.producerFile=r.file;
}
for(const r of rawBookRecords){const current=effective.find(x=>x.pointer===r.pointer);r.visibility=current?.value===r.value?'active-via-validated-book-clone':'superseded-frozen-value';}
records.push(...effective);
files.push({file:'hsk1-app/content/textbook-display-revisions.json',sha256:sha(load('hsk1-app/content/textbook-display-revisions.json')),format:'display-overlay',component:'hsk1-textbook-display',state:'active',changes:revisions.changes.length,revision:revisions.revision});
for(let n=1;n<=15;n++){
 const f='hsk1-app/content/source-activities/lesson-'+String(n).padStart(2,'0')+(n===4?'-current':'')+'.json';
 addJSON(f,{component:'hsk1-source-l'+n,state:'active-versioned',service:'source-activities/content.ts; activity version bump required',consumers:['standalone source activity','shared HSK1 source activity','new source record context snapshots']});
}
addJSON('hsk1-app/content/source-activities/lesson-04.json',{component:'hsk1-source-l4-historical',state:'historical-static-export-not-current-catalogue',frozen:true,service:'sourceLesson historical export',consumers:['preserved source v2 fixtures','historical context compatibility; current loader uses lesson-04-current.json']});
for(const level of [2,3]){
 for(let n=1;n<=(level===2?15:18);n++)addJSON(`course-app/content/hsk${level}/lesson-${String(n).padStart(2,'0')}.json`,{component:`hsk${level}-lesson`,state:'active',service:'course-app/content.ts loadLesson; content copies + assessment revision policy',consumers:['lesson','warmup','text questions','grammar','source columns via targetRef/fields','homework','listening','hanzi','activity fields','illustration alt/caption','mixed-card lesson pool']});
 addJSON(`course-app/content/hsk${level}-lexicon.json`,{component:`hsk${level}-lexicon`,state:'loaded-canonical-reference-not-visible',service:'course-app/content.ts loadLexicon + lexicon.ts senseMap',consumers:['canonical sense dedupe','vocabulary cards use lesson-local word VI','appendix sense mapping']});
}
addJSON('course-app/content/course-index.json',{component:'shared-summary',state:'active',service:'content.ts lessonSummaries',consumers:['shared home cards','HSK2/3 summary titles']});

function sourceFiles(dir,extension=/\.(ts|tsx|js|html)$/){if(!fs.existsSync(path.join(root,dir)))return [];return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?sourceFiles(dir+'/'+e.name,extension):extension.test(e.name)?[dir+'/'+e.name]:[]);}
function location(text,pos){const before=text.slice(0,pos);return {line:before.split('\n').length,column:pos-(before.lastIndexOf('\n')+1)+1};}
function propertyName(n){return n?.type==='Identifier'?n.name:n?.value;}
function staticString(n){if(n?.type==='Literal'&&typeof n.value==='string')return n.value;if(n?.type==='TemplateLiteral')return n.quasis.map(q=>q.value.cooked??q.value.raw).join('${expression}');return null;}
function zhSibling(n){if(n?.type!=='ObjectExpression')return null;for(const p of n.properties){if(['zh','title','title_zh','stem'].includes(propertyName(p.key))){const s=staticString(p.value);if(s&&chinese.test(s))return s;}}return null;}
function walkAST(node,parents,file,text,policy,virtual='',astPath=[]){
 if(!node||typeof node!=='object')return;
 const p=parents[0],s=staticString(node),k=p?.type==='Property'&&p.value===node?String(propertyName(p.key)??''):'';
 if(s!==null&&likelyVi(s,k)){
  const call=parents.find(n=>n.type==='CallExpression'),siblings=call?.arguments??[],idx=siblings.indexOf(node);
  let context=parents.map(zhSibling).find(Boolean)??null;
  if(!context&&idx>0){const prev=staticString(siblings[idx-1]);if(prev&&chinese.test(prev))context=prev;}
  const loc=location(text,node.start),templates=node.type==='TemplateLiteral'?node.expressions.map(e=>text.slice(e.start,e.end)):[];
  const owner=parents.find(n=>['FunctionDeclaration','VariableDeclarator','MethodDefinition'].includes(n.type));
  const label=owner?.id?.name??propertyName(owner?.key)??'module';
  records.push({recordId:sha(file+'\0'+virtual+'\0'+node.start+'\0'+node.end).slice(0,24),semanticKey:policy.component+':'+file+':'+label+':'+(virtual?virtual+':':'')+ptr(astPath),astPath:ptr(astPath),component:policy.component,itemId:label,file,virtualSource:virtual||undefined,range:{start:node.start,end:node.end,...loc},value:s,chineseContext:context,sourceKind:templates.length?'dynamic-template':'code-literal',expressions:templates,visibility:policy.state,frozen:false,activityVersion:parents.find(p=>p?.version&&Array.isArray(p.fields))?.version,revisionService:policy.service,consumers:policy.consumers,confidence:viKey(k)?'explicit':'language-detection-candidate',functionArgument:call?{callee:text.slice(call.callee.start,call.callee.end),index:idx}:undefined});
 }
 // Template children already represented above; still inspect expressions for independent copy.
 // Property.value and MethodDefinition.value contain real AST children.
 // Scalar literal values are naturally excluded by the object/type checks below.
 for(const[key,v]of Object.entries(node))if(!['start','end','loc','raw','regex','comments'].includes(key)){
  if(Array.isArray(v)){v.forEach((c,i)=>{if(c&&typeof c==='object')walkAST(c,[node,...parents],file,text,policy,virtual,[...astPath,key,i]);});}
  else if(v&&typeof v==='object'&&v.type)walkAST(v,[node,...parents],file,text,policy,virtual,[...astPath,key]);
 }
}
function parseCode(text,file,policy,virtual=''){
 try{const result=parseSync(file.endsWith('.ts')?file:'content.js',text,{lang:file.endsWith('.ts')?'ts':'js'});if(result.errors.length)failures.push({file,virtualSource:virtual,kind:'parse-errors',errors:result.errors});walkAST(result.program,[],file,text,policy,virtual);}catch(e){failures.push({file,virtualSource:virtual,kind:'parse-failure',message:String(e)});}
}
function scanCode(f,policy){
 const file=f,parents=[];
 const text=load(f);files.push({file:f,sha256:sha(text),format:f.endsWith('.html')?'html':'code',...policy});
 if(f.endsWith('.html')){
  const stripped=text.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,m=>' '.repeat(m.length));
  for(const m of stripped.matchAll(/>([^<>]+)</g)){const s=m[1].trim();if(likelyVi(s)){const loc=location(text,m.index+1);records.push({recordId:sha(f+'\0html\0'+m.index).slice(0,24),semanticKey:policy.component+':'+f+':html:'+m.index,component:policy.component,itemId:'html',file,range:{start:m.index+1,end:m.index+1+m[1].length,...loc},value:s,chineseContext:chinese.test(s)?s:null,sourceKind:'html-text',visibility:policy.state,frozen:false,activityVersion:parents.find(p=>p?.version&&Array.isArray(p.fields))?.version,revisionService:policy.service,consumers:policy.consumers,confidence:'language-detection-candidate'});}}
  for(const m of stripped.matchAll(/\b(?:alt|title|placeholder|aria-label)\s*=\s*(["'])(.*?)\1/gs)){if(likelyVi(m[2])){const loc=location(text,m.index);records.push({recordId:sha(f+'\0attr\0'+m.index).slice(0,24),semanticKey:policy.component+':'+f+':attr:'+m.index,component:policy.component,itemId:'html-attribute',file,range:{start:m.index,end:m.index+m[0].length,...loc},value:m[2],chineseContext:chinese.test(m[2])?m[2]:null,sourceKind:'html-attribute',visibility:policy.state,frozen:false,activityVersion:parents.find(p=>p?.version&&Array.isArray(p.fields))?.version,revisionService:policy.service,consumers:policy.consumers,confidence:'language-detection-candidate'});}}
  [...text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].forEach((m,i)=>{if(!/\bsrc\s*=/.test(m[1])&&m[2].trim())parseCode(m[2],f,policy,'inline-script-'+i);});
 }else parseCode(text,f,policy);
 // Packed code is itself deployed code: decode gzip payloads without executing them.
 for(const m of text.matchAll(/atob\(\s*['"]([A-Za-z0-9+/=]{100,})['"]\s*\)/g)){
  try{const decoded=zlib.gunzipSync(Buffer.from(m[1],'base64')).toString('utf8');if(!/^\s*[\[{]/.test(decoded))parseCode(decoded,f,policy,'gzip-code@'+m.index);}catch(e){failures.push({file:f,kind:'gzip-decode-failure',message:String(e)});}
 }
}
const liveUI={component:'active-ui',state:'runtime-source-static-candidate',service:'app i18n/copy module or rendering function',consumers:['standalone HSK1','shared HSK1/2/3; module-dependent']};
for(const f of [...sourceFiles('hsk1-app/src'),...sourceFiles('course-app/src')].filter(f=>!f.endsWith('.d.ts')&&!f.endsWith('/hanzi/vendor.js')))scanCode(f,liveUI);
for(const f of ['hsk1-app/index.html','hsk1-app/public/help.html','course-app/index.html','course-app/tools/package-unified.mjs','course-app/tools/package-core.mjs'])if(fs.existsSync(path.join(root,f)))scanCode(f,liveUI);
const legacyUI={component:'legacy-ui',state:'legacy-runtime-reachability-candidate',service:'legacy shared UI/content layer; use route-specific adapter',consumers:['legacy HSK2 15 lessons','legacy HSK3 20 lessons','portal','HSK4 shared UI only; no HSK4 textbook matching implied']};
const excluded=/\/(?:pako\.min|hanzi-writer\.min|textbook-locked-data[^/]*|data(?:\/|\.js))|(?:^|\/)style-packed\.js$/;
const legacySources=[...sourceFiles('assets'),...sourceFiles('hsk3'),...sourceFiles('hsk4'),...sourceFiles('hsk4up'),...sourceFiles('data').filter(f=>/load/.test(f)),...['index.html','hsk2.html','lesson.html','help.html']].filter(f=>fs.existsSync(path.join(root,f))&&!excluded.test(f));
for(const f of [...new Set(legacySources)])scanCode(f,legacyUI);
const retainedPolicy={component:'retained-hsk1-producer',state:'retained-route-runtime-candidate',service:'old HSK1 route/source producer; primary package replaces new-hsk1 entry/lesson/learning pages',consumers:['hsk1/index.html or hsk1/lesson.html legacy route','retained old new-hsk1 auxiliary files; verify final deployment routing before claiming loaded']};
for(const f of [...sourceFiles('hsk1'),...sourceFiles('new-hsk1/hsk1')].filter(f=>!f.includes('/audio/')&&!f.includes('/stage3/media/')))scanCode(f,retainedPolicy);
for(const f of sourceFiles('new-hsk1/hsk1/question-bank',/\.json$/))addJSON(f,{...retainedPolicy,state:'retained-legacy-bank-not-loaded-by-primary-engine'});
for(const dir of ['hsk1-app/src','course-app/src','assets','hsk3','hsk4','hsk4up'])for(const f of sourceFiles(dir,/\.css$/)){
 const text=load(f);files.push({file:f,sha256:sha(text),format:'css-content',component:'css-ui',state:'runtime-source-static-candidate'});
 for(const m of text.matchAll(/(?:^|[;{])\s*content\s*:\s*(["'])(.*?)\1/g)){if(likelyVi(m[2]))records.push({recordId:sha(f+'\0css\0'+m.index).slice(0,24),semanticKey:'css-ui:'+f+':content:'+m.index,component:'css-ui',itemId:'content',file:f,range:{start:m.index,end:m.index+m[0].length,...location(text,m.index)},value:m[2],chineseContext:chinese.test(m[2])?m[2]:null,sourceKind:'css-content',visibility:'runtime-source-static-candidate',frozen:false,revisionService:'CSS pseudo-element content producer',consumers:['rendered pseudo-element'],confidence:'language-detection-candidate'});}
}

// Reproduce only known, local content layers. No DOM/network/store or grading code runs.
function packedChunks(paths){return paths.map(f=>{const m=load(f).match(/(?:\+\s*|=\s*)['"]([A-Za-z0-9+/=]{100,})['"]/);if(!m)throw Error('Missing packed chunk '+f);return m[1];}).join('');}
function decode(b64){return JSON.parse(zlib.gunzipSync(Buffer.from(b64,'base64')).toString('utf8'));}
function contentContext(){const c={console:{log(){},info(){},warn(){},error(){}},atob:s=>Buffer.from(s,'base64').toString('binary'),setTimeout(){return 0},setInterval(){return 0},clearTimeout(){},clearInterval(){},pako:{ungzip:(b,o)=>o?.to==='string'?zlib.gunzipSync(b).toString('utf8'):zlib.gunzipSync(b)}};c.window=c;return vm.createContext(c);}
function layer(c,f){try{vm.runInContext(load(f),c,{filename:f,timeout:3000});legacyLayers.push({file:f,sha256:sha(load(f)),status:'executed-content-only'});}catch(e){legacyLayers.push({file:f,sha256:sha(load(f)),status:'layer-error',message:String(e)});}}
const h2=contentContext();
for(let i=1;i<=8;i++)addReplayInput(`data/v7-${i}.js`,'legacy-hsk2-effective');
h2.HSK2_LESSONS=decode(packedChunks(Array.from({length:8},(_,i)=>`data/v7-${i+1}.js`)));
for(let i=1;i<=4;i++)layer(h2,`assets/hsk2-textbook-locked-${i}.js`);
layer(h2,'assets/hsk2-textbook-locked.js');layer(h2,'assets/hsk2-content-audit.js');
walkJSON(JSON.parse(JSON.stringify(h2.HSK2_LESSONS)),'legacy-runtime://hsk2',{component:'legacy-hsk2-effective',state:'legacy-effective-content-only-replay',frozen:false,service:'packed base + locked corpus + content-audit; final DOM UI not simulated',consumers:['hsk2.html','lesson.html','legacy vocabulary shared panel']});
const h3=contentContext();const h3Payload=load('hsk3/data.js').match(/atob\(\s*['"]([A-Za-z0-9+/=]+)['"]\s*\)/)[1];
addReplayInput('hsk3/data.js','legacy-hsk3-effective');
const h3Raw=decode(h3Payload);h3.HSK3_LESSONS=Array.isArray(h3Raw)?h3Raw:h3Raw.lessons??h3Raw.HSK3_LESSONS??Object.values(h3Raw);
for(const f of ['corrections.js','textbook-baseline.js','textbook-audit.js'])layer(h3,'hsk3/'+f);
// The real entry calls this content contract between audit and locked scenes.
// Extract the actual named function, then provide only its dataset sink.
const runtimeContractFile='hsk3/runtime-loader-core.js',runtimeContractText=load(runtimeContractFile);
function findFunction(node,name){if(!node||typeof node!=='object')return null;if(node.type==='FunctionDeclaration'&&node.id?.name===name)return node;for(const v of Object.values(node)){if(v&&typeof v==='object'){if(Array.isArray(v)){for(const c of v){const found=findFunction(c,name);if(found)return found;}}else{const found=findFunction(v,name);if(found)return found;}}}return null;}
const contractNode=findFunction(parseSync(runtimeContractFile,runtimeContractText,{lang:'js'}).program,'applyTextbookVocabContract');
if(!contractNode)throw Error('Missing real HSK3 vocab contract');
const beforeContract=JSON.parse(JSON.stringify(h3.HSK3_LESSONS)),contractCode=runtimeContractText.slice(contractNode.start,contractNode.end);
h3.document={documentElement:{dataset:{}}};
vm.runInContext(contractCode+';applyTextbookVocabContract();',h3,{filename:runtimeContractFile+'#applyTextbookVocabContract',timeout:3000});
const contractChanges=[];
function changedLeaves(a,b,parts=[]){if(a&&b&&typeof a==='object'&&typeof b==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(b)]))changedLeaves(a[k],b[k],[...parts,k]);}else if(a!==b)contractChanges.push({pointer:ptr(parts),before:a??null,after:b??null});}
changedLeaves(beforeContract,JSON.parse(JSON.stringify(h3.HSK3_LESSONS)));
const legacyContentContracts=[{file:runtimeContractFile,function:'applyTextbookVocabContract',range:{start:contractNode.start,end:contractNode.end},fileSHA256:sha(runtimeContractText),functionSHA256:sha(contractCode),status:'executed-actual-content-contract-only',contract:JSON.parse(JSON.stringify(h3.__HSK3_VOCAB_CONTRACT)),changes:contractChanges,scope:'Real function changes content; only documentElement.dataset is stubbed. No full DOM, route, grading or storage execution.'}];
delete h3.document;
for(const f of ['textbook-locked-data.js','textbook-locked-data-2.js','textbook-locked-data-3.js','textbook-locked-data-4a.js','textbook-locked-data-4b.js','textbook-locked-data-4c.js','textbook-locked-data-4d.js','textbook-locked.js'])layer(h3,'hsk3/'+f);
for(const layerInfo of legacyLayers)addReplayInput(layerInfo.file,layerInfo.file.startsWith('hsk3/')?'legacy-hsk3-effective':'legacy-hsk2-effective');
if(h3.HSK3_TEXTBOOK_LOCKED_READY)await h3.HSK3_TEXTBOOK_LOCKED_READY;
walkJSON(JSON.parse(JSON.stringify(h3.HSK3_LESSONS)),'legacy-runtime://hsk3',{component:'legacy-hsk3-effective',state:'legacy-effective-content-only-replay',frozen:false,service:'packed base + corrections + textbook-baseline + audit + locked; final DOM UI not simulated',consumers:['hsk3/index.html','hsk3/lesson.html','legacy vocabulary shared panel']});

// External gzip practice banks are fetched by these real retained route renderers.
// Keep question semantic IDs, every leaf and original index separate from VI occurrences.
const legacyPracticeBanks=[],legacyPracticeConsumers=[];
for(const cfg of [
 {level:1,prefix:'hsk1-v5.0',parts:4,producer:'hsk1/app-practice.js',lessons:15,questions:360},
 {level:2,prefix:'hsk2-v5.8',parts:5,producer:'assets/lesson-practice.js',lessons:15,questions:360},
 {level:3,prefix:'hsk3-v1.1',parts:9,producer:'hsk3/app-practice.js',lessons:20,questions:640},
]){
 const chunks=Array.from({length:cfg.parts},(_,i)=>`practice/reviewed/${cfg.prefix}.part${String(i+1).padStart(2,'0')}.b64`);
 const packed=chunks.map(f=>{addReplayInput(f,`legacy-hsk${cfg.level}-practice`);return load(f).trim();}).join('');
 const gzipBytes=Buffer.from(packed,'base64'),decoded=zlib.gunzipSync(gzipBytes),bank=JSON.parse(decoded);
 if(bank.lessons.length!==cfg.lessons||bank.qa.total_questions!==cfg.questions)throw Error('Legacy practice structure mismatch '+cfg.prefix);
 const start=records.length,origin=`legacy-runtime://practice/hsk${cfg.level}/${bank.version}`;
 const component=`legacy-hsk${cfg.level}-reviewed-practice`;
 const knownVietnameseLeaves=new Set();
 for(const [li,l] of bank.lessons.entries())for(const tier of ['basic','advanced'])for(const [qi,q]of (l[tier]??[]).entries())if(q.type==='判断题'&&q.options?.length===2&&q.options.every(s=>['Đúng','Sai'].includes(s))){q.options.forEach((s,i)=>knownVietnameseLeaves.add(ptr(['lessons',li,tier,qi,'options',i])));knownVietnameseLeaves.add(ptr(['lessons',li,tier,qi,'answer']));}
 walkJSON(bank,origin,{component,knownVietnameseLeaves,state:'legacy-effective-content-only-replay',frozen:false,service:cfg.producer+' ensureReviewedBank fetch '+cfg.parts+' gzip/base64 chunks',consumers:['retained legacy route question prompt','original options/segments and answer','submitted feedback/explanation; not new 48 lesson engine']});
 const seen=new Set(),questionKeys=new Map();
 for(const [li,l] of bank.lessons.entries())for(const tier of ['basic','advanced'])for(const [qi,q]of (l[tier]??[]).entries()){
  if(!q.id||seen.has(q.id))throw Error('Duplicate legacy practice question ID '+cfg.prefix);seen.add(q.id);
  if(q.options&&!q.options.includes(q.answer))throw Error('Invalid legacy original option answer '+q.id);
  const base=['lessons',li,tier,qi],leaves=[];
  function allLeaves(v,p=[]){if(v&&typeof v==='object'){for(const[k,c]of Object.entries(v))allLeaves(c,[...p,k]);}else leaves.push({pointer:ptr([...base,...p]),field:ptr(p),value:v,classification:typeof v==='string'?(viKey(String(p.at(-1)))?'explicit-vietnamese':knownVietnameseLeaves.has(ptr([...base,...p]))?'schema-vietnamese-truth-choice':likelyVi(v,String(p.at(-1)))?'language-detection-candidate':chinese.test(v)?'chinese-context-or-choice':/^(?:id|tier|type|skill)$/.test(String(p.at(-1)))?'identity-or-classification':'unclassified-non-VI-candidate'):'non-string-control',visibleRole:/^(?:prompt_vi|stem|options|segments|answer|explanation_vi)$/.test(String(p[0]))?'question-or-feedback-renderer':/^(?:type)$/.test(String(p[0]))?'difficulty-chip':'loaded-identity-or-metadata'});}
  allLeaves(q);
  for(const k of Object.keys(q))questionKeys.set(k,(questionKeys.get(k)??0)+1);
  legacyPracticeConsumers.push({semanticId:`${component}:${bank.version}:${q.id}`,course:`legacy-hsk${cfg.level}`,kind:'retained-practice-question',bankVersion:bank.version,sourceQuestionId:q.id,lesson:l.lesson_id,tier,virtualFile:origin,producer:cfg.producer,questionPointer:ptr(base),originalAnswer:q.answer,originalAnswerIndex:q.options?q.options.indexOf(q.answer):null,originalOptions:q.options??null,originalSegments:q.segments??null,leaves,gradingIdentity:'Legacy choice grading compares original answer strings. Preserve original index/value authority; VI option display changes need a versioned adapter, not a global text replacement.',sourceRelation:'legacy assessment; direct official textbook counterpart not yet mapped',officialAuditStatus:'pending-phase-B'});
 }
 if(seen.size!==cfg.questions)throw Error('Legacy practice question count mismatch '+cfg.prefix);
 legacyPracticeBanks.push({course:`legacy-hsk${cfg.level}`,component,virtualFile:origin,version:bank.version,lessons:bank.lessons.length,questions:seen.size,questionLeafOccurrences:legacyPracticeConsumers.filter(x=>x.course===`legacy-hsk${cfg.level}`).reduce((n,q)=>n+q.leaves.length,0),questionKeys:Object.fromEntries(questionKeys),VietnameseOccurrences:records.length-start,producer:cfg.producer,producerSHA256:sha(load(cfg.producer)),fetchChunks:chunks.map(f=>({file:f,bytes:fs.statSync(path.join(root,f)).size,sha256:sha(fs.readFileSync(path.join(root,f)))})),decodedJSONSHA256:sha(decoded),gzipSHA256:sha(gzipBytes),metadataDisposition:'Payload-wide language extraction retained; QA/design/source metadata is separately marked. Unfetched alternate gzip/split chunks do not count as current practice.',mappedToUploadedBooks:false});
}
const svgScan=scanRuntimeSVG({root,gitRoot,expectedHead:requestedHead});
files.push(...svgScan.files.filter(f=>!files.some(x=>x.file===f.file)));
records.push(...svgScan.records);

// Explicit semantic consumers: no grouping by equal text.
const bindings=[];
bindings.push(...svgScan.bindings,...legacyPracticeConsumers.map(({leaves,...binding})=>({...binding,questionLeafCount:leaves.length})));
const h1Catalog=json('hsk1-app/content/stage3-catalog.json');
for(const sense of h1Catalog.vocabulary){const bookIds=book.lessons.flatMap(l=>l.vocab.filter(v=>(v.source?.catalogSources??[]).some(s=>s.senseId===sense.senseId)).map(v=>v.id));bindings.push({semanticId:sense.senseId,course:'hsk1',kind:'word-sense',chinese:sense.zh,senseChinese:sense.senseZh,canonicalRecord:sense.id,bookTargetIds:bookIds,consumers:['vocabulary card','mixed card','review scheduler','textbook vocabulary','active textbook vocabulary detail scene-line display','API-only examplesForSense index; not current card UI'],patchOwners:['textbook display clone (active)','stage3 vocabulary presentation clone (active)','examplesForSense common display index (API-only)'],gradingIdentity:'sense fingerprint depends on sense ID and Chinese form; VI catalog full fingerprint remains frozen'});}
for(const level of [2,3])for(const s of json(`course-app/content/hsk${level}-lexicon.json`).senses)bindings.push({semanticId:s.id,course:`hsk${level}`,kind:'word-sense',chinese:s.zh,canonicalRecord:s.id,sourceWordIds:s.sources.map(x=>x.wordId),consumers:['senseMap','canonicalWordPool uses lesson-local word values','lesson vocabulary card','vocabulary quiz/distractors','appendix metadata'],patchOwners:['canonical lexicon VI/POS','all referenced lesson word VI/POS'],gradingIdentity:'saved lesson questions have snapshots; queues retain lesson word IDs'});
for(const level of [2,3])for(let n=1;n<=(level===2?15:18);n++){const l=json(`course-app/content/hsk${level}/lesson-${String(n).padStart(2,'0')}.json`);for(const a of l.activities??[])bindings.push({semanticId:a.id,course:`hsk${level}`,kind:'source-activity',targetRef:a.targetRef,fieldIds:a.fields.map(f=>f.id),sourceColumnBinding:{renderer:'course-app/src/lesson-view.ts mapped(ref)',targetRef:a.targetRef,fieldTargetRefs:a.fields.map(f=>({fieldId:f.id,targetRef:f.targetRef??null}))},consumers:['source activity controls','source columns through real targetRef, prefix matching and field references','saved activity values'],patchOwners:['activity copy','referenced original content copy'],gradingIdentity:'activity record preserves values + checkedAt, not historical copy snapshots; preserve field IDs and meaning'});}
for(const n of Array.from({length:15},(_,i)=>i+1)){const f=`hsk1-app/content/source-activities/lesson-${String(n).padStart(2,'0')}${n===4?'-current':''}.json`;for(const a of json(f).activities)bindings.push({semanticId:a.id+'@'+a.version,course:'hsk1',kind:'source-activity-version',fieldIds:a.fields.map(f=>f.id),figureIds:a.figures??(a.figure?[a.figure]:[]),consumers:['live activity','source draft context snapshot','source archive exact version'],patchOwners:['activity + field + option + table Copy','figure alt/note metadata'],gradingIdentity:'changed activity context requires a new activity version; retain old id@version records'});}
const countsBy=(key)=>Object.fromEntries([...new Set(records.map(r=>r[key]))].sort().map(k=>[k,records.filter(r=>r[key]===k).length]));
const measuredContent={hsk1:{lessons:15,wordSenseRecords:h1Catalog.vocabulary.length,sourceActivities:0},hsk2:{lessons:15,textUnits:0,lineRecords:0,wordRecords:0,grammarUnits:0},hsk3:{lessons:18,textUnits:0,lineRecords:0,wordRecords:0,grammarUnits:0}};
for(let n=1;n<=15;n++)measuredContent.hsk1.sourceActivities+=json(`hsk1-app/content/source-activities/lesson-${String(n).padStart(2,'0')}${n===4?'-current':''}.json`).activities.length;
for(const level of [2,3])for(let n=1;n<=(level===2?15:18);n++){const l=json(`course-app/content/hsk${level}/lesson-${String(n).padStart(2,'0')}.json`),m=measuredContent['hsk'+level];m.textUnits+=l.texts.length;m.lineRecords+=l.texts.reduce((a,t)=>a+t.lines.length,0);m.wordRecords+=l.vocabulary.length;m.grammarUnits+=l.grammar.length;}
for(const r of records){r.officialAuditStatus='pending-phase-B';r.chineseContextStatus=r.chineseContext?'source-context-available':'no-paired-Chinese-at-extraction-site';r.chineseContextMissingReason=r.chineseContext?undefined:'Unpaired VI-only UI/error/HTML literal or legacy payload lacks a Chinese sibling; requires human source-context assignment, no Chinese translation invented';r.learningFieldOccurrence=['active','active-archive-catalogue','active-current-display','active-frozen-bank','active-legacy-bank','active-versioned','legacy-effective-content-only-replay'].includes(r.visibility)&&r.component!=='hsk1-textbook';r.sourceRelation=r.sourceRelation??(r.visibility.includes('metadata')||r.visibility==='loaded-canonical-reference-not-visible'?'reference-metadata':r.source?.provenance==='supplemental'?'editorial-supplement':r.source?.provenance==='textbook'?'direct-textbook-context':r.effectiveOnly?'validated-book-display-projection':'loader-specific-context');if(/^hsk4(?:up)?\//.test(r.file)){r.sourceRelation='editorial-no-uploaded-HSK4-book-counterpart';r.uploadedBookScope='HSK4 content is outside the uploaded HSK1/2/3 source books; shared UI candidates require editorial review';}}
const duplicateIDs=records.length-new Set(records.map(r=>r.recordId)).size;
const duplicateSemanticKeys=records.length-new Set(records.map(r=>r.semanticKey)).size;
if(duplicateIDs||duplicateSemanticKeys){const counts=new Map();for(const r of records){const a=counts.get(r.semanticKey)??[];a.push({file:r.file,pointer:r.pointer,range:r.range,value:r.value});counts.set(r.semanticKey,a)}fs.writeFileSync(path.join(output,'identity-collisions.json'),JSON.stringify([...counts].filter(([k,v])=>v.length>1).slice(0,30),null,2));throw Error('Inventory identity collisions '+duplicateIDs+'/'+duplicateSemanticKeys);}
const learningFieldOccurrencesByComponent=Object.fromEntries([...new Set(records.map(r=>r.component))].sort().map(k=>[k,records.filter(r=>r.component===k&&r.learningFieldOccurrence).length]));
const summary={schemaVersion:1,generatedAt:new Date().toISOString(),gitHead:requestedHead,gitTree:requestedTree,actualHEADAtGeneration:execFileSync('git',['rev-parse','HEAD'],{cwd:gitRoot,encoding:'utf8'}).trim(),sourceRef,snapshotMode:'new version from exact immutable Git input snapshot; not a restoration of missing B10 payload',definition:'Rows are field occurrences/candidates, not unique semantic units, source-book match percentage, or native verification.',records:records.length,learningFieldOccurrencesByComponent,missingChineseContextByComponent:Object.fromEntries([...new Set(records.map(r=>r.component))].sort().map(k=>[k,records.filter(r=>r.component===k&&!r.chineseContext).length])),countsByComponent:countsBy('component'),countsByVisibility:countsBy('visibility'),countsBySourceKind:countsBy('sourceKind'),files:files.length,parseOrDecodeFailures:failures.length,identityChecks:{duplicateIDs,duplicateSemanticKeys},measuredContent,legacyLayerErrors:legacyLayers.filter(x=>x.status!=='executed-content-only'),legacyLessonCounts:{hsk2:h2.HSK2_LESSONS.length,hsk3:h3.HSK3_LESSONS.length},displayOverlay:{revision:revisions.revision,changes:revisions.changes.length,effectiveVietnameseRows:effective.length,changedVietnameseRows:effective.filter(r=>r.changedFromFrozen).length},bindings:bindings.length,semanticIdentityCountsByKind:Object.fromEntries([...new Set(bindings.map(b=>b.kind))].sort().map(k=>[k,bindings.filter(b=>b.kind===k).length])),legacyPracticeBanks:legacyPracticeBanks.map(({fetchChunks,...b})=>({...b,fetchChunkCount:fetchChunks.length})),svg:svgScan.summary,limitations:['Runtime-source literals are a static superset; dead code branches and module usage are not automatically proven visible.','Language detection of unlabelled strings is candidate classification, not language certification. ASCII-only Vietnamese without known cues can be missed.','Template expressions record producers but do not enumerate arbitrary learner names, numbers, browser messages or all branch combinations.','HTML extracted text preserves source markup/entity representation; final DOM text should be checked in native browsers.','Legacy content replay is scoped to documented content layers; DOM-dependent display overrides are separately listed as code literals. The actual HSK3 vocabulary classification contract is replayed at its real location; remaining DOM-dependent UI overrides are static candidates.','SVG embedded desc strings are asset metadata candidates, not proven visible body text or native assistive technology execution.', '1360 legacy practice question IDs and all question leaves are retained separately from Vietnamese appearances; same lesson ordinal does not map them to uploaded books.', 'Website semantic adoption remains pending. The separate 48-lesson textbook-source audit was already completed; this extraction does not redo or supersede it.','Uploaded HSK1/2/3 books do not cover HSK4 textbook content; shared HSK4 UI candidates are scope markers, not textbook alignment.']};
const headInputChecks=files.map(f=>{const actual=fs.readFileSync(path.join(root,f.file));const blob=execFileSync('git',['show',requestedHead+':'+f.file],{cwd:gitRoot});if(!actual.equals(blob))throw Error('Inventory input differs from requested source HEAD '+f.file);return {file:f.file,sha256:sha(actual),matchesRequestedHEAD:true};});
summary.exactHEADInputChecks={files:headInputChecks.length,allMatch:true};
for(const[name,v]of Object.entries({'runtime-files.json':files,'semantic-consumers.json':bindings,'parse-failures.json':failures,'legacy-content-layers.json':legacyLayers,'summary.json':summary,'legacy-content-contracts.json':legacyContentContracts,'legacy-practice-banks.json':legacyPracticeBanks,'legacy-practice-consumers.json':legacyPracticeConsumers,'svg-consumers.json':svgScan.bindings}))fs.writeFileSync(path.join(output,name),JSON.stringify(v,null,2)+'\n');
fs.writeFileSync(path.join(output,'inventory.json.gz'),zlib.gzipSync(JSON.stringify(records)+'\n',{level:9}));
const pilotSpecifications=[{level:1,lesson:4,printedBodyPages:[18,26],offset:16,pdf:'HSK1  (3.0).pdf',why:'多/家/在等语境与词性；教材显示 sidecar、source 活动版本、active 教材词汇详情例句与 API-only 索引可分别验证。'},{level:2,lesson:2,printedBodyPages:[10,18],offset:14,pdf:'HSK2 ( 3.0).pdf',why:'课文请求/建议、词义与好像释义疑点；验证正文、源列、选择项与附录语义关系。'},{level:3,lesson:10,printedBodyPages:[86,94],offset:12,pdf:'HSK3 (3.0).pdf',why:'你/我与越南语 em/cô 等人物称谓的整课一致性，及译文附录的对应定位。'}];
const pilotItems=[];
for(const p of pilotSpecifications){
 p.status='prepared-not-reviewed';p.candidateBodyPdfPages=Array.from({length:p.printedBodyPages[1]-p.printedBodyPages[0]+1},(_,i)=>p.printedBodyPages[0]+i+p.offset);p.bodyMappingStatus='accepted planning offset; locate visual source before approving any correction';
 p.sourcePDFPath=path.resolve(gitRoot,'..','upload',p.pdf);p.sourcePDFSHA256=sha(fs.readFileSync(p.sourcePDFPath));
 const selected=records.filter(r=>r.learningFieldOccurrence&&r.lesson===p.lesson&&(p.level===1?r.component.startsWith('hsk1-'):r.component===`hsk${p.level}-lesson`));p.learningOccurrenceCandidates=selected.length;
 for(const r of selected)pilotItems.push({semanticKey:r.semanticKey,component:r.component,itemId:r.itemId,lesson:r.lesson,file:r.file,pointer:r.pointer,currentVietnamese:r.value,chineseContext:r.chineseContext,sourceRelation:r.sourceRelation,currentSource:r.source,officialReferenceVietnamese:null,officialReference:{pdfSHA256:p.sourcePDFSHA256,printedPage:null,pdfPage:null,section:null,visualEvidence:null},decision:'pending',reason:null,reviewer:null,patchProjection:null});
 if(p.level===3)p.translationAppendixSearch={printedPages:[183,197],pdfPages:[195,209],status:'candidate search range; specific lesson/text/line page must be visually located, never inferred from Chinese body page'};
}
fs.writeFileSync(path.join(output,'pilot-source-index.json'),JSON.stringify({status:'prepared-only-phase-B-not-started',pilots:pilotSpecifications,decisionVocabulary:['match','official-wording-variant','meaning-error','official-book-erratum','editorial-no-direct-book-counterpart','unresolved-source']},null,2)+'\n');
fs.writeFileSync(path.join(output,'pilot-audit-template.json.gz'),zlib.gzipSync(JSON.stringify(pilotItems)+'\n',{level:9}));
if(fs.existsSync(path.join(output,'inventory.json')))fs.unlinkSync(path.join(output,'inventory.json'));
if(fs.existsSync(path.join(output,'identity-collisions.json')))fs.unlinkSync(path.join(output,'identity-collisions.json'));
console.log(JSON.stringify(summary,null,2));
