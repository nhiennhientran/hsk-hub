from pathlib import Path
import hashlib,json,zipfile,subprocess,shutil,re
repo=Path('/workspace/scratch/28b55072841a/hsk-hub-resume'); out=repo/'course-app/docs/resume-20261004/qa-b10-adapter-ci/success-37237442946'
head='6eb41feb4d1aa555114440f20d23e3a415cd8ed0';tree='540403892a89ed764b735b11859cd372d7e9a479'
sha=lambda b:hashlib.sha256(b).hexdigest()
git=lambda args:subprocess.check_output(['git',*args],cwd=repo)
actualTree={}
for line in git(['ls-tree','-rz',head]).split(b'\0'):
    if not line:continue
    meta,name=line.split(b'\t',1);mode,kind,oid=meta.decode().split();actualTree[name.decode()]=(mode,oid)
cache={}; artifacts=[]; copied=[]; cases=[]; sourceVectors=[]; screenshotMap=[]
batch=subprocess.Popen(['git','cat-file','--batch'],cwd=repo,stdin=subprocess.PIPE,stdout=subprocess.PIPE)
def gitSHA(file):
    mode,oid=actualTree[file]
    if oid not in cache:
        batch.stdin.write((oid+'\n').encode());batch.stdin.flush();line=batch.stdout.readline();size=int(line.split()[2]);b=batch.stdout.read(size);assert len(b)==size;assert batch.stdout.read(1)==b'\n';cache[oid]=sha(b)
    return mode,cache[oid]
def stringify(value):return json.dumps(value,ensure_ascii=False,separators=(',',':')).encode()
for artifact in json.loads(Path('/workspace/scratch/28b55072841a/b10-host-artifact-files.json').read_text()):
    meta=artifact['artifact'];engine='chromium' if 'chromium' in meta['name'] else 'webkit'; archive=Path(artifact['localPath']);assert 'sha256:'+sha(archive.read_bytes())==meta['digest'];z=zipfile.ZipFile(archive);assert z.testzip() is None
    root=Path('/workspace/scratch/28b55072841a/b10-ci-success-input')/engine;prefix='course-app/.repro-output/b10-adapter-ci/'+engine+'/'
    before=json.loads((root/prefix/'before.json').read_text());after=json.loads((root/prefix/'after.json').read_text());built=json.loads((root/prefix/'builds.json').read_text())
    for document in [before,after,built]:
        assert document['checkoutCommit']==head and document['githubSHA']==head and document['checkoutTree']==tree
        assert str(document['runId'])=='37237442946' and str(document['runAttempt'])=='1' and document['browser']==engine
    assert after['actualNativeCases']==11 and after['status']=='accepted-native-checkpoint-not-release'
    for key,scopes in [('officialRuntimeSourceSnapshot','officialRuntimeScopes'),('extendedBuildAndFixtureSnapshot','extendedBuildAndFixtureScopes')]:
        snapshot=before[key];assert sha(stringify(snapshot['files']))==snapshot['sha256'];assert after[key+'SHA256']==snapshot['sha256']
        declared=set()
        for item in snapshot['files']:
            assert gitSHA(item['path'])==(item['mode'],item['sha256']);declared.add(item['path'])
        actual={file for file in actualTree if any(file==scope or file.startswith(scope+'/') for scope in before[scopes])}
        assert declared==actual,(len(declared),len(actual),sorted(declared^actual)[:5])
        sourceVectors.append({'engine':engine,'snapshot':key,'sha256':snapshot['sha256'],'files':len(snapshot['files']),'actualGitHeadModeAndSHAEquals':True})
    def check(ref):
        b=(root/ref['file']).read_bytes();assert sha(b)==ref['sha256'] and len(b)==ref['bytes'];return b
    check(after['buildManifest']);unitCounts={}
    assert len(after['commands'])==18
    for command in after['commands']:
        value=json.loads(check(command));assert value['exitCode']==0 and value['signal'] is None and value['spawnError'] is None
        log=check(command['log']).decode()
        if command['label'].endswith('-units'):
            counts=re.findall(r'(?:#|ℹ)\s*tests\s+(\d+)',log);assert counts;unitCounts[command['label']]=int(counts[-1])
            assert not re.search(r'(?:#|ℹ)\s*(?:fail|cancelled|skipped|todo)\s+[1-9]\d*',log)
    buildFiles={}
    for build in built['builds']:
        assert len(build['files'])==build['fileCount'] and sha(stringify(build['files']))==build['inventorySHA256']
        for ref in build['files']:buildFiles[ref['file']]=ref
    downloaded=0
    for name in z.namelist():
        if name in buildFiles:check(buildFiles[name]);downloaded+=1
        if name.startswith(prefix):
            target=out/engine/name[len(prefix):];target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(root/name,target);copied.append({'file':str(target.relative_to(repo)),'bytes':target.stat().st_size,'sha256':sha(target.read_bytes()),'originalZIPEntry':name})
            if name.endswith('.png'):screenshotMap.append(copied[-1])
        elif name.endswith('native-ci-receipt-first.png') or name.endswith('native-ci-archive.png'):
            target=out/engine/'author-screenshots'/Path(name).name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(root/name,target);copied.append({'file':str(target.relative_to(repo)),'bytes':target.stat().st_size,'sha256':sha(target.read_bytes()),'originalZIPEntry':name});screenshotMap.append(copied[-1])
    assert len(built['hsk23RawCompiledSourceBytes'])==36
    for raw in built['hsk23RawCompiledSourceBytes']:
        assert gitSHA(raw['file'])[1]==raw['sha256'];check(raw['compiledChunk']);assert raw['decodedBytesEqual'] is True
    for ref in after['native']:check(ref['report']);cases.append({'engine':engine,'app':ref['app'],'actualPassed':ref['passed'],'expected':ref['expectedCount']})
    artifacts.append({'engine':engine,'id':meta['id'],'archiveSHA256':sha(archive.read_bytes()),'archiveBytes':archive.stat().st_size,'entries':len(z.namelist()),'CRCValid':True,'downloadedBuiltConsumerFilesActuallyRehashed':downloaded,'fullBuildVectorsDeclared':[{'folder':b['folder'],'files':b['fileCount'],'sha256':b['inventorySHA256']} for b in built['builds']],'unitCounts':unitCounts,'compiledRawFiles':36,'nativeConsumerModes':built['nativeConsumerModes']})
batch.stdin.close();batch.stdout.close();batch.wait()
review={'schemaVersion':1,'reviewer':'root','status':'accepted-private-two-engine-22-native-adapter-checkpoint-not-C15','runId':37237442946,'runURL':'https://github.com/nhiennhientran/hsk-hub/actions/runs/37237442946','testedRemoteCommit':head,'testedGitTree':tree,'actualRemoteGitObjectLocallyVerified':True,'actualNativeCases':22,'retry':0,'skip':0,'flaky':0,'errors':0,'cases':cases,'sourceVectors':sourceVectors,'artifacts':artifacts,'files':copied,'actualOriginalPNGs':len(screenshotMap),'screenshotManualVisualReview':'pending actual image views; pass reports are not a visual/layout certificate','sourceRegistriesActive':0,'officialVIFieldsAtThisCI':0,'publicationApproved':False,'deployed':False,'scopeLimits':['H1 auth-free source-dev history harness plus separate immutable build; not production H1 entry certificate','H2/3 actual compiled preview history fixtures','Full native-tested dist file vectors recorded in CI; only listed downloaded HTML/JS/CSS/JSON consumers were locally rehashed','No full-site official Vietnamese semantic acceptance; current 136-field proposal is still private','Known B14 narrow-layout followups and exact-final C15 pending']}
(out/'root-acceptance.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n');(out/'original-png-map.json').write_text(json.dumps(screenshotMap,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'acceptedActualNativeCases':22,'originalPNGs':len(screenshotMap),'preservedProofFiles':len(copied),'verifiedGitBlobs':len(cache),'artifacts':artifacts},ensure_ascii=False))
