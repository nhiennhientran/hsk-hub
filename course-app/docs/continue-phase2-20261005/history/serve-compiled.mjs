import {createServer} from 'node:http';
import {createReadStream,readFileSync} from 'node:fs';
import {realpath,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {byteRange} from '../../../../hsk1-app/tools/release-server.mjs';
const mount=process.env.HSK_PHASE2_MOUNT;
if(!['shared','hsk1','legacy'].includes(mount))throw Error('Choose an explicit compiled package mount');
const supplied=mount==='hsk1'?process.env.HSK_PHASE2_HSK1_DIST_ROOT:process.env.HSK_PHASE2_PACKAGE_ROOT;
if(!supplied)throw Error('Compiled candidate root is required');
const root=await realpath(supplied),prefix='/hsk-hub/';
const entry=mount==='shared'?'new-hsk2/hsk2/index.html':'index.html';
const entryBytes=readFileSync(resolve(root,entry));
if(/(?:src|href)="[^\"]*\/src\//.test(entryBytes.toString()))throw Error('Development entry cannot be used for compiled acceptance');
if(mount!=='hsk1'){
  const manifest=JSON.parse(readFileSync(resolve(root,'course-engine/unified-release-manifest.json'),'utf8'));
  if(manifest.mode!=='checkpoint'||manifest.lessons!==48)throw Error('Expected current 48-lesson engineering checkpoint, not release authorization');
}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.mp3':'audio/mpeg','.png':'image/png','.svg':'image/svg+xml'};
createServer(async(req,res)=>{
  const finish=(status,text)=>{res.writeHead(status,{'Content-Type':'text/plain'});res.end(req.method==='HEAD'?undefined:text)};
  if(!['GET','HEAD'].includes(req.method))return finish(405,'Method not allowed');
  let path;try{path=decodeURIComponent((req.url??'/').split('?')[0])}catch{return finish(400,'Bad path')}
  if(path.includes('\\')||path.includes('\0')||path.split('/').includes('..'))return finish(400,'Bad path');
  let relative;
  if(mount==='hsk1')relative=path.slice(1)||'index.html';
  else if(path.startsWith(prefix))relative=path.slice(prefix.length)||'index.html';
  else if(mount==='legacy')return finish(404,'Not found');
  else if(path==='/'||path==='/index.html')relative=entry;
  else if(path.startsWith('/course-engine/'))relative=path.slice(1);
  else relative='new-hsk2/hsk2/'+path.slice(1);
  try{
    let file=resolve(root,relative);if((await stat(file)).isDirectory())file=resolve(file,'index.html');file=await realpath(file);
    if(!file.startsWith(root+sep))return finish(404,'Not found');const info=await stat(file);if(!info.isFile())return finish(404,'Not found');
    const range=byteRange(req.headers.range,info.size);res.setHeader('Accept-Ranges','bytes');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',types[extname(file)]??'application/octet-stream');res.setHeader('X-Content-Type-Options','nosniff');
    if(!range){res.setHeader('Content-Range',`bytes */${info.size}`);res.writeHead(416);return res.end()}
    if(range.partial)res.setHeader('Content-Range',`bytes ${range.start}-${range.end}/${info.size}`);res.setHeader('Content-Length',info.size===0?0:range.end-range.start+1);res.writeHead(range.partial?206:200);
    if(req.method==='HEAD'||!info.size)return res.end();const stream=createReadStream(file,{start:range.start,end:range.end});res.on('close',()=>stream.destroy());stream.on('error',()=>res.destroy());stream.pipe(res);
  }catch{finish(404,'Not found')}
}).listen(Number(process.env.HSK_PHASE2_PORT),'127.0.0.1',()=>console.log(JSON.stringify({status:'serving-exact-compiled-bytes',mount,root,entry,entrySHA256:createHash('sha256').update(entryBytes).digest('hex'),rewrittenHTML:false,developmentServer:false})));
