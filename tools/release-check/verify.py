"""Read-only deployment/source verification; never publishes or changes settings."""
import concurrent.futures,hashlib,json,os,pathlib,subprocess,time,urllib.request
OUT=pathlib.Path('release-evidence');OUT.mkdir(exist_ok=True)
c=json.loads(pathlib.Path('tools/release-check/config.json').read_text())
assert c['mode'] in ('preflight','live')
assert c['baseURL']=='https://nhiennhientran.github.io/hsk-hub/'
def save(name,data):(OUT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2))
def api(path):
    request=urllib.request.Request('https://api.github.com/repos/nhiennhientran/hsk-hub/'+path,headers={'Accept':'application/vnd.github+json','Authorization':'Bearer '+os.environ['GH_TOKEN'],'X-GitHub-Api-Version':'2022-11-28'})
    with urllib.request.urlopen(request,timeout=30) as response:return json.load(response)
settings=api('pages');save('pages-settings.json',settings)
production=api('git/ref/heads/gh-pages')['object']['sha'];save('production-ref.json',{'sha':production,'checkedAt':time.time()})
assert settings.get('source',{}).get('branch')=='gh-pages',settings
assert settings.get('source',{}).get('path')=='/',settings
assert settings['html_url'].rstrip('/')==c['baseURL'].rstrip('/'),settings
if c['mode']=='preflight':assert production==c['productionBefore'],(production,c['productionBefore'])
else:
    build=api('pages/builds/latest');save('pages-latest-build.json',build)
    assert build['status']=='built',build
    assert build['commit']==production,(build['commit'],production)
subprocess.run(['git','fetch','--no-tags','--depth=1','origin',c['candidate'],c['productionBefore'],production],check=True)
subprocess.run(['git','archive',c['productionBefore'],'-o',str(OUT/'production-before-source.zip')],check=True)
save('config-used.json',c)
if c['mode']=='live':
    subprocess.run(['git','diff','--exit-code',c['candidate'],production,'--','new-hsk1/hsk1'],check=True)
    paths=subprocess.check_output(['git','ls-tree','-r','--name-only',c['candidate'],'new-hsk1/hsk1/']).decode().splitlines()
    extensions={'.html','.js','.css','.json','.mp3','.png','.jpg','.jpeg','.svg','.webp','.ico'}
    paths=[p for p in paths if pathlib.Path(p).suffix.lower() in extensions and not any(part.startswith(('_','.')) for part in pathlib.Path(p).parts)]
    def fetch(path):
        expected=subprocess.check_output(['git','show',c['candidate']+':'+path]);expectedHash=hashlib.sha256(expected).hexdigest()
        url=c['baseURL']+path+'?releasecheck='+c['candidate']
        last=None
        for attempt in range(3):
            try:
                request=urllib.request.Request(url,headers={'Cache-Control':'no-cache','User-Agent':'HSK1-release-verification'})
                with urllib.request.urlopen(request,timeout=45) as response:
                    body=response.read();status=response.status
                actualHash=hashlib.sha256(body).hexdigest()
                return {'path':path,'status':status,'bytes':len(body),'expectedSHA256':expectedHash,'actualSHA256':actualHash,'matched':status==200 and actualHash==expectedHash}
            except Exception as exc:last=str(exc);time.sleep(2*(attempt+1))
        return {'path':path,'matched':False,'error':last}
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:rows=list(pool.map(fetch,paths))
    report={'candidate':c['candidate'],'production':production,'files':rows,'checked':len(rows),'matched':sum(x['matched'] for x in rows),'passed':all(x['matched'] for x in rows)}
    save('live-source-hashes.json',report)
    assert report['passed'],[x for x in rows if not x['matched']]
print(json.dumps({'mode':c['mode'],'production':production,'source':settings['source'],'passed':True}))
