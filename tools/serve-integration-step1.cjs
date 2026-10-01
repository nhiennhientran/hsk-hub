'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),port=Number(process.env.HSK_STAGE41_PORT||18768);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.mp3':'audio/mpeg','.wav':'audio/wav'};
const srv=http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch(_e){res.writeHead(400);return res.end('bad request');}
 let relative;
 if(pathname.startsWith('/hsk-hub/'))relative=pathname.slice('/hsk-hub/'.length);
 else if(pathname.startsWith('/hsk1/'))relative='new-hsk1'+pathname;
 else {res.writeHead(404);return res.end('not found');}
 let file=path.resolve(root,relative);
 if(!file.startsWith(root+path.sep)||relative.split('/').some(s=>s.startsWith('.'))){res.writeHead(403);return res.end('forbidden');}
 try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');}catch(_e){}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('not found');}res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',mime[path.extname(file).toLowerCase()]||'application/octet-stream');res.writeHead(200);res.end(data);});
});
srv.listen(port,'127.0.0.1',()=>console.log(`HSK review: http://127.0.0.1:${port}/hsk-hub/new-hsk1/hsk1/index.html`));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>srv.close(()=>process.exit(0)));
