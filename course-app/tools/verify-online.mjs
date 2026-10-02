import{readFileSync,mkdirSync,writeFileSync}from'node:fs';import{resolve}from'node:path';import{fileURLToPath}from'node:url';import{createHash}from'node:crypto';import{deploymentPath,hash}from'./package-core.mjs';
const origin='https://nhiennhientran.github.io/hsk-hub/';
const gitBlob=b=>createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
export async function verifyOnline({target,baseline,fetcher=fetch,progress=()=>{}}){
 if(target.baseURL!==origin||!/^[a-f0-9]{40}$/.test(target.sourceCommit)||!/^[a-f0-9]{64}$/.test(target.manifestSha256))throw Error('Unapproved live origin or invalid frozen identity');
 const get=async path=>{const url=new URL(path,origin);url.searchParams.set('hsk23-frozen',target.sourceCommit);const r=await fetcher(url,{cache:'no-store',signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error(`HTTP ${r.status}: ${path}`);return Buffer.from(await r.arrayBuffer())};
 const manifestBytes=await get('course-engine/release-manifest.json');if(hash(manifestBytes)!==target.manifestSha256)throw Error('Live release manifest differs from the exact accepted frozen artifact');
 const m=JSON.parse(manifestBytes);if(m.mode!=='release'||m.contentMode!=='release'||m.lessonCount!==33||m.sourceCommit!==target.sourceCommit||!Array.isArray(m.files))throw Error('Live release is not the accepted full33-lesson edition');
 const seen=new Set();for(const f of m.files){if(!deploymentPath(f.path)||seen.has(f.path)||!Number.isSafeInteger(f.bytes)||!/^[a-f0-9]{64}$/.test(f.sha256))throw Error('Invalid live manifest path/identity');seen.add(f.path)}
 if(baseline.productionCommit!=='caeac03798b91095f6fb0916e3c0bfd908381f45'||baseline.files.length!==1141)throw Error('Unexpected preservation baseline');
 const publicFiles=baseline.files.filter(f=>f.path!=='index.html'&&!f.path.split('/').some(p=>p.startsWith('.')||p.startsWith('_'))&&!/^(?:tools|qa)\//.test(f.path)&&/\.(?:html|js|css|json|mp3|svg|png|jpe?g|webp|woff2?|ico)$/.test(f.path));
 const jobs=[...m.files.map(f=>({...f,kind:'frozen'})),...publicFiles.map(f=>({...f,kind:'protected'}))];let next=0,bytes=0;const verified=[],failures=[];
 async function worker(){for(;;){const i=next++;if(i>=jobs.length)return;const f=jobs[i];try{const data=await get(f.path);if(f.kind==='frozen'?(data.length!==f.bytes||hash(data)!==f.sha256):gitBlob(data)!==f.sha)throw Error('Served bytes mismatch: '+f.path);bytes+=data.length;verified.push({path:f.path,kind:f.kind,bytes:data.length,sha256:hash(data)});if(verified.length%100===0)progress({verified:verified.length,total:jobs.length})}catch(e){failures.push({path:f.path,kind:f.kind,error:String(e)})}}}
 await Promise.all(Array.from({length:4},worker));
 const report={schemaVersion:1,verifiedAt:new Date().toISOString(),baseURL:origin,sourceCommit:m.sourceCommit,manifestSha256:target.manifestSha256,frozenFiles:m.files.length,protectedPublicFiles:publicFiles.length,protectedRepositoryFiles:1140,excludedNonRuntimeRepositoryFiles:1140-publicFiles.length,bytes,passed:failures.length===0,failures,verified:verified.sort((a,b)=>a.path.localeCompare(b.path))};
 return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const[targetFile,reportFile]=process.argv.slice(2);if(!reportFile)throw Error('Usage: verify-online TARGET_JSON REPORT_JSON');const target=JSON.parse(readFileSync(targetFile));const baseline=JSON.parse(readFileSync(new URL('../docs/baseline.json',import.meta.url)));
 const report=await verifyOnline({target,baseline,progress:console.log});mkdirSync(resolve(reportFile,'..'),{recursive:true});writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,verified:undefined,failures:report.failures.slice(0,10)}));if(!report.passed)process.exitCode=1;
}
