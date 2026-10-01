const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..','new-hsk1');
const port=Number(process.env.HSK_STAGE41_PORT||18768);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
const srv=http.createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch(_e){res.writeHead(400);return res.end('bad request');}
  let file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);return res.end('forbidden');}
  try{let st=fs.statSync(file);if(st.isDirectory())file=path.join(file,'index.html');}catch(_e){}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('not found');}res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',mime[path.extname(file).toLowerCase()]||'application/octet-stream');res.writeHead(200);res.end(data);});
});
srv.listen(port,'127.0.0.1',()=>console.log('Stage 4.1 preview: http://127.0.0.1:'+port+'/hsk1/learning.html'));
