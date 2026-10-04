"""Independent read-only verification of author's frozen source-font local evidence."""
from pathlib import Path
import hashlib
import json
from PIL import Image

OUT = Path(__file__).resolve().parent
REPO = OUT.parents[3]
OWN = OUT.parent / 'source-font-visual'

def sha(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()

freeze_file = OWN / 'freeze-manifest.json'
freeze = json.loads(freeze_file.read_text())
assert freeze['glyphFontCertification'] is False
assert len(freeze['files']) == len({x['path'] for x in freeze['files']}) == 52
for item in freeze['files']:
    file = REPO / item['path']
    assert file.is_file() and not file.is_symlink()
    assert file.stat().st_size == item['bytes'] and sha(file) == item['sha256']
stage = (OWN / 'STAGE-FILES.txt').read_text().splitlines()
assert len(stage) == len(set(stage)) == 54
extra = {str((OWN / n).relative_to(REPO)) for n in ['freeze-manifest.json','STAGE-FILES.txt']}
assert set(stage) == {x['path'] for x in freeze['files']} | extra
actual_own = {str(f.relative_to(REPO)) for f in OWN.rglob('*') if f.is_file()}
assert set(stage) == actual_own | {'course-app/tests/unified/hsk1-source-font-visual.spec.ts'}

report_file = OWN / 'native-results.json'
raw = json.loads(report_file.read_text())
assert raw['stats']['expected'] == 2
assert all(raw['stats'][key] == 0 for key in ['skipped','unexpected','flaky'])
assert raw['errors'] == [] and raw['config']['workers'] == 1
specs = raw['suites'][0]['specs']
assert len(specs) == 2
for spec in specs:
    assert spec['ok'] and len(spec['tests']) == 1
    test = spec['tests'][0]
    assert test['projectName'] == 'chromium' and test['expectedStatus'] == 'passed' and test['status'] == 'expected'
    assert not test['annotations'] and len(test['results']) == 1
    result = test['results'][0]
    assert result['status'] == 'passed' and result['retry'] == 0 and result['errors'] == []

sources = []
fields = []
tables = []
for number in [3,6,7,12,13,14,15]:
    file = REPO / f'hsk1-app/content/source-activities/lesson-{number:02}.json'
    data = json.loads(file.read_text())
    sources.append({'path':str(file.relative_to(REPO)),'sha256':sha(file)})
    for activity in data['activities']:
        if number >= 12:
            for field in activity['fields']:
                if field.get('pinyin'):
                    fields.append({'lesson':number,'activityId':activity['id'],'activityVersion':activity['version'],'fieldId':field['id'],'label':field['label'],'pinyin':field['pinyin'],'source':field.get('source',activity['source'])})
        table = activity.get('table')
        if number < 12 and table and any(c['zh'] == c['vi'] == '' for c in table['columns']):
            assert not table.get('headerless')
            tables.append({'lesson':number,'activityId':activity['id'],'activityVersion':activity['version'],'source':activity['source'],'columns':table['columns'],'blankHeaderIndexes':[i for i,c in enumerate(table['columns']) if c['zh'] == c['vi'] == ''],'rowCount':len(table['rows']),'blankBodyCells':sum(not c.get('text') and not c.get('fieldId') for r in table['rows'] for c in r['cells'])})
assert len(fields) == 24 and len(tables) == 5
assert all(t['blankHeaderIndexes'] == [0] and t['blankBodyCells'] == 0 for t in tables)
assert len({f['activityId'] for f in fields}) == 12
expected_activity_ids = {f['activityId'] for f in fields} | {t['activityId'] for t in tables}
ledgers = sorted((OWN/'native-output').glob('*/source-font-evidence.json'))
assert len(ledgers) == 2
evidence = []
pngs = []
for file in ledgers:
    data = json.loads(file.read_text())
    width = data['viewport']['width']
    assert data['project'] == 'chromium' and data['glyphFontCertification'] is False
    assert data['fieldCount'] == 24 and data['tableCount'] == 5
    assert [{k:f[k] for k in fields[0]} for f in data['fields']] == fields
    assert [{k:t[k] for k in tables[0]} for t in data['tables']] == tables
    for field in data['fields']:
        box = field['box']
        assert box['width'] > 0 and box['height'] > 0
        assert box['clientWidth'] == 0 or box['scrollWidth'] <= box['clientWidth']+1
    for table in data['tables']:
        assert table['wrapper']['width'] > 0
    expected_pngs = {f'chromium-{width}-{name}.png' for name in expected_activity_ids}
    assert len(data['screenshots']) == len(set(data['screenshots'])) == 17
    assert set(data['screenshots']) == expected_pngs == {p.name for p in file.parent.glob('*.png')}
    for name in data['screenshots']:
        image = file.parent / name
        with Image.open(image) as im:
            assert im.format == 'PNG' and im.width > 0 and im.height > 0
            size = [im.width,im.height]
            im.verify()
        pngs.append({'path':str(image.relative_to(REPO)),'sha256':sha(image),'pixels':size})
    test = next(s['tests'][0] for s in specs if s['title'].endswith('at '+str(width)))
    result = test['results'][0]
    attachments = result['attachments']
    assert len(attachments) == 1 and attachments[0]['contentType'] == 'application/json'
    attachment = Path(attachments[0]['path'])
    assert attachment.read_bytes() == file.read_bytes()
    evidence.append({'width':width,'ledgerSHA256':sha(file),'attachedLedgerSHA256':sha(attachment),'fields':24,'tables':5,'pngs':17,'testDurationMs':result['duration']})
assert sorted(e['width'] for e in evidence) == [320,1440]
assert len(pngs) == 34

build_manifest_file = OUT.parent / 'flow-compat-review/frozen-repaired-build.json'
assert sha(build_manifest_file) == '9e348d9560ce27c49e70bc86e38d18f7952cad8da836967354325f2f19bfa20c'
build_manifest = json.loads(build_manifest_file.read_text())
build = Path(build_manifest['root'])
assert raw['config']['webServer']['env']['FLOW_DIST_DIR'] == str(build)
assert len(build_manifest['files']) == len({f['path'] for f in build_manifest['files']}) == 1717
assert {f['path'] for f in build_manifest['files']} == {str(f.relative_to(build)) for f in build.rglob('*') if f.is_file()}
for item in build_manifest['files']:
    file = build/item['path']
    assert file.stat().st_size == item['bytes'] and sha(file) == item['sha256']

result = {'status':'accepted-local-string-layout-evidence-only','fixtureSHA256':sha(REPO/'course-app/tests/unified/hsk1-source-font-visual.spec.ts'),'authorFreezeSHA256':sha(freeze_file),'frozenHashedFiles':52,'stagePathsExact':54,'rawReporterSHA256':sha(report_file),'actualStats':raw['stats'],'globalErrors':[],'retried':0,'typedLedgerEvidence':evidence,'currentSevenSourceInputs':sources,'expectedFields':fields,'expectedTables':tables,'actualPNGs':pngs,'frozenBuild':{'manifestSHA256':sha(build_manifest_file),'root':str(build),'files':1717,'allActualBytesAndSHAExact':True,'extraOrMissing':[]},'glyphFontCertification':False,'localVisualSampleRead':{'count':4,'finding':'Chinese and fullwidth punctuation visibly contain missing-glyph boxes; VI and Latin pinyin visible. This is not remote Noto certification.'},'limitations':['Local Chromium only; remote Chromium/WebKit 68 current PNGs still required.','Mobile original table PNGs show leftmost internally scrolled region, preserving blank first header; do not claim all horizontal columns visible in one mobile PNG.','Five tables contain no truly blank body cells; only empty headers and retained body topology are exercised.','24 field pinyin values are exact current runtime source strings; textbook provenance accepted separately.']}
(OUT/'local-review.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'freeze52':True,'stage54':True,'local2':True,'noSkipRetryFailure':True,'current24Pinyin5Tables':True,'actual34PNGs':True,'frozen1717BytesExact':True,'glyphFontCertification':False}))
