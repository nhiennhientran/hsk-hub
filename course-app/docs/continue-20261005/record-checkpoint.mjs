import {readFileSync,writeFileSync,mkdirSync,readdirSync,statSync,existsSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {snapshotRuntimeSource,assertTestedRuntimeSource} from '../../tools/release-readiness.mjs';
const repo=fileURLToPath(new URL('../../../',import.meta.url)),browser=process.env.HSK_CONTINUE_BROWSER;
if(!['chromium','webkit'].includes(browser))throw Error('Actual matrix browser identity is required');
const out=join(repo,'course-app/.repro-output/continue-20261005',browser);mkdirSync(out,{recursive:true});
const scopes=['course-app/src','course-app/content','course-app/public','course-app/tools','course-app/package.json','course-app/package-lock.json','course-app/tsconfig.json','course-app/vite.config.ts','hsk1-app/src','hsk1-app/content','hsk1-app/public','hsk1-app/tools','hsk1-app/package.json','hsk1-app/package-lock.json','hsk1-app/tsconfig.json','hsk1-app/vite.config.ts'];
const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim(),sha=b=>createHash('sha256').update(b).digest('hex');
const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}'),phase=process.argv[2];
const binding={checkoutCommit:head,checkoutTree:tree,githubSHA:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,runAttempt:process.env.GITHUB_RUN_ATTEMPT,browser};
const save=(name,value)=>writeFileSync(join(out,name),JSON.stringify(value,null,2)+'\n');
const files=dir=>readdirSync(dir).sort().flatMap(name=>{const file=join(dir,name),s=statSync(file);return s.isDirectory()?files(file):[{path:relative(repo,file),bytes:s.size,sha256:sha(readFileSync(file))}];});
if(phase==='before'){
  const runtimeSourceSnapshot=snapshotRuntimeSource(repo,scopes);
  assertTestedRuntimeSource(repo,head,runtimeSourceSnapshot,scopes);
  save('before.json',{schemaVersion:1,phase,...binding,scopes,runtimeSourceSnapshot,productionPublication:false});
}else if(phase==='builds'){
  save('builds.json',{schemaVersion:1,...binding,shared:files(join(repo,'course-app/dist')),standalone:files(join(repo,'hsk1-app/dist'))});
}else if(phase==='after'){
  const before=JSON.parse(readFileSync(join(out,'before.json'),'utf8'));
  if(before.checkoutCommit!==head||before.checkoutTree!==tree)throw Error('Checkout changed');
  const runtimeSourceSnapshot=assertTestedRuntimeSource(repo,head,before.runtimeSourceSnapshot,scopes);
  const native=[];
  for(const scope of ['shared','hsk1']){
    const reportFile=join(out,`${scope}-results.json`),collectionFile=join(out,`${scope}-collection.json`);
    const report=JSON.parse(readFileSync(reportFile,'utf8')),collection=JSON.parse(readFileSync(collectionFile,'utf8'));
    const tests=suites=>suites.flatMap(suite=>[...(suite.specs??[]).flatMap(spec=>spec.tests.map(test=>({id:spec.id,title:spec.title,test}))),...tests(suite.suites??[])]);
    const executed=tests(report.suites??[]),collected=tests(collection.suites??[]);
    if(!executed.length||JSON.stringify(executed.map(r=>r.id).sort())!==JSON.stringify(collected.map(r=>r.id).sort()))throw Error('Native collection identity mismatch: '+scope);
    if(report.errors?.length||report.stats?.unexpected||report.stats?.skipped||report.stats?.flaky||report.stats?.expected!==executed.length)throw Error('Native status is incomplete: '+scope);
    for(const {test}of executed)if(test.projectName!==browser||test.status!=='expected'||test.results?.length!==1||test.results[0].status!=='passed'||test.results[0].retry!==0||test.results[0].errors?.length)throw Error('Native case failed/retried/skipped: '+scope);
    native.push({scope,cases:executed.length,reportSHA256:sha(readFileSync(reportFile)),collectionSHA256:sha(readFileSync(collectionFile))});
  }
  const units=[];
  for(const app of ['course','hsk1']){
    const path=join(out,`${app}-units.log`),text=readFileSync(path,'utf8');
    const count=Number(text.match(/(?:ℹ |# )tests (\d+)/)?.[1]);
    if(!count||!text.includes(`pass ${count}`)||!text.includes('fail 0')||!text.includes('cancelled 0')||!text.includes('skipped 0'))throw Error('Unit completion is missing: '+app);
    units.push({app,tests:count,sha256:sha(readFileSync(path))});
  }
  const builds=JSON.parse(readFileSync(join(out,'builds.json'),'utf8'));
  for(const name of ['shared','standalone'])if(JSON.stringify(builds[name])!==JSON.stringify(files(join(repo,name==='shared'?'course-app/dist':'hsk1-app/dist'))))throw Error('Compiled bytes drifted: '+name);
  save('after.json',{schemaVersion:1,phase,...binding,runtimeSourceSnapshotSHA256:runtimeSourceSnapshot.sha256,native,units,status:'passed',publicationApproved:false,deployed:false,limitations:['targeted integration checkpoint; not 48-lesson official VI semantic or final production acceptance'],evidence:files(out)});
}else throw Error('Choose before, builds or after');
