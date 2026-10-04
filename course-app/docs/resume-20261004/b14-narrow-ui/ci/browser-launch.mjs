import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
// This is an intentionally version-bound, read-only call into the actual locked
// server selector/registry. It does not create a browser, transport or Page.
export function defaultHeadlessEntry(repo,browser){
  assert.ok(browser==='chromium'||browser==='webkit');
  const require=createRequire(resolve(repo,'course-app/package.json'));
  const packageFile=require.resolve('playwright-core/package.json');
  const packageBytes=readFileSync(packageFile),version=JSON.parse(packageBytes).version;
  assert.equal(version,'1.62.1','Review the private server selector when the lock changes');
  const coreFile=resolve(dirname(packageFile),'lib/coreBundle.js');
  const core=require(coreFile),server=core.server.createPlaywright({sdkLanguage:'javascript',isServer:true});
  const selectedExecutable=server[browser].getExecutableName({headless:true});
  assert.equal(selectedExecutable,browser==='chromium'?'chromium-headless-shell':'webkit');
  const executable=core.registry.registry.findExecutable(selectedExecutable);
  assert.equal(executable?.browserName,browser);
  const path=executable.executablePath();assert.ok(typeof path==='string'&&path.startsWith('/')&&!/\s/u.test(path));
  return {path,selectedExecutable,browserName:browser,version,launchOptions:{headless:true,channel:null,executablePath:null},
    corePackageSHA256:sha(packageBytes),selectionImplementationSHA256:sha(readFileSync(coreFile)),
    selectionMethod:'Actual locked core.server.createPlaywright browser.getExecutableName({headless:true}) and core.registry.registry.findExecutable; no launch'};
}

export function verifyBrowserLaunchLog(log,{browser,entry}){
  assert.equal(entry.browserName,browser);assert.equal(entry.launchOptions.headless,true);
  assert.equal(entry.launchOptions.channel,null);assert.equal(entry.launchOptions.executablePath,null);
  assert.equal(entry.selectedExecutable,browser==='chromium'?'chromium-headless-shell':'webkit');
  const launches=[],pids=[];
  for(const raw of log.split(/\r?\n/u)){
    const line=raw.replace(/\u001b\[[0-?]*[ -/]*[@-~]/gu,'');
    if(line.includes('<launching>')){
      const match=line.match(/\bpw:browser\s+<launching>\s+(\S+)\s+(.+)$/u);
      assert.ok(match,'Unrecognized actual browser launch log');
      assert.equal(match[1],entry.path,'Actually launched entry differs from the installed headless selector');
      assert.ok(/(?:^|\s)--headless(?:\s|$)/u.test(match[2]),'Actual launch is not headless');
      const pipe=browser==='chromium'?'--remote-debugging-pipe':'--inspector-pipe';
      assert.ok(match[2].split(/\s+/u).includes(pipe),'Expected default engine transport missing');
      launches.push({path:match[1],headless:true,transport:pipe});
    }
    if(line.includes('<launched>')){
      const match=line.match(/\bpw:browser\s+<launched>\s+pid=(\d+)(?:\s.*)?$/u);
      assert.ok(match&&Number(match[1])>0,'Unrecognized actual launched-process log');pids.push(Number(match[1]));
    }
  }
  assert.ok(launches.length>=2,'Both host projects require actual browser launch logs');
  assert.equal(pids.length,launches.length,'Missing or extra actual launch PID');
  assert.equal(new Set(pids).size,pids.length,'Duplicate actual launch PID');
  return {scope:'Actual DEBUG=pw:browser launch-command entries and PIDs; entry bytes separately hashed; not all browser/system libraries',
    browser,selectedExecutable:entry.selectedExecutable,actualLaunchCount:launches.length,launches:launches.map((value,index)=>({...value,pid:pids[index]}))};
}
