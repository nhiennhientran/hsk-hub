'use strict';
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const mime = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.mp3':'audio/mpeg','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
async function serve() {
  const server = http.createServer((req,res)=>{
    let requested;
    try { requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch {res.writeHead(400).end();return;}
    let file=path.resolve(root,'.'+requested);
    if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}
    if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
    if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end('Not found');return;}
    const size=fs.statSync(file).size, headers={'Content-Type':mime[path.extname(file)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-store'};
    const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    let start=0,end=size-1,status=200;
    if(range){start=Number(range[1]);end=range[2]?Math.min(Number(range[2]),size-1):size-1;status=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`;}
    if(start> end||start>=size){res.writeHead(416).end();return;}
    headers['Content-Length']=end-start+1;res.writeHead(status,headers);
    if(req.method==='HEAD'){res.end();return;}
    fs.createReadStream(file,{start,end}).pipe(res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return {baseURL:`http://127.0.0.1:${server.address().port}/new-hsk1/hsk1/`,close:()=>new Promise(resolve=>server.close(resolve))};
}
async function launch() {
  if(process.env.HSK_BROWSER_PATH)return chromium.launch({executablePath:process.env.HSK_BROWSER_PATH,headless:true,args:['--no-sandbox']});
  const modulePath=process.env.HSK_CHROMIUM_MODULE;
  if(modulePath){const entry=fs.statSync(modulePath).isDirectory()?path.join(modulePath,'build/index.js'):modulePath;const imported=await import(require('node:url').pathToFileURL(entry).href);const chromiumPackage=imported.default||imported;return chromium.launch({executablePath:await chromiumPackage.executablePath(),headless:true,args:chromiumPackage.args});}
  return chromium.launch({headless:true});
}
async function login(page) {
  const gate=page.locator('#pwOverlay');
  await page.waitForFunction(()=>typeof window.checkPassword==='function');
  if(await gate.isVisible()){
    if(!process.env.HSK_TEST_PASSWORD)throw new Error('HSK_TEST_PASSWORD must be injected by the test runner. Do not store access passwords in tests.');
    await page.locator('#pwInput').fill(process.env.HSK_TEST_PASSWORD);
    await page.locator('#pwBtn').click();
    await gate.waitFor({state:'hidden'});
  }
}
module.exports={serve,launch,login,root};
