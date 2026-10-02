import {readFileSync,readdirSync,lstatSync,mkdirSync,copyFileSync,writeFileSync,existsSync} from 'node:fs';
import {join,resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
export const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export function deploymentPath(path){return typeof path==='string'&&!path.includes('\\')&&!path.startsWith('/')&&!path.split('/').some(p=>['','.','..'].includes(p))&&(path==='index.html'||/^(?:new-hsk2|new-hsk3|course-engine)\//.test(path))}
export function inputPath(path){return path==='index.html'||path==='content-manifest.json'||/^assets\/[A-Za-z0-9_.-]+\.(?:js|css)$/.test(path)||/^course-assets\/hsk[23]\/audio\/\d{1,2}-[1-8]\.mp3$/.test(path)}
export function walkFiles(root){const result=[];function walk(dir){for(const name of readdirSync(dir).sort()){const path=join(dir,name),stat=lstatSync(path);if(stat.isSymbolicLink())throw Error('Symbolic links are not release inputs');if(stat.isDirectory())walk(path);else if(stat.isFile())result.push(relative(root,path).replaceAll('\\','/'));else throw Error('Unsupported release file')}}walk(root);return result.sort()}
export function entryHTML(html,level){
 if(![2,3].includes(level))throw Error('Invalid course level');
 if(!/<meta name="hsk-level" content="2">/.test(html)||!html.includes('<div id="app"></div>')||!html.includes('./assets/'))throw Error('Unrecognized frozen entry HTML');
 const mapped=html.replace('<meta name="hsk-level" content="2">',`<meta name="hsk-level" content="${level}"><meta name="hsk-level-locked" content="true"><meta name="asset-base" content="../../course-engine/">`).replace(/<title>[^<]*<\/title>/,`<title>汉语课件 · HSK ${level} · Cô Nhiên</title>`).replaceAll('"./assets/','"../../course-engine/assets/');
 if(/(?:src|href)="(?:\/|https?:|\.\/assets\/)/.test(mapped))throw Error('Unexpected entry asset address');
 return mapped;
}
export function updatePortal(html){
 const protectedCards=[...html.matchAll(/<a class="level-card h[14]"[^>]*>[\s\S]*?<\/a>/g)].map(m=>m[0]);
 if(protectedCards.length!==3)throw Error('Unexpected protected portal cards');
 let output=html.replace('Các khóa giữ cùng hệ học tương tác: từ vựng, bài khoá có pinyin + tiếng Việt, ngữ âm/ngữ pháp, Hán tự & bút thuận, bài tập cơ bản và nâng cao.','HSK 2 và HSK 3 dùng ấn bản mới 2026: bài khóa Trung–Việt, âm thanh gốc, bài tập và thẻ từ. Pinyin bài khóa HSK 3 có thể bật khi cần. Các khóa còn lại giữ nội dung và trải nghiệm hiện có.');
 for(const level of [2,3]){
  const pattern=new RegExp(`<a class="level-card h${level}"[^>]*>[\\s\\S]*?<\\/a>`,'g'),cards=[...output.matchAll(pattern)];
  if(cards.length!==1)throw Error('Expected one old course card');
  const old=cards[0][0],count=level===2?15:18;
  const next=old.replace(/href="[^"]*"/,`href="new-hsk${level}/hsk${level}/"`).replace(`标准教程 ${level}`,`新HSK教程 ${level} · 2026`).replace(/<div class="level-desc">[\s\S]*?<\/div>/,`<div class="level-desc">${count} bài theo ấn bản 2026, bài khóa song ngữ, âm thanh gốc, 30 câu bài tập mỗi bài và thẻ từ trộn nhiều bài.</div>`).replace(/<div class="level-stats">[\s\S]*?(?=<div class="enter-row">)/,`<div class="level-stats"><div class="level-stat"><b>${count}</b><span>BÀI HỌC</span></div><div class="level-stat"><b>${count*30}</b><span>BÀI TẬP</span></div><div class="level-stat"><b>原音</b><span>ÂM THANH GỐC</span></div></div>`);
  output=output.replace(old,next);
 }
 for(const card of protectedCards)if(!output.includes(card))throw Error('Protected course card changed');
 return output;
}
export function packageFrozen({input,output,portal,sourceCommit,mode='release'}){
 input=resolve(input);output=resolve(output);
 if(!/^[a-f0-9]{40}$/.test(sourceCommit)||!['pilot','release'].includes(mode))throw Error('Invalid source identity or packaging mode');
 if(existsSync(output))throw Error('Release destination must not exist; never overwrite a frozen artifact');
 const inputs=walkFiles(input);if(!inputs.includes('index.html')||!inputs.some(p=>/^assets\/.+\.js$/.test(p)))throw Error('Missing built app');
 for(const path of inputs)if(!inputPath(path))throw Error('Unapproved public file: '+path);
 if(!inputs.includes('content-manifest.json'))throw Error('Missing frozen content validation manifest');
 const content=JSON.parse(readFileSync(join(input,'content-manifest.json'),'utf8'));
 if(content.schemaVersion!==1||!['pilot','release'].includes(content.mode)||!Array.isArray(content.lessons))throw Error('Invalid frozen content manifest');
 if(mode==='release'&&(content.mode!=='release'||content.lessons.length!==33||content.lessons.filter(l=>l.level===2).length!==15||content.lessons.filter(l=>l.level===3).length!==18))throw Error('Partial or pilot content cannot be marked release');
 const audio=inputs.filter(p=>p.endsWith('.mp3'));
 if(!Array.isArray(content.audio)||content.audio.length!==264||new Set(content.audio.map(t=>t.file)).size!==264)throw Error('Missing audio identity manifest');
 for(const file of audio){const identity=content.audio.find(t=>t.file===file),bytes=readFileSync(join(input,file));if(!identity||identity.bytes!==bytes.length||identity.sha256!==hash(bytes))throw Error('Original audio bytes do not match their authorized source: '+file)}
 if(audio.length!==264)throw Error('Expected exactly264 authorized original MP3 tracks');
 for(const level of [2,3])for(let lesson=1;lesson<=(level===2?15:18);lesson++)for(let track=1;track<=8;track++)if(!inputs.includes(`course-assets/hsk${level}/audio/${lesson}-${track}.mp3`))throw Error('Missing original audio identity');
 const html=readFileSync(join(input,'index.html'),'utf8'),portalHTML=updatePortal(readFileSync(portal,'utf8'));
 // Validate all transformations before making the output directory.
 const entries=new Map([2,3].map(level=>[level,entryHTML(html,level)]));
 mkdirSync(output,{recursive:true});const write=(path,bytes)=>{if(!deploymentPath(path))throw Error('Unscoped output');mkdirSync(join(output,path,'..'),{recursive:true});writeFileSync(join(output,path),bytes)};
 for(const path of inputs.filter(p=>p!=='index.html')){const dest=`course-engine/${path}`;mkdirSync(join(output,dest,'..'),{recursive:true});copyFileSync(join(input,path),join(output,dest))}
 for(const [level,entry]of entries){write(`new-hsk${level}/hsk${level}/index.html`,entry);write(`new-hsk${level}/index.html`,`<!doctype html><html lang="vi"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0;url=hsk${level}/"><title>HSK ${level} · 2026</title></head><body><a href="hsk${level}/">Mở HSK ${level} · 打开课程</a></body></html>\n`)}
 write('index.html',portalHTML);
 const files=walkFiles(output).map(path=>{const bytes=readFileSync(join(output,path));return {path,bytes:bytes.length,sha256:hash(bytes)}});
 const manifest={schemaVersion:1,mode,sourceCommit,contentMode:content.mode,lessonCount:content.lessons.length,sharedEngine:'course-engine',entries:{hsk2:'new-hsk2/hsk2/',hsk3:'new-hsk3/hsk3/'},sourceInputFiles:inputs.map(path=>({path,sha256:hash(readFileSync(join(input,path)))})),files};
 write('course-engine/release-manifest.json',JSON.stringify(manifest,null,2)+'\n');return manifest;
}
