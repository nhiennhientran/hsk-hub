import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {realpath,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {byteRange} from '../../../../hsk1-app/tools/release-server.mjs';
const root=await realpath(process.env.FLOW_DIST_DIR??resolve(import.meta.dirname,'../../../dist'));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.mp3':'audio/mpeg','.png':'image/png','.svg':'image/svg+xml'};
createServer(async(req,res)=>{
 try {
  const url=new URL(req.url??'/', 'http://localhost');
  let file=resolve(root,'.'+decodeURIComponent(url.pathname));
  if((await stat(file)).isDirectory())file=resolve(file,'index.html');
  file=await realpath(file);
  if(!file.startsWith(root+sep))throw Error('outside root');
  const info=await stat(file);
  const range=byteRange(req.headers.range,info.size);
  res.setHeader('Accept-Ranges','bytes');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',types[extname(file)]??'application/octet-stream');
  if(!range){res.setHeader('Content-Range',`bytes */${info.size}`);res.writeHead(416);return res.end()}
  if(range.partial)res.setHeader('Content-Range',`bytes ${range.start}-${range.end}/${info.size}`);
  res.setHeader('Content-Length',info.size===0?0:range.end-range.start+1);res.writeHead(range.partial?206:200);
  if(req.method==='HEAD'||!info.size)return res.end();const stream=createReadStream(file,{start:range.start,end:range.end});res.on('close',()=>stream.destroy());stream.on('error',()=>res.destroy());stream.pipe(res);
 }catch {res.writeHead(404);res.end('Not found');}
}).listen(Number(process.env.FLOW_PORT??18782),'127.0.0.1',()=>console.log('Frozen flow probe host ready'));
